/* Bubzi key-art renderer: draws original thumbnails, category icons and social images.
   Loaded by tools/art/art.html, driven by tools/render-art.js (Playwright). */
(function () {
  'use strict';
  var A = window.BubziArt, TAU = Math.PI * 2;
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function lin(c, x0, y0, x1, y1, stops) { var g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
  function rad(c, x, y, r0, r1, stops) { var g = c.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
  function bg(c, W, H, c1, c2, glow) {
    c.fillStyle = lin(c, 0, 0, W * 0.4, H, [[0, c1], [1, c2]]); c.fillRect(0, 0, W, H);
    c.fillStyle = rad(c, W * 0.5, H * 0.35, 0, W * 0.75, [[0, glow || 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]); c.fillRect(0, 0, W, H);
  }
  function rays(c, cx, cy, n, len, color, rot) {
    c.save(); c.translate(cx, cy); c.rotate(rot || 0); c.fillStyle = color;
    for (var i = 0; i < n; i++) { var a = i / n * TAU; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, len, a, a + TAU / n / 2.2); c.closePath(); c.fill(); }
    c.restore();
  }
  function bokeh(c, W, H, n, seed, colors) {
    var r = rng(seed);
    for (var i = 0; i < n; i++) { var x = r() * W, y = r() * H, s = 6 + r() * 30; c.globalAlpha = 0.12 + r() * 0.25; c.fillStyle = colors[i % colors.length]; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
  }
  function sparkle(c, x, y, s, color) {
    c.save(); c.translate(x, y); c.fillStyle = color || '#FFFFFF';
    c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(0, 0, s, 0); c.quadraticCurveTo(0, 0, 0, s); c.quadraticCurveTo(0, 0, -s, 0); c.quadraticCurveTo(0, 0, 0, -s); c.fill(); c.restore();
  }
  function vignette(c, W, H, a) { c.fillStyle = rad(c, W / 2, H / 2, W * 0.35, W * 0.78, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(10,5,30,' + (a || 0.45) + ')']]); c.fillRect(0, 0, W, H); }
  function shadowOn(c, blur, y, col) { c.shadowColor = col || 'rgba(20,8,60,0.45)'; c.shadowBlur = blur; c.shadowOffsetY = y; c.shadowOffsetX = 0; }
  function shadowOff(c) { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; }
  function tile(c, x, y, s, col, dark, rot) {
    c.save(); c.translate(x + s / 2, y + s / 2); if (rot) c.rotate(rot);
    shadowOn(c, s * 0.25, s * 0.12);
    c.fillStyle = dark; A.roundRect(c, -s / 2, -s / 2, s, s, s * 0.24); c.fill(); shadowOff(c);
    c.fillStyle = lin(c, 0, -s / 2, 0, s / 2, [[0, col], [1, dark]]); A.roundRect(c, -s / 2, -s / 2, s, s - s * 0.12, s * 0.24); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.45)'; A.roundRect(c, -s * 0.32, -s * 0.36, s * 0.38, s * 0.13, s * 0.07); c.fill();
    c.restore();
  }
  function bubzi(c, x, y, r, o) { c.save(); shadowOn(c, r * 0.4, r * 0.18); A.drawBubzi(c, x, y, r, o); c.restore(); }
  function coin(c, x, y, r, t) { c.save(); shadowOn(c, r * 0.6, r * 0.25, 'rgba(120,60,0,0.35)'); A.drawCoin(c, x, y, r, t); c.restore(); }
  function speedLines(c, x, y, n, len, ang, col) {
    c.save(); c.translate(x, y); c.rotate(ang); c.strokeStyle = col || 'rgba(255,255,255,0.8)'; c.lineCap = 'round';
    for (var i = 0; i < n; i++) { c.lineWidth = 6 - i * 0.6; var yy = (i - n / 2) * 18; c.beginPath(); c.moveTo(-len - i * 12, yy); c.lineTo(-30 - i * 6, yy); c.stroke(); }
    c.restore();
  }
  function flower(c, x, y, s) {
    c.fillStyle = '#FFFFFF'; for (var p = 0; p < 5; p++) { var a = p / 5 * TAU; c.beginPath(); c.arc(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.36, 0, TAU); c.fill(); }
    c.fillStyle = '#FFC93C'; c.beginPath(); c.arc(x, y, s * 0.32, 0, TAU); c.fill();
  }
  function jelly(c, x, y, r, col, dark, eyesClosed) {
    c.save(); shadowOn(c, r * 0.35, r * 0.15);
    c.fillStyle = rad(c, x - r * 0.3, y - r * 0.4, r * 0.1, r * 1.2, [[0, col], [1, dark]]); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); shadowOff(c);
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(x - r * 0.4, y - r * 0.45, r * 0.25, r * 0.14, -0.6, 0, TAU); c.fill();
    c.fillStyle = '#241B4D'; c.strokeStyle = '#241B4D'; c.lineWidth = r * 0.09; c.lineCap = 'round';
    if (eyesClosed) { [-1, 1].forEach(function (s) { c.beginPath(); c.arc(x + s * r * 0.3, y, r * 0.15, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }); }
    else { c.beginPath(); c.arc(x - r * 0.3, y - r * 0.02, r * 0.15, 0, TAU); c.arc(x + r * 0.3, y - r * 0.02, r * 0.15, 0, TAU); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x - r * 0.25, y - r * 0.08, r * 0.05, 0, TAU); c.arc(x + r * 0.35, y - r * 0.08, r * 0.05, 0, TAU); c.fill(); }
    c.beginPath(); c.arc(x, y + r * 0.22, r * 0.17, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
    c.restore();
  }
  function bubble(c, x, y, r, rim, txt) {
    c.save(); shadowOn(c, r * 0.3, r * 0.1, 'rgba(60,0,80,0.3)');
    c.fillStyle = rad(c, x - r * 0.3, y - r * 0.35, r * 0.1, r * 1.1, [[0, 'rgba(255,255,255,0.98)'], [0.7, 'rgba(255,240,250,0.85)'], [1, 'rgba(255,220,245,0.6)']]);
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); shadowOff(c);
    c.lineWidth = r * 0.1; c.strokeStyle = rim; c.stroke();
    c.fillStyle = 'rgba(255,255,255,1)'; c.beginPath(); c.ellipse(x - r * 0.42, y - r * 0.45, r * 0.2, r * 0.11, -0.6, 0, TAU); c.fill();
    c.fillStyle = '#241B4D'; c.font = '800 ' + Math.round(r * (txt.length > 2 ? 0.7 : 0.95)) + 'px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x, y + r * 0.08);
    c.restore();
  }

  function stickLimb(c, pts, lw, col) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
  function stickman(c, J, lw, col, back, outline) {
    [outline ? [outline, lw + 6] : null, [null, lw]].forEach(function (ps) {
      if (!ps) return; var o = ps[0];
      stickLimb(c, J.bl, ps[1], o || back); stickLimb(c, J.ba, ps[1], o || back);
      stickLimb(c, [J.hip, J.neck], ps[1], o || col); stickLimb(c, J.fl, ps[1], o || col); stickLimb(c, J.fa, ps[1], o || col);
      c.fillStyle = o || col; c.beginPath(); c.arc(J.head[0], J.head[1], J.r + (o ? 3 : 0), 0, TAU); c.fill();
    });
  }
  function splat(c, x, y, r, col, seed) { var R = rng(seed); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); for (var i = 0; i < 9; i++) { var a = R() * TAU, d = r * (0.9 + R() * 0.9), s = r * (0.12 + R() * 0.28); c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, s, 0, TAU); c.fill(); } }
  var GAMES = {
    'block-bloom': function (c, W, H) {
      bg(c, W, H, '#2A1380', '#8A5CFF', 'rgba(255,200,255,0.45)');
      rays(c, W * 0.55, H * 0.3, 16, W, 'rgba(255,255,255,0.07)', 0.2);
      bokeh(c, W, H, 26, 3, ['#FFFFFF', '#FFC93C', '#FF8FC4']);
      c.save(); c.translate(W * 0.5, H * 0.72); c.rotate(-0.22); c.transform(1, 0, -0.25, 0.8, 0, 0);
      shadowOn(c, 40, 24); c.fillStyle = '#FFFFFF'; A.roundRect(c, -W * 0.46, -H * 0.3, W * 0.92, H * 0.6, 34); c.fill(); shadowOff(c);
      var cols = [['#7B4DFF', '#4A22C9'], ['#FF8A1F', '#D96A00'], ['#14C8A0', '#0A9475'], ['#FF5FA2', '#D43D80'], ['#38B6FF', '#1A86CC']], R = rng(5), s = W * 0.135;
      for (var r = 0; r < 4; r++) for (var k = 0; k < 6; k++) {
        var x = -W * 0.42 + k * s * 1.02, y = -H * 0.27 + r * s * 1.02;
        if (r === 1) { c.fillStyle = 'rgba(255,214,90,0.9)'; A.roundRect(c, x + 3, y + 3, s - 6, s - 6, s * 0.24); c.fill(); continue; }
        if (R() < 0.25) { c.fillStyle = '#ECE6FF'; A.roundRect(c, x + 4, y + 4, s - 8, s - 8, s * 0.24); c.fill(); continue; }
        var cc = cols[Math.floor(R() * cols.length)]; tile(c, x, y, s, cc[0], cc[1]);
      }
      c.restore();
      c.fillStyle = 'rgba(255,230,120,0.55)'; c.beginPath(); c.ellipse(W * 0.45, H * 0.62, W * 0.48, H * 0.07, -0.22, 0, TAU); c.fill();
      [[0.18, 0.6, 22], [0.36, 0.56, 28], [0.55, 0.52, 24], [0.74, 0.47, 30], [0.88, 0.44, 20]].forEach(function (f) { flower(c, W * f[0], H * f[1], f[2]); });
      tile(c, W * 0.06, H * 0.12, W * 0.13, '#FF8A1F', '#D96A00', -0.3); tile(c, W * 0.19, H * 0.12, W * 0.13, '#FF8A1F', '#D96A00', -0.3); tile(c, W * 0.2, H * 0.25, W * 0.13, '#FF8A1F', '#D96A00', -0.3);
      bubzi(c, W * 0.66, H * 0.3, W * 0.2, { mood: 'joy' });
      sparkle(c, W * 0.88, H * 0.14, 18); sparkle(c, W * 0.42, H * 0.12, 12, '#FFE58A'); sparkle(c, W * 0.9, H * 0.4, 10);
      vignette(c, W, H, 0.35);
    },
    'rooftop-rush': function (c, W, H) {
      c.fillStyle = lin(c, 0, 0, 0, H, [[0, '#5B2BE0'], [0.45, '#FF5FA2'], [0.75, '#FFA45B']]); c.fillRect(0, 0, W, H);
      c.fillStyle = rad(c, W * 0.5, H * 0.52, 10, W * 0.42, [[0, 'rgba(255,240,170,1)'], [0.35, 'rgba(255,214,110,0.9)'], [1, 'rgba(255,214,110,0)']]); c.fillRect(0, 0, W, H);
      rays(c, W * 0.5, H * 0.52, 20, W, 'rgba(255,255,255,0.08)', 0.1);
      var R = rng(9);
      [['#9B5CE0', 0.5], ['#5A2EB8', 0.6]].forEach(function (L, li) {
        c.fillStyle = L[0];
        for (var x = -20; x < W + 40; x += 46 + li * 10) { var h = H * (0.12 + R() * 0.16) * (li ? 1.1 : 0.8); c.fillRect(x, H * L[1] - h, 40 + li * 8, h + H); if (li) { c.fillStyle = 'rgba(255,225,140,0.85)'; for (var wy = H * L[1] - h + 10; wy < H * L[1] - 8; wy += 16) { if (R() < 0.7) c.fillRect(x + 8, wy, 7, 7); if (R() < 0.7) c.fillRect(x + 28, wy, 7, 7); } c.fillStyle = L[0]; } }
      });
      c.fillStyle = '#C9B8FF'; c.beginPath(); c.moveTo(W * 0.38, H * 0.62); c.lineTo(W * 0.62, H * 0.62); c.lineTo(W * 1.15, H); c.lineTo(-W * 0.15, H); c.closePath(); c.fill();
      c.fillStyle = '#4A2E9C'; c.beginPath(); c.moveTo(W * 0.36, H * 0.62); c.lineTo(W * 0.38, H * 0.62); c.lineTo(-W * 0.15, H); c.lineTo(-W * 0.25, H); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(W * 0.62, H * 0.62); c.lineTo(W * 0.64, H * 0.62); c.lineTo(W * 1.25, H); c.lineTo(W * 1.15, H); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 5; c.setLineDash([18, 16]);
      [[0.46, 0.25], [0.54, 0.75]].forEach(function (l) { c.beginPath(); c.moveTo(W * l[0], H * 0.62); c.lineTo(W * l[1], H); c.stroke(); }); c.setLineDash([]);
      c.save(); shadowOn(c, 14, 8); c.fillStyle = '#E8664F'; A.roundRect(c, W * 0.6, H * 0.5, W * 0.09, H * 0.13, 6); c.fill(); shadowOff(c); c.fillStyle = '#FFB199'; c.fillRect(W * 0.6, H * 0.5, W * 0.09, 6); c.restore();
      for (var i = 0; i < 6; i++) coin(c, W * (0.2 + i * 0.05), H * (0.55 - Math.sin(i / 5 * Math.PI) * 0.12), 13 + i * 1.5, i * 0.5);
      speedLines(c, W * 0.42, H * 0.62, 5, 150, -0.15);
      bubzi(c, W * 0.55, H * 0.66, W * 0.2, { mood: 'wow', angle: -0.18, squash: 1.08, lookX: 0.6, lookY: -0.4 });
      sparkle(c, W * 0.85, H * 0.2, 16); sparkle(c, W * 0.12, H * 0.3, 11);
      vignette(c, W, H, 0.4);
    },
    'hop-hook': function (c, W, H) {
      bg(c, W, H, '#1E8BFF', '#9BE7FF', 'rgba(255,255,255,0.5)');
      var R = rng(21); c.fillStyle = 'rgba(255,255,255,0.9)';
      [[0.15, 0.65, 50], [0.8, 0.25, 60], [0.55, 0.85, 70]].forEach(function (k) { var x = W * k[0], y = H * k[1], r = k[2]; c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r, y + r * 0.2, r * 0.75, 0, TAU); c.arc(x - r, y + r * 0.25, r * 0.65, 0, TAU); c.fill(); });
      void R;
      var hx = W * 0.25, hy = H * 0.2, px = W * 0.62, py = H * 0.6;
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.setLineDash([10, 14]); c.lineWidth = 5; c.beginPath(); c.arc(hx, hy, Math.hypot(px - hx, py - hy), 0.2, 1.55); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#FF5FA2'; c.beginPath(); c.ellipse(hx, hy - 62, 32, 38, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(hx - 11, hy - 75, 8, 13, -0.4, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(36,27,77,0.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(hx, hy - 24); c.lineTo(hx, hy - 14); c.stroke();
      c.lineCap = 'round'; c.strokeStyle = '#241B4D'; c.lineWidth = 15; c.beginPath(); c.moveTo(hx, hy); c.lineTo(px, py); c.stroke();
      c.strokeStyle = '#FFFFFF'; c.lineWidth = 9; c.beginPath(); c.moveTo(hx, hy); c.lineTo(px, py); c.stroke();
      c.lineWidth = 14; c.strokeStyle = '#241B4D'; c.beginPath(); c.arc(hx, hy, 24, 0, TAU); c.stroke(); c.lineWidth = 9; c.strokeStyle = '#FFC93C'; c.stroke();
      c.save(); c.translate(W * 0.88, H * 0.42); c.lineWidth = 12; c.strokeStyle = '#241B4D'; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.stroke(); c.lineWidth = 7; c.strokeStyle = '#FFC93C'; c.stroke(); c.restore();
      speedLines(c, px - 40, py + 10, 4, 120, -0.6);
      bubzi(c, px, py, W * 0.19, { mood: 'joy', angle: -0.45 });
      for (var i = 0; i < 5; i++) coin(c, W * (0.66 + i * 0.06), H * (0.32 - i * 0.03 + i * i * 0.008), 13, i);
      c.fillStyle = '#38B6FF'; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 16) c.lineTo(x, H * 0.9 + Math.sin(x * 0.04) * 8); c.lineTo(W, H); c.fill();
      c.fillStyle = '#1A86CC'; c.fillRect(0, H * 0.95, W, H * 0.05);
      sparkle(c, W * 0.45, H * 0.1, 14); sparkle(c, W * 0.92, H * 0.68, 12);
      vignette(c, W, H, 0.3);
    },
    'number-pop': function (c, W, H) {
      bg(c, W, H, '#FF4F9A', '#6A3DF5', 'rgba(255,230,250,0.5)');
      rays(c, W * 0.5, H * 0.45, 14, W, 'rgba(255,255,255,0.08)', 0.3);
      bokeh(c, W, H, 30, 7, ['#FFFFFF', '#FFE58A']);
      bubble(c, W * 0.3, H * 0.5, W * 0.17, '#FF8A1F', '7');
      bubble(c, W * 0.7, H * 0.32, W * 0.2, '#14C8A0', '12');
      bubble(c, W * 0.78, H * 0.72, W * 0.12, '#38B6FF', '9');
      bubble(c, W * 0.12, H * 0.2, W * 0.08, '#FFC93C', '3');
      c.save(); shadowOn(c, 20, 10); c.fillStyle = '#241B4D'; A.roundRect(c, W * 0.14, H * 0.07, W * 0.46, H * 0.13, H * 0.065); c.fill(); shadowOff(c);
      c.fillStyle = '#FFFFFF'; c.font = '800 ' + Math.round(H * 0.085) + 'px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('3 + 4', W * 0.37, H * 0.14); c.restore();
      bubzi(c, W * 0.42, H * 0.83, W * 0.16, { mood: 'wow', lookX: -0.5, lookY: -1 });
      sparkle(c, W * 0.55, H * 0.55, 16); sparkle(c, W * 0.92, H * 0.12, 12); sparkle(c, W * 0.06, H * 0.82, 12, '#FFE58A');
      vignette(c, W, H, 0.3);
    },
    'hill-hopper': function (c, W, H) {
      c.fillStyle = lin(c, 0, 0, 0, H, [[0, '#2DB7FF'], [1, '#C8F7FF']]); c.fillRect(0, 0, W, H);
      c.fillStyle = rad(c, W * 0.8, H * 0.18, 0, W * 0.4, [[0, 'rgba(255,245,180,1)'], [0.3, 'rgba(255,230,140,0.8)'], [1, 'rgba(255,230,140,0)']]); c.fillRect(0, 0, W, H);
      [['#A7F0C9', 0.62, 0.012, 40], ['#4FD69B', 0.74, 0.016, 34], ['#14C8A0', 0.86, 0.02, 26]].forEach(function (L) {
        c.fillStyle = L[0]; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 8) c.lineTo(x, H * L[1] + Math.sin(x * L[2] + L[3]) * L[3]); c.lineTo(W, H); c.fill();
      });
      c.fillStyle = '#8B5E3C'; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 8) c.lineTo(x, H * 0.93 + Math.sin(x * 0.02 + 26) * 12); c.lineTo(W, H); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)'; [[0.2, 0.8, 30], [0.3, 0.85, 22], [0.14, 0.86, 18]].forEach(function (d) { c.beginPath(); c.arc(W * d[0], H * d[1], d[2], 0, TAU); c.fill(); });
      c.save(); c.translate(W * 0.52, H * 0.5); c.rotate(-0.32); c.scale(W / 330, W / 330);
      shadowOn(c, 30, 18);
      A.drawBubzi(c, -6, -48, 30, { mood: 'joy' });
      c.fillStyle = '#C25400'; A.roundRect(c, -70, -32, 140, 42, 18); c.fill(); shadowOff(c);
      c.fillStyle = lin(c, 0, -34, 0, 6, [[0, '#FFB35A'], [1, '#FF8A1F']]); A.roundRect(c, -70, -34, 140, 34, 18); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)'; A.roundRect(c, -56, -28, 50, 8, 4); c.fill();
      c.fillStyle = '#FFE58A'; c.beginPath(); c.arc(66, -16, 8, 0, TAU); c.fill();
      [-44, 44].forEach(function (wx) { c.fillStyle = '#241B4D'; c.beginPath(); c.arc(wx, 14, 24, 0, TAU); c.fill(); c.fillStyle = '#C9B8FF'; c.beginPath(); c.arc(wx, 14, 11, 0, TAU); c.fill(); });
      c.restore();
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.arc(W * 0.52, H * 0.5, W * 0.33, Math.PI * 1.1, Math.PI * 1.55); c.stroke();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(W * 0.62, H * 0.17); c.lineTo(W * 0.58, H * 0.12); c.lineTo(W * 0.57, H * 0.21); c.fill();
      for (var i = 0; i < 4; i++) coin(c, W * (0.72 + i * 0.07), H * (0.38 + i * 0.03), 14, i);
      sparkle(c, W * 0.2, H * 0.2, 14);
      vignette(c, W, H, 0.3);
    },
    'jelly-drop': function (c, W, H) {
      bg(c, W, H, '#FFB13B', '#FF4F9A', 'rgba(255,250,220,0.55)');
      rays(c, W * 0.5, H * 0.3, 18, W, 'rgba(255,255,255,0.09)', 0);
      bokeh(c, W, H, 20, 11, ['#FFFFFF']);
      var jx = W * 0.16, jy = H * 0.32, jw = W * 0.68, jh = H * 0.62;
      c.save(); shadowOn(c, 30, 14); c.fillStyle = 'rgba(255,255,255,0.35)'; A.roundRect(c, jx, jy, jw, jh, 40); c.fill(); shadowOff(c); c.restore();
      c.save(); A.roundRect(c, jx, jy, jw, jh, 40); c.clip();
      var J = [[0.27, 0.86, 0.12, '#38B6FF', '#1A86CC'], [0.52, 0.85, 0.13, '#14C8A0', '#0A9475'], [0.75, 0.87, 0.1, '#FF8A1F', '#C25400'], [0.38, 0.66, 0.1, '#FFC93C', '#C99400', 1], [0.63, 0.67, 0.11, '#E8364F', '#A81A30'], [0.8, 0.7, 0.06, '#FF5FA2', '#D43D80', 1], [0.24, 0.68, 0.06, '#B69CFF', '#7B5BE0']];
      J.forEach(function (j) { jelly(c, W * j[0], H * j[1], W * j[2], j[3], j[4], j[5]); });
      c.restore();
      c.lineWidth = 10; c.strokeStyle = 'rgba(255,255,255,0.85)'; A.roundRect(c, jx, jy, jw, jh, 40); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)'; A.roundRect(c, jx + 18, jy + 30, 14, jh * 0.5, 7); c.fill();
      bubzi(c, W * 0.5, H * 0.33, W * 0.18, { mood: 'joy', squash: 0.95 });
      jelly(c, W * 0.2, H * 0.14, W * 0.06, '#FF5FA2', '#D43D80'); jelly(c, W * 0.84, H * 0.18, W * 0.05, '#38B6FF', '#1A86CC', 1);
      sparkle(c, W * 0.72, H * 0.1, 16); sparkle(c, W * 0.3, H * 0.28, 10);
      vignette(c, W, H, 0.3);
    },
    'memo-match': function (c, W, H) {
      bg(c, W, H, '#0FB892', '#3B5BFF', 'rgba(220,255,245,0.5)');
      rays(c, W * 0.5, H * 0.55, 16, W, 'rgba(255,255,255,0.07)', 0.2);
      bokeh(c, W, H, 22, 13, ['#FFFFFF', '#FFE58A']);
      function card(x, y, rot, face) {
        c.save(); c.translate(x, y); c.rotate(rot); var cw = W * 0.27, ch = cw * 1.32;
        shadowOn(c, 26, 14); c.fillStyle = face ? '#FFFFFF' : '#5A2EE8'; A.roundRect(c, -cw / 2, -ch / 2, cw, ch, 22); c.fill(); shadowOff(c);
        if (!face) { c.fillStyle = '#7B4DFF'; A.roundRect(c, -cw / 2 + 12, -ch / 2 + 12, cw - 24, ch - 24, 16); c.fill(); A.drawBubzi(c, 0, 4, cw * 0.24, { color: '#FFFFFF', dark: '#C9B8FF' }); }
        else if (face === 'star') { c.fillStyle = '#FFC93C'; A.star(c, cw * 0.32); }
        else if (face === 'heart') { var r = cw * 0.3; c.fillStyle = '#FF5FA2'; c.beginPath(); c.moveTo(0, r * 0.8); c.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.6, -r * 1.1, 0, -r * 0.4); c.bezierCurveTo(r * 0.6, -r * 1.1, r * 1.3, -r * 0.1, 0, r * 0.8); c.fill(); }
        else if (face === 'moon') { var m = cw * 0.3; c.fillStyle = '#7B4DFF'; c.beginPath(); c.arc(0, 0, m, Math.PI * 0.35, Math.PI * 1.65); c.arc(m * 0.4, -m * 0.05, m * 0.75, Math.PI * 1.45, Math.PI * 0.55, true); c.fill(); }
        c.restore();
      }
      card(W * 0.24, H * 0.56, -0.32, 'heart'); card(W * 0.76, H * 0.56, 0.32, 'moon'); card(W * 0.42, H * 0.52, -0.1, 0); card(W * 0.6, H * 0.5, 0.12, 'star');
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 5; c.lineCap = 'round';
      [[0.6, 0.22], [0.69, 0.25], [0.52, 0.25]].forEach(function (p, i) { c.beginPath(); c.moveTo(W * p[0], H * p[1]); c.lineTo(W * (p[0] + (i - 1) * 0.03), H * (p[1] - 0.06)); c.stroke(); });
      bubzi(c, W * 0.5, H * 0.86, W * 0.15, { mood: 'happy', lookY: -1 });
      sparkle(c, W * 0.85, H * 0.18, 18); sparkle(c, W * 0.14, H * 0.22, 12, '#FFE58A');
      vignette(c, W, H, 0.3);
    },
    'ink-heroes': function (c, W, H) {
      c.fillStyle = lin(c, 0, 0, 0, H, [[0, '#4A2B6E'], [0.5, '#E0775C'], [0.85, '#FFC587']]); c.fillRect(0, 0, W, H);
      c.fillStyle = rad(c, W * 0.62, H * 0.5, 10, W * 0.5, [[0, 'rgba(255,240,190,1)'], [0.3, 'rgba(255,200,120,0.6)'], [1, 'rgba(255,200,120,0)']]); c.fillRect(0, 0, W, H);
      rays(c, W * 0.62, H * 0.5, 18, W, 'rgba(255,255,255,0.07)', 0.2);
      var R = rng(31);
      [['#9A6286', 0.62, 0.9], ['#5E3B60', 0.74, 1.15]].forEach(function (L) { c.fillStyle = L[0]; for (var x = -20; x < W + 40; x += 52) { var h = H * (0.1 + R() * 0.2) * L[2]; c.fillRect(x, H * L[1] - h, 46, h + H); c.beginPath(); c.moveTo(x, H * L[1] - h); c.lineTo(x + 18, H * L[1] - h - 14); c.lineTo(x + 30, H * L[1] - h); c.fill(); } });
      c.fillStyle = '#3A2440'; c.fillRect(0, H * 0.84, W, H * 0.16);
      c.fillStyle = rad(c, W * 0.42, H * 0.55, 0, W * 0.3, [[0, 'rgba(255,245,215,0.85)'], [1, 'rgba(255,245,215,0)']]); c.fillRect(0, 0, W, H);
      splat(c, W * 0.14, H * 0.9, W * 0.06, 'rgba(15,10,20,0.9)', 4);
      splat(c, W * 0.66, H * 0.86, W * 0.04, '#8DB34E', 12);
      // zombies
      var zl = W * 0.026;
      function zombie(x, y, s, col, tilt) {
        var r = 15 * s, hip = [x, y - 52 * s], neck = [x + Math.sin(tilt) * 40 * s, y - 52 * s - Math.cos(tilt) * 40 * s];
        stickman(c, { hip: hip, neck: neck, head: [neck[0] + 6 * s, neck[1] - 18 * s], r: r,
          bl: [hip, [x - 14 * s, y - 26 * s], [x - 20 * s, y]], fl: [hip, [x + 12 * s, y - 26 * s], [x + 8 * s, y]],
          ba: [neck, [neck[0] - 24 * s, neck[1] + 4 * s], [neck[0] - 46 * s, neck[1] + 2 * s]], fa: [neck, [neck[0] - 26 * s, neck[1] - 2 * s], [neck[0] - 50 * s, neck[1] - 8 * s]] }, zl * s, col, '#3F5A1E', '#1A1020');
        c.fillStyle = '#F4FFB0'; c.shadowColor = '#E8FF5A'; c.shadowBlur = 10; c.beginPath(); c.arc(neck[0] - 2 * s, neck[1] - 20 * s, 3.2 * s, 0, TAU); c.arc(neck[0] - 10 * s, neck[1] - 19 * s, 2.6 * s, 0, TAU); c.fill(); c.shadowBlur = 0;
      }
      zombie(W * 0.9, H * 0.86, W * 0.003, '#8A63C9', -0.3);
      zombie(W * 0.74, H * 0.86, W * 0.0026, '#8DB34E', -0.55);
      // hero: flying kick
      var s = W * 0.0036, hx = W * 0.4, hy = H * 0.6, hip = [hx, hy], neck = [hx - 28 * s, hy - 34 * s];
      var J = { hip: hip, neck: neck, head: [neck[0] - 12 * s, neck[1] - 16 * s], r: 15 * s,
        fl: [hip, [hx + 28 * s, hy - 6 * s], [hx + 58 * s, hy - 12 * s]], bl: [hip, [hx - 8 * s, hy + 26 * s], [hx - 34 * s, hy + 34 * s]],
        fa: [neck, [neck[0] + 10 * s, neck[1] + 18 * s], [neck[0] + 26 * s, neck[1] + 8 * s]], ba: [neck, [neck[0] - 22 * s, neck[1] + 10 * s], [neck[0] - 44 * s, neck[1] + 2 * s]] };
      c.strokeStyle = '#FF3B4E'; c.lineCap = 'round'; c.lineWidth = 9 * s; c.beginPath(); c.moveTo(neck[0], neck[1]); c.bezierCurveTo(neck[0] - 40 * s, neck[1] - 10 * s, neck[0] - 60 * s, neck[1] + 30 * s, neck[0] - 100 * s, neck[1] + 10 * s); c.stroke();
      c.save(); shadowOn(c, 24, 10, 'rgba(0,0,0,0.4)'); stickman(c, J, 11 * s, '#111111', '#2B2B2B', null); c.restore();
      c.fillStyle = '#FF3B4E'; c.fillRect(J.head[0] - J.r, J.head[1] - J.r * 0.45, J.r * 2, J.r * 0.42);
      // impact
      var ix = hx + 64 * s, iy = hy - 12 * s; c.save(); c.translate(ix, iy); c.fillStyle = '#FFE58A'; A.star(c, 26 * s); c.fillStyle = '#FFFFFF'; A.star(c, 13 * s); c.restore();
      speedLines(c, hx - 40 * s, hy - 10 * s, 5, 90, 0.15, 'rgba(255,255,255,0.8)');
      for (var i = 0; i < 14; i++) { c.fillStyle = i % 2 ? '#8DB34E' : '#C3DC3E'; c.beginPath(); c.arc(ix + (R() - 0.1) * 60, iy + (R() - 0.5) * 50, 2 + R() * 5, 0, TAU); c.fill(); }
      vignette(c, W, H, 0.4);
    },
    'spear-hills': function (c, W, H) {
      c.fillStyle = lin(c, 0, 0, 0, H, [[0, '#5EC8FF'], [0.65, '#CFF0FF'], [1, '#FFF1C9']]); c.fillRect(0, 0, W, H);
      rays(c, W * 0.8, H * 0.18, 14, W, 'rgba(255,255,255,0.12)', 0.1);
      c.save(); shadowOn(c, 40, 0, 'rgba(255,220,90,0.9)'); c.fillStyle = '#FFE066'; c.beginPath(); c.arc(W * 0.8, H * 0.18, W * 0.09, 0, TAU); c.fill(); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.9)'; [[0.15, 0.14, 1], [0.48, 0.24, 0.8]].forEach(function (k) { var x = W * k[0], y = H * k[1], r = W * 0.045 * k[2]; c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * 1.1, y - r * 0.4, r * 1.2, 0, TAU); c.arc(x + r * 2.2, y, r * 0.9, 0, TAU); c.fill(); });
      function hill(cx, cy, rx, col) { c.fillStyle = col; c.beginPath(); c.ellipse(cx, cy, rx, rx * 0.55, 0, Math.PI, 0); c.lineTo(cx + rx, H); c.lineTo(cx - rx, H); c.fill(); }
      hill(W * 0.5, H * 0.95, W * 0.7, '#A8E6A1');
      hill(W * 0.12, H * 0.8, W * 0.32, '#7ED957'); hill(W * 0.9, H * 0.84, W * 0.32, '#7ED957');
      c.fillStyle = '#5BBF3A'; c.fillRect(0, H * 0.93, W, H * 0.07);
      var s = W / 512;
      function fighter(x, y, dir, col, throwing) {
        var hip = [x, y - 34 * s], neck = [x + dir * 4 * s, y - 66 * s];
        var J = { hip: hip, neck: neck, head: [neck[0] + dir * 3 * s, neck[1] - 17 * s], r: 15 * s,
          fl: [hip, [x + dir * 12 * s, y - 16 * s], [x + dir * 18 * s, y]], bl: [hip, [x - dir * 10 * s, y - 16 * s], [x - dir * 16 * s, y]],
          fa: throwing ? [neck, [neck[0] - dir * 18 * s, neck[1] - 14 * s], [neck[0] - dir * 30 * s, neck[1] - 24 * s]] : [neck, [neck[0] + dir * 14 * s, neck[1] + 10 * s], [neck[0] + dir * 24 * s, neck[1] - 4 * s]],
          ba: throwing ? [neck, [neck[0] + dir * 18 * s, neck[1] + 2 * s], [neck[0] + dir * 32 * s, neck[1] - 8 * s]] : [neck, [neck[0] - dir * 12 * s, neck[1] + 18 * s], [neck[0] - dir * 18 * s, neck[1] + 30 * s]] };
        c.save(); shadowOn(c, 14 * s, 6 * s, 'rgba(20,8,60,0.35)'); stickman(c, J, 9 * s, '#241B4D', '#3A2E70', '#FFFFFF'); c.restore();
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(J.head[0], J.head[1], J.r - 4 * s, 0, TAU); c.fill();
        c.fillStyle = '#241B4D'; [-1, 1].forEach(function (e) { c.beginPath(); c.arc(J.head[0] + dir * 4 * s + e * 4 * s, J.head[1] - 1 * s, 2.4 * s, 0, TAU); c.fill(); });
        c.fillStyle = col; c.fillRect(J.head[0] - J.r, J.head[1] - J.r * 0.75, J.r * 2, J.r * 0.45);
        c.beginPath(); c.moveTo(J.head[0] - dir * J.r, J.head[1] - J.r * 0.6); c.lineTo(J.head[0] - dir * (J.r + 18 * s), J.head[1] - J.r * 0.1); c.lineTo(J.head[0] - dir * (J.r + 16 * s), J.head[1] - J.r * 0.9); c.fill();
        return J;
      }
      var J1 = fighter(W * 0.14, H * 0.78, 1, '#7B4DFF', true);
      var J2 = fighter(W * 0.86, H * 0.8, -1, '#FF5E5B', false);
      // flying spear with a dotted arc
      c.fillStyle = 'rgba(255,255,255,0.9)';
      for (var i = 0; i < 9; i++) { var t = i / 8, x = W * (0.22 + t * 0.4), y = H * (0.52 - Math.sin(t * Math.PI * 0.8) * 0.22); c.beginPath(); c.arc(x, y, (3 + t * 3) * s, 0, TAU); c.fill(); }
      c.save(); c.translate(W * 0.7, H * 0.36); c.rotate(0.35); c.scale(s * 1.9, s * 1.9);
      shadowOn(c, 10, 4, 'rgba(20,8,60,0.35)');
      c.strokeStyle = '#8A5A2B'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-70, 0); c.lineTo(0, 0); c.stroke(); shadowOff(c);
      c.fillStyle = '#DCE4EE'; c.beginPath(); c.moveTo(18, 0); c.lineTo(-4, -9); c.lineTo(-4, 9); c.closePath(); c.fill();
      c.fillStyle = '#FF5FA2'; c.beginPath(); c.moveTo(-70, 0); c.lineTo(-84, -9); c.lineTo(-80, 0); c.lineTo(-84, 9); c.closePath(); c.fill();
      c.restore();
      speedLines(c, W * 0.5, H * 0.32, 4, 70 * s, 0.35, 'rgba(255,255,255,0.85)');
      sparkle(c, W * 0.86, H * 0.5, 14 * s, '#FFD23F'); sparkle(c, W * 0.3, H * 0.3, 10 * s);
      vignette(c, W, H, 0.25);
    },
    'arrow-rampart': function (c, W, H) {
      c.fillStyle = lin(c, 0, 0, 0, H, [[0, '#7FD0FF'], [1, '#E6F7FF']]); c.fillRect(0, 0, W, H);
      var s = Math.min(W, H) / 512, gy = H * 0.84, wx = W * 0.5 - 250 * s + 150 * s;
      rays(c, W * 0.8, H * 0.2, 12, W, 'rgba(255,255,255,0.12)', 0.1);
      c.fillStyle = '#BFE8B0'; c.beginPath(); c.moveTo(0, gy); for (var x = 0; x <= W; x += 16) c.lineTo(x, gy - 70 * s - Math.sin(x * 0.01) * 25 * s); c.lineTo(W, gy); c.fill();
      c.fillStyle = '#7ED957'; c.fillRect(0, gy, W, H); c.fillStyle = '#5BBF3A'; c.fillRect(0, gy + 18 * s, W, H);
      // wall
      var wt = gy - 230 * s; shadowOn(c, 20 * s, 6 * s); c.fillStyle = '#8F88B0'; c.fillRect(0, wt, wx, gy - wt + 4); shadowOff(c);
      c.fillStyle = '#B4AED0'; c.fillRect(0, wt, wx - 10 * s, gy - wt + 4);
      c.strokeStyle = 'rgba(80,70,120,0.35)'; c.lineWidth = 3 * s; for (var r = 0; wt + r * 34 * s < gy; r++) { var yy = wt + r * 34 * s; c.beginPath(); c.moveTo(0, yy); c.lineTo(wx - 10 * s, yy); c.stroke(); for (var k = (r % 2) * 0.5; k * 64 * s < wx; k++) { c.beginPath(); c.moveTo(k * 64 * s, yy); c.lineTo(k * 64 * s, yy + 34 * s); c.stroke(); } }
      for (x = 0; x < wx - 4; x += 76 * s) { c.fillStyle = '#B4AED0'; c.fillRect(x, wt - 36 * s, Math.min(38 * s, wx - x), 38 * s); }
      // archer
      c.save(); c.translate(wx - 62 * s, wt - 62 * s); c.scale(s * 2.05, s * 2.05);
      c.fillStyle = '#6A55E0'; A.roundRect(c, -14, -4, 28, 30, 10); c.fill();
      c.fillStyle = '#FFD9B8'; c.beginPath(); c.arc(0, -18, 12, 0, TAU); c.fill();
      c.fillStyle = '#3FA34D'; c.beginPath(); c.arc(0, -20, 14, Math.PI * 0.95, Math.PI * 2.05); c.lineTo(-18, -6); c.fill();
      c.fillStyle = '#E8364F'; c.beginPath(); c.moveTo(-3, -33); c.lineTo(-20, -42); c.lineTo(-8, -29); c.fill();
      c.fillStyle = '#241B4D'; c.beginPath(); c.arc(5, -17, 2, 0, TAU); c.fill();
      c.rotate(-0.35); c.strokeStyle = '#8A5A2B'; c.lineWidth = 4.5; c.lineCap = 'round'; c.beginPath(); c.arc(8, 0, 24, -1.15, 1.15); c.stroke();
      c.strokeStyle = '#F4EFE4'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(8 + Math.cos(1.15) * 24, -Math.sin(1.15) * 24); c.lineTo(-10, 0); c.lineTo(8 + Math.cos(1.15) * 24, Math.sin(1.15) * 24); c.stroke();
      c.fillStyle = '#8A5A2B'; c.fillRect(-10, -1, 44, 2); c.fillStyle = '#9AA7B8'; c.beginPath(); c.moveTo(34, -3); c.lineTo(42, 0); c.lineTo(34, 3); c.fill();
      c.restore();
      // flying arrows
      function arrow(x, y, a, L) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#8A5A2B'; c.fillRect(-L, -2.5 * s, L, 5 * s); c.fillStyle = '#9AA7B8'; c.beginPath(); c.moveTo(0, -7 * s); c.lineTo(14 * s, 0); c.lineTo(0, 7 * s); c.fill(); c.fillStyle = '#E8364F'; c.beginPath(); c.moveTo(-L, 0); c.lineTo(-L - 10 * s, -8 * s); c.lineTo(-L + 12 * s, 0); c.lineTo(-L - 10 * s, 8 * s); c.fill(); c.restore(); }
      speedLines(c, W * 0.62, H * 0.36, 3, 60 * s, 0.25, 'rgba(255,255,255,0.8)');
      arrow(W * 0.66, H * 0.38, 0.3, 70 * s); arrow(W * 0.6, H * 0.47, 0.42, 70 * s);
      // raiders
      function raider(x, sz, col, dark, helm) {
        var y = gy, q = sz * s; c.save(); c.translate(x, y); shadowOn(c, 12 * s, 5 * s);
        c.fillStyle = dark; c.fillRect(-18 * q, -24 * q, 12 * q, 24 * q); c.fillRect(6 * q, -24 * q, 12 * q, 24 * q);
        c.fillStyle = col; A.roundRect(c, -32 * q, -90 * q, 64 * q, 68 * q, 26 * q); c.fill(); shadowOff(c);
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-14 * q, -62 * q, 9 * q, 0, TAU); c.arc(6 * q, -62 * q, 9 * q, 0, TAU); c.fill();
        c.fillStyle = '#241B4D'; c.beginPath(); c.arc(-17 * q, -61 * q, 4.5 * q, 0, TAU); c.arc(3 * q, -61 * q, 4.5 * q, 0, TAU); c.fill();
        c.strokeStyle = '#241B4D'; c.lineWidth = 3 * q; c.beginPath(); c.moveTo(-24 * q, -74 * q); c.lineTo(-8 * q, -70 * q); c.moveTo(14 * q, -74 * q); c.lineTo(0, -70 * q); c.stroke();
        c.fillStyle = helm; c.beginPath(); c.arc(-3 * q, -86 * q, 28 * q, Math.PI, 0); c.fill();
        c.save(); c.translate(-30 * q, -50 * q); c.rotate(-0.6); c.fillStyle = '#8A5A2B'; A.roundRect(c, -4 * q, -48 * q, 9 * q, 48 * q, 4 * q); c.fill(); c.fillStyle = '#A8733E'; c.beginPath(); c.arc(0, -48 * q, 10 * q, 0, TAU); c.fill(); c.restore();
        c.restore();
      }
      raider(W * 0.95, 1.5, '#B98BFF', '#6A43C2', '#6E6890'); raider(W * 0.78, 1.15, '#7ED957', '#3C9A1E', '#A9A3C4');
      // a hit sparkle on the near raider
      for (var i = 0; i < 6; i++) { var a = i / 6 * TAU; sparkle(c, W * 0.78 + Math.cos(a) * 40 * s, gy - 90 * s + Math.sin(a) * 40 * s, 9 * s, i % 2 ? '#FFFFFF' : '#FFD23F'); }
      arrow(W * 0.76, gy - 95 * s, 0.55, 60 * s);
      vignette(c, W, H, 0.2);
    },
    'bubble-bastion': function (c, W, H) {
      c.fillStyle = lin(c, 0, 0, 0, H, [[0, '#9BE37A'], [1, '#5BBF3A']]); c.fillRect(0, 0, W, H);
      var s = Math.min(W, H) / 512, cx = W / 2, cy = H / 2, r = rng(7);
      c.fillStyle = 'rgba(255,255,255,0.12)'; var q = 64 * s;
      for (var gx = 0; gx * q < W; gx++) for (var gy = 0; gy * q < H; gy++) if ((gx + gy) % 2) c.fillRect(gx * q, gy * q, q, q);
      for (var i = 0; i < 14; i++) flower(c, r() * W, r() * H, 7 * s);
      // winding stream
      var pts = [[-0.1, 0.18], [0.62, 0.18], [0.62, 0.5], [0.3, 0.5], [0.3, 0.82], [1.1, 0.82]].map(function (p) { return [cx + (p[0] - 0.5) * 512 * s * (W > H ? W / H : 1), cy + (p[1] - 0.5) * 512 * s]; });
      c.lineCap = 'round'; c.lineJoin = 'round';
      [['#C8B07A', 92], ['#5CC8F2', 78], ['#8EDDFB', 50]].forEach(function (L) { c.strokeStyle = L[0]; c.lineWidth = L[1] * s; c.beginPath(); pts.forEach(function (p, i) { if (!i) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]); }); c.stroke(); });
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 6 * s; c.setLineDash([16 * s, 34 * s]); c.beginPath(); pts.forEach(function (p, i) { if (!i) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]); }); c.stroke(); c.setLineDash([]);
      function bub(x, y, rr, col) {
        c.save(); shadowOn(c, rr * 0.4, rr * 0.15, 'rgba(20,60,40,0.35)');
        c.fillStyle = rad(c, x - rr * 0.35, y - rr * 0.4, rr * 0.1, rr, [[0, '#FFFFFF'], [0.4, col], [1, col]]); c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); shadowOff(c);
        c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = rr * 0.09; c.beginPath(); c.arc(x, y, rr * 0.95, 0, TAU); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(x - rr * 0.4, y - rr * 0.45, rr * 0.22, rr * 0.12, -0.6, 0, TAU); c.fill();
        c.fillStyle = '#241B4D'; c.beginPath(); c.arc(x - rr * 0.26, y, rr * 0.11, 0, TAU); c.arc(x + rr * 0.26, y, rr * 0.11, 0, TAU); c.fill();
        c.strokeStyle = '#241B4D'; c.lineWidth = rr * 0.08; c.lineCap = 'round'; c.beginPath(); c.arc(x, y + rr * 0.2, rr * 0.15, 0.2, Math.PI - 0.2); c.stroke();
      }
      function tower(x, y, k) {
        c.save(); c.translate(x, y); c.scale(s * 2.6, s * 2.6); shadowOn(c, 10, 4);
        c.fillStyle = k ? '#B4461A' : '#1A6FB0'; A.roundRect(c, -15, -2, 30, 16, 6); c.fill(); shadowOff(c);
        c.fillStyle = k ? '#FF7F45' : '#38B6FF'; A.roundRect(c, -15, -5, 30, 15, 6); c.fill();
        if (k) { c.save(); c.translate(0, -6); c.rotate(-0.7); c.fillStyle = '#4A3C78'; A.roundRect(c, -6, -16, 12, 18, 4); c.fill(); c.restore(); c.fillStyle = '#FF7F45'; c.beginPath(); c.arc(0, -3, 9, Math.PI, 0); c.fill(); }
        else { c.save(); c.rotate(-2.4); c.fillStyle = '#E8EEF6'; c.fillRect(0, -2.2, 20, 4.4); c.fillStyle = '#9AA7B8'; c.beginPath(); c.moveTo(20, -2.2); c.lineTo(27, 0); c.lineTo(20, 2.2); c.fill(); c.restore();
          c.fillStyle = '#38B6FF'; c.beginPath(); c.arc(0, -6, 10, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(-3, -9, 3.5, 0, TAU); c.fill(); }
        c.fillStyle = '#FFD23F'; for (var p = 0; p < 3; p++) { c.save(); c.translate(-8 + p * 8, 8); A.star(c, 3.6); c.restore(); }
        c.restore();
      }
      bub(pts[1][0] - 150 * s, pts[1][1], 34 * s, '#FF8FB8'); bub(pts[1][0] - 40 * s, pts[1][1], 30 * s, '#8FD3FF');
      bub(pts[2][0], pts[2][1] - 70 * s, 38 * s, '#B9A2FF'); bub(pts[3][0] + 90 * s, pts[3][1], 28 * s, '#8FF0C4');
      tower(cx - 120 * s, cy - 70 * s, 0); tower(cx + 110 * s, cy + 90 * s, 1);
      // a popping bubble
      var px = pts[3][0], py = pts[3][1] + 80 * s; c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 5 * s; c.beginPath(); c.arc(px, py, 40 * s, 0, TAU); c.stroke();
      for (i = 0; i < 8; i++) { var a = i / 8 * TAU; sparkle(c, px + Math.cos(a) * 58 * s, py + Math.sin(a) * 58 * s, 9 * s, i % 2 ? '#FFFFFF' : '#FFD23F'); }
      c.strokeStyle = '#E8EEF6'; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(cx - 50 * s, cy - 20 * s); c.lineTo(px + 10 * s, py - 30 * s); c.stroke();
      vignette(c, W, H, 0.2);
    },
    'tiny-siege': function (c, W, H) {
      c.fillStyle = lin(c, 0, 0, 0, H, [[0, '#6FC9FF'], [0.6, '#D9F2FF'], [1, '#FFF1C9']]); c.fillRect(0, 0, W, H);
      rays(c, W * 0.5, H * 0.3, 14, W, 'rgba(255,255,255,0.1)', 0.2);
      var s = W / 512, gy = H * 0.7;
      c.fillStyle = '#CDEFD0'; c.beginPath(); c.moveTo(0, gy); for (var x = 0; x <= W; x += 16) c.lineTo(x, gy - 90 * s - Math.sin(x * 0.012) * 30 * s); c.lineTo(W, gy); c.fill();
      c.fillStyle = '#7ED957'; c.fillRect(0, gy - 14 * s, W, H); c.fillStyle = '#E3C48F'; c.fillRect(0, gy - 6 * s, W, H * 0.2); c.fillStyle = '#5BBF3A'; c.fillRect(0, gy + H * 0.2 - 6 * s, W, H);
      function tower(x, col, tilt) {
        c.save(); c.translate(x, gy); c.rotate(tilt); shadowOn(c, 20 * s, 8 * s);
        var w = 84 * s, h = 190 * s; c.fillStyle = '#A9A3C4'; c.fillRect(-w / 2, -h, w, h); shadowOff(c);
        c.fillStyle = '#C9C3E0'; c.fillRect(-w / 2, -h, w * 0.55, h);
        for (var i = 0; i < 5; i += 2) { c.fillStyle = '#C9C3E0'; c.fillRect(-w / 2 + i * w / 5, -h - 20 * s, w / 5, 22 * s); }
        c.fillStyle = '#5E4426'; c.beginPath(); c.arc(0, -26 * s, 18 * s, Math.PI, 0); c.lineTo(18 * s, 0); c.lineTo(-18 * s, 0); c.fill();
        c.strokeStyle = '#5E4426'; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(0, -h - 20 * s); c.lineTo(0, -h - 80 * s); c.stroke();
        c.fillStyle = col; c.beginPath(); c.moveTo(0, -h - 80 * s); c.quadraticCurveTo(26 * s, -h - 76 * s, 48 * s, -h - 66 * s); c.quadraticCurveTo(26 * s, -h - 56 * s, 0, -h - 50 * s); c.fill();
        c.restore();
      }
      tower(W * 0.1, '#7B4DFF', 0);
      tower(W * 0.92, '#FF5E5B', 0.12);
      c.strokeStyle = 'rgba(36,27,77,0.55)'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(W * 0.88, gy - 150 * s); c.lineTo(W * 0.92, gy - 115 * s); c.lineTo(W * 0.89, gy - 80 * s); c.stroke();
      // dust + impact on the enemy tower
      c.save(); c.translate(W * 0.86, gy - 110 * s); c.fillStyle = '#FFE58A'; A.star(c, 34 * s); c.fillStyle = '#FFFFFF'; A.star(c, 16 * s); c.restore();
      function fig(x, y, k, col, dark, kind, run) {
        c.save(); c.translate(x, y); c.scale(k * s, k * s); shadowOn(c, 6, 3, 'rgba(20,8,60,0.3)');
        c.strokeStyle = dark; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(-12, 0); c.lineTo(0, -16); c.lineTo(10 + run * 4, -2); c.moveTo(0, -16); c.lineTo(5, -32); c.moveTo(5, -30); c.lineTo(-6, -20); c.moveTo(5, -30); c.lineTo(16, -36); c.stroke();
        shadowOff(c);
        if (kind === 'sword') { c.strokeStyle = '#DCE4EE'; c.lineWidth = 4; c.beginPath(); c.moveTo(16, -36); c.lineTo(30, -52); c.stroke(); }
        if (kind === 'club') { c.fillStyle = '#8A5A2B'; c.save(); c.translate(16, -36); c.rotate(-0.9); c.fillRect(0, -3, 22, 6); c.beginPath(); c.arc(22, 0, 7, 0, TAU); c.fill(); c.restore(); }
        if (kind === 'bow') { c.strokeStyle = '#8A5A2B'; c.lineWidth = 3; c.beginPath(); c.arc(14, -36, 12, -1.2, 1.2); c.stroke(); }
        c.fillStyle = '#FFFFFF'; c.strokeStyle = dark; c.lineWidth = 3.5; c.beginPath(); c.arc(7, -42, 8, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = dark; c.beginPath(); c.arc(10, -43, 1.6, 0, TAU); c.fill();
        c.fillStyle = col; c.fillRect(-1, -48, 16, 4); c.beginPath(); c.moveTo(-1, -47); c.lineTo(-10, -42); c.lineTo(-8, -50); c.fill();
        c.restore();
      }
      fig(W * 0.62, gy + 36 * s, 2.0, '#7B4DFF', '#2A1A6B', 'sword', 1);
      fig(W * 0.47, gy + 62 * s, 2.3, '#7B4DFF', '#2A1A6B', 'sword', 0);
      fig(W * 0.3, gy + 30 * s, 1.8, '#7B4DFF', '#2A1A6B', 'bow', 0);
      fig(W * 0.36, gy + 90 * s, 3.2, '#7B4DFF', '#2A1A6B', 'club', 1);
      c.save(); c.translate(W * 0.78, gy + 30 * s); c.rotate(0.9); c.translate(-W * 0.78, -gy - 30 * s); fig(W * 0.78, gy + 30 * s, 1.8, '#FF5E5B', '#5A1620', 'sword', 0); c.restore();
      // arrows in flight
      [[0.42, 0.32], [0.55, 0.26], [0.66, 0.3]].forEach(function (a) { c.save(); c.translate(W * a[0], H * a[1]); c.rotate(0.2); c.strokeStyle = '#6B4420'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(-20 * s, 0); c.lineTo(12 * s, 0); c.stroke(); c.fillStyle = '#DCE4EE'; c.beginPath(); c.moveTo(18 * s, 0); c.lineTo(8 * s, -6 * s); c.lineTo(8 * s, 6 * s); c.fill(); c.restore(); });
      coin(c, W * 0.14, gy + 88 * s, 22 * s, 0); coin(c, W * 0.22, gy + 100 * s, 16 * s, 0.4);
      sparkle(c, W * 0.75, H * 0.16, 12 * s); sparkle(c, W * 0.2, H * 0.12, 9 * s, '#FFE58A');
      vignette(c, W, H, 0.28);
    },
    'merge-blasters': function (c, W, H) {
      bg(c, W, H, '#2A7BFF', '#7FE0FF', 'rgba(220,250,255,0.5)');
      bokeh(c, W, H, 14, 77, ['#FFFFFF', '#B9F0FF']);
      var s = W / 512;
      jelly(c, W * 0.2, H * 0.2, 40 * s, '#FFA0A8', '#E2445A');
      jelly(c, W * 0.52, H * 0.12, 30 * s, '#C9A8FF', '#7B4DFF', true);
      jelly(c, W * 0.8, H * 0.26, 46 * s, '#8CF5C8', '#18B57A');
      // shots
      c.fillStyle = '#FFFFFF'; [[0.34, 0.42], [0.42, 0.33], [0.66, 0.4], [0.74, 0.32]].forEach(function (p) { c.beginPath(); c.arc(W * p[0], H * p[1], 7 * s, 0, TAU); c.fill(); });
      c.save(); c.translate(W * 0.69, H * 0.33); c.fillStyle = '#FFE58A'; A.star(c, 22 * s); c.fillStyle = '#FFFFFF'; A.star(c, 14 * s); c.restore();
      // wall
      c.fillStyle = '#8F63FF'; c.fillRect(0, H * 0.54, W, H * 0.05);
      for (var i = 0; i < 6; i++) { c.fillStyle = '#B596FF'; A.roundRect(c, i * W / 6 + 4 * s, H * 0.545, W / 6 - 8 * s, H * 0.035, 6 * s); c.fill(); }
      // blasters: two merging into a bigger one
      function blaster(x, y, r, col, dark, n, ang) {
        c.save(); c.translate(x, y); shadowOn(c, r * 0.4, r * 0.2);
        c.save(); c.rotate(ang); c.fillStyle = '#3A2E70'; A.roundRect(c, -r * 0.22, -r * 1.45, r * 0.44, r * 1.0, r * 0.12); c.fill(); c.restore();
        c.fillStyle = rad(c, -r * 0.3, -r * 0.35, r * 0.1, r * 1.2, [[0, col], [1, dark]]); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); shadowOff(c);
        c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.4, r * 0.28, r * 0.15, -0.6, 0, TAU); c.fill();
        c.fillStyle = '#FFFFFF'; c.font = '800 ' + Math.round(r * 0.95) + 'px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, 0, r * 0.08);
        c.restore();
      }
      blaster(W * 0.2, H * 0.8, 46 * s, '#9BEA6A', '#3FA82C', '2', -0.3);
      blaster(W * 0.8, H * 0.8, 46 * s, '#9BEA6A', '#3FA82C', '2', 0.3);
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 8 * s; c.lineCap = 'round';
      [[1, 0.31], [-1, 0.69]].forEach(function (k) { var x = W * k[1]; c.beginPath(); c.moveTo(x - k[0] * 20 * s, H * 0.8); c.lineTo(x + k[0] * 20 * s, H * 0.8); c.moveTo(x + k[0] * 6 * s, H * 0.77); c.lineTo(x + k[0] * 20 * s, H * 0.8); c.lineTo(x + k[0] * 6 * s, H * 0.83); c.stroke(); });
      c.save(); shadowOn(c, 40, 0, 'rgba(255,230,120,0.9)'); c.fillStyle = 'rgba(255,240,170,0.5)'; c.beginPath(); c.arc(W * 0.5, H * 0.78, 80 * s, 0, TAU); c.fill(); c.restore();
      blaster(W * 0.5, H * 0.78, 66 * s, '#FFC86A', '#F08A00', '3', 0);
      sparkle(c, W * 0.62, H * 0.66, 14 * s); sparkle(c, W * 0.38, H * 0.9, 10 * s, '#FFE58A');
      vignette(c, W, H, 0.3);
    },
    'wiggle-snake': function (c, W, H) {
      bg(c, W, H, '#0C8F6E', '#8BEA5B', 'rgba(240,255,210,0.45)');
      c.globalAlpha = 0.08; c.fillStyle = '#FFFFFF'; var s = W / 8; for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) if ((x + y) % 2) c.fillRect(x * s, y * s, s, s); c.globalAlpha = 1;
      var pts = [[0.06, 0.92], [0.22, 0.86], [0.36, 0.72], [0.3, 0.56], [0.18, 0.44], [0.24, 0.3], [0.42, 0.24], [0.58, 0.34], [0.62, 0.5]];
      c.lineCap = 'round'; c.lineJoin = 'round';
      [['rgba(20,8,60,0.3)', 0.17, 10], ['#4A22C9', 0.16, 0], ['#7B4DFF', 0.13, 0]].forEach(function (L) {
        c.strokeStyle = L[0]; c.lineWidth = W * L[1]; c.beginPath();
        pts.forEach(function (p, i) { var X = W * p[0], Y = H * p[1] + L[2]; if (!i) c.moveTo(X, Y); else { var q = pts[i - 1]; c.quadraticCurveTo(W * q[0], H * q[1] + L[2], (X + W * q[0]) / 2, (Y + H * q[1] + L[2]) / 2); } });
        c.stroke();
      });
      c.fillStyle = 'rgba(255,255,255,0.35)'; pts.forEach(function (p, i) { if (i % 2) { c.beginPath(); c.arc(W * p[0] - 10, H * p[1] - 12, 9, 0, TAU); c.fill(); } });
      bubzi(c, W * 0.64, H * 0.52, W * 0.13, { mood: 'happy', lookX: 1, lookY: 0.4 });
      c.save(); shadowOn(c, 20, 10); var ax = W * 0.83, ay = H * 0.66, ar = W * 0.08;
      c.fillStyle = rad(c, ax - ar * 0.3, ay - ar * 0.2, 4, ar * 1.5, [[0, '#FF6A7E'], [1, '#C21E36']]); c.beginPath(); c.arc(ax - ar * 0.35, ay, ar, 0, TAU); c.arc(ax + ar * 0.35, ay, ar, 0, TAU); c.fill(); shadowOff(c);
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.ellipse(ax - ar * 0.6, ay - ar * 0.35, ar * 0.22, ar * 0.13, -0.5, 0, TAU); c.fill();
      c.fillStyle = '#14C8A0'; c.beginPath(); c.ellipse(ax + ar * 0.3, ay - ar * 1.1, ar * 0.45, ar * 0.2, -0.5, 0, TAU); c.fill(); c.restore();
      c.save(); c.translate(W * 0.8, H * 0.2); c.rotate(0.3); shadowOn(c, 24, 0, 'rgba(255,220,80,0.9)'); c.fillStyle = '#FFC93C'; A.star(c, W * 0.09); shadowOff(c); c.restore();
      sparkle(c, W * 0.9, H * 0.36, 12); sparkle(c, W * 0.5, H * 0.1, 14);
      vignette(c, W, H, 0.35);
    }
  };

  function glossy(c, path, x, y, s, col, dark) {
    c.save(); c.translate(x, y); c.scale(s, s);
    shadowOn(c, 18 / s, 10 / s, 'rgba(10,5,40,0.45)'); c.fillStyle = dark; path(c); c.fill(); shadowOff(c);
    c.translate(0, -4); c.fillStyle = lin(c, 0, -50, 0, 50, [[0, col], [1, dark]]); path(c); c.fill();
    c.save(); path(c); c.clip(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-18, -30, 34, 14, -0.4, 0, TAU); c.fill(); c.restore();
    c.restore();
  }
  var ICONS = {
    puzzle: function (c, W) { glossy(c, function (k) { k.beginPath(); k.moveTo(-40, -40); k.lineTo(-10, -40); k.arc(0, -46, 13, Math.PI * 0.8, Math.PI * 0.2, false); k.lineTo(40, -40); k.lineTo(40, -10); k.arc(46, 0, 13, Math.PI * 1.3, Math.PI * 0.7, false); k.lineTo(40, 40); k.lineTo(-40, 40); k.closePath(); }, W / 2, W / 2, W / 130, '#B69CFF', '#5A2EE8'); },
    bolt: function (c, W) { glossy(c, function (k) { k.beginPath(); k.moveTo(10, -52); k.lineTo(-34, 6); k.lineTo(-4, 6); k.lineTo(-14, 52); k.lineTo(34, -8); k.lineTo(4, -8); k.closePath(); }, W / 2, W / 2, W / 125, '#FFD36B', '#FF7A00'); },
    target: function (c, W) {
      glossy(c, function (k) { k.beginPath(); k.arc(0, 0, 48, 0, TAU); }, W / 2, W / 2, W / 125, '#FF8AA8', '#D4234A');
      c.save(); c.translate(W / 2, W / 2 - 4 * W / 125); c.scale(W / 125, W / 125);
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, 32, 0, TAU); c.fill(); c.fillStyle = '#E8364F'; c.beginPath(); c.arc(0, 0, 21, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill(); c.restore();
    },
    learn: function (c, W) {
      glossy(c, function (k) { k.beginPath(); k.arc(0, 0, 48, 0, TAU); }, W / 2, W / 2, W / 125, '#7FF0D0', '#0A9475');
      c.save(); c.translate(W / 2, W / 2 - 4 * W / 125); c.scale(W / 125, W / 125); c.fillStyle = '#FFFFFF'; c.font = '800 44px "Baloo 2", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1+2', 0, 4); c.restore();
    },
    car: function (c, W) {
      glossy(c, function (k) { k.beginPath(); k.moveTo(-50, 10); k.quadraticCurveTo(-50, -6, -36, -8); k.lineTo(-20, -30); k.quadraticCurveTo(-14, -36, -4, -36); k.lineTo(20, -36); k.quadraticCurveTo(30, -36, 34, -28); k.lineTo(44, -8); k.quadraticCurveTo(52, -6, 52, 6); k.lineTo(52, 18); k.lineTo(-50, 18); k.closePath(); }, W / 2, W / 2, W / 120, '#FFB35A', '#E35D00');
      c.save(); c.translate(W / 2, W / 2); c.scale(W / 120, W / 120); c.fillStyle = 'rgba(200,235,255,0.95)'; c.beginPath(); c.moveTo(-14, -12); c.lineTo(-4, -30); c.lineTo(14, -30); c.lineTo(26, -12); c.closePath(); c.fill();
      [-28, 30].forEach(function (x) { c.fillStyle = '#241B4D'; c.beginPath(); c.arc(x, 20, 14, 0, TAU); c.fill(); c.fillStyle = '#C9B8FF'; c.beginPath(); c.arc(x, 20, 6, 0, TAU); c.fill(); }); c.restore();
    },
    clock: function (c, W) {
      glossy(c, function (k) { k.beginPath(); k.arc(0, 6, 44, 0, TAU); k.rect(-10, -52, 20, 14); }, W / 2, W / 2, W / 125, '#FFE58A', '#F2A300');
      c.save(); c.translate(W / 2, W / 2); c.scale(W / 125, W / 125); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 2, 32, 0, TAU); c.fill();
      c.strokeStyle = '#241B4D'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 2); c.lineTo(0, -18); c.moveTo(0, 2); c.lineTo(14, 10); c.stroke(); c.restore();
    },
    bulb: function (c, W) {
      glossy(c, function (k) { k.beginPath(); k.arc(0, -10, 38, Math.PI * 0.8, Math.PI * 0.2); k.lineTo(14, 30); k.lineTo(-14, 30); k.closePath(); }, W / 2, W / 2, W / 125, '#FFF1A8', '#FFB000');
      c.save(); c.translate(W / 2, W / 2); c.scale(W / 125, W / 125); c.fillStyle = '#5E5689'; A.roundRect(c, -15, 30, 30, 16, 5); c.fill(); c.restore();
    },
    chest: function (c, W) {
      var k = W / 125; c.save(); c.translate(W / 2, W / 2 + 6 * k); c.scale(k, k);
      shadowOn(c, 16, 8, 'rgba(40,10,0,0.45)'); c.fillStyle = '#8B4A12'; A.roundRect(c, -46, -8, 92, 50, 10); c.fill(); shadowOff(c);
      c.fillStyle = lin(c, 0, -8, 0, 42, [[0, '#C9762A'], [1, '#8B4A12']]); A.roundRect(c, -46, -8, 92, 50, 10); c.fill();
      c.fillStyle = lin(c, 0, -50, 0, -4, [[0, '#E8953F'], [1, '#B8641C']]); c.beginPath(); c.moveTo(-46, -4); c.quadraticCurveTo(-46, -50, 0, -50); c.quadraticCurveTo(46, -50, 46, -4); c.closePath(); c.fill();
      c.fillStyle = '#FFC93C'; c.fillRect(-46, -8, 92, 9); c.fillRect(-30, -48, 9, 88); c.fillRect(21, -48, 9, 88);
      c.fillStyle = '#FFE58A'; A.roundRect(c, -10, -14, 20, 24, 5); c.fill(); c.fillStyle = '#8B4A12'; c.beginPath(); c.arc(0, -3, 3.5, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.ellipse(-20, -34, 16, 6, -0.3, 0, TAU); c.fill();
      sparkle(c, 40, -46, 9); sparkle(c, -44, -40, 6, '#FFE58A'); c.restore();
    },
    app: function (c, W) {
      c.fillStyle = lin(c, 0, 0, W, W, [[0, '#7C5CFF'], [1, '#A855FF']]); A.roundRect(c, 0, 0, W, W, W * 0.22); c.fill();
      c.fillStyle = rad(c, W * 0.5, W * 0.3, 0, W * 0.7, [[0, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]); A.roundRect(c, 0, 0, W, W, W * 0.22); c.fill();
      A.drawBubzi(c, W / 2, W * 0.56, W * 0.3, { mood: 'happy' });
    },
    burst: function (c, W) { glossy(c, function (k) { k.beginPath(); for (var i = 0; i < 16; i++) { var rr = i % 2 ? 26 : 52, a = i * Math.PI / 8 - Math.PI / 2; k.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } k.closePath(); }, W / 2, W / 2, W / 125, '#FF8A6A', '#D4234A');
      var k2 = W / 125; c.save(); c.translate(W / 2, W / 2 - 4 * k2); c.scale(k2, k2); c.strokeStyle = '#111'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(-4, -14); c.lineTo(-6, 8); c.moveTo(-6, 8); c.lineTo(-16, 22); c.moveTo(-6, 8); c.lineTo(6, 20); c.moveTo(-4, -10); c.lineTo(16, -14); c.stroke(); c.fillStyle = '#111'; c.beginPath(); c.arc(-2, -24, 7, 0, TAU); c.fill(); c.restore(); },
    cloud: function (c, W) { glossy(c, function (k) { k.beginPath(); k.arc(-22, 6, 24, 0, TAU); k.arc(6, -10, 30, 0, TAU); k.arc(30, 8, 22, 0, TAU); k.rect(-22, 6, 52, 24); }, W / 2, W / 2, W / 125, '#E2F2FF', '#6FA8FF'); }
  };

  window.hasArt = function (name) { return typeof GAMES[name] === 'function'; };
  window.renderArt = function (kind, name, W, H, opts) {
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H; var c = cv.getContext('2d');
    opts = opts || {};
    if (kind === 'game') {
      if (W === H) GAMES[name](c, W, H);
      else { // wide social image: art on the right, title on the left
        var sq = document.createElement('canvas'); sq.width = H; sq.height = H; GAMES[name](sq.getContext('2d'), H, H);
        c.fillStyle = lin(c, 0, 0, W, H, [[0, '#120A35'], [1, '#2A1680']]); c.fillRect(0, 0, W, H);
        c.drawImage(sq, W - H, 0);
        c.fillStyle = lin(c, W - H, 0, W - H + 220, 0, [[0, 'rgba(18,10,53,1)'], [1, 'rgba(18,10,53,0)']]); c.fillRect(W - H, 0, 220, H);
        c.fillStyle = '#FFFFFF'; c.textBaseline = 'alphabetic'; c.font = '800 92px "Baloo 2", sans-serif';
        var words = opts.title.split(' '), line = '', lines = [];
        words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (c.measureText(t).width > W - H - 40) { lines.push(line); line = w; } else line = t; }); lines.push(line);
        lines.forEach(function (l, i) { c.fillText(l, 64, 230 + i * 92); });
        c.fillStyle = '#C6FF4D'; c.font = '800 40px "Baloo 2", sans-serif'; c.fillText(opts.sub || 'Play free online', 64, 230 + lines.length * 92 + 20);
        A.drawBubzi(c, 100, 110, 42, {}); c.fillStyle = '#FFFFFF'; c.font = '800 54px "Baloo 2", sans-serif'; c.fillText('bubzi', 156, 128);
      }
    } else ICONS[name](c, W);
    if (opts.png) return cv.toDataURL('image/png');
    return cv.toDataURL(opts.type || 'image/webp', opts.q || 0.88);
  };
  window.ART_GAMES = Object.keys(GAMES); window.ART_ICONS = Object.keys(ICONS);
})();
