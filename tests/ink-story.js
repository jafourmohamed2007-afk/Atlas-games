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
  // a small fighting bot (god mode on) used to play real levels
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
  await p.goto(URL); await ev(() => localStorage.setItem('bubzi:coins', '500'));
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
  await ev(() => { window.__inkGod = true; });
  await sleep(2500); await shot('05-fight-ruins');
  await fight(60000);
  s = await waitMode('win', 4000);
  if (s.mode !== 'win' || !s.win || s.win.stars < 1 || s.win.coins <= 0) F('1-1 was not won by clearing every zombie ' + JSON.stringify([s.mode, s.story, s.zombies.length, s.queue])); else ok.push('1-1 cleared for real: ' + s.win.stars + '★, +' + s.win.coins + ' coins');
  await sleep(1400); await shot('06-win');
  let pr = await ev(() => window.__ink.story.prog());
  if (pr.u !== 1 || !pr.s[0]) F('progress not saved ' + JSON.stringify(pr)); else ok.push('progress saved, 1-2 unlocked');
  // ---- 1-2 rescue (no cutscene) ----
  await p.keyboard.press('Enter'); s = await d();
  if (s.mode !== 'fight' || s.story.idx !== 1 || s.story.o !== 'r' || s.cages.length !== 3) F('1-2 rescue did not start ' + JSON.stringify([s.mode, s.story, s.cages])); else ok.push('NEXT → 1-2 rescue with 3 cages');
  await sleep(2200); await shot('07-rescue');
  await ev(() => window.__ink.story.cages()); s = await waitMode('win', 4000);
  if (s.mode !== 'win') F('freeing all survivors did not win'); else ok.push('freeing survivors wins');
  // ---- 1-3 survive ----
  await p.keyboard.press('Enter'); s = await d();
  if (s.story.o !== 's' || Math.round(s.story.timer) !== 40) F('1-3 survive timer wrong ' + JSON.stringify(s.story)); else ok.push('1-3 survive 40 s');
  await sleep(1500); s = await d(); if (!(s.story.timer < 39)) F('survive timer is not counting down');
  await ev(() => window.__ink.story.timer(0.2)); s = await waitMode('win', 4000); if (s.mode !== 'win') F('survive timer end did not win'); else ok.push('surviving the timer wins');
  // ---- 1-5 defend: lose the lantern → game over → retry from the map ----
  await ev(() => { window.__inkGod = false; window.__ink.story.start(4); }); await sleep(2600); s = await d();
  if (s.story.o !== 'd' || !s.lantern) F('defend level has no lantern'); else ok.push('1-5 defend: Ink Lantern ' + s.lantern + ' HP');
  await shot('08-defend');
  await ev(() => window.__ink.story.lanternHit(99999)); await sleep(1600);
  if ((await ev(() => window.__bubzi.state())) !== 'over') F('lantern destroyed but no game over'); else ok.push('lantern out → level failed');
  await shot('09-failed');
  await p.click('#bAgain'); await sleep(400); s = await d();
  if (s.mode !== 'map' || s.mapCh !== 0 || s.mapSel !== 4) F('retry did not return to the map at 1-5 ' + JSON.stringify([s.mode, s.mapCh, s.mapSel])); else ok.push('Play again → map at 1-5');
  // ---- modifiers ----
  await ev(() => window.__ink.story.start(5)); await sleep(2400); s = await d();
  if (s.story.m !== 'nogun') F('1-6 should be NO GUNS'); else { const a0 = s.hero.ammo; await ev(() => window.__ink.fire()); s = await d(); if (s.hero.ammo !== a0) F('gun fired in a no-gun level'); else ok.push('NO GUNS modifier blocks shooting'); }
  await ev(() => window.__ink.story.start(9)); await sleep(2400); s = await d(); if (s.story.m !== 'dark' || s.theme !== 'metro') F('2-2 should be a dark metro level'); else ok.push('2-2 BLACKOUT in the metro');
  await shot('10-dark-metro');
  // ---- every boss ----
  await ev(() => { window.__inkGod = true; });
  const BOSSES = [[7, ['gravemaw'], 'rook'], [15, ['conductor'], 'vex'], [23, ['hollow', 'hollow'], 'juno'], [31, ['mother'], null], [39, ['nullk'], null]];
  for (const [idx, types, unlock] of BOSSES) {
    await ev((i) => window.__ink.story.start(i), idx);
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
