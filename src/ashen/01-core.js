/* ===== ASHEN VIGIL: core (palette, math, pools, spatial hash, pixel font, sprite baking) ===== */

// ---- 32-colour moody palette (index 0 = transparent) ----
const PAL = ['#000000', '#0b0a12', '#1a1726', '#2b2638', '#3e3650', '#5a5068', '#7d7389', '#a89fb0',
  '#d8d0d6', '#f4efe6', '#3a1a1e', '#6e2028', '#a8302e', '#e0563a', '#f39a3b', '#f7d26a',
  '#fff4a8', '#1e2f2a', '#2f4a33', '#4f6e3c', '#8aa04e', '#173045', '#2a5a7a', '#4a9ac0',
  '#8fd8e8', '#3b2346', '#6a3a7a', '#a25fb8', '#4a3a2a', '#7a5a3a', '#b08858', '#6af0a0'];
const PALRGB = PAL.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
// sprite characters -> palette index
const CH = { '.': 0, k: 1, d: 2, D: 3, g: 4, m: 5, G: 6, l: 7, p: 8, w: 9, x: 10, R: 11, r: 12, e: 13, o: 14, y: 15, Y: 16,
  q: 17, N: 18, n: 19, L: 20, z: 21, B: 22, b: 23, c: 24, u: 25, V: 26, v: 27, H: 28, h: 29, t: 30, s: 31 };
const C = { black: PAL[1], night: PAL[2], dusk: PAL[3], slate: PAL[4], grey: PAL[5], ash: PAL[6], fog: PAL[7], pale: PAL[8], white: PAL[9],
  blood: PAL[10], wine: PAL[11], red: PAL[12], ember: PAL[13], orange: PAL[14], gold: PAL[15], light: PAL[16],
  moss: PAL[17], pine: PAL[18], grass: PAL[19], lime: PAL[20], deep: PAL[21], sea: PAL[22], blue: PAL[23], cyan: PAL[24],
  plum: PAL[25], purple: PAL[26], violet: PAL[27], umber: PAL[28], brown: PAL[29], bone: PAL[30], spirit: PAL[31] };

// ---- math ----
const TAU = Math.PI * 2;
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
function hash2(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s || 0) | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
const fbm = (x, y, s) => vnoise(x, y, s) * 0.65 + vnoise(x * 2.3, y * 2.3, s + 7) * 0.35;
function fmtTime(t) { t = Math.max(0, Math.floor(t)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }
function weighted(map) { let sum = 0; for (const k in map) sum += map[k]; let r = Math.random() * sum; for (const k in map) { r -= map[k]; if (r <= 0) return k; } return Object.keys(map)[0]; }

// ---- object pool: active array + free list, swap-remove ----
class Pool {
  constructor(make, n, max) { this.make = make; this.list = []; this.free = []; this.max = max || 1e9; for (let i = 0; i < n; i++) this.free.push(make()); }
  get() { if (this.list.length >= this.max) return null; const o = this.free.pop() || this.make(); this.list.push(o); return o; }
  kill(i) { const l = this.list, o = l[i]; l[i] = l[l.length - 1]; l.pop(); this.free.push(o); }
  clear() { while (this.list.length) this.free.push(this.list.pop()); }
}

// ---- spatial hash grid for enemies (linked lists in typed arrays) ----
const GRID = { cell: 24, size: 8192, head: new Int32Array(8192), next: new Int32Array(4096), stamp: 1, list: null };
function cellKey(cx, cy) { return (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & (GRID.size - 1); }
function gridBuild(list) {
  GRID.list = list; GRID.head.fill(-1);
  if (GRID.next.length < list.length) GRID.next = new Int32Array(list.length * 2);
  const c = GRID.cell;
  for (let i = 0; i < list.length; i++) {
    const e = list[i], k = cellKey(Math.floor(e.x / c), Math.floor(e.y / c));
    GRID.next[i] = GRID.head[k]; GRID.head[k] = i;
  }
}
const MAXR = 18;
// fills out[] with live enemies whose circle touches (x,y,r); returns count
function gridQuery(x, y, r, out) {
  const list = GRID.list; if (!list) return 0;
  const c = GRID.cell, st = ++GRID.stamp;
  const x0 = Math.floor((x - r - MAXR) / c), x1 = Math.floor((x + r + MAXR) / c);
  const y0 = Math.floor((y - r - MAXR) / c), y1 = Math.floor((y + r + MAXR) / c);
  let n = 0;
  for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
    for (let i = GRID.head[cellKey(cx, cy)]; i !== -1; i = GRID.next[i]) {
      const e = list[i]; if (!e || e.qs === st) continue; e.qs = st;
      if (e.dead) continue;
      const dx = e.x - x, dy = e.y - y, rr = r + e.r;
      if (dx * dx + dy * dy <= rr * rr) out[n++] = e;
    }
  }
  return n;
}

// ---- canvases ----
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }

// ---- 3x5 pixel font (each glyph = 5 rows of 3 bits) ----
const FONTD = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3],
  H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7], M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5],
  O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7],
  V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5], Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
  0: [7, 5, 5, 5, 7], 1: [2, 6, 2, 2, 7], 2: [6, 1, 2, 4, 7], 3: [6, 1, 2, 1, 6], 4: [5, 5, 7, 1, 1], 5: [7, 4, 6, 1, 6], 6: [3, 4, 7, 5, 7],
  7: [7, 1, 1, 2, 2], 8: [7, 5, 7, 5, 7], 9: [7, 5, 7, 1, 6],
  '.': [0, 0, 0, 0, 2], ',': [0, 0, 0, 2, 4], ':': [0, 2, 0, 2, 0], '!': [2, 2, 2, 0, 2], '?': [6, 1, 2, 0, 2], '-': [0, 0, 7, 0, 0],
  '+': [0, 2, 7, 2, 0], '/': [1, 1, 2, 4, 4], '%': [5, 1, 2, 4, 5], "'": [2, 2, 0, 0, 0], '(': [1, 2, 2, 2, 1], ')': [4, 2, 2, 2, 4],
  '<': [1, 2, 4, 2, 1], '>': [4, 2, 1, 2, 4], '=': [0, 7, 0, 7, 0], '#': [5, 7, 5, 7, 5], '*': [5, 2, 7, 2, 5], '"': [5, 5, 0, 0, 0],
  '_': [0, 0, 0, 0, 7], ' ': [0, 0, 0, 0, 0], '[': [3, 2, 2, 2, 3], ']': [6, 2, 2, 2, 6], '^': [2, 5, 0, 0, 0]
};
const FONTK = Object.keys(FONTD), FONTI = {}; FONTK.forEach((k, i) => (FONTI[k] = i));
const fontCache = {};
function fontAtlas(col) {
  let a = fontCache[col]; if (a) return a;
  a = mk(FONTK.length * 4, 5); const x = a.getContext('2d'); x.fillStyle = col;
  FONTK.forEach((k, i) => { const g = FONTD[k]; for (let r = 0; r < 5; r++) for (let b = 0; b < 3; b++) if (g[r] & (4 >> b)) x.fillRect(i * 4 + b, r, 1, 1); });
  return (fontCache[col] = a);
}
const textW = (s, sc) => Math.max(0, String(s).length * 4 * (sc || 1) - (sc || 1));
let ctx = null; // the active low-res buffer context (set at boot)
function text(s, x, y, col, sc, align, shadow) {
  sc = sc || 1; s = String(s).toUpperCase();
  const w = textW(s, sc);
  if (align === 'c') x -= w / 2; else if (align === 'r') x -= w;
  x = Math.round(x); y = Math.round(y);
  if (shadow) drawGlyphs(s, x + (sc > 1 ? sc >> 1 || 1 : 1), y + (sc > 1 ? sc >> 1 || 1 : 1), shadow === true ? C.black : shadow, sc);
  drawGlyphs(s, x, y, col, sc);
  return w;
}
function drawGlyphs(s, x, y, col, sc) {
  const a = fontAtlas(col);
  for (let i = 0; i < s.length; i++) { const gi = FONTI[s[i]]; if (gi === undefined || gi === FONTI[' ']) continue; ctx.drawImage(a, gi * 4, 0, 3, 5, x + i * 4 * sc, y, 3 * sc, 5 * sc); }
}
function wrap(s, maxW, sc) {
  const words = String(s).split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (textW(t, sc) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

// ---- sprite baking: palette strings -> canvases (normal, flipped, white flash, elite outline) ----
function bakeRows(rows, swap) {
  const h = rows.length, w = Math.max.apply(null, rows.map((r) => r.length));
  const c = mk(w, h), x = c.getContext('2d'), id = x.createImageData(w, h);
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    let ch = rows[yy][xx] || '.'; if (swap && swap[ch]) ch = swap[ch];
    const pi = CH[ch]; if (!pi) continue;
    const o = (yy * w + xx) * 4, rgb = PALRGB[pi]; id.data[o] = rgb[0]; id.data[o + 1] = rgb[1]; id.data[o + 2] = rgb[2]; id.data[o + 3] = 255;
  }
  x.putImageData(id, 0, 0); return c;
}
function flipC(src) { const c = mk(src.width, src.height), x = c.getContext('2d'); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); return c; }
function tintC(src, col) { const c = mk(src.width, src.height), x = c.getContext('2d'); x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return c; }
function outlineC(src, col) {
  const s = tintC(src, col), c = mk(src.width + 2, src.height + 2), x = c.getContext('2d');
  x.drawImage(s, 0, 1); x.drawImage(s, 2, 1); x.drawImage(s, 1, 0); x.drawImage(s, 1, 2); x.drawImage(src, 1, 1); return c;
}
const SPR = {};
function defSprite(name, frames, opt) {
  opt = opt || {};
  const fr = frames.map((rows) => {
    const n = bakeRows(rows, opt.swap), f = flipC(n);
    const o = { n, f, w: tintC(n, '#ffffff'), wf: tintC(f, '#ffffff') };
    if (opt.outline) { o.o = outlineC(n, opt.outline); o.of = outlineC(f, opt.outline); }
    return o;
  });
  SPR[name] = { fr, w: fr[0].n.width, h: fr[0].n.height };
  return SPR[name];
}
// frames that share a top part and differ in their bottom rows
const withLegs = (top, legs) => legs.map((l) => top.concat(l));
