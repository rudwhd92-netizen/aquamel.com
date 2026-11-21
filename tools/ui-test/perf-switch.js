// 사용: node perf2.js <URL> <CPU배속>   — 시작 뒤 화면 전환 시간 + 누가 무거운 함수를 부르는지(호출자)
const { chromium } = require('playwright');
const URL = process.argv[2], CPU = +process.argv[3] || 1;
function analyze(prof, names, depth = 3) {
  const byId = new Map(prof.nodes.map(n => [n.id, n])); const parent = new Map(); prof.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
  const selfBy = new Map(); prof.samples.forEach((id, i) => selfBy.set(id, (selfBy.get(id) || 0) + (prof.timeDeltas[i] || 0) / 1000));
  const out = {};
  names.forEach(nm => {
    const m = new Map();
    prof.nodes.forEach(n => { if (n.callFrame.functionName !== nm) return; const t = selfBy.get(n.id) || 0; if (!t) return; const chain = []; let id = parent.get(n.id); while (id && chain.length < depth) { const f = byId.get(id).callFrame; chain.push((f.functionName || '(익명)') + ':' + f.lineNumber); id = parent.get(id); } const k = chain.join(' ← '); m.set(k, (m.get(k) || 0) + t); });
    out[nm] = [...m.entries()].sort((a, c) => c[1] - a[1]).slice(0, 4).map(([k, v]) => v.toFixed(0) + 'ms  ' + k);
  });
  return out;
}
function top(prof, n = 12) {
  const byId = new Map(prof.nodes.map(x => [x.id, x])); const self = new Map();
  prof.samples.forEach((id, i) => { const f = byId.get(id).callFrame; const key = (f.functionName || '(익명)') + ':' + f.lineNumber; self.set(key, (self.get(key) || 0) + (prof.timeDeltas[i] || 0) / 1000); });
  return [...self.entries()].sort((a, c) => c[1] - a[1]).slice(0, n).map(([k, v]) => v.toFixed(0).padStart(6) + 'ms  ' + k);
}
(async () => {
  const b = await chromium.launch({ channel: 'msedge' }); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU }); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await cdp.send('Profiler.start'); await p.goto(URL, { waitUntil: 'commit', timeout: 60000 });
  await p.waitForFunction(() => { const e = document.getElementById('splashOverlay'); return e && (e.classList.contains('fade-out') || e.style.display === 'none'); }, null, { timeout: 150000, polling: 200 });
  const loadProf = (await cdp.send('Profiler.stop')).profile;
  console.log('--- 시작(로딩) 중 무거운 함수의 호출자');
  const A = analyze(loadProf, ['_aqKST', 'findTickerSeries', '_aqKrSweep']); Object.entries(A).forEach(([k, v]) => { console.log(k); v.forEach(x => console.log('   ' + x)); });
  await p.waitForTimeout(3000);
  await p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); window.apiCall = async () => ({ ok: false }); });
  await cdp.send('Profiler.start');
  const seq = ['discover', 'explore', 'board', 'research', 'news', 'schedule', 'discover', 'explore'];
  const res = [];
  for (const tab of seq) {
    const r = await p.evaluate(tab => new Promise(res => { const t0 = performance.now(); try { switchMobileTab(tab); } catch (e) {} const sync = performance.now() - t0; requestAnimationFrame(() => requestAnimationFrame(() => res({ tab, sync: Math.round(sync), toPaint: Math.round(performance.now() - t0) }))); }), tab);
    res.push(r); await p.waitForTimeout(1500);
  }
  const swProf = (await cdp.send('Profiler.stop')).profile;
  console.log('--- 화면 전환 (CPU ' + CPU + '배 느리게) — sync = 함수가 끝날 때까지 · toPaint = 화면에 그려질 때까지(ms)');
  console.log(res.map(r => `${r.tab}: sync ${r.sync} · 그림 ${r.toPaint}`).join('\n'));
  console.log('--- 화면 전환 중 무거운 함수 상위');
  console.log(top(swProf).join('\n'));
  await b.close();
})();
