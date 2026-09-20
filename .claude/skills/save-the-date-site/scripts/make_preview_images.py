#!/usr/bin/env python3
"""Derive 1200x630 link-card images from event photos.

Link previews want 1.91:1 and a small payload; several scrapers cap fetch size
or time out, so pointing og:image at a multi-megabyte source photo works in
iMessage and fails elsewhere. Scales to cover, then centre-crops.

macOS only (uses sips). On Linux, swap in ImageMagick:
    convert SRC -resize 1200x630^ -gravity center -extent 1200x630 -quality 82 OUT

Usage:
    python3 make_preview_images.py src.png:out.jpg [src2.png:out2.jpg ...]
"""
import os
import subprocess
import sys

TARGET_W, TARGET_H = 1200, 630


def dimensions(path):
    out = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path],
                         check=True, capture_output=True, text=True).stdout
    values = {k.strip(): int(v) for k, v in
              (line.split(':') for line in out.splitlines() if ':' in line and 'pixel' in line)}
    return values['pixelWidth'], values['pixelHeight']


def build(src, out, quality=82):
    width, height = dimensions(src)
    # Bind on whichever axis leaves the other overflowing, so the crop fills.
    resize = ['--resampleHeight', str(TARGET_H)] if width / height > TARGET_W / TARGET_H \
        else ['--resampleWidth', str(TARGET_W)]
    subprocess.run(['sips', *resize, '-s', 'format', 'jpeg',
                    '-s', 'formatOptions', str(quality), src, '--out', out],
                   check=True, capture_output=True)
    subprocess.run(['sips', '-c', str(TARGET_H), str(TARGET_W), out],
                   check=True, capture_output=True)
    print(f'{out}  {os.path.getsize(out) // 1024} KB  {TARGET_W}x{TARGET_H}')


if __name__ == '__main__':
    if not sys.argv[1:]:
        sys.exit(__doc__)
    for pair in sys.argv[1:]:
        build(*pair.split(':', 1))
    print('\nCheck each crop by eye — a centre crop can decapitate the subject.')
