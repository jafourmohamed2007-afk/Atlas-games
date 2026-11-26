/* Pocket Grove — a 3D idle garden that keeps growing while you are away.
   three.js scene + KayKit CC0 models (Kay Lousberg) + Bubzi Kit (menus, ads, coins, sound). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import PACK from './kaykit.glb';

const TAU = Math.PI * 2;
const L = (K, o) => (o && (o[K.lang] || o.en)) || '';
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
let K0 = null, TEST = false;
const SHOT = /[?&]shot\b/.test(location.search); // clean renders for thumbnails
const now = () => Date.now() + ((TEST && window.__groveOffset) || 0);

/* ---------------- content ---------------- */
// time in seconds, price/sell in gold
const SEEDS = [
  { id: 'carrot', t: 30, price: 5, sell: 9, xp: 1, lvl: 1, col: '#FF8A1F', leaf: '#3FAE4A', shape: 'root', model: 'food_ingredient_carrot', name: { en: 'Carrot', fr: 'Carotte', ar: 'جزر' } },
  { id: 'lettuce', t: 90, price: 15, sell: 26, xp: 2, lvl: 1, col: '#9BD23C', leaf: '#5FB83A', shape: 'head', model: 'food_ingredient_lettuce', name: { en: 'Lettuce', fr: 'Laitue', ar: 'خس' } },
  { id: 'tomato', t: 300, price: 40, sell: 70, xp: 5, lvl: 2, col: '#E8403A', leaf: '#3E9E45', shape: 'vine', model: 'food_ingredient_tomato', name: { en: 'Tomato', fr: 'Tomate', ar: 'طماطم' } },
  { id: 'onion', t: 900, price: 90, sell: 160, xp: 9, lvl: 3, col: '#E9C99A', leaf: '#6FBF5A', shape: 'root', model: 'food_ingredient_onion', name: { en: 'Onion', fr: 'Oignon', ar: 'بصل' } },
  { id: 'potato', t: 2400, price: 180, sell: 330, xp: 15, lvl: 4, col: '#C9A06A', leaf: '#4FA64A', shape: 'root', model: 'food_ingredient_potato', name: { en: 'Potato', fr: 'Pomme de terre', ar: 'بطاطس' } },
  { id: 'pumpkin', t: 5400, price: 400, sell: 760, xp: 26, lvl: 6, col: '#F07A1E', leaf: '#3E9E45', shape: 'head', model: 'pumpkin_orange', name: { en: 'Pumpkin', fr: 'Citrouille', ar: 'يقطين' } },
  { id: 'goldpump', t: 10800, price: 900, sell: 1750, xp: 45, lvl: 8, col: '#F5C342', leaf: '#3E9E45', shape: 'head', model: 'pumpkin_yellow', name: { en: 'Sun Pumpkin', fr: 'Citrouille soleil', ar: 'يقطين الشمس' } },
  { id: 'cactus', t: 21600, price: 1800, sell: 3600, xp: 70, lvl: 10, col: '#FF6FB5', leaf: '#3FAF6A', shape: 'cactus', name: { en: 'Moon Cactus', fr: 'Cactus lunaire', ar: 'صبار القمر' } },
  { id: 'inkbloom', t: 43200, price: 4000, sell: 8500, xp: 120, lvl: 12, col: '#3EE0FF', leaf: '#2E7F8F', shape: 'flower', name: { en: 'Ink Bloom', fr: 'Fleur d’encre', ar: 'زهرة الحبر' } }
];
const SEED = {}; SEEDS.forEach((s) => { SEED[s.id] = s; });
const MUTS = {
  shiny: { m: 2, p: 0.06, col: '#FFF3A0', name: { en: 'Shiny', fr: 'Brillant', ar: 'لامع' } },
  giant: { m: 3, p: 0.035, col: '#7BC86C', name: { en: 'Giant', fr: 'Géant', ar: 'عملاق' } },
  rainbow: { m: 8, p: 0.006, col: '#FF5FD8', name: { en: 'Rainbow', fr: 'Arc-en-ciel', ar: 'قوس قزح' } },
  wet: { m: 2, p: 0.55, col: '#5AB8FF', name: { en: 'Wet', fr: 'Mouillé', ar: 'مبلّل' } },
  golden: { m: 5, p: 0.3, col: '#FFC93C', name: { en: 'Golden', fr: 'Doré', ar: 'ذهبي' } },
  moonlit: { m: 4, p: 0.35, col: '#B9C8FF', name: { en: 'Moonlit', fr: 'Lunaire', ar: 'قمري' } }
};
const MUT_ORDER = ['shiny', 'giant', 'rainbow', 'wet', 'golden', 'moonlit'];
const PETS = {
  bunny: { w: 50, col: '#FFFFFF', name: { en: 'Bunny', fr: 'Lapin', ar: 'أرنب' }, bonus: { en: 'Plants grow 10% faster', fr: 'Les plantes poussent 10 % plus vite', ar: 'النباتات تنمو أسرع بـ10%' } },
  bee: { w: 30, col: '#FFD23C', name: { en: 'Bee', fr: 'Abeille', ar: 'نحلة' }, bonus: { en: '+50% mutation chance', fr: '+50 % de chances de mutation', ar: '+50% فرصة التحوّل' } },
  hedgehog: { w: 15, col: '#A0785A', name: { en: 'Hedgehog', fr: 'Hérisson', ar: 'قنفذ' }, bonus: { en: 'Harvests sell for 15% more', fr: 'Les récoltes valent 15 % de plus', ar: 'المحاصيل تُباع أغلى بـ15%' } },
  firefly: { w: 5, col: '#C8FF5A', name: { en: 'Firefly', fr: 'Luciole', ar: 'يراعة' }, bonus: { en: '+25% XP, glows at night', fr: '+25 % d’XP, brille la nuit', ar: '+25% خبرة، تتوهّج ليلاً' } }
};
const EGG_PRICE = 1500, EGG_LVL = 5, EGG_TIME = 20 * 60 * 1000, GRID = 4, START_PLOTS = 6, BOOST_MS = 15 * 60 * 1000, BOOST_CD = 4 * 60 * 1000;
const plotCost = (k) => Math.round(60 * Math.pow(1.75, k));
const xpNeed = (lv) => Math.round(10 * Math.pow(lv, 1.7));

/* ---------------- real-clock events (local time, so players come back at set times) ---------------- */
const RAIN_MIN = 30, RAIN_LEN = 15; // Ink Rain: every even hour at :30 for 15 minutes
function rainAt(ms) { const d = new Date(ms); return d.getHours() % 2 === 0 && d.getMinutes() >= RAIN_MIN && d.getMinutes() < RAIN_MIN + RAIN_LEN; }
function goldenAt(ms) { return new Date(ms).getHours() === 19; }
function moonAt(ms) { return new Date(ms).getHours() === 21; }
function rainOverlap(a, b) { // did any Ink Rain window overlap [a, b]?
  const d = new Date(a); d.setMinutes(0, 0, 0);
  for (let t = d.getTime(); t <= b; t += 3600000) { const h = new Date(t); if (h.getHours() % 2) continue; const s = t + RAIN_MIN * 60000, e = s + RAIN_LEN * 60000; if (s < b && e > a) return true; }
  return false;
}
function nextStart(ms, test) { let t = Math.ceil(ms / 60000) * 60000; for (let i = 0; i < 60 * 26; i++, t += 60000) if (test(t) && !test(t - 60000)) return t; return t; }
function eventNow(ms) { return goldenAt(ms) ? 'golden' : moonAt(ms) ? 'moon' : rainAt(ms) ? 'rain' : null; }
function eventEnd(ms, ev) { const test = ev === 'rain' ? rainAt : ev === 'golden' ? goldenAt : moonAt; let t = Math.ceil(ms / 60000) * 60000; while (test(t)) t += 60000; return t; }
let _nx = null, _nxKey = -1;
function nextEvent(ms) {
  const key = Math.floor(ms / 60000); if (key === _nxKey && _nx && _nx[1] > ms) return _nx; _nxKey = key;
  const c = [['rain', nextStart(ms, rainAt)], ['golden', nextStart(ms, goldenAt)], ['moon', nextStart(ms, moonAt)]];
  c.sort((a, b) => a[1] - b[1]); return (_nx = c[0]);
}

/* ---------------- save state ---------------- */
let S = null;
function freshState() {
  const plots = []; for (let i = 0; i < GRID * GRID; i++) plots.push(null);
  return { v: 1, gold: 40, xp: 0, lv: 1, seeds: { carrot: 4, lettuce: 1 }, plots: plots, open: START_PLOTS, album: {}, stock: null, pets: [], egg: null, last: now(), day: '', boostAt: 0, harvested: 0, tut: 0, orders: null, streak: 0, sprinkler: false, decor: {} };
}
function load() {
  let s = K0.store.get('grove', null);
  if (!s || typeof s !== 'object' || s.v !== 1 || !Array.isArray(s.plots)) s = freshState();
  const f = freshState(); for (const k in f) if (s[k] === undefined) s[k] = f[k];
  s.plots = s.plots.slice(0, GRID * GRID); while (s.plots.length < GRID * GRID) s.plots.push(null);
  s.plots = s.plots.map((p) => (p && SEED[p.seed] ? p : null));
  s.open = clamp(s.open | 0, START_PLOTS, GRID * GRID);
  return s;
}
function save() { if (S) { S.last = now(); K0.store.set('grove', S); } }

/* ---------------- deterministic hourly shop ---------------- */
function rng(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function hourKey(ms) { return Math.floor(ms / 3600000); }
function makeStock(key) {
  const r = rng(key * 2654435761 + 17), ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  return { key: key, left: { carrot: 25, lettuce: 15, tomato: ri(4, 10), onion: ri(3, 7), potato: ri(2, 5), pumpkin: ri(1, 3), goldpump: r() < 0.5 ? ri(1, 2) : 0, cactus: r() < 0.3 ? 1 : 0, inkbloom: r() < 0.12 ? 1 : 0 } };
}
function stock() { const k = hourKey(now()); if (!S.stock || (S.stock.key !== k && !S.stock.forced) || (S.stock.forced && S.stock.key < k)) S.stock = makeStock(k); return S.stock; }

/* ---------------- daily orders (same for everyone each day) ---------------- */
const WHO = [{ n: 'Mila', col: '#FF8A5B' }, { n: 'Tom', col: '#4AA3FF' }, { n: 'Zara', col: '#B06CFF' }, { n: 'Omar', col: '#22A06B' }, { n: 'Lina', col: '#FF5FA2' }];
const QTY = { carrot: [6, 12], lettuce: [4, 9], tomato: [3, 6], onion: [2, 4], potato: [2, 3], pumpkin: [1, 2], goldpump: [1, 1], cactus: [1, 1], inkbloom: [1, 1] };
const SPRINKLER = { price: 2500, lvl: 5 };
function dayKey(ms) { const d = new Date(ms); return d.getFullYear() * 1000 + Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(d.getFullYear(), 0, 0)) / 864e5); }
function makeOrders(key, lv) {
  const r = rng(key * 7919 + 3), pool = SEEDS.filter((s) => s.lvl <= Math.max(1, lv)).slice(-4), list = [], used = {};
  for (let i = 0; i < 3; i++) {
    let sd = pool[Math.floor(r() * pool.length)]; for (let k = 0; k < 4 && used[sd.id] && pool.length > 1; k++) sd = pool[Math.floor(r() * pool.length)]; used[sd.id] = 1;
    const q = QTY[sd.id], need = q[0] + Math.floor(r() * (q[1] - q[0] + 1));
    list.push({ seed: sd.id, need: need, have: 0, claimed: false, gold: Math.round(need * sd.sell * 1.5 + 20), xp: need * sd.xp * 2, who: Math.floor(r() * WHO.length) });
  }
  return list;
}
function orders() { const k = dayKey(now()); if (!S.orders || S.orders.day !== k) S.orders = { day: k, list: makeOrders(k, S.lv), bonus: false }; return S.orders; }
function claimable() { return orders().list.filter((o) => !o.claimed && o.have >= o.need).length; }
function claim(K, k) {
  const o = orders().list[k]; if (!o || o.claimed || o.have < o.need) return false;
  o.claimed = true; S.gold += o.gold; S.earned = (S.earned || 0) + o.gold; addXp(K, o.xp); K.sfx('reward'); K.confetti(40); K.addCoins(2);
  const od = orders();
  if (!od.bonus && od.list.every((x) => x.claimed)) { od.bonus = true; const rare = S.lv >= 8 ? 'goldpump' : 'pumpkin'; S.seeds[rare] = (S.seeds[rare] || 0) + 2; S.gold += 200; K.toast(K.t('ordersDone') + ' 2× ' + L(K, SEED[rare].name) + ' + 200'); K.confetti(90); }
  K.setScore(S.earned || 0); save(); return true;
}
function buySprinkler(K) {
  if (S.sprinkler) return; if (S.lv < SPRINKLER.lvl) { K.sfx('wrong'); K.toast(K.t('needLv') + ' ' + SPRINKLER.lvl); return; }
  if (S.gold < SPRINKLER.price) { K.sfx('wrong'); K.toast(K.t('needGold')); return; }
  S.gold -= SPRINKLER.price; S.sprinkler = true; buildSprinkler(); S.plots.forEach((p) => { if (p && !p.w && plotProgress(p, now()) < 1) { p.w = true; p.t0 -= Math.min(p.t0 + p.dur - now(), p.dur * 0.2); } });
  K.sfx('reward'); K.confetti(50); K.toast(K.t('sprinklerD')); save();
}
function harvestAll(K) { let n = 0; for (let i = 0; i < S.open; i++) { const p = S.plots[i]; if (p && plotProgress(p, now()) >= 1) { harvest(K, i); n++; } } return n; }

/* ---------------- game rules ---------------- */
const hasPet = (t) => S.pets.some((p) => p.type === t);
const growMul = () => (hasPet('bunny') ? 0.9 : 1);
function plotProgress(p, t) { return clamp((t - p.t0) / p.dur, 0, 1); }
function finalize(p) { // roll mutations once, when a plant first becomes ready
  if (p.mut) return;
  const luck = hasPet('bee') ? 1.5 : 1, m = [];
  if (Math.random() < MUTS.shiny.p * luck) m.push('shiny');
  if (Math.random() < MUTS.giant.p * luck) m.push('giant');
  if (Math.random() < MUTS.rainbow.p * luck) m.push('rainbow');
  if (rainOverlap(p.t0, p.t0 + p.dur) && Math.random() < MUTS.wet.p) m.push('wet');
  p.mut = m;
}
function valueOf(p) {
  let v = SEED[p.seed].sell; (p.mut || []).forEach((m) => { v *= MUTS[m].m; });
  if (hasPet('hedgehog')) v *= 1.15; v *= 1 + 0.05 * Math.max(0, S.pets.length - 1); v *= charm();
  return Math.round(v);
}
function addXp(K, n) {
  S.xp += Math.round(n * (hasPet('firefly') ? 1.25 : 1));
  while (S.xp >= xpNeed(S.lv)) { S.xp -= xpNeed(S.lv); S.lv++; levelUp(K); }
}

/* ---------------- three.js scene ---------------- */
let R = null, scene, cam, sun, hemi, M = {}, plotG = [], camYaw = 0.55, camYawT = 0.55, sky, skyTex, skyCtx, rain, lanterns = [], clouds = [], petObjs = [], eggObj = null, flyers = [], pond, sel = -1, glowRing, ready3d = false, webglOk = true;
const BARROW = new THREE.Vector3(5.0, 0, 3.0), PLOT_SP = 1.8, GX = -0.5, GZ = -0.7;
function plotPos(i) { const gx = i % GRID, gz = GRID - 1 - Math.floor(i / GRID); /* plot 0 = front row, unlocked first */ return new THREE.Vector3((gx - (GRID - 1) / 2) * PLOT_SP + GX, 0, (gz - (GRID - 1) / 2) * PLOT_SP + GZ); }
const mat = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: 0.9 }, o || {}));
function shadowAll(o, cast, recv) { o.traverse((c) => { if (c.isMesh) { c.castShadow = cast; c.receiveShadow = recv; } }); return o; }
function place(name, x, z, h, rot, y) {
  const src = M[name]; if (!src) return null;
  const o = src.clone(true); const b = new THREE.Box3().setFromObject(o), sz = b.getSize(new THREE.Vector3());
  const s = h / (sz.y || 1); o.scale.setScalar(s); o.position.set(x, (y || 0) - b.min.y * s, z); o.rotation.y = rot || 0;
  shadowAll(o, true, true); scene.add(o); return o;
}
function modelClone(name, h) { const o = M[name].clone(true), b = new THREE.Box3().setFromObject(o), s = h / ((b.max.y - b.min.y) || 1); o.scale.setScalar(s); o.userData.base = s; o.userData.minY = b.min.y * s; return shadowAll(o, true, false); }

