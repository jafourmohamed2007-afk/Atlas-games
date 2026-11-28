#!/usr/bin/env node
/* Ashen Vigil browser test (Playwright + Chromium): node tests/ashen-vigil.js
   Checks: 100% canvas (no buttons/inputs/divs), crisp integer pixel scale, mouse + keyboard + touch controls, all three heroes,
   level-up cards, boss chest + evolution, pause, Ember Shrine persistence, narrator voices decode, silent fallback when a clip
   is broken, every synth SFX, 500+ enemies at ~60 fps, a god-mode run to the 15:00 Pale Reaper, and zero page errors. */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, 'games/ashen-vigil.html');
const URL = 'file://' + FILE + '?test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let bad = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) bad++; };

(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const errs = [];
  const page = async (opts) => { const p = await b.newPage(opts || { viewport: { width: 1280, height: 720 } }); p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); return p; };
  const go = async (p, url) => { await p.goto(url || URL); await sleep(350); };

  console.log('canvas-only architecture');
  let p = await page({ viewport: { width: 1440, height: 810 } }); await go(p);
  const dom = await p.evaluate(() => ({ tags: [...document.body.querySelectorAll('*')].map((e) => e.tagName.toLowerCase()).filter((t) => !['script', 'noscript', 'canvas'].includes(t)), css: getComputedStyle(document.getElementById('c')).imageRendering }));
  ok(dom.tags.length === 0, 'no HTML buttons/inputs/divs, only the <canvas> (' + JSON.stringify(dom.tags) + ')');
  ok(/pixel|crisp/.test(dom.css), 'canvas image-rendering: ' + dom.css);
  const dim = await p.evaluate(() => [__av.W(), __av.H(), __av.SD()]);
  ok(dim[0] === 480 && dim[1] === 270 && dim[2] === 3, '1440x810 renders a 480x270 buffer at integer scale ' + dim[2] + ' (got ' + dim + ')');

  console.log('title screen, mouse, keyboard');
  await p.mouse.click(1000, 330); await sleep(100); // third hero card
  await p.mouse.click(540, 465); await sleep(1200);             // START
  ok(await p.evaluate(() => __av.st()) === 'play', 'START button (canvas hitbox) starts a run');
  ok(await p.evaluate(() => __av.R().hero) === 2, 'clicking a hero card selects it');
  const v = await p.evaluate(() => __av.voices());
  ok(v.buf.length === 9 && !v.bad.length, 'all 9 narrator clips decoded (' + v.buf.length + ')');
  const sfxBad = await p.evaluate(() => { const bad = []; __av.SFXN().forEach((n) => { try { __av.sfx(n); } catch (e) { bad.push(n); } }); return bad; });
  ok(!sfxBad.length, 'every synth SFX plays without error');
  await p.keyboard.press('Escape'); ok(await p.evaluate(() => __av.st()) === 'pause', 'Esc pauses');
  await p.keyboard.press('p'); ok(await p.evaluate(() => __av.st()) === 'play', 'P resumes');

  console.log('swarm performance');
  await p.evaluate(() => { const P = __av.P(); P.max = P.hp = 1e9; __av.spawn(0, 200); __av.spawn(1, 200); __av.spawn(2, 100); __av.spawn(3, 100); __av.spawn(4, 100); });
  const alive = await p.evaluate(() => __av.alive());
  const fps = await p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 > 2500) res(n / 2.5); else requestAnimationFrame(f); })(); }));
  ok(alive >= 500, alive + ' enemies alive at once');
  ok(fps > 40, 'frame rate with 500+ enemies: ' + fps.toFixed(0) + ' fps (software rendering)');
  await p.close();

  console.log('level-up, chest, evolution, shop, game over');
  p = await page(); await go(p);
  await p.evaluate(() => { __av.start(0); __av.lvl(); __av.step(2, 0, 0); });
  ok(await p.evaluate(() => __av.st()) === 'levelup', 'level-up pauses the game');
  const n = await p.evaluate(() => __av.choices().length); ok(n >= 3 && n <= 4, n + ' upgrade cards');
  await p.keyboard.press('r'); ok(await p.evaluate(() => __av.R().rerolls) === 1, 'reroll works');
  await p.keyboard.press('1'); ok(await p.evaluate(() => __av.st()) === 'play', 'picking a card resumes');
  const evo = await p.evaluate(() => { const R = __av.R(); R.weapons[0].lv = 8; R.pass.iron = 1; __av.drop('chest'); __av.step(5, 0, 0); const s = __av.st(); __av.chest(); return { s, evo: R.weapons[0].evo }; });
  ok(evo.s === 'chest' && evo.evo === 1, 'boss chest evolves Cinder Blade (max level + Iron Heart)');
  await p.evaluate(() => __av.set('play'));
  await p.evaluate(() => __av.end(false)); await sleep(1300);
  ok(await p.evaluate(() => __av.st()) === 'over', 'death shows the game-over screen');
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('ashenVigil.v1')));
  ok(saved && saved.runs === 1, 'run saved to localStorage');
  await p.close();

  console.log('god-mode run to the Pale Reaper (all 3 heroes)');
  for (const hero of [0, 1, 2]) {
    p = await page(); await go(p);
    const r = await p.evaluate((h) => { __av.start(h); const P = __av.P(); let o; for (let i = 0; i < 40; i++) { P.max = P.hp = 1e9; o = __av.bot(30, true); if (o.state === 'over') break; } return o; }, hero);
    ok(r.win === true && r.time >= 900, 'hero ' + hero + ' beat the Reaper at ' + r.time + 's with ' + r.kills + ' kills, max ' + r.maxAlive + ' alive');
    await p.close();
  }

  console.log('narrator fallback when a clip cannot decode');
  const broken = path.join(require('os').tmpdir(), 'av-novoice.html');
  fs.writeFileSync(broken, fs.readFileSync(FILE, 'utf8').replace(/data:audio\/mpeg;base64,[A-Za-z0-9+/=]+/g, 'data:audio/mpeg;base64,AAAA'));
  p = await page(); await go(p, 'file://' + broken + '?test');
  await p.keyboard.press('Enter'); await sleep(900);
  const fb = await p.evaluate(() => { __av.say('levelup', 1); return { voices: __av.voices(), st: __av.st() }; });
  ok(fb.voices.bad.length === 9 && fb.st === 'play', 'broken clips are skipped silently, the game keeps running');
  await p.close();

  console.log('phone (touch joystick)');
  const ctx = await b.newContext({ ...devices['iPhone 13'], hasTouch: true }); const m = await ctx.newPage(); m.on('pageerror', (e) => errs.push(e.message));
  await m.goto(URL); await sleep(350);
  await m.evaluate(() => __av.start(0)); await sleep(200);
  const cdp = await ctx.newCDPSession(m);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 100, y: 600 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 170, y: 560 }] });
  await sleep(900);
  const pos = await m.evaluate(() => [__av.P().x, __av.P().y]);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  ok(Math.hypot(pos[0], pos[1]) > 20, 'dragging on the left half moves the hero (' + pos.map((x) => x.toFixed(0)) + ')');
  await ctx.close();

  ok(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(bad ? bad + ' check(s) FAILED' : 'ALL ASHEN VIGIL TESTS PASSED');
  await b.close(); process.exit(bad ? 1 : 0);
})();
