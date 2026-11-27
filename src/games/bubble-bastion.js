/* Bubble Bastion — original tower defense for Bubzi.
   Bubbles float down a winding stream. Build and upgrade towers on the grass to pop them before they reach your gate. */
(function () {
  'use strict';
  var COLS = 7, ROWS = 10, LIVES = 20, MAXLV = 3;
  /* the stream, in "portrait" grid coords (cell centers at .5); drawn transposed on wide screens */
  var WP = [[1.5, -0.6], [1.5, 2.5], [5.5, 2.5], [5.5, 5.5], [1.5, 5.5], [1.5, 8.5], [5.5, 8.5], [5.5, 10.6]];
  var KINDS = ['needle', 'frost', 'bomb', 'zap'];
  var T = {
    needle: { cost: 50, range: 2.2, rate: 0.45, dmg: 1, c: '#38B6FF', d: '#1A6FB0' },
    frost: { cost: 70, range: 1.6, rate: 1.0, dmg: 0.35, slow: 0.5, c: '#7FE3FF', d: '#2A9EC4' },
    bomb: { cost: 110, range: 2.0, rate: 1.3, dmg: 2.4, splash: 0.95, c: '#FF7F45', d: '#B4461A' },
    zap: { cost: 160, range: 2.4, rate: 0.9, dmg: 2.2, chain: 3, c: '#FFC62E', d: '#B07D00' }
  };
  var BUB = ['#FF8FB8', '#8FD3FF', '#B9A2FF', '#8FF0C4', '#FFD27A'];
  var kb = false, land, cs, ox, oy, mapTop, mapBot, barY, bh, btns, nextB, infoY, path, segs, pathLen, pathSet;
  var towers, bubbles, shots, zaps, rings, gold, lives, wave, phase, breakT, queue, spawnT, sel, pick, pops, cur, tutT, panel, spawnGap, flow;

  function buildPath() {
    segs = []; pathLen = 0; pathSet = {};
    for (var i = 0; i < WP.length - 1; i++) {
      var a = WP[i], b = WP[i + 1], l = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
      segs.push({ a: a, b: b, l: l, d0: pathLen }); pathLen += l;
      var n = Math.ceil(l) + 1;
      for (var k = 0; k <= n; k++) { var t = k / n, c = Math.floor(a[0] + (b[0] - a[0]) * t), r = Math.floor(a[1] + (b[1] - a[1]) * t); if (r >= 0 && r < ROWS) pathSet[c + ',' + r] = 1; }
    }
  }
  function at(d) {
    for (var i = 0; i < segs.length; i++) { var s = segs[i]; if (d <= s.d0 + s.l || i === segs.length - 1) { var t = Math.max(0, Math.min(1, (d - s.d0) / s.l)); return { c: s.a[0] + (s.b[0] - s.a[0]) * t, r: s.a[1] + (s.b[1] - s.a[1]) * t }; } }
  }
  function L2S(c, r) { return land ? { x: ox + r * cs, y: oy + c * cs } : { x: ox + c * cs, y: oy + r * cs }; }
  function S2L(x, y) { return land ? { c: (y - oy) / cs, r: (x - ox) / cs } : { c: (x - ox) / cs, r: (y - oy) / cs }; }
  function layout(K) {
    land = K.W > K.H * 1.05;
    bh = K.clamp(K.H * 0.095, 60, 84); barY = K.H - bh - 10;
    infoY = K.hudH + 24; mapTop = K.hudH + 50; mapBot = barY - 10;
    var dc = land ? ROWS : COLS, dr = land ? COLS : ROWS;
    cs = Math.min((K.W - 16) / dc, (mapBot - mapTop) / dr, 76);
    ox = (K.W - dc * cs) / 2; oy = mapTop + (mapBot - mapTop - dr * cs) / 2;
    var gap = 8, bw = Math.min(118, (K.W - 24 - gap * 3) / 4), total = bw * 4 + gap * 3, bx = (K.W - total) / 2;
    btns = KINDS.map(function (k, i) { return { k: k, x: bx + i * (bw + gap), y: barY, w: bw, h: bh }; });
    nextB = { w: Math.min(170, K.W * 0.42), h: 34 }; nextB.x = Math.min(K.W - 10, bx + total) - nextB.w; nextB.y = infoY - 17;
  }
  function inB(b, x, y) { return b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
  function towerAt(c, r) { for (var i = 0; i < towers.length; i++) if (towers[i].c === c && towers[i].r === r) return towers[i]; return null; }
  function free(c, r) { return c >= 0 && r >= 0 && c < COLS && r < ROWS && !pathSet[c + ',' + r] && !towerAt(c, r); }
  function stat(t) { var b = T[t.k], m = Math.pow(1.7, t.l - 1); return { range: b.range * Math.pow(1.12, t.l - 1), rate: b.rate * Math.pow(0.85, t.l - 1), dmg: b.dmg * m }; }
  function upCost(t) { return Math.round(T[t.k].cost * 0.75 * t.l); }
  function refund(t) { return Math.round(t.spent * 0.7); }
  function coverage(c, r, rg) { var n = 0; for (var k in pathSet) { var p = k.split(','), dc = +p[0] + 0.5 - (c + 0.5), dr = +p[1] + 0.5 - (r + 0.5); if (dc * dc + dr * dr <= rg * rg) n++; } return n; }

  function place(K, c, r) {
    if (!pick || !free(c, r)) return false;
    var b = T[pick]; if (gold < b.cost) { K.sfx('wrong'); return false; }
    gold -= b.cost; towers.push({ k: pick, c: c, r: r, l: 1, cd: 0.2, ang: -Math.PI / 2, spent: b.cost, pop: 0.35, spin: 0 });
    var s = L2S(c + 0.5, r + 0.5); K.burst(s.x, s.y, ['#FFFFFF', b.c], 10, 120, 4); K.sfx('place'); K.haptic(12); K.tutorialDone();
    if (gold < b.cost) pick = null;
    return true;
  }
  function upgrade(K, t) {
    if (!t || t.l >= MAXLV) return; var c = upCost(t); if (gold < c) { K.sfx('wrong'); return; }
    gold -= c; t.spent += c; t.l++; t.pop = 0.4; var s = L2S(t.c + 0.5, t.r + 0.5); K.burst(s.x, s.y, ['#FFD23F', '#FFFFFF'], 14, 150, 4); K.sfx('reward'); K.addScore(10 * t.l);
  }
  function sell(K, t) { if (!t) return; gold += refund(t); towers.splice(towers.indexOf(t), 1); sel = null; K.sfx('coin'); }
  function startWave(K) {
    if (phase === 'wave') return;
    if (wave > 0 && breakT > 0) { var bonus = Math.round(breakT * 2); if (bonus > 0) { gold += bonus; K.floatText(nextB.x + nextB.w / 2, nextB.y + 50, '+' + bonus, '#B8860B', 18); } }
    wave++; phase = 'wave'; queue = [];
    var n = Math.min(40, 6 + wave * 2);
    for (var i = 0; i < n; i++) {
      var k = 'norm', r = Math.random();
      if (wave >= 3 && r < 0.25) k = 'fast'; else if (wave >= 5 && r < 0.4) k = 'tough';
      queue.push(k);
    }
    if (wave % 10 === 0) queue.push('boss');
    spawnGap = Math.max(0.3, 0.8 - wave * 0.02); spawnT = 0.3; K.sfx(wave % 10 === 0 ? 'boss' : 'whoosh');
    K.floatText(K.W / 2, mapTop + 40, K.t('wave') + ' ' + wave + (wave % 10 === 0 ? ' · ' + K.t('boss') : ''), '#FFFFFF', 30);
  }
  function spawn(K, k) {
    var hp = 2 * Math.pow(1.23, wave - 1), b = { k: k, d: 0, hp: hp, spd: 1.5, slowT: 0, r: 0.3, col: K.pick(BUB), wob: K.rand(0, 6), hit: 0 };
    if (k === 'fast') { b.hp *= 0.6; b.spd = 2.4; b.r = 0.24; }
    if (k === 'tough') { b.hp *= 2.6; b.spd = 1.0; b.r = 0.34; }
    if (k === 'boss') { b.hp *= 28; b.spd = 0.6; b.r = 0.46; b.col = '#C9A8FF'; }
    b.max = b.hp; bubbles.push(b);
  }
  function hurt(K, b, dmg) {
    if (b.hp <= 0) return; b.hp -= dmg; b.hit = 1;
    if (b.hp <= 0) {
      var p = at(b.d), s = L2S(p.c, p.r), rw = { norm: 3, fast: 4, tough: 6, boss: 40 + wave }[b.k];
      gold += rw; pops++; K.addScore(rw);
      K.burst(s.x, s.y, ['#FFFFFF', b.col, '#E9F7FF'], b.k === 'boss' ? 30 : 9, b.k === 'boss' ? 240 : 140, b.k === 'boss' ? 6 : 3.5);
      rings.push({ x: s.x, y: s.y, r: b.r * cs, t: 0, c: b.col });
      if (b.k === 'boss') { K.addCoins(2, s.x, s.y); K.shake(8); K.sfx('boom'); K.confetti(40); } else K.sfx('pop');
    }
  }
  function inRange(t, b, rg) { var p = at(b.d), dc = p.c - (t.c + 0.5), dr = p.r - (t.r + 0.5); return dc * dc + dr * dr <= rg * rg; }
  function fire(K, t) {
    var S = stat(t), best = null;
    bubbles.forEach(function (b) { if (b.hp > 0 && b.d > 0.2 && inRange(t, b, S.range) && (!best || b.d > best.d)) best = b; });
    if (!best) return false;
    var p = at(best.d), ts = L2S(t.c + 0.5, t.r + 0.5), bs = L2S(p.c, p.r);
    t.ang = Math.atan2(bs.y - ts.y, bs.x - ts.x); t.pop = 0.15;
    if (t.k === 'needle') { shots.push({ k: 'dart', x: ts.x, y: ts.y, tgt: best, dmg: S.dmg, spd: cs * 12 }); K.sfx('tick'); }
    else if (t.k === 'bomb') { shots.push({ k: 'shell', x0: ts.x, y0: ts.y, tc: p.c, tr: p.r, t: 0, dur: 0.45, dmg: S.dmg, splash: T.bomb.splash * (1 + (t.l - 1) * 0.12) }); K.sfx('shot'); }
    else if (t.k === 'zap') {
      var hit = [best], last = best;
      for (var j = 1; j < T.zap.chain + t.l - 1; j++) {
        var nx = null, nd = 1e9, lp = at(last.d);
        bubbles.forEach(function (b) { if (b.hp <= 0 || hit.indexOf(b) >= 0) return; var q = at(b.d), d = (q.c - lp.c) * (q.c - lp.c) + (q.r - lp.r) * (q.r - lp.r); if (d < 2.6 && d < nd) { nd = d; nx = b; } });
        if (!nx) break; hit.push(nx); last = nx;
      }
      var pts = [{ x: ts.x, y: ts.y - cs * 0.25 }];
      hit.forEach(function (b, i) { var q = at(b.d), s2 = L2S(q.c, q.r); pts.push({ x: s2.x, y: s2.y }); hurt(K, b, S.dmg * Math.pow(0.8, i)); });
      zaps.push({ pts: pts, t: 0 }); K.sfx('engine');
    }
    return true;
  }
  function pulse(K, t) {
    var S = stat(t), any = false;
    bubbles.forEach(function (b) { if (b.hp > 0 && inRange(t, b, S.range)) { any = true; b.slowT = 1.3; hurt(K, b, S.dmg); } });
    if (any) { var s = L2S(t.c + 0.5, t.r + 0.5); rings.push({ x: s.x, y: s.y, r: S.range * cs, t: 0, c: '#BFF1FF', frost: 1 }); }
    return any;
  }

  /* ---------- drawing ---------- */
  function goldCoin(ctx, K, x, y, r) {
    ctx.fillStyle = '#E0A100'; ctx.beginPath(); ctx.arc(x, y + r * 0.12, r, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(x, y, r, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#FFF1A8'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, K.TAU); ctx.fill();
  }
  function heart(ctx, x, y, r, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + r * 0.9);
    ctx.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.1, x, y - r * 0.35);
    ctx.bezierCurveTo(x + r * 0.7, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.9); ctx.fill();
  }
  function drawTower(ctx, K, k, x, y, s, l, ang, spin, pop) {
    var b = T[k]; ctx.save(); ctx.translate(x, y); var sc = s * (1 + pop * 0.35); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(36,27,77,0.18)'; ctx.beginPath(); ctx.ellipse(0, 14, 17, 6, 0, 0, K.TAU); ctx.fill();
    ctx.fillStyle = b.d; K.roundRect(ctx, -15, -2, 30, 16, 6); ctx.fill();
    ctx.fillStyle = b.c; K.roundRect(ctx, -15, -5, 30, 15, 6); ctx.fill();
    if (k === 'needle') {
      ctx.save(); ctx.rotate(ang); ctx.fillStyle = '#E8EEF6'; ctx.fillRect(0, -2.2, 20, 4.4); ctx.fillStyle = '#9AA7B8'; ctx.beginPath(); ctx.moveTo(20, -2.2); ctx.lineTo(27, 0); ctx.lineTo(20, 2.2); ctx.fill(); ctx.restore();
      ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(0, -6, 10, 0, K.TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.arc(-3, -9, 3.5, 0, K.TAU); ctx.fill();
    } else if (k === 'frost') {
      ctx.save(); ctx.translate(0, -8); ctx.rotate(spin); ctx.fillStyle = '#FFFFFF';
      for (var i = 0; i < 3; i++) { ctx.rotate(K.TAU / 3); ctx.beginPath(); ctx.ellipse(8, 0, 9, 4, 0, 0, K.TAU); ctx.fill(); }
      ctx.restore(); ctx.fillStyle = b.d; ctx.beginPath(); ctx.arc(0, -8, 4, 0, K.TAU); ctx.fill();
    } else if (k === 'bomb') {
      ctx.save(); ctx.translate(0, -6); ctx.rotate(ang * 0.25 - 0.6); ctx.fillStyle = '#4A3C78'; K.roundRect(ctx, -6, -16, 12, 18, 4); ctx.fill(); ctx.fillStyle = '#2B2250'; ctx.fillRect(-7, -17, 14, 4); ctx.restore();
      ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(0, -3, 9, Math.PI, 0); ctx.fill();
    } else {
      ctx.fillStyle = '#7A6A9E'; ctx.fillRect(-3, -22, 6, 20); ctx.strokeStyle = '#B9AEDB'; ctx.lineWidth = 2;
      for (var j = 0; j < 3; j++) { ctx.beginPath(); ctx.ellipse(0, -8 - j * 5, 7, 2, 0, 0, K.TAU); ctx.stroke(); }
      var gl = 0.6 + Math.sin(K.time * 8) * 0.2; ctx.fillStyle = 'rgba(255,230,90,' + gl + ')'; ctx.beginPath(); ctx.arc(0, -25, 8, 0, K.TAU); ctx.fill();
      ctx.fillStyle = '#FFF6C2'; ctx.beginPath(); ctx.arc(0, -25, 4.5, 0, K.TAU); ctx.fill();
    }
    for (var p = 0; p < l; p++) { ctx.fillStyle = '#FFD23F'; ctx.save(); ctx.translate(-8 + p * 8, 8); K.star(ctx, 3.6); ctx.restore(); }
    ctx.restore();
  }
  function drawBubble(ctx, K, b) {
    var p = at(b.d), s = L2S(p.c, p.r), r = b.r * cs * (1 + Math.sin(K.time * 5 + b.wob) * 0.05), x = s.x, y = s.y + Math.sin(K.time * 3 + b.wob) * cs * 0.04;
    ctx.fillStyle = 'rgba(36,27,77,0.12)'; ctx.beginPath(); ctx.ellipse(x, y + r * 0.95, r * 0.7, r * 0.2, 0, 0, K.TAU); ctx.fill();
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.35, b.col); g.addColorStop(1, b.hit > 0.3 ? '#FFFFFF' : b.col);
    ctx.globalAlpha = 0.92; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, K.TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = b.k === 'tough' ? '#7A6A9E' : 'rgba(255,255,255,0.9)'; ctx.lineWidth = b.k === 'tough' ? Math.max(3, r * 0.22) : 2; ctx.beginPath(); ctx.arc(x, y, r - ctx.lineWidth / 2, 0, K.TAU); ctx.stroke();
    if (b.slowT > 0) { ctx.strokeStyle = 'rgba(191,241,255,0.95)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, K.TAU); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.12, -0.6, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#241B4D'; ctx.beginPath(); ctx.arc(x - r * 0.25, y + r * 0.02, r * 0.1, 0, K.TAU); ctx.arc(x + r * 0.25, y + r * 0.02, r * 0.1, 0, K.TAU); ctx.fill();
    ctx.strokeStyle = '#241B4D'; ctx.lineWidth = Math.max(1.2, r * 0.07); ctx.beginPath(); ctx.arc(x, y + r * 0.2, r * 0.14, 0.2, Math.PI - 0.2); ctx.stroke();
    if (b.k === 'boss') { ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.moveTo(x - r * 0.45, y - r * 0.75); ctx.lineTo(x - r * 0.45, y - r * 1.15); ctx.lineTo(x - r * 0.2, y - r * 0.92); ctx.lineTo(x, y - r * 1.2); ctx.lineTo(x + r * 0.2, y - r * 0.92); ctx.lineTo(x + r * 0.45, y - r * 1.15); ctx.lineTo(x + r * 0.45, y - r * 0.75); ctx.closePath(); ctx.fill(); }
    if (b.hp < b.max && (b.k === 'boss' || b.k === 'tough')) { var w = r * 1.6; ctx.fillStyle = 'rgba(36,27,77,0.3)'; ctx.fillRect(x - w / 2, y - r - 9, w, 4); ctx.fillStyle = '#FF5FA2'; ctx.fillRect(x - w / 2, y - r - 9, w * Math.max(0, b.hp / b.max), 4); }
  }

  BubziKit.run({
    id: 'bubble-bastion', coinRate: 0.02,
    title: { en: 'Bubble Bastion', fr: 'Bastion des Bulles', ar: 'حصن الفقاعات' },
    strings: {
      en: { tagline: 'Build towers by the stream and pop every bubble before it reaches your gate!', needle: 'Needle', frost: 'Frost', bomb: 'Bomb', zap: 'Zap', wave: 'Wave', next: 'Next wave', boss: 'Big bubble!', up: 'Upgrade', sell: 'Sell', max: 'Max', pickTower: 'Pick a tower below', leak: 'Leak!' },
      fr: { tagline: 'Construis des tours près du ruisseau et éclate chaque bulle avant ta porte !', needle: 'Aiguille', frost: 'Givre', bomb: 'Bombe', zap: 'Éclair', wave: 'Vague', next: 'Vague suivante', boss: 'Grosse bulle !', up: 'Améliorer', sell: 'Vendre', max: 'Max', pickTower: 'Choisis une tour en bas', leak: 'Fuite !' },
      ar: { tagline: 'ابنِ الأبراج قرب الجدول وفجّر كل فقاعة قبل أن تصل إلى بوابتك!', needle: 'إبرة', frost: 'صقيع', bomb: 'قنبلة', zap: 'برق', wave: 'الموجة', next: 'الموجة التالية', boss: 'فقاعة كبيرة!', up: 'تطوير', sell: 'بيع', max: 'الأقصى', pickTower: 'اختر برجاً من الأسفل', leak: 'تسرّب!' }
    },
    resize: layout,
    reset: function (K) {
      if (K.test) K.dbg = function () {
        var cells = [];
        for (var c = 0; c < COLS; c++) for (var r = 0; r < ROWS; r++) if (free(c, r)) { var s = L2S(c + 0.5, r + 0.5); cells.push({ c: c, r: r, x: s.x, y: s.y, cov: coverage(c, r, 2.1) }); }
        cells.sort(function (a, b) { return b.cov - a.cov; });
        return { wave: wave, lives: lives, gold: gold, phase: phase, pops: pops, bubbles: bubbles.length, pick: pick,
          towers: towers.map(function (t) { var s = L2S(t.c + 0.5, t.r + 0.5); return { k: t.k, l: t.l, x: s.x, y: s.y, up: upCost(t) }; }),
          cells: cells.slice(0, 12), btn: btns.map(function (b) { return { k: b.k, x: b.x + b.w / 2, y: b.y + b.h / 2, cost: T[b.k].cost }; }),
          next: phase === 'build' ? { x: nextB.x + nextB.w / 2, y: nextB.y + nextB.h / 2 } : null,
          panel: panel ? { up: { x: panel.up.x + panel.up.w / 2, y: panel.up.y + panel.up.h / 2 }, sell: { x: panel.sell.x + panel.sell.w / 2, y: panel.sell.y + panel.sell.h / 2 } } : null };
      };
      buildPath(); layout(K);
      towers = []; bubbles = []; shots = []; zaps = []; rings = []; gold = 130; lives = LIVES; wave = 0; phase = 'build'; breakT = 20; queue = []; sel = null; pick = null; pops = 0; cur = { c: 3, r: 3 }; tutT = 0; panel = null; flow = 0;
    },
    revive: function (K) { lives = 10; bubbles = bubbles.filter(function (b) { return b.d < pathLen * 0.6; }); },
    pointerDown: function (x, y, K) {
      kb = false;
      if (panel && sel) {
        if (inB(panel.up, x, y)) { upgrade(K, sel); return; }
        if (inB(panel.sell, x, y)) { sell(K, sel); return; }
      }
      if (phase === 'build' && inB(nextB, x, y)) { startWave(K); return; }
      for (var i = 0; i < btns.length; i++) if (inB(btns[i], x, y)) { pick = pick === btns[i].k ? null : btns[i].k; sel = null; K.sfx('click'); return; }
      var L = S2L(x, y), c = Math.floor(L.c), r = Math.floor(L.r), t = towerAt(c, r);
      if (t) { sel = sel === t ? null : t; pick = null; K.sfx('click'); return; }
      if (pick) { if (!place(K, c, r) && c >= 0 && r >= 0 && c < COLS && r < ROWS && !pathSet[c + ',' + r]) K.sfx('wrong'); return; }
      sel = null;
    },
    key: function (code, down, K, rep) {
      if (!down) return; kb = true;
      var m = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1] }[code];
      if (m) { if (land) m = [m[1], m[0]]; cur.c = K.clamp(cur.c + m[0], 0, COLS - 1); cur.r = K.clamp(cur.r + m[1], 0, ROWS - 1); K.sfx('tick'); return; }
      if (rep) return;
      var n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[code];
      if (n !== undefined) { pick = KINDS[n]; sel = null; K.sfx('click'); return; }
      if (code === 'Space' || code === 'Enter') { var t = towerAt(cur.c, cur.r); if (t) { sel = sel === t ? null : t; pick = null; } else if (pick) place(K, cur.c, cur.r); return; }
      if (code === 'KeyU') upgrade(K, sel); else if (code === 'KeyS') sell(K, sel); else if (code === 'KeyN') startWave(K); else if (code === 'Escape') { sel = null; pick = null; }
    },
    update: function (dt, K) {
      if (K.test && K.fastX) dt *= K.fastX;
      tutT += dt; flow += dt;
      if (phase === 'build') { breakT -= dt; if (breakT <= 0) startWave(K); }
      else {
        spawnT -= dt; if (queue.length && spawnT <= 0) { spawn(K, queue.shift()); spawnT = spawnGap * K.rand(0.7, 1.3); }
        if (!queue.length && !bubbles.length) {
          phase = 'build'; breakT = 12; var bonus = 10 + wave * 2; gold += bonus; K.addScore(wave * 10);
          K.floatText(K.W / 2, mapTop + 40, '+' + bonus, '#B8860B', 26); K.sfx('star');
          if (wave % 5 === 0) K.addCoins(1, K.W / 2, mapTop + 60);
        }
      }
      bubbles.forEach(function (b) {
        b.slowT = Math.max(0, b.slowT - dt); b.hit = Math.max(0, b.hit - dt * 4);
        b.d += b.spd * (b.slowT > 0 ? 1 - T.frost.slow : 1) * dt;
        if (b.d >= pathLen && b.hp > 0) {
          var lost = b.k === 'boss' ? 5 : 1; lives -= lost; b.hp = 0; b.gone = true; var e = L2S(WP[WP.length - 1][0], WP[WP.length - 1][1] - 0.6);
          K.floatText(e.x, e.y - 10, '-' + lost, '#E8364F', 22); K.shake(6); K.haptic(25); K.sfx('wrong');
        }
      });
      bubbles = bubbles.filter(function (b) { return b.hp > 0; });
      towers.forEach(function (t) {
        t.cd -= dt; t.pop = Math.max(0, t.pop - dt); if (t.k === 'frost') t.spin += dt * (bubbles.length ? 6 : 1.5);
        if (t.cd <= 0) { var ok = t.k === 'frost' ? pulse(K, t) : fire(K, t); t.cd = ok ? stat(t).rate : 0.1; }
      });
      shots = shots.filter(function (s) {
        if (s.k === 'dart') {
          if (s.tgt.hp <= 0) return false;
          var p = at(s.tgt.d), q = L2S(p.c, p.r), dx = q.x - s.x, dy = q.y - s.y, l = Math.sqrt(dx * dx + dy * dy), st = s.spd * dt;
          s.a = Math.atan2(dy, dx); if (l <= st + 4) { hurt(K, s.tgt, s.dmg); return false; } s.x += dx / l * st; s.y += dy / l * st; return true;
        }
        s.t += dt; if (s.t < s.dur) return true;
        bubbles.forEach(function (b) { var p = at(b.d), dc = p.c - s.tc, dr = p.r - s.tr; if (dc * dc + dr * dr <= s.splash * s.splash) hurt(K, b, s.dmg); });
        var e = L2S(s.tc, s.tr); rings.push({ x: e.x, y: e.y, r: s.splash * cs, t: 0, c: '#FFB37A', boom: 1 }); K.burst(e.x, e.y, ['#FFD23F', '#FF7F45', '#FFFFFF'], 10, 160, 4); K.sfx('boom');
        return false;
      });
      zaps.forEach(function (z) { z.t += dt; }); zaps = zaps.filter(function (z) { return z.t < 0.14; });
      rings.forEach(function (r) { r.t += dt; }); rings = rings.filter(function (r) { return r.t < 0.35; });
      if (sel && towers.indexOf(sel) < 0) sel = null;
      if (lives <= 0) { lives = 0; K.gameOver({}); return; }
      K.info(K.t('wave') + ' ' + Math.max(1, wave));
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H;
      ctx.fillStyle = '#EAF8E4'; ctx.fillRect(0, 0, W, H);
      // grass board
      var dc = land ? ROWS : COLS, dr = land ? COLS : ROWS;
      ctx.fillStyle = '#5BBF3A'; K.roundRect(ctx, ox - 6, oy - 6 + 5, dc * cs + 12, dr * cs + 12, 16); ctx.fill();
      ctx.fillStyle = '#8FE06A'; K.roundRect(ctx, ox - 6, oy - 6, dc * cs + 12, dr * cs + 12, 16); ctx.fill();
      for (var c = 0; c < COLS; c++) for (var r = 0; r < ROWS; r++) {
        if ((c + r) % 2) continue; var s = L2S(c, r); ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fillRect(s.x, s.y, cs, cs);
      }
      // decorations (fixed per cell)
      for (c = 0; c < COLS; c++) for (r = 0; r < ROWS; r++) {
        var h = (c * 7 + r * 13) % 11; if (pathSet[c + ',' + r] || towerAt(c, r) || h > 1) continue;
        var dsp = L2S(c + 0.3 + h * 0.35, r + 0.7);
        if (h === 0) { ctx.fillStyle = '#FFFFFF'; for (var f = 0; f < 5; f++) { var fa = f / 5 * K.TAU; ctx.beginPath(); ctx.arc(dsp.x + Math.cos(fa) * cs * 0.06, dsp.y + Math.sin(fa) * cs * 0.06, cs * 0.05, 0, K.TAU); ctx.fill(); } ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(dsp.x, dsp.y, cs * 0.04, 0, K.TAU); ctx.fill(); }
        else { ctx.fillStyle = '#4FA834'; ctx.beginPath(); ctx.moveTo(dsp.x - cs * 0.08, dsp.y); ctx.lineTo(dsp.x - cs * 0.04, dsp.y - cs * 0.12); ctx.lineTo(dsp.x, dsp.y); ctx.lineTo(dsp.x + cs * 0.05, dsp.y - cs * 0.14); ctx.lineTo(dsp.x + cs * 0.08, dsp.y); ctx.fill(); }
      }
      // stream (clipped to the board)
      ctx.save(); K.roundRect(ctx, ox - 6, oy - 6, dc * cs + 12, dr * cs + 12, 16); ctx.clip();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      [['#C8B07A', 0.86], ['#5CC8F2', 0.74], ['#8EDDFB', 0.5]].forEach(function (L) {
        ctx.strokeStyle = L[0]; ctx.lineWidth = cs * L[1]; ctx.beginPath();
        WP.forEach(function (p, i) { var q = L2S(p[0], p[1]); if (!i) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); }); ctx.stroke();
      });
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(2, cs * 0.06); ctx.setLineDash([cs * 0.18, cs * 0.5]); ctx.lineDashOffset = -flow * cs * 1.2; ctx.beginPath();
      WP.forEach(function (p, i) { var q = L2S(p[0], p[1]); if (!i) ctx.moveTo(q.x, q.y); else ctx.lineTo(q.x, q.y); }); ctx.stroke(); ctx.restore(); ctx.restore();
      // gate at the end
      var g = L2S(WP[WP.length - 1][0], ROWS - 0.15), gw = cs * 0.9;
      ctx.save(); ctx.translate(g.x, g.y); if (land) ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#8A5A2B'; ctx.fillRect(-gw / 2 - 5, -cs * 0.45, 7, cs * 0.6); ctx.fillRect(gw / 2 - 2, -cs * 0.45, 7, cs * 0.6);
      ctx.fillStyle = '#C08A3E'; K.roundRect(ctx, -gw / 2 - 8, -cs * 0.55, gw + 16, cs * 0.16, 4); ctx.fill(); ctx.restore();
      heart(ctx, g.x, g.y - (land ? 0 : cs * 0.75), cs * 0.16, '#FF5E7E');
      // range of the selected tower / placing preview
      var hov = null;
      if (sel) { var ss = L2S(sel.c + 0.5, sel.r + 0.5); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ss.x, ss.y, stat(sel).range * cs, 0, K.TAU); ctx.fill(); ctx.stroke(); }
      if (kb) { var cp = L2S(cur.c, cur.r), cq = L2S(cur.c + 1, cur.r + 1); ctx.strokeStyle = '#FF8A1F'; ctx.lineWidth = 3; ctx.strokeRect(Math.min(cp.x, cq.x) + 2, Math.min(cp.y, cq.y) + 2, cs - 4, cs - 4); if (pick && free(cur.c, cur.r)) hov = cur; }
      if (hov) { var hs = L2S(hov.c + 0.5, hov.r + 0.5); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(hs.x, hs.y, T[pick].range * cs, 0, K.TAU); ctx.fill(); }
      if (pick) { // show where towers can go
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        for (c = 0; c < COLS; c++) for (r = 0; r < ROWS; r++) if (free(c, r)) { var fs = L2S(c + 0.5, r + 0.5); ctx.beginPath(); ctx.arc(fs.x, fs.y, cs * 0.12, 0, K.TAU); ctx.fill(); }
      }
      // towers (top to bottom) and bubbles
      towers.slice().sort(function (a, b) { return L2S(a.c, a.r).y - L2S(b.c, b.r).y; }).forEach(function (t) { var s = L2S(t.c + 0.5, t.r + 0.5); drawTower(ctx, K, t.k, s.x, s.y, cs / 44, t.l, t.ang, t.spin, t.pop); });
      ctx.save(); K.roundRect(ctx, ox - 6, oy - 6, dc * cs + 12, dr * cs + 12, 16); ctx.clip();
      bubbles.slice().sort(function (a, b) { return a.d - b.d; }).forEach(function (b) { drawBubble(ctx, K, b); }); ctx.restore();
      shots.forEach(function (s) {
        if (s.k === 'dart') { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a || 0); ctx.fillStyle = '#E8EEF6'; ctx.fillRect(-7, -1.5, 10, 3); ctx.fillStyle = '#5E5689'; ctx.beginPath(); ctx.moveTo(3, -2); ctx.lineTo(8, 0); ctx.lineTo(3, 2); ctx.fill(); ctx.restore(); return; }
        var k = s.t / s.dur, e = L2S(s.tc, s.tr), x = s.x0 + (e.x - s.x0) * k, y = s.y0 + (e.y - s.y0) * k - Math.sin(k * Math.PI) * cs * 1.1;
        ctx.fillStyle = '#2B2250'; ctx.beginPath(); ctx.arc(x, y, cs * 0.11, 0, K.TAU); ctx.fill(); ctx.fillStyle = '#FF7F45'; ctx.beginPath(); ctx.arc(x + cs * 0.05, y - cs * 0.07, cs * 0.04, 0, K.TAU); ctx.fill();
      });
      zaps.forEach(function (z) {
        ctx.strokeStyle = 'rgba(255,214,60,' + (1 - z.t / 0.14) + ')'; ctx.lineWidth = 3; ctx.beginPath();
        z.pts.forEach(function (p, i) { if (!i) { ctx.moveTo(p.x, p.y); return; } var a = z.pts[i - 1]; for (var k = 1; k <= 4; k++) { var t = k / 4; ctx.lineTo(a.x + (p.x - a.x) * t + (k < 4 ? K.rand(-5, 5) : 0), a.y + (p.y - a.y) * t + (k < 4 ? K.rand(-5, 5) : 0)); } }); ctx.stroke();
      });
      rings.forEach(function (r) { var k = r.t / 0.35; ctx.strokeStyle = r.c; ctx.globalAlpha = 1 - k; ctx.lineWidth = r.frost ? 3 : 2.5; ctx.beginPath(); ctx.arc(r.x, r.y, r.frost ? r.r * (0.3 + k * 0.7) : r.r * (0.6 + k * 0.8), 0, K.TAU); ctx.stroke(); ctx.globalAlpha = 1; });
      K.steady(ctx, function () { // HUD layer: stays still while the scene shakes
      // info row: lives, gold, next wave
      ctx.font = K.font(20); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      var ix = btns[0].x; heart(ctx, ix + 11, infoY, 10, '#FF5E7E'); ctx.fillStyle = '#241B4D'; ctx.fillText(lives, ix + 26, infoY + 1);
      var gx = ix + 26 + ctx.measureText(String(lives)).width + 22; goldCoin(ctx, K, gx, infoY, 10); ctx.fillStyle = '#241B4D'; ctx.fillText(K.fmt(gold), gx + 16, infoY + 1);
      if (phase === 'build') {
        var nb = nextB; ctx.fillStyle = '#3C9A1E'; K.roundRect(ctx, nb.x, nb.y + 4, nb.w, nb.h, nb.h / 2); ctx.fill(); ctx.fillStyle = '#7ED957'; K.roundRect(ctx, nb.x, nb.y, nb.w, nb.h, nb.h / 2); ctx.fill();
        ctx.font = K.font(15); ctx.textAlign = 'center'; ctx.fillStyle = '#143A0A'; ctx.fillText('▶ ' + K.t('next') + ' ' + Math.ceil(breakT) + (kb ? ' [N]' : ''), nb.x + nb.w / 2, nb.y + nb.h / 2 + 1);
      }
      // tower panel
      panel = null;
      if (sel) {
        var ts = L2S(sel.c + 0.5, sel.r + 0.5), pw = Math.min(W - 20, 230), ph = 46, px = K.clamp(ts.x - pw / 2, 10, W - 10 - pw), py = ts.y - cs * 0.7 - ph;
        if (py < mapTop - 10) py = ts.y + cs * 0.7;
        var half = (pw - 18) / 2, can = sel.l < MAXLV && gold >= upCost(sel);
        panel = { up: { x: px + 6, y: py + 6, w: half, h: ph - 12 }, sell: { x: px + 12 + half, y: py + 6, w: half, h: ph - 12 } };
        ctx.fillStyle = 'rgba(36,27,77,0.2)'; K.roundRect(ctx, px, py + 4, pw, ph, 14); ctx.fill(); ctx.fillStyle = '#FFFFFF'; K.roundRect(ctx, px, py, pw, ph, 14); ctx.fill();
        var u = panel.up, sb = panel.sell;
        ctx.fillStyle = can ? '#7ED957' : '#E2DEF0'; K.roundRect(ctx, u.x, u.y, u.w, u.h, 10); ctx.fill();
        ctx.fillStyle = '#FFD9C2'; K.roundRect(ctx, sb.x, sb.y, sb.w, sb.h, 10); ctx.fill();
        ctx.font = K.font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = can ? '#143A0A' : '#8A84A8'; ctx.fillText(sel.l >= MAXLV ? K.t('max') : K.t('up') + ' ' + upCost(sel), u.x + u.w / 2, u.y + u.h / 2 + 1);
        ctx.fillStyle = '#7A2E0A'; ctx.fillText(K.t('sell') + ' +' + refund(sel), sb.x + sb.w / 2, sb.y + sb.h / 2 + 1);
      }
      // tower buttons
      btns.forEach(function (b, i) {
        var t = T[b.k], can = gold >= t.cost, on = pick === b.k;
        ctx.fillStyle = on ? '#E0A100' : can ? '#C9B8FF' : '#D7D2EA'; K.roundRect(ctx, b.x, b.y + 4, b.w, b.h, 16); ctx.fill();
        ctx.fillStyle = on ? '#FFE58A' : can ? '#FFFFFF' : '#ECE9F6'; K.roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill();
        ctx.save(); if (!can) ctx.globalAlpha = 0.5; drawTower(ctx, K, b.k, b.x + b.w / 2, b.y + b.h * 0.56, b.h / 72, 0, -Math.PI / 4, K.time, 0); ctx.restore();
        ctx.font = K.font(Math.round(b.h * 0.17)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = can ? '#241B4D' : '#8A84A8';
        ctx.fillText(K.t(b.k), b.x + b.w / 2, b.y + b.h * 0.14 + 2);
        var cy = b.y + b.h * 0.86; goldCoin(ctx, K, b.x + b.w / 2 - 16, cy, 7); ctx.textAlign = 'left'; ctx.fillStyle = can ? '#241B4D' : '#8A84A8'; ctx.fillText(t.cost, b.x + b.w / 2 - 6, cy + 1);
        if (kb) { ctx.font = K.font(12); ctx.fillStyle = '#8A84A8'; ctx.fillText(i + 1, b.x + 8, b.y + b.h * 0.4); }
      });
      // tutorial: pick the needle tower, then tap a spot by the stream
      if (K.tutorial && state === 'playing') {
        var k2 = (tutT * 0.9) % 1, sc = Math.min(W, H) / 220;
        if (!pick) { var bb = btns[0]; K.drawHand(ctx, bb.x + bb.w / 2, bb.y + bb.h * 0.55 + (k2 < 0.5 ? k2 : 1 - k2) * 14, k2 > 0.4 && k2 < 0.6, sc); }
        else { var tc = L2S(3.5, 3.5); K.drawHand(ctx, tc.x, tc.y + cs * 0.2 + (k2 < 0.5 ? k2 : 1 - k2) * 14, k2 > 0.4 && k2 < 0.6, sc); }
      }
      });
    }
  });
})();
