#!/usr/bin/env node
/* Ink Heroes story-mode test: map, cutscenes, every objective type, stars, unlocks, every boss, retry, Nightmare, 2.5D themes. */
'use strict';
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const URL = 'file://' + path.join(__dirname, '..', 'games', 'ink-heroes.html') + '?test';
const SHOTS = process.env.SHOTS || '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 600 } });
  const errs = [], fails = [], ok = []; p.on('pageerror', (e) => errs.push(e.message));
  const F = (m) => fails.push(m), d = () => p.evaluate(() => window.__bubzi.K.dbg()), ev = (f, a) => p.evaluate(f, a);
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, n + '.png') }); };
  const waitMode = async (m, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 8000)) { const s = await d(); if (s.mode === m) return s; await sleep(60); } return d(); };
  // a small fighting bot (no damage) used to play real levels
  const fight = async (ms, until) => {
    const t0 = Date.now(); let held = null; const hold = async (k) => { if (held === k) return; if (held) await p.keyboard.up(held); held = k; if (k) await p.keyboard.down(k); };
    while (Date.now() - t0 < ms) {
      const s = await d(); if (s.mode !== 'fight' || (until && until(s))) break;
      const h = s.hero; let near = null, nd = 1e9; s.zombies.forEach((z) => { const dd = Math.abs(z.x - h.x); if (dd < nd) { nd = dd; near = z; } });
      if (h.ink >= 100) await p.keyboard.press('KeyL');
      if (near) { const dir = near.x > h.x ? 'ArrowRight' : 'ArrowLeft'; if (nd > 70) await hold(dir); else { await hold(null); if ((near.x > h.x ? 1 : -1) !== h.face) { await p.keyboard.down(dir); await sleep(30); await p.keyboard.up(dir); } await p.keyboard.press('KeyJ'); } }
      else await hold(null);
      await sleep(25);
    }
    await hold(null);
  };
  await p.goto(URL); await ev(() => localStorage.setItem('bubzi:cur:ink-heroes', '500'));
  await p.click('#bPlay'); await sleep(200);
  let s = await d();
  if (s.mode !== 'pick' || !s.storyMode) F('story should be the default mode on the pick screen'); else ok.push('pick screen defaults to STORY');
  await shot('01-pick');
  await p.keyboard.press('Enter'); s = await d();
  if (s.mode !== 'map' || s.mapCh !== 0 || s.mapSel !== 0) F('FIGHT did not open the chapter map ' + JSON.stringify([s.mode, s.mapCh, s.mapSel])); else ok.push('map opens at 1-1');
  await shot('02-map-ch1');
  // locked levels cannot be played
  await p.keyboard.press('ArrowRight'); s = await d(); if (s.mapSel !== 0) F('could select a locked level'); else ok.push('locked levels stay locked');
  // ---- 1-1: prologue cutscene → clear level, played for real ----
  await p.keyboard.press('Enter'); s = await d();
  if (s.mode !== 'cut' || !s.cut || s.cut.who !== 'nar' || s.cut.n !== 5) F('prologue cutscene missing ' + JSON.stringify(s.cut)); else ok.push('prologue cutscene (5 lines)');
  await sleep(400); await shot('03-cut-narrator');
  for (let i = 0; i < 4; i++) { await p.keyboard.press('Enter'); await sleep(30); await p.keyboard.press('Enter'); await sleep(30); }
  s = await d(); if (!s.cut || s.cut.i < 2) F('cutscene did not advance'); await sleep(600); await shot('04-cut-speaker');
  await p.keyboard.press('Backspace'); s = await d();
  if (s.mode !== 'fight' || !s.story || s.story.idx !== 0 || s.story.o !== 'c') F('level 1-1 did not start after the cutscene'); else ok.push('Skip → level 1-1 starts');
  await ev(() => { window.__inkNoHurt = true; });
  await sleep(2500); await shot('05-explore-street');
  // ---- chapter 1 is explored on foot: houses, searching, survivors, the H pad and the helicopter ----
  const ex = () => ev(() => window.__ink.exInfo()), tp = (x) => ev((v) => window.__ink.exTp(v), x), use = () => ev(() => window.__ink.exUse());
  let X = await ex();
  if (!X || X.scene !== -1 || X.houses.length < 6 || X.total < 1 || X.pads.length < 2) F('1-1 should be an exploration street ' + JSON.stringify(X && [X.scene, X.houses.length, X.total, X.pads])); else ok.push('1-1 street: ' + X.houses.length + ' houses, ' + X.total + ' survivors, ' + X.pads.length + ' H pads');
  if (!X.zs.length || !X.zs.every((z) => z.sleep)) F('street zombies should start asleep'); else ok.push(X.zs.length + ' sleeping zombies on the street');
  await tp(X.houses[0].x); await sleep(100); X = await ex(); if (X.near !== 'door') F('door prompt missing at a house'); else ok.push('door prompt at a house');
  await p.keyboard.press('KeyE'); await sleep(700); X = await ex();
  if (X.scene !== 0 || X.hero > 200) F('E did not enter the house ' + JSON.stringify([X.scene, X.hero])); else ok.push('E enters the house (interior ' + Math.round(X.w) + ' wide)');
  await shot('06-explore-inside');
  for (const fx of X.houses[0].furn) { await tp(fx); await sleep(60); await ev(() => window.__ink.clear()); await p.keyboard.press('KeyE'); await sleep(120); }
  X = await ex(); if (X.found !== X.houses[0].furn.length) F('searching furniture failed ' + X.found); else ok.push('searched ' + X.found + ' pieces of furniture');
  // every house: search it all, collect its survivor and walk them to the nearest pad
  for (const h of X.houses) {
    X = await ex(); if (X.scene !== -1) { await tp(120); await use(); await sleep(650); }
    X = await ex(); await tp(X.houses[h.id].x); await use(); await sleep(650); X = await ex();
    if (X.scene !== h.id) { F('could not enter house ' + h.id); continue; }
    for (const fx of X.houses[h.id].furn) { await tp(fx); await sleep(40); await ev(() => window.__ink.clear()); await use(); await sleep(60); }
    for (const q of X.ppl) if (q.sc === h.id && q.st === 'hide') { await tp(q.x - 60); await sleep(300); }
    X = await ex();
    if (X.ppl.some((q) => q.st === 'follow')) {
      await tp(120); await use(); await sleep(700); X = await ex();
      if (!X.ppl.filter((q) => q.st === 'follow').every((q) => q.sc === -1)) F('followers did not leave the house with the hero');
    }
  }
  // the whole group walks to the nearest pad at the end (rescuing the last one wins the level)
  X = await ex(); if (X.scene !== -1) { await tp(120); await use(); await sleep(650); }
  X = await ex(); { const pad = X.pads.reduce((a, x) => Math.abs(x - X.hero) < Math.abs(a - X.hero) ? x : a);
    await tp(pad); await sleep(400);
    let heli = false; for (let t = 0; t < 60; t++) { X = await ex(); if (X.heli) heli = true; if (heli && !X.heli) break; await sleep(200); }
    if (!heli) F('no helicopter came to the pad'); }
  X = await ex();
  if (X.saved !== X.total) F('not every survivor was rescued ' + X.saved + '/' + X.total); else ok.push('helicopter rescued ' + X.saved + '/' + X.total + ' survivors');
  if (X.found !== X.loot) F('not everything searched ' + X.found + '/' + X.loot);
  s = await waitMode('win', 5000);
  if (s.mode !== 'win' || !s.win || s.win.stars !== 3) F('1-1 should be won with 3 stars after rescuing everyone and searching everything ' + JSON.stringify([s.mode, s.win])); else ok.push('1-1 won: ' + s.win.stars + '★, +' + s.win.coins + ' coins');
  await sleep(1400); await shot('07-win');
  let pr = await ev(() => window.__ink.story.prog());
  if (pr.u !== 1 || !pr.s[0]) F('progress not saved ' + JSON.stringify(pr)); else ok.push('progress saved, 1-2 unlocked');
  await p.keyboard.press('Enter'); s = await d(); X = await ex();
  if (s.mode !== 'fight' || s.story.idx !== 1 || !X || X.houses.length < 7) F('NEXT → 1-2 should be a longer street ' + JSON.stringify([s.mode, s.story, X && X.houses.length])); else ok.push('NEXT → 1-2 street with ' + X.houses.length + ' houses');
  // ---- arena objectives (chapter 2 and later) ----
  await ev(() => window.__ink.story.start(18)); await sleep(2200); s = await d();
  if (s.story.o !== 'r' || s.cages.length !== 3) F('3-3 rescue should have 3 cages ' + JSON.stringify([s.story, s.cages])); else ok.push('3-3 rescue with 3 cages');
  if (await ex()) F('chapter 3 should not use exploration yet');
  await ev(() => window.__ink.story.cages()); s = await waitMode('win', 4000);
  if (s.mode !== 'win') F('freeing all survivors did not win'); else ok.push('freeing survivors wins');
  await ev(() => window.__ink.story.start(17)); s = await d();
  if (s.story.o !== 's' || Math.round(s.story.timer) !== 45) F('3-2 survive timer wrong ' + JSON.stringify(s.story)); else ok.push('3-2 survive 45 s');
  await sleep(1500); s = await d(); if (!(s.story.timer < 44)) F('survive timer is not counting down');
  await ev(() => window.__ink.story.timer(0.2)); s = await waitMode('win', 4000); if (s.mode !== 'win') F('survive timer end did not win'); else ok.push('surviving the timer wins');
  // ---- 3-5 defend: lose the lantern → game over → retry from the map ----
  await ev(() => { window.__inkNoHurt = false; window.__ink.story.start(20); }); await sleep(2600); s = await d();
  if (s.story.o !== 'd' || !s.lantern) F('defend level has no lantern'); else ok.push('3-5 defend: Ink Lantern ' + s.lantern + ' HP');
  await shot('08-defend');
  await ev(() => window.__ink.story.lanternHit(99999)); await sleep(1600);
  if ((await ev(() => window.__bubzi.state())) !== 'over') F('lantern destroyed but no game over'); else ok.push('lantern out → level failed');
  await shot('09-failed');
  await p.click('#bAgain'); await sleep(400); s = await d();
  if (s.mode !== 'map' || s.mapCh !== 2 || s.mapSel !== 4) F('retry did not return to the map at 3-5 ' + JSON.stringify([s.mode, s.mapCh, s.mapSel])); else ok.push('Play again → map at 3-5');
  // ---- modifiers ----
  await ev(() => window.__ink.story.start(28)); await sleep(2400); s = await d();
  if (s.story.m !== 'nogun') F('4-5 should be NO GUNS'); else { const a0 = s.hero.ammo; await ev(() => window.__ink.fire()); s = await d(); if (s.hero.ammo !== a0) F('gun fired in a no-gun level'); else ok.push('NO GUNS modifier blocks shooting'); }
  await ev(() => window.__ink.story.start(9)); await sleep(2400); s = await d(); if (s.story.m !== 'dark' || s.theme !== 'metro' || !(await ex())) F('2-2 should be a dark metro street'); else ok.push('2-2 BLACKOUT metro street with ' + (await ex()).houses.length + ' buildings');
  await shot('10-dark-metro');
  // ---- every boss ----
  await ev(() => { window.__inkNoHurt = true; });
  const BOSSES = [[7, ['gravemaw'], 'rook'], [15, ['conductor'], 'vex'], [23, ['hollow', 'hollow'], 'juno'], [31, ['mother'], null], [39, ['nullk'], null]];
  for (const [idx, types, unlock] of BOSSES) {
    await ev((i) => window.__ink.story.start(i), idx);
    let XB = await ex(); if (XB) { await ev(() => window.__ink.exRescueAll()); await tp(XB.bossX - 450); }
    let t0 = Date.now(); while (Date.now() - t0 < 20000) { s = await d(); if (s.story.bossSpawned && s.bosses.length >= types.length) break; await fight(400); }
    s = await d(); const got = s.bosses.map((z) => z.t).sort().join(',');
    if (got !== types.slice().sort().join(',')) { F('boss level ' + idx + ' spawned ' + got); continue; }
    await fight(4000); s = await d();
    const seen = new Set(); if (idx === 39) { t0 = Date.now(); while (Date.now() - t0 < 6000) { s = await d(); s.bosses.forEach((z) => z.st && seen.add(z.st)); await sleep(50); } }
    await shot('11-boss-' + types[0]);
    if (idx === 39) {
      if (seen.size < 2) F('NULL AI did not change states (' + [...seen] + ')'); else ok.push('NULL AI states: ' + [...seen].join(', '));
      await ev(() => window.__ink.story.killBoss(0.55)); await sleep(1500); s = await d();
      const clones = s.zombies.filter((z) => z.t === 'nclone').length;
      if (!s.bosses[0] || !s.bosses[0].phase2 || clones < 2) F('NULL phase 2 / clones missing (' + clones + ')'); else ok.push('NULL phase 2 spawns ' + clones + ' clones');
      await shot('12-null-phase2');
    }
    await ev(() => window.__ink.story.killBoss()); if (types.length > 1) { await sleep(300); s = await d(); await ev(() => window.__ink.story.killBoss()); }
    s = await waitMode('cut', 5000);
    if (s.mode !== 'cut' || !s.cut) F('no chapter-ending cutscene after boss ' + types[0]); else ok.push(types[0] + ' beaten → ending cutscene (' + s.cut.n + ' lines)');
    if (idx === 39) { await sleep(500); await shot('13-ending'); }
    await p.keyboard.press('Backspace'); s = await waitMode('win', 3000);
    if (s.mode !== 'win') { F('no results after boss ' + types[0] + ' mode=' + s.mode + ' ' + JSON.stringify(s.story) + ' bosses=' + JSON.stringify(s.bosses)); continue; }
    if (unlock && s.win.unlock !== unlock) F('chapter end should unlock ' + unlock + ' (got ' + s.win.unlock + ')'); else if (unlock) ok.push(unlock + ' joins the team');
    if (idx === 39 && !s.win.ending) F('final boss did not trigger the ending');
  }
  pr = await ev(() => window.__ink.story.prog()); const heroes = await ev(() => JSON.parse(localStorage.getItem('bubzi:ink:heroes')));
  if (!pr.nm) F('Nightmare not unlocked after the ending'); else ok.push('ending unlocks Nightmare');
  if (!['rook', 'vex', 'juno'].every((h) => heroes.includes(h))) F('story unlocks missing ' + heroes);
  await shot('14-win-ending');
  // ---- Nightmare ----
  await ev(() => window.__ink.story.map(0)); await p.keyboard.press('KeyN'); s = await d();
  if (!s.nmOn) F('Nightmare toggle failed'); else ok.push('Nightmare toggle on the map');
  await shot('15-map-nightmare');
  await ev(() => window.__ink.story.start(0, true)); await sleep(300); s = await d();
  if (!(s.story.eff >= 11)) F('Nightmare is not harder (eff ' + s.story.eff + ')'); else ok.push('Nightmare 1-1 = threat ' + s.story.eff);
  // ---- every theme renders (fight + map), portrait phone too ----
  for (const [i, th] of [[0, 'ruins'], [8, 'metro'], [16, 'neon'], [24, 'desert'], [32, 'margin']]) {
    await ev((i) => window.__ink.story.start(i, false), i); await sleep(2600); s = await d(); if (s.theme !== th) F('theme ' + th + ' not used'); await shot('20-theme-' + th);
    await ev((i) => window.__ink.story.map(i), i); await sleep(100); await shot('21-map-' + th);
  }
  await p.setViewportSize({ width: 390, height: 780 }); await ev(() => window.dispatchEvent(new Event('resize')));
  await ev(() => window.__ink.story.map(17)); await sleep(200); await shot('30-phone-map');
  await ev(() => window.__ink.story.start(24)); await sleep(2600); await shot('31-phone-fight');
  await ev(() => window.__ink.story.play(0)); await sleep(100); s = await d(); // replay: no cutscene the 2nd time
  if (s.mode !== 'fight') F('replaying 1-1 should skip the cutscene');
  await ev(() => window.__ink.story.start(0)); await ev(() => { window.__ink.story.win(); }); await waitMode('win', 4000); await sleep(1500); await shot('32-phone-win');
  await b.close();
  console.log(ok.map((x) => '  ✓ ' + x).join('\n'));
  if (errs.length) console.log('PAGE ERRORS:\n' + errs.join('\n'));
  if (fails.length || errs.length) { console.log('FAILED:\n' + fails.map((x) => '  ✗ ' + x).join('\n')); process.exit(1); }
  console.log('ink story: all passed');
})();
