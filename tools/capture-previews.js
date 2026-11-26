#!/usr/bin/env node
/* Records real gameplay previews: thumbs/<id>-play.webp = sprite strip of 12 square frames (each 240×240).
   Simple bots play each game while frames are captured. */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/games.json'), 'utf8')).map((g) => g.id);
const only = process.argv.slice(2);
const FRAMES = 12, FW = 240, FH = 240, GAP = 190, VW = 360, VH = 640;
const Y0 = { 'block-bloom': 86, 'rooftop-rush': 230, 'hop-hook': 70, 'number-pop': 280, 'hill-hopper': 170, 'jelly-drop': 262, 'memo-match': 190, 'wiggle-snake': 170, 'ink-heroes': 250 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dbg = (p) => p.evaluate(() => JSON.parse(JSON.stringify(window.__bubzi.K.dbg())));
const playing = (p) => p.evaluate(() => window.__bubzi.state() === 'playing');

const ACT = {
  'block-bloom': async (p, box) => {
    const d = await dbg(p), W = box.width;
    const fits = (pc, r, c) => pc.cells.every(([dr, dc]) => r + dr < 8 && c + dc < 8 && !d.grid[r + dr][c + dc]);
    let best = null;
    d.tray.forEach((pc, i) => { if (!pc) return; for (let r = 0; r <= 8 - pc.h; r++) for (let c = 0; c <= 8 - pc.w; c++) if (fits(pc, r, c)) { const v = r * 2 + Math.random() * 3; if (!best || v > best.v) best = { v, i, r, c, pc }; } });
    if (!best) return;
    const fx = box.x + W / 6 * (2 * best.i + 1), fy = box.y + d.ty + d.th / 2;
    const tx = box.x + d.bx + best.c * d.cs + best.pc.w * d.cs / 2, ty = box.y + d.by + best.r * d.cs + best.pc.h * d.cs + 0.9 * d.cs;
    await p.mouse.move(fx, fy); await p.mouse.down(); for (let k = 1; k <= 8; k++) { await p.mouse.move(fx + (tx - fx) * k / 8, fy + (ty - fy) * k / 8); await sleep(25); } await p.mouse.up(); await sleep(250);
  },
  'rooftop-rush': async (p) => {
    const d = await dbg(p), sp = d.speed, pl = d.player;
    const danger = (l) => d.objs.some((o) => o.t === 'chim' && o.lane === l && o.z > -0.6 && o.z < 4 + sp * 0.3);
    if (danger(pl.lane)) { const o = [pl.lane - 1, pl.lane + 1].filter((l) => l >= -1 && l <= 1 && !danger(l)); if (o.length) await p.keyboard.press(o[0] < pl.lane ? 'ArrowLeft' : 'ArrowRight'); }
    for (const o of d.objs.filter((o) => (o.lane === pl.lane || o.t === 'gap') && o.z > 0)) {
      if ((o.t === 'vent' && o.z < sp * 0.22) || (o.t === 'gap' && o.z - o.len / 2 < sp * 0.12)) { if (!pl.air) await p.keyboard.press('ArrowUp'); }
      if (o.t === 'bar' && o.z < sp * 0.3 && pl.slide <= 0 && !pl.air) await p.keyboard.press('ArrowDown');
    }
    if (Math.random() < 0.02) await p.keyboard.press(Math.random() < 0.5 ? 'ArrowLeft' : 'ArrowRight');
    await sleep(15);
  },
  'hop-hook': async (p, box, s) => {
    const d = await dbg(p);
    if (!s.down && !d.p.hook && d.target && (d.p.vy > -100 || d.p.x < 200)) { await p.keyboard.down('Space'); s.down = true; }
    else if (s.down && d.p.hook && d.p.x > d.hook.x + 40 && d.p.vy < -250) { await p.keyboard.up('Space'); s.down = false; }
    else if (s.down && !d.p.hook) { await p.keyboard.up('Space'); s.down = false; }
    await sleep(15);
  },
  'number-pop': async (p, box) => {
    const d = await dbg(p); const b = d.bubbles.find((x) => x.ok && !x.pop && !x.fade && x.y < box.height * 0.62);
    if (b) await p.mouse.click(box.x + b.x, box.y + b.y); await sleep(60);
  },
  'hill-hopper': async (p, box, s) => { if (!s.down) { await p.keyboard.down('ArrowRight'); s.down = true; } await sleep(50); },
  'jelly-drop': async (p, box) => {
    const d = await dbg(p); if (d.cool > 0) { await sleep(60); return; }
    await p.mouse.click(box.x + d.jx + (25 + Math.random() * 50) * d.sc, box.y + d.jy - 20); await sleep(150);
  },
  'memo-match': async (p, box, s) => {
    const d = await dbg(p); if (d.preview > 0 || d.clearT > 0) { await sleep(60); return; }
    const i = d.cards.findIndex((c) => !c.done && !c.up); if (i < 0) { await sleep(60); return; }
    const j = s.wrong ? d.cards.findIndex((c, k) => k !== i && !c.done && c.icon !== d.cards[i].icon) : d.cards.findIndex((c, k) => k !== i && c.icon === d.cards[i].icon);
    s.wrong = !s.wrong && Math.random() < 0.3;
    for (const k of [i, j]) { if (k < 0) continue; const c = d.cards[k]; await p.mouse.click(box.x + d.gx + c.c * (d.cw + d.gap) + d.cw / 2, box.y + d.gy + c.r * (d.ch + d.gap) + d.ch / 2); await sleep(260); }
    await sleep(300);
  },
  'ink-heroes': async (p, box, s) => {
    const d = await dbg(p);
    if (d.mode !== 'fight') { await p.keyboard.press('Enter'); await sleep(80); return; }
    const h = d.hero; let near = null, nd = 1e9; d.zombies.forEach((z) => { const dd = Math.abs(z.x - h.x); if (dd < nd) { nd = dd; near = z; } });
    if (h.ink >= 100) await p.keyboard.press('KeyL');
    if (near) { const dir = near.x > h.x ? 'ArrowRight' : 'ArrowLeft'; if (nd > 70) { await p.keyboard.down(dir); await sleep(60); await p.keyboard.up(dir); } else await p.keyboard.press('KeyJ'); if (nd > 140 && Math.random() < 0.4) await p.keyboard.press('KeyK'); }
    await sleep(20);
  },
  'wiggle-snake': async (p, box, s) => {
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    const d = await dbg(p); if (d.waiting) { await p.keyboard.press('ArrowUp'); return; }
    const h = d.body[0], key = h.x + ',' + h.y; if (key === s.last || d.queue.length) { await sleep(8); return; } s.last = key;
    const safe = (x, y) => x >= 0 && y >= 0 && x < d.cols && y < d.rows && !d.body.slice(0, -1).some((q) => q.x === x && q.y === y);
    const o = Object.keys(D).filter((k) => !(D[k][0] === -D[d.dir][0] && D[k][1] === -D[d.dir][1])).filter((k) => safe(h.x + D[k][0], h.y + D[k][1]));
    o.sort((a, b) => (Math.abs(h.x + D[a][0] - d.fruit.x) + Math.abs(h.y + D[a][1] - d.fruit.y)) - (Math.abs(h.x + D[b][0] - d.fruit.x) + Math.abs(h.y + D[b][1] - d.fruit.y)));
    if (o.length && o[0] !== d.dir) await p.keyboard.press(KEY[o[0]]);
  }
};

(async () => {
  const b = await chromium.launch();
  for (const id of games) {
    if (only.length && !only.includes(id)) continue;
    const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.addInitScript((id) => { try { localStorage.setItem('bubzi:tut:' + id, 'true'); } catch (e) {} }, id);
    await p.goto('file://' + path.join(ROOT, 'games', id + '.html') + '?test&embed&lang=en');
    await p.addStyleTag({ content: '.hud{display:none!important}' });
    await p.click('#bPlay');
    const box = await p.locator('#game').boundingBox();
    const s = {}; let stop = false;
    const loop = (async () => { while (!stop) { try { if (await playing(p)) await ACT[id](p, box, s); else { await p.evaluate(() => window.__bubzi.start()); } } catch (e) { await sleep(50); } } })();
    await sleep(id === 'memo-match' ? 2600 : id === 'jelly-drop' ? 11000 : id === 'ink-heroes' ? 9000 : 3200);
    const frames = [];
    for (let i = 0; i < FRAMES; i++) { frames.push((await p.screenshot({ type: 'jpeg', quality: 88, clip: { x: 0, y: Y0[id], width: VW, height: VW } })).toString('base64')); await sleep(GAP); }
    stop = true; await loop;
    const sprite = await p.evaluate(async ([frames, FW, FH]) => {
      const c = document.createElement('canvas'); c.width = FW * frames.length; c.height = FH; const x = c.getContext('2d');
      for (let i = 0; i < frames.length; i++) { const im = new Image(); im.src = 'data:image/jpeg;base64,' + frames[i]; await im.decode(); x.drawImage(im, i * FW, 0, FW, FH); }
      return c.toDataURL('image/webp', 0.72);
    }, [frames, FW, FH]);
    fs.writeFileSync(path.join(ROOT, 'thumbs', id + '-play.webp'), Buffer.from(sprite.split(',')[1], 'base64'));
    console.log('preview', id, (fs.statSync(path.join(ROOT, 'thumbs', id + '-play.webp')).size / 1024).toFixed(0) + ' KB');
    await ctx.close();
  }
  await b.close();
})();
