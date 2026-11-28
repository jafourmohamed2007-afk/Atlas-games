/* Stick Dominion — original 2D stickman army strategy game for Bubzi.
   Mine gold, train an army, command it (Defend / Hold / Attack) or take command of one soldier, and topple the enemy Monument.
   Animation: the stickman-fighter rig (.claude/skills/stickman-fighter): spring joints, waist/chest/head spine, 2-bone IK legs on
   planted feet that step, contact hits (the weapon tip must touch the victim's body), limp ragdoll deaths that fade.
   Slimmed for armies: joints at 120 Hz, poses per unit type, one shared skeleton solver. Music/SFX: ElevenLabs via GameMusic. */
(function () {
  'use strict';
  var TAU = Math.PI * 2, clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; }, rnd = function (a, b) { return a + Math.random() * (b - a); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ================= rig (from the stickman-fighter engine) ================= */
  var LEN = { sp: 15, nk: 4, head: 8.2, ua: 15, fa: 15, th: 20, sh: 20.5, ft: 6.5, ank: 2.4 }, LEG = LEN.th + LEN.sh;
  var KEYS = ['px', 'py', 't1', 't2', 'tw', 'h', 'a1', 'e1', 'a2', 'e2', 'l1', 'k1', 'l2', 'k2', 'fa1', 'fa2'];
  function dir(a) { return [Math.sin(a), Math.cos(a)]; }
  function up(a) { return [Math.sin(a), -Math.cos(a)]; }
  function fwd(a) { return [Math.cos(a), Math.sin(a)]; }
  function add(p, d, k) { return [p[0] + d[0] * k, p[1] + d[1] * k]; }
  var STANCE = { px: -1, py: 35.5, t1: 0.06, t2: 0.05, tw: 0.35, h: 0.1, a1: 0.72, e1: 2.28, a2: 0.36, e2: 2.68, l1: 0.3, k1: -0.4, l2: -0.3, k2: -0.3, fa1: 0, fa2: 0.18, p1: 12, p2: -12 };
  function D(o, base) { var r = {}, k, b = base || STANCE; for (k in b) r[k] = b[k]; for (k in o) r[k] = o[k]; return r; }
  var POSE = {
    stance: D({}),
    march: D({ px: 2, py: 36, t1: 0.14, t2: 0.06, tw: 0.15, h: 0.05, a1: 0.9, e1: 1.5, a2: 0.2, e2: 1.2, p1: 12, p2: -12 }),
    // sword (Blade): the sword points along the forearm
    swHold: D({ px: 0, py: 35, t1: 0.08, tw: 0.4, a1: 0.95, e1: 1.25, a2: 0.4, e2: 2.4 }),
    swLoad: D({ px: -2, py: 34, t1: -0.08, t2: -0.06, tw: 0.75, h: 0.05, a1: 2.75, e1: 0.95, a2: 0.6, e2: 2.0, fa2: 0.4 }),
    swSlash: D({ px: 7, py: 33, t1: 0.38, t2: 0.15, tw: -0.55, h: 0.18, a1: 1.15, e1: 0.15, a2: -0.4, e2: 0.6, fa2: 1, p1: 16 }),
    swBack: D({ px: 5, py: 33, t1: 0.22, t2: 0.05, tw: 0.8, h: 0.1, a1: 1.65, e1: -0.75, a2: 0.2, e2: 1.8, fa1: 0.4 }),
    swThrust: D({ px: 9, py: 34, t1: 0.3, t2: 0.1, tw: 0.85, h: 0.12, a1: 1.57, e1: 0.02, a2: -0.3, e2: 0.8, fa2: 1, p1: 17 }),
    // spear (Pikeman): both hands on the shaft, long thrust
    pkHold: D({ px: 0, py: 35, t1: 0.1, tw: 0.2, a1: 1.15, e1: 0.6, a2: 1.0, e2: 1.1 }),
    pkLoad: D({ px: -4, py: 34, t1: 0.0, tw: 0.55, a1: 0.8, e1: 1.1, a2: 0.65, e2: 1.4, fa1: 0.3 }),
    pkThrust: D({ px: 9, py: 33, t1: 0.32, t2: 0.12, tw: -0.2, h: 0.12, a1: 1.5, e1: 0.05, a2: 1.42, e2: 0.25, fa2: 1, p1: 17 }),
    // sling (Slinger): whirl over the head, throw
    slLoad: D({ px: -3, py: 34, t1: -0.15, t2: -0.1, tw: 0.8, h: 0.0, a1: 3.0, e1: 0.4, a2: 1.1, e2: 0.6, fa2: 0.3 }),
    slThrow: D({ px: 5, py: 34, t1: 0.35, t2: 0.15, tw: -0.6, h: 0.15, a1: 1.45, e1: 0.05, a2: -0.5, e2: 0.5, fa2: 1, p1: 15 }),
    // club (Juggernaut): overhead load, ground slam
    clHold: D({ px: 0, py: 34, t1: 0.12, tw: 0.3, a1: 0.5, e1: 1.6, a2: 0.4, e2: 1.9 }),
    clLoad: D({ px: -4, py: 35, t1: -0.25, t2: -0.12, tw: 0.4, h: -0.05, a1: 2.95, e1: 0.35, a2: 2.7, e2: 0.5, fa1: 0.2 }),
    clSlam: D({ px: 8, py: 29, t1: 0.7, t2: 0.25, tw: 0.0, h: 0.2, a1: 1.05, e1: 0.15, a2: 1.0, e2: 0.25, p1: 16, p2: -14 }),
    // staff (Hexer): raise, cast
    hxHold: D({ px: 0, py: 35.5, t1: 0.04, tw: 0.2, a1: 0.55, e1: 0.85, a2: 0.3, e2: 2.4 }),
    hxLoad: D({ px: -2, py: 36, t1: -0.15, t2: -0.12, tw: 0.5, h: -0.15, a1: 2.6, e1: 0.2, a2: 2.4, e2: 0.4 }),
    hxCast: D({ px: 4, py: 35, t1: 0.25, t2: 0.12, tw: -0.2, h: 0.1, a1: 1.6, e1: 0.05, a2: 1.45, e2: 0.2, fa2: 0.6 }),
    // pickaxe (Digger)
    pkxLoad: D({ px: -1, py: 33, t1: 0.1, t2: 0.0, tw: 0.5, a1: 2.7, e1: 1.1, a2: 2.4, e2: 1.3, fa2: 0.3 }),
    pkxHit: D({ px: 4, py: 29, t1: 0.65, t2: 0.25, tw: 0.1, h: 0.25, a1: 0.95, e1: 0.35, a2: 0.85, e2: 0.45, p1: 14, p2: -13 }),
    carry: D({ px: 1, py: 35, t1: 0.3, t2: 0.12, tw: -0.2, h: 0.1, a1: -0.2, e1: 2.3, a2: -0.4, e2: 2.4 }),
    // bare-handed moves for a soldier under your command (kick from the skill's body kick)
    kickCh: D({ px: 0, py: 34, t1: -0.25, t2: -0.05, tw: 0, fk2: 1, l2: 1.45, k2: -2.2, fa1: 0.8, a2: -0.2, e2: 1.2 }),
    kick: D({ px: 3, py: 35, t1: -0.55, t2: -0.12, tw: -1, h: 0.25, fk2: 1, l2: 1.95, k2: -0.08, fa1: 1, a2: -0.9, e2: 0.25, a1: 0.95, e1: 2.15 }),
    hurt: D({ px: -4, py: 36.5, t1: -0.28, t2: -0.38, tw: 0.2, h: -0.6, a1: 0.1, e1: 1.1, a2: -0.25, e2: 0.9, fa1: 0.6 }),
    cheer: D({ px: 0, py: 37, t1: 0.0, t2: -0.06, tw: 0.1, h: -0.15, a1: 2.95, e1: 0.2, a2: 0.3, e2: 1.3, p1: 9, p2: -9, fa2: 0 }),
    cower: D({ px: -3, py: 28, t1: 0.5, t2: 0.3, tw: 0.2, h: 0.4, a1: 2.6, e1: 1.8, a2: 2.5, e2: 1.9 })
  };
  function deadPose() { return D({ t1: rnd(-0.04, 0.06), t2: rnd(-0.04, 0.05), h: 0.5, tw: 0.2, a1: rnd(0.08, 0.3), e1: rnd(0.05, 0.4), a2: rnd(-0.02, 0.15), e2: rnd(0, 0.3), fk1: 1, fk2: 1, l1: rnd(0.1, 0.32), k1: rnd(-0.45, -0.15), l2: rnd(-0.05, 0.08), k2: rnd(-0.12, 0), fa1: rnd(-0.9, -0.5), fa2: rnd(-0.9, -0.5) }); }
  function ik2(hp, tg, l1, l2, bendSign) {
    var dx = tg[0] - hp[0], dy = tg[1] - hp[1], d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
    var base = Math.atan2(dx, dy), al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), a = base + bendSign * al;
    var j = add(hp, dir(a), l1), e = add(hp, dir(base), d);
    return [j, e, a, Math.atan2(e[0] - j[0], e[1] - j[1]) - a];
  }

  /* ================= units ================= */
  // reach / range in rig units; dmg per hit; cd = seconds between attacks; s = body scale; w = weapon
  var TYPES = {
    digger: { cost: 150, hp: 60, dmg: 4, reach: 30, spd: 62, cd: 1.6, s: 0.92, w: 'pick', time: 3, pop: 1 },
    blade: { cost: 120, hp: 110, dmg: 14, reach: 38, spd: 70, cd: 1.0, s: 1, w: 'sword', time: 3.5, pop: 1 },
    slinger: { cost: 200, hp: 80, dmg: 11, reach: 330, spd: 66, cd: 1.7, s: 0.95, w: 'sling', time: 4.5, pop: 1, ranged: 1, unlock: 2 },
    pike: { cost: 260, hp: 170, dmg: 20, reach: 62, spd: 58, cd: 1.35, s: 1.05, w: 'spear', time: 5, pop: 1, unlock: 4 },
    hexer: { cost: 600, hp: 120, dmg: 26, reach: 300, spd: 55, cd: 2.6, s: 1, w: 'staff', time: 7, pop: 2, ranged: 1, aoe: 55, unlock: 6 },
    giant: { cost: 900, hp: 900, dmg: 55, reach: 52, spd: 40, cd: 2.4, s: 1.65, w: 'club', time: 11, pop: 3, aoe: 60, unlock: 8 },
    warlord: { cost: 0, hp: 3200, dmg: 75, reach: 60, spd: 38, cd: 2.2, s: 2.1, w: 'club', time: 0, pop: 0, aoe: 75, boss: 1 }
  };
  var TYPE_ORDER = ['digger', 'blade', 'slinger', 'pike', 'hexer', 'giant'];
  var WEAPON = { // hold pose, weapon length, angle offset from the forearm, attack steps
    pick: { hold: 'march', len: 17, off: 1.45, atk: [['pkxLoad', 0.28, 9], ['pkxHit', 0.16, 18, 1], ['march', 0.3, 9]] },
    sword: { hold: 'swHold', len: 27, off: 0.0, atk: [['swLoad', 0.26, 11], ['swSlash', 0.16, 20, 1], ['swHold', 0.3, 10]] },
    spear: { hold: 'pkHold', len: 58, off: -0.05, back: 14, atk: [['pkLoad', 0.3, 10], ['pkThrust', 0.18, 19, 1], ['pkHold', 0.34, 9]] },
    sling: { hold: 'march', len: 8, off: 0, atk: [['slLoad', 0.42, 9], ['slThrow', 0.16, 18, 2], ['march', 0.35, 9]] },
    staff: { hold: 'hxHold', len: 30, off: 0.0, back: 6, atk: [['hxLoad', 0.5, 7], ['hxCast', 0.2, 14, 2], ['hxHold', 0.5, 8]] },
    club: { hold: 'clHold', len: 34, off: 0.0, atk: [['clLoad', 0.5, 8], ['clSlam', 0.2, 16, 3], ['clHold', 0.5, 8]] }
  };
  // a soldier you command gets combos: three sword strikes, a thrust and a kick (by weapon)
  var COMBO = {
    sword: [[['swLoad', 0.18, 14], ['swSlash', 0.13, 21, 1]], [['swBack', 0.15, 20, 1]], [['swLoad', 0.12, 14], ['swThrust', 0.14, 22, 1, 1.6]]],
    spear: [[['pkLoad', 0.2, 12], ['pkThrust', 0.14, 21, 1]], [['pkHold', 0.1, 14], ['pkThrust', 0.14, 22, 1, 1.4]]],
    club: [[['clLoad', 0.36, 10], ['clSlam', 0.16, 18, 3, 1.3]]],
    pick: [[['pkxLoad', 0.2, 12], ['pkxHit', 0.13, 20, 1]]],
    sling: [[['slLoad', 0.26, 13], ['slThrow', 0.12, 20, 2]]],
    staff: [[['hxLoad', 0.3, 10], ['hxCast', 0.15, 16, 2]]]
  };
  var KICK = [['kickCh', 0.12, 16], ['kick', 0.14, 22, 4, 0.9], ['stance', 0.2, 10]];

  function Unit(side, type, x) {
    var T = TYPES[type];
    this.side = side; this.face = side === 0 ? 1 : -1; this.type = type; this.T = T; this.x = x; this.vx = 0; this.lz = rnd(-10, 10);
    this.s = T.s; this.maxHp = T.hp; this.hp = T.hp; this.dead = false; this.alpha = 1; this.deadT = 0; this.cd = rnd(0, 0.6);
    this.j = {}; for (var i = 0; i < KEYS.length; i++) this.j[KEYS[i]] = { v: STANCE[KEYS[i]], w: 0 };
    this.target = POSE[WEAPON[T.w].hold]; this.f = 8; this.z = 0.6; this.queue = []; this.cur = null; this.curT = 0;
    this.feet = [{ x: x + this.face * 12 * this.s, lift: 0, sw: null }, { x: x - this.face * 12 * this.s, lift: 0, sw: null }];
    this.legIK = [true, true]; this.rot = { v: 0, w: 0 }; this.rotT = 0; this.L = null; this.flash = 0; this.hitSet = null; this.job = null; this.gold = 0; this.boss = !!T.boss;
    this.solveL();
  }
  Unit.prototype.solveL = function () { this.L = solve(this); };
  Unit.prototype.play = function (steps, replace) { if (replace) { this.queue = []; this.cur = null; } for (var i = 0; i < steps.length; i++) this.queue.push(steps[i]); };
  Unit.prototype.busy = function () { return !!this.cur || this.queue.length > 0; };
  // world position of a joint (x right, y down, ground = 0)
  Unit.prototype.w = function (n) { var p = this.L[n]; return [this.x + this.face * p[0] * this.s, (p[1] + this.yo) * this.s]; };

  function solve(U) {
    var j = U.j, v = function (k) { return j[k].v; }, rag = U.dead, L = {};
    var t1 = v('t1'), cs = t1 + v('t2'), tw = v('tw'), pel = rag ? [0, 0] : [v('px'), -v('py')], foot = [], i;
    for (i = 0; i < 2; i++) {
      if (!rag && U.legIK[i]) {
        var ft = U.feet[i], fx = (ft.x - U.x) * U.face / U.s, ph = clamp(v('fa' + (i + 1)), 0, 1) * 0.95, toe = [fx + LEN.ft, -ft.lift / U.s], ank = [toe[0] - LEN.ft * Math.cos(ph), toe[1] - LEN.ank - LEN.ft * Math.sin(ph)];
        foot[i] = { toe: toe, ank: ank };
        var hx = pel[0] + fwd(t1)[0] * 2.2 * tw * (i ? -0.6 : 0.6), dx = ank[0] - hx, need = ank[1] - Math.sqrt(Math.max(0, (LEG - 0.4) * (LEG - 0.4) - dx * dx));
        if (pel[1] < need) pel[1] = need;
      }
    }
    L.pel = pel; L.mid = add(pel, up(t1), LEN.sp); L.neck = add(L.mid, up(cs), LEN.sp); L.head = add(L.neck, up(cs + v('h')), LEN.nk + LEN.head);
    var sb = add(L.mid, up(cs), LEN.sp * 0.9);
    L.s1 = add(sb, fwd(cs), 3.2 * tw); L.s2 = add(sb, fwd(cs), -3.2 * tw); L.hp1 = add(pel, fwd(t1), 2.2 * tw * 0.6); L.hp2 = add(pel, fwd(t1), -2.2 * tw * 0.6);
    for (i = 1; i <= 2; i++) { L['e' + i] = add(L['s' + i], dir(v('a' + i)), LEN.ua); L['h' + i] = add(L['e' + i], dir(v('a' + i) + v('e' + i)), LEN.fa); }
    for (i = 0; i < 2; i++) {
      var n = i + 1, hp = L['hp' + n];
      if (foot[i]) { var q = ik2(hp, foot[i].ank, LEN.th, LEN.sh, 1); L['kn' + n] = q[0]; L['an' + n] = q[1]; L['toe' + n] = foot[i].toe; L['ikA' + n] = [q[2], q[3]]; }
      else { L['kn' + n] = add(hp, dir(v('l' + n)), LEN.th); L['an' + n] = add(L['kn' + n], dir(v('l' + n) + v('k' + n)), LEN.sh); L['toe' + n] = add(L['an' + n], dir(v('l' + n) + v('k' + n) + 1.4 + v('fa' + n) * 0.9), LEN.ft); }
    }
    // weapon: from the lead hand along the forearm (+ offset)
    var wp = WEAPON[U.T.w], wa = v('a1') + v('e1') + wp.off; L.wb = add(L.h1, dir(wa), -(wp.back || 0)); L.wt = add(L.h1, dir(wa), wp.len); L.wa = wa;
    if (rag) { var r0 = U.rot.v, c = Math.cos(r0), sn = Math.sin(r0); for (var k in L) { var p = L[k]; if (p && p.length === 2 && typeof p[0] === 'number' && k.indexOf('ikA') < 0) L[k] = [p[0] * c - p[1] * sn, p[0] * sn + p[1] * c]; } }
    var low = -1e9; for (k in L) { if (k.indexOf('ikA') === 0 || k === 'wa' || k === 'wt' || k === 'wb') continue; var lo = L[k][1] + (k === 'head' ? LEN.head : 2.1); if (lo > low) low = lo; }
    U.yo = rag ? -low : 0; return L;
  }
  function stepSprings(U, dt) {
    var tg = U.target, wn = TAU * U.f, z = U.z;
    for (var i = 0; i < KEYS.length; i++) { var k = KEYS[i], s = U.j[k], t = tg[k] != null ? tg[k] : STANCE[k], ww = (k === 'px' || k === 'py') ? Math.min(wn, TAU * 13) : wn; s.w += (ww * ww * (t - s.v) - 2 * z * ww * s.w) * dt; s.v += s.w * dt; }
    if (U.dead) { U.rot.w += (40 * (U.rotT - U.rot.v) - 9 * U.rot.w) * dt; U.rot.v += U.rot.w * dt; }
  }
  function stepFeet(U, dt) {
    if (U.dead) return;
    var want = [(U.target.p1 != null ? U.target.p1 : 12) * U.s, (U.target.p2 != null ? U.target.p2 : -12) * U.s];
    for (var i = 0; i < 2; i++) {
      var ft = U.feet[i]; if (!U.legIK[i]) continue;
      if (ft.sw) { ft.sw.t += dt; var k = clamp(ft.sw.t / ft.sw.d, 0, 1), e = k * k * (3 - 2 * k); ft.x = ft.sw.x0 + (ft.sw.x1 - ft.sw.x0) * e; ft.lift = ft.sw.h0 * (1 - e) + Math.sin(Math.PI * k) * ft.sw.arc; if (k >= 1) { ft.sw = null; ft.lift = 0; } continue; }
      var goal = U.x + U.face * want[i] + U.vx * 0.12, err = Math.abs(ft.x - goal), oth = U.feet[1 - i].sw;
      if (err > 5.5 * U.s && (!oth || err > 18 * U.s)) ft.sw = { t: 0, d: clamp(0.1 + err / 420, 0.1, 0.24), x0: ft.x, x1: goal, h0: ft.lift, arc: Math.min(8, 1.5 + err * 0.22) * U.s };
    }
  }
  function setLegFK(U, i, fk) { // kicks: copy IK angles into the springs on the way out, start a step on the way back
    if (U.legIK[i] === !fk) return; var n = i + 1;
    if (fk) { var a = U.L['ikA' + n]; if (a) { U.j['l' + n].v = a[0]; U.j['k' + n].v = a[1]; } }
    else { var an = U.w('an' + n), ft = U.feet[i]; ft.x = an[0]; ft.lift = Math.max(0, -an[1]); ft.sw = { t: 0, d: 0.12, x0: ft.x, x1: U.x + U.face * (i ? -12 : 12) * U.s, h0: ft.lift, arc: 2 }; }
    U.legIK[i] = !fk;
  }
  // body capsule (pelvis → neck) and head circle, world space
  function capsule(U) { var a = U.w('pel'), b = U.w('neck'), h = U.w('head'); return { a: a, b: b, h: h, r: 5 * U.s, hr: LEN.head * U.s }; }
  function segDist(a, b, p) { var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2, 0, 1); return Math.hypot(a[0] + dx * t - p[0], a[1] + dy * t - p[1]); }
  function touches(pts, rr, V) { // any effector point within the victim's capsule or head
    var C = capsule(V); for (var i = 0; i < pts.length; i++) { var p = pts[i]; if (segDist(C.a, C.b, p) < C.r + rr || Math.hypot(p[0] - C.h[0], p[1] - C.h[1]) < C.hr + rr) return true; } return false;
  }
  function effPts(U, kind) { // the parts that strike: weapon (3 points along it) or the kicking foot
    if (kind === 4) return [U.w('an2'), U.w('toe2')];
    var b = U.w('h1'), t = U.w('wt'); return [t, [lerp(b[0], t[0], 0.66), lerp(b[1], t[1], 0.66)], [lerp(b[0], t[0], 0.33), lerp(b[1], t[1], 0.33)]];
  }

  /* ================= battle ================= */
  var WORLD = 3000, MON_X = [170, WORLD - 170], ORE_X = [470, WORLD - 470], DEF_X = [700, WORLD - 700], POP0 = 24;
  var B = null, K0 = null, cam = 0, zoom = 1, gy = 0, bb = 80, fx = [], ui = [], phase = 'map', mapSel = 0, endInfo = null, drag = null, held = {}, music = null, musicOn = false, iconUnits = {};
  var LEVELS = [ // enemy: income per s, starting army, unit mix, army power before it attacks, diggers, boss
    { inc: 1.0, start: ['blade'], mix: { blade: 1 }, atk: 5, dig: 2 },
    { inc: 1.4, start: ['blade', 'slinger'], mix: { blade: 2, slinger: 1 }, atk: 6, dig: 2 },
    { inc: 1.8, start: ['blade', 'blade', 'slinger'], mix: { blade: 2, slinger: 2 }, atk: 7, dig: 3 },
    { inc: 2.2, start: ['pike', 'blade'], mix: { blade: 2, slinger: 1, pike: 2 }, atk: 8, dig: 3 },
    { inc: 2.6, start: ['pike', 'slinger', 'blade', 'blade'], mix: { blade: 2, slinger: 2, pike: 2 }, atk: 9, dig: 3 },
    { inc: 3.0, start: ['giant'], mix: { blade: 2, slinger: 2, pike: 1 }, atk: 9, dig: 4 },
    { inc: 3.6, start: ['blade', 'blade', 'blade'], mix: { blade: 4, slinger: 1 }, atk: 5, dig: 4 },
    { inc: 3.8, start: ['hexer', 'pike'], mix: { blade: 2, slinger: 2, pike: 2, hexer: 1 }, atk: 10, dig: 4 },
    { inc: 4.2, start: ['giant', 'slinger', 'slinger'], mix: { blade: 2, slinger: 2, pike: 2, hexer: 1, giant: 1 }, atk: 11, dig: 4 },
    { inc: 4.8, start: ['pike', 'pike', 'hexer'], mix: { blade: 2, slinger: 3, pike: 2, hexer: 2, giant: 1 }, atk: 12, dig: 5 },
    { inc: 5.4, start: ['giant', 'hexer', 'hexer'], mix: { blade: 2, slinger: 2, pike: 3, hexer: 2, giant: 2 }, atk: 13, dig: 5 },
    { inc: 6.0, start: ['pike', 'pike', 'slinger', 'slinger'], mix: { blade: 2, slinger: 3, pike: 3, hexer: 2, giant: 2 }, atk: 13, dig: 5, boss: 1 }
  ];
  var UPG = ['dmg', 'hp', 'dig', 'gold', 'mon', 'pop'], UPG_MAX = 5;
  function store(k, d) { var v = K0.store.get('sd:' + k, d); return v === null || v === undefined ? d : v; }
  function save(k, v) { K0.store.set('sd:' + k, v); }
  function upg(k) { var o = store('upg', {}); return Math.max(0, Math.min(UPG_MAX, (o && o[k]) || 0)); }
  function upgPrice(k) { var lv = upg(k); return lv >= UPG_MAX ? 0 : 12 + lv * 10; }
  function gems() { return Math.max(0, Math.floor(store('gems', 0))); }
  function unlocked() { return Math.max(0, store('unl', 0)); } // highest level index you may play
  function stars(i) { var o = store('stars', {}); return (o && o[i]) || 0; }

  function newBattle(K, lvl, survival) {
    var L0 = survival ? { inc: 2, start: [], mix: { blade: 3, slinger: 2, pike: 1 }, atk: 99, dig: 0 } : LEVELS[lvl];
    B = { lvl: lvl, survival: !!survival, L: L0, units: [], projs: [], gold: [300 + 60 * upg('gold'), 300], cmd: ['defend', 'defend'], hold: [DEF_X[0], DEF_X[1]], q: [[], []],
      mon: [{ x: MON_X[0], hp: 0, max: 1500 * (1 + 0.15 * upg('mon')) }, { x: MON_X[1], hp: 0, max: survival ? 1e9 : 1200 + lvl * 260 }], t: 0, ai: 0, me: null, combo: 0, comboT: 0, wave: 0, waveT: 12,
      kills: 0, lost: 0, warlord: false, over: false };
    B.mon[0].hp = B.mon[0].max; B.mon[1].hp = B.mon[1].max;
    for (var i = 0; i < 2; i++) spawnUnit(0, 'digger', MON_X[0] + 70 + i * 20);
    spawnUnit(0, 'blade', MON_X[0] + 140);
    if (!survival) { for (i = 0; i < Math.min(2, L0.dig); i++) spawnUnit(1, 'digger', MON_X[1] - 70 - i * 20); L0.start.forEach(function (t, k) { spawnUnit(1, t, MON_X[1] - 160 - k * 30); }); if (L0.boss) { /* the Warlord arrives when the Monument is hurt */ } }
    cam = 0; fx = []; phase = 'battle'; K.info(survival ? K.t('survival') : K.t('level') + ' ' + (lvl + 1)); K.sfx('horn');
  }
  function spawnUnit(side, type, x) {
    var U = new Unit(side, type, x);
    if (side === 0) { U.maxHp = U.hp = Math.round(U.T.hp * (1 + 0.1 * upg('hp'))); }
    else if (B.survival) { var k = 1 + B.wave * 0.08; U.maxHp = U.hp = Math.round(U.T.hp * k); U.dmgM = 1 + B.wave * 0.04; }
    else { var ez = Math.min(1, 0.85 + B.lvl * 0.075) * (1 + Math.max(0, B.lvl - 2) * 0.06); U.maxHp = U.hp = Math.round(U.T.hp * ez); U.dmgM = Math.min(1, 0.85 + B.lvl * 0.075) * (1 + B.lvl * 0.04); } // early levels are gentler
    U.hold = B.hold[side]; B.units.push(U); return U;
  }
  function pop(side) { var n = 0; B.units.forEach(function (U) { if (U.side === side && !U.dead) n += U.T.pop; }); B.q[side].forEach(function (q) { n += TYPES[q.type].pop; }); return n; }
  function popMax() { return POP0 + 3 * upg('pop'); }
  function canTrain(side, type) { var T = TYPES[type]; if (side === 0 && T.unlock && unlocked() < T.unlock - 1 && !B.survival) return false; if (side === 0 && B.survival && T.unlock && unlocked() < T.unlock - 1) return false; return B.gold[side] >= T.cost && pop(side) + T.pop <= (side === 0 ? popMax() : 40) && B.q[side].length < 6; }
  function train(K, side, type) { if (!canTrain(side, type)) { if (side === 0) K.sfx('wrong'); return false; } B.gold[side] -= TYPES[type].cost; B.q[side].push({ type: type, t: TYPES[type].time * (side === 1 ? 0.8 : 1), max: TYPES[type].time }); if (side === 0) K.sfx('click'); return true; }
  function command(K, side, c) { B.cmd[side] = c; if (c === 'hold') { var fr = side === 0 ? -1e9 : 1e9; B.units.forEach(function (U) { if (U.side === side && !U.dead && U.type !== 'digger') fr = side === 0 ? Math.max(fr, U.x) : Math.min(fr, U.x); }); B.hold[side] = Math.abs(fr) > 1e8 ? DEF_X[side] : fr; } if (side === 0) K.sfx(c === 'attack' ? 'horn' : c === 'defend' ? 'retreat' : 'click'); }
  function enemiesOf(U) { return B.units.filter(function (V) { return V.side !== U.side && !V.dead; }); }
  function nearestEnemy(U, range) { var best = null, bd = range; B.units.forEach(function (V) { if (V.side === U.side || V.dead) return; var d = Math.abs(V.x - U.x); if (d < bd) { bd = d; best = V; } }); return best; }
  function power(side) { var p = 0; B.units.forEach(function (U) { if (U.side === side && !U.dead && U.type !== 'digger') p += U.T.pop * (U.hp / U.maxHp); }); return p; }

  function startAttack(U, steps) { U.play(steps.map(function (s) { return { p: s[0], t: s[1], f: s[2], hit: s[3] || 0, m: s[4] || 1 }; }), true); }
  function damage(K, V, dmg, from, kb, kind) {
    if (V.dead) return; V.hp -= dmg; V.flash = 0.12;
    var d = from ? (V.x > from.x ? 1 : -1) : -V.face;
    V.kb = (V.kb || 0) + d * kb / Math.max(1, V.T.s * V.T.s); V.j.t1.w -= V.face * d * 5; V.j.h.w -= V.face * d * 9; V.j.t2.w -= V.face * d * 4; // the hit pushes the springs (recoil from physics)
    if (V === B.me) K.shake(3);
    sparks(V.x, -55 * V.s, d, kind === 3 ? 10 : 6, V.side === 0 ? '#9CC8FF' : '#FF8A8A');
    if (V.hp <= 0) { kill(K, V, d); return; }
    if (!V.busy() && dmg > 6 && V !== B.me) { V.target = POSE.hurt; V.f = 12; V.z = 0.5; V.hurtT = 0.22; }
    if (V.side === 0 || V === B.me) K.sfx('hit'); 
  }
  function kill(K, V, d) {
    V.dead = true; V.hp = 0; V.queue = []; V.cur = null; V.rotT = -1.57; V.rot.v = 0; V.rot.w = -2; V.target = deadPose(); V.f = 3.2; V.z = 0.95; V.deadT = 0; V.legIK = [false, false];
    V.j.t1.w -= 4; V.j.h.w -= 6; V.kb = (V.kb || 0) + d * 40;
    K.sfx('die'); for (var i = 0; i < 8; i++) fx.push({ k: 'dot', x: V.x, y: -45 * V.s, vx: rnd(-120, 120) + d * 80, vy: rnd(-260, -80), t: 0, life: rnd(0.5, 0.9), col: '#1A1424', r: rnd(2, 4) });
    if (V.side === 1) { B.kills++; if (!B.survival) B.gold[0] += Math.round(V.T.cost * 0.08); } else B.lost++;
    if (V === B.me) { B.me = null; K.toast(K.t('fallen')); }
  }
  function hitMonument(K, side, dmg) { var M = B.mon[side]; M.hp -= dmg; M.hitT = 0.2; if (side === 1 && M.hp < M.max * 0.5 && B.L.boss && !B.warlord) { B.warlord = true; var W = spawnUnit(1, 'warlord', MON_X[1] - 120); W.maxHp = W.hp = 3200; K.sfx('slam'); K.shake(10); K.toast(K.t('warlord')); } if (Math.random() < 0.3) K.sfx('crack'); }
  function sparks(x, y, d, n, col) { for (var i = 0; i < n; i++) fx.push({ k: 'spark', x: x, y: y, vx: d * rnd(60, 260) + rnd(-60, 60), vy: rnd(-220, 40), t: 0, life: rnd(0.15, 0.32), col: col }); }
  function quake(x, s) { fx.push({ k: 'ring', x: x, y: 0, r: 70 * s, t: 0, life: 0.4 }); for (var i = 0; i < 10; i++) fx.push({ k: 'rock', x: x + rnd(-30, 30) * s, y: -2, vx: rnd(-200, 200), vy: rnd(-380, -160), t: 0, life: rnd(0.5, 0.9), r: rnd(2, 5) * s, col: '#8A7660' }); fx.push({ k: 'crater', x: x, y: 0, r: 30 * s, t: 0, life: 2.2 }); }

  // fire a stone (sling) or an ink bolt (staff) on a ballistic arc toward the target's predicted spot
  function shoot(K, U, tgt) {
    var bolt = U.T.w === 'staff', p = U.w(bolt ? 'wt' : 'h1'), tx = tgt ? tgt.x + (tgt.vx || 0) * 0.5 : U.x + U.face * U.T.reach * 0.8, ty = tgt ? -50 * tgt.s : -40, tt = bolt ? 0.75 : 0.6;
    if (!tgt) { var M = B.mon[1 - U.side]; tx = M.x; ty = -120; }
    var g = bolt ? 420 : 900; B.projs.push({ k: bolt ? 'bolt' : 'stone', side: U.side, x: p[0], y: p[1], vx: (tx - p[0]) / tt, vy: (ty - p[1] - 0.5 * g * tt * tt) / tt, g: g, t: 0, dmg: U.T.dmg * dmgMul(U), aoe: U.T.aoe || 0, from: U });
    K.sfx(bolt ? 'hex' : 'sling');
  }
  function dmgMul(U) { return (U.side === 0 ? 1 + 0.08 * upg('dmg') : (U.dmgM || 1 + (B.survival ? 0 : B.lvl * 0.05))) * (U === B.me ? 1.5 : 1); }

  function think(K, U, dt) { // one soldier: pick a target or a post, walk, attack
    var T = U.T, cmd = B.cmd[U.side], dirE = U.side === 0 ? 1 : -1, reach = T.reach * U.s;
    if (U.type === 'digger') { dig(K, U, dt); return; }
    var aggro = cmd === 'attack' ? 520 : 360, tgt = nearestEnemy(U, T.ranged ? Math.max(aggro, reach + 40) : aggro), post = cmd === 'attack' ? MON_X[1 - U.side] - dirE * (90 + U.lz * 2) : cmd === 'hold' ? B.hold[U.side] - dirE * Math.abs(U.lz) * 4 : DEF_X[U.side] - dirE * (Math.abs(U.lz) * 5 + (T.ranged ? 70 : 0));
    if (tgt && cmd !== 'attack' && Math.abs(tgt.x - post) > 520) tgt = null; // stay near the post
    var goal = post, wantAtk = null;
    if (tgt) { var d = Math.abs(tgt.x - U.x), r = reach + 9 * tgt.s; if (d > r * 0.92) goal = tgt.x - Math.sign(tgt.x - U.x) * r * 0.8; else { goal = U.x; wantAtk = tgt; } }
    else if (cmd === 'attack' && Math.abs(MON_X[1 - U.side] - U.x) < reach + 90) { goal = U.x; wantAtk = 'mon'; }
    if (U.busy()) { U.vx = 0; return; }
    var dx = goal - U.x;
    if (tgt && !wantAtk) { U.face = tgt.x > U.x ? 1 : -1; U.vx = U.face * T.spd; return; } // out of reach: step in until the weapon can touch
    if (wantAtk) { U.face = (wantAtk === 'mon' ? MON_X[1 - U.side] : wantAtk.x) > U.x ? 1 : -1; U.vx = 0; if (U.cd <= 0) { U.tgt = wantAtk; U.cd = T.cd * rnd(0.85, 1.15); startAttack(U, WEAPON[T.w].atk); } }
    else if (Math.abs(dx) > 10) { U.face = dx > 0 ? 1 : -1; U.vx = U.face * T.spd; }
    else { U.vx = 0; U.face = dirE; }
  }
  function dig(K, U, dt) { // diggers: walk to the ore, swing 3 times, carry the sack home, repeat; hide from danger
    var J = U.job || (U.job = { s: 'toOre', n: 0 }), home = MON_X[U.side] + (U.side ? -60 : 60), ore = ORE_X[U.side] + U.lz * 3, danger = nearestEnemy(U, 160);
    if (danger && U.side === 0 && J.s !== 'flee') J.s = 'flee';
    if (J.s === 'flee') { if (!nearestEnemy(U, 240)) J.s = U.gold ? 'toBase' : 'toOre'; else { if (Math.abs(home - U.x) > 10) { U.face = home > U.x ? 1 : -1; U.vx = U.face * U.T.spd * 1.3; } else { U.vx = 0; U.target = POSE.cower; } return; } }
    if (U.busy()) { U.vx = 0; return; }
    var goal = J.s === 'toBase' ? home : ore, dx = goal - U.x;
    if (Math.abs(dx) > 8) { U.face = dx > 0 ? 1 : -1; U.vx = U.face * U.T.spd * (U.side === 0 ? 1 + 0.12 * upg('dig') : 1); return; }
    U.vx = 0;
    if (J.s === 'toOre') { U.face = U.side === 0 ? 1 : -1; if (J.n >= 3) { J.s = 'toBase'; J.n = 0; return; } startAttack(U, WEAPON.pick.atk); U.mining = true; }
    else if (J.s === 'toBase') { var g = U.gold; B.gold[U.side] += g; U.gold = 0; J.s = 'toOre'; if (U.side === 0 && g) { K.sfx('gold'); var s = toScreen(U.x, -90); K.floatText(s[0], s[1], '+' + g, '#FFD23F', 18); } }
  }
  function stepUnit(K, U, dt) {
    U.flash = Math.max(0, U.flash - dt); U.cd -= dt; if (U.hurtT > 0) { U.hurtT -= dt; if (U.hurtT <= 0) U.target = POSE[WEAPON[U.T.w].hold]; }
    if (U.dead) { U.deadT += dt; if (U.deadT > 2.2) U.alpha = Math.max(0, 1 - (U.deadT - 2.2) / 0.8); }
    // timeline
    if (!U.dead) {
      if (!U.cur && U.queue.length) { U.cur = U.queue.shift(); U.curT = 0; U.hitSet = []; U.target = POSE[U.cur.p]; U.f = U.cur.f; U.z = 0.62; if (U.cur.hit === 4) setLegFK(U, 1, true); if (U.cur.hit === 2) shoot(K, U, U.tgt && U.tgt !== 'mon' && !U.tgt.dead ? U.tgt : null); if (U.cur.hit === 1 || U.cur.hit === 3) K.sfx(U.T.w === 'spear' ? 'spear' : U.T.w === 'pick' ? 'whoosh' : 'whoosh'); }
      if (U.cur) { U.curT += dt; if (U.curT >= U.cur.t) { var c = U.cur; U.cur = null; if (c.hit === 3) slamEnd(K, U); if (c.hit === 4) setLegFK(U, 1, false); if (U.mining && c.p === 'pkxHit') { U.gold += 5; U.job.n++; K.sfx(U.side === 0 && Math.abs(U.x - cam - K.W / zoom / 2) < K.W / zoom ? 'pick' : 'none'); sparks(U.w('wt')[0], -4, U.face, 4, '#FFD23F'); } if (!U.queue.length) { U.mining = false; U.target = POSE[U === B.me ? WEAPON[U.T.w].hold : WEAPON[U.T.w].hold]; U.f = 9; } } }
      else if (Math.abs(U.vx) > 1) { U.target = U.job && U.job.s === 'toBase' ? POSE.carry : POSE[U.T.w === 'sling' || U.T.w === 'pick' ? 'march' : WEAPON[U.T.w].hold]; U.f = 9; }
    }
    // movement (+ knockback), two substeps for springs, feet and contact
    U.kb = (U.kb || 0) * Math.pow(0.02, dt); var mv = (U.vx + U.kb) * dt, ns = Math.max(2, Math.ceil(dt * 120)); // stiff joints need small steps: at least 120 Hz
    for (var sub = 0; sub < ns; sub++) {
      var h = dt / ns; U.x = clamp(U.x + mv / ns, 40, WORLD - 40); stepSprings(U, h); stepFeet(U, h); U.L = solve(U);
      if (U.cur && (U.cur.hit === 1 || U.cur.hit === 3 || U.cur.hit === 4) && U.curT > U.cur.t * 0.25) contact(K, U);
    }
  }
  function contact(K, U) { // the weapon (or foot) must touch a body; the Monument is a tall box
    var pts = effPts(U, U.cur.hit), dmg = U.T.dmg * dmgMul(U) * (U.cur.m || 1) * (U.cur.hit === 4 ? 0.6 : 1);
    for (var i = 0; i < B.units.length; i++) {
      var V = B.units[i]; if (V.side === U.side || V.dead || U.hitSet.indexOf(V) >= 0 || Math.abs(V.x - U.x) > 150 * U.s) continue;
      if (touches(pts, 2.5 * U.s, V)) { U.hitSet.push(V); damage(K, V, dmg, U, U.cur.hit === 4 ? 260 : U.type === 'giant' || U.type === 'warlord' ? 160 : 70, U.cur.hit); hitFeel(K, U, V); if (U.cur.hit === 1 && U.type !== 'giant' && U.hitSet.length >= (U === B.me ? 2 : 1)) break; }
    }
    var M = B.mon[1 - U.side], tip = pts[0];
    if (U.hitSet.indexOf('mon') < 0 && Math.abs(tip[0] - M.x) < 46 && tip[1] > -250) { U.hitSet.push('mon'); hitMonument(K, 1 - U.side, dmg); sparks(tip[0], tip[1], -U.face, 5, '#C9C3E0'); K.sfx('clash'); }
  }
  function hitFeel(K, U, V) { var me = U === B.me || V === B.me; if (me) { K.hitstop(U.cur && U.cur.hit === 4 ? 0.06 : 0.04); K.shake(U.type === 'giant' ? 6 : 2.5); } K.sfx(U.cur && U.cur.hit === 4 ? 'kick' : U.T.w === 'sword' ? 'slash' : U.T.w === 'spear' ? 'spear' : U.T.w === 'club' ? 'slam' : 'punch'); }
  function slamEnd(K, U) { var tip = U.w('wt'); quake(tip[0], U.s); K.shake(U.boss ? 9 : 5); K.sfx('slam'); var r = (U.T.aoe || 50) * U.s * 0.8;
    B.units.forEach(function (V) { if (V.side !== U.side && !V.dead && Math.abs(V.x - tip[0]) < r && (!U.hitSet || U.hitSet.indexOf(V) < 0)) damage(K, V, U.T.dmg * dmgMul(U) * 0.55, U, 140, 3); });
    var M = B.mon[1 - U.side]; if (Math.abs(tip[0] - M.x) < r + 40 && U.hitSet.indexOf('mon') < 0) hitMonument(K, 1 - U.side, U.T.dmg * dmgMul(U) * 0.6); }
  function stepProjs(K, dt) {
    B.projs = B.projs.filter(function (p) {
      p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 'bolt' && Math.random() < 0.6) fx.push({ k: 'dot', x: p.x, y: p.y, vx: 0, vy: 0, t: 0, life: 0.3, col: '#8E5CFF', r: 3 });
      var hit = null; B.units.forEach(function (V) { if (hit || V.side === p.side || V.dead) return; if (touches([[p.x, p.y]], p.k === 'bolt' ? 6 : 3, V)) hit = V; });
      var M = B.mon[1 - p.side], monHit = Math.abs(p.x - M.x) < 44 && p.y > -260;
      if (hit || monHit || p.y >= 0) {
        if (p.aoe) { fx.push({ k: 'ring', x: p.x, y: Math.min(0, p.y), r: p.aoe, t: 0, life: 0.35, col: '#8E5CFF' }); B.units.forEach(function (V) { if (V.side !== p.side && !V.dead && Math.abs(V.x - p.x) < p.aoe) damage(K, V, p.dmg * (V === hit ? 1 : 0.6), p.from, 60, 2); }); K.sfx('hex'); }
        else if (hit) { damage(K, hit, p.dmg, p.from, 30, 2); K.sfx('stone'); }
        if (monHit) hitMonument(K, 1 - p.side, p.dmg * 0.8);
        if (!hit && !monHit) fx.push({ k: 'dust', x: p.x, y: 0, t: 0, life: 0.4 });
        return false;
      }
      return p.t < 4;
    });
  }
  function enemyAI(K, dt) {
    B.ai -= dt; B.gold[1] += B.L.inc * dt * (B.survival ? 0 : 1); if (B.ai > 0) return; B.ai = 1;
    if (B.survival) return;
    var L0 = B.L, dg = B.units.filter(function (U) { return U.side === 1 && U.type === 'digger' && !U.dead; }).length + B.q[1].filter(function (q) { return q.type === 'digger'; }).length;
    if (dg < L0.dig && B.gold[1] >= TYPES.digger.cost) train(K, 1, 'digger');
    else { var pool = []; for (var t in L0.mix) for (var i = 0; i < L0.mix[t]; i++) pool.push(t); var pick = pool[Math.floor(Math.random() * pool.length)]; if (B.gold[1] >= TYPES[pick].cost) train(K, 1, pick); }
    var pw = power(1), mine = power(0), threat = B.units.some(function (U) { return U.side === 0 && !U.dead && U.type !== 'digger' && U.x > WORLD - 900; });
    if (pw >= L0.atk || (pw > mine * 1.6 && pw >= 4)) B.cmd[1] = 'attack'; else if (threat || pw < L0.atk * 0.5) B.cmd[1] = 'defend';
  }
  function survivalAI(K, dt) {
    B.waveT -= dt; if (B.waveT > 0) return; B.wave++; B.waveT = 24; B.cmd[1] = 'attack';
    var n = 2 + Math.floor(B.wave * 1.6), pool = ['blade', 'blade', 'slinger'].concat(B.wave >= 3 ? ['pike'] : [], B.wave >= 5 ? ['hexer'] : [], B.wave >= 7 ? ['giant'] : []);
    for (var i = 0; i < n; i++) spawnUnit(1, pool[Math.floor(Math.random() * pool.length)], WORLD - 60 - i * 26);
    if (B.wave % 5 === 0) { var W = spawnUnit(1, 'warlord', WORLD - 80); W.maxHp = W.hp = 1600 + B.wave * 200; }
    K.toast(K.t('wave') + ' ' + B.wave); K.sfx('horn'); K.addScore(10 * B.wave);
  }
  function stepBattle(K, dt) {
    B.t += dt;
    for (var s = 0; s < 2; s++) { var q = B.q[s][0]; if (q) { q.t -= dt; if (q.t <= 0) { B.q[s].shift(); var U = spawnUnit(s, q.type, MON_X[s] + (s ? -50 : 50)); if (s === 0) K.sfx('train'); } } }
    if (B.survival) survivalAI(K, dt); else enemyAI(K, dt);
    B.units.forEach(function (U) { if (!U.dead && U !== B.me) think(K, U, dt); });
    if (B.me) control(K, dt);
    B.units.forEach(function (U) { stepUnit(K, U, dt); });
    separate(dt);
    B.units = B.units.filter(function (U) { return !(U.dead && U.alpha <= 0); });
    stepProjs(K, dt);
    B.mon.forEach(function (M) { M.hitT = Math.max(0, (M.hitT || 0) - dt); });
    // camera: follow your soldier, else stay where you dragged it
    var vw = K.W / zoom; if (B.me) cam += (B.me.x - vw * 0.42 - cam) * Math.min(1, dt * 4); if (held.left) cam -= 700 * dt; if (held.right) cam += 700 * dt; cam = clamp(cam, 0, Math.max(0, WORLD - vw));
    if (B.mon[0].hp <= 0 && !B.over) { B.over = true; B.mon[0].hp = 0; finish(K, false); }
    else if (B.mon[1].hp <= 0 && !B.over) { B.over = true; finish(K, true); }
  }
  // bodies never pass through each other: enemies keep the skill's ground gap (about 26 x scale), allies spread a little
  function separate(dt) {
    var L0 = B.units.filter(function (U) { return !U.dead; }).sort(function (a, b) { return a.x - b.x; });
    for (var i = 0; i < L0.length; i++) for (var j = i + 1; j < L0.length; j++) {
      var a = L0[i], b = L0[j], dx = b.x - a.x; if (dx > 70) break;
      var foe = a.side !== b.side, gap = foe ? 26 * (a.s + b.s) / 2 : 11 * (a.s + b.s) / 2; if (dx >= gap) continue;
      var push = foe ? (gap - dx) / 2 : Math.min((gap - dx) / 2, 40 * dt), wa = foe && a.boss ? 0.2 : 1, wb = foe && b.boss ? 0.2 : 1;
      if (a.type === 'digger' || b.type === 'digger') { if (!foe) continue; }
      a.x -= push * wa; b.x += push * wb;
    }
  }
  // the soldier under your command
  function control(K, dt) {
    var U = B.me; if (U.dead) { B.me = null; return; }
    U.hp = Math.min(U.maxHp, U.hp + U.maxHp * 0.01 * dt); B.comboT -= dt; if (B.comboT <= 0) B.combo = 0;
    if (U.busy()) { U.vx = 0; return; }
    var mv = (held.left ? -1 : 0) + (held.right ? 1 : 0); U.vx = mv * U.T.spd * 1.35; if (mv) U.face = mv;
  }
  function meAttack(K, kick) {
    var U = B.me; if (!U || U.dead) return; if (U.cur && U.curT < U.cur.t * 0.55) return; // a quick buffer at the end of a move
    var nearest = nearestEnemy(U, 140); if (nearest && !held.left && !held.right) U.face = nearest.x > U.x ? 1 : -1;
    if (kick) { startAttack(U, KICK); return; }
    var C = COMBO[U.T.w], step = C[B.combo % C.length]; B.combo++; B.comboT = 0.9; U.tgt = nearestEnemy(U, U.T.reach * U.s + 200); startAttack(U, step.concat([[WEAPON[U.T.w].hold, 0.16, 10]]));
  }
  function possess(K) {
    if (B.me) { B.me = null; K.sfx('click'); return; }
    var best = null; B.units.forEach(function (U) { if (U.side === 0 && !U.dead && U.type !== 'digger' && (!best || U.x > best.x)) best = U; });
    if (!best) { K.toast(K.t('noArmy')); K.sfx('wrong'); return; }
    B.me = best; best.queue = []; best.cur = null; K.sfx('horn'); K.toast(K.t('youCommand'));
  }
  function finish(K, won) {
    var lv = B.lvl, st = won ? 1 + (B.mon[0].hp > B.mon[0].max * 0.5 ? 1 : 0) + (B.t < 300 ? 1 : 0) : 0, g = 0;
    if (B.survival) { var bw = store('bestWave', 0); if (B.wave > bw) save('bestWave', B.wave); g = Math.floor(B.wave * 1.5); }
    else if (won) { var first = stars(lv) === 0; g = 8 + lv * 2 + (first ? 10 : 0) + st; var o = store('stars', {}); o[lv] = Math.max(o[lv] || 0, st); save('stars', o); if (lv + 1 > unlocked()) save('unl', Math.min(LEVELS.length - 1, lv + 1)); K.addScore(500 + lv * 150 + st * 100); }
    save('gems', gems() + g);
    endInfo = { won: won, st: st, gems: g, t: 0, kills: B.kills, lost: B.lost, wave: B.wave };
    phase = 'end'; B.me = null; K.sfx(won ? 'win' : 'lose'); if (won) K.confetti(90);
  }

  /* ================= drawing ================= */
  var SIDE = [{ ink: '#1E1A2E', back: '#3A3550', acc: '#3B82F6', acc2: '#9CC8FF' }, { ink: '#2A1418', back: '#4A2A30', acc: '#E8364F', acc2: '#FF9AA8' }];
  function layout(K) { bb = clamp(K.H * 0.15, 64, 92); gy = K.H - bb - 16; zoom = clamp(Math.min((gy - K.hudH - 70) / 280, K.W / 700), 0.42, 1.15); }
  function toScreen(x, y) { return [(x - cam) * zoom, gy + y * zoom]; }
  function drawScene(c, K) {
    var W = K.W, H = K.H, g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, '#F7D9A8'); g.addColorStop(0.55, '#FBE9C9'); g.addColorStop(1, '#F4E4C4'); c.fillStyle = g; c.fillRect(0, 0, W, gy);
    c.fillStyle = 'rgba(255,220,150,0.7)'; c.beginPath(); c.arc(W * 0.78 - cam * zoom * 0.05, gy * 0.32, 46, 0, TAU); c.fill();
    [[0.15, '#D9B99A', 90, 0.0021], [0.3, '#C7A383', 60, 0.0034], [0.55, '#A98D6E', 34, 0.006]].forEach(function (L) { // parallax ink-wash hills
      c.fillStyle = L[1]; c.beginPath(); c.moveTo(0, gy); for (var x = 0; x <= W + 20; x += 16) { var wx = x / zoom + cam * L[0]; c.lineTo(x, gy - (L[2] + Math.sin(wx * L[3]) * L[2] * 0.6 + Math.sin(wx * L[3] * 2.7) * L[2] * 0.25) * zoom * 1.4); } c.lineTo(W, gy); c.fill(); });
    for (var t = 0; t < 30; t++) { var tx = ((t * 137) % WORLD), s = toScreen(tx * 0.97 + 40, 0); if (s[0] < -40 || s[0] > W + 40 || Math.abs(tx - ORE_X[0]) < 120 || Math.abs(tx - ORE_X[1]) < 120 || Math.abs(tx - MON_X[0]) < 180 || Math.abs(tx - MON_X[1]) < 180) continue; var th = (60 + (t * 31) % 50) * zoom; c.strokeStyle = '#6B5240'; c.lineWidth = 3 * zoom; c.beginPath(); c.moveTo(s[0], gy - 6 * zoom); c.lineTo(s[0], gy - th); c.stroke(); c.fillStyle = t % 3 ? '#7A9A5A' : '#8FAE66'; c.beginPath(); c.arc(s[0], gy - th, th * 0.32, 0, TAU); c.arc(s[0] - th * 0.2, gy - th * 0.82, th * 0.24, 0, TAU); c.arc(s[0] + th * 0.22, gy - th * 0.85, th * 0.22, 0, TAU); c.fill(); }
    c.fillStyle = '#9DB86A'; c.fillRect(0, gy - 4 * zoom, W, 10 * zoom); c.fillStyle = '#B89A6E'; c.fillRect(0, gy + 6 * zoom, W, H); c.fillStyle = '#A88A5E'; for (var i = 0; i < 40; i++) { var sx = ((i * 211 + 37) % WORLD), p = toScreen(sx, 0); if (p[0] > -10 && p[0] < W + 10) { c.beginPath(); c.ellipse(p[0], gy + (14 + (i * 7) % 30) * zoom, 7 * zoom, 3 * zoom, 0, 0, TAU); c.fill(); } }
    for (var sd = 0; sd < 2; sd++) drawOre(c, ORE_X[sd]);
  }
  function drawOre(c, x) { [[-40, 26], [0, 34], [42, 22]].forEach(function (o, i) { var p = toScreen(x + o[0], 0), r = o[1] * zoom; c.fillStyle = '#7E7468'; c.beginPath(); c.moveTo(p[0] - r, p[1]); c.lineTo(p[0] - r * 0.6, p[1] - r * 0.9); c.lineTo(p[0] + r * 0.3, p[1] - r * 1.1); c.lineTo(p[0] + r, p[1] - r * 0.4); c.lineTo(p[0] + r, p[1]); c.fill(); c.fillStyle = '#FFD23F'; c.beginPath(); c.moveTo(p[0] - r * 0.2, p[1] - r * 0.3); c.lineTo(p[0], p[1] - r * 0.85); c.lineTo(p[0] + r * 0.25, p[1] - r * 0.35); c.fill(); c.fillStyle = '#FFF1A8'; c.fillRect(p[0] - r * 0.05, p[1] - r * 0.7, r * 0.08, r * 0.25); }); }
  function drawMonument(c, K, sd) {
    var M = B.mon[sd], p = toScreen(M.x, 0), z = zoom, w = 58 * z, h = 240 * z, sh = M.hitT > 0 ? Math.sin(K.time * 70) * 2 : 0, S = SIDE[sd], dmgK = 1 - Math.max(0, M.hp) / M.max;
    c.save(); c.translate(p[0] + sh, p[1]);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(0, 4 * z, w * 1.1, 8 * z, 0, 0, TAU); c.fill();
    c.fillStyle = '#5A5068'; c.fillRect(-w * 0.95, -18 * z, w * 1.9, 18 * z); // plinth
    c.fillStyle = sd ? '#5A3036' : '#3A3858'; c.beginPath(); c.moveTo(-w * 0.55, -18 * z); c.lineTo(-w * 0.38, -h); c.lineTo(0, -h - 34 * z); c.lineTo(w * 0.38, -h); c.lineTo(w * 0.55, -18 * z); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.moveTo(-w * 0.55, -18 * z); c.lineTo(-w * 0.38, -h); c.lineTo(-w * 0.1, -h - 8 * z); c.lineTo(-w * 0.2, -18 * z); c.fill();
    c.fillStyle = S.acc; c.beginPath(); c.arc(0, -h * 0.62, 15 * z, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; // emblem: a quill (Quill Order) or an ink splat (Smudge Horde)
    if (!sd) { c.beginPath(); c.ellipse(0, -h * 0.62, 4 * z, 10 * z, 0.6, 0, TAU); c.fill(); } else { for (var i = 0; i < 6; i++) { var a = i * 1.05; c.beginPath(); c.arc(Math.cos(a) * 7 * z, -h * 0.62 + Math.sin(a) * 7 * z, 3.2 * z, 0, TAU); c.fill(); } }
    c.strokeStyle = 'rgba(20,10,20,0.75)'; c.lineWidth = 2 * z; c.beginPath(); // cracks grow with damage
    if (dmgK > 0.2) { c.moveTo(-w * 0.2, -h * 0.9); c.lineTo(0, -h * 0.78); c.lineTo(-w * 0.1, -h * 0.66); }
    if (dmgK > 0.45) { c.moveTo(w * 0.3, -h * 0.5); c.lineTo(w * 0.05, -h * 0.4); c.lineTo(w * 0.2, -h * 0.28); }
    if (dmgK > 0.7) { c.moveTo(-w * 0.35, -h * 0.3); c.lineTo(-w * 0.05, -h * 0.18); c.lineTo(-w * 0.25, -h * 0.08); }
    c.stroke(); c.strokeStyle = '#6B5240'; c.lineWidth = 3 * z; c.beginPath(); c.moveTo(0, -h - 34 * z); c.lineTo(0, -h - 80 * z); c.stroke(); c.fillStyle = S.acc; c.beginPath(); c.moveTo(0, -h - 80 * z); c.lineTo((sd ? -1 : 1) * (30 + Math.sin(K.time * 5) * 3) * z, -h - 70 * z); c.lineTo(0, -h - 60 * z); c.fill();
    c.restore();
  }
  function drawUnit(c, K, U) {
    if (U.alpha <= 0) return; var S = SIDE[U.side], z = zoom, lw = 4.2 * U.s * z * (U.type === 'giant' || U.boss ? 1.3 : 1), oy = U.lz * 0.8 * z, flash = U.flash > 0;
    var P = function (n) { var w = U.w(n), s = toScreen(w[0], w[1]); s[1] -= oy; return s; };
    var pel = P('pel'); if (pel[0] < -120 || pel[0] > K.W + 120) return;
    c.globalAlpha = U.alpha; c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = 'rgba(40,20,10,0.16)'; c.beginPath(); c.ellipse(pel[0], gy - oy + 2 * z, 18 * U.s * z, 4 * z, 0, 0, TAU); c.fill();
    if (U === B.me) { c.fillStyle = 'rgba(255,210,63,0.25)'; c.beginPath(); c.ellipse(pel[0], gy - oy + 2 * z, 30 * U.s * z, 7 * z, 0, 0, TAU); c.fill(); }
    var col = flash ? '#FFFFFF' : S.ink, back = flash ? '#FFFFFF' : S.back;
    var line = function (pts, cl, wd) { c.strokeStyle = cl; c.lineWidth = wd; c.beginPath(); for (var i = 0; i < pts.length; i++) { var p = P(pts[i]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); };
    if (U.boss && !U.dead) { var nk0 = P('neck'), pl0 = P('pel'); c.fillStyle = '#B0203A'; c.beginPath(); c.moveTo(nk0[0], nk0[1]); c.lineTo(pl0[0] - U.face * 26 * z * U.s, pl0[1] + 18 * z); c.lineTo(pl0[0] - U.face * 6 * z, pl0[1] + 6 * z); c.fill(); }
    if (U.job && U.job.s === 'toBase' && U.gold) { var s2 = P('s2'); c.fillStyle = '#9A6A3A'; c.beginPath(); c.arc(s2[0] - U.face * 5 * z, s2[1] + 4 * z, 9 * U.s * z, 0, TAU); c.fill(); c.fillStyle = '#FFD23F'; c.fillRect(s2[0] - U.face * 5 * z - 2 * z, s2[1] - 4 * z, 4 * z, 3 * z); }
    line(['s2', 'e2', 'h2'], back, lw); line(['hp2', 'kn2', 'an2', 'toe2'], back, lw);
    var pl = P('pel'), md = P('mid'), nk = P('neck'); c.strokeStyle = col; c.lineWidth = lw + 1; c.beginPath(); c.moveTo(pl[0], pl[1]); c.quadraticCurveTo(md[0] * 2 - (pl[0] + nk[0]) / 2, md[1] * 2 - (pl[1] + nk[1]) / 2, nk[0], nk[1]); c.stroke();
    line(['hp2', 'hp1'], col, lw); line(['s2', 's1'], col, lw); line(['hp1', 'kn1', 'an1', 'toe1'], col, lw);
    if (!flash) { c.strokeStyle = S.acc; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(md[0] - 3 * z, md[1] - 2 * z); c.lineTo(md[0] + 3 * z, md[1] + 3 * z); c.stroke(); } // sash
    var hd = P('head'), hr = LEN.head * U.s * z; line(['neck', 'head'], col, lw - 0.6); c.fillStyle = col; c.beginPath(); c.arc(hd[0], hd[1], hr, 0, TAU); c.fill();
    drawGear(c, U, P, hd, hr, z, S, flash);
    drawWeapon(c, U, P, z, lw);
    line(['s1', 'e1', 'h1'], col, lw); var h1 = P('h1'); c.fillStyle = col; c.beginPath(); c.arc(h1[0], h1[1], lw * 0.75, 0, TAU); c.fill();
    if (!U.dead && U.hp < U.maxHp) { var bw = 34 * U.s * z, bx = hd[0] - bw / 2, by = hd[1] - hr - 10 * z; c.fillStyle = 'rgba(30,20,30,0.45)'; c.fillRect(bx - 1, by - 1, bw + 2, 5); c.fillStyle = U.side ? '#E8364F' : '#3B82F6'; c.fillRect(bx, by, bw * Math.max(0, U.hp / U.maxHp), 3); }
    if (U === B.me) { var bob = Math.sin(K.time * 6) * 3; c.fillStyle = '#FFD23F'; c.beginPath(); c.moveTo(hd[0], hd[1] - hr - 8 * z + bob); c.lineTo(hd[0] - 7, hd[1] - hr - 20 * z + bob); c.lineTo(hd[0] + 7, hd[1] - hr - 20 * z + bob); c.fill(); }
    c.globalAlpha = 1;
  }
  function drawGear(c, U, P, hd, hr, z, S, flash) { // hats, hoods, crowns, headbands: who is who at a glance
    var f = U.face; if (flash) return;
    if (U.type === 'digger') { c.fillStyle = '#FFC43D'; c.beginPath(); c.arc(hd[0], hd[1] - hr * 0.15, hr * 1.08, Math.PI, 0); c.fill(); c.fillRect(hd[0] - hr * 1.3, hd[1] - hr * 0.2, hr * 2.6, hr * 0.25); }
    else if (U.type === 'hexer') { c.fillStyle = S.acc; c.beginPath(); c.moveTo(hd[0] - hr * 1.2, hd[1] + hr * 0.4); c.lineTo(hd[0] - f * hr * 0.8, hd[1] - hr * 2.4); c.lineTo(hd[0] + hr * 1.2, hd[1] + hr * 0.4); c.closePath(); c.fill(); }
    else if (U.type === 'pike') { c.fillStyle = '#8F96A8'; c.beginPath(); c.arc(hd[0], hd[1] - hr * 0.1, hr * 1.1, Math.PI, 0); c.fill(); c.fillStyle = S.acc; c.beginPath(); c.ellipse(hd[0] - f * hr * 0.3, hd[1] - hr * 1.4, hr * 0.35, hr * 0.7, -f * 0.6, 0, TAU); c.fill(); }
    else if (U.boss) { c.fillStyle = '#FFD23F'; c.beginPath(); c.moveTo(hd[0] - hr, hd[1] - hr * 0.6); for (var i = 0; i <= 4; i++) { c.lineTo(hd[0] - hr + i * hr * 0.5, hd[1] - hr * (i % 2 ? 1.3 : 2.0)); } c.lineTo(hd[0] + hr, hd[1] - hr * 0.6); c.fill(); }
    else if (U.type === 'giant') { c.fillStyle = '#6B5E80'; c.beginPath(); c.arc(hd[0], hd[1] - hr * 0.05, hr * 1.1, Math.PI, 0); c.fill(); c.fillStyle = '#FFFFFF'; [-1, 1].forEach(function (q) { c.beginPath(); c.moveTo(hd[0] + q * hr * 0.8, hd[1] - hr * 0.6); c.lineTo(hd[0] + q * hr * 1.4, hd[1] - hr * 1.6); c.lineTo(hd[0] + q * hr * 0.4, hd[1] - hr * 0.9); c.fill(); }); }
    else { c.fillStyle = S.acc; c.fillRect(hd[0] - hr, hd[1] - hr * 0.45, hr * 2, hr * 0.42); c.beginPath(); c.moveTo(hd[0] - f * hr, hd[1] - hr * 0.3); c.lineTo(hd[0] - f * hr * 2.1, hd[1] - hr * 0.1 + Math.sin(K0.time * 9 + U.lz) * hr * 0.25); c.lineTo(hd[0] - f * hr, hd[1]); c.fill(); }
    if (!U.dead) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(hd[0] + f * hr * 0.45, hd[1] - hr * 0.05, hr * 0.17, 0, TAU); c.fill(); }
  }
  function drawWeapon(c, U, P, z, lw) {
    var w = U.T.w, b = P('wb'), t = P('wt'), h = P('h1');
    if (w === 'sword') { c.strokeStyle = '#D6DEE8'; c.lineWidth = lw * 0.75; c.beginPath(); c.moveTo(h[0], h[1]); c.lineTo(t[0], t[1]); c.stroke(); var dx = t[0] - h[0], dy = t[1] - h[1], l = Math.hypot(dx, dy) || 1; c.strokeStyle = '#8A6A3A'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(h[0] - dy / l * 6 * z, h[1] + dx / l * 6 * z); c.lineTo(h[0] + dy / l * 6 * z, h[1] - dx / l * 6 * z); c.stroke(); }
    else if (w === 'spear') { c.strokeStyle = '#8A5A2B'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(t[0], t[1]); c.stroke(); var ex = t[0] - b[0], ey = t[1] - b[1], el = Math.hypot(ex, ey) || 1, nx = ex / el, ny = ey / el; c.fillStyle = '#D6DEE8'; c.beginPath(); c.moveTo(t[0] + nx * 10 * z, t[1] + ny * 10 * z); c.lineTo(t[0] - ny * 4 * z, t[1] + nx * 4 * z); c.lineTo(t[0] + ny * 4 * z, t[1] - nx * 4 * z); c.fill(); }
    else if (w === 'club') { c.strokeStyle = '#7A5230'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(h[0], h[1]); c.lineTo(t[0], t[1]); c.stroke(); c.fillStyle = '#6B4425'; c.beginPath(); c.arc(t[0], t[1], 9 * U.s * z, 0, TAU); c.fill(); c.fillStyle = '#B8C2CE'; for (var i = 0; i < 4; i++) { var a = i * 1.57 + 0.4; c.beginPath(); c.arc(t[0] + Math.cos(a) * 8 * U.s * z, t[1] + Math.sin(a) * 8 * U.s * z, 2.2 * z, 0, TAU); c.fill(); } }
    else if (w === 'pick') { c.strokeStyle = '#8A5A2B'; c.lineWidth = lw * 0.55; c.beginPath(); c.moveTo(h[0], h[1]); c.lineTo(t[0], t[1]); c.stroke(); var px = t[0] - h[0], py = t[1] - h[1], pl2 = Math.hypot(px, py) || 1; c.strokeStyle = '#9AA4B2'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(t[0] - py / pl2 * 9 * z, t[1] + px / pl2 * 9 * z); c.quadraticCurveTo(t[0] + px / pl2 * 3 * z, t[1] + py / pl2 * 3 * z, t[0] + py / pl2 * 9 * z, t[1] - px / pl2 * 9 * z); c.stroke(); }
    else if (w === 'staff') { c.strokeStyle = '#6B4A2A'; c.lineWidth = lw * 0.5; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(t[0], t[1]); c.stroke(); var gl = c.createRadialGradient(t[0], t[1], 1, t[0], t[1], 12 * z); gl.addColorStop(0, '#E9D8FF'); gl.addColorStop(0.4, '#8E5CFF'); gl.addColorStop(1, 'rgba(142,92,255,0)'); c.fillStyle = gl; c.beginPath(); c.arc(t[0], t[1], 12 * z, 0, TAU); c.fill(); }
    else if (w === 'sling') { if (U.cur && U.cur.p === 'slLoad') { var a2 = K0.time * 30, sx2 = h[0] + Math.cos(a2) * 12 * z, sy2 = h[1] + Math.sin(a2) * 12 * z; c.strokeStyle = '#8A6A3A'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(h[0], h[1]); c.lineTo(sx2, sy2); c.stroke(); c.fillStyle = '#8F8A80'; c.beginPath(); c.arc(sx2, sy2, 3.5 * z, 0, TAU); c.fill(); } else { c.fillStyle = '#8F8A80'; c.beginPath(); c.arc(h[0], h[1] + 2 * z, 3 * z, 0, TAU); c.fill(); } }
  }
  function drawFx(c, K, dt) {
    fx.forEach(function (f) { f.t += dt; if (f.vx !== undefined) { f.vy += 900 * dt; f.x += f.vx * dt; f.y = Math.min(f.k === 'rock' || f.k === 'dot' ? 0 : 1e9, f.y + f.vy * dt); } });
    fx = fx.filter(function (f) { return f.t < f.life; });
    fx.forEach(function (f) { var a = 1 - f.t / f.life, p = toScreen(f.x, f.y); c.globalAlpha = Math.max(0, a);
      if (f.k === 'spark') { c.strokeStyle = f.col; c.lineWidth = 2; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] - f.vx * 0.03 * zoom, p[1] - f.vy * 0.03 * zoom); c.stroke(); }
      else if (f.k === 'dot' || f.k === 'rock') { c.fillStyle = f.col; c.beginPath(); c.arc(p[0], p[1], f.r * zoom, 0, TAU); c.fill(); }
      else if (f.k === 'ring') { c.strokeStyle = f.col || '#FFF1C8'; c.lineWidth = 4 * a + 1; c.beginPath(); c.ellipse(p[0], p[1], f.r * zoom * (0.3 + f.t / f.life), f.r * zoom * 0.3 * (0.3 + f.t / f.life), 0, 0, TAU); c.stroke(); }
      else if (f.k === 'crater') { c.fillStyle = 'rgba(70,50,30,0.5)'; c.beginPath(); c.ellipse(p[0], p[1] + 2, f.r * zoom, f.r * zoom * 0.22, 0, 0, TAU); c.fill(); }
      else if (f.k === 'dust') { c.fillStyle = 'rgba(200,180,150,0.7)'; c.beginPath(); c.arc(p[0], p[1] - 4, (6 + f.t * 30) * zoom, 0, TAU); c.fill(); }
      c.globalAlpha = 1; });
    B && B.projs.forEach(function (p) { var s = toScreen(p.x, p.y); if (p.k === 'bolt') { var gl = c.createRadialGradient(s[0], s[1], 1, s[0], s[1], 11 * zoom); gl.addColorStop(0, '#FFFFFF'); gl.addColorStop(0.5, '#8E5CFF'); gl.addColorStop(1, 'rgba(142,92,255,0)'); c.fillStyle = gl; c.beginPath(); c.arc(s[0], s[1], 11 * zoom, 0, TAU); c.fill(); } else { c.fillStyle = '#7A746A'; c.beginPath(); c.arc(s[0], s[1], 3.5 * zoom + 1, 0, TAU); c.fill(); } });
  }

  /* ================= HUD and screens ================= */
  function iconUnit(type) { // a posed unit drawn by the same renderer (button icons)
    var U = iconUnits[type]; if (U) return U;
    U = iconUnits[type] = new Unit(0, type, 0); U.lz = 0; var P0 = POSE[WEAPON[U.T.w].hold === 'march' && type === 'slinger' ? 'slLoad' : WEAPON[U.T.w].hold];
    KEYS.forEach(function (k) { U.j[k].v = P0[k] != null ? P0[k] : STANCE[k]; }); U.target = P0; U.L = solve(U); return U;
  }
  function drawIcon(c, K, type, cx, cy, size) {
    var U = iconUnit(type), sc = cam, sz = zoom, sg = gy, sb = B; zoom = size / (110 * U.s); cam = U.x - cx / zoom; gy = cy + size * 0.42;
    B = sb || { me: null }; drawUnit(c, K, U); cam = sc; zoom = sz; gy = sg; B = sb;
  }
  function rr(c, K, x, y, w, h, r, col) { c.fillStyle = col; K.roundRect(c, x, y, w, h, r); c.fill(); }
  function btn(c, K, x, y, w, h, col, label, act, extra) {
    rr(c, K, x, y + 3, w, h, Math.min(16, h / 2), 'rgba(40,25,10,0.25)'); rr(c, K, x, y, w, h, Math.min(16, h / 2), col);
    var px = Math.min(17, h * 0.4); c.font = K.font(px); while (px > 9 && c.measureText(label).width > w - 10) { px--; c.font = K.font(px); }
    c.fillStyle = '#FFFFFF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x + w / 2, y + h / 2 + 1); var u = { x: x, y: y, w: w, h: h, act: act }; for (var k in extra) u[k] = extra[k]; ui.push(u);
  }
  function coin(c, x, y, r) { c.fillStyle = '#E0A82E'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.fillStyle = '#FFD23F'; c.beginPath(); c.arc(x, y, r * 0.74, 0, TAU); c.fill(); c.fillStyle = '#B8860B'; c.font = '800 ' + Math.round(r) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', x, y + 1); }
  function gem(c, x, y, r) { c.fillStyle = '#3EC6FF'; c.beginPath(); c.moveTo(x - r, y - r * 0.3); c.lineTo(x - r * 0.5, y - r * 0.9); c.lineTo(x + r * 0.5, y - r * 0.9); c.lineTo(x + r, y - r * 0.3); c.lineTo(x, y + r); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(x - r * 0.5, y - r * 0.9); c.lineTo(x, y - r * 0.3); c.lineTo(x - r, y - r * 0.3); c.fill(); }
  function drawHud(c, K) {
    var W = K.W, H = K.H, top = K.hudH + 4; ui = [];
    // gold + population, monument bars, minimap
    rr(c, K, 10, top, 150, 30, 15, 'rgba(40,25,10,0.55)'); coin(c, 26, top + 15, 10); c.fillStyle = '#FFE58A'; c.font = K.font(16); c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(Math.floor(B.gold[0]), 42, top + 16);
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = K.font(12, 800); c.fillText('👥 ' + pop(0) + '/' + popMax(), 96, top + 16);
    var mw = Math.min(W - 40, 360), mx = (W - mw) / 2, my = top + 38;
    rr(c, K, mx, my, mw, 14, 7, 'rgba(40,25,10,0.35)');
    B.units.forEach(function (U) { if (U.dead) return; c.fillStyle = U.side ? '#E8364F' : '#3B82F6'; c.fillRect(mx + U.x / WORLD * mw - 1.5, my + 4 + (U.lz + 10) * 0.25, U === B.me ? 5 : 3, 4); });
    c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; c.strokeRect(mx + cam / WORLD * mw, my, (K.W / zoom) / WORLD * mw, 14); ui.push({ x: mx, y: my - 6, w: mw, h: 26, act: 'mini', mx: mx, mw: mw });
    [0, 1].forEach(function (sd) { if (sd && B.survival) return; var M = B.mon[sd], bw = Math.min(150, (W - mw) / 2 - 18), bx = sd ? W - bw - 10 : 10, by = my + 22; if (W < 560) { bx = sd ? W / 2 + 4 : W / 2 - bw - 4; bw = Math.min(bw, W / 2 - 16); by = my + 20; }
      rr(c, K, bx, by, bw, 10, 5, 'rgba(40,25,10,0.35)'); rr(c, K, bx, by, Math.max(0, bw * M.hp / M.max), 10, 5, sd ? '#E8364F' : '#3B82F6'); });
    if (B.survival) { c.textAlign = 'center'; c.font = K.font(14); c.fillStyle = '#5A3A1A'; c.fillText(K.t('wave') + ' ' + B.wave + (B.waveT > 0 ? ' · ' + Math.ceil(B.waveT) + 's' : ''), W / 2, my + 30); }
    // bottom bar: train units
    var by0 = H - bb; c.fillStyle = 'rgba(60,40,20,0.85)'; c.fillRect(0, by0, W, bb);
    var n = TYPE_ORDER.length, cmdW = Math.min(W * 0.36, 230), avail = W - 16, bw = Math.min(92, (avail - (n - 1) * 6) / n), bx0 = (W - (bw * n + (n - 1) * 6)) / 2;
    TYPE_ORDER.forEach(function (t, i) {
      var T = TYPES[t], x = bx0 + i * (bw + 6), y = by0 + 6, h = bb - 12, locked = T.unlock && unlocked() < T.unlock - 1, ok = !locked && canTrain(0, t), qn = B.q[0].filter(function (q) { return q.type === t; }).length;
      rr(c, K, x, y, bw, h, 12, locked ? 'rgba(255,255,255,0.08)' : ok ? '#F3E3C0' : 'rgba(243,227,192,0.45)');
      if (!locked) drawIcon(c, K, t, x + bw / 2, y + h * 0.42, Math.min(h * 0.75, bw * 0.95)); else { c.fillStyle = 'rgba(255,255,255,0.5)'; c.font = K.font(18); c.textAlign = 'center'; c.fillText('🔒', x + bw / 2, y + h * 0.42); }
      c.fillStyle = locked ? 'rgba(255,255,255,0.6)' : '#5A3A1A'; c.font = K.font(Math.min(12, bw / 6)); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(locked ? K.t('lvl') + ' ' + T.unlock : T.cost, x + bw / 2, y + h - 10);
      if (qn) { c.fillStyle = '#E8364F'; c.beginPath(); c.arc(x + bw - 8, y + 8, 9, 0, TAU); c.fill(); c.fillStyle = '#FFF'; c.font = K.font(11); c.fillText(qn, x + bw - 8, y + 9); }
      var q0 = B.q[0][0]; if (q0 && q0.type === t) { c.fillStyle = 'rgba(59,130,246,0.85)'; c.fillRect(x + 6, y + h - 4, (bw - 12) * (1 - q0.t / q0.max), 3); }
      if (!K.touch) { c.fillStyle = 'rgba(90,58,26,0.6)'; c.font = K.font(9, 800); c.fillText(i + 1, x + 9, y + 9); }
      ui.push({ x: x, y: y, w: bw, h: h, act: 'train', t: t });
    });
    // commands (right column) or your soldier's controls
    var r = clamp(Math.min(W, H) * 0.06, 22, 30), cx = W - r - 12, cy = by0 - r - 12;
    var cmds = [['attack', '⚔️', '#E8364F'], ['hold', '🚩', '#F59E0B'], ['defend', '🛡️', '#3B82F6'], ['me', B.me ? '✖' : '👑', '#A855F7']];
    cmds.forEach(function (q, i) { var y = cy - i * (r * 2 + 10), on = q[0] === 'me' ? !!B.me : B.cmd[0] === q[0];
      c.fillStyle = 'rgba(40,25,10,0.3)'; c.beginPath(); c.arc(cx, y + 3, r, 0, TAU); c.fill(); c.fillStyle = on ? q[2] : '#F3E3C0'; c.beginPath(); c.arc(cx, y, r, 0, TAU); c.fill(); if (on) { c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.stroke(); }
      c.font = (r * 0.95) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = on ? '#FFFFFF' : '#5A3A1A'; c.fillText(q[1], cx, y + 1);
      c.font = K.font(10, 800); c.fillStyle = '#5A3A1A'; if (W > 500) { c.textAlign = 'right'; c.fillText(K.t('c_' + q[0]) + (K.touch ? '' : ' · ' + { attack: 'C', hold: 'X', defend: 'Z', me: 'T' }[q[0]]), cx - r - 6, y + 1); }
      ui.push({ x: cx - r - 4, y: y - r - 4, w: r * 2 + 8, h: r * 2 + 8, act: 'cmd', c: q[0] }); });
    if (B.me) { var R2 = clamp(Math.min(W, H) * 0.075, 26, 40), y2 = by0 - R2 - 14;
      [['left', '◀', R2 + 14], ['right', '▶', R2 * 3 + 26]].forEach(function (q) { c.fillStyle = held[q[0]] ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(q[2], y2, R2, 0, TAU); c.fill(); c.fillStyle = '#5A3A1A'; c.font = K.font(R2 * 0.8); c.textAlign = 'center'; c.fillText(q[1], q[2], y2 + 1); ui.push({ x: q[2] - R2, y: y2 - R2, w: R2 * 2, h: R2 * 2, act: 'hold', k: q[0] }); });
      [['atk', '⚔️', '#E8364F', 1.15], ['kick', '🦵', '#F59E0B', 0.85]].forEach(function (q, i) { var rr2 = R2 * q[3], x2 = cx - r * 2 - 22 - (i ? R2 * 2.3 : 0) - rr2 + R2, y3 = y2 - (i ? 0 : R2 * 0.6); c.fillStyle = q[2]; c.beginPath(); c.arc(x2, y3, rr2, 0, TAU); c.fill(); c.font = (rr2 * 0.9) + 'px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#FFF'; c.fillText(q[1], x2, y3 + 2); ui.push({ x: x2 - rr2, y: y3 - rr2, w: rr2 * 2, h: rr2 * 2, act: q[0] }); });
      if (!K.touch) { c.fillStyle = 'rgba(90,58,26,0.85)'; c.font = K.font(12, 800); c.textAlign = 'center'; c.fillText(K.t('meKeys'), W / 2, by0 - 10); }
    }
  }
  function drawMap(c, K) {
    var W = K.W, H = K.H, top = K.hudH; ui = [];
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#F7D9A8'); g.addColorStop(1, '#E8C894'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#3A2A1A'; c.font = K.font(Math.min(30, W / 14)); c.fillText(K.t('campaign'), W / 2, top + 16);
    rr(c, K, W - 92, top + 2, 80, 30, 15, 'rgba(58,42,26,0.15)'); gem(c, W - 74, top + 17, 9); c.fillStyle = '#1E6FA8'; c.font = K.font(15); c.textAlign = 'left'; c.fillText(gems(), W - 60, top + 18); c.textAlign = 'center';
    var land = W > H, cols = land ? 6 : 3, rows = Math.ceil(LEVELS.length / cols), gap = 10, y0 = top + 46, bh = 50, availH = H - y0 - bh - 40;
    var cw = Math.min(120, (W - 24 - gap * (cols - 1)) / cols), ch = Math.min(100, (availH - gap * (rows - 1)) / rows), x0 = (W - (cw * cols + gap * (cols - 1))) / 2, ul = unlocked();
    LEVELS.forEach(function (L0, i) {
      var x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap), lock = i > ul, sel = i === mapSel, st = stars(i);
      rr(c, K, x, y, cw, ch, 14, lock ? 'rgba(58,42,26,0.12)' : sel ? '#FFFFFF' : 'rgba(255,255,255,0.6)'); if (sel) { c.strokeStyle = '#E8364F'; c.lineWidth = 3; K.roundRect(c, x, y, cw, ch, 14); c.stroke(); }
      if (!lock) drawIcon(c, K, i >= 11 ? 'giant' : TYPE_ORDER[Math.min(5, 1 + Math.floor(i / 2))], x + cw * 0.5, y + ch * 0.38, Math.min(ch * 0.55, cw * 0.6));
      c.fillStyle = lock ? 'rgba(58,42,26,0.45)' : '#3A2A1A'; c.font = K.font(Math.min(15, cw / 6)); c.fillText(lock ? '🔒 ' + (i + 1) : (L0.boss ? '👑 ' : '') + (i + 1), x + cw / 2, y + ch * 0.74);
      for (var k = 0; k < 3; k++) { c.fillStyle = k < st ? '#FFB020' : 'rgba(58,42,26,0.2)'; c.save(); c.translate(x + cw / 2 + (k - 1) * 14, y + ch - 10); K.star(c, 5.5); c.restore(); }
      if (!lock) ui.push({ x: x, y: y, w: cw, h: ch, act: 'lvl', i: i });
    });
    var tw = Math.min(520, W - 24), sw = (tw - 20) / 3, bx = (W - tw) / 2, by = H - bh - 16;
    btn(c, K, bx, by, sw, bh, '#7A5230', K.t('survival') + (store('bestWave', 0) ? ' · ' + store('bestWave', 0) : ''), 'surv');
    btn(c, K, bx + sw + 10, by, sw, bh, '#A855F7', K.t('upgrades'), 'upg');
    btn(c, K, bx + (sw + 10) * 2, by, sw, bh, '#E8364F', '▶ ' + K.t('level') + ' ' + (mapSel + 1), 'play');
    c.fillStyle = 'rgba(58,42,26,0.7)'; c.font = K.font(12, 700); c.fillText(K.t('story' + Math.min(4, Math.floor(mapSel / 3))), W / 2, by - 14);
  }
  function drawUpg(c, K) {
    var W = K.W, H = K.H, top = K.hudH; ui = [];
    c.fillStyle = '#F0D9AE'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#3A2A1A'; c.font = K.font(Math.min(28, W / 14)); c.fillText(K.t('upgrades'), W / 2, top + 16);
    btn(c, K, 12, top, 76, 34, '#7A5230', K.t('back'), 'back');
    rr(c, K, W - 92, top + 2, 80, 30, 15, 'rgba(58,42,26,0.15)'); gem(c, W - 74, top + 17, 9); c.fillStyle = '#1E6FA8'; c.font = K.font(15); c.textAlign = 'left'; c.fillText(gems(), W - 60, top + 18);
    var pw = Math.min(560, W - 24), rh = Math.min(64, (H - top - 70) / UPG.length - 6), x = (W - pw) / 2;
    UPG.forEach(function (k, i) {
      var y = top + 48 + i * (rh + 6), lv = upg(k), pr = upgPrice(k); rr(c, K, x, y, pw, rh, 12, 'rgba(255,255,255,0.65)');
      c.textAlign = 'left'; c.fillStyle = '#3A2A1A'; c.font = K.font(Math.min(15, rh / 3.4)); c.fillText(K.t('u_' + k), x + 14, y + rh * 0.34);
      c.fillStyle = '#7A5A3A'; c.font = K.font(Math.min(11, rh / 5), 700); c.fillText(K.t('u_' + k + 'D'), x + 14, y + rh * 0.7);
      for (var p = 0; p < UPG_MAX; p++) { c.fillStyle = p < lv ? '#FFB020' : 'rgba(58,42,26,0.18)'; c.beginPath(); c.arc(x + pw - 180 + p * 13, y + rh / 2, 4.5, 0, TAU); c.fill(); }
      btn(c, K, x + pw - 104, y + (rh - 36) / 2, 92, 36, pr ? (gems() >= pr ? '#22A35A' : '#9A8A7A') : '#9A8A7A', pr ? '💎 ' + pr : 'MAX', 'buyUpg', { k: k });
    });
  }
  function drawEnd(c, K) {
    var W = K.W, H = K.H, e = endInfo; ui = []; e.t += K.dt || 0.016;
    c.fillStyle = 'rgba(30,18,8,0.72)'; c.fillRect(0, 0, W, H); c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = K.font(Math.min(48, W / 9)); c.fillStyle = e.won ? '#FFD23F' : '#FF8A8A'; c.fillText(B.survival ? K.t('wave') + ' ' + e.wave : e.won ? K.t('victory') : K.t('defeat'), W / 2, H * 0.24);
    if (e.won) for (var k = 0; k < 3; k++) { var sh = e.t > 0.4 + k * 0.3, sz = sh ? 24 + Math.max(0, 0.15 - (e.t - 0.4 - k * 0.3)) * 60 : 0; if (sh && !e['s' + k] && k < e.st) { e['s' + k] = 1; K.sfx('star'); } c.fillStyle = k < e.st && sh ? '#FFB020' : 'rgba(255,255,255,0.25)'; c.save(); c.translate(W / 2 + (k - 1) * 60, H * 0.37); K.star(c, sh ? sz : 20); c.restore(); }
    c.font = K.font(16, 700); c.fillStyle = '#FFFFFF'; c.fillText(K.t('kills') + ' ' + e.kills + ' · ' + K.t('lost') + ' ' + e.lost, W / 2, H * 0.48);
    gem(c, W / 2 - 34, H * 0.56, 11); c.fillStyle = '#9BE3FF'; c.font = K.font(22); c.fillText('+' + e.gems, W / 2 + 6, H * 0.56 + 1);
    var bw = Math.min(170, (W - 50) / 3), bh = 50, y = H * 0.68, next = e.won && !B.survival && B.lvl + 1 < LEVELS.length;
    var bs = [['map', K.t('map'), '#7A5230'], ['retry', K.t('retry'), '#3B82F6']].concat(next ? [['next', K.t('next') + ' ▶', '#E8364F']] : []), tw = bs.length * bw + (bs.length - 1) * 10;
    bs.forEach(function (b, i) { btn(c, K, (W - tw) / 2 + i * (bw + 10), y, bw, bh, b[2], b[1], b[0]); });
  }
  function drawPoses(c, K) { // ?poses: every pose on one sheet (look before simulating, as the skill asks)
    var names = Object.keys(POSE), cols = 7, cw = K.W / cols, ch = (K.H - K.hudH) / Math.ceil(names.length / cols); c.fillStyle = '#F4E4C4'; c.fillRect(0, 0, K.W, K.H);
    names.forEach(function (n, i) { var U = iconUnits['pose:' + n] || (iconUnits['pose:' + n] = (function () { var w = n.indexOf('sl') === 0 ? 'slinger' : n.indexOf('pkx') === 0 || n === 'carry' ? 'digger' : n.indexOf('pk') === 0 ? 'pike' : n.indexOf('cl') === 0 ? 'giant' : n.indexOf('hx') === 0 ? 'hexer' : 'blade', V = new Unit(0, w, 0); V.lz = 0; KEYS.forEach(function (k) { V.j[k].v = POSE[n][k] != null ? POSE[n][k] : STANCE[k]; }); V.target = POSE[n]; if (POSE[n].fk2) V.legIK[1] = false; V.L = solve(V); return V; })());
      var cx = (i % cols + 0.5) * cw, cy = K.hudH + (Math.floor(i / cols) + 0.82) * ch, sc = cam, sz = zoom, sg = gy, sb = B; zoom = ch / 120; cam = -cx / zoom; gy = cy; B = { me: null }; drawUnit(c, K, U); cam = sc; zoom = sz; gy = sg; B = sb;
      c.fillStyle = '#3A2A1A'; c.font = K.font(11, 700); c.textAlign = 'center'; c.fillText(n, cx, cy + 12); });
  }
  function uiHit(x, y) { for (var i = ui.length - 1; i >= 0; i--) { var u = ui[i]; if (x >= u.x && x <= u.x + u.w && y >= u.y && y <= u.y + u.h) return u; } return null; }
  function tap(K, u) {
    if (!u) return; var a = u.act;
    if (a === 'lvl') { if (mapSel === u.i) newBattle(K, mapSel); else { mapSel = u.i; K.sfx('click'); } }
    else if (a === 'play') newBattle(K, mapSel);
    else if (a === 'surv') newBattle(K, Math.min(unlocked(), 11), true);
    else if (a === 'upg') { phase = 'upg'; K.sfx('click'); }
    else if (a === 'back' || a === 'map') { phase = 'map'; B = null; K.sfx('click'); K.info(''); }
    else if (a === 'retry') newBattle(K, B.lvl, B.survival);
    else if (a === 'next') { mapSel = B.lvl + 1; newBattle(K, mapSel); }
    else if (a === 'buyUpg') { var pr = upgPrice(u.k); if (pr && gems() >= pr) { save('gems', gems() - pr); var o = store('upg', {}); o[u.k] = upg(u.k) + 1; save('upg', o); K.sfx('reward'); K.confetti(25); } else K.sfx('wrong'); }
    else if (a === 'train') train(K, 0, u.t);
    else if (a === 'cmd') { if (u.c === 'me') possess(K); else command(K, 0, u.c); }
    else if (a === 'atk') meAttack(K, false); else if (a === 'kick') meAttack(K, true);
  }

  var touchHold = {};
  BubziKit.run({
    id: 'stick-dominion', coinRate: 0.01, noSkins: true,
    title: { en: 'Stick Dominion', fr: 'Stick Dominion', ar: 'ستيك دومينيون' },
    strings: {
      en: { tagline: 'Mine gold, raise a stick army and topple the enemy Monument!', campaign: 'Campaign', level: 'Level', lvl: 'Lv', survival: 'Survival', upgrades: 'Upgrades', back: 'Back', wave: 'Wave', victory: 'VICTORY!', defeat: 'DEFEAT', kills: 'Defeated', lost: 'Lost', map: 'Map', retry: 'Retry', next: 'Next', fallen: 'Your soldier has fallen', noArmy: 'Train a soldier first', youCommand: 'You are in command! Fight!', warlord: 'The Warlord has arrived!',
        c_attack: 'Attack', c_hold: 'Hold', c_defend: 'Defend', c_me: 'Command', meKeys: 'A/D move · J attack · K kick · T release',
        u_dmg: 'Sharp Steel', u_dmgD: '+8% damage for your army', u_hp: 'Thick Armor', u_hpD: '+10% health for your army', u_dig: 'Fast Diggers', u_digD: 'Diggers walk 12% faster', u_gold: 'War Chest', u_goldD: '+60 starting gold', u_mon: 'Strong Monument', u_monD: '+15% Monument health', u_pop: 'Barracks', u_popD: '+3 army size',
        story0: 'The Smudge Horde marches on the Quill lands. Hold the valley!', story1: 'Their slingers and pikes grow bolder. Push them back.', story2: 'A giant walks with them now. Stand firm.', story3: 'Hexers twist the ink itself. Strike fast.', story4: 'The Warlord waits behind his Monument. End this war!' },
      fr: { tagline: 'Mine de l’or, lève une armée de bâtons et renverse le Monument ennemi !', campaign: 'Campagne', level: 'Niveau', lvl: 'Nv', survival: 'Survie', upgrades: 'Améliorations', back: 'Retour', wave: 'Vague', victory: 'VICTOIRE !', defeat: 'DÉFAITE', kills: 'Vaincus', lost: 'Perdus', map: 'Carte', retry: 'Rejouer', next: 'Suivant', fallen: 'Ton soldat est tombé', noArmy: 'Forme d’abord un soldat', youCommand: 'Tu commandes ! Combats !', warlord: 'Le Seigneur de guerre arrive !',
        c_attack: 'Attaque', c_hold: 'Tenir', c_defend: 'Défense', c_me: 'Commander', meKeys: 'A/D bouger · J frapper · K coup de pied · T lâcher',
        u_dmg: 'Acier tranchant', u_dmgD: '+8 % de dégâts pour ton armée', u_hp: 'Armure épaisse', u_hpD: '+10 % de vie pour ton armée', u_dig: 'Mineurs rapides', u_digD: 'Les mineurs vont 12 % plus vite', u_gold: 'Trésor de guerre', u_goldD: '+60 d’or au départ', u_mon: 'Monument solide', u_monD: '+15 % de vie du Monument', u_pop: 'Caserne', u_popD: '+3 places dans l’armée',
        story0: 'La Horde Tachée marche sur les terres de la Plume. Tiens la vallée !', story1: 'Frondeurs et piquiers s’enhardissent. Repousse-les.', story2: 'Un géant marche avec eux. Tiens bon.', story3: 'Les Ensorceleurs tordent l’encre. Frappe vite.', story4: 'Le Seigneur de guerre attend derrière son Monument. Finis cette guerre !' },
      ar: { tagline: 'انقب الذهب وجهّز جيشاً من العصي وأسقط نُصب العدو!', campaign: 'الحملة', level: 'المرحلة', lvl: 'م', survival: 'النجاة', upgrades: 'التحسينات', back: 'رجوع', wave: 'الموجة', victory: 'نصر!', defeat: 'هزيمة', kills: 'المهزومون', lost: 'الخسائر', map: 'الخريطة', retry: 'أعد', next: 'التالي', fallen: 'سقط جنديك', noArmy: 'درّب جندياً أولاً', youCommand: 'أنت القائد! قاتل!', warlord: 'وصل أمير الحرب!',
        c_attack: 'هجوم', c_hold: 'ثبات', c_defend: 'دفاع', c_me: 'قيادة', meKeys: 'A/D تحرك · J ضرب · K ركلة · T ترك',
        u_dmg: 'فولاذ حاد', u_dmgD: '+8٪ ضرر لجيشك', u_hp: 'درع سميك', u_hpD: '+10٪ صحة لجيشك', u_dig: 'منقبون سريعون', u_digD: 'المنقبون أسرع بـ12٪', u_gold: 'خزينة الحرب', u_goldD: '+60 ذهب في البداية', u_mon: 'نُصب متين', u_monD: '+15٪ صحة النُصب', u_pop: 'الثكنة', u_popD: '+3 مقاعد في الجيش',
        story0: 'جحافل اللطخة تزحف على أرض الريشة. احمِ الوادي!', story1: 'الرماة والرماحون يزدادون جرأة. ادفعهم للخلف.', story2: 'عملاق يمشي معهم الآن. اصمد.', story3: 'السحرة يلوون الحبر نفسه. اضرب بسرعة.', story4: 'أمير الحرب ينتظر خلف نُصبه. أنهِ هذه الحرب!' }
    },
    init: function (K) { K0 = K; layout(K); window.addEventListener('touchstart', function () { K.touch = true; }, { passive: true, once: true }); },
    resize: function (K) { layout(K); },
    reset: function (K) {
      K0 = K; layout(K); B = null; phase = 'map'; endInfo = null; held = {}; touchHold = {}; mapSel = Math.min(unlocked(), store('sel', 0));
      if (!music && window.GameMusic) {
        music = window.GameMusic({ base: 'audio/stick-dominion/', sfx: ['slash', 'clash', 'pick', 'gold', 'sling', 'stone', 'spear', 'slam', 'hex', 'horn', 'retreat', 'crack', 'train', 'punch', 'kick', 'win', 'lose', 'click', 'die1', 'die2', 'die3', 'hit1', 'hit2', 'hit3'], variants: { die: ['die1', 'die2', 'die3'], hit: ['hit1', 'hit2', 'hit3'] } });
        var kitSfx = K.sfx, FALL = { slash: 'hit', clash: 'block', pick: 'tick', gold: 'coin', sling: 'whoosh', stone: 'hit', spear: 'whoosh', slam: 'heavy', hex: 'pop', horn: 'boss', retreat: 'flip', crack: 'block', train: 'pop', kick: 'punch', win: 'reward', lose: 'over', die: 'pop', hit: 'hit', none: null };
        K.sfx = function (n) { if (n === 'none') return; if (!music.sfx(K, n)) { var f = FALL.hasOwnProperty(n) ? FALL[n] : n; if (f) kitSfx.call(K, f); } };
        ['pointerdown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { musicOn = true; setTimeout(function () { music.preload(K); }, 50); }, { once: true }); });
      }
      if (K.test) {
        window.__sd = { start: function (l, s) { newBattle(K, l || 0, !!s); }, gold: function (n) { B.gold[0] += n; }, spawn: function (t, s, x) { return !!spawnUnit(s || 0, t, x || 600); }, possess: function () { possess(K); }, atk: function () { meAttack(K, false); }, kick: function () { meAttack(K, true); }, cmd: function (c) { command(K, 0, c); }, monHit: function (s, n) { hitMonument(K, s, n); }, unlockAll: function () { save('unl', 11); }, ecmd: function (c) { B.cmd[1] = c; B.ai = 1e9; }, cam: function (x) { if (x !== undefined) cam = x; return { cam: cam, zoom: zoom, gy: gy }; }, me: function () { var U = B && B.me; return U ? { x: U.x, hp: U.hp, cur: U.cur && U.cur.p, face: U.face } : null; } };
        K.dbg = function () { return { phase: phase, gold: B ? Math.floor(B.gold[0]) : 0, egold: B ? Math.floor(B.gold[1]) : 0, mon: B ? B.mon.map(function (M) { return Math.round(M.hp); }) : null, cmd: B ? B.cmd : null, t: B ? B.t : 0, wave: B ? B.wave : 0, units: B ? B.units.filter(function (U) { return !U.dead; }).map(function (U) { return { s: U.side, t: U.type, x: Math.round(U.x), hp: Math.round(U.hp), job: U.job && U.job.s, vx: Math.round(U.vx), cd: +U.cd.toFixed(2), cur: U.cur && U.cur.p, q: U.queue.length, f: U.face }; }) : [], q: B ? B.q[0].length : 0, kills: B ? B.kills : 0, end: endInfo ? { won: endInfo.won, st: endInfo.st, gems: endInfo.gems } : null, gems: gems(), unl: unlocked(), ui: ui.map(function (u) { return { act: u.act, x: u.x + u.w / 2, y: u.y + u.h / 2, t: u.t, c: u.c, i: u.i }; }) }; };
      }
    },
    idle: function (dt, K) { if (music && musicOn && K) music.mood(K, 'menu', 'menu'); },
    update: function (dt, K) {
      if (K.hudMid) K.hudMid(false); if (K.bannerOff) K.bannerOff(phase === 'battle');
      if (music && musicOn) music.mood(K, phase === 'battle' ? 'fight' : 'menu', phase === 'battle' ? (B.units.some(function (U) { return (U.boss || U.type === 'giant') && U.side === 1 && !U.dead; }) ? 'boss' : 'fight') : phase === 'end' ? 'calm' : 'menu');
      if (K.test && K.fastX) dt *= K.fastX;
      if (phase === 'battle' && B) { stepBattle(K, dt); if (B.survival && phase === 'end') { /* the kit records the score */ } }
      else if (phase === 'end' && B) { B.units.forEach(function (U) { if (U.side === (endInfo.won ? 0 : 1) && !U.dead && !U.busy()) { U.vx = 0; U.target = POSE.cheer; U.f = 6; } stepUnit(K, U, dt); }); }
      if (phase === 'end' && B && B.survival && !endInfo.over) { endInfo.over = true; setTimeout(function () { K.gameOver({}); }, 1800); }
    },
    draw: function (c, K, state) {
      if (/[?&]poses\b/.test(location.search)) { drawPoses(c, K); return; }
      if (phase === 'map') { drawMap(c, K); return; } if (phase === 'upg') { drawUpg(c, K); return; }
      if (!B) { drawMap(c, K); return; }
      drawScene(c, K); drawMonument(c, K, 0); if (!B.survival) drawMonument(c, K, 1);
      B.units.slice().sort(function (a, b) { return a.lz - b.lz; }).forEach(function (U) { drawUnit(c, K, U); });
      K.steady(c, function () { drawFx(c, K, K.dt || 0.016); if (phase === 'battle') drawHud(c, K); else if (phase === 'end') drawEnd(c, K); });
    },
    pointerDown: function (x, y, K, id) {
      var u = uiHit(x, y);
      if (phase !== 'battle') { tap(K, u); return; }
      if (u && u.act === 'hold') { held[u.k] = true; touchHold[id] = u.k; return; }
      if (u && u.act === 'mini') { cam = clamp((x - u.mx) / u.mw * WORLD - K.W / zoom / 2, 0, WORLD - K.W / zoom); return; }
      if (u) { tap(K, u); return; }
      drag = { id: id, x: x, cam: cam };
    },
    pointerMove: function (x, y, K, id) { if (drag && drag.id === id && !B.me) cam = clamp(drag.cam - (x - drag.x) / zoom, 0, Math.max(0, WORLD - K.W / zoom)); },
    pointerUp: function (x, y, K, id) { if (touchHold[id]) { held[touchHold[id]] = false; delete touchHold[id]; } if (drag && drag.id === id) drag = null; },
    pointerCancel: function () { held = {}; touchHold = {}; drag = null; },
    key: function (code, down, K, rep) {
      if (phase !== 'battle') { if (!down || rep) return;
        if (phase === 'map') { if (code === 'ArrowRight' || code === 'KeyD') mapSel = Math.min(unlocked(), mapSel + 1); else if (code === 'ArrowLeft' || code === 'KeyA') mapSel = Math.max(0, mapSel - 1); else if (code === 'Enter' || code === 'Space') newBattle(K, mapSel); else if (code === 'KeyU') phase = 'upg'; else if (code === 'KeyS') tap(K, { act: 'surv' }); save('sel', mapSel); }
        else if (phase === 'upg' && (code === 'Backspace' || code === 'KeyB')) phase = 'map';
        else if (phase === 'end') { if (code === 'Enter' || code === 'Space') tap(K, { act: endInfo.won && !B.survival && B.lvl + 1 < LEVELS.length ? 'next' : 'retry' }); else if (code === 'Backspace') tap(K, { act: 'map' }); }
        return; }
      if (code === 'ArrowLeft' || code === 'KeyA') { held.left = down; return; } if (code === 'ArrowRight' || code === 'KeyD') { held.right = down; return; }
      if (!down || rep) return;
      var n = /^Digit([1-6])$/.exec(code); if (n) { train(K, 0, TYPE_ORDER[+n[1] - 1]); return; }
      if (code === 'KeyZ') command(K, 0, 'defend'); else if (code === 'KeyX') command(K, 0, 'hold'); else if (code === 'KeyC') command(K, 0, 'attack');
      else if (code === 'KeyT') possess(K); else if (code === 'KeyJ' || code === 'Space') meAttack(K, false); else if (code === 'KeyK') meAttack(K, true);
    }
  });
})();
