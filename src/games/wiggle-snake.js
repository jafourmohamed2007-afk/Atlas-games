/* Wiggle Snake — original snake game for Bubzi */
(function () {
  'use strict';
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var cols, rows, cell, ox, oy, body, prev, dir, queue, acc, grow, fruit, gold, goldT, eaten, waiting, tutT, deadT, nextGoldIn;

  function layout(K) {
    var aw = K.W - 20, ah = K.H - K.hudH - 22;
    var target = Math.max(22, Math.min(34, Math.min(aw, ah) / 13));
    cols = Math.max(11, Math.min(26, Math.floor(aw / target)));
    rows = Math.max(11, Math.min(30, Math.floor(ah / target)));
    cell = Math.floor(Math.min(aw / cols, ah / rows));
    ox = Math.floor((K.W - cols * cell) / 2); oy = K.hudH + 10 + Math.floor((ah - rows * cell) / 2);
  }
  function occupied(x, y) { for (var i = 0; i < body.length; i++) if (body[i].x === x && body[i].y === y) return true; return false; }
  function freeCell(K) {
    for (var t = 0; t < 500; t++) { var x = K.randi(0, cols - 1), y = K.randi(0, rows - 1); if (!occupied(x, y) && !(fruit && fruit.x === x && fruit.y === y) && !(gold && gold.x === x && gold.y === y)) return { x: x, y: y }; }
    return null;
  }
  function layBody(len) {
    var y = Math.floor(rows / 2), x0 = Math.max(len, Math.floor(cols / 2));
    body = []; for (var i = 0; i < len; i++) body.push({ x: Math.min(cols - 1, x0) - i, y: y });
    prev = body.map(function (s) { return { x: s.x, y: s.y }; });
    dir = 'right'; queue = []; acc = 0; waiting = true;
  }
  function stepTime() { return 1 / Math.min(14, 6.5 + eaten * 0.22); }
  function turn(K, d) {
    if (!DIRS[d]) return;
    var last = queue.length ? queue[queue.length - 1] : dir, a = DIRS[d], b = DIRS[last];
    if (a[0] === -b[0] && a[1] === -b[1]) {
      if (waiting && !queue.length) { body.reverse(); prev = body.map(function (s) { return { x: s.x, y: s.y }; }); dir = d; waiting = false; }
      return;
    }
    if (d === last) { if (waiting) waiting = false; return; }
    if (queue.length < 3) queue.push(d);
    waiting = false;
  }
  function step(K) {
    prev = body.map(function (s) { return { x: s.x, y: s.y }; });
    if (queue.length) dir = queue.shift();
    var h = body[0], d = DIRS[dir], nx = h.x + d[0], ny = h.y + d[1];
    var willGrow = grow > 0 || (fruit && fruit.x === nx && fruit.y === ny) || (gold && gold.x === nx && gold.y === ny);
    var hitSelf = false;
    for (var i = 0; i < body.length - (willGrow ? 0 : 1); i++) if (body[i].x === nx && body[i].y === ny) hitSelf = true;
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || hitSelf) {
      deadT = 0.01; K.shake(9); K.burst(ox + (h.x + 0.5) * cell, oy + (h.y + 0.5) * cell, ['#FFFFFF', '#FF5FA2', '#FFC93C'], 24, 260, 5); K.sfx('hit');
      K.gameOver({ title: K.t(hitSelf ? 'self' : 'wall') }); return;
    }
    body.unshift({ x: nx, y: ny });
    var px = ox + (nx + 0.5) * cell, py = oy + (ny + 0.5) * cell;
    if (fruit && fruit.x === nx && fruit.y === ny) {
      grow += 1; eaten++; K.addScore(10 + Math.floor(eaten / 5) * 2); K.sfx('eat'); K.haptic(8);
      K.burst(px, py, ['#E8364F', '#FFFFFF', '#14C8A0'], 10, 160, 4);
      if (eaten % 5 === 0) K.addCoins(1, px, py - 20);
      fruit = freeCell(K); nextGoldIn--;
      if (nextGoldIn <= 0 && !gold) { gold = freeCell(K); goldT = 6; nextGoldIn = K.randi(6, 10); }
      K.tutorialDone();
    }
    if (gold && gold.x === nx && gold.y === ny) {
      grow += 2; K.addScore(50); K.addCoins(2, px, py - 20); K.sfx('star'); K.floatText(px, py - 40, '+50', '#FFC93C', 30);
      K.burst(px, py, ['#FFC93C', '#FFFFFF'], 18, 220, 5); gold = null;
    }
    if (grow > 0) grow--; else body.pop();
    if (!fruit) fruit = freeCell(K);
  }

  BubziKit.run({
    id: 'wiggle-snake', coinRate: 0.02,
    title: { en: 'Wiggle Snake', fr: 'Serpent Wiggle', ar: 'الثعبان المتمايل' },
    strings: {
      en: { tagline: 'Eat the fruit, grow long, and never bite your tail!', wall: 'Bonk! Hit the wall!', self: 'Ouch! Bit your tail!' },
      fr: { tagline: 'Mange les fruits, grandis et ne mords pas ta queue !', wall: 'Bonk ! Le mur !', self: 'Aïe ! Tu as mordu ta queue !' },
      ar: { tagline: 'كُل الفاكهة وكبر ولا تعضّ ذيلك!', wall: 'بونك! اصطدمت بالجدار!', self: 'آخ! عضضت ذيلك!' }
    },
    init: layout,
    resize: function (K) {
      var oc = cols, or = rows; layout(K);
      // keep everything on the board after a resize
      if (body && (cols !== oc || rows !== or)) {
        var off = body.some(function (s) { return s.x >= cols || s.y >= rows; });
        if (off) layBody(Math.min(body.length, cols - 2));
        if (fruit && (fruit.x >= cols || fruit.y >= rows)) fruit = freeCell(K);
        if (gold && (gold.x >= cols || gold.y >= rows)) gold = null;
      }
    },
    reset: function (K) {
      if (K.test) K.dbg = function () { return { body: body, fruit: fruit, dir: dir, cols: cols, rows: rows, waiting: waiting, ox: ox, oy: oy, cell: cell, queue: queue }; };
      layout(K); eaten = 0; grow = 0; gold = null; goldT = 0; tutT = 0; deadT = 0; nextGoldIn = K.randi(5, 8); fruit = null;
      layBody(4); fruit = freeCell(K);
    },
    revive: function (K) { deadT = 0; layBody(Math.max(4, Math.min(body.length, cols - 3))); if (!fruit || occupied(fruit.x, fruit.y)) fruit = freeCell(K); },
    swipe: function (d, K) { turn(K, d); },
    pointerDown: function (x, y, K) {
      // tap: turn toward the tapped point relative to the head
      var h = body[0], hx = ox + (h.x + 0.5) * cell, hy = oy + (h.y + 0.5) * cell, dx = x - hx, dy = y - hy;
      this._tap = { dx: dx, dy: dy };
    },
    pointerUp: function (x, y, K) {
      var t = this._tap; this._tap = null; if (!t) return;
      var h = body[0], hx = ox + (h.x + 0.5) * cell, hy = oy + (h.y + 0.5) * cell, dx = x - hx, dy = y - hy;
      if (Math.abs(x - (hx + t.dx)) > 20 || Math.abs(y - (hy + t.dy)) > 20) return; // was a swipe
      var horiz = dir === 'up' || dir === 'down';
      if (waiting) { turn(K, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); return; }
      turn(K, horiz ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    },
    key: function (code, down, K) {
      if (!down) return;
      var m = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' }[code];
      if (m) turn(K, m); else if (code === 'Space' && waiting) waiting = false;
    },
    update: function (dt, K) {
      tutT += dt;
      if (gold) { goldT -= dt; if (goldT <= 0) gold = null; }
      if (waiting) return;
      acc += dt;
      var st = stepTime(), guard = 0;
      while (acc >= st && guard++ < 4) { acc -= st; step(K); if (!K.isPlaying()) return; }
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H, x, y;
      ctx.fillStyle = '#DFF7EC'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0FA684'; K.roundRect(ctx, ox - 8, oy - 8 + 5, cols * cell + 16, rows * cell + 16, 18); ctx.fill();
      ctx.fillStyle = '#B8F0D6'; K.roundRect(ctx, ox - 8, oy - 8, cols * cell + 16, rows * cell + 16, 18); ctx.fill();
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) { ctx.fillStyle = (x + y) % 2 ? '#C9F5E0' : '#D9FAEA'; ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell); }
      // fruit
      function drawFruit(f, golden) {
        var fx = ox + (f.x + 0.5) * cell, fy = oy + (f.y + 0.5) * cell + Math.sin(K.time * 5 + f.x) * cell * 0.06, r = cell * 0.36;
        if (golden) { ctx.fillStyle = 'rgba(255,201,60,0.35)'; ctx.beginPath(); ctx.arc(fx, fy, r * 1.7, 0, K.TAU); ctx.fill(); ctx.save(); ctx.translate(fx, fy); ctx.rotate(K.time); ctx.fillStyle = '#FFC93C'; K.star(ctx, r * 1.2); ctx.restore(); return; }
        ctx.fillStyle = '#E8364F'; ctx.beginPath(); ctx.arc(fx - r * 0.3, fy + r * 0.1, r * 0.75, 0, K.TAU); ctx.arc(fx + r * 0.3, fy + r * 0.1, r * 0.75, 0, K.TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(fx - r * 0.45, fy - r * 0.15, r * 0.2, 0, K.TAU); ctx.fill();
        ctx.fillStyle = '#14C8A0'; ctx.beginPath(); ctx.ellipse(fx + r * 0.25, fy - r * 0.75, r * 0.35, r * 0.16, -0.5, 0, K.TAU); ctx.fill();
      }
      if (fruit) drawFruit(fruit, false);
      if (gold && (goldT > 1.5 || Math.floor(goldT * 8) % 2)) drawFruit(gold, true);
      // snake (interpolated)
      var t = waiting || state !== 'playing' ? 1 : Math.min(1, acc / stepTime()), sk = K.skin(), pts = [];
      for (var i = 0; i < body.length; i++) {
        var a = prev[Math.min(i, prev.length - 1)] || body[i], b = body[i];
        pts.push({ x: ox + (a.x + (b.x - a.x) * t + 0.5) * cell, y: oy + (a.y + (b.y - a.y) * t + 0.5) * cell });
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      [[sk.d, 0.86], [sk.c, 0.7]].forEach(function (L) {
        ctx.strokeStyle = L[0]; ctx.lineWidth = cell * L[1]; ctx.beginPath();
        pts.forEach(function (p, k) { if (k === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
        if (pts.length === 1) ctx.lineTo(pts[0].x + 0.1, pts[0].y);
        ctx.stroke();
      });
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (i = 1; i < pts.length; i += 2) { ctx.beginPath(); ctx.arc(pts[i].x - cell * 0.12, pts[i].y - cell * 0.14, cell * 0.1, 0, K.TAU); ctx.fill(); }
      var d = DIRS[dir], hd = pts[0];
      K.drawBubzi(ctx, hd.x, hd.y, cell * 0.62, { mood: state === 'dying' || state === 'over' ? 'sad' : 'happy', lookX: d[0], lookY: d[1] });
      // tutorial / waiting hint
      if (waiting && state === 'playing') {
        var k = (tutT * 1.2) % 1, cx = W / 2, cy = oy + rows * cell * 0.75, len = Math.min(W, H) * 0.16 * k;
        ctx.strokeStyle = 'rgba(36,27,77,0.35)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - len); ctx.stroke();
        K.drawHand(ctx, cx, cy - len, true, Math.min(W, H) / 190);
      }
    }
  });
})();
