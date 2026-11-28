#!/usr/bin/env node
/* Neon Overdrive: Voice Protocol — canvas-only UI, boot screen key box (type / paste / mask / save), ElevenLabs link
   (mocked: success + invalid key), bypass, movement + dash, firing, waves, upgrade cards, announcer queue, boss, game over.
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
  const mp3 = (n) => fs.readFileSync(path.join(ROOT, 'games/audio/neon-overdrive', n));
  async function page(vp, xi) {
    const ctx = await b.newContext({ viewport: vp || { width: 1280, height: 720 } }); const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(e.message));
    await p.route('https://api.elevenlabs.io/**', (r) => {
      const u = r.request().url(), key = r.request().headers()['xi-api-key'];
      if (xi === 'bad' || key !== 'sk_test_0123456789abcdef0123456789') return r.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":{"status":"invalid_api_key"}}' });
      if (/sound-generation/.test(u)) return r.fulfill({ status: 200, contentType: 'audio/mpeg', body: mp3('sfx_explode.mp3') });
      return r.fulfill({ status: 200, contentType: 'audio/mpeg', body: mp3('vo_en_triple.mp3') });
    });
    await p.goto(URL); await sleep(300); return p;
  }
  const S = (p) => p.evaluate(() => window.__neon.s());
  const clickUi = async (p, id) => { const s = await S(p), u = s.ui.find((x) => x.id === id); if (!u) { F('no canvas button ' + id + ' on ' + s.screen); return; } await p.mouse.click(u.x, u.y); await sleep(120); };
  const until = async (p, f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 5000)) { const s = await S(p); if (f(s)) return s; await sleep(80); } return S(p); };

  /* ---- boot screen: canvas only, masked key box, typing, paste, invalid key */
  let p = await page(null, 'bad'), s = await S(p);
  const dom = await p.evaluate(() => ({ btn: document.querySelectorAll('button,input,select,textarea,form').length, canvas: document.querySelectorAll('canvas').length }));
  if (dom.btn || dom.canvas !== 1) F('DOM should hold only one canvas ' + JSON.stringify(dom)); else ok.push('one canvas, zero HTML controls');
  if (s.screen !== 'boot' || !s.ui.some((u) => u.id === 'bypass') || !s.ui.some((u) => u.id === 'connect')) F('boot screen buttons ' + JSON.stringify(s.ui.map((u) => u.id))); else ok.push('NEURAL LINK boot screen with CONNECT / PASTE / BYPASS');
  await shot(p, 'boot');
  await p.mouse.click(640, 10); await p.keyboard.type('abc'); s = await S(p); if (s.keyLen) F('typing with the box unfocused should not type');
  // focus the key box by clicking it (it sits above the buttons)
  const paste = s.ui.find((u) => u.id === 'paste'); await p.mouse.click(paste.x, paste.y - 45); await p.keyboard.type('sk_bad_key_123'); await p.keyboard.press('Backspace'); s = await S(p);
  if (s.keyLen !== 13 || !s.keyFocus) F('typing into the canvas key box (' + s.keyLen + ')'); else ok.push('canvas key box takes typing + backspace');
  await p.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/plain', '  sk_bad_key_9999999999999999  '); document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true })); }); s = await S(p);
  if (s.keyLen !== 27 || s.status !== 'got') F('Ctrl+V paste into the key box (' + s.keyLen + ', ' + s.status + ')'); else ok.push('paste fills the key box (trimmed)');
  await p.keyboard.press('Enter'); s = await until(p, (x) => x.status && x.status !== 'linking' && x.status !== 'got');
  if (s.status !== 'bad' || s.screen !== 'boot') F('invalid key should be rejected on the boot screen (' + s.status + ')'); else ok.push('invalid key: LINK REJECTED, stays on boot');
  await shot(p, 'boot-rejected');
  await clickUi(p, 'bypass'); s = await S(p);
  if (s.screen !== 'menu' || s.mode !== 'pack') F('BYPASS should open the menu in offline mode'); else ok.push('BYPASS / OFFLINE SYNTH MODE → menu');
  s = await until(p, (x) => x.pack >= 10, 4000); if (s.pack < 10) F('voice pack did not load (' + s.pack + ')'); else ok.push('built-in voice pack loaded (' + s.pack + ' lines)');
  s = await until(p, (x) => x.voice, 3000); if (!/Neural link/.test(s.voice || '')) F('announcer should say the link line (' + s.voice + ')'); else ok.push('announcer: "' + s.voice + '"');
  await shot(p, 'menu'); await p.close();

  /* ---- live link (mocked ElevenLabs): TTS + generated SFX, key saved */
  p = await page(); await p.mouse.click(640, 400);
  await p.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/plain', 'sk_test_0123456789abcdef0123456789'); document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true })); });
  await clickUi(p, 'connect'); s = await until(p, (x) => x.screen === 'menu', 6000);
  if (s.mode !== 'live' || s.screen !== 'menu') F('live link ' + JSON.stringify([s.mode, s.screen, s.status])); else ok.push('live link: ElevenLabs TTS accepted → menu');
  s = await until(p, (x) => x.heavy && x.heavy.explode === 'live' && x.heavy.alarm === 'live', 6000);
  if (s.heavy.impact !== 'live' || s.heavy.explode !== 'live') F('generated SFX ' + JSON.stringify(s.heavy)); else ok.push('3 generated SFX loaded from /v1/sound-generation');
  const saved = await p.evaluate(() => localStorage.getItem('neon:key')); if (!/sk_test_/.test(saved || '')) F('key not saved'); else ok.push('key saved to localStorage');
  const calls0 = s.calls; await p.evaluate(() => { window.__neon.say('triple'); }); await sleep(2500); await p.evaluate(() => { window.__neon.say('triple'); }); await sleep(300); s = await S(p);
  if (s.calls - calls0 > 1) F('repeated phrase should come from the cache (' + (s.calls - calls0) + ' calls)'); else ok.push('phrase cache: repeat line made ' + (s.calls - calls0) + ' new calls');
  await p.reload(); await sleep(300); s = await S(p); if (s.keyLen !== 34 || !s.ui.some((u) => u.id === 'forget')) F('saved key should be pre-filled after reload'); else ok.push('saved key pre-filled + FORGET KEY');
  await p.close();

  /* ---- gameplay */
  p = await page(); await clickUi(p, 'bypass'); await p.keyboard.press('Enter'); await sleep(200); s = await S(p);
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
  await p.keyboard.press('Enter'); await sleep(150); s = await S(p); if (s.screen !== 'play' || s.wave !== 1) F('Enter should reboot a new run'); else ok.push('REBOOT starts a new run');
  await p.close();

  /* ---- phone: touch sticks + stacked cards */
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL); await sleep(300); await shot(p, 'phone-boot');
  s = await S(p); const by = s.ui.find((u) => u.id === 'bypass'); await p.touchscreen.tap(by.x, by.y); await sleep(200); await shot(p, 'phone-menu');
  s = await S(p); const st = s.ui.find((u) => u.id === 'start'); await p.touchscreen.tap(st.x, st.y); await sleep(300); await p.evaluate(() => window.__neon.god());
  const cdp = await ctx.newCDPSession(p), tp = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  const px0 = (await S(p)).px; await tp('touchStart', [{ x: 90, y: 700, id: 1 }]); for (let i = 1; i <= 6; i++) { await tp('touchMove', [{ x: 90 + i * 10, y: 700, id: 1 }]); await sleep(40); }
  await tp('touchStart', [{ x: 140, y: 700, id: 1 }, { x: 300, y: 600, id: 2 }]); for (let i = 1; i <= 5; i++) { await tp('touchMove', [{ x: 150, y: 700, id: 1 }, { x: 300, y: 600 - i * 12, id: 2 }]); await sleep(40); }
  await sleep(400); s = await S(p); await shot(p, 'phone-play'); await tp('touchEnd', []);
  if (!(s.px > px0 + 30)) F('left thumb should move (' + px0 + ' → ' + s.px + ')'); else ok.push('phone: left thumb moves');
  if (!(s.bullets > 0)) F('right thumb should aim + fire'); else ok.push('phone: right thumb fires');
  await p.evaluate(() => { window.__neon.clearQueue(); window.__neon.killAll(); }); await until(p, (x) => x.screen === 'upgrade', 4000); await sleep(600); await shot(p, 'phone-upgrade');
  s = await S(p); const c0 = s.ui.find((u) => u.id === 'card0'); await p.touchscreen.tap(c0.x, c0.y); await sleep(150); s = await S(p);
  if (s.wave !== 2) F('tapping a card should install it on phones'); else ok.push('phone: tap card to upgrade');
  await ctx.close();

  if (errs.length) errs.forEach((e) => F('pageerror ' + e));
  ok.forEach((m) => console.log('  ✓ ' + m)); if (fails.length) { console.log('FAILED:'); fails.forEach((m) => console.log(' - ' + m)); }
  console.log(fails.length ? 'neon: FAILED' : 'neon: all passed'); await b.close(); server.close(); process.exit(fails.length ? 1 : 0);
})();
