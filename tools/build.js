#!/usr/bin/env node
/* Builds every game into ONE self-contained HTML file: games/<id>.html
   (kit CSS + kit JS + game JS inlined, SEO meta from src/games.json).
   Usage: node tools/build.js          SITE_URL=https://yourdomain.com node tools/build.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = (process.env.SITE_URL || 'https://www.example.com').replace(/\/$/, '');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeScript = (s) => s.replace(/<\/script/gi, '<\\/script');

const css = read('src/kit/kit.css');
const kit = read('src/kit/currency.js') + '\n' + read('src/kit/kit.js');
const games = JSON.parse(read('src/games.json'));
const ICON = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M32 14C50 14 59 27 59 39C59 52 47 59 32 59C17 59 5 52 5 39C5 27 14 14 32 14Z" fill="#7B4DFF"/><circle cx="23" cy="37" r="7" fill="#fff"/><circle cx="41" cy="37" r="7" fill="#fff"/><circle cx="24" cy="38" r="3.6" fill="#241B4D"/><circle cx="42" cy="38" r="3.6" fill="#241B4D"/></svg>');

fs.mkdirSync(path.join(ROOT, 'games'), { recursive: true });
let built = 0;
for (const g of games) {
  // 3D games are ES modules under src/<dir>/main.js, bundled (three.js + models) by esbuild into one script
  const BUNDLED = { 'pocket-grove': 'src/grove/main.js' };
  const src = path.join(ROOT, BUNDLED[g.id] || path.join('src/games', g.id + '.js'));
  if (!fs.existsSync(src)) { console.log('skip (no source yet):', g.id); continue; }
  const code = BUNDLED[g.id] ? require('esbuild').buildSync({ entryPoints: [src], bundle: true, format: 'iife', minify: true, write: false, target: 'es2019', loader: { '.glb': 'binary' }, legalComments: 'none' }).outputFiles[0].text : fs.readFileSync(src, 'utf8');
  const url = `${SITE}/play/${g.id}.html`;
  const title = `${g.title.en} – Play Free Online | Bubzi`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'VideoGame', name: g.title.en, alternateName: [g.title.fr, g.title.ar],
    description: g.desc.en, url, genre: g.category, gamePlatform: 'Web browser', applicationCategory: 'Game',
    operatingSystem: 'Any', inLanguage: ['en', 'fr', 'ar'], isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@type': 'Organization', name: 'Bubzi' }
  };
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(g.desc.en)}">
<meta name="keywords" content="${esc([g.keywords.en, g.keywords.fr, g.keywords.ar].join(', '))}">
<meta name="theme-color" content="#5A2EE8">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${esc(url)}">
<link rel="alternate" hreflang="en" href="${esc(url)}">
<link rel="alternate" hreflang="fr" href="${esc(SITE)}/fr/play/${g.id}.html">
<link rel="alternate" hreflang="ar" href="${esc(SITE)}/ar/play/${g.id}.html">
<link rel="alternate" hreflang="x-default" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(g.desc.en)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(SITE)}/thumbs/${g.id}-og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${ICON}">
<script type="application/ld+json">${safeScript(JSON.stringify(ld))}</script>
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<noscript><p style="padding:24px;font:700 18px sans-serif">${esc(g.title.en)}: please enable JavaScript to play. ${esc(g.desc.en)}</p></noscript>
<script>
${safeScript(kit)}
</script>
<script>
${safeScript(code)}
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'games', g.id + '.html'), html);
  built++;
  console.log('built games/' + g.id + '.html', (html.length / 1024).toFixed(1) + ' KB');
}
console.log(built + ' game(s) built.');
