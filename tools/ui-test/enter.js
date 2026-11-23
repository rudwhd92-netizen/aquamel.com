// 발견 처음 들어올 때 움직임 시험 — node tools/ui-test/enter.js   (v9.05: 금주의 발견 로고가 차례로 떠오름 · 피드 차트 선이 그어짐 + 변화율 숫자 · 움직임 줄이기면 없음)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · URL=배포주소 로 실제 사이트도 가능 · CHANNEL=msedge
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = process.env.URL || 'http://localhost:8773/index.html';
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
async function run(reduce) {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR ' + e.message); });
  p.on('console', m => { if (/logoEnter|chartEnter/.test(m.text())) console.log('CONSOLE ' + m.text()); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await p.evaluate(() => {
    window.__S = { logo: [], chart: [], t0: performance.now() };
    setInterval(() => {
      const t = Math.round(performance.now() - window.__S.t0);
      const it = [...document.querySelectorAll('#buyPointsScroll .buy-point-item:not(.bp-more)')];
      if (it.length) window.__S.logo.push({ t, n: it.length, op: it.slice(0, 9).map(e => +(+getComputedStyle(e).opacity).toFixed(2)), inl: it.slice(0, 9).map(e => e.style.opacity), tr: it[0].style.transform });
      const f = document.querySelector('#feedScroll .feed-item'); const c = f && f.querySelector('canvas'), ch = c && c._aqChart;
      if (ch) window.__S.chart.push({ t, rv: ch.$rv ? +ch.$rv.x.toFixed(2) : null, h: (f.querySelector('.aq-discover-range') || {}).textContent, cls: c.parentElement.className.includes('aq-rv') });
    }, 40);
  });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); switchMobileTab('discover'); });
  await p.waitForTimeout(350); await p.screenshot({ path: path.join(OUT, 'enter_a_' + (reduce ? 'rm' : 'mo') + '.png') });
  await p.waitForTimeout(250); await p.screenshot({ path: path.join(OUT, 'enter_b_' + (reduce ? 'rm' : 'mo') + '.png') });
  await p.waitForTimeout(4000);
  await p.evaluate(() => { const f = document.querySelector('#feedScroll .feed-item'); if (f) f.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(3500);
  // 다른 메뉴: 탐색 종목리스트 줄 · 종목 페이지 차트 — 숨은 채 남는 칸이 없고 차트 선이 그어지는지
  const SEL = ['#buyPointsScroll > .buy-point-item:not(.bp-more)', '.stock-list-row', '.archive-mobile-item', '.insider-archive-item', '.m4-strip > .m4-lg', '.gl-strip .buy-points-scroll > .buy-point-item:not(.bp-more)'];
  const items0 = await p.evaluate(() => [...document.querySelectorAll('#buyPointsScroll .buy-point-item')].filter(e => e.offsetParent && e.getBoundingClientRect().right <= innerWidth).map(e => e.style.cssText));   // 발견 탭이 보일 때 화면 안 칸
  await p.evaluate(() => { window.__M = []; setInterval(() => { const c = document.getElementById('chartCanvas'), ch = c && c._aqChart || (c && window.Chart && Chart.getChart(c)); if (ch && ch.$rv) window.__M.push(+ch.$rv.x.toFixed(2)); }, 40); switchMobileTab('explore'); });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { try { openChart('NVDA'); } catch (e) {} });
  await p.waitForTimeout(3000);
  const other = await p.evaluate(S => ({ stuck: S.map(s => [...document.querySelectorAll(s)].filter(e => { const r = e.getBoundingClientRect(); return e.offsetParent && r.bottom > 0 && r.top < innerHeight && +getComputedStyle(e).opacity < .05; }).length).reduce((a, b) => a + b, 0), rows: document.querySelectorAll('.stock-list-row').length, modal: window.__M }), SEL);
  const S = await p.evaluate(() => window.__S); S.other = other; S.items0 = items0;
  await p.screenshot({ path: path.join(OUT, 'enter_c_' + (reduce ? 'rm' : 'mo') + '.png') });
  const fin = await p.evaluate(() => ({ items: [...document.querySelectorAll('#buyPointsScroll .buy-point-item')].filter(e => e.getBoundingClientRect().right <= innerWidth).map(e => e.style.cssText), charts: [...document.querySelectorAll('#feedScroll canvas')].map(c => !!c._aqChart && !!c._aqChart.$rv), nCharts: document.querySelectorAll('#feedScroll canvas').length, nDrawn: [...document.querySelectorAll('#feedScroll canvas')].filter(c => c._aqChart).length }));
  await b.close();
  return { S, fin, errs };
}
(async () => {
  const m = await run(false);
  const L = m.S.logo, C = m.S.chart; 
  console.log('logo samples', L.length, 'chart samples', C.length, 'drawn', m.fin.nDrawn + '/' + m.fin.nCharts);
  const minOp = Math.min(...L.flatMap(x => x.op)); ok('로고가 처음엔 투명하게 시작', L.length && minOp < 0.3, 'min opacity ' + minOp + ' · first ' + JSON.stringify(L[0]));
  const mid = L.some(x => x.op.some(o => o > 0.05 && o < 0.95)); ok('로고가 중간 단계를 거침', mid);
  const stag = L.find(x => x.op[0] > 0.5 && x.op[4] < x.op[0]); ok('로고가 차례로(앞 것이 먼저)', !!stag, stag ? JSON.stringify(stag.op) : '');
  ok('로고 끝에는 화면 안 칸의 인라인 opacity · transform이 없음(옛 페이드를 막는 animation:none만 남음)', m.S.items0.every(s => !/opacity|transform/.test(s)), JSON.stringify(m.S.items0.slice(0, 3)) + ' / ' + m.S.items0.length);
  const rvs = C.filter(x => x.rv != null); ok('차트 선이 그어지는 중간 단계가 있음', rvs.some(x => x.rv > 0.05 && x.rv < 0.95), rvs.slice(0, 12).map(x => x.rv + ':' + x.h).join(' '));
  ok('변화율 숫자가 선과 같이 올라감', new Set(rvs.map(x => x.h)).size >= 2 && rvs.some(x => x.rv < 0.95 && x.h !== C.at(-1).h), [...new Set(rvs.map(x => x.h))].slice(0, 8).join(' '));
  ok('끝나면 클립 · 숨김 클래스가 없음', m.fin.charts.every(x => !x) && !C.at(-1).cls, JSON.stringify(C.at(-1)));
  ok('최종 숫자가 값으로 고정', /^[+−-]?\d/.test(String(C.at(-1).h)), C.at(-1).h);
  ok('오류 없음', m.errs.length === 0, m.errs.join(' | '));
  ok('다른 메뉴: 화면에 있는데 투명하게 남은 칸이 없음', m.S.other.stuck === 0, '종목리스트 줄 ' + m.S.other.rows + '개 · 투명 ' + m.S.other.stuck);
  ok('종목 페이지 차트 선이 그어짐', m.S.other.modal.length >= 3 && Math.max(...m.S.other.modal) > .9, m.S.other.modal.slice(0, 8).join(' '));
  const r = await run(true);
  ok('움직임 줄이기: 로고에 내 움직임(인라인 투명)이 없음', r.S.logo.every(x => x.inl.every(o => o === '')) , 'samples ' + r.S.logo.length);
  ok('움직임 줄이기: 차트 클립 없음', r.S.chart.every(x => x.rv == null) , 'samples ' + r.S.chart.length);
  ok('움직임 줄이기: 종목 페이지 차트 클립 없음 · 투명 칸 없음', r.S.other.modal.length === 0 && r.S.other.stuck === 0);
  ok('움직임 줄이기: 오류 없음', r.errs.length === 0);
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
