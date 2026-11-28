#!/usr/bin/env node
/* Neon Overdrive online arena: starts server/neon-server.js (test mode, 3-kill matches), then
   - two browsers QUICK MATCH into the same room, the countdown starts the match, movement is predicted and confirmed,
     pilot A shoots pilot B: hits, kills, respawns, kill limit → results for both;
   - a private room: CREATE gives a code, a third browser types it on the keypad and joins;
   - no server: the lobby says SERVER OFFLINE and offers TRY AGAIN.
   usage: node tests/neon-online.js [screenshot-dir] */
'use strict';
const path = require('path'), fs = require('fs'), http = require('http'), { spawn } = require('child_process'), { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), OUT = process.argv[2] || null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const web = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'Content-Type': f.endsWith('.html') ? 'text/html' : 'audio/mpeg' }); fs.createReadStream(f).pipe(s); });
(async () => {
  await new Promise((r) => web.listen(0, r));
  const PORT = 20000 + Math.floor(Math.random() * 20000);
  const srv = spawn(process.execPath, [path.join(ROOT, 'server/neon-server.js')], { env: Object.assign({}, process.env, { PORT: String(PORT), NEON_TEST: '1', NEON_KILLS: '3' }), stdio: ['ignore', 'pipe', 'pipe'] });
  let srvLog = ''; srv.stdout.on('data', (d) => { srvLog += d; }); srv.stderr.on('data', (d) => { srvLog += d; });
  for (let i = 0; i < 40 && !/server on/.test(srvLog); i++) await sleep(100);
  const URL = (srvUrl) => 'http://127.0.0.1:' + web.address().port + '/games/neon-overdrive.html?test&server=' + encodeURIComponent(srvUrl || 'ws://127.0.0.1:' + PORT + '/neon');
  const b = await chromium.launch(), fails = [], ok = [], errs = [];
  const F = (m) => fails.push(m);
  async function pilot(name, srvUrl) {
    const p = await b.newPage({ viewport: { width: 1100, height: 700 } }); p.on('pageerror', (e) => errs.push(name + ': ' + e.message));
    await p.goto(URL(srvUrl)); await sleep(250);
    p.S = () => p.evaluate(() => window.__neon.s()); p.N = () => p.evaluate(() => window.__neon.net());
    p.click2 = async (id) => { const s = await p.S(), u = s.ui.find((x) => x.id === id); if (!u) { F(name + ': no button ' + id + ' on ' + s.screen); return; } await p.mouse.click(u.x, u.y); await sleep(150); };
    p.until = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 6000)) { const n = await p.N(); if (f(n)) return n; await sleep(80); } return p.N(); };
    await p.click2('engage'); await p.click2('online');
    return p;
  }
  const shot = async (p, n) => { if (OUT) await p.screenshot({ path: path.join(OUT, n + '.png') }); };

  /* quick match: A vs B */
  const A = await pilot('A'), B = await pilot('B');
  let na = await A.until((n) => n.st === 'on'); if (na.st !== 'on') F('lobby should connect (' + na.st + ')'); else ok.push('lobby connects to the server');
  await shot(A, 'lobby');
  await B.until((n) => n.st === 'on');
  await A.click2('quick'); na = await A.until((n) => n.og); await B.click2('quick'); let nb = await B.until((n) => n.og);
  if (!na.og || !nb.og || na.og.code !== nb.og.code) F('quick match should put A and B in one room ' + JSON.stringify([na.og && na.og.code, nb.og && nb.og.code])); else ok.push('QUICK MATCH: both pilots in room ' + na.og.code);
  na = await A.until((n) => n.og && n.og.roster.length === 2 && n.og.st === 'count', 3000); if (!(na.og && na.og.st === 'count')) F('2 pilots should start the countdown (' + (na.og && na.og.st) + ')'); else ok.push('2 pilots → countdown');
  await shot(A, 'countdown');
  na = await A.until((n) => n.og && n.og.st === 'play', 5000); if (na.og.st !== 'play') F('countdown should start the match'); else ok.push('match starts');
  // movement: predicted locally and confirmed by the server
  const x0 = na.og.x; await A.keyboard.down('KeyD'); await sleep(450); await A.keyboard.up('KeyD'); await sleep(400); na = await A.N();
  const meSrv = na.og.roster.find((r) => r.id === na.og.me);
  if (!(na.og.x > x0 + 80) || Math.abs(meSrv.x - na.og.x) > 40) F('prediction ' + JSON.stringify({ x0, local: na.og.x, server: meSrv.x })); else ok.push('movement predicted (' + x0 + ' → ' + na.og.x + ') and the server agrees (' + meSrv.x + ')');
  // A shoots B until 3 kills
  const place = async () => { await A.evaluate(() => window.__neon.nsend({ t: 'tp', x: 300, y: 600, inv: 0 })); await B.evaluate(() => window.__neon.nsend({ t: 'tp', x: 640, y: 600, inv: 0 })); };
  await place(); await sleep(150); await A.evaluate(() => window.__neon.force(0, 1));
  let hitSeen = false, shotTaken = false; const t0 = Date.now();
  while (Date.now() - t0 < 30000) {
    nb = await B.N(); na = await A.N();
    if (nb.og && nb.og.hp < 100 && nb.og.hp > 0) hitSeen = true;
    if (!shotTaken && hitSeen && na.og.bullets > 0) { await shot(A, 'fight'); await shot(B, 'fight-b'); shotTaken = true; }
    if (na.og.end) break;
    if (nb.og && nb.og.alive && Math.abs(nb.og.x - 640) > 30) await place(); // B respawned elsewhere: put it back in the line of fire
    await sleep(150);
  }
  await A.evaluate(() => window.__neon.force(null));
  na = await A.N(); nb = await B.N(); const ra = na.og.roster.find((r) => r.id === na.og.me);
  if (!hitSeen) F('B never lost integrity'); else ok.push('A hits B (server-side hits)');
  if (!(ra && ra.k >= 3)) F('A should reach 3 kills ' + JSON.stringify(na.og.roster)); else ok.push('A gets 3 kills (B respawns between them)');
  if (!na.og.end || na.og.end !== na.og.me || nb.og.end !== na.og.me) F('kill limit should end the match with A as winner ' + JSON.stringify([na.og.end, nb.og.end, na.og.me])); else ok.push('kill limit → results, A wins on both screens');
  if (!nb.og.feed.some((f) => /✕/.test(f))) F('kill feed empty on B'); else ok.push('kill feed: "' + nb.og.feed[nb.og.feed.length - 1] + '"');
  await sleep(500); await shot(A, 'results'); await shot(B, 'results-b');
  await B.click2('oleave'); nb = await B.N(); await sleep(200); na = await A.N();
  if (nb.og || na.og.roster.length !== 1) F('LEAVE should drop B from the room'); else ok.push('LEAVE returns to the lobby, the room updates');

  /* private room + keypad */
  await A.click2('oleave'); await sleep(200);
  await A.click2('create'); na = await A.until((n) => n.og);
  if (!na.og || !na.og.priv) F('CREATE should open a private room'); else ok.push('private room ' + na.og.code);
  await sleep(300); await shot(A, 'private-wait');
  await B.click2('joincode'); for (const d of na.og.code) await B.keyboard.press('Digit' + d); await sleep(100);
  nb = await B.N(); if (nb.pad !== na.og.code) F('keypad should show the typed code (' + nb.pad + ')');
  await shot(B, 'keypad');
  await B.keyboard.press('Enter'); nb = await B.until((n) => n.og);
  if (!nb.og || nb.og.code !== na.og.code) F('joining with the code'); else ok.push('JOIN WITH CODE (keypad) → same private room');
  await B.keyboard.press('Escape'); await sleep(150); await B.click2('oleave'); await sleep(150); await B.click2('joincode'); for (const d of '0000') await B.keyboard.press('Digit' + d); await B.keyboard.press('Enter'); await sleep(400); nb = await B.N();
  if (nb.err !== 'nocode') F('a wrong code should say ROOM NOT FOUND (' + nb.err + ')'); else ok.push('wrong code → ROOM NOT FOUND');

  /* no server */
  const D = await pilot('D', 'ws://127.0.0.1:9/neon'); const nd = await D.until((n) => n.st === 'down', 7000); await sleep(200);
  const sd = await D.S();
  if (nd.st !== 'down' || !sd.ui.some((u) => u.id === 'reconnect') || sd.ui.some((u) => u.id === 'quick')) F('offline lobby ' + JSON.stringify([nd.st, sd.ui.map((u) => u.id)])); else ok.push('no server → SERVER OFFLINE + TRY AGAIN');
  await shot(D, 'offline');

  if (errs.length) [...new Set(errs)].forEach((e) => F('pageerror ' + e));
  ok.forEach((m) => console.log('  ✓ ' + m)); if (fails.length) { console.log('FAILED:'); fails.forEach((m) => console.log(' - ' + m)); }
  console.log(fails.length ? 'online: FAILED' : 'online: all passed'); await b.close(); web.close(); srv.kill(); process.exit(fails.length ? 1 : 0);
})();
