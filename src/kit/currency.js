/* Bubzi currencies (shared by every game and the website).
   - Each game has its OWN currency, earned only in that game.
   - Bubzi Coins are the website currency (daily bonus, skins).
   - The Bubzi Exchange turns a game currency into Bubzi Coins. Rates change every day
     (the same for everyone, computed from the date, no server) and one game a day is HOT (x2). */
var BubziCur = (function () {
  var COIN = 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18z';
  var B = { id: 'bubzi', n: { en: 'Bubzi Coins', fr: 'Pièces Bubzi', ar: 'عملات بوبزي' }, c: '#9B6BFF', d: '#4B23C8', p: COIN,
    x: [{ s: '#F1EAFF', d: 'M9.6 7v9.6M9.6 11.8h2.6a2.4 2.4 0 0 1 0 4.8h-2.6' }] };
  var DEF = { n: { en: 'Coins', fr: 'Pièces', ar: 'عملات' }, c: '#FFC93C', d: '#E07A00', p: COIN, x: [{ s: '#C46A00', d: 'M12 7v10' }], rate: 1 };
  var C = {
    'block-bloom': { n: { en: 'Petals', fr: 'Pétales', ar: 'بتلات' }, c: '#FF6FAE', d: '#C2306E', rate: 1,
      p: 'M12 4.5c2.6 0 3.6 2.6 2.8 4.6c2-.9 4.7.1 4.7 2.9s-2.7 3.8-4.7 2.9c.8 2-.2 4.6-2.8 4.6s-3.6-2.6-2.8-4.6c-2 .9-4.7-.1-4.7-2.9s2.7-3.8 4.7-2.9c-.8-2 .2-4.6 2.8-4.6z',
      x: [{ f: '#FFE15A', d: 'M12 10a2 2 0 1 1 0 4a2 2 0 1 1 0-4z' }] },
    'pocket-grove': { n: { en: 'Grove Gold', fr: 'Or du verger', ar: 'ذهب البستان' }, c: '#FFC93C', d: '#B86E00', rate: 20, p: COIN,
      x: [{ f: '#4CC46B', d: 'M7.5 16c0-5.5 4-8.5 9-8.5c0 5.5-3.8 8.5-9 8.5z' }, { s: '#1E7A3A', d: 'M7.5 16l5-5' }] },
    'rooftop-rush': { n: { en: 'Sparks', fr: 'Étincelles', ar: 'شرارات' }, c: '#FFB020', d: '#B85A00', rate: 1,
      p: 'M13.8 2.5L5 13.6h6.2l-1.6 7.9L19 10.2h-6.1l.9-7.7z' },
    'hop-hook': { n: { en: 'Sky Gems', fr: 'Gemmes du ciel', ar: 'جواهر السماء' }, c: '#45BEFF', d: '#1663A8', rate: 1,
      p: 'M7 4h10l4.5 5.5L12 21L2.5 9.5z', x: [{ s: '#C9EEFF', d: 'M2.5 9.5h19M9.2 9.5L12 4.3l2.8 5.2L12 20' }] },
    'number-pop': { n: { en: 'Pop Bubbles', fr: 'Bulles', ar: 'فقاعات' }, c: '#5FD4FF', d: '#1A86CC', rate: 1, p: COIN,
      x: [{ s: '#FFFFFF', d: 'M7.6 11a4.4 4.4 0 0 1 3.4-3.6' }, { f: '#FFFFFF', d: 'M15 15.5a1.2 1.2 0 1 1 0 .1z' }] },
    'hill-hopper': { n: { en: 'Nuts', fr: 'Écrous', ar: 'صواميل' }, c: '#FFA24C', d: '#9A4A00', rate: 1,
      p: 'M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z', x: [{ f: '#7A3A00', d: 'M12 8.6a3.4 3.4 0 1 1 0 6.8a3.4 3.4 0 1 1 0-6.8z' }] },
    'jelly-drop': { n: { en: 'Jelly Beans', fr: 'Bonbons gelée', ar: 'حلوى الجيلي' }, c: '#3BE0B5', d: '#0A8A6C', rate: 1,
      p: 'M7 6c3-3 8-2 9 1c.6 2 3 2.6 3.5 5.5c.8 4.5-5 8.5-10 6.5S2.5 10.5 7 6z', x: [{ s: '#E6FFF7', d: 'M8 9.2c1-1.5 3-2 4.5-1.5' }] },
    'memo-match': { n: { en: 'Brain Stars', fr: 'Étoiles', ar: 'نجوم الذكاء' }, c: '#FFD23F', d: '#B08600', rate: 1,
      p: 'M12 2.8l2.8 5.9l6.4.8l-4.7 4.4l1.2 6.4L12 17.2l-5.7 3.1l1.2-6.4L2.8 9.5l6.4-.8z' },
    'wiggle-snake': { n: { en: 'Apples', fr: 'Pommes', ar: 'تفاح' }, c: '#FF4D5E', d: '#A81A30', rate: 1,
      p: 'M12 7.5c-2.5-2-8-1.5-8 4.5c0 5 3.5 9 6 9c1 0 1.5-.5 2-.5s1 .5 2 .5c2.5 0 6-4 6-9c0-6-5.5-6.5-8-4.5z',
      x: [{ f: '#2FBF71', d: 'M12 7.5c0-2 1-4 3.5-4.5c0 2.3-1.3 4-3.5 4.5z' }] },
    'spear-hills': { n: { en: 'Spearheads', fr: 'Pointes', ar: 'رؤوس الرماح' }, c: '#C9D3E0', d: '#55657A', rate: 1,
      p: 'M12 2.5L17.5 12L12 21.5L6.5 12z', x: [{ s: '#FFFFFF', d: 'M12 5.5v13' }] },
    'arrow-rampart': { n: { en: 'Feathers', fr: 'Plumes', ar: 'ريش' }, c: '#E8364F', d: '#8E1B2E', rate: 1,
      p: 'M19 3C11 4 6 9 5 17l-2 4 1 1 4-2c8-1 13-6 14-14z', x: [{ f: '#FFD9DE', d: 'M8 16L17 7l1 1-9 9z' }] },
    'arrow-rampart-3d': { n: { en: 'Feathers', fr: 'Plumes', ar: 'ريش' }, c: '#E8364F', d: '#8E1B2E', rate: 1,
      p: 'M19 3C11 4 6 9 5 17l-2 4 1 1 4-2c8-1 13-6 14-14z', x: [{ f: '#FFD9DE', d: 'M8 16L17 7l1 1-9 9z' }] },
    'bubble-bastion': { n: { en: 'Pearls', fr: 'Perles', ar: 'لآلئ' }, c: '#9FD8FF', d: '#2A7FB8', rate: 1,
      p: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', x: [{ f: '#FFFFFF', d: 'M8 7.5a2.2 2.2 0 1 0 0.01 0z' }] },
    'tiny-siege': { n: { en: 'War Banners', fr: 'Bannières', ar: 'رايات' }, c: '#FF7F45', d: '#A8380F', rate: 1,
      p: 'M5 2.5h2v19H5zM7 4h12l-3 4.5 3 4.5H7z', x: [{ f: '#FFD9C2', d: 'M9 6h5v2H9z' }] },
    'merge-blasters': { n: { en: 'Goo Cells', fr: 'Cellules de gelée', ar: 'خلايا الهلام' }, c: '#5FD4FF', d: '#1A6FB0', rate: 1,
      p: 'M8 3h8v3.5h1.5a1.5 1.5 0 0 1 1.5 1.5v11.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5V8a1.5 1.5 0 0 1 1.5-1.5H8z', x: [{ f: '#B9F0FF', d: 'M8 13h8v5H8z' }] },
    'ink-heroes': { n: { en: 'Ink Drops', fr: "Gouttes d'encre", ar: 'قطرات الحبر' }, c: '#4A4FC4', d: '#15163F', rate: 2,
      p: 'M12 2.5c3 4.5 7 8.5 7 12a7 7 0 0 1-14 0c0-3.5 4-7.5 7-12z', x: [{ s: '#AEB2FF', d: 'M8.6 14.6a3.5 3.5 0 0 0 2.6 3.5' }] },
    'ink-heroes-remastered': { n: { en: 'Ink Drops', fr: "Gouttes d'encre", ar: 'قطرات الحبر' }, c: '#E0233A', d: '#4A0A14', rate: 2,
      p: 'M12 2.5c3 4.5 7 8.5 7 12a7 7 0 0 1-14 0c0-3.5 4-7.5 7-12z', x: [{ s: '#FFB0B8', d: 'M8.6 14.6a3.5 3.5 0 0 0 2.6 3.5' }] }
  };
  var IDS = Object.keys(C);
  function get(id) { if (id === 'bubzi') return B; var c = C[id]; if (!c) return DEF; c.id = id; return c; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function day(offset) { var d = new Date(); if (offset) d.setDate(d.getDate() + offset); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function hot(d) { return IDS[Math.floor(hash('hot:' + (d || day())) * IDS.length)]; }
  /* today's multiplier for a game: 0.8 to 1.25, and x2 for the HOT game */
  function mult(id, d) { d = d || day(); var m = 0.8 + Math.round(hash(id + ':' + d) * 9) * 0.05; return Math.round((hot(d) === id ? m * 2 : m) * 100) / 100; }
  function trend(id) { var a = mult(id), b = mult(id, day(-1)); return a > b ? 1 : a < b ? -1 : 0; }
  /* how many Bubzi Coins `amount` of this game's currency is worth today */
  function quote(id, amount) { var c = get(id); return Math.floor(Math.max(0, amount) / (c.rate || 1) * mult(id)); }
  function svg(c, size) {
    if (typeof c === 'string') c = get(c);
    var h = '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + c.p + '" fill="' + c.c + '" stroke="' + c.d + '" stroke-width="1.8" stroke-linejoin="round"/>';
    (c.x || []).forEach(function (x) { h += x.f ? '<path d="' + x.d + '" fill="' + x.f + '"/>' : '<path d="' + x.d + '" fill="none" stroke="' + x.s + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'; });
    return h + '</svg>';
  }
  var cache = {};
  function draw(ctx, c, x, y, r, sx) {
    if (typeof c === 'string') c = get(c);
    if (typeof Path2D === 'undefined') return;
    var k = c.p, P = cache[k] || (cache[k] = new Path2D(c.p));
    ctx.save(); ctx.translate(x, y); ctx.scale((sx === undefined ? 1 : sx) * r / 10, r / 10); ctx.translate(-12, -12);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = c.c; ctx.strokeStyle = c.d; ctx.lineWidth = 1.8; ctx.fill(P); ctx.stroke(P);
    (c.x || []).forEach(function (e) { var Q = cache[e.d] || (cache[e.d] = new Path2D(e.d)); if (e.f) { ctx.fillStyle = e.f; ctx.fill(Q); } else { ctx.strokeStyle = e.s; ctx.lineWidth = 1.9; ctx.stroke(Q); } });
    ctx.restore();
  }
  return { ids: IDS, get: get, bubzi: B, day: day, hot: hot, mult: mult, trend: trend, quote: quote, svg: svg, draw: draw, TOUR_GAMES: 3, TOUR_COINS: 50 };
})();
