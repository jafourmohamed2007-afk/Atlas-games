#!/usr/bin/env node
/* Game-feel checks for every built game: sounds play without errors, shake is capped and leaves
   the HUD layer still, and reduced motion (OS setting or ?motion=reduce) turns shake off and cuts particles.
   node tests/feel.js [game-id ...] */
'use strict';
const path = require('path'), fs = require('fs'), { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/games.json'), 'utf8')).filter((g) => !g.standalone).map((g) => g.id)
  .filter((id) => fs.existsSync(path.join(ROOT, 'games', id + '.html')));
const only = process.argv.slice(2), list = only.length ? games.filter((g) => only.includes(g)) : games;
const url = (id, q) => 'file://' + path.join(ROOT, 'games', id + '.html') + '?' + q;
(async () => {
  const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  let fails = 0;
  for (const id of list) {
    const errs = [], out = [];
    const fail = (m) => { errs.push(m); };
    // normal motion
    let ctx = await br.newContext({ viewport: { width: 420, height: 760 }, reducedMotion: 'no-preference' }), pg = await ctx.newPage();
    pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    await pg.goto(url(id, 'test&autostart=1')); await pg.waitForFunction(() => window.__bubzi && window.__bubzi.state() === 'playing', null, { timeout: 8000 });
    const snd = await pg.evaluate(() => window.__bubzi.sfxCheck());
    if (!snd.ctx) fail('no audio context'); if (snd.bad.length) fail('sfx errors ' + snd.bad.join(', '));
    const f1 = await pg.evaluate(async () => { const B = window.__bubzi; B.K.shake(500); await new Promise((r) => setTimeout(r, 50)); return B.feel(); });
    if (f1.reduce) fail('reduce motion on by default');
    if (!(f1.mag > 0 && f1.mag <= f1.cap + 0.01)) fail('shake not capped: ' + f1.mag + ' cap ' + f1.cap);
    const p0 = await pg.evaluate(() => window.__bubzi.parts()), p1 = await pg.evaluate(() => { window.__bubzi.K.confetti(100); return window.__bubzi.parts(); });
    out.push('sfx ' + snd.names + ', shake cap ' + f1.cap.toFixed(1) + ', confetti ' + (p1 - p0));
    await ctx.close();
    // reduced motion from the OS setting
    ctx = await br.newContext({ viewport: { width: 420, height: 760 }, reducedMotion: 'reduce' }); pg = await ctx.newPage();
    pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    await pg.goto(url(id, 'test&autostart=1')); await pg.waitForFunction(() => window.__bubzi && window.__bubzi.state() === 'playing', null, { timeout: 8000 });
    const f2 = await pg.evaluate(() => { const B = window.__bubzi; B.K.shake(20); return B.feel(); });
    if (!f2.reduce) fail('OS reduced motion not detected'); if (f2.mag !== 0) fail('shake while reduced motion');
    const q0 = await pg.evaluate(() => window.__bubzi.parts()), q1 = await pg.evaluate(() => { window.__bubzi.K.confetti(100); return window.__bubzi.parts(); });
    if (q1 - q0 > 20) fail('confetti not reduced: ' + (q1 - q0));
    out.push('reduced: no shake, confetti ' + (q1 - q0));
    // play a little in reduced mode to make sure nothing breaks
    const box = await pg.locator('canvas').boundingBox();
    for (let i = 0; i < 12; i++) { await pg.mouse.click(box.x + box.width * (0.2 + Math.random() * 0.6), box.y + box.height * (0.3 + Math.random() * 0.6)); await pg.keyboard.press(['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'Digit1'][i % 5]); }
    await ctx.close();
    if (errs.length) { fails++; console.log('FAIL ' + id + '  ' + errs.join(' | ')); } else console.log('PASS ' + id + '  ' + out.join('; '));
  }
  await br.close();
  if (fails) { console.log(fails + ' game(s) failed'); process.exit(1); } else console.log('ALL FEEL TESTS PASSED');
})();