function buildScene(K) {
  try { R = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }); }
  catch (e) { webglOk = false; return; }
  R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  skyCtx = document.createElement('canvas'); skyCtx.width = 2; skyCtx.height = 256; skyTex = new THREE.CanvasTexture(skyCtx); skyTex.colorSpace = THREE.SRGBColorSpace; skyCtx = skyCtx.getContext('2d'); scene.background = skyTex;
  scene.fog = new THREE.Fog('#bfe6ff', 26, 60);
  cam = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  hemi = new THREE.HemisphereLight('#dff1ff', '#5f8f45', 1.5); scene.add(hemi);
  sun = new THREE.DirectionalLight('#fff1d6', 2.3); sun.position.set(6, 12, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 10; sc.bottom = -10; sc.near = 1; sc.far = 40; sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.02;
  scene.add(sun); scene.add(sun.target);
  // floating island: grass top, layered dirt underneath
  const top = new THREE.Mesh(new THREE.CylinderGeometry(7.4, 7.1, 0.6, 16), mat('#79C25F')); top.position.y = -0.3; top.receiveShadow = true; scene.add(top);
  const d1 = new THREE.Mesh(new THREE.CylinderGeometry(7.1, 5.0, 1.6, 16), mat('#8A5A3C')); d1.position.y = -1.4; scene.add(d1);
  const d2 = new THREE.Mesh(new THREE.ConeGeometry(5.2, 3.4, 12), mat('#6E4530')); d2.rotation.x = Math.PI; d2.position.y = -3.9; scene.add(d2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = 7.05; const g = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 5), mat('#79C25F')); g.rotation.x = Math.PI; g.position.set(Math.cos(a) * r, -0.75, Math.sin(a) * r); scene.add(g); }
  // pond
  pond = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.05, 20), mat('#58B7F0', { roughness: 0.2, metalness: 0.1, emissive: '#10304a', emissiveIntensity: 0.25 })); pond.position.set(-5.3, 0.01, 3.4); pond.receiveShadow = true; scene.add(pond);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.12, 5, 20), mat('#9A9A9A')); rim.rotation.x = Math.PI / 2; rim.position.set(-5.3, 0.04, 3.4); scene.add(rim);
  glowRing = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.04, 24), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.8, side: THREE.DoubleSide })); glowRing.rotation.x = -Math.PI / 2; glowRing.position.y = 0.3; glowRing.visible = false; scene.add(glowRing);
  // rain
  const rg = new THREE.BufferGeometry(), N = 500, pos = new Float32Array(N * 6);
  for (let i = 0; i < N; i++) { const x = (Math.random() - 0.5) * 18, z = (Math.random() - 0.5) * 18, y = Math.random() * 12; pos.set([x, y, z, x - 0.05, y - 0.45, z], i * 6); }
  rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#7FC4FF', transparent: true, opacity: 0.65 })); rain.visible = false; scene.add(rain);
  // plots
  const soil = mat('#8B5A3A'), soilDark = mat('#6E432A'), frame = mat('#A9784F'), plotGeo = new THREE.BoxGeometry(1.58, 0.22, 1.58), rowGeo = new THREE.CapsuleGeometry(0.1, 1.15, 2, 6), stake = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 5);
  for (let i = 0; i < GRID * GRID; i++) {
    const g = new THREE.Group(), p = plotPos(i); g.position.copy(p); scene.add(g);
    const box = new THREE.Mesh(plotGeo, soil); box.position.y = 0.11; box.castShadow = false; box.receiveShadow = true; g.add(box);
    const rows = new THREE.Group(); for (let r = 0; r < 3; r++) { const m = new THREE.Mesh(rowGeo, soilDark); m.rotation.z = Math.PI / 2; m.scale.set(1, 1, 0.6); m.position.set(0, 0.22, (r - 1) * 0.45); m.receiveShadow = true; rows.add(m); } g.add(rows);
    const lock = new THREE.Group(); [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].forEach((q) => { const s = new THREE.Mesh(stake, frame); s.position.set(q[0], 0.17, q[1]); s.castShadow = true; lock.add(s); }); g.add(lock);
    const plant = new THREE.Group(); plant.position.y = 0.26; g.add(plant);
    plotG.push({ g: g, box: box, rows: rows, lock: lock, plant: plant, key: '' });
  }
  ready3d = false;
  const buf = PACK.buffer.slice(PACK.byteOffset, PACK.byteOffset + PACK.byteLength);
  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(buf, '', (gltf) => {
    gltf.scene.children.slice().forEach((c) => { M[c.name] = c; });
    decorate(); ready3d = true; syncAll(); buildSprinkler(); syncDecor();
  }, (err) => { console.error('grove models', err); ready3d = true; });
}
function decorate() {
  // a clean wooden fence around the plots (posts + two rails), open gate in front
  const fx0 = plotPos(0).x - 1.15, fx1 = plotPos(GRID - 1).x + 1.15, fz0 = plotPos(GRID * (GRID - 1)).z - 1.15, fz1 = plotPos(0).z + 1.15, wood = mat('#A26B43'), dark = mat('#7E5133');
  const postG = new THREE.BoxGeometry(0.14, 0.62, 0.14), railG = new THREE.BoxGeometry(1, 0.08, 0.06), gx = (fx0 + fx1) / 2;
  const side = (ax, az, bx, bz, gap) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 1.1)), ang = Math.atan2(bz - az, bx - ax);
    for (let i = 0; i <= n; i++) { const x = lerp(ax, bx, i / n), z = lerp(az, bz, i / n); if (gap && Math.abs(x - gx) < 0.6) continue; const p = new THREE.Mesh(postG, dark); p.position.set(x, 0.31, z); p.castShadow = true; scene.add(p); }
    for (let i = 0; i < n; i++) { const x = lerp(ax, bx, (i + 0.5) / n), z = lerp(az, bz, (i + 0.5) / n); if (gap && Math.abs(x - gx) < 0.9) continue; [0.22, 0.46].forEach((y) => { const r = new THREE.Mesh(railG, wood); r.scale.x = len / n; r.position.set(x, y, z); r.rotation.y = -ang; r.castShadow = true; scene.add(r); }); }
  };
  side(fx0, fz0, fx1, fz0); side(fx0, fz1, fx1, fz1, true); side(fx0, fz0, fx0, fz1); side(fx1, fz0, fx1, fz1);
  [['tree_single_A', -5.6, -4.2, 2.4], ['tree_single_B', -3.4, -5.9, 2.1], ['trees_A_medium', 4.9, -4.6, 2.2], ['trees_B_small', 6.3, -2.0, 1.5], ['tree_single_A', 2.2, -6.4, 2.0], ['trees_A_small', -6.6, -1.6, 1.5], ['tree_pine_orange_small', 6.6, 0.6, 1.2], ['tree_pine_yellow_small', -0.6, -6.7, 1.2]]
    .forEach((t, i) => place(t[0], t[1], t[2], t[3], i * 1.3));
  [['rock_single_A', -3.0, 6.3, 0.5], ['rock_single_C', 6.7, 2.0, 0.45], ['rock_single_B', -6.7, 1.6, 0.55], ['rock_single_D', 4.2, 5.6, 0.35]].forEach((t, i) => place(t[0], t[1], t[2], t[3], i));
  place('waterlily_A', -5.0, 3.0, 0.06, 0.4, 0.03); place('waterlily_B', -5.7, 3.8, 0.06, 1.2, 0.03); place('waterplant_A', -6.5, 2.6, 0.6, 0); place('waterplant_B', -4.3, 4.4, 0.5, 1);
  const wb = place('wheelbarrow', BARROW.x, BARROW.z, 0.8, -0.7); if (wb) wb.userData.barrow = true;
  place('crate_open', 6.0, 4.0, 0.5, 0.3); place('sack', 4.0, 4.6, 0.5, 0.8); place('barrel', 6.2, -0.6, 0.7, 0); place('bucket_water', -3.9, 3.3, 0.35, 0);
  place('bench', 0.4, 5.9, 0.45, Math.PI); place('lantern_standing', -1.2, 5.8, 0.75, 0); place('post_lantern', 4.4, -3.2, 1.4, -1.2); place('post_lantern', -4.8, -2.6, 1.4, 1.9);
  place('resource_lumber', -6.2, -3.2, 0.35, 0.5); place('bush', 2.0, 6.0, 0.6, 0); place('path_A', gx, 4.0, 0.05, 0, 0.01); place('path_B', gx, 4.8, 0.05, 0.3, 0.01);
  ['food_ingredient_carrot', 'food_ingredient_tomato', 'food_ingredient_onion'].forEach((n, i) => { const o = place(n, 5.9 + i * 0.12, 3.95 + (i - 1) * 0.12, 0.25, i, 0.25); if (o) o.rotation.z = 0.5; });
  [[4.4, -3.2], [-4.8, -2.6], [-1.2, 5.8]].forEach((q) => { const l = new THREE.PointLight('#FFC870', 0, 6, 1.6); l.position.set(q[0], 1.3, q[1]); scene.add(l); lanterns.push(l); });
  for (let i = 0; i < 6; i++) { const c = place(i % 2 ? 'cloud_small' : 'cloud_big', 0, 0, 0.9 + (i % 3) * 0.3, 0); if (c) { c.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } }); clouds.push({ o: c, a: i / 6 * TAU, r: 11 + (i % 3) * 2.5, y: -2.5 + (i % 4) * 2.2, s: 0.02 + (i % 3) * 0.012 }); } }
}

/* ---------------- plant visuals ---------------- */
const leafGeo = new THREE.ConeGeometry(0.07, 0.5, 4), sproutGeo = new THREE.SphereGeometry(0.07, 6, 4), stakeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 5), cactusGeo = new THREE.CapsuleGeometry(0.13, 0.4, 3, 6), petalGeo = new THREE.SphereGeometry(0.12, 6, 4);
const leafMats = {};
function leafMat(c) { return leafMats[c] || (leafMats[c] = mat(c)); }
function buildPlant(pg, p) {
  const pl = pg.plant; while (pl.children.length) pl.remove(pl.children[0]);
  pl.scale.setScalar(1); pl.userData = {};
  if (!p) return;
  const sd = SEED[p.seed], lm = leafMat(sd.leaf), parts = { leaves: new THREE.Group(), prod: new THREE.Group(), mats: [] };
  pl.add(parts.leaves); pl.add(parts.prod); pl.userData = parts;
  const n = sd.shape === 'head' ? 7 : 5;
  if (sd.shape !== 'cactus' && sd.shape !== 'flower') for (let i = 0; i < n; i++) { const l = new THREE.Mesh(leafGeo, lm); const a = i / n * TAU; l.position.set(Math.cos(a) * 0.08, 0.2, Math.sin(a) * 0.08); l.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); l.scale.set(1, 1, 0.45); l.castShadow = true; parts.leaves.add(l); }
  const own = (o) => { o.traverse((c) => { if (c.isMesh) { c.material = c.material.clone(); parts.mats.push(c.material); } }); return o; };
  if (sd.shape === 'root' || sd.shape === 'head') {
    const o = own(modelClone(sd.model, sd.shape === 'head' ? (sd.id === 'lettuce' ? 0.55 : 0.7) : 0.55));
    if (sd.shape === 'root') { o.rotation.z = sd.id === 'carrot' ? Math.PI : 0; o.position.y = sd.id === 'carrot' ? 0.12 : -0.05; }
    else o.position.y = -o.userData.minY - 0.02;
    parts.prod.add(o);
  } else if (sd.shape === 'vine') {
    const s = new THREE.Mesh(stakeGeo, mat('#8A6A44')); s.position.y = 0.45; s.castShadow = true; parts.leaves.add(s);
    for (let i = 0; i < 3; i++) { const o = own(modelClone(sd.model, 0.24)); const a = i * 2.1; o.position.set(Math.cos(a) * 0.17, 0.32 + i * 0.18, Math.sin(a) * 0.17); parts.prod.add(o); }
  } else if (sd.shape === 'cactus') {
    const cm = mat('#3FAF6A'); const c1 = new THREE.Mesh(cactusGeo, cm); c1.position.y = 0.33; c1.castShadow = true; parts.leaves.add(c1);
    [[-0.17, 0.32, -0.5], [0.17, 0.42, 0.5]].forEach((q) => { const a = new THREE.Mesh(cactusGeo, cm); a.scale.setScalar(0.55); a.position.set(q[0], q[1], 0); a.rotation.z = q[2]; a.castShadow = true; parts.leaves.add(a); });
    const fm = mat('#FF6FB5', { emissive: '#ff6fb5', emissiveIntensity: 0.25 }); parts.mats.push(fm);
    for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(petalGeo, fm); const a = i / 5 * TAU; f.position.set(Math.cos(a) * 0.09, 0.72, Math.sin(a) * 0.09); f.scale.set(0.8, 0.5, 0.8); parts.prod.add(f); }
  } else if (sd.shape === 'flower') {
    const st = new THREE.Mesh(stakeGeo, mat('#2E7F8F')); st.position.y = 0.45; st.scale.set(1.3, 1, 1.3); parts.leaves.add(st);
    for (let i = 0; i < 2; i++) { const l = new THREE.Mesh(leafGeo, lm); l.position.set(i ? 0.12 : -0.12, 0.3, 0); l.rotation.z = i ? -0.9 : 0.9; l.scale.set(1.4, 1, 0.4); parts.leaves.add(l); }
    const pm = mat('#3EE0FF', { emissive: '#3EE0FF', emissiveIntensity: 0.55 }), cm = mat('#B06CFF', { emissive: '#B06CFF', emissiveIntensity: 0.6 }); parts.mats.push(pm, cm);
    for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(petalGeo, pm); const a = i / 6 * TAU; f.position.set(Math.cos(a) * 0.17, 0.92, Math.sin(a) * 0.17); f.scale.set(1.2, 0.45, 0.8); f.rotation.y = -a; parts.prod.add(f); }
    const core = new THREE.Mesh(petalGeo, cm); core.position.y = 0.94; parts.prod.add(core);
  }
  parts.mats.forEach((m) => { m.userData.c0 = m.color.clone(); m.userData.e0 = m.emissive ? m.emissive.clone() : null; m.userData.ei = m.emissiveIntensity || 0; });
  if (p.mut && p.mut.length) applyMutLook(pl, p.mut);
}
function applyMutLook(pl, mut) {
  const parts = pl.userData; if (!parts.mats) return;
  if (mut.indexOf('giant') >= 0) pl.userData.giant = true;
  parts.mats.forEach((m) => {
    m.color.copy(m.userData.c0);
    if (mut.indexOf('golden') >= 0) { m.color.lerp(new THREE.Color('#FFD54A'), 0.65); m.emissive = new THREE.Color('#8a6400'); m.emissiveIntensity = 0.45; }
    else if (mut.indexOf('moonlit') >= 0) { m.color.lerp(new THREE.Color('#C8D8FF'), 0.55); m.emissive = new THREE.Color('#3050c0'); m.emissiveIntensity = 0.5; }
    else if (mut.indexOf('wet') >= 0) m.color.lerp(new THREE.Color('#7FB8FF'), 0.3);
  });
  if (mut.indexOf('shiny') >= 0 || mut.indexOf('rainbow') >= 0) {
    const g = new THREE.BufferGeometry(), n = 8, ps = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) ps.set([(Math.random() - 0.5) * 0.8, 0.2 + Math.random() * 0.7, (Math.random() - 0.5) * 0.8], i * 3);
    g.setAttribute('position', new THREE.BufferAttribute(ps, 3));
    const sp = new THREE.Points(g, new THREE.PointsMaterial({ color: '#FFF6B0', size: 0.13, map: starTex(), transparent: true, depthWrite: false })); sp.name = 'sparkle'; pl.add(sp);
  }
}
let _star = null;
function starTex() {
  if (_star) return _star; const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  x.translate(16, 16); x.fillStyle = '#fff'; x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 4 : 15, a = i * Math.PI / 4; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.fill();
  _star = new THREE.CanvasTexture(c); return _star;
}
function syncPlot(i) {
  if (!R || !plotG[i]) return; const pg = plotG[i], p = S.plots[i], open = i < S.open;
  pg.rows.visible = open; pg.box.visible = open; pg.lock.visible = !open;
  const key = open && p ? p.seed + '|' + (p.mut ? p.mut.join(',') : '-') + '|' + p.t0 : '';
  if (key !== pg.key) { pg.key = key; if (ready3d || !p) buildPlant(pg, open ? p : null); else pg.key = ''; }
}
function syncAll() { for (let i = 0; i < GRID * GRID; i++) syncPlot(i); syncPets(); }

