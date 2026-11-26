const path = require('path'); const { chromium } = require('playwright'); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = process.argv[2] || require('os').tmpdir();
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const fails = [], ok = [];
  const games = ['block-bloom', 'hill-hopper', 'hop-hook', 'ink-heroes', 'jelly-drop', 'memo-match', 'number-pop', 'rooftop-rush', 'wiggle-snake', 'pocket-grove'];
  for (const id of games) {
    const ctx = await b.newContext({ viewport: { width: 420, height: 800 }, colorScheme: id === 'number-pop' ? 'dark' : 'light' }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    const url = 'file://' + path.join(process.cwd(), 'games', id + '.html') + '?test';
    await p.goto(url); await sleep(300);
    // fresh player: no goal yet
    if (await p.$('#gGoal')) fails.push(id + ': goal shown before any best');
    await p.evaluate(() => { localStorage.setItem('bubzi:best:' + window.__bubzi.game.id, '100'); localStorage.setItem('bubzi:tut:' + window.__bubzi.game.id, 'true'); });
    await p.reload(); await sleep(400);
    const g = await p.$eval('#gGoal', (e) => e.textContent).catch(() => null);
    if (id === 'pocket-grove') { if (g) fails.push('grove shows goal'); else ok.push('grove: no goal (idle game)'); await ctx.close(); continue; }
    if (!g || !/70/.test(g)) { fails.push(id + ': goal text ' + g); await ctx.close(); continue; }
    if (id === 'block-bloom' || id === 'number-pop') await p.screenshot({ path: OUT + '/goal-menu-' + id + '.png' });
    const w0 = await p.evaluate(() => window.__bubzi.K.wallet());
    await p.evaluate(() => window.__bubzi.start()); await sleep(150);
    await p.evaluate(() => window.__bubzi.K.setScore(75)); await sleep(100);
    const r = await p.evaluate(() => ({ w: window.__bubzi.K.wallet(), goal: JSON.parse(localStorage.getItem('bubzi:goal:' + window.__bubzi.game.id)) }));
    if (!r.goal.done || r.w - w0 < 40) fails.push(id + ': goal not paid ' + JSON.stringify(r));
    await p.evaluate(() => window.__bubzi.K.setScore(76)); const w2 = await p.evaluate(() => window.__bubzi.K.wallet()); if (w2 !== r.w) fails.push(id + ': goal paid twice');
    await p.evaluate(() => window.__bubzi.K.setScore(101)); await sleep(100);
    const toastTxt = await p.$eval('.toast', (e) => e.textContent).catch(() => '');
    if (!/best|record/i.test(toastTxt)) fails.push(id + ': no live best toast: ' + toastTxt);
    await p.evaluate(() => window.__bubzi.over()); await sleep(1500);
    // round 2: lower score, to-beat line
    await p.evaluate(() => window.__bubzi.start()); await sleep(100); await p.evaluate(() => window.__bubzi.K.setScore(40)); await p.evaluate(() => window.__bubzi.over()); await sleep(1800);
    const tb = await p.$eval('.tobeat', (e) => e.textContent).catch(() => null);
    if (!tb || !/6[0-2]/.test(tb)) fails.push(id + ': to-beat ' + tb); // best 101 -> 62 more
    if (id === 'block-bloom' || id === 'number-pop') await p.screenshot({ path: OUT + '/goal-over-' + id + '.png' });
    await p.evaluate(() => window.__bubzi.menu()); const g2 = await p.$eval('#gGoal', (e) => e.className + '|' + e.textContent).catch(() => null);
    if (!g2 || !/done/.test(g2)) fails.push(id + ': menu after goal ' + g2);
    if (errs.length) fails.push(id + ' errors ' + errs.join(';'));
    ok.push(id + ': goal "' + g.trim() + '" paid, live best toast, to-beat "' + tb + '"');
    await ctx.close();
  }
  // arabic
  const ctx = await b.newContext({ viewport: { width: 420, height: 800 } }); const p = await ctx.newPage();
  await p.goto('file://' + path.join(process.cwd(), 'games/jelly-drop.html') + '?test&lang=ar'); await p.evaluate(() => localStorage.setItem('bubzi:best:jelly-drop', '230')); await p.reload(); await sleep(400);
  ok.push('ar: ' + await p.$eval('#gGoal', (e) => e.textContent)); await p.screenshot({ path: OUT + '/goal-menu-ar.png' });
  console.log(ok.join('\n')); if (fails.length) { console.log('FAIL\n' + fails.join('\n')); process.exit(1); } console.log('goal: all passed'); await b.close();
})();
