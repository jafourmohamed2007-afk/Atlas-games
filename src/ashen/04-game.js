/* ===== ASHEN VIGIL: game state, heroes, weapons, passives, enemies, director, simulation ===== */
const STEP = 1 / 60, MAX_EN = 700, RUN_END = 900;
const QB = [], QB2 = [], QB3 = [];
const URLQ = new URLSearchParams(location.search);

// ---------- persistence ----------
const SAVE_KEY = 'ashenvigil:save';
const SAVE = (() => {
  const d = { gold: 0, up: {}, best: 0, kills: 0, runs: 0, wins: 0, vol: null, hero: 0 };
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && typeof s === 'object') Object.assign(d, s); } catch (e) { }
  d.up = d.up || {}; return d;
})();
function saveNow() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { } }
if (SAVE.vol) Object.assign(AU.vol, SAVE.vol);
const upL = (id) => SAVE.up[id] | 0;

// ---------- data ----------
const HEROES = [
  { id: 'knight', name: 'EMBER KNIGHT', weapon: 'blade', passive: '+10% ARMOR', hp: 120, col: C.ember },
  { id: 'witch', name: 'HEX WITCH', weapon: 'bolt', passive: '-15% COOLDOWN', hp: 90, col: C.violet },
  { id: 'ranger', name: 'GRAVE RANGER', weapon: 'volley', passive: '+10% MOVE SPEED', hp: 100, col: C.lime }
];
const SHOP = [
  { id: 'might', name: 'MIGHT', desc: '+5% DAMAGE', max: 5, cost: 150, icon: 'might' },
  { id: 'armor', name: 'ARMOR', desc: '-1 DAMAGE TAKEN', max: 3, cost: 200, icon: 'armor' },
  { id: 'maxhp', name: 'MAX HP', desc: '+10% MAX HEALTH', max: 3, cost: 180, icon: 'heart' },
  { id: 'speed', name: 'SPEED', desc: '+5% MOVE SPEED', max: 2, cost: 220, icon: 'boots' },
  { id: 'magnet', name: 'MAGNET', desc: '+20% PICKUP RANGE', max: 2, cost: 160, icon: 'magnet' },
  { id: 'revive', name: 'REVIVAL', desc: 'RISE AGAIN ONCE PER RUN', max: 1, cost: 1200, icon: 'revive' },
  { id: 'greed', name: 'GREED', desc: '+10% GOLD FOUND', max: 5, cost: 120, icon: 'greed' }
];
const shopCost = (s) => s.cost * (upL(s.id) + 1);