/* ---------------- garden decorations (bought once with gold; each adds +3% harvest gold) ---------------- */
const DECOR = [
  { id: 'flowers', price: 150, lvl: 1, col: '#FF6FB5', name: { en: 'Flower Beds', fr: 'Parterres de fleurs', ar: 'أحواض الزهور' }, desc: { en: 'Colorful flowers by the gate', fr: 'Des fleurs colorées près du portail', ar: 'زهور ملوّنة عند البوابة' } },
  { id: 'gnome', price: 350, lvl: 2, col: '#E8403A', name: { en: 'Garden Gnome', fr: 'Nain de jardin', ar: 'قزم الحديقة' }, desc: { en: 'A tiny friend who guards the carrots', fr: 'Un petit ami qui garde les carottes', ar: 'صديق صغير يحرس الجزر' } },
  { id: 'lights', price: 700, lvl: 3, col: '#FFD23C', name: { en: 'Fairy Lights', fr: 'Guirlande lumineuse', ar: 'أضواء الزينة' }, desc: { en: 'They glow on the fence at night', fr: 'Elles brillent sur la clôture la nuit', ar: 'تتوهّج على السياج ليلاً' } },
  { id: 'scarecrow', price: 1000, lvl: 4, col: '#D9534F', name: { en: 'Scarecrow', fr: 'Épouvantail', ar: 'فزّاعة' }, desc: { en: 'Keeps the crows away', fr: 'Fait fuir les corbeaux', ar: 'تُبعد الغربان' } },
  { id: 'pumpkins', price: 1600, lvl: 5, col: '#F07A1E', name: { en: 'Pumpkin Pile', fr: 'Tas de citrouilles', ar: 'كومة يقطين' }, desc: { en: 'A cozy harvest corner', fr: 'Un coin de récolte douillet', ar: 'ركن حصاد دافئ' } },
  { id: 'fountain', price: 2500, lvl: 6, col: '#58B7F0', name: { en: 'Stone Fountain', fr: 'Fontaine en pierre', ar: 'نافورة حجرية' }, desc: { en: 'Splashing water all day long', fr: 'De l’eau qui coule toute la journée', ar: 'ماء يتدفّق طوال اليوم' } },
  { id: 'windmill', price: 4000, lvl: 7, col: '#F3E6CF', name: { en: 'Windmill', fr: 'Moulin à vent', ar: 'طاحونة هواء' }, desc: { en: 'Turns with the breeze. Tap it!', fr: 'Tourne avec le vent. Touche-le !', ar: 'تدور مع النسيم. المسها!' } },
  { id: 'cactus', price: 6000, lvl: 9, col: '#3FAF6A', name: { en: 'Cactus Corner', fr: 'Coin des cactus', ar: 'ركن الصبار' }, desc: { en: 'A little desert on your island', fr: 'Un petit désert sur ton île', ar: 'صحراء صغيرة على جزيرتك' } },
  { id: 'balloon', price: 10000, lvl: 10, col: '#FF5A5A', name: { en: 'Hot-Air Balloon', fr: 'Montgolfière', ar: 'منطاد' }, desc: { en: 'Floats in the sky over your island', fr: 'Flotte dans le ciel au-dessus de ton île', ar: 'يطفو في السماء فوق جزيرتك' } },
  { id: 'crystal', price: 18000, lvl: 12, col: '#3EE0FF', name: { en: 'Ink Crystal', fr: 'Cristal d’encre', ar: 'بلّورة الحبر' }, desc: { en: 'A magic crystal glowing over the pond', fr: 'Un cristal magique qui brille sur la mare', ar: 'بلّورة سحرية تتوهّج فوق البركة' } }
];
const DEC = {}; DECOR.forEach((d) => { DEC[d.id] = d; });
const CHARM = 0.03; // +3% harvest gold per decoration
// spot: x, z, rotation, height (for the floating label)
const DSPOT = { flowers: [-0.5, 3.75, 0, 0.5], gnome: [-2.5, 5.0, 0.5, 1.1], lights: [0, 0, 0, 0.9], scarecrow: [4.3, 0.9, 0.55, 1.7], pumpkins: [4.7, -1.7, 0.3, 0.8], fountain: [-5.7, 0.6, 0, 1.2], windmill: [-1.9, -5.9, 0.35, 2.8], cactus: [1.1, -5.9, 0.2, 1.1], balloon: [2.5, -5.3, 0, 3.6], crystal: [-5.3, 3.4, 0, 2.0] };
const decorCount = () => DECOR.filter((d) => S.decor && S.decor[d.id]).length;
const charm = () => 1 + CHARM * decorCount();
function buyDecor(K, id) {
  const d = DEC[id]; if (!d || S.decor[id]) return false;
  if (S.lv < d.lvl) { K.sfx('wrong'); K.toast(K.t('needLv') + ' ' + d.lvl); return false; }
  if (S.gold < d.price) { K.sfx('wrong'); K.toast(K.t('needGold')); return false; }
  S.gold -= d.price; S.decor[id] = now(); sheet = null; syncDecor();
  K.sfx('reward'); K.confetti(60); K.haptic(30);
  const o = decorObjs[id], sp = DSPOT[id];
  if (o) { const s = screenOf(new THREE.Vector3(sp[0], sp[3] + (id === 'lights' ? 0 : 0.2), id === 'lights' ? plotPos(0).z + 1.15 : sp[1])); fx.push({ x: s.x, y: s.y, txt: L(K, d.name), col: '#FFFFFF', t: 0, big: true }); fx.push({ x: s.x, y: s.y + 32, txt: '+3% ' + K.t('charm'), col: '#FFE15A', t: 0 }); }
  K.setScore(S.earned || 0); save(); return true;
}
let decorObjs = {}, decorHit = [], _glow = null;
function glowTex() {
  if (_glow) return _glow; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  _glow = new THREE.CanvasTexture(c); return _glow;
}
function decorMesh(id) {
  const g = new THREE.Group(), u = g.userData;
  const add = (geo, m, x, y, z, o) => { const k = new THREE.Mesh(geo, m); k.position.set(x, y, z); if (o && o.r) k.rotation.set(o.r[0], o.r[1], o.r[2]); if (o && o.s) k.scale.set(o.s[0], o.s[1], o.s[2]); (o && o.to || g).add(k); return k; };
  const model = (name, x, z, h, rot, y) => { if (!M[name]) return null; const o = modelClone(name, h); o.position.set(x, (y || 0) - o.userData.minY, z); o.rotation.y = rot || 0; g.add(o); return o; };
  if (id === 'flowers') {
    const soil = mat('#6E432A'), stem = mat('#3E9E45'), cols = ['#FF6FB5', '#FFD23C', '#FFFFFF', '#B06CFF', '#FF8A5B'].map((c) => mat(c)), stemG = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), headG = new THREE.SphereGeometry(0.09, 6, 4), bedG = new THREE.BoxGeometry(1.5, 0.12, 0.5), leafG = new THREE.SphereGeometry(0.08, 5, 3);
    [-2.1, 2.1].forEach((bx, b) => {
      add(bedG, soil, bx, 0.06, 0);
      for (let i = 0; i < 8; i++) { const x = bx - 0.6 + i * 0.17, z = i % 2 ? 0.1 : -0.1, h = 0.2 + ((i * 7 + b) % 3) * 0.06; add(stemG, stem, x, 0.12 + h / 2, z, { s: [1, h / 0.3, 1] }); add(leafG, stem, x + 0.04, 0.16, z, { s: [1, 0.4, 0.6] }); add(headG, cols[(i + b * 2) % 5], x, 0.14 + h, z, { s: [1, 0.7, 1] }); }
    });
  } else if (id === 'gnome') {
    add(new THREE.CylinderGeometry(0.08, 0.17, 0.32, 8), mat('#3B6FD6'), 0, 0.16, 0);
    add(new THREE.SphereGeometry(0.11, 8, 6), mat('#F6C9A0'), 0, 0.38, 0);
    add(new THREE.ConeGeometry(0.1, 0.22, 7), mat('#FFFFFF'), 0, 0.28, 0.07, { r: [Math.PI - 0.35, 0, 0] });
    add(new THREE.ConeGeometry(0.12, 0.34, 8), mat('#E8403A'), 0, 0.6, -0.02, { r: [-0.18, 0, 0] });
    add(new THREE.SphereGeometry(0.035, 5, 4), mat('#F0907A'), 0, 0.38, 0.11);
    [-0.04, 0.04].forEach((x) => add(new THREE.SphereGeometry(0.016, 4, 3), mat('#222222'), x, 0.42, 0.1));
    add(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4), mat('#8A6A44'), 0.17, 0.22, 0.05, { r: [0, 0, 0.15] });
    add(new THREE.BoxGeometry(0.09, 0.11, 0.02), mat('#9AA3AD'), 0.2, 0.04, 0.05);
  } else if (id === 'lights') {
    const fx0 = plotPos(0).x - 1.15, fx1 = plotPos(GRID - 1).x + 1.15, fz0 = plotPos(GRID * (GRID - 1)).z - 1.15, fz1 = plotPos(0).z + 1.15;
    const cols = ['#FFD23C', '#FF5FA2', '#5AD1FF', '#8CFF6A'], bm = cols.map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1, roughness: 0.4 })), bg = new THREE.SphereGeometry(0.055, 6, 4), wire = new THREE.LineBasicMaterial({ color: '#3B2A1A' });
    const run = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az), n = Math.round(len / 0.28), seg = len / Math.max(1, Math.round(len / 1.1)), pts = [];
      for (let i = 0; i <= n; i++) { const k = i / n, dd = k * len, y = 0.68 - 0.1 * Math.sin(Math.PI * ((dd % seg) / seg)), x = lerp(ax, bx, k), z = lerp(az, bz, k); pts.push(new THREE.Vector3(x, y + 0.05, z)); add(bg, bm[i % 4], x, y, z); }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wire));
    };
    run(fx0, fz1, fx1, fz1); run(fx0, fz0, fx0, fz1); run(fx1, fz0, fx1, fz1);
    u.bulbs = bm;
  } else if (id === 'scarecrow') {
    const wood = mat('#8A6A44'), straw = mat('#E9C55A'), shirt = mat('#D9534F');
    add(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 5), wood, 0, 0.65, 0);
    add(new THREE.CylinderGeometry(0.035, 0.035, 1.0, 5), wood, 0, 1.0, 0, { r: [0, 0, Math.PI / 2] });
    add(new THREE.BoxGeometry(0.42, 0.46, 0.22), shirt, 0, 0.92, 0);
    [-1, 1].forEach((sx) => { add(new THREE.BoxGeometry(0.3, 0.14, 0.15), shirt, sx * 0.34, 1.0, 0); add(new THREE.ConeGeometry(0.07, 0.16, 5), straw, sx * 0.55, 1.0, 0, { r: [0, 0, -sx * Math.PI / 2] }); });
    add(new THREE.BoxGeometry(0.4, 0.2, 0.2), mat('#3F6FB0'), 0, 0.6, 0);
    add(new THREE.ConeGeometry(0.09, 0.18, 5), straw, 0, 0.42, 0, { r: [Math.PI, 0, 0] });
    add(new THREE.SphereGeometry(0.17, 8, 6), mat('#E6C99A'), 0, 1.32, 0);
    [-0.06, 0.06].forEach((x) => add(new THREE.BoxGeometry(0.04, 0.04, 0.02), mat('#2A2A2A'), x, 1.36, 0.16));
    add(new THREE.ConeGeometry(0.03, 0.1, 5), mat('#FF8A1F'), 0, 1.3, 0.2, { r: [Math.PI / 2, 0, 0] });
    add(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 12), straw, 0, 1.45, 0);
    add(new THREE.CylinderGeometry(0.13, 0.16, 0.18, 8), straw, 0, 1.55, 0);
    add(new THREE.CylinderGeometry(0.162, 0.162, 0.05, 8), shirt, 0, 1.49, 0);
  } else if (id === 'pumpkins') {
    add(new THREE.BoxGeometry(0.75, 0.34, 0.45), mat('#E3C15A'), 0.15, 0.17, -0.45);
    [-0.12, 0.12].forEach((x) => add(new THREE.BoxGeometry(0.77, 0.04, 0.47), mat('#B8923A'), 0.15, 0.17 + x, -0.45));
    model('pumpkin_orange', 0, 0.05, 0.42, 0.3); model('pumpkin_yellow', 0.48, 0.25, 0.32, 1.1); model('pumpkin_orange_small', -0.4, 0.3, 0.24, 2); model('pumpkin_orange_small', 0.2, -0.45, 0.24, 0.6, 0.34);
  } else if (id === 'fountain') {
    const stone = mat('#B8B2A6'), dark = mat('#9A9488'), water = mat('#58B7F0', { roughness: 0.15, emissive: '#10304a', emissiveIntensity: 0.3 });
    add(new THREE.CylinderGeometry(0.75, 0.82, 0.3, 12), stone, 0, 0.15, 0); add(new THREE.CylinderGeometry(0.64, 0.64, 0.05, 12), water, 0, 0.29, 0);
    add(new THREE.CylinderGeometry(0.09, 0.13, 0.6, 8), dark, 0, 0.55, 0); add(new THREE.CylinderGeometry(0.32, 0.12, 0.14, 10), stone, 0, 0.88, 0); add(new THREE.CylinderGeometry(0.26, 0.26, 0.03, 10), water, 0, 0.95, 0);
    const n = 60, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    u.drops = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#9FDCFF', size: 0.07, transparent: true, opacity: 0.9, depthWrite: false })); u.n = n; g.add(u.drops);
  } else if (id === 'windmill') {
    const wall = mat('#F3E6CF'), red = mat('#D9534F'), wood = mat('#8A5A3C');
    add(new THREE.CylinderGeometry(0.45, 0.72, 2.0, 8), wall, 0, 1.0, 0); add(new THREE.ConeGeometry(0.62, 0.65, 8), red, 0, 2.32, 0);
    add(new THREE.BoxGeometry(0.32, 0.48, 0.06), wood, 0, 0.24, 0.68); add(new THREE.BoxGeometry(0.2, 0.22, 0.05), mat('#3B5A7A'), 0, 1.3, 0.56, { r: [-0.13, 0, 0] });
    const bl = new THREE.Group(); bl.position.set(0, 1.78, 0.62); g.add(bl);
    add(new THREE.SphereGeometry(0.1, 8, 6), red, 0, 0, 0.02, { to: bl });
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, arm = new THREE.Group(); arm.rotation.z = a; bl.add(arm); add(new THREE.BoxGeometry(0.05, 1.0, 0.03), wood, 0, 0.55, 0, { to: arm }); add(new THREE.BoxGeometry(0.22, 0.78, 0.02), wall, 0.12, 0.62, 0.01, { to: arm }); }
    u.spin = bl; u.boost = 0;
  } else if (id === 'cactus') {
    add(new THREE.CylinderGeometry(0.85, 0.92, 0.06, 14), mat('#E8D3A0'), 0, 0.03, 0);
    model('cactus_medium_A', 0, 0, 0.9, 0.4, 0.05); model('cactus_small_A', 0.48, 0.25, 0.45, 1.3, 0.05); model('cactus_small_A', -0.42, 0.32, 0.34, 2.4, 0.05); model('rock_single_B', 0.32, -0.42, 0.2, 0.7, 0.04);
    const fm = mat('#FF6FB5', { emissive: '#ff6fb5', emissiveIntensity: 0.2 }); [[0.02, 0.97, 0.02], [0.5, 0.53, 0.25]].forEach((q) => add(new THREE.SphereGeometry(0.07, 6, 4), fm, q[0], q[1], q[2], { s: [1, 0.6, 1] }));
  } else if (id === 'balloon') {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 8; const x = cv.getContext('2d'), sc = ['#FF5A5A', '#FFD23C', '#FF5A5A', '#4AA3FF'];
    for (let i = 0; i < 12; i++) { x.fillStyle = sc[i % 4]; x.fillRect(i * 128 / 12, 0, 128 / 12 + 1, 8); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; const env = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, flatShading: true });
    add(new THREE.SphereGeometry(1.0, 12, 10), env, 0, 1.75, 0, { s: [1, 1.12, 1] }); add(new THREE.CylinderGeometry(0.42, 0.22, 0.45, 12, 1, true), env, 0, 0.62, 0);
    add(new THREE.BoxGeometry(0.46, 0.34, 0.46), mat('#9C6B3E'), 0, 0, 0); add(new THREE.BoxGeometry(0.5, 0.06, 0.5), mat('#6E4530'), 0, 0.17, 0);
    const rope = mat('#5E4230'); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach((q) => { const k = add(new THREE.CylinderGeometry(0.012, 0.012, 0.42, 3), rope, q[0] * 0.2, 0.38, q[1] * 0.2); k.rotation.set(q[1] * 0.1, 0, -q[0] * 0.1); });
    const fl = add(new THREE.ConeGeometry(0.07, 0.2, 6), new THREE.MeshBasicMaterial({ color: '#FFB020' }), 0, 0.4, 0); fl.name = 'flame';
  } else if (id === 'crystal') {
    model('rock_single_A', 0, 0, 0.28, 0.5, 0.02);
    const cm = new THREE.MeshStandardMaterial({ color: '#7FE7FF', emissive: '#3EC8FF', emissiveIntensity: 0.8, roughness: 0.2, metalness: 0.1, flatShading: true, transparent: true, opacity: 0.92 });
    u.gem = add(new THREE.OctahedronGeometry(0.34, 0), cm, 0, 1.3, 0, { s: [1, 1.7, 1] }); u.cm = cm;
    u.orbit = new THREE.Group(); u.orbit.position.y = 1.3; g.add(u.orbit); const sm = mat('#B06CFF', { emissive: '#B06CFF', emissiveIntensity: 0.8 });
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; add(new THREE.OctahedronGeometry(0.09, 0), sm, Math.cos(a) * 0.62, Math.sin(i * 2) * 0.15, Math.sin(a) * 0.62, { to: u.orbit, s: [1, 1.6, 1] }); }
    u.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#7FE7FF', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); u.glow.position.y = 1.3; u.glow.scale.setScalar(2.2); g.add(u.glow);
  }
  shadowAll(g, true, false);
  if (id === 'lights' || id === 'crystal') g.traverse((m) => { if (m.isMesh && m.geometry.type !== 'BufferGeometry' && m.geometry.type !== 'Geometry') m.castShadow = id === 'crystal' && m === u.gem; });
  const sp = DSPOT[id]; g.position.set(sp[0], id === 'balloon' ? 1.4 : 0, sp[1]); g.rotation.y = sp[2]; if (id === 'gnome') g.userData.base = 1.7;
  return g;
}
function syncDecor() {
  if (!R || !ready3d) return;
  for (const id in decorObjs) if (!S.decor[id]) { scene.remove(decorObjs[id].g); delete decorObjs[id]; }
  DECOR.forEach((d) => { if (S.decor[d.id] && !decorObjs[d.id]) { const g = decorMesh(d.id); scene.add(g); decorObjs[d.id] = { g: g, id: d.id, born: now() - S.decor[d.id] < 3000 ? 0 : 1, wig: 0 }; g.scale.setScalar(g.userData.base || 1); } });
  decorHit = []; for (const id in decorObjs) if (id !== 'lights') decorObjs[id].g.traverse((m) => { if (m.isMesh) { m.userData.decor = id; decorHit.push(m); } });
}
function pickDecor(x, y) {
  if (!decorHit.length) return null; const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(x / W * 2 - 1, -(y / H) * 2 + 1), cam);
  const h = ray.intersectObjects(decorHit, false)[0]; return h ? h.object.userData.decor : null;
}
function pokeDecor(K, id) {
  const d = decorObjs[id]; if (!d) return; d.wig = 0.6; K.haptic(10);
  if (id === 'windmill') { d.g.userData.boost = 9; K.sfx('whoosh'); }
  else if (id === 'crystal') K.sfx('star');
  else if (id === 'balloon') K.sfx('whoosh');
  else if (id === 'fountain') { K.sfx('pop'); const s = screenOf(d.g.position.clone().setY(1)); for (let k = 0; k < 10; k++) fx.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 160, vy: -120 - Math.random() * 100, drop: true, t: 0 }); }
  else K.sfx('pop');
}
function updateDecor(dt, t, ms) {
  const night = 1 - dayLight(ms);
  for (const id in decorObjs) {
    const d = decorObjs[id], g = d.g, u = g.userData;
    if (d.born < 1) { d.born = Math.min(1, d.born + dt * 1.6); const k = d.born - 1; g.scale.setScalar((u.base || 1) * Math.max(0.001, 1 + 2.70158 * k * k * k + 1.70158 * k * k)); }
    let rz = 0; if (d.wig > 0) { d.wig -= dt; rz = Math.sin(d.wig * 28) * d.wig * 0.25; }
    if (id !== 'lights') g.rotation.z = rz + (id === 'scarecrow' ? Math.sin(t * 1.3) * 0.03 : 0);
    if (id === 'windmill') { u.spin.rotation.z -= dt * (0.9 + u.boost); u.boost = Math.max(0, u.boost - dt * 3); }
    else if (id === 'fountain') {
      const a = u.drops.geometry.attributes.position;
      for (let i = 0; i < u.n; i++) { const k = (t * 0.9 + i / u.n * 3) % 1, ang = i * 2.39; if (i % 3 === 0) { a.array[i * 3] = Math.cos(ang) * 0.04 * k; a.array[i * 3 + 1] = 0.95 + Math.sin(k * Math.PI) * 0.55; a.array[i * 3 + 2] = Math.sin(ang) * 0.04 * k; } else { const r = 0.26 + k * 0.34; a.array[i * 3] = Math.cos(ang) * r; a.array[i * 3 + 1] = 0.95 + Math.sin(k * Math.PI) * 0.12 - k * 0.64; a.array[i * 3 + 2] = Math.sin(ang) * r; } }
      a.needsUpdate = true;
    } else if (id === 'balloon') { const sp = DSPOT.balloon; g.position.set(sp[0] + Math.sin(t * 0.13) * 0.25, 1.4 + Math.sin(t * 0.6) * 0.25, sp[1] + Math.cos(t * 0.11) * 0.2); g.rotation.y += dt * 0.12; const f = g.getObjectByName('flame'); if (f) f.scale.setScalar(0.8 + Math.sin(t * 17) * 0.25); }
    else if (id === 'crystal') { u.gem.rotation.y += dt * 0.8; u.gem.position.y = 1.3 + Math.sin(t * 1.5) * 0.1; u.orbit.rotation.y -= dt * 1.2; u.orbit.position.y = u.gem.position.y; u.glow.position.y = u.gem.position.y; u.cm.emissiveIntensity = 0.6 + night * 1.1 + Math.sin(t * 3) * 0.15 + d.wig * 2; u.glow.material.opacity = 0.35 + night * 0.4 + Math.sin(t * 3) * 0.08; }
    else if (id === 'lights') u.bulbs.forEach((m, k) => { m.emissiveIntensity = 0.3 + night * 1.9 * (0.7 + 0.3 * Math.sin(t * 2.6 + k * 1.7)); });
  }
}
function decorIcon(c, id, x, y, r) {
  const ci = (cx, cy, rr, col) => { c.fillStyle = col; c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.fill(); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (id === 'flowers') { c.fillStyle = '#6E432A'; c.fillRect(x - r, y + r * 0.45, r * 2, r * 0.5); c.strokeStyle = '#3E9E45'; c.lineWidth = r * 0.12; [[-0.55, '#FF6FB5'], [0, '#FFD23C'], [0.55, '#B06CFF']].forEach((q, i) => { c.beginPath(); c.moveTo(x + q[0] * r, y + r * 0.5); c.lineTo(x + q[0] * r, y - r * (0.1 + (i % 2) * 0.3)); c.stroke(); ci(x + q[0] * r, y - r * (0.15 + (i % 2) * 0.3), r * 0.28, q[1]); ci(x + q[0] * r, y - r * (0.15 + (i % 2) * 0.3), r * 0.1, '#FFF6B0'); }); }
  else if (id === 'gnome') { c.fillStyle = '#3B6FD6'; c.beginPath(); c.moveTo(x - r * 0.6, y + r); c.lineTo(x + r * 0.6, y + r); c.lineTo(x + r * 0.25, y + r * 0.1); c.lineTo(x - r * 0.25, y + r * 0.1); c.fill(); ci(x, y - r * 0.05, r * 0.36, '#F6C9A0'); c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(x - r * 0.3, y + r * 0.05); c.lineTo(x + r * 0.3, y + r * 0.05); c.lineTo(x, y + r * 0.7); c.fill(); c.fillStyle = '#E8403A'; c.beginPath(); c.moveTo(x - r * 0.4, y - r * 0.2); c.lineTo(x + r * 0.4, y - r * 0.2); c.lineTo(x + r * 0.1, y - r * 1.05); c.fill(); }
  else if (id === 'lights') { c.strokeStyle = '#3B2A1A'; c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(x - r, y - r * 0.4); c.quadraticCurveTo(x, y + r * 0.6, x + r, y - r * 0.4); c.stroke(); ['#FFD23C', '#FF5FA2', '#5AD1FF', '#8CFF6A', '#FFD23C'].forEach((col, i) => { const k = i / 4, px = x - r + k * 2 * r, py = y - r * 0.4 + 4 * k * (1 - k) * r * 0.5 + r * 0.2; ci(px, py, r * 0.32, col + '55'); ci(px, py, r * 0.17, col); }); }
  else if (id === 'scarecrow') { c.strokeStyle = '#8A6A44'; c.lineWidth = r * 0.14; c.beginPath(); c.moveTo(x, y + r); c.lineTo(x, y - r * 0.3); c.moveTo(x - r * 0.85, y - r * 0.05); c.lineTo(x + r * 0.85, y - r * 0.05); c.stroke(); c.fillStyle = '#D9534F'; c.fillRect(x - r * 0.35, y - r * 0.2, r * 0.7, r * 0.6); ci(x, y - r * 0.45, r * 0.28, '#E6C99A'); c.fillStyle = '#E9C55A'; c.fillRect(x - r * 0.5, y - r * 0.72, r, r * 0.1); c.fillRect(x - r * 0.25, y - r * 0.98, r * 0.5, r * 0.28); }
  else if (id === 'pumpkins') { [[-0.42, 0.35, 0.42, '#F07A1E'], [0.45, 0.4, 0.36, '#F5C342'], [0, 0.05, 0.55, '#F07A1E']].forEach((q) => { c.fillStyle = q[3]; c.beginPath(); c.ellipse(x + q[0] * r, y + q[1] * r, q[2] * r * 1.15, q[2] * r * 0.9, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x + q[0] * r, y + q[1] * r, q[2] * r * 0.45, q[2] * r * 0.9, 0, 0, TAU); c.stroke(); c.fillStyle = '#3E9E45'; c.fillRect(x + q[0] * r - 1.5, y + (q[1] - q[2] * 0.9) * r - 4, 3, 5); }); }
  else if (id === 'fountain') { c.fillStyle = '#B8B2A6'; c.beginPath(); c.ellipse(x, y + r * 0.6, r, r * 0.32, 0, 0, TAU); c.fill(); c.fillRect(x - r * 0.12, y - r * 0.3, r * 0.24, r * 0.9); c.beginPath(); c.ellipse(x, y - r * 0.3, r * 0.45, r * 0.15, 0, 0, TAU); c.fill(); c.fillStyle = '#58B7F0'; c.beginPath(); c.ellipse(x, y + r * 0.55, r * 0.8, r * 0.18, 0, 0, TAU); c.fill(); c.strokeStyle = '#7FC4FF'; c.lineWidth = r * 0.1; c.beginPath(); c.moveTo(x, y - r * 0.4); c.quadraticCurveTo(x - r * 0.1, y - r * 1.05, x - r * 0.6, y - r * 0.2); c.moveTo(x, y - r * 0.4); c.quadraticCurveTo(x + r * 0.1, y - r * 1.05, x + r * 0.6, y - r * 0.2); c.stroke(); }
  else if (id === 'windmill') { c.fillStyle = '#F3E6CF'; c.beginPath(); c.moveTo(x - r * 0.5, y + r); c.lineTo(x + r * 0.5, y + r); c.lineTo(x + r * 0.3, y - r * 0.2); c.lineTo(x - r * 0.3, y - r * 0.2); c.fill(); c.fillStyle = '#D9534F'; c.beginPath(); c.moveTo(x - r * 0.4, y - r * 0.2); c.lineTo(x + r * 0.4, y - r * 0.2); c.lineTo(x, y - r * 0.6); c.fill(); c.strokeStyle = '#8A5A3C'; c.lineWidth = r * 0.16; c.beginPath(); c.moveTo(x - r * 0.75, y - r * 1.0); c.lineTo(x + r * 0.75, y + r * 0.2); c.moveTo(x + r * 0.75, y - r * 1.0); c.lineTo(x - r * 0.75, y + r * 0.2); c.stroke(); }
  else if (id === 'cactus') { c.fillStyle = '#E8D3A0'; c.beginPath(); c.ellipse(x, y + r * 0.85, r, r * 0.25, 0, 0, TAU); c.fill(); c.strokeStyle = '#3FAF6A'; c.lineWidth = r * 0.38; c.beginPath(); c.moveTo(x, y + r * 0.8); c.lineTo(x, y - r * 0.7); c.moveTo(x, y + r * 0.2); c.lineTo(x - r * 0.5, y + r * 0.2); c.lineTo(x - r * 0.5, y - r * 0.25); c.moveTo(x, y); c.lineTo(x + r * 0.5, y); c.lineTo(x + r * 0.5, y - r * 0.45); c.stroke(); ci(x, y - r * 0.85, r * 0.16, '#FF6FB5'); }
  else if (id === 'balloon') { c.save(); c.beginPath(); c.ellipse(x, y - r * 0.25, r * 0.72, r * 0.78, 0, 0, TAU); c.clip(); ['#FF5A5A', '#FFD23C', '#4AA3FF', '#FFD23C', '#FF5A5A'].forEach((col, i) => { c.fillStyle = col; c.fillRect(x - r * 0.72 + i * r * 0.29, y - r * 1.1, r * 0.3, r * 1.8); }); c.restore(); c.strokeStyle = '#5E4230'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - r * 0.35, y + r * 0.45); c.lineTo(x - r * 0.2, y + r * 0.7); c.moveTo(x + r * 0.35, y + r * 0.45); c.lineTo(x + r * 0.2, y + r * 0.7); c.stroke(); c.fillStyle = '#9C6B3E'; c.fillRect(x - r * 0.24, y + r * 0.68, r * 0.48, r * 0.34); }
  else if (id === 'crystal') { const gl = c.createRadialGradient(x, y, 2, x, y, r * 1.1); gl.addColorStop(0, 'rgba(126,231,255,0.8)'); gl.addColorStop(1, 'rgba(126,231,255,0)'); c.fillStyle = gl; c.beginPath(); c.arc(x, y, r * 1.1, 0, TAU); c.fill(); c.fillStyle = '#3EC8FF'; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.45, y); c.lineTo(x, y + r); c.lineTo(x - r * 0.45, y); c.fill(); c.fillStyle = '#B8F4FF'; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r * 0.45, y); c.lineTo(x, y); c.fill(); }
}
function drawDecor(c, K) {
  const box = panel(c, K, K.t('decorT')), n = decorCount();
  c.fillStyle = '#7A6448'; c.font = K.font(12, 800); c.fillText(K.t('charm') + ': +' + Math.round(n * CHARM * 100) + '% ' + K.t('charmGold') + '  ·  ' + n + ' / ' + DECOR.length, K.W / 2, box.y + 2, box.w - 20);
  const rh = 62, y0 = box.y + 26 - (sheet.scroll || 0), view = { y: box.y + 22, h: box.h - 10 };
  c.save(); c.beginPath(); c.rect(box.x, view.y, box.w, view.h + 30); c.clip();
  DECOR.forEach((d, k) => {
    const y = y0 + k * (rh + 6), lock = S.lv < d.lvl, own = !!S.decor[d.id]; if (y + rh < view.y || y > view.y + view.h + 30) return;
    c.fillStyle = own ? '#E3F4DC' : lock ? '#E6DED0' : '#F1E4C8'; K.roundRect(c, box.x + 10, y, box.w - 20, rh, 14); c.fill();
    const rtl = K.rtl, ix = rtl ? box.x + box.w - 40 : box.x + 40; c.globalAlpha = lock ? 0.45 : 1; decorIcon(c, d.id, ix, y + rh / 2, 17); c.globalAlpha = 1;
    c.textAlign = rtl ? 'right' : 'left'; const tx = rtl ? box.x + box.w - 70 : box.x + 70, tw = box.w - 200;
    c.fillStyle = '#3B2A1A'; c.font = K.font(14); c.fillText(L(K, d.name), tx, y + rh * 0.34, tw);
    c.fillStyle = '#7A6448'; c.font = K.font(11, 700); c.fillText(lock ? K.t('needLv') + ' ' + d.lvl : L(K, d.desc) + ' · +3%', tx, y + rh * 0.7, tw);
    c.textAlign = 'center';
    const bw = 92, bx = rtl ? box.x + 18 : box.x + box.w - bw - 18;
    if (own) { c.fillStyle = '#22A06B'; c.font = K.font(13); c.fillText('✓ ' + K.t('owned'), bx + bw / 2, y + rh / 2); }
    else if (!lock) btn(c, K, bx, y + rh / 2 - 18, bw, 36, String(d.price), S.gold >= d.price ? '#14B8A6' : '#B9A88C', 'buyDecor', { id: d.id });
  });
  c.restore();
  sheet.maxScroll = Math.max(0, DECOR.length * (rh + 6) - view.h + 10);
}

