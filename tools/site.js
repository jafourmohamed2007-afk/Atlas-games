#!/usr/bin/env node
/* Generates the whole Bubzi website (static, SEO-ready, EN/FR/AR with RTL).
   SITE_URL=https://yourdomain.com node tools/site.js */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const SITE = (process.env.SITE_URL || 'https://www.example.com').replace(/\/$/, '');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const games = JSON.parse(read('src/games.json'));
const I = JSON.parse(read('src/site/i18n.json'));
const partnersFile = path.join(ROOT, 'data/partner-games.json');
const partners = fs.existsSync(partnersFile) ? JSON.parse(fs.readFileSync(partnersFile, 'utf8')).filter((p) => p && p.slug && p.embed && p.title) : [];
const LANGS = ['en', 'fr', 'ar'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const tr = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o[k] !== undefined ? o[k] : m));
const lp = (lang, p) => (lang === 'en' ? '' : lang + '/') + p;
const abs = (p) => SITE + '/' + p.replace(/(^|\/)index\.html$/, '$1');
const HOT = ['pocket-grove', 'ink-heroes', 'rooftop-rush'];
const ORDER = ['pocket-grove', 'ink-heroes', 'rooftop-rush', 'block-bloom', 'jelly-drop', 'hop-hook', 'hill-hopper', 'number-pop', 'wiggle-snake', 'memo-match'];
const CATS = ['action', 'farm', 'puzzle', 'running', 'skill', 'learning', 'cars'];
const MOODS = { quick: ['wiggle-snake', 'number-pop', 'hop-hook', 'rooftop-rush', 'memo-match'], brain: ['block-bloom', 'memo-match', 'number-pop', 'jelly-drop'], chill: ['pocket-grove', 'block-bloom', 'jelly-drop', 'memo-match', 'wiggle-snake'] };
const TILE = { quick: ['#3B2A06', '#7A5200', '#FFD36B', 'clock'], brain: ['#0E3B3A', '#16665A', '#C6FF4D', 'bulb'], chill: ['#10284F', '#1F5296', '#9FD4FF', 'cloud'],
  puzzle: ['#24125E', '#4A2AB0', '#D9C9FF', 'puzzle'], running: ['#3D1A05', '#8A3B00', '#FFB35A', 'bolt'], skill: ['#3B0B19', '#8A1A36', '#FF9AB5', 'target'],
  learning: ['#0B3A2C', '#0F7056', '#7FF0D0', 'learn'], cars: ['#0B2A3F', '#145C7A', '#8BE3FF', 'car'], action: ['#3B0A12', '#8A1A2E', '#FF8A6A', 'burst'], farm: ['#123B12', '#2E7D32', '#B9F27A', 'cloud'] };
const TILE_ORDER = ['farm', 'action', 'quick', 'brain', 'chill', 'puzzle', 'running', 'skill', 'learning', 'cars'];
const inCat = (slug) => (MOODS[slug] ? MOODS[slug].map((id) => games.find((g) => g.id === id)) : games.filter((g) => g.category === slug));
const sorted = ORDER.map((id) => games.find((g) => g.id === id)).filter(Boolean);
const hash = (s) => crypto.createHash('md5').update(s).digest('hex').slice(0, 8);

// ---------- static assets ----------
fs.mkdirSync(path.join(ROOT, 'assets'), { recursive: true });
const css = read('src/site/site.css'), js = read('src/site/site.js');
fs.writeFileSync(path.join(ROOT, 'assets/site.css'), css);
fs.writeFileSync(path.join(ROOT, 'assets/site.js'), js);
const V = hash(css + js);