// weapon stats per level (1..8) + evolved form
const WD = {
  blade: { name: 'CINDER BLADE', icon: 'blade', pair: 'heart', evo: 'INFERNO REAVER', col: C.ember,
    desc: 'SWEEPING ARC SLASH IN YOUR FACING DIRECTION.', evoDesc: 'A ROARING RING OF FLAME THAT SETS EVERY FOE AROUND YOU ABLAZE.',
    st: (l) => ({ dmg: 12 + 5 * (l - 1), range: 30 + 3 * l, cd: 1.3 - 0.05 * l, arc: 1.9 + 0.1 * l, back: l >= 4 ? 1 : 0 }),
    ev: { dmg: 55, range: 68, cd: 0.95, arc: TAU, back: 0, burn: 14 }, lab: [['dmg', 'DMG'], ['range', 'RANGE'], ['cd', 'cd'], ['back', 'BACKSLASH', 'flag']] },
  bolt: { name: 'WRAITH BOLT', icon: 'bolt', pair: 'glass', evo: 'SOUL STORM', col: C.violet,
    desc: 'HOMING MAGIC MISSILE AT THE NEAREST ENEMY.', evoDesc: 'A NEVER-ENDING TEMPEST OF HOMING SOULS THAT PIERCE THE DEAD.',
    st: (l) => ({ dmg: 10 + 4 * (l - 1), count: 1 + (l >= 3) + (l >= 5) + (l >= 8), cd: 1.15 - 0.05 * l, pierce: l >= 6 ? 2 : 1 }),
    ev: { dmg: 30, count: 3, cd: 0.32, pierce: 3 }, lab: [['dmg', 'DMG'], ['count', 'MISSILE'], ['cd', 'cd'], ['pierce', 'PIERCE']] },
  volley: { name: 'BONE VOLLEY', icon: 'volley', pair: 'boots', evo: 'MARROW TEMPEST', col: C.bone,
    desc: 'PIERCING ARROWS FIRED IN YOUR MOVE DIRECTION (AIMED WHEN YOU STAND STILL).', evoDesc: 'A SPINNING STORM OF ENDLESS ARROWS IN EVERY DIRECTION.',
    st: (l) => ({ dmg: 10 + 4 * (l - 1), count: 2 + (l >= 4) + (l >= 7), cd: 0.9 - 0.04 * l, pierce: 2 + Math.floor(l / 3), rear: l >= 3 ? 1 : 0 }),
    ev: { dmg: 32, count: 16, cd: 0.55, pierce: 99 }, lab: [['dmg', 'DMG'], ['count', 'ARROW'], ['cd', 'cd'], ['pierce', 'PIERCE'], ['rear', 'REAR SHOT', 'flag']] },
  orbit: { name: 'ORBITING RUNESTONES', icon: 'orbit', pair: 'book', evo: 'CELESTIAL HALO', col: C.violet,
    desc: 'RUNESTONES CIRCLE YOU, SMASHING ANY FOE THEY TOUCH.', evoDesc: 'A WIDE HALO OF GOLDEN STARS SPINNING AT FURIOUS SPEED.',
    st: (l) => ({ dmg: 9 + 4 * (l - 1), count: 1 + Math.ceil(l / 2), radius: 28 + 2 * l, speed: 2.8 + 0.15 * l }),
    ev: { dmg: 40, count: 8, radius: 50, speed: 5 }, lab: [['dmg', 'DMG'], ['count', 'STONE'], ['radius', 'RADIUS'], ['speed', 'SPEED']] },
  font: { name: 'HOLY FONT', icon: 'font', pair: 'blood', evo: 'SANCTUM ETERNAL', col: C.gold,
    desc: 'A HOLY AURA THAT BURNS AND SLOWS NEARBY ENEMIES.', evoDesc: 'A VAST SANCTUM THAT SEARS THE DAMNED AND HEALS YOU.',
    st: (l) => ({ dmg: 4 + 2 * (l - 1), radius: 26 + 3 * l, cd: 0.62 - 0.02 * l }),
    ev: { dmg: 18, radius: 72, cd: 0.4, heal: 1 }, lab: [['dmg', 'DMG'], ['radius', 'RADIUS'], ['cd', 'cd']] },
  thunder: { name: 'THUNDER SIGIL', icon: 'thunder', pair: 'luck', evo: 'WRATH OF HEAVEN', col: C.light,
    desc: 'CALLS LIGHTNING DOWN ON RANDOM ENEMIES.', evoDesc: 'THE SKY SPLITS: A BARRAGE OF HUGE LIGHTNING STRIKES.',
    st: (l) => ({ dmg: 20 + 7 * (l - 1), count: 1 + Math.floor(l / 2), cd: 2.6 - 0.1 * l, aoe: 12 + l }),
    ev: { dmg: 80, count: 10, cd: 1.3, aoe: 30 }, lab: [['dmg', 'DMG'], ['count', 'STRIKE'], ['cd', 'cd'], ['aoe', 'AREA']] },
  flask: { name: 'HELLFIRE FLASK', icon: 'flask', pair: 'magnet', evo: 'BRIMSTONE RAIN', col: C.orange,
    desc: 'THROWN BOTTLES THAT LEAVE BURNING POOLS.', evoDesc: 'HELLFIRE RAINS FROM THE SKY IN WIDE BLAZING POOLS.',
    st: (l) => ({ dmg: 5 + 2 * (l - 1), count: 1 + Math.floor(l / 3), radius: 15 + 2 * l, dur: 2 + 0.2 * l, cd: 3 - 0.12 * l }),
    ev: { dmg: 18, count: 6, radius: 32, dur: 4, cd: 2 }, lab: [['dmg', 'DMG'], ['count', 'FLASK'], ['radius', 'RADIUS'], ['dur', 'DURATION'], ['cd', 'cd']] },
  chain: { name: 'SPECTRAL CHAIN', icon: 'chain', pair: 'glass', evo: 'ETERNITY CHAIN', col: C.cyan,
    desc: 'LIGHTNING THAT BOUNCES BETWEEN ENEMIES.', evoDesc: 'TWIN CHAINS OF GHOST LIGHTNING LEAPING THROUGH WHOLE HORDES.',
    st: (l) => ({ dmg: 9 + 4 * (l - 1), bounce: 2 + Math.floor(l * 0.75), cd: 1.5 - 0.06 * l }),
    ev: { dmg: 34, bounce: 14, cd: 0.7, twin: 1 }, lab: [['dmg', 'DMG'], ['bounce', 'BOUNCE'], ['cd', 'cd']] }
};
const WIDS = Object.keys(WD);
const PD = {
  heart: { name: 'IRON HEART', icon: 'heart', max: 5, desc: '+20% MAX HEALTH' },
  boots: { name: 'SWIFTBOOTS', icon: 'boots', max: 5, desc: '+8% MOVE SPEED' },
  glass: { name: 'HOURGLASS', icon: 'glass', max: 5, desc: '-6% WEAPON COOLDOWN' },
  magnet: { name: 'MAGNET CHARM', icon: 'magnet', max: 5, desc: '+30% PICKUP RADIUS' },
  book: { name: 'GRIMOIRE', icon: 'book', max: 5, desc: '+10% AREA SIZE' },
  luck: { name: 'LUCKY COIN', icon: 'luck', max: 5, desc: '+10% LUCK, +4% CRIT CHANCE' },
  blood: { name: 'BLOODSTONE', icon: 'blood', max: 5, desc: '+0.3 HP REGEN PER SECOND' }
};
const PIDS = Object.keys(PD);
const ED = {
  husk: { hp: 9, spd: 30, dmg: 5, xp: 1, r: 5, h: 15, spr: 'husk', kb: 1, col: C.ash },
  bat: { hp: 5, spd: 48, dmg: 3, xp: 1, r: 4, h: 8, spr: 'bat', kb: 1.4, fly: 1, col: C.purple },
  ghoul: { hp: 42, spd: 23, dmg: 12, xp: 3, r: 7, h: 15, spr: 'ghoul', kb: 0.45, col: C.grass },
  archer: { hp: 15, spd: 30, dmg: 6, xp: 2, r: 5, h: 14, spr: 'archer', kb: 1, col: C.pale },
  toad: { hp: 24, spd: 34, dmg: 5, xp: 2, r: 6, h: 12, spr: 'toad', kb: 0.8, col: C.lime },
  wraith: { hp: 20, spd: 42, dmg: 8, xp: 2, r: 5, h: 13, spr: 'wraith', kb: 0.9, fly: 1, col: C.cyan },
  spider: { hp: 6, spd: 60, dmg: 4, xp: 1, r: 4, h: 7, spr: 'spider', kb: 1.3, col: C.red },
  revenant: { hp: 70, spd: 22, dmg: 14, xp: 4, r: 6, h: 15, spr: 'revenant', kb: 0.3, armor: 0.35, col: C.fog },
  imp: { hp: 18, spd: 40, dmg: 6, xp: 2, r: 4, h: 9, spr: 'imp', kb: 1, fly: 1, col: C.ember },
  necro: { hp: 45, spd: 24, dmg: 8, xp: 5, r: 5, h: 14, spr: 'necro', kb: 0.6, col: C.purple },
  shade: { hp: 30, spd: 38, dmg: 10, xp: 3, r: 5, h: 12, spr: 'shade', kb: 0.7, col: C.violet },
  golem: { hp: 2200, spd: 21, dmg: 22, xp: 80, r: 12, h: 18, spr: 'golem', kb: 0, boss: 1, col: C.bone },
  matriarch: { hp: 2600, spd: 34, dmg: 20, xp: 120, r: 12, h: 13, spr: 'matriarch', kb: 0, boss: 1, fly: 1, col: C.red },
  toadking: { hp: 3400, spd: 26, dmg: 24, xp: 150, r: 13, h: 16, spr: 'toadking', kb: 0, boss: 1, col: C.lime },
  lich: { hp: 4400, spd: 30, dmg: 22, xp: 200, r: 9, h: 16, spr: 'lich', kb: 0, boss: 1, col: C.cyan },
  reaper: { hp: 45000, spd: 38, dmg: 30, xp: 0, r: 14, h: 24, spr: 'reaper', kb: 0, boss: 2, col: C.pale },
  lantern: { hp: 1, spd: 0, dmg: 0, xp: 0, r: 5, h: 12, spr: 'lantern', kb: 0, col: C.gold }
};
const SPAWN_TABLE = [
  [0, { husk: 6, bat: 3 }], [1, { husk: 5, bat: 4, archer: 1 }], [2, { husk: 4, bat: 3, archer: 2, ghoul: 1 }],
  [3, { husk: 4, bat: 3, archer: 2, ghoul: 1, spider: 2 }], [4, { husk: 3, bat: 3, archer: 2, ghoul: 2, toad: 2, spider: 2 }],
  [5, { husk: 3, bat: 3, archer: 2, ghoul: 2, toad: 2, spider: 2, revenant: 1 }],
  [6, { husk: 2, bat: 3, archer: 2, ghoul: 3, toad: 2, wraith: 2, spider: 2, revenant: 1, imp: 2 }],
  [8, { husk: 2, bat: 3, archer: 2, ghoul: 3, toad: 2, wraith: 2, spider: 2, revenant: 2, imp: 2, necro: 1 }],
  [9, { bat: 3, archer: 3, ghoul: 4, toad: 3, wraith: 3, husk: 1, spider: 2, revenant: 2, imp: 2, necro: 1 }],
  [12, { bat: 4, archer: 3, ghoul: 5, toad: 3, wraith: 4, spider: 3, revenant: 3, imp: 2, necro: 1, shade: 2 }],
  [15, { bat: 3, archer: 3, ghoul: 5, toad: 3, wraith: 4, spider: 3, revenant: 4, imp: 3, necro: 2, shade: 3 }],
  [22, { archer: 3, ghoul: 5, toad: 3, wraith: 4, spider: 4, revenant: 5, imp: 3, necro: 2, shade: 4 }]
];

// ---------- pools ----------
const enemies = new Pool(() => ({ qs: 0 }), 800, MAX_EN);
const projs = new Pool(() => ({ hits: [] }), 300, 600);
const ebul = new Pool(() => ({}), 120, 300);
const gems = new Pool(() => ({}), 500, 520);
const items = new Pool(() => ({}), 40, 120);
const zones = new Pool(() => ({}), 40, 80);
const fx = new Pool(() => ({ pts: [] }), 60, 200);
const parts = new Pool(() => ({}), 1500, 1800);
const nums = new Pool(() => ({}), 150, 150);

// ---------- run state ----------
const G = { state: 'title', time: 0, kills: 0, gold: 0, level: 1, xp: 0, xpNext: 6, pendLv: 0, rerolls: 2, choices: [], hero: SAVE.hero | 0,
  weapons: [], passives: [], shake: 0, flash: 0, flashCol: '#fff', evi: 0, dirAcc: 0, boss: null, reaper: null, revived: false, endT: 0,
  chest: null, uid: 1, lanternT: 8, hurtBy: {}, endless: false, night: 1, bossIdx: 0, nextEvt: 0, nextBoss: 0, bossSeen: false,
  merchant: null, merchantT: 75, bought: {}, buffs: { fury: 0, haste: 0 }, bonusHp: 0, bonusArmor: 0, pendSmite: false, pendChest: false, msg: '', msgT: 0, won: false, banked: 0, lowWarn: 0, fps: 60, dmgDealt: 0 };
