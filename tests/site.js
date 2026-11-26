#!/usr/bin/env node
/* Website tests: every page loads without errors, SEO tags exist, all internal links and images resolve,
   no sideways scrolling on phones, RTL for Arabic, and the main features work. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const BASE = 'http://127.0.0.1:' + server.address().port + '/';
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const pages = [...sm.matchAll(/<loc>https?:\/\/[^/]+\/([^<]*)<\/loc>/g)].map((m) => m[1] || 'index.html').map((p) => (p.endsWith('/') || p === '' ? p + 'index.html' : p));
  ['privacy.html', 'terms.html', 'contact.html', 'fr/privacy.html', 'ar/terms.html'].forEach((p) => pages.push(p));
  const b = await chromium.launch();
  const fails = []; const checked = new Set();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  for (const pg of pages) {
    const page = await ctx.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE)) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
    await page.goto(BASE + pg, { waitUntil: 'load' }); await sleep(150);
    const info = await page.evaluate(() => ({
      title: document.title, desc: (document.querySelector('meta[name=description]') || {}).content, canon: !!document.querySelector('link[rel=canonical]'),
      hreflang: document.querySelectorAll('link[rel=alternate][hreflang]').length, h1: document.querySelectorAll('h1').length, dir: document.documentElement.dir, lang: document.documentElement.lang,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      links: [...document.querySelectorAll('a[href]')].map((a) => a.href).filter((h) => h.startsWith(location.origin)),
      imgs: [...document.querySelectorAll('img[src]')].map((i) => i.src).filter((h) => h.startsWith(location.origin))
    }));
    const f = (m) => fails.push(pg + ': ' + m);
    if (!info.title || info.title.length < 10) f('missing title');
    if (!info.desc || info.desc.length < 40) f('short description');
    if (!info.canon) f('no canonical'); if (info.hreflang < 4) f('missing hreflang');
    if (info.h1 !== 1) f('expected exactly one h1, found ' + info.h1);
    if (pg.startsWith('ar/') && info.dir !== 'rtl') f('Arabic page not RTL');
    if (info.overflow > 1) f('horizontal overflow ' + info.overflow + 'px on phone');
    errs.forEach((e) => f(e));
    for (const u of info.links.concat(info.imgs)) {
      const clean = u.split('#')[0].split('?')[0]; if (checked.has(clean)) continue; checked.add(clean);
      const p = decodeURIComponent(new URL(clean).pathname); const file = path.join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
      if (!fs.existsSync(file)) f('broken link ' + p);
    }
    await page.close();
  }
  console.log('checked ' + pages.length + ' pages, ' + checked.size + ' unique links/images');

  // ---------- features ----------
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const F = (m) => fails.push('feature: ' + m);
  await p.goto(BASE + 'index.html'); await sleep(300);
  // search
  await p.tap('.tab[data-sheet="sheetSearch"]'); await p.fill('#q2', 'snake'); await sleep(100);
  let n = await p.$$eval('#searchOut .card', (c) => c.length); if (n !== 1) F('search "snake" gave ' + n + ' results');
  await p.fill('#q2', 'voiture'); await sleep(100); n = await p.$$eval('#searchOut .card', (c) => c.length); if (n < 1) F('French keyword search failed');
  await p.fill('#q2', 'zzzz'); await sleep(100); if (!(await p.$('#searchOut .empty'))) F('no empty state for search');
  await p.keyboard.press('Escape');
  // rewards + skins
  await p.tap('.tab[data-sheet="sheetRewards"]'); await sleep(200);
  await p.tap('#claim2'); await sleep(100);
  let coins = await p.evaluate(() => JSON.parse(localStorage.getItem('bubzi:coins')));
  if (coins !== 20) F('daily claim gave ' + coins);
  if (await p.$('#claim2')) F('can claim twice');
  await p.evaluate(() => localStorage.setItem('bubzi:coins', '500'));
  await p.tap('.skin[data-skin="mint"]'); await sleep(100);
  if ((await p.evaluate(() => localStorage.getItem('bubzi:skin'))) !== '"mint"') F('skin purchase failed');
  await p.tap('.sheet.open [data-close]');
  // theme
  await p.tap('#themeBtn'); if ((await p.getAttribute('html', 'data-theme')) !== 'light') F('theme toggle');
  await p.reload(); await sleep(200); if ((await p.getAttribute('html', 'data-theme')) !== 'light') F('theme not remembered');
  await p.tap('#themeBtn');
  // card → game page → game auto-starts (one tap)
  const t0 = Date.now();
  await p.tap('#gridHot .card >> nth=0');
  await p.waitForSelector('#stage iframe', { timeout: 5000 });
  const fr = p.frames().find((x) => x.url().includes('/games/'));
  await fr.waitForFunction(() => window.__bubzi && window.__bubzi.state() === 'playing', null, { timeout: 5000 });
  const ms = Date.now() - t0; if (ms > 3000) F('card to playing took ' + ms + 'ms'); console.log('one tap from home card to playing: ' + ms + 'ms');
  if (!(await fr.evaluate(() => document.getElementById('banner').classList.contains('off')))) F('in-game banner should be hidden on our site');
  // favorite
  await p.tap('#favBtn'); if ((await p.getAttribute('#favBtn', 'aria-pressed')) !== 'true') F('favorite toggle');
  // continue playing on home
  await p.goto(BASE + 'index.html'); await sleep(300);
  if (await p.$eval('#rowContinue', (e) => e.closest('section').hidden)) F('continue playing row not shown after playing');
  // My games shows favorite
  await p.tap('.tab[data-sheet="sheetMy"]'); await sleep(150);
  if ((await p.$$('#myOut .card')).length < 2) F('My games sheet missing items');
  await p.keyboard.press('Escape');
  // poster click on a direct visit
  await p.goto(BASE + 'fr/play/memo-match.html'); await sleep(200);
  if (await p.$('#stage iframe')) F('game should wait for tap on direct visit');
  await p.tap('#poster'); await p.waitForSelector('#stage iframe');
  // language switch keeps you on the same game
  await p.selectOption('#langSel', 'ar'); await p.waitForURL(/\/ar\/play\/memo-match\.html/);
  // stored language redirects home
  await p.goto(BASE + 'index.html'); await p.waitForURL(/\/ar\/index\.html/, { timeout: 3000 }).catch(() => F('stored language did not redirect home'));
  errs.forEach((e) => F('pageerror ' + e));
  await b.close(); server.close();
  if (fails.length) { console.log('FAILED (' + fails.length + '):'); fails.slice(0, 40).forEach((x) => console.log(' - ' + x)); process.exit(1); }
  console.log('ALL SITE TESTS PASSED');
})();