const ICON = {
  logo: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 12C36 4 45 4 46 9C41 9 37 11 34 14" fill="#14C8A0"/><path d="M32 14C50 14 59 27 59 39C59 52 47 59 32 59C17 59 5 52 5 39C5 27 14 14 32 14Z" fill="#7C5CFF" stroke="#5A2EE8" stroke-width="2.5"/><ellipse cx="20" cy="24" rx="7" ry="4" fill="#fff" opacity=".45" transform="rotate(-25 20 24)"/><circle cx="22.5" cy="37" r="7" fill="#fff"/><circle cx="41.5" cy="37" r="7" fill="#fff"/><circle cx="24" cy="38" r="3.7" fill="#241B4D"/><circle cx="43" cy="38" r="3.7" fill="#241B4D"/><path d="M27 46q5 5 10 0" stroke="#241B4D" stroke-width="2.8" fill="none" stroke-linecap="round"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  coin: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#FFC93C" stroke="#E07A00" stroke-width="2"/><path d="M12 7v10" stroke="#C46A00" stroke-width="2.2" stroke-linecap="round"/></svg>',
  theme: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>',
  home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/></svg>',
  my: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>',
  gift: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9c-2-4-6-4-6-1.5S12 9 12 9Zm0 0c2-4 6-4 6-1.5S12 9 12 9Z"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5Z"/></svg>',
  heart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/></svg>',
  share: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  redo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></svg>',
  fs: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  flame: '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 1-3.5S9 11 11 11c0-4 1-9 1-9Z"/></svg>'
};

// ---------- data for a page ----------
function gameData(lang, depth) {
  const up = '../'.repeat(depth);
  const own = sorted.map((g) => ({
    id: g.id, title: g.title[lang], alt: LANGS.filter((l) => l !== lang).map((l) => g.title[l]).join(' '), catName: I[lang].cat[g.category], kw: LANGS.map((l) => g.keywords[l] + ' ' + I[l].cat[g.category]).join(' '),
    c: g.color, isNew: !!g.isNew, url: up + lp(lang, 'play/' + g.id + '.html') + '#play', thumb: up + 'thumbs/' + g.id + '.webp', prev: up + 'thumbs/' + g.id + '-play.webp',
    tag: g.desc[lang].split(/(?<=[.!?。])\s/)[0]
  }));
  const ext = partners.map((p) => ({ id: 'p-' + p.slug, title: p.title, alt: '', catName: p.category || '', kw: p.tags || '', c: '#7C5CFF', isNew: false,
    url: up + lp(lang, 'g/' + p.slug + '.html') + '#play', thumb: p.thumb, prev: '', ext: 'Partner' }));
  return own.concat(ext);
}
function card(g, sub, extra) {
  const hot = HOT.includes(g.id) && !g.isNew;
  return `<a class="card" href="${esc(g.url)}" style="--c:${g.c}"${g.prev ? ` data-prev="${esc(g.prev)}"` : ''}>` +
    `<div class="thumb">${g.isNew ? '<span class="badge new">NEW</span>' : hot && extra !== 'nohot' ? `<span class="badge hot">${ICON.flame}HOT</span>` : ''}` +
    `<img src="${esc(g.thumb)}" alt="" width="256" height="256" loading="lazy" decoding="async"><div class="prev"></div>${g.ext ? `<span class="ext">${esc(g.ext)}</span>` : ''}</div>` +
    `<div class="t">${esc(g.title)}</div>${sub ? `<div class="s">${esc(sub)}</div>` : ''}</a>`;
}
function moodTiles(lang, depth) {
  const up = '../'.repeat(depth), t = I[lang];
  return TILE_ORDER.map((k) => { const c = TILE[k]; return `<a class="mood" href="${up + lp(lang, 'c/' + k + '.html')}" style="--a:${c[0]};--b:${c[1]};--t:${c[2]}"><img src="${up}thumbs/icon-${c[3]}.webp" alt="" width="84" height="84" loading="lazy"><span>${esc(t.cat[k])}</span></a>`; }).join('');
}

