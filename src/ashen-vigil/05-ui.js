/* ===== 05 ui: input, canvas-drawn screens (no DOM), HUD, voice visualizer, main loop ===== */
var state = 'title', mx = -99, my = -99, keys = {}, joy = null, down = null, dragging = null, hits = [], drags = [];
var tt = 0, titleCam = 0, sel = 0, ash = [], vig = null, shopMsg = '';
function setState(s) { state = s; if (s === 'levelup' || s === 'chest') { joy = null; } }

/* ---------- immediate-mode canvas UI: every control registers a hitbox as it is drawn ---------- */
function hot(x, y, w, h) { return mx >= x && mx < x + w && my >= y && my < y + h; }
function hitbox(x, y, w, h, fn) { hits.push({ x: x, y: y, w: w, h: h, fn: fn }); return hot(x, y, w, h); }
function frame(x, y, w, h, bg, bd, hi) {
  box(x, y, w, h, bd); box(x + 1, y + 1, w - 2, h - 2, bg);
  box(x + 1, y + 1, w - 2, 1, hi); box(x + 1, y + 1, 1, h - 2, hi);
}
function glow(x, y, w, h, c) {
  g.globalAlpha = 0.28 + 0.2 * M.sin(timeNow * 9); box(x - 2, y - 2, w + 4, h + 4, c); g.globalAlpha = 0.5; box(x - 1, y - 1, w + 2, h + 2, c); g.globalAlpha = 1;
}
function button(x, y, w, h, label, fn, o) {
  o = o || {};
  var hv = hitbox(x, y, w, h, o.off ? null : fn) && !o.off;
  if (hv) glow(x, y, w, h, 13);
  var bg = o.off ? 1 : hv ? 4 : (o.bg !== undefined ? o.bg : 3), bd = o.off ? 0 : hv ? 13 : (o.bd !== undefined ? o.bd : 0);
  frame(x, y, w, h, bg, bd, o.off ? 2 : hv ? 5 : 4);
  var sc = o.sc || 1; txt(label, x + w / 2, y + ((h - 5 * sc) / 2 | 0), sc, o.off ? 4 : hv ? 14 : (o.fg !== undefined ? o.fg : 7), { a: 'c', sh: 0 });
  return hv;
}
function slider(x, y, w, label, val, set) {
  txt(label, x, y, 1, 6, { sh: 0 });
  var bx = x + 34, bw = w - 34 - 14;
  var hv = hot(bx - 3, y - 4, bw + 6, 13);
  drags.push({ x: bx - 3, y: y - 4, w: bw + 6, h: 13, set: function (px) { set(clamp((px - bx) / bw, 0, 1)); } });
  box(bx, y + 1, bw, 3, 0); box(bx, y + 1, bw, 1, 2);
  box(bx, y + 1, M.round(bw * val), 3, hv || dragging ? 13 : 12);
  var kx = bx + M.round(bw * val) - 2; box(kx - 1, y - 2, 6, 9, 0); box(kx, y - 1, 4, 7, hv ? 14 : 7);
  txt(M.round(val * 100), x + w, y, 1, 5, { a: 'r' });
}
function soundPanel(x, y, w) {
  slider(x, y, w, 'MASTER', save.vol.m, function (v) { save.vol.m = v; applyVol(); });
  slider(x, y + 13, w, 'MUSIC', save.vol.mu, function (v) { save.vol.mu = v; applyVol(); });
  slider(x, y + 26, w, 'SFX', save.vol.s, function (v) { save.vol.s = v; applyVol(); sfx('click'); });
}
function dimmer(a) { g.globalAlpha = a; box(0, 0, W, H, 0); g.globalAlpha = 1; }
function sprBig(name, f, cxp, cyp, s, face, flashing) {
  var sp = SPR[name], fr = sp.fr[f % sp.fr.length];
  g.drawImage((flashing ? fr.t : fr.n)[face || 0], M.round(cxp - fr.w * s / 2), M.round(cyp - fr.h * s / 2), fr.w * s, fr.h * s);
}
function dither(x, y, w, h, c, a) { g.globalAlpha = a; box(x, y, w, h, c); g.globalAlpha = 1; }

/* ---------- title screen ---------- */
function drawTitleBg(dt) {
  titleCam += dt * 14;
  drawGround(M.floor(titleCam), 40); dimmer(0.62);
  for (var i = 0; i < ash.length; i++) { var a = ash[i]; a.y += a.v * dt; a.x += M.sin(tt + a.s) * 6 * dt; if (a.y > H) { a.y = -2; a.x = rnd() * W; } g.fillStyle = PAL[a.c]; g.fillRect(a.x | 0, a.y | 0, a.z, a.z); }
  for (var s = 0; s < 3; s++) { g.globalAlpha = 0.06; box(0, s * 8, W, 8, 0); } g.globalAlpha = 1;
}
function drawTitle(dt) {
  drawTitleBg(dt);
  var tiny = H < 330, y = 8;
  var sc = M.max(2, M.min(5, M.floor((W - 20) / 44)));
  txt('ASHEN VIGIL', W / 2, y, sc, 13, { a: 'c', sh: 8 });
  y += sc * 5 + 6;
  txt('NIGHT OF A THOUSAND', W / 2, y, 2, 6, { a: 'c', sh: 0 });
  y += 16;
  // hero cards
  var cw = M.min(88, M.floor((W - 24) / 3) - 4), ch = tiny ? 62 : 76, gap = 4, x0 = M.floor((W - (cw * 3 + gap * 2)) / 2);
  for (var i = 0; i < 3; i++) {
    var x = x0 + i * (cw + gap), hv = hitbox(x, y, cw, ch, (function (k) { return function () { sel = k; sfx('click'); }; })(i));
    var on = sel === i;
    if (on || hv) glow(x, y, cw, ch, on ? 13 : 5);
    frame(x, y, cw, ch, on ? 3 : 2, on ? 13 : 0, on ? 5 : 3);
    sprBig(HEROES[i].spr, on || hv ? ((timeNow * 6) | 0) % 4 : 0, x + cw / 2, y + ch / 2 - 6, tiny ? 2 : 3, 0);
    txt(HEROES[i].name, x + cw / 2, y + ch - 9, 1, on ? 14 : 6, { a: 'c', sh: 0 });
  }
  y += ch + 6;
  var hero = HEROES[sel], wd = WDEF[hero.weapon];
  icon(wd.icon, W / 2 - textW(wd.name, 1) / 2 - 11, y - 1, 1);
  txt(wd.name, W / 2 + 5, y, 1, 14, { a: 'c', sh: 0 });
  txt(hero.note, W / 2, y + 9, 1, 12, { a: 'c', sh: 0 });
  y += 21;
  var bw = M.min(110, (W - 30) / 2), bx = M.floor((W - (bw * 2 + 8)) / 2);
  button(bx, y, bw, 22, 'START', startRun, { sc: 2, bg: 9, bd: 0 });
  button(bx + bw + 8, y, bw, 22, 'SHRINE', function () { setState('shop'); shopMsg = ''; sfx('click'); }, { sc: 1 });
  y += 28;
  txt('BEST ' + fmtTime(save.best) + '   KILLS ' + fmtNum(save.kills) + '   GOLD ' + fmtNum(save.gold), W / 2, y, 1, 5, { a: 'c', sh: 0 });
  y += 11;
  var sw = M.min(150, W - 40);
  soundPanel(M.floor((W - sw) / 2), M.min(y + 4, H - 40), sw);
  txt('WASD / ARROWS / TOUCH TO MOVE.  ATTACKS ARE AUTOMATIC.', W / 2, H - 9, 1, 4, { a: 'c' });
}

