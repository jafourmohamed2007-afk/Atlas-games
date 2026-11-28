/* ===== ASHEN VIGIL: endless night, new enemies & bosses, poison hazards, dash, wandering merchant ===== */
const BOSS_NAMES = { golem: 'THE BONE GOLEM', matriarch: 'THE BLOOD MATRIARCH', toadking: 'THE PLAGUE TOAD KING', lich: 'THE LICH', reaper: 'THE PALE REAPER' };
const BOSS_CYCLE = ['golem', 'matriarch', 'toadking', 'lich', 'reaper'];
const hazards = new Pool(() => ({}), 30, 80);

// ---------- bosses & scripted events ----------
function bossMul() { return 1 + 0.6 * (G.night - 1) + 0.12 * G.bossIdx; }
function findBoss() { let b = null; for (const e of enemies.list) if (!e.dead && e.def.boss) b = e; return b; }
function spawnBoss(type) {
  const [x, y] = ringPos(10), e = spawnEnemy(type, x, y); if (!e) return null;
  banner(BOSS_NAMES[type] + (type === 'reaper' ? '' : ' AWAKENS'));
  if (type === 'reaper') VO.say('reaper', true); else VO.say(G.bossSeen ? 'boss' : 'evil', true);
  G.bossSeen = true; AU.boom(); G.shake = 5; G.flash = 0.35; G.flashCol = type === 'reaper' ? C.pale : C.blood;
  return e;
}
function spiderNest() {
  const a = rand(TAU);
  for (let i = 0; i < 45; i++) { const b = a + rand(-0.6, 0.6), r = viewR() + rand(0, 60); spawnEnemy('spider', P.x + Math.cos(b) * r, P.y + Math.sin(b) * r, { elite: i === 0 }); }
  banner('THE BROOD SKITTERS CLOSER'); VO.say('swarm');
}
function shadeAmbush() {
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; spawnEnemy('shade', P.x + Math.cos(a) * 90, P.y + Math.sin(a) * 90, { elite: i === 0 }); }
  burst(P.x, P.y, 30, [C.violet, C.dusk], 120, 0.6); banner('SHADES IN THE DARK');
}
function necroCoven() { for (let i = 0; i < 4; i++) { const [x, y] = ringPos(); spawnEnemy('necro', x, y, { elite: true }); } banner('A COVEN OF NECROMANCERS'); }
function endlessDirector() {
  if (!G.endless) return;
  if (G.time >= G.nextEvt) { G.nextEvt = G.time + rand(50, 70); pick([() => batSwarm(Math.random() < 0.5), wraithRing, elitePack, spiderNest, shadeAmbush, necroCoven])(); }
  if (G.time >= G.nextBoss) { G.nextBoss = G.time + 120; spawnBoss(BOSS_CYCLE[G.bossIdx % BOSS_CYCLE.length]); G.bossIdx++; }
}
function enterEndless() {
  G.endless = true; G.night = 2; G.nextEvt = G.time + 30; G.nextBoss = G.time + 75; G.bossIdx = 0; G.state = 'play';
  VO.say('endless', true); banner('NIGHT 2: THE ENDLESS NIGHT'); MUS.mode = 'run'; G.flash = 0.5; G.flashCol = C.purple;
}