const P = { x: 0, y: 0, r: 5, dashT: 0, dashCd: 0, dashX: 1, dashY: 0, ward: 0, hp: 100, maxHp: 100, face: { x: 1, y: 0 }, flip: false, moving: false, anim: 0, inv: 0, flash: 0, st: {}, vx: 0, vy: 0 };
const IN = { x: 0, y: 0 }; // movement input (keyboard + joystick), filled by main
const cam = { x: 0, y: 0 };

function viewR() { return Math.sqrt(W * W + H * H) / 2 + 14; }
const minutes = () => G.time / 60;
const hpScale = () => { const m = minutes(); return 1 + 0.3 * m + 0.022 * m * m; };
const dmgScale = () => 1 + minutes() * 0.055;

function recalc() {
  const hero = HEROES[G.hero], s = { might: 1 + 0.05 * upL('might'), area: 1, cd: 1, speed: 1 + 0.05 * upL('speed'), magnet: 1 + 0.2 * upL('magnet'),
    luck: 0, crit: 0.05, regen: 0, armorPct: 0, armorFlat: upL('armor'), hpMul: 1 + 0.1 * upL('maxhp'), greed: 1 + 0.1 * upL('greed') };
  if (hero.id === 'knight') s.armorPct += 0.1; if (hero.id === 'witch') s.cd -= 0.15; if (hero.id === 'ranger') s.speed += 0.1;
  for (const p of G.passives) {
    const l = p.lvl;
    if (p.id === 'heart') s.hpMul += 0.2 * l; else if (p.id === 'boots') s.speed += 0.08 * l; else if (p.id === 'glass') s.cd -= 0.06 * l;
    else if (p.id === 'magnet') s.magnet += 0.3 * l; else if (p.id === 'book') s.area += 0.1 * l;
    else if (p.id === 'luck') { s.luck += 0.1 * l; s.crit += 0.04 * l; } else if (p.id === 'blood') s.regen += 0.3 * l;
  }
  s.cd = Math.max(0.35, s.cd); s.armorFlat += G.bonusArmor;
  P.st = s;
  const mx = Math.round(hero.hp * s.hpMul + G.bonusHp);
  if (mx > P.maxHp) P.hp += mx - P.maxHp;
  P.maxHp = mx; P.hp = Math.min(P.hp, mx);
}
const wst = (w) => (w.evo ? WD[w.id].ev : WD[w.id].st(w.lvl));
const hasW = (id) => G.weapons.find((w) => w.id === id);
const hasP = (id) => G.passives.find((p) => p.id === id);

function startRun(hi) {
  G.hero = hi; SAVE.hero = hi; saveNow();
  for (const p of [enemies, projs, ebul, gems, items, zones, fx, parts, nums]) p.clear();
  Object.assign(G, { state: 'play', time: 0, kills: 0, gold: 0, level: 1, xp: 0, xpNext: 5, pendLv: 0, rerolls: 2 + (upL('greed') >= 3 ? 1 : 0), choices: [],
    weapons: [], passives: [], shake: 0, flash: 0, evi: 0, dirAcc: 0, boss: null, reaper: null, revived: false, endT: 0, chest: null, lanternT: 6,
    msg: '', msgT: 0, won: false, banked: 0, lowWarn: 0, dmgDealt: 0, hurtBy: {}, endless: false, night: 1, bossIdx: 0, nextEvt: 0, nextBoss: 0, bossSeen: false,
    merchant: null, merchantT: 75, bought: {}, buffs: { fury: 0, haste: 0 }, bonusHp: 0, bonusArmor: 0, pendSmite: false, pendChest: false });
  hazards.clear();
  Object.assign(P, { x: 0, y: 0, hp: 1, maxHp: 1, dashT: 0, dashCd: 0, ward: 0, inv: 0, flash: 0, face: { x: 1, y: 0 }, flip: false, anim: 0 });
  G.weapons.push({ id: HEROES[hi].weapon, lvl: 1, t: 0.4, evo: false, ang: 0, rot: 0, pos: [] });
  recalc(); P.hp = P.maxHp;
  cam.x = 0; cam.y = 0;
  VO.last = {};
  const t0 = parseFloat(URLQ.get('t'));
  if (t0 > 0) { G.time = t0 * 60; while (EVENTS[G.evi] && EVENTS[G.evi].t <= G.time && EVENTS[G.evi].t > 1) G.evi++; }
  MUS.mode = 'run'; MUS.intensity = 0;
  for (let i = 0; i < 3; i++) spawnLantern();
}

// ---------- spawning ----------
function spawnEnemy(type, x, y, o) {
  const e = enemies.get(); if (!e) return null;
  const d = ED[type], m = minutes(), elite = !!(o && o.elite);
  e.type = type; e.def = d; e.x = x; e.y = y; e.r = elite ? d.r + 1 : d.r; e.uid = G.uid++;
  e.maxHp = e.hp = d.hp * (d.boss || type === 'lantern' ? 1 : hpScale()) * (elite ? 9 : 1) * (d.boss === 1 ? (1 + m * 0.4) * bossMul() : d.boss === 2 ? 1 + 0.8 * (G.night - 1) : 1);
  e.spd = d.spd * (elite ? 0.9 : 1) * (1 + Math.min(0.35, m * 0.025)) * rand(0.9, 1.1);
  e.dmg = d.dmg * dmgScale() * (elite ? 1.5 : 1); e.elite = elite; e.dead = false; e.flash = 0; e.kx = 0; e.ky = 0;
  e.anim = rand(4); e.flip = false; e.mode = (o && o.mode) || ''; e.vx = (o && o.vx) || 0; e.vy = (o && o.vy) || 0; e.life = (o && o.life) || 0;
  e.t = rand(1.5, 3); e.fuse = 0; e.orbT = 0; e.slowT = 0; e.dot = 0; e.dotT = 0; e.dotAcc = 0; e.slam = 0; e.dash = 0; e.tele = 0; e.phase = rand(TAU); e.qs = 0; e.z = 0; e.leap = 0; e.spiral = 0; e.hop = 0;
  if (d.boss) { G.boss = e; if (type === 'reaper') G.reaper = e; }
  return e;
}
function ringPos(extra) { const a = rand(TAU), r = viewR() + (extra || rand(4, 30)); return [P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, a]; }
function spawnLantern() { const a = rand(TAU), r = rand(90, 220); spawnEnemy('lantern', P.x + Math.cos(a) * r, P.y + Math.sin(a) * r); }
function weightsNow() { const m = minutes(); let w = SPAWN_TABLE[0][1]; for (const [t, tab] of SPAWN_TABLE) if (m >= t) w = tab; return w; }
function director(dt) {
  const m = minutes();
  let rate = 0.7 + m * 1.0 + m * m * 0.07;
  if (G.reaper) rate *= 0.35;
  G.dirAcc += rate * dt;
  let guard = 0;
  while (G.dirAcc >= 1 && guard++ < 20) {
    G.dirAcc -= 1;
    const type = weighted(weightsNow()), [x, y] = ringPos(), n = type === 'spider' ? randi(3, 5) : type === 'bat' || type === 'husk' ? randi(1, m < 1 ? 2 : 3) : 1;
    for (let i = 0; i < n; i++) spawnEnemy(type, x + rand(-10, 10), y + rand(-10, 10), { elite: Math.random() < 0.003 + m * 0.0025 });
  }
  while (EVENTS[G.evi] && G.time >= EVENTS[G.evi].t) EVENTS[G.evi++].f();
  endlessDirector();
  merchantTick(dt);
  G.lanternT -= dt;
  if (G.lanternT <= 0) { G.lanternT = 18; let n = 0; for (const e of enemies.list) if (e.type === 'lantern') n++; if (n < 5) spawnLantern(); }
}
function batSwarm(back) {
  const a = rand(TAU) + (back ? Math.PI : 0), dx = Math.cos(a), dy = Math.sin(a), R = viewR() + 30;
  for (let i = 0; i < 110; i++) {
    const off = rand(-110, 110), lag = rand(0, 260);
    spawnEnemy('bat', P.x - dx * (R + lag) - dy * off, P.y - dy * (R + lag) + dx * off, { mode: 'stream', vx: dx * 82, vy: dy * 82, life: 12 });
  }
  banner('A SWARM DESCENDS'); VO.say('swarm');
}
function wraithRing() {
  const n = 64, r = 160;
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU; spawnEnemy('wraith', P.x + Math.cos(a) * r, P.y + Math.sin(a) * r, { mode: 'ring', life: 9, elite: i % 16 === 0 }); }
  banner('THE WRAITHS ENCIRCLE YOU'); VO.say('swarm');
}
function golemEvent() { spawnBoss('golem'); }
function elitePack() { for (let i = 0; i < 6; i++) { const [x, y] = ringPos(); spawnEnemy(pick(['ghoul', 'toad', 'archer']), x, y, { elite: true }); } banner('ELITES HUNT YOU'); }
function reaperEvent() {
  spawnBoss('reaper'); G.shake = 6; G.flash = 0.6;
}
const EVENTS = [
  { t: 0.6, f: () => VO.say('start', true) }, { t: 120, f: () => banner('THE DEAD GROW RESTLESS') }, { t: 180, f: () => batSwarm(false) },
  { t: 240, f: spiderNest }, { t: 300, f: golemEvent }, { t: 420, f: wraithRing }, { t: 510, f: () => spawnBoss('matriarch') }, { t: 570, f: elitePack },
  { t: 600, f: golemEvent }, { t: 660, f: necroCoven }, { t: 720, f: () => { batSwarm(false); batSwarm(true); } }, { t: 750, f: () => spawnBoss('toadking') },
  { t: 800, f: wraithRing }, { t: 840, f: () => { elitePack(); shadeAmbush(); } }, { t: RUN_END, f: reaperEvent }
];
function banner(s) { G.msg = s; G.msgT = 3; }

