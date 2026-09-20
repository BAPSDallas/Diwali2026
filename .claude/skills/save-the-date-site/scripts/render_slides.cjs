/**
 * Render the slide template to PNG at 16:9.
 *
 * Captures pageerror, which matters more than it sounds: a single exception in
 * the template script renders a slide with background and empty boxes, and that
 * looks exactly like a CSS problem. (`const top` shadowing window.top cost an
 * hour once.)
 *
 *   node render_slides.cjs http://127.0.0.1:8765/slide-template.html ./out \
 *     all:All_Events_Slide.png diwali:Diwali_Only_Slide.png
 */
const { chromium } = require('playwright');

(async () => {
  const [url, outDir, ...jobs] = process.argv.slice(2);
  if (!url || !outDir || !jobs.length) {
    console.error('usage: node render_slides.cjs <template-url> <out-dir> <variant:file.png ...>');
    process.exit(1);
  }
  const browser = await chromium.launch();
  let failed = false;
  for (const job of jobs) {
    const [variant, file] = job.split(':');
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
    const problems = [];
    page.on('pageerror', e => problems.push('JS: ' + e.message));
    page.on('response', r => { if (!r.ok()) problems.push(`${r.status()} ${r.url().split('/').pop()}`); });
    await page.goto(`${url}?v=${variant}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - 1080);
    if (overflow > 0) problems.push(`content overflows by ${overflow}px`);
    await page.screenshot({ path: `${outDir}/${file}` });
    console.log(`${file.padEnd(38)} ${problems.length ? 'PROBLEMS: ' + problems.join('; ') : 'ok'}`);
    if (problems.length) failed = true;
    await page.close();
  }
  await browser.close();
  console.log('\nNow decode the QR out of each rendered slide before shipping.');
  process.exit(failed ? 1 : 0);
})();
