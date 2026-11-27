/* Tiny Siege — original lane war game for Bubzi.
   Send miners for gold, spend it on stick fighters, and knock down the enemy tower before they knock down yours. */
(function () {
  'use strict';
  var KINDS = ['miner', 'sword', 'archer', 'giant'];
  var T = {
    miner: { cost: 50, hp: 30, dmg: 3, rate: 1, range: 0.6, spd: 0.11, cd: 1.2, size: 0.9, val: 6 },
    sword: { cost: 60, hp: 70, dmg: 13, rate: 0.75, range: 0.8, spd: 0.1, cd: 0.9, size: 1, val: 12 },
    archer: { cost: 85, hp: 40, dmg: 10, rate: 1.0, range: 4, spd: 0.09, cd: 1.2, size: 1, val: 16 },
    giant: { cost: 200, hp: 380, dmg: 36, rate: 1.4, range: 1.1, spd: 0.065, cd: 3.5, size: 1.55, val: 40 }
  };
  var TEAM = [{ c: '#7B4DFF', d: '#2A1A6B' }, { c: '#FF5E5B', d: '#5A1620' }];
  var MINE = 0.13, HOLD = 0.3, MAXMINERS = 5, MAXARMY = 26, MYMAX = 800;
  var kb = false, front = 1, u, W, H, laneL, laneR, laneLen, groundY, sceneTop, towerW, towerH, tx0, tx1, rowY, bh, btns, modeB, infoY;
  var units, arrows, dead, gold, foeGold, myHp, foeHp, foeMax, level, mode, cds, foeCd, aiT, aiWant, phase, phaseT, kills, tutT, scoreAcc, flagT;

  function layout(K) {
    W = K.W; H = K.H;
    bh = K.clamp(H * 0.1, 64, 88); rowY = H - bh - 12; infoY = rowY - 34;
    sceneTop = K.hudH + 34;
    var sceneH = infoY - 10 - sceneTop;
    u = K.clamp(Math.min(W * 0.1, sceneH * 0.095), 24, 52);
    towerW = u * 1.45; towerH = u * 3.6;
    groundY = Math.max(sceneTop + towerH + u * 2.2, Math.min(sceneTop + sceneH * 0.62, infoY - 22 - u * 1.6));
    front = K.clamp((infoY - 22 - groundY) / u - 0.75, 0.6, 2.6);
    var fieldW = Math.min(W - 12, u * 22), fx = (W - fieldW) / 2;
    tx0 = fx + towerW / 2 + 4; tx1 = fx + fieldW - towerW / 2 - 4;
    laneL = tx0 + towerW * 0.45; laneR = tx1 - towerW * 0.45; laneLen = laneR - laneL;
    var n = KINDS.length, gap = 8, bw = Math.min(120, (W - 24 - gap * (n - 1)) / n), total = bw * n + gap * (n - 1), bx = (W - total) / 2;
    btns = KINDS.map(function (k, i) { return { k: k, x: bx + i * (bw + gap), y: rowY, w: bw, h: bh }; });
    modeB = { w: Math.min(150, W * 0.36), h: 30 }; modeB.x = bx + total - modeB.w; modeB.y = infoY - 15;
  }
  function lx(f) { return laneL + f * laneLen; }
  function inB(b, x, y) { return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; }
  function count(side, kind) { var n = 0; units.forEach(function (q) { if (q.side === side && (!kind ? q.kind !== 'miner' : q.kind === kind)) n++; }); return n; }
  function spawn(K, side, kind) {
    var t = T[kind], sc = side ? 1 + (level - 1) * 0.1 : 1, dsc = side ? 1 + (level - 1) * 0.06 : 1;
    var q = { side: side, kind: kind, x: side ? 1 : 0, dy: kind === 'miner' ? front * K.rand(0.75, 0.95) : K.rand(-0.3, Math.max(0.3, front * 0.6)), hp: t.hp * sc, max: t.hp * sc, dmg: t.dmg * dsc, cd: K.rand(0, 0.4), anim: K.rand(0, 6), atk: 0, st: 'go', carry: 0, mineT: 0, hurt: 0 };
    units.push(q); return q;
  }
  function buy(K, kind) {
    if (phase !== 'play') return false;
    var t = T[kind];
    if (cds[kind] > 0) return false;
    if (kind === 'miner' ? count(0, 'miner') >= MAXMINERS : count(0) >= MAXARMY) { K.floatText(W / 2, infoY - 30, K.t(kind === 'miner' ? 'fullMiners' : 'full'), '#241B4D', 20); K.sfx('wrong'); return false; }
    if (gold < t.cost) { K.sfx('wrong'); return false; }
    gold -= t.cost; cds[kind] = t.cd; spawn(K, 0, kind); K.sfx(kind === 'giant' ? 'heavy' : kind === 'miner' ? 'place' : 'click'); K.haptic(12);
    if (kind !== 'miner') K.tutorialDone();
    return true;
  }
  function hurt(K, q, dmg, by) {
    q.hp -= dmg; q.hurt = 1;
    if (q.hp <= 0 && !q.dead) {
      q.dead = true; dead.push({ q: q, t: 0 });
      var px = lx(q.x), py = groundY + q.dy * u - u * 0.8;
      K.burst(px, py, ['#FFFFFF', TEAM[q.side].c, '#FFD23F'], q.kind === 'giant' ? 16 : 8, 160, 4);
      if (q.side === 1) { kills++; K.addScore(T[q.kind].val); if (q.kind === 'giant') { K.addCoins(1, px, py); K.sfx('boom'); } else K.sfx('pop'); gold += Math.round(T[q.kind].cost * 0.15); }
      else K.sfx('groan');
    }
  }
  function hitTower(K, side, dmg) {
    if (phase !== 'play') return;
    if (side === 1) {
      foeHp = Math.max(0, foeHp - dmg); scoreAcc += dmg / 4; if (scoreAcc >= 1) { K.addScore(Math.floor(scoreAcc)); scoreAcc -= Math.floor(scoreAcc); }
      if (foeHp <= 0) { phase = 'win'; phaseT = 0; K.addScore(100 * level); K.addCoins(2 + level, tx1, groundY - towerH); K.confetti(70); K.sfx('reward'); K.floatText(W / 2, sceneTop + 40, K.t('win'), '#FFD23F', 38); }
    } else {
      myHp = Math.max(0, myHp - dmg); K.shake(Math.min(8, dmg / 4)); K.haptic(15);
      if (myHp <= 0) { phase = 'lost'; phaseT = 0; K.sfx('wrong'); }
    }
  }
  function newLevel(K, first) {
    units = units ? units.filter(function (q) { return q.side === 0 && q.kind === 'miner'; }) : [];
    units.forEach(function (q) { q.x = 0; q.st = 'go'; q.carry = 0; });
    arrows = []; dead = [];
    foeMax = 400 + level * 200; foeHp = foeMax; foeGold = 50 + level * 35; aiT = 1.5; aiWant = null;
    foeCd = { miner: 0, sword: 0, archer: 0, giant: 0 };
    if (!first) { myHp = Math.min(MYMAX, myHp + 300); K.floatText(W / 2, sceneTop + 40, K.t('level') + ' ' + level, '#FFFFFF', 34); }
    phase = 'play'; phaseT = 0;
  }
  function ai(K) {
    var miners = count(1, 'miner'), want = Math.min(MAXMINERS, 1 + Math.floor(level / 2));
    if (!aiWant) {
      if (miners < want && Math.random() < 0.6) aiWant = 'miner';
      else {
        var r = Math.random() * (5 + 3 + (level >= 3 ? 1 + level * 0.3 : 0));
        aiWant = r < 5 ? 'sword' : r < 8 ? 'archer' : 'giant';
      }
    }
    var t = T[aiWant];
    if (foeGold >= t.cost && foeCd[aiWant] <= 0 && (aiWant === 'miner' || count(1) < MAXARMY)) { foeGold -= t.cost; foeCd[aiWant] = t.cd * 1.2; spawn(K, 1, aiWant); aiWant = null; }
  }
  function stepUnit(K, q, dt) {
    var t = T[q.kind], dir = q.side ? -1 : 1, home = q.side ? 1 : 0, mine = q.side ? 1 - MINE : MINE;
    q.cd = Math.max(0, q.cd - dt); q.atk = Math.max(0, q.atk - dt * 3); q.hurt = Math.max(0, q.hurt - dt * 3);
    if (q.kind === 'miner') {
      var tgt = q.st === 'back' ? home : mine, d = tgt - q.x;
      if (q.st === 'mine') { q.mineT += dt; q.atk = (Math.sin(q.mineT * 9) + 1) / 2; if (q.mineT > 1.2) { q.st = 'back'; q.carry = 15; } return; }
      if (Math.abs(d) < 0.004) {
        if (q.st === 'go') { q.st = 'mine'; q.mineT = 0; }
        else { if (q.side) foeGold += q.carry; else { gold += q.carry; K.floatText(lx(q.x), groundY + q.dy * u - u * 1.4, '+' + q.carry, '#B8860B', 16); K.sfx('coin'); } q.carry = 0; q.st = 'go'; }
        return;
      }
      q.x += Math.sign(d) * Math.min(Math.abs(d), t.spd * dt); q.anim += dt * 10; q.face = Math.sign(d);
      return;
    }
    q.face = dir;
    var rng = t.range * u / laneLen, best = null, bd = 1e9;
    for (var i = 0; i < units.length; i++) {
      var e = units[i]; if (e.side === q.side || e.dead) continue;
      var dd = (e.x - q.x) * dir; if (dd < -0.03) continue;
      if (dd < bd) { bd = dd; best = e; }
    }
    var dT = q.side ? q.x : 1 - q.x, towerIn = dT * laneLen <= t.range * u + towerW * 0.15;
    var inRange = best && bd <= rng;
    if (inRange || towerIn) {
      if (q.cd <= 0) {
        q.cd = t.rate; q.atk = 1;
        var hitTowerNow = !inRange;
        if (q.kind === 'archer') {
          var tx = hitTowerNow ? (q.side ? tx0 : tx1) : lx(best.x), ty = hitTowerNow ? groundY - towerH * 0.5 : groundY + best.dy * u - u * 0.8;
          arrows.push({ x: lx(q.x), y: groundY + q.dy * u - u * 1.05, tx: tx, ty: ty, t: 0, d: Math.max(0.12, Math.abs(tx - lx(q.x)) / (laneLen * 1.4)), target: hitTowerNow ? null : best, tower: hitTowerNow ? 1 - q.side : -1, dmg: q.dmg, side: q.side });
          K.sfx('shot');
        } else {
          if (hitTowerNow) hitTower(K, 1 - q.side, q.dmg); else hurt(K, best, q.dmg, q);
          if (!q.side || Math.random() < 0.5) K.sfx(q.kind === 'giant' ? 'heavy' : 'hit');
        }
      }
      return;
    }
    // walk (or wait at the hold line)
    if (!q.side && mode === 'hold' && q.x >= HOLD && !(best && bd < 0.18)) { q.anim = 0; return; }
    q.x += dir * t.spd * dt; q.anim += dt * 10;
    q.x = K.clamp(q.x, 0, 1);
  }
  function towerShoot(K, side, dt) {
    var key = side ? 'tc1' : 'tc0'; flagT[key] = (flagT[key] || 0) - dt; if (flagT[key] > 0) return;
    var reach = 0.24, best = null, bd = 1e9;
    units.forEach(function (e) { if (e.side === side || e.dead) return; var d = side ? 1 - e.x : e.x; if (d < reach && d < bd) { bd = d; best = e; } });
    if (!best) return;
    flagT[key] = 1.2;
    var sx = side ? tx1 : tx0, sy = groundY - towerH * 0.9;
    arrows.push({ x: sx, y: sy, tx: lx(best.x), ty: groundY + best.dy * u - u * 0.8, t: 0, d: 0.3, target: best, tower: -1, dmg: 10 + (side ? level * 1.5 : 4), side: side });
  }

  function goldCoin(ctx, K, x, y, r) {
    ctx.fillStyle = '#E0A100'; ctx.beginPath(); ctx.arc(x, y + r * 0.12, r, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(x, y, r, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#FFF1A8'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, K.TAU); ctx.fill();
  }
  /* one stick fighter; feet at (x, y), s = pixel scale (unit design is ~40 px tall) */
  function drawStick(ctx, K, x, y, s, side, kind, face, anim, atk, hurtV, carry, alpha, fall) {
    var tm = TEAM[side], dark = tm.d;
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha; ctx.scale(face * s, s);
    if (fall) ctx.rotate(-fall * 1.4);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = dark; ctx.lineWidth = kind === 'giant' ? 5 : 4;
    var sw = Math.sin(anim) * 0.55, hipY = -15, neckY = -29;
    // legs
    ctx.beginPath(); ctx.moveTo(Math.sin(sw) * 12, 0); ctx.lineTo(0, hipY); ctx.lineTo(-Math.sin(sw) * 12, 0); ctx.stroke();
    // body (lean forward when attacking)
    var lean = atk * 3;
    ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(lean, neckY); ctx.stroke();
    // back arm
    ctx.beginPath(); ctx.moveTo(lean, neckY + 2); ctx.lineTo(lean - 7, neckY + 13 + sw * 2); ctx.stroke();
    // front arm + tool
    var a = kind === 'archer' ? 0 : -1.1 + atk * 1.9, hx = lean + Math.cos(a) * 11, hy = neckY + 2 + Math.sin(a) * 11 + 6;
    ctx.beginPath(); ctx.moveTo(lean, neckY + 2); ctx.lineTo(hx, hy); ctx.stroke();
    if (kind === 'sword') {
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(a - 0.4); ctx.strokeStyle = '#C9D3E0'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, 0); ctx.stroke();
      ctx.strokeStyle = '#8A5A2B'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 4); ctx.stroke(); ctx.restore();
    } else if (kind === 'archer') {
      ctx.strokeStyle = '#8A5A2B'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(hx - 2, hy, 10, -1.2, 1.2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx - 2 + Math.cos(-1.2) * 10, hy + Math.sin(-1.2) * 10); ctx.lineTo(hx - 2 - atk * 6, hy); ctx.lineTo(hx - 2 + Math.cos(1.2) * 10, hy + Math.sin(1.2) * 10); ctx.stroke();
    } else if (kind === 'giant') {
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(a - 0.9); ctx.fillStyle = '#8A5A2B'; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(18, -5); ctx.lineTo(18, 5); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6B4420'; ctx.beginPath(); ctx.arc(18, 0, 5, 0, K.TAU); ctx.fill(); ctx.restore();
    } else {
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(a - 1.2 + atk * 0.8); ctx.strokeStyle = '#8A5A2B'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, 0); ctx.stroke();
      ctx.strokeStyle = '#9AA7B8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(12, 6, 7, -1.9, -0.6); ctx.stroke(); ctx.restore();
      if (carry) { ctx.fillStyle = '#C08A3E'; ctx.beginPath(); ctx.arc(-6, neckY + 6, 6, 0, K.TAU); ctx.fill(); ctx.fillStyle = '#FFD23F'; ctx.beginPath(); ctx.arc(-6, neckY + 2, 3.5, 0, K.TAU); ctx.fill(); }
    }
    // head
    var hr = 6.5, hxh = lean + 1, hyh = neckY - hr;
    ctx.fillStyle = hurtV > 0.3 ? '#FFD6D6' : '#FFFFFF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hxh, hyh, hr, 0, K.TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(hxh + 2.5, hyh - 0.5, 1.3, 0, K.TAU); ctx.fill();
    // team gear
    ctx.fillStyle = tm.c;
    if (kind === 'miner') { ctx.beginPath(); ctx.arc(hxh, hyh - 1.5, hr + 0.5, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#FFF1A8'; ctx.beginPath(); ctx.arc(hxh + 3, hyh - 5, 1.8, 0, K.TAU); ctx.fill(); }
    else if (kind === 'giant') { ctx.fillRect(hxh - hr, hyh - 4, hr * 2, 3.5); ctx.beginPath(); ctx.moveTo(hxh - 4, hyh - 6); ctx.lineTo(hxh - 2, hyh - 12); ctx.lineTo(hxh + 1, hyh - 6); ctx.lineTo(hxh + 4, hyh - 12); ctx.lineTo(hxh + 5, hyh - 6); ctx.fill(); }
    else if (kind === 'archer') { ctx.beginPath(); ctx.moveTo(hxh - hr - 1, hyh - 1); ctx.lineTo(hxh + 1, hyh - hr - 7); ctx.lineTo(hxh + hr + 1, hyh - 1); ctx.closePath(); ctx.fill(); }
    else { ctx.fillRect(hxh - hr, hyh - 4, hr * 2, 3); ctx.beginPath(); ctx.moveTo(hxh - hr, hyh - 3); ctx.lineTo(hxh - hr - 7, hyh + 1 + Math.sin(anim) * 2); ctx.lineTo(hxh - hr - 6, hyh - 5); ctx.fill(); }
    ctx.restore();
  }
  function drawTower(ctx, K, x, side, hp, max) {
    var tm = TEAM[side], w = towerW, h = towerH, top = groundY - h, f = hp / max;
    ctx.fillStyle = 'rgba(36,27,77,0.15)'; ctx.beginPath(); ctx.ellipse(x, groundY + u * 0.1, w * 0.7, u * 0.22, 0, 0, K.TAU); ctx.fill();
    ctx.fillStyle = '#A9A3C4'; ctx.fillRect(x - w / 2, top + u * 0.4, w, h - u * 0.4);
    ctx.fillStyle = '#C9C3E0'; ctx.fillRect(x - w / 2, top + u * 0.4, w * 0.55, h - u * 0.4);
    var cw = w / 5; for (var i = 0; i < 5; i += 2) { ctx.fillStyle = '#C9C3E0'; ctx.fillRect(x - w / 2 + i * cw, top, cw, u * 0.45); }
    ctx.fillStyle = 'rgba(36,27,77,0.12)'; for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) ctx.fillRect(x - w / 2 + c * w / 3 + ((r % 2) ? w / 6 : 0) + 2, top + u * 0.6 + r * h * 0.2, w / 3 - 6, 2);
    ctx.fillStyle = '#5E4426'; ctx.beginPath(); ctx.arc(x, groundY - u * 0.55, u * 0.38, Math.PI, 0); ctx.lineTo(x + u * 0.38, groundY); ctx.lineTo(x - u * 0.38, groundY); ctx.fill();
    ctx.fillStyle = '#241B4D'; ctx.fillRect(x - u * 0.12, top + h * 0.35, u * 0.24, u * 0.4);
    // cracks when hurt
    if (f < 0.6) { ctx.strokeStyle = 'rgba(36,27,77,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - w * 0.3, top + h * 0.3); ctx.lineTo(x - w * 0.1, top + h * 0.45); ctx.lineTo(x - w * 0.25, top + h * 0.6); if (f < 0.3) { ctx.moveTo(x + w * 0.35, top + h * 0.55); ctx.lineTo(x + w * 0.1, top + h * 0.7); ctx.lineTo(x + w * 0.2, top + h * 0.85); } ctx.stroke(); }
    // flag
    var px = x, py = top - u * 1.3; ctx.strokeStyle = '#5E4426'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, py); ctx.stroke();
    var dir = side ? -1 : 1, wv = Math.sin(K.time * 6 + side) * u * 0.08;
    ctx.fillStyle = tm.c; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + dir * u * 0.5, py + wv, px + dir * u * 0.95, py + u * 0.2); ctx.lineTo(px + dir * u * 0.95, py + u * 0.25); ctx.quadraticCurveTo(px + dir * u * 0.5, py + u * 0.55 + wv, px, py + u * 0.6); ctx.closePath(); ctx.fill();
    // hp bar
    var bw = Math.max(w * 1.3, 70), bx = K.clamp(x - bw / 2, 6, W - 6 - bw), by = py - 30;
    ctx.fillStyle = 'rgba(36,27,77,0.2)'; K.roundRect(ctx, bx, by, bw, 12, 6); ctx.fill();
    ctx.fillStyle = f > 0.3 ? tm.c : (Math.floor(K.time * 5) % 2 ? '#FF5E5B' : '#FF9F1C'); if (f > 0) { K.roundRect(ctx, bx, by, bw * f, 12, 6); ctx.fill(); }
    ctx.font = K.font(13); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillStyle = '#241B4D'; ctx.fillText(Math.ceil(hp), bx + bw / 2, by - 2);
  }
  function drawMine(ctx, K, f) {
    var x = lx(f), y = groundY + u * (front * 0.85 + 0.25);
    ctx.fillStyle = '#8C7B6B'; ctx.beginPath(); ctx.ellipse(x, y, u * 0.7, u * 0.38, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#A8968A'; ctx.beginPath(); ctx.ellipse(x - u * 0.2, y, u * 0.4, u * 0.3, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#FFD23F'; [[-0.3, -0.12], [0.15, -0.22], [0.35, -0.08], [-0.05, -0.05]].forEach(function (p) { ctx.beginPath(); ctx.arc(x + p[0] * u, y + p[1] * u, u * 0.07, 0, K.TAU); ctx.fill(); });
  }

  BubziKit.run({
    id: 'tiny-siege', coinRate: 0.02,
    title: { en: 'Tiny Siege', fr: 'Petit Siège', ar: 'الحصار الصغير' },
    strings: {
      en: { tagline: 'Send miners for gold, build a stick army and knock down the enemy tower!', miner: 'Miner', sword: 'Sword', archer: 'Archer', giant: 'Giant', attack: 'Attack!', hold: 'Defend', win: 'Tower down!', full: 'Your army is full', fullMiners: 'Max 5 miners', gold: 'Gold' },
      fr: { tagline: 'Envoie des mineurs chercher de l’or, forme une armée de bâtons et abats la tour ennemie !', miner: 'Mineur', sword: 'Épée', archer: 'Archer', giant: 'Géant', attack: 'Attaque !', hold: 'Défense', win: 'Tour abattue !', full: 'Ton armée est pleine', fullMiners: '5 mineurs max', gold: 'Or' },
      ar: { tagline: 'أرسل المنقّبين لجمع الذهب، كوّن جيشاً من العصي واهدم برج العدو!', miner: 'منقّب', sword: 'سيّاف', archer: 'رامٍ', giant: 'عملاق', attack: 'هجوم!', hold: 'دفاع', win: 'سقط البرج!', full: 'جيشك ممتلئ', fullMiners: '5 منقّبين كحد أقصى', gold: 'ذهب' }
    },
    resize: layout,
    reset: function (K) {
      if (K.test) K.dbg = function () {
        var c = function (s, k) { return count(s, k); };
        return { level: level, phase: phase, gold: gold, foeGold: foeGold, myHp: myHp, foeHp: foeHp, foeMax: foeMax, mode: mode, kills: kills,
          mine: { miner: c(0, 'miner'), army: c(0) }, foe: { miner: c(1, 'miner'), army: c(1) }, cds: cds,
          btn: btns.map(function (b) { return { k: b.k, x: b.x + b.w / 2, y: b.y + b.h / 2, cost: T[b.k].cost }; }), modeBtn: { x: modeB.x + modeB.w / 2, y: modeB.y + modeB.h / 2 } };
      };
      level = 1; gold = 150; myHp = MYMAX; mode = 'attack'; kills = 0; tutT = 0; scoreAcc = 0; flagT = {};
      cds = { miner: 0, sword: 0, archer: 0, giant: 0 }; units = null;
      layout(K); newLevel(K, true);
      spawn(K, 0, 'miner'); spawn(K, 1, 'miner');
    },
    revive: function (K) { myHp = Math.round(MYMAX * 0.6); units = units.filter(function (q) { return q.side === 0 || q.x > 0.55; }); phase = 'play'; phaseT = 0; },
    pointerDown: function (x, y, K) {
      kb = false;
      if (inB(modeB, x, y)) { mode = mode === 'attack' ? 'hold' : 'attack'; K.sfx('flip'); return; }
      for (var i = 0; i < btns.length; i++) if (inB(btns[i], x, y)) { buy(K, btns[i].k); return; }
    },
    key: function (code, down, K, rep) {
      if (!down || rep) return; kb = true;
      var m = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[code];
      if (m !== undefined) buy(K, KINDS[m]);
      else if (code === 'Space' || code === 'KeyH' || code === 'Enter') { mode = mode === 'attack' ? 'hold' : 'attack'; K.sfx('flip'); }
    },
    update: function (dt, K) {
      if (K.test && K.fastX) dt *= K.fastX;
      tutT += dt; phaseT += dt;
      KINDS.forEach(function (k) { cds[k] = Math.max(0, cds[k] - dt); foeCd[k] = Math.max(0, foeCd[k] - dt); });
      dead.forEach(function (d) { d.t += dt; }); dead = dead.filter(function (d) { return d.t < 0.8; });
      if (phase === 'play') {
        gold += dt * 4; foeGold += dt * (2.4 + level * 1.3);
        aiT -= dt; if (aiT <= 0) { aiT = 0.6; ai(K); }
        for (var i = 0; i < units.length; i++) if (!units[i].dead) stepUnit(K, units[i], dt);
        units = units.filter(function (q) { return !q.dead; });
        towerShoot(K, 0, dt); towerShoot(K, 1, dt);
      }
      arrows = arrows.filter(function (a) {
        a.t += dt; if (a.t < a.d) return true;
        if (a.target && !a.target.dead) hurt(K, a.target, a.dmg); else if (a.tower >= 0) hitTower(K, a.tower, a.dmg);
        return false;
      });
      if (phase === 'win' && phaseT > 2) { level++; newLevel(K, false); }
      if (phase === 'lost' && phaseT > 1.2) { K.gameOver({}); return; }
      K.info(K.t('level') + ' ' + level);
    },
    draw: function (ctx, K, state) {
      var x, g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9FDCFF'); g.addColorStop(0.55, '#E4F6FF'); g.addColorStop(1, '#FFF1D0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (var c = 0; c < 3; c++) { var cx = ((c * 0.37 + K.time * 0.008 * (1 + c * 0.4)) % 1.2 - 0.1) * W, cy = sceneTop + 20 + c * 26; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, K.TAU); ctx.arc(cx + 18, cy - 6, 20, 0, K.TAU); ctx.arc(cx + 38, cy, 15, 0, K.TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,230,120,0.9)'; ctx.beginPath(); ctx.arc(W * 0.5, sceneTop + (groundY - sceneTop) * 0.3, u * 0.9, 0, K.TAU); ctx.fill();
      ctx.fillStyle = '#E0F2E4'; ctx.beginPath(); ctx.moveTo(0, groundY); for (x = 0; x <= W + 20; x += 20) ctx.lineTo(x, groundY - (groundY - sceneTop) * 0.42 - Math.sin(x * 0.006 + 1) * u * 1.2); ctx.lineTo(W + 20, groundY); ctx.fill();
      ctx.fillStyle = '#CDEFD0'; ctx.beginPath(); ctx.moveTo(0, groundY); for (x = 0; x <= W + 20; x += 20) ctx.lineTo(x, groundY - u * 2.2 - Math.sin(x * 0.01) * u * 0.7); ctx.lineTo(W + 20, groundY); ctx.fill();
      // ground
      ctx.fillStyle = '#7ED957'; ctx.fillRect(0, groundY - u * 0.55, W, H);
      var bandB = groundY + u * (front + 0.5);
      ctx.fillStyle = '#E3C48F'; ctx.fillRect(0, groundY - u * 0.4, W, bandB - groundY + u * 0.4);
      ctx.fillStyle = 'rgba(160,120,60,0.18)'; for (var r2 = 0; r2 < 3; r2++) for (x = (r2 * 17) % 34; x < W; x += 34) ctx.fillRect(x, groundY + u * (0.1 + r2 * front * 0.4), 14, 3);
      ctx.fillStyle = '#5BBF3A'; ctx.fillRect(0, bandB, W, H);
      ctx.fillStyle = '#F4EEFF'; ctx.fillRect(0, infoY - 22, W, H);
      ctx.fillStyle = 'rgba(36,27,77,0.08)'; ctx.fillRect(0, infoY - 22, W, 3);
      // hold line
      if (mode === 'hold') { ctx.strokeStyle = 'rgba(123,77,255,0.45)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx(HOLD) + u * 0.5, groundY - u * 0.4); ctx.lineTo(lx(HOLD) + u * 0.5, groundY + u * (front + 0.4)); ctx.stroke(); ctx.setLineDash([]); }
      drawMine(ctx, K, MINE); drawMine(ctx, K, 1 - MINE);
      drawTower(ctx, K, tx0, 0, myHp, MYMAX); drawTower(ctx, K, tx1, 1, foeHp, foeMax);
      // units back to front
      var list = units.map(function (q) { return { q: q, a: 1, f: 0 }; }).concat(dead.map(function (d) { return { q: d.q, a: 1 - d.t / 0.8, f: Math.min(1, d.t * 3) }; }));
      list.sort(function (a, b) { return a.q.dy - b.q.dy; });
      list.forEach(function (it) {
        var q = it.q, s = u / 40 * T[q.kind].size, px = lx(q.x), py = groundY + q.dy * u;
        ctx.fillStyle = 'rgba(36,27,77,0.15)'; ctx.beginPath(); ctx.ellipse(px, py, 9 * s, 3 * s, 0, 0, K.TAU); ctx.fill();
        drawStick(ctx, K, px, py, s, q.side, q.kind, q.face || (q.side ? -1 : 1), q.anim, q.atk, q.hurt, q.carry, it.a, it.f);
        if (!it.f && q.hp < q.max) { var bw = 22 * s; ctx.fillStyle = 'rgba(36,27,77,0.25)'; ctx.fillRect(px - bw / 2, py - 46 * s, bw, 4); ctx.fillStyle = TEAM[q.side].c; ctx.fillRect(px - bw / 2, py - 46 * s, bw * Math.max(0, q.hp / q.max), 4); }
      });
      arrows.forEach(function (a) {
        var k = Math.min(1, a.t / a.d), x = a.x + (a.tx - a.x) * k, y = a.y + (a.ty - a.y) * k - Math.sin(k * Math.PI) * u * 0.6, ang = Math.atan2(a.ty - a.y - Math.cos(k * Math.PI) * u * 0.6 * Math.PI, a.tx - a.x);
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.strokeStyle = '#6B4420'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(6, 0); ctx.stroke();
        ctx.fillStyle = '#C9D3E0'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(4, -3); ctx.lineTo(4, 3); ctx.fill(); ctx.restore();
      });
      // gold + mode toggle
      ctx.font = K.font(22); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; goldCoin(ctx, K, btns[0].x + 12, infoY, 11); ctx.fillStyle = '#241B4D'; ctx.fillText(K.fmt(Math.floor(gold)), btns[0].x + 30, infoY + 1);
      var mb = modeB, att = mode === 'attack';
      ctx.fillStyle = att ? '#C2362F' : '#3F2A9E'; K.roundRect(ctx, mb.x, mb.y + 3, mb.w, mb.h, mb.h / 2); ctx.fill();
      ctx.fillStyle = att ? '#FF6B5E' : '#7B4DFF'; K.roundRect(ctx, mb.x, mb.y, mb.w, mb.h, mb.h / 2); ctx.fill();
      ctx.font = K.font(15); ctx.textAlign = 'center'; ctx.fillStyle = '#FFFFFF'; ctx.fillText((att ? '» ' : '« ') + K.t(att ? 'attack' : 'hold') + (kb ? '  [H]' : ''), mb.x + mb.w / 2, mb.y + mb.h / 2 + 1);
      // unit buttons
      btns.forEach(function (b, i) {
        var t = T[b.k], can = gold >= t.cost && cds[b.k] <= 0 && phase === 'play' && (b.k === 'miner' ? count(0, 'miner') < MAXMINERS : count(0) < MAXARMY);
        ctx.fillStyle = can ? '#C9B8FF' : '#D7D2EA'; K.roundRect(ctx, b.x, b.y + 4, b.w, b.h, 16); ctx.fill();
        ctx.fillStyle = can ? '#FFFFFF' : '#ECE9F6'; K.roundRect(ctx, b.x, b.y, b.w, b.h, 16); ctx.fill();
        var s = b.h * 0.4 / 44 * (b.k === 'giant' ? 0.9 : 1);
        ctx.save(); if (!can) ctx.globalAlpha = 0.5; drawStick(ctx, K, b.x + b.w / 2, b.y + b.h * 0.7, s, 0, b.k, 1, 0, 0, 0, b.k === 'miner' ? 1 : 0, 1, 0); ctx.restore();
        ctx.font = K.font(Math.round(b.h * 0.18)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = can ? '#241B4D' : '#8A84A8';
        ctx.fillText(K.t(b.k), b.x + b.w / 2, b.y + b.h * 0.14 + 2);
        var cy = b.y + b.h * 0.86; goldCoin(ctx, K, b.x + b.w / 2 - 16, cy, 7); ctx.textAlign = 'left'; ctx.fillStyle = can ? '#241B4D' : '#8A84A8'; ctx.fillText(t.cost, b.x + b.w / 2 - 6, cy + 1);
        if (cds[b.k] > 0) { var f = cds[b.k] / t.cd; ctx.fillStyle = 'rgba(36,27,77,0.25)'; K.roundRect(ctx, b.x, b.y + b.h * (1 - f), b.w, b.h * f, 16); ctx.fill(); }
        if (b.k === 'miner') { ctx.font = K.font(12); ctx.fillStyle = '#5E5689'; ctx.textAlign = 'right'; ctx.fillText(count(0, 'miner') + '/' + MAXMINERS, b.x + b.w - 8, b.y + b.h * 0.42); }
        if (kb) { ctx.font = K.font(12); ctx.fillStyle = '#8A84A8'; ctx.textAlign = 'left'; ctx.fillText(i + 1, b.x + 8, b.y + b.h * 0.42); }
      });
      // tutorial: tap the sword button
      if (K.tutorial && state === 'playing') {
        var bb = btns[1], k = (tutT * 0.9) % 1;
        K.drawHand(ctx, bb.x + bb.w / 2, bb.y + bb.h * 0.55 + (k < 0.5 ? k : 1 - k) * 14, k > 0.4 && k < 0.6, Math.min(W, H) / 220);
      }
    }
  });
})();
