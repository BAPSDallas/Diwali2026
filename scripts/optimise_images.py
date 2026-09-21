#!/usr/bin/env python3
"""Derive correctly-sized, high-quality variants from the full-size masters.

Run this after replacing ANY file listed in assets/images.json:

    python3 scripts/optimise_images.py

The masters are never modified, and nothing here trades away visible quality.
The saving comes from not shipping pixels that can never be drawn: a 2248x1416
photo placed in a 76x126 CSS px panel sends roughly 37x more pixels than even a
3x screen can show, and the browser discards the rest after paying to download
them. Variants are encoded at quality 90, which is visually lossless at the
sizes these are actually displayed.

`--check` reports whether every derivative is current without writing anything.
A test runs it, so a replaced master cannot ship without its variants.
"""
import base64
import hashlib
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageFilter

# Widths come from measured layout, not guesswork. Two constraints set the floor:
# the narrow card panel needs ~228px across but ~377px down after the cover-crop,
# and srcset selection only ever looks at the element's WIDTH. A variant narrower
# than ~600px would therefore be chosen on a 2x phone and then be upscaled
# vertically to fill the panel, which is visibly soft. 640 is the safe floor.
PHOTO_WIDTHS = (640, 1024, 1600)
QUALITY = 90
LOGO_PX = 360          # drawn at most 88 CSS px tall, so 360 covers 3x with room
LQIP_WIDTH = 20

START = "<!-- photo-widths:start -->"
END = "<!-- photo-widths:end -->"

WEBP = {"quality": QUALITY, "method": 6}
JPEG = {"quality": QUALITY, "optimize": True, "progressive": True, "subsampling": 0}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def flatten(image: Image.Image) -> Image.Image:
    """Drop an alpha channel that carries no transparency — it is dead weight."""
    if image.mode == "RGBA" and image.getchannel("A").getextrema()[0] == 255:
        return image.convert("RGB")
    return image


def widths_for(image: Image.Image) -> list[int]:
    """Never upscale: a variant wider than the master would add bytes and no
       detail. When the master falls between two steps, its own width is offered
       as the top variant so the banner layout still gets every real pixel."""
    widths = [w for w in PHOTO_WIDTHS if w <= image.width]
    if image.width > (widths[-1] if widths else 0) and image.width < max(PHOTO_WIDTHS):
        widths.append(image.width)
    return widths or [image.width]


def photo_variants(master: Path) -> tuple[list[Path], list[int]]:
    image = flatten(Image.open(master))
    widths = widths_for(image)
    written = []
    for width in widths:
        height = round(image.height * width / image.width)
        resized = image.resize((width, height), Image.LANCZOS).convert("RGB")
        for suffix, fmt, params in (("webp", "WEBP", WEBP), ("jpg", "JPEG", JPEG)):
            target = master.with_name(f"{master.stem}-{width}.{suffix}")
            resized.save(target, fmt, **params)
            written.append(target)
    return written, widths


def background_variants(master: Path) -> list[Path]:
    """Format change only. On a tall phone this layer is already upscaled, so
       resizing it would soften something the visitor can actually see."""
    image = Image.open(master).convert("RGB")
    written = []
    for suffix, fmt, params in (("webp", "WEBP", WEBP), ("jpg", "JPEG", JPEG)):
        target = master.with_suffix("." + suffix)
        image.save(target, fmt, **params)
        written.append(target)
    return written


def logo_variants(master: Path) -> list[Path]:
    """The logo has real transparency, so both outputs keep an alpha channel."""
    image = Image.open(master).resize((LOGO_PX, LOGO_PX), Image.LANCZOS)
    written = []
    for suffix, fmt, params in (("webp", "WEBP", {**WEBP, "quality": 92, "exact": True}),
                                ("png", "PNG", {"optimize": True})):
        target = master.with_name(f"diwali-logo-{LOGO_PX}.{suffix}")
        image.save(target, fmt, **params)
        written.append(target)
    return written