/* ---------- Ember Shrine (permanent upgrades) ---------- */
function shrineCost(u) { return u.cost * (1 + save.upg[u.id] * (u.id === 'revival' ? 1.5 : 1)) | 0; }
function drawShop(dt) {
  drawTitleBg(dt);
  txt('EMBER SHRINE', W / 2, 8, 3, 13, { a: 'c', sh: 8 });
  icon('coin', W / 2 - 28, 28, 1); txt(fmtNum(save.gold) + ' GOLD', W / 2 - 17, 29, 1, 13, { sh: 0 });
  var two = W >= 420, cols = two ? 2 : 1, cw = two ? M.floor((W - 24) / 2) : M.min(W - 16, 300), rh = H < 330 ? 32 : 36, y0 = 42;
  var x0 = M.floor((W - (cw * cols + (two ? 8 : 0))) / 2);
  SHRINE.forEach(function (u, i) {
    var col = two ? i % 2 : 0, row = two ? (i / 2 | 0) : i, x = x0 + col * (cw + 8), y = y0 + row * (rh + 4);
    var lv = save.upg[u.id], maxed = lv >= u.max, cost = shrineCost(u), can = !maxed && save.gold >= cost;
    frame(x, y, cw, rh, 2, 0, 3);
    icon(u.icon, x + 5, y + 5, 2);
    txt(u.name, x + 26, y + 5, 1, 7, { sh: 0 }); txt(u.desc, x + 26, y + 13, 1, 5);
    for (var p = 0; p < u.max; p++) box(x + 26 + p * 6, y + rh - 8, 4, 3, p < lv ? 13 : 0);
    var bw = 48, bx = x + cw - bw - 4;
    button(bx, y + (rh - 18) / 2, bw, 18, maxed ? 'MAX' : cost + 'G', function () {
      if (!maxed && save.gold >= cost) { save.gold -= cost; save.upg[u.id]++; writeSave(); sfx('coin'); shopMsg = u.name + ' UP!'; } else { sfx('hurt'); shopMsg = 'NOT ENOUGH GOLD'; }
    }, { off: maxed, bg: can ? 9 : 3, fg: can ? 14 : 5 });
  });
  var ey = y0 + (two ? M.ceil(SHRINE.length / 2) : SHRINE.length) * (rh + 4) + 2;
  if (shopMsg) txt(shopMsg, W / 2, ey, 1, 12, { a: 'c', sh: 0 });
  button(M.floor(W / 2 - 40), M.min(H - 26, ey + 10), 80, 18, 'BACK', function () { setState('title'); sfx('click'); }, { sc: 1 });
}

