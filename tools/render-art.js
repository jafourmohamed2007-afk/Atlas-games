#!/usr/bin/env node
/* Renders original key art: thumbs/<id>.webp (512²), thumbs/<id>-og.jpg (1200×630), thumbs/icon-<name>.webp */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/games.json'), 'utf8'));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'art/art.html'));
  await p.evaluate(() => document.fonts.load('800 40px "Baloo 2"'));
  fs.mkdirSync(path.join(ROOT, 'thumbs'), { recursive: true });
  const save = (name, dataUrl) => { fs.writeFileSync(path.join(ROOT, 'thumbs', name), Buffer.from(dataUrl.split(',')[1], 'base64')); };
  for (const g of games) {
    save(g.id + '.webp', await p.evaluate((id) => window.renderArt('game', id, 512, 512), g.id));
    save(g.id + '-og.jpg', await p.evaluate(([id, t]) => window.renderArt('game', id, 1200, 630, { title: t, type: 'image/jpeg', q: 0.86 }), [g.id, g.title.en]));
  }
  for (const n of await p.evaluate(() => window.ART_ICONS)) save('icon-' + n + '.webp', await p.evaluate((n) => window.renderArt('icon', n, 256, 256), n));
  for (const sz of [192, 512]) save('app-' + sz + '.png', await p.evaluate((sz) => window.renderArt('icon', 'app', sz, sz, { png: true }), sz));
  console.log('art rendered', errs.length ? errs : 'no errors');
  await b.close();
})();
