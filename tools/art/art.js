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