/* ---------- gameplay rendering ---------- */
function pline(x1, y1, x2, y2, c, th) {
  var dx = x2 - x1, dy = y2 - y1, n = M.max(1, M.ceil(M.sqrt(dx * dx + dy * dy) / 1.5)); g.fillStyle = c;
  for (var i = 0; i <= n; i++) g.fillRect(M.round(x1 + dx * i / n), M.round(y1 + dy * i / n), th || 1, th || 1);
}
function jag(x1, y1, x2, y2, seed, c, c2) {
  var n = 7, px = x1, py = y1, dx = x2 - x1, dy = y2 - y1, l = M.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
  for (var i = 1; i <= n; i++) {
    var u = i / n, o = i === n ? 0 : (hash2(seed, i) % 9 - 4);
    var tx = x1 + dx * u + nx * o, ty = y1 + dy * u + ny * o;
    pline(px, py, tx, ty, c2, 3); pline(px, py, tx, ty, c, 1); px = tx; py = ty;
  }
}
function renderWorld(camX, camY) {
  g.fillStyle = PAL[0]; g.fillRect(0, 0, W, H);
  drawGround(camX, camY); drawDecor(camX, camY);
  var i, it;
  // burning pools + rune circles under everything
  eachOn(FX, function (f) {
    if (f.k !== 'pool') return;
    var x = f.x - camX, y = f.y - camY, ry = f.r * 0.62, ph = (timeNow * 7) | 0, a = f.t > f.dur - 0.6 ? (f.dur - f.t) / 0.6 : 1;
    g.globalAlpha = 0.85 * a;
    for (var yy = -ry; yy <= ry; yy += 2) for (var xx = -f.r; xx <= f.r; xx += 2) {
      if ((xx * xx) / (f.r * f.r) + (yy * yy) / (ry * ry) > 1) continue;
      var hh = hash2((xx + 99) | 0, (yy + 77 + ph) | 0) & 7;
      g.fillStyle = PAL[hh < 3 ? 10 : hh < 6 ? 11 : 12]; g.fillRect((x + xx) | 0, (y + yy) | 0, 2, 2);
    }
    g.globalAlpha = 1;
  });
  R.weapons.forEach(function (w) {
    if (w.id !== 'font') return;
    var x = P.x - camX, y = P.y - camY, r = w.rad || 30, ry = r * 0.7;
    g.globalAlpha = 0.12 + (w.pulse > 0 ? 0.18 : 0); box(x - r, y - ry, r * 2, ry * 2, 0); g.globalAlpha = 1;
    g.fillStyle = PAL[w.evo ? 13 : 14]; var n = M.ceil(r * 1.6);
    for (var k = 0; k < n; k++) { var a = k / n * TAU + timeNow * 0.8; if (k & 1) g.fillRect((x + M.cos(a) * r) | 0, (y + M.sin(a) * ry) | 0, 1, 1); }
    for (var k2 = 0; k2 < 12; k2++) { var a2 = k2 / 12 * TAU - timeNow * 0.5; g.fillStyle = PAL[13]; g.fillRect((x + M.cos(a2) * r * 0.6) | 0, (y + M.sin(a2) * ry * 0.6) | 0, 1, 1); }
    if (w.pulse > 0) w.pulse -= 0.016;
  });
  // gems, pickups, lanterns
  eachOn(GM, function (gm) { var x = gm.x - camX, y = gm.y - camY; if (x < -8 || y < -8 || x > W + 8 || y > H + 8) return; g.drawImage(GEM[gm.k], (x - 2) | 0, (y - 2 + M.sin(timeNow * 4 + gm.a)) | 0); });
  eachOn(PK, function (p) {
    var x = p.x - camX, y = p.y - camY + M.sin(timeNow * 3 + p.a) * 1.5; if (x < -12 || y < -12 || x > W + 12 || y > H + 12) return;
    if (p.life < 5 && ((timeNow * 8) | 0) & 1) return;
    if (p.k === 'chest') { g.globalAlpha = 0.35 + 0.2 * M.sin(timeNow * 6); box(x - 8, y - 8, 16, 16, 13); g.globalAlpha = 1; icon('chest', x - 8, y - 8, 2); }
    else icon(p.k, x - 4, y - 4, 1);
  });
  eachOn(LN, function (l) { var x = l.x - camX, y = l.y - camY; g.globalAlpha = 0.18 + 0.1 * M.sin(timeNow * 9 + l.a); box(x - 10, y - 10, 20, 20, 12); g.globalAlpha = 1; icon('lantern', x - 4, y - 5, 1); });
  // shadows
  g.fillStyle = 'rgba(0,0,0,0.32)'; it = E.items;
  for (i = 0; i < NE; i++) { var e = it[i]; if (!e.on) continue; var sx = e.x - camX, sy = e.y - camY; if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) continue; g.fillRect((sx - e.sp.w / 3) | 0, (sy + e.sp.h / 2 - 1) | 0, (e.sp.w * 2 / 3) | 0, 2); }
  g.fillRect((P.x - camX - 5) | 0, (P.y - camY + 6) | 0, 10, 2);
  // enemies
  for (i = 0; i < NE; i++) {
    var en = it[i]; if (!en.on) continue;
    var ex = en.x - camX, ey = en.y - camY; if (ex < -24 || ey < -24 || ex > W + 24 || ey > H + 24) continue;
    drawSpr(en.sp, (en.anim | 0) & 3, ex, ey, en.face, en.fl, en.el || en.boss);
    if (en.t === REAPER && en.st === 1) { g.globalAlpha = 0.5 + 0.5 * M.sin(timeNow * 30); pline(ex, ey, ex + en.vx * 140, ey + en.vy * 140, PAL[10], 2); g.globalAlpha = 1; }
    if (en.t === GOLEM && en.st === 1) { g.globalAlpha = 0.5; box(ex - 14, ey - 14, 28, 28, 10); g.globalAlpha = 1; }
    if (en.t === TOAD && en.hp < en.max * 0.5) { g.globalAlpha = 0.5 * (0.5 + 0.5 * M.sin(timeNow * 20)); box(ex - 6, ey - 5, 12, 10, 11); g.globalAlpha = 1; }
  }
  // player
  var px = P.x - camX, py = P.y - camY;
  if (!(P.inv > 0 && ((timeNow * 14) | 0) & 1) || R.over) {
    drawSpr(SPR[HEROES[R.hero].spr], P.moving ? ((P.anim | 0) & 3) : 0, px, py, P.face, P.hurt > 0 ? 1 : 0, 0);
  }
  box(px - 8, py + 9, 16, 3, 0); box(px - 7, py + 10, 14, 1, 8);
  box(px - 7, py + 10, M.max(0, M.round(14 * P.hp / P.max)), 1, P.hp < P.max * 0.3 ? 10 : 18);
  // orbiting runestones
  R.weapons.forEach(function (w) {
    if (w.id !== 'stones' || !w.pos) return;
    for (var k = 0; k < w.n; k++) { var s = w.pos[k]; if (!s) continue; var x = s.x - camX, y = s.y - camY; g.globalAlpha = 0.4; box(x - 4, y - 4, 8, 8, w.evo ? 13 : 29); g.globalAlpha = 1; box(x - 2, y - 1, 5, 3, 7); box(x - 1, y - 2, 3, 5, 7); box(x, y - 1, 1, 3, w.evo ? 13 : 28); }
  });
  // projectiles
  eachOn(PB, function (b) {
    var x = b.x - camX, y = b.y - camY;
    if (b.k === 0) { box(x - 2, y - 2, 4, 4, 28); box(x - 1, y - 1, 2, 2, 7); }
    else { var l = M.sqrt(b.vx * b.vx + b.vy * b.vy) || 1, ux = b.vx / l, uy = b.vy / l; pline(x - ux * 4, y - uy * 4, x + ux * 3, y + uy * 3, PAL[26], 1); box(x + ux * 3 - 1, y + uy * 3 - 1, 2, 2, 7); }
  });
  eachOn(EB, function (b) {
    var x = b.x - camX, y = b.y - camY;
    if (b.k === 0) { var l = M.sqrt(b.vx * b.vx + b.vy * b.vy) || 1; pline(x - b.vx / l * 3, y - b.vy / l * 3, x + b.vx / l * 2, y + b.vy / l * 2, PAL[25], 1); box(x + b.vx / l * 2, y + b.vy / l * 2, 1, 1, 7); }
    else if (b.k === 1) { box(x - 2, y - 2, 4, 4, 26); box(x - 1, y - 1, 2, 2, 7); }
    else { g.globalAlpha = 0.5; box(x - 4, y - 4, 8, 8, 27); g.globalAlpha = 1; box(x - 2, y - 2, 4, 4, 28); box(x - 1, y - 1, 2, 2, 10); }
  });
  // effects
  eachOn(FX, function (f) {
    var p = f.t / f.dur, x = f.x - camX, y = f.y - camY;
    if (f.k === 'slash') {
      var sw = M.min(1, p * 2.4), ax = P.x - camX, ay = P.y - camY; g.globalAlpha = 1 - p * 0.9;
      var n = 26, a0 = f.full ? f.a : f.a - f.arc, span = f.full ? TAU : f.arc * 2;
      for (var k = 0; k <= n * sw; k++) {
        var u = k / n, a = a0 + span * u, r1 = f.r * (0.92 + 0.08 * u), c = u > sw - 0.25 ? 7 : f.c;
        g.fillStyle = PAL[c]; g.fillRect((ax + M.cos(a) * r1) | 0, (ay + M.sin(a) * r1) | 0, 3, 3);
        g.fillStyle = PAL[f.full ? 10 : 12]; g.fillRect((ax + M.cos(a) * (r1 - 4)) | 0, (ay + M.sin(a) * (r1 - 4)) | 0, 2, 2);
      }
      g.globalAlpha = 1;
    } else if (f.k === 'zap') {
      if (((f.t * 40) | 0) & 1) jag(x, y, f.x2 - camX, f.y2 - camY, f.seed + ((f.t * 30) | 0), PAL[7], PAL[f.c]);
    } else if (f.k === 'bolt') {
      jag(x, y, f.x2 - camX, f.y2 - camY, f.seed + ((f.t * 40) | 0), PAL[7], PAL[22]);
      g.globalAlpha = 1 - p; box(f.x2 - camX - 7, f.y2 - camY - 7, 14, 14, 14); g.globalAlpha = 1;
    } else if (f.k === 'ring') {
      var rad = f.r * ease(p), n2 = M.ceil(rad * 1.5) + 6; g.globalAlpha = 1 - p; g.fillStyle = PAL[f.c];
      for (var q = 0; q < n2; q++) { var aa = q / n2 * TAU; g.fillRect((x + M.cos(aa) * rad) | 0, (y + M.sin(aa) * rad * 0.8) | 0, 2, 2); }
      g.globalAlpha = 1;
    } else if (f.k === 'flask') {
      var fxp = f.x + (f.x2 - f.x) * p - camX, fyp = f.y + (f.y2 - f.y) * p - camY - M.sin(p * M.PI) * 36; icon('flask', fxp - 4, fyp - 4, 1);
    }
  });
  // particles
  var lastC = -1; it = PT.items;
  for (i = 0; i < PT.n; i++) {
    var pt = it[i]; if (!pt.on) continue;
    if (pt.c !== lastC) { g.fillStyle = PAL[pt.c]; lastC = pt.c; }
    g.fillRect((pt.x - camX) | 0, (pt.y - camY) | 0, pt.s, pt.s);
  }
  // floating damage numbers
  eachOn(FT, function (f) { var x = (f.x - camX) | 0, y = (f.y - camY) | 0; txt(f.s, x, y, 1, f.c, { a: 'c', sh: 0 }); });
}

