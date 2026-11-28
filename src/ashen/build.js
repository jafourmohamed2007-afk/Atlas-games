/* Builds games/ashen-vigil.html: ONE self-contained file (all JS modules inlined, narrator clips as base64 data URIs).
   Called by tools/build.js for games with "standalone": "ashen" in src/games.json; also runnable alone: node src/ashen/build.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = __dirname, ROOT = path.join(DIR, '..', '..');
const LINES = ['start', 'level', 'swarm', 'evil', 'evolve', 'lowhp', 'reaper', 'win', 'dead', 'merchant', 'endless', 'boss'];

module.exports = function build(g, h) {
  const esc = h.esc, SITE = h.SITE;
  const voice = {};
  for (const k of LINES) { const f = path.join(DIR, 'vo', k + '.mp3'); if (fs.existsSync(f)) voice[k] = 'data:audio/mpeg;base64,' + fs.readFileSync(f).toString('base64'); }
  const mods = fs.readdirSync(DIR).filter((f) => /^\d\d-.*\.js$/.test(f)).sort().map((f) => '/* ---- ' + f + ' ---- */\n' + fs.readFileSync(path.join(DIR, f), 'utf8'));
  let code = "(function () {\n'use strict';\n" + mods.join('\n') + '\n})();\n';
  code = code.replace('/*__VOICE_DATA__*/{}', JSON.stringify(voice));
  const url = `${SITE}/play/${g.id}.html`, title = `${g.title.en} – Play Free Online | Bubzi`;
  const ld = { '@context': 'https://schema.org', '@type': 'VideoGame', name: g.title.en, alternateName: [g.title.fr, g.title.ar], description: g.desc.en, url, genre: g.category,
    gamePlatform: 'Web browser', applicationCategory: 'Game', operatingSystem: 'Any', inLanguage: ['en'], isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@type': 'Organization', name: 'Bubzi' } };
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(g.desc.en)}">
<meta name="keywords" content="${esc([g.keywords.en, g.keywords.fr, g.keywords.ar].join(', '))}">
<meta name="theme-color" content="#0b0a12">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(g.desc.en)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(SITE)}/thumbs/${g.id}-og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${h.ICON}">
<script type="application/ld+json">${h.safeScript(JSON.stringify(ld))}</script>
<style>
html,body{margin:0;padding:0;width:100vw;height:100vh;overflow:hidden;background:#0b0a12;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
canvas{display:block;width:100vw;height:100vh;image-rendering:pixelated;image-rendering:crisp-edges;outline:none}
</style>
</head>
<body>
<canvas id="game" tabindex="0"></canvas>
<noscript><p style="color:#d8d0d6;padding:24px;font:700 18px monospace">${esc(g.title.en)}: please enable JavaScript to play.</p></noscript>
<script>
${h.safeScript(code)}
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(ROOT, 'games', g.id + '.html'), html);
  return html.length;
};

if (require.main === module) {
  const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/games.json'), 'utf8'));
  const g = games.find((x) => x.standalone === 'ashen');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const n = module.exports(g, { SITE: (process.env.SITE_URL || 'https://www.example.com').replace(/\/$/, ''), esc, safeScript: (s) => s.replace(/<\/script/gi, '<\\/script'), ICON: '/favicon.svg' });
  console.log('built games/' + g.id + '.html', (n / 1024).toFixed(1) + ' KB');
}
