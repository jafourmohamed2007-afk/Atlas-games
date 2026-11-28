#!/usr/bin/env node
/* Neon Overdrive online arena server (deathmatch, up to 8 pilots per room).
   Authoritative: clients send inputs only; the server moves every pilot, fires the shots, decides hits, kills and
   respawns, and broadcasts snapshots at 30 Hz. The browser game connects to ws(s)://<host>/neon.

   Run:   npm install && node server/neon-server.js          (PORT=8080 by default)
   Env:   PORT, NEON_PATH (/neon), NEON_KILLS (15), NEON_TIME (300 s), NEON_MAX_ROOMS (200), NEON_TEST=1 (test-only commands)
   Behind HTTPS, let your web server (nginx, Caddy…) forward wss://yoursite/neon to this port. See server/README.md. */
'use strict';
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = +process.env.PORT || 8080, PATH = process.env.NEON_PATH || '/neon';
const KILL_LIMIT = +process.env.NEON_KILLS || 15, TIME_LIMIT = +process.env.NEON_TIME || 300, MAX_ROOMS = +process.env.NEON_MAX_ROOMS || 200;
const TEST = process.env.NEON_TEST === '1';
const TICK = 1 / 30, MAX_PLAYERS = 8, VERSION = 1;

/* ---- arena + rules (the client mirrors the movement constants for prediction) */
const MAP = {
  w: 1800, h: 1200,
  pillars: [[450, 330, 70], [1350, 330, 70], [900, 600, 95], [450, 870, 70], [1350, 870, 70], [900, 190, 45], [900, 1010, 45], [190, 600, 45], [1610, 600, 45]],
  pads: [[900, 410], [640, 600], [1160, 600], [900, 790]]
};
const R = { acc: 3300, k: 9.6, r: 14, hp: 100, dashV: 1180, dashT: 0.16, dashInv: 0.32, dashCd: 1.15, rate: 6.5, bspd: 980, blife: 0.9, dmg: 11, respawn: 2.5, spawnInv: 3, heal: 35, padCd: 12 };
const COLORS = ['#2ef9ff', '#ff2bd6', '#ffc23d', '#3dff8b', '#9b5cff', '#ff6b3d', '#4d9dff', '#ff4fa0'];
const NAME_RE = /[^A-Za-z0-9 _\-]/g;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), hyp = (x, y) => Math.sqrt(x * x + y * y);
const rooms = new Map(), peers = new Set(); let nextId = 1, online = 0;

function makeRoom(priv) {
  let code; do { code = String(1000 + Math.floor(Math.random() * 9000)); } while (rooms.has(code));
  const room = { code, priv, players: new Map(), bullets: [], st: 'wait', tm: 0, events: [], pads: MAP.pads.map(() => 0), bid: 1, endT: 0 };
  rooms.set(code, room); return room;
}
function freeColor(room) { const used = new Set([...room.players.values()].map((p) => p.col)); return COLORS.find((c) => !used.has(c)) || COLORS[0]; }
function spawnPoint(room) {
  let best = null, bd = -1;
  for (let i = 0; i < 24; i++) {
    const x = 80 + Math.random() * (MAP.w - 160), y = 80 + Math.random() * (MAP.h - 160);
    if (MAP.pillars.some(([px, py, pr]) => hyp(x - px, y - py) < pr + 40)) continue;
    let near = 1e9; room.players.forEach((o) => { if (o.alive) near = Math.min(near, hyp(o.x - x, o.y - y)); });
    if (near > bd) { bd = near; best = [x, y]; }
  }
  return best || [100, 100];
}
function spawn(room, p) {
  const [x, y] = spawnPoint(room); Object.assign(p, { x, y, vx: 0, vy: 0, hp: R.hp, alive: true, inv: R.spawnInv, dashT: 0, cd: 0, fireCd: 0, respawnT: 0 });
  room.events.push(['spawn', p.id, Math.round(x), Math.round(y)]);
}
function send(ws, m) { if (ws.readyState === 1) ws.send(JSON.stringify(m)); }
function broadcast(room, m) { const s = JSON.stringify(m); room.players.forEach((p) => { if (p.ws.readyState === 1) p.ws.send(s); }); }
function roster(room) { return [...room.players.values()].map((p) => ({ id: p.id, name: p.name, col: p.col, k: p.kills, d: p.deaths })); }

