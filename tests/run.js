#!/usr/bin/env node
/* Automated browser tests for every built game (Playwright + Chromium).
   node tests/run.js [game-id ...]   — tests all games when no id is given */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium, devices } = require('playwright');
const ROOT = path.join(__dirname, '..');
const games = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/games.json'), 'utf8'))
  .map((g) => g.id).filter((id) => fs.existsSync(path.join(ROOT, 'games', id + '.html')))
  .filter((id) => id !== 'neon-overdrive'); // no kit: tested by tests/neon.js
const only = process.argv.slice(2);
const list = only.length ? games.filter((g) => only.includes(g)) : games;
const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'Digit1', 'Digit2', 'Digit3', 'KeyX'];
const url = (id, q) => 'file://' + path.join(ROOT, 'games', id + '.html') + (q ? '?' + q : '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function watch(page, errors) {
  page.on('crash', () => errors.push('PAGE CRASHED'));
  page.on('pageerror', (e) => errors.push('pageerror: ' + (e.stack || e.message)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
}
const st = (page) => page.evaluate(() => window.__bubzi.state());

async function fuzz(page, ms, box, opts = {}) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const s = await st(page);
    if (s === 'over') { if (opts.autoRestart) { await page.click('#bAgain'); await sleep(50); continue; } else break; }
    if (s !== 'playing') { await sleep(60); continue; }
    const r = Math.random();
    const X = () => box.x + Math.random() * box.width, Y = () => box.y + 80 + Math.random() * (box.height - 80);
    if (r < 0.35) { // drag gesture (also swipes)
      const x1 = X(), y1 = box.y + box.height * (0.55 + Math.random() * 0.45 - 0.001);
      await page.mouse.move(x1, y1); await page.mouse.down();
      const x2 = X(), y2 = Y(), steps = 3 + Math.floor(Math.random() * 6);
      for (let i = 1; i <= steps; i++) await page.mouse.move(x1 + (x2 - x1) * i / steps, y1 + (y2 - y1) * i / steps);
      if (Math.random() < 0.5) await sleep(Math.random() * 400);
      await page.mouse.up();
    } else if (r < 0.6) { // tap / hold
      const x = X(), y = Y(); await page.mouse.move(x, y); await page.mouse.down(); await sleep(Math.random() * 500); await page.mouse.up();
    } else { // key press / hold
      const k = KEYS[Math.floor(Math.random() * KEYS.length)];
      await page.keyboard.down(k); await sleep(Math.random() * 250); await page.keyboard.up(k);
    }
    await sleep(Math.random() * 60);
  }
}