/* ---------------- pets ---------------- */
let sprinklerObj = null;
function buildSprinkler() {
  if (!R || sprinklerObj || !S.sprinkler) return;
  const g = new THREE.Group(), x = plotPos(0).x - 1.75, z = GZ; g.position.set(x, 0, z);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 6), mat('#8A97A6', { metalness: 0.4, roughness: 0.4 })); pipe.position.y = 0.45; g.add(pipe);
  const head = new THREE.Group(); head.position.y = 0.95; g.add(head);
  const hm = mat('#3B9BFF', { metalness: 0.3, roughness: 0.4 }); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8), hm); head.add(hub);
  [0, Math.PI].forEach((a) => { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), hm); arm.rotation.y = a; arm.position.x = Math.cos(a) * 0.22; head.add(arm); });
  const n = 40, pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const drops = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#8FD3FF', size: 0.08, transparent: true, opacity: 0.85, depthWrite: false })); g.add(drops);
  shadowAll(g, true, false); scene.add(g); sprinklerObj = { g: g, head: head, drops: drops, n: n };
}
function updateSprinkler(t) {
  if (!sprinklerObj) return; const s = sprinklerObj; s.head.rotation.y = t * 2.2; const a = s.drops.geometry.attributes.position;
  for (let i = 0; i < s.n; i++) { const k = ((t * 0.8 + i / s.n) % 1), ang = t * 2.2 + (i % 2) * Math.PI, r = k * 2.6; a.array[i * 3] = Math.cos(-ang) * r; a.array[i * 3 + 1] = 0.95 + Math.sin(k * Math.PI) * 0.9 - k * 0.8; a.array[i * 3 + 2] = Math.sin(-ang) * r; }
  a.needsUpdate = true;
}
function petMesh(type) {
  const g = new THREE.Group();
  if (type === 'bunny') {
    const w = mat('#FFFFFF'); const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), w); b.scale.set(1, 0.85, 1.2); b.position.y = 0.2; g.add(b);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), w); h.position.set(0, 0.38, 0.2); g.add(h);
    [-0.06, 0.06].forEach((x) => { const e = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.18, 2, 5), mat('#FFE0EA')); e.position.set(x, 0.58, 0.18); e.rotation.x = -0.2; g.add(e); });
    [-0.05, 0.05].forEach((x) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4), mat('#222')); e.position.set(x, 0.41, 0.34); g.add(e); });
  } else if (type === 'bee') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat('#FFD23C')); b.scale.set(1, 0.9, 1.3); g.add(b);
    [-0.06, 0.06].forEach((z) => { const s = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 4, 10), mat('#2A2A2A')); s.position.z = z; g.add(s); });
    const wm = new THREE.MeshStandardMaterial({ color: '#E8F6FF', transparent: true, opacity: 0.7 });
    [-1, 1].forEach((sd) => { const w = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), wm); w.scale.set(1, 0.2, 0.6); w.position.set(sd * 0.13, 0.14, 0); w.name = 'wing'; g.add(w); });
  } else if (type === 'hedgehog') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mat('#A0785A')); b.scale.set(1, 0.75, 1.25); b.position.y = 0.16; g.add(b);
    const sm = mat('#5E4230'); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; const s = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 4), sm); s.position.set(Math.cos(a) * 0.15, 0.27, Math.sin(a) * 0.18 - 0.04); s.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(s); }
    const n = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), mat('#222')); n.position.set(0, 0.16, 0.29); g.add(n);
  } else {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat('#C8FF5A', { emissive: '#C8FF5A', emissiveIntensity: 1.2 })); g.add(b);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex(), color: '#E4FF8A', transparent: true, opacity: 0.6, depthWrite: false })); glow.scale.setScalar(0.6); g.add(glow);
  }
  return shadowAll(g, true, false);
}
function syncPets() {
  if (!R) return;
  petObjs.forEach((p) => scene.remove(p.o)); petObjs = [];
  S.pets.slice(0, 6).forEach((p, i) => { const o = petMesh(p.type); const a = i * 1.7; o.position.set(Math.cos(a) * 5.8, 0, Math.sin(a) * 5.8); scene.add(o); petObjs.push({ o: o, type: p.type, tx: o.position.x, tz: o.position.z, t: Math.random() * 5, wait: 0 }); });
  if (eggObj) { scene.remove(eggObj); eggObj = null; }
  if (S.egg) {
    eggObj = new THREE.Group(); const nest = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.1, 5, 12), mat('#9C7448')); nest.rotation.x = Math.PI / 2; nest.position.y = 0.08; eggObj.add(nest);
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), mat('#FFF8EC')); e.scale.set(1, 1.3, 1); e.position.y = 0.3; e.name = 'egg'; eggObj.add(e);
    const dm = mat('#7BC4FF'); for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 5, 4), dm); const a = i * 1.1; d.position.set(Math.cos(a) * 0.23, 0.25 + (i % 3) * 0.12, Math.sin(a) * 0.23); e.add(d); d.position.sub(e.position); d.position.y += 0.3; }
    eggObj.position.set(2.9, 0, 5.1); shadowAll(eggObj, true, false); scene.add(eggObj);
  }
}
function updatePets(dt, t) {
  petObjs.forEach((p) => {
    p.t += dt; const o = p.o, dx = p.tx - o.position.x, dz = p.tz - o.position.z, d = Math.hypot(dx, dz);
    if (p.wait > 0) p.wait -= dt;
    else if (d < 0.15) { const a = Math.random() * TAU, r = 5.2 + Math.random() * 1.3; p.tx = Math.cos(a) * r; p.tz = Math.sin(a) * r; p.wait = 1 + Math.random() * 3; }
    else { const sp = p.type === 'bee' ? 1.3 : p.type === 'hedgehog' ? 0.45 : p.type === 'firefly' ? 0.8 : 1.0; o.position.x += dx / d * sp * dt; o.position.z += dz / d * sp * dt; o.rotation.y = Math.atan2(dx, dz); }
    const moving = p.wait <= 0 && d > 0.15;
    if (p.type === 'bunny') o.position.y = moving ? Math.abs(Math.sin(p.t * 9)) * 0.22 : 0;
    else if (p.type === 'bee') { o.position.y = 1.1 + Math.sin(p.t * 3) * 0.15; o.children.forEach((c) => { if (c.name === 'wing') c.rotation.z = Math.sin(p.t * 60) * 0.6; }); }
    else if (p.type === 'firefly') { o.position.y = 1.4 + Math.sin(p.t * 2) * 0.3; }
    else o.position.y = 0;
  });
  if (eggObj) { const e = eggObj.getObjectByName('egg'), left = S.egg.t0 + S.egg.dur - now(); e.rotation.z = left < 60000 ? Math.sin(t * 25) * 0.12 : Math.sin(t * 2) * 0.04; }
}