/* ---------- HUD ---------- */
function slotRow(x, y, list, evoFn) {
  list.forEach(function (it, i) {
    var sx = x + i * 14; box(sx, y, 13, 13, it.evo ? 13 : 0); box(sx + 1, y + 1, 11, 11, 2); icon(it.icon, sx + 2, y + 2, 1);
    for (var k = 0; k < it.lv && k < 8; k++) { g.fillStyle = PAL[it.evo ? 13 : 12]; g.fillRect(sx + 1 + k * 1.5 | 0, y + 14, 1, 1); }
  });
}
function drawVisualizer(cx0, y) {
  var t = pnow(), live = t < voiceUntil, fade = live ? 1 : clamp(1 - (t - voiceUntil) / 0.7, 0, 1);
  if (fade <= 0 || !sub.text) return;
  var n = 24, bw = 3, w = n * bw, x0 = (cx0 - w / 2) | 0, vals = [], i;
  if (live && AC && voiceLive && analyser) { analyser.getByteFrequencyData(anaData); for (i = 0; i < n; i++) vals.push(anaData[1 + ((i * 0.9) | 0)] / 255); }
  else for (i = 0; i < n; i++) vals.push(live ? 0.25 + 0.6 * M.abs(M.sin(t * 9 + i * 0.7)) * M.abs(M.sin(t * 3.1 + i * 0.3)) : 0);
  g.globalAlpha = fade;
  box(x0 - 4, y - 1, w + 8, 15, 0); box(x0 - 3, y, w + 6, 13, 1); box(x0 - 4, y - 1, 3, 1, 13); box(x0 + w + 1, y - 1, 3, 1, 13);
  for (i = 0; i < n; i++) {
    var v = clamp(vals[i] * 1.25, 0.05, 1), h = M.max(1, M.round(v * 5)), mid = y + 6;
    box(x0 + i * bw, mid - h, 2, h * 2 + 1, v > 0.6 ? 13 : v > 0.3 ? 12 : 11);
    box(x0 + i * bw, mid - h, 2, 1, 14); if (v > 0.5) { g.globalAlpha = fade * 0.4; box(x0 + i * bw - 1, mid - h - 1, 4, h * 2 + 3, 12); g.globalAlpha = fade; }
  }
  txt(sub.text, cx0, y + 17, 1, 14, { a: 'c', sh: 0 });
  g.globalAlpha = 1;
}
function drawHUD() {
  // XP bar across the top
  box(0, 0, W, 6, 0); box(0, 1, W, 4, 2); box(0, 1, M.round(W * R.xp / R.need), 4, 21); box(0, 1, M.round(W * R.xp / R.need), 1, 22);
  txt('LV ' + R.level, 3, 8, 1, 7, { sh: 0 });
  var tm = fmtTime(R.time);
  txt(tm, W / 2, 8, 2, R.time >= 900 ? (((timeNow * 4) | 0) & 1 ? 10 : 7) : 7, { a: 'c', sh: 0 });
  if (state === 'play') drawVisualizer(W / 2, 22);
  // kills & gold, top right
  icon('bone', W - 5 - textW('' + fmtNum(R.kills), 1) - 10, 8, 1); txt(fmtNum(R.kills), W - 4, 9, 1, 7, { a: 'r', sh: 0 });
  icon('coin', W - 5 - textW('' + fmtNum(R.gold), 1) - 10, 18, 1); txt(fmtNum(R.gold), W - 4, 19, 1, 13, { a: 'r', sh: 0 });
  // pause button (canvas)
  var pbx = W - 15, pby = 30, hv = hitbox(pbx, pby, 12, 12, function () { pauseGame(); });
  if (hv) glow(pbx, pby, 12, 12, 13); frame(pbx, pby, 12, 12, 2, 0, 3); box(pbx + 3, pby + 3, 2, 6, 7); box(pbx + 7, pby + 3, 2, 6, 7);
  // weapon + passive slots, top left
  var ws = R.weapons.map(function (w) { return { icon: WDEF[w.id].icon, lv: w.lv, evo: w.evo }; });
  var ps = Object.keys(R.pass).map(function (k) { return { icon: PDEF[k].icon, lv: R.pass[k], evo: 0 }; });
  slotRow(3, 17, ws); slotRow(3, 35, ps);
  // boss bar
  var bs = R.bossAlive; if (bs && bs.on) {
    var bw = M.min(180, W - 40), bx = (W - bw) / 2, by = H - 16;
    box(bx - 1, by - 1, bw + 2, 7, 0); box(bx, by, bw, 5, 8); box(bx, by, M.round(bw * bs.hp / bs.max), 5, 10); box(bx, by, M.round(bw * bs.hp / bs.max), 1, 11);
    txt(ET[bs.t].n === 'golem' ? 'BONE GOLEM' : 'PALE REAPER', W / 2, by - 8, 1, 7, { a: 'c', sh: 0 });
  }
  // event banner
  if (bannerT.t > 0) {
    var a = M.min(1, bannerT.t * 2), by2 = (H * 0.3) | 0, sc = W < 360 ? 1 : 2;
    g.globalAlpha = a; txt(bannerT.text, W / 2, by2, sc, bannerT.col, { a: 'c', sh: 0 }); g.globalAlpha = 1;
  }
  // low-HP red vignette pulse
  var lo = 1 - P.hp / (P.max * 0.35);
  if (lo > 0) { g.globalAlpha = clamp(lo, 0, 1) * (0.45 + 0.35 * M.sin(timeNow * 6)); g.drawImage(vig, 0, 0, W, H); g.globalAlpha = 1; }
  if (flashA > 0) { g.globalAlpha = clamp(flashA, 0, 1); box(0, 0, W, H, flashC); g.globalAlpha = 1; }
  // virtual joystick
  if (joy) {
    g.globalAlpha = 0.5; var n = 28; g.fillStyle = PAL[6];
    for (var k = 0; k < n; k++) g.fillRect((joy.ox + M.cos(k / n * TAU) * 22) | 0, (joy.oy + M.sin(k / n * TAU) * 22) | 0, 1, 1);
    g.globalAlpha = 0.85; box(joy.x - 4, joy.y - 4, 8, 8, 12); box(joy.x - 3, joy.y - 3, 6, 6, 13); g.globalAlpha = 1;
  }
}

