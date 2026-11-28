/* Arrow Rampart — original wall-defense archery game for Bubzi.
   Pull back to aim, let go to shoot. Stop the raiders before they break your wall, then pick an upgrade card after each wave.
   Hub before each run: 5 modes, a shop (bows, special arrows, upgrades, outfits), the Rampart Pass (30 tiers) and daily missions.
   ONE source for two games (tools/build.js): games/arrow-rampart.html (2D: drawn in canvas, emoji icons, saves 'ar:*') and
   games/arrow-rampart-3d.html (src/arrow/main.js sets AR_EDITION = '3d': three.js world + Blender icons, saves 'ar3:*').
   Music/SFX: ElevenLabs recordings in games/audio/arrow-rampart via GameMusic (src/games/ink-music.js), synth fallback. */
(function () {
  'use strict';
  var AR3D = typeof window !== 'undefined' && window.AR_EDITION === '3d', SPK = AR3D ? 'ar3:' : 'ar:';
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
    var n = mode === 'boss' ? Math.min(24, 3 + wave * 2) : Math.min(40, 5 + wave * 3);
    for (var i = 0; i < n; i++) {
      var r = Math.random(), k = 'grunt';
      if (mode === 'night' && r < 0.35) k = 'flyer';
      else if (mode === 'boss' && r < Math.min(0.4, 0.12 + 0.05 * wave)) k = 'brute';
      else if (wave >= 2 && r < 0.25) k = 'runner';
      else if (wave >= 3 && r < 0.42) k = 'brute';
      else if (wave >= 4 && r < 0.58) k = 'flyer';
      queue.push(k);
    }
    if (mode === 'boss') for (var c2 = 0; c2 < 1 + Math.floor(wave / 3); c2++) queue.splice(Math.floor(queue.length * (c2 + 1) / (2 + Math.floor(wave / 3))), 0, 'chief');
    else if (wave % 5 === 0) queue.splice(Math.floor(n / 2), 0, 'chief');
    if (mode === 'head') quiver = 8 + wave * 3 + up.multi * 2;
    spawnT = 0.6;
    K.floatText(K.W / 2, K.hudH + 80, K.t('wave') + ' ' + wave + (wave % 5 === 0 ? ' · ' + K.t('chief') : ''), '#FFFFFF', 30);
    K.sfx(wave % 5 === 0 || mode === 'boss' ? 'chief' : 'horn');
  }
  function spawn(K, k) {
    var d = KINDS[k], sc = Math.pow(1.19, wave - 1), hp0 = d.hp * sc, dpsM = 1;
    if (k === 'chief') { // always tougher than a brute of the same wave, but beatable before it reaches the wall
      var bruteHp = KINDS.brute.hp * sc; hp0 = Math.min(d.hp * sc, Math.max(bruteHp * 1.4, (6 + 3 * wave) * Math.pow(1.07, wave))); dpsM = Math.min(1, 0.32 + 0.045 * wave); }
    else if (k === 'brute' && wave <= 3) dpsM = 0.6;
    foes.push({ k: k, x: fieldR + K.rand(0, u), y: d.fly ? wallTop - K.rand(1.2, 3.2) * u : gy, fly: !!d.fly, hp: hp0, max: hp0, dpsM: dpsM,
      spd: d.spd * K.rand(0.9, 1.1), walk: K.rand(0, 6), hit: 0, burn: 0, atk: 0, bob: K.rand(0, 6), dead: 0, frozen: 0 });
  }
  function fire(K, ang, pow) {
    if (reload > 0 || phase !== 'wave' && phase !== 'build') return false;
    if (mode === 'head' && phase === 'wave') { if (quiver <= 0) { K.sfx('wrong'); K.floatText(archer.x + u * 2, archer.y - u * 1.5, K.t('noArrows'), '#E8364F', 18); return false; } quiver--; }
    var sp = vmax * bow().spd * (0.35 + 0.65 * pow), n = up.multi + 1, spc = armed && bag[armed] > 0 ? armed : null;
    if (spc) { bag[spc]--; saveBag(); armed = null; }
    for (var i = 0; i < n; i++) {
      var a = ang + (i - (n - 1) / 2) * 0.07;
      arrows.push({ x: archer.x + Math.cos(ang) * u * 0.6, y: archer.y - u * 0.1 + Math.sin(ang) * u * 0.6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, pierce: spc ? 0 : up.pierce, hitSet: [], t: 0, sp: i === 0 ? spc : null });
    }
    reload = reloadTime(); shots++; lastFire = 0.15;
    K.sfx('shoot'); K.haptic(8); K.tutorialDone();
    return true;
  }
  function damage(K, f, dmg, head, x, y) {
    f.hp -= dmg; f.hit = 1;
    K.burst(x, y, head ? ['#FFFFFF', '#FFD23F'] : ['#FFFFFF', KINDS[f.k].col], head ? 10 : 6, head ? 170 : 110, 3.5);
    if (head) { heads++; K.floatText(Math.min(x, K.W - 70), y - u * 0.6, K.t('head'), '#FFD23F', 18); }
    if (up.fire || bow().fire) f.burn = 2.2;
    if (f.hp <= 0 && !f.dead) {
      f.dead = 0.001; kills++; combo++; comboT = 1.6;
      var pts = KINDS[f.k].pts * (head ? (mode === 'head' ? 3 : 2) : 1) + (combo > 1 ? combo * 2 : 0);
      comboRank(K); misSet(K, 'kill', 1); if (head) misSet(K, 'head', 1); passAdd(K, head ? 2 : 1);
      if (mode === 'head' && head) quiver += 2;
      if (Math.random() < 0.08) addC(K, 1, f.x, gy - 2 * u);
      K.addScore(pts); K.floatText(Math.min(f.x, K.W - 40), (f.fly ? f.y : gy) - KINDS[f.k].sz * u * 2.1, '+' + pts, '#241B4D', 18);
      K.sfx(f.k === 'chief' ? 'boom' : 'die');
      if (f.k === 'chief') { K.shake(8); K.confetti(40); addC(K, 5, f.x, gy - 2 * u); addGems(K, 1, f.x, gy - 3 * u); passAdd(K, 10); }
    } else K.sfx(head ? 'headshot' : 'thunk');
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
    if (f.frozen > 0) { ctx.fillStyle = 'rgba(160,220,255,0.55)'; K.roundRect(ctx, -s * 0.6, -s * 1.75, s * 1.2, s * 1.75, s * 0.3); ctx.fill(); }
    if (f.burn > 0) { for (var i = 0; i < 3; i++) { var fx = (i - 1) * s * 0.3, fl = Math.sin(K.time * 15 + i) * s * 0.08; ctx.fillStyle = i % 2 ? '#FFD23F' : '#FF7F45'; ctx.beginPath(); ctx.ellipse(fx, -s * 1.45 + fl, s * 0.1, s * 0.2, 0, 0, K.TAU); ctx.fill(); } }
    ctx.restore();
    if (!f.dead && f.hp < f.max) { var w = s * 1.1; ctx.fillStyle = 'rgba(36,27,77,0.3)'; ctx.fillRect(x - w / 2, y - s * 2.05, w, 4); ctx.fillStyle = '#FF5FA2'; ctx.fillRect(x - w / 2, y - s * 2.05, w * Math.max(0, f.hp / f.max), 4); }
  }
  function foeBar(ctx, K, f) { var s = KINDS[f.k].sz * u, x = f.x, y = f.fly ? f.y + Math.sin(K.time * 4 + f.bob) * u * 0.15 : gy; if (f.dead || f.hp >= f.max) return; var w = s * 1.1; ctx.fillStyle = 'rgba(36,27,77,0.45)'; K.roundRect(ctx, x - w / 2 - 1, y - s * 2.15 - 1, w + 2, 7, 3); ctx.fill(); ctx.fillStyle = f.k === 'chief' ? '#FFD23F' : '#FF5FA2'; K.roundRect(ctx, x - w / 2, y - s * 2.15, w * Math.max(0, f.hp / f.max), 5, 2.5); ctx.fill(); }
  function drawArcher(ctx, K, ang, pull) {
    var x = archer.x, y = archer.y, s = u;
    ctx.save(); ctx.translate(x, y);
    // body
    var O = outfit(); ctx.fillStyle = O.dark; K.roundRect(ctx, -s * 0.42, -s * 0.1, s * 0.84, s * 1.0, s * 0.3); ctx.fill();
    ctx.fillStyle = O.body; K.roundRect(ctx, -s * 0.42, -s * 0.14, s * 0.84, s * 0.9, s * 0.3); ctx.fill();
    // head + hood
    ctx.fillStyle = '#FFD9B8'; ctx.beginPath(); ctx.arc(0, -s * 0.55, s * 0.38, 0, K.TAU); ctx.fill();
    ctx.fillStyle = O.hood; ctx.beginPath(); ctx.arc(0, -s * 0.6, s * 0.44, Math.PI * 0.95, Math.PI * 2.05); ctx.lineTo(-s * 0.55, -s * 0.2); ctx.fill();
    ctx.fillStyle = O.cape; ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 1.0); ctx.lineTo(-s * 0.6, -s * 1.25); ctx.lineTo(-s * 0.25, -s * 0.9); ctx.fill();
    ctx.fillStyle = '#241B4D'; ctx.beginPath(); ctx.arc(s * 0.16, -s * 0.52, s * 0.06, 0, K.TAU); ctx.fill();
    // bow
    ctx.rotate(ang); ctx.translate(s * 0.45, 0);
    ctx.strokeStyle = bow().wood; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-s * 0.2, 0, s * 0.75, -1.15, 1.15); ctx.stroke();
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


  /* ================= meta: modes, shop, Rampart Pass, daily missions (saved with K.store 'ar:*') ================= */
  var MODES = {
    siege: { icon: '🏰', col: '#7ED957' }, boss: { icon: '👑', col: '#FF6B8B' }, head: { icon: '🎯', col: '#FFD23F' },
    night: { icon: '🌙', col: '#7A6CFF' }, time: { icon: '⏱️', col: '#5CC8F2' }
  };
  var MODE_ORDER = ['siege', 'boss', 'head', 'night', 'time'];
  var BOWS = { // dmg / reload / arrow speed multipliers
    oak: { price: 0, dmg: 1, rel: 1, spd: 1, wood: '#8A5A2B' }, recurve: { price: 300, dmg: 1.25, rel: 1, spd: 1.05, wood: '#6B3F1F' },
    longbow: { price: 700, dmg: 1.4, rel: 1.05, spd: 1.15, wood: '#A8733E' }, crossbow: { price: 1200, dmg: 2, rel: 1.6, spd: 1.2, wood: '#4A4A5A' },
    elven: { price: 2000, gem: 60, dmg: 1.5, rel: 0.75, spd: 1.1, wood: '#C9B458', pass: 15 }, dragon: { price: 3500, gem: 120, dmg: 1.8, rel: 0.9, spd: 1.1, wood: '#C0392B', fire: 1, pass: 30 }
  };
  var BOW_ORDER = ['oak', 'recurve', 'longbow', 'crossbow', 'elven', 'dragon'];
  var SPECIALS = { bomb: { price: 60, icon: '💣', col: '#FF7F45' }, ice: { price: 50, icon: '❄️', col: '#5CC8F2' }, zap: { price: 80, icon: '⚡', col: '#FFD23F' } };
  var SPEC_ORDER = ['bomb', 'ice', 'zap'];
  var UPGS = { wall: { icon: '🧱', base: 100 }, power: { icon: '💪', base: 120 }, reload: { icon: '⏩', base: 120 }, gold: { icon: '💰', base: 150 } }, UPG_ORDER = ['wall', 'power', 'reload', 'gold'], UPG_MAX = 5;
  var OUTFITS = {
    ranger: { price: 0, hood: '#3FA34D', body: '#6A55E0', dark: '#4B3BA8', cape: '#E8364F' }, crimson: { price: 150, hood: '#C0392B', body: '#E8364F', dark: '#A12436', cape: '#FFD23F' },
    frost: { price: 250, hood: '#5CC8F2', body: '#E6F7FF', dark: '#9FC9E0', cape: '#2E86C1' }, royal: { price: 0, gem: 25, hood: '#8E44AD', body: '#FFD23F', dark: '#C9A21B', cape: '#8E44AD', pass: 5 },
    shadow: { price: 0, gem: 40, hood: '#222233', body: '#3A3A4E', dark: '#22222E', cape: '#7A6CFF', pass: 10 }, golden: { price: 0, gem: 60, hood: '#FFD23F', body: '#FFF1B8', dark: '#E0B828', cape: '#E8364F', pass: 20 }
  };
  var OUTFIT_ORDER = ['ranger', 'crimson', 'frost', 'royal', 'shadow', 'golden'];
  // Rampart Pass: 30 tiers, 100 XP each; XP from kills, headshots, waves and missions
  var PASS_N = 30, PASS_XP = 100;
  function passReward(t) { // t = 1..30
    var fixed = { 5: ['outfit', 'royal'], 10: ['outfit', 'shadow'], 15: ['bow', 'elven'], 20: ['outfit', 'golden'], 25: ['coins', 400], 30: ['bow', 'dragon'] };
    if (fixed[t]) return fixed[t];
    if (t % 3 === 0) return ['gems', 5 + Math.floor(t / 6) * 2];
    var cyc = [['coins', 40 + t * 4], ['spec', 'bomb', 2], ['spec', 'ice', 2], ['coins', 60 + t * 5], ['spec', 'zap', 2]];
    return cyc[t % cyc.length];
  }
  var MIS = { kill: [60, 'mKill'], head: [15, 'mHead'], wave: [6, 'mWave'], spec: [3, 'mSpec'], combo: [6, 'mCombo'], modes: [2, 'mModes'] }, MIS_PAY = [60, 90, 120];
  var K1, metaSel = 0, shopTab = 'bows', shopSel = 0, passScroll = 0, mode = 'siege', armed = null, bag = {}, timeLeft = 0, quiver = 0, rank = null, fx = [], ui = [], music = null, musicOn = false;
  /* 3D item icons (Blender: tools/art/arrow/icons.py → games/art/arrow-rampart/i_*.webp); emoji until they load */
  var iconCache = {};
  function iconImg(id) { if (!AR3D) return null; var o = iconCache[id]; if (!o) { o = iconCache[id] = new Image(); o.src = 'art/arrow-rampart/i_' + id + '.webp'; } return o.complete && o.naturalWidth ? o : null; }
  function icon(ctx, id, x, y, size, fallback) { var im = iconImg(id); if (im) { ctx.drawImage(im, x - size / 2, y - size / 2, size, size); return; }
    if (id === 'feather' || id === 'gem') { ctx.save(); ctx.translate(x, y);
      if (id === 'feather') { ctx.rotate(0.6); ctx.fillStyle = '#E8364F'; ctx.beginPath(); ctx.ellipse(0, -size * 0.05, size * 0.17, size * 0.38, 0, 0, K1.TAU); ctx.fill(); ctx.fillStyle = '#FF8A9B'; ctx.beginPath(); ctx.ellipse(size * 0.04, -size * 0.08, size * 0.07, size * 0.28, 0, 0, K1.TAU); ctx.fill(); ctx.strokeStyle = '#F4EFE4'; ctx.lineWidth = Math.max(1, size * 0.05); ctx.beginPath(); ctx.moveTo(0, -size * 0.42); ctx.lineTo(0, size * 0.45); ctx.stroke(); }
      else { ctx.fillStyle = '#3EC6FF'; ctx.beginPath(); ctx.moveTo(-size * 0.38, -size * 0.12); ctx.lineTo(-size * 0.2, -size * 0.34); ctx.lineTo(size * 0.2, -size * 0.34); ctx.lineTo(size * 0.38, -size * 0.12); ctx.lineTo(0, size * 0.38); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(-size * 0.2, -size * 0.34); ctx.lineTo(0, -size * 0.12); ctx.lineTo(-size * 0.38, -size * 0.12); ctx.closePath(); ctx.fill(); }
      ctx.restore(); return; } if (fallback) { ctx.font = Math.round(size * 0.7) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(fallback, x, y); } }
  var view = null, viewTried = false;
  function S(k, d) { var v = K1.store.get(SPK + k, d); return v === null || v === undefined ? d : v; }
  function SS(k, v) { K1.store.set(SPK + k, v); }
  function owned(kind, id) { var o = S(kind, []); return (kind === 'bows' && id === 'oak') || (kind === 'outfits' && id === 'ranger') || (Array.isArray(o) && o.indexOf(id) >= 0); }
  function own(kind, id) { var o = S(kind, []); if (!Array.isArray(o)) o = []; if (o.indexOf(id) < 0) o.push(id); SS(kind, o); }
  function bowId() { var b = S('bow', 'oak'); return BOWS[b] && owned('bows', b) ? b : 'oak'; }
  function bow() { return BOWS[bowId()]; }
  function outfit() { var o = S('outfit', 'ranger'); return OUTFITS[o] && owned('outfits', o) ? OUTFITS[o] : OUTFITS.ranger; }
  function upg(k) { var o = S('upg', {}); return Math.max(0, Math.min(UPG_MAX, (o && o[k]) || 0)); }
  function upgPrice(k) { var lv = upg(k); return lv >= UPG_MAX ? 0 : UPGS[k].base * (lv + 1); }
  function loadBag() { var o = S('bag', null); if (!o || typeof o !== 'object') o = { bomb: 2, ice: 2, zap: 1 }; SPEC_ORDER.forEach(function (k) { o[k] = Math.max(0, Math.min(9, o[k] || 0)); }); return o; }
  function saveBag() { SS('bag', bag); }
  function gems() { return Math.max(0, Math.floor(S('gems', 0))); }
  function addGems(K, n, x, y) { SS('gems', gems() + n); if (x !== undefined) K.floatText(x, y, '+' + n + ' ' + K.t('gems'), '#3EC6FF', 20); }
  function spendGems(n) { if (gems() < n) return false; SS('gems', gems() - n); return true; }
  function addC(K, n, x, y) { K.addCoins(Math.max(1, Math.round(n * (1 + 0.15 * upg('gold')))), x, y); }
  // pass
  function passXp() { return Math.max(0, S('xp', 0)); }
  function passTier() { return Math.min(PASS_N, Math.floor(passXp() / PASS_XP)); }
  function passAdd(K, n) { var t0 = passTier(); SS('xp', passXp() + n); var t1 = passTier(); if (t1 > t0) { K.toast(K.t('tierUp').replace('%n', t1)); K.sfx('tier'); } }
  function passClaimable() { var got = S('claimed', []); for (var t = 1; t <= passTier(); t++) if (got.indexOf(t) < 0) return true; return false; }
  function passClaim(K, t) {
    var got = S('claimed', []); if (!Array.isArray(got)) got = []; if (t > passTier() || got.indexOf(t) >= 0) { K.sfx('wrong'); return; }
    var r = passReward(t); got.push(t); SS('claimed', got);
    if (r[0] === 'coins') addC(K, r[1]); else if (r[0] === 'gems') addGems(K, r[1]); else if (r[0] === 'spec') { bag[r[1]] = Math.min(9, (bag[r[1]] || 0) + r[2]); saveBag(); }
    else if (r[0] === 'bow') own('bows', r[1]); else if (r[0] === 'outfit') own('outfits', r[1]);
    K.sfx('reward'); K.confetti(40); K.toast(rewardText(K, r));
  }
  function rewardText(K, r) { return r[0] === 'gems' ? '+' + r[1] + ' ' + K.t('gems') : r[0] === 'coins' ? '+' + r[1] + ' ' + K.t('feathers') : r[0] === 'spec' ? '+' + r[2] + ' ' + SPECIALS[r[1]].icon : r[0] === 'bow' ? '🏹 ' + K.t('b_' + r[1]) : '👕 ' + K.t('o_' + r[1]); }
  // missions
  function misDay() { var d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function missions() {
    var o = S('mis', null), day = misDay();
    if (!o || o.day !== day || !Array.isArray(o.ids)) { var ks = Object.keys(MIS), sd = day + 7, pk = []; while (pk.length < 3) { sd = (sd * 9301 + 49297) % 233280; var k = ks[sd % ks.length]; if (pk.indexOf(k) < 0) pk.push(k); } o = { day: day, ids: pk, p: {}, got: {}, modes: [] }; SS('mis', o); }
    return o;
  }
  function misSet(K, k, v, max) { var o = missions(); if (o.ids.indexOf(k) < 0 || o.got[k]) return; var cur = o.p[k] || 0, nv = max ? Math.max(cur, v) : cur + v; if (nv === cur) return; var was = cur >= MIS[k][0]; o.p[k] = nv; SS('mis', o); if (!was && nv >= MIS[k][0]) { K.toast(K.t('misDone')); K.sfx('star'); } }
  function misReady() { var o = missions(); return o.ids.some(function (k) { return !o.got[k] && (o.p[k] || 0) >= MIS[k][0]; }); }
  function misClaim(K, k) { var o = missions(), i = o.ids.indexOf(k); if (i < 0 || o.got[k] || (o.p[k] || 0) < MIS[k][0]) { K.sfx('wrong'); return; } o.got[k] = true; SS('mis', o); addC(K, MIS_PAY[i]); addGems(K, 3); passAdd(K, 50); K.sfx('reward'); K.confetti(40); }
  function playedMode(K) { var o = missions(); if (!Array.isArray(o.modes)) o.modes = []; if (o.modes.indexOf(mode) < 0) { o.modes.push(mode); SS('mis', o); } misSet(K, 'modes', o.modes.length, true); }
  // combo ranks
  var RANKS = [[5, 'rk1', '#FFFFFF'], [10, 'rk2', '#FFD23F'], [15, 'rk3', '#FF7F45'], [25, 'rk4', '#FF5FA2']];
  function comboRank(K) { RANKS.forEach(function (r) { if (combo === r[0]) { rank = { t: K.t(r[1]), col: r[2], at: K.time }; K.sfx('combo'); } }); misSet(K, 'combo', combo, true); }
  // special arrows
  function triggerSpecial(K, sp, x, y, hitF) {
    var dmg = baseDmg();
    if (sp === 'bomb') {
      K.sfx('boom'); K.shake(7); K.burst(x, y, ['#FF7F45', '#FFD23F', '#5A4A3A'], 26, 260, 5); fx.push({ k: 'ring', x: x, y: y, r: 2.6 * u, t: 0, col: '#FF7F45' });
      foes.forEach(function (f) { if (f.dead) return; var b = body(f); if (Math.hypot(b.bx - x, b.by - y) < 2.6 * u) damage(K, f, dmg * 4, false, b.bx, b.by); });
    } else if (sp === 'ice') {
      K.sfx('ice'); K.burst(x, y, ['#E6F7FF', '#5CC8F2', '#FFFFFF'], 22, 200, 4); fx.push({ k: 'ring', x: x, y: y, r: 3 * u, t: 0, col: '#5CC8F2' });
      foes.forEach(function (f) { if (f.dead) return; var b = body(f); if (Math.hypot(b.bx - x, b.by - y) < 3 * u) { f.frozen = 3; f.atk = 0; } });
    } else if (sp === 'zap') {
      K.sfx('zap'); var from = hitF ? body(hitF) : { bx: x, by: y }, hitL = [], cur = from;
      for (var j = 0; j < 4; j++) { var best = null, bd = 6 * u; foes.forEach(function (f) { if (f.dead || hitL.indexOf(f) >= 0) return; var b = body(f), dd = Math.hypot(b.bx - cur.bx, b.by - cur.by); if (dd < bd) { bd = dd; best = f; } }); if (!best) break; hitL.push(best); var nb = body(best); fx.push({ k: 'bolt', x: cur.bx, y: cur.by, x2: nb.bx, y2: nb.by, t: 0 }); damage(K, best, dmg * 2.2, false, nb.bx, nb.by); cur = nb; }
      K.flash('#FFF6C8', 0.15);
    }
    misSet(K, 'spec', 1);
  }
  function baseDmg() { return (1 + up.power * 0.6) * bow().dmg * (1 + 0.1 * upg('power')); }
  function reloadTime() { return 0.6 * bow().rel * Math.pow(0.78, up.quick) * (1 - 0.06 * upg('reload')); }

  /* text with currency icons: '{f}' = feathers (the game's coins), '{g}' = gems; centred on cx */
  function rich(ctx, K, str, cx, cy, px, col, weight) {
    var parts = String(str).split(/(\{[fg]\})/), isz = px * 1.25, w = 0; ctx.font = K.font(px, weight || 800);
    parts.forEach(function (t) { w += t === '{f}' || t === '{g}' ? isz : ctx.measureText(t).width; });
    var x = cx - w / 2; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = col;
    parts.forEach(function (t) { if (t === '{f}' || t === '{g}') { icon(ctx, t === '{f}' ? 'feather' : 'gem', x + isz / 2, cy, isz); x += isz; } else if (t) { ctx.fillStyle = col; ctx.fillText(t, x, cy + 1); x += ctx.measureText(t).width; } });
    ctx.textAlign = 'center'; return w;
  }
  function richW(ctx, K, str, px) { var w = 0; ctx.font = K.font(px, 800); String(str).split(/(\{[fg]\})/).forEach(function (t) { w += t === '{f}' || t === '{g}' ? px * 1.25 : ctx.measureText(t).width; }); return w; }
  /* ---------- meta screens (drawn on the canvas, tapped through ui[]) ---------- */
  function btn(ctx, K, x, y, w, h, col, label, act, extra, ic) {
    ctx.fillStyle = 'rgba(36,27,77,0.25)'; K.roundRect(ctx, x, y + 4, w, h, Math.min(h / 2, 22)); ctx.fill();
    ctx.fillStyle = col; K.roundRect(ctx, x, y, w, h, Math.min(h / 2, 22)); ctx.fill();
    var px = Math.min(18, h * 0.38); while (px > 9 && richW(ctx, K, label, px) > w - 16 - (ic ? h * 0.7 : 0)) px -= 1;
    if (ic && richW(ctx, K, label, px) + h * 0.75 > w - 12) { // narrow: icon on top, label below
      var sp = Math.min(13, h * 0.24); while (sp > 8 && richW(ctx, K, label, sp) > w - 8) sp -= 1;
      icon(ctx, ic, x + w / 2, y + h * 0.36, h * 0.52); rich(ctx, K, label, x + w / 2, y + h * 0.8, sp, '#FFFFFF');
    } else if (ic) { var tw = richW(ctx, K, label, px), gx = x + (w - tw - h * 0.7) / 2; icon(ctx, ic, gx + h * 0.32, y + h / 2, h * 0.66); rich(ctx, K, label, gx + h * 0.7 + tw / 2, y + h / 2, px, '#FFFFFF'); }
    else rich(ctx, K, label, x + w / 2, y + h / 2, px, '#FFFFFF');
    if (extra) { ctx.fillStyle = '#FF3B4E'; ctx.beginPath(); ctx.arc(x + w - 8, y + 6, 7, 0, K.TAU); ctx.fill(); }
    ui.push({ x: x, y: y, w: w, h: h, act: act });
  }
  function panel(ctx, K, title) {
    var W = K.W, H = K.H; ctx.fillStyle = 'rgba(30,22,64,0.9)'; ctx.fillRect(0, 0, W, H);
    ctx.font = K.font(Math.min(28, W / 14)); ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(title, W / 2, K.hudH + 18);
    if (phase !== 'hub') btn(ctx, K, 12, K.hudH + 2, 76, 34, 'rgba(255,255,255,0.18)', K.t('back'), 'back');
    [['gem', gems(), '#3EC6FF']].forEach(function (c, i) { /* the kit pill above shows feathers */ ctx.font = K.font(15); var tw = ctx.measureText(String(c[1])).width + 46, x = W - tw - 12, y = K.hudH + 2 + i * 38; ctx.fillStyle = 'rgba(255,255,255,0.14)'; K.roundRect(ctx, x, y, tw, 32, 16); ctx.fill(); icon(ctx, c[0], x + 16, y + 16, 28, '💎'); ctx.fillStyle = c[2]; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(String(c[1]), x + 32, y + 17); });
  }
  function drawHub(ctx, K) {
    var W = K.W, H = K.H; ui = []; panel(ctx, K, K.t('chooseMode'));
    var land = W > H, n = MODE_ORDER.length, gap = 10, cols = land ? n : 2, cw = Math.min(170, (W - 24 - gap * (cols - 1)) / cols), ch = Math.min(land ? 170 : 120, (H - K.hudH - 170) / (land ? 1 : 3) - gap), x0 = (W - (cw * cols + gap * (cols - 1))) / 2, y0 = K.hudH + 44;
    MODE_ORDER.forEach(function (m, i) {
      var x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap), sel = mode === m, M = MODES[m];
      if (!land && i === n - 1 && n % 2) x = (W - cw) / 2;
      ctx.fillStyle = sel ? '#FFFFFF' : 'rgba(255,255,255,0.12)'; K.roundRect(ctx, x, y, cw, ch, 16); ctx.fill();
      if (sel) { ctx.strokeStyle = M.col; ctx.lineWidth = 4; ctx.stroke(); }
      var shortC = ch < 115; icon(ctx, 'm_' + m, x + cw / 2, y + ch * (shortC ? 0.2 : 0.27), Math.min(70, ch * (shortC ? 0.3 : 0.42), cw * 0.55), M.icon); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = sel ? '#241B4D' : '#FFFFFF'; ctx.font = K.font(Math.min(17, cw / 8, ch / 6)); ctx.fillText(K.t('m_' + m), x + cw / 2, y + ch * (shortC ? 0.45 : 0.58));
      ctx.fillStyle = sel ? '#6E6890' : 'rgba(255,255,255,0.7)'; ctx.font = K.font(Math.min(11, cw / 13), 700); wrap(ctx, K.t('d_' + m), cw - 12).slice(0, shortC ? 2 : 3).forEach(function (l, j) { ctx.fillText(l, x + cw / 2, y + ch * (shortC ? 0.62 : 0.7) + j * 12); });
      var bst = S('best:' + m, 0); if (bst) { ctx.fillStyle = sel ? '#B8860B' : '#FFD23F'; ctx.font = K.font(10, 800); ctx.fillText('★ ' + bst, x + cw / 2, y + ch - 10); }
      ui.push({ x: x, y: y, w: cw, h: ch, act: 'mode', m: m });
    });
    var tw = Math.min(560, W - 24), sw = (tw - 30) / 4, bh = sw < 130 ? Math.min(66, H * 0.09) : Math.min(52, H * 0.1), by = H - bh - 14, bx = (W - tw) / 2;
    btn(ctx, K, bx, by, sw, bh, '#3B82F6', K.t('shop'), 'shop', false, AR3D ? 'shop' : null);
    btn(ctx, K, bx + sw + 10, by, sw, bh, '#A855F7', K.t('pass'), 'pass', passClaimable(), AR3D ? 'pass' : null);
    btn(ctx, K, bx + (sw + 10) * 2, by, sw, bh, '#F59E0B', K.t('missions'), 'mis', misReady(), AR3D ? 'mis' : null);
    btn(ctx, K, bx + (sw + 10) * 3, by, sw, bh, '#E8364F', '▶ ' + K.t('play'), 'go');
    // pass progress strip
    var px = (W - tw) / 2, py = by - 22, xp = passXp(), tier = passTier(), fr = tier >= PASS_N ? 1 : (xp % PASS_XP) / PASS_XP;
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; K.roundRect(ctx, px, py, tw, 10, 5); ctx.fill(); ctx.fillStyle = '#A855F7'; K.roundRect(ctx, px, py, Math.max(10, tw * fr), 10, 5); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = K.font(11, 800); ctx.textAlign = 'left'; ctx.fillText(K.t('pass') + ' ' + K.t('tier') + ' ' + tier + '/' + PASS_N, px, py - 9); ctx.textAlign = 'center';
  }
  function wrap(ctx, txt, maxW) { var ws = String(txt).split(' '), ls = [], c = ''; ws.forEach(function (w) { var t = c ? c + ' ' + w : w; if (ctx.measureText(t).width > maxW && c) { ls.push(c); c = w; } else c = t; }); if (c) ls.push(c); return ls; }
  var BUNDLE_GEMS = 15;
  function shopList() { return shopTab === 'bows' ? BOW_ORDER : shopTab === 'arrows' ? SPEC_ORDER.concat(['bundle']) : shopTab === 'upg' ? UPG_ORDER : OUTFIT_ORDER; }
  function drawShop(ctx, K) {
    var W = K.W, H = K.H; ui = []; panel(ctx, K, K.t('shop'));
    var tabs = ['bows', 'arrows', 'upg', 'outfits'], tw = Math.min(480, W - 110), t4 = tw / 4, tx = (W - tw) / 2 + 40, ty = K.hudH + 42;
    tabs.forEach(function (t, i) { var on = shopTab === t; ctx.fillStyle = on ? '#FFD23F' : 'rgba(255,255,255,0.12)'; K.roundRect(ctx, tx + i * t4 + 2, ty, t4 - 4, 32, 16); ctx.fill(); ctx.fillStyle = on ? '#241B4D' : '#FFFFFF'; ctx.font = K.font(Math.min(14, t4 / 6)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(K.t('t_' + t), tx + i * t4 + t4 / 2, ty + 16); ui.push({ x: tx + i * t4, y: ty, w: t4, h: 32, act: 'tab', t: t }); });
    var list = shopList(), n = list.length, land = W > H, cols = land ? Math.min(n, 6) : 3, rows = Math.ceil(n / cols), gap = 8, y0 = ty + 44, availH = H - y0 - 84;
    var cw = Math.min(150, (W - 20 - gap * (cols - 1)) / cols), ch = Math.min(150, (availH - gap * (rows - 1)) / rows), x0 = (W - (cw * cols + gap * (cols - 1))) / 2;
    shopSel = Math.min(shopSel, n - 1);
    list.forEach(function (id, i) {
      var x = x0 + (i % cols) * (cw + gap), y = y0 + Math.floor(i / cols) * (ch + gap), sel = i === shopSel, st = itemState(K, id);
      ctx.fillStyle = sel ? '#FFFFFF' : 'rgba(255,255,255,0.1)'; K.roundRect(ctx, x, y, cw, ch, 14); ctx.fill(); if (sel) { ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var ic = (shopTab === 'bows' ? 'b_' : shopTab === 'arrows' ? 's_' : shopTab === 'upg' ? 'u_' : 'o_') + id;
      if (iconImg(ic)) icon(ctx, ic, x + cw / 2, y + ch * 0.33, Math.min(cw * 0.7, ch * 0.5));
      else if (shopTab === 'bows') { ctx.save(); ctx.translate(x + cw / 2, y + ch * 0.34); ctx.rotate(-0.6); ctx.strokeStyle = BOWS[id].wood; ctx.lineWidth = Math.max(3, ch * 0.05); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-ch * 0.05, 0, ch * 0.24, -1.15, 1.15); ctx.stroke(); ctx.strokeStyle = sel ? '#6E6890' : '#F4EFE4'; ctx.lineWidth = 1.5; var ex = -ch * 0.05 + Math.cos(1.15) * ch * 0.24, ey = Math.sin(1.15) * ch * 0.24; ctx.beginPath(); ctx.moveTo(ex, -ey); ctx.lineTo(ex, ey); ctx.stroke(); if (BOWS[id].fire) { ctx.fillStyle = '#FF7F45'; ctx.beginPath(); ctx.arc(ch * 0.2, 0, ch * 0.05, 0, K.TAU); ctx.fill(); } ctx.restore(); }
      else if (shopTab === 'outfits') { var o = OUTFITS[id], s2 = ch * 0.17, cx = x + cw / 2, cy = y + ch * 0.4; ctx.fillStyle = o.body; K.roundRect(ctx, cx - s2, cy, s2 * 2, s2 * 1.6, s2 * 0.5); ctx.fill(); ctx.fillStyle = '#FFD9B8'; ctx.beginPath(); ctx.arc(cx, cy - s2 * 0.4, s2 * 0.8, 0, K.TAU); ctx.fill(); ctx.fillStyle = o.hood; ctx.beginPath(); ctx.arc(cx, cy - s2 * 0.5, s2 * 0.92, Math.PI * 0.95, Math.PI * 2.05); ctx.fill(); ctx.fillStyle = o.cape; ctx.beginPath(); ctx.moveTo(cx - s2 * 0.2, cy - s2 * 1.4); ctx.lineTo(cx - s2 * 1.3, cy - s2 * 1.9); ctx.lineTo(cx - s2 * 0.5, cy - s2 * 1.1); ctx.fill(); }
      else { ctx.font = Math.min(38, ch * 0.3) + 'px sans-serif'; ctx.fillText(shopTab === 'arrows' ? (SPECIALS[id] ? SPECIALS[id].icon : '🏹') : UPGS[id].icon, x + cw / 2, y + ch * 0.32); }
      ctx.fillStyle = sel ? '#241B4D' : '#FFFFFF'; ctx.font = K.font(Math.min(14, cw / 9)); ctx.fillText(K.t((shopTab === 'bows' ? 'b_' : shopTab === 'arrows' ? 's_' : shopTab === 'upg' ? 'u_' : 'o_') + id), x + cw / 2, y + ch * 0.66);
      rich(ctx, K, st.txt, x + cw / 2, y + ch * 0.84, Math.min(12, cw / 11), st.col);
      ui.push({ x: x, y: y, w: cw, h: ch, act: 'item', i: i });
    });
    var id = list[shopSel], st = itemState(K, id), bw = Math.min(300, W - 40), bh = Math.min(50, H * 0.1);
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = K.font(12, 700); ctx.textAlign = 'center'; ctx.fillText(itemDesc(K, id), W / 2, H - bh - 30);
    btn(ctx, K, (W - bw) / 2, H - bh - 12, bw, bh, st.btnCol, st.btn, 'buy');
  }
  function itemDesc(K, id) {
    if (shopTab === 'bows') { var b = BOWS[id]; return K.t('dmg') + ' ×' + b.dmg + ' · ' + K.t('speed') + ' ×' + b.spd + ' · ' + K.t('reload') + ' ×' + b.rel + (b.fire ? ' · 🔥' : '') + (b.pass ? ' · ' + K.t('passOnly').replace('%n', b.pass) : ''); }
    if (shopTab === 'arrows') return id === 'bundle' ? K.t('s_bundleD') : K.t('s_' + id + 'D');
    if (shopTab === 'upg') return K.t('u_' + id + 'D') + ' · Lv ' + upg(id) + '/' + UPG_MAX;
    return OUTFITS[id].pass ? K.t('passOnly').replace('%n', OUTFITS[id].pass) : '';
  }
  function itemState(K, id) {
    if (shopTab === 'bows') { var b = BOWS[id], ow = owned('bows', id); return ow ? (bowId() === id ? { txt: '✓ ' + K.t('equipped'), col: '#22C55E', btn: K.t('equipped'), btnCol: '#22C55E' } : { txt: K.t('owned'), col: '#9AA7B8', btn: K.t('equip'), btnCol: '#3B82F6' }) : b.gem ? { txt: '{g} ' + b.gem + ' · ' + K.t('tier') + ' ' + b.pass, col: '#3EC6FF', btn: K.t('buy') + ' · {g} ' + b.gem, btnCol: '#0EA5E9' } : { txt: '{f} ' + b.price, col: '#FFB020', btn: K.t('buy') + ' · {f} ' + b.price, btnCol: '#FFB020' }; }
    if (shopTab === 'arrows' && id === 'bundle') return { txt: '{g} ' + BUNDLE_GEMS, col: '#3EC6FF', btn: K.t('buy') + ' · {g} ' + BUNDLE_GEMS, btnCol: '#0EA5E9' };
    if (shopTab === 'arrows') { var sp = SPECIALS[id]; return { txt: '×' + (bag[id] || 0) + ' · {f} ' + sp.price, col: '#FFB020', btn: (bag[id] || 0) >= 9 ? K.t('maxed') : K.t('buy') + ' · {f} ' + sp.price, btnCol: '#FFB020' }; }
    if (shopTab === 'upg') { var p = upgPrice(id); return { txt: 'Lv ' + upg(id) + '/' + UPG_MAX, col: '#FFD23F', btn: p ? K.t('upgrade') + ' · {f} ' + p : K.t('maxed'), btnCol: p ? '#A855F7' : '#6E6890' }; }
    var o = OUTFITS[id], ow2 = owned('outfits', id), eqd = S('outfit', 'ranger') === id && ow2;
    return ow2 ? (eqd ? { txt: '✓ ' + K.t('equipped'), col: '#22C55E', btn: K.t('equipped'), btnCol: '#22C55E' } : { txt: K.t('owned'), col: '#9AA7B8', btn: K.t('equip'), btnCol: '#3B82F6' }) : o.gem ? { txt: '{g} ' + o.gem + ' · ' + K.t('tier') + ' ' + o.pass, col: '#3EC6FF', btn: K.t('buy') + ' · {g} ' + o.gem, btnCol: '#0EA5E9' } : { txt: '{f} ' + o.price, col: '#FFB020', btn: K.t('buy') + ' · {f} ' + o.price, btnCol: '#FFB020' };
  }
  function shopBuy(K) {
    var id = shopList()[shopSel];
    if (shopTab === 'bows') { var b = BOWS[id]; if (owned('bows', id)) { SS('bow', id); K.sfx('click'); return; } if (b.gem) { if (spendGems(b.gem)) { own('bows', id); SS('bow', id); K.sfx('reward'); K.confetti(30); } else { K.sfx('wrong'); K.toast(K.t('needGems')); } return; } if (K.spend(b.price)) { own('bows', id); SS('bow', id); K.sfx('reward'); K.confetti(30); } else { K.sfx('wrong'); K.toast(K.t('needCoins')); } return; }
    if (shopTab === 'arrows' && id === 'bundle') { if (spendGems(BUNDLE_GEMS)) { SPEC_ORDER.forEach(function (k) { bag[k] = Math.min(9, (bag[k] || 0) + 3); }); saveBag(); K.sfx('reward'); K.confetti(20); } else { K.sfx('wrong'); K.toast(K.t('needGems')); } return; }
    if (shopTab === 'arrows') { if ((bag[id] || 0) >= 9) { K.sfx('wrong'); return; } if (K.spend(SPECIALS[id].price)) { bag[id] = (bag[id] || 0) + 1; saveBag(); K.sfx('coin'); } else { K.sfx('wrong'); K.toast(K.t('needCoins')); } return; }
    if (shopTab === 'upg') { var p = upgPrice(id); if (!p) { K.sfx('wrong'); return; } if (K.spend(p)) { var o = S('upg', {}); if (!o || typeof o !== 'object') o = {}; o[id] = upg(id) + 1; SS('upg', o); K.sfx('reward'); } else { K.sfx('wrong'); K.toast(K.t('needCoins')); } return; }
    var of = OUTFITS[id]; if (owned('outfits', id)) { SS('outfit', id); K.sfx('click'); return; } if (of.gem) { if (spendGems(of.gem)) { own('outfits', id); SS('outfit', id); K.sfx('reward'); K.confetti(30); } else { K.sfx('wrong'); K.toast(K.t('needGems')); } return; } if (K.spend(of.price)) { own('outfits', id); SS('outfit', id); K.sfx('reward'); K.confetti(30); } else { K.sfx('wrong'); K.toast(K.t('needCoins')); }
  }
  function drawPass(ctx, K) {
    var W = K.W, H = K.H; ui = []; panel(ctx, K, '🎟️ ' + K.t('passTitle'));
    var tier = passTier(), xp = passXp(), got = S('claimed', []), cw = Math.min(96, W / 5.5), ch = Math.min(140, H * 0.36), gap = 8, y = K.hudH + 74, vis = Math.floor((W - 20) / (cw + gap));
    passScroll = Math.max(0, Math.min(PASS_N - vis, passScroll));
    ctx.fillStyle = '#FFFFFF'; ctx.font = K.font(13, 800); ctx.textAlign = 'center'; ctx.fillText(K.t('tier') + ' ' + tier + '/' + PASS_N + ' · ' + (tier >= PASS_N ? 'MAX' : (xp % PASS_XP) + '/' + PASS_XP + ' XP'), W / 2, K.hudH + 52);
    var x0 = (W - (vis * (cw + gap) - gap)) / 2;
    for (var i = 0; i < vis; i++) {
      var t = passScroll + i + 1; if (t > PASS_N) break;
      var x = x0 + i * (cw + gap), r = passReward(t), unl = t <= tier, cl = Array.isArray(got) && got.indexOf(t) >= 0, big = r[0] === 'bow' || r[0] === 'outfit';
      ctx.fillStyle = cl ? 'rgba(74,222,128,0.18)' : unl ? '#FFFFFF' : 'rgba(255,255,255,0.08)'; K.roundRect(ctx, x, y, cw, ch, 12); ctx.fill();
      if (big) { ctx.strokeStyle = '#FFD23F'; ctx.lineWidth = 3; ctx.stroke(); }
      ctx.fillStyle = unl && !cl ? '#241B4D' : '#FFFFFF'; ctx.font = K.font(11, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(K.t('tier') + ' ' + t, x + cw / 2, y + 14);
      icon(ctx, r[0] === 'coins' ? 'feather' : r[0] === 'gems' ? 'gem' : r[0] === 'spec' ? 's_' + r[1] : (r[0] === 'bow' ? 'b_' : 'o_') + r[1], x + cw / 2, y + ch * 0.4, Math.min(cw * 0.62, ch * 0.42), '🎁'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = K.font(Math.min(11, cw / 8), 800); ctx.fillStyle = unl && !cl ? '#6E6890' : 'rgba(255,255,255,0.8)'; wrap(ctx, r[0] === 'coins' || r[0] === 'gems' ? '+' + r[1] : r[0] === 'spec' ? '×' + r[2] + ' ' + K.t('s_' + r[1]) : K.t((r[0] === 'bow' ? 'b_' : 'o_') + r[1]), cw - 8).slice(0, 2).forEach(function (l, j) { ctx.fillText(l, x + cw / 2, y + ch * 0.62 + j * 13); });
      if (unl && !cl) { ctx.fillStyle = '#22C55E'; K.roundRect(ctx, x + 8, y + ch - 30, cw - 16, 24, 12); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.font = K.font(11); ctx.fillText(K.t('claim'), x + cw / 2, y + ch - 18); ui.push({ x: x, y: y, w: cw, h: ch, act: 'claim', t: t }); }
      else if (cl) { ctx.fillStyle = '#4ADE80'; ctx.font = K.font(16); ctx.fillText('✔', x + cw / 2, y + ch - 18); }
      else { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = K.font(13); ctx.fillText('🔒', x + cw / 2, y + ch - 18); }
    }
    var by = y + ch + 16, bh = 40;
    btn(ctx, K, 12, by, 60, bh, 'rgba(255,255,255,0.18)', '◀', 'pscroll');
    btn(ctx, K, W - 72, by, 60, bh, 'rgba(255,255,255,0.18)', '▶', 'pscroll2');
    if (passClaimable()) btn(ctx, K, W / 2 - 90, by, 180, bh, '#22C55E', K.t('claimAll'), 'claimAll');
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = K.font(12, 700); ctx.textAlign = 'center'; ctx.fillText(K.t('passHow'), W / 2, Math.min(H - 16, by + bh + 22));
  }
  function drawMis(ctx, K) {
    var W = K.W, H = K.H, o = missions(); ui = []; panel(ctx, K, '📜 ' + K.t('missions'));
    var pw = Math.min(560, W - 24), rh = Math.min(70, (H - K.hudH - 90) / 3 - 8), x = (W - pw) / 2;
    o.ids.forEach(function (k, i) {
      var y = K.hudH + 50 + i * (rh + 8), need = MIS[k][0], have = Math.min(need, o.p[k] || 0), done = have >= need, gt = !!o.got[k];
      ctx.fillStyle = gt ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.1)'; K.roundRect(ctx, x, y, pw, rh, 14); ctx.fill();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FFFFFF'; ctx.font = K.font(Math.min(16, rh / 4)); ctx.fillText(K.t(MIS[k][1]).replace('%n', need), x + 14, y + rh * 0.32);
      var bw2 = pw - 210; ctx.fillStyle = 'rgba(255,255,255,0.15)'; K.roundRect(ctx, x + 14, y + rh * 0.62, bw2, 10, 5); ctx.fill(); ctx.fillStyle = done ? '#4ADE80' : '#5CC8F2'; K.roundRect(ctx, x + 14, y + rh * 0.62, Math.max(10, bw2 * have / need), 10, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = K.font(11, 800); ctx.fillText(have + ' / ' + need, x + 20 + bw2, y + rh * 0.62 + 5);
      if (gt) { ctx.textAlign = 'center'; ctx.fillStyle = '#4ADE80'; ctx.font = K.font(18); ctx.fillText('✔', x + pw - 60, y + rh / 2); }
      else btn(ctx, K, x + pw - 150, y + (rh - 36) / 2, 136, 36, done ? '#22C55E' : 'rgba(0,0,0,0.35)', (done ? K.t('claim') + ' ' : '') + '{f} ' + MIS_PAY[i] + ' {g} 3', done ? 'mclaim' : 'none'), ui[ui.length - 1].k = k;
    });
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = K.font(12, 700); ctx.fillText(K.t('misNew'), W / 2, H - 18);
  }
  function metaTap(K, u) {
    if (!u) return; var a = u.act;
    if (a === 'back') { phase = 'hub'; K.sfx('click'); }
    else if (a === 'mode') { if (mode === u.m) { begin(K); return; } mode = u.m; SS('mode', mode); K.sfx('click'); }
    else if (a === 'go') begin(K);
    else if (a === 'shop') { phase = 'shop'; shopSel = 0; K.sfx('click'); }
    else if (a === 'pass') { phase = 'pass'; passScroll = Math.max(0, passTier() - 2); K.sfx('click'); }
    else if (a === 'mis') { phase = 'mis'; K.sfx('click'); }
    else if (a === 'tab') { shopTab = u.t; shopSel = 0; K.sfx('click'); }
    else if (a === 'item') { if (shopSel === u.i) shopBuy(K); else { shopSel = u.i; K.sfx('click'); } }
    else if (a === 'buy') shopBuy(K);
    else if (a === 'claim') passClaim(K, u.t);
    else if (a === 'claimAll') { for (var t = 1; t <= passTier(); t++) { var g = S('claimed', []); if (g.indexOf(t) < 0) passClaim(K, t); } }
    else if (a === 'pscroll') { passScroll -= 3; K.sfx('click'); } else if (a === 'pscroll2') { passScroll += 3; K.sfx('click'); }
    else if (a === 'mclaim') misClaim(K, u.k);
  }
  function metaKey(K, code) {
    if (phase === 'hub') {
      var i = MODE_ORDER.indexOf(mode);
      if (code === 'ArrowRight' || code === 'ArrowDown' || code === 'KeyD') { mode = MODE_ORDER[(i + 1) % MODE_ORDER.length]; SS('mode', mode); K.sfx('click'); }
      else if (code === 'ArrowLeft' || code === 'ArrowUp' || code === 'KeyA') { mode = MODE_ORDER[(i + MODE_ORDER.length - 1) % MODE_ORDER.length]; SS('mode', mode); K.sfx('click'); }
      else if (code === 'Enter' || code === 'Space') begin(K);
      else if (code === 'KeyS') metaTap(K, { act: 'shop' }); else if (code === 'KeyT') metaTap(K, { act: 'pass' }); else if (code === 'KeyM') metaTap(K, { act: 'mis' });
      return;
    }
    if (code === 'Backspace' || code === 'KeyB') { phase = 'hub'; K.sfx('click'); return; }
    if (phase === 'shop') { var L2 = shopList(); if (code === 'ArrowRight' || code === 'ArrowDown') { shopSel = (shopSel + 1) % L2.length; K.sfx('click'); } else if (code === 'ArrowLeft' || code === 'ArrowUp') { shopSel = (shopSel + L2.length - 1) % L2.length; K.sfx('click'); } else if (code === 'Enter' || code === 'Space') shopBuy(K); else if (code === 'KeyQ' || code === 'KeyE') { var T = ['bows', 'arrows', 'upg', 'outfits']; shopTab = T[(T.indexOf(shopTab) + (code === 'KeyE' ? 1 : 3)) % 4]; shopSel = 0; K.sfx('click'); } }
    else if (phase === 'pass') { if (code === 'ArrowLeft') passScroll -= 3; else if (code === 'ArrowRight') passScroll += 3; else if (code === 'Enter' || code === 'Space') metaTap(K, { act: 'claimAll' }); }
    else if (phase === 'mis' && (code === 'Enter' || code === 'Space')) missions().ids.forEach(function (k) { misClaim(K, k); });
  }
  function begin(K) { // leave the hub and start the chosen mode
    maxHp = 100 + 20 * upg('wall'); hp = maxHp; phase = 'build'; phaseT = 2.2; quiver = 0; timeLeft = mode === 'time' ? 90 : 0;
    K.sfx('horn'); playedMode(K); K.info(K.t('m_' + mode));
  }
  // special-arrow buttons during play (bottom left)
  function specBtns(K) { var r = Math.min(26, u * 0.9), y = K.H - r - 12, o = []; SPEC_ORDER.forEach(function (k, i) { o.push({ k: k, x: 14 + r + i * (r * 2 + 10), y: y, r: r }); }); return o; }
  function drawSpecBtns(ctx, K) {
    specBtns(K).forEach(function (b, i) {
      var n = bag[b.k] || 0, on = armed === b.k;
      ctx.globalAlpha = n ? 1 : 0.45; ctx.fillStyle = 'rgba(36,27,77,0.3)'; ctx.beginPath(); ctx.arc(b.x, b.y + 3, b.r, 0, K.TAU); ctx.fill();
      ctx.fillStyle = on ? SPECIALS[b.k].col : '#FFFFFF'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, K.TAU); ctx.fill();
      if (on) { ctx.strokeStyle = '#241B4D'; ctx.lineWidth = 3; ctx.stroke(); }
      icon(ctx, 's_' + b.k, b.x, b.y + 1, b.r * 1.7, SPECIALS[b.k].icon); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#241B4D'; ctx.beginPath(); ctx.arc(b.x + b.r * 0.72, b.y - b.r * 0.72, 9, 0, K.TAU); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.font = K.font(11); ctx.fillText(n, b.x + b.r * 0.72, b.y - b.r * 0.7);
      ctx.globalAlpha = 1;
    });
  }
  function armSpec(K, k) { if (!(bag[k] > 0)) { K.sfx('wrong'); return; } armed = armed === k ? null : k; K.sfx('click'); }

  function endRun(K) { var b = S('best:' + mode, 0); if (K.score > b) SS('best:' + mode, K.score); K.sfx('over'); K.gameOver({}); }
  BubziKit.run({
    id: AR3D ? 'arrow-rampart-3d' : 'arrow-rampart', coinRate: 0.02,
    title: AR3D ? { en: 'Arrow Rampart 3D', fr: 'Rempart des Flèches 3D', ar: 'سور السهام ثلاثي الأبعاد' } : { en: 'Arrow Rampart', fr: 'Rempart des Flèches', ar: 'سور السهام' },
    strings: {
      en: { feathers: 'Feathers', s_bundle: 'Arrow Bundle', s_bundleD: '+3 of every special arrow', needGems: 'Not enough gems', gems: 'Gems', chooseMode: 'Choose a mode', shop: 'SHOP', pass: 'PASS', missions: 'MISSIONS', play: 'PLAY', back: 'Back', tier: 'Tier', tierUp: 'Pass tier %n reached!', passTitle: 'RAMPART PASS', claim: 'CLAIM', claimAll: 'CLAIM ALL', passHow: 'Earn XP: raiders, headshots, waves and missions', misNew: 'New missions every day', misDone: 'Mission complete!', m_siege: 'Siege', d_siege: 'Endless waves. Pick upgrades between waves.', m_boss: 'Boss Rush', d_boss: 'Big chiefs every wave. Bring your best bow!', m_head: 'Headhunter', d_head: 'Few arrows. Headshots give arrows back and triple points.', m_night: 'Night Raid', d_night: 'Dark skies full of flyers. Only the torch lights the way.', m_time: 'Time Attack', d_time: '90 seconds, endless raiders. Score as much as you can!', t_bows: 'Bows', t_arrows: 'Arrows', t_upg: 'Upgrades', t_outfits: 'Outfits', b_oak: 'Oak Bow', b_recurve: 'Recurve Bow', b_longbow: 'Longbow', b_crossbow: 'Crossbow', b_elven: 'Elven Bow', b_dragon: 'Dragon Bow', s_bomb: 'Bomb Arrow', s_ice: 'Ice Arrow', s_zap: 'Lightning Arrow', s_bombD: 'Explodes and hits every raider close by', s_iceD: 'Freezes raiders close by for 3 seconds', s_zapD: 'Lightning jumps to 4 raiders', u_wall: 'Stone Wall', u_power: 'Sharp Steel', u_reload: 'Quick Draw', u_gold: 'Treasure', u_wallD: '+20 wall strength per level', u_powerD: '+10% damage per level', u_reloadD: 'Reload 6% faster per level', u_goldD: '+15% coins per level', o_ranger: 'Ranger', o_crimson: 'Crimson', o_frost: 'Frost', o_royal: 'Royal', o_shadow: 'Shadow', o_golden: 'Golden', dmg: 'Damage', speed: 'Speed', reload: 'Reload', passOnly: 'Pass tier %n', buy: 'BUY', equip: 'EQUIP', equipped: 'EQUIPPED', owned: 'Owned', maxed: 'MAX', upgrade: 'UPGRADE', needCoins: 'Not enough coins', noArrows: 'Out of arrows!', arrowsLeft: 'Arrows', timeL: 'Time', rk1: 'NICE!', rk2: 'GREAT!', rk3: 'SUPERB!', rk4: 'LEGENDARY!', mKill: 'Defeat %n raiders', mHead: 'Land %n headshots', mWave: 'Reach wave %n', mSpec: 'Use %n special arrows', mCombo: 'Reach a %n combo', mModes: 'Play %n different modes',
        hint: 'Pull back, let go!', tagline: 'Pull back, let go, and keep the raiders away from your wall!', wave: 'Wave', chief: 'Big chief!', head: 'Headshot!', combo: 'Combo', pick: 'Pick an upgrade', wall: 'Wall',
        power: 'Strong arrows', powerD: '+60% damage', quick: 'Quick hands', quickD: 'Shoot faster', multi: 'Extra arrow', multiD: '+1 arrow each shot', pierce: 'Sharp tips', pierceD: 'Arrows go through 1 more', fire: 'Fire arrows', fireD: 'Hits keep burning', repair: 'Repair wall', repairD: 'Fix 45% of the wall', stone: 'Thicker wall', stoneD: '+40 wall strength' },
      fr: { feathers: 'Plumes', s_bundle: 'Lot de flèches', s_bundleD: '+3 de chaque flèche spéciale', needGems: 'Pas assez de gemmes', gems: 'Gemmes', chooseMode: 'Choisis un mode', shop: 'BOUTIQUE', pass: 'PASS', missions: 'MISSIONS', play: 'JOUER', back: 'Retour', tier: 'Palier', tierUp: 'Palier %n du pass atteint !', passTitle: 'PASS DU REMPART', claim: 'PRENDRE', claimAll: 'TOUT PRENDRE', passHow: 'Gagne de l’XP : pillards, tirs à la tête, vagues et missions', misNew: 'Nouvelles missions chaque jour', misDone: 'Mission accomplie !', m_siege: 'Siège', d_siege: 'Vagues sans fin. Choisis des bonus entre les vagues.', m_boss: 'Course aux chefs', d_boss: 'De grands chefs à chaque vague. Prends ton meilleur arc !', m_head: 'Chasseur de têtes', d_head: 'Peu de flèches. Les tirs à la tête en rendent et triplent les points.', m_night: 'Raid de nuit', d_night: 'Un ciel noir plein de volants. Seule la torche éclaire.', m_time: 'Contre la montre', d_time: '90 secondes, pillards sans fin. Marque un max de points !', t_bows: 'Arcs', t_arrows: 'Flèches', t_upg: 'Améliorations', t_outfits: 'Tenues', b_oak: 'Arc en chêne', b_recurve: 'Arc recourbé', b_longbow: 'Arc long', b_crossbow: 'Arbalète', b_elven: 'Arc elfique', b_dragon: 'Arc du dragon', s_bomb: 'Flèche bombe', s_ice: 'Flèche de glace', s_zap: 'Flèche éclair', s_bombD: 'Explose et touche les pillards proches', s_iceD: 'Gèle les pillards proches 3 secondes', s_zapD: 'L’éclair touche 4 pillards', u_wall: 'Mur de pierre', u_power: 'Acier tranchant', u_reload: 'Tir rapide', u_gold: 'Trésor', u_wallD: '+20 de solidité par niveau', u_powerD: '+10 % de dégâts par niveau', u_reloadD: 'Recharge 6 % plus vite par niveau', u_goldD: '+15 % de pièces par niveau', o_ranger: 'Rôdeur', o_crimson: 'Pourpre', o_frost: 'Givre', o_royal: 'Royal', o_shadow: 'Ombre', o_golden: 'Doré', dmg: 'Dégâts', speed: 'Vitesse', reload: 'Recharge', passOnly: 'Palier %n du pass', buy: 'ACHETER', equip: 'ÉQUIPER', equipped: 'ÉQUIPÉ', owned: 'Acquis', maxed: 'MAX', upgrade: 'AMÉLIORER', needCoins: 'Pas assez de pièces', noArrows: 'Plus de flèches !', arrowsLeft: 'Flèches', timeL: 'Temps', rk1: 'BIEN !', rk2: 'SUPER !', rk3: 'SUPERBE !', rk4: 'LÉGENDAIRE !', mKill: 'Bats %n pillards', mHead: 'Réussis %n tirs à la tête', mWave: 'Atteins la vague %n', mSpec: 'Utilise %n flèches spéciales', mCombo: 'Fais un combo de %n', mModes: 'Joue %n modes différents',
        hint: 'Tire en arrière, lâche !', tagline: 'Tire, lâche et garde les pillards loin de ton rempart !', wave: 'Vague', chief: 'Grand chef !', head: 'En pleine tête !', combo: 'Combo', pick: 'Choisis une amélioration', wall: 'Mur',
        power: 'Flèches fortes', powerD: '+60 % de dégâts', quick: 'Mains rapides', quickD: 'Tire plus vite', multi: 'Flèche bonus', multiD: '+1 flèche par tir', pierce: 'Pointes fines', pierceD: 'Traverse 1 ennemi de plus', fire: 'Flèches de feu', fireD: 'Les coups brûlent', repair: 'Réparer', repairD: 'Répare 45 % du mur', stone: 'Mur épais', stoneD: '+40 de solidité' },
      ar: { feathers: 'ريش', s_bundle: 'حزمة السهام', s_bundleD: '+3 من كل سهم خاص', needGems: 'لا توجد جواهر كافية', gems: 'جواهر', chooseMode: 'اختر وضعاً', shop: 'المتجر', pass: 'التذكرة', missions: 'المهام', play: 'العب', back: 'رجوع', tier: 'المستوى', tierUp: 'وصلت إلى مستوى التذكرة %n!', passTitle: 'تذكرة السور', claim: 'استلم', claimAll: 'استلم الكل', passHow: 'اكسب الخبرة: الغزاة والإصابات في الرأس والموجات والمهام', misNew: 'مهام جديدة كل يوم', misDone: 'اكتملت المهمة!', m_siege: 'الحصار', d_siege: 'موجات لا تنتهي. اختر تحسينات بين الموجات.', m_boss: 'سباق الزعماء', d_boss: 'زعماء كبار في كل موجة. أحضر أفضل قوس!', m_head: 'صائد الرؤوس', d_head: 'سهام قليلة. الإصابة في الرأس تعيد السهام وتضاعف النقاط ثلاثاً.', m_night: 'غارة ليلية', d_night: 'سماء مظلمة مليئة بالطائرين. الشعلة وحدها تضيء.', m_time: 'سباق الوقت', d_time: '90 ثانية وغزاة بلا نهاية. اجمع أكبر عدد من النقاط!', t_bows: 'الأقواس', t_arrows: 'السهام', t_upg: 'التحسينات', t_outfits: 'الأزياء', b_oak: 'قوس البلوط', b_recurve: 'القوس المنحني', b_longbow: 'القوس الطويل', b_crossbow: 'القوس والنشاب', b_elven: 'قوس الجان', b_dragon: 'قوس التنين', s_bomb: 'سهم القنبلة', s_ice: 'سهم الجليد', s_zap: 'سهم البرق', s_bombD: 'ينفجر ويصيب الغزاة القريبين', s_iceD: 'يجمد الغزاة القريبين 3 ثوانٍ', s_zapD: 'البرق يقفز إلى 4 غزاة', u_wall: 'سور حجري', u_power: 'فولاذ حاد', u_reload: 'سحب سريع', u_gold: 'كنز', u_wallD: '+20 لقوة السور لكل مستوى', u_powerD: '+10٪ ضرر لكل مستوى', u_reloadD: 'إعادة تلقيم أسرع 6٪ لكل مستوى', u_goldD: '+15٪ عملات لكل مستوى', o_ranger: 'الحارس', o_crimson: 'القرمزي', o_frost: 'الصقيع', o_royal: 'الملكي', o_shadow: 'الظل', o_golden: 'الذهبي', dmg: 'الضرر', speed: 'السرعة', reload: 'التلقيم', passOnly: 'مستوى التذكرة %n', buy: 'اشترِ', equip: 'جهّز', equipped: 'مُجهّز', owned: 'مملوك', maxed: 'الأقصى', upgrade: 'طوّر', needCoins: 'لا توجد عملات كافية', noArrows: 'نفدت السهام!', arrowsLeft: 'السهام', timeL: 'الوقت', rk1: 'جميل!', rk2: 'رائع!', rk3: 'مذهل!', rk4: 'أسطوري!', mKill: 'اهزم %n غازياً', mHead: 'أصب %n مرات في الرأس', mWave: 'اوصل إلى الموجة %n', mSpec: 'استخدم %n سهام خاصة', mCombo: 'حقق سلسلة %n', mModes: 'العب %n أوضاع مختلفة',
        hint: 'اسحب للخلف ثم أفلت!', tagline: 'اسحب وأفلت وأبعد الغزاة عن سورك!', wave: 'الموجة', chief: 'الزعيم الكبير!', head: 'إصابة في الرأس!', combo: 'سلسلة', pick: 'اختر تحسيناً', wall: 'السور',
        power: 'سهام قوية', powerD: '+60٪ ضرر', quick: 'أيدٍ سريعة', quickD: 'إطلاق أسرع', multi: 'سهم إضافي', multiD: '+1 سهم في كل رمية', pierce: 'رؤوس حادة', pierceD: 'يخترق عدواً إضافياً', fire: 'سهام نارية', fireD: 'الإصابات تحترق', repair: 'إصلاح السور', repairD: 'يصلح 45٪ من السور', stone: 'سور أسمك', stoneD: '+40 لقوة السور' }
    },
    resize: function (K) { layout(K); if (view) view.resize(K.W, K.H, window.devicePixelRatio || 1); },
    idle: function (dt, K, st) { if (music && musicOn && K) music.mood(K, 'menu', null); },
    reset: function (K) {
      if (K.test) K.dbg = function () {
        return { wave: wave, phase: phase, hp: Math.round(hp), maxHp: maxHp, kills: kills, heads: heads, shots: shots, reload: reload, up: up,
          archer: { x: archer.x, y: archer.y - u * 0.1 }, G: G, vmax: vmax, dragFull: dragFull, wallX: wallX,
          foes: foes.filter(function (f) { return !f.dead; }).map(function (f) { var b = body(f); return { k: f.k, x: b.bx, y: b.by, hx: b.hx, hy: b.hy, spd: f.atk > 0 ? 0 : f.spd * pace }; }),
          cards: cards ? cards.map(function (c) { return { id: c.id, x: c.x + c.w / 2, y: c.y + c.h / 2 }; }) : null,
          mode: mode, bag: bag, armed: armed, quiver: quiver, timeLeft: timeLeft, xp: passXp(), tier: passTier(), bow: bowId(), mis: missions(), ui: ui.map(function (q) { return { act: q.act, x: q.x + q.w / 2, y: q.y + q.h / 2, m: q.m, i: q.i, t: q.t }; }) };
      };
      K1 = K; layout(K);
      if (!music && window.GameMusic) { // recorded music + SFX (ElevenLabs); names the game uses are mapped to files, the rest fall back to the kit synth
        music = window.GameMusic({ base: 'audio/arrow-rampart/', sfx: ['draw', 'shoot', 'thunk', 'headshot', 'ground', 'wall', 'horn', 'chief', 'boom', 'ice', 'zap', 'coin', 'reward', 'card', 'click', 'over', 'tier', 'die1', 'die2', 'die3', 'grunt1', 'grunt2', 'grunt3'],
          variants: { die: ['die1', 'die2', 'die3'], grunt: ['grunt1', 'grunt2', 'grunt3'] } });
        var kitSfx = K.sfx, FALL = { shoot: 'flip', thunk: 'hit', headshot: 'punch', die: 'pop', wall: 'punch', horn: 'whoosh', chief: 'boss', ice: 'pop', zap: 'combo', tier: 'star', card: 'flip', grunt: null, ground: null, draw: null };
        K.sfx = function (n) { if (!music.sfx(K, n)) { var f = FALL.hasOwnProperty(n) ? FALL[n] : n; if (f) kitSfx.call(K, f); } };
        ['pointerdown', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { musicOn = true; setTimeout(function () { music.preload(K); }, 50); }, { once: true }); });
      }
      mode = MODE_ORDER.indexOf(S('mode', 'siege')) >= 0 ? S('mode', 'siege') : 'siege'; bag = loadBag(); armed = null; fx = []; rank = null; ui = []; quiver = 0; timeLeft = 0;
      wave = 0; phase = K.test && window.__arDirect ? 'build' : 'hub'; phaseT = 2.2; foes = []; arrows = []; stuck = []; maxHp = 100 + 20 * upg('wall'); hp = maxHp; kills = 0; heads = 0; shots = 0; reload = 0; drag = null;
      kbAng = -0.35; kbPow = 0.7; kbHold = false; cards = null; up = { power: 0, quick: 0, multi: 0, pierce: 0, fire: 0 }; queue = []; spawnT = 0; wallHit = 0; tutT = 0;
      aimAng = -0.3; aimPow = 0; lastFire = 0; combo = 0; comboT = 0;
    },
    revive: function (K) { if (mode === 'time' && timeLeft <= 0) timeLeft = 20; hp = maxHp * 0.6; foes.forEach(function (f) { if (!f.fly) f.x = Math.max(f.x, K.W * 0.8); else f.x = Math.max(f.x, K.W * 0.75); f.atk = 0; }); },
    pointerDown: function (x, y, K) {
      if (phase === 'hub' || phase === 'shop' || phase === 'pass' || phase === 'mis') { for (var q = ui.length - 1; q >= 0; q--) if (inB(ui[q], x, y)) { metaTap(K, ui[q]); return; } return; }
      if (phase !== 'cards') { var sb = specBtns(K); for (var j = 0; j < sb.length; j++) if (Math.hypot(x - sb[j].x, y - sb[j].y) < sb[j].r + 6) { armSpec(K, sb[j].k); return; } }
      if (phase === 'cards') { for (var i = 0; i < cards.length; i++) if (inB(cards[i], x, y) && phaseT > 0.35) { choose(K, cards[i]); return; } return; }
      drag = { x0: x, y0: y, x: x, y: y }; K.sfx('draw');
    },
    pointerMove: function (x, y) { if (drag) { drag.x = x; drag.y = y; } },
    pointerUp: function (x, y, K) {
      if (!drag) return; drag.x = x; drag.y = y;
      var a = aimFrom(drag.x - drag.x0, drag.y - drag.y0); drag = null;
      if (a) fire(K, a.ang, a.pow);
    },
    pointerCancel: function () { drag = null; },
    key: function (code, down, K, rep) {
      if (phase === 'hub' || phase === 'shop' || phase === 'pass' || phase === 'mis') { if (down && !rep) metaKey(K, code); return; }
      if (phase !== 'cards' && down && !rep) { var dk = { Digit1: 'bomb', Digit2: 'ice', Digit3: 'zap' }[code]; if (dk) { armSpec(K, dk); return; } }
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
      var metaP = phase === 'hub' || phase === 'shop' || phase === 'pass' || phase === 'mis';
      if (K.hudMid) K.hudMid(!metaP); if (K.bannerOff) K.bannerOff(!metaP);
      if (music && musicOn) music.mood(K, metaP ? 'menu' : 'fight', metaP ? null : mode === 'night' ? 'night' : mode === 'time' ? 'time' : foes.some(function (f) { return f.k === 'chief' && !f.dead; }) || mode === 'boss' ? 'boss' : 'fight');
      if (metaP) return;
      fx.forEach(function (q) { q.t += dt; }); fx = fx.filter(function (q) { return q.t < 0.5; });
      if (mode === 'time') { timeLeft -= dt; if (timeLeft <= 0) { timeLeft = 0; endRun(K); return; } }
      tutT += dt; reload = Math.max(0, reload - dt); lastFire = Math.max(0, lastFire - dt); wallHit = Math.max(0, wallHit - dt * 3);
      comboT -= dt; if (comboT <= 0) combo = 0;
      if (kbHold) kbPow = Math.min(1, kbPow + dt * 0.9);
      if (drag) { var a = aimFrom(drag.x - drag.x0, drag.y - drag.y0); if (a) { aimAng = a.ang; aimPow = a.pow; } else aimPow = 0; }
      else if (kbHold) { aimAng = kbAng; aimPow = kbPow; } else { aimPow = 0; aimAng += (kbAng - aimAng) * Math.min(1, dt * 10); }
      phaseT += phase === 'build' ? -dt : dt;
      if (phase === 'build' && phaseT <= 0) startWave(K);
      if (mode === 'time' && phase === 'wave') { if (queue.length < 4) { var tk = ['grunt', 'grunt', 'runner', 'brute', 'flyer']; queue.push(tk[Math.floor(Math.random() * Math.min(tk.length, 2 + wave))]); } if (Math.floor(timeLeft / 15) !== Math.floor((timeLeft + dt) / 15)) { wave++; K.sfx('horn'); } }
      if (phase === 'wave') {
        spawnT -= dt; if (queue.length && spawnT <= 0) { spawn(K, queue.shift()); spawnT = Math.max(0.3, 1.3 - wave * 0.07) * K.rand(0.5, 1.4); }
        if (!queue.length && !foes.length) {
          var bonus = 20 + wave * 5; K.addScore(bonus); K.floatText(K.W / 2, K.hudH + 80, '+' + bonus, '#B8860B', 26); K.sfx('star');
          addC(K, 2 + Math.floor(wave / 2), K.W / 2, K.hudH + 100); if (wave % 5 === 0) addGems(K, 2, K.W / 2, K.hudH + 130); passAdd(K, 10); misSet(K, 'wave', wave, true);
          dealCards(K); K.sfx('card');
        }
      }
      // raiders
      foes.forEach(function (f) {
        var d = KINDS[f.k];
        if (f.dead) { f.dead += dt; return; }
        f.hit = Math.max(0, f.hit - dt * 5);
        if (f.frozen > 0) { f.frozen -= dt; return; }
        if (f.burn > 0) { f.burn -= dt; f.hp -= dt * 0.6 * up.fire; if (f.hp <= 0) { var b = body(f); damage(K, f, 0, false, b.bx, b.by); } }
        var sx = stopX(f);
        if (f.x > sx) { f.x = Math.max(sx, f.x - f.spd * pace * dt); f.walk += dt * f.spd * 6; f.atk = 0; }
        else {
          f.atk += dt; hp -= d.dps * (f.dpsM || 1) * dt; wallHit = 1;
          if (Math.floor(f.atk * 1.4) !== Math.floor((f.atk - dt) * 1.4)) { K.sfx('wall'); if (Math.random() < 0.3) K.sfx('grunt'); K.burst(wallX + 2, (f.fly ? f.y : gy) - d.sz * u, ['#C9C3E0', '#8A84A8'], 4, 90, 3); if (f.k === 'chief' || f.k === 'brute') K.shake(3); }
        }
      });
      foes = foes.filter(function (f) { return !f.dead || f.dead < 0.4; });
      // arrows
      var dmg = baseDmg();
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
              if (ar.sp) { triggerSpecial(K, ar.sp, ar.x, ar.y, f); ar.sp = null; return false; }
              if (ar.pierce-- <= 0) { if (!f.dead) stuck.push({ f: f, dx: ar.x - f.x, dy: ar.y - (f.fly ? f.y : gy), a: Math.atan2(ar.vy, ar.vx), t: 0 }); return false; }
            }
          }
          if (ar.y >= gy - 2 && ar.sp) { triggerSpecial(K, ar.sp, ar.x, gy - u, null); return false; }
          if (ar.y >= gy - 2) { K.sfx('ground'); stuck.push({ x: ar.x, y: gy - 2, a: Math.atan2(ar.vy, ar.vx), t: 0 }); K.burst(ar.x, gy, ['#C8B07A', '#E3C48F'], 3, 60, 2.5); return false; }
          if (ar.x > K.W + 60 || ar.x < -60 || ar.y > K.H) return false;
        }
        return true;
      });
      stuck.forEach(function (s) { s.t += dt; }); stuck = stuck.filter(function (s) { return s.t < 1.6 && (!s.f || !s.f.dead && foes.indexOf(s.f) >= 0); });
      if (cards) cards.forEach(function (c) { c.t += dt; });
      if (hp <= 0) { hp = 0; endRun(K); return; }
      K.info(K.t('m_' + mode) + ' · ' + K.t('wave') + ' ' + Math.max(1, wave));
    },
    draw: function (ctx, K, state) {
      var W = K.W, H = K.H, i;
      if (!view && !viewTried && AR3D && window.ArrowView && !(K.test && !/[?&]3d\b/.test(location.search))) { /* tests run the 2D path (software WebGL is too slow for timed bots) unless ?test&3d */ viewTried = true; try { view = window.ArrowView(document.getElementById('stage')); if (view) view.resize(W, H, window.devicePixelRatio || 1); } catch (e) { view = null; } }
      if (view) { var fe = window.__bubzi && window.__bubzi.feel ? window.__bubzi.feel() : { x: 0, y: 0 }, O3 = outfit(), B3 = bow();
        view.render({ u: u, gy: gy, wallX: wallX, wallTop: wallTop, hudH: K.hudH, archer: archer, aimAng: aimAng, pull: aimPow > 0.05 ? aimPow : lastFire > 0 ? -0.2 : 0, ready: reload <= 0 && phase !== 'hub' && phase !== 'shop' && phase !== 'pass' && phase !== 'mis',
          outfit: O3, bowWood: B3.wood, bowFire: B3.fire, fireArrows: up.fire > 0 || !!B3.fire, foes: foes, arrows: arrows, stuck: stuck, fx: fx, kinds: KINDS, mode: phase === 'hub' || phase === 'shop' || phase === 'pass' || phase === 'mis' ? S('mode', 'siege') : mode, time: K.time,
          shake: fe, wallDmg: 1 - hp / maxHp, wallHit: wallHit }); }
      else {
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
      }
      K.steady(ctx, function () { // HUD layer: stays still while the scene shakes
      if (phase === 'hub' || phase === 'shop' || phase === 'pass' || phase === 'mis') return;
      // wall health bar
      var hbw = Math.min(W * 0.4, 190), hbx = 12, hby = K.hudH + 14;
      ctx.fillStyle = 'rgba(36,27,77,0.15)'; K.roundRect(ctx, hbx, hby + 3, hbw, 18, 9); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; K.roundRect(ctx, hbx, hby, hbw, 18, 9); ctx.fill();
      ctx.fillStyle = hp / maxHp > 0.35 ? '#7ED957' : '#FF5E7E'; K.roundRect(ctx, hbx + 3, hby + 3, Math.max(0, (hbw - 6) * hp / maxHp), 12, 6); ctx.fill();
      ctx.font = K.font(12); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#241B4D'; ctx.fillText('🧱 ' + Math.ceil(hp) + ' / ' + maxHp, hbx + hbw / 2, hby + 10);
      // upgrades owned
      var ux = hbx; ctx.font = K.font(14); ctx.textAlign = 'left';
      ['power', 'quick', 'multi', 'pierce', 'fire'].forEach(function (k) { if (up[k]) { icon(ctx, 'c_' + k, ux + 12, hby + 34, 26, CARD_ICON[k]); ctx.textAlign = 'left'; ctx.fillStyle = '#241B4D'; if (up[k] > 1) ctx.fillText(up[k], ux + 24, hby + 40); ux += up[k] > 1 ? 40 : 30; } });
      });
      // aim guide
      var showPow = aimPow > 0.05;
      if (showPow) {
        var sp = vmax * (0.35 + 0.65 * aimPow), vx = Math.cos(aimAng) * sp, vy = Math.sin(aimAng) * sp, px = archer.x + Math.cos(aimAng) * u * 0.6, py = archer.y - u * 0.1 + Math.sin(aimAng) * u * 0.6;
        for (i = 1; i <= 14; i++) { var t = i * 0.045, dx = px + vx * t, dy = py + vy * t + G * t * t / 2; if (dy > gy) break; ctx.fillStyle = 'rgba(255,255,255,' + (0.95 - i * 0.055) + ')'; ctx.beginPath(); ctx.arc(dx, dy, Math.max(2, 5 - i * 0.22), 0, K.TAU); ctx.fill(); }
        if (drag) { ctx.strokeStyle = 'rgba(36,27,77,0.25)'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(drag.x0, drag.y0); ctx.lineTo(drag.x, drag.y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = 'rgba(36,27,77,0.25)'; ctx.beginPath(); ctx.arc(drag.x0, drag.y0, 8, 0, K.TAU); ctx.fill(); }
      }
      // stuck arrows, raiders, flying arrows
      if (!view) stuck.forEach(function (s) { var a = 1 - Math.max(0, s.t - 1.2) / 0.4; ctx.globalAlpha = a; if (s.f) arrowShape(ctx, K, s.f.x + s.dx, (s.f.fly ? s.f.y : gy) + s.dy, s.a, u * 0.9, 0); else arrowShape(ctx, K, s.x, s.y, s.a, u * 0.9, 0); ctx.globalAlpha = 1; });
      if (view) { ctx.globalAlpha = 1; foes.forEach(function (f) { foeBar(ctx, K, f); }); }
      else {
      foes.slice().sort(function (a, b) { return (a.fly ? 0 : 1) - (b.fly ? 0 : 1) || b.x - a.x; }).forEach(function (f) { drawFoe(ctx, K, f); });
      drawArcher(ctx, K, aimAng, showPow ? aimPow : lastFire > 0 ? -0.2 : 0);
      arrows.forEach(function (ar) { arrowShape(ctx, K, ar.x, ar.y, Math.atan2(ar.vy, ar.vx), u * 0.9, up.fire); });
      }
      // special-arrow effects
      fx.forEach(function (q) { var a2 = 1 - q.t / 0.5; ctx.globalAlpha = Math.max(0, a2);
        if (q.k === 'ring' && view) { /* drawn in 3D */ }
        else if (q.k === 'ring') { ctx.strokeStyle = q.col; ctx.lineWidth = 6 * a2 + 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (0.4 + q.t * 1.4), 0, K.TAU); ctx.stroke(); }
        else { ctx.strokeStyle = '#FFF6A8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(q.x, q.y); for (var z = 1; z < 6; z++) ctx.lineTo(q.x + (q.x2 - q.x) * z / 6 + (Math.random() - 0.5) * 18, q.y + (q.y2 - q.y) * z / 6 + (Math.random() - 0.5) * 18); ctx.lineTo(q.x2, q.y2); ctx.stroke(); }
        ctx.globalAlpha = 1; });
      if (armed && phase !== 'cards') { ctx.fillStyle = SPECIALS[armed].col; ctx.beginPath(); ctx.arc(archer.x, archer.y - u * 1.6, u * 0.22 + Math.sin(K.time * 10) * 2, 0, K.TAU); ctx.fill(); }
      // night raid: darkness with a warm torch light around the archer
      if (!view && mode === 'night' && phase !== 'hub' && phase !== 'shop' && phase !== 'pass' && phase !== 'mis') {
        var ng = ctx.createRadialGradient(archer.x, archer.y, u * 2, archer.x, archer.y, Math.max(W, H) * 0.75); ng.addColorStop(0, 'rgba(255,190,90,0.05)'); ng.addColorStop(0.35, 'rgba(12,10,40,0.45)'); ng.addColorStop(1, 'rgba(8,6,30,0.82)');
        ctx.fillStyle = ng; ctx.fillRect(0, 0, W, H);
        foes.forEach(function (f) { if (f.dead) return; var b = body(f); ctx.fillStyle = '#FFE66B'; ctx.beginPath(); ctx.arc(b.hx - 4, b.hy, 2.2, 0, K.TAU); ctx.arc(b.hx + 4, b.hy, 2.2, 0, K.TAU); ctx.fill(); });
      }
      // reload ring
      if (reload > 0) { var rr = reloadTime(); ctx.strokeStyle = 'rgba(36,27,77,0.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(archer.x, archer.y - u * 1.6, u * 0.32, -Math.PI / 2, -Math.PI / 2 + K.TAU * (1 - reload / rr)); ctx.stroke(); }
      K.steady(ctx, function () { // HUD layer: stays still while the scene shakes
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
          icon(ctx, 'c_' + c.id, 0, -c.h / 2 + 10 + c.h * 0.21, c.h * 0.38, CARD_ICON[c.id]); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.font = K.font(Math.max(13, Math.min(17, c.w * 0.12))); ctx.fillStyle = '#241B4D'; ctx.fillText(K.t(c.id), 0, c.h * 0.1);
          ctx.font = K.font(Math.max(11, Math.min(13, c.w * 0.09))); ctx.fillStyle = '#6E6890';
          var words = K.t(c.id + 'D').split(' '), line = '', ly = c.h * 0.25, lines = [];
          words.forEach(function (w) { var tl = line ? line + ' ' + w : w; if (ctx.measureText(tl).width > c.w - 18 && line) { lines.push(line); line = w; } else line = tl; }); lines.push(line);
          lines.forEach(function (l, j) { ctx.fillText(l, 0, ly + j * 16); });
          ctx.font = K.font(12); ctx.fillStyle = '#B4AED0'; ctx.fillText(n + 1, -c.w / 2 + 20, -c.h / 2 + 22);
          ctx.restore();
        });
      }
      var metaD = phase === 'hub' || phase === 'shop' || phase === 'pass' || phase === 'mis';
      if (!metaD && phase !== 'cards') {
        drawSpecBtns(ctx, K);
        var pills = []; if (mode === 'head') pills.push(['🏹 ' + quiver, quiver > 3 ? '#241B4D' : '#E8364F']); if (mode === 'time') pills.push(['⏱️ ' + Math.ceil(timeLeft), timeLeft > 10 ? '#241B4D' : '#E8364F']);
        pills.forEach(function (pq, i) { ctx.font = K.font(16); var pw2 = ctx.measureText(pq[0]).width + 24, px2 = W - pw2 - 12, py2 = K.hudH + 14 + i * 34; ctx.fillStyle = 'rgba(255,255,255,0.92)'; K.roundRect(ctx, px2, py2, pw2, 28, 14); ctx.fill(); ctx.fillStyle = pq[1]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pq[0], px2 + pw2 / 2, py2 + 15); });
        if (rank && K.time - rank.at < 1.2) { var ra = K.time - rank.at, pop = ra < 0.12 ? 0.6 + ra / 0.12 * 0.6 : 1.2 - Math.min(0.2, ra); ctx.save(); ctx.globalAlpha = Math.min(1, (1.2 - ra) * 3); ctx.translate(W / 2, K.hudH + 110); ctx.rotate(-0.06); ctx.scale(pop, pop); ctx.font = K.font(Math.min(44, W / 10)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 8; ctx.strokeStyle = '#241B4D'; ctx.strokeText(rank.t, 0, 0); ctx.fillStyle = rank.col; ctx.fillText(rank.t, 0, 0); ctx.restore(); }
      }
      if (phase === 'hub') drawHub(ctx, K); else if (phase === 'shop') drawShop(ctx, K); else if (phase === 'pass') drawPass(ctx, K); else if (phase === 'mis') drawMis(ctx, K);
      // tutorial: pull back from the archer side and let go
      if (K.tutorial && state === 'playing' && phase !== 'cards' && !metaD) {
        var k2 = (tutT * 0.6) % 1, sx = W * 0.45, sy = (wallTop + gy) / 2, e = Math.min(1, k2 / 0.7);
        var hx = sx - e * Math.min(W * 0.25, dragFull * 0.8), hy = sy + e * Math.min(W * 0.12, dragFull * 0.35);
        K.drawHand(ctx, hx, hy, k2 < 0.75, Math.min(W, H) / 220);
        ctx.font = K.font(20); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#241B4D'; ctx.fillText(K.t('hint'), W / 2, Math.max(K.hudH + 70, wallTop - u * 4));
      }
      });
    }
  });
})();
