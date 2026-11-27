/* Jelly Drop — original drop-and-merge physics puzzle for Bubzi */
(function () {
  'use strict';
  var JW = 100, R = [4.6, 6.2, 7.9, 9.7, 11.7, 13.8, 16.1, 18.6, 21.2, 24.5];
  var COL = [['#FF5FA2', '#D43D80'], ['#FF8A1F', '#C25400'], ['#FFC93C', '#C99400'], ['#14C8A0', '#0A9475'], ['#38B6FF', '#1A86CC'],
    ['#B69CFF', '#7B5BE0'], ['#E8364F', '#A81A30'], ['#00A99D', '#00756D'], ['#FF9F80', '#D9643D'], null];
  var PTS = [2, 4, 8, 14, 22, 32, 44, 58, 74, 100];
  var jel, jh, sc, jx, jy, lineY, dropX, cur, next, cool, overT, aiming, keyL, keyR, drops, merges, tutT, idc;

  function layout(K) {
    var availH = K.H - K.hudH - 96, availW = K.W - 28;
    var w = Math.min(availW, availH / 1.32);
    sc = w / JW; jh = Math.min(availH / sc, 140);
    jx = (K.W - w) / 2; jy = K.hudH + 78 + Math.max(0, (availH - jh * sc) - 6);
    lineY = 16;
  }
  function pickNext(K) { var maxL = merges > 25 ? 4 : 3; var r = Math.random(); return r < 0.34 ? 0 : r < 0.62 ? 1 : r < 0.84 ? 2 : K.randi(3, maxL); }
  function drop(K) {
    if (cool > 0 || cur < 0) return;
    var r = R[cur], x = K.clamp(dropX, r + 0.5, JW - r - 0.5);
    jel.push({ id: idc++, l: cur, x: x, y: -r * 0.2, vx: 0, vy: 40, age: 0, sq: 1 });
    cur = next; next = pickNext(K); cool = 0.55; drops++; K.sfx('whoosh');
    if (drops >= 4 && merges > 0) K.tutorialDone();
  }
  function physics(dt, K) {
    var steps = 6, h = dt / steps, i, j, a, b;
    for (var s = 0; s < steps; s++) {
      for (i = 0; i < jel.length; i++) {
        a = jel[i]; a.vy += 300 * h; a.vx *= 0.999; a.vy *= 0.999;
        a.x += a.vx * h; a.y += a.vy * h;
        var r = R[a.l];
        if (a.x < r) { a.x = r; a.vx = Math.abs(a.vx) * 0.2; }
        if (a.x > JW - r) { a.x = JW - r; a.vx = -Math.abs(a.vx) * 0.2; }
        if (a.y > jh - r) { if (a.vy > 60) a.sq = 0.8; a.y = jh - r; a.vy = -Math.abs(a.vy) * 0.12; a.vx *= 0.96; }
      }
      for (i = 0; i < jel.length; i++) {
        a = jel[i]; if (a.dead) continue;
        for (j = i + 1; j < jel.length; j++) {
          b = jel[j]; if (b.dead) continue;
          var ra = R[a.l], rb = R[b.l], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, rr = ra + rb;
          if (d2 >= rr * rr) continue;
          var d = Math.sqrt(d2) || 0.0001, nx = dx / d, ny = dy / d;
          if (a.l === b.l && a.l < 9 && a.age > 0.05 && b.age > 0.05) { merge(K, a, b); break; }
          var ma = ra * ra, mb = rb * rb, tot = ma + mb, ov = rr - d;
          a.x -= nx * ov * mb / tot; a.y -= ny * ov * mb / tot; b.x += nx * ov * ma / tot; b.y += ny * ov * ma / tot;
          var rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) {
            var imp = -(1.1) * rv / (1 / ma + 1 / mb);
            a.vx -= nx * imp / ma; a.vy -= ny * imp / ma; b.vx += nx * imp / mb; b.vy += ny * imp / mb;
            var tx = -ny, ty = nx, rt = (b.vx - a.vx) * tx + (b.vy - a.vy) * ty, f = rt * 0.08;
            a.vx += tx * f * mb / tot; a.vy += ty * f * mb / tot; b.vx -= tx * f * ma / tot; b.vy -= ty * f * ma / tot;
          }
        }
      }
      if (jel.some(function (o) { return o.dead; })) jel = jel.filter(function (o) { return !o.dead; });
    }
  }
  function merge(K, a, b) {
    a.dead = b.dead = true;
    var l = a.l + 1, x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
    var n = { id: idc++, l: l, x: x, y: y, vx: (a.vx + b.vx) / 2, vy: Math.min(0, (a.vy + b.vy) / 2) - 30, age: 0.06, sq: 1.25 };
    jel.push(n); merges++;
    var gain = PTS[l]; K.addScore(gain);
    var sx = jx + x * sc, sy = jy + y * sc;
    K.burst(sx, sy, [COL[a.l] ? COL[a.l][0] : '#7B4DFF', '#FFFFFF'], 10 + l * 2, 140 + l * 25, 4 + l * 0.4);
    K.floatText(sx, sy - R[l] * sc, '+' + gain, '#FFFFFF', 22 + l * 2);
    K.sfx('merge'); K.haptic(10);
    if (l >= 4) K.addCoins(l >= 8 ? 3 : 1, sx, sy - 20);
    if (l >= 6) K.shake(3 + l);
    if (l === 9) { K.confetti(80); K.sfx('star'); K.floatText(K.W / 2, K.H * 0.4, K.t('mega'), '#FFC93C', 40); K.addScore(200); }
    K.tutorialDone();
  }
  function drawJelly(ctx, K, l, x, y, r, sq, mood) {
    if (l === 9) { K.drawBubzi(ctx, x, y, r * 0.95, { squash: sq, mood: mood || 'joy' }); return; }
    var c = COL[l];
    ctx.save(); ctx.translate(x, y); ctx.scale(1 / sq, sq);
    ctx.fillStyle = c[0]; ctx.strokeStyle = c[1]; ctx.lineWidth = Math.max(1.5, r * 0.1);
    ctx.beginPath(); ctx.arc(0, 0, r - ctx.lineWidth / 2, 0, K.TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.45, r * 0.24, r * 0.14, -0.6, 0, K.TAU); ctx.fill();
    var e = r * 0.16, ex = r * 0.3;
    ctx.fillStyle = '#241B4D';
    if (l % 3 === 1) { ctx.lineWidth = Math.max(1.2, r * 0.08); ctx.strokeStyle = '#241B4D'; ctx.lineCap = 'round'; [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(s * ex, -r * 0.02, e, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }); }
    else { ctx.beginPath(); ctx.arc(-ex, -r * 0.05, e, 0, K.TAU); ctx.arc(ex, -r * 0.05, e, 0, K.TAU); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-ex + e * 0.35, -r * 0.05 - e * 0.35, e * 0.35, 0, K.TAU); ctx.arc(ex + e * 0.35, -r * 0.05 - e * 0.35, e * 0.35, 0, K.TAU); ctx.fill(); }
    ctx.strokeStyle = '#241B4D'; ctx.lineWidth = Math.max(1.2, r * 0.08); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.16, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    ctx.restore();
  }

  BubziKit.run({
    id: 'jelly-drop', coinRate: 0.01,
    title: { en: 'Jelly Drop', fr: 'Jelly Drop', ar: 'جيلي دروب' },
    strings: {
      en: { tagline: 'Drop jellies and merge two of a kind to grow!', full: 'The jar is full!', mega: 'Mega Bubzi!', next: 'Next' },
      fr: { tagline: 'Lâche des gelées et fusionne-les deux par deux !', full: 'Le bocal est plein !', mega: 'Méga Bubzi !', next: 'Suivant' },
      ar: { tagline: 'أسقط الجيلي وادمج كل اثنين متشابهين ليكبرا!', full: 'البرطمان ممتلئ!', mega: 'ميغا بوبزي!', next: 'التالي' }
    },
    init: layout, resize: layout,
    reset: function (K) {
      if (K.test) K.dbg = function () { return { jel: jel, jx: jx, jy: jy, sc: sc, cool: cool, R: R, jh: jh }; };
      layout(K); jel = []; idc = 1; drops = 0; merges = 0; cool = 0; overT = 0; aiming = false; keyL = keyR = false; tutT = 0;
      dropX = JW / 2; cur = 0; next = 1;
    },
    revive: function (K) {
      jel = jel.filter(function (o) { return o.y - R[o.l] > lineY + jh * 0.38; });
      overT = 0; cool = 0.3; K.sfx('clear');
    },
    pointerDown: function (x, y, K) { aiming = true; dropX = (x - jx) / sc; },
    pointerMove: function (x, y) { dropX = (x - jx) / sc; },
    pointerUp: function (x, y, K) { if (!aiming) return; aiming = false; dropX = (x - jx) / sc; drop(K); },
    pointerCancel: function () { aiming = false; },
    key: function (code, down, K, rep) {
      if (code === 'ArrowLeft' || code === 'KeyA') keyL = down;
      else if (code === 'ArrowRight' || code === 'KeyD') keyR = down;
      else if (down && !rep && (code === 'Space' || code === 'Enter' || code === 'ArrowDown' || code === 'KeyS')) drop(K);
    },
    update: function (dt, K) {
      tutT += dt; cool = Math.max(0, cool - dt);
      if (keyL) dropX -= 70 * dt; if (keyR) dropX += 70 * dt;
      var rc = R[cur] || 5; dropX = K.clamp(dropX, rc, JW - rc);
      jel.forEach(function (o) { o.age += dt; o.sq += (1 - o.sq) * Math.min(1, dt * 8); });
      physics(dt, K);
      var danger = jel.some(function (o) { return o.age > 1.4 && o.y - R[o.l] < lineY && Math.abs(o.vy) < 120; });
      if (danger) { overT += dt; if (overT > 2.2) { K.gameOver({ title: K.t('full') }); return; } } else overT = Math.max(0, overT - dt * 2);
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H;
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFF4D6'); g.addColorStop(1, '#FFD9EC');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var w = JW * sc, h = jh * sc;
      // jar
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; K.roundRect(ctx, jx - 8, jy - 4, w + 16, h + 12, 22); ctx.fill();
      ctx.strokeStyle = '#C9B8FF'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(jx - 4, jy - 6); ctx.lineTo(jx - 4, jy + h + 4); ctx.lineTo(jx + w + 4, jy + h + 4); ctx.lineTo(jx + w + 4, jy - 6); ctx.stroke();
      // danger line
      var ly = jy + lineY * sc, pulse = overT > 0 ? 0.5 + 0.5 * Math.sin(K.time * 14) : 0.35;
      ctx.strokeStyle = overT > 0 ? 'rgba(232,54,79,' + (0.4 + pulse * 0.6) + ')' : 'rgba(90,46,232,0.25)'; ctx.lineWidth = 3; ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(jx, ly); ctx.lineTo(jx + w, ly); ctx.stroke(); ctx.setLineDash([]);
      // jellies
      jel.forEach(function (o) { drawJelly(ctx, K, o.l, jx + o.x * sc, jy + o.y * sc, R[o.l] * sc, o.sq, state === 'over' ? 'sad' : null); });
      // dropper
      if (cur >= 0 && state !== 'over') {
        var dx = jx + dropX * sc, dy = jy - R[cur] * sc - 10;
        ctx.strokeStyle = 'rgba(36,27,77,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(dx, dy + R[cur] * sc); ctx.lineTo(dx, jy + h); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = cool > 0 ? 0.45 : 1;
        drawJelly(ctx, K, cur, dx, dy + Math.sin(K.time * 4) * 2, R[cur] * sc, 1);
        ctx.globalAlpha = 1;
      }
      K.steady(ctx, function () { // HUD layer: stays still while the scene shakes
      // next preview
      var nx = jx + w - 18, ny = K.hudH + 26;
      ctx.fillStyle = '#FFFFFF'; K.roundRect(ctx, nx - 46, ny - 22, 64, 44, 16); ctx.fill();
      ctx.fillStyle = '#5E5689'; ctx.font = K.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(K.t('next'), nx - 26, ny);
      drawJelly(ctx, K, next, nx + 2, ny, Math.min(14, R[next] * sc), 1);
      // evolution strip
      var sx0 = jx, sy0 = jy + h + 22, step = w / 10;
      if (sy0 + 14 < H) for (var l = 0; l < 10; l++) drawJelly(ctx, K, l, sx0 + step * (l + 0.5), sy0, Math.min(step * 0.42, 4 + l * 0.9), 1);
      // tutorial
      if (K.tutorial && state === 'playing' && drops < 3) {
        var k = (tutT * 0.7) % 1, hx = jx + w * (0.3 + 0.4 * Math.sin(k * Math.PI)), hy = jy + h * 0.25;
        K.drawHand(ctx, hx, hy, k > 0.05 && k < 0.95, Math.min(W, H) / 200);
      }
      });
    }
  });
})();
