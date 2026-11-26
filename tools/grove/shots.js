#!/usr/bin/env node
/* Renders Pocket Grove key art from the real 3D game: thumbs/pocket-grove.webp (512²) and thumbs/pocket-grove-og.jpg (1200×630). */
'use strict';
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '../..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function scene(p) {
  await p.evaluate(() => {
    const g = window.__grove, st = g.state();
    g.setClock(new Date(2026, 5, 20, 18, 10).getTime()); // warm evening light
    st.open = 16; st.lv = 12; st.pets = [{ type: 'bunny' }, { type: 'bee' }, { type: 'hedgehog' }];
    const plan = ['pumpkin', 'goldpump', 'lettuce', 'tomato', 'carrot', 'inkbloom', 'cactus', 'pumpkin', 'onion', 'lettuce', 'goldpump', 'tomato', 'carrot', 'pumpkin', 'potato', 'lettuce'];
    plan.forEach((id, i) => { g.seeds(id, 1); g.plant(i, id); });
    g.skip(60000);
  });
  await sleep(300);
  await p.evaluate(() => { const g = window.__grove; g.mut(1, ['golden']); g.mut(5, ['shiny']); g.mut(7, ['giant']); g.mut(10, ['rainbow']); g.mut(0, ['shiny']); window.__bubzi.K.dbg(); });
  await sleep(2500);
}
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const shots = [['thumb', 1024, 1024], ['og', 1200, 630]], out = {};
  for (const [k, w, h] of shots) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('file://' + path.join(ROOT, 'games/pocket-grove.html') + '?test&embed&shot');
    await p.addStyleTag({ content: '.hud,#banner{display:none!important}' });
    await p.click('#bPlay'); await sleep(1500); await scene(p);
    await p.evaluate(() => window.__grove.camYaw(0.62)); await sleep(1500);
    out[k] = await p.screenshot({ type: 'png' }); await p.close();
  }
  const p = await b.newPage();
  const enc = async (png, w, h, type, q) => Buffer.from((await p.evaluate(async ([d, w, h, type, q]) => { const im = new Image(); im.src = 'data:image/png;base64,' + d; await im.decode(); const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const s = Math.max(w / im.width, h / im.height); x.drawImage(im, (w - im.width * s) / 2, (h - im.height * s) / 2, im.width * s, im.height * s); return c.toDataURL(type, q); }, [png.toString('base64'), w, h, type, q])).split(',')[1], 'base64');
  fs.writeFileSync(path.join(ROOT, 'thumbs/pocket-grove.webp'), await enc(out.thumb, 512, 512, 'image/webp', 0.86));
  fs.writeFileSync(path.join(ROOT, 'thumbs/pocket-grove-og.jpg'), await enc(out.og, 1200, 630, 'image/jpeg', 0.86));
  console.log('thumbs/pocket-grove.webp + -og.jpg written'); await b.close();
})();