/* ---------------- sky, light, weather (real local time) ---------------- */
let skyKey = '';
function dayLight(ms) { const d = new Date(ms), h = d.getHours() + d.getMinutes() / 60; if (h >= 7 && h < 18) return 1; if (h >= 5 && h < 7) return (h - 5) / 2; if (h >= 18 && h < 20.5) return 1 - (h - 18) / 2.5; return 0; }
function updateSky(t, ev) {
  const day = dayLight(t), k = day.toFixed(2) + ev;
  if (k !== skyKey) {
    skyKey = k; const g = skyCtx.createLinearGradient(0, 0, 0, 256);
    const top = new THREE.Color('#0B1540').lerp(new THREE.Color('#5FB6F2'), day), bot = new THREE.Color('#2A2F66').lerp(new THREE.Color('#D8F1FF'), day);
    if (ev === 'golden') { top.lerp(new THREE.Color('#F08A4B'), 0.55); bot.lerp(new THREE.Color('#FFD27A'), 0.7); }
    if (ev === 'rain') { top.lerp(new THREE.Color('#56657A'), 0.6); bot.lerp(new THREE.Color('#9AA8B8'), 0.6); }
    if (ev === 'moon') { top.lerp(new THREE.Color('#141C5C'), 0.6); bot.lerp(new THREE.Color('#6A7AD8'), 0.5); }
    g.addColorStop(0, '#' + top.getHexString()); g.addColorStop(1, '#' + bot.getHexString()); skyCtx.fillStyle = g; skyCtx.fillRect(0, 0, 2, 256); skyTex.needsUpdate = true;
    scene.fog.color.copy(bot);
    sun.intensity = 0.45 + 1.9 * day * (ev === 'rain' ? 0.55 : 1); hemi.intensity = 0.55 + 1.0 * day;
    sun.color.set(ev === 'golden' ? '#FFB46A' : day < 0.3 ? '#9FB4FF' : '#FFF1D6'); hemi.color.set(ev === 'moon' ? '#B8C4FF' : day < 0.3 ? '#8FA2E0' : '#DFF1FF');
    lanterns.forEach((l) => { l.intensity = day < 0.5 ? (1 - day * 2) * 3 : 0; });
  }
  rain.visible = ev === 'rain';
}
function updateRain(dt) {
  if (!rain.visible) return; const a = rain.geometry.attributes.position, arr = a.array;
  for (let i = 0; i < arr.length; i += 6) { arr[i + 1] -= 14 * dt; arr[i + 4] -= 14 * dt; if (arr[i + 4] < 0) { const y = 10 + Math.random() * 3; arr[i + 1] = y; arr[i + 4] = y - 0.45; } }
  a.needsUpdate = true;
}

/* ---------------- camera ---------------- */
let W = 1, H = 1;
function layoutCam(K) {
  if (!R) return; W = K.W; H = K.H; R.setSize(W, H, false); cam.aspect = W / H;
  // keep the whole island in view on phones (portrait) and desktop (landscape)
  const land = W > H, a = W / H; cam.fov = land ? 34 : 42; cam.userData.dist = land ? Math.max(16, 19.5 - (a - 1.3) * 3) : 25 + Math.max(0, 0.8 - a) * 20; cam.updateProjectionMatrix();
}
function placeCam(t) {
  camYaw += (camYawT - camYaw) * 0.08; const d = (cam.userData.dist || 22) * (SHOT ? 0.74 : 1), yaw = camYaw + Math.sin(t * 0.15) * 0.03;
  const tz = W > H ? 0.2 : 0.9; cam.position.set(Math.sin(yaw) * d * 0.68 + GX, d * 0.7, Math.cos(yaw) * d * 0.68 + tz); cam.lookAt(GX, -0.8, tz);
}
function screenOf(v) { const p = v.clone().project(cam); return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, z: p.z }; }
function pickPlot(x, y) {
  const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(x / W * 2 - 1, -(y / H) * 2 + 1), cam);
  const hit = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.25), hit)) return -1;
  let best = -1, bd = 0.95; for (let i = 0; i < GRID * GRID; i++) { const p = plotPos(i), d = Math.max(Math.abs(p.x - hit.x), Math.abs(p.z - hit.z)); if (d < bd) { bd = d; best = i; } }
  return best;
}

/* ---------------- actions ---------------- */
let sheet = null, popup = null, fx = [], ui = [], tutT = 0;
function plant(K, i, id) {
  const sd = SEED[id]; if (!(S.seeds[id] > 0) || S.plots[i] || i >= S.open) return false;
  S.seeds[id]--; S.plots[i] = { seed: id, t0: now(), dur: Math.round(sd.t * 1000 * growMul()), w: false, mut: null };
  if (S.sprinkler) { S.plots[i].w = true; S.plots[i].t0 -= S.plots[i].dur * 0.2; }
  K.sfx('place'); K.haptic(15); syncPlot(i); plotG[i] && (plotG[i].plant.userData.popT = 0.45); sheet = null; if (S.tut === 0) S.tut = 1; save(); return true;
}
function water(K, i) {
  const p = S.plots[i]; if (!p || p.w) return false; const left = p.t0 + p.dur - now(); if (left <= 0) return false;
  p.w = true; p.t0 -= Math.min(left, p.dur * 0.2); K.sfx('pop'); splash(i); plotG[i].plant.userData.popT = 0.35; if (S.tut === 1) S.tut = 2; save(); return true;
}
function harvest(K, i, double) {
  const p = S.plots[i]; if (!p || plotProgress(p, now()) < 1) return false;
  finalize(p); const t = now(), extra = [];
  if (goldenAt(t) && Math.random() < MUTS.golden.p) extra.push('golden');
  if (moonAt(t) && Math.random() < MUTS.moonlit.p) extra.push('moonlit');
  p.mut = p.mut.concat(extra.filter((m) => p.mut.indexOf(m) < 0));
  const sd = SEED[p.seed], v = valueOf(p) * (double ? 2 : 1);
  orders().list.forEach((o) => { if (!o.claimed && o.seed === p.seed && o.have < o.need) o.have++; });
  S.gold += v; S.earned = (S.earned || 0) + v; S.harvested++; addXp(K, sd.xp);
  const newAlbum = []; [''].concat(p.mut).forEach((m) => { const k = p.seed + ':' + (m || 'normal'); if (!S.album[k]) { S.album[k] = 1; newAlbum.push(m || 'normal'); } });
  if (newAlbum.length) addXp(K, 3 * newAlbum.length);
  // fly the vegetable to the wheelbarrow
  const pg = plotG[i], wp = new THREE.Vector3(); pg.plant.getWorldPosition(wp);
  if (pg.plant.userData.prod && pg.plant.userData.prod.children.length) {
    const o = pg.plant.userData.prod.clone(true); o.position.copy(wp); o.scale.setScalar(pg.plant.scale.x); scene.add(o); flyers.push({ o: o, a: wp.clone(), t: 0 });
  }
  const sp = screenOf(wp.clone().setY(1));
  for (let k = 0; k < 12; k++) { const a = Math.random() * TAU, sp2 = 90 + Math.random() * 160; fx.push({ x: sp.x, y: sp.y + 20, vx: Math.cos(a) * sp2, vy: Math.sin(a) * sp2 - 140, bit: true, col: k % 3 ? sd.col : sd.leaf, r: 3 + Math.random() * 4, t: 0 }); }
  fx.push({ x: sp.x, y: sp.y, txt: '+' + v, col: p.mut.length ? '#FFE15A' : '#FFFFFF', t: 0, big: p.mut.length > 0 });
  if (p.mut.length) fx.push({ x: sp.x, y: sp.y - 30, txt: p.mut.map((m) => L(K, MUTS[m].name)).join(' · '), col: MUTS[p.mut[p.mut.length - 1]].col, t: 0 });
  K.sfx(p.mut.length ? 'reward' : 'coin'); K.haptic(20);
  if (v >= 50) K.addCoins(Math.max(1, Math.min(5, Math.floor(v / 300))), sp.x, sp.y);
  const rare = p.mut.some((m) => m === 'rainbow' || m === 'golden' || m === 'moonlit' || m === 'giant');
  S.plots[i] = null; syncPlot(i);
  if (rare && !double) popup = { kind: 'rare', seed: sd, mut: p.mut, v: v, t: 0 };
  if (S.tut === 2) S.tut = 3; K.tutorialDone();
  K.setScore(S.earned || 0); save(); return true;
}
function splash(i) { const w = new THREE.Vector3(); plotG[i].g.getWorldPosition(w); const s = screenOf(w.setY(0.6)); for (let k = 0; k < 8; k++) fx.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 120, vy: -80 - Math.random() * 80, drop: true, t: 0 }); }
function buySeed(K, id) {
  const sd = SEED[id], st = stock();
  if (S.lv < sd.lvl) { K.sfx('wrong'); K.toast(K.t('needLv') + ' ' + sd.lvl); return; }
  if (!(st.left[id] > 0)) { K.sfx('wrong'); K.toast(K.t('soldOut')); return; }
  if (S.gold < sd.price) { K.sfx('wrong'); K.toast(K.t('needGold')); return; }
  S.gold -= sd.price; st.left[id]--; S.seeds[id] = (S.seeds[id] || 0) + 1; K.sfx('coin'); K.setScore(S.earned || 0); if (S.tut === 3) S.tut = 4; save();
}
function buyPlot(K) {
  const c = plotCost(S.open - START_PLOTS); if (S.open >= GRID * GRID) return;
  if (S.gold < c) { K.sfx('wrong'); K.toast(K.t('needGold')); return; }
  S.gold -= c; S.open++; syncPlot(S.open - 1); K.sfx('reward'); K.confetti(30); K.setScore(S.earned || 0); save();
}
function buyEgg(K) {
  if (S.egg) return; if (S.lv < EGG_LVL) { K.sfx('wrong'); K.toast(K.t('needLv') + ' ' + EGG_LVL); return; }
  if (S.gold < EGG_PRICE) { K.sfx('wrong'); K.toast(K.t('needGold')); return; }
  S.gold -= EGG_PRICE; S.egg = { t0: now(), dur: EGG_TIME }; syncPets(); K.sfx('reward'); K.setScore(S.earned || 0); save();
}
function hatch(K) {
  if (!S.egg || now() < S.egg.t0 + S.egg.dur) return false;
  let r = Math.random() * 100, type = 'bunny'; for (const k in PETS) { r -= PETS[k].w; if (r <= 0) { type = k; break; } }
  S.pets.push({ type: type, at: now() }); S.egg = null; syncPets(); K.confetti(80); K.sfx('reward');
  popup = { kind: 'pet', type: type, t: 0 }; save(); return true;
}
function boost(K) {
  if (now() < S.boostAt + BOOST_CD) { K.toast(K.t('boostWait')); return; }
  K.rewarded((ok) => { if (!ok) return; S.boostAt = now(); S.plots.forEach((p) => { if (p) p.t0 -= BOOST_MS; }); if (S.egg) S.egg.t0 -= BOOST_MS; K.sfx('star'); K.flash('#FFFFFF', 0.3); K.toast(K.t('boosted')); save(); });
}
function levelUp(K) {
  const unlocked = SEEDS.filter((s) => s.lvl === S.lv); K.confetti(60); K.sfx('combo');
  popup = { kind: 'level', lv: S.lv, seeds: unlocked, decor: DECOR.filter((d) => d.lvl === S.lv), t: 0 };
}
function tapPlot(K, i) {
  if (i < 0) return;
  if (i >= S.open) { if (i === S.open) buyPlot(K); else K.toast(K.t('lockedPlot')); return; }
  const p = S.plots[i]; sel = i;
  if (!p) { sheet = { kind: 'plant', plot: i, scroll: 0 }; K.sfx('click'); return; }
  if (plotProgress(p, now()) >= 1) { harvest(K, i); return; }
  if (!water(K, i)) { K.sfx('tick'); fx.push(Object.assign(screenOf(plotPos(i).setY(1.2)), { txt: fmtTime(p.t0 + p.dur - now()), col: '#FFFFFF', t: 0 })); }
}
function fmtTime(ms) { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return h ? h + 'h ' + (m < 10 ? '0' : '') + m + 'm' : m ? m + ':' + (ss < 10 ? '0' : '') + ss : ss + 's'; }

