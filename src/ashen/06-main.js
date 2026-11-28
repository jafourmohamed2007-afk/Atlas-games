/* ===== ASHEN VIGIL: boot, resize, input (keyboard + touch joystick), main loop ===== */
const screenC = document.getElementById('game');
const sctx = screenC.getContext('2d', { alpha: false });
const buf = mk(480, 270);
ctx = buf.getContext('2d');
let DPR = 1;
function resize() {
  DPR = Math.min(3, window.devicePixelRatio || 1);
  const pw = Math.round(window.innerWidth * DPR), ph = Math.round(window.innerHeight * DPR);
  // integer upscale factor chosen from the smaller side so the buffer stays ~250-300px on that side
  const side = Math.min(pw, ph);
  SC = Math.max(1, Math.round(side / 270)); while (SC > 1 && side / SC < 225) SC--;
  W = Math.ceil(pw / SC); H = Math.ceil(ph / SC);
  buf.width = W; buf.height = H; ctx.imageSmoothingEnabled = false;
  screenC.width = W * SC; screenC.height = H * SC;
  screenC.style.width = (W * SC / DPR) + 'px'; screenC.style.height = (H * SC / DPR) + 'px';
  sctx.imageSmoothingEnabled = false;
  makeVignette();
}
window.addEventListener('resize', resize);

