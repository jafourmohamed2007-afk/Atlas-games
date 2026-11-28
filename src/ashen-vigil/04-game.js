/* ===== 04 game: data tables, pools, spatial hash, enemies, weapons, wave director, pickups ===== */
var HEROES = [
  { id: 'knight', name: 'Ember Knight', spr: 'knight', weapon: 'blade', note: '+10% ARMOR', armor: 0.10 },
  { id: 'witch', name: 'Hex Witch', spr: 'witch', weapon: 'bolt', note: '+15% COOLDOWN REDUCTION', cdr: 0.15 },
  { id: 'ranger', name: 'Grave Ranger', spr: 'ranger', weapon: 'volley', note: '+10% MOVE SPEED', spd: 0.10 }
];
var WDEF = {
  blade: { name: 'Cinder Blade', icon: 'blade', evo: 'Inferno Reaver', pair: 'iron', desc: 'Sweeping arc slash in the direction you face.' },
  bolt: { name: 'Wraith Bolt', icon: 'bolt', evo: 'Soul Storm', pair: 'hourglass', desc: 'Homing magic missiles hunt the nearest foe.' },
  volley: { name: 'Bone Volley', icon: 'bone', evo: 'Bone Tempest', pair: 'boots', desc: 'Piercing arrows fly where you move.' },
  stones: { name: 'Orbiting Runestones', icon: 'stones', evo: 'Celestial Halo', pair: 'grimoire', desc: 'Runestones circle and crush foes.' },
  font: { name: 'Holy Font', icon: 'font', evo: 'Sanctum Prime', pair: 'blood', desc: 'A damaging aura of holy light.' },
  sigil: { name: 'Thunder Sigil', icon: 'sigil', evo: 'Storm Crown', pair: 'coin', desc: 'Lightning strikes random foes.' },
  flask: { name: 'Hellfire Flask', icon: 'flask', evo: 'Volcano Brew', pair: 'grimoire', desc: 'Thrown bottles leave burning pools.' },
  chain: { name: 'Spectral Chain', icon: 'chain', evo: 'Tesla Maw', pair: 'magnet', desc: 'Lightning bounces between foes.' }
};
var PDEF = {
  iron: { name: 'Iron Heart', icon: 'heart', desc: '+20 max HP per level.' },
  boots: { name: 'Swiftboots', icon: 'boots', desc: '+8% move speed per level.' },
  hourglass: { name: 'Hourglass', icon: 'glass', desc: '-7% cooldowns per level.' },
  magnet: { name: 'Magnet Charm', icon: 'magnet', desc: '+25% pickup radius per level.' },
  grimoire: { name: 'Grimoire', icon: 'book', desc: '+10% area size per level.' },
  coin: { name: 'Lucky Coin', icon: 'coin', desc: '+luck, +4% crit, better cards.' },
  blood: { name: 'Bloodstone', icon: 'gem', desc: '+0.5 HP regen per second.' }
};
var WPERK = {
  blade: function (l) { return l === 3 ? 'Double slash!' : l === 6 ? 'Triple slash!' : '+Damage, +reach.'; },
  bolt: function (l) { return l % 3 === 0 ? '+1 missile!' : l === 5 ? 'Pierces a foe.' : '+Damage, faster.'; },
  volley: function (l) { return l % 2 === 0 ? '+1 arrow!' : '+Damage, +pierce.'; },
  stones: function (l) { return l % 2 === 0 ? '+1 runestone!' : '+Damage, +speed.'; },
  font: function (l) { return '+Radius, +damage, faster.'; },
  sigil: function (l) { return l % 2 === 0 ? '+1 lightning strike!' : '+Damage, faster.'; },
  flask: function (l) { return l % 3 === 0 ? '+1 bottle!' : '+Bigger, longer flames.'; },
  chain: function (l) { return '+1 bounce, +damage.'; }
};
var ET = [
  { n: 'bat', spr: 'bat', hp: 3, spd: 56, dmg: 3, r: 4, xp: 1, pc: [3, 4, 10] },
  { n: 'ghoul', spr: 'ghoul', hp: 24, spd: 21, dmg: 7, r: 6, xp: 2, pc: [16, 17, 18] },
  { n: 'skull', spr: 'skull', hp: 10, spd: 26, dmg: 5, r: 5, xp: 2, pc: [26, 25, 7] },
  { n: 'toad', spr: 'toad', hp: 16, spd: 30, dmg: 3, r: 6, xp: 2, pc: [17, 13, 18] },
  { n: 'wraith', spr: 'wraith', hp: 12, spd: 44, dmg: 5, r: 5, xp: 3, pc: [22, 21, 20] },
  { n: 'golem', spr: 'golem', hp: 900, spd: 17, dmg: 14, r: 11, xp: 60, pc: [26, 31, 30] },
  { n: 'reaper', spr: 'reaper', hp: 7000, spd: 32, dmg: 20, r: 12, xp: 200, pc: [2, 3, 10] }
];
var BAT = 0, GHOUL = 1, SKULL = 2, TOAD = 3, WRAITH = 4, GOLEM = 5, REAPER = 6;
var SHRINE = [
  { id: 'might', name: 'Might', icon: 'blade', desc: '+5% damage', max: 5, cost: 60 },
  { id: 'armor', name: 'Armor', icon: 'heart', desc: '+3% damage reduction', max: 5, cost: 50 },
  { id: 'hp', name: 'Max HP', icon: 'heal', desc: '+15 max HP', max: 5, cost: 40 },
  { id: 'speed', name: 'Speed', icon: 'boots', desc: '+4% move speed', max: 5, cost: 50 },
  { id: 'magnet', name: 'Magnet', icon: 'magnet', desc: '+10% pickup radius', max: 5, cost: 30 },
  { id: 'revival', name: 'Revival', icon: 'chest', desc: 'Rise once with half HP', max: 2, cost: 400 },
  { id: 'greed', name: 'Greed', icon: 'coin', desc: '+10% gold found', max: 5, cost: 60 }
];