/* ---------- overlays ---------- */
function drawLevelUp() {
  dimmer(0.72);
  var n = choices.length, port = W < H * 1.1 || W < 380, i, top = 78;
  txt('LEVEL UP!', W / 2, 52, W < 360 ? 2 : 3, 13, { a: 'c', sh: 8 });
  var cw = port ? M.min(W - 20, 270) : M.min(112, M.floor((W - 16) / n) - 6), chh = port ? M.min(64, M.floor((H - top - 40) / n) - 4) : M.min(112, H - top - 36);
  var tw = port ? cw : n * cw + (n - 1) * 6, x0 = M.floor((W - tw) / 2);
  for (i = 0; i < n; i++) {
    var c = choices[i], x = port ? x0 : x0 + i * (cw + 6), y = port ? top + i * (chh + 4) : top + 4;
    var def = c.k === 'w' ? WDEF[c.id] : c.k === 'p' ? PDEF[c.id] : null;
    var hv = hitbox(x, y, cw, chh, (function (cc) { return function () { applyChoice(cc); }; })(c));
    if (hv) glow(x, y, cw, chh, 13);
    frame(x, y, cw, chh, hv ? 4 : 2, hv ? 13 : 0, hv ? 6 : 4);
    var nm = def ? def.name : c.k === 'gold' ? 'GOLD BAG' : 'ROAST CHICKEN', ic = def ? def.icon : c.k === 'gold' ? 'coin' : 'chicken';
    var desc = def ? (c.isNew ? def.desc : (c.k === 'w' ? WPERK[c.id](c.lv) : def.desc)) : c.k === 'gold' ? '+50 gold.' : 'Heal 40% HP.';
    txt(i + 1, x + 3, y + 3, 1, 5);
    if (port) {
      box(x + 8, y + chh / 2 - 12, 24, 24, 0); box(x + 9, y + chh / 2 - 11, 22, 22, 1); icon(ic, x + 12, y + chh / 2 - 8, 2);
      txt(nm, x + 38, y + 5, 1, c.isNew ? 12 : 14, { sh: 0 });
      if (c.lv) { txt(c.isNew ? 'NEW!' : 'LV ' + c.lv, x + cw - 4, y + 5, 1, c.isNew ? 12 : 13, { a: 'r' }); }
      wrap(desc, M.floor((cw - 44) / 4)).slice(0, 3).forEach(function (ln, k) { txt(ln, x + 38, y + 16 + k * 8, 1, 6); });
    } else {
      box(x + cw / 2 - 14, y + 12, 28, 28, 0); box(x + cw / 2 - 13, y + 13, 26, 26, 1); icon(ic, x + cw / 2 - 12, y + 14, 3);
      wrap(nm, M.floor((cw - 6) / 4)).forEach(function (ln, k) { txt(ln, x + cw / 2, y + 46 + k * 8, 1, c.isNew ? 12 : 14, { a: 'c', sh: 0 }); });
      var lv = c.lv, py = y + 46 + wrap(nm, M.floor((cw - 6) / 4)).length * 8 + 2, mxl = c.k === 'w' ? 8 : 5;
      for (var p = 0; p < mxl; p++) box(x + cw / 2 - mxl * 3 + p * 6, py, 4, 3, p < lv ? 13 : 0);
      txt(c.isNew ? 'NEW!' : (lv ? 'LV ' + lv : ''), x + cw / 2, py + 6, 1, c.isNew ? 12 : 13, { a: 'c' });
      wrap(desc, M.floor((cw - 8) / 4)).slice(0, 5).forEach(function (ln, k) { txt(ln, x + cw / 2, py + 17 + k * 8, 1, 6, { a: 'c' }); });
    }
  }
  var by = port ? top + n * (chh + 4) + 2 : top + 4 + chh + 8, bw = M.min(100, (W - 24) / 2);
  button(M.floor(W / 2 - bw - 3), M.min(by, H - 24), bw, 18, 'REROLL (' + R.rerolls + ')', rerollChoices, { off: R.rerolls <= 0 });
  button(M.floor(W / 2 + 3), M.min(by, H - 24), bw, 18, 'SKIP', skipChoice, {});
}
function drawChest() {
  dimmer(0.78);
  var c = chestInfo, y = M.max(14, (H / 2 - 70) | 0);
  txt(c.open ? (c.evo ? 'EVOLUTION!' : 'TREASURE!') : 'TREASURE CHEST', W / 2, y, W < 360 ? 2 : 3, 13, { a: 'c', sh: 8 });
  var sh = c.open ? 0 : M.sin(timeNow * 30) * 1.2;
  g.globalAlpha = 0.18 + 0.1 * M.sin(timeNow * 5);
  box(W / 2 - 24 + sh, y + 22, 48, 60, 13); box(W / 2 - 32 + sh, y + 30, 64, 44, 13); box(W / 2 - 28 + sh, y + 26, 56, 52, 13); g.globalAlpha = 1;
  icon(c.open ? c.icon : 'chest', W / 2 - 20 + sh, y + 30, 5);
  var ty = y + 86;
  c.text.forEach(function (ln, i) { txt(ln, W / 2, ty + i * 10, 1, c.evo ? (i ? 13 : 14) : 7, { a: 'c', sh: 0 }); });
  if (!c.open) button(W / 2 - 40, ty + 4, 80, 22, 'OPEN', chestOpen, { sc: 2, bg: 9 });
  else button(W / 2 - 40, ty + c.text.length * 10 + 6, 80, 20, 'TAKE', function () { setState('play'); sfx('click'); }, { sc: 1, bg: 9 });
}
function drawPause() {
  dimmer(0.7);
  txt('PAUSED', W / 2, 50, 3, 13, { a: 'c', sh: 8 });
  var y = 76, bw = 120, bx = M.floor((W - bw) / 2);
  button(bx, y, bw, 20, 'RESUME', resumeGame, { sc: 1, bg: 9 });
  button(bx, y + 26, bw, 20, 'RESTART', function () { startRun(); }, {});
  button(bx, y + 52, bw, 20, 'QUIT TO TITLE', function () { toTitle(); }, {});
  var sw = M.min(150, W - 40); soundPanel(M.floor((W - sw) / 2), y + 90, sw);
  txt('TIME ' + fmtTime(R.time) + '   KILLS ' + R.kills + '   LV ' + R.level, W / 2, y + 128, 1, 5, { a: 'c' });
}
function drawOver() {
  var t = R.overT || 0, win = R.win;
  dimmer(M.min(0.8, t * 0.8));
  if (t < 0.5) return;
  var y = 52;
  txt(win ? 'DAWN BREAKS' : 'YOU HAVE FALLEN', W / 2, y, W < 360 ? 2 : 4, win ? 13 : 10, { a: 'c', sh: 0 });
  txt(win ? 'THE VIGIL IS WON' : 'THE VIGIL ENDS', W / 2, y + (W < 360 ? 14 : 26), 1, 6, { a: 'c' });
  var ly = y + 44, rows = [['TIME SURVIVED', fmtTime(R.time)], ['KILLS', '' + R.kills], ['LEVEL', '' + R.level], ['GOLD EARNED', '' + R.gold + (win ? ' (+200 BONUS)' : '')], ['BEST TIME', fmtTime(save.best)]];
  var w = M.min(190, W - 24), x = M.floor((W - w) / 2);
  frame(x - 4, ly - 4, w + 8, rows.length * 11 + 6, 1, 0, 3);
  rows.forEach(function (r, i) { txt(r[0], x, ly + i * 11, 1, 5); txt(r[1], x + w, ly + i * 11, 1, 7, { a: 'r' }); });
  var by = ly + rows.length * 11 + 10, bw = M.min(96, (W - 24) / 2);
  button(M.floor(W / 2 - bw - 3), by, bw, 20, 'RETRY', function () { startRun(); }, { bg: 9 });
  button(M.floor(W / 2 + 3), by, bw, 20, 'SHRINE', function () { setState('shop'); shopMsg = ''; }, {});
  button(M.floor(W / 2 - 40), by + 26, 80, 18, 'TITLE', function () { toTitle(); }, {});
}

