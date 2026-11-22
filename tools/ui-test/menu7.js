// 좁은 화면 하단 메뉴 7개 + ☰ 시험 — node tools/ui-test/menu7.js   (v8.97: 좁은 화면(독)은 관심 · 일정을 하단 바에서 빼고 ☰ 메뉴에 · 넓은 화면은 예전 그대로)
//   서버 없이 file:// 로 열린다(URL=로 바꿀 수 있음) · CHANNEL=msedge
const { chromium } = require('playwright');
const path = require('path');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'file:///' + path.resolve(__dirname, '../../index.html').replace(/\\/g, '/');
async function open(b, vw, vh, admin) {
  const p = await (await b.newContext({ viewport: { width: vw, height: vh } })).newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(a => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', a ? 'admin' : 'user'); }, admin);
  await p.waitForTimeout(700); return p;
}
const bar = p => p.evaluate(() => [...document.querySelectorAll('#mobileTabBar > .mtab-btn')].filter(b => !b.classList.contains('mtab-wide') && getComputedStyle(b).display !== 'none').map(b => ({ m: b.dataset.mtab, w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height) })));
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  // 좁은 화면 · 관리자: 7개
  let p = await open(b, 390, 844, true);
  let r = await bar(p), names = r.map(x => x.m).join(',');
  ok('390 관리자: 하단 메뉴 7개(발견 · 탐색 · 연구 · AI · 뉴스 · 항해 · 마이)', r.length === 7 && names === 'discover,explore,research,ai,news,voyage,board', names);
  ok('390: 관심 · 일정은 하단 바에 없음', !r.some(x => x.m === 'interest' || x.m === 'schedule'));
  ok('390: 가장 좁은 칸도 터치 폭 44 이상 · 높이 44 이상', Math.min(...r.map(x => x.w)) >= 44 && Math.min(...r.map(x => x.h)) >= 44, 'minW=' + Math.min(...r.map(x => x.w)) + ' minH=' + Math.min(...r.map(x => x.h)));
  const dr0 = await p.evaluate(() => { const d = [...document.querySelectorAll('.mo-drawer-item[data-narrow-only]')]; return d.map(x => ({ m: x.dataset.mtab, vis: getComputedStyle(x).display !== 'none' })); });
  ok('☰ 드로어에 관심 · 일정 항목이 보임', dr0.length === 2 && dr0.every(x => x.vis), JSON.stringify(dr0));
  await p.screenshot({ path: path.join(process.env.OUT || path.join(__dirname, 'out'), 'menu7_bar.png'), clip: { x: 0, y: 720, width: 390, height: 124 } });
  // ☰ 열고 관심 → 이동
  for (const [tab, label] of [['interest', '관심'], ['schedule', '일정']]) {
    await p.click('#mobileMenuBtn'); await p.waitForTimeout(500);
    const open1 = await p.evaluate(() => document.getElementById('moDrawer').classList.contains('open'));
    await p.click('.mo-drawer-item[data-mtab="' + tab + '"]'); await p.waitForTimeout(900);
    const st = await p.evaluate(() => ({ mt: document.body.dataset.mtab, closed: !document.getElementById('moDrawer').classList.contains('open'), ham: document.getElementById('mobileMenuBtn').classList.contains('aq-hasact'), act: !!document.querySelector('.mo-drawer-item.active'), barAct: [...document.querySelectorAll('#mobileTabBar > .mtab-btn')].filter(x => x.classList.contains('active') && getComputedStyle(x).display !== 'none').length }));
    ok('☰ › ' + label + ': 드로어 열림 → 누르면 ' + label + ' 화면으로 · 드로어 닫힘 · ☰ 강조', open1 && (st.mt === tab || (tab === 'interest' && st.mt === 'auto')) && st.closed && st.ham, JSON.stringify(st));
  }
  await p.click('#mobileTabBar > .mtab-btn[data-mtab="discover"]'); await p.waitForTimeout(700);
  ok('하단 메뉴(발견)로 돌아오면 ☰ 강조가 풀림', !(await p.evaluate(() => document.getElementById('mobileMenuBtn').classList.contains('aq-hasact'))));
  await p.context().close();
  // 좁은 화면 · 일반 사용자: AI 없음 → 6개
  p = await open(b, 390, 844, false); r = await bar(p);
  ok('390 일반 사용자: 하단 6개(AI는 관리자만) · 관심 · 일정 없음', r.length === 6 && !r.some(x => x.m === 'interest' || x.m === 'schedule' || x.m === 'ai'), r.map(x => x.m).join(','));
  await p.context().close();
  // 중간 폭(472 이상 · 와이드 아님): 예전 균등 9개 · ☰ 안에는 안 보임
  p = await open(b, 600, 844, true); r = await bar(p);
  const dr1 = await p.evaluate(() => [...document.querySelectorAll('.mo-drawer-item[data-narrow-only]')].map(x => getComputedStyle(x).display));
  ok('600폭(독 아님): 하단 9개 그대로 · ☰에는 관심 · 일정이 안 보임', r.length === 9 && r.some(x => x.m === 'interest') && r.some(x => x.m === 'schedule') && dr1.every(d => d === 'none'), r.length + '개 · ' + dr1.join(','));
  await p.context().close();
  // 와이드: 왼쪽 세로 메뉴 그대로(관심 · 일정 포함)
  p = await open(b, 1000, 700, true); r = await bar(p);
  ok('와이드(1000×700): 왼쪽 세로 메뉴에 관심 · 일정 그대로', r.some(x => x.m === 'interest') && r.some(x => x.m === 'schedule'), r.map(x => x.m).join(','));
  await p.context().close();
  // 좁은 화면 → 돌려서 넓어졌다가 다시 좁아져도 맞게 돌아옴
  p = await open(b, 390, 844, true);
  await p.setViewportSize({ width: 600, height: 844 }); await p.waitForTimeout(900); const wide = await bar(p);
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(900); const back = await bar(p);
  ok('390 → 600 → 390: 9개로 늘었다가 다시 7개', wide.length === 9 && back.length === 7, wide.length + ' → ' + back.length);
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