/* ---- pools ---- */
var E, EB, PB, GM, PK, LN, PT, FX, FT;
var boomQ = [];
var NE = 720, CELL = 24, HS = 4096, hHead = new Int32Array(HS), hNext = new Int32Array(NE);
var qbuf = new Array(NE), qn = 0, qstamp = 0, aliveE = 0;
function initPools() {
  E = makePool(NE, function (i) { return { id: i, x: 0, y: 0, t: 0, hp: 1, max: 1, r: 5, spd: 0, dmg: 0, kx: 0, ky: 0, fl: 0, face: 0, anim: 0, cd: 0, el: 0, ring: 0, ang: 0, rad: 0, slow: 0, orbT: 0, qs: 0, st: 0, vx: 0, vy: 0, life: 0, boss: 0, swarm: 0, sp: null }; });
  EB = makePool(200, function () { return { x: 0, y: 0, vx: 0, vy: 0, life: 0, dmg: 0, r: 3, k: 0 }; });
  PB = makePool(300, function () { return { x: 0, y: 0, vx: 0, vy: 0, life: 0, dmg: 0, pierce: 0, k: 0, hom: 0, r: 3, tgt: null, rt: 0, hit: [-1, -1, -1, -1, -1, -1], hn: 0 }; });
  GM = makePool(900, function () { return { x: 0, y: 0, v: 1, k: 0, pull: 0, vx: 0, vy: 0, a: 0 }; });
  PK = makePool(80, function () { return { x: 0, y: 0, k: '', life: 0, a: 0, v: 0 }; });
  LN = makePool(16, function () { return { x: 0, y: 0, hp: 1, a: 0 }; });
  PT = makePool(1600, function () { return { x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, c: 7, s: 1, gr: 0 }; });
  FX = makePool(200, function () { return { k: '', x: 0, y: 0, x2: 0, y2: 0, t: 0, dur: 1, a: 0, r: 0, c: 7, dmg: 0, tick: 0, arc: 0, full: 0, seed: 0, pd: 0, pr: 0 }; });
  FT = makePool(90, function () { return { x: 0, y: 0, life: 0, s: '', c: 7, big: 0 }; });
}
function eachOn(pool, fn) { var it = pool.items; for (var i = 0; i < pool.n; i++) if (it[i].on) fn(it[i], i); }

