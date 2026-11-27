/* Spear Hills — original turn-based spear duel for Bubzi.
   Pull back to aim, let go to throw. Hit the rival on the other hill before they hit you. */
(function () {
  'use strict';
  var G = 700, SPD0 = 250, SPD1 = 1050, SPEAR = 58, STEP = 1 / 120;
  var RIVALS = [
    { c: '#FF5E5B', h: 'band' }, { c: '#FF9F1C', h: 'cap' }, { c: '#2EC4B6', h: 'crown' }, { c: '#E056FD', h: 'band' },
    { c: '#26DE81', h: 'cap' }, { c: '#FD79A8', h: 'crown' }, { c: '#4B7BEC', h: 'band' }, { c: '#F7B731', h: 'cap' }
  ];
  var SZ = 1, level, D, hp1, hp2, max1, max2, hillA, hillB, hump, ph, wind, phase, phaseT, spear, stuck, aim, drag, kbAim, kbPow, cam, hurt1, hurt2, koT, lastHint, shots, hits, rival, tutT;

  function ground(x) {
    return -hillA * Math.exp(-Math.pow(x / 300, 2)) - hillB * Math.exp(-Math.pow((x - D) / 300, 2))
      - hump * Math.exp(-Math.pow((x - D / 2) / 120, 2)) - 14 * Math.sin(x * 0.011 + ph);
  }
  function feet(i) { var x = i ? D : 0; return { x: x, y: ground(x) }; }
  /* body parts of fighter i (0 = you, 1 = rival), world coords */
  function parts(i) {
    var f = feet(i), lean = (i ? hurt2 : hurt1) * (i ? 10 : -10) * SZ;
    return { head: { x: f.x + lean, y: f.y - 80 * SZ, r: 14 * SZ }, neck: { x: f.x + lean * 0.8, y: f.y - 64 * SZ }, hip: { x: f.x, y: f.y - 34 * SZ }, foot: f };
  }
  function segDist(px, py, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l)) : 0;
    var X = a.x + dx * t - px, Y = a.y + dy * t - py; return Math.sqrt(X * X + Y * Y);
  }
  function hitPart(i, x, y) {
    var P = parts(i), hx = P.head.x - x, hy = P.head.y - y;
    if (Math.sqrt(hx * hx + hy * hy) < P.head.r + 5) return 'head';
    if (segDist(x, y, P.neck, P.hip) < 11 * SZ) return 'body';
    if (segDist(x, y, P.hip, P.foot) < 10 * SZ) return 'legs';
    return null;
  }
  /* where a throw crosses the target's x (for aiming and the rival's brain) */
  function heightAt(from, vx, vy, tx) {
    var x = from.x, y = from.y, t = 0, dir = vx > 0 ? 1 : -1;
    while (t < 6) {
      vx += wind * STEP; vy += G * STEP; x += vx * STEP; y += vy * STEP; t += STEP;
      if ((x - tx) * dir >= 0) return y;
      if (y > ground(x) && t > 0.1) return 1e9;
      if (vx * dir <= 0) return 1e9;
    }
    return 1e9;
  }
  function launchPoint(i) { var P = parts(i); return { x: P.neck.x + (i ? -14 : 14) * SZ, y: P.neck.y - 18 * SZ }; }
  function solve(i, ang) {
    var from = launchPoint(i), T = parts(1 - i), ty = (T.neck.y + T.hip.y) / 2 - 6, dir = i ? -1 : 1, lo = SPD0, hi = SPD1;
    for (var k = 0; k < 26; k++) {
      var s = (lo + hi) / 2, y = heightAt(from, dir * s * Math.cos(ang), -s * Math.sin(ang), T.hip.x);
      if (y > ty) lo = s; else hi = s;
    }
    return (lo + hi) / 2;
  }
  function throwSpear(K, i, ang, speed) {
    var from = launchPoint(i), dir = i ? -1 : 1;
    spear = { x: from.x, y: from.y, vx: dir * speed * Math.cos(ang), vy: -speed * Math.sin(ang), by: i, t: 0, done: false };
    phase = i ? 'rivalFly' : 'fly'; phaseT = 0; shots++; K.sfx('whoosh'); K.haptic(10);
  }

  function newRival(K, first) {
    rival = RIVALS[(level - 1) % RIVALS.length];
    D = Math.min(1050, 520 + level * 55 + K.rand(-50, 50));
    hillA = K.rand(40, 110); hillB = K.rand(40, 130); ph = K.rand(0, 6);
    hump = level >= 4 ? K.rand(60, Math.min(260, 80 + level * 18)) : 0;
    wind = level >= 3 ? Math.round(K.rand(-1, 1) * Math.min(140, 20 + level * 12)) : 0;
    max2 = 60 + level * 15; hp2 = max2; stuck = []; hurt2 = 0;
    if (!first) { hp1 = Math.min(max1, hp1 + 35); }
    phase = 'aim'; phaseT = 0; spear = null; drag = null; layout(K);
  }
  function layout(K) {
    if (D === undefined) return;
    var minY = 0, maxY = -1e9;
    for (var x = -240; x <= D + 240; x += 20) { var g = ground(x); if (g < minY) minY = g; if (g > maxY) maxY = g; }
    var top = minY - 300, bot = maxY + 70, w = D + 300, h = bot - top;
    var availH = K.H - K.hudH - 70;
    var s = Math.min(K.W / w, availH / h);
    SZ = Math.max(1, Math.min(1.6, 0.62 / s));
    cam = { s: s, x: K.W / 2 - (D / 2) * s, y: K.H - 8 - bot * s };
  }
  function toScreen(x, y) { return { x: cam.x + x * cam.s, y: cam.y + y * cam.s }; }
  function maxPull(K) { return Math.min(K.W, K.H) * 0.3; }
  function aimFromPull(K, dx, dy) {
    var L = Math.sqrt(dx * dx + dy * dy), p = Math.min(1, L / maxPull(K));
    var a = Math.atan2(-dy, dx); a = Math.max(-0.4, Math.min(1.5, a));
    return { ang: a, pow: p, speed: SPD0 + p * (SPD1 - SPD0) };
  }
  function damage(K, i, part) {
    var base = part === 'head' ? 40 : part === 'body' ? 25 : 14, dmg = Math.round(base * K.rand(0.9, 1.15));
    var P = parts(i), sp = toScreen(P.head.x, P.head.y - 20);
    if (i) { hp2 = Math.max(0, hp2 - dmg); hurt2 = 1; hits++; K.addScore(dmg + (part === 'head' ? 15 : 0)); }
    else { hp1 = Math.max(0, hp1 - dmg); hurt1 = 1; K.shake(10); K.haptic(30); }
    K.floatText(K.clamp(sp.x, K.W * 0.28, K.W * 0.72), sp.y, (part === 'head' ? K.t('headshot') + ' ' : '') + '-' + dmg, i ? '#FF3B8B' : '#E8364F', part === 'head' ? 30 : 24);
    var hp = toScreen(spear.x, spear.y);
    K.burst(hp.x, hp.y, ['#FFFFFF', '#FFD23F', i ? rival.c : '#7B4DFF'], part === 'head' ? 18 : 12, 220, 5);
    K.sfx(part === 'head' ? 'combo' : 'star');
    if (i && part === 'head') K.addCoins(1, hp.x, hp.y);
  }

  function drawStick(ctx, K, i, holding, ang) {
    var P = parts(i), s = cam.s, col = i ? rival.c : '#7B4DFF', dark = i ? '#3B1A1A' : '#2A1A6B', dir = i ? -1 : 1;
    var ko = (i ? hp2 : hp1) <= 0, fall = ko ? Math.min(1, (i ? koT : phaseT) * 2.2) : 0;
    ctx.save(); var f = toScreen(P.foot.x, P.foot.y); ctx.translate(f.x, f.y); ctx.scale(s * SZ, s * SZ); ctx.rotate(-dir * fall * 1.45);
    var hd = { x: (P.head.x - P.foot.x) / SZ, y: (P.head.y - P.foot.y) / SZ }, nk = { x: (P.neck.x - P.foot.x) / SZ, y: (P.neck.y - P.foot.y) / SZ }, hp = { x: 0, y: -34 };
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = dark; ctx.lineWidth = 8;
    // legs
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(hp.x, hp.y); ctx.lineTo(12, 0); ctx.stroke();
    // body
    ctx.beginPath(); ctx.moveTo(hp.x, hp.y); ctx.lineTo(nk.x, nk.y); ctx.stroke();
    // back arm
    ctx.beginPath(); ctx.moveTo(nk.x, nk.y); ctx.lineTo(nk.x - dir * 16, nk.y + 22); ctx.stroke();
    // throwing arm + spear
    var a = holding ? ang : 1.1, hx = nk.x + dir * Math.cos(a + 2.2) * 20, hy = nk.y - Math.sin(a + 2.2) * 20;
    ctx.beginPath(); ctx.moveTo(nk.x, nk.y); ctx.lineTo(hx, hy); ctx.stroke();
    if (holding) {
      var ux = dir * Math.cos(a), uy = -Math.sin(a);
      ctx.strokeStyle = '#8A5A2B'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(hx - ux * SPEAR * 0.55, hy - uy * SPEAR * 0.55); ctx.lineTo(hx + ux * SPEAR * 0.45, hy + uy * SPEAR * 0.45); ctx.stroke();
      ctx.fillStyle = '#C9D3E0'; ctx.beginPath(); var tx = hx + ux * SPEAR * 0.45, ty = hy + uy * SPEAR * 0.45;
      ctx.moveTo(tx + ux * 14, ty + uy * 14); ctx.lineTo(tx - uy * 6, ty + ux * 6); ctx.lineTo(tx + uy * 6, ty - ux * 6); ctx.closePath(); ctx.fill();
    }
    // head
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = dark; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(hd.x, hd.y, 14, 0, K.TAU); ctx.fill(); ctx.stroke();
    // eyes
    ctx.fillStyle = dark; var hurt = i ? hurt2 : hurt1;
    if (ko) { ctx.lineWidth = 2.5; [-1, 1].forEach(function (e) { var ex = hd.x + dir * 4 + e * 4, ey = hd.y - 2; ctx.beginPath(); ctx.moveTo(ex - 2.5, ey - 2.5); ctx.lineTo(ex + 2.5, ey + 2.5); ctx.moveTo(ex + 2.5, ey - 2.5); ctx.lineTo(ex - 2.5, ey + 2.5); ctx.stroke(); }); }
    else { [-1, 1].forEach(function (e) { ctx.beginPath(); ctx.arc(hd.x + dir * 4 + e * 4, hd.y - 2, hurt > 0.2 ? 1.2 : 2.2, 0, K.TAU); ctx.fill(); }); }
    // hat
    ctx.fillStyle = col; var h = i ? rival.h : 'band';
    if (h === 'band') { ctx.fillRect(hd.x - 14, hd.y - 10, 28, 6); ctx.beginPath(); ctx.moveTo(hd.x - dir * 13, hd.y - 8); ctx.lineTo(hd.x - dir * 28, hd.y - 2 + Math.sin(K.time * 8 + i) * 3); ctx.lineTo(hd.x - dir * 26, hd.y - 12); ctx.fill(); }
    else if (h === 'cap') { ctx.beginPath(); ctx.arc(hd.x, hd.y - 4, 14, Math.PI, 0); ctx.fill(); ctx.fillRect(hd.x - (dir < 0 ? 22 : -8), hd.y - 6, 14, 4); }
    else { ctx.beginPath(); ctx.moveTo(hd.x - 12, hd.y - 10); ctx.lineTo(hd.x - 12, hd.y - 24); ctx.lineTo(hd.x - 6, hd.y - 16); ctx.lineTo(hd.x, hd.y - 26); ctx.lineTo(hd.x + 6, hd.y - 16); ctx.lineTo(hd.x + 12, hd.y - 24); ctx.lineTo(hd.x + 12, hd.y - 10); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    if (ko && fall > 0.6) { var st = toScreen(P.head.x + dir * -30, P.foot.y - 30); for (var k = 0; k < 3; k++) { var aa = K.time * 4 + k * 2.1; ctx.save(); ctx.translate(st.x + Math.cos(aa) * 18 * s, st.y + Math.sin(aa) * 6 * s); ctx.fillStyle = '#FFD23F'; K.star(ctx, 7 * Math.max(0.6, s)); ctx.restore(); } }
  }
  function drawSpear(ctx, x, y, vx, vy, alpha) {
    var l = Math.sqrt(vx * vx + vy * vy) || 1, ux = vx / l, uy = vy / l, s = cam.s, p = toScreen(x, y);
    ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha; ctx.translate(p.x, p.y); ctx.scale(s * SZ, s * SZ);
    ctx.strokeStyle = '#8A5A2B'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-ux * SPEAR, -uy * SPEAR); ctx.lineTo(0, 0); ctx.stroke();
    ctx.fillStyle = '#C9D3E0'; ctx.beginPath(); ctx.moveTo(ux * 12, uy * 12); ctx.lineTo(-uy * 6 - ux * 2, ux * 6 - uy * 2); ctx.lineTo(uy * 6 - ux * 2, -ux * 6 - uy * 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#FF5FA2'; ctx.beginPath(); ctx.moveTo(-ux * SPEAR, -uy * SPEAR); ctx.lineTo(-ux * (SPEAR - 12) - uy * 6, -uy * (SPEAR - 12) + ux * 6); ctx.lineTo(-ux * (SPEAR - 12) + uy * 6, -uy * (SPEAR - 12) - ux * 6); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function hpBar(ctx, K, x, y, w, v, m, col, label, right) {
    ctx.fillStyle = 'rgba(36,27,77,0.18)'; K.roundRect(ctx, x, y, w, 16, 8); ctx.fill();
    var f = Math.max(0, v / m); ctx.fillStyle = f > 0.35 ? col : (Math.floor(K.time * 5) % 2 ? '#FF5E5B' : '#FF9F1C');
    if (right) { K.roundRect(ctx, x + w * (1 - f), y, w * f, 16, 8); } else { K.roundRect(ctx, x, y, w * f, 16, 8); } if (f > 0) ctx.fill();
    ctx.font = K.font(14); ctx.fillStyle = '#241B4D'; ctx.textBaseline = 'top'; ctx.textAlign = right ? 'right' : 'left';
    ctx.fillText(label + '  ' + Math.ceil(v), right ? x + w : x, y + 20);
  }

  BubziKit.run({
    id: 'spear-hills', coinRate: 0.02,
    title: { en: 'Spear Hills', fr: 'Collines des Lances', ar: 'تلال الرماح' },
    strings: {
      en: { tagline: 'Pull back, aim and throw! Knock out the rival on the other hill.', you: 'You', rival: 'Rival', headshot: 'Head!', ko: 'Knockout!', wind: 'Wind', turn: 'Rival’s turn…', miss: 'Miss!' },
      fr: { tagline: 'Tire en arrière, vise et lance ! Mets KO le rival sur l’autre colline.', you: 'Toi', rival: 'Rival', headshot: 'Tête !', ko: 'KO !', wind: 'Vent', turn: 'Au tour du rival…', miss: 'Raté !' },
      ar: { tagline: 'اسحب للخلف، صوّب وارمِ! اهزم الخصم على التل الآخر.', you: 'أنت', rival: 'الخصم', headshot: 'الرأس!', ko: 'ضربة قاضية!', wind: 'الرياح', turn: 'دور الخصم…', miss: 'أخطأت!' }
    },
    resize: layout,
    reset: function (K) {
      if (K.test) K.dbg = function () {
        var h = null;
        if (phase === 'aim') { var a = 0.75, sp = solve(0, a), p = (sp - SPD0) / (SPD1 - SPD0), L = p * maxPull(K); h = { dx: -Math.cos(a) * L, dy: Math.sin(a) * L, pow: p }; }
        return { phase: phase, level: level, hp1: hp1, hp2: hp2, D: D, wind: wind, hint: h, shots: shots, hits: hits, spear: spear };
      };
      level = 1; max1 = 100; hp1 = max1; hurt1 = 0; shots = 0; hits = 0; kbAim = 0.75; kbPow = 0.6; tutT = 0; koT = 0;
      newRival(K, true);
    },
    revive: function (K) { hp1 = Math.round(max1 * 0.6); hurt1 = 0; phase = 'aim'; phaseT = 0; spear = null; },
    pointerDown: function (x, y, K, id) { if (phase === 'aim') drag = { id: id, x0: x, y0: y, x: x, y: y }; },
    pointerMove: function (x, y, K, id) { if (drag && drag.id === id) { drag.x = x; drag.y = y; } },
    pointerUp: function (x, y, K, id) {
      if (!drag || drag.id !== id) return; var d = drag; drag = null; if (phase !== 'aim') return;
      var dx = d.x0 - x, dy = d.y0 - y; if (Math.sqrt(dx * dx + dy * dy) < 18) return;
      var A = aimFromPull(K, dx, dy); kbAim = A.ang; kbPow = A.pow; throwSpear(K, 0, A.ang, A.speed); K.tutorialDone();
    },
    pointerCancel: function () { drag = null; },
    key: function (code, down, K) {
      if (!down || phase !== 'aim') return;
      if (code === 'ArrowUp' || code === 'KeyW') kbAim = Math.min(1.5, kbAim + 0.04);
      else if (code === 'ArrowDown' || code === 'KeyS') kbAim = Math.max(-0.4, kbAim - 0.04);
      else if (code === 'ArrowRight' || code === 'KeyD') kbPow = Math.min(1, kbPow + 0.025);
      else if (code === 'ArrowLeft' || code === 'KeyA') kbPow = Math.max(0.05, kbPow - 0.025);
      else if (code === 'Space' || code === 'Enter') { throwSpear(K, 0, kbAim, SPD0 + kbPow * (SPD1 - SPD0)); K.tutorialDone(); return; }
      else return;
      drag = null; aim = { ang: kbAim, pow: kbPow, kb: true };
    },
    update: function (dt, K) {
      phaseT += dt; tutT += dt;
      hurt1 = Math.max(0, hurt1 - dt * 2.5); hurt2 = Math.max(0, hurt2 - dt * 2.5);
      if (drag) { var dx = drag.x0 - drag.x, dy = drag.y0 - drag.y; aim = Math.sqrt(dx * dx + dy * dy) > 10 ? aimFromPull(K, dx, dy) : null; }
      else if (aim && !aim.kb) aim = null;
      if (spear && !spear.done) {
        var n = Math.ceil(dt / STEP);
        for (var k = 0; k < n && !spear.done; k++) {
          spear.vx += wind * STEP; spear.vy += G * STEP; spear.x += spear.vx * STEP; spear.y += spear.vy * STEP; spear.t += STEP;
          var target = 1 - spear.by, part = hitPart(target, spear.x, spear.y);
          if (part) { spear.done = true; damage(K, target, part); spear.hit = true; phaseT = 0; break; }
          if (spear.y > ground(spear.x) || spear.x < -900 || spear.x > D + 900 || spear.t > 7) {
            spear.done = true; phaseT = 0;
            if (spear.y > ground(spear.x) - 2 && spear.x > -400 && spear.x < D + 400) { spear.y = ground(spear.x) + 4; stuck.push({ x: spear.x, y: spear.y, vx: spear.vx, vy: spear.vy, a: 1 }); if (stuck.length > 8) stuck.shift(); }
            var mp = toScreen(spear.x, Math.min(spear.y, ground(spear.x)) - 30); if (!spear.by) K.floatText(mp.x, Math.max(K.hudH + 60, mp.y), K.t('miss'), '#5E5689', 22);
            K.sfx('tick');
          }
        }
      }
      if (phase === 'fly' && spear && spear.done && phaseT > 0.5) {
        if (hp2 <= 0) {
          phase = 'ko'; phaseT = 0; koT = 0; K.addScore(40 * level); K.addCoins(1 + Math.floor(level / 2), K.W * 0.7, K.H * 0.5);
          K.floatText(K.W / 2, K.H * 0.38, K.t('ko'), '#FFD23F', 40); K.confetti(60); K.sfx('reward');
        } else { phase = 'rivalWait'; phaseT = 0; spear = null; }
      }
      if (phase === 'rivalWait' && phaseT > 0.85) {
        var a = K.rand(0.55, 0.95), sp = solve(1, a), err = Math.max(0.018, 0.085 - level * 0.006);
        // the rival gets a little better each time it misses you, so standing still is not safe forever
        throwSpear(K, 1, a, sp * (1 + K.rand(-1, 1) * err * 1.6 + (Math.random() < 0.5 ? 1 : -1) * err * 0.6));
      }
      if (phase === 'rivalFly' && spear && spear.done && phaseT > 0.5) {
        if (hp1 <= 0) { phase = 'lost'; phaseT = 0; K.sfx('wrong'); }
        else { phase = 'aim'; phaseT = 0; spear = null; }
      }
      if (phase === 'lost' && phaseT > 1.1) { K.gameOver({}); return; }
      if (phase === 'ko') { koT += dt; if (koT > 1.8) { level++; newRival(K, false); } }
      stuck.forEach(function (s) { s.a = Math.max(0.35, s.a - dt * 0.05); });
      K.info(K.t('level') + ' ' + level);
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H;
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8FD8FF'); g.addColorStop(0.6, '#D8F3FF'); g.addColorStop(1, '#FFF4D6'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // sun + clouds
      ctx.fillStyle = 'rgba(255,230,120,0.9)'; ctx.beginPath(); ctx.arc(W * 0.82, K.hudH + 70, Math.min(W, H) * 0.06, 0, K.TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (var c = 0; c < 4; c++) { var cx = ((c * 0.29 + K.time * 0.006 * (1 + c * 0.3) + (wind / 4000) * K.time) % 1.2 - 0.1) * W, cy = K.hudH + 60 + c * 34; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, K.TAU); ctx.arc(cx + 24, cy - 8, 26, 0, K.TAU); ctx.arc(cx + 50, cy, 20, 0, K.TAU); ctx.fill(); }
      if (!cam) return;
      // far hills
      ctx.fillStyle = '#D3F0D0'; ctx.beginPath(); ctx.moveTo(0, H); for (var x = 0; x <= W + 20; x += 20) ctx.lineTo(x, H * 0.5 + Math.sin(x * 0.006 + ph * 2) * 40); ctx.lineTo(W + 20, H); ctx.fill();
      ctx.fillStyle = '#BDE8C4'; ctx.beginPath(); ctx.moveTo(0, H); for (x = 0; x <= W + 20; x += 20) ctx.lineTo(x, H * 0.62 + Math.sin(x * 0.008 + ph) * 30); ctx.lineTo(W + 20, H); ctx.fill();
      // ground
      var x0 = (0 - cam.x) / cam.s, x1 = (W - cam.x) / cam.s, step = 8 / cam.s;
      ctx.fillStyle = '#7ED957'; ctx.beginPath(); ctx.moveTo(0, H);
      for (x = x0; x <= x1 + step; x += step) { var p = toScreen(x, ground(x)); ctx.lineTo(p.x, p.y); } ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5BBF3A'; ctx.beginPath(); ctx.moveTo(0, H);
      for (x = x0; x <= x1 + step; x += step) { p = toScreen(x, ground(x) + 16); ctx.lineTo(p.x, p.y); } ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#D7A86E'; ctx.beginPath(); ctx.moveTo(0, H);
      for (x = x0; x <= x1 + step; x += step) { p = toScreen(x, ground(x) + 40); ctx.lineTo(p.x, p.y); } ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      // stuck spears
      stuck.forEach(function (s) { drawSpear(ctx, s.x, s.y, s.vx, s.vy, s.a); });
      // aim guide (a short dotted start of the path)
      var showAim = phase === 'aim' && state === 'playing';
      var A = showAim ? (aim || (K.tutorial ? null : { ang: kbAim, pow: kbPow, ghost: true })) : null;
      if (A) {
        var from = launchPoint(0), spd = SPD0 + A.pow * (SPD1 - SPD0), vx = spd * Math.cos(A.ang), vy = -spd * Math.sin(A.ang), px = from.x, py = from.y, len = K.tutorial ? 0.9 : 0.42;
        ctx.fillStyle = A.ghost ? 'rgba(36,27,77,0.18)' : 'rgba(255,255,255,0.95)';
        for (var t = 0; t < len; t += STEP) { vx += wind * STEP; vy += G * STEP; px += vx * STEP; py += vy * STEP; if (Math.round(t / STEP) % 6 === 0) { var q = toScreen(px, py); ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(2.5, 4.5 * cam.s) * (1 - t / len * 0.5), 0, K.TAU); ctx.fill(); } }
      }
      drawStick(ctx, K, 0, phase === 'aim' || phase === 'rivalWait' || phase === 'rivalFly', A ? A.ang : 0.75);
      drawStick(ctx, K, 1, phase !== 'ko' && phase !== 'rivalFly', 0.75);
      if (spear && !(spear.done && spear.hit && phaseT > 0.2)) {
        if (!spear.done || !spear.hit) drawSpear(ctx, spear.x, spear.y, spear.vx, spear.vy);
        var sp = toScreen(spear.x, spear.y);
        if (sp.y < K.hudH + 50) { ctx.fillStyle = '#FF5FA2'; ctx.beginPath(); ctx.moveTo(sp.x, K.hudH + 52); ctx.lineTo(sp.x - 10, K.hudH + 70); ctx.lineTo(sp.x + 10, K.hudH + 70); ctx.closePath(); ctx.fill(); }
      }
      // pull line
      if (drag && aim) { ctx.strokeStyle = 'rgba(36,27,77,0.35)'; ctx.lineWidth = 4; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.moveTo(drag.x0, drag.y0); ctx.lineTo(drag.x, drag.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(drag.x0, drag.y0, 9, 0, K.TAU); ctx.fill();
        ctx.font = K.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#241B4D'; ctx.fillText(Math.round(aim.pow * 100) + '%', drag.x, drag.y - 16); }
      K.steady(ctx, function () { // HUD layer: stays still while the scene shakes
      // HP bars + wind
      var bw = Math.min(170, W * 0.36), by = K.hudH + 10;
      hpBar(ctx, K, 14, by, bw, hp1, max1, '#7B4DFF', K.t('you'), false);
      hpBar(ctx, K, W - 14 - bw, by, bw, hp2, max2, rival ? rival.c : '#FF5E5B', K.t('rival'), true);
      if (wind) {
        var wx = W / 2, wy = by + 14, wl = Math.min(60, Math.abs(wind) / 2.2 + 14) * (wind > 0 ? 1 : -1);
        ctx.font = K.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#241B4D'; ctx.fillText(K.t('wind'), wx, wy - 6);
        ctx.strokeStyle = '#241B4D'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(wx - wl / 2, wy + 4); ctx.lineTo(wx + wl / 2, wy + 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(wx + wl / 2, wy + 4); ctx.lineTo(wx + wl / 2 - Math.sign(wl) * 9, wy - 3); ctx.moveTo(wx + wl / 2, wy + 4); ctx.lineTo(wx + wl / 2 - Math.sign(wl) * 9, wy + 11); ctx.stroke();
      }
      if ((phase === 'rivalWait' || phase === 'rivalFly') && state === 'playing') { ctx.font = K.font(18); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = 'rgba(36,27,77,0.7)'; ctx.fillText(K.t('turn'), W / 2, by + 34); }
      // tutorial hand: pull back from the middle of the screen
      if (K.tutorial && showAim && !drag) {
        var k = (tutT * 0.7) % 1, hx = W * 0.45, hy = H * 0.55, e = Math.min(1, k / 0.6);
        K.drawHand(ctx, hx - e * maxPull(K) * 0.55, hy + e * maxPull(K) * 0.5, k > 0.05 && k < 0.7, Math.min(W, H) / 200);
      }
      });
    }
  });
})();
