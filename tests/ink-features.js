#!/usr/bin/env node
/* Ink Heroes feature test: shop (guns/items), every gun, every item, heart revive. */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const URL = 'file://' + path.join(__dirname, '..', 'games', 'ink-heroes.html') + '?test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
  const errs = [], fails = [], ok = []; p.on('pageerror', (e) => errs.push(e.message));
  const F = (m) => fails.push(m), d = () => p.evaluate(() => window.__bubzi.K.dbg()), ev = (f, a) => p.evaluate(f, a);
  await p.goto(URL); await ev(() => { localStorage.setItem('bubzi:cur:ink-heroes', '20000'); localStorage.setItem('bubzi:ink:hook', '1'); });
  await p.click('#bPlay'); await sleep(200);
  if ((await d()).storyMode) await p.keyboard.press('KeyT'); // Infinity
  // ---- no gun at the start: guns are bought ----
  { const g0 = await d(); if (g0.gun !== null) F('a fresh save should have no gun (got ' + g0.gun + ')'); else ok.push('no gun at the start'); }
  // ---- shop: open, buy a gun, equip, buy items ----
  await p.keyboard.press('KeyS'); if ((await d()).mode !== 'shop') F('shop did not open');
  for (let i = 0; i < 5; i++) await p.keyboard.press('ArrowRight');           // select Longshot Sniper (index 5)
  const c0 = await ev(() => JSON.parse(localStorage.getItem('bubzi:cur:ink-heroes')));
  await p.keyboard.press('Enter'); await sleep(50);
  const c1 = await ev(() => JSON.parse(localStorage.getItem('bubzi:cur:ink-heroes')));
  const guns = await ev(() => JSON.parse(localStorage.getItem('bubzi:ink:guns')));
  if (c0 - c1 !== 1200 || !guns.includes('longshot')) F('buying Longshot failed (' + c0 + '→' + c1 + ')'); else ok.push('bought Longshot for 1200');
  if ((await ev(() => localStorage.getItem('bubzi:ink:gun'))) !== '"longshot"') F('bought gun not equipped');
  { const am = await ev(() => JSON.parse(localStorage.getItem('bubzi:ink:ammo') || '{}')); if (am.longshot !== 15) F('a bought Longshot should come with 15 rounds (3 mags), got ' + am.longshot); else ok.push('bought gun comes with 3 mags');
    const c2 = await ev(() => JSON.parse(localStorage.getItem('bubzi:cur:ink-heroes'))); await p.keyboard.press('KeyA'); await sleep(50);
    const am2 = await ev(() => JSON.parse(localStorage.getItem('bubzi:ink:ammo') || '{}')), c3 = await ev(() => JSON.parse(localStorage.getItem('bubzi:cur:ink-heroes')));
    if (am2.longshot !== 25 || c2 - c3 !== 85) F('ammo pack should add 2 mags for 85 (got ' + am2.longshot + ', paid ' + (c2 - c3) + ')'); else ok.push('ammo pack: +10 rounds for 85'); }
  await p.keyboard.press('KeyE'); // items tab
  for (let i = 0; i < 8; i++) { for (let k = 0; k < 3; k++) await p.keyboard.press('Enter'); await p.keyboard.press('ArrowRight'); }
  const bag = await ev(() => JSON.parse(localStorage.getItem('bubzi:ink:items')));
  if (!(bag.heart >= 3 && bag.grenade >= 3 && bag.airstrike >= 3)) F('buying items failed ' + JSON.stringify(bag)); else ok.push('bought items ' + JSON.stringify(bag));
  // ---- combos tab: buy Jab Storm (5 hits = 300), it goes to slot B; key 1 moves it to slot A (swap) ----
  await p.keyboard.press('KeyE');
  for (let i = 0; i < 5; i++) await p.keyboard.press('ArrowRight');
  const k0 = await ev(() => JSON.parse(localStorage.getItem('bubzi:cur:ink-heroes')));
  await p.keyboard.press('Enter'); await sleep(50);
  const k1 = await ev(() => JSON.parse(localStorage.getItem('bubzi:cur:ink-heroes')));
  const own = await ev(() => JSON.parse(localStorage.getItem('bubzi:ink:combos'))), sl1 = await ev(() => JSON.parse(localStorage.getItem('bubzi:ink:slots')));
  if (k0 - k1 !== 300 || !own.includes('jabStorm') || sl1[1] !== 'jabStorm') F('buying Jab Storm failed (' + k0 + '→' + k1 + ', slots ' + JSON.stringify(sl1) + ')'); else ok.push('bought Jab Storm for 300, in slot B');
  await p.keyboard.press('Digit1'); await sleep(50);
  const sl2 = await ev(() => JSON.parse(localStorage.getItem('bubzi:ink:slots')));
  if (sl2[0] !== 'jabStorm' || sl2[1] !== 'basic') F('slot swap failed ' + JSON.stringify(sl2)); else ok.push('slot swap ' + JSON.stringify(sl2));
  await p.keyboard.press('Digit2'); await sleep(50);
  await p.keyboard.press('KeyB'); if ((await d()).mode !== 'pick') F('shop back failed');
  await p.keyboard.press('Enter'); await sleep(1800); // start run
  let s = await d(); if (s.mode !== 'fight') F('run did not start');
  if (s.gun !== 'longshot' || s.ammo !== 5) F('equipped gun not used (gun ' + s.gun + ', ammo ' + s.ammo + ')'); else ok.push('run uses Longshot, 5 rounds');
  // ---- every gun fires and hurts ----
  const GUN_IDS = ['sig', 'vipers', 'buzz', 'boom', 'ranger', 'longshot', 'thunder', 'inkjet', 'frost', 'hornet', 'tesla'];
  await ev(() => { window.__inkNoHurt = true; });
  for (const g of GUN_IDS) {
    await ev(() => { const K = window.__bubzi.K; window.__ink.spawn('bruiser'); });
    await sleep(50);
    await ev((g) => window.__ink.setGun(g), g);
    const before = await ev(() => { const z = window.__bubzi.K.dbg().zombies; return z.reduce((a, b) => a + b.hp, 0); });
    // face the newest zombie and fire for 1.2 s
    const t0 = Date.now();
    while (Date.now() - t0 < 1400) { const st = await d(); const z = st.zombies[st.zombies.length - 1]; if (!z) break; const want = z.x > st.hero.x ? 'ArrowRight' : 'ArrowLeft'; await p.keyboard.down(want); await sleep(15); await p.keyboard.up(want); if (Math.abs(z.x - st.hero.x) > 400) { await p.keyboard.down(want); await sleep(120); await p.keyboard.up(want); } await ev(() => window.__ink.fire()); await sleep(60); }
    const after = await ev(() => { const z = window.__bubzi.K.dbg().zombies; return z.reduce((a, b) => a + b.hp, 0); });
    const st = await d();
    if (!(after < before) && st.kills === undefined) F(g + ' did no damage'); else ok.push(g + ' ✓');
    if (g === 'frost' && !st.zombies.some((z) => z.frozen > 0)) F('frost did not slow'); else if (g === 'frost') ok.push('frost slows zombies ✓');
    await ev(() => window.__ink.clear()); await sleep(100);
    if ((await ev(() => window.__bubzi.state())) !== 'playing') { F('game ended during gun test'); break; }
  }
  await ev(() => { window.__inkNoHurt = false; window.__ink.clear(); });
  // ---- items ----
  await ev(() => { for (let i = 0; i < 4; i++) window.__ink.spawn('shuffler'); }); await sleep(300);
  await ev(() => window.__ink.use('freeze')); await sleep(80); s = await d();
  if (!s.zombies.length || !s.zombies.every((z) => z.ice > 0)) F('freeze bomb did not freeze'); else ok.push('freeze ✓');
  await ev(() => window.__ink.use('shield')); const hp0 = (await d()).hero.hp; await ev(() => window.__ink.hurt(30)); s = await d();
  if (s.shieldT <= 0 || s.hero.hp !== hp0) F('shield did not block damage'); else ok.push('shield ✓');
  await sleep(50);
  await ev(() => window.__ink.use('serum')); s = await d(); if (!(s.rage > 9)) F('serum did not enrage'); else ok.push('serum ✓');
  await ev(() => window.__ink.use('turret')); await sleep(600); s = await d(); if (s.turrets !== 1) F('turret not deployed'); else ok.push('turret ✓');
  await ev(() => window.__ink.use('airstrike')); s = await d(); if (s.bombs !== 8) F('airstrike missing bombs'); else ok.push('airstrike ✓');
  await sleep(1600); s = await d(); if (s.bombs !== 0) F('bombs never landed');
  await ev(() => window.__ink.use('grenade')); s = await d(); if (s.nades !== 1) F('grenade not thrown'); else ok.push('grenade ✓');
  await sleep(1300);
  const toFight = async () => { for (let i = 0; i < 20 && (await d()).mode !== 'fight'; i++) { await p.keyboard.press('Enter'); await sleep(150); } };
  await toFight();
  // medkit: needs shield gone; wait it out
  for (let i = 0; i < 100; i++) { const q = await d(); if (q.mode === 'fight' && !(q.shieldT > 0) && !(q.hero.inv > 0)) break; if (q.mode !== 'fight') await p.keyboard.press('Enter'); await sleep(120); }
  await ev(() => window.__ink.hurt(40)); await sleep(800); const hpLow = (await d()).hero.hp;
  await ev(() => window.__ink.use('medkit')); s = await d(); if (!(s.hero.hp > hpLow)) F('medkit did not heal ' + JSON.stringify({ hpLow, hp: s.hero.hp, mode: s.mode, sh: s.shieldT, inv: s.hero.inv, wave: s.wave, story: !!s.story, ex: s.story && s.story.o })); else ok.push('medkit ✓');
  // ---- heart revive ----
  await toFight();
  const hearts0 = (await d()).bag.heart;
  await sleep(800); await ev(() => window.__ink.hurt(99999)); await sleep(100); s = await d();
  if (s.mode !== 'down') F('no revive prompt with hearts (mode ' + s.mode + ')');
  await p.keyboard.press('Enter'); await sleep(100); s = await d();
  if (s.mode !== 'fight' || s.hero.hp <= 0 || s.bag.heart !== hearts0 - 1) F('heart revive failed'); else ok.push('heart revive ✓ (' + hearts0 + '→' + s.bag.heart + ')');
  // give up path with hearts: no heart used, real game over
  await sleep(2800); await toFight(); await ev(() => window.__ink.hurt(99999)); await sleep(100);
  await p.keyboard.press('Backspace'); await sleep(1300);
  if ((await ev(() => window.__bubzi.state())) !== 'over') F('give up did not end the run'); else ok.push('give up ✓');
  const h2 = await ev(() => JSON.parse(localStorage.getItem('bubzi:ink:items')).heart);
  if (h2 !== hearts0 - 1) F('give up consumed a heart');
  console.log(ok.join('\n'));
  if (errs.length) errs.forEach((e) => F('pageerror ' + e));
  console.log(fails.length ? 'FAILED:\n - ' + fails.join('\n - ') : 'ALL INK HEROES FEATURE TESTS PASSED');
  await b.close(); process.exit(fails.length ? 1 : 0);
})();