/* ---------------- 2D interface on top of the 3D view ---------------- */
function btn(c, K, x, y, w, h, label, col, act, extra) {
  c.fillStyle = 'rgba(0,0,0,0.25)'; K.roundRect(c, x, y + 4, w, h, h / 2); c.fill();
  c.fillStyle = col; K.roundRect(c, x, y, w, h, h / 2); c.fill();
  c.fillStyle = '#FFFFFF'; c.font = K.font(Math.min(18, h * 0.42, w / Math.max(4, label.length) * 1.7)); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x + w / 2, y + h / 2 + 1);
  ui.push(Object.assign({ x: x, y: y, w: w, h: h, act: act }, extra || {}));
}
function seedIcon(c, sd, x, y, r) {
  c.fillStyle = sd.col; c.beginPath();
  if (sd.shape === 'root') { c.moveTo(x - r * 0.55, y - r * 0.35); c.lineTo(x + r * 0.55, y - r * 0.35); c.lineTo(x, y + r * 0.95); c.closePath(); }
  else c.arc(x, y + r * 0.1, r * 0.72, 0, TAU);
  c.fill(); c.fillStyle = sd.leaf; c.beginPath(); c.ellipse(x - r * 0.25, y - r * 0.55, r * 0.18, r * 0.42, -0.5, 0, TAU); c.ellipse(x + r * 0.25, y - r * 0.55, r * 0.18, r * 0.42, 0.5, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(x - r * 0.25, y, r * 0.15, r * 0.25, -0.4, 0, TAU); c.fill();
}
function panel(c, K, title, want) {
  const W2 = K.W, H2 = K.H, w = Math.min(560, W2 - 20), h = Math.min(H2 * 0.72, 560, want ? want + 70 : 1e9), x = (W2 - w) / 2, y = H2 - h - 8;
  c.fillStyle = 'rgba(10,20,10,0.35)'; c.fillRect(0, 0, W2, H2); ui.push({ x: 0, y: 0, w: W2, h: y, act: 'close' });
  c.fillStyle = '#FFF9EC'; K.roundRect(c, x, y, w, h + 30, 22); c.fill();
  c.fillStyle = '#3B2A1A'; c.font = K.font(20); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(title, W2 / 2, y + 26);
  c.fillStyle = '#E9DCC4'; K.roundRect(c, x + w - 46, y + 10, 34, 34, 17); c.fill(); c.fillStyle = '#3B2A1A'; c.font = K.font(18); c.fillText('×', x + w - 29, y + 27); ui.push({ x: x + w - 50, y: y + 6, w: 42, h: 42, act: 'close' });
  return { x: x, y: y + 50, w: w, h: h - 56 };
}
function drawPlantSheet(c, K) {
  const owned = SEEDS.filter((s) => S.seeds[s.id] > 0), cols0 = Math.max(2, Math.min(4, Math.floor((Math.min(560, K.W - 20)) / 120)));
  const box = panel(c, K, K.t('plantWhat'), owned.length ? Math.ceil(owned.length / cols0) * 106 + 16 : 130);
  if (!owned.length) { c.fillStyle = '#6B5A44'; c.font = K.font(15, 700); c.fillText(K.t('noSeeds'), K.W / 2, box.y + 30); btn(c, K, K.W / 2 - 100, box.y + 60, 200, 48, K.t('shop'), '#FF8A1F', 'openShop'); return; }
  const cols = Math.max(2, Math.min(4, Math.floor(box.w / 120))), cw = (box.w - 20 - (cols - 1) * 10) / cols, ch = 96;
  owned.forEach((sd, k) => {
    const x = box.x + 10 + (k % cols) * (cw + 10), y = box.y + 6 + Math.floor(k / cols) * (ch + 10);
    if (y + ch > box.y + box.h + 20) return;
    c.fillStyle = '#F1E4C8'; K.roundRect(c, x, y, cw, ch, 16); c.fill(); seedIcon(c, sd, x + cw / 2, y + 32, 20);
    c.fillStyle = '#3B2A1A'; c.font = K.font(13); c.textAlign = 'center'; c.fillText(L(K, sd.name), x + cw / 2, y + 66);
    c.fillStyle = '#7A6448'; c.font = K.font(11, 700); c.fillText('×' + S.seeds[sd.id] + ' · ' + fmtTime(sd.t * 1000 * growMul()), x + cw / 2, y + 84);
    ui.push({ x: x, y: y, w: cw, h: ch, act: 'plant', id: sd.id, key: String(k + 1) });
  });
}
function drawShop(c, K) {
  const st = stock(), box = panel(c, K, K.t('shopT')), t = now(), nextH = (hourKey(t) + 1) * 3600000;
  c.fillStyle = '#7A6448'; c.font = K.font(12, 800); c.fillText(K.t('restock') + ' ' + fmtTime(nextH - t), K.W / 2 - box.w / 4, box.y + 2);
  btn(c, K, box.x + box.w / 2 + 6, box.y - 14, box.w / 2 - 16, 32, K.t('restockAd'), '#22A06B', 'restockAd');
  const rh = Math.min(62, (box.h - 40) / SEEDS.length * 1.0 + 6), y0 = box.y + 26 - (sheet.scroll || 0), view = { y: box.y + 22, h: box.h - 10 };
  c.save(); c.beginPath(); c.rect(box.x, view.y, box.w, view.h + 30); c.clip();
  SEEDS.forEach((sd, k) => {
    const y = y0 + k * (rh + 6), lock = S.lv < sd.lvl, left = st.left[sd.id] || 0; if (y + rh < view.y || y > view.y + view.h + 30) return;
    c.fillStyle = lock ? '#E6DED0' : '#F1E4C8'; K.roundRect(c, box.x + 10, y, box.w - 20, rh, 14); c.fill();
    c.globalAlpha = lock ? 0.45 : 1; seedIcon(c, sd, box.x + 38, y + rh / 2, Math.min(18, rh * 0.32)); c.globalAlpha = 1;
    const rtl = K.rtl; c.textAlign = rtl ? 'right' : 'left'; const tx = rtl ? box.x + box.w - 66 : box.x + 66;
    c.fillStyle = '#3B2A1A'; c.font = K.font(14); c.fillText(L(K, sd.name) + (S.seeds[sd.id] ? '  (×' + S.seeds[sd.id] + ')' : ''), tx, y + rh * 0.34);
    c.fillStyle = '#7A6448'; c.font = K.font(11, 700); c.fillText(lock ? K.t('needLv') + ' ' + sd.lvl : fmtTime(sd.t * 1000 * growMul()) + ' · ' + K.t('sells') + ' ' + sd.sell + ' · ' + K.t('stock') + ' ' + left, tx, y + rh * 0.7);
    c.textAlign = 'center';
    if (!lock) { const bw = 92, bx = rtl ? box.x + 18 : box.x + box.w - bw - 18; btn(c, K, bx, y + rh / 2 - 18, bw, 36, left > 0 ? String(sd.price) : K.t('soldOut'), left > 0 && S.gold >= sd.price ? '#FF8A1F' : '#B9A88C', 'buy', { id: sd.id }); }
  });
  { const y = y0 + SEEDS.length * (rh + 6), lock = S.lv < SPRINKLER.lvl;
    if (y < view.y + view.h + 30) {
      c.fillStyle = '#DDEFFC'; K.roundRect(c, box.x + 10, y, box.w - 20, rh, 14); c.fill();
      c.fillStyle = '#7A8A9A'; c.fillRect(box.x + 34, y + rh * 0.35, 8, rh * 0.45); c.fillStyle = '#3B9BFF'; c.beginPath(); c.arc(box.x + 38, y + rh * 0.32, 9, 0, TAU); c.fill();
      c.textAlign = K.rtl ? 'right' : 'left'; const tx = K.rtl ? box.x + box.w - 66 : box.x + 66;
      c.fillStyle = '#1F3A5A'; c.font = K.font(14); c.fillText(K.t('sprinkler'), tx, y + rh * 0.34); c.fillStyle = '#4A6A8A'; c.font = K.font(11, 700); c.fillText(lock ? K.t('needLv') + ' ' + SPRINKLER.lvl : K.t('sprinklerD'), tx, y + rh * 0.7); c.textAlign = 'center';
      if (!lock) { const bw = 92, bx = K.rtl ? box.x + 18 : box.x + box.w - bw - 18; btn(c, K, bx, y + rh / 2 - 18, bw, 36, S.sprinkler ? K.t('owned') : String(SPRINKLER.price), S.sprinkler ? '#9BB5A3' : S.gold >= SPRINKLER.price ? '#3B82F6' : '#B9A88C', 'sprinkler'); }
    } }
  c.restore();
  sheet.maxScroll = Math.max(0, (SEEDS.length + 1) * (rh + 6) - view.h + 10);
}
function drawAlbum(c, K) {
  const box = panel(c, K, K.t('albumT'), 60 + SEEDS.length * 44), n = Object.keys(S.album).length, tot = SEEDS.length * (MUT_ORDER.length + 1);
  c.fillStyle = '#7A6448'; c.font = K.font(12, 800); c.fillText(n + ' / ' + tot + '  ·  ' + Math.floor(n / tot * 100) + '%', K.W / 2, box.y + 2);
  const cols = MUT_ORDER.length + 1, cw = Math.min(44, (box.w - 120) / cols), rh = Math.min(44, (box.h - 50) / SEEDS.length), x0 = box.x + box.w - 14 - cols * cw;
  ['normal'].concat(MUT_ORDER).forEach((m, j) => { c.fillStyle = m === 'normal' ? '#7A6448' : MUTS[m].col; c.beginPath(); c.arc(x0 + j * cw + cw / 2, box.y + 22, 5, 0, TAU); c.fill(); });
  SEEDS.forEach((sd, k) => {
    const y = box.y + 34 + k * rh; seedIcon(c, sd, box.x + 26, y + rh / 2, Math.min(13, rh * 0.32));
    c.fillStyle = '#3B2A1A'; c.font = K.font(Math.min(12, rh * 0.32)); c.textAlign = 'left'; c.fillText(L(K, sd.name), box.x + 44, y + rh / 2); c.textAlign = 'center';
    ['normal'].concat(MUT_ORDER).forEach((m, j) => {
      const got = S.album[sd.id + ':' + m], cx = x0 + j * cw + cw / 2, cy = y + rh / 2, r = Math.min(cw, rh) * 0.36;
      c.fillStyle = got ? (m === 'normal' ? sd.col : MUTS[m].col) : 'rgba(0,0,0,0.08)'; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
      if (got) { c.fillStyle = '#FFFFFF'; c.font = K.font(r); c.fillText('✓', cx, cy + 1); }
    });
  });
}
function drawOrders(c, K) {
  const od = orders(), box = panel(c, K, K.t('ordersT'), 3 * 92 + 34), t = now(), mid = new Date(t); mid.setHours(24, 0, 0, 0);
  c.fillStyle = '#7A6448'; c.font = K.font(12, 800); c.fillText(K.t('newOrders') + ' ' + fmtTime(mid - t), K.W / 2, box.y + 2);
  od.list.forEach((o, k) => {
    const y = box.y + 18 + k * 92, sd = SEED[o.seed], w = WHO[o.who], done = o.have >= o.need;
    c.fillStyle = o.claimed ? '#E6EFE0' : '#F1E4C8'; K.roundRect(c, box.x + 10, y, box.w - 20, 84, 16); c.fill();
    c.fillStyle = w.col; c.beginPath(); c.arc(box.x + 38, y + 30, 18, 0, TAU); c.fill(); c.fillStyle = '#FFF'; c.font = K.font(16); c.fillText(w.n[0], box.x + 38, y + 31);
    seedIcon(c, sd, box.x + 38, y + 64, 11);
    c.textAlign = K.rtl ? 'right' : 'left'; const tx = K.rtl ? box.x + box.w - 70 : box.x + 70, bw = Math.min(110, box.w * 0.28);
    c.fillStyle = '#3B2A1A'; c.font = K.font(14); c.fillText(w.n + ' ' + K.t('wants') + ' ' + o.need + '× ' + L(K, sd.name), tx, y + 20, box.w - 100 - bw);
    c.fillStyle = '#7A6448'; c.font = K.font(11, 800); c.fillText('+' + o.gold + ' · +' + o.xp + ' XP', tx, y + 40);
    const pw = box.w - 110 - bw, px = K.rtl ? tx - pw : tx; c.fillStyle = 'rgba(0,0,0,0.1)'; K.roundRect(c, px, y + 54, pw, 12, 6); c.fill(); c.fillStyle = done ? '#22A06B' : '#FFB020'; K.roundRect(c, px, y + 54, Math.max(12, pw * Math.min(1, o.have / o.need)), 12, 6); c.fill();
    c.fillStyle = '#3B2A1A'; c.font = K.font(10, 800); c.textAlign = 'center'; c.fillText(Math.min(o.have, o.need) + ' / ' + o.need, px + pw / 2, y + 61);
    const bx = K.rtl ? box.x + 18 : box.x + box.w - bw - 18;
    if (o.claimed) { c.fillStyle = '#22A06B'; c.font = K.font(22); c.fillText('✓', bx + bw / 2, y + 42); }
    else btn(c, K, bx, y + 24, bw, 38, done ? K.t('claim') : '…', done ? '#22A06B' : '#C9B89A', done ? 'claim' : 'none', { i: k });
  });
}
function drawPets(c, K) {
  const box = panel(c, K, K.t('petsT'), 82 + Object.keys(PETS).length * 58); let y = box.y + 4;
  if (S.egg) {
    const left = S.egg.t0 + S.egg.dur - now();
    c.fillStyle = '#F1E4C8'; K.roundRect(c, box.x + 10, y, box.w - 20, 70, 16); c.fill(); c.fillStyle = '#3B2A1A'; c.font = K.font(15); c.fillText(left > 0 ? K.t('eggHatch') + ' ' + fmtTime(left) : K.t('eggReady'), K.W / 2, y + 22);
    if (left <= 0) btn(c, K, K.W / 2 - 80, y + 34, 160, 32, K.t('hatch'), '#FF8A1F', 'hatch'); else { c.fillStyle = '#7A6448'; c.font = K.font(11, 700); c.fillText(K.t('eggTip'), K.W / 2, y + 48); }
  } else {
    c.fillStyle = '#F1E4C8'; K.roundRect(c, box.x + 10, y, box.w - 20, 70, 16); c.fill(); c.fillStyle = '#3B2A1A'; c.font = K.font(15); c.fillText(K.t('buyEgg'), K.W / 2, y + 20);
    btn(c, K, K.W / 2 - 90, y + 32, 180, 32, S.lv < EGG_LVL ? K.t('needLv') + ' ' + EGG_LVL : String(EGG_PRICE), S.lv >= EGG_LVL && S.gold >= EGG_PRICE ? '#FF8A1F' : '#B9A88C', 'egg');
  }
  y += 82;
  Object.keys(PETS).forEach((k) => {
    const pt = PETS[k], have = S.pets.filter((p) => p.type === k).length;
    c.fillStyle = have ? '#E3F5D8' : '#EEE7DA'; K.roundRect(c, box.x + 10, y, box.w - 20, 52, 14); c.fill();
    c.fillStyle = pt.col; c.strokeStyle = '#3B2A1A'; c.lineWidth = 2; c.beginPath(); c.arc(box.x + 36, y + 26, 14, 0, TAU); c.fill(); c.stroke();
    c.textAlign = K.rtl ? 'right' : 'left'; const tx = K.rtl ? box.x + box.w - 60 : box.x + 60;
    c.fillStyle = '#3B2A1A'; c.font = K.font(14); c.fillText((have ? '' : '? ') + L(K, pt.name) + (have > 1 ? ' ×' + have : ''), tx, y + 18);
    c.fillStyle = '#7A6448'; c.font = K.font(11, 700); c.fillText(L(K, pt.bonus) + ' · ' + pt.w + '%', tx, y + 36); c.textAlign = 'center';
    y += 58;
  });
}
function drawPopup(c, K) {
  const p = popup, w = Math.min(360, K.W - 30), h = 230, x = (K.W - w) / 2, y = (K.H - h) / 2, sc = Math.min(1, p.t * 6);
  c.fillStyle = 'rgba(10,20,10,0.45)'; c.fillRect(0, 0, K.W, K.H);
  c.save(); c.translate(K.W / 2, K.H / 2); c.scale(sc, sc); c.translate(-K.W / 2, -K.H / 2);
  c.fillStyle = '#FFF9EC'; K.roundRect(c, x, y, w, h, 24); c.fill(); c.textAlign = 'center'; c.textBaseline = 'middle';
  if (p.kind === 'level') {
    c.fillStyle = '#22A06B'; c.font = K.font(28); c.fillText(K.t('levelUp') + ' ' + p.lv, K.W / 2, y + 44);
    c.fillStyle = '#3B2A1A'; c.font = K.font(14, 700); c.fillText(p.seeds.length ? K.t('newSeed') + ': ' + p.seeds.map((s) => L(K, s.name)).join(', ') : K.t('keepGrowing'), K.W / 2, y + 92);
    if (p.lv === EGG_LVL) c.fillText(K.t('eggUnlocked'), K.W / 2, y + 118);
    else if (p.decor && p.decor.length) { c.fillStyle = '#0F8A7E'; c.fillText(K.t('newDecor') + ': ' + p.decor.map((d) => L(K, d.name)).join(', '), K.W / 2, y + 118, w - 24); }
    p.seeds.forEach((s, i) => seedIcon(c, s, K.W / 2 + (i - (p.seeds.length - 1) / 2) * 50, y + 150, 18));
    btn(c, K, K.W / 2 - 80, y + h - 56, 160, 42, K.t('ok'), '#FF8A1F', 'closePop');
  } else if (p.kind === 'rare') {
    const mc = MUTS[p.mut[p.mut.length - 1]].col; c.fillStyle = '#3B2A1A'; c.font = K.font(Math.min(24, w / 14)); c.fillText(p.mut.map((m) => L(K, MUTS[m].name)).join(' ') + ' ' + L(K, p.seed.name) + '!', K.W / 2, y + 44, w - 20);
    const gl = c.createRadialGradient(K.W / 2, y + 100, 4, K.W / 2, y + 100, 52); gl.addColorStop(0, mc); gl.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gl; c.beginPath(); c.arc(K.W / 2, y + 100, 52, 0, TAU); c.fill();
    seedIcon(c, p.seed, K.W / 2, y + 100, 30); c.fillStyle = '#3B2A1A'; c.font = K.font(18); c.fillText('+' + p.v, K.W / 2, y + 146);
    btn(c, K, x + 16, y + h - 58, w / 2 - 22, 44, K.t('ok'), '#B9A88C', 'closePop'); btn(c, K, x + w / 2 + 6, y + h - 58, w / 2 - 22, 44, K.t('double'), '#22A06B', 'doubleAd');
  } else if (p.kind === 'pet') {
    const pt = PETS[p.type]; c.fillStyle = '#22A06B'; c.font = K.font(24); c.fillText(K.t('hatched') + ' ' + L(K, pt.name) + '!', K.W / 2, y + 44);
    c.fillStyle = pt.col; c.strokeStyle = '#3B2A1A'; c.lineWidth = 3; c.beginPath(); c.arc(K.W / 2, y + 104, 30, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#3B2A1A'; c.font = K.font(14, 700); c.fillText(L(K, pt.bonus), K.W / 2, y + 152); btn(c, K, K.W / 2 - 80, y + h - 56, 160, 42, K.t('ok'), '#FF8A1F', 'closePop');
  } else if (p.kind === 'welcome') {
    c.fillStyle = '#22A06B'; c.font = K.font(24); c.fillText(K.t('welcome'), K.W / 2, y + 40);
    if (p.streak > 1) { c.fillStyle = '#FF6A1F'; c.font = K.font(14); c.fillText(K.t('dayN') + ' ' + p.streak + ' · ' + K.t('streak'), K.W / 2, y + 66); }
    c.fillStyle = '#3B2A1A'; c.font = K.font(15, 700); c.fillText(K.t('grewAway') + ' ' + fmtTime(p.away), K.W / 2, y + 90);
    c.fillText(p.ready + ' ' + K.t('readyCount'), K.W / 2, y + 116); if (p.gift) { c.fillStyle = '#FF8A1F'; c.fillText(K.t('dailyGift') + ': ' + p.gift, K.W / 2, y + 146); }
    btn(c, K, K.W / 2 - 80, y + h - 56, 160, 42, K.t('ok'), '#FF8A1F', 'closePop');
  }
  c.restore();
}
function drawHud(c, K) {
  const top = K.hudH + 6, W2 = K.W;
  // level + xp
  c.fillStyle = 'rgba(255,255,255,0.88)'; K.roundRect(c, 10, top, 150, 40, 20); c.fill();
  c.fillStyle = '#22A06B'; c.beginPath(); c.arc(30, top + 20, 16, 0, TAU); c.fill(); c.fillStyle = '#FFF'; c.font = K.font(14); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(S.lv, 30, top + 21);
  c.fillStyle = 'rgba(0,0,0,0.1)'; K.roundRect(c, 52, top + 15, 98, 10, 5); c.fill(); c.fillStyle = '#4ADE80'; K.roundRect(c, 52, top + 15, Math.max(10, 98 * S.xp / xpNeed(S.lv)), 10, 5); c.fill();
  // event chip
  const t = now(), ev = eventNow(t), nx = nextEvent(t), evName = (e) => K.t('ev_' + e);
  const chip = ev ? evName(ev) + ' · ' + fmtTime(eventEnd(t, ev) - t) : evName(nx[0]) + ' ' + K.t('in') + ' ' + fmtTime(nx[1] - t);
  c.font = K.font(12, 800); const cw = Math.min(W2 - 180, c.measureText(chip).width + 34);
  c.fillStyle = ev ? (ev === 'golden' ? '#FFB020' : ev === 'rain' ? '#3B82F6' : '#5B5BD6') : 'rgba(255,255,255,0.88)'; K.roundRect(c, W2 - cw - 10, top, cw, 40, 20); c.fill();
  c.fillStyle = ev ? '#FFFFFF' : '#3B2A1A'; c.fillText(chip, W2 - cw / 2 - 10, top + 21, cw - 16);
  ui.push({ x: W2 - cw - 10, y: top, w: cw, h: 40, act: 'evInfo' });
  // gold
  c.fillStyle = 'rgba(255,255,255,0.88)'; c.font = K.font(16); const gt = String(S.gold), gw = c.measureText(gt).width + 50; K.roundRect(c, 10, top + 48, gw, 34, 17); c.fill();
  K.drawCoin(c, 28, top + 65, 10, K.time); c.fillStyle = '#3B2A1A'; c.textAlign = 'left'; c.fillText(gt, 44, top + 66); c.textAlign = 'center';
  // bottom buttons
  const n = 6, bs = Math.min(74, (W2 - 20) / n - 8), by = K.H - bs - 12, labels = [['shop', K.t('shop'), '#FF8A1F'], ['orders', K.t('orders'), '#3B82F6'], ['album', K.t('album'), '#7B4DFF'], ['pets', K.t('pets'), '#E85D9A'], ['decor', K.t('decor'), '#14B8A6'], ['boost', K.t('boost'), '#22A06B']];
  labels.forEach((b, i) => {
    const x = W2 / 2 + (i - (n - 1) / 2) * (bs + 8) - bs / 2, cool = b[0] === 'boost' && now() < S.boostAt + BOOST_CD;
    c.fillStyle = 'rgba(0,0,0,0.25)'; K.roundRect(c, x, by + 4, bs, bs, 20); c.fill(); c.fillStyle = cool ? '#9BB5A3' : b[2]; K.roundRect(c, x, by, bs, bs, 20); c.fill();
    iconFor(c, b[0], x + bs / 2, by + bs * 0.4, bs * 0.22); c.fillStyle = '#FFF'; c.font = K.font(Math.min(12, bs / 6)); c.fillText(cool ? fmtTime(S.boostAt + BOOST_CD - now()) : b[1], x + bs / 2, by + bs * 0.8, bs - 6);
    const cl = b[0] === 'orders' ? claimable() : 0; if (cl) { c.fillStyle = '#FF3B4E'; c.beginPath(); c.arc(x + bs - 6, by + 6, 10, 0, TAU); c.fill(); c.fillStyle = '#FFF'; c.font = K.font(11); c.fillText(cl, x + bs - 6, by + 7); }
    if (b[0] === 'pets' && S.egg && now() >= S.egg.t0 + S.egg.dur) { c.fillStyle = '#FF3B4E'; c.beginPath(); c.arc(x + bs - 6, by + 6, 8, 0, TAU); c.fill(); }
    ui.push({ x: x, y: by, w: bs, h: bs, act: b[0] });
  });
  // streak + harvest-all
  if (S.streak > 1) { c.font = K.font(13); const st = K.t('dayN') + ' ' + S.streak, sw = c.measureText(st).width + 34, sx2 = 10, sy2 = top + 90; c.fillStyle = 'rgba(255,255,255,0.88)'; K.roundRect(c, sx2, sy2, sw, 28, 14); c.fill(); c.fillStyle = '#FF6A1F'; c.beginPath(); c.moveTo(sx2 + 15, sy2 + 5); c.quadraticCurveTo(sx2 + 26, sy2 + 15, sx2 + 15, sy2 + 23); c.quadraticCurveTo(sx2 + 5, sy2 + 15, sx2 + 15, sy2 + 5); c.fill(); c.fillStyle = '#3B2A1A'; c.textAlign = 'left'; c.fillText(st, sx2 + 26, sy2 + 15); c.textAlign = 'center'; }
  let ready = 0; for (let i = 0; i < S.open; i++) { const p = S.plots[i]; if (p && plotProgress(p, now()) >= 1) ready++; }
  if (ready >= 2) btn(c, K, W2 / 2 - 95, by - 56, 190, 44, K.t('harvestAll') + ' (' + ready + ')', '#22A06B', 'harvestAll');
}
function iconFor(c, k, x, y, r) {
  c.fillStyle = '#FFFFFF'; c.strokeStyle = '#FFFFFF'; c.lineWidth = r * 0.22; c.lineCap = 'round';
  if (k === 'shop') { c.beginPath(); c.moveTo(x - r, y - r * 0.4); c.lineTo(x + r, y - r * 0.4); c.lineTo(x + r * 0.7, y + r); c.lineTo(x - r * 0.7, y + r); c.closePath(); c.fill(); c.beginPath(); c.arc(x, y - r * 0.4, r * 0.55, Math.PI, 0); c.stroke(); }
  else if (k === 'orders') { c.fillRect(x - r * 0.8, y - r, r * 1.6, r * 2); c.fillStyle = '#3B82F6'; for (let j = 0; j < 3; j++) c.fillRect(x - r * 0.5, y - r * 0.5 + j * r * 0.55, r, r * 0.16); }
  else if (k === 'album') { c.fillRect(x - r, y - r, r * 0.9, r * 2); c.fillRect(x + r * 0.1, y - r, r * 0.9, r * 2); }
  else if (k === 'decor') { c.beginPath(); for (let j = 0; j < 5; j++) { const a = j / 5 * TAU - Math.PI / 2; c.moveTo(x, y - r * 0.15); c.arc(x + Math.cos(a) * r * 0.5, y - r * 0.15 + Math.sin(a) * r * 0.5, r * 0.38, 0, TAU); } c.fill(); c.fillStyle = '#FFD23C'; c.beginPath(); c.arc(x, y - r * 0.15, r * 0.3, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.fillRect(x - r * 0.08, y + r * 0.4, r * 0.16, r * 0.7); }
  else if (k === 'pets') { c.beginPath(); c.ellipse(x, y + r * 0.3, r * 0.55, r * 0.45, 0, 0, TAU); c.fill(); [[-0.7, -0.4], [-0.25, -0.85], [0.25, -0.85], [0.7, -0.4]].forEach((q) => { c.beginPath(); c.arc(x + q[0] * r, y + q[1] * r, r * 0.22, 0, TAU); c.fill(); }); }
  else { c.beginPath(); c.moveTo(x - r * 0.3, y - r); c.lineTo(x + r * 0.5, y - r * 0.1); c.lineTo(x, y - r * 0.1); c.lineTo(x + r * 0.3, y + r); c.lineTo(x - r * 0.5, y + r * 0.1); c.lineTo(x, y + r * 0.1); c.closePath(); c.fill(); }
}
function drawPlotLabels(c, K) {
  const t = now(); let hand = false;
  for (let i = 0; i < GRID * GRID; i++) {
    const p = S.plots[i], pos = plotPos(i);
    if (i >= S.open) {
      if (i !== S.open) continue; const s = screenOf(pos.setY(0.5)), cost = plotCost(S.open - START_PLOTS);
      c.fillStyle = S.gold >= cost ? 'rgba(255,176,32,0.95)' : 'rgba(255,255,255,0.85)'; K.roundRect(c, s.x - 34, s.y - 14, 68, 28, 14); c.fill();
      K.drawCoin(c, s.x - 18, s.y, 7, 0); c.fillStyle = '#3B2A1A'; c.font = K.font(12); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('+' + cost, s.x + 8, s.y + 1);
      continue;
    }
    if (!p) { if (S.tut === 0 && i === 5) { const s = screenOf(pos.setY(0.3)); K.drawHand(c, s.x, s.y, (K.time * 1.5) % 1 > 0.5, Math.min(K.W, K.H) / 240); } continue; }
    const g = plotProgress(p, t), s = screenOf(pos.setY(g >= 1 ? 1.35 : 1.05));
    if (g >= 1) {
      const b = Math.sin(K.time * 6 + i) * 3, mut = p.mut && p.mut.length; c.fillStyle = mut ? MUTS[p.mut[p.mut.length - 1]].col : '#4ADE80';
      c.beginPath(); c.arc(s.x, s.y + b, 13, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.font = K.font(14); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(mut ? '★' : '✓', s.x, s.y + b + 1);
      if (S.tut <= 2 && S.harvested === 0 && !hand && (hand = true)) K.drawHand(c, s.x, s.y + 30, (K.time * 1.5) % 1 > 0.5, Math.min(K.W, K.H) / 240);
    } else {
      c.fillStyle = 'rgba(0,0,0,0.45)'; K.roundRect(c, s.x - 30, s.y - 11, 60, 22, 11); c.fill();
      c.fillStyle = '#4ADE80'; K.roundRect(c, s.x - 30, s.y - 11, 60 * g, 22, 11); c.fill();
      c.fillStyle = '#FFFFFF'; c.font = K.font(11); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(fmtTime(p.t0 + p.dur - t), s.x, s.y + 1);
      if (!p.w) { c.fillStyle = '#3B9BFF'; c.beginPath(); c.arc(s.x + 36, s.y, 9, 0, TAU); c.fill(); c.fillStyle = '#FFF'; c.beginPath(); c.moveTo(s.x + 36, s.y - 5); c.quadraticCurveTo(s.x + 41, s.y + 2, s.x + 36, s.y + 5); c.quadraticCurveTo(s.x + 31, s.y + 2, s.x + 36, s.y - 5); c.fill(); }
      if (S.tut === 1 && !p.w && !hand && (hand = true)) K.drawHand(c, s.x + 36, s.y + 12, (K.time * 1.5) % 1 > 0.5, Math.min(K.W, K.H) / 240);
    }
  }
  if (eggObj) { const left = S.egg.t0 + S.egg.dur - t, s = screenOf(eggObj.position.clone().setY(0.9)); c.fillStyle = left <= 0 ? '#FF8A1F' : 'rgba(0,0,0,0.45)'; K.roundRect(c, s.x - 30, s.y - 11, 60, 22, 11); c.fill(); c.fillStyle = '#FFF'; c.font = K.font(11); c.textAlign = 'center'; c.fillText(left <= 0 ? K.t('hatch') : fmtTime(left), s.x, s.y + 1); ui.push({ x: s.x - 40, y: s.y - 40, w: 80, h: 80, act: 'pets' }); }
}
function drawFx(c, K, dt) {
  fx.forEach((f) => {
    f.t += dt;
    if (f.bit) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 520 * dt; c.globalAlpha = Math.max(0, 1 - f.t * 1.3); c.fillStyle = f.col; c.beginPath(); c.arc(f.x, f.y, f.r, 0, TAU); c.fill(); }
    else if (f.drop) { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 400 * dt; c.globalAlpha = Math.max(0, 1 - f.t * 1.6); c.fillStyle = '#5AB8FF'; c.beginPath(); c.arc(f.x, f.y, 4, 0, TAU); c.fill(); }
    else { c.globalAlpha = Math.max(0, Math.min(1, 2.2 - f.t * 1.6)); c.font = K.font(f.big ? 26 : 18); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 5; c.strokeStyle = 'rgba(40,30,10,0.75)'; const y = f.y - f.t * 40; c.strokeText(f.txt, f.x, y); c.fillStyle = f.col; c.fillText(f.txt, f.x, y); }
  });
  c.globalAlpha = 1; fx = fx.filter((f) => f.t < 1.4);
}

/* ---------------- loop ---------------- */
let lastT = 0, saveT = 0, drag = null;
function tick(dt, K) {
  if (!S) return; const t = now();
  S.plots.forEach((p) => { if (p && !p.mut && plotProgress(p, t) >= 1) { finalize(p); syncPlot(S.plots.indexOf(p)); } });
  if (popup) popup.t += dt;
  if (K.creator) { if (S.gold < 9e6) S.gold = 9999999; SEEDS.forEach((s) => { if (!(S.seeds[s.id] >= 50)) S.seeds[s.id] = 99; }); } // CREATOR
  saveT += dt; if (saveT > 10) { saveT = 0; save(); }
  K.setScore(S.earned || 0);
}
let perfT = 0, perfN = 0, quality = 0;
function adapt(dt) { // drop resolution (then shadows) on slow devices
  perfT += dt; perfN++;
  if (perfT < 2.5) return; const avg = perfT / perfN; perfT = 0; perfN = 0;
  if (avg > 0.034 && quality < 3) {
    quality++; R.setPixelRatio(Math.max(0.7, Math.min(window.devicePixelRatio || 1, 1.75) - quality * 0.35)); R.setSize(W, H, false);
    if (quality >= 3) { R.shadowMap.enabled = false; scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); }
  }
}
function render3d(dt, K) {
  if (!R || !webglOk) return; if (!TEST || window.__groveAdapt) adapt(dt); const t = K.time, ms = now(), ev = eventNow(ms);
  updateSky(ms, ev || ''); updateRain(dt); placeCam(t); updatePets(dt, t); updateSprinkler(t); updateDecor(dt, t, ms);
  clouds.forEach((cl) => { cl.a += cl.s * dt; cl.o.position.set(Math.cos(cl.a) * cl.r, cl.y, Math.sin(cl.a) * cl.r); });
  for (let i = 0; i < GRID * GRID; i++) {
    const p = S.plots[i], pg = plotG[i]; if (!p || i >= S.open || !pg.plant.userData.leaves) continue;
    const g = plotProgress(p, ms), parts = pg.plant.userData, giant = parts.giant ? 1.45 : 1;
    parts.leaves.scale.setScalar(0.25 + 0.75 * Math.min(1, g * 1.4)); parts.prod.scale.setScalar(Math.max(0.001, smooth(0.3, 1, g)));
    const pd = pg.plant.userData, pop = pd.popT > 0 ? 1 + Math.sin(pd.popT * 24) * pd.popT * 0.7 : 1; if (pd.popT > 0) pd.popT -= dt;
    pg.plant.scale.setScalar(giant * pop * (g >= 1 ? 1 + Math.sin(t * 3 + i) * 0.03 : 1));
    if (p.mut && p.mut.indexOf('rainbow') >= 0) parts.mats.forEach((m, k) => m.color.setHSL((t * 0.25 + k * 0.1) % 1, 0.8, 0.6));
    const sp = pg.plant.getObjectByName('sparkle'); if (sp) { sp.rotation.y += dt * 0.8; sp.material.opacity = 0.6 + Math.sin(t * 6 + i) * 0.4; }
  }
  if (sel >= 0 && sel < S.open) { glowRing.visible = true; glowRing.position.x = plotPos(sel).x; glowRing.position.z = plotPos(sel).z; glowRing.material.opacity = 0.5 + Math.sin(t * 5) * 0.3; } else glowRing.visible = false;
  flyers.forEach((f) => { f.t += dt * 1.6; const k = Math.min(1, f.t); f.o.position.lerpVectors(f.a, BARROW, k); f.o.position.y += Math.sin(k * Math.PI) * 2.5; f.o.rotation.y += dt * 8; f.o.scale.multiplyScalar(0.985); if (k >= 1) { scene.remove(f.o); f.done = true; } });
  flyers = flyers.filter((f) => !f.done);
  pond.material.emissiveIntensity = 0.2 + Math.sin(t * 2) * 0.05;
  R.render(scene, cam);
}

/* ---------------- kit hookup ---------------- */
function startSession(K) {
  S = load(); const t = now(), away = t - (S.last || t); let gift = '';
  stock();
  const today = new Date(t).toDateString();
  if (!S.day && !S.harvested) { S.day = today; S.streak = 1; } // first day: the starter pack is the gift
  if (S.day !== today) { // daily seed gift
    S.streak = S.day === new Date(t - 864e5).toDateString() ? (S.streak || 1) + 1 : 1;
    S.day = today; const pool = SEEDS.filter((s) => s.lvl <= S.lv + 1), pick = pool[Math.floor(Math.random() * pool.length)], n = (pick.price < 50 ? 3 : 1) * (1 + Math.floor((S.streak - 1) / 3));
    S.seeds[pick.id] = (S.seeds[pick.id] || 0) + n; gift = n + '× ' + L(K, pick.name);
    if (S.streak % 7 === 0) { const rare = SEEDS.filter((s) => s.lvl <= S.lv + 2).pop(); S.seeds[rare.id] = (S.seeds[rare.id] || 0) + 1; gift = rare.id === pick.id ? (n + 1) + '× ' + L(K, pick.name) : gift + ' + 1× ' + L(K, rare.name); }
  }
  const readyN = S.plots.filter((p) => p && plotProgress(p, t) >= 1).length;
  if (away > 5 * 60000 || gift) popup = { kind: 'welcome', away: away, ready: readyN, gift: gift && S.harvested ? gift : '', streak: S.streak, t: 0 };
  if (!S.harvested) popup = null; // brand-new players go straight to planting
  syncAll(); buildSprinkler(); syncDecor(); K.setScore(S.earned || 0); save();
}
function hit(x, y) { for (let i = ui.length - 1; i >= 0; i--) { const u = ui[i]; if (x >= u.x && x <= u.x + u.w && y >= u.y && y <= u.y + u.h) return u; } return null; }
function act(K, u) {
  if (!u) return false; const a = u.act;
  if (a === 'close') { sheet = null; K.sfx('click'); }
  else if (a === 'closePop') { popup = null; K.sfx('click'); }
  else if (a === 'shop' || a === 'openShop') { sheet = { kind: 'shop', scroll: 0 }; K.sfx('click'); }
  else if (a === 'album') { sheet = { kind: 'album' }; K.sfx('click'); }
  else if (a === 'pets') { if (S.egg && now() >= S.egg.t0 + S.egg.dur) hatch(K); else { sheet = { kind: 'pets' }; K.sfx('click'); } }
  else if (a === 'boost') boost(K);
  else if (a === 'orders') { sheet = { kind: 'orders' }; K.sfx('click'); }
  else if (a === 'claim') claim(K, u.i);
  else if (a === 'harvestAll') harvestAll(K);
  else if (a === 'sprinkler') buySprinkler(K);
  else if (a === 'decor') { sheet = { kind: 'decor', scroll: 0 }; K.sfx('click'); }
  else if (a === 'buyDecor') buyDecor(K, u.id);
  else if (a === 'plant') plant(K, sheet.plot, u.id);
  else if (a === 'buy') buySeed(K, u.id);
  else if (a === 'egg') buyEgg(K);
  else if (a === 'hatch') { hatch(K); sheet = null; }
  else if (a === 'restockAd') K.rewarded((ok) => { if (ok) { S.stock = makeStock(hourKey(now()) * 7919 + Math.floor(Math.random() * 1e6)); S.stock.key = hourKey(now()); S.stock.forced = true; K.sfx('reward'); save(); } });
  else if (a === 'doubleAd') { const p = popup; K.rewarded((ok) => { if (ok && p) { S.gold += p.v; S.earned = (S.earned || 0) + p.v; K.sfx('reward'); K.confetti(40); K.setScore(S.earned || 0); save(); } popup = null; }); }
  else if (a === 'evInfo') { const t = now(), ev = eventNow(t), nx = nextEvent(t); K.toast(K.t('evTip_' + (ev || nx[0]))); }
  return true;
}
const mascot = (mood, size) => '<svg ' + (size ? 'width="' + size + '" height="' + size + '" ' : '') + 'viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#7BC86C"/><path d="M14 46 Q32 36 50 46 L50 60 L14 60Z" fill="#8A5A3C"/><path d="M32 46 L32 26" stroke="#2E7D32" stroke-width="4" stroke-linecap="round"/><path d="M32 30 Q20 26 18 16 Q30 16 32 30Z M32 28 Q44 22 46 12 Q34 14 32 28Z" fill="#4CAF50"/>' + (mood === 'sad' ? '' : '<circle cx="40" cy="44" r="6" fill="#FF8A1F"/>') + '</svg>';

BubziKit.run({
  id: 'pocket-grove', coinRate: 0, noSkins: true, mascot: mascot,
  title: { en: 'Pocket Grove', fr: 'Pocket Grove', ar: 'بستان الجيب' },
  strings: {
    en: { decor: 'DECOR', decorT: 'Garden Decorations', charm: 'Garden charm', charmGold: 'harvest gold', newDecor: 'New decoration', orders: 'ORDERS', ordersT: 'Daily Orders', newOrders: 'New orders in', claim: 'CLAIM', wants: 'wants', ordersDone: 'All orders done! Bonus:', harvestAll: 'Harvest all', streak: 'in a row!', dayN: 'Day', sprinkler: 'Sprinkler', sprinklerD: 'Waters every new plant for you', owned: 'Owned', tagline: 'A tiny 3D garden that grows while you sleep.', shop: 'SEEDS', album: 'ALBUM', pets: 'PETS', boost: '+15 MIN', plantWhat: 'What do you want to plant?', noSeeds: 'No seeds left. Buy some!', shopT: 'Seed Shop', restock: 'New seeds in', restockAd: 'Restock now · AD', sells: 'sells', stock: 'left', soldOut: 'Sold out', needLv: 'Level', needGold: 'Not enough gold yet', albumT: 'Harvest Album', petsT: 'Pets', buyEgg: 'Pet egg: hatches into a helper', eggHatch: 'Your egg hatches in', eggReady: 'Your egg is ready!', eggTip: 'Plants and pets keep growing while you are away', hatch: 'HATCH', hatched: 'You got a', levelUp: 'Level', newSeed: 'New seed', keepGrowing: 'Keep growing!', eggUnlocked: 'Pet eggs unlocked!', ok: 'OK', double: 'x2 · AD', welcome: 'Welcome back!', grewAway: 'Your garden grew for', readyCount: 'plants are ready to harvest', dailyGift: 'Daily gift', lockedPlot: 'Unlock the plots in order', boostWait: 'Boost ready soon', boosted: 'Everything grew 15 minutes!', in: 'in', ev_rain: 'Ink Rain', ev_golden: 'Golden Hour', ev_moon: 'Moonlight', evTip_rain: 'Ink Rain: plants growing in the rain can turn Wet (x2)', evTip_golden: 'Golden Hour (7–8 pm): harvests can turn Golden (x5)', evTip_moon: 'Moonlight (9–10 pm): harvests can turn Moonlit (x4)' },
    fr: { decor: 'DÉCO', decorT: 'Décorations du jardin', charm: 'Charme du jardin', charmGold: 'd’or par récolte', newDecor: 'Nouvelle décoration', orders: 'COMMANDES', ordersT: 'Commandes du jour', newOrders: 'Nouvelles commandes dans', claim: 'PRENDRE', wants: 'veut', ordersDone: 'Toutes les commandes faites ! Bonus :', harvestAll: 'Tout récolter', streak: 'd’affilée !', dayN: 'Jour', sprinkler: 'Arroseur', sprinklerD: 'Arrose chaque nouvelle plante pour toi', owned: 'Acquis', tagline: 'Un petit jardin 3D qui pousse pendant que tu dors.', shop: 'GRAINES', album: 'ALBUM', pets: 'ANIMAUX', boost: '+15 MIN', plantWhat: 'Que veux-tu planter ?', noSeeds: 'Plus de graines. Achètes-en !', shopT: 'Boutique de graines', restock: 'Nouvelles graines dans', restockAd: 'Réassort · PUB', sells: 'vaut', stock: 'en stock', soldOut: 'Épuisé', needLv: 'Niveau', needGold: 'Pas encore assez d’or', albumT: 'Album des récoltes', petsT: 'Animaux', buyEgg: 'Œuf : éclot en un compagnon', eggHatch: 'Ton œuf éclot dans', eggReady: 'Ton œuf est prêt !', eggTip: 'Les plantes et les animaux grandissent même quand tu es absent', hatch: 'ÉCLORE', hatched: 'Tu as un', levelUp: 'Niveau', newSeed: 'Nouvelle graine', keepGrowing: 'Continue à cultiver !', eggUnlocked: 'Œufs débloqués !', ok: 'OK', double: 'x2 · PUB', welcome: 'Bon retour !', grewAway: 'Ton jardin a poussé pendant', readyCount: 'plantes sont prêtes', dailyGift: 'Cadeau du jour', lockedPlot: 'Débloque les parcelles dans l’ordre', boostWait: 'Boost bientôt prêt', boosted: 'Tout a poussé de 15 minutes !', in: 'dans', ev_rain: 'Pluie d’encre', ev_golden: 'Heure dorée', ev_moon: 'Clair de lune', evTip_rain: 'Pluie d’encre : les plantes sous la pluie peuvent devenir Mouillées (x2)', evTip_golden: 'Heure dorée (19–20 h) : les récoltes peuvent devenir Dorées (x5)', evTip_moon: 'Clair de lune (21–22 h) : les récoltes peuvent devenir Lunaires (x4)' },
    ar: { decor: 'زينة', decorT: 'زينة الحديقة', charm: 'جمال الحديقة', charmGold: 'ذهب الحصاد', newDecor: 'زينة جديدة', orders: 'الطلبات', ordersT: 'طلبات اليوم', newOrders: 'طلبات جديدة بعد', claim: 'استلم', wants: 'يريد', ordersDone: 'أنجزت كل الطلبات! مكافأة:', harvestAll: 'احصد الكل', streak: 'على التوالي!', dayN: 'اليوم', sprinkler: 'رشاش ماء', sprinklerD: 'يسقي كل نبتة جديدة عنك', owned: 'مملوك', tagline: 'حديقة صغيرة ثلاثية الأبعاد تنمو وأنت نائم.', shop: 'البذور', album: 'الألبوم', pets: 'الحيوانات', boost: '+15 دقيقة', plantWhat: 'ماذا تريد أن تزرع؟', noSeeds: 'لا توجد بذور. اشترِ بعضها!', shopT: 'متجر البذور', restock: 'بذور جديدة بعد', restockAd: 'تجديد الآن · إعلان', sells: 'يُباع بـ', stock: 'متبقٍ', soldOut: 'نفد', needLv: 'المستوى', needGold: 'الذهب لا يكفي بعد', albumT: 'ألبوم المحاصيل', petsT: 'الحيوانات', buyEgg: 'بيضة: يفقس منها مساعد', eggHatch: 'بيضتك تفقس بعد', eggReady: 'بيضتك جاهزة!', eggTip: 'النباتات والحيوانات تنمو حتى وأنت بعيد', hatch: 'افقس', hatched: 'حصلت على', levelUp: 'المستوى', newSeed: 'بذرة جديدة', keepGrowing: 'واصل الزراعة!', eggUnlocked: 'فُتحت البيوض!', ok: 'حسناً', double: 'x2 · إعلان', welcome: 'مرحباً بعودتك!', grewAway: 'نمت حديقتك لمدة', readyCount: 'نباتات جاهزة للحصاد', dailyGift: 'هدية اليوم', lockedPlot: 'افتح الأحواض بالترتيب', boostWait: 'التسريع جاهز قريباً', boosted: 'نما كل شيء 15 دقيقة!', in: 'بعد', ev_rain: 'مطر الحبر', ev_golden: 'الساعة الذهبية', ev_moon: 'ضوء القمر', evTip_rain: 'مطر الحبر: النباتات التي تنمو تحت المطر قد تصبح مبلّلة (x2)', evTip_golden: 'الساعة الذهبية (7–8 مساءً): المحاصيل قد تصبح ذهبية (x5)', evTip_moon: 'ضوء القمر (9–10 مساءً): المحاصيل قد تصبح قمرية (x4)' }
  },
  creator: function (K) { // CREATOR (temporary): everything unlocked, gold never runs out
    if (!S) S = load(); S.gold = Math.max(S.gold, 9999999); if (S.lv < 12) { S.lv = 12; S.xp = 0; } S.open = GRID * GRID; S.sprinkler = true;
    SEEDS.forEach((s) => { S.seeds[s.id] = Math.max(S.seeds[s.id] || 0, 99); }); DECOR.forEach((d) => { if (!S.decor[d.id]) S.decor[d.id] = now(); });
    Object.keys(PETS).forEach((t) => { if (!hasPet(t)) S.pets.push({ type: t, at: now() }); }); if (S.tut < 4) S.tut = 4;
    syncAll(); buildSprinkler(); syncDecor(); save();
  },
  init: function (K) { K0 = K; TEST = !!K.test; buildScene(K); S = load(); layoutCam(K); syncAll(); },
  resize: function (K) { layoutCam(K); },
  reset: function (K) {
    K0 = K; sheet = null; popup = null; fx = []; startSession(K); layoutCam(K);
    if (K.test) {
      window.__grove = { state: () => S, skip: (sec) => { window.__groveOffset = (window.__groveOffset || 0) + sec * 1000; }, setClock: (ms) => { window.__groveOffset = ms - Date.now(); }, tap: (i) => tapPlot(K, i), plant: (i, id) => plant(K, i, id), harvest: (i) => harvest(K, i), give: (g) => { S.gold += g; K.setScore(S.earned || 0); }, xp: (n) => addXp(K, n), seeds: (id, n) => { S.seeds[id] = (S.seeds[id] || 0) + n; }, mut: (i, m) => { const p = S.plots[i]; if (p) { p.mut = m; syncPlot(i); } }, reload: () => startSession(K), egg: (ms) => { S.egg = { t0: now(), dur: ms }; syncPets(); }, orders: () => orders(), claim: (k) => claim(K, k), harvestAll: () => harvestAll(K), sprinkler: () => buySprinkler(K), decor: (id) => buyDecor(K, id), poke: (id) => pokeDecor(K, id), decorScreen: (id) => { const o = decorObjs[id]; return o ? screenOf(o.g.position.clone().setY(DSPOT[id][3] * 0.5)) : null; }, ready: () => ready3d, screen: (i) => screenOf(plotPos(i).setY(0.3)), camYaw: (y) => { camYawT = y; } };
      K.dbg = () => ({ gold: S.gold, lv: S.lv, xp: S.xp, open: S.open, seeds: S.seeds, plots: S.plots.map((p) => (p ? { seed: p.seed, g: plotProgress(p, now()), w: p.w, mut: p.mut } : null)), sheet: sheet && sheet.kind, popup: popup && popup.kind, pets: S.pets.map((p) => p.type), egg: !!S.egg, album: Object.keys(S.album).length, stock: stock().left, ev: eventNow(now()), tut: S.tut, ready3d: ready3d, webgl: webglOk, streak: S.streak, sprinkler: S.sprinkler, decor: Object.keys(S.decor), decor3d: Object.keys(decorObjs), charm: charm(), orders: orders().list.map((o) => [o.seed, o.have, o.need, o.claimed]) });
    }
  },
  update: function (dt, K) { tick(dt, K); },
  idle: function (dt, K) { if (S) tick(dt, K); },
  draw: function (c, K) {
    const dt = Math.min(0.05, (performance.now() - (lastT || performance.now())) / 1000); lastT = performance.now();
    if (!webglOk) { c.fillStyle = '#7BC86C'; c.fillRect(0, 0, K.W, K.H); c.fillStyle = '#fff'; c.font = K.font(18); c.textAlign = 'center'; c.fillText('WebGL is needed to play Pocket Grove', K.W / 2, K.H / 2); return; }
    if (!S || !R) return;
    if (W !== K.W || H !== K.H) layoutCam(K);
    render3d(dt, K); c.drawImage(R.domElement, 0, 0, K.W, K.H);
    ui = []; if (SHOT) return; drawPlotLabels(c, K); drawHud(c, K); drawFx(c, K, dt);
    if (sheet) { if (sheet.kind === 'plant') drawPlantSheet(c, K); else if (sheet.kind === 'shop') drawShop(c, K); else if (sheet.kind === 'album') drawAlbum(c, K); else if (sheet.kind === 'pets') drawPets(c, K); else if (sheet.kind === 'orders') drawOrders(c, K); else if (sheet.kind === 'decor') drawDecor(c, K); }
    if (popup) { ui = []; drawPopup(c, K); }
    if (!ready3d) { c.fillStyle = 'rgba(255,255,255,0.9)'; c.font = K.font(16); c.textAlign = 'center'; c.fillText('…', K.W / 2, K.H / 2); }
  },
  pointerDown: function (x, y, K, id) { drag = { x: x, y: y, x0: x, y0: y, yaw: camYawT, s0: sheet ? sheet.scroll || 0 : 0, moved: false, id: id }; },
  pointerMove: function (x, y, K, id, down) {
    if (!drag || !down || drag.id !== id || popup) return;
    if (sheet) { if ((sheet.kind === 'shop' || sheet.kind === 'decor') && Math.abs(y - drag.y0) > 10) { drag.moved = true; sheet.scroll = clamp(drag.s0 - (y - drag.y0), 0, sheet.maxScroll || 0); } return; } if (Math.abs(x - drag.x0) > 10) drag.moved = true; if (drag.moved) camYawT = clamp(drag.yaw - (x - drag.x0) * 0.006, -0.3, 1.4); },
  pointerUp: function (x, y, K, id) {
    if (!drag || drag.id !== id) return; const moved = drag.moved; drag = null; if (moved) return;
    if (act(K, hit(x, y))) return;
    if (sheet || popup) return;
    const pi = pickPlot(x, y); if (pi < 0) { const dh = pickDecor(x, y); if (dh) { pokeDecor(K, dh); return; } }
    tapPlot(K, pi);
  },
  pointerCancel: function () { drag = null; },
  key: function (code, down, K, rep) {
    if (!down || rep || !S) return;
    if (popup) { if (code === 'Enter' || code === 'Space' || code === 'Backspace') { popup = null; K.sfx('click'); } return; }
    if (sheet) {
      if (code === 'Backspace') { sheet = null; return; }
      const d = /^Digit([1-9])$/.exec(code); if (d && sheet.kind === 'plant') { const u = ui.filter((q) => q.act === 'plant')[+d[1] - 1]; if (u) act(K, u); return; }
      if ((sheet.kind === 'shop' || sheet.kind === 'decor') && (code === 'ArrowDown' || code === 'ArrowUp')) sheet.scroll = clamp((sheet.scroll || 0) + (code === 'ArrowDown' ? 60 : -60), 0, sheet.maxScroll || 0);
      return;
    }
    const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -GRID, ArrowDown: GRID }[code];
    if (mv) { sel = sel < 0 ? 0 : clamp(sel + mv, 0, S.open - 1); K.sfx('tick'); return; }
    if ((code === 'Enter' || code === 'Space') && sel >= 0) tapPlot(K, sel);
    else if (code === 'KeyS') act(K, { act: 'shop' }); else if (code === 'KeyA') act(K, { act: 'album' }); else if (code === 'KeyH') act(K, { act: 'pets' }); else if (code === 'KeyO') act(K, { act: 'orders' }); else if (code === 'KeyD') act(K, { act: 'decor' }); else if (code === 'KeyX') harvestAll(K); else if (code === 'KeyB') boost(K);
    else if (code === 'KeyQ') camYawT = clamp(camYawT - 0.3, -0.3, 1.4); else if (code === 'KeyE') camYawT = clamp(camYawT + 0.3, -0.3, 1.4);
  }
});