def lqip(master: Path) -> str:
    """A ~20px blurred preview, small enough to inline so it costs no request."""
    image = Image.open(master).convert("RGB")
    height = max(1, round(image.height * LQIP_WIDTH / image.width))
    tiny = image.resize((LQIP_WIDTH, height), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1))
    buffer = io.BytesIO()
    tiny.save(buffer, "JPEG", quality=40)
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def expected_outputs(root: Path, manifest: dict) -> dict:
    """Every derivative filename this manifest implies, without writing anything."""
    out = {}
    assets = root / "assets"
    for event_id, rel in manifest["photos"].items():
        master = assets / rel
        widths = widths_for(Image.open(master))
        out[rel] = [f"{master.stem}-{w}.{s}" for w in widths for s in ("webp", "jpg")]
    out[manifest["background"]] = ["festival-background.webp", "festival-background.jpg"]
    out[manifest["logo"]] = [f"diwali-logo-{LOGO_PX}.webp", f"diwali-logo-{LOGO_PX}.png"]
    return out


def check(root: Path, manifest: dict) -> list[str]:
    assets = root / "assets"
    record_path = assets / "derivatives.json"
    if not record_path.exists():
        return ["assets/derivatives.json is missing"]
    record = json.loads(record_path.read_text())
    problems = []
    for rel, names in expected_outputs(root, manifest).items():
        master = assets / rel
        if not master.exists():
            problems.append(f"{rel} is listed in images.json but missing on disk")
            continue
        if record.get(rel, {}).get("sha") != digest(master):
            problems.append(f"{rel} has changed since the variants were built")
        for name in names:
            if not (master.parent / name).exists():
                problems.append(f"{rel} -> {name} is missing")
    if not (root / "lqip.css").exists():
        problems.append("lqip.css is missing")
    return problems


def build(root: Path, manifest: dict) -> None:
    assets = root / "assets"
    record, placeholders = {}, {}

    available = {}
    for event_id, rel in manifest["photos"].items():
        master = assets / rel
        written, widths = photo_variants(master)
        placeholders[event_id] = lqip(master)
        available[event_id] = widths
        record[rel] = {"sha": digest(master), "outputs": [p.name for p in written]}
        report(master, written)

    for rel, builder in ((manifest["background"], background_variants),
                         (manifest["logo"], logo_variants)):
        master = assets / rel
        written = builder(master)
        record[rel] = {"sha": digest(master), "outputs": [p.name for p in written]}
        report(master, written)

    css = ["/* Generated by scripts/optimise_images.py — do not edit by hand.",
           "   A ~20px blurred preview per photo, inlined so it costs no request and",
           "   paints with the stylesheet. The real photo covers it on arrival, so a",
           "   slow connection shows the card's colours at once, not an empty panel. */"]
    for event_id, data in placeholders.items():
        css.append(f".event-photo.{event_id} "
                   f"{{ background-image: url(data:image/jpeg;base64,{data}); }}")
    (root / "lqip.css").write_text("\n".join(css) + "\n")
    (assets / "derivatives.json").write_text(json.dumps(record, indent=2) + "\n")
    write_widths(root, available)
    print(f"\nlqip.css  {(root / 'lqip.css').stat().st_size / 1024:.1f} KB"
          f"  ({len(placeholders)} placeholders)")
    print("assets/derivatives.json updated")


def write_widths(root: Path, available: dict) -> None:
    """Inline the per-photo width list into each page.

    The page has to advertise only the variants that exist, and each master has
    a different ceiling. Inlining avoids an extra request, which matters most on
    exactly the slow connection this whole exercise is for. Delimited so it can
    be rewritten safely on every run.
    """
    payload = json.dumps({k: v for k, v in sorted(available.items())}, separators=(",", ":"))
    block = (f"{START}\n  <script>window.PHOTO_WIDTHS={payload};</script>\n  {END}")
    for page in sorted(root.glob("*.html")):
        text = page.read_text()
        if START not in text:
            continue
        head, _, rest = text.partition(START)
        _, _, tail = rest.partition(END)
        page.write_text(head + block + tail)
        print(f"{page.name}: photo widths inlined")


def report(master: Path, written: list[Path]) -> None:
    before = master.stat().st_size / 1024
    print(f"\n{master.name}  ({before:.0f} KB master)")
    for path in written:
        print(f"   {path.name:34} {path.stat().st_size / 1024:6.0f} KB")


def main(argv: list[str]) -> int:
    root = Path(__file__).resolve().parent.parent
    manifest = json.loads((root / "assets" / "images.json").read_text())
    if "--check" in argv:
        problems = check(root, manifest)
        for problem in problems:
            print(f"stale: {problem}")
        if problems:
            print("\nRun: python3 scripts/optimise_images.py")
        return 1 if problems else 0
    build(root, manifest)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
