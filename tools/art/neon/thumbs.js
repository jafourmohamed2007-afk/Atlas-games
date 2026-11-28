#!/usr/bin/env node
/* Neon Overdrive thumbnails from real gameplay (a simple bot plays, offline mode):
   thumbs/neon-overdrive.webp (512²), thumbs/neon-overdrive-play.webp (12 frames × 240², preview strip),
   thumbs/neon-overdrive-og.jpg (1200×630). Needs ImageMagick `convert`. Usage: node tools/art/neon/thumbs.js */
'use strict';
const path = require('path'), fs = require('fs'), http = require('http'), os = require('os'), { execFileSync } = require('child_process'), { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'neon-thumbs-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : f.endsWith('.mp3') ? 'audio/mpeg' : 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });

async function session(b, vw, vh, wave) {
  const p = await b.newPage({ viewport: { width: vw, height: vh } });
  await p.goto('http://127.0.0.1:' + srv.address().port + '/games/neon-overdrive.html?test'); await sleep(300);
  const ui = (await p.evaluate(() => window.__neon.s())).ui; const by = ui.find((u) => u.id === 'bypass'); await p.mouse.click(by.x, by.y); await sleep(150);
  await p.keyboard.press('Enter'); await sleep(200);
  await p.evaluate((w) => { const N = window.__neon; N.god(); if (w > 1) N.wave(w); N.speed(1); }, wave);
  await p.mouse.down();
  const step = async () => { // aim at the nearest enemy, strafe
    const en = await p.evaluate(() => window.__neon.scr()); let best = null, bd = 1e9;
    en.forEach((e) => { const d = Math.hypot(e.x - vw / 2, e.y - vh / 2); if (d < bd) { bd = d; best = e; } });
    if (best) await p.mouse.move(best.x, best.y);
    const s = await p.evaluate(() => window.__neon.s()); if (s.screen === 'upgrade') { await p.mouse.up(); await sleep(400); await p.keyboard.press('Digit1'); await p.mouse.down(); }
    return en.length;
  };
  return { p, step };
}
(async () => {
  await new Promise((r) => srv.listen(0, r));
  const b = await chromium.launch();
  // card + og: busy late-wave fights
  for (const [name, vw, vh, wave] of [['card', 640, 640, 7], ['og', 1200, 630, 5]]) {
    const { p, step } = await session(b, vw, vh, wave); let best = 0;
    for (let i = 0; i < 140; i++) { const n = await step(); if (n > best && i > 30) { best = n; await p.screenshot({ path: path.join(TMP, name + '.png') }); } await sleep(60); }
    await p.close();
  }
  // preview strip: 12 frames
  const { p, step } = await session(b, 360, 360, 4);
  for (let i = 0; i < 40; i++) { await step(); await sleep(60); }
  for (let f = 0; f < 12; f++) { for (let i = 0; i < 6; i++) { await step(); await sleep(50); } await p.screenshot({ path: path.join(TMP, 'f' + String(f).padStart(2, '0') + '.png') }); }
  await b.close(); srv.close();
  const T = (n) => path.join(ROOT, 'thumbs', n), im = (args) => execFileSync('convert', args);
  im([path.join(TMP, 'card.png'), '-resize', '512x512', '-quality', '82', T('neon-overdrive.webp')]);
  im([path.join(TMP, 'og.png'), '-quality', '84', T('neon-overdrive-og.jpg')]);
  const frames = fs.readdirSync(TMP).filter((f) => /^f\d+\.png$/.test(f)).sort().map((f) => path.join(TMP, f));
  im(frames.map((f) => ['(', f, '-resize', '240x240', ')']).flat().concat(['+append', '-quality', '75', T('neon-overdrive-play.webp')]));
  console.log('thumbs written'); fs.rmSync(TMP, { recursive: true, force: true });
})();
