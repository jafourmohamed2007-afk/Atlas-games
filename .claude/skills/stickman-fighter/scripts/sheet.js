// Contact sheet of the DEMO run (wall-clock seconds, effects hidden).  node sheet.js <page.html> <seed> <t0> <t1> <step> <out.png>
// Look at it with the Read tool: limbs must touch the body at hit frames, bodies must not overlap, poses must read.
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const { execSync } = require('child_process');
(async () => {
  const [pg, sd, t0, t1, st, out] = process.argv.slice(2); const dir = fs.mkdtempSync('/tmp/sheet-');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 360, height: 360 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(pg) + '?capture&nofx&seed=' + sd);
  await p.addStyleTag({ content: '.ui,.hint{display:none}' });
  await p.evaluate(() => __lab.move('demo'));
  let t = 0, n = 0;
  for (let T = +t0; T <= +t1 + 1e-6; T += +st) {
    const k = Math.round((T - t) * 60); await p.evaluate(k => { for (let i = 0; i < k; i++) __lab.advance(1 / 60); __lab.render(); }, k); t += k / 60;
    await p.screenshot({ path: `${dir}/${String(n++).padStart(3, '0')}.png` });
  }
  console.log(await p.evaluate(() => __lab.log.join(' | ')));
  await b.close();
  const cols = Math.min(6, n); execSync(`ffmpeg -y -loglevel error -i ${dir}/%03d.png -vf "drawtext=text='%{n}':x=5:y=5:fontsize=18:fontcolor=red,tile=${cols}x${Math.ceil(n / cols)}" -frames:v 1 ${out}`);
})();
