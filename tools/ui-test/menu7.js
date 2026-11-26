// 메뉴 7개(v9.35) 시험 — node tools/ui-test/menu7.js
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다 · 데이터는 저장소의 data 폴더
//   하단 메뉴 = 발견 · 관심 · 연구 · AI · 뉴스 · 일정 · 마이 (탐색 · 항해 없음) · 탐색 페이지는 발견 › 전체보기로 · 항해에서 이사(밸류체인 → AI · AS-IS → 마이 › 포트폴리오 · 섹터동향 → 탐색) · TO-BE 없음
//   종목지도 › 실적 콜 비교: 분기(26 Q3) 대신 콜 날짜 · 콜 톤을 말로
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const IGN = /Failed to load resource|net::ERR|favicon|manifest|fonts\.g|CORS|아카이브|fetching the script|discoverMotionView is not defined/;
async function open(b, role, vw, vh) {
  const ctx = await b.newContext({ viewport: { width: vw || 390, height: vh || 844 }, deviceScaleFactor: 1, colorScheme: 'dark' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { if (!IGN.test(e.message)) errs.push(e.message); }); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.waitForFunction(() => _state.archive && _state.archive.length > 100, null, { timeout: 30000 }).catch(() => {});
  await p.evaluate(role => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', role); document.body.setAttribute('data-broker', 'linked'); }, role);
  await p.waitForTimeout(1200);
  return { p, errs };
}
const shown = (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; }, sel);
const txts = (p, sel) => p.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => getComputedStyle(e).display !== 'none').map(e => e.textContent.trim().replace(/\s+/g, ' ')), sel);
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let { p, errs } = await open(b, 'admin');
  // 1. 하단 메뉴
  const bar = await p.evaluate(() => [...document.querySelectorAll('#mobileTabBar > .mtab-btn:not(.mtab-wide)')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.getAttribute('aria-label')));
  ok('하단 메뉴 7개: 발견 · 관심 · 연구 · AI · 뉴스 · 일정 · 마이(탐색 · 항해 없음)', bar.join(' ') === '발견 관심 연구 AI 뉴스 일정 마이', bar.join(' '));
  ok('좁은 화면에서도 관심 · 일정이 ☰로 숨지 않고 7개가 다 보임', await p.evaluate(() => [...document.querySelectorAll('#mobileTabBar > .mtab-btn[data-narrow-hide]')].length === 0));
  // 2. 발견 › 전체보기 → 탐색 페이지(V시그널 칸)
  await p.evaluate(() => switchMobileTab('discover')); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelector('#buyPointsCard .st-more').click()); await p.waitForTimeout(1800);
  const ex = await p.evaluate(() => ({ mtab: document.body.dataset.mtab, xtab: document.body.dataset.xtab, subs: [...document.querySelectorAll('#exploreSubtabs .xtab-btn')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.textContent.trim()), act: (document.querySelector('#exploreSubtabs .xtab-btn.active') || {}).textContent, nav: (document.querySelector('#mobileTabBar .mtab-btn.active') || {}).getAttribute && document.querySelector('#mobileTabBar .mtab-btn.active').getAttribute('aria-label'), items: document.querySelectorAll('#archiveMobileList .archive-mobile-item').length, ov: document.getElementById('aqArchFull').classList.contains('open') }));
  ok('발견 › 전체보기 → 탐색 페이지(예전 시트가 아니라 페이지) · V시그널 칸이 열림', ex.mtab === 'explore' && ex.xtab === 'signals' && ex.act === 'V시그널' && !ex.ov, JSON.stringify({ mtab: ex.mtab, xtab: ex.xtab, act: ex.act, ov: ex.ov }));
  ok('하위메뉴 5개 순서: 섹터동향 / 종목리스트 / 내부자 매수 / 밸런스 종목 / V시그널', ex.subs.join(' / ') === '섹터동향 / 종목리스트 / 내부자 매수 / 밸런스 종목 / V시그널', ex.subs.join(' / '));
  ok('탐색 페이지에서도 아래 메뉴는 발견이 켜져 있음', ex.nav === '발견', String(ex.nav));
  ok('V시그널 칸에 예전 누적 시그널 목록(줄)이 나옴', ex.items >= 5 && await shown(p, '#archiveMobileCard'), String(ex.items));
  for (const [nm, sel] of [['섹터동향', '#sectorAnalysisCard'], ['종목리스트', '#stockListCard'], ['내부자 매수', '#insiderArchiveCard'], ['밸런스 종목', '#balanceCard']]) {
    await p.evaluate(nm => [...document.querySelectorAll('#exploreSubtabs .xtab-btn')].find(b => b.textContent.trim() === nm).click(), nm); await p.waitForTimeout(1500);
    const st = await p.evaluate(() => ({ xtab: document.body.dataset.xtab, vis: [...document.querySelectorAll('section.card[data-mtab~="explore"][data-xtab]')].filter(c => getComputedStyle(c).display !== 'none').map(c => c.id) }));
    ok('탐색 › ' + nm + ': 그 칸만 보임', await shown(p, sel) && !st.vis.includes('archiveMobileCard'), JSON.stringify(st));
  }
  // 탐색 페이지에서 돌아가기 — 아래 「발견」(켜져 있는 칸)을 누르면 발견으로
  await p.click('#mobileTabBar .mtab-btn[data-mtab="discover"]'); await p.waitForTimeout(1200);
  ok('탐색 페이지에서 아래 「발견」을 누르면 발견으로 돌아옴', await p.evaluate(() => document.body.dataset.mtab === 'discover') && await shown(p, '#buyPointsCard'));
  // 3. 항해에서 이사
  await p.evaluate(() => switchMobileTab('auto')); await p.waitForTimeout(500);
  await p.evaluate(() => setAiSubtab('manager')); await p.waitForTimeout(800);
  const ai = await txts(p, '#aiSubRow .xtab-btn'); ok('AI 하위메뉴에 밸류체인(관리자)', ai.includes('밸류체인'), ai.join(' / '));
  await p.evaluate(() => [...document.querySelectorAll('#aiSubRow .xtab-btn')].find(b => b.textContent.trim() === '밸류체인').click()); await p.waitForTimeout(1500);
  ok('AI › 밸류체인: 밸류체인 카드가 보이고 아래 메뉴는 AI', await shown(p, '#vcCard') && await p.evaluate(() => document.body.dataset.atab === 'vc' && document.querySelector('#mobileTabBar .mtab-btn.active').getAttribute('aria-label') === 'AI'));
  await p.evaluate(() => switchMobileTab('board')); await p.waitForTimeout(1200);
  const my = await txts(p, '#boardSubtabs .xtab-btn'); ok('마이 하위메뉴: 실시간 현황 · 포트폴리오 · 누적 성과 사이 순서', my.slice(0, 3).join(' / ') === '실시간 현황 / 포트폴리오 / 누적 성과', my.join(' / '));
  await p.evaluate(() => [...document.querySelectorAll('#boardSubtabs .xtab-btn')].find(b => b.textContent.trim() === '포트폴리오').click()); await p.waitForTimeout(1500);
  ok('마이 › 포트폴리오: 예전 AS-IS 포트폴리오 카드가 보임(이름만 「포트폴리오」)', await shown(p, '#boardHoldingsCard') && !(await shown(p, '#boardLiveCard')));
  ok('TO-BE 포트폴리오 · 항해 하위메뉴는 없음', await p.evaluate(() => !document.getElementById('voyageTobeCard') && !document.getElementById('voyageSubtabs') && !/TO-BE|AS-IS/.test(document.querySelector('#boardSubtabs').textContent)));
  // 4. 예전 링크
  await p.evaluate(() => switchMobileTab('voyage')); await p.waitForTimeout(1200);
  ok('예전 링크: 항해 → 탐색 › 섹터동향', await p.evaluate(() => document.body.dataset.mtab === 'explore' && document.body.dataset.xtab === 'trend'));
  await p.evaluate(() => setVoyageSubtab('asis')); await p.waitForTimeout(800);
  ok('예전 링크: 항해 › AS-IS → 마이 › 포트폴리오', await p.evaluate(() => document.body.dataset.mtab === 'board' && document.body.dataset.btab === 'portfolio'));
  // 5. 종목지도 › 실적 콜 비교 — 콜 날짜 · 콜 톤을 말로
  const cc = await p.evaluate(() => { const C = { cur: 'USD', themes: ['가이던스'], q: [
      { q: 'FY2026Q3', d: '2026-02-12', tone: [-1], rev: [900], exp: [850], t: { 가이던스: ['e', '그대로'] } }, { q: 'FY2026Q4', d: '2026-05-21', tone: [0], rev: [950], exp: [900], t: { 가이던스: ['u', '올림'] } },
      { q: 'FY2027Q1', d: '2026-08-27', tone: [1], rev: [1000], exp: [960], t: { 가이던스: ['u', '올림'] } }, { q: 'FY2027Q2', d: '2026-11-26', tone: [2], rev: [1100], exp: [1020], t: { 가이던스: ['d', '내림'] } }], diff: ['가이던스', '문장'] };
    const box = document.createElement('div'); box.innerHTML = _ccHtml(C); const t = box.textContent.replace(/\s+/g, ' ');
    return { dates: [...box.querySelectorAll('.cc-gh span, .cc-xl span')].map(e => e.textContent).join(','), hasOldQ: /\d\d ?Q\d/.test(t), words: [...box.querySelectorAll('.cc-tn b')].map(e => e.textContent + '/' + e.className).join(','), nums: [...box.querySelectorAll('.cc-tn span small')].map(e => e.textContent).join(','), key: /−2 우려 · −1 신중 · 0 중립 · \+1 낙관 · \+2 아주 낙관/.test(t), diff: /26\.11\.26 콜에서 가장 달라진 말/.test(t) }; });
  ok('실적 콜 비교: 분기(26 Q3)가 아니라 콜 날짜(26.02.12 … 26.11.26)', cc.dates.includes('26.02.12') && cc.dates.includes('26.11.26') && !cc.hasOldQ && cc.diff, JSON.stringify({ dates: cc.dates, hasOldQ: cc.hasOldQ, diff: cc.diff }));
  ok('콜 톤: 숫자만이 아니라 말(신중 · 중립 · 낙관 · 아주 낙관) + 숫자 + 안내 한 줄', cc.words === '신중/dn,중립/,낙관/up,아주 낙관/up' && cc.nums === '−1,0,+1,+2' && cc.key, JSON.stringify({ words: cc.words, nums: cc.nums, key: cc.key }));
  ok('오류 없음', errs.length === 0, errs.join(' | ').slice(0, 300));
  // 일반 회원: AI(밸류체인) 없음 · 6개
  ({ p, errs } = await open(b, 'user'));
  const bar2 = await p.evaluate(() => [...document.querySelectorAll('#mobileTabBar > .mtab-btn:not(.mtab-wide)')].filter(b => getComputedStyle(b).display !== 'none').map(b => b.getAttribute('aria-label')));
  ok('일반 회원: AI 메뉴만 빠지고 나머지 6개(발견 · 관심 · 연구 · 뉴스 · 일정 · 마이)', bar2.join(' ') === '발견 관심 연구 뉴스 일정 마이', bar2.join(' '));
  await p.evaluate(() => { switchMobileTab('discover'); }); await p.waitForTimeout(2000); await p.evaluate(() => document.querySelector('#buyPointsCard .st-more').click()); await p.waitForTimeout(1500);
  ok('일반 회원도 발견 › 전체보기 → 탐색 페이지(5칸)', await p.evaluate(() => document.body.dataset.mtab === 'explore' && [...document.querySelectorAll('#exploreSubtabs .xtab-btn')].filter(b => getComputedStyle(b).display !== 'none').length === 5));
  ok('오류 없음(일반 회원)', errs.length === 0, errs.join(' | ').slice(0, 300));
  // 넓은 화면: 왼쪽 세로 메뉴도 7개
  ({ p, errs } = await open(b, 'admin', 1000, 700));
  const wide = await p.evaluate(() => ({ wide: document.documentElement.classList.contains('aq-wide'), n: [...document.querySelectorAll('#mobileTabBar > .mtab-btn:not(.mtab-wide)')].filter(b => getComputedStyle(b).display !== 'none').length }));
  ok('넓은 화면: 왼쪽 세로 메뉴도 7개', wide.wide && wide.n === 7, JSON.stringify(wide));
  console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); await b.close(); process.exit(fails ? 1 : 0);
})();
