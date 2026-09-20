#!/usr/bin/env python3
"""Generate a vector firework burst.

A burst cropped from a photograph is heavy and muddy at small sizes; generated
vector is a few KB, crisp at any density, and its palette can be tuned to the
surface it sits on. The seed is fixed so the burst renders identically on every
build while still looking organic.

Adapt the geometry and palette for other decorative marks — the technique
(randomised rays with per-ray opacity, embers past the tips, a soft core) is the
reusable part.

Usage: python3 make_fireworks_svg.py out.svg [seed]
"""
import math
import random
import sys

W = 400
CX = CY = 200


def rays(n, cx, cy, r_in, r_out, jitter, widths, dot_chance, cls, lo=0.45):
    out = []
    for i in range(n):
        angle = (2 * math.pi * i / n) + random.uniform(-jitter, jitter)
        length = r_out * random.uniform(lo, 1.0)
        x1, y1 = cx + r_in * math.cos(angle), cy + r_in * math.sin(angle)
        x2, y2 = cx + length * math.cos(angle), cy + length * math.sin(angle)
        out.append(
            f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke-width="{random.uniform(*widths):.2f}" '
            f'opacity="{random.uniform(.45, 1.0):.2f}" class="{cls}"/>')
        if random.random() < dot_chance:
            throw = length + random.uniform(3, 14)
            out.append(
                f'<circle cx="{cx + throw * math.cos(angle):.1f}" '
                f'cy="{cy + throw * math.sin(angle):.1f}" '
                f'r="{random.uniform(1.3, 3.2):.1f}" '
                f'opacity="{random.uniform(.5, .95):.2f}" class="d"/>')
    return out


def build(seed=11102026):
    random.seed(seed)
    parts = rays(52, CX, CY, 14, 182, .045, (0.9, 2.5), .8, 'r')
    parts += rays(20, 292, 112, 7, 68, .07, (0.7, 1.6), .65, 'r2', lo=.5)
    for _ in range(30):
        angle, dist = random.uniform(0, 2 * math.pi), random.uniform(110, 210)
        parts.append(
            f'<circle cx="{CX + dist * math.cos(angle):.1f}" '
            f'cy="{CY + dist * math.sin(angle):.1f}" '
            f'r="{random.uniform(.8, 2.1):.1f}" '
            f'opacity="{random.uniform(.25, .7):.2f}" class="e"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {W}" width="{W}" height="{W}">
<defs>
<radialGradient id="ray" gradientUnits="userSpaceOnUse" cx="{CX}" cy="{CY}" r="192">
<stop offset="0" stop-color="#fff2cf" stop-opacity=".15"/>
<stop offset=".26" stop-color="#ffc247" stop-opacity=".95"/>
<stop offset=".7" stop-color="#ee8b20" stop-opacity=".78"/>
<stop offset="1" stop-color="#c9511a" stop-opacity="0"/>
</radialGradient>
<radialGradient id="ray2" gradientUnits="userSpaceOnUse" cx="292" cy="112" r="74">
<stop offset="0" stop-color="#fff6e0" stop-opacity=".3"/>
<stop offset=".4" stop-color="#ffd166" stop-opacity=".75"/>
<stop offset="1" stop-color="#e07a1c" stop-opacity="0"/>
</radialGradient>
<radialGradient id="core" gradientUnits="userSpaceOnUse" cx="{CX}" cy="{CY}" r="115">
<stop offset="0" stop-color="#fff5da" stop-opacity=".45"/>
<stop offset=".45" stop-color="#ffbf4a" stop-opacity=".14"/>
<stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/>
</radialGradient>
<style>
.r{{stroke:url(#ray);stroke-linecap:round;fill:none}}
.r2{{stroke:url(#ray2);stroke-linecap:round;fill:none}}
.d{{fill:#ffd873}}.e{{fill:#ffc75c}}
</style>
</defs>
<circle cx="{CX}" cy="{CY}" r="115" fill="url(#core)"/>
{chr(10).join(parts)}
</svg>
'''


if __name__ == '__main__':
    out = sys.argv[1] if sys.argv[1:] else 'fireworks.svg'
    seed = int(sys.argv[2]) if len(sys.argv) > 2 else 11102026
    svg = build(seed)
    open(out, 'w').write(svg)
    print(f'{out}  {len(svg)} bytes')
