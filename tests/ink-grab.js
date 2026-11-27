#!/usr/bin/env node
/* Ink Heroes grab & bite: mash to escape (push combo), bite → infection → antidote, turning loses the level (no continue),
   survivors get grabbed, bitten and turn (or get cured), and the ink cap stops a crowd refilling the special. */
'use strict';
const path = require('path');
const { chromium } = require('playwright');
const URL = 'file://' + path.join(__dirname, '..', 'games', 'ink-heroes.html') + '?test';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
  const errs = [], fails = [], ok = []; p.on('pageerror', (e) => errs.push(e.message));
  const F = (m) => fails.push(m), ev = (f, a) => p.evaluate(f, a), gi = () => ev(() => window.__ink.grabInfo()), inf = () => ev(() => window.__ink.infect());
  const until = async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await fn(); if (v) return v; await sleep(80); } return null; };
  await p.goto(URL); await ev(() => localStorage.setItem('bubzi:ink:items', JSON.stringify({ heart: 1, medkit: 1, grenade: 2, antidote: 3 })));
  await p.click('#bPlay'); await sleep(200);
  // the antidote is a shop item: 120, max 3, key 8
  const it = await ev(() => { const K = window.__bubzi.K; return K.dbg().bag; });
  if (it.antidote !== 3) F('antidote not in the bag ' + JSON.stringify(it)); else ok.push('antidote in the bag (x3)');
  await ev(() => window.__ink.story.start(0)); await sleep(1500);
  // 1) grab → mash → escape with a push combo
  if (!(await ev(() => window.__ink.grab()))) F('no zombie could grab');
  const g0 = await gi(); if (!g0 || g0.need < 6 || g0.need > 60) F('bad tap need ' + JSON.stringify(g0)); else ok.push('grabbed by a ' + g0.z + ', about ' + g0.need + ' taps to escape');
  const t0 = Date.now(); while ((await gi()) && Date.now() - t0 < 12000) { await p.keyboard.press('Space'); await sleep(120); }
  const a = await inf(); if (await gi()) F('mashing did not escape'); else if (a.infect > 0) F('escaped but infected'); else if (a.cmb !== 'push') F('no push combo after the escape'); else ok.push('mashing escapes in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s → push combo');
  await sleep(1500);
  // 2) grab → no taps → bite → infected 45 s
  await ev(() => window.__ink.grab()); await until(async () => !(await gi()), 14000);
  const bI = await inf(); if (!(bI.infect > 40 && bI.infect <= 45)) F('no infection after the bite ' + JSON.stringify(bI)); else ok.push('no taps → bitten, infected ' + Math.round(bI.infect) + ' s');
  // 3) antidote (key 8) cures
  await p.keyboard.press('Digit8'); await sleep(200);
  const cI = await inf(), bag2 = await ev(() => window.__bubzi.K.dbg().bag);
  if (cI.infect > 0 || bag2.antidote !== 2) F('antidote did not cure ' + JSON.stringify(cI) + ' ' + bag2.antidote); else ok.push('antidote cures (x2 left)');
  // 4) ink cap: ten zombies hit at once can't refill the bar, and the special's own hits give nothing
  const ink1 = await ev(() => window.__ink.inkTest('melee')), ink2 = await ev(() => window.__ink.inkTest('special'));
  if (ink1.n < 3 || ink1.ink > 16.5) F('ink cap failed ' + JSON.stringify(ink1)); else ok.push('ink cap: ' + ink1.n + ' zombies hit at once → +' + ink1.ink.toFixed(1) + ' ink');
  if (ink2.ink !== 0) F('special hits still give ink ' + JSON.stringify(ink2)); else ok.push('special hits give no ink');
  // 5) a survivor gets grabbed, bitten, cured by the antidote; another one turns
  await ev(() => window.__inkNoHurt = 1); await sleep(1500);
  if (!(await ev(() => window.__ink.npcFollow(0))) || !(await ev(() => window.__ink.npcGrab()))) F('survivor grab did not start');
  else {
    const bit = await until(async () => { const q = (await ev(() => window.__ink.ppl()))[0]; return q.inf > 0 ? q : null; }, 12000);
    if (!bit) F('grabbed survivor was not bitten'); else ok.push('survivor grabbed → bitten (' + bit.inf.toFixed(1) + ' s to turn)');
    await p.keyboard.press('Digit8'); await sleep(200);
    const q0 = (await ev(() => window.__ink.ppl()))[0]; if (!bit || q0.inf > 0) F('antidote did not cure the survivor'); else ok.push('antidote cures the survivor');
    await ev(() => window.__ink.npcFollow(1)); await sleep(1400); await ev(() => window.__ink.npcGrab(1));
    const z0 = await ev(() => window.__ink.exInfo().zs.length);
    const lost = await until(async () => { const q = (await ev(() => window.__ink.ppl()))[1]; return q.lost ? q : null; }, 30000);
    const z1 = await ev(() => window.__ink.exInfo().zs.length);
    if (!lost) F('bitten survivor never turned'); else if (z1 <= z0 - 1) F('turned survivor did not become a zombie'); else ok.push('untreated survivor turns into a zombie');
  }
  // 6) infection runs out → turning → level lost, no continue
  await ev(() => window.__ink.infect(0.5)); await sleep(3800);
  const st = await ev(() => window.__bubzi.K.state ? window.__bubzi.K.state() : null);
  const over = await p.$('#bAgain, #bRetry, .over, #over'); const cont = await p.$('#bCont');
  const title = await ev(() => document.body.innerText.indexOf('turned into a zombie') >= 0);
  if (!title) F('no "turned into a zombie" game over'); else ok.push('infection runs out → "You turned into a zombie"');
  if (cont && await cont.isVisible()) F('continue (revive) offered after turning'); else ok.push('no revive after turning');
  void st; void over;
  await b.close();
  ok.forEach((m) => console.log('  ✓ ' + m)); fails.forEach((m) => console.log('  ✗ ' + m)); errs.forEach((m) => console.log('  ! ' + m));
  console.log(fails.length || errs.length ? 'ink grab: FAILED' : 'ink grab: all passed'); process.exit(fails.length || errs.length ? 1 : 0);
})();