// ---------- effects ----------
function burst(x, y, n, cols, spd, life, grav, sz) {
  for (let i = 0; i < n; i++) {
    const p = parts.get(); if (!p) return;
    const a = rand(TAU), v = rand(0.3, 1) * (spd || 50);
    p.x = x; p.y = y; p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - (grav ? v * 0.5 : 0); p.max = p.life = rand(0.5, 1) * (life || 0.5);
    p.col = Array.isArray(cols) ? pick(cols) : cols; p.g = grav || 0; p.sz = sz || (Math.random() < 0.3 ? 2 : 1);
  }
}
function number(x, y, v, col, sc) {
  const n = nums.get(); if (!n) return;
  n.x = x + rand(-3, 3); n.y = y; n.vy = -28; n.life = n.max = 0.7; n.txt = String(v); n.col = col; n.sc = sc || 1;
}
function addFx(kind, o) { const f = fx.get(); if (!f) return null; f.kind = kind; f.pts.length = 0; Object.assign(f, o); f.max = f.life; return f; }

// ---------- damage ----------
function hurt(e, base, kx, ky, kb, quiet) {
  if (e.dead) return 0;
  const crit = Math.random() < P.st.crit;
  const d = Math.max(1, Math.round(base * P.st.might * (crit ? 2 : 1) * (G.buffs.fury > 0 ? 1.5 : 1) * (1 - (e.def.armor || 0)) * rand(0.9, 1.1)));
  e.hp -= d; e.flash = 0.1; G.dmgDealt += d;
  if (kb && e.def.kb) { e.kx += kx * kb * e.def.kb; e.ky += ky * kb * e.def.kb; }
  if (!quiet || crit) number(e.x, e.y - e.def.h - 2, d, crit ? C.gold : C.white, crit ? 1 : 1);
  if (e.hp <= 0) killEnemy(e); else if (!quiet) AU.hit();
  return d;
}
function killEnemy(e, silent) {
  if (e.dead) return; e.dead = true;
  if (silent) return;
  const d = e.def;
  if (e.type === 'lantern') {
    burst(e.x, e.y - 6, 14, [C.gold, C.orange, C.light], 50, 0.6, 60); AU.glass();
    const r = Math.random();
    dropItem(r < 0.45 ? 'coin' : r < 0.6 ? 'bag' : r < 0.82 ? 'chicken' : r < 0.92 ? 'vacuum' : 'rosary', e.x, e.y);
    return;
  }
  G.kills++;
  burst(e.x, e.y - d.h / 2, e.elite ? 26 : d.boss ? 60 : 7, [d.col, C.black, C.blood, C.white], d.boss ? 110 : 55, d.boss ? 1.2 : 0.45, 40);
  AU.pop();
  if (d.boss) {
    if (e === G.reaper) G.reaper = null;
    G.boss = findBoss();
    if (d.boss === 2 && !G.endless) { winRun(); return; }
    if (d.boss === 2) { G.night++; banner('DAWN... THEN NIGHT ' + G.night + ' FALLS'); VO.say('endless', true); G.gold += Math.round(300 * P.st.greed); }
    else banner(BOSS_NAMES[e.type] + ' FALLS');
    dropItem('chest', e.x, e.y); dropItem('bag', e.x + 12, e.y); dropItem('bag', e.x - 12, e.y); dropGem(e.x - 10, e.y + 6, 60); G.shake = 6; AU.boom();
    return;
  }
  dropGem(e.x, e.y, e.elite ? 25 : d.xp);
  const luck = 1 + P.st.luck;
  if (Math.random() < 0.035 * luck) dropItem('coin', e.x + 3, e.y);
  if (e.elite) { dropItem('bag', e.x + 5, e.y); if (Math.random() < 0.35) dropItem('chicken', e.x - 5, e.y); if (Math.random() < 0.06 * luck) dropItem('vacuum', e.x, e.y + 5); }
  else if (Math.random() < 0.0012 * luck) dropItem('chicken', e.x, e.y);
}
function dropGem(x, y, v) {
  let g = gems.get();
  if (!g) { g = gems.list[(Math.random() * gems.list.length) | 0]; g.v += v; return; } // merge when full
  g.x = x; g.y = y; g.v = v; g.pull = false; g.sp = 0; g.anim = rand(TAU);
}
function dropItem(kind, x, y) {
  const it = items.get(); if (!it) return;
  it.kind = kind; it.x = x; it.y = y; it.pull = false; it.sp = 0; it.anim = rand(4); it.v = kind === 'bag' ? randi(15, 35) : kind === 'coin' ? randi(1, 3) : 1;
}
function damagePlayer(d, src) {
  if (P.inv > 0 || G.state !== 'play' || URLQ.has('god')) return;
  if (P.ward > 0) { P.ward--; P.inv = 0.6; AU.glass(); burst(P.x, P.y - 8, 14, [C.cyan, C.white], 50, 0.4); number(P.x, P.y - 18, 'BLOCK', C.cyan); return; }
  G.hurtBy[src || '?'] = (G.hurtBy[src || '?'] || 0) + 1;
  d = Math.max(1, d * (1 - P.st.armorPct) - P.st.armorFlat);
  P.hp -= d; P.inv = 0.5; P.flash = 0.15; G.shake = Math.max(G.shake, 1.5); AU.hurt();
  number(P.x, P.y - 18, Math.round(d), C.red);
  if (P.hp <= 0) {
    if (upL('revive') && !G.revived) {
      G.revived = true; P.hp = P.maxHp * 0.5; P.inv = 2.5; smite(); banner('YOU RISE AGAIN'); G.flash = 0.8; G.flashCol = C.gold;
    } else { P.hp = 0; G.state = 'dying'; G.endT = 1.8; burst(P.x, P.y - 8, 50, [C.red, C.blood, C.white, C.ember], 80, 1.2, 30); VO.say('dead', true); MUS.mode = 'off'; }
  }
}
function smite() {
  G.flash = 0.7; G.flashCol = C.light; G.shake = 5; AU.smite();
  const hw = W / 2 + 20, hh = H / 2 + 20;
  for (const e of enemies.list) if (!e.dead && !e.def.boss && e.type !== 'lantern' && Math.abs(e.x - P.x) < hw && Math.abs(e.y - P.y) < hh) killEnemy(e);
  for (const e of enemies.list) if (!e.dead && e.def.boss) hurt(e, 300, 0, 0, 0);
  ebul.clear();
}
function addXP(v) {
  G.xp += v;
  while (G.xp >= G.xpNext) { G.xp -= G.xpNext; G.level++; G.pendLv++; G.xpNext = Math.round(5 + (G.level - 1) * 6 + Math.pow(G.level - 1, 1.6) * 0.5); }
}

