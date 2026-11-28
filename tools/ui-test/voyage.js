// AI › 항해(v9.51) 시험 — node tools/ui-test/voyage.js
//   python -m http.server 8773 · CHANNEL=msedge · 자료는 지어낸 값, 서버 호출은 가짜(로그인 토큰 없음)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const URL = process.env.URL || 'http://localhost:8773/index.html';
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c || !x ? '' : '  · ' + x)); if (!c) fails++; };
const IGN = /Failed to load resource|net::ERR|favicon|manifest|fonts\.g|CORS|아카이브|fetching the script|discoverMotionView is not defined/;
const wait = ms => new Promise(r => setTimeout(r, ms));

const MOCK = scene => {
  const now = new Date(), iso = h => new Date(now.getTime() - h * 3600e3).toISOString(), today = _kstToday();
  window.__scene = scene; window.__calls = [];
  window.apiCall = async (a, q) => {
    window.__calls.push([a, q || {}]); const s = window.__scene;
    if (a === 'forecastGet') return { ok: true, admin: true, asof: today, score: { n: 8, hit: 5 }, cal: [], cards: [
        { name: 'FOMC 금리 결정', day: _gdAdd(today, 3), dday: 3, cases: [{ k: 'A', t: '[동결]', p: 70, src: '[출처]' }, { k: 'B', t: '[인하]', p: 30 }], src: [], mkt: [], acct: { lp: 2.4, case: 'B' } },
        { name: '[지표 발표]', day: _gdAdd(today, 9), dday: 9, cases: [], src: [], mkt: [] }],
      j: { at: today + 'T07:40', ins: [{ topic: '[주제 1]', text: '[인사이트 한 줄]', i: 0 }], items: [
        { name: '[관세]', kind: '상시', mpos: 34, apos: 72, gap: 38, votes: { A: { pos: 70 }, B: { pos: 74 }, C: { pos: 60 } }, pick: 'B', vote: '2:1', stage: '공식화', f1: '[인사이트]', f5: {}, wx: 'sun', my: ['AAPL +'] },
        { name: '[AI 투자]', kind: '상시', mpos: 66, apos: 50, gap: 16, votes: {}, f5: {}, wx: 'cloud' },
        { name: '[상장 일정]', kind: '애드혹', mpos: 50, apos: 55, gap: 5, dday: 12, mile: '[일정]', stage: '결정일', votes: {}, f5: {}, wx: 'cloud' }],
        close: { res: { verdict: '다지기', p: { '내림': 25, '오름': 20, '다지기': 55 }, conf: '보통', one: '[한 줄 결론]', flip: '[뒤집힐 신호]', side: '[내리는 쪽]', side_why: '[까닭]', priced: '[대부분]', use: '[방어 위주]', at: today + ' 07:50',
          up: [{ raw: 'x', name: '[올리는 근거]', str: '중', when: '12월', why: '[까닭]', src: '[출처]' }], down: [{ raw: 'y', name: '[내리는 근거]', str: '강', when: '', why: '[까닭]', src: '' }] } } } };
    if (a === 'macroJudgeGet') {
      const st = s === 'judging' ? 'judge' : 'done';
      return { ok: true, now: null, last: { d: today, stocks: { AAPL: { nm: 'Apple', held: true, w: '비우호' }, NVDA: { nm: 'NVIDIA', held: true, w: '우호' }, MSFT: { nm: 'Microsoft', held: false, w: '중립' } }, cells: [], quant: {} },
        mgr: { d: s === 'judging' ? _gdAdd(today, 1) : today, status: st, T: iso(-1), premise: { '한 줄': '[오늘의 전제]', '결론': '다지기', p: { '다지기': 55 } },
          hy: { watch: { w: [{ tk: 'NVDA', side: 'SELL', max: 3, lo: 275, hi: 278, raw: '가격 ≤ $278', why: '[까닭]' }, { tk: 'MSFT', side: 'BUY', max: 10, lo: 60, hi: 61, raw: '등락 ≤ -3%', ok: 'live' }] } } } };
    }
    if (a === 'managerToday') {
      const status = { proposal: 'proposed', queued: 'approved', held: 'held', stuck: 'check', night: 'working', done: 'done', judging: 'done', day: 'done' }[s] || 'proposed';
      const items = s === 'none' ? [] : [
        { id: 1, rank: 1, status, mode: 'live', legs: [{ tk: 'AAPL', side: 'SELL', qty: 10, price: 189 }], why: { '상황': '[이유]', '표': '3:0', '어제와 같음': true } },
        { id: 2, rank: 2, status, mode: 'live', legs: [{ tk: 'MSFT', side: 'BUY', qty: 5, price: 95 }], why: { '상황': '[이유]', '표': '2:1', '어제와 같음': true } }];
      return { ok: true, market: 'US', mode: { mode: 'live' }, run: { day: today, v3: true, cash: 3000, head: s === 'none' ? '[없는 까닭]' : '[오늘 밤 결론]', result_at: iso(s === 'day' ? 40 : 1), checked: s === 'night' || s === 'done' }, items,
        stocks: { AAPL: { name: 'Apple', held: true, qty: 40, avg: 100, now: 190 }, MSFT: { name: 'Microsoft', held: false, now: 96 }, NVDA: { name: 'NVIDIA', held: true, qty: 5, avg: 200, now: 280 } }, opinions: [{ tk: 'MSFT', op: '대기', held: false }], decide: [{ id: 9, tk: 'NVDA', kind: 'report', status: 'queued', confirmed: false, why: '[왜 필요한지]' }], reasons: ['[지난 이유]'], diff_open: 1 };
    }
    return { ok: false };
  };
  const st = document.createElement('style'); st.textContent = '#aqAuth, #splashOverlay { display: none !important; }'; document.head.appendChild(st);
};
const admin = p => p.evaluate(() => { localStorage.removeItem('aq_session_token'); document.body.setAttribute('data-role', 'admin'); _aqAuth.user = { role: 'admin' }; switchMobileTab('ai'); setAiSubtab('voy'); });
async function open(b, o = {}) {
  const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, colorScheme: o.light ? 'light' : 'dark', reducedMotion: o.rm || 'no-preference' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { if (!IGN.test(e.message)) errs.push(e.message); }); p.on('console', m => { if ((m.type() === 'error' || /\[항로/.test(m.text())) && !IGN.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.aqVoyRender && window.apiCall, null, { timeout: 30000 });
  await wait(3000);
  await p.evaluate(MOCK, o.scene || 'proposal');
  return { p, ctx, errs };
}
const T = p => p.evaluate(() => (document.getElementById('voyBody').innerText || '').replace(/\n+/g, ' '));
const SH = p => p.evaluate(() => ((document.getElementById('brSheet') || {}).innerText || '').replace(/\n+/g, ' '));
const fit = p => p.evaluate(() => { const box = document.getElementById('voyBody'), w = innerWidth;
  const out = [...box.querySelectorAll('button, .voy-tag, .voy-big, .voy-kv b')].filter(x => x.getClientRects().length).filter(x => { const r = x.getBoundingClientRect(); return r.left < -1 || r.right > w + 1; }).map(x => x.textContent.slice(0, 16));
  const small = [...box.querySelectorAll('.voy-row, .voy-btn, .voy-more, .voy-ico, .voy-st > button, .voy-gap, .voy-undo')].filter(x => x.getClientRects().length && x.getBoundingClientRect().height < 43.5).map(x => x.className + ':' + x.textContent.slice(0, 14));
  return { out, small, over: document.documentElement.scrollWidth - w }; });
const closeSheet = async p => { await p.evaluate(() => { document.getElementById('brSheet')?.remove(); document.getElementById('mg3Sh')?.remove(); document.querySelectorAll('#mcSheet').forEach(x => x.remove()); }); await wait(500); };

(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let { p, ctx, errs } = await open(b);

  /* 관리자가 아니면 탭이 없음 */
  await p.evaluate(() => { document.body.setAttribute('data-role', 'user'); switchMobileTab('ai'); setAiSubtab('voy'); }); await wait(600);
  ok('관리자가 아니면 항해 탭 · 자료 없음', await p.evaluate(() => document.body.getAttribute('data-atab') !== 'voy' && !window.__calls.some(c => c[0] === 'forecastGet' || c[0] === 'managerToday')));

  await admin(p); await wait(2000);
  let t = await T(p);
  ok('관리자: AI 첫 탭이 항해', await p.evaluate(() => { const bt = [...document.querySelectorAll('#aiSubRow .xtab-btn')].map(x => x.textContent); return bt[0] === '항해' && bt.includes('AI매니저') && bt.includes('AI예보'); }));
  ok('제안: 맨 위 한 문장 · 다섯 정거장', /오늘의 항로/.test(t) && /결정 2건 남았어요/.test(t) && ['시장은 어디로', '내 종목 날씨', '결정', '주시', '결과 · 채점'].every(x => t.includes(x)), t.slice(0, 300));
  ok('제안: 지금(결정)만 펼침 · 요약 한 줄', await p.evaluate(() => [...document.querySelectorAll('.voy-st')].map(s => s.classList.contains('open') ? 1 : 0).join('') === '00100') && /다지기 55% · 갈림길 D-3/.test(t) && /우호 1 · 중립 1 · 비우호 1/.test(t), t);
  ok('결정 칸: 결론 · 전제 · 제안 두 줄 · 하나씩 · 한 번에 · AI가 묻는 것', /\[오늘 밤 결론\]/.test(t) && /전제: \[오늘의 전제\] · 다지기 55%/.test(t) && /AAPL 10주 매도/.test(t) && /MSFT 5주 매수/.test(t) && /하나씩 결정하기 · 2건/.test(t) && /어제와 같은 2건 한 번에/.test(t) && /AI가 묻는 것/.test(t), t);
  let f = await fit(p); ok('제안: 화면 밖 · 넘침 없음 · 누르는 곳 44', !f.out.length && !f.small.length && f.over <= 0, JSON.stringify(f));
  await wait(2500); ok('항해에서는 AI 비서가 한 줄을 내지 않음(배지만)', await p.evaluate(() => window.AQ_AI.panel.mode !== 'bubble' && !!document.getElementById('aqAiN')));
  await p.screenshot({ path: path.join(OUT, 'voy_proposal.png'), fullPage: true });

  /* 결정은 지금 앱 화면 */
  await p.click('#voyBody .voy-btn.pri'); await p.waitForSelector('#mg3Fl', { timeout: 8000 }); await wait(700);
  ok('하나씩 결정 = 지금 앱 결정 화면(거부 · 모의 · 승인)', await p.evaluate(() => /Apple|AAPL/.test(document.getElementById('mg3Fl').textContent) && [...document.querySelectorAll('#mg3Bt button')].map(x => x.textContent).join() === '거부,모의,승인'));
  await p.click('#mg3Bt button.g'); await wait(600);
  ok('승인 = 지금 앱 확인 창(길게 눌러)', await p.evaluate(() => !!document.querySelector('#mg3Sh .aq-hold') && /길게 눌러 승인/.test(document.getElementById('mg3Sh').textContent)));
  ok('눌러 보기만으로는 승인 · 주문 호출 없음', await p.evaluate(() => !window.__calls.some(c => /managerApprove|managerReject|managerCancel/.test(c[0]))));
  await p.screenshot({ path: path.join(OUT, 'voy_confirm.png') });
  await p.evaluate(() => { document.getElementById('mg3Sh')?.remove(); window.__scene = 'queued'; aqMgr3Close(); }); await wait(2500);
  t = await T(p); ok('결정 화면을 닫으면 항해가 새 상태로 다시 그려짐', /다 정했어요/.test(t) && /거두기/.test(t) && /00:00 확인 뒤/.test(t), t.slice(0, 300));

  /* 시장 · 갈림길 · 주제 · 계좌 */
  await p.click('.voy-st:nth-child(1) > button'); await wait(500); t = await T(p);
  ok('시장 칸: 결론 · 뒤집힐 신호 · 가장 다른 주제 · 갈림길(내 계좌)', /다지기55%/.test(t.replace(/ /g, '')) && /뒤집힐 신호/.test(t) && /\[관세\]/.test(t) && /FOMC/.test(t) && /−2.4%/.test(t), t.slice(0, 400));
  await p.screenshot({ path: path.join(OUT, 'voy_market_station.png'), fullPage: true });
  await p.click('#voyBody .voy-more'); await wait(600); let s = await SH(p);
  ok('전망 자세히: 확률 · 압력 · 판단 · 지난 예보 (지금 예보 화면엔 없던 것)', /시장 전망/.test(s) && /올리는 압력/.test(s) && /\[내리는 근거\]/.test(s) && /종목에 쓰는 법/.test(s), s.slice(0, 300));
  await p.screenshot({ path: path.join(OUT, 'voy_market.png') });
  await p.click('#brSheet .voy-btn'); await wait(1100); s = await SH(p);
  ok('주제와 일정: 인사이트 · 상시 주제 · 지켜보는 일 · 갈림길', /인사이트/.test(s) && /\[AI 투자\]/.test(s) && /\[상장 일정\]/.test(s) && /FOMC/.test(s), s.slice(0, 300));
  await p.click('#brSheet .voy-gap'); await wait(1100); s = await SH(p); ok('주제를 누르면 지금 앱의 주제 상세', /AI 예보/.test(s) && /\[관세\]/.test(s) && /AI 판단/.test(s), s.slice(0, 200)); await closeSheet(p);
  await p.click('#voyBody .voy-row[onclick^="aqFcOpen"]'); await wait(700); s = await SH(p); ok('갈림길을 누르면 경우별 상세', /FOMC/.test(s) && /\[동결\]/.test(s) && /70%/.test(s), s.slice(0, 200)); await closeSheet(p);
  await p.click('.voy-st:nth-child(2) > button'); await wait(500); await p.click('.voy-st:nth-child(2) .voy-more'); await wait(700); s = await SH(p);
  ok('내 계좌 · 전체: 지도 · 날씨', /내 계좌/.test(s) && /오늘 날씨/.test(s) && /AAPL/.test(s), s.slice(0, 200)); await p.screenshot({ path: path.join(OUT, 'voy_account.png') }); await closeSheet(p);

  /* 주시 · 결과 */
  await p.click('.voy-st:nth-child(4) > button'); await wait(500); await p.click('.voy-st:nth-child(4) .voy-row'); await wait(600);
  ok('주시를 누르면 지금 앱의 조건부 승인 창', await p.evaluate(() => /NVDA 매도 최대 3주/.test((document.getElementById('mg3Sh') || {}).textContent || ''))); await closeSheet(p);
  await p.click('.voy-st:nth-child(5) > button'); await wait(500); t = await T(p);
  ok('결과 칸: 다르게 한 것 · 예보 적중 · 기록', /다르게 한 것 · 1/.test(t) && /5\/8/.test(t) && /신뢰 기록/.test(t) && /통합 성적/.test(t), t.slice(-300));
  ok('오류 없음', !errs.length, errs.join(' | '));

  /* 예전 탭은 그대로 */
  await p.evaluate(() => setAiSubtab('manager')); await wait(1500);
  ok('AI매니저 탭은 그대로', await p.evaluate(() => getComputedStyle(document.getElementById('managerCard')).display !== 'none' && getComputedStyle(document.getElementById('voyCard')).display === 'none' && document.getElementById('mgrBody').textContent.length > 50));
  await p.evaluate(() => setAiSubtab('fc')); await wait(1500);
  ok('AI예보 탭은 그대로', await p.evaluate(() => /오늘의 인사이트|상시 주제/.test(document.getElementById('fcBox').textContent)));
  await p.evaluate(() => setAiSubtab('voy')); await wait(800);
  await p.evaluate(() => switchMobileTab('home')); await wait(800);
  ok('다른 메뉴로 가면 항해가 남지 않음', await p.evaluate(() => !document.getElementById('voyCard').getClientRects().length));
  await p.evaluate(() => { switchMobileTab('ai'); setAiSubtab('voy'); setMarket('KR'); }); await wait(1500); t = await T(p);
  ok('한국: 준비 중 · 미국으로 보기', /한국 시장은 준비 중/.test(t) && /미국으로 보기/.test(t), t);
  await p.click('#voyBody .voy-btn.pri'); await wait(2000); t = await T(p); ok('미국으로 돌아오면 다시 항해', /다 정했어요|결정/.test(t) && !/준비 중/.test(t), t.slice(0, 120));
  await ctx.close();

  /* 단계별 첫 문장 */
  for (const [scene, re, openIx] of [['judging', /에 제안이 와요/, '00100'], ['held', /다시 판단해요/, '00100'], ['stuck', /확인해 주세요/, '00100'], ['none', /할 일이 없어요|지켜보고|어젯밤|끝났어요/, null], ['day', /시장은 다지기로 봐요/, '10000'], ['night', /지켜보고 있어요|어젯밤 결과|끝났어요/, null]]) {
    ({ p, ctx, errs } = await open(b, { scene })); await admin(p); await wait(2200); t = await T(p);
    const op = await p.evaluate(() => [...document.querySelectorAll('.voy-st')].map(s => s.classList.contains('open') ? 1 : 0).join(''));
    ok(`단계 ${scene}: 첫 문장 · 펼침`, re.test(t) && (!openIx || op === openIx), op + ' ' + t.slice(0, 140));
    f = await fit(p); ok(`단계 ${scene}: 넘침 · 오류 없음`, !f.out.length && !f.small.length && f.over <= 0 && !errs.length, JSON.stringify(f) + errs.join('|'));
    if (scene === 'day' || scene === 'judging') await p.screenshot({ path: path.join(OUT, `voy_${scene}.png`), fullPage: true });
    await ctx.close();
  }
  for (const [tag, o] of [['360', { w: 360, h: 740 }], ['light', { light: true }], ['wide', { w: 1440, h: 900 }]]) {
    ({ p, ctx, errs } = await open(b, o)); if (o.light) await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); document.body.setAttribute('data-theme', 'light'); });
    await admin(p); await wait(2200); f = await fit(p); ok(tag + ': 넘침 · 누르는 곳 · 오류', !f.out.length && !f.small.length && f.over <= 0 && !errs.length && /결정 2건/.test(await T(p)), JSON.stringify(f) + errs.join('|'));
    await p.screenshot({ path: path.join(OUT, `voy_${tag}.png`) }); await ctx.close();
  }
  await b.close();
  console.log(fails ? '실패 ' + fails : '모두 통과'); process.exit(fails ? 1 : 0);
})();
