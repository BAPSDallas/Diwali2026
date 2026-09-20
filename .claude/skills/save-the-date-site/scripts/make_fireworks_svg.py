#!/usr/bin/env python3
"""Generate a chrysanthemum firework burst as SVG.

A burst cropped from a photograph is heavy and muddy at small sizes; generated
vector is a few KB and crisp at any density.

The thing that separates a firework from a sunburst is the filaments: many fine
strands that curve slightly, start at varying radii so they do not all converge
on one point, taper along their length, and end in a bright bulb. Straight
uniform lines radiating from a single centre read as sun rays every time.

Usage: python3 make_fireworks_svg.py out.svg [seed]
"""
import math
import random
import sys

W = 400
CX = CY = 200


def filaments(count, cx, cy, r_out, curl, widths, layer, tip_scale=1.8, lo=0.35):
    """One shell of curving strands with bright bulbs at their tips."""
    out = []
    for _ in range(count):
        angle = random.uniform(0, 2 * math.pi)
        length = r_out * random.uniform(lo, 1.0)
        # Varying start radius keeps the centre from collapsing to a single point.
        start = random.uniform(4, 22) * (length / r_out)
        bend = random.uniform(-curl, curl)
        x0, y0 = cx + start * math.cos(angle), cy + start * math.sin(angle)
        x2, y2 = cx + length * math.cos(angle), cy + length * math.sin(angle)
        # Control point pushed off-axis so the strand arcs instead of running straight.
        mid = (start + length) * 0.55
        ca = angle + bend
        x1, y1 = cx + mid * math.cos(ca), cy + mid * math.sin(ca)
        width = random.uniform(*widths)
        opacity = random.uniform(.35, 1.0)
        out.append(
            f'<path d="M{x0:.1f} {y0:.1f}Q{x1:.1f} {y1:.1f} {x2:.1f} {y2:.1f}" '
            f'stroke-width="{width:.2f}" opacity="{opacity:.2f}" class="{layer}"/>')
        # The bulb at the tip is what makes it read as a spark rather than a line.
        out.append(
            f'<circle cx="{x2:.1f}" cy="{y2:.1f}" r="{width * tip_scale:.2f}" '
            f'opacity="{min(1.0, opacity * 1.15):.2f}" class="{layer}-t"/>')
    return out


def build(seed=11102026):
    random.seed(seed)
    parts = []
    # Three shells at different reaches give the burst depth rather than a flat ring.
    parts += filaments(150, CX, CY, 186, .30, (0.55, 1.5), 'a')
    parts += filaments(90, CX, CY, 132, .40, (0.5, 1.2), 'b', tip_scale=2.0, lo=.45)
    parts += filaments(46, 292, 108, 74, .45, (0.4, 1.0), 'b', tip_scale=2.1, lo=.5)
    # Embers drifting away from the shells.
    for _ in range(46):
        angle, dist = random.uniform(0, 2 * math.pi), random.uniform(120, 215)
        parts.append(
            f'<circle cx="{CX + dist * math.cos(angle):.1f}" '
            f'cy="{CY + dist * math.sin(angle):.1f}" '
            f'r="{random.uniform(.7, 2.0):.2f}" '
            f'opacity="{random.uniform(.2, .75):.2f}" class="e"/>')
    random.shuffle(parts)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {W}" width="{W}" height="{W}">
<defs>
<radialGradient id="ga" gradientUnits="userSpaceOnUse" cx="{CX}" cy="{CY}" r="190">
<stop offset="0" stop-color="#fff6de" stop-opacity=".25"/>
<stop offset=".2" stop-color="#ffd275" stop-opacity=".95"/>
<stop offset=".62" stop-color="#f2971f" stop-opacity=".85"/>
<stop offset=".9" stop-color="#d4571a" stop-opacity=".35"/>
<stop offset="1" stop-color="#c0400f" stop-opacity="0"/>
</radialGradient>
<radialGradient id="gb" gradientUnits="userSpaceOnUse" cx="{CX}" cy="{CY}" r="140">
<stop offset="0" stop-color="#fffaea" stop-opacity=".4"/>
<stop offset=".35" stop-color="#ffe09a" stop-opacity=".9"/>
<stop offset="1" stop-color="#f08d1c" stop-opacity=".1"/>
</radialGradient>
<radialGradient id="core" gradientUnits="userSpaceOnUse" cx="{CX}" cy="{CY}" r="96">
<stop offset="0" stop-color="#fff8e4" stop-opacity=".5"/>
<stop offset=".4" stop-color="#ffc85c" stop-opacity=".16"/>
<stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/>
</radialGradient>
<style>
.a{{stroke:url(#ga);fill:none;stroke-linecap:round}}
.b{{stroke:url(#gb);fill:none;stroke-linecap:round}}
.a-t{{fill:#ffdc8a}}.b-t{{fill:#fff0c6}}.e{{fill:#ffc75c}}
</style>
</defs>
<circle cx="{CX}" cy="{CY}" r="96" fill="url(#core)"/>
{chr(10).join(parts)}
</svg>
'''


if __name__ == '__main__':
    out = sys.argv[1] if sys.argv[1:] else 'fireworks.svg'
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 11102026
    svg = build(seed)
    open(out, 'w').write(svg)
    print(f'{out}  {len(svg)} bytes')