// ---------- level-up & chests ----------
function buildChoices() {
  const opts = [];
  for (const w of G.weapons) if (!w.evo && w.lvl < 8) opts.push({ kind: 'w', id: w.id, next: w.lvl + 1, wt: 1.4 });
  if (G.weapons.length < 6) for (const id of WIDS) if (!hasW(id)) opts.push({ kind: 'w', id, next: 1, wt: 1 });
  for (const p of G.passives) if (p.lvl < PD[p.id].max) opts.push({ kind: 'p', id: p.id, next: p.lvl + 1, wt: 1.1 });
  if (G.passives.length < 6) for (const id of PIDS) if (!hasP(id)) opts.push({ kind: 'p', id, next: 1, wt: 0.9 });
  const n = Math.random() < 0.08 + P.st.luck * 0.5 ? 4 : 3, out = [];
  while (out.length < n && opts.length) {
    let sum = 0; for (const o of opts) sum += o.wt; let r = Math.random() * sum, k = 0;
    for (; k < opts.length - 1; k++) { r -= opts[k].wt; if (r <= 0) break; }
    out.push(opts.splice(k, 1)[0]);
  }
  if (!out.length) out.push({ kind: 'gold', id: 'gold' }, { kind: 'heal', id: 'heal' });
  return out;
}
function choiceInfo(c) {
  if (c.kind === 'gold') return { name: 'ASH GOLD', icon: 'gold', lvl: '', desc: 'GAIN 25 GOLD.', max: 0 };
  if (c.kind === 'heal') return { name: 'FLOOR CHICKEN', icon: 'heart', lvl: '', desc: 'RESTORE 30 HEALTH.', max: 0 };
  if (c.kind === 'p') { const d = PD[c.id]; return { name: d.name, icon: d.icon, lvl: c.next, max: d.max, isNew: c.next === 1, desc: d.desc + (c.next === 1 ? '' : '') }; }
  const d = WD[c.id]; let desc = d.desc;
  if (c.next > 1) {
    const a = d.st(c.next - 1), b = d.st(c.next), parts2 = [];
    for (const [k, lab, kind] of d.lab) {
      if (a[k] === b[k]) continue;
      if (lab === 'cd') parts2.push(Math.round((1 - b[k] / a[k]) * 100) + '% FASTER');
      else if (kind === 'flag') parts2.push('GAINS ' + lab);
      else parts2.push('+' + (Math.round((b[k] - a[k]) * 10) / 10) + ' ' + lab);
    }
    desc = parts2.join(', ') + '.';
  }
  if (c.next === 8 && PD[d.pair]) desc += ' MAX LEVEL! PAIR WITH ' + PD[d.pair].name + ' TO EVOLVE.';
  return { name: d.name, icon: d.icon, lvl: c.next, max: 8, isNew: c.next === 1, desc };
}
function openLevelUp() {
  G.state = 'levelup'; G.choices = buildChoices(); G.flash = 0.45; G.flashCol = C.light; AU.levelup(); VO.say('level');
  burst(P.x, P.y - 8, 24, [C.cyan, C.white, C.gold], 70, 0.8, -10);
}
function applyChoice(c) {
  if (c.kind === 'w') { const w = hasW(c.id); if (w) w.lvl = c.next; else G.weapons.push({ id: c.id, lvl: 1, t: 0.2, evo: false, ang: 0, rot: 0, pos: [] }); }
  else if (c.kind === 'p') { const p = hasP(c.id); if (p) p.lvl = c.next; else G.passives.push({ id: c.id, lvl: 1 }); recalc(); }
  else if (c.kind === 'gold') G.gold += 25;
  else if (c.kind === 'heal') P.hp = Math.min(P.maxHp, P.hp + 30);
  AU.click(); finishLevel();
}
function finishLevel() { G.pendLv = Math.max(0, G.pendLv - 1); if (G.pendLv > 0) { G.choices = buildChoices(); } else G.state = 'play'; }
function reroll() { if (G.rerolls <= 0) { AU.deny(); return; } G.rerolls--; G.choices = buildChoices(); AU.click(); }
function openChest() {
  const evoW = G.weapons.find((w) => !w.evo && w.lvl >= 8 && hasP(WD[w.id].pair));
  const res = { evo: null, ups: [], gold: Math.round(randi(60, 140) * P.st.greed) };
  if (evoW) { evoW.evo = true; evoW.t = 0; res.evo = evoW.id; VO.say('evolve', true); }
  else {
    const pool = G.weapons.filter((w) => !w.evo && w.lvl < 8).map((w) => ({ k: 'w', o: w })).concat(G.passives.filter((p) => p.lvl < PD[p.id].max).map((p) => ({ k: 'p', o: p })));
    const n = Math.random() < 0.2 + P.st.luck * 0.3 ? 3 : 1;
    for (let i = 0; i < n && pool.length; i++) { const it = pool.splice((Math.random() * pool.length) | 0, 1)[0]; it.o.lvl++; res.ups.push(it); }
    recalc();
  }
  G.gold += res.gold; G.chest = res; G.chestT = 0; G.state = 'chest'; AU.chestOpen();
}
function bankGold() {
  if (G.banked) return; G.banked = 1;
  SAVE.gold += G.gold; SAVE.kills += G.kills; SAVE.runs++; SAVE.best = Math.max(SAVE.best, G.time); SAVE.night = Math.max(SAVE.night || 1, G.night);
  if (G.won) SAVE.wins++; saveNow();
}
function winRun() {
  G.won = true; G.gold += Math.round(500 * P.st.greed); G.state = 'victory'; G.endT = 2.6; G.flash = 1; G.flashCol = C.white; G.shake = 8; hazards.clear();
  VO.say('win', true); MUS.mode = 'title'; AU.boom(); smite();
}

// ---------- simulation step ----------
function nearest(x, y, maxR, skipUid) {
  const n = gridQuery(x, y, maxR, QB3); let best = null, bd = 1e9;
  for (let i = 0; i < n; i++) { const e = QB3[i]; if (e.type === 'lantern' || e.uid === skipUid) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } }
  return best;
}
function update(dt) {
  G.time += dt;
  MUS.intensity = Math.min(4, Math.floor(G.time / 150));
  MUS.mode = G.boss && !G.boss.dead ? 'boss' : 'run';
  updatePlayer(dt);
  director(dt);
  updateEnemies(dt);
  gridBuild(enemies.list);
  updateWeapons(dt);
  updateProjectiles(dt);
  updateHazards(dt);
  updatePickups(dt);
  updateParticles(dt);
  if (G.msgT > 0) G.msgT -= dt;
  if (AU.comboT > 0) AU.comboT -= dt;
  if (G.pendLv > 0 && G.state === 'play') openLevelUp();
}
function updatePlayer(dt) {
  let mx = IN.x, my = IN.y; const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
  P.moving = l > 0.1;
  const spd = 66 * P.st.speed * (G.buffs.haste > 0 ? 1.3 : 1);
  if (G.buffs.fury > 0) G.buffs.fury -= dt; if (G.buffs.haste > 0) G.buffs.haste -= dt;
  dashUpdate(dt);
  P.x += mx * spd * dt; P.y += my * spd * dt;
  if (P.moving) { const n = Math.hypot(mx, my); P.face.x = mx / n; P.face.y = my / n; if (Math.abs(mx) > 0.15) P.flip = mx < 0; P.anim += dt * 8; }
  if (P.st.regen) P.hp = Math.min(P.maxHp, P.hp + P.st.regen * dt);
  if (P.inv > 0) P.inv -= dt; if (P.flash > 0) P.flash -= dt;
  if (P.hp / P.maxHp < 0.25 && P.hp > 0) { if (G.lowWarn <= 0) { VO.say('lowhp'); G.lowWarn = 20; } }
  if (G.lowWarn > 0) G.lowWarn -= dt;
}
function updateEnemies(dt) {
  const L = enemies.list, VR = viewR(), px = P.x, py = P.y;
  for (let i = L.length - 1; i >= 0; i--) {
    const e = L[i];
    if (e.dead) { enemies.kill(i); continue; }
    const d = e.def; let dx = px - e.x, dy = py - e.y; const dist = Math.hypot(dx, dy) || 1; dx /= dist; dy /= dist;
    if (e.flash > 0) e.flash -= dt;
    e.anim += dt * (d.fly ? 10 : 6);
    let sp = e.spd * (e.slowT > 0 ? 0.6 : 1), vx = 0, vy = 0;
    if (e.slowT > 0) e.slowT -= dt;
    if (e.dotT > 0) { e.dotT -= dt; e.dotAcc += e.dot * dt; if (e.dotAcc >= 3) { const v = Math.floor(e.dotAcc); e.dotAcc -= v; hurt(e, v / P.st.might, 0, 0, 0, true); if (e.dead) continue; } }
    switch (e.type) {
      case 'lantern': break;
      case 'bat':
        if (e.mode === 'stream') { vx = e.vx; vy = e.vy; e.life -= dt; if (e.life <= 0) { killEnemy(e, true); continue; } }
        else { const w = Math.sin(e.anim * 0.7 + e.phase) * 0.6; vx = (dx - dy * w) * sp; vy = (dy + dx * w) * sp; }
        break;
      case 'archer':
        if (dist < 85) { vx = -dx * sp; vy = -dy * sp; } else if (dist > 125) { vx = dx * sp; vy = dy * sp; } else { vx = -dy * sp * 0.6; vy = dx * sp * 0.6; }
        e.t -= dt;
        if (e.t <= 0 && dist < 190) { e.t = rand(2.2, 3.2); fireEnemy('bone', e.x, e.y - 7, dx * 95, dy * 95, e.dmg); }
        break;
      case 'toad':
        if (e.fuse > 0) { e.fuse -= dt; if (e.fuse <= 0) { toadBoom(e); continue; } }
        else { vx = dx * sp; vy = dy * sp; if (dist < 18) e.fuse = 0.6; }
        break;
      case 'wraith': {
        const s2 = e.mode === 'ring' ? 20 : sp; if (e.mode === 'ring') { e.life -= dt; if (e.life <= 0) e.mode = ''; }
        const w = e.mode === 'ring' ? 0 : Math.sin(e.anim * 0.4 + e.phase) * 0.5; vx = (dx - dy * w) * s2; vy = (dy + dx * w) * s2; break;
      }
      case 'golem':
        if (e.slam > 0) { e.slam -= dt; if (e.slam <= 0) { const R = 52; addFx('ring', { x: e.x, y: e.y, r: R, life: 0.35, col: C.bone }); G.shake = 5; AU.boom(); burst(e.x, e.y, 30, [C.bone, C.umber, C.ash], 90, 0.6); if (dist < R) damagePlayer(e.dmg * 1.4); e.t = 3.6; } }
        else { vx = dx * sp; vy = dy * sp; e.t -= dt; if (e.t <= 0 && dist < 90) { e.slam = 0.85; addFx('tele', { x: e.x, y: e.y, r: 52, life: 0.85, col: C.red }); } }
        break;
      case 'reaper': reaperAI(e, dt, dx, dy, dist); vx = e.vx; vy = e.vy; break;
      default: if (aiSpecial(e, dt, dx, dy, dist, sp)) { vx = e.vx; vy = e.vy; } else { vx = dx * sp; vy = dy * sp; }
    }
    // separation from neighbours (using last step's grid), walkers only
    if (!d.fly && !d.boss && e.type !== 'lantern' && GRID.list) {
      const c = GRID.cell; let k = GRID.head[cellKey(Math.floor(e.x / c), Math.floor(e.y / c))], n = 0;
      while (k !== -1 && n < 6) {
        const o = L[k]; k = GRID.next[k]; n++;
        if (!o || o === e || o.def.fly) continue;
        const ox = e.x - o.x, oy = e.y - o.y, rr = e.r + o.r, dd = ox * ox + oy * oy;
        if (dd < rr * rr && dd > 0.01) { const f = (rr - Math.sqrt(dd)) * 4; const inv = 1 / Math.sqrt(dd); vx += ox * inv * f; vy += oy * inv * f; }
      }
    }
    e.x += (vx + e.kx) * dt; e.y += (vy + e.ky) * dt;
    const kd = Math.exp(-dt * 9); e.kx *= kd; e.ky *= kd;
    if (Math.abs(vx) > 1) e.flip = vx < 0;
    // contact damage
    if (e.dmg > 0 && !(e.z > 8)) { const cx = px - e.x, cy = py - e.y, rr = e.r + P.r; if (cx * cx + cy * cy < rr * rr) damagePlayer(e.dmg, e.type); }
    // recycle stragglers in front of the player
    if (dist > VR * 1.7 && !d.boss && e.mode !== 'stream') {
      if (e.type === 'lantern') { killEnemy(e, true); continue; }
      let a = Math.atan2(P.face.y, P.face.x) + rand(-1.2, 1.2); if (!P.moving) a = rand(TAU);
      e.x = px + Math.cos(a) * (VR + 10); e.y = py + Math.sin(a) * (VR + 10);
    }
  }
}
function reaperAI(e, dt, dx, dy, dist) {
  const rage = e.hp < e.maxHp * 0.5;
  if (e.dash > 0) { e.dash -= dt; if (e.dash <= 0) { e.vx = 0; e.vy = 0; } burst(e.x, e.y - 10, 2, [C.pale, C.spirit], 20, 0.4); return; }
  if (e.tele > 0) { e.tele -= dt; e.vx = 0; e.vy = 0; if (e.tele <= 0) { const sp = rage ? 260 : 210; e.vx = e.dax * sp; e.vy = e.day * sp; e.dash = 0.55; AU.slash(); } return; }
  e.vx = dx * e.spd * (rage ? 1.3 : 1); e.vy = dy * e.spd * (rage ? 1.3 : 1);
  e.t -= dt;
  if (e.t <= 0) {
    e.t = rage ? 2.2 : 3.2;
    const r = Math.random();
    if (r < 0.4) { e.tele = 0.6; e.dax = dx; e.day = dy; addFx('line', { x: e.x, y: e.y, a: Math.atan2(dy, dx), r: 140, life: 0.6, col: C.red }); }
    else if (r < 0.75) {
      const n = rage ? 24 : 16, rep = rage ? 2 : 1;
      for (let k = 0; k < rep; k++) for (let i = 0; i < n; i++) { const a = (i / n) * TAU + k * 0.13; fireEnemy('scythe', e.x, e.y - 12, Math.cos(a) * (70 + k * 25), Math.sin(a) * (70 + k * 25), e.dmg * 0.6); }
      AU.zap(); G.shake = 2;
    } else {
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; spawnEnemy('wraith', P.x + Math.cos(a) * 95, P.y + Math.sin(a) * 95, { elite: i === 0 && rage }); }
      burst(e.x, e.y - 12, 30, [C.spirit, C.cyan, C.white], 80, 0.8); banner('THE REAPER CALLS ITS DEAD');
    }
  }
}
function toadBoom(e) {
  const R = 30; e.fuse = 0; burst(e.x, e.y - 5, 30, [C.lime, C.gold, C.ember, C.white], 100, 0.6, 20);
  addFx('ring', { x: e.x, y: e.y, r: R, life: 0.3, col: C.lime }); G.shake = Math.max(G.shake, 3); AU.boom();
  if ((P.x - e.x) ** 2 + (P.y - e.y) ** 2 < R * R) damagePlayer(15 * dmgScale());
  const n = gridQuery(e.x, e.y, R, QB2); for (let i = 0; i < n; i++) if (QB2[i] !== e && QB2[i].type !== 'lantern') hurt(QB2[i], 25, 0, 0, 0, true);
  killEnemy(e, true);
}
function fireEnemy(kind, x, y, vx, vy, dmg) {
  const b = ebul.get(); if (!b) return; b.kind = kind; b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.dmg = dmg; b.life = 4; b.r = kind === 'scythe' ? 4 : kind === 'bone' ? 2 : 3; b.rot = 0;
}

// ---------- weapons ----------
function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return Math.abs(d); }
function updateWeapons(dt) {
  const s0 = P.st;
  for (const w of G.weapons) {
    const s = wst(w), area = s0.area;
    if (w.id === 'orbit') { orbitTick(w, s, dt, area); continue; }
    w.t -= dt;
    if (w.id === 'font') { if (w.t <= 0) { w.t = s.cd; fontTick(w, s, area); } continue; }
    if (w.t > 0) continue;
    w.t = s.cd * s0.cd;
    switch (w.id) {
      case 'blade': fireBlade(w, s, area); break;
      case 'bolt': fireBolt(w, s); break;
      case 'volley': fireVolley(w, s); break;
      case 'thunder': fireThunder(w, s, area); break;
      case 'flask': fireFlask(w, s, area); break;
      case 'chain': fireChain(w, s); break;
    }
  }
}
function fireBlade(w, s, area) {
  const r = s.range * area, tg = nearest(P.x, P.y - 4, r + 12), base = tg ? Math.atan2(tg.y - P.y + 4, tg.x - P.x) : Math.atan2(P.face.y, P.face.x), dirs = w.evo ? [base] : s.back ? [base, base + Math.PI] : [base];
  const n = gridQuery(P.x, P.y - 4, r, QB);
  for (let i = 0; i < n; i++) {
    const e = QB[i], a = Math.atan2(e.y - P.y + 4, e.x - P.x);
    if (w.evo || dirs.some((d) => angDiff(a, d) <= s.arc / 2)) {
      const kx = Math.cos(a), ky = Math.sin(a);
      hurt(e, s.dmg, kx, ky, 90);
      if (w.evo && !e.dead) { e.dot = s.burn * P.st.might; e.dotT = 2; }
    }
  }
  for (const d of dirs) addFx('slash', { x: P.x, y: P.y - 4, a: d, arc: s.arc, r, life: w.evo ? 0.3 : 0.18, col: w.evo ? C.orange : C.ember, follow: 1 });
  if (w.evo) burst(P.x, P.y - 4, 16, [C.ember, C.orange, C.gold], r * 2, 0.4);
  AU.slash();
}
function fireBolt(w, s) {
  const n = gridQuery(P.x, P.y, 210, QB), cand = [];
  for (let i = 0; i < n; i++) if (QB[i].type !== 'lantern') cand.push(QB[i]);
  cand.sort((a, b) => ((a.x - P.x) ** 2 + (a.y - P.y) ** 2) - ((b.x - P.x) ** 2 + (b.y - P.y) ** 2));
  for (let k = 0; k < s.count; k++) {
    const t = cand[Math.min(cand.length - 1, k)] || null;
    const a = t ? Math.atan2(t.y - P.y, t.x - P.x) : rand(TAU), p = projs.get(); if (!p) return;
    Object.assign(p, { kind: w.evo ? 'soul' : 'bolt', x: P.x, y: P.y - 8, vx: Math.cos(a + rand(-0.5, 0.5)) * 150, vy: Math.sin(a + rand(-0.5, 0.5)) * 150, life: 2.2, dmg: s.dmg, pierce: s.pierce - 1, target: t, tuid: t ? t.uid : 0, r: 3, rot: 0 });
    p.hits.length = 0;
  }
  AU.zap();
}
function fireVolley(w, s) {
  if (w.evo) {
    w.rot += 0.35;
    for (let i = 0; i < s.count; i++) { const a = w.rot + (i / s.count) * TAU; shootArrow(a, s, 230); }
  } else {
    const tg = P.moving ? null : nearest(P.x, P.y, 200), base = tg ? Math.atan2(tg.y - P.y, tg.x - P.x) : Math.atan2(P.face.y, P.face.x);
    for (let i = 0; i < s.count; i++) shootArrow(base + (i - (s.count - 1) / 2) * 0.16, s, 240);
    if (w.lvl >= 3) shootArrow(base + Math.PI, s, 240); // rear shot covers your retreat
  }
  AU.twang();
}
function shootArrow(a, s, spd) {
  const p = projs.get(); if (!p) return;
  Object.assign(p, { kind: 'arrow', x: P.x, y: P.y - 6, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: 1.1, dmg: s.dmg, pierce: s.pierce, target: null, r: 3, rot: a });
  p.hits.length = 0;
}
function orbitTick(w, s, dt, area) {
  w.ang += s.speed * dt; w.pos.length = 0;
  const R = s.radius * area;
  for (let i = 0; i < s.count; i++) {
    const a = w.ang + (i / s.count) * TAU, x = P.x + Math.cos(a) * R, y = P.y - 5 + Math.sin(a) * R * 0.8;
    w.pos.push(x, y);
    const n = gridQuery(x, y, w.evo ? 7 : 5, QB);
    for (let k = 0; k < n; k++) { const e = QB[k]; if (e.orbT > G.time) continue; e.orbT = G.time + 0.5; hurt(e, s.dmg, Math.cos(a), Math.sin(a), 110); }
  }
}
function fontTick(w, s, area) {
  const R = s.radius * area, n = gridQuery(P.x, P.y, R, QB); let hit = 0;
  for (let i = 0; i < n; i++) { const e = QB[i]; hurt(e, s.dmg, 0, 0, 0, true); e.slowT = 0.7; hit++; }
  if (w.evo && hit) P.hp = Math.min(P.maxHp, P.hp + Math.min(3, hit * 0.25));
  w.pulse = 1;
}
function fireThunder(w, s, area) {
  const n = gridQuery(P.x, P.y, Math.min(W, H) * 0.55, QB), aoe = s.aoe * area;
  for (let k = 0; k < s.count; k++) {
    let x, y; if (n) { const e = QB[(Math.random() * n) | 0]; x = e.x; y = e.y; } else { x = P.x + rand(-100, 100); y = P.y + rand(-70, 70); }
    const f = addFx('bolt', { x, y, life: 0.2, col: w.evo ? C.gold : C.light, r: aoe });
    if (f) { let cx = x + rand(-20, 20), cy = y - 220; f.pts.push(cx, cy); while (cy < y - 8) { cy += rand(14, 26); cx += rand(-10, 10); f.pts.push(cx, cy); } f.pts.push(x, y); }
    const m = gridQuery(x, y, aoe, QB2); for (let i = 0; i < m; i++) hurt(QB2[i], s.dmg, 0, 0, 0);
    burst(x, y, 8, [C.light, C.white, C.cyan], 60, 0.35);
  }
  G.shake = Math.max(G.shake, w.evo ? 2.5 : 1); AU.thunder();
}
function fireFlask(w, s, area) {
  const n = gridQuery(P.x, P.y, 140, QB);
  for (let k = 0; k < s.count; k++) {
    let tx, ty; if (n && Math.random() < 0.8) { const e = QB[(Math.random() * n) | 0]; tx = e.x; ty = e.y; } else { tx = P.x + rand(-90, 90); ty = P.y + rand(-60, 60); }
    const p = projs.get(); if (!p) return;
    const sx = w.evo ? tx + rand(-20, 20) : P.x, sy = w.evo ? ty - 180 : P.y - 10;
    Object.assign(p, { kind: 'flask', x: sx, y: sy, sx, sy, tx, ty, t: 0, T: w.evo ? 0.5 : 0.6, dmg: s.dmg, life: 2, pierce: 0, target: null, r: s.radius * area, dur: s.dur, rot: 0, evo: w.evo });
    p.hits.length = 0;
  }
}
function fireChain(w, s) {
  const chains = s.twin ? 2 : 1, hitSet = new Set(); let any = false;
  for (let c = 0; c < chains; c++) {
    let from = { x: P.x, y: P.y - 8 }, tgt = null;
    const start = gridQuery(P.x, P.y, 120, QB);
    let bd = 1e9; for (let i = 0; i < start; i++) { const e = QB[i]; if (e.type === 'lantern' || hitSet.has(e.uid)) continue; const d = (e.x - P.x) ** 2 + (e.y - P.y) ** 2; if (d < bd) { bd = d; tgt = e; } }
    if (!tgt) continue;
    const f = addFx('chain', { x: P.x, y: P.y, life: 0.16, col: w.evo ? C.spirit : C.cyan }); if (f) f.pts.push(from.x, from.y);
    for (let b = 0; b <= s.bounce && tgt; b++) {
      hitSet.add(tgt.uid); if (f) f.pts.push(tgt.x, tgt.y - tgt.def.h / 2); any = true;
      const tx = tgt.x, ty = tgt.y; hurt(tgt, s.dmg, 0, 0, 0);
      const m = gridQuery(tx, ty, 75, QB2); let nb = null, nd = 1e9;
      for (let i = 0; i < m; i++) { const e = QB2[i]; if (e.type === 'lantern' || hitSet.has(e.uid)) continue; const d = (e.x - tx) ** 2 + (e.y - ty) ** 2; if (d < nd) { nd = d; nb = e; } }
      tgt = nb;
    }
  }
  if (any) AU.chain();
}

// ---------- projectiles, zones, pickups, particles ----------
function updateProjectiles(dt) {
  const L = projs.list;
  for (let i = L.length - 1; i >= 0; i--) {
    const p = L[i]; p.life -= dt;
    if (p.kind === 'flask') {
      p.t += dt; const k = Math.min(1, p.t / p.T); p.x = lerp(p.sx, p.tx, k); p.y = lerp(p.sy, p.ty, k) - (p.evo ? 0 : Math.sin(k * Math.PI) * 40); p.rot += dt * 12;
      if (k >= 1) {
        const z = zones.get(); if (z) Object.assign(z, { x: p.tx, y: p.ty, r: p.r, dmg: p.dmg, life: p.dur, max: p.dur, tick: 0, evo: p.evo });
        burst(p.tx, p.ty, 14, [C.orange, C.ember, C.gold], 70, 0.5, 30); AU.glass(); projs.kill(i);
      }
      continue;
    }
    if (p.kind === 'bolt' || p.kind === 'soul') {
      let t = p.target; if (!t || t.dead || t.uid !== p.tuid) { t = p.target = (p.life * 10 | 0) % 3 === 0 ? nearest(p.x, p.y, 160) : null; p.tuid = t ? t.uid : 0; }
      if (t) { const a = Math.atan2(t.y - t.def.h / 2 - p.y, t.x - p.x), sp = 190; p.vx = lerp(p.vx, Math.cos(a) * sp, Math.min(1, dt * 7)); p.vy = lerp(p.vy, Math.sin(a) * sp, Math.min(1, dt * 7)); }
      if (Math.random() < 0.4) { const q = parts.get(); if (q) Object.assign(q, { x: p.x, y: p.y, vx: 0, vy: -6, life: 0.3, max: 0.3, col: p.kind === 'soul' ? C.spirit : C.violet, g: 0, sz: 1 }); }
    }
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life <= 0) { projs.kill(i); continue; }
    const n = gridQuery(p.x, p.y + 4, p.r, QB);
    let gone = false;
    for (let k = 0; k < n; k++) {
      const e = QB[k]; if (p.hits.indexOf(e.uid) >= 0) continue;
      p.hits.push(e.uid); const sp = Math.hypot(p.vx, p.vy) || 1;
      hurt(e, p.dmg, p.vx / sp, p.vy / sp, p.kind === 'arrow' ? 70 : 50);
      burst(p.x, p.y, 3, p.kind === 'arrow' ? [C.bone, C.white] : [C.violet, C.white], 40, 0.25);
      if (--p.pierce < 0) { gone = true; break; }
    }
    if (gone) projs.kill(i);
  }
  // enemy bullets
  const B = ebul.list;
  for (let i = B.length - 1; i >= 0; i--) {
    const b = B[i];
    if (b.kind === 'glob') { if (globStep(b, dt)) ebul.kill(i); continue; }
    b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += dt * 14;
    if (b.life <= 0) { ebul.kill(i); continue; }
    const dx = P.x - b.x, dy = P.y - 6 - b.y; if (dx * dx + dy * dy < (b.r + P.r) ** 2) { damagePlayer(b.dmg, b.kind); ebul.kill(i); }
  }
  // burning pools
  const Z = zones.list;
  for (let i = Z.length - 1; i >= 0; i--) {
    const z = Z[i]; z.life -= dt; z.tick -= dt;
    if (z.life <= 0) { zones.kill(i); continue; }
    if (z.tick <= 0) { z.tick = 0.3; const n = gridQuery(z.x, z.y, z.r, QB); for (let k = 0; k < n; k++) hurt(QB[k], z.dmg, 0, 0, 0, true); }
    if (Math.random() < 0.5) { const q = parts.get(); if (q) Object.assign(q, { x: z.x + rand(-z.r, z.r) * 0.8, y: z.y + rand(-z.r, z.r) * 0.6, vx: 0, vy: -rand(15, 35), life: 0.5, max: 0.5, col: pick([C.orange, C.ember, C.gold]), g: 0, sz: 1 }); }
  }
  const F = fx.list; for (let i = F.length - 1; i >= 0; i--) { F[i].life -= dt; if (F[i].life <= 0) fx.kill(i); }
}
function updatePickups(dt) {
  const mag = 36 * P.st.magnet, m2 = mag * mag;
  const L = gems.list;
  for (let i = L.length - 1; i >= 0; i--) {
    const g = L[i], dx = P.x - g.x, dy = P.y - 5 - g.y, d2 = dx * dx + dy * dy;
    g.anim += dt * 4;
    if (!g.pull && d2 < m2) { g.pull = true; g.sp = -40; }
    if (g.pull) {
      g.sp = Math.min(g.sp + 520 * dt, 420); const d = Math.sqrt(d2) || 1; g.x += dx / d * g.sp * dt; g.y += dy / d * g.sp * dt;
      if (Math.random() < 0.35) { const q = parts.get(); if (q) Object.assign(q, { x: g.x, y: g.y, vx: 0, vy: 0, life: 0.25, max: 0.25, col: g.v >= 25 ? C.red : g.v >= 5 ? C.lime : C.cyan, g: 0, sz: 1 }); }
      if (d2 < 36) { addXP(g.v); AU.blip(); gems.kill(i); }
    }
  }
  const I = items.list;
  for (let i = I.length - 1; i >= 0; i--) {
    const it = I[i], dx = P.x - it.x, dy = P.y - 4 - it.y, d2 = dx * dx + dy * dy; it.anim += dt * 8;
    const pullable = it.kind === 'coin' || it.kind === 'bag';
    if (pullable && !it.pull && d2 < m2) it.pull = true;
    if (it.pull) { it.sp = Math.min((it.sp || 0) + 500 * dt, 400); const d = Math.sqrt(d2) || 1; it.x += dx / d * it.sp * dt; it.y += dy / d * it.sp * dt; }
    if (d2 < 100) { collect(it); items.kill(i); }
    else if (d2 > 9e5 && it.kind !== 'chest') items.kill(i);
  }
}
function collect(it) {
  switch (it.kind) {
    case 'coin': case 'bag': { const v = Math.round(it.v * P.st.greed); G.gold += v; AU.coin(); number(P.x, P.y - 20, '+' + v, C.gold); break; }
    case 'chicken': P.hp = Math.min(P.maxHp, P.hp + 30); AU.heal(); number(P.x, P.y - 20, '+30', C.lime); burst(P.x, P.y - 6, 10, [C.lime, C.white], 40, 0.5, -20); break;
    case 'rosary': smite(); banner('HOLY SMITE'); break;
    case 'vacuum': for (const g of gems.list) { g.pull = true; g.sp = 60; } AU.chestOpen(); banner('THE VOID DRAWS ALL SOULS'); G.flash = 0.3; G.flashCol = C.cyan; break;
    case 'chest': openChest(); break;
  }
}
function updateParticles(dt) {
  const L = parts.list;
  for (let i = L.length - 1; i >= 0; i--) { const p = L[i]; p.life -= dt; if (p.life <= 0) { parts.kill(i); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.96; if (!p.g) p.vy *= 0.96; }
  const N = nums.list; for (let i = N.length - 1; i >= 0; i--) { const n = N[i]; n.life -= dt; n.y += n.vy * dt; n.vy *= 0.92; if (n.life <= 0) nums.kill(i); }
}
