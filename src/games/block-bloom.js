/* Block Bloom — original block-placement puzzle for Bubzi */
(function () {
  'use strict';
  var N = 8;
  var COLORS = [['#7B4DFF', '#5A2EE8'], ['#FF8A1F', '#D96A00'], ['#14C8A0', '#0A9475'], ['#FF5FA2', '#D43D80'], ['#38B6FF', '#1A86CC'], ['#FFC93C', '#D9A000']];
  // shapes as [row, col] cells, grouped by size tier
  var S = {
    tiny: [[[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0]]],
    small: [[[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 0], [1, 1]],
      [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [1, 1]]],
    mid: [[[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 1], [1, 0], [1, 1], [1, 2]],
      [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [1, 1], [2, 1]], [[0, 1], [0, 2], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 1], [1, 2]],
      [[0, 0], [1, 0], [1, 1], [2, 1]], [[0, 1], [1, 0], [1, 1], [2, 0]]],
    big: [[[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
      [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]], [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
      [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]]]
  };
  var grid, tray, drag, clearing, streak, cs, bx, by, B, ty, th, mood, moodT, sel, cur, placedAny, tutT, kbMode;

  function shapeOf(cells, color) {
    var w = 0, h = 0; cells.forEach(function (c) { h = Math.max(h, c[0] + 1); w = Math.max(w, c[1] + 1); });
    return { cells: cells, w: w, h: h, color: color };
  }
  function randomPiece(K) {
    var s = K.score, r = Math.random(), tier;
    var pBig = Math.min(0.32, 0.06 + s / 9000), pMid = Math.min(0.42, 0.25 + s / 12000), pTiny = Math.max(0.06, 0.22 - s / 6000);
    if (r < pBig) tier = 'big'; else if (r < pBig + pMid) tier = 'mid'; else if (r < pBig + pMid + pTiny) tier = 'tiny'; else tier = 'small';
    return shapeOf(K.pick(S[tier]), K.randi(0, COLORS.length - 1));
  }
  function canPlace(p, r, c) {
    for (var i = 0; i < p.cells.length; i++) {
      var rr = r + p.cells[i][0], cc = c + p.cells[i][1];
      if (rr < 0 || cc < 0 || rr >= N || cc >= N || grid[rr][cc]) return false;
    }
    return true;
  }
  function fitSpot(p) { for (var r = 0; r <= N - p.h; r++) for (var c = 0; c <= N - p.w; c++) if (canPlace(p, r, c)) return { r: r, c: c }; return null; }
  function newTray(K, easy) {
    for (var tries = 0; tries < 30; tries++) {
      tray = [0, 1, 2].map(function () { return easy ? shapeOf(K.pick(S.small.concat(S.tiny)), K.randi(0, COLORS.length - 1)) : randomPiece(K); });
      if (tray.some(function (p) { return fitSpot(p); })) return;
    }
  }
  function layout(K) {
    cs = Math.floor(Math.min((K.W - 24) / N, (K.H - K.hudH - 34) / (N + 3.4)));
    cs = Math.max(18, cs);
    B = cs * N; bx = Math.round((K.W - B) / 2); by = K.hudH + 16;
    ty = by + B + 16; th = Math.max(cs * 2.6, Math.min(cs * 3.2, K.H - ty - 6));
  }
  function slotCenter(i, K) { return { x: K.W / 6 * (2 * i + 1), y: ty + th / 2 }; }
  function trayScale() { return 0.52; }

  function tile(ctx, x, y, s, ci, alpha, K) {
    var col = COLORS[ci];
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    var r = s * 0.24, g = Math.max(1, s * 0.06);
    ctx.fillStyle = col[1]; K.roundRect(ctx, x + g, y + g, s - 2 * g, s - 2 * g, r); ctx.fill();
    ctx.fillStyle = col[0]; K.roundRect(ctx, x + g, y + g, s - 2 * g, s - 2 * g - s * 0.12, r); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.38)'; K.roundRect(ctx, x + s * 0.2, y + s * 0.16, s * 0.34, s * 0.14, s * 0.07); ctx.fill();
    ctx.globalAlpha = 1;
  }
  function drawPiece(ctx, p, x, y, s, alpha, K) { p.cells.forEach(function (c) { tile(ctx, x + c[1] * s, y + c[0] * s, s, p.color, alpha, K); }); }

  function place(p, r, c, K) {
    p.cells.forEach(function (cc) { grid[r + cc[0]][c + cc[1]] = p.color + 1; });
    K.addScore(p.cells.length); K.sfx('place'); K.haptic(10);
    var cx = bx + (c + p.w / 2) * cs, cy = by + (r + p.h / 2) * cs;
    K.burst(cx, cy, COLORS[p.color][0], 8, 120, 3);
    // lines
    var rows = [], cols = [], i, j;
    for (i = 0; i < N; i++) { var fr = true, fc = true; for (j = 0; j < N; j++) { if (!grid[i][j]) fr = false; if (!grid[j][i]) fc = false; } if (fr) rows.push(i); if (fc) cols.push(i); }
    var n = rows.length + cols.length;
    if (n > 0) {
      var cells = {};
      rows.forEach(function (rr) { for (var k = 0; k < N; k++) cells[rr + ',' + k] = 1; });
      cols.forEach(function (cc2) { for (var k = 0; k < N; k++) cells[k + ',' + cc2] = 1; });
      Object.keys(cells).forEach(function (key) {
        var a = key.split(','), rr = +a[0], c2 = +a[1];
        clearing.push({ r: rr, c: c2, ci: grid[rr][c2] - 1, t: 0, d: (Math.abs(rr - r) + Math.abs(c2 - c)) * 0.02 });
        grid[rr][c2] = 0;
      });
      streak++;
      var gain = n * n * 40 + (streak - 1) * 20;
      K.addScore(gain);
      K.floatText(cx, cy - cs, '+' + gain, '#FFFFFF', 30);
      if (n >= 2 || streak >= 2) { K.floatText(K.W / 2, by + B * 0.42, (n >= 2 ? K.t('great') : K.t('combo')) + ' x' + Math.max(n, streak), '#FFC93C', 34); K.sfx('combo'); K.shake(4 + n * 2); }
      else K.sfx('clear');
      K.addCoins(n + (streak >= 3 ? 1 : 0), cx, cy);
      mood = n >= 2 ? 'wow' : 'joy'; moodT = 0.9;
      if (n >= 3) K.confetti(50);
    } else streak = 0;
  }
  function afterPlace(K) {
    if (tray.every(function (p) { return !p; })) newTray(K, false);
    var any = tray.some(function (p) { return p && fitSpot(p); });
    if (!any) { mood = 'sad'; moodT = 99; K.gameOver({ title: K.t('noRoom') }); }
    if (sel >= 0 && !tray[sel]) sel = nextSel(sel);
  }
  function nextSel(from) { for (var k = 1; k <= 3; k++) { var i = (from + k) % 3; if (tray[i]) return i; } return -1; }
  function ghostCell(p) {
    var tlx = drag.x - p.w * cs / 2, tly = drag.y - p.h * cs - cs * 0.9;
    return { r: Math.round((tly - by) / cs), c: Math.round((tlx - bx) / cs), x: tlx, y: tly };
  }

  BubziKit.run({
    id: 'block-bloom', coinRate: 0.01,
    title: { en: 'Block Bloom', fr: 'Block Bloom', ar: 'بلوك بلوم' },
    strings: {
      en: { tagline: 'Fill a row or column to make it bloom!', great: 'Bloom', combo: 'Combo', noRoom: 'No more room!' },
      fr: { tagline: 'Remplis une ligne ou une colonne pour la faire fleurir !', great: 'Floraison', combo: 'Combo', noRoom: 'Plus de place !' },
      ar: { tagline: 'أكمل صفاً أو عموداً لتتفتح الأزهار!', great: 'تفتّح', combo: 'كومبو', noRoom: 'لا مكان بعد الآن!' }
    },
    init: function (K) { layout(K); },
    resize: function (K) { layout(K); },
    reset: function (K) {
      if (K.test) K.dbg = function () { return { grid: grid, tray: tray, cs: cs, bx: bx, by: by, ty: ty, th: th }; };
      grid = []; for (var i = 0; i < N; i++) { grid.push([]); for (var j = 0; j < N; j++) grid[i].push(0); }
      clearing = []; streak = 0; drag = null; mood = 'happy'; moodT = 0; sel = -1; cur = { r: 3, c: 3 }; placedAny = false; tutT = 0; kbMode = false;
      newTray(K, true); layout(K);
    },
    revive: function (K) {
      for (var r = 2; r <= 5; r++) for (var c = 0; c < N; c++) { if (grid[r][c]) clearing.push({ r: r, c: c, ci: grid[r][c] - 1, t: 0, d: c * 0.03 }); grid[r][c] = 0; }
      newTray(K, true); mood = 'happy'; moodT = 0; K.sfx('clear');
    },
    update: function (dt, K) {
      tutT += dt;
      for (var i = clearing.length - 1; i >= 0; i--) {
        var q = clearing[i]; q.t += dt;
        if (q.t > q.d && !q.burst) { q.burst = true; K.burst(bx + (q.c + 0.5) * cs, by + (q.r + 0.5) * cs, [COLORS[q.ci][0], '#FFFFFF', '#FFC93C'], 5, 180, 4); }
        if (q.t > q.d + 0.35) clearing.splice(i, 1);
      }
      if (moodT > 0) { moodT -= dt; if (moodT <= 0) mood = 'happy'; }
    },
    idle: function (dt, K) { for (var i = clearing.length - 1; i >= 0; i--) { clearing[i].t += dt; if (clearing[i].t > clearing[i].d + 0.35) clearing.splice(i, 1); } },
    pointerDown: function (x, y, K) {
      if (drag) return;
      if (y < ty - cs * 0.5) return;
      for (var i = 0; i < 3; i++) {
        var p = tray[i]; if (!p) continue;
        var c = slotCenter(i, K);
        if (Math.abs(x - c.x) < K.W / 6 && Math.abs(y - c.y) < th / 2 + cs * 0.5) {
          drag = { i: i, x: x, y: y }; kbMode = false; sel = -1; K.sfx('grab'); return;
        }
      }
    },
    pointerMove: function (x, y) { if (drag) { drag.x = x; drag.y = y; } },
    pointerUp: function (x, y, K) {
      if (!drag) return;
      drag.x = x; drag.y = y;
      var p = tray[drag.i], g = ghostCell(p);
      if (canPlace(p, g.r, g.c)) {
        tray[drag.i] = null; drag = null; place(p, g.r, g.c, K);
        if (!placedAny) { placedAny = true; K.tutorialDone(); }
        afterPlace(K);
      } else { drag = null; K.sfx('whoosh'); }
    },
    pointerCancel: function () { drag = null; },
    key: function (code, down, K) {
      if (!down) return;
      var d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], KeyW: [-1, 0], KeyS: [1, 0], KeyA: [0, -1], KeyD: [0, 1] }[code];
      var num = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[code];
      if (num !== undefined) { if (tray[num]) { sel = num; kbMode = true; K.sfx('grab'); } return; }
      if (code === 'KeyX' || code === 'Tab') { sel = nextSel(sel < 0 ? 2 : sel); kbMode = true; K.sfx('click'); return; }
      if (d) {
        if (sel < 0) sel = nextSel(2);
        kbMode = true;
        if (sel >= 0) { var p0 = tray[sel]; cur.r = K.clamp(cur.r + d[0], 0, N - p0.h); cur.c = K.clamp(cur.c + d[1], 0, N - p0.w); }
        return;
      }
      if ((code === 'Space' || code === 'Enter') && sel >= 0 && tray[sel]) {
        var p = tray[sel]; cur.r = K.clamp(cur.r, 0, N - p.h); cur.c = K.clamp(cur.c, 0, N - p.w);
        if (canPlace(p, cur.r, cur.c)) {
          tray[sel] = null; place(p, cur.r, cur.c, K);
          if (!placedAny) { placedAny = true; K.tutorialDone(); }
          sel = nextSel(sel); afterPlace(K);
        } else K.sfx('wrong');
      }
    },
    draw: function (ctx, K, state) {
      var g = ctx.createLinearGradient(0, 0, 0, K.H); g.addColorStop(0, '#F4F0FF'); g.addColorStop(1, '#E4DBFF');
      ctx.fillStyle = g; ctx.fillRect(0, 0, K.W, K.H);
      // board
      ctx.fillStyle = '#DCD3FF'; K.roundRect(ctx, bx - 9, by - 9 + 6, B + 18, B + 18, cs * 0.6); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; K.roundRect(ctx, bx - 9, by - 9, B + 18, B + 18, cs * 0.6); ctx.fill();
      var r, c;
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
        if (grid[r][c]) tile(ctx, bx + c * cs, by + r * cs, cs, grid[r][c] - 1, 1, K);
        else { ctx.fillStyle = '#ECE6FF'; K.roundRect(ctx, bx + c * cs + cs * 0.06, by + r * cs + cs * 0.06, cs * 0.88, cs * 0.88, cs * 0.22); ctx.fill(); }
      }
      // clearing → blooming flowers
      clearing.forEach(function (q) {
        var t = Math.max(0, q.t - q.d), x = bx + (q.c + 0.5) * cs, y = by + (q.r + 0.5) * cs;
        if (q.t < q.d) { tile(ctx, x - cs / 2, y - cs / 2, cs, q.ci, 1, K); return; }
        var k = t / 0.35, s = cs * (0.35 + 0.4 * Math.sin(Math.min(1, k) * Math.PI));
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = '#FFFFFF';
        for (var p = 0; p < 5; p++) { var a = p / 5 * K.TAU + t * 4; ctx.beginPath(); ctx.arc(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.32, 0, K.TAU); ctx.fill(); }
        ctx.fillStyle = '#FFC93C'; ctx.beginPath(); ctx.arc(x, y, s * 0.3, 0, K.TAU); ctx.fill();
        ctx.globalAlpha = 1;
      });
      // ghost (drag or keyboard)
      var gp = null, gr = 0, gc = 0;
      if (drag && tray[drag.i]) { gp = tray[drag.i]; var gg = ghostCell(gp); gr = gg.r; gc = gg.c; }
      else if (kbMode && sel >= 0 && tray[sel]) { gp = tray[sel]; gr = cur.r; gc = cur.c; }
      if (gp) {
        var ok = canPlace(gp, gr, gc);
        if (ok || kbMode) {
          gp.cells.forEach(function (cc) {
            var X = bx + (gc + cc[1]) * cs, Y = by + (gr + cc[0]) * cs;
            if (ok) tile(ctx, X, Y, cs, gp.color, 0.35, K);
            else { ctx.strokeStyle = '#E8364F'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); K.roundRect(ctx, X + 3, Y + 3, cs - 6, cs - 6, cs * 0.2); ctx.stroke(); ctx.setLineDash([]); }
          });
        }
      }
      // Bubzi peeking
      var bob = Math.sin(K.time * 3) * 2;
      K.drawBubzi(ctx, bx + B - cs * 0.15, ty - cs * 0.05 + bob, cs * 0.45, { mood: state === 'over' || state === 'dying' ? 'sad' : mood, lookX: drag ? (drag.x - (bx + B)) / 200 : -0.4, lookY: drag ? 1 : 0.4 });
      // tray
      ctx.fillStyle = 'rgba(122,92,255,0.10)'; K.roundRect(ctx, 10, ty, K.W - 20, th, 24); ctx.fill();
      var ts = cs * trayScale();
      for (var i = 0; i < 3; i++) {
        var p = tray[i]; if (!p || (drag && drag.i === i)) continue;
        var sc = slotCenter(i, K), fits = !!fitSpot(p);
        if (kbMode && sel === i) { ctx.strokeStyle = '#5A2EE8'; ctx.lineWidth = 3; K.roundRect(ctx, sc.x - K.W / 6 + 8, ty + 6, K.W / 3 - 16, th - 12, 18); ctx.stroke(); }
        drawPiece(ctx, p, sc.x - p.w * ts / 2, sc.y - p.h * ts / 2, ts, fits ? 1 : 0.35, K);
      }
      if (drag && tray[drag.i]) { var dp = tray[drag.i], gc2 = ghostCell(dp); drawPiece(ctx, dp, gc2.x, gc2.y, cs, 0.95, K); }
      // tutorial: show, don't tell
      if (K.tutorial && !placedAny && !drag && state === 'playing' && tray[0]) {
        var spot = fitSpot(tray[0]);
        if (spot) {
          var p0 = tray[0], s0 = slotCenter(0, K), cyc = (tutT % 2.2) / 2.2, e = Math.min(1, Math.max(0, (cyc - 0.15) / 0.6)); e = e * e * (3 - 2 * e);
          var tx = bx + (spot.c + p0.w / 2) * cs, tyy = by + (spot.r + p0.h) * cs + cs * 0.9;
          var hx = s0.x + (tx - s0.x) * e, hy = s0.y + (tyy - s0.y) * e;
          if (cyc > 0.12 && cyc < 0.85) drawPiece(ctx, p0, hx - p0.w * cs / 2, hy - p0.h * cs - cs * 0.9, cs, 0.5, K);
          K.drawHand(ctx, hx, hy, cyc > 0.12 && cyc < 0.85, cs / 14);
        }
      }
    }
  });
})();
