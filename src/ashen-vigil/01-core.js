/* ===== 01 core: palette, canvas sizing, pixel font, helpers, save data ===== */
var PAL = ['#0b0912', '#1a1426', '#2b2140', '#3d2f5a', '#5b4a7c', '#8a77a8', '#c1b5d4', '#f2ecf7',
  '#3a1f2b', '#7a2338', '#c23a3a', '#ef6b4a', '#f5a04a', '#f7d36b', '#fff3b8', '#1f3a2a',
  '#2f5e3a', '#4f8f48', '#8cc15a', '#1d3557', '#2d5d9f', '#4aa0e0', '#9bdcf5', '#4a2f20',
  '#7a5232', '#b0834f', '#d8c18f', '#6a2a7a', '#a64ac9', '#e07be0', '#3c3c4c', '#7c7c8c'];
var M = Math, TAU = M.PI * 2;
var cv = document.getElementById('c'), cx = cv.getContext('2d');
var buf = document.createElement('canvas'), g = buf.getContext('2d');
var W = 480, H = 270, SD = 3, offX = 0, offY = 0, DPR = 1;
var resizeHooks = [];

function resize() {
  DPR = window.devicePixelRatio || 1;
  var dw = M.max(1, M.round(innerWidth * DPR)), dh = M.max(1, M.round(innerHeight * DPR));
  cv.width = dw; cv.height = dh;
  SD = M.max(1, M.round(M.min(dw, dh) / 270));                // integer scale factor
  W = M.max(160, M.floor(dw / SD)); H = M.max(120, M.floor(dh / SD));
  buf.width = W; buf.height = H;
  offX = M.floor((dw - W * SD) / 2); offY = M.floor((dh - H * SD) / 2);
  cx.imageSmoothingEnabled = false; g.imageSmoothingEnabled = false;
  for (var i = 0; i < resizeHooks.length; i++) resizeHooks[i]();
}
function present() {
  cx.imageSmoothingEnabled = false;
  cx.fillStyle = PAL[0]; cx.fillRect(0, 0, cv.width, cv.height);
  cx.drawImage(buf, 0, 0, W, H, offX, offY, W * SD, H * SD);
}

/* ---- small helpers ---- */
function rnd() { return M.random(); }
function rr(a, b) { return a + M.random() * (b - a); }
function ri(a, b) { return a + ((M.random() * (b - a + 1)) | 0); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function pick(a) { return a[(M.random() * a.length) | 0]; }
function hash2(x, y) {
  var n = (x * 374761393 + y * 668265263) | 0;
  n = (n ^ (n >>> 13)) * 1274126177 | 0;
  return (n ^ (n >>> 16)) >>> 0;
}
function fmtTime(s) { s = s | 0; return ((s / 60) | 0) + ':' + ('0' + (s % 60)).slice(-2); }
function fmtNum(n) { n = n | 0; return n >= 10000 ? ((n / 1000) | 0) + 'K' : '' + n; }
function ease(t) { return t * t * (3 - 2 * t); }

/* ---- pooled object helper: fixed arrays, free slots reused, no allocation in the game loop ---- */
function makePool(n, ctor) {
  var items = [], i;
  for (i = 0; i < n; i++) { var o = ctor(i); o.on = false; items.push(o); }
  return {
    items: items, n: n, cursor: 0, count: 0,
    get: function () {
      for (var k = 0; k < n; k++) {
        var j = (this.cursor + k) % n;
        if (!items[j].on) { this.cursor = (j + 1) % n; items[j].on = true; return items[j]; }
      }
      return null;
    },
    clear: function () { for (var k = 0; k < n; k++) items[k].on = false; }
  };
}

/* ---- 3x5 pixel font (everything on screen is drawn with this, no DOM text) ---- */
var FONT_SRC = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '111101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111',
  '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001',
  '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110',
  '.': '000000000000010', ',': '000000000010100', '!': '010010010000010', '?': '110001010000010', ':': '000010000010000',
  '-': '000000111000000', '+': '000010111010000', '/': '001001010100100', '%': '101001010100101', "'": '010010000000000',
  '(': '010100100100010', ')': '010001001001010', '=': '000111000111000', '*': '101010111010101', '>': '100010001010100',
  '<': '001010100010001', '#': '101111101111101', '_': '000000000000111', ' ': '000000000000000'
};
var GLYPH = {};
(function () {
  for (var k in FONT_SRC) {
    var s = FONT_SRC[k], list = [];
    for (var i = 0; i < 15; i++) if (s[i] === '1') list.push([i % 3, (i / 3) | 0]);
    GLYPH[k] = list;
  }
})();
function textW(str, sc) { sc = sc || 1; return str.length ? (str.length * 4 - 1) * sc : 0; }
/* txt(str, x, y, scale, paletteIndex, opts): opts.a = 'c' | 'r' alignment, opts.sh = shadow palette index */
function txt(str, x, y, sc, col, o) {
  sc = sc || 1; str = ('' + str).toUpperCase();
  var w = textW(str, sc);
  if (o && o.a === 'c') x -= (w / 2) | 0; else if (o && o.a === 'r') x -= w;
  x = x | 0; y = y | 0;
  if (o && o.sh !== undefined) drawGlyphs(str, x + sc, y + sc, sc, PAL[o.sh]);
  drawGlyphs(str, x, y, sc, typeof col === 'number' ? PAL[col] : col);
  return w;
}
function drawGlyphs(str, x, y, sc, color) {
  g.fillStyle = color;
  for (var i = 0; i < str.length; i++) {
    var gl = GLYPH[str[i]] || GLYPH['?'], bx = x + i * 4 * sc;
    for (var j = 0; j < gl.length; j++) g.fillRect(bx + gl[j][0] * sc, y + gl[j][1] * sc, sc, sc);
  }
}
function wrap(str, maxChars) {
  var words = ('' + str).split(' '), lines = [], cur = '';
  for (var i = 0; i < words.length; i++) {
    var t = cur ? cur + ' ' + words[i] : words[i];
    if (t.length > maxChars && cur) { lines.push(cur); cur = words[i]; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
function box(x, y, w, h, i) { g.fillStyle = PAL[i]; g.fillRect(x | 0, y | 0, w | 0, h | 0); }

/* ---- save data (localStorage, never throws) ---- */
var SAVE_KEY = 'ashenVigil.v1';
var save = { gold: 0, best: 0, kills: 0, wins: 0, runs: 0, hero: 0, upg: { might: 0, armor: 0, hp: 0, speed: 0, magnet: 0, revival: 0, greed: 0 }, vol: { m: 0.8, mu: 0.5, s: 0.8 } };
function loadSave() {
  try {
    var s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s) {
      for (var k in save) if (s[k] !== undefined) {
        if (typeof save[k] === 'object') { for (var j in save[k]) if (s[k][j] !== undefined) save[k][j] = s[k][j]; } else save[k] = s[k];
      }
    }
  } catch (e) { /* private mode */ }
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ } }
