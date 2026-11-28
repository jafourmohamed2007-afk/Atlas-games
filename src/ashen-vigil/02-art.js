/* ===== 02 art: every sprite is a small palette-indexed array (chars 0-9, a-v = PAL index, '.' = clear) ===== */
function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function padRows(rows, sym) {
  var w = 0; rows.forEach(function (r) { w = M.max(w, r.length); });
  var out = rows.map(function (r) { while (r.length < w) r += '.'; return r; });
  if (sym) out = out.map(function (r) { return r + r.split('').reverse().join(''); });
  return out;
}
function paintRows(rows, flip) {
  var h = rows.length, w = rows[0].length, c = mkCanvas(w, h), x = c.getContext('2d');
  for (var y = 0; y < h; y++) for (var i = 0; i < w; i++) {
    var ch = rows[y][flip ? w - 1 - i : i];
    if (ch === '.' || ch === ' ') continue;
    var k = ch.charCodeAt(0); k = k < 58 ? k - 48 : k - 87;
    x.fillStyle = PAL[k] || PAL[0]; x.fillRect(i, y, 1, 1);
  }
  return c;
}
function tintCanvas(c, color) {
  var o = mkCanvas(c.width, c.height), x = o.getContext('2d');
  x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  return o;
}
function outlineCanvas(c, color) {
  var o = mkCanvas(c.width + 2, c.height + 2), x = o.getContext('2d'), t = tintCanvas(c, color);
  [[0, 1], [2, 1], [1, 0], [1, 2], [0, 0], [2, 0], [0, 2], [2, 2]].forEach(function (d) { x.drawImage(t, d[0], d[1]); });
  return o;
}
/* one frame: normal (n), white hit flash (t) and elite glow outline (o), each facing right [0] and left [1] */
function mkFrame(rows) {
  var R = paintRows(rows, false), L = paintRows(rows, true);
  return { w: R.width, h: R.height, n: [R, L], t: [tintCanvas(R, '#ffffff'), tintCanvas(L, '#ffffff')], o: [outlineCanvas(R, PAL[13]), outlineCanvas(L, PAL[13])] };
}
/* lift one leg by a pixel -> a believable walk cycle from a single drawing */
function liftLeg(rows, legs, side) {
  var h = rows.length, w = rows[0].length, half = w >> 1, o = rows.slice(), blank = new Array(w + 1).join('.');
  for (var y = h - legs; y < h; y++) {
    var a = rows[y], b = y + 1 < h ? rows[y + 1] : blank;
    o[y] = side === 0 ? b.slice(0, half) + a.slice(half) : a.slice(0, half) + b.slice(half);
  }
  return o;
}
function mkSprite(def) {
  var rows = padRows(def.rows || def.frames[0], def.sym), fr;
  if (def.frames) fr = def.frames.map(function (f) { return padRows(f, def.sym); });
  else if (def.legs) fr = [rows, liftLeg(rows, def.legs, 0), rows, liftLeg(rows, def.legs, 1)];
  else fr = [rows, rows];
  var frames = fr.map(mkFrame);
  return { w: frames[0].w, h: frames[0].h, fr: frames, bob: def.bob || 0 };
}

var SPR = {};
function buildSprites() {
  SPR.knight = mkSprite({ legs: 3, rows: [
    '....aa......', '...aaaa.....', '..66666666..', '..6u6666u6..', '..66666666..', '...666666...', '.c55555555c.',
    '.c55cccc55c.', '..55cccc55..', '..55555555..', '..44555544..', '...44..44...', '...44..44...', '..uuu..uuu..'] });
  SPR.witch = mkSprite({ legs: 2, rows: [
    '.....rr.....', '....rrrr....', '...rrrrrr...', '..rrrrrrrr..', '.ssssssssss.', '...pppppp...', '...p0pp0p...',
    '....pppp....', '..rrrrrrrr..', '.rrrrsssrrr.', '.rrrrsssrrr.', '..rrrrrrrr..', '..rrrrrrrr..', '..rrr..rrr..'] });
  SPR.ranger = mkSprite({ legs: 2, rows: [
    '....gggg....', '...gggggg...', '..gggggggg..', '..ggpppppg..', '..gp0pp0pg..', '..ggpppppg..', '...gggggg...',
    '..oooooooo..', '.pooonnnoop.', '.pooonnnoop.', '..oooooooo..', '..oo.nn.oo..', '...nn..nn...', '..nnn..nnn..'] });
  SPR.bat = mkSprite({ bob: 2, frames: [
    ['4........4', '44......44', '443.33.344', '.44333344.', '..33aa33..', '...3333...', '....33....', '...3..3...'],
    ['....33....', '..33aa33..', '.44333344.', '443.33.344', '44......44', '4........4', '....33....', '..........']] });
  SPR.ghoul = mkSprite({ legs: 2, rows: [
    '....iiii....', '...iiiiii...', '...iaiiai...', '...iiiiii...', '....i00i....', '..gggggggg..', '.iggggnngi..',
    '.iggggnngi..', '..gggggggg..', '..ggnnnngg..', '..gg....gg..', '.nnn....nnn.'] });
  SPR.skull = mkSprite({ legs: 2, rows: [
    '..qqqqqq..', '.qqqqqqqq.', '.q00qq00q.', '.qqqqqqqq.', '..qqqqqq..', '...qqqq...', '.onnnnnn..',
    'o.nnqqnn..', 'o.nnnnnn..', '.o.nnnn...', '...q..q...', '...q..q...'] });
  SPR.toad = mkSprite({ frames: [
    ['.ee.....ee.', '.e0.....0e.', '..hhhhhhh..', '.hhhhhhhhh.', 'hhhdddddhhh', 'hhdddddddhh', 'hhhdddddhhh', '.hhhhhhhhh.', '.hh.....hh.'],
    ['...........', '.ee.....ee.', '.e0hhhhh0e.', '.hhhhhhhhh.', 'hhhdddddhhh', 'hhdddddddhh', 'hhhdddddhhh', 'hhhhhhhhhhh', 'hh.......hh']] });
  SPR.wraith = mkSprite({ bob: 2, frames: [
    ['...mmmm...', '..mmmmmm..', '.mm0mm0mm.', '.mmmmmmmm.', '.mmm00mmm.', '.lmmmmmml.', '.llmmmmll.', '.llllllll.', '..llllll..', '.lkl.lkl..', '..k..k.k..', '.....k....'],
    ['...mmmm...', '..mmmmmm..', '.mm0mm0mm.', '.mmmmmmmm.', '.mmm00mmm.', '.lmmmmmml.', '.llmmmmll.', '.llllllll.', '..llllll..', '..lkl.lkl.', '..k.k..k..', '....k.....']] });
  SPR.golem = mkSprite({ sym: true, legs: 3, rows: [
    '.....qqqqqqq', '...qqqqqqqqq', '..qqqqqqqqqq', '..qq00aaqqqq', '..qq00aaqqqq', '..qqqqqqqqqq', '...q0q0q0q0q',
    '.vvvvvvvvvvv', 'vvvvvvvuvvvv', 'vvqqvvvvuvvv', 'vvqqvvvvvvuv', 'vvvvvvqqvvvv', '.vvvvvqqvvvv', '..vvvvvvvvvv',
    '..uuvvvvvvvv', '..uuuvvvvvvv', '..quuvvvuvvv', '..qq.vvvvvvv', '..qq.vvvvvvv', '..qq.vvuvvvv', '..vvv.vvvvvv',
    '.vvvv..vvvvv', '.uuuu...uuuu', '.uuuuu..uuuu'] });
  SPR.reaper = mkSprite({ sym: true, bob: 2, frames: [[
    '.......11111', '.....1122222', '....11222222', '...112223333', '...122300000', '...12230dd00', '...12230dd00', '...122300000',
    '...122223q3q', '..1122222333', '.11222233333', '112222333333', '122223333333', '122233333344', '122233333444', '122233334444',
    '12223333r444', '12223333rrr4', '12223333rrrr', '122233334444', '122223333333', '112222333333', '.12222233333', '.11222223333',
    '..1122222333', '..1112222222', '...111122222', '....11111111'], [
    '.......11111', '.....1122222', '....11222222', '...112223333', '...122300000', '...12230dd00', '...12230dd00', '...122300000',
    '...122223q3q', '..1122222333', '.11222233333', '112222333333', '122223333333', '122233333344', '122233333444', '122233334444',
    '12223333r444', '12223333rrr4', '12223333rrrr', '122233334444', '122223333333', '112222333333', '.12222233333', '..1222223333',
    '...112222333', '...11122222.', '....1112222.', '.....1111111']] });
  SPR.chest = mkSprite({ rows: [
    '.oooooooooo.', 'oppppppppppo', 'oppppppppppo', 'oooooooooooo', 'ppnnnddnnnpp', 'ppnnnddnnnpp',
    'ppnnnddnnnpp', 'oooooooooooo', 'onnnnnnnnnno', 'oooooooooooo'] });
}

/* ---- 8x8 icons (weapons, passives, pickups) ---- */
var ICON = {};
var ICON_SRC = {
  blade: ['......67', '.....67.', '....67..', '.d.67...', '.dd7....', '..od....', '.oo.....', 'oo......'],
  bolt: ['...tt...', '..tssl..', '.tsmmst.', '.sml.ms.', '.tsmmst.', '..tsst..', '.s.tt.s.', 's......s'],
  bone: ['.....qq.', '....qq..', '...qq...', '..qq....', '.qq.q...', 'qq...q..', 'q.......', '........'],
  stones: ['..4..4..', '.4s44s4.', '4.s..s.4', '..4..4..', '.s....s.', '4.s44s.4', '.4s44s4.', '..4..4..'],
  font: ['...dd...', '...dd...', '.ddeedd.', '.ddeedd.', '...dd...', '...dd...', '.d.dd.d.', '..dddd..'],
  sigil: ['....dd..', '...dd...', '..dd....', '.dddddd.', '....dd..', '...dd...', '..d.....', '.d......'],
  flask: ['...qq...', '...66...', '..6666..', '.6bbbb6.', '.6bccb6.', '.6bccb6.', '.66bb66.', '..6666..'],
  chain: ['.l..l...', 'lml.lml.', '.l..l.l.', '..llml..', '..lm.l..', '.l..l...', 'lml.lml.', '.l..l...'],
  heart: ['.aa..aa.', 'abbaabba', 'abbbbbba', 'abbbbbba', '.abbbba.', '..abba..', '...aa...', '........'],
  boots: ['........', '.oo.....', '.oo.....', '.oo.....', '.oooooo.', 'oppppppo', 'oooooooo', '........'],
  glass: ['.666666.', '..6dd6..', '...66...', '...dd...', '..6dd6..', '.6dddd6.', '.666666.', '........'],
  magnet: ['aa....kk', 'aa....kk', 'aa....kk', 'aa....kk', '.aa..kk.', '..aakk..', '...66...', '........'],
  book: ['.rrrrrr.', 'rssssssr', 'rs77s77r', 'rssssssr', 'rs77s77r', 'rssssssr', '.rrrrrr.', '........'],
  coin: ['..dddd..', '.dd66dd.', 'dd6dd6dd', 'dd6dd6dd', 'dd6dd6dd', 'dd6dd6dd', '.dd66dd.', '..dddd..'],
  gem: ['..aaaa..', '.abbbba.', 'abbeebba', 'abbbbbba', '.abbbba.', '..abba..', '...aa...', '........'],
  chicken: ['..pppp..', '.pcccp..', 'pcccccp.', 'pccccccp', '.pccccp.', '..ppp.q.', '.....qq.', '....q...'],
  rosary: ['..dd....', '.d..d...', '.d..d...', '..dd.dd.', '....d..d', '...dd.d.', '..d.dd..', '.dd.....'],
  orb: ['..llll..', '.lmmmml.', 'lmm77mml', 'lm7mmmml', 'lmmmmmml', 'lmmmmmll', '.llllll.', '..llll..'],
  lantern: ['..oooo..', '..o..o..', '.oddddo.', '.deeeed.', '.deeeed.', '.oddddo.', '..oooo..', '...oo...'],
  chest: ['.oooooo.', 'opppppo.', 'oooooooo', 'ppndndpp', 'ppnddnpp', 'oooooooo', 'onnnnnno', 'oooooooo'],
  heal: ['..aaaa..', '..a77a..', 'aaa77aaa', 'a777777a', 'aaa77aaa', '..a77a..', '..aaaa..', '........']
};
function buildIcons() {
  for (var k in ICON_SRC) ICON[k] = paintRows(padRows(ICON_SRC[k]), false);
}
function icon(name, x, y, s) {
  var c = ICON[name]; if (!c) return;
  s = s || 1; g.drawImage(c, x | 0, y | 0, 8 * s, 8 * s);
}

/* ---- gems (blue / green / red XP) ---- */
var GEM = [];
function buildGems() {
  var cols = [[21, 22, 20], [18, 14, 17], [11, 14, 10]];
  cols.forEach(function (c) {
    var cv2 = mkCanvas(5, 5), x = cv2.getContext('2d');
    var rows = ['..1..', '.123.', '12223', '.123.', '..3..'];
    var map = { '1': PAL[c[1]], '2': PAL[c[0]], '3': PAL[c[2]] };
    for (var y = 0; y < 5; y++) for (var i = 0; i < 5; i++) { var ch = rows[y][i]; if (ch !== '.') { x.fillStyle = map[ch]; x.fillRect(i, y, 1, 1); } }
    GEM.push(cv2);
  });
}

/* ---- ground: an endless tiling of grass, ash, ruined floor, bone piles ---- */
var TILE = 16, GROUND = { grass: [], ash: [], ruin: [], deco: {} };
function buildGround() {
  function tile(base, dots, seed) {
    var c = mkCanvas(TILE, TILE), x = c.getContext('2d');
    x.fillStyle = PAL[base]; x.fillRect(0, 0, TILE, TILE);
    var s = seed;
    for (var i = 0; i < dots.n; i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      var px = s % TILE, py = (s >> 8) % TILE;
      x.fillStyle = PAL[dots.c[i % dots.c.length]]; x.fillRect(px, py, 1, 1);
    }
    return { c: c, x: x };
  }
  var i, t;
  for (i = 0; i < 4; i++) {
    t = tile(16, { n: 16, c: [15, 17, 15, 18] }, 91 + i * 31);
    if (i === 2) { t.x.fillStyle = PAL[17]; t.x.fillRect(5, 9, 1, 2); t.x.fillRect(6, 8, 1, 1); t.x.fillRect(4, 8, 1, 1); }
    GROUND.grass.push(t.c);
  }
  for (i = 0; i < 4; i++) {
    t = tile(1, { n: 14, c: [30, 2, 30, 3, 31] }, 17 + i * 53);
    if (i === 3) { t.x.fillStyle = PAL[30]; t.x.fillRect(3, 11, 3, 1); t.x.fillRect(10, 4, 2, 1); }
    GROUND.ash.push(t.c);
  }
  for (i = 0; i < 3; i++) {
    t = tile(2, { n: 8, c: [3, 1, 30] }, 7 + i * 41);
    t.x.fillStyle = PAL[1]; t.x.fillRect(0, 0, TILE, 1); t.x.fillRect(0, 0, 1, TILE);
    t.x.fillStyle = PAL[3]; t.x.fillRect(1, 1, TILE - 1, 1);
    if (i === 1) { t.x.fillStyle = PAL[1]; t.x.fillRect(4, 5, 5, 1); t.x.fillRect(8, 6, 1, 4); }
    GROUND.ruin.push(t.c);
  }
  GROUND.deco.bones = paintRows(['.q....q.', 'qq.qq.qq', '.q.qqq..', 'qqqq.qq.', '.qq..q..'], false);
  GROUND.deco.skull = paintRows(['.qqq.', 'q0q0q', 'qqqqq', '.q.q.'], false);
  GROUND.deco.grave = paintRows(['..44..', '.4444.', '.4334.', '.4444.', '.4334.', '.4444.', '4444444'], false);
  GROUND.deco.pillar = paintRows(['.4444.', '.3443.', '..43..', '..43..', '..33..', '.4334.', '.3333.', '333333'], false);
  GROUND.deco.tuft = paintRows(['.i.i.', 'ihihi', '.hhh.'], false);
  GROUND.deco.rock = paintRows(['.vvv.', 'v666v', '55555', '.444.'], false);
  GROUND.deco.torch = paintRows(['.b.', 'bcb', '.d.', '.o.', '.o.', '.o.', '.o.'], false);
}
function biome(tx, ty) {
  var b = hash2(M.floor(tx / 7), M.floor(ty / 7)) & 3;
  return b < 2 ? 0 : b === 2 ? 1 : 2;
}
function drawGround(camX, camY) {
  var x0 = M.floor(camX / TILE), y0 = M.floor(camY / TILE), x1 = x0 + M.ceil(W / TILE) + 1, y1 = y0 + M.ceil(H / TILE) + 1;
  for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) {
    var h = hash2(tx, ty), b = biome(tx, ty), t;
    if (b === 0) t = GROUND.grass[h & 3]; else if (b === 1) t = GROUND.ash[h & 3]; else t = (h & 7) < 6 ? GROUND.ruin[h % 3] : GROUND.ash[h & 3];
    g.drawImage(t, tx * TILE - camX, ty * TILE - camY);
  }
}
function drawDecor(camX, camY) {
  var x0 = M.floor(camX / TILE) - 1, y0 = M.floor(camY / TILE) - 1, x1 = x0 + M.ceil(W / TILE) + 3, y1 = y0 + M.ceil(H / TILE) + 3;
  for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) {
    var h = hash2(tx + 999, ty - 777), b = biome(tx, ty), d = null, m = h % 61;
    if (b === 0) { if (m < 6) d = GROUND.deco.tuft; else if (m === 7) d = GROUND.deco.rock; else if (m === 8) d = GROUND.deco.grave; }
    else if (b === 1) { if (m < 3) d = GROUND.deco.bones; else if (m === 4) d = GROUND.deco.skull; else if (m === 5) d = GROUND.deco.rock; }
    else { if (m < 3) d = GROUND.deco.pillar; else if (m === 4) d = GROUND.deco.bones; else if (m === 5) d = GROUND.deco.torch; }
    if (d) g.drawImage(d, tx * TILE + (h >> 6) % 8 - camX, ty * TILE + (h >> 10) % 8 - camY);
  }
}

/* ---- draw one sprite frame centred on (x, y); face = 0 right, 1 left ---- */
function drawSpr(sp, f, x, y, face, flash, elite) {
  var fr = sp.fr[f % sp.fr.length], by = (sp.bob && (f & 1)) ? -1 : 0;
  var dx = M.round(x - fr.w / 2), dy = M.round(y - fr.h / 2) + by;
  if (elite) { g.globalAlpha = 0.55 + 0.45 * M.sin(timeNow * 8); g.drawImage(fr.o[face], dx - 1, dy - 1); g.globalAlpha = 1; }
  g.drawImage((flash > 0 ? fr.t : fr.n)[face], dx, dy);
}
var timeNow = 0; // wall clock seconds, set every frame (drives glows)