// ---------- page shell ----------
function page(o) {
  const { lang, file, title, desc, kw, alts, body, ld, home } = o;
  const t = I[lang], depth = file.split('/').length - 1, up = '../'.repeat(depth), gd = gameData(lang, depth);
  const homeHref = up + lp(lang, 'index.html');
  const langOpts = LANGS.map((l) => `<option value="${l}" data-href="${esc(up + alts[l])}"${l === lang ? ' selected' : ''}>${I[l].langName}</option>`).join('');
  const side = `<nav class="side" aria-label="${esc(t.categories)}">
<a href="${homeHref}"${home ? ' class="on"' : ''}>${ICON.home}${esc(t.home)}</a>
<button type="button" data-sheet="sheetMy">${ICON.my}${esc(t.myGames)}</button>
<button type="button" data-sheet="sheetRewards">${ICON.gift}${esc(t.rewards)}</button>
<hr><span class="lbl">${esc(t.categories)}</span>
${TILE_ORDER.map((k) => `<a href="${up + lp(lang, 'c/' + k + '.html')}"${o.cat === k ? ' class="on"' : ''}><img src="${up}thumbs/icon-${TILE[k][3]}.webp" alt="" width="26" height="26" loading="lazy">${esc(t.cat[k])}</a>`).join('\n')}
</nav>`;
  const sheet = (id, h, inner) => `<div class="sheet" id="${id}" role="dialog" aria-modal="true" aria-label="${esc(h)}" aria-hidden="true"><div class="scrim"></div><div class="panel"><div class="grab"></div><div class="ph"><h2>${esc(h)}</h2><button class="ibtn" type="button" data-close aria-label="${{ en: 'Close', fr: 'Fermer', ar: 'إغلاق' }[lang]}">${ICON.close}</button></div>${inner}</div></div>`;
  const BZ = { lang, base: up, t: { coins: t.coins, best: t.best, plays: t.plays, continue: t.continue, favorites: t.favorites, mostPlayed: t.mostPlayed, noResults: t.noResults, emptyMy: t.emptyMy,
    daily: t.daily, dailyReady: t.dailyReady, dailyDone: t.dailyDone, claim: t.claim, day: t.day, skins: t.skins, skinsNote: t.skinsNote, using: t.using, use: t.use, notEnough: t.notEnough,
    unlocked: t.unlocked, copied: t.copied, addFav: t.addFav, removeFav: t.removeFav }, games: gd };
  const altLinks = LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(abs(alts[l]))}">`).join('\n') + `\n<link rel="alternate" hreflang="x-default" href="${esc(abs(alts.en))}">`;
  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${kw ? `<meta name="keywords" content="${esc(kw)}">\n` : ''}<link rel="canonical" href="${esc(abs(file))}">
