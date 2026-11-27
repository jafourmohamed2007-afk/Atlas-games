/* Merge Blasters — original merge + defense game for Bubzi.
   Buy blasters, drop two of the same on each other to make a stronger one, and pop the goo blobs before they reach your wall. */
(function () {
  'use strict';
  var COLS = 4, ROWS = 3, MAXL = 12, WALL = 5;
  var LC = ['#7ED957', '#38B6FF', '#FFB020', '#FF5FA2', '#9B6BFF', '#2EC4B6', '#FF7F45', '#E056FD', '#FFD23F', '#4B7BEC', '#FF5E5B', '#241B4D'];
  var BLOB = ['#8CE99A', '#74C0FC', '#FFD43B', '#FFA8A8', '#B197FC', '#63E6BE'];
  var kb = false, fx, fw, grid, blobs, shots, gold, price, wave, toSpawn, spawnT, breakT, wallHp, hold, hover, cs, gx, gy, fieldTop, wallY, buyB, kbCur, kbHold, merges, kills, tutT, best, shake;

  function layout(K) {
    var avW = K.W - 32;
    cs = Math.min(avW / COLS, (K.H - K.hudH) * 0.115, 104);
    var gh = cs * ROWS, bh = Math.max(54, cs * 0.62);
    buyB = { w: Math.min(300, K.W - 60), h: bh }; buyB.x = (K.W - buyB.w) / 2; buyB.y = K.H - bh - 14;
    gx = (K.W - cs * COLS) / 2; gy = buyB.y - 14 - gh;
    wallY = gy - 22; fieldTop = K.hudH + 44;
    fw = Math.min(K.W - 32, Math.max(cs * COLS, K.H * 0.95)); fx = (K.W - fw) / 2;
  }
  function cellAt(x, y) {
    var c = Math.floor((x - gx) / cs), r = Math.floor((y - gy) / cs);
    return c >= 0 && c < COLS && r >= 0 && r < ROWS ? r * COLS + c : -1;
  }
  function cellC(i) { return { x: gx + (i % COLS) * cs + cs / 2, y: gy + Math.floor(i / COLS) * cs + cs / 2 }; }
  function dmgOf(l) { return Math.pow(2.05, l - 1); }
  function rateOf(l) { return 1.5 + l * 0.06; }
  function blobHp() { return 8 * Math.pow(1.24, wave - 1); }
  function startWave(K) {
    wave++; toSpawn = 6 + Math.floor(wave * 1.6); spawnT = 0.4; breakT = 0;
    if (wave % 5 === 0) toSpawn = Math.max(4, Math.floor(toSpawn / 2));
    K.floatText(K.W / 2, (fieldTop + wallY) / 2, K.t('wave') + ' ' + wave + (wave % 5 === 0 ? ' · ' + K.t('boss') : ''), '#7B4DFF', 34);
  }
  function spawn(K) {
    var boss = wave % 5 === 0 && toSpawn === 1, fast = !boss && wave >= 3 && Math.random() < 0.25, big = !boss && !fast && wave >= 4 && Math.random() < 0.2;
    var r = (boss ? 0.62 : big ? 0.42 : fast ? 0.24 : 0.31) * cs, hp = blobHp() * (boss ? 16 : big ? 3.2 : fast ? 0.6 : 1);
    blobs.push({ x: K.rand(fx + r, fx + fw - r), y: fieldTop - r, r: r, hp: hp, max: hp, sp: (boss ? 0.26 : big ? 0.38 : fast ? 1.0 : 0.5) * cs * (1 + Math.min(0.6, wave * 0.02)),
      col: boss ? '#FF5E5B' : K.pick(BLOB), boss: boss, wob: K.rand(0, 6), hit: 0, gold: boss ? 25 + wave * 2 : big ? 5 : 3 });
  }
  function buy(K) {
    if (gold < price) { K.sfx('wrong'); return false; }
    var free = []; grid.forEach(function (b, i) { if (!b) free.push(i); });
    if (!free.length) { K.sfx('wrong'); return false; }
    var i = free[0]; grid[i] = { l: 1, cd: 0.3, pop: 1, ang: -Math.PI / 2 }; gold -= price; price = Math.round(price * 1.07 + 1);
    var p = cellC(i); K.burst(p.x, p.y, ['#FFFFFF', LC[0]], 10, 160, 4); K.sfx('click'); K.haptic(8);
    return true;
  }
  function drop(K, from, to) {
    if (to < 0 || to === from) return;
    var a = grid[from], b = grid[to];
    if (!b) { grid[to] = a; grid[from] = null; K.sfx('tick'); return; }
    if (b.l === a.l && a.l < MAXL) {
      grid[from] = null; b.l++; b.pop = 1; merges++;
      var p = cellC(to); K.burst(p.x, p.y, ['#FFFFFF', LC[b.l - 1], '#FFD23F'], 18, 240, 5); K.floatText(p.x, p.y - cs * 0.4, K.t('lv') + ' ' + b.l, LC[b.l - 1], 26);
      K.sfx(b.l >= 5 ? 'combo' : 'merge'); K.haptic(18); K.addScore(b.l * 5); K.tutorialDone();
      if (b.l > best) { best = b.l; if (b.l >= 4) K.addCoins(1, p.x, p.y); }
    } else { grid[from] = b; grid[to] = a; K.sfx('tick'); }
  }
  function nearest(x, y) {
    var bst = null, bd = 1e18;
    blobs.forEach(function (b) { if (b.hp <= 0 || b.y < fieldTop + b.r * 0.6) return; var d = (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y) - b.y * 400; if (d < bd) { bd = d; bst = b; } });
    return bst;
  }
  function goldCoin(ctx, K, x, y, r) {
    ctx.fillStyle = '#E0A100'; ctx.beginPath(); ctx.arc(x, y + r * 0.12, r, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(x, y, r, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#FFF1A8'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, K.TAU); ctx.fill();
  }
  function drawBlob(ctx, K, b) {
    var s = 1 + Math.sin(K.time * 6 + b.wob) * 0.05, r = b.r;
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(1 / s, s);
    ctx.fillStyle = 'rgba(36,27,77,0.15)'; ctx.beginPath(); ctx.ellipse(0, r * 0.95, r * 0.9, r * 0.25, 0, 0, K.TAU); ctx.fill();
    ctx.fillStyle = b.hit > 0 ? '#FFFFFF' : b.col; ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0);
    ctx.quadraticCurveTo(r, r * 0.9, r * 0.6, r * 0.85); ctx.quadraticCurveTo(r * 0.3, r * 1.05, 0, r * 0.85); ctx.quadraticCurveTo(-r * 0.3, r * 1.05, -r * 0.6, r * 0.85); ctx.quadraticCurveTo(-r, r * 0.9, -r, 0); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-r * 0.4, -r * 0.45, r * 0.25, r * 0.14, -0.5, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#241B4D'; [-1, 1].forEach(function (e) { ctx.beginPath(); ctx.arc(e * r * 0.3, -r * 0.05, r * 0.12, 0, K.TAU); ctx.fill(); });
    ctx.strokeStyle = '#241B4D'; ctx.lineWidth = Math.max(2, r * 0.08); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.18, 0.2, Math.PI - 0.2); ctx.stroke();
    if (b.boss) { ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.8); ctx.lineTo(-r * 0.5, -r * 1.25); ctx.lineTo(-r * 0.25, -r * 1.02); ctx.lineTo(0, -r * 1.35); ctx.lineTo(r * 0.25, -r * 1.02); ctx.lineTo(r * 0.5, -r * 1.25); ctx.lineTo(r * 0.5, -r * 0.8); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    if (b.hp < b.max) { var w = r * 1.6; ctx.fillStyle = 'rgba(36,27,77,0.25)'; K.roundRect(ctx, b.x - w / 2, b.y - r - 12, w, 6, 3); ctx.fill(); ctx.fillStyle = '#FF5E5B'; K.roundRect(ctx, b.x - w / 2, b.y - r - 12, w * Math.max(0, b.hp / b.max), 6, 3); ctx.fill(); }
  }
  function drawBlaster(ctx, K, x, y, b, size) {
    var c = LC[(b.l - 1) % LC.length], s = size * (1 + b.pop * 0.18);
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(36,27,77,0.18)'; ctx.beginPath(); ctx.ellipse(0, s * 0.34, s * 0.34, s * 0.1, 0, 0, K.TAU); ctx.fill();
    ctx.save(); ctx.rotate(b.ang + Math.PI / 2); var kick = b.kick || 0;
    ctx.fillStyle = '#5E5689'; K.roundRect(ctx, -s * 0.08, -s * 0.46 + kick * s * 0.08, s * 0.16, s * 0.3, s * 0.05); ctx.fill();
    if (b.l >= 4) { ctx.fillStyle = '#5E5689'; K.roundRect(ctx, -s * 0.2, -s * 0.38 + kick * s * 0.08, s * 0.1, s * 0.22, s * 0.04); ctx.fill(); K.roundRect(ctx, s * 0.1, -s * 0.38 + kick * s * 0.08, s * 0.1, s * 0.22, s * 0.04); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, s * 0.27, 0, K.TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(-s * 0.08, -s * 0.09, s * 0.1, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = K.font(Math.round(s * 0.24)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.l, 0, s * 0.02);
    ctx.restore();
  }

  BubziKit.run({
    id: 'merge-blasters', coinRate: 0.02,
    title: { en: 'Merge Blasters', fr: 'Fusion Blasters', ar: 'دمج المدافع' },
    strings: {
      en: { tagline: 'Merge two of the same blaster to make a stronger one. Pop the goo before it reaches your wall!', buy: 'Blaster', wave: 'Wave', boss: 'Boss!', lv: 'Lv', full: 'No space: merge!', wallHit: 'Ouch!' },
      fr: { tagline: 'Fusionne deux blasters identiques pour en créer un plus fort. Éclate la gelée avant ton mur !', buy: 'Blaster', wave: 'Vague', boss: 'Boss !', lv: 'Niv', full: 'Plus de place : fusionne !', wallHit: 'Aïe !' },
      ar: { tagline: 'ادمج مدفعين متشابهين لتصنع مدفعاً أقوى. فجّر الهلام قبل أن يصل إلى جدارك!', buy: 'مدفع', wave: 'الموجة', boss: 'الزعيم!', lv: 'مستوى', full: 'لا مكان: ادمج!', wallHit: 'آخ!' }
    },
    resize: layout,
    reset: function (K) {
      if (K.test) K.dbg = function () {
        return { grid: grid.map(function (b) { return b ? b.l : 0; }), gold: gold, price: price, wave: wave, wallHp: wallHp, blobs: blobs.length, merges: merges, kills: kills,
          cells: grid.map(function (b, i) { return cellC(i); }), buy: { x: buyB.x + buyB.w / 2, y: buyB.y + buyB.h / 2 } };
      };
      grid = []; for (var i = 0; i < COLS * ROWS; i++) grid.push(null);
      blobs = []; shots = []; gold = 30; price = 6; wave = 0; wallHp = WALL; hold = null; hover = -1; kbCur = 0; kbHold = -1; merges = 0; kills = 0; tutT = 0; best = 1; shake = 0;
      layout(K);
      grid[5] = { l: 1, cd: 0.5, pop: 0, ang: -Math.PI / 2 };
      breakT = 1.2; toSpawn = 0;
    },
    revive: function (K) { wallHp = WALL; blobs.forEach(function (b) { if (b.y > (fieldTop + wallY) / 2) b.y = fieldTop - b.r; }); },
    pointerDown: function (x, y, K, id) {
      kb = false;
      if (x >= buyB.x && x <= buyB.x + buyB.w && y >= buyB.y && y <= buyB.y + buyB.h) { if (!buy(K) && grid.every(Boolean)) K.floatText(K.W / 2, buyB.y - 10, K.t('full'), '#241B4D', 20); return; }
      var i = cellAt(x, y); if (i >= 0 && grid[i]) { hold = { from: i, id: id, x: x, y: y }; K.sfx('click'); }
    },
    pointerMove: function (x, y, K, id) { if (hold && hold.id === id) { hold.x = x; hold.y = y; hover = cellAt(x, y); } },
    pointerUp: function (x, y, K, id) { if (!hold || hold.id !== id) return; var h = hold; hold = null; hover = -1; drop(K, h.from, cellAt(x, y)); },
    pointerCancel: function () { hold = null; hover = -1; },
    key: function (code, down, K, rep) {
      if (!down) return; kb = true;
      var m = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[code];
      if (m) { var c = K.clamp(kbCur % COLS + m[0], 0, COLS - 1), r = K.clamp(Math.floor(kbCur / COLS) + m[1], 0, ROWS - 1); kbCur = r * COLS + c; K.sfx('tick'); }
      else if (code === 'KeyB' || code === 'KeyX') buy(K);
      else if ((code === 'Space' || code === 'Enter') && !rep) {
        if (kbHold < 0) { if (grid[kbCur]) { kbHold = kbCur; K.sfx('click'); } }
        else { drop(K, kbHold, kbCur); kbHold = -1; }
      }
    },
    update: function (dt, K) {
      tutT += dt; shake = Math.max(0, shake - dt);
      if (breakT > 0) { breakT -= dt; if (breakT <= 0) startWave(K); }
      else if (toSpawn > 0) { spawnT -= dt; if (spawnT <= 0) { toSpawn--; spawn(K); if (toSpawn > 1 && Math.random() < 0.35 + Math.min(0.4, wave * 0.03)) { toSpawn--; spawn(K); } spawnT = Math.max(0.4, 1.1 - wave * 0.03) * K.rand(0.7, 1.3); } }
      else if (!blobs.length) { breakT = 1.6; gold += 5 + wave; K.addScore(10 * wave); K.sfx('reward'); if (wave % 5 === 0) { K.confetti(50); } }
      // blasters
      grid.forEach(function (b, i) {
        if (!b) return; b.pop = Math.max(0, b.pop - dt * 3); b.kick = Math.max(0, (b.kick || 0) - dt * 6);
        if (hold && hold.from === i) return;
        var p = cellC(i), t = nearest(p.x, p.y);
        if (t) { var a = Math.atan2(t.y - p.y, t.x - p.x); b.ang += (Math.atan2(Math.sin(a - b.ang), Math.cos(a - b.ang))) * Math.min(1, dt * 12); }
        b.cd -= dt;
        if (t && b.cd <= 0) {
          b.cd = 1 / rateOf(b.l); b.kick = 1;
          shots.push({ x: p.x + Math.cos(b.ang) * cs * 0.4, y: p.y + Math.sin(b.ang) * cs * 0.4, t: t, d: dmgOf(b.l), l: b.l, vx: Math.cos(b.ang), vy: Math.sin(b.ang), life: 1.6 });
        }
      });
      // shots home in on their blob
      var SP = cs * 11;
      shots = shots.filter(function (s) {
        s.life -= dt; if (s.life <= 0) return false;
        if (s.t && s.t.hp > 0) { var dx = s.t.x - s.x, dy = s.t.y - s.y, L = Math.sqrt(dx * dx + dy * dy) || 1; s.vx = dx / L; s.vy = dy / L;
          if (L < s.t.r + SP * dt) { var b = s.t; b.hp -= s.d; b.hit = 0.07; K.burst(s.x, s.y, [LC[s.l - 1], '#FFFFFF'], 3, 90, 3);
            if (b.hp <= 0) { kills++; gold += b.gold; K.addScore(b.boss ? 100 : 5 + wave); K.burst(b.x, b.y, [b.col, '#FFFFFF', '#FFD23F'], b.boss ? 40 : 14, 260, 6); K.sfx(b.boss ? 'reward' : 'pop');
              K.floatText(b.x, b.y, '+' + b.gold, '#E0A100', b.boss ? 30 : 20); if (b.boss) { K.addCoins(2 + Math.floor(wave / 10), b.x, b.y); K.shake(10); } }
            return false; } }
        s.x += s.vx * SP * dt; s.y += s.vy * SP * dt; return s.y > 0 && s.y < K.H && s.x > 0 && s.x < K.W;
      });
      // blobs walk to the wall
      blobs = blobs.filter(function (b) {
        if (b.hp <= 0) return false; b.hit = Math.max(0, b.hit - dt); b.y += b.sp * dt;
        if (b.y + b.r * 0.85 >= wallY) {
          wallHp -= b.boss ? 3 : 1; shake = 0.25; K.shake(12); K.haptic(40); K.sfx('wrong'); K.floatText(b.x, wallY - 30, K.t('wallHit'), '#FF5E5B', 24);
          K.burst(b.x, wallY, [b.col, '#FFFFFF'], 16, 220, 6); return false;
        }
        return true;
      });
      if (wallHp <= 0) { wallHp = 0; K.gameOver({}); return; }
      K.info(K.t('wave') + ' ' + Math.max(1, wave));
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H;
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#E6F7FF'); g.addColorStop(1, '#F3EEFF'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // field lanes
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; K.roundRect(ctx, fx, fieldTop, fw, wallY - fieldTop + 6, 22); ctx.fill();
      ctx.fillStyle = 'rgba(123,77,255,0.07)'; for (var y = fieldTop + 26, row = 0; y < wallY - 10; y += 46, row++) for (var x = fx + 22 + (row % 2) * 23; x < fx + fw - 10; x += 46) { ctx.beginPath(); ctx.arc(x, y, 3, 0, K.TAU); ctx.fill(); }
      // wall (hearts)
      var wy = wallY, ox = shake > 0 && !K.reduceMotion ? Math.sin(K.time * 80) * 4 : 0;
      var nb = Math.max(6, Math.round(fw / 60)), bw = (fw + 8) / nb;
      ctx.fillStyle = '#C9B8FF'; K.roundRect(ctx, fx - 8 + ox, wy - 6, fw + 16, 18, 9); ctx.fill();
      ctx.fillStyle = '#9B6BFF'; for (var k = 0; k < nb; k++) { K.roundRect(ctx, fx - 4 + ox + k * bw, wy - 4, bw - 4, 14, 5); ctx.fill(); }
      for (var h = 0; h < WALL; h++) { var hx = fx + fw - 14 - (WALL - 1 - h) * 24, on = h < wallHp; ctx.fillStyle = on ? '#FF5E5B' : 'rgba(36,27,77,0.2)';
        ctx.save(); ctx.translate(hx, fieldTop - 16); ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-11, -1, -6, -10, 0, -4); ctx.bezierCurveTo(6, -10, 11, -1, 0, 6); ctx.fill(); ctx.restore(); }
      ctx.save(); ctx.beginPath(); ctx.rect(0, fieldTop, W, H); ctx.clip(); blobs.forEach(function (b) { drawBlob(ctx, K, b); }); ctx.restore();
      // shots
      shots.forEach(function (s) { ctx.fillStyle = LC[s.l - 1]; ctx.beginPath(); ctx.arc(s.x, s.y, 4 + s.l * 0.7, 0, K.TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(s.x - 1, s.y - 1, 1.5 + s.l * 0.25, 0, K.TAU); ctx.fill(); });
      // grid
      for (var i = 0; i < grid.length; i++) {
        var p = cellC(i), b = grid[i], sameL = hold && grid[hold.from] && b && i !== hold.from && b.l === grid[hold.from].l;
        ctx.fillStyle = sameL ? 'rgba(255,210,63,0.45)' : (i === hover ? 'rgba(123,77,255,0.18)' : 'rgba(255,255,255,0.75)');
        K.roundRect(ctx, p.x - cs / 2 + 4, p.y - cs / 2 + 4, cs - 8, cs - 8, cs * 0.18); ctx.fill();
        ctx.strokeStyle = 'rgba(123,77,255,0.18)'; ctx.lineWidth = 2; ctx.stroke();
        if (b && !(hold && hold.from === i)) drawBlaster(ctx, K, p.x, p.y, b, cs);
        if ((i === kbCur || i === kbHold) && (kbHold >= 0 || kb)) { ctx.strokeStyle = i === kbHold ? '#FFD23F' : '#FF8A1F'; ctx.lineWidth = 4; K.roundRect(ctx, p.x - cs / 2 + 2, p.y - cs / 2 + 2, cs - 4, cs - 4, cs * 0.2); ctx.stroke(); }
      }
      if (hold && grid[hold.from]) drawBlaster(ctx, K, hold.x, hold.y - cs * 0.25, grid[hold.from], cs * 1.1);
      K.steady(ctx, function () { // HUD layer: stays still while the scene shakes
      // buy button
      var can = gold >= price && grid.some(function (q) { return !q; }), bb = buyB;
      ctx.fillStyle = can ? '#3C9A1E' : '#9C94C7'; K.roundRect(ctx, bb.x, bb.y + 5, bb.w, bb.h, bb.h / 2); ctx.fill();
      ctx.fillStyle = can ? '#7ED957' : '#C9C3E8'; K.roundRect(ctx, bb.x, bb.y, bb.w, bb.h, bb.h / 2); ctx.fill();
      ctx.font = K.font(Math.round(bb.h * 0.36)); ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillStyle = can ? '#143A0A' : '#5E5689';
      ctx.fillText('+ ' + K.t('buy') + '   ' + K.fmt(price), bb.x + bb.w / 2 - bb.h * 0.25, bb.y + bb.h / 2 + 1);
      goldCoin(ctx, K, bb.x + bb.w - bb.h * 0.55, bb.y + bb.h / 2, bb.h * 0.2);
      // gold
      ctx.font = K.font(20); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; goldCoin(ctx, K, fx + 14, fieldTop - 16, 10); ctx.fillStyle = '#241B4D'; ctx.fillText(K.fmt(gold), fx + 30, fieldTop - 15);
      // tutorial: buy, then merge two of the same
      if (K.tutorial && state === 'playing') {
        var pair = null, lv = {};
        grid.forEach(function (q, j) { if (!q || pair) return; if (lv[q.l] !== undefined) pair = [j, lv[q.l]]; else lv[q.l] = j; });
        var k2 = (tutT * 0.8) % 1, sc = Math.min(W, H) / 200;
        if (pair && !hold) { var A = cellC(pair[0]), B = cellC(pair[1]), e = Math.min(1, Math.max(0, (k2 - 0.15) / 0.6)); K.drawHand(ctx, A.x + (B.x - A.x) * e, A.y + (B.y - A.y) * e + cs * 0.2, k2 > 0.1 && k2 < 0.8, sc); }
        else if (!pair && can) { K.drawHand(ctx, bb.x + bb.w / 2, bb.y + bb.h * 0.6 + (k2 < 0.5 ? k2 : 1 - k2) * 14, k2 > 0.4 && k2 < 0.6, sc); }
      }
      });
    }
  });
})();