function join(room, p) {
  leave(p);
  p.room = room; p.col = freeColor(room); p.kills = 0; p.deaths = 0; p.streak = 0; room.players.set(p.id, p);
  spawn(room, p);
  send(p.ws, { t: 'room', code: room.code, priv: room.priv, you: p.id, map: MAP, players: roster(room), st: room.st, tm: room.tm, kills: KILL_LIMIT, time: TIME_LIMIT });
  broadcast(room, { t: 'join', p: { id: p.id, name: p.name, col: p.col, k: 0, d: 0 } });
  if (room.st === 'wait' && room.players.size >= 2) { room.st = 'count'; room.tm = 3; }
}
function leave(p) {
  const room = p.room; if (!room) return; p.room = null;
  room.players.delete(p.id); broadcast(room, { t: 'left', id: p.id });
  if (!room.players.size) rooms.delete(room.code);
  else if (room.players.size < 2 && room.st === 'count') { room.st = 'wait'; room.tm = 0; }
}
function quickRoom() {
  let best = null;
  rooms.forEach((r) => { if (!r.priv && r.players.size < MAX_PLAYERS && r.st !== 'end' && (!best || r.players.size > best.players.size)) best = r; });
  return best || (rooms.size < MAX_ROOMS ? makeRoom(false) : null);
}

