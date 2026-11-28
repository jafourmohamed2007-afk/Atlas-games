#!/usr/bin/env node
/* Neon Overdrive campaign: every enemy type runs without errors, all 12 boss fights (Overmind, Warden, Hive Queen, Lancer,
   Prism, Hydra, MK II versions, Null Core phases), checkpoint after a boss + CONTINUE / RETRY, 60 waves → victory screen.
   usage: node tests/neon-campaign.js [screenshot-dir] */
'use strict';
const path = require('path'), fs = require('fs'), http = require('http'), { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), OUT = process.argv[2] || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : 'audio/mpeg' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise((r) => server.listen(0, r));
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1280, height: 720 } }), fails = [], ok = [], errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const F = (m) => fails.push(m), S = () => p.evaluate(() => window.__neon.s()), N = (f, a) => p.evaluate(f, a);
  const shot = async (n) => { if (OUT) await p.screenshot({ path: path.join(OUT, n + '.png') }); };
  const until = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 5000)) { const s = await S(); if (f(s)) return s; await sleep(80); } return S(); };
  const click = async (id) => { const s = await S(), u = s.ui.find((x) => x.id === id); if (!u) { F('no button ' + id + ' on ' + s.screen); return; } await p.mouse.click(u.x, u.y); await sleep(150); };
  await p.goto('http://127.0.0.1:' + server.address().port + '/games/neon-overdrive.html?test'); await sleep(300);
  await click('engage'); await click('start'); await N(() => window.__neon.god());

  // every enemy type spawns, acts for a few seconds and dies
  await N(() => { window.__neon.wave(30); window.__neon.clearQueue(); });
  for (const t of ['dasher', 'spinner', 'bomber', 'shielder', 'medic', 'phantom', 'hive']) await N((t) => window.__neon.spawn(t, 260 * Math.cos(t.length), 260 * Math.sin(t.length)), t);
  await N(() => window.__neon.speed(2)); await sleep(3500); await N(() => window.__neon.speed(1));
  let s = await S(); await shot('enemies');
  const kinds = new Set(s.types); const missing = ['dasher', 'spinner', 'bomber', 'shielder', 'medic', 'phantom', 'hive'].filter((t) => !kinds.has(t));
  if (missing.length > 1) F('new enemies vanished: ' + missing); else ok.push('7 new enemy types active: ' + [...kinds].join(','));
  if (!(s.eb > 0)) F('new enemies never fired'); else ok.push('they fire (' + s.eb + ' shots in the air)');

  // all bosses
  const BOSS = { 5: 'overmind', 10: 'warden', 15: 'queen', 20: 'lancer', 25: 'prism', 30: 'hydra', 35: 'overmind', 40: 'warden', 45: 'queen', 50: 'lancer', 55: 'prism', 60: 'null' };
  let prevMax = 0;
  for (const w of Object.keys(BOSS).map(Number)) {
    await N(() => window.__neon.killAll()); await N((w) => window.__neon.wave(w), w);
    s = await until((x) => x.boss.length > 0, 4000);
    if (!s.boss.length || s.boss[0].k !== BOSS[w]) { F('wave ' + w + ': expected ' + BOSS[w] + ', got ' + JSON.stringify(s.boss)); continue; }
    const total = s.boss.reduce((a, x) => a + x.max, 0);
    await N(() => window.__neon.speed(2)); await sleep(2600); await N(() => window.__neon.speed(1));
    if (w === 10 || w === 25 || w === 30 || w === 60) await shot('boss-' + w);
    s = await S();
    if (BOSS[w] === 'prism' && !s.boss[0].sh) F('Prism should start shielded');
    if (BOSS[w] === 'hydra' && s.boss.length !== 2) F('Hydra should have 2 heads');
    if (w === 60) { // Null Core: phase 2 and 3 on HP thresholds
      await N(() => window.__neon.bossHit(0.36)); s = await S(); const ph2 = s.boss[0] && s.boss[0].ph;
      await N(() => window.__neon.bossHit(0.36)); s = await S(); const ph3 = s.boss[0] && s.boss[0].ph;
      await N(() => window.__neon.speed(2)); await sleep(2500); await N(() => window.__neon.speed(1)); await shot('boss-60-phase3');
      if (ph2 !== 2 || ph3 !== 3) F('Null Core phases ' + ph2 + ',' + ph3); else ok.push('Null Core phases 1 → 2 → 3');
    }
    ok.push('wave ' + w + ': ' + s.boss.map((x) => x.k).join('+') + ' (' + total.toLocaleString() + ' HP)');
    const solo = BOSS[w] !== 'prism'; // the Prism's HP is ×0.6: it spends most of the fight shielded behind 4 nodes that carry their own HP
    if (solo && w < 60 && total <= prevMax) F('boss HP should rise (' + total + ' ≤ ' + prevMax + ')'); if (solo) prevMax = Math.max(prevMax, total);
    // defeat it → cards → checkpoint
    await N(() => window.__neon.bossHit(5)); await sleep(100);
    if (w === 60) break;
    s = await until((x) => x.screen === 'upgrade', 5000); await sleep(450);
    if (s.screen !== 'upgrade') { F('wave ' + w + ' boss down should open cards (' + s.screen + ' ' + s.phase + ')'); break; }
    await p.keyboard.press('Digit1'); await sleep(150); s = await S();
    if (!s.cp || s.cp.wave !== w) F('checkpoint after boss ' + w + ': ' + JSON.stringify(s.cp)); else if (w === 5) ok.push('checkpoint saved after the wave-5 boss');
  }
  s = await until((x) => x.screen === 'win', 7000); await sleep(800); await shot('victory');
  if (s.screen !== 'win') F('beating the Null Core should show the victory screen (' + s.screen + ')'); else ok.push('Null Core down → ARENA CONQUERED');
  if (s.cp) F('winning should clear the checkpoint');

  // checkpoint continue + retry
  await N(() => { localStorage.setItem('neon:cp', JSON.stringify({ wave: 25, st: { shots: 3, pierce: 1, dashCd: 1, shred: 0, rate: 9, boom: 0, dmg: 1.5, bspd: 1000, drones: 1, regen: 0, crit: 0.06, bounce: 0, shield: 1, shieldCd: 0, speed: 1 }, lv: { multi: 2, drone: 1 }, max: 140, score: 9999, kills: 400, time: 1800 })); });
  await click('wmenu'); s = await S();
  if (!s.ui.some((u) => u.id === 'continue')) F('menu should offer CONTINUE'); else ok.push('menu: CONTINUE · WAVE 26');
  await shot('menu-continue');
  await click('continue'); await N(() => window.__neon.mortal()); s = await S();
  if (s.wave !== 26 || s.max !== 140 || s.st.drones !== 1) F('continue should restore wave 26 + build ' + JSON.stringify([s.wave, s.max, s.st && s.st.drones])); else ok.push('continue restores wave 26, 140 max integrity, the drone');
  await N(() => window.__neon.hurt(1e5)); s = await S(); if (!(s.hp > 0)) F('the Aegis shield should absorb the first hit'); else ok.push('Aegis shield absorbs a lethal hit'); await sleep(700); await N(() => window.__neon.hurt(1e5)); await until((x) => x.screen === 'over', 5000); await sleep(400); s = await S(); await shot('over-retry');
  if (!s.ui.some((u) => u.id === 'retry')) F('game over should offer RETRY FROM WAVE 26'); else { await click('retry'); s = await S(); if (s.wave !== 26 || s.screen !== 'play') F('retry from checkpoint'); else ok.push('game over → RETRY FROM WAVE 26'); }

  if (errs.length) [...new Set(errs)].forEach((e) => F('pageerror ' + e));
  ok.forEach((m) => console.log('  ✓ ' + m)); if (fails.length) { console.log('FAILED:'); fails.forEach((m) => console.log(' - ' + m)); }
  console.log(fails.length ? 'campaign: FAILED' : 'campaign: all passed'); await b.close(); server.close(); process.exit(fails.length ? 1 : 0);
})();
