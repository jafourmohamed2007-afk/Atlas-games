#!/usr/bin/env node
/* Arrow Rampart meta: hub + 5 modes, shop (bow, special arrow, upgrade, outfit), Rampart Pass claim, special arrows, Headhunter quiver, Time Attack timer. */
'use strict';
const path = require('path'), { chromium } = require('playwright');
const URL = 'file://' + path.join(__dirname, '..', 'games', 'arrow-rampart.html') + '?test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 900, height: 540 } }), errs = [], fails = [], ok = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const d = () => p.evaluate(() => window.__bubzi.K.dbg()), F = (m) => fails.push(m), key = async (k) => { await p.keyboard.press(k); await sleep(60); };
  const coins = () => p.evaluate(() => JSON.parse(localStorage.getItem('bubzi:cur:arrow-rampart')));
  await p.goto(URL); await p.evaluate(() => { localStorage.setItem('bubzi:cur:arrow-rampart', '5000'); localStorage.setItem('bubzi:ar:xp', '250'); }); await p.reload(); await sleep(300);
  await p.click('#bPlay'); await sleep(200);
  let s = await d(); if (s.phase !== 'hub') F('run should open on the hub (' + s.phase + ')'); else ok.push('hub first');
  // shop: bow, special arrow, upgrade, outfit
  await key('KeyS'); s = await d(); if (s.phase !== 'shop') F('S did not open the shop');
  await key('ArrowRight'); let c0 = await coins(); await key('Enter'); s = await d(); let c1 = await coins();
  if (s.bow !== 'recurve' || c0 - c1 !== 300) F('buying the Recurve Bow failed ' + JSON.stringify([s.bow, c0 - c1])); else ok.push('bought + equipped Recurve Bow (300)');
  await key('KeyE'); const bomb0 = s.bag.bomb; await key('Enter'); s = await d(); if (s.bag.bomb !== bomb0 + 1) F('buying a Bomb Arrow failed'); else ok.push('bought a Bomb Arrow');
  await key('KeyE'); await key('Enter'); s = await d(); const upg = await p.evaluate(() => JSON.parse(localStorage.getItem('bubzi:ar:upg'))); if (!upg || upg.wall !== 1) F('wall upgrade failed'); else ok.push('wall upgrade Lv1');
  await key('KeyE'); await key('ArrowRight'); await key('Enter'); const of = await p.evaluate(() => JSON.parse(localStorage.getItem('bubzi:ar:outfit'))); if (of !== 'crimson') F('outfit not equipped (' + of + ')'); else ok.push('bought Crimson outfit');
  await key('Backspace');
  // pass: 250 XP = tier 2 → claim all
  s = await d(); if (s.tier !== 2) F('250 XP should be tier 2 (' + s.tier + ')');
  await key('KeyT'); c0 = await coins(); await key('Enter'); c1 = await coins(); const cl = await p.evaluate(() => JSON.parse(localStorage.getItem('bubzi:ar:claimed')));
  if (!cl || cl.length !== 2 || !(c1 > c0 || (await d()).bag.ice > 2)) F('pass claim failed ' + JSON.stringify(cl)); else ok.push('pass tiers 1-2 claimed');
  await key('Backspace');
  // every mode starts
  for (const m of ['siege', 'boss', 'head', 'night', 'time']) { s = await d(); if (s.mode !== m) F('mode order: expected ' + m + ' got ' + s.mode); await key('ArrowRight'); }
  s = await d(); if (s.mode !== 'siege') F('mode selection should wrap');
  // Siege: start, arm a bomb arrow and shoot it
  await key('Enter'); s = await d(); if (s.phase !== 'build' || s.maxHp !== 120) F('Siege did not start with the upgraded wall ' + JSON.stringify([s.phase, s.maxHp])); else ok.push('Siege starts, wall 120');
  const b0 = s.bag.bomb; await key('Digit1'); s = await d(); if (s.armed !== 'bomb') F('1 did not arm the bomb arrow');
  await p.keyboard.down('Space'); await sleep(400); await p.keyboard.up('Space'); await sleep(100); s = await d();
  if (s.bag.bomb !== b0 - 1 || s.armed) F('shooting did not use the bomb arrow ' + JSON.stringify([b0, s.bag.bomb, s.armed])); else ok.push('bomb arrow fired');
  // Headhunter: quiver at the first wave; Time Attack: the clock runs out and ends the run
  await p.evaluate(() => { localStorage.setItem('bubzi:ar:mode', '"head"'); window.__bubzi.over(); }); await sleep(2500);
  await p.evaluate(() => window.__bubzi.start()); await sleep(200); await key('Enter'); await sleep(2600); s = await d();
  if (s.mode !== 'head' || !(s.quiver > 0)) F('Headhunter should give a quiver ' + JSON.stringify([s.mode, s.quiver])); else ok.push('Headhunter quiver ' + s.quiver);
  await p.evaluate(() => { localStorage.setItem('bubzi:ar:mode', '"time"'); window.__bubzi.over(); }); await sleep(2500);
  await p.evaluate(() => window.__bubzi.start()); await sleep(200); await key('Enter'); await sleep(500); s = await d();
  if (s.mode !== 'time' || !(s.timeLeft > 80 && s.timeLeft < 90)) F('Time Attack clock ' + JSON.stringify([s.mode, s.timeLeft])); else ok.push('Time Attack clock running');
  await p.evaluate(() => { window.__bubzi.K.fastX = 60; }); await sleep(2500);
  const st = await p.evaluate(() => window.__bubzi.state()); if (st === 'playing') F('Time Attack did not end at 0'); else ok.push('Time Attack ends (' + st + ')');
  if (errs.length) errs.forEach((e) => F('pageerror ' + e));
  ok.forEach((m) => console.log('  ✓ ' + m)); if (fails.length) { console.log('FAILED:'); fails.forEach((m) => console.log(' - ' + m)); }
  console.log(fails.length ? 'arrow meta: FAILED' : 'arrow meta: all passed'); await b.close(); process.exit(fails.length ? 1 : 0);
})();
