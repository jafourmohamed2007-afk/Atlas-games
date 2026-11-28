#!/usr/bin/env node
/* Key art for Ashen Vigil (the game has its own look, so it is rendered from the real game, not tools/art):
   thumbs/ashen-vigil.webp (512²), thumbs/ashen-vigil-og.jpg (1200×630), thumbs/ashen-vigil-play.webp (12-frame strip). */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const FILE = 'file://' + path.join(ROOT, 'games/ashen-vigil.html') + '?test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const errs = [];
  const open = async (w, h) => { const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', (e) => errs.push(e.message)); await p.addInitScript(() => localStorage.removeItem('ashenVigil.v1')); await p.goto(FILE); await sleep(500); return p; };
  const convert = (p, buf, type, w, h, q, crop) => p.evaluate(async ([b64, type, w, h, q, crop]) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    const cr = crop || [0, 0, im.width, im.height]; x.drawImage(im, cr[0], cr[1], cr[2], cr[3], 0, 0, w, h); return c.toDataURL(type, q);
  }, [buf.toString('base64'), type, w, h, q, crop]);
  const save = (name, url) => fs.writeFileSync(path.join(ROOT, 'thumbs', name), Buffer.from(url.split(',')[1], 'base64'));
  // 1. Open Graph image = the real title screen
  let p = await open(1200, 630);
  save('ashen-vigil-og.jpg', await convert(p, await p.screenshot(), 'image/jpeg', 1200, 630, 0.9));
  await p.close();
  // 2. gameplay: a rich mid-run scene
  p = await open(960, 540);
  await p.evaluate(() => {
    __av.start(0); const P = __av.P(), R = __av.R(); P.max = P.hp = 1e9;
    ['stones', 'font', 'sigil', 'bolt'].forEach((id) => R.weapons.push({ id, lv: 5, evo: 0, cd: 0.1, q: 0, qt: 0, qd: 1, tk: 0, ang: 0 })); R.weapons[0].lv = 6; R.pass.grimoire = 2; R.pass.iron = 2;
    __av.spawn(0, 50); __av.spawn(1, 70); __av.spawn(2, 25); __av.spawn(3, 18); __av.spawn(4, 22); __av.spawn(1, 3, true); __av.step(1200, 0.5, 0.25);
  });
  await sleep(300);
  const frames = [];
  for (let i = 0; i < 12; i++) {
    await p.evaluate(() => { if (__av.st() === 'levelup') __av.pick(0); __av.step(50, Math.cos(performance.now() / 700), Math.sin(performance.now() / 900)); __av.spawn(0, 6); __av.spawn(1, 6); });
    await sleep(120);
    frames.push(await p.screenshot({ clip: { x: 210, y: 0, width: 540, height: 540 } }));
    if (i === 6) save('ashen-vigil.webp', await convert(p, frames[i], 'image/webp', 512, 512, 0.85));
  }
  const strip = await p.evaluate(async (fr) => {
    const c = document.createElement('canvas'); c.width = 240 * fr.length; c.height = 240; const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    for (let i = 0; i < fr.length; i++) { const im = new Image(); im.src = 'data:image/png;base64,' + fr[i]; await im.decode(); x.drawImage(im, i * 240, 0, 240, 240); }
    return c.toDataURL('image/webp', 0.72);
  }, frames.map((f) => f.toString('base64')));
  save('ashen-vigil-play.webp', strip);
  console.log('thumbs written', errs.length ? errs : 'no errors');
  await b.close();
})();
