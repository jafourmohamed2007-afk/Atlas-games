/* Number Pop — original educational math bubble game for Bubzi */
(function () {
  'use strict';
  var RIM = ['#7B4DFF', '#FF8A1F', '#14C8A0', '#FF5FA2', '#38B6FF'];
  var bubbles, q, lives, level, correct, typed, nextQT, mood, moodT, tutT, waveT, questionY, firstDone, br;

  function lvlName(K) { return K.t('level') + ' ' + level; }
  function makeQuestion(K) {
    var a, b, op, ans, L = level;
    var kinds = L <= 1 ? ['add10'] : L === 2 ? ['add20'] : L === 3 ? ['add20', 'sub20'] : L === 4 ? ['add50', 'sub50'] : L === 5 ? ['mul5', 'add50'] : L === 6 ? ['mul10', 'sub50'] : ['mul10', 'div', 'add100', 'sub100'];
    var k = K.pick(kinds);
    if (k === 'add10') { a = K.randi(1, 8); b = K.randi(1, 10 - a); op = '+'; ans = a + b; }
    else if (k === 'add20') { a = K.randi(2, 15); b = K.randi(2, 20 - a); op = '+'; ans = a + b; }
    else if (k === 'add50') { a = K.randi(8, 40); b = K.randi(3, 50 - a); op = '+'; ans = a + b; }
    else if (k === 'add100') { a = K.randi(15, 80); b = K.randi(5, 99 - a); op = '+'; ans = a + b; }
    else if (k === 'sub20') { a = K.randi(5, 20); b = K.randi(1, a); op = '−'; ans = a - b; }
    else if (k === 'sub50') { a = K.randi(15, 50); b = K.randi(2, a); op = '−'; ans = a - b; }
    else if (k === 'sub100') { a = K.randi(30, 99); b = K.randi(5, a); op = '−'; ans = a - b; }
    else if (k === 'mul5') { a = K.randi(2, 5); b = K.randi(2, 10); op = '×'; ans = a * b; }
    else if (k === 'mul10') { a = K.randi(2, 10); b = K.randi(2, 10); op = '×'; ans = a * b; }
    else { b = K.randi(2, 9); ans = K.randi(2, 10); a = b * ans; op = '÷'; }
    q = { a: a, b: b, op: op, ans: ans, t: 0 };
    // bubbles: 1 correct + distractors
    var n = level >= 3 ? 4 : 3, vals = [ans], guard = 0;
    while (vals.length < n && guard++ < 100) {
      var d = ans + K.pick([-10, -2, -1, 1, 2, 3, 10, -3, 5, -5]) * (op === '×' && Math.random() < 0.5 ? K.randi(1, 2) : 1);
      if (d >= 0 && vals.indexOf(d) < 0) vals.push(d);
    }
    while (vals.length < n) vals.push(ans + vals.length * 7);
    vals.sort(function () { return Math.random() - 0.5; });
    var lanes = []; for (var i = 0; i < n; i++) lanes.push((i + 0.5) / n);
    var speed = (55 + Math.min(130, (level - 1) * 16)) * (K.H / 800);
    vals.forEach(function (v, i) {
      bubbles.push({ v: v, ok: v === ans, x: K.W * (0.1 + lanes[i] * 0.8), y: K.H + br + i * br * 0.9 * (0.5 + Math.random()), vy: speed * K.rand(0.9, 1.1),
        ph: Math.random() * 6, col: RIM[(i + level) % RIM.length], pop: 0, bad: 0, q: q });
    });
    typed = '';
  }
  function layout(K) { br = Math.max(30, Math.min(54, Math.min(K.W / 8.5, K.H / 13))); questionY = K.hudH + 46; }
  function loseLife(K, why) {
    lives--; mood = 'sad'; moodT = 1; K.sfx('wrong'); K.shake(6); K.haptic(50);
    if (lives <= 0) K.gameOver({ title: why });
  }
  function popBubble(K, b) {
    if (b.pop || b.q !== q) return;
    if (b.ok) {
      b.pop = 0.01; correct++;
      var gain = 10 + level * 5 + Math.floor(Math.max(0, 1 - q.t / 6) * 10);
      K.addScore(gain); K.floatText(b.x, b.y, '+' + gain, '#FFFFFF', 30);
      K.burst(b.x, b.y, [b.col, '#FFFFFF', '#FFC93C'], 18, 260, 5); K.sfx('pop'); K.haptic(10);
      mood = 'joy'; moodT = 0.8; firstDone = true; K.tutorialDone();
      if (correct % 3 === 0) K.addCoins(1, b.x, b.y - 30);
      bubbles.forEach(function (o) { if (o.q === q && !o.pop) o.fade = 0.01; });
      if (correct % 6 === 0) { level++; K.floatText(K.W / 2, K.H * 0.45, lvlName(K) + '!', '#FFC93C', 40); K.confetti(50); K.sfx('star'); K.addCoins(3); }
      q.done = true; nextQT = 0.45;
    } else {
      b.bad = 0.01; b.pop = 0.01; K.burst(b.x, b.y, ['#9A90C9', '#FFFFFF'], 10, 160, 4);
      loseLife(K, K.t('oops'));
    }
  }

  BubziKit.run({
    id: 'number-pop', coinRate: 0.02,
    title: { en: 'Number Pop', fr: 'Bulles de Calcul', ar: 'فقاعات الأرقام' },
    strings: {
      en: { tagline: 'Pop the bubble with the right answer!', oops: 'Oops, wrong bubble!', slow: 'Too slow!' },
      fr: { tagline: 'Éclate la bulle qui a la bonne réponse !', oops: 'Oups, mauvaise bulle !', slow: 'Trop lent !' },
      ar: { tagline: 'افقع الفقاعة التي تحمل الإجابة الصحيحة!', oops: 'أوه، فقاعة خاطئة!', slow: 'بطيء جداً!' }
    },
    init: layout, resize: layout,
    reset: function (K) {
      if (K.test) K.dbg = function () { return { bubbles: bubbles, q: q, lives: lives, level: level, correct: correct }; };
      layout(K); bubbles = []; lives = 3; level = 1; correct = 0; typed = ''; nextQT = 0; mood = 'happy'; moodT = 0; tutT = 0; firstDone = false; waveT = 0;
      makeQuestion(K);
    },
    revive: function (K) { lives = 2; bubbles = []; nextQT = 0; makeQuestion(K); mood = 'happy'; },
    pointerDown: function (x, y, K) {
      var hit = null, bd = 1e9;
      bubbles.forEach(function (b) { if (b.pop || b.fade || b.q !== q) return; var d = Math.hypot(b.x - x, b.y - y); if (d < br * 1.15 && d < bd) { bd = d; hit = b; } });
      if (hit) popBubble(K, hit);
    },
    key: function (code, down, K, rep) {
      if (!down || rep || q.done) return;
      var m = /^(Digit|Numpad)(\d)$/.exec(code);
      if (m) {
        typed = (typed + m[2]).slice(-3);
        var live = bubbles.filter(function (b) { return b.q === q && !b.pop && !b.fade; });
        var exact = live.filter(function (b) { return String(b.v) === typed; });
        var prefix = live.filter(function (b) { return String(b.v).indexOf(typed) === 0 && String(b.v) !== typed; });
        if (exact.length && !prefix.length) { popBubble(K, exact[0]); typed = ''; }
        else if (!exact.length && !prefix.length) { typed = ''; K.sfx('wrong'); }
        else K.sfx('tick');
      } else if (code === 'Enter' || code === 'Space') {
        var ex = bubbles.filter(function (b) { return b.q === q && !b.pop && !b.fade && String(b.v) === typed; });
        if (ex.length) popBubble(K, ex[0]); typed = '';
      } else if (code === 'Backspace') typed = typed.slice(0, -1);
    },
    update: function (dt, K) {
      tutT += dt; waveT += dt; q.t += dt;
      if (moodT > 0) { moodT -= dt; if (moodT <= 0) mood = 'happy'; }
      for (var i = bubbles.length - 1; i >= 0; i--) {
        var b = bubbles[i];
        if (b.pop) { b.pop += dt; if (b.pop > 0.25) bubbles.splice(i, 1); continue; }
        if (b.fade) { b.fade += dt; b.y -= b.vy * dt * 2; if (b.fade > 0.5) bubbles.splice(i, 1); continue; }
        b.y -= b.vy * dt; b.x += Math.sin(waveT * 1.7 + b.ph) * 18 * dt;
        b.x = K.clamp(b.x, br, K.W - br);
        if (b.y < questionY + br * 0.4) {
          bubbles.splice(i, 1);
          if (b.ok && b.q === q && !q.done) {
            q.done = true; bubbles.forEach(function (o) { if (o.q === q && !o.pop) o.fade = 0.01; });
            loseLife(K, K.t('slow')); nextQT = 0.6;
          }
        }
      }
      if (q.done && K.isPlaying()) { nextQT -= dt; if (nextQT <= 0) makeQuestion(K); }
      K.info(lvlName(K));
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H;
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFE3F1'); g.addColorStop(1, '#D9CCFF');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // soft background dots
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (var d = 0; d < 14; d++) { var dx = (d * 97 + K.time * 8) % (W + 60) - 30, dy = (d * 131) % H; ctx.beginPath(); ctx.arc(dx, dy, 6 + (d % 4) * 4, 0, K.TAU); ctx.fill(); }
      // question pill
      var qs = q.a + ' ' + q.op + ' ' + q.b + ' = ' + (typed ? typed : '?');
      ctx.font = K.font(Math.min(44, W / 9)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var tw = ctx.measureText(qs).width + 48, qh = Math.min(64, W / 6.5);
      ctx.fillStyle = '#C9B8FF'; K.roundRect(ctx, W / 2 - tw / 2, questionY - qh / 2 + 5, tw, qh, qh / 2); ctx.fill();
      ctx.fillStyle = '#241B4D'; K.roundRect(ctx, W / 2 - tw / 2, questionY - qh / 2, tw, qh, qh / 2); ctx.fill();
      ctx.save(); ctx.direction = 'ltr'; ctx.fillStyle = '#FFFFFF'; ctx.fillText(qs, W / 2, questionY + 2); ctx.restore();
      // lives
      for (var l = 0; l < 3; l++) {
        var hx = 22 + l * 30, hy = questionY + qh / 2 + 22, on = l < lives;
        ctx.fillStyle = on ? '#FF5FA2' : 'rgba(36,27,77,0.18)';
        ctx.beginPath(); ctx.moveTo(hx, hy + 9); ctx.bezierCurveTo(hx - 16, hy - 2, hx - 8, hy - 14, hx, hy - 5); ctx.bezierCurveTo(hx + 8, hy - 14, hx + 16, hy - 2, hx, hy + 9); ctx.fill();
      }
      // Bubzi blowing bubbles at the bottom
      var bob = Math.sin(K.time * 2.5) * 3;
      K.drawBubzi(ctx, W / 2, H - Math.min(60, H * 0.08) + bob, Math.min(44, W / 9), { mood: state === 'dying' || state === 'over' ? 'sad' : mood, lookY: -1 });
      // bubbles
      bubbles.forEach(function (b) {
        var r = br, a = 1;
        if (b.pop) { r = br * (1 + b.pop * 2); a = 1 - b.pop / 0.25; }
        if (b.fade) a = 1 - b.fade / 0.5;
        ctx.globalAlpha = Math.max(0, a);
        var wob = Math.sin(K.time * 5 + b.ph) * 0.04;
        ctx.save(); ctx.translate(b.x, b.y); ctx.scale(1 + wob, 1 - wob);
        ctx.fillStyle = b.bad ? 'rgba(232,54,79,0.35)' : 'rgba(255,255,255,0.72)';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, K.TAU); ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = b.col; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.45, r * 0.2, r * 0.12, -0.6, 0, K.TAU); ctx.fill();
        ctx.fillStyle = '#241B4D'; ctx.font = K.font(r * (String(b.v).length > 2 ? 0.7 : 0.9)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.direction = 'ltr'; ctx.fillText(String(b.v), 0, r * 0.06);
        ctx.restore(); ctx.globalAlpha = 1;
      });
      // tutorial: point at the right bubble
      if (K.tutorial && !firstDone && state === 'playing') {
        var c = null; bubbles.forEach(function (b) { if (b.ok && b.q === q && !b.pop && !b.fade && b.y < H - br) c = b; });
        if (c) { var k = (tutT * 1.5) % 1; K.drawHand(ctx, c.x + 6, c.y + br * 0.35 + (k < 0.5 ? k : 1 - k) * 16, k > 0.4 && k < 0.6, Math.min(W, H) / 200); }
      }
    }
  });
})();