// ---------- enemy & boss behaviours (each sets e.vx / e.vy) ----------
function dashStep(e, dt, sp, col) { // shared telegraphed charge: returns true while busy
  if (e.dash > 0) { e.dash -= dt; if (e.dash <= 0) { e.vx = 0; e.vy = 0; } burst(e.x, e.y - 8, 2, col, 20, 0.4); return true; }
  if (e.tele > 0) { e.tele -= dt; e.vx = 0; e.vy = 0; if (e.tele <= 0) { e.vx = e.dax * sp; e.vy = e.day * sp; e.dash = 0.5; AU.slash(); } return true; }
  return false;
}
function startDash(e, dx, dy, len) { e.tele = 0.6; e.dax = dx; e.day = dy; addFx('line', { x: e.x, y: e.y, a: Math.atan2(dy, dx), r: len || 130, life: 0.6, col: C.red }); }
function keepRange(e, dx, dy, dist, near, far, sp) {
  if (dist < near) { e.vx = -dx * sp; e.vy = -dy * sp; } else if (dist > far) { e.vx = dx * sp; e.vy = dy * sp; } else { e.vx = -dy * sp * 0.6; e.vy = dx * sp * 0.6; }
}
function aiSpecial(e, dt, dx, dy, dist, sp) {
  switch (e.type) {
    case 'spider': { const w = Math.sin(e.anim * 1.6 + e.phase) * 0.9; e.vx = (dx - dy * w) * sp; e.vy = (dy + dx * w) * sp; break; }
    case 'imp':
      keepRange(e, dx, dy, dist, 65, 110, sp); e.t -= dt;
      if (e.t <= 0 && dist < 180) { e.t = rand(2.3, 3.2); fireEnemy('fire', e.x, e.y - 6, dx * 100, dy * 100, e.dmg); }
      break;
    case 'necro':
      keepRange(e, dx, dy, dist, 100, 150, sp); e.t -= dt;
      if (e.t <= 0 && dist < 220 && enemies.list.length < MAX_EN - 20) {
        e.t = rand(4.5, 6); const kind = minutes() > 10 ? 'revenant' : 'husk';
        for (let i = 0; i < 3; i++) { const a = rand(TAU); spawnEnemy(kind, e.x + Math.cos(a) * 14, e.y + Math.sin(a) * 14); }
        burst(e.x, e.y - 8, 16, [C.purple, C.violet, C.spirit], 50, 0.6);
      }
      break;
    case 'shade':
      if (e.tele > 0) { e.tele -= dt; e.vx = e.vy = 0; if (e.tele <= 0) { const a = Math.atan2(P.face.y, P.face.x) + Math.PI + rand(-0.8, 0.8); burst(e.x, e.y - 6, 10, [C.violet, C.dusk], 40, 0.4); e.x = P.x + Math.cos(a) * 34; e.y = P.y + Math.sin(a) * 34; burst(e.x, e.y - 6, 10, [C.violet, C.dusk], 40, 0.4); } break; }
      e.vx = dx * sp; e.vy = dy * sp; e.t -= dt;
      if (e.t <= 0 && dist < 170 && dist > 50) { e.t = rand(3.5, 5); e.tele = 0.45; }
      break;
    case 'matriarch': {
      if (dashStep(e, dt, 240, [C.red, C.blood])) break;
      e.phase += dt * 0.8; const tx = P.x + Math.cos(e.phase) * 80, ty = P.y + Math.sin(e.phase) * 60, l = Math.hypot(tx - e.x, ty - e.y) || 1;
      e.vx = (tx - e.x) / l * e.spd * 1.5; e.vy = (ty - e.y) / l * e.spd * 1.5;
      e.t -= dt;
      if (e.t <= 0) {
        e.t = e.hp < e.maxHp / 2 ? 2.1 : 2.9; const r = Math.random();
        if (r < 0.33) { for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; spawnEnemy('bat', e.x + Math.cos(a) * 16, e.y + Math.sin(a) * 16); } banner('THE MATRIARCH CALLS HER BROOD'); }
        else if (r < 0.66) { for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; fireEnemy('shriek', e.x, e.y - 10, Math.cos(a) * 75, Math.sin(a) * 75, e.dmg * 0.5); } AU.zap(); }
        else startDash(e, dx, dy, 150);
      }
      break;
    }
    case 'toadking': {
      if (e.leap > 0) {
        e.leap -= dt; const k = 1 - e.leap / e.leapT; e.x = lerp(e.lx, e.ltx, k); e.y = lerp(e.ly, e.lty, k); e.z = Math.sin(k * Math.PI) * 50; e.vx = e.vy = 0;
        if (e.leap <= 0) {
          e.z = 0; const R = 46; addFx('ring', { x: e.x, y: e.y, r: R, life: 0.4, col: C.lime }); G.shake = 6; AU.boom(); burst(e.x, e.y, 36, [C.lime, C.grass, C.umber], 100, 0.6);
          if ((P.x - e.x) ** 2 + (P.y - e.y) ** 2 < R * R) damagePlayer(e.dmg * 1.3, 'toadking');
          addHazard(e.x, e.y, 26, 4, e.dmg * 0.25);
        }
        break;
      }
      e.hop = (e.hop || 0) - dt; if (e.hop <= -0.5) e.hop = 0.45;
      const go = e.hop > 0 ? 2.4 : 0; e.vx = dx * sp * go; e.vy = dy * sp * go;
      e.t -= dt;
      if (e.t <= 0) {
        e.t = e.hp < e.maxHp / 2 ? 2.6 : 3.4; const r = Math.random();
        if (r < 0.4) { e.leapT = e.leap = 1.0; e.lx = e.x; e.ly = e.y; e.ltx = P.x; e.lty = P.y; addFx('tele', { x: P.x, y: P.y, r: 46, life: 1.0, col: C.lime }); }
        else if (r < 0.75) { for (let i = 0; i < 5; i++) fireGlob(e.x, e.y - 10, P.x + rand(-50, 50), P.y + rand(-40, 40), e.dmg * 0.25); AU.twang(); }
        else { for (let i = 0; i < 5; i++) { const a = rand(TAU); spawnEnemy('toad', e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20); } banner('THE KING SPAWNS HIS PLAGUE'); }
      }
      break;
    }
    case 'lich': {
      keepRange(e, dx, dy, dist, 90, 140, sp);
      if (e.spiral > 0) { e.spiral -= dt; e.sp2 = (e.sp2 || 0) - dt; e.vx *= 0.2; e.vy *= 0.2; if (e.sp2 <= 0) { e.sp2 = 0.07; e.rot2 = (e.rot2 || 0) + 0.5; for (let k = 0; k < 3; k++) { const a = e.rot2 + k * TAU / 3; fireEnemy('hex', e.x, e.y - 12, Math.cos(a) * 70, Math.sin(a) * 70, e.dmg * 0.45); } } break; }
      e.t -= dt;
      if (e.t <= 0) {
        e.t = e.hp < e.maxHp / 2 ? 2.4 : 3.2;
        burst(e.x, e.y - 10, 20, [C.cyan, C.white, C.violet], 60, 0.5); const a = rand(TAU); e.x = P.x + Math.cos(a) * 115; e.y = P.y + Math.sin(a) * 90; burst(e.x, e.y - 10, 20, [C.cyan, C.white, C.violet], 60, 0.5);
        const r = Math.random();
        if (r < 0.4) e.spiral = 2.2;
        else if (r < 0.7) { for (let i = 0; i < 8; i++) { const b = (i / 8) * TAU; spawnEnemy(i % 2 ? 'revenant' : 'husk', P.x + Math.cos(b) * 75, P.y + Math.sin(b) * 75); } banner('THE LICH RAISES THE FALLEN'); }
        else { for (let i = 0; i < 28; i++) { const b = (i / 28) * TAU; fireEnemy('hex', e.x, e.y - 12, Math.cos(b) * 55, Math.sin(b) * 55, e.dmg * 0.45); } AU.zap(); }
      }
      break;
    }
    default: return false;
  }
  return true;
}

