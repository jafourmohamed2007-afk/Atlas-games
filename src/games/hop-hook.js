/* Hop Hook — original one-touch swing game for Bubzi */
(function () {
  'use strict';
  var WORLD_H = 1000, G = 1500, WATER = 940;
  var p, hooks, coins, clouds, camX, sc, holding, maxX, grabs, lastHookX, lastHookY, splashT, tutT, onStart, coinScore;

  function layout(K) { sc = K.H / WORLD_H; }
  function viewW(K) { return K.W / sc; }
  function addHook(K) {
    var m = maxX / 50, spMin = 250 + Math.min(110, m * 0.12), spMax = 330 + Math.min(170, m * 0.18);
    var x = lastHookX + K.rand(spMin, spMax);
    var y = K.clamp(lastHookY + K.rand(-170, 170), 170, 470);
    var h = { x: x, y: y, by: y, amp: m > 150 && Math.random() < Math.min(0.5, (m - 150) / 600) ? K.rand(40, 90) : 0, ph: Math.random() * 6 };
    hooks.push(h);
    if (Math.random() < 0.65) { // coin arc between previous and this hook
      var mx = (lastHookX + x) / 2, my = Math.max(lastHookY, y) + 170;
      for (var i = -2; i <= 2; i++) coins.push({ x: mx + i * 42, y: my + i * i * 9 - 40, got: false });
    }
    lastHookX = x; lastHookY = y;
  }
  function hookPos(h, K) { return { x: h.x, y: h.amp ? h.by + Math.sin(K.time * 1.6 + h.ph) * h.amp : h.y }; }
  function target(K) {
    var best = null, bd = 1e9;
    for (var i = 0; i < hooks.length; i++) {
      var h = hooks[i], hp = hookPos(h, K);
      if (hp.x < p.x - 60) continue;
      var dx = hp.x - p.x, dy = hp.y - p.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 600 || hp.y > p.y + 40) continue;
      var score = d - dx * 0.3;
      if (score < bd) { bd = score; best = h; }
    }
    return best;
  }
  function grab(K) {
    if (p.hook || splashT) return;
    if (onStart) { onStart = false; p.vx = 420; p.vy = -520; K.sfx('jump'); }
    var h = target(K);
    if (!h) { K.sfx('wrong'); return; }
    var hp = hookPos(h, K);
    p.hook = h; p.len = Math.max(110, Math.min(520, Math.hypot(p.x - hp.x, p.y - hp.y)));
    K.sfx('grab'); K.haptic(8); grabs++;
    if (grabs >= 3) K.tutorialDone();
  }
  function release(K) {
    if (!p.hook) return;
    p.hook = null;
    var sp = Math.hypot(p.vx, p.vy);
    if (sp > 50) { p.vx *= 1.06; p.vy *= 1.06; p.vy -= 60; }
    K.sfx('whoosh'); p.spin = p.vx > 0 ? 1 : -1;
  }

  BubziKit.run({
    id: 'hop-hook', coinRate: 0.03,
    title: { en: 'Hop Hook', fr: 'Hop Hook', ar: 'هوب هوك' },
    strings: {
      en: { tagline: 'Hold to grab a hook, let go to fly!', splash: 'Splash!' },
      fr: { tagline: 'Maintiens pour t’accrocher, relâche pour voler !', splash: 'Plouf !' },
      ar: { tagline: 'اضغط مطولاً لتمسك الخطاف وارفع إصبعك لتطير!', splash: 'سبلاش!' }
    },
    init: function (K) {
      layout(K);
      clouds = []; for (var i = 0; i < 9; i++) clouds.push({ x: K.rand(0, 3000), y: K.rand(60, 420), s: K.rand(0.6, 1.4), d: K.rand(0.2, 0.6) });
    },
    resize: layout,
    reset: function (K) {
      if (K.test) K.dbg = function () { return { p: p, hook: p.hook ? hookPos(p.hook, K) : null, target: target(K) ? hookPos(target(K), K) : null }; };
      layout(K);
      p = { x: 140, y: 600, vx: 0, vy: 0, hook: null, len: 0, ang: 0, spin: 0 };
      hooks = []; coins = []; maxX = 0; grabs = 0; splashT = 0; tutT = 0; onStart = true; coinScore = 0; holding = false;
      lastHookX = 160; lastHookY = 300; camX = 0;
      hooks.push({ x: 400, y: 320, by: 320, amp: 0, ph: 0 }); lastHookX = 400; lastHookY = 320;
      for (var i = 0; i < 8; i++) addHook(K);
    },
    revive: function (K) {
      var h = null; for (var i = 0; i < hooks.length; i++) if (hooks[i].x > p.x - 200) { h = hooks[i]; break; }
      if (!h) h = hooks[hooks.length - 1];
      var hp = hookPos(h, K);
      p.x = hp.x - 120; p.y = hp.y + 130; p.vx = 300; p.vy = 0; p.hook = h; p.len = Math.hypot(120, 130); splashT = 0; holding = true;
    },
    pointerDown: function (x, y, K) { holding = true; grab(K); },
    pointerUp: function (x, y, K) { holding = false; release(K); },
    pointerCancel: function () { holding = false; },
    key: function (code, down, K, rep) {
      if (code !== 'Space' && code !== 'ArrowUp' && code !== 'KeyW' && code !== 'Enter') return;
      if (rep) return;
      if (down) { holding = true; grab(K); } else { holding = false; release(K); }
    },
    update: function (dt, K) {
      tutT += dt;
      if (splashT) return;
      if (onStart) { p.y = 600; p.vx = 0; p.vy = 0; return; }
      var steps = 3, h = dt / steps;
      for (var s = 0; s < steps; s++) {
        p.vy += G * h;
        if (p.hook) {
          var hp = hookPos(p.hook, K);
          // pump along swing direction so energy does not decay
          var sp = Math.hypot(p.vx, p.vy);
          if (sp > 1 && p.y > hp.y) { p.vx += p.vx / sp * 380 * h; p.vy += p.vy / sp * 380 * h; }
        }
        p.vx *= 0.9995; p.vy *= 0.9995;
        var spd = Math.hypot(p.vx, p.vy); if (spd > 1500) { p.vx *= 1500 / spd; p.vy *= 1500 / spd; }
        p.x += p.vx * h; p.y += p.vy * h;
        if (p.hook) {
          var q = hookPos(p.hook, K), dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
          if (d > p.len && d > 0.001) {
            var nx = dx / d, ny = dy / d; p.x = q.x + nx * p.len; p.y = q.y + ny * p.len;
            var vr = p.vx * nx + p.vy * ny; if (vr > 0) { p.vx -= vr * nx; p.vy -= vr * ny; }
          }
        }
      }
      if (p.y < -400) { p.y = -400; p.vy = Math.max(0, p.vy); }
      p.ang = p.hook ? Math.atan2(p.x - hookPos(p.hook, K).x, -(p.y - hookPos(p.hook, K).y)) * 0.2 : p.ang + p.spin * dt * 7;
      // coins
      for (var i = 0; i < coins.length; i++) {
        var c = coins[i]; if (c.got) continue;
        if (Math.abs(c.x - p.x) < 44 && Math.abs(c.y - p.y) < 44) { c.got = true; coinScore += 3; K.addCoins(1, (c.x - camX) * sc, c.y * sc); }
      }
      // world upkeep
      maxX = Math.max(maxX, p.x);
      while (lastHookX < camX + viewW(K) + 700) addHook(K);
      hooks = hooks.filter(function (hk) { return hk.x > camX - 400 || hk === p.hook; });
      coins = coins.filter(function (c) { return c.x > camX - 200 && !c.got; });
      var tx = p.x - viewW(K) * 0.33; camX += (tx - camX) * Math.min(1, dt * 4);
      K.setScore(Math.floor((maxX - 140) / 50) + coinScore);
      if (p.y > WATER) {
        splashT = 0.01; p.hook = null;
        K.burst((p.x - camX) * sc, WATER * sc, ['#FFFFFF', '#38B6FF', '#9BE0FF'], 30, 360, 6); K.sfx('hit');
        K.gameOver({ title: K.t('splash') });
      }
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H, i;
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7FD8FF'); g.addColorStop(0.7, '#C9B8FF'); g.addColorStop(1, '#FFD6EC');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // clouds parallax
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      clouds.forEach(function (c) {
        var span = viewW(K) + 600, x = ((c.x - camX * c.d) % span + span) % span - 300;
        var X = x * sc, Y = c.y * sc, r = 40 * c.s * sc;
        ctx.beginPath(); ctx.arc(X, Y, r, 0, K.TAU); ctx.arc(X + r * 1.1, Y + r * 0.2, r * 0.8, 0, K.TAU); ctx.arc(X - r * 1.1, Y + r * 0.25, r * 0.7, 0, K.TAU); ctx.fill();
      });
      ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, 0);
      // start platform
      ctx.fillStyle = '#0FA684'; K.roundRect(ctx, -200, 630, 420, 400, 30); ctx.fill();
      ctx.fillStyle = '#14C8A0'; K.roundRect(ctx, -200, 630, 420, 40, 20); ctx.fill();
      // distance flags every 50 m
      ctx.fillStyle = 'rgba(90,46,232,0.35)'; ctx.font = K.font(28); ctx.textAlign = 'center';
      var m0 = Math.floor(camX / 2500) * 2500;
      for (var fx = m0; fx < camX + viewW(K) + 2500; fx += 2500) { if (fx <= 0) continue; ctx.fillRect(fx - 2, 760, 4, 180); ctx.fillText(Math.round(fx / 50) + ' m', fx, 750); }
      // coins
      coins.forEach(function (c) { K.drawCoin(ctx, c.x, c.y, 15, K.time + c.x * 0.01); });
      // hooks
      var tgt = state === 'playing' && !p.hook ? target(K) : null;
      hooks.forEach(function (h) {
        var hp = hookPos(h, K);
        ctx.strokeStyle = 'rgba(36,27,77,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hp.x, hp.y - 18); ctx.lineTo(hp.x, hp.y - 70); ctx.stroke();
        ctx.fillStyle = '#FF5FA2'; ctx.beginPath(); ctx.ellipse(hp.x, hp.y - 92, 20, 24, 0, 0, K.TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(hp.x - 7, hp.y - 100, 5, 8, -0.4, 0, K.TAU); ctx.fill();
        if (h === tgt) { ctx.fillStyle = 'rgba(255,201,60,' + (0.35 + 0.25 * Math.sin(K.time * 8)) + ')'; ctx.beginPath(); ctx.arc(hp.x, hp.y, 34, 0, K.TAU); ctx.fill(); }
        ctx.lineWidth = 9; ctx.strokeStyle = '#241B4D'; ctx.beginPath(); ctx.arc(hp.x, hp.y, 17, 0, K.TAU); ctx.stroke();
        ctx.lineWidth = 6; ctx.strokeStyle = h === p.hook ? '#14C8A0' : '#FFC93C'; ctx.beginPath(); ctx.arc(hp.x, hp.y, 17, 0, K.TAU); ctx.stroke();
      });
      // rope
      if (p.hook) {
        var q = hookPos(p.hook, K);
        ctx.lineCap = 'round'; ctx.strokeStyle = '#241B4D'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      // player
      var spd = Math.hypot(p.vx, p.vy);
      if (!splashT) K.drawBubzi(ctx, p.x, p.y, 34, { angle: p.ang, mood: state === 'dying' || state === 'over' ? 'sad' : (spd > 900 ? 'joy' : p.hook ? 'happy' : 'wow'), lookX: p.vx / 800, lookY: p.vy / 800, squash: 1 + Math.min(0.15, spd / 8000) });
      // water
      ctx.fillStyle = '#38B6FF';
      ctx.beginPath(); ctx.moveTo(camX - 50, 1100);
      for (var wx = camX - 50; wx <= camX + viewW(K) + 60; wx += 30) ctx.lineTo(wx, WATER + 12 + Math.sin(wx * 0.02 + K.time * 3) * 8);
      ctx.lineTo(camX + viewW(K) + 60, 1100); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1A86CC'; ctx.fillRect(camX - 50, WATER + 40, viewW(K) + 120, 200);
      ctx.restore();
      // tutorial
      if (K.tutorial && state === 'playing' && grabs < 3 && !splashT) {
        var hx = W * 0.5, hy = H * 0.72, k = (tutT * 1.2) % 1;
        if (!p.hook) {
          var t2 = target(K);
          if (t2 && (onStart || p.vy > -200)) { K.drawHand(ctx, hx, hy, k > 0.3, W / 220); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy, 18 + k * 30, 0, K.TAU); ctx.stroke(); }
        } else if (p.vx > 200 && p.vy < 0) {
          K.drawHand(ctx, hx, hy - k * 30, false, W / 220);
        }
      }
    }
  });
})();
