/* ===== ASHEN VIGIL: world rendering, HUD, voice visualizer, canvas UI screens ===== */
let W = 480, H = 270, SC = 1;
let vignette = null, ox = 0, oy = 0, tnow = 0;

function rect(x, y, w, h, col, a) { if (a !== undefined) ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); if (a !== undefined) ctx.globalAlpha = 1; }
function frame9(x, y, w, h, fill, edge, hi) { // pixel frame with notched corners
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  rect(x + 1, y, w - 2, h, C.black); rect(x, y + 1, w, h - 2, C.black);
  rect(x + 1, y + 1, w - 2, h - 2, edge); rect(x + 2, y + 2, w - 4, h - 4, fill);
  if (hi) { rect(x + 2, y + 2, w - 4, 1, hi); }
}
function spr(name, fi, x, y, flip, white, outline) {
  const s = SPR[name]; if (!s) return; const f = s.fr[(fi | 0) % s.fr.length];
  let c = white ? (flip ? f.wf : f.w) : flip ? f.f : f.n, dx = 0;
  if (outline && f.o) { c = flip ? f.of : f.o; dx = 1; }
  ctx.drawImage(c, Math.round(x - s.w / 2 - dx), Math.round(y - s.h - dx));
}
function icon(name, x, y, sc) { const s = SPR['i_' + name] || SPR[name]; if (!s) return; sc = sc || 1; ctx.drawImage(s.fr[0].n, Math.round(x), Math.round(y), s.w * sc, s.h * sc); }
function line(x0, y0, x1, y1, col, wdt) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx - dy, n = 0;
  ctx.fillStyle = col; wdt = wdt || 1;
  while (n++ < 600) { ctx.fillRect(x0, y0, wdt, wdt); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; } }
}
function ringPx(cx, cy, r, col, step, sqY) { // dotted pixel circle
  ctx.fillStyle = col; const n = Math.max(12, Math.floor(r * 1.2)); step = step || 1;
  for (let i = 0; i < n; i += step) { const a = (i / n) * TAU; ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * (sqY || 0.8)), 1, 1); }
}
function makeVignette() {
  vignette = mk(W, H); const x = vignette.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.22, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(11,10,18,0)'); g.addColorStop(0.6, 'rgba(11,10,18,0.35)'); g.addColorStop(1, 'rgba(11,10,18,0.85)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // dither the vignette edge so it reads as pixels, not a smooth gradient
  const id = x.getImageData(0, 0, W, H), d = id.data;
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) { const o = (yy * W + xx) * 4; const b = ((xx & 1) ^ (yy & 1)) ? 18 : -18; d[o + 3] = clamp(d[o + 3] + b * (d[o + 3] > 30 ? 1 : 0), 0, 255); }
  x.putImageData(id, 0, 0);
}