/* ---- spatial hash: the grid that keeps 500+ collisions cheap ---- */
function hkey(a, b) { return ((a * 73856093) ^ (b * 19349663)) & (HS - 1); }
function rebuildHash() {
  hHead.fill(-1);
  var it = E.items;
  for (var i = 0; i < NE; i++) {
    var e = it[i]; if (!e.on) continue;
    var k = hkey(M.floor(e.x / CELL), M.floor(e.y / CELL)); hNext[i] = hHead[k]; hHead[k] = i;
  }
}
function query(x, y, r) {
  qn = 0; qstamp++;
  var rm = r + 12, x0 = M.floor((x - rm) / CELL), x1 = M.floor((x + rm) / CELL), y0 = M.floor((y - rm) / CELL), y1 = M.floor((y + rm) / CELL), it = E.items;
  for (var cy = y0; cy <= y1; cy++) for (var cx2 = x0; cx2 <= x1; cx2++) {
    for (var i = hHead[hkey(cx2, cy)]; i >= 0; i = hNext[i]) {
      var e = it[i]; if (e.qs === qstamp) continue; e.qs = qstamp;
      var dx = e.x - x, dy = e.y - y, rr2 = r + e.r;
      if (dx * dx + dy * dy <= rr2 * rr2) qbuf[qn++] = e;
    }
  }
  return qn;
}
function nearest(x, y, maxD, skip) {
  var best = null, bd = maxD * maxD, it = E.items;
  for (var i = 0; i < NE; i++) {
    var e = it[i]; if (!e.on || e.hp <= 0 || e === skip) continue;
    var dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}
function randomNear(x, y, maxD) {
  var pickE = null, n = 0, md = maxD * maxD, it = E.items;
  for (var i = 0; i < NE; i++) {
    var e = it[i]; if (!e.on || e.hp <= 0) continue;
    var dx = e.x - x, dy = e.y - y; if (dx * dx + dy * dy > md) continue;
    n++; if (rnd() * n < 1) pickE = e;
  }
  return pickE;
}

/* ---- run state ---- */
var R = null, P = null, cam = { x: 0, y: 0 }, shk = 0, flashA = 0, flashC = 7;
var xpNeed = function (l) { return M.floor(4 + l * 5 + l * l); };
var bannerT = { text: '', t: 0, col: 13 };

function newRun(heroIdx) {
  var h = HEROES[heroIdx];
  R = { hero: heroIdx, time: 0, kills: 0, gold: 0, level: 1, xp: 0, need: xpNeed(1), pending: 0, rerolls: 2, revives: save.upg.revival, weapons: [], pass: {}, ev: {}, win: false, over: false, spawnAcc: 0, lantT: 4, lowT: 0, bossAlive: null, chestQ: 0, stepAcc: 0, gemsTaken: 0, evolved: 0 };
  P = { x: 0, y: 0, hp: 120, max: 120, fx: 1, fy: 0, face: 0, anim: 0, inv: 0, hurt: 0, moving: 0, iron: 0, regen: 0 };
  cam.x = 0; cam.y = 0; shk = 0; flashA = 0;
  boomQ.length = 0; FT.count = 0;
  E.clear(); EB.clear(); PB.clear(); GM.clear(); PK.clear(); LN.clear(); PT.clear(); FX.clear(); FT.clear(); aliveE = 0;
  addWeapon(h.weapon);
  recalc(); P.hp = P.max;
  banner('THE NIGHT BEGINS', 13);
  say('start', 2);
}
function recalc() {
  var h = HEROES[R.hero], u = save.upg, ps = R.pass, pc = function (k) { return ps[k] || 0; };
  P.might = 1 + 0.05 * u.might;
  P.armor = clamp((h.armor || 0) + 0.03 * u.armor, 0, 0.6);
  var oldMax = P.max; P.max = 120 + 15 * u.hp + 20 * pc('iron');
  if (P.hp !== undefined && P.max > oldMax) P.hp += P.max - oldMax;
  P.speed = 68 * (1 + 0.04 * u.speed + 0.08 * pc('boots') + (h.spd || 0));
  P.cdr = clamp((h.cdr || 0) + 0.07 * pc('hourglass'), 0, 0.6);
  P.magnet = 42 * (1 + 0.1 * u.magnet + 0.25 * pc('magnet'));
  P.area = 1 + 0.1 * pc('grimoire');
  P.luck = 0.05 * pc('coin');
  P.crit = 0.05 + 0.04 * pc('coin');
  P.regen = 0.7 + 0.5 * pc('blood');
  P.greed = 1 + 0.1 * u.greed;
}
function addWeapon(id) { R.weapons.push({ id: id, lv: 1, evo: 0, cd: 0.4, q: 0, qt: 0, qd: 1, tk: 0, ang: 0 }); }
function hasW(id) { for (var i = 0; i < R.weapons.length; i++) if (R.weapons[i].id === id) return R.weapons[i]; return null; }
function cdm() { return 1 - P.cdr; }
function banner(t, c) { bannerT.text = t; bannerT.t = 3; bannerT.col = c === undefined ? 13 : c; }
function shake(m) { shk = M.max(shk, m); }
function flash(c, a) { flashC = c; flashA = M.max(flashA, a); }

/* ---- particles & floating numbers ---- */
function burst(x, y, cols, n, spd, life, gr) {
  for (var i = 0; i < n; i++) {
    var p = PT.get(); if (!p) return;
    var a = rnd() * TAU, s = rr(0.3, 1) * spd;
    p.x = x; p.y = y; p.vx = M.cos(a) * s; p.vy = M.sin(a) * s; p.life = p.max = rr(0.5, 1) * life; p.c = cols[(rnd() * cols.length) | 0]; p.s = rnd() < 0.25 ? 2 : 1; p.gr = gr || 0;
  }
}
function spark(x, y, c, vx, vy, life) {
  var p = PT.get(); if (!p) return;
  p.x = x; p.y = y; p.vx = vx || 0; p.vy = vy || 0; p.life = p.max = life || 0.3; p.c = c; p.s = 1; p.gr = 0;
}
function floatNum(x, y, s, c, big) {
  var f = FT.get(); if (!f) return;
  f.x = x; f.y = y; f.s = '' + s; f.c = c; f.life = big ? 1.1 : 0.7; f.big = big ? 1 : 0; FT.count++;
}
function fx(k, x, y, dur) {
  var f = FX.get(); if (!f) return null;
  f.k = k; f.x = x; f.y = y; f.t = 0; f.dur = dur; f.x2 = 0; f.y2 = 0; f.a = 0; f.r = 0; f.c = 7; f.dmg = 0; f.tick = 0; f.arc = 0; f.full = 0; f.seed = (rnd() * 9999) | 0; f.pd = 0; f.pr = 0;
  return f;
}

/* ---- damage ---- */
function hurt(e, d, kx, ky, kb) {
  if (!e.on || e.hp <= 0) return false;
  var crit = rnd() < P.crit; if (crit) d *= 2;
  e.hp -= d; e.fl = 0.09;
  if (kb && !e.boss && !e.ring) { e.kx += kx * kb; e.ky += ky * kb; }
  if (crit || FT.count < 40) floatNum(e.x, e.y - e.r - 5, M.max(1, M.round(d)), crit ? 13 : 7, crit);
  sfx('hit');
  if (e.hp <= 0) killEnemy(e);
  return true;
}
function hurtLanterns(x, y, r) {
  eachOn(LN, function (l) {
    var dx = l.x - x, dy = l.y - y;
    if (dx * dx + dy * dy < (r + 5) * (r + 5)) breakLantern(l);
  });
}
function areaHit(x, y, r, d, kb) {
  var n = query(x, y, r), c = 0;
  for (var i = 0; i < n; i++) { var e = qbuf[i], dx = e.x - x, dy = e.y - y, l = M.sqrt(dx * dx + dy * dy) || 1; if (hurt(e, d, dx / l, dy / l, kb)) c++; }
  hurtLanterns(x, y, r);
  return c;
}
function hurtPlayer(d) {
  if (P.inv > 0 || R.over) return;
  d = M.max(1, d * (1 - P.armor));
  P.hp -= d; P.inv = 0.7; P.hurt = 0.25;
  shake(3); sfx('hurt'); burst(P.x, P.y, [10, 11, 9], 8, 60, 0.4);
  floatNum(P.x, P.y - 12, '-' + M.round(d), 10, 0);
  if (P.hp <= 0) {
    if (R.revives > 0) {
      R.revives--; P.hp = P.max * 0.5; P.inv = 2.5; flash(7, 0.8); sfx('level'); shake(8);
      banner('RISEN AGAIN', 13);
      eachOn(E, function (e) { if (!e.boss) { var dx = e.x - P.x, dy = e.y - P.y; if (dx * dx + dy * dy < 110 * 110) hurt(e, 9999, 0, 0, 0); } });
    } else endRun(false);
  } else if (P.hp < P.max * 0.28) { say('lowhp', 2); }
}

/* ---- gems, items, chests ---- */
function spawnGem(x, y, v) {
  var gm = GM.get();
  if (!gm) { addXp(v); return; }
  gm.x = x; gm.y = y; gm.v = v; gm.k = v >= 25 ? 2 : v >= 5 ? 1 : 0; gm.pull = 0; gm.vx = 0; gm.vy = 0; gm.a = rnd() * 6;
}
function dropItem(x, y, k) {
  var p = PK.get(); if (!p) return;
  p.x = x; p.y = y; p.k = k; p.life = 90; p.a = rnd() * 6; p.v = k === 'coin' ? ri(1, 3) : 0;
}
function breakLantern(l) {
  l.on = false; burst(l.x, l.y, [12, 13, 14], 10, 50, 0.5); sfx('pick');
  var r = rnd();
  if (r < 0.40) dropItem(l.x, l.y, 'coin'); else if (r < 0.62) dropItem(l.x, l.y, 'chicken');
  else if (r < 0.74) dropItem(l.x, l.y, 'orb'); else if (r < 0.84) dropItem(l.x, l.y, 'rosary');
  else { for (var i = 0; i < 6; i++) spawnGem(l.x + rr(-8, 8), l.y + rr(-8, 8), 5); }
}
function spawnLantern() {
  var l = LN.get(); if (!l) return;
  var a = rnd() * TAU, d = rr(80, 170); l.x = P.x + M.cos(a) * d; l.y = P.y + M.sin(a) * d; l.hp = 1; l.a = rnd() * 6;
}
function addXp(v) {
  R.xp += v;
  while (R.xp >= R.need) { R.xp -= R.need; R.level++; R.need = xpNeed(R.level); R.pending++; }
}
function explode(x, y, r, dp, de) {
  burst(x, y, [10, 11, 12, 13], 18, 90, 0.6); shake(4); sfx('boom');
  var f = fx('ring', x, y, 0.35); if (f) { f.r = r; f.c = 12; }
  var dx = P.x - x, dy = P.y - y; if (dx * dx + dy * dy < (r + 4) * (r + 4)) hurtPlayer(dp);
  if (de) areaHit(x, y, r, de, 60);
}
function killEnemy(e) {
  if (!e.on) return;
  e.on = false; aliveE--; R.kills++;
  var d = ET[e.t], x = e.x, y = e.y;
  burst(x, y, d.pc, e.boss ? 40 : 7, e.boss ? 140 : 70, 0.5);
  sfx('kill');
  spawnGem(x + rr(-2, 2), y + rr(-2, 2), d.xp * (e.el ? 5 : 1));
  if (e.el) { dropItem(x, y, 'coin'); if (rnd() < 0.25) dropItem(x + 4, y, 'chicken'); }
  else if (rnd() < 0.05 + P.luck * 0.3) dropItem(x, y, 'coin');
  else if (rnd() < 0.012) dropItem(x, y, 'chicken');
  if (e.t === TOAD) boomQ.push({ x: x, y: y, dp: 12 * (1 + R.time / 900), de: 18 + R.time * 0.05 });
  if (e.t === GOLEM) {
    for (var i = 0; i < 8; i++) spawnGem(x + rr(-14, 14), y + rr(-14, 14), 25);
    for (i = 0; i < 6; i++) dropItem(x + rr(-12, 12), y + rr(-12, 12), 'coin');
    dropItem(x, y, 'chest'); R.bossAlive = null; banner('THE GOLEM FALLS', 13); shake(8); flash(7, 0.4);
  }
  if (e.t === REAPER) { R.bossAlive = null; endRun(true); }
}
function smite() {
  flash(7, 0.9); shake(8); sfx('smite');
  eachOn(E, function (e) {
    var sx = e.x - cam.x, sy = e.y - cam.y;
    if (M.abs(sx) < W / 2 + 10 && M.abs(sy) < H / 2 + 10) hurt(e, e.boss ? 150 : 400, 0, 0, 0);
  });
}
function vacuum() { eachOn(GM, function (gm) { gm.pull = 1; }); sfx('chime'); }

/* ---- enemies ---- */
function hpMul() { var m = R.time / 60; return 1 + 0.16 * m + 0.014 * m * m; }
function spawnEnemy(t, x, y, elite) {
  if (aliveE >= NE - 4) return null;
  var e = E.get(); if (!e) return null;
  var d = ET[t], hm = hpMul() * (elite ? 7 : 1);
  e.t = t; e.x = x; e.y = y; e.max = e.hp = d.hp * hm; e.r = d.r; e.spd = d.spd * (elite ? 0.92 : 1); e.dmg = d.dmg * (1 + R.time / 1200) * (elite ? 1.4 : 1);
  e.kx = 0; e.ky = 0; e.fl = 0; e.face = 0; e.anim = rnd() * 4; e.cd = rr(1, 2.5); e.el = elite ? 1 : 0; e.ring = 0; e.slow = 0; e.orbT = 0; e.st = 0; e.life = 0; e.boss = 0; e.swarm = 0;
  e.sp = SPR[d.spr]; aliveE++;
  return e;
}
function edgePoint(margin) {
  var a = rnd() * TAU, hw = W / 2 + margin, hh = H / 2 + margin, c = M.cos(a), s = M.sin(a), k = M.min(c ? hw / M.abs(c) : 1e9, s ? hh / M.abs(s) : 1e9);
  return { x: P.x + c * k, y: P.y + s * k };
}
function pickType(m) {
  var w = m < 1 ? [60, 40, 0, 0, 0] : m < 3 ? [45, 35, 20, 0, 0] : m < 5 ? [30, 32, 20, 18, 0] : m < 8 ? [22, 34, 18, 16, 10] : [15, 36, 18, 16, 15];
  var s = 0, i; for (i = 0; i < 5; i++) s += w[i];
  var r = rnd() * s; for (i = 0; i < 5; i++) { r -= w[i]; if (r < 0) return i; }
  return 0;
}
function spawnBoss(t) {
  var p = edgePoint(30), e = spawnEnemy(t, p.x, p.y, 0); if (!e) return;
  e.boss = 1; var d = ET[t];
  e.max = e.hp = d.hp * (t === GOLEM ? (1 + R.time / 300) : 1) * (1 + save.upg.might * 0.02);
  e.cd = 3; R.bossAlive = e;
  sfx('bossroar'); shake(6); flash(10, 0.3);
}
function batSwarm() {
  var a0 = rnd() * TAU;
  for (var i = 0; i < 90; i++) {
    var a = a0 + rr(-0.55, 0.55), d = M.sqrt(W * W + H * H) / 2 + 20 + rr(0, 40);
    var e = spawnEnemy(BAT, P.x + M.cos(a) * d, P.y + M.sin(a) * d, 0); if (!e) break;
    var tx = P.x + rr(-25, 25), ty = P.y + rr(-25, 25), dx = tx - e.x, dy = ty - e.y, l = M.sqrt(dx * dx + dy * dy) || 1;
    e.swarm = 1; e.vx = dx / l * 92; e.vy = dy / l * 92; e.life = 8; e.max = e.hp = e.hp * 0.8;
  }
}
function ringWraiths(n) {
  for (var i = 0; i < n; i++) {
    var e = spawnEnemy(WRAITH, P.x, P.y, 0); if (!e) break;
    e.ring = 1; e.ang = i / n * TAU; e.rad = M.max(W, H) / 2 + 12; e.x = P.x + M.cos(e.ang) * e.rad; e.y = P.y + M.sin(e.ang) * e.rad;
  }
}
function ebullet(x, y, ang, spd, dmg, k) {
  var b = EB.get(); if (!b) return;
  b.x = x; b.y = y; b.vx = M.cos(ang) * spd; b.vy = M.sin(ang) * spd; b.life = 6; b.dmg = dmg; b.k = k || 0; b.r = k === 2 ? 4 : 3;
}
function director(dt) {
  var t = R.time, m = t / 60, ev = R.ev;
  if (!ev.swarm && t >= 180) { ev.swarm = 1; batSwarm(); say('swarm', 2); banner('BAT SWARM!', 4); sfx('bossroar'); }
  if (!ev.g1 && t >= 300) { ev.g1 = 1; spawnBoss(GOLEM); say('boss', 3); banner('BONE GOLEM', 10); }
  if (!ev.ring && t >= 420) { ev.ring = 1; ringWraiths(40); banner('THE WRAITH RING', 22); sfx('bossroar'); }
  if (!ev.g2 && t >= 600) { ev.g2 = 1; spawnBoss(GOLEM); say('boss', 3); banner('BONE GOLEM', 10); }
  if (!ev.ring2 && t >= 660) { ev.ring2 = 1; ringWraiths(56); banner('THE WRAITH RING', 22); }
  if (!ev.warn && t >= 870) { ev.warn = 1; banner('A GREAT EVIL APPROACHES', 10); say('boss', 3); }
  if (!ev.reaper && t >= 900) { ev.reaper = 1; spawnBoss(REAPER); say('reaper', 3); banner('THE PALE REAPER', 10); }
  var rate = (0.8 + m * 1.2 + m * m * 0.07) * (ev.reaper ? 0.5 : 1);
  R.spawnAcc += rate * dt;
  var elite = m < 2 ? 0 : M.min(0.14, 0.02 + (m - 2) * 0.012);
  while (R.spawnAcc >= 1) {
    R.spawnAcc -= 1;
    var p = edgePoint(14), tp = pickType(m);
    spawnEnemy(tp, p.x, p.y, rnd() < elite);
  }
  R.lantT -= dt; if (R.lantT <= 0) { R.lantT = rr(7, 12); if (LN.items.filter(function (l) { return l.on; }).length < 6) spawnLantern(); }
}

/* ---- per-step enemy brain ---- */
function updateEnemies(dt) {
  var it = E.items, sdt = R.stepAcc & 1;
  for (var i = 0; i < NE; i++) {
    var e = it[i]; if (!e.on) continue;
    if (e.fl > 0) e.fl -= dt;
    var dx = P.x - e.x, dy = P.y - e.y, dist = M.sqrt(dx * dx + dy * dy) || 0.001, ux = dx / dist, uy = dy / dist;
    var spd = e.spd * (e.slow > 0 ? 0.55 : 1); if (e.slow > 0) e.slow -= dt;
    e.anim += dt * (e.t === BAT ? 14 : 7);
    var mx = 0, my = 0;
    if (e.swarm) {
      mx = e.vx; my = e.vy; e.life -= dt; if (e.life <= 0) { e.on = false; aliveE--; continue; }
    } else if (e.ring) {
      e.ang += 0.5 * dt; e.rad -= 11 * dt;
      e.x = P.x + M.cos(e.ang) * e.rad; e.y = P.y + M.sin(e.ang) * e.rad;
      if (e.rad < 26) e.ring = 0; e.face = M.cos(e.ang) > 0 ? 1 : 0; continue_ring(e); continue;
    } else if (e.t === SKULL) {
      var want = dist > 105 ? 1 : dist < 70 ? -1 : 0;
      mx = ux * spd * want + -uy * spd * 0.35; my = uy * spd * want + ux * spd * 0.35;
      e.cd -= dt; if (e.cd <= 0 && dist < 170) { e.cd = rr(2, 3); ebullet(e.x, e.y, M.atan2(dy, dx), 52, e.dmg, 0); }
    } else if (e.t === GOLEM) {
      mx = ux * spd; my = uy * spd; e.cd -= dt;
      if (e.st === 0 && e.cd <= 0) { e.st = 1; e.cd = 0.7; }
      else if (e.st === 1) { mx = 0; my = 0; e.fl = 0.05; if (e.cd <= 0) { e.st = 0; e.cd = 4; var n = 14, a0 = rnd() * TAU; for (var k = 0; k < n; k++) ebullet(e.x, e.y, a0 + k / n * TAU, 46, e.dmg * 0.6, 1); shake(5); sfx('boom'); } }
    } else if (e.t === REAPER) {
      e.cd -= dt;
      if (e.st === 0) {
        mx = ux * spd; my = uy * spd;
        if (e.cd <= 0) { e.st = 1; e.cd = 0.8; e.vx = ux; e.vy = uy; }
        e.life -= dt; if (e.life <= 0) { e.life = 8; var nn = 18, b0 = rnd() * TAU; for (var q = 0; q < nn; q++) ebullet(e.x, e.y, b0 + q / nn * TAU, 55, e.dmg * 0.5, 2); sfx('bossroar'); shake(4); }
        if (!e.ev50 && e.hp < e.max * 0.5) { e.ev50 = 1; ringWraiths(30); banner('THE REAPER ENRAGES', 10); }
      } else if (e.st === 1) { mx = 0; my = 0; if (e.cd <= 0) { e.st = 2; e.cd = 0.55; } }
      else { mx = e.vx * 175; my = e.vy * 175; if (e.cd <= 0) { e.st = 0; e.cd = 5.5; } }
    } else if (e.t === BAT) {
      var wob = M.sin(e.anim * 0.7) * 0.5; mx = (ux - uy * wob) * spd; my = (uy + ux * wob) * spd;
    } else { mx = ux * spd; my = uy * spd; }
    e.face = mx > 0.5 ? 1 : mx < -0.5 ? 0 : e.face;
    // separation: neighbours push each other apart (half the enemies per step keeps it cheap)
    if (!e.swarm && (e.id & 1) === sdt && !e.boss) {
      var n2 = query(e.x, e.y, e.r + 1), push = 0;
      for (var j = 0; j < n2; j++) {
        var o = qbuf[j]; if (o === e) continue;
        var ox = e.x - o.x, oy = e.y - o.y, od = M.sqrt(ox * ox + oy * oy) || 0.1, ov = e.r + o.r - od;
        if (ov > 0 && push < 3) { push++; e.x += ox / od * ov * 0.5; e.y += oy / od * ov * 0.5; }
      }
    }
    e.x += (mx + e.kx) * dt; e.y += (my + e.ky) * dt;
    e.kx *= 0.86; e.ky *= 0.86;
    // contact
    if (dist < e.r + 4) {
      if (e.t === TOAD) { e.hp = 0; killEnemy(e); continue; }
      hurtPlayer(e.dmg);
    }
    if (dist > 700 && !e.boss) { e.on = false; aliveE--; }   // lost far behind: recycle
  }
}
function continue_ring(e) { if (e.rad < 40) { var dx = P.x - e.x, dy = P.y - e.y; if (dx * dx + dy * dy < (e.r + 4) * (e.r + 4)) hurtPlayer(e.dmg); } }

/* ---- weapons ---- */
function facing() { return M.atan2(P.fy, P.fx); }
function slash(w, back) {
  var lv = w.lv, rad = (34 + 2 * lv) * P.area * (w.evo ? 1.45 : 1), dmg = (15 + 5 * (lv - 1)) * P.might * (w.evo ? 1.7 : 1);
  var tg = nearest(P.x, P.y, rad + 14), a = (tg ? M.atan2(tg.y - P.y, tg.x - P.x) : facing()) + (back ? M.PI : 0), arc = w.evo ? M.PI : 0.95;
  var n = query(P.x, P.y, rad);
  for (var i = 0; i < n; i++) {
    var e = qbuf[i], dx = e.x - P.x, dy = e.y - P.y, d = M.sqrt(dx * dx + dy * dy) || 1;
    var da = M.abs(M.atan2(M.sin(M.atan2(dy, dx) - a), M.cos(M.atan2(dy, dx) - a)));
    if (w.evo || da < arc || d < 10) hurt(e, dmg, dx / d, dy / d, 90);
  }
  hurtLanterns(P.x + M.cos(a) * rad * 0.6, P.y + M.sin(a) * rad * 0.6, rad * 0.5);
  var f = fx('slash', P.x, P.y, 0.22); if (f) { f.a = a; f.r = rad; f.arc = arc; f.full = w.evo ? 1 : 0; f.c = w.evo ? 11 : 13; }
  sfx('slash');
}
function shootBolt(x, y, ang, dmg, hom, pierce, spd, life, kind) {
  var b = PB.get(); if (!b) return null;
  b.x = x; b.y = y; b.vx = M.cos(ang) * spd; b.vy = M.sin(ang) * spd; b.life = life; b.dmg = dmg; b.pierce = pierce; b.k = kind; b.hom = hom; b.tgt = null; b.rt = 0; b.hn = 0; b.r = kind === 0 ? 4 : 3;
  for (var i = 0; i < 6; i++) b.hit[i] = -1;
  return b;
}
var WFN = {
  blade: function (w, dt) {
    w.cd -= dt;
    if (w.q > 0) { w.qt -= dt; if (w.qt <= 0) { slash(w, w.qd < 0); w.qd = -w.qd; w.q--; w.qt = 0.14; } }
    if (w.cd <= 0) {
      w.cd = (1.1 - 0.06 * w.lv) * (w.evo ? 0.75 : 1) * cdm();
      slash(w, false); var extra = (w.lv >= 3 ? 1 : 0) + (w.lv >= 6 ? 1 : 0) + (w.evo ? 1 : 0);
      w.q = extra; w.qt = 0.14; w.qd = -1;
    }
  },
  bolt: function (w, dt) {
    w.cd -= dt; if (w.cd > 0) return;
    var t = nearest(P.x, P.y, 190); if (!t) { w.cd = 0.2; return; }
    w.cd = (1.0 - 0.05 * w.lv) * (w.evo ? 0.8 : 1) * cdm();
    var cnt = 1 + M.floor(w.lv / 2), dmg = (13 + 4 * (w.lv - 1)) * P.might * (w.evo ? 1.4 : 1), a = M.atan2(t.y - P.y, t.x - P.x);
    for (var i = 0; i < cnt; i++) shootBolt(P.x, P.y, a + (i - (cnt - 1) / 2) * 0.35, dmg, 1, w.lv >= 5 ? 1 + (w.evo ? 1 : 0) : (w.evo ? 2 : 0), 105, 2.4, 0);
    if (w.evo) for (var k = 0; k < 8; k++) shootBolt(P.x, P.y, k / 8 * TAU + w.ang, dmg * 0.8, 1, 1, 95, 2.2, 0);
    w.ang += 0.4; sfx('zap');
  },
  volley: function (w, dt) {
    w.cd -= dt; if (w.cd > 0) return;
    w.cd = (1.0 - 0.05 * w.lv) * cdm();
    var vt = P.moving ? null : nearest(P.x, P.y, 170), cnt = 1 + M.floor(w.lv / 2), dmg = (10 + 3 * (w.lv - 1)) * P.might * (w.evo ? 1.4 : 1), a = vt ? M.atan2(vt.y - P.y, vt.x - P.x) : facing(), pc = w.evo ? 99 : 1 + M.floor(w.lv / 2);
    var dirs = w.evo ? 8 : 1;
    for (var d = 0; d < dirs; d++) for (var i = 0; i < cnt; i++) shootBolt(P.x, P.y, a + d / dirs * TAU + (i - (cnt - 1) / 2) * 0.17, dmg, 0, pc, 200, 1.1, 1);
    sfx('twang');
  },
  stones: function (w, dt) {
    var lv = w.lv, n = M.min(6, 2 + M.floor(lv / 2)) * (w.evo ? 2 : 1), rad = (34 + lv) * P.area * (w.evo ? 1.3 : 1), spd = 2.3 + 0.12 * lv, dmg = (6 + 2 * (lv - 1)) * P.might * (w.evo ? 1.6 : 1);
    w.ang += spd * dt; w.n = n; w.rad = rad;
    var half = w.evo ? n / 2 : n, hits = 0;
    for (var i = 0; i < n; i++) {
      var ring2 = w.evo && i >= half, k = ring2 ? i - half : i, cnt = ring2 ? half : (w.evo ? half : n);
      var rr2 = ring2 ? rad * 0.62 : rad, a = (ring2 ? -w.ang * 1.2 : w.ang) + k / cnt * TAU;
      var sx = P.x + M.cos(a) * rr2, sy = P.y + M.sin(a) * rr2;
      w.pos = w.pos || []; w.pos[i] = w.pos[i] || { x: 0, y: 0 }; w.pos[i].x = sx; w.pos[i].y = sy;
      var q = query(sx, sy, 5 * M.sqrt(P.area));
      for (var j = 0; j < q; j++) {
        var e = qbuf[j]; if (e.orbT > R.time) continue; e.orbT = R.time + 0.35;
        hurt(e, dmg, M.cos(a), M.sin(a), 70); hits++;
      }
      hurtLanterns(sx, sy, 4);
    }
    if (hits) sfx('orb');
  },
  font: function (w, dt) {
    w.tk -= dt; var rad = (30 + 4 * w.lv) * P.area * (w.evo ? 1.5 : 1); w.rad = rad;
    if (w.tk > 0) return;
    w.tk = M.max(0.3, 0.6 - 0.035 * w.lv) * cdm();
    var dmg = (3.5 + 1.6 * w.lv) * P.might * (w.evo ? 1.6 : 1), n = query(P.x, P.y, rad);
    for (var i = 0; i < n; i++) { var e = qbuf[i]; e.slow = 0.7; hurt(e, dmg, 0, 0, 0); }
    hurtLanterns(P.x, P.y, rad);
    if (w.evo && n > 0) P.hp = M.min(P.max, P.hp + 1);
    w.pulse = 0.25;
  },
  sigil: function (w, dt) {
    w.cd -= dt; if (w.cd > 0) return;
    var t0 = randomNear(P.x, P.y, 125); if (!t0) { w.cd = 0.25; return; }
    w.cd = (2.3 - 0.12 * w.lv) * cdm();
    var cnt = 1 + M.floor(w.lv / 2) + (w.evo ? 3 : 0), dmg = (20 + 7 * (w.lv - 1)) * P.might * (w.evo ? 1.5 : 1), rad = 13 * P.area * (w.evo ? 1.4 : 1);
    for (var i = 0; i < cnt; i++) {
      var t = i === 0 ? t0 : randomNear(P.x, P.y, 125), tx, ty;
      if (t) { tx = t.x; ty = t.y; } else { tx = P.x + rr(-60, 60); ty = P.y + rr(-60, 60); }
      areaHit(tx, ty, rad, dmg, 50);
      var f = fx('bolt', tx + rr(-6, 6), ty - 90, 0.3); if (f) { f.x2 = tx; f.y2 = ty; f.c = 14; }
      var r2 = fx('ring', tx, ty, 0.25); if (r2) { r2.r = rad; r2.c = 22; }
    }
    shake(2); sfx('thunder');
  },
  flask: function (w, dt) {
    w.cd -= dt; if (w.cd > 0) return;
    w.cd = (2.5 - 0.13 * w.lv) * cdm();
    var cnt = 1 + M.floor(w.lv / 3) + (w.evo ? 2 : 0);
    for (var i = 0; i < cnt; i++) {
      var t = randomNear(P.x, P.y, 120), tx, ty;
      if (t) { tx = t.x + rr(-5, 5); ty = t.y + rr(-5, 5); } else { var a = rnd() * TAU; tx = P.x + M.cos(a) * 55; ty = P.y + M.sin(a) * 55; }
      var f = fx('flask', P.x, P.y, 0.55 + i * 0.08); if (!f) continue;
      f.x2 = tx; f.y2 = ty; f.pr = (17 + 1.2 * w.lv) * P.area * (w.evo ? 1.8 : 1); f.pd = (3 + 0.3 * w.lv) * (w.evo ? 1.4 : 1); f.dmg = (3 + 1.4 * w.lv) * P.might * (w.evo ? 1.5 : 1);
    }
    sfx('fire');
  },
  chain: function (w, dt) {
    w.cd -= dt; if (w.cd > 0) return;
    var t = nearest(P.x, P.y, 110); if (!t) { w.cd = 0.2; return; }
    w.cd = (1.8 - 0.1 * w.lv) * cdm();
    var chains = w.evo ? 2 : 1;
    for (var c = 0; c < chains; c++) {
      var cur = c === 0 ? t : (randomNear(P.x, P.y, 110) || t), px = P.x, py = P.y, hits = [], bounces = 2 + w.lv + (w.evo ? 5 : 0);
      for (var b = 0; b < bounces && cur; b++) {
        hits.push(cur.id);
        var f = fx('zap', px, py, 0.22); if (f) { f.x2 = cur.x; f.y2 = cur.y; f.c = 22; }
        px = cur.x; py = cur.y;
        hurt(cur, (8 + 2.8 * (w.lv - 1)) * P.might * M.pow(0.93, b) * (w.evo ? 1.5 : 1), 0, 0, 30);
        var nx = null, bd = 60 * 60, it = E.items;
        for (var i = 0; i < NE; i++) {
          var e = it[i]; if (!e.on || e.hp <= 0 || hits.indexOf(e.id) >= 0) continue;
          var dx = e.x - px, dy = e.y - py, d = dx * dx + dy * dy; if (d < bd) { bd = d; nx = e; }
        }
        cur = nx;
      }
    }
    sfx('zap');
  }
};

function updateProjectiles(dt) {
  eachOn(PB, function (b) {
    b.life -= dt; if (b.life <= 0) { b.on = false; return; }
    if (b.hom) {
      b.rt -= dt;
      if (!b.tgt || !b.tgt.on || b.tgt.hp <= 0) { if (b.rt <= 0) { b.tgt = nearest(b.x, b.y, 140); b.rt = 0.15; } }
      if (b.tgt && b.tgt.on) {
        var sp = M.sqrt(b.vx * b.vx + b.vy * b.vy), a = M.atan2(b.vy, b.vx), ta = M.atan2(b.tgt.y - b.y, b.tgt.x - b.x);
        var d = M.atan2(M.sin(ta - a), M.cos(ta - a)); a += clamp(d, -4 * dt, 4 * dt); b.vx = M.cos(a) * sp; b.vy = M.sin(a) * sp;
      }
      if (rnd() < 0.5) spark(b.x, b.y, rnd() < 0.5 ? 29 : 28, 0, 0, 0.25);
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    var n = query(b.x, b.y, b.r);
    for (var i = 0; i < n; i++) {
      var e = qbuf[i], seen = false;
      for (var k = 0; k < 6; k++) if (b.hit[k] === e.id) seen = true;
      if (seen) continue;
      var l = M.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
      hurt(e, b.dmg, b.vx / l, b.vy / l, 50);
      b.hit[b.hn % 6] = e.id; b.hn++;
      if (b.pierce-- <= 0) { b.on = false; burst(b.x, b.y, [29, 7], 3, 40, 0.25); return; }
    }
    hurtLanterns(b.x, b.y, 2);
  });
  eachOn(EB, function (b) {
    b.life -= dt; if (b.life <= 0) { b.on = false; return; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    var dx = b.x - P.x, dy = b.y - P.y;
    if (dx * dx + dy * dy < (b.r + 4) * (b.r + 4)) { hurtPlayer(b.dmg); b.on = false; }
  });
}
function updateEffects(dt) {
  eachOn(FX, function (f) {
    f.t += dt;
    if (f.k === 'flask' && f.t >= f.dur) { // bottle lands: burning pool
      f.on = false; var p = fx('pool', f.x2, f.y2, f.pd); if (p) { p.r = f.pr; p.dmg = f.dmg; p.tick = 0; } burst(f.x2, f.y2, [11, 12, 13], 8, 50, 0.4); sfx('fire'); return;
    }
    if (f.k === 'pool') {
      f.tick -= dt;
      if (f.tick <= 0) { f.tick = 0.35; areaHit(f.x, f.y, f.r, f.dmg, 0); eachOnPoolSlow(f); }
      if (rnd() < 0.6) spark(f.x + rr(-f.r, f.r) * 0.8, f.y + rr(-f.r, f.r) * 0.5, pick([11, 12, 13]), 0, -18, 0.5);
    }
    if (f.t >= f.dur) f.on = false;
  });
}
function eachOnPoolSlow(f) { /* burning pools also scorch: nothing extra, kept for clarity */ }

/* ---- gems & pickups ---- */
function updatePickups(dt) {
  var mr = P.magnet, mr2 = mr * mr, tk = 0;
  eachOn(GM, function (gm) {
    var dx = P.x - gm.x, dy = P.y - gm.y, d2 = dx * dx + dy * dy;
    if (!gm.pull && d2 < mr2) gm.pull = 1;
    if (gm.pull) {
      var d = M.sqrt(d2) || 1, sp = 120 + M.min(200, gm.pull * 80); gm.pull += dt * 3;
      gm.x += dx / d * sp * dt; gm.y += dy / d * sp * dt;
      if (rnd() < 0.2) spark(gm.x, gm.y, gm.k === 0 ? 22 : gm.k === 1 ? 18 : 11, 0, 0, 0.25);
      if (d2 < 36) { gm.on = false; addXp(gm.v); gemCombo(); sfx('gem'); }
    } else if (R.stepAcc % 20 === 0 && rnd() < 0.02) spark(gm.x + rr(-2, 2), gm.y + rr(-2, 2), 7, 0, 0, 0.2);
  });
  eachOn(PK, function (p) {
    p.life -= dt; if (p.life <= 0) { p.on = false; return; }
    var dx = P.x - p.x, dy = P.y - p.y, d2 = dx * dx + dy * dy;
    if (d2 < mr2 * 0.5 && p.k !== 'chest') { var d = M.sqrt(d2) || 1; p.x += dx / d * 100 * dt; p.y += dy / d * 100 * dt; }
    if (d2 < 100) {
      p.on = false;
      if (p.k === 'coin') { var v = M.max(1, M.round(p.v * P.greed)); R.gold += v; floatNum(P.x, P.y - 14, '+' + v, 13, 0); sfx('coin'); }
      else if (p.k === 'chicken') { P.hp = M.min(P.max, P.hp + P.max * 0.35); sfx('heal'); floatNum(P.x, P.y - 14, '+HP', 17, 0); }
      else if (p.k === 'rosary') smite();
      else if (p.k === 'orb') vacuum();
      else if (p.k === 'chest') { R.chestQ++; sfx('chest'); }
    }
  });
  eachOn(LN, function (l) { var dx = P.x - l.x, dy = P.y - l.y; if (dx * dx + dy * dy < 100) breakLantern(l); else if (dx * dx + dy * dy > 500 * 500) l.on = false; });
}
function updateParticles(dt) {
  eachOn(PT, function (p) {
    p.life -= dt; if (p.life <= 0) { p.on = false; return; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy = p.vy * 0.96 + p.gr * dt;
  });
  eachOn(FT, function (f) { f.life -= dt; f.y -= 14 * dt; if (f.life <= 0) { f.on = false; FT.count--; } });
}

/* ---- the fixed-step simulation ---- */
function stepGame(dt, ix, iy) {
  R.time += dt; R.stepAcc++;
  P.inv = M.max(0, P.inv - dt); P.hurt = M.max(0, P.hurt - dt);
  var l = M.sqrt(ix * ix + iy * iy);
  if (l > 1) { ix /= l; iy /= l; l = 1; }
  P.moving = l > 0.05;
  if (P.moving) { P.x += ix * P.speed * dt; P.y += iy * P.speed * dt; var nl = M.sqrt(ix * ix + iy * iy); P.fx = ix / nl; P.fy = iy / nl; if (ix > 0.1) P.face = 0; else if (ix < -0.1) P.face = 1; P.anim += dt * 9; }
  else P.anim = 0;
  if (P.regen && P.hp < P.max) P.hp = M.min(P.max, P.hp + P.regen * dt);
  director(dt);
  rebuildHash();
  updateEnemies(dt);
  for (var i = 0; i < R.weapons.length; i++) WFN[R.weapons[i].id](R.weapons[i], dt);
  updateProjectiles(dt);
  updateEffects(dt);
  for (var bi = 0; bi < boomQ.length && bi < 60; bi++) { var bm = boomQ[bi]; explode(bm.x, bm.y, 26, bm.dp, bm.de); }
  boomQ.length = 0;
  updatePickups(dt);
  updateParticles(dt);
  cam.x += (P.x - cam.x) * M.min(1, dt * 6); cam.y += (P.y - cam.y) * M.min(1, dt * 6);
  shk = M.max(0, shk - dt * 14); flashA = M.max(0, flashA - dt * 2.2);
  bannerT.t = M.max(0, bannerT.t - dt);
  if (P.hp < P.max * 0.3) R.lowT += dt;
  if (!R.over) {
    if (R.chestQ > 0) { openChest(); return; }
    if (R.pending > 0) openLevelUp();
  }
}

/* ---- level-up cards ---- */
var choices = [], chestInfo = null;
function makeChoices() {
  var pool = [], i, id;
  R.weapons.forEach(function (w) { if (!w.evo && w.lv < 8) pool.push({ k: 'w', id: w.id, lv: w.lv + 1 }); });
  if (R.weapons.length < 6) for (id in WDEF) if (!hasW(id)) pool.push({ k: 'w', id: id, lv: 1, isNew: 1 });
  var pc = Object.keys(R.pass).length;
  for (id in PDEF) { var cur = R.pass[id] || 0; if (cur > 0 && cur < 5) pool.push({ k: 'p', id: id, lv: cur + 1 }); else if (cur === 0 && pc < 6) pool.push({ k: 'p', id: id, lv: 1, isNew: 1 }); }
  for (i = pool.length - 1; i > 0; i--) { var j = (rnd() * (i + 1)) | 0, t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  var n = 3 + (rnd() < 0.12 + P.luck ? 1 : 0), out = pool.slice(0, n);
  if (!out.length) out = [{ k: 'gold', id: 'gold', lv: 0 }, { k: 'heal', id: 'heal', lv: 0 }];
  return out;
}
function openLevelUp() {
  choices = makeChoices(); R.state = 'levelup'; setState('levelup');
  flash(7, 0.55); sfx('level'); say('levelup', 1);
}
function applyChoice(c) {
  if (c.k === 'w') { if (c.isNew) addWeapon(c.id); else hasW(c.id).lv++; }
  else if (c.k === 'p') { R.pass[c.id] = (R.pass[c.id] || 0) + 1; recalc(); }
  else if (c.k === 'gold') { R.gold += 50; sfx('coin'); }
  else if (c.k === 'heal') { P.hp = M.min(P.max, P.hp + P.max * 0.4); sfx('heal'); }
  sfx('pick'); levelDone();
}
function levelDone() {
  R.pending--;
  if (R.pending > 0) { choices = makeChoices(); sfx('level'); } else setState('play');
}
function rerollChoices() { if (R.rerolls > 0) { R.rerolls--; choices = makeChoices(); sfx('click'); } }
function skipChoice() { P.hp = M.min(P.max, P.hp + P.max * 0.1); R.gold += 10; sfx('click'); levelDone(); }

/* ---- boss chest: evolutions ---- */
function openChest() {
  R.chestQ--; chestInfo = { open: 0, text: [], icon: 'chest', evo: null }; setState('chest'); sfx('chest');
}
function chestOpen() {
  if (chestInfo.open) return;
  chestInfo.open = 1;
  var elig = R.weapons.filter(function (w) { return w.lv >= 8 && !w.evo && (R.pass[WDEF[w.id].pair] || 0) > 0; });
  if (elig.length) {
    var w = pick(elig); w.evo = 1; R.evolved++;
    chestInfo.evo = w; chestInfo.icon = WDEF[w.id].icon;
    chestInfo.text = ['YOUR WEAPON AWAKENS...', WDEF[w.id].evo.toUpperCase() + '!'];
    say('evolve', 3); sfx('evolve'); flash(13, 0.8); shake(6);
  } else {
    var ups = 0, tries = 0;
    while (ups < 2 && tries++ < 20) {
      var o = makeChoices()[0];
      if (o && (o.k === 'w' || o.k === 'p')) { if (o.k === 'w') { if (o.isNew) addWeapon(o.id); else hasW(o.id).lv++; } else { R.pass[o.id] = (R.pass[o.id] || 0) + 1; recalc(); } chestInfo.text.push('+ ' + (o.k === 'w' ? WDEF[o.id].name : PDEF[o.id].name) + ' LV ' + o.lv); ups++; }
    }
    var gold = M.round(40 * P.greed); R.gold += gold; P.hp = P.max; chestInfo.text.push('+' + gold + ' GOLD  FULL HEAL'); sfx('heal');
  }
}

/* ---- end of run ---- */
function endRun(win) {
  if (R.over) return;
  R.over = true; R.win = win;
  if (win) R.gold += 200;
  save.gold += R.gold; save.best = M.max(save.best, M.floor(R.time)); save.kills += R.kills; save.runs++; if (win) save.wins++;
  save.hero = R.hero; writeSave();
  say(win ? 'win' : 'lose', 3);
  flash(win ? 13 : 10, 0.9); shake(8);
  if (win) { eachOn(E, function (e) { if (!e.boss) { e.hp = 0; killEnemy(e); } }); sfx('win'); } else sfx('lose');
  R.overT = 0;
  setState('over');
}
