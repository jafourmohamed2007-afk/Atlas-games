/* Rooftop Rush — original 3-lane rooftop runner for Bubzi */
(function () {
  'use strict';
  var ZMAX = 60, FOC = 7;
  var objs, player, speed, dist, coinScore, lastRowZ, runT, tut, swiped, deadFall, laneW, baseY, horizon, unit, stripeOff, invuln;

  function proj(z) { var s = FOC / (Math.max(-FOC + 0.5, z) + FOC); return { s: s, y: horizon + (baseY - horizon) * s }; }
  function laneX(K, lane, s) { return K.W / 2 + lane * laneW * s; }
  function layout(K) {
    horizon = K.H * 0.36; baseY = K.H * 0.9;
    laneW = Math.min(K.W * 0.27, K.H * 0.2);
    unit = laneW * 0.85;
  }
  function spawnRow(K, z, forced) {
    var dif = Math.min(1, runT / 90);
    var lanes = [-1, 0, 1], types = ['chim', 'vent', 'bar'];
    if (forced) { objs.push({ t: forced, lane: forced === 'gap' ? 0 : (forced === 'chim' ? 0 : 0), z: z }); return; }
    if (runT > 12 && Math.random() < 0.13 + dif * 0.08) { // full-width gap between buildings
      objs.push({ t: 'gap', lane: 0, z: z, len: 2.8 });
      for (var k = 0; k < 4; k++) objs.push({ t: 'coin', lane: K.pick(lanes), z: z - 1.3 + k * 0.9, h: 1.2 + Math.sin(k / 3 * Math.PI) * 0.4 });
      return;
    }
    var nObs = Math.random() < 0.25 + dif * 0.45 ? 2 : 1;
    var shuffled = lanes.slice().sort(function () { return Math.random() - 0.5; });
    var free = shuffled[2];
    for (var i = 0; i < nObs; i++) {
      var t = K.pick(types);
      // with two obstacles never put two tall chimneys if the free lane would be the only escape after a lane switch across them
      objs.push({ t: t, lane: shuffled[i], z: z });
    }
    if (nObs === 1 && Math.random() < 0.5) free = shuffled[1 + K.randi(0, 1)];
    if (Math.random() < 0.7) {
      var n = K.randi(3, 6);
      for (var c = 0; c < n; c++) objs.push({ t: 'coin', lane: free, z: z + 2.5 + c * 1.4, h: 0.45 });
    }
  }
  function reset(K) {
    if (K.test) K.dbg = function () { return { objs: objs, player: player, speed: speed, tut: tut }; };
    objs = []; speed = 13; dist = 0; coinScore = 0; runT = 0; stripeOff = 0; deadFall = 0; invuln = 0;
    player = { lane: 0, x: 0, y: 0, vy: 0, slide: 0, squash: 1, air: false };
    tut = K.tutorial ? { step: 0, shown: 0 } : null;
    lastRowZ = ZMAX;
    if (tut) { objs.push({ t: 'chim', lane: 0, z: 28, tut: 'side' }); objs.push({ t: 'vent', lane: -1, z: 48, tut: 'up' }); objs.push({ t: 'vent', lane: 1, z: 48, tut: 'up' }); objs.push({ t: 'vent', lane: 0, z: 48, tut: 'up' }); lastRowZ = 48; }
    else { spawnRow(K, 34); spawnRow(K, 50); lastRowZ = 50; }
  }
  function act(K, a) {
    if (deadFall) return;
    if (a === 'left' || a === 'right') {
      var nl = K.clamp(player.lane + (a === 'left' ? -1 : 1), -1, 1);
      if (nl !== player.lane) { player.lane = nl; K.sfx('whoosh'); }
    } else if (a === 'up') {
      if (!player.air) { player.vy = 10.5; player.air = true; player.slide = 0; K.sfx('jump'); player.squash = 1.25; }
    } else if (a === 'down') {
      if (player.air) { player.vy = -18; } else { player.slide = 0.7; K.sfx('whoosh'); }
      if (player.air) player.slide = 0.7;
    }
  }
  function hit(K, o, x, y) {
    if (invuln > 0) return;
    K.burst(x, y, ['#FFFFFF', '#FFC93C', '#FF5FA2'], 22, 300, 6); K.sfx('hit'); K.haptic(60);
    K.gameOver();
  }

  BubziKit.run({
    id: 'rooftop-rush', coinRate: 0.02,
    title: { en: 'Rooftop Rush', fr: 'Course sur les Toits', ar: 'سباق الأسطح' },
    strings: {
      en: { tagline: 'Swipe to dodge, jump and slide across the rooftops!', fell: 'Mind the gap!' },
      fr: { tagline: 'Glisse pour esquiver, sauter et glisser sur les toits !', fell: 'Attention au vide !' },
      ar: { tagline: 'اسحب لتتفادى وتقفز وتنزلق فوق الأسطح!', fell: 'انتبه للفراغ!' }
    },
    init: layout, resize: layout,
    reset: reset,
    idle: function (dt, K, state) { if (state === 'dying' && deadFall) { deadFall += dt; player.y -= dt * 9; } },
    revive: function (K) {
      objs = objs.filter(function (o) { return o.z > 30; });
      player.y = 0; player.vy = 0; player.air = false; player.slide = 0; deadFall = 0; invuln = 2.2; lastRowZ = Math.max(lastRowZ, 40);
    },
    swipe: function (dir, K) { swiped = true; act(K, dir); },
    pointerDown: function () { swiped = false; },
    pointerUp: function (x, y, K) {
      if (swiped) return;
      if (x < K.W * 0.3) act(K, 'left'); else if (x > K.W * 0.7) act(K, 'right'); else act(K, y > K.H * 0.75 ? 'down' : 'up');
    },
    key: function (code, down, K, rep) {
      if (!down || rep) return;
      var m = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', Space: 'up', ArrowDown: 'down', KeyS: 'down' }[code];
      if (m) act(K, m);
    },
    update: function (dt, K) {
      runT += dt; invuln = Math.max(0, invuln - dt);
      var target = tut ? 11 : Math.min(32, 13 + runT * 0.3);
      speed += (target - speed) * Math.min(1, dt * 2);
      var dz = speed * dt;
      dist += dz; stripeOff = (stripeOff + dz) % 4;
      // player physics
      player.x += (player.lane - player.x) * Math.min(1, dt * 14);
      if (player.air) {
        player.vy -= 30 * dt; player.y += player.vy * dt;
        if (player.y <= 0 && !deadFall) {
          // landing: over a gap? → fall
          var overGap = objs.some(function (o) { return o.t === 'gap' && o.z - o.len / 2 < 0.3 && o.z + o.len / 2 > -0.3; });
          if (overGap) { player.y = 0; if (invuln <= 0) { deadFall = 0.01; K.sfx('hit'); K.shake(8); K.gameOver({ title: K.t('fell') }); return; } player.vy = 0; player.air = false; }
          else { player.y = 0; player.vy = 0; player.air = false; player.squash = 0.75; K.sfx('land'); }
        }
      }
      if (player.slide > 0) player.slide -= dt;
      player.squash += (1 - player.squash) * Math.min(1, dt * 10);
      if (deadFall) { deadFall += dt; player.y -= dt * 9; return; }
      // move objects
      for (var i = objs.length - 1; i >= 0; i--) {
        var o = objs[i]; o.z -= dz;
        if (o.z < -4) { objs.splice(i, 1); continue; }
        var pr = proj(0), px = laneX(K, player.x, pr.s), py = baseY - (player.y + 0.6) * unit;
        if (o.t === 'gap') {
          if (o.z - o.len / 2 < 0.1 && o.z + o.len / 2 > -0.1 && !player.air && player.y <= 0.01 && invuln <= 0) {
            deadFall = 0.01; K.sfx('hit'); K.shake(8); K.gameOver({ title: K.t('fell') });
          }
          continue;
        }
        if (o.z > 0.5 || o.z < -0.5 || o.done) continue;
        var sameLane = Math.abs(player.x - o.lane) < 0.42;
        if (o.t === 'coin') {
          if (sameLane && Math.abs(player.y - (o.h - 0.45)) < 0.9) { o.done = true; objs.splice(i, 1); coinScore += 5; K.addCoins(1, px, py - 20); }
          continue;
        }
        if (!sameLane) continue;
        if (o.t === 'chim') { o.done = true; hit(K, o, px, py); }
        else if (o.t === 'vent' && player.y < 0.62) { o.done = true; hit(K, o, px, py); }
        else if (o.t === 'bar' && player.slide <= 0) { o.done = true; hit(K, o, px, py); }
      }
      if (!K.isPlaying()) return;
      // spawn
      lastRowZ -= dz;
      if (tut) {
        if (tut.step === 0 && !objs.some(function (o) { return o.tut; })) { tut.step = 1; objs.push({ t: 'bar', lane: -1, z: ZMAX, tut: 'down' }, { t: 'bar', lane: 0, z: ZMAX, tut: 'down' }, { t: 'bar', lane: 1, z: ZMAX, tut: 'down' }); lastRowZ = ZMAX; }
        else if (tut.step === 1 && !objs.some(function (o) { return o.tut; })) { tut = null; K.tutorialDone(); K.sfx('star'); lastRowZ = ZMAX - 30; }
      } else {
        var gap = Math.max(10, 17 - runT * 0.06);
        if (lastRowZ < ZMAX - gap) { spawnRow(K, ZMAX); lastRowZ = ZMAX; }
      }
      K.setScore(Math.floor(dist) + coinScore);
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H, i;
      // sky
      var g = ctx.createLinearGradient(0, 0, 0, horizon + 20);
      g.addColorStop(0, '#8E6BFF'); g.addColorStop(0.55, '#FF8FC4'); g.addColorStop(1, '#FFC17A');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,233,140,0.9)'; ctx.beginPath(); ctx.arc(W * 0.74, horizon - H * 0.06, Math.min(W, H) * 0.09, 0, K.TAU); ctx.fill();
      // skyline (two parallax layers, slow drift)
      [['#B07ADB', 0.62, 0.12], ['#7B4DFF', 1, 0.25]].forEach(function (L, li) {
        ctx.fillStyle = L[0];
        var sp = dist * L[2], off = sp % 60, base = Math.floor(sp / 60);
        for (var k = -1; k * 60 - off < W + 60; k++) {
          var x = k * 60 - off, hs = Math.sin((base + k + li * 1000) * 12.9898) * 43758.5453, seed = hs - Math.floor(hs);
          var bh = H * (0.05 + seed * 0.1) * L[1];
          ctx.fillRect(x, horizon - bh, 52, bh + 2);
          if (li === 1) { ctx.fillStyle = 'rgba(255,233,140,0.8)'; for (var wy = horizon - bh + 8; wy < horizon - 6; wy += 14) { ctx.fillRect(x + 10, wy, 7, 6); ctx.fillRect(x + 32, wy, 7, 6); } ctx.fillStyle = L[0]; }
        }
      });
      // roof surface
      var near = proj(-1.2), far = proj(ZMAX);
      function edge(z, side) { var p = proj(z); return { x: W / 2 + side * laneW * 1.75 * p.s, y: p.y }; }
      var a1 = edge(ZMAX, -1), a2 = edge(ZMAX, 1), b1 = edge(-1.2, -1), b2 = edge(-1.2, 1);
      ctx.fillStyle = '#5A4A9C'; ctx.beginPath(); ctx.moveTo(a1.x - 6, a1.y); ctx.lineTo(a2.x + 6, a2.y); ctx.lineTo(b2.x + 40, H); ctx.lineTo(b1.x - 40, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#C9B8FF'; ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.lineTo(b2.x, H); ctx.lineTo(b1.x, H); ctx.closePath(); ctx.fill();
      // moving tiles
      ctx.strokeStyle = 'rgba(90,46,232,0.18)'; ctx.lineWidth = 2;
      for (var z = 4 - stripeOff; z < ZMAX; z += 4) { var l = edge(z, -1), r = edge(z, 1); ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(r.x, r.y); ctx.stroke(); }
      // lane lines
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([14, 14]); ctx.lineDashOffset = -stripeOff * 10;
      [-0.5, 0.5].forEach(function (lx) { ctx.beginPath(); ctx.moveTo(W / 2 + lx * laneW * far.s, far.y); ctx.lineTo(W / 2 + lx * laneW * near.s, near.y); ctx.stroke(); });
      ctx.setLineDash([]);
      // objects back to front
      var list = objs.filter(function (o) { return o.z < ZMAX && o.z > -3; }).sort(function (a, b) { return b.z - a.z; });
      var drewPlayer = false;
      function drawPlayer() {
        drewPlayer = true;
        var p = proj(0), x = laneX(K, player.x, p.s), r = unit * 0.42;
        var sq = player.slide > 0 ? 0.62 : player.squash;
        var run = player.air || player.slide > 0 ? 0 : Math.abs(Math.sin(runT * 12)) * 4;
        var y = baseY - player.y * unit - r * sq - run;
        if (!deadFall) { ctx.fillStyle = 'rgba(36,27,77,0.25)'; ctx.beginPath(); ctx.ellipse(x, baseY + 2, r * (1 - Math.min(0.5, player.y * 0.2)), r * 0.25, 0, 0, K.TAU); ctx.fill(); }
        if (invuln > 0 && Math.floor(invuln * 10) % 2 === 0) ctx.globalAlpha = 0.4;
        // speed lines
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (var k = 0; k < 3; k++) { var yy = y - r * 0.4 + k * r * 0.4; ctx.beginPath(); ctx.moveTo(x - r * 1.3 - k * 6, yy + r * 0.6); ctx.lineTo(x - r * 1.3 - k * 6, yy + r * 0.6 + 10 + speed * 0.4); ctx.stroke(); }
        K.drawBubzi(ctx, x, y, r, { squash: sq, mood: state === 'dying' || state === 'over' ? 'sad' : (player.air ? 'wow' : 'happy'), lookY: -1, angle: (player.lane - player.x) * -0.4 });
        ctx.globalAlpha = 1;
      }
      for (i = 0; i < list.length; i++) {
        var o = list[i];
        if (!drewPlayer && o.z < 0) drawPlayer();
        var p = proj(o.z), x = laneX(K, o.lane, p.s), w = laneW * 0.8 * p.s, u = unit * p.s;
        ctx.globalAlpha = Math.min(1, (ZMAX - o.z) / 8);
        if (o.t === 'gap') {
          var f1 = proj(o.z + o.len / 2), f2 = proj(o.z - o.len / 2);
          var e1 = W / 2 - laneW * 1.75 * f1.s, e2 = W / 2 + laneW * 1.75 * f1.s, e3 = W / 2 + laneW * 1.75 * f2.s, e4 = W / 2 - laneW * 1.75 * f2.s;
          ctx.fillStyle = '#3A2A7A'; ctx.beginPath(); ctx.moveTo(e1, f1.y); ctx.lineTo(e2, f1.y); ctx.lineTo(e3 + 40 * f2.s, f2.y); ctx.lineTo(e4 - 40 * f2.s, f2.y); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#FFC17A'; ctx.fillRect(e1, f1.y, e2 - e1, Math.max(2, 4 * f1.s));
        } else if (o.t === 'coin') {
          K.drawCoin(ctx, x, p.y - o.h * u - u * 0.1, Math.max(2, u * 0.22), K.time + o.z * 0.2);
        } else if (o.t === 'chim') {
          var hh = u * 1.5;
          ctx.fillStyle = '#B8402E'; K.roundRect(ctx, x - w / 2, p.y - hh, w, hh, 6 * p.s); ctx.fill();
          ctx.fillStyle = '#E8664F'; K.roundRect(ctx, x - w / 2, p.y - hh, w, hh - 6 * p.s, 6 * p.s); ctx.fill();
          ctx.fillStyle = '#FFB199'; ctx.fillRect(x - w / 2, p.y - hh, w, Math.max(2, 10 * p.s));
          ctx.strokeStyle = 'rgba(120,30,20,0.35)'; ctx.lineWidth = Math.max(1, 2 * p.s);
          for (var by = p.y - hh + 18 * p.s; by < p.y - 4; by += 16 * p.s) { ctx.beginPath(); ctx.moveTo(x - w / 2, by); ctx.lineTo(x + w / 2, by); ctx.stroke(); }
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; var sm = K.time * 1.5 + o.z;
          for (var s2 = 0; s2 < 3; s2++) { var k2 = (sm + s2 / 3) % 1; ctx.beginPath(); ctx.arc(x + Math.sin(k2 * 6) * 6 * p.s, p.y - hh - k2 * 40 * p.s, (6 + k2 * 10) * p.s, 0, K.TAU); ctx.fill(); }
        } else if (o.t === 'vent') {
          var vh = u * 0.55;
          ctx.fillStyle = '#5E5689'; K.roundRect(ctx, x - w / 2, p.y - vh, w, vh, 8 * p.s); ctx.fill();
          ctx.fillStyle = '#8C82C9'; K.roundRect(ctx, x - w / 2, p.y - vh, w, vh - 5 * p.s, 8 * p.s); ctx.fill();
          ctx.strokeStyle = '#4A4278'; ctx.lineWidth = Math.max(1, 3 * p.s);
          for (var vx = -0.3; vx <= 0.31; vx += 0.2) { ctx.beginPath(); ctx.moveTo(x + vx * w, p.y - vh * 0.75); ctx.lineTo(x + vx * w, p.y - vh * 0.3); ctx.stroke(); }
          ctx.fillStyle = '#FFC93C'; ctx.beginPath(); ctx.moveTo(x, p.y - vh - 14 * p.s); ctx.lineTo(x - 8 * p.s, p.y - vh - 4 * p.s); ctx.lineTo(x + 8 * p.s, p.y - vh - 4 * p.s); ctx.fill();
        } else if (o.t === 'bar') {
          var top = p.y - u * 1.35, bot = p.y - u * 0.7;
          ctx.fillStyle = '#5E5689'; ctx.fillRect(x - w / 2, top, Math.max(2, 5 * p.s), p.y - top); ctx.fillRect(x + w / 2 - Math.max(2, 5 * p.s), top, Math.max(2, 5 * p.s), p.y - top);
          ctx.fillStyle = '#FF5FA2'; K.roundRect(ctx, x - w / 2, top, w, bot - top, 8 * p.s); ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          for (var st = 0; st < 4; st++) { ctx.beginPath(); var sx0 = x - w / 2 + (st + 0.15) * w / 4; ctx.moveTo(sx0, bot); ctx.lineTo(sx0 + w / 10, top); ctx.lineTo(sx0 + w / 10 + w / 12, top); ctx.lineTo(sx0 + w / 12, bot); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
      }
      if (!drewPlayer) drawPlayer();
      // tutorial hints (show, don't tell)
      if (tut && state === 'playing') {
        var next = null; objs.forEach(function (o) { if (o.tut && o.z > 1 && (!next || o.z < next.z)) next = o; });
        if (next && next.z < 26) {
          var k = (K.time * 1.4) % 1, cx = W / 2, cy = H * 0.6, d = Math.min(W, H) * 0.18 * k;
          var dir = next.tut === 'side' ? (player.lane === next.lane ? [1, 0] : null) : next.tut === 'up' ? [0, -1] : [0, 1];
          if (!dir) return;
          ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dir[0] * d, cy + dir[1] * d); ctx.stroke();
          K.drawHand(ctx, cx + dir[0] * d, cy + dir[1] * d, true, Math.min(W, H) / 170);
        }
      }
    }
  });
})();
