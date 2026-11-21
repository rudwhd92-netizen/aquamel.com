// 사용: node perf.js <URL> <CPU배속> [프로파일 출력파일]
const { chromium } = require('playwright'); const fs = require('fs');
const URL = process.argv[2], CPU = +process.argv[3] || 1, PROF = process.argv[4];
(async () => {
  const b = await chromium.launch({ channel: 'msedge' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await p.addInitScript(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({ entryTypes: ['longtask'] }); } catch (e) {} });
  await cdp.send('Profiler.start');
  const t0 = Date.now();
  await p.goto(URL, { waitUntil: 'commit', timeout: 60000 });
  // 시작 화면이 사라질 때까지 (데이터 로딩 · 처리 끝)
  const gone = await p.waitForFunction(() => { const e = document.getElementById('splashOverlay'); return e && (e.classList.contains('fade-out') || e.style.display === 'none') ? performance.now() : false; }, null, { timeout: 120000, polling: 100 }).then(h => h.jsonValue()).catch(() => null);
  const nav = await p.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), lt: window.__lt }; });
  const prof = (await cdp.send('Profiler.stop')).profile;
  const lt = nav.lt.filter(x => x[0] < (gone || 1e9)); const tbt = lt.reduce((s, x) => s + Math.max(0, x[1] - 50), 0), ltSum = lt.reduce((s, x) => s + x[1], 0);
  console.log(JSON.stringify({ cpu: CPU, dcl: nav.dcl, load: nav.load, splashGone: gone ? Math.round(gone) : null, longTasks: lt.length, longTaskTotal: ltSum, TBT: Math.round(tbt), biggest: lt.map(x => x[1]).sort((a, c) => c - a).slice(0, 5) }));
  // 함수별 자기 시간(self time)
  const byId = new Map(prof.nodes.map(n => [n.id, n])); const self = new Map();
  prof.samples.forEach((id, i) => { const dt = (prof.timeDeltas[i] || 0) / 1000; const n = byId.get(id); const f = n.callFrame; const key = (f.functionName || '(익명)') + ' @' + String(f.url || '').split('/').pop() + ':' + f.lineNumber; self.set(key, (self.get(key) || 0) + dt); });
  const top = [...self.entries()].sort((a, c) => c[1] - a[1]).slice(0, 14).map(([k, v]) => v.toFixed(0).padStart(6) + 'ms  ' + k);
  console.log(top.join('\n'));
  if (PROF) fs.writeFileSync(PROF, JSON.stringify(prof));
  await b.close();
})();