// ---------- toxic globs & poison hazards (hurt the player) ----------
function fireGlob(x, y, tx, ty, dmg) {
  const b = ebul.get(); if (!b) return;
  Object.assign(b, { kind: 'glob', x, y, sx: x, sy: y, tx, ty, t: 0, T: 0.9, dmg, life: 2, r: 3, rot: 0, vx: 0, vy: 0 });
}
function globStep(b, dt) { // returns true when it landed
  b.t += dt; const k = Math.min(1, b.t / b.T); b.x = lerp(b.sx, b.tx, k); b.y = lerp(b.sy, b.ty, k) - Math.sin(k * Math.PI) * 50;
  if (k < 1) return false;
  addHazard(b.tx, b.ty, 18, 4.5, b.dmg); burst(b.tx, b.ty, 10, [C.lime, C.grass], 50, 0.5); return true;
}
function addHazard(x, y, r, life, dmg) { const h = hazards.get(); if (h) Object.assign(h, { x, y, r, life, max: life, dmg }); }
function updateHazards(dt) {
  const L = hazards.list;
  for (let i = L.length - 1; i >= 0; i--) {
    const h = L[i]; h.life -= dt; if (h.life <= 0) { hazards.kill(i); continue; }
    if ((P.x - h.x) ** 2 + ((P.y - h.y) / 0.7) ** 2 < h.r * h.r) damagePlayer(h.dmg, 'poison');
    if (Math.random() < 0.25) burst(h.x + rand(-h.r, h.r) * 0.7, h.y + rand(-h.r, h.r) * 0.5, 1, [C.lime, C.grass], 8, 0.6, -20);
  }
}

// ---------- dash ----------
function tryDash() {
  if (G.state !== 'play' || P.dashCd > 0) return;
  const l = Math.hypot(IN.x, IN.y), dx = l > 0.1 ? IN.x / l : P.face.x, dy = l > 0.1 ? IN.y / l : P.face.y;
  P.dashT = 0.17; P.dashX = dx; P.dashY = dy; P.dashCd = 2.4; P.inv = Math.max(P.inv, 0.3); AU.dash();
  burst(P.x, P.y - 6, 10, [C.white, C.pale, C.cyan], 50, 0.35);
}
function dashUpdate(dt) {
  if (P.dashCd > 0) P.dashCd -= dt;
  if (P.dashT > 0) {
    P.dashT -= dt; P.x += P.dashX * 290 * dt; P.y += P.dashY * 290 * dt;
    const q = parts.get(); if (q) Object.assign(q, { x: P.x + rand(-3, 3), y: P.y - rand(2, 12), vx: -P.dashX * 20, vy: -P.dashY * 20, life: 0.3, max: 0.3, col: HEROES[G.hero].col, g: 0, sz: 2 });
  }
}

