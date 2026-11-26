// 우하단 플로팅 AI 비서 버튼(v9.30) 시험 — node tools/ui-test/aibutton.js
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
//   쉬는 동안 정지 · 처음 뜰 때 빠르게 돌다 멈춤 · 새 메시지가 생기면 꿈틀 · 누르면 준비 중 알림 · 스크롤 내리면 숨고 올리면 나옴 · 움직임 줄이기 · 테마 · 넓은 화면
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const IGN = /Failed to load resource|net::ERR|favicon|manifest|fonts\.g|CORS|아카이브|fetching the script|discoverMotionView is not defined/;   // discoverMotionView: 이 변경과 무관한 예전 오류(라이브에도 있음)
async function open(b, o) {
  const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: o.rm || 'no-preference' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { if (!IGN.test(e.message)) errs.push(e.message); }); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
  return { p, errs };
}
const prep = p => p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); });
const SETTLED = () => { const s = AQ_AI.state; return Math.abs(s.yawV) < .03 && [s.pop, s.live, s.wob, s.sq, s.hop].every(x => Math.abs(x.x - x.t) < .02 && Math.abs(x.v) < .5); };
const hashOf = p =>p.evaluate(() => document.getElementById('aqAiCv').toDataURL().length + ':' + document.getElementById('aqAiCv').toDataURL().slice(-40));
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let { p, errs } = await open(b, {});
  await p.waitForFunction(() => window.AQ_AI && document.getElementById('aqAi'), null, { timeout: 30000 });
  ok('버튼이 있음(우하단 · 이름 표시)', await p.evaluate(() => { const e = document.getElementById('aqAi'); return e.getAttribute('aria-label') === 'AI 비서'; }));
  ok('앱이 열리기 전(스플래시 · 로그인 창이 있는 동안)에는 안 보임', await p.evaluate(() => !window.AQ_AI.state.shown && getComputedStyle(document.getElementById('aqAi')).opacity === '0'));
  await prep(p);
  await p.waitForFunction(() => window.AQ_AI.state.shown, null, { timeout: 20000 });
  // 처음 뜰 때: 빠르게 돌다 멈춤
  const spin = await p.evaluate(async () => { const c = document.getElementById('aqAiCv'), out = { v0: window.AQ_AI.state.yawV, hs: [] }; for (let i = 0; i < 5; i++) { out.hs.push(c.toDataURL().slice(-60)); await new Promise(r => setTimeout(r, 90)); } return out; });
  ok('처음 뜰 때: 빠르게 돌고 있음(점 모양이 프레임마다 바뀜)', spin.v0 > 4 && new Set(spin.hs).size >= 4, 'yawV ' + spin.v0.toFixed(1) + ' · 서로 다른 프레임 ' + new Set(spin.hs).size + '/5');
  await p.waitForFunction(SETTLED, null, { timeout: 30000 });   // 시간 대신 「다 멈췄는지」를 기다림(느린 컴퓨터에서도 맞게)
  const still1 = await hashOf(p); await p.waitForTimeout(700); const still2 = await hashOf(p);
  ok('돌다 멈춤 — 쉬는 동안은 점 하나도 안 움직임', still1 === still2 && await p.evaluate(() => Math.abs(window.AQ_AI.state.yawV) < .05 && document.getElementById('aqAi').style.transform === '' && document.getElementById('aqAi').style.opacity === ''));
  // 새 메시지: 꿈틀꿈틀
  const wig = await p.evaluate(async () => { const f = document.getElementById('aqAi'); window.AQ_AI.notify(3); let maxRot = 0, maxSq = 0, flips = 0, last = 0; const t0 = performance.now();
    await new Promise(res => { const st = window.AQ_AI.state; const tick = () => { const m = new DOMMatrix(getComputedStyle(f).transform), rot = Math.atan2(m.b, m.a) * 180 / Math.PI, sq = Math.abs(Math.hypot(m.a, m.b) - Math.hypot(m.c, m.d)); maxRot = Math.max(maxRot, Math.abs(rot)); maxSq = Math.max(maxSq, sq); if (Math.abs(rot) > 1.5 && Math.sign(rot) !== last) { if (last) flips++; last = Math.sign(rot); } if (performance.now() - t0 < 4000) setTimeout(tick, 40); else res(); }; tick(); });
    return { maxRot, maxSq, flips, badge: document.getElementById('aqAiN').textContent, hidden: document.getElementById('aqAiN').hidden }; });
  ok('새 메시지: 꿈틀꿈틀(좌우로 기울고 찌그러지며 몇 번 흔들림) · 숫자 배지', wig.maxRot > 4 && wig.maxSq > .12 && wig.flips >= 2 && wig.badge === '3' && !wig.hidden, JSON.stringify(wig));
  await p.waitForFunction(SETTLED, null, { timeout: 30000 });
  ok('꿈틀이 끝나면 제자리로 돌아와 멈춤', await p.evaluate(() => document.getElementById('aqAi').style.transform === ''));
  await p.evaluate(() => { window.AQ_AI.notify(3); });   // 같은 숫자 → 다시 꿈틀하지 않음
  await p.waitForTimeout(300);
  ok('숫자가 그대로면 꿈틀하지 않음', await p.evaluate(() => document.getElementById('aqAi').style.transform === ''));
  // 누르면 준비 중 알림
  await p.click('#aqAi'); await p.waitForTimeout(500);
  ok('누르면 「AI 비서는 준비 중이에요」 알림', await p.evaluate(() => /AI 비서는 준비 중이에요/.test((document.getElementById('aqTs') || {}).textContent || '')));
  await p.waitForTimeout(2500);
  // 생각 중
  await p.evaluate(() => AQ_AI.think(true)); await p.waitForTimeout(900);
  const th1 = await hashOf(p); await p.waitForTimeout(200); const th2 = await hashOf(p);
  await p.evaluate(() => AQ_AI.think(false)); await p.waitForTimeout(3500);
  const th3 = await hashOf(p); await p.waitForTimeout(500); const th4 = await hashOf(p);
  ok('생각 중에만 계속 돌고 끝나면 멈춤', th1 !== th2 && th3 === th4);
  // 스크롤 숨김
  await p.evaluate(() => { switchMobileTab('explore'); setExploreSubtab('list'); }); await p.waitForTimeout(3000);   // v9.35: 탐색 메뉴가 없어져 탐색 페이지(종목리스트)로 직접 들어감
  await p.mouse.move(200, 400); for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 80); await p.waitForTimeout(60); } await p.waitForTimeout(1300);
  const hid = await p.evaluate(() => { const m = new DOMMatrix(getComputedStyle(document.getElementById('aqAi')).transform); return Math.round(m.m41); });
  ok('목록을 내리면 오른쪽으로 숨음', hid >= 60, 'translateX ' + hid);
  for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, -70); await p.waitForTimeout(60); } await p.waitForTimeout(1300);
  ok('올리면 다시 나옴', await p.evaluate(() => Math.round(new DOMMatrix(getComputedStyle(document.getElementById('aqAi')).transform).m41) === 0));
  // 자리
  const pos = await p.evaluate(() => { const r = document.getElementById('aqAi').getBoundingClientRect(), tb = document.querySelector('.mobile-tab-bar').getBoundingClientRect(); return { right: Math.round(innerWidth - r.right), gap: Math.round(tb.top - r.bottom), size: Math.round(r.width) }; });
  ok('자리: 오른쪽 16 · 탭 바 위 12 · 크기 52(손가락 44 이상)', pos.right === 16 && pos.gap === 12 && pos.size === 52, JSON.stringify(pos));
  ok('오류 없음', errs.length === 0, errs.join(' | ').slice(0, 300));
  // 움직임 줄이기
  ({ p, errs } = await open(b, { rm: 'reduce' }));
  await p.waitForFunction(() => window.AQ_AI, null, { timeout: 30000 }); await prep(p); await p.waitForFunction(() => window.AQ_AI.state.shown, null, { timeout: 20000 });
  await p.evaluate(() => AQ_AI.notify(2)); await p.waitForTimeout(400);
  ok('움직임 줄이기: 돌지도 꿈틀하지도 않고 바로 최종 모습 · 배지는 나옴', await p.evaluate(() => { const f = document.getElementById('aqAi'); return f.style.transform === '' && f.style.opacity === '' && Math.abs(AQ_AI.state.yawV) < .01 && document.getElementById('aqAiN').textContent === '2'; }));
  ok('오류 없음(움직임 줄이기)', errs.length === 0, errs.join(' | ').slice(0, 300));
  // 넓은 화면
  ({ p, errs } = await open(b, { w: 1000, h: 700 }));
  await p.waitForFunction(() => window.AQ_AI, null, { timeout: 30000 }); await prep(p); await p.waitForFunction(() => window.AQ_AI.state.shown, null, { timeout: 20000 }); await p.waitForTimeout(3000);
  const wide = await p.evaluate(() => { const r = document.getElementById('aqAi').getBoundingClientRect(), c = document.querySelector('.container').getBoundingClientRect(); return { wide: document.documentElement.classList.contains('aq-wide'), insideCol: r.right <= c.right && r.left >= c.left, bottom: Math.round(innerHeight - r.bottom) }; });
  ok('넓은 화면: 버튼이 폰 칸 안 오른쪽 아래', wide.wide && wide.insideCol && wide.bottom === 24, JSON.stringify(wide));
  console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); await b.close(); process.exit(fails ? 1 : 0);
})();