// ---------- world ----------
const drawList = [];
function renderWorld(dt) {
  const k = 1 - Math.exp(-dt * 7);
  cam.x += (P.x - cam.x) * k; cam.y += (P.y - 6 - cam.y) * k;
  let sx = 0, sy = 0; if (G.shake > 0) { sx = Math.round(rand(-G.shake, G.shake)); sy = Math.round(rand(-G.shake, G.shake)); G.shake = Math.max(0, G.shake - dt * 14); }
  ox = Math.round(cam.x - W / 2) + sx; oy = Math.round(cam.y - H / 2) + sy;
  // ground chunks
  const c0 = Math.floor(ox / CHUNK), c1 = Math.floor((ox + W) / CHUNK), r0 = Math.floor(oy / CHUNK), r1 = Math.floor((oy + H) / CHUNK);
  for (let cy = r0; cy <= r1; cy++) for (let cx = c0; cx <= c1; cx++) ctx.drawImage(getChunk(cx, cy), cx * CHUNK - ox, cy * CHUNK - oy);
  const vis = (x, y, m) => x > ox - m && x < ox + W + m && y > oy - m && y < oy + H + m;
  // holy font aura
  const font = G.weapons.find((w) => w.id === 'font');
  if (font) {
    const s = wst(font), R = s.radius * P.st.area; font.pulse = Math.max(0, (font.pulse || 0) - dt * 3);
    ctx.globalAlpha = 0.12 + font.pulse * 0.12; ctx.fillStyle = font.evo ? C.gold : C.light; ctx.beginPath(); ctx.ellipse(P.x - ox, P.y - oy, R, R * 0.8, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ringPx(P.x - ox, P.y - oy, R + font.pulse * 2, font.evo ? C.gold : C.light, 1);
    if (Math.random() < 0.5) burst(P.x + rand(-R, R) * 0.7, P.y + rand(-R, R) * 0.5, 1, [C.light, C.gold], 6, 0.6, -20);
  }
  // pools
  for (const z of zones.list) {
    if (!vis(z.x, z.y, z.r + 4)) continue;
    const a = Math.min(1, z.life / 0.4);
    ctx.globalAlpha = 0.28 * a; ctx.fillStyle = C.wine; ctx.beginPath(); ctx.ellipse(z.x - ox, z.y - oy, z.r, z.r * 0.7, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.26 * a; ctx.fillStyle = C.ember; ctx.beginPath(); ctx.ellipse(z.x - ox, z.y - oy, z.r * 0.7, z.r * 0.45, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ringPx(z.x - ox, z.y - oy, z.r, C.orange, 2, 0.7);
  }
  // telegraphs
  for (const f of fx.list) {
    if (f.kind === 'tele') { const k2 = 1 - f.life / f.max; ctx.globalAlpha = 0.25 + k2 * 0.3; ctx.fillStyle = f.col; ctx.beginPath(); ctx.ellipse(f.x - ox, f.y - oy, f.r * k2, f.r * k2 * 0.8, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ringPx(f.x - ox, f.y - oy, f.r, f.col, 1); }
    else if (f.kind === 'line') { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(tnow * 40); line(f.x - ox, f.y - oy, f.x - ox + Math.cos(f.a) * f.r, f.y - oy + Math.sin(f.a) * f.r, f.col, 2); ctx.globalAlpha = 1; }
  }
  // poison hazards
  for (const h of hazards.list) {
    if (!vis(h.x, h.y, h.r + 4)) continue;
    const a = Math.min(1, h.life / 0.5, (h.max - h.life) / 0.3 + 0.3);
    ctx.globalAlpha = 0.3 * a; ctx.fillStyle = C.pine; ctx.beginPath(); ctx.ellipse(h.x - ox, h.y - oy, h.r, h.r * 0.7, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.35 * a; ctx.fillStyle = C.lime; ctx.beginPath(); ctx.ellipse(h.x - ox, h.y - oy, h.r * 0.6, h.r * 0.4, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = a;
    ringPx(h.x - ox, h.y - oy, h.r, C.lime, 2, 0.7); ctx.globalAlpha = 1;
  }
  // wandering merchant
  const M = G.merchant;
  if (M && vis(M.x, M.y, 40)) {
    ctx.globalAlpha = 0.16 + 0.08 * Math.sin(tnow * 4); ctx.fillStyle = C.gold; ctx.beginPath(); ctx.ellipse(M.x - ox, M.y - oy - 4, 26, 18, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    rect(M.x - ox - 9, M.y - oy - 1, 18, 2, C.black, 0.4);
    spr('merchant', 0, M.x - ox, M.y - oy + 1);
    if (Math.random() < 0.2) burst(M.x + rand(-8, 8), M.y - 14, 1, [C.gold, C.light], 6, 0.8, -15);
    text(M.t < 10 && ((tnow * 4) | 0) % 2 ? '' : 'SHOP', M.x - ox, M.y - oy - 26, C.gold, 1, 'c', true);
  }
  // gems & items
  for (const g of gems.list) {
    if (!vis(g.x, g.y, 8)) continue;
    const nm = g.v >= 25 ? 'gemR' : g.v >= 5 ? 'gemG' : 'gemB', b = Math.round(Math.sin(g.anim) * 1);
    spr(nm, 0, g.x - ox, g.y - oy + b + 3);
    if (((g.anim * 2) | 0) % 7 === 0) rect(g.x - ox + 1, g.y - oy - 4 + b, 1, 1, C.white);
  }
  for (const it of items.list) {
    if (!vis(it.x, it.y, 10)) continue;
    const b = it.kind === 'chest' ? 0 : Math.round(Math.sin(it.anim * 0.5) * 1.5);
    if (it.kind === 'chest') { ctx.globalAlpha = 0.3 + 0.2 * Math.sin(tnow * 5); rect(it.x - ox - 8, it.y - oy - 12, 16, 14, C.gold); ctx.globalAlpha = 1; }
    rect(it.x - ox - 3, it.y - oy, 6, 1, C.black, 0.4);
    spr(it.kind, it.kind === 'coin' ? it.anim : 0, it.x - ox, it.y - oy + b);
  }
  // actors, y-sorted
  drawList.length = 0;
  for (const e of enemies.list) if (!e.dead && vis(e.x, e.y, 30)) drawList.push(e);
  drawList.sort((a, b) => a.y - b.y);
  let playerDrawn = false;
  const shadow = (x, y, w) => { ctx.globalAlpha = 0.35; ctx.fillStyle = C.black; ctx.fillRect(Math.round(x - w / 2), Math.round(y - 1), Math.round(w), 2); ctx.globalAlpha = 1; };
  const elitePulse = 0.6 + 0.4 * Math.sin(tnow * 6);
  for (const e of drawList) {
    if (!playerDrawn && e.y > P.y) { drawPlayer(); playerDrawn = true; }
    const d = e.def, x = e.x - ox, y = e.y - oy;
    let yy = y - (e.z || 0); if (d.fly) yy -= 4 + Math.sin(e.anim) * 1.5;
    shadow(x, y, Math.max(4, e.r * 1.6));
    if (e.type === 'toad' && e.fuse > 0 && ((tnow * 20) | 0) % 2) { spr(d.spr, e.anim, x, yy, e.flip, true); continue; }
    if (e.tele > 0 && ((tnow * 16) | 0) % 2) { spr(d.spr, 0, x, yy, e.flip, true); continue; }
    if (e.elite || d.boss) { ctx.globalAlpha = e.elite ? elitePulse : 0.8; spr(d.spr, e.anim, x, yy, e.flip, false, true); ctx.globalAlpha = 1; }
    spr(d.spr, e.anim, x, yy, e.flip, e.flash > 0);
    if (e.dotT > 0 && Math.random() < 0.3) burst(e.x + rand(-3, 3), e.y - d.h / 2, 1, [C.orange, C.ember], 10, 0.3, -30);
    if (e.type === 'lantern') { ctx.globalAlpha = 0.14 + 0.06 * Math.sin(tnow * 7 + e.phase); ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(x, y - 7, 14, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    if (d.boss === 1 || (e.elite && e.hp < e.maxHp)) { const bw = d.boss ? 24 : 12; rect(x - bw / 2, yy - d.h - 5, bw, 2, C.black); rect(x - bw / 2, yy - d.h - 5, bw * Math.max(0, e.hp / e.maxHp), 2, C.red); }
  }
  if (!playerDrawn) drawPlayer();
  // orbit stones
  for (const w of G.weapons) if (w.id === 'orbit') for (let i = 0; i < w.pos.length; i += 2) {
    spr(w.evo ? 'runeGold' : 'rune', 0, w.pos[i] - ox, w.pos[i + 1] - oy + 3);
    if (Math.random() < 0.3) burst(w.pos[i], w.pos[i + 1], 1, w.evo ? [C.gold, C.light] : [C.violet, C.cyan], 8, 0.25);
  }
  // projectiles
  for (const p of projs.list) {
    const x = p.x - ox, y = p.y - oy; if (x < -10 || y < -10 || x > W + 10 || y > H + 10) continue;
    if (p.kind === 'arrow') { const cx = Math.cos(p.rot), cy = Math.sin(p.rot); line(x - cx * 5, y - cy * 5, x + cx * 2, y + cy * 2, C.bone); rect(x + cx * 3, y + cy * 3, 1, 1, C.white); rect(x - cx * 6, y - cy * 6, 1, 1, C.lime); }
    else if (p.kind === 'flask') { rect(x - 2, (p.ty - oy) - 1, 4, 2, C.black, 0.3); spr('flask', 0, x, y + 3); }
    else spr(p.kind, tnow * 10, x, y + 3);
  }
  for (const b of ebul.list) {
    const x = b.x - ox, y = b.y - oy;
    if (b.kind === 'scythe') { ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(Math.round(b.rot * 4) / 4); ctx.drawImage(SPR.scythe.fr[0].n, -4, -4); ctx.restore(); }
    else if (b.kind === 'fire') { rect(x - 1, y - 1, 3, 3, C.orange); rect(x, y, 1, 1, C.light); rect(x - b.vx * 0.04, y - b.vy * 0.04, 2, 2, C.ember, 0.6); }
    else if (b.kind === 'shriek') { rect(x - 1, y - 1, 3, 3, C.red); rect(x, y, 1, 1, C.white); }
    else if (b.kind === 'hex') { rect(x - 2, y - 1, 4, 3, C.violet); rect(x - 1, y - 2, 2, 5, C.violet); rect(x, y, 1, 1, C.cyan); }
    else if (b.kind === 'glob') { rect(b.tx - ox - 3, b.ty - oy - 1, 6, 2, C.black, 0.35); rect(x - 2, y - 2, 4, 4, C.lime); rect(x - 1, y - 1, 1, 1, C.white); }
    else { const a = Math.atan2(b.vy, b.vx); line(x - Math.cos(a) * 4, y - Math.sin(a) * 4, x, y, C.pale); rect(x, y, 1, 1, C.red); }
  }
  // effects
  for (const f of fx.list) {
    const t = f.life / f.max;
    if (f.kind === 'slash') {
      const cx = (f.follow ? P.x : f.x) - ox, cy = (f.follow ? P.y - 4 : f.y) - oy, n = Math.floor(f.arc * f.r * 0.9), prog = 1 - t;
      for (let i = 0; i < n; i++) {
        const a = f.a - f.arc / 2 + (i / n) * f.arc; if (f.arc < TAU && (i / n) > prog * 1.6) continue;
        for (let rr = f.r * 0.55; rr <= f.r; rr += 2) { const c = rr > f.r - 3 ? C.white : rr > f.r * 0.8 ? C.gold : f.col; if (Math.random() < t * 1.2) { ctx.fillStyle = c; ctx.fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr * 0.8), 1, 1); } }
      }
    } else if (f.kind === 'bolt') {
      for (let i = 0; i + 3 < f.pts.length; i += 2) { line(f.pts[i] - ox, f.pts[i + 1] - oy, f.pts[i + 2] - ox, f.pts[i + 3] - oy, f.col, 2); line(f.pts[i] - ox, f.pts[i + 1] - oy, f.pts[i + 2] - ox, f.pts[i + 3] - oy, C.white, 1); }
      ctx.globalAlpha = t; ringPx(f.x - ox, f.y - oy, f.r * (1.2 - t * 0.5), f.col, 1); ctx.globalAlpha = 1;
    } else if (f.kind === 'chain') {
      for (let i = 0; i + 3 < f.pts.length; i += 2) {
        const x0 = f.pts[i] - ox, y0 = f.pts[i + 1] - oy, x1 = f.pts[i + 2] - ox, y1 = f.pts[i + 3] - oy, mx = (x0 + x1) / 2 + rand(-5, 5), my = (y0 + y1) / 2 + rand(-5, 5);
        line(x0, y0, mx, my, f.col); line(mx, my, x1, y1, f.col); rect(x1 - 1, y1 - 1, 3, 3, C.white, t);
      }
    } else if (f.kind === 'ring') { const k2 = 1 - t; ringPx(f.x - ox, f.y - oy, f.r * (0.4 + k2 * 0.6), f.col, 1); ringPx(f.x - ox, f.y - oy, f.r * (0.3 + k2 * 0.6), C.white, 2); }
  }
  // particles + damage numbers
  for (const p of parts.list) { const x = p.x - ox, y = p.y - oy; if (x < 0 || y < 0 || x >= W || y >= H) continue; ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5); ctx.fillStyle = p.col; ctx.fillRect(x | 0, y | 0, p.sz, p.sz); }
  ctx.globalAlpha = 1;
  for (const n of nums.list) { const a = Math.min(1, n.life / n.max * 2); ctx.globalAlpha = a; text(n.txt, n.x - ox, n.y - oy, n.col, n.sc, 'c', true); }
  ctx.globalAlpha = 1;
  // night vignette + low-HP pulse
  ctx.drawImage(vignette, 0, 0);
  const hpk = P.hp / P.maxHp;
  if (hpk < 0.3 && G.state !== 'title') {
    const a = (0.3 - hpk) / 0.3 * (0.45 + 0.25 * Math.sin(tnow * 6));
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.65);
    g.addColorStop(0, 'rgba(168,48,46,0)'); g.addColorStop(1, 'rgba(168,48,46,' + a.toFixed(3) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (G.flash > 0) { ctx.globalAlpha = Math.min(0.8, G.flash); ctx.fillStyle = G.flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; G.flash -= dt * 1.6; }
}
function drawPlayer() {
  if (G.state === 'dying' || G.state === 'over') return;
  const x = P.x - ox, y = P.y - oy, h = HEROES[G.hero];
  ctx.globalAlpha = 0.4; ctx.fillStyle = C.black; ctx.fillRect(Math.round(x - 5), Math.round(y - 1), 10, 2); ctx.globalAlpha = 1;
  if (P.inv > 0 && ((tnow * 20) | 0) % 2 && P.flash <= 0) ctx.globalAlpha = 0.5;
  spr(h.id, P.moving ? P.anim : 0, x, y + 1, P.flip, P.flash > 0);
  ctx.globalAlpha = 1;
  if (P.ward > 0) { ctx.globalAlpha = 0.5 + 0.2 * Math.sin(tnow * 6); ringPx(x, y - 7, 11, C.cyan, 1, 1); ctx.globalAlpha = 1; }
  if (G.buffs.fury > 0 && Math.random() < 0.3) burst(P.x + rand(-4, 4), P.y - rand(2, 14), 1, [C.red, C.ember], 10, 0.4, -20);
  // HP bar under the sprite
  rect(x - 8, y + 3, 16, 3, C.black); rect(x - 7, y + 4, 14 * Math.max(0, P.hp / P.maxHp), 1, P.hp / P.maxHp < 0.3 ? C.red : C.lime);
}

// ---------- immediate-mode canvas UI ----------
const UI = { mx: -1, my: -1, click: null, hover: '', lastHover: '', focus: '', ids: [], down: false, drag: null, keyAct: false, touch: !!(window.matchMedia && matchMedia('(pointer: coarse)').matches) };
function inside(x, y, w, h, px, py) { return px >= x && py >= y && px < x + w && py < y + h; }
// returns true when clicked (mouse/touch release inside, or Enter on keyboard focus)
function button(id, x, y, w, h, label, o) {
  o = o || {}; x = Math.round(x); y = Math.round(y);
  UI.ids.push(id);
  const hov = (!UI.touch && inside(x, y, w, h, UI.mx, UI.my)) || UI.focus === id;
  if (hov && inside(x, y, w, h, UI.mx, UI.my)) UI.hover = id;
  const dis = o.disabled, base = o.col || C.ember;
  const pulse = hov ? 0.5 + 0.5 * Math.sin(tnow * 8) : 0;
  if (hov && !dis) { ctx.globalAlpha = 0.35 + pulse * 0.3; rect(x - 2, y - 2, w + 4, h + 4, base); ctx.globalAlpha = 1; }
  frame9(x, y, w, h, dis ? C.dusk : hov ? C.slate : C.night, dis ? C.grey : hov ? base : o.edge || C.grey, hov ? C.ash : null);
  if (o.icon) icon(o.icon, x + 5, y + (h - 8) / 2);
  if (label) text(label, x + w / 2 + (o.icon ? 5 : 0), y + Math.round((h - 5 * (o.sc || 1)) / 2), dis ? C.ash : hov ? C.white : o.tc || C.pale, o.sc || 1, 'c', true);
  let hit = false;
  if (UI.click && inside(x, y, w, h, UI.click.x, UI.click.y)) { hit = true; UI.click = null; }
  if (UI.keyAct && UI.focus === id) { hit = true; UI.keyAct = false; }
  if (hit && dis) { AU.deny(); return false; }
  if (hit) AU.click();
  return hit;
}
function slider(id, x, y, w, label, key) {
  UI.ids.push(id);
  const hov = inside(x - 4, y - 4, w + 8, 14, UI.mx, UI.my) || UI.focus === id;
  text(label, x, y - 8, hov ? C.white : C.fog, 1, 'l', true);
  text(Math.round(AU.vol[key] * 100) + '%', x + w, y - 8, C.gold, 1, 'r', true);
  rect(x, y + 2, w, 3, C.black); rect(x, y + 2, w * AU.vol[key], 3, hov ? C.orange : C.ember);
  const kx = x + w * AU.vol[key];
  frame9(kx - 3, y - 1, 7, 9, hov ? C.gold : C.pale, C.black);
  if (UI.down && UI.drag === null && inside(x - 4, y - 5, w + 8, 16, UI.mx, UI.my)) UI.drag = id;
  if (UI.drag === id) { AU.vol[key] = clamp((UI.mx - x) / w, 0, 1); AU.applyVol(); if (!UI.down) { UI.drag = null; SAVE.vol = AU.vol; saveNow(); } }
  if (UI.focus === id && UI.nudge) { AU.vol[key] = clamp(Math.round((AU.vol[key] + UI.nudge * 0.1) * 10) / 10, 0, 1); UI.nudge = 0; AU.applyVol(); SAVE.vol = AU.vol; saveNow(); AU.click(); }
  if (UI.click && inside(x - 4, y - 5, w + 8, 16, UI.click.x, UI.click.y)) UI.click = null;
}
function uiBegin() { UI.ids.length = 0; UI.hover = ''; }
function uiEnd() {
  if (UI.hover && UI.hover !== UI.lastHover) AU.hover();
  UI.lastHover = UI.hover; if (UI.hover) UI.focus = '';
  if (UI.focus && UI.ids.indexOf(UI.focus) < 0) UI.focus = '';
  UI.click = null; UI.keyAct = false; UI.nudge = 0;
}
function uiNav(dir) { // keyboard focus cycling
  const ids = UI.ids; if (!ids.length) return;
  const i = ids.indexOf(UI.focus); UI.focus = ids[(i < 0 ? (dir > 0 ? 0 : ids.length - 1) : (i + dir + ids.length) % ids.length)]; AU.hover();
}
function dim(a) { rect(0, 0, W, H, C.black, a); }

// ---------- HUD ----------
function drawHUD(overlay) {
  // XP bar
  rect(0, 0, W, 6, C.black); rect(1, 1, (W - 2) * Math.min(1, G.xp / G.xpNext), 4, C.blue); rect(1, 1, (W - 2) * Math.min(1, G.xp / G.xpNext), 1, C.cyan);
  text('LV ' + G.level, W - 3, 1, C.white, 1, 'r');
  // timer
  const tt = G.time >= RUN_END ? C.red : C.pale;
  text(fmtTime(G.time), W / 2, 9, tt, 2, 'c', true);
  if (G.endless) text('NIGHT ' + G.night, W / 2, 21, C.violet, 1, 'c', true); else if (G.reaper) text('THE REAPER', W / 2, 21, C.red, 1, 'c', true);
  // kills & gold
  const rx = W - 4; icon('skull', rx - 8 - textW(String(G.kills)) - 2, 9); text(G.kills, rx, 10, C.pale, 1, 'r', true);
  icon('gold', rx - 8 - textW(String(G.gold)) - 2, 19); text(G.gold, rx, 20, C.gold, 1, 'r', true);
  // weapon + passive slots
  const sx = 3, slot = 13;
  for (let i = 0; i < 6; i++) {
    const w = G.weapons[i], x = sx + i * slot, y = 9;
    frame9(x, y, 12, 12, C.night, w && w.evo ? C.gold : C.slate);
    if (w) { icon(WD[w.id].icon, x + 2, y + 2); pips(x + 1, y + 13, w.evo ? 8 : w.lvl, 8, w.evo ? C.gold : C.cyan); }
  }
  for (let i = 0; i < 6; i++) {
    const p = G.passives[i], x = sx + i * slot, y = 25;
    frame9(x, y, 12, 12, C.night, C.dusk);
    if (p) { icon(PD[p.id].icon, x + 2, y + 2); pips(x + 1, y + 13, p.lvl, 5, C.lime); }
  }
  // active buffs
  let bx = sx, by = 40;
  const buff = (ic, label, col) => { icon(ic, bx, by); text(label, bx + 10, by + 2, col, 1, 'l', true); bx += 12 + textW(label); };
  if (G.buffs.fury > 0) buff('fury', Math.ceil(G.buffs.fury) + 'S', C.orange);
  if (G.buffs.haste > 0) buff('tonic', Math.ceil(G.buffs.haste) + 'S', C.cyan);
  if (P.ward > 0) buff('ward', 'X' + P.ward, C.cyan);
  // dash: cooldown ring (a big tap target on touch screens)
  { const r = UI.touch ? 15 : 8, cx = W - r - 6, cy = H - r - (G.boss && !G.boss.dead ? 24 : 6), k = P.dashCd > 0 ? 1 - P.dashCd / 2.4 : 1;
    ctx.globalAlpha = 0.55; ctx.fillStyle = C.black; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = k >= 1 ? C.cyan : C.slate; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r - 1, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
    if (UI.touch) icon('dash', cx - 8, cy - 8, 2); else icon('dash', cx - 4, cy - 4); if (!UI.touch) text('SPACE', cx, cy - r - 7, C.grey, 1, 'c', true); }
  // merchant pointer when the cart is off screen
  if (G.merchant) {
    const M = G.merchant, mx = M.x - ox, my = M.y - oy - 8;
    if (mx < 6 || my < 46 || mx > W - 6 || my > H - 6) {
      const cx = W / 2, cy = H / 2, a = Math.atan2(my - cy, mx - cx), px = clamp(cx + Math.cos(a) * W, 12, W - 12), py = clamp(cy + Math.sin(a) * H, 50, H - 14);
      const pulse = 0.6 + 0.4 * Math.sin(tnow * 6); ctx.globalAlpha = pulse;
      frame9(px - 7, py - 7, 14, 14, C.night, C.gold); icon('gold', px - 3, py - 3); ctx.globalAlpha = 1;
      rect(px + Math.cos(a) * 9 - 1, py + Math.sin(a) * 9 - 1, 3, 3, C.gold);
      text(Math.ceil(M.t) + 'S', px, py + 9, C.gold, 1, 'c', true);
    }
  }
  // pause button (touch-friendly)
  if (button('pause', W - 17, 29, 14, 12, '', { col: C.fog })) togglePause();
  rect(W - 12, 32, 1, 6, C.pale); rect(W - 9, 32, 1, 6, C.pale);
  // boss bar
  if (G.boss && !G.boss.dead) {
    const b = G.boss, bw = Math.min(220, W - 40), x = (W - bw) / 2, y = H - 14;
    text(BOSS_NAMES[b.type] || '', W / 2, y - 7, b.def.col, 1, 'c', true);
    frame9(x - 2, y - 1, bw + 4, 7, C.black, C.wine); rect(x, y + 1, bw * Math.max(0, b.hp / b.maxHp), 3, b.type === 'reaper' ? C.spirit : C.red);
  }
  if (G.msgT > 0) { ctx.globalAlpha = Math.min(1, G.msgT); text(G.msg, W / 2, H * 0.3, C.gold, 1, 'c', true); ctx.globalAlpha = 1; }
  if (!overlay) drawVoice(42);
  drawJoystick();
}
function pips(x, y, n, max, col) { for (let i = 0; i < max; i++) { ctx.fillStyle = i < n ? col : C.dusk; ctx.fillRect(x + Math.round(i * (10 / max)), y, 1, 1); } }

// live voice visualizer: glowing pixel-rune waveform driven by the AnalyserNode
const vizData = new Uint8Array(128);
let vizLevel = 0;
function drawVoice(y) {
  if (VO.subT <= 0) return;
  const a = Math.min(1, VO.subT / 0.4, (VO.subMax - VO.subT) / 0.15 + 0.2);
  const N = 25, bw = 3, total = N * bw, x0 = Math.round(W / 2 - total / 2);
  let sum = 0;
  if (AU.analyser) { AU.analyser.getByteTimeDomainData(vizData); }
  ctx.globalAlpha = a * 0.6; rect(x0 - 6, y - 10, total + 12, 21, C.black); ctx.globalAlpha = a;
  for (let i = 0; i < N; i++) {
    let v;
    if (AU.analyser) { let m = 0; for (let k = 0; k < 5; k++) m = Math.max(m, Math.abs(vizData[(i * 5 + k) % 128] - 128)); v = m / 128; }
    else v = VO.speaking ? Math.abs(Math.sin(tnow * 9 + i * 0.7)) * 0.6 : 0;
    sum += v;
    const hgt = Math.max(1, Math.min(9, Math.round(v * 22 * (1 - Math.abs(i - N / 2) / N))));
    const x = x0 + i * bw, col = hgt > 6 ? C.white : hgt > 3 ? C.spirit : C.cyan;
    rect(x, y - hgt, 2, hgt * 2, col);
    if (hgt > 1) { ctx.globalAlpha = a * 0.3; rect(x - 1, y - hgt - 1, 4, hgt * 2 + 2, C.spirit); ctx.globalAlpha = a; }
  }
  vizLevel = lerp(vizLevel, sum / N, 0.3);
  // rune glyph frame
  rect(x0 - 5, y - 1, 2, 2, C.spirit); rect(x0 + total + 3, y - 1, 2, 2, C.spirit);
  const sub = wrap(VO.sub, Math.min(W - 20, 300), 1);
  sub.forEach((ln, i) => text(ln, W / 2, y + 14 + i * 7, C.pale, 1, 'c', true));
  ctx.globalAlpha = 1;
}
function drawJoystick() {
  const j = JOY; if (!j.on) return;
  ctx.globalAlpha = 0.35; ringPx(j.bx, j.by, 22, C.pale, 1, 1); ringPx(j.bx, j.by, 21, C.black, 2, 1);
  ctx.globalAlpha = 0.6; frame9(j.kx - 6, j.ky - 6, 12, 12, C.slate, C.pale); ctx.globalAlpha = 1;
}

// ---------- screens ----------
function logo(y, sc) {
  const t = 'ASHEN VIGIL';
  text(t, W / 2 + sc, y + sc, C.blood, sc, 'c'); text(t, W / 2, y, C.ember, sc, 'c');
  ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, Math.ceil(sc * 2)); ctx.clip(); text(t, W / 2, y, C.gold, sc, 'c'); ctx.restore();
  text('NIGHT OF A THOUSAND', W / 2, y + sc * 5 + 5, C.fog, 1, 'c', true);
}
const titleFx = { embers: [] };
function drawTitleBG(dt) {
  cam.x += dt * 14; cam.y += dt * 5; P.x = cam.x; P.y = cam.y + 6;
  const ox2 = Math.round(cam.x - W / 2), oy2 = Math.round(cam.y - H / 2);
  for (let cy = Math.floor(oy2 / CHUNK); cy <= Math.floor((oy2 + H) / CHUNK); cy++) for (let cx = Math.floor(ox2 / CHUNK); cx <= Math.floor((ox2 + H + W) / CHUNK); cx++) ctx.drawImage(getChunk(cx, cy), cx * CHUNK - ox2, cy * CHUNK - oy2);
  dim(0.45); ctx.drawImage(vignette, 0, 0);
  const E = titleFx.embers; if (E.length < 60 && Math.random() < 0.6) E.push({ x: rand(W), y: H + 2, v: rand(8, 26), w: rand(TAU), c: pick([C.ember, C.orange, C.gold]) });
  for (let i = E.length - 1; i >= 0; i--) { const e = E[i]; e.y -= e.v * dt; e.w += dt * 2; const x = e.x + Math.sin(e.w) * 4; if (e.y < -2) { E.splice(i, 1); continue; } rect(x, e.y, 1, 1, e.c, Math.min(1, e.y / H + 0.3)); }
}
function statsLine(y) {
  text('BEST ' + fmtTime(SAVE.best) + '   KILLS ' + SAVE.kills + '   ' + (SAVE.wins ? 'DAWNS ' + SAVE.wins + '   ' : ''), W / 2 - 20, y, C.fog, 1, 'c', true);
  const s = SAVE.gold + '', gx = W / 2 - 20 + textW('BEST ' + fmtTime(SAVE.best) + '   KILLS ' + SAVE.kills + '   ' + (SAVE.wins ? 'DAWNS ' + SAVE.wins + '   ' : '')) / 2;
  icon('gold', gx, y - 1); text(s, gx + 10, y, C.gold, 1, 'l', true);
}
let SCREEN = 'title'; // title sub-screens: title | shop | options
function drawTitle(dt) {
  drawTitleBG(dt);
  if (SCREEN === 'shop') return drawShop();
  if (SCREEN === 'options') return drawOptions(() => { SCREEN = 'title'; });
  const portrait = H > W * 1.1, lsc = W < 340 ? 3 : 4;
  let y = portrait ? Math.max(14, Math.round((H - 300) / 2)) : 18;
  logo(y, lsc); y += lsc * 5 + 27;
  const cw = Math.min(118, Math.floor((W - 24) / 3) - 4), ch = portrait ? 120 : Math.min(112, H - y - 70), gap = 6, x0 = Math.round((W - (cw * 3 + gap * 2)) / 2);
  text('CHOOSE YOUR HERO', W / 2, y - 10, C.pale, 1, 'c', true);
  HEROES.forEach((h, i) => {
    const x = x0 + i * (cw + gap), sel = G.hero === i, id = 'hero' + i;
    UI.ids.push(id);
    const hov = inside(x, y, cw, ch, UI.mx, UI.my) || UI.focus === id; if (inside(x, y, cw, ch, UI.mx, UI.my)) UI.hover = id;
    if (sel) { ctx.globalAlpha = 0.4 + 0.25 * Math.sin(tnow * 5); rect(x - 2, y - 2, cw + 4, ch + 4, h.col); ctx.globalAlpha = 1; }
    frame9(x, y, cw, ch, sel ? C.dusk : C.night, sel ? h.col : hov ? C.ash : C.slate, sel ? C.slate : null);
    ctx.globalAlpha = 0.25; ctx.fillStyle = h.col; ctx.beginPath(); ctx.ellipse(x + cw / 2, y + 44, 16, 5, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    const s = SPR[h.id], f = s.fr[((tnow * (sel ? 8 : 3)) | 0) % s.fr.length];
    ctx.drawImage(f.n, Math.round(x + cw / 2 - s.w), y + 14, s.w * 2, s.h * 2);
    let ty = y + 52;
    wrap(h.name, cw - 6, 1).forEach((l) => { text(l, x + cw / 2, ty, sel ? C.white : C.pale, 1, 'c', true); ty += 7; });
    ty += 3; icon(WD[h.weapon].icon, x + cw / 2 - 4, ty); ty += 11;
    wrap(WD[h.weapon].name, cw - 6, 1).forEach((l) => { text(l, x + cw / 2, ty, C.gold, 1, 'c'); ty += 7; });
    wrap(h.passive, cw - 6, 1).forEach((l) => { text(l, x + cw / 2, ty, C.lime, 1, 'c'); ty += 7; });
    text('HP ' + h.hp, x + cw / 2, Math.min(y + ch - 9, ty + 2), C.fog, 1, 'c');
    let hit = UI.click && inside(x, y, cw, ch, UI.click.x, UI.click.y); if (hit) UI.click = null;
    if (UI.keyAct && UI.focus === id) { hit = true; UI.keyAct = false; }
    if (hit) { if (G.hero === i) beginRun(); else { G.hero = i; SAVE.hero = i; saveNow(); AU.click(); } }
  });
  y += ch + 10;
  const bw = Math.min(150, W - 40);
  if (button('start', W / 2 - bw / 2, y, bw, 18, 'BEGIN THE VIGIL', { col: C.gold, tc: C.light })) beginRun();
  y += 23;
  const bw2 = Math.floor((bw - 4) / 2);
  if (button('shop', W / 2 - bw / 2, y, bw2, 14, 'EMBER SHRINE', { col: C.orange })) { SCREEN = 'shop'; }
  if (button('opt', W / 2 - bw / 2 + bw2 + 4, y, bw2, 14, 'OPTIONS', { col: C.fog })) { SCREEN = 'options'; }
  statsLine(Math.min(H - 9, y + 22));
  text(UI.touch ? 'LEFT HALF: MOVE   RIGHT HALF: DASH' : 'WASD MOVE   SPACE DASH   P PAUSE', W / 2, Math.min(H - 8, y + 36), C.grey, 1, 'c');
}
function beginRun() { AU.init(); startRun(G.hero); SCREEN = 'title'; }
function drawShop() {
  dim(0.35);
  const portrait = W < 400;
  text('EMBER SHRINE', W / 2, 10, C.orange, 2, 'c', true);
  text('SPEND GOLD ON PERMANENT BLESSINGS', W / 2, 25, C.fog, 1, 'c', true);
  icon('gold', W / 2 - textW(SAVE.gold + '') / 2 - 6, 33); text(SAVE.gold, W / 2 + 6, 34, C.gold, 1, 'c', true);
  const cols = portrait ? 1 : 2, cw = portrait ? W - 16 : Math.min(220, (W - 24) / 2), rh = portrait ? 30 : 32, x0 = Math.round((W - (cw * cols + (cols - 1) * 6)) / 2);
  let y0 = 44;
  SHOP.forEach((s, i) => {
    const cx = x0 + (i % cols) * (cw + 6), cy = y0 + Math.floor(i / cols) * (rh + 4), lv = upL(s.id), maxed = lv >= s.max, cost = shopCost(s);
    frame9(cx, cy, cw, rh, C.night, maxed ? C.gold : C.slate);
    icon(s.icon, cx + 5, cy + 5, 2);
    text(s.name, cx + 26, cy + 5, C.white, 1, 'l', true);
    text(s.desc, cx + 26, cy + 13, C.fog, 1, 'l');
    for (let k = 0; k < s.max; k++) rect(cx + 26 + k * 6, cy + 21, 4, 3, k < lv ? C.gold : C.dusk);
    const bw = 46;
    if (button('buy' + s.id, cx + cw - bw - 4, cy + (rh - 14) / 2, bw, 14, maxed ? 'MAX' : cost + '', { disabled: maxed || SAVE.gold < cost, col: C.gold, tc: C.gold })) {
      SAVE.gold -= cost; SAVE.up[s.id] = lv + 1; saveNow(); AU.coin(); AU.levelup();
    }
  });
  const by = y0 + Math.ceil(SHOP.length / cols) * (rh + 4) + 4;
  if (button('back', W / 2 - 40, Math.min(H - 18, by), 80, 14, 'BACK', { col: C.fog })) SCREEN = 'title';
}
function drawOptions(back) {
  dim(0.5);
  const bw = Math.min(200, W - 40), x = W / 2 - bw / 2; let y = Math.round(H / 2 - 60);
  frame9(x - 10, y - 14, bw + 20, 126, C.night, C.slate);
  text('OPTIONS', W / 2, y - 8, C.gold, 1, 'c', true); y += 14;
  slider('sm', x, y, bw, 'MASTER VOLUME', 'master'); y += 24;
  slider('su', x, y, bw, 'MUSIC VOLUME', 'music'); y += 24;
  slider('ss', x, y, bw, 'SFX VOLUME', 'sfx'); y += 18;
  if (button('vtest', x, y, bw / 2 - 2, 13, 'TEST VOICE', { col: C.spirit })) { AU.init(); VO.last.start = 0; VO.say('start', true); }
  if (button('oback', x + bw / 2 + 2, y, bw / 2 - 2, 13, 'BACK', { col: C.fog })) back();
  drawVoice(Math.round(H / 2 + 80) > H - 30 ? 30 : Math.round(H / 2 + 80));
}
let pauseOpt = false;
function togglePause() {
  if (G.state === 'play') { G.state = 'pause'; pauseOpt = false; AU.click(); }
  else if (G.state === 'pause') { G.state = 'play'; }
}
function drawPause() {
  dim(0.6);
  if (pauseOpt) return drawOptions(() => { pauseOpt = false; });
  text('PAUSED', W / 2, Math.round(H * 0.16), C.gold, 3, 'c', true);
  const bw = 120; let y = Math.round(H * 0.16) + 26;
  if (button('resume', W / 2 - bw / 2, y, bw, 16, 'RESUME', { col: C.gold })) G.state = 'play'; y += 20;
  if (button('popt', W / 2 - bw / 2, y, bw, 14, 'OPTIONS', { col: C.fog })) pauseOpt = true; y += 18;
  if (button('quit', W / 2 - bw / 2, y, bw, 14, 'ABANDON VIGIL', { col: C.red })) { bankGold(); G.state = 'title'; SCREEN = 'title'; MUS.mode = 'title'; VO.stop(); }
  y += 24;
  text('YOUR ARSENAL', W / 2, y, C.pale, 1, 'c', true); y += 9;
  const all = G.weapons.map((w) => [WD[w.id].icon, (w.evo ? WD[w.id].evo : WD[w.id].name) + (w.evo ? '' : ' LV' + w.lvl), w.evo ? C.gold : C.pale])
    .concat(G.passives.map((p) => [PD[p.id].icon, PD[p.id].name + ' LV' + p.lvl, C.lime]));
  const cols = W > 360 ? 2 : 1, cw = cols === 2 ? 150 : W - 30, x0 = W / 2 - (cw * cols) / 2;
  all.forEach((a, i) => { const x = x0 + (i % cols) * cw, yy = y + Math.floor(i / cols) * 11; if (yy > H - 10) return; icon(a[0], x, yy); text(a[1], x + 11, yy + 2, a[2], 1, 'l', true); });
}
function drawLevelUp() {
  dim(0.55);
  const portrait = H > W * 1.1, n = G.choices.length;
  text('LEVEL UP!', W / 2, portrait ? 40 : 12, C.gold, 3, 'c', true);
  text('CHOOSE YOUR POWER', W / 2, (portrait ? 40 : 12) + 19, C.pale, 1, 'c', true);
  let cw, ch, xs = [], ys = [];
  if (portrait) { cw = Math.min(W - 24, 240); ch = 44; for (let i = 0; i < n; i++) { xs.push((W - cw) / 2); ys.push(74 + i * (ch + 6)); } }
  else { cw = Math.min(104, Math.floor((W - 20 - (n - 1) * 6) / n)); ch = Math.min(124, H - 86); const tot = n * cw + (n - 1) * 6; for (let i = 0; i < n; i++) { xs.push((W - tot) / 2 + i * (cw + 6)); ys.push(40); } }
  G.choices.forEach((c, i) => {
    const info = choiceInfo(c), x = Math.round(xs[i]), y = Math.round(ys[i]), id = 'card' + i;
    UI.ids.push(id);
    const hov = inside(x, y, cw, ch, UI.mx, UI.my) || UI.focus === id; if (inside(x, y, cw, ch, UI.mx, UI.my)) UI.hover = id;
    const evoReady = c.kind === 'w' && c.next === 8, col = info.isNew ? C.lime : evoReady ? C.gold : C.cyan;
    if (hov) { ctx.globalAlpha = 0.4 + 0.3 * Math.sin(tnow * 8); rect(x - 2, y - 2, cw + 4, ch + 4, col); ctx.globalAlpha = 1; }
    frame9(x, y, cw, ch, hov ? C.dusk : C.night, hov ? col : C.slate, C.slate);
    rect(x + 2, y + 2, cw - 4, 2, col);
    text(String(i + 1), x + 5, y + 6, C.grey, 1);
    if (portrait) {
      frame9(x + 6, y + 10, 26, 26, C.black, col); icon(info.icon, x + 11, y + 15, 2);
      text(info.name, x + 38, y + 7, C.white, 1, 'l', true);
      text(info.isNew ? 'NEW!' : info.lvl ? 'LV ' + info.lvl : '', x + cw - 6, y + 7, info.isNew ? C.lime : C.gold, 1, 'r', true);
      if (info.max) for (let k = 0; k < info.max; k++) rect(x + 38 + k * 5, y + 15, 3, 2, k < info.lvl ? col : C.dusk);
      wrap(info.desc, cw - 46, 1).slice(0, 3).forEach((l, j) => text(l, x + 38, y + 21 + j * 7, C.fog, 1));
    } else {
      frame9(x + cw / 2 - 14, y + 12, 28, 28, C.black, col); icon(info.icon, x + cw / 2 - 8, y + 18, 2);
      let ty = y + 46;
      wrap(info.name, cw - 8, 1).forEach((l) => { text(l, x + cw / 2, ty, C.white, 1, 'c', true); ty += 7; });
      text(info.isNew ? 'NEW!' : info.lvl ? 'LEVEL ' + info.lvl : '', x + cw / 2, ty + 1, info.isNew ? C.lime : C.gold, 1, 'c', true); ty += 9;
      if (info.max) { const pw = info.max * 5; for (let k = 0; k < info.max; k++) rect(x + cw / 2 - pw / 2 + k * 5, ty, 3, 2, k < info.lvl ? col : C.dusk); ty += 6; }
      wrap(info.desc, cw - 10, 1).slice(0, 8).forEach((l) => { text(l, x + cw / 2, ty, C.fog, 1, 'c'); ty += 7; });
    }
    let hit = UI.click && inside(x, y, cw, ch, UI.click.x, UI.click.y); if (hit) UI.click = null;
    if (UI.keyAct && UI.focus === id) { hit = true; UI.keyAct = false; }
    if (UI.pickN === i + 1) { hit = true; UI.pickN = 0; }
    if (hit) applyChoice(c);
  });
  UI.pickN = 0;
  if (G.state !== 'levelup') return;
  const by = portrait ? ys[n - 1] + ch + 12 : ys[0] + ch + 8, bw = 70;
  if (button('reroll', W / 2 - bw - 3, by, bw, 14, 'REROLL ' + G.rerolls, { disabled: G.rerolls <= 0, col: C.cyan })) reroll();
  if (button('skip', W / 2 + 3, by, bw, 14, 'SKIP', { col: C.fog })) { finishLevel(); AU.click(); }
  if (G.pendLv > 1) text('+' + (G.pendLv - 1) + ' MORE', W / 2, by + 18, C.gold, 1, 'c', true);
}
function drawChest(dt) {
  dim(0.65);
  G.chestT += dt;
  const r = G.chest, t = G.chestT, cx = W / 2, cy = Math.round(H * 0.36);
  // light beams
  ctx.globalAlpha = Math.min(0.5, t * 0.6);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + tnow * 0.4; line(cx, cy, cx + Math.cos(a) * 120, cy + Math.sin(a) * 120, i % 2 ? C.gold : C.orange); }
  ctx.globalAlpha = 1;
  const s = SPR.chest, open = t > 0.6, shake = !open ? Math.round(Math.sin(t * 60) * 1) : 0;
  ctx.drawImage(s.fr[open ? 1 : 0].n, Math.round(cx - s.w) + shake, cy - s.h, s.w * 2, s.h * 2);
  if (open && t - dt <= 0.6) { burst(P.x, P.y - 10, 40, [C.gold, C.light, C.white], 90, 1, 30); G.flash = 0.5; G.flashCol = C.gold; }
  if (!open) { text('...', cx, cy + 16, C.gold, 2, 'c', true); return; }
  let y = cy + 18;
  if (r.evo) {
    const d = WD[r.evo];
    text('EVOLUTION!', cx, y, C.gold, 2, 'c', true); y += 16;
    frame9(cx - 16, y, 32, 32, C.black, C.gold); icon(d.icon, cx - 8, y + 8, 2); y += 38;
    text(d.name + ' + ' + PD[d.pair].name, cx, y, C.fog, 1, 'c', true); y += 9;
    text(d.evo, cx, y, C.light, 2, 'c', true); y += 15;
    wrap(d.evoDesc, Math.min(W - 30, 260), 1).forEach((l) => { text(l, cx, y, C.pale, 1, 'c', true); y += 7; });
  } else {
    text('TREASURE!', cx, y, C.gold, 2, 'c', true); y += 16;
    if (!r.ups.length) { text('YOUR ARSENAL IS FULLY EMPOWERED', cx, y, C.fog, 1, 'c', true); y += 9; }
    r.ups.forEach((u) => { const d = u.k === 'w' ? WD[u.o.id] : PD[u.o.id]; icon(d.icon, cx - 60, y - 1); text(d.name + ' LV ' + u.o.lvl, cx - 48, y, C.pale, 1, 'l', true); y += 11; });
  }
  y += 4; icon('gold', cx - 20, y - 1); text('+' + r.gold + ' GOLD', cx - 8, y, C.gold, 1, 'l', true); y += 12;
  if (t > 1.1 && button('chestok', cx - 40, Math.min(H - 18, y), 80, 14, 'CONTINUE', { col: C.gold })) { G.state = 'play'; G.chest = null; }
}
function drawEnd(win) {
  dim(win ? 0.45 : 0.6);
  if (win) { ctx.globalAlpha = 0.25; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.gold); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  let y = Math.round(H * 0.14);
  const sc = W < 340 ? 2 : 3;
  text(win ? 'DAWN BREAKS' : 'YOU HAVE FALLEN', W / 2, y, win ? C.gold : C.red, sc, 'c', true); y += sc * 5 + 6;
  text(win ? 'YOU HAVE SURVIVED THE VIGIL' : 'THE VIGIL ENDS', W / 2, y, C.pale, 1, 'c', true); y += 16;
  const rows = [['TIME SURVIVED', fmtTime(G.time)]].concat(G.endless ? [['NIGHT REACHED', G.night]] : []).concat([['LEVEL', G.level], ['ENEMIES SLAIN', G.kills], ['GOLD EARNED', G.gold], ['TOTAL GOLD', SAVE.gold]]);
  const bw = Math.min(180, W - 40);
  frame9(W / 2 - bw / 2 - 6, y - 5, bw + 12, rows.length * 10 + 8, C.night, C.slate);
  rows.forEach(([k, v]) => { text(k, W / 2 - bw / 2, y, C.fog, 1, 'l'); text(v, W / 2 + bw / 2, y, k.indexOf('GOLD') >= 0 ? C.gold : C.white, 1, 'r'); y += 10; });
  y += 4;
  const icons = G.weapons.map((w) => WD[w.id].icon).concat(G.passives.map((p) => PD[p.id].icon));
  icons.forEach((ic, i) => icon(ic, W / 2 - icons.length * 5 + i * 10, y)); y += 14;
  const b = 72;
  if (button('again', W / 2 - b * 1.5 - 4, y, b, 15, 'RETRY', { col: C.gold })) beginRun();
  if (button('eshop', W / 2 - b / 2, y, b, 15, 'SHRINE', { col: C.orange })) { G.state = 'title'; SCREEN = 'shop'; MUS.mode = 'title'; }
  if (button('etitle', W / 2 + b / 2 + 4, y, b, 15, 'TITLE', { col: C.fog })) { G.state = 'title'; SCREEN = 'title'; MUS.mode = 'title'; }
  drawVoice(Math.min(H - 24, y + 34));
}

// ---------- merchant shop (in-run) ----------
function drawMerchant() {
  dim(0.65);
  const M = G.merchant; if (!M) { G.state = 'play'; return; }
  const portrait = W < 400;
  text("THE WANDERING MERCHANT", W / 2, 10, C.gold, portrait ? 1 : 2, 'c', true);
  text('SPEND THIS RUN\'S GOLD. EACH WARE SELLS ONCE PER VISIT.', W / 2, portrait ? 19 : 25, C.fog, 1, 'c', true);
  icon('gold', W / 2 - textW(G.gold + '') / 2 - 6, portrait ? 27 : 33); text(G.gold, W / 2 + 6, portrait ? 28 : 34, C.gold, 1, 'c', true);
  const cols = portrait ? 1 : 2, cw = portrait ? W - 16 : Math.min(220, (W - 24) / 2), rh = 30, x0 = Math.round((W - (cw * cols + (cols - 1) * 6)) / 2), y0 = portrait ? 38 : 44;
  M.stock.forEach((slot, i) => {
    const it = SHOP_BY[slot.id], price = itemPrice(it), cx = x0 + (i % cols) * (cw + 6), cy = y0 + Math.floor(i / cols) * (rh + 4);
    frame9(cx, cy, cw, rh, slot.sold ? C.black : C.night, slot.sold ? C.dusk : C.slate);
    ctx.globalAlpha = slot.sold ? 0.4 : 1;
    frame9(cx + 3, cy + 4, 22, 22, C.black, C.dusk); icon(it.icon, cx + 6, cy + 7, 2);
    text(it.name, cx + 29, cy + 5, C.white, 1, 'l', true);
    wrap(it.desc, cw - 29 - 52, 1).slice(0, 2).forEach((l, j) => text(l, cx + 29, cy + 13 + j * 7, C.fog, 1));
    ctx.globalAlpha = 1;
    const bw = 46;
    if (button('ware' + i, cx + cw - bw - 4, cy + (rh - 14) / 2, bw, 14, slot.sold ? 'SOLD' : price + '', { disabled: slot.sold || G.gold < price, col: C.gold, tc: C.gold })) buyItem(slot);
  });
  const by = y0 + Math.ceil(M.stock.length / cols) * (rh + 4) + 4;
  if (button('leave', W / 2 - 50, Math.min(H - 18, by), 100, 14, 'LEAVE THE CART', { col: C.fog })) closeShop();
  if (G.pendChest || G.pendSmite) text(G.pendChest ? 'YOUR CHEST OPENS WHEN YOU LEAVE' : 'THE ROSARY BURNS WHEN YOU LEAVE', W / 2, Math.min(H - 26, by + 18), C.gold, 1, 'c', true);
}
// ---------- dawn: end the vigil or go on into the endless night ----------
function drawDawn() {
  dim(0.45);
  ctx.globalAlpha = 0.3; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.gold); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  let y = Math.round(H * 0.16); const sc = W < 340 ? 2 : 3;
  text('DAWN BREAKS', W / 2, y, C.gold, sc, 'c', true); y += sc * 5 + 8;
  text('THE PALE REAPER IS DEFEATED. +500 GOLD', W / 2, y, C.pale, 1, 'c', true); y += 10;
  text('BUT THE DARK IS STIRRING AGAIN...', W / 2, y, C.violet, 1, 'c', true); y += 18;
  const bw = Math.min(170, W - 40);
  if (button('endless', W / 2 - bw / 2, y, bw, 18, 'ENTER THE ENDLESS NIGHT', { col: C.violet, tc: C.light })) enterEndless();
  y += 22;
  text('NEW BOSSES EVERY 2 MINUTES, FOREVER STRONGER', W / 2, y, C.fog, 1, 'c', true); y += 14;
  if (button('endrun', W / 2 - bw / 2, y, bw, 14, 'END THE VIGIL', { col: C.gold })) { bankGold(); G.state = 'win'; }
  drawVoice(Math.min(H - 24, y + 34));
}
