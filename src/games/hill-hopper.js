/* Hill Hopper — original physics hill driving game for Bubzi */
(function () {
  'use strict';
  var WR = 22, AXLE = 92, G = 1300;
  var w1, w2, sc, camX, camY, fuel, maxX, bonus, gas, brake, coins, cans, lastCanX, lastCoinX, airAcc, prevAng, grounded, stillT, wheelRot, tutT, flipsShown, keyGas, keyBrake, crashed;

  function ground(x) {
    if (x < 500) return 520;
    var d = x - 500, amp = Math.min(1, d / 2500), big = Math.min(1.6, 1 + d / 20000);
    return 520 - amp * big * (95 * Math.sin(d * 0.0042) + 50 * Math.sin(d * 0.0105 + 1.3) + 22 * Math.sin(d * 0.024 + 0.4)) + amp * 40;
  }
  function slope(x) { return (ground(x + 1) - ground(x - 1)) / 2; }
  function layout(K) { sc = K.H / 760; }
  function placeCar(x) {
    var a = Math.atan(slope(x));
    w1 = { x: x - Math.cos(a) * AXLE / 2, y: 0, vx: 0, vy: 0, g: false };
    w2 = { x: x + Math.cos(a) * AXLE / 2, y: 0, vx: 0, vy: 0, g: false };
    w1.y = ground(w1.x) - WR - 2; w2.y = ground(w2.x) - WR - 2;
    prevAng = Math.atan2(w2.y - w1.y, w2.x - w1.x); airAcc = 0; stillT = 0; crashed = false;
  }
  function spawnStuff(K, upto) {
    while (lastCoinX < upto) {
      lastCoinX += K.rand(450, 800);
      for (var i = 0; i < 5; i++) { var cx = lastCoinX + i * 46; coins.push({ x: cx, y: ground(cx) - 48 }); }
    }
    while (lastCanX < upto) { lastCanX += K.rand(1700, 2500) + maxX * 0.05; cans.push({ x: lastCanX, y: ground(lastCanX) - 34 }); }
  }
  function wheelStep(w, h, drive) {
    w.vy += G * h; w.x += w.vx * h; w.y += w.vy * h;
    var gy = ground(w.x), s = slope(w.x), len = Math.sqrt(1 + s * s), nx = s / len, ny = -1 / len;
    var d = (gy - w.y) / len;
    w.g = false;
    if (d < WR) {
      var pen = WR - d; w.x += nx * pen; w.y += ny * pen;
      var vn = w.vx * nx + w.vy * ny;
      if (vn < 0) { w.vx -= vn * nx * 1.12; w.vy -= vn * ny * 1.12; }
      w.g = true;
      var tx = -ny, ty = nx, vt = w.vx * tx + w.vy * ty;
      if (drive > 0 && vt < 820) { w.vx += tx * drive * h; w.vy += ty * drive * h; }
      else if (drive < 0 && vt > -380) { w.vx += tx * drive * h; w.vy += ty * drive * h; }
      else if (!drive) { var f = Math.min(1, 0.6 * h); w.vx -= tx * vt * f; w.vy -= ty * vt * f; }
    }
  }
  function carState() {
    var cx = (w1.x + w2.x) / 2, cy = (w1.y + w2.y) / 2, a = Math.atan2(w2.y - w1.y, w2.x - w1.x);
    return { x: cx, y: cy, a: a, ux: Math.sin(a), uy: -Math.cos(a) };
  }

  BubziKit.run({
    id: 'hill-hopper', coinRate: 0.02,
    title: { en: 'Hill Hopper', fr: 'Saute-Collines', ar: 'قافز التلال' },
    strings: {
      en: { tagline: 'Hold GAS to drive, flip in the air for bonus coins!', crash: 'Bonk! Head first!', nofuel: 'Out of fuel!', flip: 'Flip!', fuel: 'Fuel' },
      fr: { tagline: 'Maintiens GAZ pour rouler, fais des saltos pour des pièces bonus !', crash: 'Bonk ! Sur la tête !', nofuel: 'Plus d’essence !', flip: 'Salto !', fuel: 'Essence' },
      ar: { tagline: 'اضغط على البنزين للقيادة ونفّذ الشقلبات لتربح عملات!', crash: 'بونك! على الرأس!', nofuel: 'نفد الوقود!', flip: 'شقلبة!', fuel: 'وقود' }
    },
    init: layout, resize: layout,
    reset: function (K) {
      if (K.test) K.dbg = function () { return { w1: w1, w2: w2, fuel: fuel }; };
      layout(K);
      coins = []; cans = []; lastCanX = 900; lastCoinX = 600; fuel = 100; maxX = 200; bonus = 0; gas = {}; brake = {}; keyGas = false; keyBrake = false;
      wheelRot = 0; tutT = 0; flipsShown = 0;
      placeCar(200); camX = 0; camY = 0;
      spawnStuff(K, 4000);
    },
    revive: function (K) {
      var c = carState(); placeCar(Math.max(200, c.x - 120)); fuel = Math.max(fuel, 60); gas = {}; brake = {};
    },
    pointerDown: function (x, y, K, id) { if (x > K.W / 2) gas[id] = 1; else brake[id] = 1; K.sfx('tick'); },
    pointerUp: function (x, y, K, id) { delete gas[id]; delete brake[id]; },
    pointerCancel: function () { gas = {}; brake = {}; keyGas = false; keyBrake = false; },
    key: function (code, down) {
      if (code === 'ArrowRight' || code === 'KeyD' || code === 'ArrowUp' || code === 'KeyW' || code === 'Space') keyGas = down;
      if (code === 'ArrowLeft' || code === 'KeyA' || code === 'ArrowDown' || code === 'KeyS') keyBrake = down;
    },
    update: function (dt, K) {
      tutT += dt;
      var g = keyGas || Object.keys(gas).length > 0, b = keyBrake || Object.keys(brake).length > 0;
      if (fuel <= 0) g = false;
      var steps = 4, h = dt / steps, drive = g ? 1150 : b ? -900 : 0;
      for (var s = 0; s < steps; s++) {
        wheelStep(w1, h, drive); wheelStep(w2, h, drive);
        // rigid axle constraint
        var dx = w2.x - w1.x, dy = w2.y - w1.y, d = Math.sqrt(dx * dx + dy * dy) || 0.001, nx = dx / d, ny = dy / d, diff = (d - AXLE) / 2;
        w1.x += nx * diff; w1.y += ny * diff; w2.x -= nx * diff; w2.y -= ny * diff;
        var rv = (w2.vx - w1.vx) * nx + (w2.vy - w1.vy) * ny;
        w1.vx += nx * rv / 2; w1.vy += ny * rv / 2; w2.vx -= nx * rv / 2; w2.vy -= ny * rv / 2;
        // air control: gas = lean back, brake = lean forward
        if (!w1.g && !w2.g && (g || b)) {
          var px = -ny, py = nx, k = (g ? 1 : -1) * 520 * h;
          w2.vx -= px * k; w2.vy -= py * k; w1.vx += px * k; w1.vy += py * k;
        }
        // angular damping on ground to stop jitter
        if (w1.g && w2.g) { var avx = (w1.vx + w2.vx) / 2, avy = (w1.vy + w2.vy) / 2; w1.vx += (avx - w1.vx) * 0.02; w1.vy += (avy - w1.vy) * 0.02; w2.vx += (avx - w2.vx) * 0.02; w2.vy += (avy - w2.vy) * 0.02; }
      }
      var c = carState();
      grounded = w1.g || w2.g;
      // flips
      var da = c.a - prevAng; if (da > Math.PI) da -= K.TAU; if (da < -Math.PI) da += K.TAU; prevAng = c.a;
      if (!grounded) airAcc += da;
      else {
        var flips = Math.floor(Math.abs(airAcc) / (K.TAU * 0.85));
        if (flips > 0) {
          bonus += flips * 50; K.addCoins(flips * 3, (c.x - camX) * sc, (c.y - camY) * sc - 40);
          K.floatText(K.W / 2, K.H * 0.35, K.t('flip') + (flips > 1 ? ' x' + flips : ''), '#FFC93C', 40); K.sfx('flip'); K.confetti(30); flipsShown++;
        }
        airAcc = 0;
      }
      // head crash
      var hx = c.x + c.ux * 46, hy = c.y + c.uy * 46;
      if (hy > ground(hx) - 14 && Math.cos(c.a) < 0.3) {
        crashed = true; K.burst((hx - camX) * sc, (hy - camY) * sc, ['#FFFFFF', '#FFC93C', '#FF5FA2'], 24, 300, 6); K.sfx('hit');
        K.gameOver({ title: K.t('crash') }); return;
      }
      // fuel
      fuel -= dt * (g ? 5.5 : 1.8); if (fuel < 0) fuel = 0;
      var speed = Math.hypot((w1.vx + w2.vx) / 2, (w1.vy + w2.vy) / 2);
      if (fuel <= 0 && speed < 20 && grounded) { stillT += dt; if (stillT > 1.2) { K.gameOver({ title: K.t('nofuel') }); return; } } else stillT = 0;
      if (g && grounded && Math.random() < 0.5) K.burst((w1.x - camX) * sc, (w1.y + WR - camY) * sc, ['#C9A27A', '#E8D2B0'], 1, 80, 4);
      // pickups
      for (var i = coins.length - 1; i >= 0; i--) { var cn = coins[i]; if (Math.hypot(cn.x - c.x, cn.y - c.y) < 62) { coins.splice(i, 1); bonus += 2; K.addCoins(1, (cn.x - camX) * sc, (cn.y - camY) * sc); } }
      for (var j = cans.length - 1; j >= 0; j--) { var cc = cans[j]; if (Math.hypot(cc.x - c.x, cc.y - c.y) < 75) { cans.splice(j, 1); fuel = 100; K.sfx('reward'); K.floatText((cc.x - camX) * sc, (cc.y - camY) * sc, K.t('fuel') + ' 100%', '#14C8A0', 26); } }
      coins = coins.filter(function (o) { return o.x > camX - 200; }); cans = cans.filter(function (o) { return o.x > camX - 200; });
      maxX = Math.max(maxX, c.x); spawnStuff(K, camX + K.W / sc + 2500);
      wheelRot += (speed * dt / WR) * (((w1.vx + w2.vx) >= 0) ? 1 : -1);
      // camera
      var vw = K.W / sc, vh = K.H / sc;
      camX += (c.x - vw * 0.32 - camX) * Math.min(1, dt * 5);
      camY += (c.y - vh * 0.55 - camY) * Math.min(1, dt * 3);
      if (g && Math.random() < dt * 12) K.sfx('engine');
      if (c.x > 520) K.tutorialDone();
      K.setScore(Math.floor((maxX - 200) / 50) + bonus);
      K.info(K.t('fuel') + ' ' + Math.ceil(fuel) + '%');
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H, vw = W / sc;
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9BE7FF'); g.addColorStop(1, '#E9FFF5');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // far hills parallax
      ctx.fillStyle = '#A7F0C9';
      ctx.beginPath(); ctx.moveTo(0, H);
      for (var x = 0; x <= W + 20; x += 20) { var wx = x / sc + camX * 0.3; ctx.lineTo(x, H * 0.55 + Math.sin(wx * 0.004) * 40 * sc + Math.sin(wx * 0.011) * 18 * sc); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.scale(sc, sc); ctx.translate(-camX, -camY);
      // ground
      var x0 = camX - 40, x1 = camX + vw + 40, bottom = camY + H / sc + 50;
      ctx.fillStyle = '#8B5E3C'; ctx.beginPath(); ctx.moveTo(x0, bottom);
      for (x = x0; x <= x1; x += 14) ctx.lineTo(x, ground(x)); ctx.lineTo(x1, bottom); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#A9744C'; ctx.beginPath(); ctx.moveTo(x0, bottom);
      for (x = x0; x <= x1; x += 14) ctx.lineTo(x, ground(x) + 34); ctx.lineTo(x1, bottom); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#14C8A0'; ctx.lineWidth = 16; ctx.lineJoin = 'round'; ctx.beginPath();
      for (x = x0; x <= x1; x += 14) { if (x === x0) ctx.moveTo(x, ground(x) + 4); else ctx.lineTo(x, ground(x) + 4); } ctx.stroke();
      // distance posts
      ctx.font = K.font(26); ctx.textAlign = 'center'; ctx.fillStyle = '#241B4D';
      for (var m = Math.ceil(x0 / 2500) * 2500; m < x1; m += 2500) { if (m <= 200) continue; var gy = ground(m); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(m - 3, gy - 70, 6, 70); ctx.fillStyle = '#FF5FA2'; K.roundRect(ctx, m - 40, gy - 108, 80, 40, 10); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.fillText(Math.round(m / 50) + 'm', m, gy - 86); }
      // pickups
      coins.forEach(function (c) { K.drawCoin(ctx, c.x, c.y, 16, K.time + c.x * 0.01); });
      cans.forEach(function (c) {
        ctx.save(); ctx.translate(c.x, c.y + Math.sin(K.time * 3 + c.x) * 4);
        ctx.fillStyle = '#E8364F'; K.roundRect(ctx, -20, -26, 40, 52, 8); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.font = K.font(26); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('F', 0, 2);
        ctx.fillStyle = '#B31E35'; ctx.fillRect(-8, -34, 16, 9); ctx.restore();
      });
      // car
      var c = carState();
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
      if (!crashed || state === 'playing') {
        K.drawBubzi(ctx, -4, -44, 26, { mood: state === 'dying' || state === 'over' ? 'sad' : (!grounded ? 'wow' : 'happy'), lookX: 0.6 });
      }
      ctx.fillStyle = '#C25400'; K.roundRect(ctx, -66, -30, 132, 38, 16); ctx.fill();
      ctx.fillStyle = '#FF8A1F'; K.roundRect(ctx, -66, -32, 132, 32, 16); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; K.roundRect(ctx, -54, -27, 46, 8, 4); ctx.fill();
      ctx.fillStyle = '#FFC93C'; ctx.beginPath(); ctx.arc(62, -16, 7, 0, K.TAU); ctx.fill();
      ctx.restore();
      [w1, w2].forEach(function (w) {
        ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(wheelRot);
        ctx.fillStyle = '#241B4D'; ctx.beginPath(); ctx.arc(0, 0, WR, 0, K.TAU); ctx.fill();
        ctx.fillStyle = '#C9B8FF'; ctx.beginPath(); ctx.arc(0, 0, WR * 0.5, 0, K.TAU); ctx.fill();
        ctx.fillStyle = '#5A2EE8'; ctx.fillRect(-2.5, -WR * 0.5, 5, WR); ctx.restore();
      });
      ctx.restore();
      // pedals
      var ps = Math.min(92, W * 0.22), py = H - ps - 16;
      var gOn = keyGas || Object.keys(gas).length > 0, bOn = keyBrake || Object.keys(brake).length > 0;
      [[16, bOn, '#5E5689', -1], [W - ps - 16, gOn, '#14C8A0', 1]].forEach(function (pd) {
        ctx.globalAlpha = pd[1] ? 0.95 : 0.7;
        ctx.fillStyle = 'rgba(36,27,77,0.35)'; K.roundRect(ctx, pd[0], py + 6, ps, ps, 22); ctx.fill();
        ctx.fillStyle = pd[2]; K.roundRect(ctx, pd[0], py + (pd[1] ? 5 : 0), ps, ps, 22); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); var cx = pd[0] + ps / 2, cy = py + ps / 2 + (pd[1] ? 5 : 0);
        ctx.moveTo(cx + pd[3] * ps * 0.22, cy); ctx.lineTo(cx - pd[3] * ps * 0.14, cy - ps * 0.22); ctx.lineTo(cx - pd[3] * ps * 0.14, cy + ps * 0.22); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      });
      if (K.tutorial && state === 'playing' && c.x < 520) { var k = (tutT * 1.3) % 1; K.drawHand(ctx, W - ps / 2 - 16, py + ps * 0.55, k > 0.35, Math.min(W, H) / 190); }
    }
  });
})();