function resetMatch(room) {
  room.st = room.players.size >= 2 ? 'count' : 'wait'; room.tm = room.st === 'count' ? 3 : 0; room.bullets = [];
  room.players.forEach((p) => { p.kills = 0; p.deaths = 0; p.streak = 0; spawn(room, p); });
  broadcast(room, { t: 'reset', players: roster(room), st: room.st, tm: room.tm });
}
function endMatch(room) {
  room.st = 'end'; room.endT = 8;
  const board = roster(room).sort((a, b) => b.k - a.k || a.d - b.d);
  broadcast(room, { t: 'end', board, win: board[0] ? board[0].id : null });
}
function kill(room, v, a) {
  v.alive = false; v.hp = 0; v.streak = 0; v.respawnT = R.respawn;
  if (room.st === 'play') { v.deaths++; if (a && a !== v) { a.kills++; a.streak++; } } // warm-up kills do not count
  room.events.push(['kill', v.id, a ? a.id : 0]);
  if (room.st === 'play' && a && a.kills >= KILL_LIMIT) endMatch(room);
}
function stepRoom(room, dt) {
  if (room.st === 'count') { room.tm -= dt; if (room.tm <= 0) { room.st = 'play'; room.tm = TIME_LIMIT; room.players.forEach((p) => { p.kills = 0; p.deaths = 0; spawn(room, p); }); room.events.push(['go']); } }
  else if (room.st === 'play') { room.tm -= dt; if (room.tm <= 0) endMatch(room); }
  else if (room.st === 'end') { room.endT -= dt; if (room.endT <= 0) resetMatch(room); }
  room.pads.forEach((t, i) => { if (t > 0) room.pads[i] = Math.max(0, t - dt); });
  room.players.forEach((p) => {
    if (!p.alive) { p.respawnT -= dt; if (p.respawnT <= 0 && room.st !== 'end') spawn(room, p); return; }
    const inp = p.input;
    p.inv = Math.max(0, p.inv - dt); p.cd = Math.max(0, p.cd - dt); p.fireCd -= dt;
    if (inp.d !== p.dashSeq) { // dash request (sequence number, so one press = one dash)
      p.dashSeq = inp.d;
      if (p.cd <= 0 && room.st !== 'count') {
        let dx = inp.x, dy = inp.y, d = hyp(dx, dy); if (d < 0.2) { dx = Math.cos(inp.a); dy = Math.sin(inp.a); d = 1; }
        p.vx = dx / d * R.dashV; p.vy = dy / d * R.dashV; p.dashT = R.dashT; p.inv = Math.max(p.inv, R.dashInv); p.cd = R.dashCd;
        room.events.push(['dash', p.id]);
      }
    }
    if (p.dashT > 0) p.dashT -= dt;
    else { p.vx += inp.x * R.acc * dt; p.vy += inp.y * R.acc * dt; const k = Math.exp(-R.k * dt); p.vx *= k; p.vy *= k; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.x = clamp(p.x, R.r, MAP.w - R.r); p.y = clamp(p.y, R.r, MAP.h - R.r);
    MAP.pillars.forEach(([px, py, pr]) => { const dx = p.x - px, dy = p.y - py, d = hyp(dx, dy) + 0.001, m = pr + R.r; if (d < m) { p.x = px + dx / d * m; p.y = py + dy / d * m; const vn = (p.vx * dx + p.vy * dy) / d; if (vn < 0) { p.vx -= vn * dx / d; p.vy -= vn * dy / d; } } });
    p.aim = inp.a;
    if (inp.f && p.fireCd <= 0 && room.st !== 'count' && room.st !== 'end') {
      p.fireCd = 1 / R.rate; const a = inp.a, bx = p.x + Math.cos(a) * 18, by = p.y + Math.sin(a) * 18;
      const b = { id: room.bid++, o: p.id, x: bx, y: by, vx: Math.cos(a) * R.bspd, vy: Math.sin(a) * R.bspd, life: R.blife };
      room.bullets.push(b); room.events.push(['shot', p.id, Math.round(bx), Math.round(by), Math.round(b.vx), Math.round(b.vy), b.id]);
    }
    MAP.pads.forEach(([x, y], i) => { if (room.pads[i] <= 0 && p.hp < R.hp && hyp(p.x - x, p.y - y) < 34) { room.pads[i] = R.padCd; p.hp = Math.min(R.hp, p.hp + R.heal); room.events.push(['pick', p.id, i]); } });
  });
  // bullets
  for (let i = room.bullets.length - 1; i >= 0; i--) {
    const b = room.bullets[i]; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    let gone = b.life <= 0 || b.x < 0 || b.x > MAP.w || b.y < 0 || b.y > MAP.h || MAP.pillars.some(([px, py, pr]) => hyp(b.x - px, b.y - py) < pr);
    if (!gone) for (const p of room.players.values()) {
      if (p.id === b.o || !p.alive || hyp(p.x - b.x, p.y - b.y) > R.r + 5) continue;
      gone = true;
      if (p.inv > 0 || p.dashT > 0) break;
      const a = room.players.get(b.o);
      p.hp -= R.dmg; room.events.push(['hit', p.id, b.o, Math.round(b.x), Math.round(b.y), b.id]);
      if (p.hp <= 0) kill(room, p, a);
      break;
    }
    if (gone) room.bullets.splice(i, 1);
  }
  // snapshot (+ events of this tick)
  const ps = [];
  room.players.forEach((p) => ps.push([p.id, Math.round(p.x), Math.round(p.y), +p.aim.toFixed(2), Math.max(0, Math.round(p.hp)), (p.alive ? 1 : 0) | (p.dashT > 0 ? 2 : 0) | (p.inv > 0 ? 4 : 0), p.kills, p.deaths, +p.cd.toFixed(2), +(p.respawnT > 0 ? p.respawnT : 0).toFixed(1), p.lastIn, Math.round(p.vx), Math.round(p.vy), +Math.max(0, p.dashT).toFixed(2)]));
  broadcast(room, { t: 's', st: room.st, tm: +room.tm.toFixed(1), p: ps, pd: room.pads.map((t) => (t > 0 ? 0 : 1)), e: room.events });
  room.events = [];
}

/* ---- sockets */
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ ok: true, game: 'neon-overdrive', online, rooms: rooms.size }));
});
const wss = new WebSocketServer({ server, path: PATH, maxPayload: 2048 });
wss.on('connection', (ws) => {
  online++;
  const p = { id: nextId++, ws, name: 'PILOT', room: null, input: { x: 0, y: 0, a: 0, f: 0, d: 0 }, dashSeq: 0, msgs: 0, lastIn: 0, aim: 0, x: 0, y: 0, hp: R.hp, alive: false };
  peers.add(p); send(ws, { t: 'welcome', id: p.id, v: VERSION, online });
  ws.on('message', (raw) => {
    if (++p.msgs > 90) { ws.close(1008, 'flood'); return; } // ~3x the normal input rate
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    switch (m.t) {
      case 'hello': p.name = String(m.name || 'PILOT').replace(NAME_RE, '').trim().slice(0, 12).toUpperCase() || 'PILOT'; break;
      case 'quick': { const r = quickRoom(); if (r) join(r, p); else send(ws, { t: 'err', m: 'busy' }); break; }
      case 'create': if (rooms.size < MAX_ROOMS) join(makeRoom(true), p); else send(ws, { t: 'err', m: 'busy' }); break;
      case 'join': { const r = rooms.get(String(m.code || '')); if (!r) send(ws, { t: 'err', m: 'nocode' }); else if (r.players.size >= MAX_PLAYERS) send(ws, { t: 'err', m: 'full' }); else join(r, p); break; }
      case 'leave': leave(p); break;
      case 'i': {
        const n = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
        let x = clamp(n(m.x), -1, 1), y = clamp(n(m.y), -1, 1); const d = hyp(x, y); if (d > 1) { x /= d; y /= d; }
        p.input = { x, y, a: clamp(n(m.a), -7, 7), f: m.f ? 1 : 0, d: n(m.d) | 0 }; p.lastIn = n(m.s) | 0; break;
      }
      case 'ping': send(ws, { t: 'pong', c: m.c }); break;
      case 'tp': if (TEST && p.room) { p.x = clamp(+m.x || 0, 20, MAP.w - 20); p.y = clamp(+m.y || 0, 20, MAP.h - 20); p.vx = p.vy = 0; if (m.inv !== undefined) p.inv = +m.inv; } break;
    }
  });
  ws.on('close', () => { online--; peers.delete(p); leave(p); });
  ws.on('error', () => { /* closed below */ });
});
setInterval(() => { for (const room of rooms.values()) stepRoom(room, TICK); }, TICK * 1000);
setInterval(() => { peers.forEach((p) => { p.msgs = 0; }); }, 1000); // flood window
server.listen(PORT, () => console.log('neon-overdrive server on :' + PORT + PATH + (TEST ? ' (test mode)' : '')));
module.exports = { server, wss };