async function testGame(browser, id) {
  const errors = [], notes = [];
  const fail = (m) => errors.push('ASSERT: ' + m);
  // ---------- desktop flow ----------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage(); watch(page, errors);
  await page.goto(url(id, 'test&lang=en'));
  await page.waitForSelector('#bPlay', { timeout: 5000 });
  const title = await page.title();
  if (!/Bubzi/.test(title)) fail('title missing brand: ' + title);
  const desc = await page.getAttribute('meta[name="description"]', 'content');
  if (!desc || desc.length < 50) fail('meta description too short');
  if (!(await page.$('#bannerSlot'))) fail('banner ad placeholder missing');
  const box = await page.locator('#game').boundingBox();
  const t0 = Date.now();
  await page.click('#bPlay');
  if ((await st(page)) !== 'playing') fail('Play did not start the game');
  notes.push('play→game ' + (Date.now() - t0) + 'ms');
  // keyboard start check from menu later; fuzz now
  await fuzz(page, 7000, box);
  // pause / resume
  if ((await st(page)) === 'playing') {
    await page.keyboard.press('Escape');
    if ((await st(page)) !== 'paused' || !(await page.$('#pauseScr'))) fail('Escape did not pause');
    await page.click('#bResume');
    if ((await st(page)) !== 'playing') fail('Resume failed');
  }
  // force game over
  if ((await st(page)) === 'playing') await page.evaluate(() => window.__bubzi.over());
  await page.waitForSelector('#overScr', { timeout: 5000 });
  const score = await page.evaluate(() => window.__bubzi.K.score);
  const best = await page.evaluate((id) => JSON.parse(localStorage.getItem('bubzi:best:' + id) || '0'), id);
  if (score > 0 && best < score) fail('best score not saved');
  notes.push('score ' + score);
  // rewarded continue
  if (await page.$('#bCont')) {
    await page.click('#bCont');
    await page.waitForFunction(() => window.__bubzi.state() === 'playing', null, { timeout: 4000 });
    await fuzz(page, 2500, box);
    if ((await st(page)) === 'playing') await page.evaluate(() => window.__bubzi.over());
    await page.waitForSelector('#overScr', { timeout: 5000 });
    if (await page.$('#bCont')) fail('continue offered twice in one round');
  } else notes.push('no revive offered');
  // play again → round 2, then again → interstitial
  await page.click('#bAgain');
  await page.waitForFunction(() => window.__bubzi.state() === 'playing', null, { timeout: 4000 });
  if ((await page.evaluate(() => window.__bubzi.K.score)) !== 0) fail('score not reset on restart');
  await page.evaluate(() => window.__bubzi.over());
  await page.waitForSelector('#overScr');
  await page.click('#bAgain');
  if (!(await page.$('#ad'))) fail('interstitial placeholder not shown on 2nd restart');
  await page.waitForFunction(() => window.__bubzi.state() === 'playing', null, { timeout: 4000 });
  // menu, language, daily, skins
  await page.evaluate(() => window.__bubzi.over()); await page.waitForSelector('#overScr');
  await page.click('#bMenu'); await page.waitForSelector('#bPlay');
  await page.selectOption('#selLang', 'ar');
  if ((await page.getAttribute('html', 'dir')) !== 'rtl') fail('Arabic did not switch to RTL');
  const arPlay = await page.textContent('#bPlay');
  if (!/العب/.test(arPlay)) fail('Arabic Play label missing');
  await page.selectOption('#selLang', 'fr');
  if ((await page.getAttribute('html', 'dir')) !== 'ltr') fail('French not LTR');
  const coins0 = await page.evaluate(() => JSON.parse(localStorage.getItem('bubzi:coins') || '0'));
  await page.click('#bDaily'); await page.click('#bClaim');
  const coins1 = await page.evaluate(() => JSON.parse(localStorage.getItem('bubzi:coins') || '0'));
  if (coins1 !== coins0 + 20) fail('daily bonus not credited (' + coins0 + '→' + coins1 + ')');
  await page.click('#bDaily');
  if (await page.$('#bClaim')) fail('daily bonus claimable twice');
  await page.click('#bBack');
  if (await page.$('#bSkins')) {
    await page.click('#bSkins');
    await page.evaluate(() => localStorage.setItem('bubzi:coins', '500'));
    await page.click('.skin[data-id="mint"]');
    const sk = await page.evaluate(() => localStorage.getItem('bubzi:skin'));
    if (sk !== '"mint"') fail('skin purchase failed: ' + sk);
    await page.click('#bBack2');
  } else notes.push('no skins menu');
  // sound toggle
  await page.click('#bSoundM');
  if ((await page.evaluate(() => localStorage.getItem('bubzi:mute'))) !== 'true') fail('mute not saved');
  await page.click('#bSoundM');
  // keyboard start from menu
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.keyboard.press('Space');
  if ((await st(page)) !== 'playing') fail('Space did not start from menu');
  await fuzz(page, 2500, box);
  await ctx.close();

  // ---------- mobile touch flow (Arabic) ----------
  const mctx = await browser.newContext({ ...devices['iPhone 13'] });
  const m = await mctx.newPage(); watch(m, errors);
  await m.goto(url(id, 'test&lang=ar'));
  await m.waitForSelector('#bPlay');
  await m.tap('#bPlay');
  if ((await st(m)) !== 'playing') fail('mobile tap Play failed');
  const mb = await m.locator('#game').boundingBox();
  if (mb.width < 300 || mb.height < 500) fail('mobile canvas too small ' + JSON.stringify(mb));
  const endT = Date.now() + 5000;
  while (Date.now() < endT) {
    const s = await st(m); if (s === 'over') { await m.tap('#bAgain'); continue; }
    if (s !== 'playing') { await sleep(50); continue; }
    await m.touchscreen.tap(mb.x + Math.random() * mb.width, mb.y + 80 + Math.random() * (mb.height - 80));
    await sleep(30 + Math.random() * 120);
  }
  // touch drag via dispatched pointer events
  for (let i = 0; i < 12; i++) {
    if ((await st(m)) !== 'playing') break;
    await m.evaluate(([w, h]) => {
      const c = document.getElementById('game'), r = c.getBoundingClientRect();
      const ev = (t, x, y) => c.dispatchEvent(new PointerEvent(t, { pointerId: 7, pointerType: 'touch', clientX: r.left + x, clientY: r.top + y, bubbles: true, isPrimary: true }));
      const x1 = Math.random() * w, y1 = h * 0.85, x2 = Math.random() * w, y2 = 120 + Math.random() * h * 0.6;
      ev('pointerdown', x1, y1); for (let k = 1; k <= 6; k++) ev('pointermove', x1 + (x2 - x1) * k / 6, y1 + (y2 - y1) * k / 6); ev('pointerup', x2, y2);
    }, [mb.width, mb.height]);
    await sleep(80);
  }
  await mctx.close();

  // ---------- long stress at 8x speed with auto-restart ----------
  const sctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  const s = await sctx.newPage(); watch(s, errors);
  await s.goto(url(id, 'test&speed=8'));
  await s.waitForSelector('#bPlay'); await s.click('#bPlay');
  const sb = await s.locator('#game').boundingBox();
  await fuzz(s, 12000, sb, { autoRestart: true });
  const rounds = await s.evaluate(() => window.__bubzi.K.round);
  notes.push('stress rounds ' + rounds);
  // resize while playing (orientation change)
  await s.setViewportSize({ width: 420, height: 900 }); await sleep(200);
  await s.setViewportSize({ width: 900, height: 420 }); await sleep(200);
  await fuzz(s, 1500, await s.locator('#game').boundingBox(), { autoRestart: true });
  await sctx.close();
  return { id, errors, notes };
}

(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const id of list) {
    let r;
    try { r = await testGame(browser, id); } catch (e) { r = { id, errors: ['CRASH: ' + (e.stack || e.message)], notes: [] }; }
    const uniq = [...new Set(r.errors)];
    console.log((uniq.length ? 'FAIL ' : 'PASS ') + id + '  (' + r.notes.join(', ') + ')');
    uniq.slice(0, 12).forEach((e) => console.log('   - ' + e.split('\n').slice(0, 4).join('\n     ')));
    if (uniq.length) bad++;
  }
  await browser.close();
  console.log(bad ? bad + ' game(s) FAILED' : 'ALL GAMES PASSED');
  process.exit(bad ? 1 : 0);
})();
