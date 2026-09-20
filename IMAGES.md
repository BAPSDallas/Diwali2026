# Replace event photos

Both pages load the same four files. No HTML or JavaScript editing is needed.

| File in `assets/events/` | Appears on |
| --- | --- |
| `dallas.png` | Dallas Diwali & Annakut, on both pages |
| `frisco.png` | Frisco Diwali & Annakut, on both pages |
| `chopda-pujan.png` | Chopda Pujan, shared by morning and evening |
| `kids-diwali.png` | Kids Diwali Celebration |

## Update directly on GitHub

1. Open https://github.com/BAPSDallas/Diwali2026/tree/main/assets/events
2. Export your photos as PNG and give them the exact lowercase filenames above. Do not merely rename a JPG extension to PNG.
3. Choose **Add file → Upload files**, upload the replacements, and commit to `main`.
4. Wait for GitHub Pages to finish deploying, then refresh the page. If an old photo persists, refresh without cache or try a private browser window.

The QR codes stay the same. Both pages pick up each deployed replacement automatically.

## Update locally

Replace the files in this project's `assets/events` folder. Refresh the local preview to see them. Commit and push the updated files to publish them; replacing local files alone does not change the live site.

## Photo framing

Use photos at least 1200 pixels wide when possible and keep the important subject near the centre. Both pages crop automatically with `object-fit: cover`, so avoid putting important faces or text near an edge.

**Any resolution and any shape works.** The panels are a fixed size and the photo is
scaled to fill them with `object-fit: cover`, so nothing is stretched, letterboxed or
able to shift the layout. Tested from 120 x 80 up to 4000 x 1000 and 800 x 2400.

What you control is the *crop*, because the two panels are very different shapes:

| Page | Photo slot | Measured on an iPhone 17 Pro | Effect |
| --- | --- | --- | --- |
| `add-calendar.html` | Tall panel down the left of each card | 76 x 126, taller than wide | A landscape photo is cropped hard on the left and right; only the middle third survives |
| `diwali-only.html` | Wide banner across the top of each card | 378 x 118, about 3.2:1 | A landscape photo is cropped top and bottom; roughly the middle half survives |

So: **keep the subject centred in the frame** and leave room around it. A face near an
edge will be cut on one page or the other. Aim for under 1 MB per file for mobile
loading.

A small "Included" or "Optional" chip sits over the top-left corner of every photo, so leave that corner free of important detail.

For precise crop adjustments, `object-position` can be customized in CSS later. The included files are decorative placeholders until real photos are provided.