// ---------- keyboard ----------
const KEYS = {};
window.addEventListener('keydown', (e) => {
  AU.init();
  const k = e.code; KEYS[k] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(k)) e.preventDefault();
  UI.touch = false;
  if (k === 'KeyP' || k === 'Escape') {
    if (G.state === 'play' || G.state === 'pause') togglePause();
    else if (G.state === 'title' && SCREEN !== 'title') SCREEN = 'title';
    return;
  }
  if (G.state === 'play') return;
  if (G.state === 'levelup' && /^Digit[1-4]$/.test(k)) { UI.pickN = +k.slice(5); return; }
  if (G.state === 'levelup' && k === 'KeyR') { reroll(); return; }
  if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'Tab' || k === 'KeyD' || k === 'KeyS') { if (UI.focus && UI.focus[0] === 's' && UI.focus.length === 2 && (k === 'ArrowRight' || k === 'KeyD')) UI.nudge = 1; else uiNav(1); e.preventDefault(); }
  else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'KeyA' || k === 'KeyW') { if (UI.focus && UI.focus[0] === 's' && UI.focus.length === 2 && (k === 'ArrowLeft' || k === 'KeyA')) UI.nudge = -1; else uiNav(-1); }
  else if (k === 'Enter' || k === 'Space') { if (UI.focus) UI.keyAct = true; else if (G.state === 'title' && SCREEN === 'title') beginRun(); }
});
window.addEventListener('keyup', (e) => { KEYS[e.code] = false; });
window.addEventListener('blur', () => { for (const k in KEYS) KEYS[k] = false; JOY.on = false; if (G.state === 'play') togglePause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play') togglePause(); });

// ---------- pointer: UI clicks + virtual joystick on the left half ----------
const JOY = { on: false, id: -1, bx: 0, by: 0, kx: 0, ky: 0, dx: 0, dy: 0 };
const toBuf = (e) => { const r = screenC.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
const pdown = {};
screenC.addEventListener('pointerdown', (e) => {
  AU.init(); e.preventDefault();
  UI.touch = e.pointerType === 'touch';
  const [x, y] = toBuf(e); UI.mx = x; UI.my = y; UI.down = true;
  pdown[e.pointerId] = { x, y, joy: false };
  if (G.state === 'play' && x < W / 2 && !JOY.on && !(x < 82 && y < 40)) {
    Object.assign(JOY, { on: true, id: e.pointerId, bx: x, by: y, kx: x, ky: y, dx: 0, dy: 0 }); pdown[e.pointerId].joy = true;
  }
  try { screenC.setPointerCapture(e.pointerId); } catch (er) { }
});
screenC.addEventListener('pointermove', (e) => {
  const [x, y] = toBuf(e);
  if (JOY.on && e.pointerId === JOY.id) {
    let dx = x - JOY.bx, dy = y - JOY.by; const d = Math.hypot(dx, dy), R = 22;
    if (d > R) { JOY.bx += dx / d * (d - R); JOY.by += dy / d * (d - R); dx = x - JOY.bx; dy = y - JOY.by; } // base follows the finger
    JOY.kx = x; JOY.ky = y; JOY.dx = dx / R; JOY.dy = dy / R;
    return;
  }
  UI.mx = x; UI.my = y;
  if (e.pointerType === 'mouse') UI.touch = false;
});
function pup(e) {
  const pd = pdown[e.pointerId]; delete pdown[e.pointerId];
  if (JOY.on && e.pointerId === JOY.id) { JOY.on = false; JOY.dx = JOY.dy = 0; UI.down = Object.keys(pdown).length > 0; return; }
  UI.down = Object.keys(pdown).length > 0;
  if (!pd || pd.joy || e.type === 'pointercancel') return;
  const [x, y] = toBuf(e);
  UI.click = { x, y };
  if (UI.touch) { UI.mx = -1; UI.my = -1; }
}
screenC.addEventListener('pointerup', pup);
screenC.addEventListener('pointercancel', pup);
screenC.addEventListener('contextmenu', (e) => e.preventDefault());

function readInput() {
  let x = 0, y = 0;
  if (KEYS.KeyA || KEYS.ArrowLeft) x -= 1; if (KEYS.KeyD || KEYS.ArrowRight) x += 1;
  if (KEYS.KeyW || KEYS.ArrowUp) y -= 1; if (KEYS.KeyS || KEYS.ArrowDown) y += 1;
  if (JOY.on) { const d = Math.hypot(JOY.dx, JOY.dy); if (d > 0.18) { x += JOY.dx; y += JOY.dy; } }
  if (window.__avBot) { const v = window.__avBot(); x = v[0]; y = v[1]; } // automated test bots only
  IN.x = x; IN.y = y;
}

// ---------- main loop: rAF + fixed-step simulation ----------
let last = performance.now(), acc = 0, fpsAcc = 0, fpsN = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1; if (dt < 0) dt = 0;
  tnow += dt; fpsAcc += dt; fpsN++; if (fpsAcc >= 0.5) { G.fps = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
  readInput();
  const spd = DEBUG_SPEED;
  if (G.state === 'play') {
    acc += dt * spd; let n = 0;
    while (acc >= STEP && n < 6 * spd) { update(STEP); acc -= STEP; n++; if (G.state !== 'play') break; }
    if (acc > STEP * 4) acc = 0;
  } else if (G.state === 'dying' || G.state === 'victory') {
    updateParticles(dt * 0.5); G.endT -= dt;
    if (G.endT <= 0) { bankGold(); G.state = G.state === 'dying' ? 'over' : 'win'; }
  } else acc = 0;
  VO.update(dt);
  render(dt);
}
function render(dt) {
  ctx.imageSmoothingEnabled = false;
  uiBegin();
  ctx.fillStyle = C.black; ctx.fillRect(0, 0, W, H);
  if (G.state === 'title') drawTitle(dt);
  else {
    renderWorld(G.state === 'play' || G.state === 'dying' || G.state === 'victory' ? dt : 0);
    if (URLQ.has('art')) { if (URLQ.get('art') === 'logo') { rect(0, 0, W, 64, C.black, 0.55); logo(10, W < 300 ? 3 : 4); } } // key-art capture mode (tools only)
    else if (G.state === 'play') drawHUD();
    else if (G.state === 'pause') { drawHUD(true); drawPause(); }
    else if (G.state === 'levelup') { drawHUD(true); drawLevelUp(); drawVoice(H - 26); }
    else if (G.state === 'chest') { drawHUD(true); drawChest(dt); }
    else if (G.state === 'dying' || G.state === 'victory') drawVoice(42);
    else if (G.state === 'over') drawEnd(false);
    else if (G.state === 'win') drawEnd(true);
  }
  if (URLQ.has('fps')) text(G.fps + ' FPS ' + enemies.list.length + ' EN', 3, H - 8, C.lime, 1, 'l', true);
  uiEnd();
  sctx.drawImage(buf, 0, 0, W, H, 0, 0, W * SC, H * SC);
}
const DEBUG_SPEED = Math.max(1, Math.min(8, parseInt(URLQ.get('speed'), 10) || 1));

// ---------- boot ----------
bakeArt();
resize();
requestAnimationFrame(frame);
// debug / test hooks
window.__av = {
  G, P, SAVE, VO, AU, state: () => G.state, start: (h) => { beginRun(); if (h !== undefined) startRun(h); },
  counts: () => ({ enemies: enemies.list.length, gems: gems.list.length, parts: parts.list.length, projs: projs.list.length, fps: G.fps }),
  give: (id, lvl) => { if (WD[id]) { const w = hasW(id); if (w) w.lvl = lvl || 8; else G.weapons.push({ id, lvl: lvl || 1, t: 0, evo: false, ang: 0, rot: 0, pos: [] }); } else if (PD[id]) { const p = hasP(id); if (p) p.lvl = lvl || 1; else G.passives.push({ id, lvl: lvl || 1 }); recalc(); } },
  spawn: (type, n, o) => { for (let i = 0; i < (n || 1); i++) { const [x, y] = ringPos(rand(0, 60)); spawnEnemy(type, x, y, o); } },
  setTime: (s) => { G.time = s; while (EVENTS[G.evi] && EVENTS[G.evi].t <= s - 0.01) G.evi++; },
  chest: () => dropItem('chest', P.x, P.y + 4), xp: (v) => addXP(v), hurt: (d) => damagePlayer(d), smite, ui: UI,
  layout: () => ({ W, H, SC, DPR }), enemies: () => enemies.list, gems: () => gems.list, items: () => items.list
};
