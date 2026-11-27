// Frame-exact 60 fps video of the DEMO run.  node render.js <page.html> <out.mp4> [seconds=27] [seed=3]
// Every frame is simulated with dt = 1/60 and screenshotted, so the video never drops frames.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
(async () => {
  const pg = path.resolve(process.argv[2]), out = process.argv[3], secs = +process.argv[4] || 27, sd = process.argv[5] || 3;
  const dir = fs.mkdtempSync('/tmp/render-'); const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 540, height: 720 }, deviceScaleFactor: 1.5 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + pg + '?capture&seed=' + sd);
  await p.evaluate(() => { __lab.advance(0.4); __lab.auto(); });
  for (let i = 0; i < secs * 60; i++) { await p.evaluate(() => { __lab.advance(1 / 60); __lab.render(); }); await p.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.png` }); }
  await b.close();
  execSync(`ffmpeg -y -loglevel error -framerate 60 -i ${dir}/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -r 60 -vf scale=810:1080 ${out}`);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('wrote', out, errs.length ? 'ERRORS ' + errs.join(' ; ') : 'no page errors');
})();
