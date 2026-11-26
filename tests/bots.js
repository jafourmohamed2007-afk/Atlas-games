#!/usr/bin/env node
/* Gameplay bots: play each game for real and check the RULES work
   (line clears, merges, levels, lives, fair obstacle patterns...).
   node tests/bots.js [game-id ...] */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const only = process.argv.slice(2);

async function open(browser, id, q = '') {
  const page = await browser.newPage({ viewport: { width: 420, height: 820 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + path.join(ROOT, 'games', id + '.html') + '?test' + q);
  await page.waitForSelector('#bPlay');
  await page.click('#bPlay');
  return { page, errors };
}
const dbg = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__bubzi.K.dbg())));
const st = (page) => page.evaluate(() => window.__bubzi.state());
const score = (page) => page.evaluate(() => window.__bubzi.K.score);
async function drag(page, x1, y1, x2, y2) {
  await page.mouse.move(x1, y1); await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(x1 + (x2 - x1) * i / 6, y1 + (y2 - y1) * i / 6);
  await page.mouse.up();
}

const BOTS = {
  'block-bloom': async (page, fail, info) => {
    let clears = 0, moves = 0;
    for (let it = 0; it < 120; it++) {
      if ((await st(page)) !== 'playing') break;
      const d = await dbg(page);
      const W = await page.evaluate(() => window.__bubzi.K.W);
      const fits = (p, r, c) => p.cells.every(([dr, dc]) => r + dr >= 0 && c + dc >= 0 && r + dr < 8 && c + dc < 8 && !d.grid[r + dr][c + dc]);
      let best = null;
      d.tray.forEach((p, i) => {
        if (!p) return;
        for (let r = 0; r <= 8 - p.h; r++) for (let c = 0; c <= 8 - p.w; c++) {
          if (!fits(p, r, c)) continue;
          const g = d.grid.map((row) => row.slice()); p.cells.forEach(([dr, dc]) => { g[r + dr][c + dc] = 1; });
          let lines = 0; for (let k = 0; k < 8; k++) { if (g[k].every(Boolean)) lines++; if (g.every((row) => row[k])) lines++; }
          const v = lines * 100 + r + Math.random();
          if (!best || v > best.v) best = { v, i, r, c, p, lines };
        }
      });
      if (!best) { await sleep(200); if ((await st(page)) === 'playing') fail('no piece fits but game not over'); break; }
      const s0 = await score(page);
      const fx = W / 6 * (2 * best.i + 1), fy = d.ty + d.th / 2;
      const tx = d.bx + best.c * d.cs + best.p.w * d.cs / 2, ty = d.by + best.r * d.cs + best.p.h * d.cs + 0.9 * d.cs;
      await drag(page, fx, fy, tx, ty); await sleep(40);
      const s1 = await score(page);
      if (s1 < s0 + best.p.cells.length) fail(`placement did not score (${s0}→${s1})`);
      if (best.lines) { clears++; if (s1 < s0 + best.p.cells.length + 40) fail('line clear did not score'); }
      moves++;
    }
    const s = await st(page);
    if (s !== 'playing') {
      const d = await dbg(page);
      const any = d.tray.some((p) => p && [...Array(8).keys()].some((r) => [...Array(8).keys()].some((c) => p.cells.every(([dr, dc]) => r + dr < 8 && c + dc < 8 && !d.grid[r + dr][c + dc]))));
      if (any) fail('game ended although a piece still fits');
    }
    if (clears < 3) fail('only ' + clears + ' line clears in ' + moves + ' moves');
    info.push(moves + ' moves, ' + clears + ' clears, score ' + (await score(page)));
  },

  'rooftop-rush': async (page, fail, info) => {
    const t0 = Date.now(); let lastLane = 0;
    while (Date.now() - t0 < 30000) {
      if ((await st(page)) !== 'playing') break;
      const d = await dbg(page);
      const sp = d.speed, pl = d.player;
      const danger = (lane) => d.objs.some((o) => o.t === 'chim' && o.lane === lane && o.z > -0.6 && o.z < 4 + sp * 0.3);
      if (danger(pl.lane)) {
        const opts = [pl.lane - 1, pl.lane + 1].filter((l) => l >= -1 && l <= 1 && !danger(l));
        if (opts.length) { await page.keyboard.press(opts[0] < pl.lane ? 'ArrowLeft' : 'ArrowRight'); lastLane = opts[0]; }
      }
      const mine = d.objs.filter((o) => (o.lane === pl.lane || o.t === 'gap') && o.z > 0);
      for (const o of mine) {
        if (o.t === 'vent' && o.z < sp * 0.22 && !pl.air) await page.keyboard.press('ArrowUp');
        if (o.t === 'gap' && o.z - o.len / 2 < sp * 0.12 && !pl.air) await page.keyboard.press('ArrowUp');
        if (o.t === 'bar' && o.z < sp * 0.3 && pl.slide <= 0 && !pl.air) await page.keyboard.press('ArrowDown');
      }
      await sleep(15);
    }
    const alive = (Date.now() - t0) / 1000, s = await st(page);
    info.push('bot survived ' + alive.toFixed(1) + 's' + (s === 'playing' ? ' (still alive)' : '') + ', score ' + (await score(page)));
    if (alive < 15) fail('runner bot died after only ' + alive.toFixed(1) + 's — pattern may be unfair');
    void lastLane;
  },

  'hop-hook': async (page, fail, info) => {
    const t0 = Date.now(); let down = false, best = 0;
    while (Date.now() - t0 < 25000) {
      if ((await st(page)) !== 'playing') break;
      const d = await dbg(page);
      if (!down && !d.p.hook && d.target && (d.p.vy > -100 || d.p.x < 200)) { await page.keyboard.down('Space'); down = true; }
      else if (down && d.p.hook && d.p.x > d.hook.x + 40 && d.p.vy < -250) { await page.keyboard.up('Space'); down = false; }
      else if (down && !d.p.hook) { await page.keyboard.up('Space'); down = false; }
      best = Math.max(best, await score(page));
      await sleep(15);
    }
    info.push('bot reached ' + best + ' m in ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
    if (best < 20) fail('swing bot made almost no progress (' + best + ')');
  },

  'number-pop': async (page, fail, info) => {
    const box = await page.locator('#game').boundingBox();
    let ok = 0;
    for (let t = 0; t < 1500 && ok < 14; t++) {
      if ((await st(page)) !== 'playing') break;
      const d = await dbg(page);
      const b = d.bubbles.find((x) => x.ok && !x.pop && !x.fade && x.y < box.height - d.q.ans * 0 - 60 && x.y > 150);
      if (b) { await page.mouse.click(box.x + b.x, box.y + b.y); ok++; await sleep(80); } else await sleep(60);
    }
    let d = await dbg(page);
    if (d.lives !== 3) fail('lost a life while answering correctly (lives ' + d.lives + ')');
    if (d.level < 1 + Math.floor(ok / 6) || ok < 12) fail('level did not advance (level ' + d.level + ' after ' + ok + ' correct)');
    // check every question's answer is right
    // wrong tap costs a life
    for (let t = 0; t < 200; t++) {
      d = await dbg(page);
      const w = d.bubbles.find((x) => !x.ok && !x.pop && !x.fade && x.y < box.height - 60 && x.y > 150);
      if (w) { await page.mouse.click(box.x + w.x, box.y + w.y); break; }
      await sleep(50);
    }
    await sleep(100);
    d = await dbg(page);
    if (d.lives !== 2) fail('wrong tap did not cost a life (lives ' + d.lives + ')');
    const q = d.q, exp = q.op === '+' ? q.a + q.b : q.op === '×' ? q.a * q.b : q.op === '÷' ? q.a / q.b : q.a - q.b;
    if (exp !== q.ans) fail('wrong answer key: ' + JSON.stringify(q));
    info.push(ok + ' correct, level ' + d.level + ', score ' + (await score(page)));
  },

  'hill-hopper': async (page, fail, info) => {
    await page.keyboard.down('ArrowRight');
    let s = 0;
    for (let i = 0; i < 24; i++) {
      await sleep(250);
      const d = await dbg(page);
      if (![d.w1.x, d.w1.y, d.w2.x, d.w2.y].every(Number.isFinite)) { fail('car position became NaN'); break; }
      if ((await st(page)) !== 'playing') break;
      s = await score(page);
    }
    await page.keyboard.up('ArrowRight');
    info.push('drove to score ' + s);
    if (s < 30) fail('car barely moved (' + s + ')');
  },

  'jelly-drop': async (page, fail, info) => {
    const box = await page.locator('#game').boundingBox();
    let drops = 0;
    for (let i = 0; i < 600 && drops < 45; i++) {
      if ((await st(page)) !== 'playing') break;
      const d = await dbg(page);
      if (d.cool > 0) { await sleep(60); continue; }
      const x = d.jx + (10 + Math.random() * 80) * d.sc;
      await page.mouse.click(box.x + x, box.y + d.jy - 30); drops++;
      await sleep(120);
      const bad = d.jel.find((o) => !Number.isFinite(o.x) || !Number.isFinite(o.y) || o.x < d.R[o.l] - 2 || o.x > 100 - d.R[o.l] + 2 || o.y > d.jh - d.R[o.l] + 2);
      if (bad) { fail('jelly escaped the jar: ' + JSON.stringify(bad)); break; }
    }
    const sc = await score(page);
    if (sc < 20) fail('no merges happened (score ' + sc + ')');
    info.push(drops + ' drops, score ' + sc + ', state ' + (await st(page)));
  },

  'memo-match': async (page, fail, info) => {
    const box = await page.locator('#game').boundingBox();
    const clickCard = async (d, i) => { const c = d.cards[i]; await page.mouse.click(box.x + d.gx + c.c * (d.cw + d.gap) + d.cw / 2, box.y + d.gy + c.r * (d.ch + d.gap) + d.ch / 2); };
    for (let lvl = 1; lvl <= 3; lvl++) {
      let d = await dbg(page);
      for (let t = 0; t < 100 && (d.preview > 0 || d.clearT > 0); t++) { await sleep(60); d = await dbg(page); }
      if (d.level !== lvl) { fail('expected level ' + lvl + ' got ' + d.level); break; }
      if (lvl === 1) { // mismatch check
        const a = 0, b = d.cards.findIndex((c, i) => i > 0 && c.icon !== d.cards[0].icon);
        await clickCard(d, a); await clickCard(d, b); await sleep(1000);
        const d2 = await dbg(page);
        if (d2.cards[a].up || d2.cards[b].up) fail('mismatched cards did not flip back');
      }
      d = await dbg(page);
      const done = new Set();
      for (let i = 0; i < d.cards.length; i++) {
        if (done.has(i)) continue;
        const j = d.cards.findIndex((c, k) => k !== i && c.icon === d.cards[i].icon);
        await clickCard(d, i); await clickCard(d, j); done.add(i); done.add(j); await sleep(60);
      }
      await sleep(200);
      d = await dbg(page);
      if (!d.cards.every((c) => c.done)) fail('level ' + lvl + ' not fully matched');
    }
    await sleep(1600);
    const d = await dbg(page);
    if (d.level !== 4) fail('did not reach level 4 (level ' + d.level + ')');
    info.push('cleared 3 levels, score ' + (await score(page)));
  },

  'wiggle-snake': async (page, fail, info) => {
    const D = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    await page.keyboard.press('ArrowUp');
    const t0 = Date.now(); let maxLen = 0, lastHead = '';
    while (Date.now() - t0 < 25000) {
      if ((await st(page)) !== 'playing') break;
      const d = await dbg(page);
      const h = d.body[0], key = h.x + ',' + h.y;
      maxLen = Math.max(maxLen, d.body.length);
      if (key === lastHead || d.queue.length) { await sleep(8); continue; }
      lastHead = key;
      const safe = (x, y) => x >= 0 && y >= 0 && x < d.cols && y < d.rows && !d.body.slice(0, -1).some((s) => s.x === x && s.y === y);
      const opts = Object.keys(D).filter((k) => !(D[k][0] === -D[d.dir][0] && D[k][1] === -D[d.dir][1])).filter((k) => safe(h.x + D[k][0], h.y + D[k][1]));
      if (!opts.length) { await sleep(20); continue; }
      opts.sort((a, b) => (Math.abs(h.x + D[a][0] - d.fruit.x) + Math.abs(h.y + D[a][1] - d.fruit.y)) - (Math.abs(h.x + D[b][0] - d.fruit.x) + Math.abs(h.y + D[b][1] - d.fruit.y)));
      if (opts[0] !== d.dir) await page.keyboard.press(KEY[opts[0]]);
      await sleep(8);
    }
    info.push('max length ' + maxLen + ', score ' + (await score(page)));
    if (maxLen < 10) fail('snake bot only reached length ' + maxLen);
  }
};

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const id of Object.keys(BOTS)) {
    if (only.length && !only.includes(id)) continue;
    const errs = [], info = [];
    let page;
    try {
      const o = await open(browser, id); page = o.page;
      await BOTS[id](page, (m) => errs.push(m), info);
      errs.push(...o.errors.map((e) => 'pageerror: ' + e));
    } catch (e) { errs.push('CRASH: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); }
    if (page) await page.close();
    console.log((errs.length ? 'FAIL ' : 'PASS ') + id + '  ' + info.join('; '));
    errs.forEach((e) => console.log('   - ' + e));
    if (errs.length) bad++;
  }
  await browser.close();
  console.log(bad ? bad + ' bot test(s) FAILED' : 'ALL BOT TESTS PASSED');
  process.exit(bad ? 1 : 0);
})();
