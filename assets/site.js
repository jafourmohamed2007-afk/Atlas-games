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

/* Bubzi website runtime. Data comes from window.BZ (written by tools/site.js). */
(function () {
  'use strict';
  var BZ = window.BZ, T = BZ.t, NS = 'bubzi:';
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(NS + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { } }
  };
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmt(n) { return Math.floor(n).toLocaleString('en-US'); }
  function tr(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] !== undefined ? o[k] : m; }); }
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var byId = {}; BZ.games.forEach(function (g) { byId[g.id] = g; });

  /* ---------- theme ---------- */
  var tbtn = $('#themeBtn');
  if (tbtn) tbtn.addEventListener('click', function () {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (cur === 'dark') document.documentElement.setAttribute('data-theme', 'dark'); else document.documentElement.removeAttribute('data-theme');
    store.set('theme', cur);
  });
  /* ---------- language ---------- */
  var ls = $('#langSel');
  if (ls) ls.addEventListener('change', function () { var o = ls.options[ls.selectedIndex]; store.set('lang', ls.value); location.href = o.getAttribute('data-href') + (location.hash === '#play' ? '' : ''); });

  /* ---------- coins ---------- */
  function wallet() { var c = store.get('coins', 0); return typeof c === 'number' && isFinite(c) && c >= 0 ? Math.floor(c) : 0; }
  function paintCoins() { $$('[data-coins]').forEach(function (el) { el.textContent = fmt(wallet()); }); }
  paintCoins();
  window.addEventListener('storage', function () { paintCoins(); paintDaily(); });

  function toast(msg) { var o = $('.toast'); if (o) o.remove(); var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 1800); }

  /* ---------- daily reward (same rules and storage as the games) ---------- */
  var DAILY = [20, 30, 50, 70, 100, 150, 250];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayDiff(a, b) { return Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / 86400000); }
  function dailyInfo() {
    var s = store.get('daily', null), t = today();
    if (!s || typeof s.last !== 'string' || !(s.streak >= 1)) return { can: true, day: 1 };
    var diff = dayDiff(s.last, t);
    if (!isFinite(diff)) return { can: true, day: 1 };
    if (diff <= 0) return { can: false, day: s.streak };
    if (diff === 1) return { can: true, day: (s.streak % 7) + 1 };
    return { can: true, day: 1 };
  }
  function claim() {
    var d = dailyInfo(); if (!d.can) return;
    var amt = DAILY[d.day - 1]; store.set('coins', wallet() + amt); store.set('daily', { last: today(), streak: d.day });
    toast('+' + amt + ' ' + T.coins); paintCoins(); paintDaily(); renderRewards();
  }
  function paintDaily() {
    var d = dailyInfo(), strip = $('#reward');
    $$('.pip').forEach(function (p) { p.hidden = !d.can; });
    if (!strip) return;
    strip.hidden = !d.can;
    var h = $('#rewardTxt'); if (h) h.textContent = tr(T.dailyReady, { d: d.day }) + ' · +' + DAILY[d.day - 1];
  }
  paintDaily();
  var rc = $('#rewardClaim'); if (rc) rc.addEventListener('click', claim);

  /* ---------- skins (shared with games) ---------- */
  var SKINS = [['grape', '#7B4DFF', '#5A2EE8', 0], ['mint', '#14C8A0', '#0A9475', 100], ['mango', '#FF8A1F', '#C25400', 150], ['gum', '#FF5FA2', '#D43D80', 250],
    ['sky', '#38B6FF', '#1A86CC', 400], ['lemon', '#FFD23F', '#C99A00', 600], ['night', '#4A3F80', '#241B4D', 900], ['ruby', '#E8364F', '#A81A30', 1400]];
  function owned() { var o = store.get('skins', ['grape']); if (!Array.isArray(o)) o = ['grape']; if (o.indexOf('grape') < 0) o.push('grape'); return o; }
  function blob(c, d) { return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 14C50 14 59 27 59 39C59 52 47 59 32 59C17 59 5 52 5 39C5 27 14 14 32 14Z" fill="' + c + '" stroke="' + d + '" stroke-width="3"/><circle cx="23" cy="37" r="6" fill="#fff"/><circle cx="41" cy="37" r="6" fill="#fff"/><circle cx="24" cy="38" r="3" fill="#241B4D"/><circle cx="42" cy="38" r="3" fill="#241B4D"/></svg>'; }

  /* ---------- cards ---------- */
  /* a partner picture that cannot load: show a coloured tile with the game name instead */
  function noImg(img) { var c = img.closest && img.closest('.card'); if (c) c.classList.add('noimg'); if (c || (img.closest && img.closest('.hb-pics'))) img.style.display = 'none'; }
  document.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG') noImg(e.target); }, true);
  $$('.card img').forEach(function (img) { if (img.complete && !img.naturalWidth && img.getAttribute('src')) noImg(img); });
  function card(g, sub) {
    return '<a class="card" href="' + esc(g.url) + '" style="--c:' + g.c + '" data-prev="' + esc(g.prev || '') + '">' +
      '<div class="thumb">' + (g.isNew ? '<span class="badge new">NEW</span>' : '') + '<img src="' + esc(g.thumb) + '" alt="" width="256" height="256" loading="lazy"><div class="prev"></div>' + (g.ext ? '<span class="ext">' + esc(g.ext) + '</span>' : '') + '</div>' +
      '<div class="t" dir="auto">' + esc(g.title) + '</div>' + (sub ? '<div class="s">' + esc(sub) + '</div>' : '') + '</a>';
  }
  function recent() { var r = store.get('recent', []); return (Array.isArray(r) ? r : []).map(function (x) { return x && byId[x.id]; }).filter(Boolean); }
  function best(id) { var b = store.get('best:' + id, 0); return typeof b === 'number' ? b : 0; }
  function favs() { var f = store.get('favs', []); return Array.isArray(f) ? f : []; }
  function mostPlayed() {
    return BZ.games.map(function (g) { var n = store.get('plays:' + g.id, 0); return { g: g, n: typeof n === 'number' ? n : 0 }; }).filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 8);
  }
  function fillRow(sel, list, subFn) { var el = $(sel); if (!el) return; var wrap = el.closest('section'); if (!list.length) { wrap.hidden = true; return; } wrap.hidden = false; el.innerHTML = list.map(function (g) { return card(g, subFn && subFn(g)); }).join(''); }
  fillRow('#rowContinue', recent(), function (g) { return best(g.id) ? T.best + ' ' + fmt(best(g.id)) : ''; });
  fillRow('#rowMost', mostPlayed().map(function (x) { return x.g; }), function (g) { return tr(T.plays, { n: store.get('plays:' + g.id, 0) }); });

  /* ---------- game of the day ---------- */
  var hero = $('#hero');
  if (hero) {
    var own = BZ.games.filter(function (g) { return !g.ext; }), dayN = Math.floor(Date.now() / 86400000), god = own[dayN % own.length];
    if (god) {
      $('.bgart', hero).style.backgroundImage = 'url("' + god.thumb + '")';
      $('#heroTitle').textContent = god.title; $('#heroDesc').textContent = god.tag || '';
      $('#heroPlay').setAttribute('href', god.url);
      var clip = $('.clip', hero); clip.style.backgroundImage = 'url("' + god.prev + '")'; clip.setAttribute('data-prev', god.prev);
      if (!reduce) animate(clip, true);
    }
  }

  /* ---------- gameplay previews ---------- */
  function animate(el, loop) {
    var i = 0; el._t && clearInterval(el._t);
    el._t = setInterval(function () { i = (i + 1) % 12; el.style.backgroundPosition = (i / 11 * 100) + '% 0'; if (!loop && i === 11) { clearInterval(el._t); } }, 190);
  }
  function startPrev(c) {
    var p = $('.prev', c), src = c.getAttribute('data-prev'); if (!p || !src || reduce) return;
    if (!p.style.backgroundImage) p.style.backgroundImage = 'url("' + src + '")';
    c.classList.add('playing'); animate(p, true);
  }
  function stopPrev(c) { var p = $('.prev', c); c.classList.remove('playing'); if (p && p._t) clearInterval(p._t); }
  document.addEventListener('pointerover', function (e) { if (e.pointerType !== 'mouse') return; var c = e.target.closest && e.target.closest('.card'); if (c && !c.classList.contains('playing')) { $$('.card.playing').forEach(stopPrev); startPrev(c); } });
  document.addEventListener('pointerout', function (e) { if (e.pointerType !== 'mouse') return; var c = e.target.closest && e.target.closest('.card'); if (c && !c.contains(e.relatedTarget)) stopPrev(c); });
  // touch screens: one visible card at a time comes alive, like a video thumbnail
  if (!reduce && window.IntersectionObserver && matchMedia('(hover: none)').matches) {
    var vis = [];
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { var k = vis.indexOf(e.target); if (e.isIntersecting && e.intersectionRatio > 0.8) { if (k < 0) vis.push(e.target); } else if (k >= 0) { vis.splice(k, 1); stopPrev(e.target); } }); }, { threshold: [0, 0.8] });
    $$('#gridHot .card, #gridAll .card').forEach(function (c) { if (c.getAttribute('data-prev')) io.observe(c); });
    var spot = 0; setInterval(function () { if (!vis.length || document.hidden) return; $$('.card.playing').forEach(stopPrev); spot = (spot + 1) % vis.length; startPrev(vis[spot]); }, 3200);
  }

  /* ---------- sheets ---------- */
  var lastFocus = null;
  function openSheet(id) {
    closeSheets(); var s = $('#' + id); if (!s) return; lastFocus = document.activeElement;
    s.classList.add('open'); s.setAttribute('aria-hidden', 'false');
    $$('.tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-sheet') === id); });
    if (id === 'sheetSearch') { var i = $('#q2'); i.value = ''; renderSearch(''); setTimeout(function () { i.focus(); }, 60); }
    if (id === 'sheetMy') renderMy();
    if (id === 'sheetRewards') renderRewards();
    if (id !== 'sheetSearch') { var f = $('button,a,input', $('.panel', s)); if (f) f.focus(); }
  }
  function closeSheets() {
    var was = $$('.sheet.open').length;
    $$('.sheet').forEach(function (s) { s.classList.remove('open'); s.setAttribute('aria-hidden', 'true'); });
    $$('.tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-sheet') === 'home'); });
    if (was && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-sheet]').forEach(function (b) { b.addEventListener('click', function (e) { var id = b.getAttribute('data-sheet'); if (id === 'home') return; e.preventDefault(); openSheet(id); }); });
  $$('.sheet .scrim, .sheet [data-close]').forEach(function (b) { b.addEventListener('click', closeSheets); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheets(); if (e.key === '/' && document.activeElement === document.body) { e.preventDefault(); var q = $('#q'); if (q && q.offsetParent) q.focus(); else openSheet('sheetSearch'); } });

  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function matches(q) {
    q = norm(q.trim()); if (!q) return BZ.games.slice();
    return BZ.games.filter(function (g) { return norm(g.title + ' ' + (g.alt || '') + ' ' + (g.catName || '') + ' ' + (g.kw || '')).indexOf(q) >= 0; });
  }
  function renderSearch(q) {
    var list = matches(q), out = $('#searchOut');
    out.innerHTML = list.length ? '<div class="grid">' + list.map(function (g) { return card(g); }).join('') + '</div>' : '<p class="empty">' + esc(T.noResults) + '</p>';
  }
  var q2 = $('#q2'); if (q2) q2.addEventListener('input', function () { renderSearch(q2.value); });
  var q = $('#q');
  if (q) {
    q.addEventListener('focus', function () { openSheet('sheetSearch'); var i = $('#q2'); i.value = q.value; renderSearch(q.value); q.blur(); setTimeout(function () { i.focus(); }, 60); });
  }
  function renderMy() {
    var out = $('#myOut'), r = recent(), f = favs().map(function (id) { return byId[id]; }).filter(Boolean), m = mostPlayed();
    var h = '';
    if (r.length) h += '<section><div class="sh"><h2>' + esc(T.continue) + '</h2></div><div class="grid">' + r.map(function (g) { return card(g, best(g.id) ? T.best + ' ' + fmt(best(g.id)) : ''); }).join('') + '</div></section>';
    if (f.length) h += '<section><div class="sh"><h2>' + esc(T.favorites) + '</h2></div><div class="grid">' + f.map(function (g) { return card(g); }).join('') + '</div></section>';
    if (m.length) h += '<section><div class="sh"><h2>' + esc(T.mostPlayed) + '</h2></div><div class="grid">' + m.map(function (x) { return card(x.g, tr(T.plays, { n: x.n })); }).join('') + '</div></section>';
    out.innerHTML = h || '<p class="empty">' + esc(T.emptyMy) + '</p>';
  }
  /* ---------- Bubzi Exchange: each game's own currency -> Bubzi Coins (rates change daily, one game is HOT x2) ---------- */
  var X = {
    en: { exch: 'Bubzi Exchange', hint: 'Every game has its own currency. Swap it for Bubzi Coins here. Rates change every day and one game is HOT (x2)!', hot: 'HOT x2', none: 'Play', open: 'Close the game to exchange', tour: 'Bubzi Tour', tourTxt: 'Play {n} different games today: +{c} Bubzi Coins', tourDone: 'Done today! Come back tomorrow.' },
    fr: { exch: 'Bureau de change Bubzi', hint: 'Chaque jeu a sa propre monnaie. Échange-la ici contre des pièces Bubzi. Les taux changent chaque jour et un jeu est EN FEU (x2) !', hot: 'EN FEU x2', none: 'Jouer', open: 'Ferme le jeu pour échanger', tour: 'Tour Bubzi', tourTxt: "Joue à {n} jeux différents aujourd'hui : +{c} pièces Bubzi", tourDone: 'Fait ! Reviens demain.' },
    ar: { exch: 'صرّاف بوبزي', hint: 'لكل لعبة عملتها الخاصة. اصرفها هنا مقابل عملات بوبزي. الأسعار تتغير كل يوم ولعبة واحدة هي الأقوى (x2)!', hot: 'الأقوى x2', none: 'العب', open: 'أغلق اللعبة لتصرف', tour: 'جولة بوبزي', tourTxt: 'العب {n} ألعاب مختلفة اليوم: +{c} عملة بوبزي', tourDone: 'تم اليوم! عد غداً.' }
  }[BZ.lang] || {};
  function num(v) { return typeof v === 'number' && isFinite(v) && v >= 0 ? Math.floor(v) : 0; }
  function curBal(id) { if (id === 'pocket-grove') { var g = store.get('grove', null); return g ? num(g.gold) : 0; } return num(store.get('cur:' + id, 0)); }
  function curSet(id, v) { if (id === 'pocket-grove') { var g = store.get('grove', null); if (g) { g.gold = v; store.set('grove', g); } return; } store.set('cur:' + id, v); }
  function liveGame() { var st = $('#stage'); return st && $('iframe', st) ? st.getAttribute('data-id') : ''; }
  function exchange(id) {
    if (liveGame() === id) { toast(X.open); return; }
    var c = BubziCur.get(id), h = curBal(id), got = BubziCur.quote(id, h); if (got < 1) return;
    var used = Math.min(h, Math.ceil(got * (c.rate || 1) / BubziCur.mult(id) - 1e-6));
    curSet(id, h - used); store.set('coins', wallet() + got); toast('+' + fmt(got) + ' ' + T.coins); paintCoins(); renderRewards();
  }
  function exchangeHTML() {
    var hot = BubziCur.hot(), t = store.get('tour', null), n = BubziCur.TOUR_GAMES;
    if (!t || t.day !== BubziCur.day() || !Array.isArray(t.g)) t = { g: [], paid: false };
    var rows = BubziCur.ids.filter(function (id) { return byId[id]; }).map(function (id) {
      var c = BubziCur.get(id), h = curBal(id), q = BubziCur.quote(id, h), tr0 = BubziCur.trend(id), g = byId[id];
      return '<div class="xr' + (id === hot ? ' hot' : '') + '">' + BubziCur.svg(c, 30) + '<div class="xn"><b>' + esc(g.title) + '</b><span>' + fmt(h) + ' ' + esc(c.n[BZ.lang] || c.n.en) + '</span></div>' +
        '<div class="xq">' + (id === hot ? '<em>🔥 ' + esc(X.hot) + '</em>' : '') + '<span>' + fmt((c.rate || 1) * 10) + ' = ' + fmt(Math.floor(10 * BubziCur.mult(id) + 1e-6)) + ' ' + BubziCur.svg('bubzi', 14) +
        (tr0 ? '<i class="' + (tr0 > 0 ? 'up">▲' : 'down">▼') + '</i>' : '') + '</span></div>' +
        (q >= 1 ? '<button class="xb" type="button" data-exch="' + id + '">+' + fmt(q) + '</button>' : '<a class="xb off" href="' + esc(g.url) + '">' + esc(X.none) + '</a>') + '</div>';
    }).join('');
    var dots = '';
    for (var i = 0; i < n; i++) { var g2 = t.g[i]; dots += g2 && byId[g2] ? '<span class="td on">' + BubziCur.svg(g2, 22) + '</span>' : '<span class="td"></span>'; }
    return '<section><div class="sh"><h2>' + esc(X.tour) + '</h2></div><div class="tour"><div class="tds">' + dots + '</div><p>' + esc(t.paid ? X.tourDone : tr(X.tourTxt, { n: n, c: BubziCur.TOUR_COINS })) + '</p></div></section>' +
      '<section><div class="sh"><h2>' + esc(X.exch) + '</h2></div><p class="lead" style="margin:-6px 0 10px">' + esc(X.hint) + '</p><div class="xlist">' + rows + '</div></section>';
  }
  /* HOT badge on today's hot game card */
  (function () {
    var hot = BubziCur.hot(), g = byId[hot]; if (!g) return;
    $$('a.card').forEach(function (a) {
      var h = a.getAttribute('href') || '';
      if (h.indexOf('/' + hot + '.html') < 0 && h !== g.url) return;
      var th = $('.thumb', a); if (!th || $('.hotx', th)) return;
      var b = document.createElement('span'); b.className = 'badge hotx'; b.textContent = '🔥 x2'; th.appendChild(b);
    });
  })();
  function renderRewards() {
    var out = $('#rewOut'); if (!out) return;
    var d = dailyInfo(), cells = '', o = owned(), cur = store.get('skin', 'grape');
    for (var i = 1; i <= 7; i++) cells += '<div class="' + ((i < d.day || (!d.can && i === d.day)) ? 'done' : (d.can && i === d.day ? 'today' : '')) + '">' + esc(T.day) + ' ' + i + '<b>' + DAILY[i - 1] + '</b></div>';
    out.innerHTML = '<div class="bigcoins">' +
      BubziCur.svg('bubzi', 34) + '<span data-coins>' + fmt(wallet()) + '</span></div>' +
      exchangeHTML() +
      '<section><div class="sh"><h2>' + esc(T.daily) + '</h2></div><div class="days">' + cells + '</div>' +
      (d.can ? '<button class="play" id="claim2" type="button" style="margin-top:14px">' + esc(T.claim) + ' +' + DAILY[d.day - 1] + '</button>' : '<p class="empty">' + esc(tr(T.dailyDone, { d: (d.day % 7) + 1 })) + '</p>') + '</section>' +
      '<section><div class="sh"><h2>' + esc(T.skins) + '</h2></div><p class="lead" style="margin:-6px 0 10px">' + esc(T.skinsNote) + '</p><div class="skins">' +
      SKINS.map(function (s) { var own = o.indexOf(s[0]) >= 0; return '<button class="skin' + (s[0] === cur ? ' sel' : '') + (own ? '' : ' locked') + '" type="button" data-skin="' + s[0] + '">' + blob(s[1], s[2]) + '<span>' + (s[0] === cur ? esc(T.using) : own ? esc(T.use) : s[3]) + '</span></button>'; }).join('') + '</div></section>';
    var c2 = $('#claim2'); if (c2) c2.addEventListener('click', claim);
    $$('[data-exch]', out).forEach(function (b) { b.addEventListener('click', function () { exchange(b.getAttribute('data-exch')); }); });
    $$('.skin', out).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-skin'), s = SKINS.filter(function (x) { return x[0] === id; })[0], o2 = owned();
        if (o2.indexOf(id) >= 0) store.set('skin', id);
        else if (wallet() >= s[3]) { store.set('coins', wallet() - s[3]); o2.push(id); store.set('skins', o2); store.set('skin', id); toast(T.unlocked); }
        else { toast(T.notEnough); return; }
        paintCoins(); renderRewards();
      });
    });
  }

  /* ---------- game page ---------- */
  var stage = $('#stage');
  if (stage) {
    var gid = stage.getAttribute('data-id'), src = stage.getAttribute('data-src'), poster = $('#poster');
    var load = function () {
      if ($('iframe', stage)) return;
      var f = document.createElement('iframe');
      var own = !/^https?:/i.test(src);
      f.src = own ? src + (src.indexOf('?') >= 0 ? '&' : '?') + 'autostart&theme=' + (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light') : src;
      f.title = stage.getAttribute('data-title'); f.setAttribute('allow', 'autoplay; fullscreen; gamepad');
      f.setAttribute('allowfullscreen', '');
      f.addEventListener('load', function () { try { f.contentWindow.focus(); } catch (e) { } });
      stage.appendChild(f); if (poster) poster.remove();
    };
    if (poster) poster.addEventListener('click', load);
    if (location.hash === '#play') { load(); history.replaceState(null, '', location.pathname + location.search); }
    stage.addEventListener('pointerdown', function () { var f = $('iframe', stage); if (f) try { f.contentWindow.focus(); } catch (e) { } });
    var fav = $('#favBtn');
    if (fav) {
      var paintFav = function () { var on = favs().indexOf(gid) >= 0; fav.setAttribute('aria-pressed', on ? 'true' : 'false'); fav.setAttribute('aria-label', on ? T.removeFav : T.addFav); fav.title = fav.getAttribute('aria-label'); };
      paintFav();
      fav.addEventListener('click', function () { var f = favs(), k = f.indexOf(gid); if (k >= 0) f.splice(k, 1); else f.unshift(gid); store.set('favs', f.slice(0, 50)); paintFav(); });
    }
    var fs = $('#fsBtn');
    if (fs) fs.addEventListener('click', function () {
      load();
      var req = stage.requestFullscreen || stage.webkitRequestFullscreen;
      if (req) { try { var r = req.call(stage); if (r && r.catch) r.catch(function () { location.href = src; }); } catch (e) { location.href = src; } }
      else location.href = src;
    });
    var sh = $('#shareBtn');
    if (sh) sh.addEventListener('click', function () {
      var data = { title: document.title, url: location.href.split('#')[0] };
      if (navigator.share) navigator.share(data).catch(function () { });
      else if (navigator.clipboard) navigator.clipboard.writeText(data.url).then(function () { toast(T.copied); }, function () { });
    });
    var rb = $('#restartBtn'); if (rb) rb.addEventListener('click', function () { var f = $('iframe', stage); if (f) f.src = f.src; else load(); });
    var bb = $('#bestOut'); if (bb && best(gid)) bb.textContent = T.best + ': ' + fmt(best(gid));
  }
})();
