/* Arrow Rampart — original wall-defense archery game for Bubzi.
   Pull back to aim, let go to shoot. Stop the raiders before they break your wall, then pick an upgrade card after each wave. */
(function () {
  'use strict';
  var KINDS = {
    grunt: { hp: 2, spd: 1.1, dps: 3, sz: 1, col: '#7ED957', dark: '#3C9A1E', helm: '#A9A3C4', pts: 10 },
    runner: { hp: 1, spd: 2.3, dps: 2, sz: 0.8, col: '#FFC62E', dark: '#B07D00', helm: '#FF7F45', pts: 12 },
    brute: { hp: 7, spd: 0.6, dps: 7, sz: 1.45, col: '#B98BFF', dark: '#6A43C2', helm: '#6E6890', pts: 30 },
    flyer: { hp: 1.5, spd: 1.5, dps: 3, sz: 0.85, col: '#5CC8F2', dark: '#1A6FB0', helm: '#FFFFFF', pts: 20, fly: 1 },
    chief: { hp: 30, spd: 0.45, dps: 15, sz: 2.1, col: '#FF6B8B', dark: '#B02A4A', helm: '#FFD23F', pts: 150 }
  };
  var CARDS = ['power', 'quick', 'multi', 'pierce', 'fire', 'repair', 'stone'];
  var CARD_ICON = { power: '💪', quick: '⚡', multi: '🏹', pierce: '🎯', fire: '🔥', repair: '🧱', stone: '🛡️' };
  var pace, u, gy, wallX, wallTop, archer, vmax, G, dragFull, fieldR;
  var wave, phase, phaseT, foes, arrows, stuck, hp, maxHp, kills, heads, shots, reload, drag, kbAng, kbPow, kbHold, cards, pick, up, queue, spawnT, wallHit, tutT, aimAng, aimPow, lastFire, combo, comboT;

  function layout(K) {
    var sceneH = K.H - K.hudH;
    u = K.clamp(Math.min(K.W * 0.064, sceneH * 0.06), 16, 40);
    gy = K.H > K.W * 1.2 ? K.hudH + sceneH * 0.72 : K.H - Math.max(36, sceneH * 0.13);
    wallX = K.clamp(K.W * 0.17, 3.4 * u, 190);
    wallTop = gy - K.clamp(sceneH * 0.3, 4 * u, 7.5 * u);
    archer = { x: wallX * 0.55, y: wallTop - 1.55 * u };
    fieldR = K.W + 1.2 * u;
    pace = (fieldR - wallX) / 10;
    G = u * 16;
    vmax = Math.sqrt(G * (K.W - archer.x) * 1.25);
    dragFull = K.clamp(Math.min(K.W, sceneH) * 0.3, 90, 220);
  }
  function stopX(f) { return wallX + 0.45 * u + KINDS[f.k].sz * 0.5 * u; }
  /* body + head hit circles in screen coords */
  function body(f) {
    var s = KINDS[f.k].sz * u, y = f.fly ? f.y : gy;
    return { bx: f.x, by: y - s * 0.75, br: s * 0.55, hx: f.x - s * 0.05, hy: y - s * 1.55, hr: s * 0.38 };
  }
  function startWave(K) {
    wave++; phase = 'wave'; queue = [];
    var n = Math.min(40, 5 + wave * 3);
    for (var i = 0; i < n; i++) {
      var r = Math.random(), k = 'grunt';
      if (wave >= 2 && r < 0.25) k = 'runner';
      else if (wave >= 3 && r < 0.42) k = 'brute';
      else if (wave >= 4 && r < 0.58) k = 'flyer';
      queue.push(k);
    }
    if (wave % 5 === 0) queue.splice(Math.floor(n / 2), 0, 'chief');
    spawnT = 0.6;
    K.floatText(K.W / 2, K.hudH + 80, K.t('wave') + ' ' + wave + (wave % 5 === 0 ? ' · ' + K.t('chief') : ''), '#FFFFFF', 30);
    K.sfx(wave % 5 === 0 ? 'boss' : 'whoosh');
  }
  function spawn(K, k) {
    var d = KINDS[k], sc = Math.pow(1.19, wave - 1);
    foes.push({ k: k, x: fieldR + K.rand(0, u), y: d.fly ? wallTop - K.rand(1.2, 3.2) * u : gy, fly: !!d.fly, hp: d.hp * sc, max: d.hp * sc,
      spd: d.spd * K.rand(0.9, 1.1), walk: K.rand(0, 6), hit: 0, burn: 0, atk: 0, bob: K.rand(0, 6), dead: 0 });
  }
  function fire(K, ang, pow) {
    if (reload > 0 || phase !== 'wave' && phase !== 'build') return false;
    var sp = vmax * (0.35 + 0.65 * pow), n = up.multi + 1;
    for (var i = 0; i < n; i++) {
      var a = ang + (i - (n - 1) / 2) * 0.07;
      arrows.push({ x: archer.x + Math.cos(ang) * u * 0.6, y: archer.y - u * 0.1 + Math.sin(ang) * u * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, pierce: up.pierce, hitSet: [], t: 0 });
    }
    reload = 0.6 * Math.pow(0.78, up.quick); shots++; lastFire = 0.15;
    K.sfx('flip'); K.haptic(8); K.tutorialDone();
    return true;
  }
  function damage(K, f, dmg, head, x, y) {
    f.hp -= dmg; f.hit = 1;
    K.burst(x, y, head ? ['#FFFFFF', '#FFD23F'] : ['#FFFFFF', KINDS[f.k].col], head ? 10 : 6, head ? 170 : 110, 3.5);
    if (head) { heads++; K.floatText(Math.min(x, K.W - 70), y - u * 0.6, K.t('head'), '#FFD23F', 18); }
    if (up.fire) f.burn = 2.2;
    if (f.hp <= 0 && !f.dead) {
      f.dead = 0.001; kills++; combo++; comboT = 1.6;
      var pts = KINDS[f.k].pts * (head ? 2 : 1) + (combo > 1 ? combo * 2 : 0);
      K.addScore(pts); K.floatText(Math.min(f.x, K.W - 40), (f.fly ? f.y : gy) - KINDS[f.k].sz * u * 2.1, '+' + pts, '#241B4D', 18);
      K.sfx(f.k === 'chief' ? 'boom' : 'pop');
      if (f.k === 'chief') { K.shake(8); K.confetti(40); K.addCoins(2, f.x, gy - 2 * u); }
      if (combo >= 3 && combo % 3 === 0) { K.sfx('combo'); K.floatText(K.W / 2, K.hudH + 110, K.t('combo') + ' x' + combo, '#FF7F45', 24); }
    } else K.sfx(head ? 'punch' : 'hit');
  }
  function dealCards(K) {
    var pool = CARDS.filter(function (c) { return !(c === 'multi' && up.multi >= 3) && !(c === 'repair' && hp >= maxHp) && !(c === 'pierce' && up.pierce >= 3); });
    var pickd = [];
    while (pickd.length < 3 && pool.length) pickd.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    var cw = Math.min(150, (K.W - 40) / 3), ch = Math.min(190, cw * 1.35), gap = 10, x0 = (K.W - cw * 3 - gap * 2) / 2, y0 = K.hudH + (gy - K.hudH - ch) * 0.42;
    cards = pickd.map(function (id, i) { return { id: id, x: x0 + i * (cw + gap), y: y0, w: cw, h: ch, t: -i * 0.08 }; });
    phase = 'cards'; phaseT = 0;
  }
  function choose(K, c) {
    var id = c.id;
    if (id === 'power') up.power++; else if (id === 'quick') up.quick++; else if (id === 'multi') up.multi++; else if (id === 'pierce') up.pierce++; else if (id === 'fire') up.fire++;
    else if (id === 'repair') hp = Math.min(maxHp, hp + maxHp * 0.45);
    else if (id === 'stone') { maxHp += 40; hp += 40; }
    K.sfx('reward'); K.burst(c.x + c.w / 2, c.y + c.h / 2, ['#FFD23F', '#FFFFFF', '#7ED957'], 18, 200, 4);
    cards = null; phase = 'build'; phaseT = 1.4;
  }
  function inB(b, x, y) { return b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
  function aimFrom(dx, dy) {
    var l = Math.sqrt(dx * dx + dy * dy); if (l < 12) return null;
    var ang = Math.atan2(-dy, -dx); ang = Math.max(-1.45, Math.min(1.35, ang));
    return { ang: ang, pow: Math.min(1, l / dragFull) };
  }

  /* ---------- drawing ---------- */
  function drawFoe(ctx, K, f) {
    var d = KINDS[f.k], s = d.sz * u, x = f.x, y = f.fly ? f.y + Math.sin(K.time * 4 + f.bob) * u * 0.15 : gy, a = f.dead ? Math.max(0, 1 - f.dead * 3) : 1;
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); if (f.dead) ctx.rotate(f.dead * 4);
    var step = f.atk > 0 ? 0 : Math.sin(f.walk) * 0.25;
    if (f.fly) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      var wf = Math.sin(K.time * 18 + f.bob) * 0.5;
      ctx.beginPath(); ctx.ellipse(s * 0.35, -s * 0.95, s * 0.55, s * 0.2, -0.5 + wf, 0, K.TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-s * 0.1, -s * 1.05, s * 0.5, s * 0.18, -0.9 - wf, 0, K.TAU); ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(36,27,77,0.18)'; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.13, 0, 0, K.TAU); ctx.fill();
      ctx.fillStyle = d.dark; ctx.fillRect(-s * 0.3 + step * s, -s * 0.35, s * 0.2, s * 0.35); ctx.fillRect(s * 0.1 - step * s, -s * 0.35, s * 0.2, s * 0.35);
    }
    // body
    ctx.fillStyle = f.hit > 0.5 ? '#FFFFFF' : d.dark; K.roundRect(ctx, -s * 0.5, -s * 1.3, s, s * 1.02, s * 0.4); ctx.fill();
    ctx.fillStyle = f.hit > 0.5 ? '#FFFFFF' : d.col; K.roundRect(ctx, -s * 0.5, -s * 1.36, s, s * 0.98, s * 0.4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 1.15, s * 0.15, s * 0.08, -0.5, 0, K.TAU); ctx.fill();
    // face (looks left at the wall)
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-s * 0.22, -s * 0.95, s * 0.14, 0, K.TAU); ctx.arc(s * 0.08, -s * 0.95, s * 0.14, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#241B4D'; ctx.beginPath(); ctx.arc(-s * 0.26, -s * 0.94, s * 0.07, 0, K.TAU); ctx.arc(s * 0.04, -s * 0.94, s * 0.07, 0, K.TAU); ctx.fill();
    ctx.strokeStyle = '#241B4D'; ctx.lineWidth = Math.max(1.5, s * 0.06); ctx.beginPath(); ctx.moveTo(-s * 0.38, -s * 1.12); ctx.lineTo(-s * 0.12, -s * 1.06); ctx.moveTo(s * 0.2, -s * 1.12); ctx.lineTo(-s * 0.02, -s * 1.06); ctx.stroke();
    ctx.beginPath(); ctx.arc(-s * 0.1, -s * 0.66, s * 0.1, Math.PI + 0.3, -0.3); ctx.stroke();
    // helmet
    ctx.fillStyle = d.helm; ctx.beginPath(); ctx.arc(-s * 0.05, -s * 1.3, s * 0.42, Math.PI, 0); ctx.fill(); ctx.fillRect(-s * 0.5, -s * 1.32, s * 0.9, s * 0.1);
    if (f.k === 'chief') { ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 1.6); ctx.lineTo(-s * 0.3, -s * 1.95); ctx.lineTo(-s * 0.12, -s * 1.72); ctx.lineTo(0, -s * 2); ctx.lineTo(s * 0.12, -s * 1.72); ctx.lineTo(s * 0.3, -s * 1.95); ctx.lineTo(s * 0.25, -s * 1.6); ctx.closePath(); ctx.fill(); }
    else if (f.k === 'brute') { ctx.fillStyle = '#FFFFFF'; [-1, 1].forEach(function (q) { ctx.beginPath(); ctx.moveTo(-s * 0.05 + q * s * 0.32, -s * 1.5); ctx.lineTo(-s * 0.05 + q * s * 0.5, -s * 1.85); ctx.lineTo(-s * 0.05 + q * s * 0.18, -s * 1.62); ctx.fill(); }); }
    else if (f.k === 'runner') { ctx.fillStyle = '#FF7F45'; ctx.beginPath(); ctx.moveTo(s * 0.3, -s * 1.55); ctx.lineTo(s * 0.75, -s * 1.45 + Math.sin(K.time * 20) * s * 0.06); ctx.lineTo(s * 0.32, -s * 1.38); ctx.fill(); }
    // club
    var sw = f.atk > 0 ? Math.sin(f.atk * 9) * 0.9 : 0.3;
    ctx.save(); ctx.translate(-s * 0.45, -s * 0.75); ctx.rotate(-0.4 - sw); ctx.fillStyle = '#8A5A2B'; K.roundRect(ctx, -s * 0.07, -s * 0.75, s * 0.14, s * 0.75, s * 0.06); ctx.fill(); ctx.fillStyle = '#A8733E'; ctx.beginPath(); ctx.arc(0, -s * 0.75, s * 0.16, 0, K.TAU); ctx.fill(); ctx.restore();
    if (f.burn > 0) { for (var i = 0; i < 3; i++) { var fx = (i - 1) * s * 0.3, fl = Math.sin(K.time * 15 + i) * s * 0.08; ctx.fillStyle = i % 2 ? '#FFD23F' : '#FF7F45'; ctx.beginPath(); ctx.ellipse(fx, -s * 1.45 + fl, s * 0.1, s * 0.2, 0, 0, K.TAU); ctx.fill(); } }
    ctx.restore();
    if (!f.dead && f.hp < f.max) { var w = s * 1.1; ctx.fillStyle = 'rgba(36,27,77,0.3)'; ctx.fillRect(x - w / 2, y - s * 2.05, w, 4); ctx.fillStyle = '#FF5FA2'; ctx.fillRect(x - w / 2, y - s * 2.05, w * Math.max(0, f.hp / f.max), 4); }
  }
  function drawArcher(ctx, K, ang, pull) {
    var x = archer.x, y = archer.y, s = u;
    ctx.save(); ctx.translate(x, y);
    // body
    ctx.fillStyle = '#4B3BA8'; K.roundRect(ctx, -s * 0.42, -s * 0.1, s * 0.84, s * 1.0, s * 0.3); ctx.fill();
    ctx.fillStyle = '#6A55E0'; K.roundRect(ctx, -s * 0.42, -s * 0.14, s * 0.84, s * 0.9, s * 0.3); ctx.fill();
    // head + hood
    ctx.fillStyle = '#FFD9B8'; ctx.beginPath(); ctx.arc(0, -s * 0.55, s * 0.38, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#3FA34D'; ctx.beginPath(); ctx.arc(0, -s * 0.6, s * 0.44, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(-s * 0.55, -s * 0.2); ctx.fill();
    ctx.fillStyle = '#E8364F'; ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 1.0); ctx.lineTo(-s * 0.6, -s * 1.25); ctx.lineTo(-s * 0.25, -s * 0.9); ctx.fill();
    ctx.fillStyle = '#241B4D'; ctx.beginPath(); ctx.arc(s * 0.16, -s * 0.52, s * 0.06, 0, K.TAU); ctx.fill();
    // bow
    ctx.rotate(ang); ctx.translate(s * 0.45, 0);
    ctx.strokeStyle = '#8A5A2B'; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-s * 0.2, 0, s * 0.75, -1.15, 1.15); ctx.stroke();
    var bx = -s * 0.2 + Math.cos(1.15) * s * 0.75, by = Math.sin(1.15) * s * 0.75, px = -s * 0.2 - pull * s * 0.75;
    ctx.strokeStyle = '#F4EFE4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx, -by); ctx.lineTo(px, 0); ctx.lineTo(bx, by); ctx.stroke();
    if (reload <= 0) { ctx.fillStyle = '#8A5A2B'; ctx.fillRect(px, -1.5, s * 1.3, 3); ctx.fillStyle = '#9AA7B8'; ctx.beginPath(); ctx.moveTo(px + s * 1.3, -4); ctx.lineTo(px + s * 1.55, 0); ctx.lineTo(px + s * 1.3, 4); ctx.fill(); }
    ctx.restore();
  }
  function arrowShape(ctx, K, x, y, a, s, burn) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = '#8A5A2B'; ctx.fillRect(-s * 0.9, -1.5, s * 1.1, 3);
    ctx.fillStyle = '#9AA7B8'; ctx.beginPath(); ctx.moveTo(s * 0.2, -4); ctx.lineTo(s * 0.45, 0); ctx.lineTo(s * 0.2, 4); ctx.fill();
    ctx.fillStyle = '#E8364F'; ctx.beginPath(); ctx.moveTo(-s * 0.9, 0); ctx.lineTo(-s * 1.05, -4); ctx.lineTo(-s * 0.7, 0); ctx.lineTo(-s * 1.05, 4); ctx.fill();
    if (burn) { ctx.fillStyle = 'rgba(255,127,69,0.85)'; ctx.beginPath(); ctx.arc(s * 0.35, 0, 4 + Math.random() * 2, 0, K.TAU); ctx.fill(); }
    ctx.restore();
  }

  BubziKit.run({
    id: 'arrow-rampart', coinRate: 0.02,
    title: { en: 'Arrow Rampart', fr: 'Rempart des Flèches', ar: 'سور السهام' },
    strings: {
      en: { hint: 'Pull back, let go!', tagline: 'Pull back, let go, and keep the raiders away from your wall!', wave: 'Wave', chief: 'Big chief!', head: 'Headshot!', combo: 'Combo', pick: 'Pick an upgrade', wall: 'Wall',
        power: 'Strong arrows', powerD: '+60% damage', quick: 'Quick hands', quickD: 'Shoot faster', multi: 'Extra arrow', multiD: '+1 arrow each shot', pierce: 'Sharp tips', pierceD: 'Arrows go through 1 more', fire: 'Fire arrows', fireD: 'Hits keep burning', repair: 'Repair wall', repairD: 'Fix 45% of the wall', stone: 'Thicker wall', stoneD: '+40 wall strength' },
      fr: { hint: 'Tire en arrière, lâche !', tagline: 'Tire, lâche et garde les pillards loin de ton rempart !', wave: 'Vague', chief: 'Grand chef !', head: 'En pleine tête !', combo: 'Combo', pick: 'Choisis une amélioration', wall: 'Mur',
        power: 'Flèches fortes', powerD: '+60 % de dégâts', quick: 'Mains rapides', quickD: 'Tire plus vite', multi: 'Flèche bonus', multiD: '+1 flèche par tir', pierce: 'Pointes fines', pierceD: 'Traverse 1 ennemi de plus', fire: 'Flèches de feu', fireD: 'Les coups brûlent', repair: 'Réparer', repairD: 'Répare 45 % du mur', stone: 'Mur épais', stoneD: '+40 de solidité' },
      ar: { hint: 'اسحب للخلف ثم أفلت!', tagline: 'اسحب وأفلت وأبعد الغزاة عن سورك!', wave: 'الموجة', chief: 'الزعيم الكبير!', head: 'إصابة في الرأس!', combo: 'سلسلة', pick: 'اختر تحسيناً', wall: 'السور',
        power: 'سهام قوية', powerD: '+60٪ ضرر', quick: 'أيدٍ سريعة', quickD: 'إطلاق أسرع', multi: 'سهم إضافي', multiD: '+1 سهم في كل رمية', pierce: 'رؤوس حادة', pierceD: 'يخترق عدواً إضافياً', fire: 'سهام نارية', fireD: 'الإصابات تحترق', repair: 'إصلاح السور', repairD: 'يصلح 45٪ من السور', stone: 'سور أسمك', stoneD: '+40 لقوة السور' }
    },
    resize: layout,
    reset: function (K) {
      if (K.test) K.dbg = function () {
        return { wave: wave, phase: phase, hp: Math.round(hp), maxHp: maxHp, kills: kills, heads: heads, shots: shots, reload: reload, up: up,
          archer: { x: archer.x, y: archer.y - u * 0.1 }, G: G, vmax: vmax, dragFull: dragFull, wallX: wallX,
          foes: foes.filter(function (f) { return !f.dead; }).map(function (f) { var b = body(f); return { k: f.k, x: b.bx, y: b.by, hx: b.hx, hy: b.hy, spd: f.atk > 0 ? 0 : f.spd * pace }; }),
          cards: cards ? cards.map(function (c) { return { id: c.id, x: c.x + c.w / 2, y: c.y + c.h / 2 }; }) : null };
      };
      layout(K);
      wave = 0; phase = 'build'; phaseT = 2.2; foes = []; arrows = []; stuck = []; maxHp = 100; hp = 100; kills = 0; heads = 0; shots = 0; reload = 0; drag = null;
      kbAng = -0.35; kbPow = 0.7; kbHold = false; cards = null; up = { power: 0, quick: 0, multi: 0, pierce: 0, fire: 0 }; queue = []; spawnT = 0; wallHit = 0; tutT = 0;
      aimAng = -0.3; aimPow = 0; lastFire = 0; combo = 0; comboT = 0;
    },
    revive: function (K) { hp = maxHp * 0.6; foes.forEach(function (f) { if (!f.fly) f.x = Math.max(f.x, K.W * 0.8); else f.x = Math.max(f.x, K.W * 0.75); f.atk = 0; }); },
    pointerDown: function (x, y, K) {
      if (phase === 'cards') { for (var i = 0; i < cards.length; i++) if (inB(cards[i], x, y) && phaseT > 0.35) { choose(K, cards[i]); return; } return; }
      drag = { x0: x, y0: y, x: x, y: y };
    },
    pointerMove: function (x, y) { if (drag) { drag.x = x; drag.y = y; } },
    pointerUp: function (x, y, K) {
      if (!drag) return; drag.x = x; drag.y = y;
      var a = aimFrom(drag.x - drag.x0, drag.y - drag.y0); drag = null;
      if (a) fire(K, a.ang, a.pow);
    },
    pointerCancel: function () { drag = null; },
    key: function (code, down, K, rep) {
      if (phase === 'cards') { if (down && !rep) { var n = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2, ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2 }[code]; if (n !== undefined && cards[n] && phaseT > 0.35) choose(K, cards[n]); } return; }
      if (code === 'ArrowUp' || code === 'KeyW') { if (down) kbAng = Math.max(-1.45, kbAng - 0.06); return; }
      if (code === 'ArrowDown' || code === 'KeyS') { if (down) kbAng = Math.min(1.35, kbAng + 0.06); return; }
      if (code === 'Space' || code === 'Enter') {
        if (down && !rep && !kbHold) { kbHold = true; kbPow = 0.25; }
        else if (!down && kbHold) { kbHold = false; fire(K, kbAng, kbPow); }
      }
    },
    update: function (dt, K) {
      if (K.test && K.fastX) dt *= K.fastX;
      tutT += dt; reload = Math.max(0, reload - dt); lastFire = Math.max(0, lastFire - dt); wallHit = Math.max(0, wallHit - dt * 3);
      comboT -= dt; if (comboT <= 0) combo = 0;
      if (kbHold) kbPow = Math.min(1, kbPow + dt * 0.9);
      if (drag) { var a = aimFrom(drag.x - drag.x0, drag.y - drag.y0); if (a) { aimAng = a.ang; aimPow = a.pow; } else aimPow = 0; }
      else if (kbHold) { aimAng = kbAng; aimPow = kbPow; } else { aimPow = 0; aimAng += (kbAng - aimAng) * Math.min(1, dt * 10); }
      phaseT += phase === 'build' ? -dt : dt;
      if (phase === 'build' && phaseT <= 0) startWave(K);
      if (phase === 'wave') {
        spawnT -= dt; if (queue.length && spawnT <= 0) { spawn(K, queue.shift()); spawnT = Math.max(0.3, 1.3 - wave * 0.07) * K.rand(0.5, 1.4); }
        if (!queue.length && !foes.length) {
          var bonus = 20 + wave * 5; K.addScore(bonus); K.floatText(K.W / 2, K.hudH + 80, '+' + bonus, '#B8860B', 26); K.sfx('star');
          if (wave % 3 === 0) K.addCoins(1, K.W / 2, K.hudH + 100);
          dealCards(K);
        }
      }
      // raiders
      foes.forEach(function (f) {
        var d = KINDS[f.k];
        if (f.dead) { f.dead += dt; return; }
        f.hit = Math.max(0, f.hit - dt * 5);
        if (f.burn > 0) { f.burn -= dt; f.hp -= dt * 0.6 * up.fire; if (f.hp <= 0) { var b = body(f); damage(K, f, 0, false, b.bx, b.by); } }
        var sx = stopX(f);
        if (f.x > sx) { f.x = Math.max(sx, f.x - f.spd * pace * dt); f.walk += dt * f.spd * 6; f.atk = 0; }
        else {
          f.atk += dt; hp -= d.dps * dt; wallHit = 1;
          if (Math.floor(f.atk * 1.4) !== Math.floor((f.atk - dt) * 1.4)) { K.sfx('punch'); K.burst(wallX + 2, (f.fly ? f.y : gy) - d.sz * u, ['#C9C3E0', '#8A84A8'], 4, 90, 3); if (f.k === 'chief' || f.k === 'brute') K.shake(3); }
        }
      });
      foes = foes.filter(function (f) { return !f.dead || f.dead < 0.4; });
      // arrows
      var dmg = (1 + up.power * 0.6);
      arrows = arrows.filter(function (ar) {
        ar.t += dt;
        for (var s = 0; s < 4; s++) {
          var h = dt / 4; ar.vy += G * h; ar.x += ar.vx * h; ar.y += ar.vy * h;
          for (var i = 0; i < foes.length; i++) {
            var f = foes[i]; if (f.dead || ar.hitSet.indexOf(f) >= 0) continue;
            var b = body(f), hx = ar.x - b.hx, hy = ar.y - b.hy, bx = ar.x - b.bx, by = ar.y - b.by;
            var head = hx * hx + hy * hy < b.hr * b.hr, hitB = bx * bx + by * by < b.br * b.br;
            if (head || hitB) {
              ar.hitSet.push(f); damage(K, f, dmg * (head ? 2 : 1), head, ar.x, ar.y);
              if (ar.pierce-- <= 0) { if (!f.dead) stuck.push({ f: f, dx: ar.x - f.x, dy: ar.y - (f.fly ? f.y : gy), a: Math.atan2(ar.vy, ar.vx), t: 0 }); return false; }
            }
          }
          if (ar.y >= gy - 2) { stuck.push({ x: ar.x, y: gy - 2, a: Math.atan2(ar.vy, ar.vx), t: 0 }); K.burst(ar.x, gy, ['#C8B07A', '#E3C48F'], 3, 60, 2.5); return false; }
          if (ar.x > K.W + 60 || ar.x < -60 || ar.y > K.H) return false;
        }
        return true;
      });
      stuck.forEach(function (s) { s.t += dt; }); stuck = stuck.filter(function (s) { return s.t < 1.6 && (!s.f || !s.f.dead && foes.indexOf(s.f) >= 0); });
      if (cards) cards.forEach(function (c) { c.t += dt; });
      if (hp <= 0) { hp = 0; K.gameOver({}); return; }
      K.info(K.t('wave') + ' ' + Math.max(1, wave));
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H, i;
      // sky + hills
      var g = ctx.createLinearGradient(0, K.hudH, 0, gy); g.addColorStop(0, '#8FD8FF'); g.addColorStop(1, '#E6F7FF'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (i = 0; i < 4; i++) { var cx = ((i * 0.31 + K.time * 0.008 * (1 + i * 0.3)) % 1.2 - 0.1) * W, cy = K.hudH + 30 + i * 37 % 90; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, K.TAU); ctx.arc(cx + 20, cy - 8, 22, 0, K.TAU); ctx.arc(cx + 42, cy, 16, 0, K.TAU); ctx.fill(); }
      ctx.fillStyle = '#BFE8B0'; ctx.beginPath(); ctx.moveTo(0, gy); for (var x = 0; x <= W + 20; x += 20) ctx.lineTo(x, gy - u * 2.4 - Math.sin(x * 0.01 + 1) * u * 0.9); ctx.lineTo(W, gy); ctx.fill();
      ctx.fillStyle = '#9ED88A'; ctx.beginPath(); ctx.moveTo(0, gy); for (x = 0; x <= W + 20; x += 20) ctx.lineTo(x, gy - u * 1.2 - Math.sin(x * 0.017 + 3) * u * 0.6); ctx.lineTo(W, gy); ctx.fill();
      ctx.fillStyle = '#7ED957'; ctx.fillRect(0, gy - 4, W, H); ctx.fillStyle = '#5BBF3A'; ctx.fillRect(0, gy + 10, W, H);
      if (H - gy > u * 3) { ctx.fillStyle = '#A8733E'; ctx.fillRect(0, gy + u * 0.9, W, H); ctx.fillStyle = '#8A5A2B'; ctx.fillRect(0, gy + u * 2.6, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (i = 0; i < 14; i++) { var rx = (i * 97 % 100) / 100 * W, ry = gy + u * 1.3 + (i * 37 % 100) / 100 * (H - gy - u * 1.6); ctx.beginPath(); ctx.ellipse(rx, ry, u * 0.35, u * 0.2, 0, 0, K.TAU); ctx.fill(); } }
      ctx.fillStyle = '#E3C48F'; ctx.fillRect(wallX, gy - 2, W, 8);
      // wall
      var wx = wallHit > 0 ? Math.sin(K.time * 60) * wallHit * 2 : 0;
      ctx.save(); ctx.translate(wx, 0);
      ctx.fillStyle = '#8F88B0'; ctx.fillRect(0, wallTop, wallX, gy - wallTop + 6);
      ctx.fillStyle = '#B4AED0'; ctx.fillRect(0, wallTop, wallX - 6, gy - wallTop + 6);
      var bh2 = u * 0.62, bw2 = u * 1.2;
      ctx.strokeStyle = 'rgba(80,70,120,0.35)'; ctx.lineWidth = 2;
      for (var row = 0; wallTop + row * bh2 < gy; row++) { var yy = wallTop + row * bh2; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(wallX - 6, yy); ctx.stroke(); for (var col = (row % 2) * 0.5; col * bw2 < wallX - 6; col++) { ctx.beginPath(); ctx.moveTo(col * bw2, yy); ctx.lineTo(col * bw2, yy + bh2); ctx.stroke(); } }
      var crW = u * 0.75; for (x = 0; x < wallX - 2; x += crW * 2) { ctx.fillStyle = '#8F88B0'; ctx.fillRect(x, wallTop - u * 0.65, Math.min(crW, wallX - x), u * 0.7); ctx.fillStyle = '#B4AED0'; ctx.fillRect(x, wallTop - u * 0.65, Math.min(crW, wallX - x) - 4, u * 0.66); }
      // cracks as the wall weakens
      var dmgK = 1 - hp / maxHp; ctx.strokeStyle = 'rgba(60,50,90,0.6)'; ctx.lineWidth = 2;
      if (dmgK > 0.25) { ctx.beginPath(); ctx.moveTo(wallX - 6, wallTop + u); ctx.lineTo(wallX - u * 0.6, wallTop + u * 1.5); ctx.lineTo(wallX - u * 0.3, wallTop + u * 2.1); ctx.stroke(); }
      if (dmgK > 0.55) { ctx.beginPath(); ctx.moveTo(wallX - 6, gy - u * 1.5); ctx.lineTo(wallX - u, gy - u * 1.1); ctx.lineTo(wallX - u * 0.7, gy - u * 0.4); ctx.lineTo(wallX - u * 1.4, gy - u * 0.2); ctx.stroke(); }
      // banner
      ctx.fillStyle = '#8A5A2B'; ctx.fillRect(wallX - u * 0.4, wallTop - u * 2.6, 3, u * 2); ctx.fillStyle = '#E8364F'; ctx.beginPath(); ctx.moveTo(wallX - u * 0.4 + 3, wallTop - u * 2.6); ctx.lineTo(wallX + u * 0.5, wallTop - u * 2.35 + Math.sin(K.time * 5) * 2); ctx.lineTo(wallX - u * 0.4 + 3, wallTop - u * 2.05); ctx.fill();
      ctx.restore();
      // wall health bar
      var hbw = Math.min(W * 0.4, 190), hbx = 12, hby = K.hudH + 14;
      ctx.fillStyle = 'rgba(36,27,77,0.15)'; K.roundRect(ctx, hbx, hby + 3, hbw, 18, 9); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; K.roundRect(ctx, hbx, hby, hbw, 18, 9); ctx.fill();
      ctx.fillStyle = hp / maxHp > 0.35 ? '#7ED957' : '#FF5E7E'; K.roundRect(ctx, hbx + 3, hby + 3, Math.max(0, (hbw - 6) * hp / maxHp), 12, 6); ctx.fill();
      ctx.font = K.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#241B4D'; ctx.fillText('🧱 ' + Math.ceil(hp) + ' / ' + maxHp, hbx + hbw / 2, hby + 10);
      // upgrades owned
      var ux = hbx; ctx.font = K.font(14); ctx.textAlign = 'left';
      ['power', 'quick', 'multi', 'pierce', 'fire'].forEach(function (k) { if (up[k]) { var t = CARD_ICON[k] + (up[k] > 1 ? up[k] : ''); ctx.fillText(t, ux, hby + 34); ux += ctx.measureText(t).width + 8; } });
      // aim guide
      var showPow = aimPow > 0.05;
      if (showPow) {
        var sp = vmax * (0.35 + 0.65 * aimPow), vx = Math.cos(aimAng) * sp, vy = Math.sin(aimAng) * sp, px = archer.x + Math.cos(aimAng) * u * 0.6, py = archer.y - u * 0.1 + Math.sin(aimAng) * u * 0.6;
        for (i = 1; i <= 14; i++) { var t = i * 0.045, dx = px + vx * t, dy = py + vy * t + G * t * t / 2; if (dy > gy) break; ctx.fillStyle = 'rgba(255,255,255,' + (0.95 - i * 0.055) + ')'; ctx.beginPath(); ctx.arc(dx, dy, Math.max(2, 5 - i * 0.22), 0, K.TAU); ctx.fill(); }
        if (drag) { ctx.strokeStyle = 'rgba(36,27,77,0.25)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(drag.x0, drag.y0); ctx.lineTo(drag.x, drag.y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(36,27,77,0.25)'; ctx.beginPath(); ctx.arc(drag.x0, drag.y0, 8, 0, K.TAU); ctx.fill(); }
      }
      // stuck arrows, raiders, flying arrows
      stuck.forEach(function (s) { var a = 1 - Math.max(0, s.t - 1.2) / 0.4; ctx.globalAlpha = a; if (s.f) arrowShape(ctx, K, s.f.x + s.dx, (s.f.fly ? s.f.y : gy) + s.dy, s.a, u * 0.9, 0); else arrowShape(ctx, K, s.x, s.y, s.a, u * 0.9, 0); ctx.globalAlpha = 1; });
      foes.slice().sort(function (a, b) { return (a.fly ? 0 : 1) - (b.fly ? 0 : 1) || b.x - a.x; }).forEach(function (f) { drawFoe(ctx, K, f); });
      drawArcher(ctx, K, aimAng, showPow ? aimPow : lastFire > 0 ? -0.2 : 0);
      arrows.forEach(function (ar) { arrowShape(ctx, K, ar.x, ar.y, Math.atan2(ar.vy, ar.vx), u * 0.9, up.fire); });
      // reload ring
      if (reload > 0) { var rr = 0.6 * Math.pow(0.78, up.quick); ctx.strokeStyle = 'rgba(36,27,77,0.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(archer.x, archer.y - u * 1.6, u * 0.32, -Math.PI / 2, -Math.PI / 2 + K.TAU * (1 - reload / rr)); ctx.stroke(); }
      // upgrade cards
      if (phase === 'cards' && cards) {
        ctx.fillStyle = 'rgba(36,27,77,0.45)'; ctx.fillRect(0, 0, W, H);
        ctx.font = K.font(24); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FFFFFF'; ctx.fillText(K.t('pick'), W / 2, cards[0].y - 28);
        cards.forEach(function (c, n) {
          var k = Math.max(0, Math.min(1, c.t / 0.25)), sc = 0.6 + 0.4 * (1 - Math.pow(1 - k, 3)), cx2 = c.x + c.w / 2, cy2 = c.y + c.h / 2;
          if (k <= 0) return;
          ctx.save(); ctx.translate(cx2, cy2); ctx.scale(sc, sc); ctx.globalAlpha = k;
          ctx.fillStyle = '#C9B8FF'; K.roundRect(ctx, -c.w / 2, -c.h / 2 + 6, c.w, c.h, 18); ctx.fill();
          ctx.fillStyle = '#FFFFFF'; K.roundRect(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 18); ctx.fill();
          ctx.fillStyle = '#F1ECFF'; K.roundRect(ctx, -c.w / 2 + 10, -c.h / 2 + 10, c.w - 20, c.h * 0.42, 14); ctx.fill();
          ctx.font = (c.h * 0.22) + 'px sans-serif'; ctx.fillText(CARD_ICON[c.id], 0, -c.h / 2 + 10 + c.h * 0.21);
          ctx.font = K.font(Math.max(13, Math.min(17, c.w * 0.12))); ctx.fillStyle = '#241B4D'; ctx.fillText(K.t(c.id), 0, c.h * 0.1);
          ctx.font = K.font(Math.max(11, Math.min(13, c.w * 0.09))); ctx.fillStyle = '#6E6890';
          var words = K.t(c.id + 'D').split(' '), line = '', ly = c.h * 0.25, lines = [];
          words.forEach(function (w) { var tl = line ? line + ' ' + w : w; if (ctx.measureText(tl).width > c.w - 18 && line) { lines.push(line); line = w; } else line = tl; }); lines.push(line);
          lines.forEach(function (l, j) { ctx.fillText(l, 0, ly + j * 16); });
          ctx.font = K.font(12); ctx.fillStyle = '#B4AED0'; ctx.fillText(n + 1, -c.w / 2 + 20, -c.h / 2 + 22);
          ctx.restore();
        });
      }
      // tutorial: pull back from the archer side and let go
      if (K.tutorial && state === 'playing' && phase !== 'cards') {
        var k2 = (tutT * 0.6) % 1, sx = W * 0.45, sy = (wallTop + gy) / 2, e = Math.min(1, k2 / 0.7);
        var hx = sx - e * Math.min(W * 0.25, dragFull * 0.8), hy = sy + e * Math.min(W * 0.12, dragFull * 0.35);
        K.drawHand(ctx, hx, hy, k2 < 0.75, Math.min(W, H) / 220);
        ctx.font = K.font(20); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#241B4D'; ctx.fillText(K.t('hint'), W / 2, Math.max(K.hudH + 70, wallTop - u * 4));
      }
    }
  });
})();
