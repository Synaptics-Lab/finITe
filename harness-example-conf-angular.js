// FINOS fdc3-conformance — run the "All" suite against the ANGULAR surface.
// Difference from conf-final.js: the DA host page is the Angular surface's
// conformance entry (/angular/conf.html), which loads the byte-identical
// frozen estate agent (../fdc3-agent.js?v=11) instead of bankerx-bridge.js.
// Completion detection: frozen (passes, failures, duration) across two 12s polls.
const { chromium } = require('playwright-core');
const ANGULAR =
  'https://traderx.synapticchain.xyz/angular/conf.html?launcher=1&directory=' +
  encodeURIComponent('https://terminal.synapticchain.xyz/api/fdc3/appd/v2/apps?include=conformance');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/google/chrome/chrome', headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--disable-popup-blocking'] });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  page.on('console', (m) => { const t = m.text(); if (/Cannot|error/i.test(t)) console.log('T:', t.slice(0,160)); });

  await page.goto(ANGULAR, { waitUntil: 'domcontentloaded', timeout: 45000 });
  // Prove which surface is hosting (agent global is set asynchronously after
  // the directory fetch — fs() — so only the host marker is checked here).
  const host = await page.evaluate(() => ({
    angularHost: !!window.__TRADERX_ANGULAR_DA_HOST,
    url: location.href.slice(0, 90),
  }));
  console.log('DA host proven:', JSON.stringify(host));
  if (!host.angularHost) {
    console.log('ANGULAR DA HOST NOT READY'); await browser.close(); process.exit(3);
  }
  await page.waitForFunction(() => window.SynapticFDC3Agent?.ready, null, { timeout: 30000, polling: 500 });
  console.log('agent ready on /angular/');
  await page.evaluate(() => window.SynapticFDC3Agent.open('Conformance1'));
  const runner = await ctx.waitForEvent('page', { timeout: 20000 });
  runner.on('pageerror', (e) => console.log('R-ERR:', String(e).slice(0,200)));
  await runner.waitForLoadState('domcontentloaded', { timeout: 30000 });
  await runner.waitForTimeout(4000);

  const connected = await runner.evaluate(() => ({ fdc3: typeof window.fdc3 }));
  console.log('runner connection:', JSON.stringify(connected));
  if (connected.fdc3 !== 'object') { console.log('RUNNER NOT CONNECTED'); await browser.close(); process.exit(3); }

  await runner.selectOption('#testSuite', 'All');
  await runner.click('#runButton');
  console.log('"All" run clicked — polling until mocha reports end…');

  const getStats = () => runner.evaluate(() => {
    const li = [...document.querySelectorAll('#mocha-stats li')];
    const get = (n) => { const x = li.find((y) => y.textContent.toLowerCase().includes(n)); return x ? x.textContent.replace(/\s+/g,' ').trim() : null; };
    return { passes: get('passes'), failures: get('failures'), duration: get('duration') };
  });
  const snapshot = JSON.stringify(await getStats());
  console.log('first snapshot:', snapshot);
  let prev = snapshot, prevCount = 0, done = false;
  for (let i = 0; i < 90 && !done; i++) {
    await runner.waitForTimeout(12000);
    const cur = JSON.stringify(await getStats());
    if (cur === prev) { prevCount++; if (prevCount >= 2) done = true; }
    else { prev = cur; prevCount = 0; }
    if (i % 10 === 0) console.log(`t+${(i+1)*12}s`, cur);
  }
  const stats = JSON.parse(prev);
  console.log('FINAL STATS:', JSON.stringify(stats));
  const fails = await runner.evaluate(() => [...document.querySelectorAll('#mocha .test.fail h2')].map((h) => h.textContent.trim()));
  const errs = await runner.evaluate(() => [...document.querySelectorAll('#mocha .test.fail pre')].map((e) => e.textContent.trim().slice(0, 250)));
  console.log('failing count:', fails.length);
  fails.forEach((f, i) => { console.log('  ✗', f); if (errs[i]) console.log('     ', errs[i].replace(/\n/g, ' | ')); });
  const total = await runner.evaluate(() => document.querySelectorAll('#mocha-report .test').length);
  console.log('total test elements:', total);
  await browser.close();
  process.exit(fails.length === 0 && stats.passes ? 0 : 1);
})().catch((e) => { console.error('CONF ERROR:', e.message); process.exit(2); });