${altLinks}
<meta name="theme-color" content="#0B0820">
<meta property="og:type" content="website"><meta property="og:site_name" content="Bubzi">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(abs(file))}"><meta property="og:image" content="${esc(SITE + '/' + (o.og || 'thumbs/rooftop-rush-og.jpg'))}">
<meta property="og:locale" content="${{ en: 'en_US', fr: 'fr_FR', ar: 'ar_AR' }[lang]}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${up}favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="${up}thumbs/app-192.png"><link rel="manifest" href="${up}manifest.webmanifest">
<link rel="preload" href="${up}assets/fonts/${lang === 'ar' ? 'baloo-bhaijaan-2-arabic-800-normal' : 'baloo-2-latin-800-normal'}.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${up}assets/site.css?v=${V}">
<script>try{var th=JSON.parse(localStorage.getItem('bubzi:theme'));if(th==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}${home ? `try{var sl=JSON.parse(localStorage.getItem('bubzi:lang'));var al=${JSON.stringify(Object.fromEntries(LANGS.map((l) => [l, up + alts[l]])))};if(sl&&sl!=='${lang}'&&al[sl])location.replace(al[sl])}catch(e){}` : ''}</script>
<!-- AD PLACEHOLDER: paste your AdSense / AdinPlay head script here (one line, async). -->
${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body>
<a class="skip" href="#games">${esc(t.skip)}</a>
<header class="top"><div class="top-in">
<a class="logo" href="${homeHref}" aria-label="Bubzi">${ICON.logo}<b>bubzi</b></a>
<label class="searchbox">${ICON.search}<span class="sr">${esc(t.search)}</span><input id="q" type="search" placeholder="${esc(t.searchPh)}" autocomplete="off"></label>
<div class="tools">
<button class="coins" type="button" data-sheet="sheetRewards" aria-label="${esc(t.coins)}">${ICON.coin}<span data-coins>0</span></button>
<select class="langsel" id="langSel" aria-label="${esc(t.lang)}">${langOpts}</select>
<button class="ibtn" type="button" id="themeBtn" aria-label="${esc(t.theme)}" title="${esc(t.theme)}">${ICON.theme}</button>
</div></div></header>
<div class="shell">
${side}
<main id="games">
${body}
<footer>
<nav aria-label="Bubzi">${['about', 'privacy', 'terms', 'contact'].map((k) => `<a href="${up + lp(lang, k + '.html')}">${esc(t[k])}</a>`).join('')}</nav>
<nav aria-label="${esc(t.lang)}">${LANGS.map((l) => `<a href="${esc(up + alts[l])}" hreflang="${l}" lang="${l}">${I[l].langName}</a>`).join('')}</nav>
<span>${esc(t.footer)} © ${new Date().getFullYear()} Bubzi</span>
</footer>
</main>
</div>
<nav class="tabs" aria-label="${esc(t.home)}">
<a class="tab${home ? ' on' : ''}" href="${homeHref}" data-sheet="home">${ICON.home}<span>${esc(t.home)}</span></a>
<button class="tab" type="button" data-sheet="sheetSearch">${ICON.search.replace('width="20" height="20"', 'width="24" height="24"')}<span>${esc(t.search)}</span></button>
<button class="tab" type="button" data-sheet="sheetMy">${ICON.my}<span>${esc(t.myGames)}</span></button>
<button class="tab" type="button" data-sheet="sheetRewards">${ICON.gift}<span>${esc(t.rewards)}</span><i class="pip" hidden></i></button>
</nav>
${sheet('sheetSearch', t.search, `<label class="sr" for="q2">${esc(t.searchPh)}</label><input class="sinput" id="q2" type="search" placeholder="${esc(t.searchPh)}" autocomplete="off"><div id="searchOut"></div>`)}
${sheet('sheetMy', t.myGames, '<div id="myOut"></div>')}
${sheet('sheetRewards', t.rewards, '<div id="rewOut"></div>')}
<script>window.BZ=${JSON.stringify(BZ).replace(/</g, '\\u003c')};</script>
<script src="${up}assets/site.js?v=${V}" defer></script>
</body>
</html>
`;
}
const files = []; // for the sitemap
function write(file, html, alts) { const f = path.join(ROOT, file); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); if (alts) files.push({ file, alts }); }

for (const lang of LANGS) {
  const t = I[lang];
  // ---------- home ----------
  {
    const file = lp(lang, 'index.html'), depth = file.split('/').length - 1, gd = gameData(lang, depth), up = '../'.repeat(depth);
    const alts = Object.fromEntries(LANGS.map((l) => [l, lp(l, 'index.html')]));
    const own = gd.filter((g) => !g.ext), first = own[0];
    const body = `<section aria-label="${esc(t.categories)}"><div class="moods">${moodTiles(lang, depth)}</div></section>
<section class="hero" id="hero" aria-labelledby="heroTitle"><div class="bgart" style="background-image:url('${esc(first.thumb)}')"></div>
<div class="hero-in"><div class="hero-txt"><span class="chip">${esc(t.gameOfDay)}</span><h2 id="heroTitle">${esc(first.title)}</h2><p id="heroDesc">${esc(first.tag)}</p>
<a class="play" id="heroPlay" href="${esc(first.url)}">${ICON.play}${esc(t.playNow)}</a></div>
<div class="clip" role="img" aria-label="${esc(t.gameOfDay)}" style="background-image:url('${esc(first.prev)}')"></div></div></section>
<section hidden><div class="sh"><h2>${esc(t.continue)}</h2></div><div class="row" id="rowContinue"></div></section>
<section><div class="sh"><h2><span class="dot"></span>${esc(t.hot)}</h2></div><div class="grid" id="gridHot">${own.map((g) => card(g)).join('')}</div></section>
<div class="reward" id="reward" hidden><img src="${up}thumbs/icon-chest.webp" alt="" width="54" height="54"><div><b>${esc(t.daily)}</b><span id="rewardTxt"></span></div><button class="play" type="button" id="rewardClaim">${esc(t.claim)}</button></div>
<div class="ad banner" role="complementary" aria-label="Advertisement"><!-- AD PLACEHOLDER: home banner 728x90 / 320x100 -->AD PLACEHOLDER · BANNER</div>
<section><div class="sh"><h2>${esc(t.new)}</h2></div><div class="row">${own.filter((g) => g.isNew).map((g) => card(g)).join('')}</div></section>
<section hidden><div class="sh"><h2>${esc(t.mostPlayed)}</h2></div><div class="row" id="rowMost"></div></section>
<section><div class="sh"><h2>${esc(t.categories)}</h2></div><div class="cats">${TILE_ORDER.map((k) => `<a class="cat" href="${up + lp(lang, 'c/' + k + '.html')}"><img src="${up}thumbs/icon-${TILE[k][3]}.webp" alt="" width="40" height="40" loading="lazy"><span>${esc(t.cat[k])}<small>${inCat(k).length + (MOODS[k] ? 0 : partners.filter((p) => p.category === k).length)}</small></span></a>`).join('')}</div></section>
${partners.length ? `<section><div class="sh"><h2>${esc(t.moreGames)}</h2></div><p class="lead" style="margin:-6px 0 12px">${esc(t.partnerNote)}</p><div class="grid">${gd.filter((g) => g.ext).map((g) => card(g)).join('')}</div></section>` : ''}
<section class="about"><h1 style="margin:0 0 6px;font-family:var(--display);font-size:24px">${esc(t.seoH)}</h1><p>${esc(t.seoP)}</p></section>`;
    const ld = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Bubzi', url: abs(file), inLanguage: lang },
      { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: own.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(lp(lang, 'play/' + g.id + '.html')), name: g.title })) }];
    write(file, page({ lang, file, title: t.homeTitle, desc: t.homeDesc, kw: t.homeKw, alts, body, ld, home: true }), alts);
  }
  // ---------- game pages ----------
  for (const g of sorted) {
    const file = lp(lang, 'play/' + g.id + '.html'), depth = 2 - (lang === 'en' ? 1 : 0), up = '../'.repeat(depth), gd = gameData(lang, depth);
    const alts = Object.fromEntries(LANGS.map((l) => [l, lp(l, 'play/' + g.id + '.html')]));
    const name = g.title[lang], catHref = up + lp(lang, 'c/' + g.category + '.html');
    const others = gd.filter((x) => x.id !== g.id && !x.ext), related = others.filter((x) => games.find((y) => y.id === x.id).category === g.category).concat(others.filter((x) => games.find((y) => y.id === x.id).category !== g.category)).slice(0, 5);
    const faq = [1, 2, 3].map((n) => [tr(t['faq' + n + 'q'], { g: name }), tr(t['faq' + n + 'a'], { g: name })]);
    const body = `<nav class="crumbs" aria-label="breadcrumb"><a href="${up + lp(lang, 'index.html')}">${esc(t.home)}</a><span aria-hidden="true">›</span><a href="${catHref}">${esc(t.cat[g.category])}</a></nav>
<div class="theater"><div class="stagecol">
<div class="stage" id="stage" data-id="${g.id}" data-title="${esc(name)}" data-src="${up}games/${g.id}.html?lang=${lang}&amp;embed">
<button class="poster" id="poster" type="button" aria-label="${esc(t.play + ' ' + name)}"><span class="pbg" style="background-image:url('${up}thumbs/${g.id}.webp')"></span><img src="${up}thumbs/${g.id}.webp" alt="${esc(name)}" width="240" height="240" fetchpriority="high"><span class="play">${ICON.play}${esc(t.play)}</span></button>
</div>
<div class="gbar"><img src="${up}thumbs/${g.id}.webp" alt="" width="54" height="54"><div class="meta"><h1>${esc(name)}</h1><a href="${catHref}">${esc(t.cat[g.category])}</a> <span id="bestOut" class="s"></span></div>
<div class="acts"><button class="ibtn" type="button" id="favBtn" aria-pressed="false" aria-label="${esc(t.addFav)}">${ICON.heart}</button><button class="ibtn" type="button" id="shareBtn" aria-label="${esc(t.share)}" title="${esc(t.share)}">${ICON.share}</button><button class="ibtn" type="button" id="restartBtn" aria-label="${esc(t.restart)}" title="${esc(t.restart)}">${ICON.redo}</button><button class="ibtn" type="button" id="fsBtn" aria-label="${esc(t.fullscreen)}" title="${esc(t.fullscreen)}">${ICON.fs}</button></div></div>
<div class="ad banner" role="complementary" aria-label="Advertisement"><!-- AD PLACEHOLDER: below-game banner -->AD PLACEHOLDER · BANNER</div>
<section class="box"><h2>${esc(t.howTo)}</h2><p>${esc(g.howto[lang])}</p></section>
<section class="box"><h2>${esc(tr(t.aboutGame, { g: name }))}</h2><p>${esc(g.desc[lang])}</p><h3 class="sr">${esc(t.faqTitle)}</h3>${faq.map((f) => `<details><summary>${esc(f[0])}</summary><p>${esc(f[1])}</p></details>`).join('')}</section>
</div>
<aside class="sidecol"><div class="ad mrec" role="complementary" aria-label="Advertisement"><!-- AD PLACEHOLDER: sidebar 300x250 -->AD PLACEHOLDER · 300×250</div>
<section class="box"><h2>${esc(t.related)}</h2><div class="mini">${related.map((x) => `<a href="${esc(x.url)}"><img src="${esc(x.thumb)}" alt="" width="64" height="64" loading="lazy"><span>${esc(x.title)}<small>${esc(x.catName)}</small></span></a>`).join('')}</div></section></aside>
</div>
<section><div class="sh"><h2><span class="dot"></span>${esc(t.hot)}</h2><a href="${up + lp(lang, 'index.html')}">${esc(t.seeAll)}</a></div><div class="grid" id="gridAll">${others.map((x) => card(x)).join('')}</div></section>`;
    const ld = [
      { '@context': 'https://schema.org', '@type': 'VideoGame', name, alternateName: LANGS.filter((l) => l !== lang).map((l) => g.title[l]), description: g.desc[lang], url: abs(file), image: SITE + '/thumbs/' + g.id + '-og.jpg',
        genre: t.cat[g.category], gamePlatform: ['Web browser', 'Android', 'iOS', 'PC'], applicationCategory: 'GameApplication', operatingSystem: 'Any', inLanguage: LANGS, isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@type': 'Organization', name: 'Bubzi' } },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: t.home, item: abs(lp(lang, 'index.html')) }, { '@type': 'ListItem', position: 2, name: t.cat[g.category], item: abs(lp(lang, 'c/' + g.category + '.html')) }, { '@type': 'ListItem', position: 3, name, item: abs(file) }] },
      { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) }];
    const title = `${name} – ${lang === 'fr' ? 'Joue gratuitement en ligne' : lang === 'ar' ? 'العب مجاناً أونلاين' : 'Play Free Online'} | Bubzi`;
    write(file, page({ lang, file, title, desc: g.desc[lang], kw: g.keywords[lang], alts, body, ld, og: 'thumbs/' + g.id + '-og.jpg' }), alts);
  }
  // ---------- category + mood pages ----------
  for (const k of TILE_ORDER) {
    const file = lp(lang, 'c/' + k + '.html'), depth = file.split('/').length - 1, up = '../'.repeat(depth), gd = gameData(lang, depth);
    const alts = Object.fromEntries(LANGS.map((l) => [l, lp(l, 'c/' + k + '.html')]));
    const ids = inCat(k).map((g) => g.id), list = gd.filter((g) => ids.includes(g.id)).concat(MOODS[k] ? [] : gd.filter((g) => g.ext && partners.find((p) => 'p-' + p.slug === g.id && p.category === k)));
    const body = `<nav class="crumbs" aria-label="breadcrumb"><a href="${up + lp(lang, 'index.html')}">${esc(t.home)}</a><span aria-hidden="true">›</span><span>${esc(t.cat[k])}</span></nav>
<div><h1 class="pageh">${esc(t.catTitle[k])}</h1><p class="lead">${esc(t.catDesc[k])}</p></div>
<section><div class="grid" id="gridAll">${list.map((g) => card(g)).join('')}</div></section>
<div class="ad banner" role="complementary" aria-label="Advertisement"><!-- AD PLACEHOLDER: category banner -->AD PLACEHOLDER · BANNER</div>
<section><div class="sh"><h2>${esc(t.categories)}</h2></div><div class="moods">${moodTiles(lang, depth)}</div></section>
<section class="about"><h2>${esc(t.seoH)}</h2><p>${esc(t.seoP)}</p></section>`;
    const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: t.catTitle[k], description: t.catDesc[k], url: abs(file), inLanguage: lang };
    write(file, page({ lang, file, title: `${t.catTitle[k]} – ${lang === 'fr' ? 'Jeux gratuits en ligne' : lang === 'ar' ? 'ألعاب مجانية أونلاين' : 'Free Online Games'} | Bubzi`, desc: t.catDesc[k], alts, body, ld, cat: k }), alts);
  }
  // ---------- partner game pages ----------
  for (const p of partners) {
    const file = lp(lang, 'g/' + p.slug + '.html'), depth = file.split('/').length - 1, up = '../'.repeat(depth), gd = gameData(lang, depth);
    const alts = Object.fromEntries(LANGS.map((l) => [l, lp(l, 'g/' + p.slug + '.html')]));
    const body = `<nav class="crumbs" aria-label="breadcrumb"><a href="${up + lp(lang, 'index.html')}">${esc(t.home)}</a><span aria-hidden="true">›</span><span>${esc(t.moreGames)}</span></nav>
<div class="theater"><div class="stagecol">
<div class="stage" id="stage" data-id="p-${esc(p.slug)}" data-title="${esc(p.title)}" data-src="${esc(p.embed)}">
<button class="poster" id="poster" type="button" aria-label="${esc(t.play + ' ' + p.title)}"><span class="pbg" style="background-image:url('${esc(p.thumb)}')"></span><img src="${esc(p.thumb)}" alt="${esc(p.title)}" width="240" height="240"><span class="play">${ICON.play}${esc(t.play)}</span></button>
</div>
<div class="gbar"><img src="${esc(p.thumb)}" alt="" width="54" height="54"><div class="meta"><h1>${esc(p.title)}</h1><span class="s">${esc(t.partnerNote)}</span></div>
<div class="acts"><button class="ibtn" type="button" id="favBtn" aria-pressed="false" aria-label="${esc(t.addFav)}">${ICON.heart}</button><button class="ibtn" type="button" id="shareBtn" aria-label="${esc(t.share)}">${ICON.share}</button><button class="ibtn" type="button" id="fsBtn" aria-label="${esc(t.fullscreen)}">${ICON.fs}</button></div></div>
<section class="box"><h2>${esc(t.howTo)}</h2><p>${esc(p.instructions || p.description || '')}</p></section>
</div><aside class="sidecol"><div class="ad mrec" role="complementary" aria-label="Advertisement">AD PLACEHOLDER · 300×250</div></aside></div>
<section><div class="sh"><h2>${esc(t.hot)}</h2></div><div class="grid">${gd.filter((g) => !g.ext).map((g) => card(g)).join('')}</div></section>`;
    write(file, page({ lang, file, title: `${p.title} – ${t.playNow} | Bubzi`, desc: (p.description || p.title).slice(0, 155), alts, body }), alts);
  }
  // ---------- about / privacy / terms / contact ----------
  for (const k of ['about', 'privacy', 'terms', 'contact']) {
    const file = lp(lang, k + '.html'), alts = Object.fromEntries(LANGS.map((l) => [l, lp(l, k + '.html')]));
    const body = `<div class="legal"><h1 class="pageh">${esc(t[k + 'T'])}</h1>${t[k + 'B'].map((p) => `<p>${esc(p)}</p>`).join('')}</div>`;
    write(file, page({ lang, file, title: `${t[k + 'T']} | Bubzi`, desc: t[k + 'B'][0], alts, body }), k === 'about' ? alts : null);
  }
}

// ---------- sitemap, robots, ads.txt, manifest, favicon ----------
const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
  .concat(files.map((f) => `<url><loc>${esc(abs(f.file))}</loc>${LANGS.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(abs(f.alts[l]))}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${esc(abs(f.alts.en))}"/></url>`))
  .concat(['</urlset>']).join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sm + '\n');
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /tools/\nDisallow: /tests/\nDisallow: /src/\n\nSitemap: ${SITE}/sitemap.xml\n`);
if (!fs.existsSync(path.join(ROOT, 'ads.txt'))) fs.writeFileSync(path.join(ROOT, 'ads.txt'), '# Replace with the line your ad network gives you, e.g.\n# google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n');
fs.writeFileSync(path.join(ROOT, 'manifest.webmanifest'), JSON.stringify({ name: 'Bubzi – Free Online Games', short_name: 'Bubzi', start_url: './', display: 'standalone', background_color: '#0B0820', theme_color: '#0B0820',
  icons: [{ src: 'thumbs/app-192.png', sizes: '192x192', type: 'image/png' }, { src: 'thumbs/app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }] }, null, 2));
fs.writeFileSync(path.join(ROOT, 'favicon.svg'), ICON.logo.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));
console.log('site built:', files.length + 12, 'pages,', partners.length, 'partner games, SITE_URL =', SITE);
