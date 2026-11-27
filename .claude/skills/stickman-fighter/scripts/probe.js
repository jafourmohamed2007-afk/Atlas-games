// Hit/miss report per seed for the DEMO run.  node probe.js <page.html> [seeds=1,2,3] [verbose]
// Every landed hit logs "hit <effector>><body part> @time"; a strike window that ends without contact logs "miss <pose>".
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const page = path.resolve(process.argv[2]), seeds = (process.argv[3] || '1,2,3,4,5,6,7,8').split(','), verbose = !!process.argv[4];
  const b = await chromium.launch();
  for (const sd of seeds) {
    const p = await b.newPage({ viewport: { width: 360, height: 360 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + page + '?capture&seed=' + sd);
    const r = await p.evaluate(() => { __lab.move('demo'); let end = -1; for (let i = 0; i < 60 * 60; i++) { __lab.advance(1 / 60); const s = __lab.state(); if (s.demo === -1 && !s.A[3] && i > 120) { end = i / 60; break; } } return { log: __lab.log.slice(), end }; });
    const hits = r.log.filter(l => l.startsWith('hit')).length, miss = r.log.filter(l => l.startsWith('miss'));
    console.log(`seed ${sd}: ${hits} hits, ${miss.length} misses ${miss.join(', ')} | demo ends ${r.end}s ${errs.length ? 'ERRORS ' + errs.join(' ; ') : ''}`);
    if (verbose) console.log('  ' + r.log.join('\n  '));
    await p.close();
  }
  await b.close();
})();
