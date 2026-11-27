/* Ink Fight: the stickman-fighter engine (see .claude/skills/stickman-fighter) as a module for Ink Heroes.
   Engine units ("eu"): the hero is about 86 eu tall, y is down, the ground is y = 0. The game converts with a
   scale S (game units per eu). The hero is a jointed rig: spine in two parts, hip and shoulder twist, 2-bone IK
   legs on planted feet that step, joint springs chasing key poses, sub-stepped at 240 Hz. Strikes land only by
   real contact between the striking part and a victim's capsules. Victims are adaptors (see `victim` notes). */
var InkFight = (function () {
  'use strict';
  var TAU = Math.PI * 2, GROUND = 0, G = 1900;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; }, rand = function (a, b) { return a + Math.random() * (b - a); };
  var LEN = { sp: 15, nk: 4, head: 8.2, ua: 15, fa: 15, th: 20, sh: 20.5, ft: 6.5, ank: 2.4 };
  var LEG = LEN.th + LEN.sh;
  var KEYS = ['px', 'py', 't1', 't2', 'tw', 'h', 'a1', 'e1', 'a2', 'e2', 'l1', 'k1', 'l2', 'k2', 'fa1', 'fa2'];
  function dir(a) { return [Math.sin(a), Math.cos(a)]; }
  function up(a) { return [Math.sin(a), -Math.cos(a)]; }
  function fwd(a) { return [Math.cos(a), Math.sin(a)]; }
  function spring(v) { return { v: v, w: 0 }; }
  function add(p, d, k) { return [p[0] + d[0] * k, p[1] + d[1] * k]; }
  function wrapA(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }
  function mixA(a, b, k) { return a + wrapA(b - a) * k; }

  var STANCE = { px: -1, py: 35.5, t1: 0.06, t2: 0.05, tw: 0.35, h: 0.1, a1: 0.72, e1: 2.28, a2: 0.36, e2: 2.68, l1: 0.3, k1: -0.4, l2: -0.3, k2: -0.3, fa1: 0, fa2: 0.18, p1: 12, p2: -12 };
  function D(o) { var r = {}, k; for (k in STANCE) r[k] = STANCE[k]; for (k in o) r[k] = o[k]; return r; }
  var POSE = {
    stance: D({}),
    // ---- punches: the other hand always stays home on the chin ----
    jab: D({ px: 4, py: 35, t1: 0.12, t2: 0.1, tw: 0.75, h: 0.12, a1: 1.56, e1: 0.03, p1: 15 }),
    crossLoad: D({ px: 1, py: 34, t1: 0.1, tw: 0.55, fa2: 0.35 }),
    cross: D({ px: 6, py: 35, t1: 0.22, t2: 0.12, tw: -0.8, h: 0.14, a1: 0.8, e1: 2.3, a2: 1.53, e2: 0.03, fa2: 1 }),
    hookLoad: D({ px: 1, py: 33, t1: 0.1, tw: 0.75, a1: 1.0, e1: 1.6, fa2: 0.3 }),
    hook: D({ px: 4, py: 33, t1: 0.16, t2: 0.04, tw: -0.55, h: 0.12, a1: 1.62, e1: 0.75, fa1: 0.85, fa2: 0 }),
    overLoad: D({ px: -1, py: 33, t1: -0.05, t2: -0.08, tw: 0.6, h: 0.05, a2: 2.75, e2: 1.2, fa2: 0.4 }),
    overhand: D({ px: 8, py: 32, t1: 0.42, t2: 0.15, tw: -0.95, h: 0.2, a1: 0.6, e1: 2.2, a2: 1.85, e2: 0.32, fa2: 1, p1: 15 }),
    overFollow: D({ px: 8, py: 31, t1: 0.55, t2: 0.2, tw: -0.95, h: 0.25, a1: 0.6, e1: 2.2, a2: 0.9, e2: 0.5, fa2: 1, p1: 15 }),
    // ---- uppercuts: dip the knees, then the legs and hips drive the fist up ----
    luDip: D({ px: 1, py: 30, t1: 0.28, t2: 0.12, tw: 0.75, h: 0.2, a1: 0.5, e1: 1.85, fa1: 0 }),
    leadUpper: D({ px: 5, py: 35.5, t1: 0.12, t2: -0.04, tw: -0.2, h: 0.04, a1: 1.3, e1: 1.5, fa1: 0.6 }),
    ruDip: D({ px: 2, py: 28.5, t1: 0.38, t2: 0.14, tw: 0.8, h: 0.25, a2: 0.15, e2: 1.95, fa2: 0.15 }),
    rearUpper: D({ px: 6, py: 38.5, t1: -0.04, t2: -0.16, tw: -0.85, h: -0.06, a2: 1.6, e2: 1.32, fa2: 1, fa1: 0.25 }),
    ruFollow: D({ px: 6, py: 39, t1: -0.12, t2: -0.2, tw: -0.9, h: -0.12, a2: 2.25, e2: 0.85, fa2: 1, fa1: 0.3 }),
    juDip: D({ px: 3, py: 23, t1: 0.5, t2: 0.15, tw: 0.85, h: 0.3, a2: 0.1, e2: 1.9, fa2: 0.2 }),
    jumpUpper: D({ px: 6, py: 38, t1: -0.08, t2: -0.18, tw: -0.9, h: -0.1, a2: 1.72, e2: 1.22, fk1: 1, fk2: 1, l1: 0.9, k1: -1.4, l2: -0.2, k2: -0.5 }),
    juFollow: D({ px: 4, py: 36, t1: -0.15, t2: -0.2, tw: -0.9, h: -0.15, a2: 2.8, e2: 0.25, fk1: 1, fk2: 1, l1: 1.1, k1: -1.7, l2: 0.1, k2: -1.0 }),
    airLeadUp: D({ px: 3, py: 34, t1: 0.0, t2: -0.1, tw: -0.2, h: 0, a1: 1.65, e1: 1.3, fk1: 1, fk2: 1, l1: 1.2, k1: -1.9, l2: 0.3, k2: -1.3 }),
    airRearUp: D({ px: 3, py: 34, t1: -0.05, t2: -0.15, tw: -0.9, h: -0.05, a2: 1.7, e2: 1.25, fk1: 1, fk2: 1, l1: 1.0, k1: -1.7, l2: 0.5, k2: -1.6 }),
    tuck: D({ px: 0, py: 31, t1: 0.15, t2: 0.1, fk1: 1, fk2: 1, l1: 1.35, k1: -2.1, l2: 0.6, k2: -1.9 }),
    axeUp: D({ px: 0, py: 33, t1: -0.35, t2: -0.1, tw: 0.2, h: 0.2, a1: 1.3, e1: 0.8, a2: -0.6, e2: 0.9, fk1: 1, fk2: 1, l1: 2.95, k1: -0.08, l2: 0.25, k2: -0.9 }),
    axeDown: D({ px: 0, py: 33, t1: 0.4, t2: 0.12, tw: 0, h: -0.05, a1: -0.3, e1: 1.1, a2: 0.9, e2: 0.9, fk1: 1, fk2: 1, l1: 0.95, k1: -0.04, l2: -0.3, k2: -0.6 }),
    land: D({ px: 0, py: 27, t1: 0.32, t2: 0.1, h: 0.05 }),
    // ---- kicks: rear-leg kicks turn the hips over, pivot on the lead foot and swing the arm back ----
    lkChamb: D({ px: 0, py: 34, t1: -0.08, t2: 0, tw: 0.2, fk2: 1, l2: 0.75, k2: -1.55, fa1: 0.5, a2: 0.2, e2: 1.5 }),
    lowKick: D({ px: 2, py: 34, t1: -0.22, t2: -0.06, tw: -0.9, h: 0.15, fk2: 1, l2: 1.12, k2: -0.12, fa1: 1, a2: -0.65, e2: 0.35, a1: 0.85, e1: 2.2 }),
    lkRecover: D({ px: 0, py: 34, t1: -0.05, fk2: 1, l2: 0.45, k2: -1.3, fa1: 0.4 }),
    teepChamb: D({ px: -2, py: 35, t1: -0.15, t2: -0.05, tw: 0.5, fk1: 1, l1: 1.78, k1: -2.35, fa1: 0, fa2: 0.2 }),
    teep: D({ px: 4, py: 36, t1: -0.38, t2: -0.1, tw: 0.6, h: 0.2, fk1: 1, l1: 1.75, k1: -0.04, fa1: -0.6, fa2: 0.6, a1: 0.95, e1: 2.0, a2: 0.2, e2: 2.4 }),
    rkChamb: D({ px: 0, py: 34, t1: -0.25, t2: -0.05, tw: 0, fk2: 1, l2: 1.45, k2: -2.2, fa1: 0.8, a2: -0.2, e2: 1.2 }),
    bodyKick: D({ px: 2, py: 35, t1: -0.55, t2: -0.12, tw: -1, h: 0.25, fk2: 1, l2: 1.95, k2: -0.08, fa1: 1, a2: -0.9, e2: 0.25, a1: 0.95, e1: 2.15 }),
    rkRecover: D({ px: 0, py: 34, t1: -0.2, tw: -0.3, fk2: 1, l2: 0.9, k2: -1.7, fa1: 0.5, a2: 0.0, e2: 1.2 }),
    hkChamb: D({ px: -1, py: 34, t1: -0.45, t2: -0.1, tw: -0.1, fk2: 1, l2: 1.85, k2: -2.3, fa1: 0.9, a2: -0.5, e2: 1.0 }),
    highKick: D({ px: 1, py: 36, t1: -0.85, t2: -0.15, tw: -1, h: 0.35, fk2: 1, l2: 2.32, k2: -0.05, fa1: 1, a2: -1.15, e2: 0.2, a1: 1.05, e1: 2.1 }),
    // ---- clinch: hands lock behind the head, knees and headbutts ----
    clinchReach: D({ px: 4, py: 34, t1: 0.2, t2: 0.1, tw: 0.3, h: 0.1, a1: 1.7, e1: 0.4, a2: 1.6, e2: 0.5, p1: 14 }),
    clinch: D({ px: 3, py: 34, t1: 0.22, t2: 0.12, tw: 0.15, h: 0.18, grab: 1 }),
    kneeLoad: D({ px: 0, py: 34, t1: 0.3, t2: 0.15, tw: 0.2, h: 0.2, grab: 1, fk2: 1, l2: -0.25, k2: -1.2, fa1: 0.3 }),
    knee: D({ px: 6, py: 35, t1: -0.05, t2: 0.05, tw: -0.5, h: 0.12, grab: 1, fk2: 1, l2: 2.3, k2: -2.6, fa1: 1 }),
    hbLoad: D({ px: -1, py: 36, t1: 0.0, t2: -0.3, tw: 0.15, h: -0.55, grab: 1 }),
    headbutt: D({ px: 6, py: 34, t1: 0.2, t2: 0.3, tw: 0.15, h: 0.5, grab: 1, fa2: 0.6 }),
    hbLoad2: D({ px: -3, py: 37, t1: -0.08, t2: -0.4, tw: 0.15, h: -0.7, grab: 1, fa1: 0.4 }),
    headbutt2: D({ px: 8, py: 33, t1: 0.26, t2: 0.36, tw: 0.15, h: 0.55, grab: 1, fa2: 1 }),
    release: D({ px: 2, py: 34, t1: 0.15, t2: 0.1, h: 0.2, a1: 1.2, e1: 0.5, a2: 1.0, e2: 0.6 }),
    // ---- game states ----
    jumpUp: D({ px: 0, py: 34, t1: 0.1, t2: 0.05, h: 0.05, a1: 1.3, e1: 1.4, a2: 0.4, e2: 1.9, fk1: 1, fk2: 1, l1: 1.1, k1: -1.5, l2: 0.1, k2: -0.7 }),
    fall: D({ px: 0, py: 34, t1: 0.12, t2: 0.04, h: 0.1, a1: 1.6, e1: 0.9, a2: 0.9, e2: 1.2, fk1: 1, fk2: 1, l1: 0.6, k1: -0.7, l2: -0.15, k2: -0.5 }),
    hurt: D({ px: -4, py: 33, t1: -0.3, t2: -0.35, tw: 0.25, h: -0.55, a1: 0.2, e1: 1.2, a2: -0.2, e2: 1.0, fa1: 0.5 }),
    aim: D({ px: 0, py: 35, t1: 0.06, t2: 0.04, tw: 0.4, h: 0.08, a1: 1.52, e1: 0.06, a2: 0.5, e2: 2.4 }),
    diveKick: D({ px: 0, py: 34, t1: 0.35, t2: 0.1, tw: -0.3, h: 0.15, a1: 2.3, e1: 0.6, a2: -0.4, e2: 1.0, fk1: 1, fk2: 1, l1: 0.55, k1: -0.05, l2: -0.2, k2: -1.6 }),
    // ---- weapon swings: the weapon is in the near hand (h1); see WEAPON ----
    wGuard: D({ a1: 0.55, e1: 1.55, a2: 0.4, e2: 2.4 }),
    wLoad1: D({ px: -1, py: 34, t1: -0.05, t2: -0.1, tw: 0.75, h: 0.05, a1: 2.75, e1: 0.55, fa2: 0.3 }),
    wSwing1: D({ px: 7, py: 33, t1: 0.3, t2: 0.12, tw: -0.7, h: 0.12, a1: 1.15, e1: 0.05, fa2: 1, p1: 15 }),
    wLoad2: D({ px: 1, py: 33, t1: 0.25, t2: 0.1, tw: -0.6, h: 0.1, a1: 0.25, e1: -0.35, fa2: 0.6 }),
    wSwing2: D({ px: 6, py: 36, t1: -0.05, t2: -0.12, tw: 0.7, h: 0, a1: 2.15, e1: 0.15, fa1: 0.5 }),
    wLoad3: D({ px: -2, py: 33, t1: -0.3, t2: -0.2, tw: 0.3, h: -0.1, a1: 3.05, e1: 0.9, a2: 2.6, e2: 0.9, fa2: 0.4 }),
    wSmash: D({ px: 9, py: 29, t1: 0.65, t2: 0.25, tw: -0.3, h: 0.25, a1: 1.05, e1: -0.1, a2: 1.0, e2: 0.2, fa2: 1, p1: 17 }),
    wThrust: D({ px: 10, py: 32, t1: 0.35, t2: 0.1, tw: -0.4, h: 0.12, a1: 1.5, e1: 0.02, a2: 0.2, e2: 1.3, fa2: 1, p1: 18 }),
    // ---- reactions and bodies ----
    tumble: D({ t1: -0.62, t2: -0.2, h: -0.6, a1: -1.85, e1: 0.4, a2: -2.45, e2: 0.6, fk1: 1, fk2: 1, l1: 0.92, k1: -1.15, l2: 0.42, k2: -0.62 }),
    down: D({ t1: 0.0, t2: 0.0, h: 0.15, a1: 0.75, e1: 0.35, a2: 0.95, e2: 0.25, fk1: 1, fk2: 1, l1: 0.1, k1: -0.1, l2: -0.06, k2: -0.22, fa1: -0.5, fa2: -0.5 }),
    getUp: D({ t1: 0.7, t2: 0.2, h: -0.2, a1: 0.4, e1: 1.2, a2: -0.1, e2: 1.4, fk1: 1, fk2: 1, l1: 1.0, k1: -1.6, l2: -0.3, k2: -1.2 })
  };
  // procedural run cycle: free (FK) legs and pumping arms; the lowest foot is snapped to the ground
  function runPose(t, k, wpn) {
    var s = Math.sin(t), c = Math.cos(t), r = D({ px: 2, py: 34, t1: 0.22 * k + 0.04, t2: 0.05, tw: 0.3 * s * k, h: -0.05, fk1: 1, fk2: 1 });
    r.l1 = 0.95 * s * k + 0.1; r.k1 = -(0.25 + 1.25 * Math.max(0, -c)) * k - 0.15;
    r.l2 = -0.95 * s * k + 0.1; r.k2 = -(0.25 + 1.25 * Math.max(0, c)) * k - 0.15;
    r.fa1 = 0.3; r.fa2 = 0.3;
    r.a1 = wpn ? 0.6 - 0.25 * s * k : -0.75 * s * k + 0.3; r.e1 = wpn ? 1.5 : 1.55;
    r.a2 = 0.75 * s * k + 0.3; r.e2 = 1.55;
    return r;
  }

  /* ---------------- fighter ---------------- */
  function Fighter(x, face) {
    this.x = x; this.vx = 0; this.face = face; this.air = 0; this.vAir = 0; this.gS = 1; this.grounded = true;
    this.rot = spring(0); this.rotT = 0;
    this.j = {}; for (var i = 0; i < KEYS.length; i++) this.j[KEYS[i]] = spring(STANCE[KEYS[i]]);
    this.target = POSE.stance; this.f = 8; this.z = 0.55; this.queue = []; this.cur = null; this.curT = 0; this.state = 'idle';
    this.flash = 0; this.whip = 0; this.seed = Math.random() * 10; this.trails = { h1: [], h2: [], an1: [], an2: [], wp: [] };
    this.feet = [{ x: x + face * STANCE.p1, lift: 0, sw: null }, { x: x + face * STANCE.p2, lift: 0, sw: null }];
    this.legIK = [true, true]; this.xSpring = false; this.xT = x; this.L = null; this.yo = 0; this.grab = null; this.ghosts = [];
    this.weapon = null; this.t = 0; this.burst = 0; this.log = [];
  }
  Fighter.prototype.setPose = function (p, f, z) { this.target = typeof p === 'string' ? POSE[p] : p; this.f = f || 8; this.z = z == null ? 0.55 : z; };
  Fighter.prototype.busy = function () { return !!this.cur || this.queue.length > 0; };
  Fighter.prototype.play = function (steps, replace) { if (replace) { this.queue = []; this.cur = null; } for (var i = 0; i < steps.length; i++) this.queue.push(steps[i]); };
  Fighter.prototype.stop = function () { this.queue = []; this.cur = null; this.clinch = null; this.grab = null; this.xSpring = false; };
  Fighter.prototype.ragdoll = function () { return false; };
  Fighter.prototype.standing = function () { return this.grounded; };

  function ik2(hp, tg, l1, l2, bendSign) {
    var dx = tg[0] - hp[0], dy = tg[1] - hp[1], d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
    var base = Math.atan2(dx, dy), al = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), a = base + bendSign * al;
    var j = add(hp, dir(a), l1), e = add(hp, dir(base), d);
    return [j, e, a, Math.atan2(e[0] - j[0], e[1] - j[1]) - a];
  }
  // local skeleton (x forward from the root, y down from the ground line)
  Fighter.prototype.solve = function (V) {
    var F = this, j = F.j, v = V || function (k) { return j[k].v; }, L = {};
    var t1 = v('t1'), cs = t1 + v('t2'), tw = v('tw');
    var pel = [v('px'), -v('py')], foot = [], i;
    for (i = 0; i < 2; i++) {
      if (V ? !F._fk[i] : F.legIK[i]) {
        var ft = V ? { x: V('p' + (i + 1)), lift: 0 } : { x: (F.feet[i].x - F.x) * F.face, lift: F.feet[i].lift };
        var ph = clamp(v('fa' + (i + 1)), 0, 1) * 0.95, toe = [ft.x + LEN.ft, -ft.lift], ank = [toe[0] - LEN.ft * Math.cos(ph), toe[1] - LEN.ank - LEN.ft * Math.sin(ph)];
        foot[i] = { toe: toe, ank: ank };
        var hx = pel[0] + fwd(t1)[0] * 2.2 * tw * (i ? -0.6 : 0.6), dx = ank[0] - hx, need = ank[1] - Math.sqrt(Math.max(0, (LEG - 0.4) * (LEG - 0.4) - dx * dx));
        if (pel[1] < need) pel[1] = need;
      }
    }
    L.pel = pel; L.mid = add(pel, up(t1), LEN.sp); L.neck = add(L.mid, up(cs), LEN.sp);
    L.head = add(L.neck, up(cs + v('h')), LEN.nk + LEN.head);
    var sb = add(L.mid, up(cs), LEN.sp * 0.9);
    L.s1 = add(sb, fwd(cs), 3.2 * tw); L.s2 = add(sb, fwd(cs), -3.2 * tw);
    L.hp1 = add(pel, fwd(t1), 2.2 * tw * 0.6); L.hp2 = add(pel, fwd(t1), -2.2 * tw * 0.6);
    for (i = 1; i <= 2; i++) {
      var s = L['s' + i], g = !V && F.grab ? F.grab[i - 1] : null;
      if (g) { var r = ik2(s, g, LEN.ua, LEN.fa, -1); L['e' + i] = r[0]; L['h' + i] = r[1]; F._armIK = F._armIK || []; F._armIK[i - 1] = [r[2], r[3]]; }
      else { L['e' + i] = add(s, dir(v('a' + i)), LEN.ua); L['h' + i] = add(L['e' + i], dir(v('a' + i) + v('e' + i)), LEN.fa); }
    }
    for (i = 0; i < 2; i++) {
      var n = i + 1, hp = L['hp' + n];
      if (foot[i]) { var q = ik2(hp, foot[i].ank, LEN.th, LEN.sh, 1); L['kn' + n] = q[0]; L['an' + n] = q[1]; L['toe' + n] = foot[i].toe; L['ikA' + n] = [q[2], q[3]]; }
      else {
        L['kn' + n] = add(hp, dir(v('l' + n)), LEN.th); L['an' + n] = add(L['kn' + n], dir(v('l' + n) + v('k' + n)), LEN.sh);
        L['toe' + n] = add(L['an' + n], dir(v('l' + n) + v('k' + n) + 1.4 + v('fa' + n) * 0.9), LEN.ft);
      }
    }
    var low = -1e9, fl = -1e9, k;
    for (k in L) { if (k.indexOf('ikA') === 0) continue; var lo = L[k][1] + (k === 'head' ? LEN.head : 2.1); if (lo > low) low = lo; }
    ['an1', 'an2', 'toe1', 'toe2'].forEach(function (n) { if (L[n][1] + 2.1 > fl) fl = L[n][1] + 2.1; });
    L.low = low; L.footLow = fl; return L;
  };
  Fighter.prototype.w = function (n) { var p = this.L[n]; return [this.x + this.face * p[0], GROUND + p[1] + this.yo]; };
  Fighter.prototype.refresh = function () {
    this.L = this.solve();
    if (this.grounded) this.yo = this.target.fk1 && this.target.fk2 ? -this.L.footLow : 0; // both legs free on the ground (running): the lowest foot touches
    else this.yo = -this.air - Math.max(0, this.L.low);
  };
  // the weapon in the near hand: points along the forearm, `len` eu long
  Fighter.prototype.weaponLine = function () {
    var e = this.w('e1'), h = this.w('h1'), dx = h[0] - e[0], dy = h[1] - e[1], m = Math.hypot(dx, dy) || 1, len = this.weapon ? this.weapon.len : 0;
    return { a: h, b: [h[0] + dx / m * len, h[1] + dy / m * len], ang: Math.atan2(dx / m * this.face, dy / m) };
  };

  /* ---------------- moves ---------------- */
  // aim: where the strike must land. eff: what touches (h1/h2 fist, head, kn knee, shin, foot, an ankle, wpn weapon)
  function aim(p, eff, mode) { return { p: p, eff: eff, mode: mode || 'edge' }; }
  var MOVES = {
    jab: [{ p: 'jab', d: 0.15, f: 18, z: 0.55, sfx: 'whoosh', aim: aim('jab', 'h1'), hit: { eff: 'h1', power: 1 } }, { p: 'stance', d: 0.09, f: 12 }],
    cross: [{ p: 'crossLoad', d: 0.05, f: 15, aim: aim('cross', 'h2') }, { p: 'cross', d: 0.16, f: 18, sfx: 'whoosh', aim: aim('cross', 'h2'), hit: { eff: 'h2', power: 2 } }, { p: 'stance', d: 0.11, f: 11 }],
    hook: [{ p: 'hookLoad', d: 0.07, f: 14, aim: aim('hook', 'h1') }, { p: 'hook', d: 0.16, f: 17, sfx: 'whoosh', aim: aim('hook', 'h1'), hit: { eff: 'h1', power: 2 } }, { p: 'stance', d: 0.11, f: 11 }],
    overhand: [{ p: 'overLoad', d: 0.13, f: 12, aim: aim('overhand', 'h2') }, { p: 'overhand', d: 0.17, f: 19, sfx: 'whooshBig', aim: aim('overhand', 'h2'), hit: { eff: 'h2', power: 4, ko: 1 } }, { p: 'overFollow', d: 0.22, f: 9 }, { p: 'stance', d: 0.3, f: 7 }],
    lowKick: [{ p: 'lkChamb', d: 0.1, f: 13, aim: aim('lowKick', 'shin2') }, { p: 'lowKick', d: 0.16, f: 17, sfx: 'whoosh', aim: aim('lowKick', 'shin2'), hit: { eff: 'shin2', power: 2, zone: ['leg'] } }, { p: 'lkRecover', d: 0.1, f: 12 }, { p: 'stance', d: 0.14, f: 9 }],
    teep: [{ p: 'teepChamb', d: 0.11, f: 13, aim: aim('teep', 'foot1') }, { p: 'teep', d: 0.15, f: 18, sfx: 'whoosh', aim: aim('teep', 'foot1'), hit: { eff: 'foot1', power: 2, push: 1, zone: ['gut', 'chest'] } }, { p: 'teepChamb', d: 0.08, f: 13 }, { p: 'stance', d: 0.14, f: 9 }],
    bodyKick: [{ p: 'rkChamb', d: 0.11, f: 13, aim: aim('bodyKick', 'shin2') }, { p: 'bodyKick', d: 0.17, f: 18, sfx: 'whooshBig', aim: aim('bodyKick', 'shin2'), hit: { eff: 'shin2', power: 3, zone: ['gut', 'chest', 'arm'] } }, { p: 'rkRecover', d: 0.12, f: 11 }, { p: 'stance', d: 0.16, f: 9 }],
    highKick: [{ p: 'hkChamb', d: 0.13, f: 12, aim: aim('highKick', 'shin2') }, { p: 'highKick', d: 0.2, f: 18, sfx: 'whooshBig', aim: aim('highKick', 'shin2'), hit: { eff: 'shin2', power: 4, ko: 1, zone: ['head', 'arm', 'chest'] } }, { p: 'rkRecover', d: 0.16, f: 10 }, { p: 'stance', d: 0.22, f: 8 }],
    clinchIn: [{ p: 'clinchReach', d: 0.2, f: 10, aim: aim('clinch', 'h1', 'close') }, { p: 'clinch', d: 0.16, f: 10, act: 'clinch' }],
    knee: [{ p: 'kneeLoad', d: 0.13, f: 11 }, { p: 'knee', d: 0.16, f: 17, sfx: 'whoosh', hit: { eff: 'kn2', power: 2, kind: 'knee', zone: ['gut', 'chest', 'head', 'arm'] } }, { p: 'clinch', d: 0.12, f: 11 }],
    headbutt: [{ p: 'hbLoad', d: 0.15, f: 10 }, { p: 'headbutt', d: 0.14, f: 19, sfx: 'whoosh', hit: { eff: 'head', power: 2, kind: 'headbutt' } }, { p: 'clinch', d: 0.15, f: 10 }],
    headbuttKO: [{ p: 'hbLoad2', d: 0.22, f: 8 }, { p: 'headbutt2', d: 0.16, f: 20, sfx: 'whooshBig', hit: { eff: 'head', power: 4, kind: 'headbutt', ko: 1 } }, { p: 'release', d: 0.2, f: 9, act: 'release' }, { p: 'stance', d: 0.3, f: 7 }],
    leadUpper: [{ p: 'luDip', d: 0.09, f: 13, aim: aim('leadUpper', 'h1') }, { p: 'leadUpper', d: 0.15, f: 18, sfx: 'whoosh', aim: aim('leadUpper', 'h1'), hit: { eff: 'h1', power: 1 } }, { p: 'stance', d: 0.09, f: 11 }],
    rearUpper: [{ p: 'ruDip', d: 0.13, f: 12, aim: aim('rearUpper', 'h2', 'chin') }, { p: 'rearUpper', d: 0.13, f: 19, sfx: 'whoosh', aim: aim('rearUpper', 'h2', 'chin'), hit: { eff: 'h2', power: 2, kind: 'upper' } }, { p: 'ruFollow', d: 0.1, f: 12 }, { p: 'stance', d: 0.12, f: 10 }],
    jumpUpper: [{ p: 'juDip', d: 0.2, f: 9, aim: aim('jumpUpper', 'h2', 'chin') }, { p: 'jumpUpper', d: 0.16, f: 21, sfx: 'whooshBig', jump: 800, quake: 1, hit: { eff: 'h2', power: 3, kind: 'launch' } }, { p: 'juFollow', d: 0.12, f: 11, needs: 'air' }],
    airLeadUp: [{ p: 'airLeadUp', d: 0.16, f: 20, sfx: 'whoosh', needs: 'air', plan: 0.1, aim: aim('airLeadUp', 'h1', 'air'), hit: { eff: 'h1', power: 2, kind: 'air' } }, { p: 'tuck', d: 0.05, f: 14, needs: 'air' }],
    airRearUp: [{ p: 'airRearUp', d: 0.16, f: 20, sfx: 'whoosh', needs: 'air', plan: 0.1, aim: aim('airRearUp', 'h2', 'air'), hit: { eff: 'h2', power: 2, kind: 'air', lift: 1 } }, { p: 'tuck', d: 0.04, f: 14, needs: 'air' }],
    axe: [{ p: 'axeUp', d: 0.14, f: 15, needs: 'air', plan: 0.22, aim: aim('axeDown', 'an1', 'above') }, { p: 'axeDown', d: 0.2, f: 23, z: 0.5, sfx: 'whooshBig', needs: 'air', hit: { eff: 'foot1', power: 4, kind: 'slam' } }],
    landing: [{ p: 'tuck', d: 0.1, f: 10, untilLand: true }, { p: 'land', d: 0.18, f: 12 }, { p: 'stance', d: 0.2, f: 8 }],
    // weapon basics (hammer, katana, axe pick-up): the weapon line is the striking part
    wSwing1: [{ p: 'wLoad1', d: 0.12, f: 12, aim: aim('wSwing1', 'wpn') }, { p: 'wSwing1', d: 0.16, f: 18, sfx: 'whooshBig', aim: aim('wSwing1', 'wpn'), hit: { eff: 'wpn', power: 2 } }, { p: 'wGuard', d: 0.12, f: 10 }],
    wSwing2: [{ p: 'wLoad2', d: 0.1, f: 13, aim: aim('wSwing2', 'wpn') }, { p: 'wSwing2', d: 0.16, f: 18, sfx: 'whooshBig', aim: aim('wSwing2', 'wpn'), hit: { eff: 'wpn', power: 2 } }, { p: 'wGuard', d: 0.12, f: 10 }],
    wSmash: [{ p: 'wLoad3', d: 0.18, f: 11, aim: aim('wSmash', 'wpn') }, { p: 'wSmash', d: 0.18, f: 20, sfx: 'whooshBig', aim: aim('wSmash', 'wpn'), hit: { eff: 'wpn', power: 4, smash: 1 } }, { p: 'wGuard', d: 0.26, f: 8 }],
    wThrust: [{ p: 'wLoad2', d: 0.1, f: 13, aim: aim('wThrust', 'wpn') }, { p: 'wThrust', d: 0.15, f: 19, sfx: 'whooshBig', aim: aim('wThrust', 'wpn'), hit: { eff: 'wpn', power: 3, push: 1 } }, { p: 'wGuard', d: 0.18, f: 9 }]
  };

  /* ---------------- contact geometry ---------------- */
  function capsules(F) {
    var w = function (n) { return F.w(n); }, hd = w('head');
    return [
      { a: hd, b: hd, r: LEN.head, part: 'head' }, { a: w('pel'), b: w('mid'), r: 5, part: 'gut' }, { a: w('mid'), b: w('neck'), r: 5.2, part: 'chest' },
      { a: w('s1'), b: w('e1'), r: 2.8, part: 'arm' }, { a: w('e1'), b: w('h1'), r: 2.8, part: 'arm' }, { a: w('s2'), b: w('e2'), r: 2.8, part: 'arm' }, { a: w('e2'), b: w('h2'), r: 2.8, part: 'arm' },
      { a: w('hp1'), b: w('kn1'), r: 3.6, part: 'leg' }, { a: w('kn1'), b: w('an1'), r: 3.2, part: 'leg' }, { a: w('hp2'), b: w('kn2'), r: 3.6, part: 'leg' }, { a: w('kn2'), b: w('an2'), r: 3.2, part: 'leg' }
    ];
  }
  function closest(a, b, p) { var dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy, t = L ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L, 0, 1) : 0; return [a[0] + dx * t, a[1] + dy * t]; }
  function effPts(F, eff) {
    var w = function (n) { return F.w(n); };
    if (eff === 'h1' || eff === 'h2') return { pts: [w(eff)], r: 3.4, aim: w(eff) };
    if (eff === 'head') return { pts: [w('head')], r: LEN.head, aim: w('head') };
    if (eff === 'kn1' || eff === 'kn2') return { pts: [w(eff)], r: 4.6, aim: w(eff) };
    if (eff === 'an1' || eff === 'an2') return { pts: [w(eff)], r: 3.4, aim: w(eff) };
    if (eff === 'wpn') { var wl = F.weaponLine(), ps0 = []; for (var j = 0; j < 6; j++) { var u = 0.25 + j * 0.15; ps0.push([wl.a[0] + (wl.b[0] - wl.a[0]) * u, wl.a[1] + (wl.b[1] - wl.a[1]) * u]); } return { pts: ps0, r: F.weapon ? F.weapon.r : 4, aim: ps0[4] }; }
    var n = eff.slice(-1);
    if (eff.indexOf('shin') === 0) { var k = w('kn' + n), a = w('an' + n), ps = []; for (var i = 0; i < 5; i++) { var t = 0.3 + i * 0.175; ps.push([k[0] + (a[0] - k[0]) * t, k[1] + (a[1] - k[1]) * t]); } return { pts: ps, r: 3.5, aim: ps[3] }; }
    var an = w('an' + n), to = w('toe' + n); return { pts: [an, [(an[0] + to[0]) / 2, (an[1] + to[1]) / 2], to], r: 3.3, aim: to };
  }
  function touch(E, caps, zone) {
    var best = null;
    for (var p = 0; p < E.pts.length; p++) for (var i = 0; i < caps.length; i++) {
      var c = caps[i]; if (zone && zone.indexOf(c.part) < 0) continue; var P = E.pts[p], q = closest(c.a, c.b, P), d = Math.hypot(P[0] - q[0], P[1] - q[1]), pen = c.r + E.r - d;
      if (pen > 0 && (!best || pen > best.pen)) { var nx = d > 1e-4 ? (P[0] - q[0]) / d : 1, ny = d > 1e-4 ? (P[1] - q[1]) / d : 0; best = { pen: pen, part: c.part, n: [nx, ny], pt: [q[0] + nx * c.r, q[1] + ny * c.r] }; }
    }
    return best;
  }
  function frontEdge(caps, y, face) {
    var best = null;
    for (var i = 0; i < caps.length; i++) {
      var c = caps[i]; if (c.part === 'arm') continue;
      for (var k = 0; k <= 10; k++) { var px = c.a[0] + (c.b[0] - c.a[0]) * k / 10, py = c.a[1] + (c.b[1] - c.a[1]) * k / 10, dy = Math.abs(py - y); if (dy >= c.r) continue; var ex = px - face * Math.sqrt(c.r * c.r - dy * dy); if (best == null || face * ex < face * best) best = ex; }
    }
    return best;
  }
  // striking point of a pose relative to the root (static solve, feet planted at the pose's spots)
  var POSE_CACHE = {};
  function poseOff(F, pose, eff) {
    var key = pose + ':' + eff + ':' + (F.weapon ? F.weapon.len : 0); if (POSE_CACHE[key]) return POSE_CACHE[key];
    var P = POSE[pose], T = { j: F.j, x: 0, face: 1, yo: 0, weapon: F.weapon, _fk: [!!P.fk1, !!P.fk2] };
    T.L = Fighter.prototype.solve.call(T, function (k) { return P[k]; }); T.w = Fighter.prototype.w; T.weaponLine = Fighter.prototype.weaponLine;
    var e = effPts(T, eff).aim; return (POSE_CACHE[key] = [e[0], e[1] - GROUND]);
  }
  function aimRoot(F, vic, a) {
    var off = poseOff(F, a.p, a.eff), f = F.face, caps = vic.caps();
    if (a.mode === 'edge') { var edge = frontEdge(caps, GROUND - F.air + off[1], f); if (edge == null) edge = vic.w('head')[0] - f * vic.headR; return { x: edge + f * 5 - f * off[0] }; }
    if (a.mode === 'chin') { var hd = vic.w('head'); return { x: hd[0] - f * 3 - f * off[0] }; }
    if (a.mode === 'close') return { x: vic.x - f * 40 };
    var core = vic.core();
    if (a.mode === 'above') return { x: core[0] - f * off[0] + f * 2, air: -(core[1] + 12 - GROUND) + off[1] };
    return { x: core[0] + f * 6 - f * off[0], air: -(core[1] - GROUND) + off[1] };
  }

  /* ---------------- step timeline ---------------- */
  // one ballistic lunge per air strike: the velocity that meets the victim's predicted spot, then gravity does the rest
  function planAir(F, vic, s) {
    var T = s.plan, r = aimRoot(F, vic, s.aim);
    var dx = vic.vx * T, da = vic.vAir * T - 0.5 * G * vic.gS * T * T;
    var vx = (r.x + dx - F.x) / T, va = (r.air + da - F.air) / T + 0.5 * G * F.gS * T, m = Math.hypot(vx, va);
    if (m > 1250) { vx *= 1250 / m; va *= 1250 / m; }
    F.vx = vx; F.vAir = va; F.burst = 0.16;
  }
  function startStep(F, s, ctx) {
    var vic = ctx.vic;
    if (s.needs === 'air' && (!vic || vic.state !== 'juggled')) { F.cur = null; F.queue = F.queue.filter(function (q) { return q.needs !== 'air'; }); if (!F.grounded && !F.queue.length) F.play(MOVES.landing); return; }
    if (s.hit && vic && vic.state === 'down' && !F.grounded) { F.cur = null; F.queue = []; F.play(MOVES.landing); return; }
    F.cur = s; F.curT = 0; F.setPose(s.p, s.f, s.z); s._hit = false; F.hitSet = [];
    if (s.jump) { F.vAir = s.jump; F.grounded = false; F.gS = 1; F.vx = F.face * 70; F.xSpring = false; if (s.quake && ctx.quake) ctx.quake((F.feet[0].x + F.feet[1].x) / 2, 1); }
    if (s.plan && !F.grounded && vic && vic.state === 'juggled') planAir(F, vic, s);
    if (s.act === 'clinch' && vic && vic.canClinch) { F.clinch = vic; vic.clinched(true); }
    if (s.act === 'release') { if (F.clinch) F.clinch.clinched(false); F.clinch = null; F.grab = null; }
    if (s.sfx && ctx.snd) ctx.snd(s.sfx);
  }
  function updateGrab(F) {
    var vic = F.clinch;
    if (!vic || !F.target.grab) {
      if (F.grab && F._armIK) for (var i = 0; i < 2; i++) { var r = F._armIK[i]; if (r) { F.j['a' + (i + 1)].v = r[0]; F.j['e' + (i + 1)].v = wrapA(r[1]); F.j['a' + (i + 1)].w = F.j['e' + (i + 1)].w = 0; } }
      F.grab = null; return;
    }
    var nk = vic.w('neck'), hd = vic.w('head'), tgt = [hd[0] + F.face * 4, (nk[1] + hd[1]) / 2 + 2];
    var lx = (tgt[0] - F.x) * F.face, ly = tgt[1] - GROUND - F.yo;
    F.grab = [[lx, ly + 1], [lx - 3, ly - 1]];
  }
  function stepFeet(F, dt, ctx) {
    if (!F.grounded) return;
    var want = [F.target.p1 != null ? F.target.p1 : 12, F.target.p2 != null ? F.target.p2 : -12], other = function (i) { return F.feet[1 - i].sw; };
    for (var i = 0; i < 2; i++) {
      var ft = F.feet[i]; if (!F.legIK[i]) continue;
      if (ft.sw) {
        ft.sw.t += dt; var k = clamp(ft.sw.t / ft.sw.d, 0, 1), e = k * k * (3 - 2 * k);
        ft.x = ft.sw.x0 + (ft.sw.x1 - ft.sw.x0) * e; ft.lift = ft.sw.h0 * (1 - e) + Math.sin(Math.PI * k) * ft.sw.arc;
        if (k >= 1) { ft.sw = null; ft.lift = 0; }
        continue;
      }
      var goal = F.x + F.face * want[i] + F.vx * 0.09, err = Math.abs(ft.x - goal);
      if (err > 5.5 && (!other(i) || err > 18)) ft.sw = { t: 0, d: clamp(0.09 + err / 500, 0.09, 0.2), x0: ft.x, x1: goal, h0: ft.lift, arc: Math.min(7, 1.5 + err * 0.22) };
    }
  }
  function setLegMode(F, i, ik) {
    if (F.legIK[i] === ik) return;
    var n = i + 1;
    if (ik) { // a free leg comes back down: start a step from where the foot is now
      var an = F.w('an' + n), ft = F.feet[i], goal = F.x + F.face * (F.target['p' + n] != null ? F.target['p' + n] : (i ? -12 : 12));
      ft.x = an[0]; ft.lift = Math.max(0, GROUND - an[1] - LEN.ank); ft.sw = { t: 0, d: 0.12, x0: ft.x, x1: goal, h0: ft.lift, arc: 2 };
    } else { var a = F.L && F.L['ikA' + n]; if (a) { F.j['l' + n].v = a[0]; F.j['k' + n].v = a[1]; } }
    F.legIK[i] = ik;
  }
  // grounded feet after a landing or a face turn: plant them where the ankles are
  function plantFeet(F) { F.refresh(); for (var q = 0; q < 2; q++) { var an = F.w('an' + (q + 1)); F.feet[q].x = an[0]; F.feet[q].lift = 0; F.feet[q].sw = null; } F.legIK = [false, false]; }

  /* ctx: { vic: target victim or null, others: [victims], drive: true when the engine owns root motion,
            land(F, victims, hit, tc, vel), snd(name), quake(x, s), onLand(F, hard) } */
  function update(F, dt, ctx) {
    var vic = ctx.vic; F.t += dt;
    if (F.cur) { F.curT += dt; var s = F.cur, done = s.untilLand ? (F.grounded && F.curT > 0.02) : F.curT >= s.d; if (done) { if (s.hit && !s._hit) F.log.push('miss ' + s.p); F.cur = null; } }
    if (!F.cur && !F.queue.length && ctx.next) ctx.next(F);
    if (!F.cur && F.queue.length) { var nx = F.queue.shift(); startStep(F, nx, ctx); if (!F.cur && F.queue.length) { nx = F.queue.shift(); startStep(F, nx, ctx); } }
    vic = ctx.vic; // ctx.next may have picked a new target
    var cur = F.cur, strike = cur && cur.hit && !cur._hit ? cur.hit : null;
    if (F.grounded) { setLegMode(F, 0, !F.target.fk1); setLegMode(F, 1, !F.target.fk2); } else { setLegMode(F, 0, false); setLegMode(F, 1, false); }
    // aiming: step in on the ground (air strikes aim once, in planAir)
    if (cur && cur.aim && !cur._hit && vic && ctx.drive && F.grounded && vic.grounded) {
      var r = aimRoot(F, vic, cur.aim), minD = cur.aim.mode === 'close' ? 36 : 25 * (vic.size || 1);
      F.xT = F.face * (vic.x - r.x) < minD ? vic.x - F.face * minD : r.x; F.xSpring = true;
    }
    if (F.clinch && F.clinch.standing()) F.clinch.pullTo(F.x + F.face * 40, 1 - Math.exp(-14 * dt));
    if (F.clinch && !F.clinch.alive()) { F.clinch.clinched(false); F.clinch = null; }
    updateGrab(F);
    // joint springs, sub-stepped; strikes are tested for contact on every sub-step
    var tg = F.target, TT = {}, k, key;
    for (k = 0; k < KEYS.length; k++) { key = KEYS[k]; var t = tg[key]; if (F.state === 'idle' && !cur && key === 'py' && !tg.fk1) t += Math.sin(F.t * 6.5) * 0.7; if (key === 'h' && !cur) t += Math.sin(F.t * 3.1 + F.seed) * 0.03; TT[key] = t; }
    var n = Math.max(1, Math.ceil(dt * 240)), h = dt / n, vics = vic ? [vic].concat(ctx.others || []) : (ctx.others || []);
    for (var i = 0; i < n; i++) {
      for (k = 0; k < KEYS.length; k++) {
        key = KEYS[k]; var sp = F.j[key], fr = F.f, z = F.z;
        if (key === 'h') { fr *= 0.85; z *= 0.8; } // the head lags a little behind the spine
        if (key === 'px' || key === 'py') fr = Math.min(fr, 13);
        var w0 = TAU * fr; sp.w += (w0 * w0 * (TT[key] - sp.v) - 2 * z * w0 * sp.w) * h; sp.v += sp.w * h;
      }
      if (strike && vics.length) {
        F.refresh(); var E = effPts(F, cur.hit.eff), prev = F.prevE || E.aim, hitL = [], tc0 = null; F.prevE = E.aim;
        for (var v = 0; v < vics.length; v++) {
          var V = vics[v]; if (!V.alive() || F.hitSet.indexOf(V) >= 0) continue;
          var tc = touch(E, V.caps(), V.big ? null : cur.hit.zone); if (tc) { hitL.push({ v: V, tc: tc }); if (!tc0) tc0 = tc; }
        }
        if (hitL.length) {
          cur._hit = true; strike = null;
          for (v = 0; v < hitL.length; v++) F.hitSet.push(hitL[v].v);
          ctx.land(F, hitL, cur.hit, [(E.aim[0] - prev[0]) / h, (E.aim[1] - prev[1]) / h]);
          for (k = 0; k < KEYS.length; k++) F.j[KEYS[k]].w *= 0.25; // the limb stops on the body
          break;
        }
      }
    }
    if (!strike) F.prevE = null;
    // root motion (only when the engine drives: combos and specials; otherwise the game moves the body)
    if (ctx.drive) {
      if (F.xSpring && F.grounded) { var xw = TAU * 4.2; F.vx += (xw * xw * (F.xT - F.x) - 2 * 0.95 * xw * F.vx) * dt; if (Math.abs(F.xT - F.x) < 0.5 && Math.abs(F.vx) < 5) F.xSpring = false; }
      else F.vx *= Math.pow(F.grounded ? 0.004 : 0.8, dt);
      F.x += F.vx * dt;
      if (!F.grounded) {
        F.vAir -= G * F.gS * dt; F.air += F.vAir * dt;
        if (F.air <= 0) { var hard = F.vAir < -500; F.air = 0; F.vAir = 0; F.grounded = true; F.gS = 1; plantFeet(F); if (ctx.onLand) ctx.onLand(F, hard); }
      }
    }
    F.flash = Math.max(0, F.flash - dt);
    stepFeet(F, dt, ctx);
    F.refresh();
    // afterimages while the body moves fast through the air; smear trails of the striking parts
    F.burst = Math.max(0, F.burst - dt);
    if (!ctx.reduce && (Math.hypot(F.vx, F.vAir) > 480 || F.burst > 0 || F.ghostOn) && (!F.grounded || F.ghostOn)) { var snap = {}; for (var gi = 0; gi < GHOST.length; gi++) snap[GHOST[gi]] = F.w(GHOST[gi]); if (F.weapon) snap.wpB = F.weaponLine().b; F.ghosts.push({ t: F.t, w: snap }); }
    while (F.ghosts.length && F.t - F.ghosts[0].t > 0.13) F.ghosts.shift();
    var map = { h1: 'e1', h2: 'e2', an1: 'kn1', an2: 'kn2' };
    for (var e in map) { var tr = F.trails[e], a1 = F.w(map[e]), b1 = F.w(e); tr.push({ t: F.t, m: [a1[0] - F.x, a1[1] + F.air], x: [b1[0] - F.x, b1[1] + F.air] }); while (tr.length && F.t - tr[0].t > 0.075) tr.shift(); }
    var wtr = F.trails.wp; if (F.weapon && F.weaponShown) { var wl = F.weaponLine(); wtr.push({ t: F.t, m: [wl.a[0] - F.x, wl.a[1] + F.air], x: [wl.b[0] - F.x, wl.b[1] + F.air] }); } while (wtr.length && (F.t - wtr[0].t > 0.09 || !F.weaponShown)) wtr.shift();
  }

  /* ---------------- fx (engine units) ---------------- */
  var fx = [];
  function star(x, y, r, big) { fx.push({ k: 'star', x: x, y: y, r: r, t: 0, life: big ? 0.3 : 0.2, rot: rand(0, TAU), pts: big ? 12 : 9, big: big }); }
  function ring(x, y, r, pw) { fx.push({ k: 'ring', x: x, y: y, r: r, t: 0, life: 0.18 + pw * 0.03, pw: pw }); }
  function sparksDir(x, y, dx, dy, n, pw, rm) { if (rm) n = Math.ceil(n / 3); var b = Math.atan2(dy, dx); for (var i = 0; i < n; i++) { var a = b + rand(-1.1, 1.1), s = rand(260, 520) * (0.7 + pw * 0.15); fx.push({ k: 'spark', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0, life: rand(0.12, 0.24), w: rand(1.5, 3) }); } }
  function dust(x, s, rm) { for (var i = 0; i < (rm ? 2 : 6); i++) fx.push({ k: 'dust', x: x + rand(-14, 14) * s, y: GROUND - rand(0, 4), vx: rand(-60, 60) * s, vy: rand(-40, -10), r: rand(3, 6) * s, t: 0, life: rand(0.3, 0.5) }); }
  function quake(x, s, rm) {
    // the ground breaks: a crater with cracks, slabs that pop up, flying rocks, a dust wave and a shockwave
    var cr = { k: 'crack', x: x, s: s, t: 0, life: 3.2, lines: [], slabs: [] };
    for (var i = 0; i < 7; i++) { var a = Math.PI * (0.12 + 0.76 * i / 6) + rand(-0.08, 0.08), L = rand(5, 10) * s, pts = [[x + Math.cos(a) * 6 * s, GROUND + 2]]; for (var k = 1; k <= 3; k++) { var q = pts[k - 1], aa = a + rand(-0.35, 0.35); pts.push([q[0] + Math.cos(aa) * L / 3 * 1.6, q[1] + Math.sin(aa) * L / 3 * 0.55]); } cr.lines.push(pts); }
    for (i = -1; i <= 1; i += 2) cr.slabs.push({ x: x + i * rand(9, 13) * s, w: rand(7, 10) * s, a: i * rand(0.25, 0.45), h: rand(2.5, 4) * s });
    fx.push(cr);
    var n = Math.round((rm ? 5 : 16) * s);
    for (i = 0; i < n; i++) { var an = -Math.PI / 2 + rand(-1.15, 1.15), sp = rand(240, 620) * Math.sqrt(s); fx.push({ k: 'rock', x: x + rand(-8, 8) * s, y: GROUND - 1, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, rot: rand(0, TAU), vr: rand(-18, 18), r: rand(1.4, 3.4) * Math.sqrt(s), t: 0, life: rand(0.9, 1.5) }); }
    for (i = 0; i < (rm ? 3 : 12); i++) { var sd = i % 2 ? 1 : -1; fx.push({ k: 'dust', x: x + sd * rand(2, 10), y: GROUND - rand(0, 3), vx: sd * rand(90, 260) * s, vy: rand(-50, -8), r: rand(4, 8) * s, t: 0, life: rand(0.45, 0.8) }); }
    fx.push({ k: 'shock', x: x, t: 0, life: 0.38, s: s });
  }
  function updateFx(dt) {
    for (var i = fx.length - 1; i >= 0; i--) { var p = fx[i]; p.t += dt; if (p.k === 'rock') { p.vy += G * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.y > GROUND) { p.y = GROUND; p.vy *= -0.35; p.vx *= 0.55; p.vr *= 0.5; } } else if (p.vx != null) { p.x += p.vx * dt; p.y += p.vy * dt; var d = Math.pow(p.k === 'spark' ? 0.02 : 0.2, dt); p.vx *= d; p.vy *= d; } if (p.t >= p.life) fx.splice(i, 1); }
    if (fx.length > 500) fx.splice(0, fx.length - 500);
  }
  function easeOutBack(k) { var c = 1.9, m = k - 1; return 1 + (c + 1) * m * m * m + c * m * m; }
  // ctx is already transformed to engine units; col: { ground, bg, dust }
  function drawFx(c, col) {
    fx.forEach(function (p) {
      var k = p.t / p.life;
      if (p.k === 'star') {
        var s = k < 0.3 ? easeOutBack(k / 0.3) : 1 - (k - 0.3) / 0.7 * 0.35, a = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4, r = p.r * s;
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot + k * 0.6); c.globalAlpha = a;
        c.beginPath(); for (var i = 0; i < p.pts * 2; i++) { var rr = i % 2 ? r * 0.38 : r * (i % 4 === 0 ? 1 : 0.72), an = i * Math.PI / p.pts; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.closePath();
        c.fillStyle = '#FFFFFF'; c.fill(); c.lineWidth = p.big ? 3 : 2.2; c.strokeStyle = p.big ? '#FF5FA2' : '#FFB020'; c.stroke();
        c.fillStyle = p.big ? '#FFE66D' : '#FFF4C2'; c.beginPath(); c.arc(0, 0, r * 0.26, 0, TAU); c.fill();
        c.restore();
      } else if (p.k === 'ring') {
        var e = 1 - Math.pow(1 - k, 3); c.globalAlpha = (1 - k) * 0.9; c.strokeStyle = p.pw >= 4 ? '#FF5FA2' : '#FFB020'; c.lineWidth = 3.2 * (1 - k) + 0.5;
        c.beginPath(); c.arc(p.x, p.y, p.r + e * (18 + p.pw * 10), 0, TAU); c.stroke();
      } else if (p.k === 'spark') {
        c.globalAlpha = 1 - k; c.strokeStyle = k < 0.4 ? '#FFFFFF' : '#FFB020'; c.lineWidth = p.w * (1 - k * 0.6); c.lineCap = 'round';
        c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035); c.stroke();
      } else if (p.k === 'crack') {
        var al = k < 0.75 ? 1 : 1 - (k - 0.75) / 0.25, g0 = Math.min(1, p.t / 0.06);
        c.globalAlpha = 0.9 * al; c.fillStyle = col.hole; c.strokeStyle = col.ground; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.ellipse(p.x, GROUND + 2, 13 * p.s * g0, 3.2 * p.s * g0, 0, 0, Math.PI); c.fill(); c.lineWidth = 1.6; c.stroke();
        c.lineWidth = 1.3; p.lines.forEach(function (L) { c.beginPath(); var m = Math.max(2, Math.round(L.length * g0)); for (var i = 0; i < m; i++) i ? c.lineTo(L[i][0], L[i][1]) : c.moveTo(L[i][0], L[i][1]); c.stroke(); });
        p.slabs.forEach(function (sl) { c.save(); c.translate(sl.x, GROUND + 1.5); c.rotate(sl.a * g0); c.fillStyle = col.ground; c.fillRect(-sl.w / 2, -sl.h, sl.w, sl.h); c.restore(); });
      } else if (p.k === 'rock') {
        c.globalAlpha = k < 0.8 ? 1 : (1 - k) / 0.2; c.fillStyle = col.ground; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.beginPath(); c.moveTo(-p.r, -p.r * 0.6); c.lineTo(p.r * 0.8, -p.r); c.lineTo(p.r, p.r * 0.5); c.lineTo(-p.r * 0.4, p.r); c.closePath(); c.fill(); c.restore();
      } else if (p.k === 'shock') {
        var e2 = 1 - Math.pow(1 - k, 2.5); c.globalAlpha = (1 - k) * 0.9; c.strokeStyle = '#FFB020'; c.lineWidth = 4 * (1 - k) + 0.6;
        c.beginPath(); c.ellipse(p.x, GROUND, 10 + e2 * 95 * p.s, 2 + e2 * 9 * p.s, 0, 0, TAU); c.stroke();
        c.strokeStyle = '#FFFFFF'; c.lineWidth = 2 * (1 - k); c.beginPath(); c.ellipse(p.x, GROUND, 6 + e2 * 60 * p.s, 1.5 + e2 * 6 * p.s, 0, 0, TAU); c.stroke();
      } else if (p.k === 'dust') {
        c.globalAlpha = 0.35 * (1 - k); c.fillStyle = col.dust; c.beginPath(); c.arc(p.x, p.y, p.r * (1 + k * 1.6), 0, TAU); c.fill();
      }
    });
    c.globalAlpha = 1;
  }

  /* ---------------- draw the body (engine units) ---------------- */
  var GHOST = ['pel', 'mid', 'neck', 'head', 's1', 's2', 'e1', 'e2', 'h1', 'h2', 'hp1', 'hp2', 'kn1', 'kn2', 'an1', 'an2', 'toe1', 'toe2'];
  function drawBody(c, w, col, back, lw, headR) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    function line(pts, cl, wd) { c.strokeStyle = cl; c.lineWidth = wd; c.beginPath(); for (var i = 0; i < pts.length; i++) { var p = w(pts[i]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); }
    function fist(n, cl) { var p = w(n); c.fillStyle = cl; c.beginPath(); c.arc(p[0], p[1], lw * 0.62, 0, TAU); c.fill(); }
    line(['s2', 'e2', 'h2'], back, lw); fist('h2', back);
    line(['hp2', 'kn2', 'an2', 'toe2'], back, lw);
    var pl = w('pel'), md = w('mid'), nk = w('neck');
    c.strokeStyle = col; c.lineWidth = lw * 1.18; c.beginPath(); c.moveTo(pl[0], pl[1]); c.quadraticCurveTo(md[0] * 2 - (pl[0] + nk[0]) / 2, md[1] * 2 - (pl[1] + nk[1]) / 2, nk[0], nk[1]); c.stroke();
    line(['hp2', 'hp1'], col, lw); line(['s2', 's1'], col, lw);
    line(['hp1', 'kn1', 'an1', 'toe1'], col, lw);
    var hd = w('head'); line(['neck', 'head'], col, lw * 0.85); c.fillStyle = col; c.beginPath(); c.arc(hd[0], hd[1], headR, 0, TAU); c.fill();
    line(['s1', 'e1', 'h1'], col, lw); fist('h1', col);
  }
  function drawTrails(c, F, col, alpha) {
    for (var e in F.trails) {
      var tr = F.trails[e]; if (tr.length < 3) continue;
      var ox = F.x, oy = GROUND - F.air, a = tr[0].x, b = tr[tr.length - 1].x, sp = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (sp < 22) continue;
      var k = clamp((sp - 22) / 40, 0, 1), i;
      c.globalAlpha = (e === 'wp' ? 0.45 : 0.3) * k * alpha; c.fillStyle = col; c.beginPath();
      for (i = 0; i < tr.length; i++) c.lineTo(ox + tr[i].x[0], oy + tr[i].x[1]);
      for (i = tr.length - 1; i >= 0; i--) c.lineTo(ox + tr[i].m[0], oy + tr[i].m[1]);
      c.closePath(); c.fill();
    }
    c.globalAlpha = 1;
  }

  return {
    LEN: LEN, KEYS: KEYS, POSE: POSE, D: D, MOVES: MOVES, G: G, Fighter: Fighter, aim: aim, runPose: runPose, capsules: capsules, effPts: effPts, touch: touch,
    update: update, plantFeet: plantFeet, setLegMode: setLegMode, fx: fx, star: star, ring: ring, sparksDir: sparksDir, dust: dust, quake: quake, updateFx: updateFx,
    drawFx: drawFx, drawBody: drawBody, drawTrails: drawTrails, GHOST: GHOST, poseOff: poseOff, clamp: clamp
  };
})();