// ---------- wandering merchant & in-run shop ----------
const SHOP_ITEMS = [
  { id: 'heal', name: 'HEALING DRAUGHT', icon: 'potion', desc: 'RESTORE HALF OF YOUR HEALTH.', cost: 25 },
  { id: 'crystal', name: 'LIFE CRYSTAL', icon: 'crystal', desc: '+15 MAX HEALTH FOR THIS RUN.', cost: 50, grow: 1.5 },
  { id: 'iron', name: 'IRON SKIN', icon: 'armor', desc: '+1 ARMOR FOR THIS RUN.', cost: 60, grow: 1.6 },
  { id: 'fury', name: 'ELIXIR OF FURY', icon: 'fury', desc: '+50% DAMAGE FOR 60 SECONDS.', cost: 45 },
  { id: 'haste', name: 'HASTE TONIC', icon: 'tonic', desc: '+30% MOVE SPEED FOR 60 SECONDS.', cost: 35 },
  { id: 'ward', name: 'WARD CHARM', icon: 'ward', desc: 'A SHIELD THAT BLOCKS THE NEXT 3 HITS.', cost: 40 },
  { id: 'vacuum', name: 'VACUUM ORB', icon: 'vacuum', desc: 'PULL EVERY SOUL GEM TO YOU.', cost: 30 },
  { id: 'rosary', name: 'HOLY ROSARY', icon: 'rosary', desc: 'SMITE EVERY ENEMY ON SCREEN.', cost: 70 },
  { id: 'tome', name: 'TOME OF INSIGHT', icon: 'tome', desc: 'GAIN A LEVEL RIGHT NOW.', cost: 60, grow: 1.4 },
  { id: 'token', name: 'REROLL TOKENS', icon: 'token', desc: '+2 REROLLS FOR LEVEL-UPS.', cost: 30, grow: 1.3 },
  { id: 'mystery', name: 'MYSTERY CHEST', icon: 'mystery', desc: 'A TREASURE CHEST. IT CAN EVOLVE A WEAPON!', cost: 150, grow: 1.5 }
];
const SHOP_BY = {}; SHOP_ITEMS.forEach((s) => (SHOP_BY[s.id] = s));
function itemPrice(s) { return Math.round(s.cost * (1 + minutes() * 0.06) * Math.pow(s.grow || 1.25, G.bought[s.id] || 0)); }
function merchantTick(dt) {
  const m = G.merchant;
  if (!m) {
    G.merchantT -= dt;
    if (G.merchantT <= 0) {
      const a = rand(TAU), r = rand(95, 135), ids = SHOP_ITEMS.slice(1).map((s) => s.id).sort(() => Math.random() - 0.5).slice(0, 5);
      G.merchant = { x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, t: 50, anim: 0, ready: true, stock: ['heal'].concat(ids).map((id) => ({ id, sold: false })) };
      VO.say('merchant'); banner('A MERCHANT HAS COME. FIND THE CART!');
    }
    return;
  }
  m.t -= dt; m.anim += dt;
  const d2 = (P.x - m.x) ** 2 + (P.y - m.y) ** 2;
  if (d2 > 30 * 30) m.ready = true;
  if (m.ready && d2 < 15 * 15) { G.state = 'shop'; m.ready = false; AU.buy(); }
  if (m.t <= 0) { burst(m.x, m.y - 8, 30, [C.gold, C.fog, C.white], 60, 0.8); G.merchant = null; G.merchantT = rand(95, 125); banner('THE MERCHANT VANISHES'); }
}
function buyItem(slot) {
  const s = SHOP_BY[slot.id], price = itemPrice(s);
  if (slot.sold || G.gold < price) { AU.deny(); return; }
  G.gold -= price; slot.sold = true; G.bought[s.id] = (G.bought[s.id] || 0) + 1; AU.buy();
  switch (s.id) {
    case 'heal': P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.5); break;
    case 'crystal': G.bonusHp += 15; recalc(); P.hp = Math.min(P.maxHp, P.hp + 15); break;
    case 'iron': G.bonusArmor++; recalc(); break;
    case 'fury': G.buffs.fury = 60; break;
    case 'haste': G.buffs.haste = 60; break;
    case 'ward': P.ward = 3; break;
    case 'vacuum': for (const g of gems.list) { g.pull = true; g.sp = 60; } break;
    case 'rosary': G.pendSmite = true; break;
    case 'tome': addXP(Math.max(1, G.xpNext - G.xp)); break;
    case 'token': G.rerolls += 2; break;
    case 'mystery': G.pendChest = true; break;
  }
}
function closeShop() {
  G.state = 'play'; AU.click();
  if (G.pendSmite) { G.pendSmite = false; smite(); }
  if (G.pendChest) { G.pendChest = false; openChest(); }
}
