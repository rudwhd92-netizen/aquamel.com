// MACRO 「차트 크게」 시험 — node tools/ui-test/macrochart.js   (v9.48 · 로그인 없이 공개 자료만)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  for (const [name, width, height] of [['폰', 390, 844], ['넓은 화면', 1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => { if (!/discoverMotionView/.test(e.message)) errs.push(e.message); });
    await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
    await p.addStyleTag({ content: '.aq-auth{display:none!important} #splashOverlay{display:none!important}' });
    await p.waitForFunction(() => _state.archive && _state.archive.length > 100 && (window._aqMarqueeItems || []).length, null, { timeout: 90000 });
    await p.waitForTimeout(3000);
    const wait = ms => p.waitForTimeout(ms);
    const state = () => p.evaluate(() => { const c = document.getElementById('chartCanvas'), r = c.getBoundingClientRect(), ch = Chart.getChart(c), t = document.getElementById('modalViewTabs'); return { active: document.getElementById('chartModal').classList.contains('active'), h: Math.round(r.height), pts: ch ? ch.data.labels.length : 0, tabs: t.getClientRects().length > 0 }; });
    const big = async tk => { await p.evaluate(tk => openMacroChart(tk), tk); await wait(1500); return state(); };
    const close = async () => { await p.evaluate(() => closeModal()); await wait(700); };
    const good = s => s.active && s.h > 150 && s.pts > 20;

    /* 머리글 띠의 지표 전부 (표본이 아주 적은 2년 국채는 뺌) */
    const items = await p.evaluate(() => window._aqMarqueeItems.map(x => x.ticker));
    const bad = [];
    for (const tk of items.filter(t => t !== '미국국채(2Y)')) { const s = await big(tk); if (!good(s) || s.tabs) bad.push(tk + ' ' + JSON.stringify(s)); await close(); }
    ok(name + ': 띠의 지표가 모두 큰 차트로 열림 · 종목 탭 줄 없음', !bad.length, bad.join(' / ') || items.length + '개');

    /* 종목의 탭을 본 뒤에도 */
    for (const [view, label] of [['report', 'AI 보고서'], ['map', '종목 정보'], ['position', '내 주식']]) {
      await p.evaluate(() => openChart('NVDA')); await wait(2500);
      await p.evaluate(v => aqSetModalView(v), view); await wait(1500); await close();
      const s = await big('VIX'); ok(name + ': ' + label + ' 탭을 본 뒤에도 차트', good(s), JSON.stringify(s));
      if (view === 'report') await p.screenshot({ path: path.join(OUT, 'macrochart_' + width + '.png') });
      await close();
    }
    await p.evaluate(() => openChart('NVDA')); await wait(2500);
    const st = await state(); ok(name + ': 매크로 뒤에 연 종목은 탭 줄 · 차트 그대로', good(st) && st.tabs, JSON.stringify(st)); await close();

    /* 기간 */
    await big('VIX'); const n3 = (await state()).pts;
    await p.evaluate(() => setChartTimeframe('modal', '1Y')); await wait(1500); const y = await p.evaluate(() => { const ch = Chart.getChart(document.getElementById('chartCanvas')); return ch && [ch.data.labels.length, String(ch.data.labels[0]), String(ch.data.labels[ch.data.labels.length - 1])]; });
    ok(name + ': 1Y로 바꾸면 1년 치', !!y && (Date.parse(y[2]) - Date.parse(y[1])) > 330 * 864e5, '3M ' + n3 + '점 · 1Y ' + JSON.stringify(y));
    ok(name + ': 페이지 오류 0건', errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); process.exit(fails ? 1 : 0);
})();
