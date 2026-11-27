#!/usr/bin/env node
/* Ink Heroes dash: Q / DASH button bursts forward, costs stamina (about 3 in a row), regenerates, and dodges every
   hit while it lasts. Also checks the phone touch layout: no buttons overlap and all stay on screen. */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const URL = 'file://' + path.join(__dirname, '..', 'games', 'ink-heroes.html') + '?test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
  const errs = [], fails = [], ok = []; p.on('pageerror', (e) => errs.push(e.message));
  const F = (m) => fails.push(m), ev = (f, a) => p.evaluate(f, a), dbg = () => ev(() => window.__bubzi.K.dbg());
  await p.goto(URL); await ev(() => localStorage.setItem('bubzi:ink:mode', JSON.stringify('inf')));
  await p.goto(URL); await p.click('#bPlay'); await sleep(250); await p.keyboard.press('Enter'); await sleep(2600);
  await ev(() => { window.__inkHold = 1; window.__ink.clear(); window.__ink.spawn('shuffler'); }); await sleep(300);
  let d = await dbg(); const x0 = d.hero.x;
  if (d.hero.sta !== 100) F('stamina not full at start ' + d.hero.sta); else ok.push('stamina starts full');
  await p.keyboard.press('KeyQ'); await sleep(40); d = await dbg();
  if (!(d.hero.dashT > 0)) F('dash did not start'); else ok.push('Q starts a dash');
  await sleep(400); d = await dbg();
  if (Math.abs(d.hero.x - x0) < 150) F('dash too short ' + (d.hero.x - x0)); else ok.push('dash covers ' + Math.round(Math.abs(d.hero.x - x0)) + ' px');
  if (d.hero.sta > 75 || d.hero.sta < 60) F('stamina cost wrong ' + d.hero.sta); else ok.push('one dash costs stamina (' + Math.round(d.hero.sta) + ' left)');
  await p.keyboard.press('KeyQ'); await sleep(360); await p.keyboard.press('KeyQ'); await sleep(360);
  d = await dbg(); const x1 = d.hero.x, s1 = d.hero.sta;
  await p.keyboard.press('KeyQ'); await sleep(60); d = await dbg();
  if (s1 >= 40) F('three dashes left too much stamina ' + s1); else if (s1 < 34 && d.hero.dashT > 0) F('dash allowed with no stamina'); else ok.push('no 4th dash without stamina (' + Math.round(s1) + ')');
  await sleep(4600); d = await dbg(); if (d.mode !== 'fight') F('left fight mode: ' + d.mode);
  if (d.hero.sta < 99) F('stamina did not regen ' + d.hero.sta); else ok.push('stamina refills');
  // dodge: a hit during the dash does nothing, the same hit without it hurts
  let hp0 = d.hero.hp; await p.keyboard.press('KeyQ'); await sleep(50); await ev(() => window.__ink.hurt(20)); d = await dbg();
  if (d.hero.hp !== hp0) F('hit landed during dash'); else ok.push('dash dodges hits');
  await sleep(1500); d = await dbg(); hp0 = d.hero.hp; await ev(() => window.__ink.hurt(20)); d = await dbg();
  if (d.hero.hp >= hp0) F('control hit did not land'); else ok.push('without dash the same hit lands');
  // phone layout
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); m.on('pageerror', (e) => errs.push(e.message));
  for (const [w, h] of [[390, 844], [410, 510], [844, 390], [360, 640]]) {
    await m.setViewportSize({ width: w, height: h }); await m.goto(URL); await m.evaluate(() => localStorage.setItem('bubzi:ink:mode', JSON.stringify('inf')));
    await m.goto(URL); await m.tap('#bPlay'); await sleep(250); await m.evaluate(() => window.__bubzi.K && 0); await m.keyboard.press('Enter'); await sleep(1200);
    const B = await m.evaluate(() => window.__ink.btns()), K = await m.evaluate(() => ({ W: window.__bubzi.K.W, H: window.__bubzi.K.H }));
    const ks = Object.keys(B); let bad = [];
    if (!B.dash) bad.push('no dash button');
    ks.forEach((a, i) => { const q = B[a]; if (q.x - q.r < 0 || q.y - q.r < 0 || q.x + q.r > K.W || q.y + q.r > K.H) bad.push(a + ' off screen'); ks.slice(i + 1).forEach((c) => { const o = B[c]; if (Math.hypot(q.x - o.x, q.y - o.y) < q.r + o.r + 4) bad.push(a + '/' + c + ' overlap'); }); });
    if (bad.length) F(w + 'x' + h + ': ' + bad.join(', ')); else ok.push(w + 'x' + h + ': ' + ks.length + ' buttons, none overlap');
  }
  ok.forEach((m2) => console.log('  ✓ ' + m2)); fails.forEach((m2) => console.log('  ✗ ' + m2)); errs.forEach((m2) => console.log('  ERR ' + m2));
  await b.close();
  if (fails.length || errs.length) { console.log('ink dash: FAILED'); process.exit(1); } console.log('ink dash: all passed');
})();
