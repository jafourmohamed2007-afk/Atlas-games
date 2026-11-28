#!/usr/bin/env node
/* Neon Overdrive: Voice Protocol — canvas-only UI, boot screen (no key; never calls the API), ElevenLabs voice pack + SFX bank,
   movement + dash, firing, waves, upgrade cards, announcer queue, boss, game over, phone FIRE / DASH buttons and thumbs.
   Serves the repo over http (the voice pack is fetched) — usage: node tests/neon.js [screenshot-dir] */
'use strict';
const path = require('path'), fs = require('fs'), http = require('http'), { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), OUT = process.argv[2] || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.webp': 'image/webp', '.json': 'application/json' };
const server = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise((r) => server.listen(0, r)); const URL = 'http://127.0.0.1:' + server.address().port + '/games/neon-overdrive.html?test';
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), fails = [], ok = [], errs = [];
  const F = (m) => fails.push(m), shot = async (p, n) => { if (OUT) await p.screenshot({ path: path.join(OUT, n + '.png') }); };
  async function page(vp) {
    const ctx = await b.newContext({ viewport: vp || { width: 1280, height: 720 } }); const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(e.message));
    await p.route('https://api.elevenlabs.io/**', (r) => { errs.push('the game called the ElevenLabs API'); r.abort(); });
    await p.goto(URL); await sleep(300); return p;
  }
  const S = (p) => p.evaluate(() => window.__neon.s());
  const clickUi = async (p, id) => { const s = await S(p), u = s.ui.find((x) => x.id === id); if (!u) { F('no canvas button ' + id + ' on ' + s.screen); return; } await p.mouse.click(u.x, u.y); await sleep(120); };
  const until = async (p, f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 5000)) { const s = await S(p); if (f(s)) return s; await sleep(80); } return S(p); };

  /* ---- boot screen: canvas only, no key, one ENGAGE button; ElevenLabs voice pack + SFX bank load */
  let p = await page(), s = await S(p);
  const dom = await p.evaluate(() => ({ btn: document.querySelectorAll('button,input,select,textarea,form').length, canvas: document.querySelectorAll('canvas').length }));
  if (dom.btn || dom.canvas !== 1) F('DOM should hold only one canvas ' + JSON.stringify(dom)); else ok.push('one canvas, zero HTML controls');
  if (s.screen !== 'boot' || s.ui.map((u) => u.id).join() !== 'engage') F('boot screen should only offer ENGAGE ' + JSON.stringify(s.ui.map((u) => u.id))); else ok.push('NEURAL LINK boot screen: one ENGAGE button, no key box');
  await shot(p, 'boot');
  await clickUi(p, 'engage'); s = await S(p);
  if (s.screen !== 'menu') F('ENGAGE should open the menu'); else ok.push('ENGAGE → menu');
  s = await until(p, (x) => x.pack >= 14 && x.heavy >= 10, 5000); if (s.pack < 14 || s.heavy < 10) F('voice pack / sfx bank did not load (' + s.pack + ', ' + s.heavy + ')'); else ok.push('ElevenLabs pack loaded: ' + s.pack + ' lines, ' + s.heavy + ' sounds');
  s = await until(p, (x) => x.voice, 3000); if (!/Neural link/.test(s.voice || '')) F('announcer should say the link line (' + s.voice + ')'); else ok.push('announcer: "' + s.voice + '"');
  if (s.ui.some((u) => u.id === 'relink')) F('menu should not link to a key screen'); 
  await shot(p, 'menu'); await p.close();

  /* ---- gameplay */
  p = await page(); await clickUi(p, 'engage'); await p.keyboard.press('Enter'); await sleep(200); s = await S(p);
  if (s.screen !== 'play' || s.wave !== 1) F('Enter on the menu should start wave 1 (' + s.screen + ')'); else ok.push('run starts at wave 1');
  await p.evaluate(() => window.__neon.god());
  const x0 = s.px; await p.keyboard.down('KeyD'); await sleep(450); s = await S(p); await p.keyboard.up('KeyD');
  if (!(s.px > x0 + 60)) F('D should accelerate right (' + x0 + ' → ' + s.px + ')'); else ok.push('WASD movement with acceleration (' + x0 + ' → ' + s.px + ')');
  await sleep(400); const s1 = await S(p); if (Math.abs(s1.vx) > 40) F('friction should stop the player (' + s1.vx + ')'); else ok.push('friction stops the player');
  await p.keyboard.down('KeyS'); await p.keyboard.press('Space'); await sleep(40); s = await S(p); await p.keyboard.up('KeyS');
  if (!(s.cd > 0) || !(s.inv > 0)) F('Space should dash with i-frames ' + JSON.stringify([s.cd, s.inv])); else ok.push('dash: cooldown ' + s.cd.toFixed(2) + 's, i-frames on');
  await p.mouse.move(1000, 300); await p.mouse.down(); await sleep(400); s = await S(p); await p.mouse.up();
  if (!(s.bullets > 0) && !(s.parts > 0)) F('left click should fire'); else ok.push('left click fires (' + s.bullets + ' shots in flight)');
  s = await until(p, (x) => x.enemies > 0, 5000); if (!s.enemies) F('wave 1 should spawn enemies'); else ok.push('wave 1 spawns ' + s.types.join(','));
  await shot(p, 'play');
  await p.evaluate(() => { window.__neon.clearQueue(); window.__neon.killAll(); });
  s = await until(p, (x) => x.screen === 'upgrade', 4000);
  if (s.screen !== 'upgrade' || !s.cards || s.cards.length !== 3) F('cleared wave should open 3 upgrade cards (' + s.screen + ')'); else ok.push('wave cleared → 3 cards: ' + s.cards.join(', '));
  await sleep(500); await shot(p, 'upgrade');
  const first = s.cards[0]; await p.keyboard.press('Digit1'); await sleep(150); s = await S(p);
  if (s.screen !== 'play' || s.wave !== 2 || !(s.lv[first] >= 1)) F('Digit1 should install the first card and start wave 2 ' + JSON.stringify([s.screen, s.wave, s.lv])); else ok.push('card 1 installed (' + first + '), wave 2');
  // cards by mouse
  await p.evaluate(() => { window.__neon.clearQueue(); window.__neon.killAll(); }); s = await until(p, (x) => x.screen === 'upgrade', 4000); await sleep(500);
  const c2 = s.cards[1]; await clickUi(p, 'card1'); s = await S(p); if (!(s.lv[c2] >= 1) || s.wave !== 3) F('clicking card 2 should install it'); else ok.push('clicked card installs (' + c2 + ')');
  // enemy kinds + splitter split
  await p.evaluate(() => { window.__neon.clearQueue(); window.__neon.spawn('splitter', 260, 0); window.__neon.spawn('sniper', -420, 0); }); await sleep(50);
  // sniper telegraph: wait for it to aim
  await p.evaluate(() => window.__neon.speed(2)); s = await until(p, (x) => x.eb > 0, 6000); await p.evaluate(() => window.__neon.speed(1));
  if (!(s.eb > 0)) F('sniper never fired its bolt'); else ok.push('sniper telegraphs then fires a bolt');
  await shot(p, 'sniper');
  await p.evaluate(() => { window.__neon.killAll(); }); s = await S(p);
  if (!s.types.filter((t) => t === 'shard').length) F('splitter should break into 3 shards (' + s.types + ')'); else ok.push('splitter → ' + s.types.filter((t) => t === 'shard').length + ' shards');
  await p.evaluate(() => { window.__neon.killAll(); });
  // boss wave
  s = await until(p, (x) => x.screen === 'upgrade', 4000); await sleep(450); await p.keyboard.press('Digit3'); await sleep(100);
  await p.evaluate(() => window.__neon.wave(5)); await p.evaluate(() => window.__neon.speed(2)); s = await until(p, (x) => x.types.includes('boss'), 6000); await p.evaluate(() => window.__neon.speed(1));
  if (!s.types.includes('boss')) F('wave 5 should bring the Overmind'); else ok.push('wave 5: Overmind boss arrives');
  s = await until(p, (x) => /Boss/.test(x.voice || '') || x.vq.includes('boss'), 4000); if (!(/Boss/.test(s.voice || '') || s.vq.includes('boss'))) F('boss warning line (' + s.voice + ')'); else ok.push('announcer: boss warning');
  await sleep(2500); await shot(p, 'boss');
  // announcer queue never overlaps
  await p.evaluate(() => { const N = window.__neon; N.say('double'); N.say('critical'); N.say('repair'); }); await sleep(60); s = await S(p);
  if (!s.voice || s.vq.length < 1) F('queued lines should wait their turn ' + JSON.stringify([s.voice, s.vq])); else ok.push('announcer queue: speaking "' + s.voice + '", waiting ' + s.vq.join(','));
  // pause
  await p.keyboard.press('Escape'); await sleep(100); s = await S(p); if (s.screen !== 'pause') F('Esc should pause'); else ok.push('Esc pauses (canvas menu)');
  await shot(p, 'pause'); await p.keyboard.press('Escape'); await sleep(100); s = await S(p); if (s.screen !== 'play') F('Esc should resume');
  // death → over → reboot
  await p.evaluate(() => { window.__neon.mortal(); window.__neon.hurt(1e4); }); s = await until(p, (x) => x.screen === 'over', 5000);
  if (s.screen !== 'over') F('death should show SIGNAL LOST'); else ok.push('death → SIGNAL LOST screen');
  await sleep(600); await shot(p, 'over');
  await p.keyboard.press('Enter'); await sleep(150); s = await S(p); if (s.screen !== 'play' || s.wave !== 1) F('Enter should reboot a new run ' + JSON.stringify([s.screen, s.wave, s.cp, s.ui.map((u) => u.id)])); else ok.push('REBOOT starts a new run');
  await p.close();

  /* ---- phone: touch sticks + stacked cards */
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL); await sleep(300); await shot(p, 'phone-boot');
  s = await S(p); const by = s.ui.find((u) => u.id === 'engage'); await p.touchscreen.tap(by.x, by.y); await sleep(200); await shot(p, 'phone-menu');
  s = await S(p); const st = s.ui.find((u) => u.id === 'start'); await p.touchscreen.tap(st.x, st.y); await sleep(300); await p.evaluate(() => window.__neon.god());
  const cdp = await ctx.newCDPSession(p), tp = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const px0 = (await S(p)).px; await tp('touchStart', [{ x: 90, y: 700, id: 1 }]); for (let i = 1; i <= 6; i++) { await tp('touchMove', [{ x: 90 + i * 10, y: 700, id: 1 }]); await sleep(40); }
  await tp('touchStart', [{ x: 140, y: 700, id: 1 }, { x: 300, y: 600, id: 2 }]); for (let i = 1; i <= 5; i++) { await tp('touchMove', [{ x: 150, y: 700, id: 1 }, { x: 300, y: 600 - i * 12, id: 2 }]); await sleep(40); }
  await sleep(400); s = await S(p); await tp('touchEnd', []);
  if (!(s.px > px0 + 30)) F('left thumb should move (' + px0 + ' → ' + s.px + ')'); else ok.push('phone: left thumb moves');
  if (!(s.bullets > 0)) F('right thumb should aim + fire'); else ok.push('phone: right thumb fires');
  // FIRE button: hold it while the left thumb steers; shots go where you move
  await sleep(1200); const U = Math.min(Math.max(Math.min(390 / 620, 844 / 700), 0.6), 1.3), fx = 390 - 76 * U, fy = 844 - 96 * U;
  await tp('touchStart', [{ x: 90, y: 600, id: 1 }]); for (let i = 1; i <= 5; i++) { await tp('touchMove', [{ x: 90, y: 600 - i * 12, id: 1 }]); await sleep(30); }
  await tp('touchStart', [{ x: 90, y: 540, id: 1 }, { x: fx, y: fy, id: 3 }]); await sleep(350); s = await S(p);
  const aimUp = await p.evaluate(() => window.__neon.aim()); await tp('touchEnd', []); await sleep(50); const s2 = await S(p);
  if (s.fireTouch === null || !(s.bullets > 0)) F('holding FIRE should shoot (' + s.fireTouch + ', ' + s.bullets + ')'); else ok.push('phone: hold FIRE to shoot (' + s.bullets + ' shots)');
  if (!(aimUp < -1.2 && aimUp > -1.95)) F('FIRE should aim where you move (aim ' + aimUp + ')'); else ok.push('phone: FIRE aims where the left thumb moves');
  if (s2.fireTouch !== null) F('releasing FIRE should stop firing'); else ok.push('phone: release FIRE stops');
  await p.evaluate(() => { window.__neon.clearQueue(); window.__neon.killAll(); }); await until(p, (x) => x.screen === 'upgrade', 4000); await sleep(600); await shot(p, 'phone-upgrade');
  s = await S(p); const c0 = s.ui.find((u) => u.id === 'card0'); await p.touchscreen.tap(c0.x, c0.y); await sleep(150); s = await S(p);
  if (s.wave !== 2) F('tapping a card should install it on phones'); else ok.push('phone: tap card to upgrade');
  await ctx.close();

  if (errs.length) errs.forEach((e) => F('pageerror ' + e));
  ok.forEach((m) => console.log('  ✓ ' + m)); if (fails.length) { console.log('FAILED:'); fails.forEach((m) => console.log(' - ' + m)); }
  console.log(fails.length ? 'neon: FAILED' : 'neon: all passed'); await b.close(); server.close(); process.exit(fails.length ? 1 : 0);
})();
