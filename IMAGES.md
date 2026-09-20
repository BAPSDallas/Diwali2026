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

Use photos at least 1200 pixels wide when possible and keep the important subject near the center. The two-event page uses wide photo panels; the full page uses narrow vertical panels. Both crop automatically to fill their space, so avoid putting important text or faces near the edges. Aim for under 1 MB per file for mobile loading.

For precise crop adjustments, `object-position` can be customized in CSS later. The included files are decorative placeholders until real photos are provided.