/* ---------- state transitions ---------- */
function startRun() { audioInit(); music.on = true; newRun(sel); setState('play'); sfx('click'); }
function toTitle() { setState('title'); sfx('click'); }
function pauseGame() { if (state === 'play') { setState('pause'); sfx('click'); } }
function resumeGame() { if (state === 'pause') { setState('play'); sfx('click'); } }

/* ---------- input ---------- */
function toBuf(e) { return { x: (e.clientX * DPR - offX) / SD, y: (e.clientY * DPR - offY) / SD }; }
function onDown(e) {
  audioInit(); var p = toBuf(e); mx = p.x; my = p.y;
  for (var i = drags.length - 1; i >= 0; i--) { var d = drags[i]; if (p.x >= d.x && p.x < d.x + d.w && p.y >= d.y && p.y < d.y + d.h) { dragging = d; d.set(p.x); return; } }
  for (i = hits.length - 1; i >= 0; i--) { var h = hits[i]; if (p.x >= h.x && p.x < h.x + h.w && p.y >= h.y && p.y < h.y + h.h) { down = h; return; } }
  down = null;
  if (state === 'play' && p.x < W * 0.5 && !joy) { joy = { id: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y, vx: 0, vy: 0 }; }
}
function onMove(e) {
  var p = toBuf(e); mx = p.x; my = p.y;
  if (dragging) dragging.set(p.x);
  if (joy && e.pointerId === joy.id) {
    var dx = p.x - joy.ox, dy = p.y - joy.oy, l = M.sqrt(dx * dx + dy * dy), mxr = 22;
    if (l > mxr) { joy.ox += dx / l * (l - mxr); joy.oy += dy / l * (l - mxr); dx = p.x - joy.ox; dy = p.y - joy.oy; l = mxr; }
    joy.x = joy.ox + dx; joy.y = joy.oy + dy; joy.vx = dx / mxr; joy.vy = dy / mxr;
  }
}
function onUp(e) {
  var p = toBuf(e);
  if (dragging) { dragging = null; return; }
  if (joy && e.pointerId === joy.id) { joy = null; }
  if (down && p.x >= down.x && p.x < down.x + down.w && p.y >= down.y && p.y < down.y + down.h && down.fn) { var f = down.fn; down = null; f(); }
  down = null;
  if (e.pointerType === 'touch') { mx = -99; my = -99; }
}
cv.addEventListener('pointerdown', function (e) { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ok */ } onDown(e); });
cv.addEventListener('pointermove', onMove);
cv.addEventListener('pointerup', onUp);
cv.addEventListener('pointercancel', function (e) { joy = null; down = null; dragging = null; });
cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
window.addEventListener('keydown', function (e) {
  audioInit();
  var k = e.key, kl = k.length === 1 ? k.toLowerCase() : k;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(k) >= 0) e.preventDefault();
  keys[kl] = true;
  if (e.repeat) return;
  if (state === 'play') { if (kl === 'p' || k === 'Escape') pauseGame(); }
  else if (state === 'pause') { if (kl === 'p' || k === 'Escape') resumeGame(); }
  else if (state === 'levelup') {
    if (kl >= '1' && kl <= '4' && choices[+kl - 1]) applyChoice(choices[+kl - 1]); else if (kl === 'r') rerollChoices(); else if (kl === 's') skipChoice();
  } else if (state === 'chest') { if (k === 'Enter' || k === ' ' || kl === 'e') { if (!chestInfo.open) chestOpen(); else { setState('play'); sfx('click'); } } }
  else if (state === 'title') {
    if (k === 'Enter' || k === ' ') startRun(); else if (kl >= '1' && kl <= '3') { sel = +kl - 1; sfx('click'); }
    else if (k === 'ArrowLeft' || kl === 'a') { sel = (sel + 2) % 3; sfx('click'); } else if (k === 'ArrowRight' || kl === 'd') { sel = (sel + 1) % 3; sfx('click'); }
  } else if (state === 'shop') { if (k === 'Escape') toTitle(); }
  else if (state === 'over') { if (k === 'Enter') startRun(); else if (k === 'Escape') toTitle(); }
});
window.addEventListener('keyup', function (e) { var k = e.key; keys[k.length === 1 ? k.toLowerCase() : k] = false; });
window.addEventListener('blur', function () { keys = {}; joy = null; if (state === 'play') pauseGame(); });
document.addEventListener('visibilitychange', function () { if (document.hidden && state === 'play') pauseGame(); });
function inputVec() {
  var x = 0, y = 0;
  if (keys.a || keys.ArrowLeft) x -= 1; if (keys.d || keys.ArrowRight) x += 1;
  if (keys.w || keys.ArrowUp) y -= 1; if (keys.s || keys.ArrowDown) y += 1;
  if (joy && (joy.vx || joy.vy)) { x += joy.vx; y += joy.vy; }
  return [x, y];
}

