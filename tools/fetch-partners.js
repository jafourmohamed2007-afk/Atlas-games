#!/usr/bin/env node
/* Fills data/partner-games.json with LICENSED games from a distribution network, then run `node tools/site.js`.
   These networks let website owners embed their catalog; you earn a share of the ads inside the games
   once your site is registered with them (sign up first, read their terms).

   node tools/fetch-partners.js --source gamemonetize --count 40
   node tools/fetch-partners.js --source gamedistribution --count 40
   Options: --all (keep violent/horror games too; by default they are skipped to stay family-friendly) */
'use strict';
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), arg = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const source = arg('source', 'gamemonetize'), count = Math.min(200, parseInt(arg('count', '40'), 10) || 40), safe = !args.includes('--all');
const OUT = path.join(__dirname, '..', 'data', 'partner-games.json');
const BLOCK = /shoot|gun|sniper|zombie|horror|blood|kill|war\b|gore|scary|weapon|fps/i;
/* the network's main category (first tag) decides; keywords only refine "Arcade"/"Hypercasual"-style ones */
const MAIN = [[/^(shooting|action|fighting|adventure|war)/i, 'action'], [/^(racing|driving|cars?)/i, 'cars'], [/^puzzle/i, 'puzzle'], [/^(educational|kids|math)/i, 'learning']];
const KW = [[/\b(racing|driving|parking|moto\w*|truck|bike|drift)\b/i, 'cars'], [/\b(educational|math|quiz|spelling)\b/i, 'learning'], [/\b(runner|running|parkour)\b/i, 'running'],
  [/\b(puzzle|merge|mahjong|logic|solitaire|sort\w*)\b/i, 'puzzle'], [/\b(shooter|fighting|ninja|sword|battle)\b/i, 'action']];
const catOf = (tags) => { const first = String(tags).split(',')[0].trim(), m = MAIN.find(([re]) => re.test(first)); if (m) return m[1]; const k = KW.find(([re]) => re.test(tags)); return k ? k[1] : 'skill'; };
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const clean = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/\s+/g, ' ').trim();

async function get(url) { const r = await fetch(url, { headers: { 'User-Agent': 'BubziCatalogFetcher/1.0' } }); if (!r.ok) throw new Error(url + ' → HTTP ' + r.status); return r.json(); }

if (args.includes('--recat')) { // re-sort the saved list into categories without downloading again
  const saved = JSON.parse(fs.readFileSync(OUT, 'utf8')).map((g) => ({ ...g, title: clean(g.title), category: catOf(g.tags) }));
  fs.writeFileSync(OUT, JSON.stringify(saved, null, 2)); console.log('re-sorted', saved.length, 'games'); process.exit(0);
}
(async () => {
  let list = [];
  if (source === 'gamemonetize') {
    const data = await get(`https://gamemonetize.com/feed.php?format=0&num=${count * 2}&page=1&type=html5&popularity=mostplayed`);
    list = (Array.isArray(data) ? data : []).map((g) => ({ title: clean(g.title), description: clean(g.description), instructions: clean(g.instructions), embed: g.url, thumb: g.thumb,
      tags: [g.category, g.tags].filter(Boolean).join(', '), source: 'GameMonetize' }));
  } else if (source === 'gamedistribution') {
    const data = await get(`https://catalog.api.gamedistribution.com/api/v2.0/rss/All/?collection=best&categories=All&tags=All&subType=all&type=all&mobile=all&rewarded=all&amount=${count * 2}&page=1&format=json`);
    list = (Array.isArray(data) ? data : []).map((g) => ({ title: clean(g.Title), description: clean(g.Description), instructions: clean(g.Instructions), embed: g.Url,
      thumb: (Array.isArray(g.Asset) ? g.Asset.find((a) => /512x512|200x200/.test(a)) || g.Asset[0] : ''), tags: [].concat(g.Category || [], g.Tag || []).join(', '), source: 'GameDistribution' }));
  } else throw new Error('Unknown --source ' + source);
  const seen = new Set();
  const games = list.filter((g) => g.title && /^https:\/\//.test(g.embed || '') && /^https:\/\//.test(g.thumb || ''))
    .filter((g) => !safe || !BLOCK.test(g.title + ' ' + g.tags + ' ' + g.description))
    .map((g) => ({ ...g, slug: slug(g.title), category: catOf(g.tags) }))
    .filter((g) => g.slug && !seen.has(g.slug) && seen.add(g.slug)).slice(0, count);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(games, null, 2));
  console.log(`Saved ${games.length} ${source} games to data/partner-games.json. Now run: node tools/site.js`);
})().catch((e) => { console.error('Could not fetch the catalog:', e.message); process.exit(1); });
