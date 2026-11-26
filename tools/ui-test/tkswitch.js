// 가로 2분할에서 종목 창을 연 채 왼쪽에서 다른 종목을 누를 때 (v9.37) — node tools/ui-test/tkswitch.js
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
//   종목 지도 · 내 주식 칸이 새 종목으로 바뀌는지, 보던 탭이 유지되는지, 같은 종목을 다시 그릴 때는 다시 받지 않는지
//   서버 응답은 시험용으로 바꿔 끼운다(로그인 없이 확인)
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => { if (!/discoverMotionView is not defined/.test(e.message)) errs.push(e.message); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelectorAll('#buyPointsScroll .buy-point-item').length >= 3, null, { timeout: 60000 });
  await p.evaluate(() => {
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none');
    document.body.setAttribute('data-broker', 'linked');
    window.__maps = [];
    const real = window.apiCall;
    window.apiCall = async (a, q) => { if (a === 'stockMapGet') { window.__maps.push(q.ticker); await new Promise(r => setTimeout(r, 200)); return { ok: true, tk: q.ticker }; } return real(a, q); };
    window._smHtml = d => '<div id="fakeMap">지도 ' + d.tk + '</div>';
    window.aqVgFill = () => {};
  });
  const tks = await p.evaluate(() => [...document.querySelectorAll('#buyPointsScroll .buy-point-item')].slice(0, 3).map(x => x.dataset.ticker));
  const tap = async i => { await p.click('#buyPointsScroll .buy-point-item >> nth=' + i); await p.waitForTimeout(1800); };
  const view = () => p.evaluate(() => ({ wide: document.documentElement.classList.contains('aq-wide'), tk: String(_state.openTicker || ''), mode: _aqTkView(), tab: (document.querySelector('#modalViewTabs .xtab-btn.active') || { dataset: {} }).dataset.view || '', map: (document.getElementById('fakeMap') || {}).textContent || '', calls: window.__maps.slice(), pos: (document.getElementById('positionPanel') || {}).textContent || '' }));

  await tap(0);
  await p.evaluate(() => aqSetModalView('map')); await p.waitForTimeout(900);
  let v = await view();
  ok('넓은 화면에서 첫 종목의 지도가 열림', v.wide && v.mode === 'map' && v.map === '지도 ' + tks[0], v.map);
  await tap(1); v = await view();
  ok('왼쪽에서 다른 종목: 지도도 그 종목으로', v.tk === tks[1] && v.map === '지도 ' + tks[1], '창=' + v.tk + ' · ' + v.map);
  ok('보던 탭(종목 지도)은 그대로', v.mode === 'map' && v.tab === 'map', v.mode + '/' + v.tab);
  const n = v.calls.length;
  await p.evaluate(t => openChart(t), tks[1]); await p.waitForTimeout(900); v = await view();
  ok('같은 종목을 다시 그릴 때는 지도를 다시 받지 않음', v.calls.length === n, n + ' → ' + v.calls.length);
  await p.evaluate(() => history.back()); await p.waitForTimeout(2200); v = await view();
  ok('뒤로가기: 직전 종목의 지도로', v.tk === tks[0] && v.map === '지도 ' + tks[0], '창=' + v.tk + ' · ' + v.map);

  // 내 주식 칸 — 종목마다 다른 매매 기록을 넣고 확인
  await p.evaluate(t => { lsSet(lsKeyTrades(), [{ _id: 'a', ticker: t[0], action: '매수', qty: 3, price: 10, date: '2026-01-05' }, { _id: 'b', ticker: t[2], action: '매수', qty: 7, price: 10, date: '2026-01-05' }]); }, tks);
  await p.evaluate(() => aqSetModalView('position')); await p.waitForTimeout(900); v = await view();
  ok('첫 종목의 내 주식 칸', v.mode === 'position' && /3주/.test(v.pos), v.pos.replace(/\s+/g, ' ').slice(0, 60));
  await tap(2); v = await view();
  ok('왼쪽에서 다른 종목: 내 주식도 그 종목으로 · 탭 유지', v.tk === tks[2] && v.mode === 'position' && /7주/.test(v.pos) && !/(^|[^0-9])3주/.test(v.pos), '창=' + v.tk + ' · ' + v.pos.replace(/\s+/g, ' ').slice(0, 60));

  // 차트 탭에서 바꾸면 차트 그대로
  await p.evaluate(() => aqSetModalView('chart')); await p.waitForTimeout(500); await tap(1); v = await view();
  ok('차트 탭에서 바꾸면 차트 그대로 · 지도를 새로 받지 않음', v.mode === 'chart' && v.tk === tks[1], v.mode);
  ok('오류 없음', errs.length === 0, errs.join(' | ').slice(0, 300));
  console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); await b.close(); process.exit(fails ? 1 : 0);
})();
