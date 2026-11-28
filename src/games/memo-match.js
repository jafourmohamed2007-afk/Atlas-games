/* Memo Match — original memory card game for Bubzi */
(function () {
  'use strict';
  var ICONS = ['star', 'heart', 'moon', 'sun', 'drop', 'leaf', 'bolt', 'gem', 'flower', 'cloud', 'apple', 'fish', 'crown', 'bell', 'note'];
  var ICOL = { star: '#FFC93C', heart: '#FF5FA2', moon: '#7B4DFF', sun: '#FF8A1F', drop: '#38B6FF', leaf: '#14C8A0', bolt: '#F2B705', gem: '#00A99D',
    flower: '#E8364F', cloud: '#7FA8FF', apple: '#E8364F', fish: '#FF8A1F', crown: '#D9A000', bell: '#B69CFF', note: '#241B4D' };
  var LEVELS = [[2, 3], [3, 4], [4, 4], [4, 5], [4, 6], [5, 6]];
  var cards, cols, rows, cw, ch, gx, gy, gap, open, level, timeLeft, timeMax, streak, preview, cursor, pendingT, clearT, tutStep, kb;

  function layout(K) {
    if (!cards) return;
    var L = LEVELS[Math.min(level - 1, LEVELS.length - 1)], a = L[0], b = L[1];
    var top = K.hudH + 46, availW = K.W - 24, availH = K.H - top - 14;
    // put the longer side along the longer screen axis
    if (availW > availH) { cols = Math.max(a, b); rows = Math.min(a, b); } else { cols = Math.min(a, b); rows = Math.max(a, b); }
    gap = Math.max(6, Math.min(12, K.W / 50));
    var cwMax = (availW - gap * (cols - 1)) / cols, chMax = (availH - gap * (rows - 1)) / rows;
    cw = Math.min(cwMax, chMax * 0.8, 130); ch = cw * 1.25;
    gx = (K.W - (cw * cols + gap * (cols - 1))) / 2; gy = top + (availH - (ch * rows + gap * (rows - 1))) / 2;
    cards.forEach(function (c, i) { c.r = Math.floor(i / cols); c.c = i % cols; });
  }
  function startLevel(K) {
    var L = LEVELS[Math.min(level - 1, LEVELS.length - 1)], n = L[0] * L[1], pairs = n / 2;
    var pool = ICONS.slice().sort(function () { return Math.random() - 0.5; }).slice(0, pairs), deck = pool.concat(pool);
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    cards = deck.map(function (ic) { return { icon: ic, up: true, done: false, flip: 1, pop: 0 }; });
    // after the biggest board (level 6) the boards stay the same size but get tighter: shorter peek, less time per pair
    var deep = Math.max(0, level - LEVELS.length);
    open = []; preview = Math.max(1, Math.min(3, 1 + pairs * 0.18) - Math.min(1, deep * 0.15)); pendingT = 0; clearT = 0;
    timeMax = Math.round(pairs * 5.5 + 8 - Math.min(10, (level - 1) * 1.5) - Math.min(pairs * 1.4, deep * 2)); timeLeft = timeMax;
    cursor = 0; layout(K);
  }
  function cardAt(x, y) {
    for (var i = 0; i < cards.length; i++) { var c = cards[i], X = gx + c.c * (cw + gap), Y = gy + c.r * (ch + gap); if (x >= X && x <= X + cw && y >= Y && y <= Y + ch) return i; }
    return -1;
  }
  function center(i) { var c = cards[i]; return { x: gx + c.c * (cw + gap) + cw / 2, y: gy + c.r * (ch + gap) + ch / 2 }; }
  function flipCard(K, i) {
    if (preview > 0 || clearT > 0 || i < 0) return;
    var c = cards[i]; if (c.done || c.up) return;
    if (open.length === 2) { open.forEach(function (j) { cards[j].up = false; }); open = []; pendingT = 0; }
    c.up = true; open.push(i); K.sfx('click');
    if (open.length === 2) {
      var a = cards[open[0]], b = cards[open[1]];
      if (a.icon === b.icon) {
        a.done = b.done = true; streak++; var gain = 20 + (streak - 1) * 10; K.addScore(gain);
        var p = center(open[1]); K.floatText(p.x, p.y, '+' + gain, '#FFFFFF', 26);
        [open[0], open[1]].forEach(function (j) { var q = center(j); K.burst(q.x, q.y, [ICOL[a.icon], '#FFFFFF', '#FFC93C'], 12, 200, 5); cards[j].pop = 1; });
        K.sfx(streak > 1 ? 'combo' : 'star'); K.haptic(12); open = [];
        tutStep = 2; K.tutorialDone();
        if (cards.every(function (q) { return q.done; })) {
          var bonus = Math.ceil(timeLeft) * 5; K.addScore(bonus); K.addCoins(2 + level, K.W / 2, K.H / 2);
          K.floatText(K.W / 2, K.H * 0.4, K.t('clear') + ' +' + bonus, '#FFC93C', 34); K.confetti(70); K.sfx('reward'); clearT = 1.3;
        }
      } else { streak = 0; pendingT = 0.75; K.sfx('wrong'); }
    }
  }

  function drawIcon(ctx, K, id, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = ICOL[id]; ctx.strokeStyle = ICOL[id]; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var r = s / 2;
    switch (id) {
      case 'star': K.star(ctx, r); break;
      case 'heart': ctx.beginPath(); ctx.moveTo(0, r * 0.8); ctx.bezierCurveTo(-r * 1.3, -r * 0.1, -r * 0.6, -r * 1.1, 0, -r * 0.4); ctx.bezierCurveTo(r * 0.6, -r * 1.1, r * 1.3, -r * 0.1, 0, r * 0.8); ctx.fill(); break;
      case 'moon': ctx.beginPath(); ctx.arc(0, 0, r * 0.85, Math.PI * 0.35, Math.PI * 1.65); ctx.arc(r * 0.35, -r * 0.05, r * 0.65, Math.PI * 1.45, Math.PI * 0.55, true); ctx.fill(); break;
      case 'sun': ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, K.TAU); ctx.fill(); ctx.lineWidth = r * 0.16; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65); ctx.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92); ctx.stroke(); } break;
      case 'drop': ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.bezierCurveTo(r * 0.3, -r * 0.4, r * 0.75, 0, r * 0.75, r * 0.3); ctx.arc(0, r * 0.3, r * 0.75, 0, Math.PI); ctx.bezierCurveTo(-r * 0.75, 0, -r * 0.3, -r * 0.4, 0, -r * 0.9); ctx.fill(); break;
      case 'leaf': ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 0.8); ctx.quadraticCurveTo(-r * 0.9, -r * 0.9, r * 0.8, -r * 0.8); ctx.quadraticCurveTo(r * 0.9, r * 0.9, -r * 0.8, r * 0.8); ctx.fill(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.6); ctx.lineTo(r * 0.5, -r * 0.5); ctx.stroke(); break;
      case 'bolt': ctx.beginPath(); ctx.moveTo(r * 0.2, -r); ctx.lineTo(-r * 0.6, r * 0.15); ctx.lineTo(-r * 0.05, r * 0.15); ctx.lineTo(-r * 0.25, r); ctx.lineTo(r * 0.6, -r * 0.2); ctx.lineTo(r * 0.05, -r * 0.2); ctx.closePath(); ctx.fill(); break;
      case 'gem': ctx.beginPath(); ctx.moveTo(-r * 0.8, -r * 0.3); ctx.lineTo(-r * 0.4, -r * 0.8); ctx.lineTo(r * 0.4, -r * 0.8); ctx.lineTo(r * 0.8, -r * 0.3); ctx.lineTo(0, r * 0.9); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.moveTo(-r * 0.4, -r * 0.3); ctx.lineTo(0, -r * 0.75); ctx.lineTo(r * 0.4, -r * 0.3); ctx.closePath(); ctx.fill(); break;
      case 'flower': for (var p = 0; p < 5; p++) { var pa = p * K.TAU / 5; ctx.beginPath(); ctx.arc(Math.cos(pa) * r * 0.48, Math.sin(pa) * r * 0.48, r * 0.38, 0, K.TAU); ctx.fill(); } ctx.fillStyle = '#FFC93C'; ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, K.TAU); ctx.fill(); break;
      case 'cloud': ctx.beginPath(); ctx.arc(-r * 0.4, r * 0.15, r * 0.42, 0, K.TAU); ctx.arc(r * 0.1, -r * 0.15, r * 0.52, 0, K.TAU); ctx.arc(r * 0.5, r * 0.2, r * 0.38, 0, K.TAU); ctx.fill(); ctx.fillRect(-r * 0.4, r * 0.1, r * 0.9, r * 0.47); break;
      case 'apple': ctx.beginPath(); ctx.arc(-r * 0.28, r * 0.1, r * 0.55, 0, K.TAU); ctx.arc(r * 0.28, r * 0.1, r * 0.55, 0, K.TAU); ctx.fill(); ctx.fillStyle = '#14C8A0'; ctx.beginPath(); ctx.ellipse(r * 0.2, -r * 0.65, r * 0.25, r * 0.12, -0.6, 0, K.TAU); ctx.fill(); break;
      case 'fish': ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 0.62, r * 0.42, 0, 0, K.TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(r * 0.4, 0); ctx.lineTo(r * 0.95, -r * 0.45); ctx.lineTo(r * 0.95, r * 0.45); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-r * 0.4, -r * 0.08, r * 0.1, 0, K.TAU); ctx.fill(); break;
      case 'crown': ctx.beginPath(); ctx.moveTo(-r * 0.85, r * 0.6); ctx.lineTo(-r * 0.85, -r * 0.4); ctx.lineTo(-r * 0.4, r * 0.05); ctx.lineTo(0, -r * 0.7); ctx.lineTo(r * 0.4, r * 0.05); ctx.lineTo(r * 0.85, -r * 0.4); ctx.lineTo(r * 0.85, r * 0.6); ctx.closePath(); ctx.fill(); break;
      case 'bell': ctx.beginPath(); ctx.moveTo(-r * 0.75, r * 0.55); ctx.quadraticCurveTo(-r * 0.55, r * 0.3, -r * 0.55, -r * 0.1); ctx.arc(0, -r * 0.1, r * 0.55, Math.PI, 0); ctx.quadraticCurveTo(r * 0.55, r * 0.3, r * 0.75, r * 0.55); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, r * 0.7, r * 0.17, 0, K.TAU); ctx.fill(); break;
      case 'note': ctx.beginPath(); ctx.ellipse(-r * 0.3, r * 0.55, r * 0.3, r * 0.22, -0.4, 0, K.TAU); ctx.fill(); ctx.fillRect(-r * 0.06, -r * 0.8, r * 0.14, r * 1.35); ctx.beginPath(); ctx.moveTo(r * 0.08, -r * 0.8); ctx.quadraticCurveTo(r * 0.7, -r * 0.6, r * 0.55, -r * 0.1); ctx.quadraticCurveTo(r * 0.5, -r * 0.45, r * 0.08, -r * 0.5); ctx.fill(); break;
    }
    ctx.restore();
  }

  BubziKit.run({
    id: 'memo-match', coinRate: 0.01,
    title: { en: 'Memo Match', fr: 'Mémo Match', ar: 'ذاكرة التطابق' },
    strings: {
      en: { tagline: 'Flip the cards and find every matching pair!', timeup: "Time's up!", clear: 'Level clear!' },
      fr: { tagline: 'Retourne les cartes et trouve toutes les paires !', timeup: 'Temps écoulé !', clear: 'Niveau réussi !' },
      ar: { tagline: 'اقلب البطاقات واعثر على كل الأزواج المتطابقة!', timeup: 'انتهى الوقت!', clear: 'أحسنت! مستوى جديد' }
    },
    init: function () { },
    resize: layout,
    reset: function (K) {
      if (K.test) K.dbg = function () { return { cards: cards, gx: gx, gy: gy, cw: cw, ch: ch, gap: gap, cols: cols, preview: preview, clearT: clearT, level: level, open: open, timeLeft: timeLeft }; }; level = 1; streak = 0; tutStep = 0; kb = false; startLevel(K); },
    revive: function (K) { timeLeft = Math.max(timeLeft, 0) + 15; timeMax = Math.max(timeMax, timeLeft); open.forEach(function (j) { cards[j].up = false; }); open = []; },
    pointerDown: function (x, y, K) { kb = false; flipCard(K, cardAt(x, y)); },
    key: function (code, down, K, rep) {
      if (!down) return;
      var m = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[code];
      if (m) { kb = true; var c = cursor % cols + m[0], r = Math.floor(cursor / cols) + m[1]; c = K.clamp(c, 0, cols - 1); r = K.clamp(r, 0, rows - 1); cursor = Math.min(cards.length - 1, r * cols + c); K.sfx('tick'); }
      else if ((code === 'Space' || code === 'Enter') && !rep) { kb = true; flipCard(K, cursor); }
    },
    update: function (dt, K) {
      if (preview > 0) { preview -= dt; if (preview <= 0) { cards.forEach(function (c) { c.up = false; }); K.sfx('whoosh'); } }
      else if (clearT > 0) { clearT -= dt; if (clearT <= 0) { level++; startLevel(K); } }
      else {
        timeLeft -= dt;
        if (timeLeft <= 5 && Math.floor(timeLeft * 2) !== Math.floor((timeLeft + dt) * 2)) K.sfx('tick');
        if (timeLeft <= 0) { timeLeft = 0; K.gameOver({ title: K.t('timeup') }); return; }
      }
      if (pendingT > 0) { pendingT -= dt; if (pendingT <= 0) { open.forEach(function (j) { cards[j].up = false; }); open = []; } }
      cards.forEach(function (c) { var t = c.up || c.done ? 1 : 0; c.flip += (t - c.flip) * Math.min(1, dt * 14); if (c.pop > 0) c.pop = Math.max(0, c.pop - dt * 3); });
      K.info(K.t('level') + ' ' + level);
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H;
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#E2FFF6'); g.addColorStop(1, '#D9CCFF');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // timer bar
      var bw = Math.min(W - 40, 420), bx = (W - bw) / 2, by = K.hudH + 18, f = timeMax ? timeLeft / timeMax : 0;
      ctx.fillStyle = 'rgba(36,27,77,0.12)'; K.roundRect(ctx, bx, by, bw, 14, 7); ctx.fill();
      ctx.fillStyle = f > 0.3 ? '#14C8A0' : (Math.floor(K.time * 6) % 2 ? '#E8364F' : '#FF8A1F'); K.roundRect(ctx, bx, by, Math.max(0, bw * f), 14, 7); ctx.fill();
      // cards
      cards.forEach(function (c, i) {
        var X = gx + c.c * (cw + gap), Y = gy + c.r * (ch + gap), sx = Math.abs(c.flip * 2 - 1), face = c.flip > 0.5, pop = 1 + c.pop * 0.12;
        ctx.save(); ctx.translate(X + cw / 2, Y + ch / 2); ctx.scale(Math.max(0.02, sx) * pop, pop);
        ctx.fillStyle = 'rgba(36,27,77,0.18)'; K.roundRect(ctx, -cw / 2, -ch / 2 + 5, cw, ch, cw * 0.16); ctx.fill();
        if (face) {
          ctx.fillStyle = c.done ? '#FFFBEA' : '#FFFFFF'; K.roundRect(ctx, -cw / 2, -ch / 2, cw, ch, cw * 0.16); ctx.fill();
          drawIcon(ctx, K, c.icon, 0, 0, cw * 0.62);
          if (c.done) { ctx.strokeStyle = '#14C8A0'; ctx.lineWidth = 4; K.roundRect(ctx, -cw / 2 + 2, -ch / 2 + 2, cw - 4, ch - 4, cw * 0.15); ctx.stroke(); }
        } else {
          ctx.fillStyle = '#7B4DFF'; K.roundRect(ctx, -cw / 2, -ch / 2, cw, ch, cw * 0.16); ctx.fill();
          ctx.fillStyle = '#9A73FF'; K.roundRect(ctx, -cw / 2 + cw * 0.08, -ch / 2 + cw * 0.08, cw * 0.84, ch - cw * 0.16, cw * 0.12); ctx.fill();
          K.drawBubzi(ctx, 0, cw * 0.04, cw * 0.24, { mood: 'happy', color: '#FFFFFF', dark: '#C9B8FF' });
        }
        ctx.restore();
        if (kb && i === cursor && state === 'playing') { ctx.strokeStyle = '#FF8A1F'; ctx.lineWidth = 4; K.roundRect(ctx, X - 4, Y - 4, cw + 8, ch + 8, cw * 0.2); ctx.stroke(); }
      });
      // tutorial: point at a pair
      if (K.tutorial && state === 'playing' && preview <= 0 && tutStep < 2 && clearT <= 0) {
        var first = cards.findIndex ? cards.findIndex(function (c) { return !c.done; }) : 0, pair = -1;
        if (first >= 0) for (var j = 0; j < cards.length; j++) if (j !== first && cards[j].icon === cards[first].icon && !cards[j].done) pair = j;
        var target = open.length === 1 && open[0] === first ? pair : first;
        if (target >= 0) { var p = center(target), k = (K.time * 1.5) % 1; K.drawHand(ctx, p.x, p.y + (k < 0.5 ? k : 1 - k) * 14, k > 0.4 && k < 0.6, Math.min(W, H) / 200); }
      }
    }
  });
})();
