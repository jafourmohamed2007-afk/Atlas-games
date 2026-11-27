#!/usr/bin/env node
/* Ink Heroes training + corpses: the TRAINING mode has a dummy that never dies or attacks, free ammo and power,
   live DPS stats, a gun switch and an exit; killed zombies lie flat on the ground and stay there. */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const URL = 'file://' + path.join(__dirname, '..', 'games', 'ink-heroes.html') + '?test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
  const errs = [], fails = [], ok = []; p.on('pageerror', (e) => errs.push(e.message));
  const F = (m) => fails.push(m), ev = (f, a) => p.evaluate(f, a), dbg = () => ev(() => window.__bubzi.K.dbg());
  await p.goto(URL); await ev(() => localStorage.setItem('bubzi:ink:guns', JSON.stringify(['sig', 'vipers'])));
  await p.click('#bPlay'); await sleep(250);
  await p.keyboard.press('KeyT'); await p.keyboard.press('KeyT'); await sleep(100);
  // cycle until training is selected (T rotates story → inf → train)
  for (let i = 0; i < 3 && !(await ev(() => localStorage.getItem('bubzi:ink:mode') || '')).includes('train'); i++) { await p.keyboard.press('KeyT'); await sleep(80); }
  await p.keyboard.press('Enter'); await sleep(900);
  let d = await dbg();
  if (!d.drill || d.zombies.length !== 1) F('training did not start ' + JSON.stringify(d.drill)); else ok.push('training starts with one dummy');
  for (let i = 0; i < 12; i++) { await p.keyboard.press('KeyJ'); await sleep(150); }
  await ev(() => window.__ink.hp(5)); for (let i = 0; i < 6; i++) { await p.keyboard.press('KeyJ'); await sleep(150); }
  await sleep(600); d = await dbg();
  if (!d.drill.hits || !d.drill.total) F('no hits counted'); else ok.push('hits counted: ' + d.drill.hits + ' hits, ' + d.drill.total + ' dmg');
  if (d.zombies.length !== 1 || d.zombies[0].hp <= 0) F('dummy died'); else ok.push('dummy never dies (hp ' + d.zombies[0].hp + ')');
  if (d.hero.hp !== 120 && d.hero.hp < 100) F('hero lost hp'); else ok.push('hero health stays full');
  const a0 = d.hero.ammo; await p.keyboard.down('KeyK'); await sleep(1500); await p.keyboard.up('KeyK'); d = await dbg();
  if (d.hero.ammo < a0) F('ammo went down ' + a0 + '→' + d.hero.ammo); else ok.push('free ammo');
  await p.keyboard.press('KeyG'); await sleep(100); d = await dbg();
  if (d.gun !== 'vipers') F('gun switch failed ' + d.gun); else ok.push('G switches to the next owned gun');
  if (d.hero.ink < 100) F('power not free'); else ok.push('power always ready');
  // exit button
  await ev(() => window.__ink.clear()); await sleep(400); d = await dbg();
  if (d.zombies.length !== 1) F('dummy not respawned'); else ok.push('dummy comes back');
  // corpses (infinity)
  await ev(() => localStorage.setItem('bubzi:ink:mode', JSON.stringify('inf')));
  await p.goto(URL); await p.click('#bPlay'); await sleep(250); await p.keyboard.press('Enter'); await sleep(2200);
  await ev(() => { window.__inkNoHurt = 1; window.__ink.clear(); for (let i = 0; i < 3; i++) window.__ink.spawn('shuffler'); }); await sleep(1800);
  await ev(() => { window.__ink.killAll(); });
  await sleep(5000); d = await dbg();
  if (!d.corpses.length) F('no bodies'); else if (d.corpses.some((c) => Math.abs(Math.abs(c.rot) - Math.PI / 2) > 0.05 || c.y !== 0)) F('bodies not flat ' + JSON.stringify(d.corpses));
  else ok.push(d.corpses.length + ' bodies lie flat on the ground after 5 s');
  if (d.corpses.some((c) => c.a < 1)) F('bodies fading'); else ok.push('bodies stay (no fade)');
  ok.forEach((m) => console.log('  ✓ ' + m)); fails.forEach((m) => console.log('  ✗ ' + m)); errs.forEach((m) => console.log('  ERR ' + m));
  await b.close();
  if (fails.length || errs.length) { console.log('ink train: FAILED'); process.exit(1); } console.log('ink train: all passed');
})();
