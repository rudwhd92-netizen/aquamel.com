// AI리포트 카드 슬라이드 터치 스와이프 시험 — node tools/ui-test/swipe.js   (v9.24: 폰에서 좌우로 밀어도 슬라이드가 안 넘어가던 것)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
//   마우스가 아니라 실제 터치 입력(CDP Input.dispatchTouchEvent)으로 민다 — 터치 방향(touch-action) 규칙은 마우스로는 안 걸린다
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = process.env.URL || 'http://localhost:8773/index.html';
const FIX = fs.readFileSync(path.join(__dirname, 'fixtures', 'report_v3.txt'), 'utf8');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.waitForFunction(() => _state.archive && _state.archive.length > 100, null, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(800);
  await p.evaluate(fix => {
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin');
    fetchReportsIndex = async () => {};
    const STUB = { US: { CL: ['2026-11-20'], WMB: ['2026-11-18'] }, KR: {} };
    Object.defineProperty(_state, 'reports', { get: () => STUB, set: () => {}, configurable: true });
    fetchReportContent = async () => fix;
    switchMobileTab('research'); setAiSubtab('report'); buildAnalysisGrid();
  }, FIX);
  await p.waitForSelector('#rpFeed .feed-item', { timeout: 15000 }); await p.waitForTimeout(1500);
  const sel = '#rpFeed .feed-item[data-ticker="CL"]';
  await p.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(1500);
  await p.waitForSelector(sel + ' .rs .rs-view', { timeout: 10000 });
  const cdp = await ctx.newCDPSession(p);
  const state = () => p.evaluate(sel => { const it = document.querySelector(sel), f = it.querySelector('.fl-flipper'), m = /rotateY\(([-\d.]+)deg\)/.exec(f.style.transform), rs = it.querySelector('.rs'); return { rotY: m ? +m[1] : 0, slide: [...rs.querySelectorAll('.rs-dots button')].findIndex(b => b.getAttribute('aria-selected') === 'true') }; }, sel);
  const box = await p.evaluate(sel => { const r = document.querySelector(sel + ' .rs-view').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }, sel);
  async function swipe(dx, ms, hold0) {   // 글자가 있는 자리에서 시작(slide 칸 안쪽 글 = 예전에 끊기던 자리)
    const x0 = box.x + box.w * (dx < 0 ? 0.8 : 0.2), y0 = box.y + box.h * 0.5, steps = 12;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
    if (hold0) await p.waitForTimeout(hold0);
    for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + dx * i / steps, y: y0 + 2 * i / steps }] }); await p.waitForTimeout(ms / steps); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(1200);
  }
  await swipe(-150, 250, 0); let s = await state();
  ok('터치: 빠른 왼쪽 스와이프 → 2번째 슬라이드 · 안 뒤집힘', s.slide === 1 && Math.abs(s.rotY) < 1, JSON.stringify(s));
  await swipe(-150, 250, 0); s = await state();
  ok('터치: 한 번 더 왼쪽 → 3번째 슬라이드', s.slide === 2 && Math.abs(s.rotY) < 1, JSON.stringify(s));
  await swipe(150, 250, 0); s = await state();
  ok('터치: 오른쪽 스와이프 → 2번째로 돌아옴', s.slide === 1 && Math.abs(s.rotY) < 1, JSON.stringify(s));
  await swipe(150, 900, 0); s = await state();
  ok('터치: 느린 오른쪽 스와이프(0.9초)도 슬라이드 · 안 뒤집힘', s.slide === 0 && Math.abs(s.rotY) < 1, JSON.stringify(s));
  await swipe(-150, 250, 300); s = await state();
  ok('터치: 손을 0.3초 댔다가 밀어도 슬라이드 · 안 뒤집힘', s.slide === 1 && Math.abs(s.rotY) < 1, JSON.stringify(s));
  console.log(fails ? '실패 ' + fails + '건' : '모두 통과'); await b.close(); process.exit(fails ? 1 : 0);
})();