/* ---------- main loop: fixed-step update, interpolation-free render, integer upscale ---------- */
var lastT = 0, acc = 0, STEP = 1 / 60;
function makeVignette() {
  var w = M.ceil(W / 5), h = M.ceil(H / 5); vig = mkCanvas(w, h); var x = vig.getContext('2d');
  var gr = x.createRadialGradient(w / 2, h / 2, M.min(w, h) * 0.25, w / 2, h / 2, M.max(w, h) * 0.62);
  gr.addColorStop(0, 'rgba(194,58,58,0)'); gr.addColorStop(1, 'rgba(194,58,58,1)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
}
function idleSim(dt) {
  shk = M.max(0, shk - dt * 14); flashA = M.max(0, flashA - dt * 2.2);
  if (state === 'over') { R.overT += dt; updateParticles(dt); updateEffects(dt); }
}
function loop(ts) {
  requestAnimationFrame(loop);
  var t = ts / 1000, dt = M.min(0.1, t - lastT); lastT = t; timeNow = t; tt += dt;
  hits = []; drags = [];
  if (state === 'play') {
    acc += dt; var n = 0, iv = inputVec();
    while (acc >= STEP && n < 5 && state === 'play') { stepGame(STEP, iv[0], iv[1]); acc -= STEP; n++; }
    if (n >= 5) acc = 0;
  } else { acc = 0; if (R) idleSim(dt); }
  music.intensity = state === 'title' || state === 'shop' ? 0.08 : R ? clamp(R.time / 840, 0, 1) : 0;
  musicTick(dt);
  if (state === 'title') drawTitle(dt);
  else if (state === 'shop') drawShop(dt);
  else {
    var ox = shk > 0.2 ? ri(-1, 1) * M.round(shk * 0.5) : 0, oy = shk > 0.2 ? ri(-1, 1) * M.round(shk * 0.5) : 0;
    renderWorld(M.round(cam.x - W / 2) + ox, M.round(cam.y - H / 2) + oy);
    drawHUD();
    if (state === 'levelup') drawLevelUp(); else if (state === 'chest') drawChest(); else if (state === 'pause') drawPause(); else if (state === 'over') drawOver();
    if (state !== 'play') drawVisualizer(W / 2, 22);
  }
  present();
}

/* ---------- boot ---------- */
(function boot() {
  loadSave(); buildSprites(); buildIcons(); buildGems(); buildGround(); initPools();
  for (var i = 0; i < 50; i++) ash.push({ x: rnd() * 600, y: rnd() * 400, v: rr(6, 22), s: rnd() * 6, z: rnd() < 0.2 ? 2 : 1, c: pick([5, 6, 4, 12]) });
  sel = save.hero || 0;
  resizeHooks.push(makeVignette); resize();
  window.addEventListener('resize', resize);
  state = 'title';
  if (/[?&]test/.test(location.search)) window.__av = {
    st: function () { return state; }, R: function () { return R; }, P: function () { return P; }, alive: function () { return aliveE; },
    set: function (s) { setState(s); }, start: function (h) { if (h !== undefined) sel = h; startRun(); }, step: function (n, ix, iy) { for (var i = 0; i < n; i++) stepGame(STEP, ix || 0, iy || 0); },
    choices: function () { return choices; }, pick: function (i) { applyChoice(choices[i]); }, chest: chestOpen, W: function () { return W; }, H: function () { return H; }, SD: function () { return SD; },
    spawn: function (t, n, el) { for (var i = 0; i < n; i++) { var p = edgePoint(10); spawnEnemy(t, p.x, p.y, el); } }, say: say, sfx: sfx, SFXN: function () { return ['slash','zap','twang','thunder','fire','orb','hit','kill','gem','coin','heal','hurt','boom','level','chime','click','pick','chest','evolve','bossroar','smite','win','lose']; }, fmt: fmtTime, drop: function (k) { dropItem(P.x, P.y, k); }, lantern: spawnLantern, boss: spawnBoss, ring: ringWraiths, swarm: batSwarm, lvl: function () { R.pending++; }, end: endRun,
    bot: function (sec, smart) {
      var out = { maxAlive: 0, levels: 0, chests: 0 }, n = sec * 60, tm = 0;
      for (var i = 0; i < n; i++) {
        if (state === 'levelup') { var best = choices[0]; if (smart) choices.forEach(function (c) { if (c.k === 'w' && (!best || best.k !== 'w' || c.lv > best.lv)) best = c; }); applyChoice(smart ? best : choices[(rnd() * choices.length) | 0]); out.levels++; continue; }
        if (state === 'chest') { chestOpen(); setState('play'); out.chests++; continue; }
        if (state !== 'play') break;
        var ix = 0, iy = 0, near = 0;
        eachOn(E, function (e) { var dx = P.x - e.x, dy = P.y - e.y, d2 = dx * dx + dy * dy; if (d2 < 5000) { var w = 1 / (d2 + 40); ix += dx * w; iy += dy * w; near++; } });
        var l = M.sqrt(ix * ix + iy * iy) || 1; ix /= l; iy /= l; tm += STEP;
        if (smart) { var bg = null, bd = 100 * 100; eachOn(GM, function (gm) { var dx = gm.x - P.x, dy = gm.y - P.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; bg = gm; } }); if (bg) { var gl = M.sqrt(bd) || 1; ix += (bg.x - P.x) / gl * (near > 6 ? 0.25 : 0.8); iy += (bg.y - P.y) / gl * (near > 6 ? 0.25 : 0.8); } }
        ix += M.cos(tm * 0.7) * 0.5; iy += M.sin(tm * 0.7) * 0.5;
        if (smart && R.bossAlive && R.bossAlive.on && R.bossAlive.t === REAPER) { var bx = R.bossAlive.x - P.x, by = R.bossAlive.y - P.y, bl = M.sqrt(bx * bx + by * by) || 1; if (bl > 60) { ix = bx / bl; iy = by / bl; } else { ix = 0; iy = 0; } }
        stepGame(STEP, ix, iy); if (aliveE > out.maxAlive) out.maxAlive = aliveE;
      }
      out.state = state; out.time = R.time | 0; out.kills = R.kills; out.level = R.level; out.hp = P.hp | 0; out.win = R.win; out.weapons = R.weapons.map(function (w) { return w.id + w.lv + (w.evo ? '*' : ''); }).join(','); out.pass = JSON.stringify(R.pass);
      return out;
    },
    voices: function () { return { buf: Object.keys(voiceBuf), bad: Object.keys(voiceBad) }; }, ac: function () { return AC && AC.state; }
  };
  requestAnimationFrame(loop);
})();
