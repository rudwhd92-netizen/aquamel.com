// 가로 모드로 처음 켤 때 일정 · 항해 시험 — node tools/ui-test/widestart.js   (v8.94: 가로 폭 1024를 넘는 화면으로 처음 켜도 일정은 탭 하나만 · 항해는 섹터동향이 보임)
//   서버 없이 file:// 로 열린다(URL=로 바꿀 수 있음) · CHANNEL=msedge · 폭 1000 · 1100 · 1280(높이 700~800)에서 각각 새로 켠다
const { chromium } = require('playwright');
const path = require('path');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'file:///' + path.resolve(__dirname, '../../index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  for (const [w, h] of [[1000, 700], [1100, 720], [1280, 800]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
    await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000);
    await p.evaluate(() => document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'));
    const vis = () => p.evaluate(() => [...document.querySelectorAll('section.card')].filter(c => c.offsetParent && c.getBoundingClientRect().height > 20 && /^(schedule|voyage)/.test(c.dataset.mtab || '')).map(c => c.id));
    const click = t => p.evaluate(t => document.querySelector('#mobileTabBar .mtab-btn[data-mtab="' + t + '"]').click(), t);
    await click('schedule'); await p.waitForTimeout(900); const s = await vis();
    ok(w + '×' + h + ' 처음부터 켬: 일정 = 통합캘린더만(실적시즌 카드와 합쳐지지 않음)', s.includes('scheduleCard') && !s.includes('earnSeasonCard'), s.join(','));
    await p.click('#scheduleSubtabs .xtab-btn[data-ctab="earn"]'); await p.waitForTimeout(500); const e = await vis();
    ok(w + '×' + h + ': 실적시즌 탭 = 실적시즌만', e.includes('earnSeasonCard') && !e.includes('scheduleCard'), e.join(','));
    await click('voyage'); await p.waitForTimeout(900); const v = await vis();
    ok(w + '×' + h + ': 항해 = 빈 화면 아님(섹터동향 카드가 보임)', v.includes('sectorAnalysisCard'), v.join(','));
    await p.context().close();
  }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
