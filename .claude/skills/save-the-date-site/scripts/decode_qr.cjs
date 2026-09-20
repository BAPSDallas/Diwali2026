/**
 * Decode QR codes out of PNG files.
 *
 * Run this twice: on the source QR to confirm what it encodes, and on the
 * finished slide, because scaling a QR into a layout can break module
 * alignment and produce a code that looks right and does not scan.
 *
 * Needs playwright and a local static server on the files' directory.
 *   node decode_qr.cjs http://127.0.0.1:8765 slide-a.png slide-b.png
 */
const { chromium } = require('playwright');

(async () => {
  const [base, ...files] = process.argv.slice(2);
  if (!base || !files.length) {
    console.error('usage: node decode_qr.cjs <base-url> <file.png ...>');
    process.exit(1);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // Any page on the same origin will do, as long as it does not redirect —
  // a meta-refresh destroys the execution context before addScriptTag lands.
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js' });

  let failed = false;
  for (const file of files) {
    const result = await page.evaluate(async file => {
      const img = new Image();
      img.src = '/' + file;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      return { size: `${img.width}x${img.height}`, url: code && code.data };
    }, file);
    console.log(`${file.padEnd(38)} ${result.size.padEnd(11)} -> ${result.url || 'DECODE FAILED'}`);
    if (!result.url) failed = true;
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
