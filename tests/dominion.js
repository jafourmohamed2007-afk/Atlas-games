#!/usr/bin/env node
/* Stick Dominion: campaign map, mining income, training, commands, contact combat, taking command (combo + kick),
   victory (stars, gems, unlock), defeat, Survival waves, upgrades. */
'use strict';
const path = require('path'), { chromium } = require('playwright');
const URL = 'file://' + path.join(__dirname, '..', 'games', 'stick-dominion.html') + '?test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1000, height: 600 } }), errs = [], fails = [], ok = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const d = () => p.evaluate(() => window.__bubzi.K.dbg()), F = (m) => fails.push(m), ev = (f, a) => p.evaluate(f, a), fast = (x) => ev((v) => { window.__bubzi.K.fastX = v; }, x);
  await p.goto(URL); await sleep(300); await p.click('#bPlay'); await sleep(200);
  let s = await d(); if (s.phase !== 'map') F('should open on the campaign map (' + s.phase + ')'); else ok.push('campaign map first');
  await p.keyboard.press('Enter'); await sleep(200); s = await d();
  if (s.phase !== 'battle' || s.units.filter((u) => u.s === 0).length !== 3) F('level 1 should start with 2 Diggers + 1 Blade'); else ok.push('level 1 starts (2 Diggers, 1 Blade)');
  // mining: diggers bring gold home
  const g0 = s.gold; await fast(4); await sleep(6000); await fast(1); s = await d();
  if (!(s.gold > g0)) F('diggers brought no gold (' + g0 + ' → ' + s.gold + ')'); else ok.push('mining income ' + g0 + ' → ' + s.gold);
  // training
  await ev(() => window.__sd.gold(500)); await p.keyboard.press('Digit2'); await p.keyboard.press('Digit2'); s = await d();
  if (s.q !== 2) F('Digit2 should queue 2 Blades (' + s.q + ')'); else ok.push('training queue');
  await fast(4); await sleep(2500); await fast(1); s = await d(); if (s.units.filter((u) => u.s === 0 && u.t === 'blade').length < 3) F('trained Blades did not appear'); else ok.push('Blades trained');
  // commands
  await p.keyboard.press('KeyC'); s = await d(); if (s.cmd[0] !== 'attack') F('C should order Attack'); else ok.push('Attack command');
  const x0 = Math.max(...s.units.filter((u) => u.s === 0 && u.t === 'blade').map((u) => u.x)); await fast(3); await sleep(1500); await fast(1); s = await d();
  if (!(Math.max(...s.units.filter((u) => u.s === 0 && u.t === 'blade').map((u) => u.x)) > x0 + 100)) F('the army did not march on Attack'); else ok.push('army marches');
  await p.keyboard.press('KeyZ'); s = await d(); if (s.cmd[0] !== 'defend') F('Z should order Defend'); else ok.push('Defend command');
  // contact combat: a staged fight must end with someone down
  await ev(() => { window.__sd.spawn('blade', 0, 1500); window.__sd.spawn('blade', 1, 1560); window.__sd.cmd('hold'); window.__sd.ecmd('attack'); }); const k0 = (await d()).kills; await fast(3); await sleep(4000); await fast(1); s = await d();
  const lost = s.units.filter((u) => u.x > 1400 && u.x < 1700).length;
  if (s.kills === k0 && lost >= 2) F('staged duel: no one fell (contact hits missing?)'); else ok.push('contact hits: the duel ended');
  // take command: combo + kick (enemies sent home first so the soldier is not in the thick of it)
  await ev(() => { window.__sd.ecmd('defend'); window.__sd.cmd('defend'); }); await fast(4); await sleep(1500); await fast(1);
  await p.keyboard.press('KeyT'); let me = await ev(() => window.__sd.me()); if (!me) F('T should take command of a soldier'); else ok.push('took command');
  await p.keyboard.press('KeyJ'); await sleep(60); me = await ev(() => window.__sd.me()); if (!me || !me.cur) F('J did not start a combo strike'); else ok.push('combo strike: ' + me.cur);
  await sleep(700); await p.keyboard.press('KeyK'); await sleep(60); me = await ev(() => window.__sd.me()); if (!me || !/kick/.test(me.cur || '')) F('K did not kick (' + (me && me.cur) + ')'); else ok.push('kick');
  await sleep(700); me = await ev(() => window.__sd.me()); await p.keyboard.down('KeyA'); await sleep(400); await p.keyboard.up('KeyA'); const me2 = await ev(() => window.__sd.me()); if (!me2 || !(me2.x < me.x - 20)) F('A did not move your soldier'); else ok.push('your soldier walks');
  await p.keyboard.press('KeyT'); if (await ev(() => window.__sd.me())) F('T should release command'); else ok.push('released command');
  // victory → stars, gems, unlock
  await ev(() => window.__sd.monHit(1, 1e6)); await sleep(300); s = await d();
  if (s.phase !== 'end' || !s.end || !s.end.won || s.end.st < 1 || !(s.gems > 0) || s.unl !== 1) F('victory flow ' + JSON.stringify([s.phase, s.end, s.gems, s.unl])); else ok.push('victory: ' + s.end.st + ' stars, +' + s.end.gems + ' gems, level 2 unlocked');
  await p.keyboard.press('Enter'); await sleep(200); s = await d(); if (s.phase !== 'battle') F('Enter on victory should start the next level'); else ok.push('next level');
  // defeat
  await ev(() => window.__sd.monHit(0, 1e6)); await sleep(300); s = await d(); if (s.phase !== 'end' || s.end.won) F('defeat flow'); else ok.push('defeat when your Monument falls');
  await p.keyboard.press('Backspace'); await sleep(200); s = await d(); if (s.phase !== 'map') F('Backspace should return to the map'); else ok.push('back to the map');
  // upgrades with gems
  const gm = s.gems; await p.keyboard.press('KeyU'); await sleep(150); s = await d(); const up = s.ui.find((u) => u.act === 'buyUpg');
  await p.mouse.click(up.x, up.y); await sleep(100); s = await d(); if (!(s.gems < gm)) F('buying an upgrade did not spend gems'); else ok.push('upgrade bought (' + gm + ' → ' + s.gems + ' gems)');
  await p.keyboard.press('Backspace'); await sleep(100);
  // survival: waves arrive
  await p.keyboard.press('KeyS'); await sleep(200); await fast(5); await sleep(3500); await fast(1); s = await d();
  if (s.phase !== 'battle' || !(s.wave >= 1) || !s.units.some((u) => u.s === 1)) F('Survival waves ' + JSON.stringify([s.phase, s.wave])); else ok.push('Survival wave ' + s.wave);
  if (errs.length) errs.forEach((e) => F('pageerror ' + e));
  ok.forEach((m) => console.log('  ✓ ' + m)); if (fails.length) { console.log('FAILED:'); fails.forEach((m) => console.log(' - ' + m)); }
  console.log(fails.length ? 'dominion: FAILED' : 'dominion: all passed'); await b.close(); process.exit(fails.length ? 1 : 0);
})();
