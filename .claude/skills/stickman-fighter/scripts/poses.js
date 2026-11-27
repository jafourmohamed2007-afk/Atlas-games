// Every key pose in POSE drawn side by side (the page's ?poses mode).  node poses.js <page.html> <out.png>
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1500, height: 1300 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.resolve(process.argv[2]) + '?poses&capture'); await p.addStyleTag({ content: '.ui,.hint{display:none}' });
  await p.evaluate(() => __lab.render()); await p.screenshot({ path: process.argv[3] }); await b.close();
})();
