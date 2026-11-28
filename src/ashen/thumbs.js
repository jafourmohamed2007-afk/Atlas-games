#!/usr/bin/env node
/* Captures Ashen Vigil's site images from the real game (Playwright):
   thumbs/ashen-vigil.webp (512²), thumbs/ashen-vigil-og.jpg (1200×630), thumbs/ashen-vigil-play.webp (12-frame 240² strip).
   Usage: node src/ashen/thumbs.js   (after node tools/build.js) */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..'), ID = 'ashen-vigil';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const save = (name, dataUrl) => fs.writeFileSync(path.join(ROOT, 'thumbs', name), Buffer.from(dataUrl.split(',')[1], 'base64'));
async function scene(b, w, h, q, wait, mul) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.join(ROOT, 'games', ID + '.html') + '?god&' + q);
  await sleep(300);
  await p.evaluate((m) => {
    window.__av.start(0); window.__av.G.pendLv = 0;
    ['orbit', 'bolt', 'font'].forEach((id) => window.__av.give(id, 6)); window.__av.give('blade', 8);
    window.__av.spawn('husk', 70 * m); window.__av.spawn('bat', 40 * m); window.__av.spawn('ghoul', 25 * m); window.__av.spawn('wraith', 15 * m, { elite: true }); window.__av.spawn('archer', 10 * m);
    window.__avBot = () => { const t = performance.now() / 1000; return [Math.cos(t * 0.7) * 0.6, Math.sin(t * 0.9) * 0.6]; };
    setInterval(() => { const G = window.__av.G; if (G.state === 'levelup') window.__av.ui.pickN = 1; }, 50);
  }, mul || 1);
  await sleep(wait || 2600);
  return p;
}
const toFmt = (p, b64, w, h, type, q) => p.evaluate(async ([b64, w, h, type, q]) => {
  const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(im, 0, 0, w, h);
  return c.toDataURL(type, q);
}, [b64, w, h, type, q]);
(async () => {
  const b = await chromium.launch();
  let p = await scene(b, 512, 512, 'art=logo');
  save(ID + '.webp', await toFmt(p, (await p.screenshot()).toString('base64'), 512, 512, 'image/webp', 0.86)); await p.close();
  p = await scene(b, 1200, 630, 'art=logo', 4200, 2.2);
  save(ID + '-og.jpg', await toFmt(p, (await p.screenshot()).toString('base64'), 1200, 630, 'image/jpeg', 0.86)); await p.close();
  p = await scene(b, 360, 360, 'art=1');
  const frames = [];
  for (let i = 0; i < 12; i++) { frames.push((await p.screenshot({ type: 'jpeg', quality: 88 })).toString('base64')); await sleep(190); }
  const strip = await p.evaluate(async (frames) => {
    const c = document.createElement('canvas'); c.width = 240 * frames.length; c.height = 240; const x = c.getContext('2d');
    for (let i = 0; i < frames.length; i++) { const im = new Image(); im.src = 'data:image/jpeg;base64,' + frames[i]; await im.decode(); x.drawImage(im, i * 240, 0, 240, 240); }
    return c.toDataURL('image/webp', 0.72);
  }, frames);
  save(ID + '-play.webp', strip);
  await b.close();
  for (const f of [ID + '.webp', ID + '-og.jpg', ID + '-play.webp']) console.log('thumbs/' + f, (fs.statSync(path.join(ROOT, 'thumbs', f)).size / 1024).toFixed(0) + ' KB');
})();
