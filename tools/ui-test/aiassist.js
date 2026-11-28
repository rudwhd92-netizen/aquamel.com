// AI 비서 첫 판(v9.50) 시험 — node tools/ui-test/aiassist.js
//   앱을 먼저 띄운다: python -m http.server 8773  · CHANNEL=msedge · 자료는 모두 지어낸 값, 서버 호출은 가짜로 바꿈(로그인 토큰 없음)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const URL = process.env.URL || 'http://localhost:8773/index.html';
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (c || !x ? '' : '  · ' + x)); if (!c) fails++; };
const IGN = /Failed to load resource|net::ERR|favicon|manifest|fonts\.g|CORS|아카이브|fetching the script|discoverMotionView is not defined/;
const wait = ms => new Promise(r => setTimeout(r, ms));

async function open(b, o = {}) {
  const ctx = await b.newContext({ viewport: { width: o.w || 390, height: o.h || 844 }, colorScheme: o.light ? 'light' : 'dark', reducedMotion: o.rm || 'no-preference', hasTouch: !o.wide });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { if (!IGN.test(e.message)) errs.push(e.message); }); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => window.AQ_AI && window.AQ_AI.panel && window.apiCall, null, { timeout: 30000 });
  await p.evaluate(o => {
    const today = _kstToday(), y = _gdAdd(today, -1), old = _gdAdd(today, -5);
    window.__calls = []; window.__mode = o.data || 'full';
    const news = (mk, tk, d, t, h, fx) => ({ tk, d, pd: d, t, kind: '', h, s: '[요약 — 두 줄을 넘으면 접히는 글입니다. 무엇이 있었고 숫자가 어땠는지 서버가 적은 요약이 여기에 들어갑니다. 더 보기를 누르면 전부 보입니다.]', fx, u: 'https://example.com/' + mk + tk + d + t });
    window.apiCall = async (a, q) => {
      window.__calls.push([a, q || {}]); const m = window.__mode;
      if (m === 'fail') return { ok: false };
      if (a === 'managerToday') {
        if ((q || {}).mkt !== 'US') return { ok: false };
        const items = m === 'empty' ? [] : [
          { id: 1, rank: 1, status: 'proposed', mode: 'live', legs: [{ tk: 'AAPL', side: 'SELL', qty: 10, price: 89 }], why: { '상황': '[AI 매니저가 적은 이유 한 줄]', '표': '3:0' } },
          { id: 2, rank: 2, status: 'proposed', mode: 'live', legs: [{ tk: 'MSFT', side: 'BUY', qty: 5, price: 95 }], why: { '상황': '[이유 한 줄]', '표': '3:0' } },
          { id: 3, rank: 3, status: 'done', mode: 'live', legs: [{ tk: 'AAPL', side: 'SELL', qty: 1, price: 9 }], why: {} }];
        return { ok: true, run: { day: today, v3: true, cash: 3000, head: '[결론]', result_at: new Date().toISOString(), checked: false }, items,
          stocks: { AAPL: { name: 'AAPL', held: true, qty: 40, avg: 100, now: 150 }, MSFT: { name: 'MSFT', held: false, now: 50 }, ORCL: { name: 'ORCL', held: true, qty: 2, avg: 10, now: 12 } }, opinions: [], decide: [] };
      }
      if (a === 'leadGet' && q.mode === 'newsDay') {
        if (m === 'empty') return { ok: true, items: [] };
        return { ok: true, items: q.mk === 'US' ? [
          news('US', 'NVDA', today, '09:10', '[새 뉴스 제목]', '좋음 — [영향 한 줄]'), news('US', 'NVDA', y, '22:00', '[어제 뉴스 제목]', '중립'),
          news('US', 'ORCL', y, '07:00', '[계좌 보유 종목 뉴스]', '나쁨 — [영향]'), news('US', 'TSLA', today, '10:00', '[관심 종목 뉴스]', '중립'),
          news('US', 'NVDA', old, '07:00', '[오래된 뉴스]', '중립'), news('US', 'ZZZZ', today, '07:00', '[내 종목이 아닌 뉴스]', '중립')] : [news('KR', '005930', today, '08:00', '[한국 보유 뉴스]', '좋음 — [영향]')] };
      }
      if (a === 'getOhlcv') return { ok: true, rows: Array.from({ length: 120 }, (_, i) => ({ Date: _gdAdd(today, i - 120), Open: 100 + i, High: 102 + i, Low: 99 + i, Close: 101 + i, Volume: 1000, Ticker: q.ticker })) };
      return { ok: false };
    };
    localStorage.removeItem('aqAiRead1'); localStorage.removeItem('aqAiTold1'); localStorage.removeItem('aq_session_token');
    const st = document.createElement('style'); st.textContent = '#aqAuth, #splashOverlay { display: none !important; }'; document.head.appendChild(st);
  }, o);
  await p.waitForFunction(() => window.AQ_AI.state.shown, null, { timeout: 20000 });
  await wait(1500);
  return { p, ctx, errs };
}
const admin = p => p.evaluate(() => { lsSet(lsKeyPF('US'), [{ ticker: 'NVDA' }]); lsSet(lsKeyPF('KR'), [{ ticker: '005930' }]); AqWatchStore.getAll = () => [{ ticker: 'TSLA', market: 'US' }]; document.body.setAttribute('data-role', 'admin'); try { _aqAuth.user = { role: 'admin' }; } catch (e) {} });
const M = p => p.evaluate(() => {
  const d = document.getElementById('aqAiDock'), q = s => d.querySelector(s), seen = e => !!e && !!e.getClientRects().length, r = e => e.getBoundingClientRect();
  const cards = q('.aid-cards'), c = q('.aid-c'), bar = q('.aid-bar'), orb = document.getElementById('aqAi'), dots = d.querySelectorAll('.aid-dots button'), ind = q('.aid-dots i'), cnt = q('.aid-count');
  const small = [...d.querySelectorAll('.aid-ok, .aid-btn, .aid-pills .xtab-btn')].filter(seen).filter(e => r(e).height + (e.classList.contains('xtab-btn') ? 4 : 0) < 43.5).map(e => e.className);
  const cut = [...d.querySelectorAll('.aid-btn, .aid-tag, .aid-pills .xtab-btn, .aid-msg')].filter(seen).filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.slice(0, 24));
  return { mode: AQ_AI.panel.mode, bar: seen(bar) ? Math.round(r(bar).width) : 0, barL: seen(bar) ? Math.round(r(bar).left) : null, barR: seen(bar) ? Math.round(r(bar).right) : null, barT: seen(bar) ? Math.round(r(bar).top) : null,
    orbR: Math.round(r(orb).right), orbT: Math.round(r(orb).top), msg: seen(q('.aid-msg')) ? q('.aid-msg').textContent : '', pills: seen(q('.aid-pills')) ? [...q('.aid-pills').querySelectorAll('.xtab-btn')].map(b => b.textContent + (b.classList.contains('active') ? '*' : '')).join(' ') : '',
    badge: seen(document.getElementById('aqAiN')) ? document.getElementById('aqAiN').textContent : '', text: seen(cards) ? cards.textContent.replace(/\s+/g, ' ').trim() : '', cardW: seen(c) ? Math.round(r(c).width) : 0, cardT: seen(c) ? Math.round(r(c).top) : null, cardB: seen(c) ? Math.round(r(c).bottom) : null,
    dots: dots.length, dotOff: ind && dots.length ? Math.round(r(ind).left + r(ind).width / 2 - r(dots[[...dots].findIndex((x, i) => Math.abs(r(x).left + 7 - (r(ind).left + r(ind).width / 2)) < 7)] || dots[0]).left - 7) : 0, count: cnt ? cnt.textContent : '', small, cut,
    overflow: document.documentElement.scrollWidth - innerWidth };
});
const reads = p => p.evaluate(() => window.__calls.filter(c => c[0] === 'managerToday' || (c[0] === 'leadGet' && c[1].mode === 'newsDay')).length);
const orbClick = async p => { await p.click('#aqAi'); await wait(900); };

(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let { p, ctx, errs } = await open(b);

  /* 관리자가 아니면 예전 그대로 */
  await orbClick(p);
  ok('관리자가 아니면: 「준비 중」 알림만 · 자료를 묻지 않음', await p.evaluate(() => /AI 비서는 준비 중이에요/.test((document.getElementById('aqTs') || {}).textContent || '') && AQ_AI.panel.mode === 'rest') && await reads(p) === 0);
  await wait(2500);

  /* 새 소식 → 한 줄 */
  await admin(p); await p.waitForFunction(() => AQ_AI.panel.mode === 'bubble', null, { timeout: 15000 }); await wait(900);
  let m = await M(p);
  // 안 본 소식 = 결정 2 + 뉴스 종목 4 (NVDA · ORCL · TSLA · 005930)
  ok('도착: 구슬에서 한 줄 「결정할 것 2건」 · 배지 6', /^결정할 것 2건/.test(m.msg) && m.badge === '6' && m.bar > 150 && Math.abs(m.barR - m.orbR) <= 2 && Math.abs(m.barT - m.orbT) <= 2 && !m.cut.length, JSON.stringify(m));
  await p.screenshot({ path: path.join(OUT, 'ai_bubble.png') });
  const asked = await p.evaluate(() => window.__calls.filter(c => c[0] === 'leadGet' && c[1].mode === 'newsDay').map(c => c[1].mk + ':' + c[1].tickers.split(',').sort().join('+')));
  ok('묻는 종목 = 보유 · 관심 · 계좌 보유만', asked.join(' ') === 'US:AAPL+NVDA+ORCL+TSLA KR:005930', asked.join(' '));
  await p.waitForFunction(() => AQ_AI.panel.mode === 'rest', null, { timeout: 9000 }); await wait(900);
  m = await M(p); ok('한 줄은 잠시 뒤 접히고 배지만 남음', m.bar === 0 && m.badge === '6', JSON.stringify(m));

  /* 펼침 */
  await orbClick(p); m = await M(p);
  ok('펼침: 알약 전체·결정·뉴스 · 카드 한 장 · 배지 숨김', m.mode === 'open' && m.pills === '전체* 결정 뉴스' && m.badge === '' && m.bar === 358 && m.cardW === 358 && m.dots === 6, JSON.stringify(m));
  ok('펼침: 첫 장 = 결정할 것(매도 제안 · 남은 시간)', /결정할 것/.test(m.text) && /AAPL 10주 매도 제안/.test(m.text) && /00:00까지/.test(m.text) && /하나씩 결정하기/.test(m.text), m.text);
  ok('펼침: 카드는 막대 위 · 화면 안 · 누르는 곳 44 · 잘림 없음 · 가로 넘침 없음', m.cardB < m.barT && m.cardT > 0 && !m.small.length && !m.cut.length && m.overflow <= 0, JSON.stringify(m));
  await p.screenshot({ path: path.join(OUT, 'ai_open.png') });
  // 뒤 화면을 스크롤해도 구슬이 숨지 않음
  await p.evaluate(() => { const s = document.createElement('div'); s.id = '__tall'; s.style.height = '3000px'; document.body.appendChild(s); window.scrollTo(0, 200); }); await wait(300); await p.evaluate(() => window.scrollTo(0, 600)); await wait(900);
  m = await M(p); ok('펼친 동안 스크롤: 구슬 · 막대가 그대로', Math.abs(m.barR - m.orbR) <= 2 && m.orbR <= 390 && m.mode === 'open', JSON.stringify(m));
  await p.evaluate(() => { window.scrollTo(0, 0); document.getElementById('__tall').remove(); }); await wait(600);

  /* 밀어 넘기기 */
  const box = await p.locator('#aqAiDock .aid-c').boundingBox();
  await p.mouse.move(box.x + box.width - 40, box.y + 70); await p.mouse.down(); await p.mouse.move(box.x + 60, box.y + 72, { steps: 8 }); await p.mouse.up(); await wait(900);
  m = await M(p); ok('왼쪽으로 밀면 다음 장 · 점이 따라감', /MSFT 5주 매수 제안/.test(m.text) && Math.abs(m.dotOff) <= 1, JSON.stringify(m));

  /* 뉴스 */
  await p.click('#aqAiDock [data-k="news"]'); await wait(900); m = await M(p);
  ok('뉴스: 종목마다 새 것 한 장(4) · 오늘 것이 먼저 · 오래된 것 · 남의 종목 없음', m.pills === '전체 결정 뉴스*' && m.dots === 4 && /관심 뉴스.*TSLA · \[관심 종목 뉴스\]/.test(m.text), JSON.stringify(m));
  await p.click('#aqAiDock .aid-dots [data-p="1"]'); await wait(900); m = await M(p);
  ok('뉴스: 보유 딱지 · 같은 종목 2건 표시', /보유 뉴스/.test(m.text) && /NVDA · \[새 뉴스 제목\]/.test(m.text) && /뉴스 2건/.test(m.text), m.text);
  const h0 = m.cardB - m.cardT; await p.click('#aqAiDock [data-more]'); await wait(600); m = await M(p);
  ok('더 보기: 요약 전체 + 영향', m.cardB - m.cardT > h0 + 30 && /영향좋음/.test(m.text.replace(/영향 /, '영향')) && /접기/.test(m.text) && m.cardT > 0 && !m.cut.length, JSON.stringify(m));
  await p.screenshot({ path: path.join(OUT, 'ai_news.png') });
  ok('원문 = 새 창 링크', await p.evaluate(() => { const a = document.querySelector('#aqAiDock a.aid-btn'); return a.target === '_blank' && /^https:\/\/example\.com\//.test(a.href) && /noopener/.test(a.rel); }));

  /* 종목 보기 (공개 시세에 있는 NVDA) */
  await p.click('#aqAiDock [data-go="stock"]'); await wait(2500);
  ok('종목 보기: 접히고 종목 페이지가 열려 있음(되돌아가 닫히지 않음)', await p.evaluate(() => AQ_AI.panel.mode === 'rest' && document.getElementById('chartModal').classList.contains('active') && /NVDA/.test(document.getElementById('chartModal').textContent)));
  await p.evaluate(() => closeModal()); await wait(900);
  await orbClick(p); await p.click('#aqAiDock [data-k="news"]'); await wait(700); await p.click('#aqAiDock .aid-dots [data-p="1"]'); await wait(700);
  ok('뒤로가기 목록에는 비서가 한 번만', await p.evaluate(() => _sh.stack.filter(x => x === 'aqAiDock').length === 1), await p.evaluate(() => _sh.stack.join()));

  /* 확인 */
  await p.click('#aqAiDock [data-ok]'); await wait(1100); m = await M(p);
  ok('확인(✓): 그 종목 뉴스가 모두 빠짐(어제 것이 대신 안 나옴)', m.dots === 3 && !/NVDA/.test(m.text), JSON.stringify(m));
  ok('확인한 것은 이 기기에 남음', await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('aqAiRead1'))).filter(k => k.startsWith('n:US:NVDA:')).length === 2));
  await p.evaluate(() => AQ_AI.panel.load()); await wait(900); m = await M(p);
  ok('새로 받아도 확인한 것은 안 나옴', m.dots === 3 && !/NVDA/.test(m.text), JSON.stringify(m));

  /* 닫기: 구슬 · 뒤로가기 · ESC */
  await orbClick(p); m = await M(p); ok('구슬을 다시 누르면 접힘 · 배지 5', m.mode === 'rest' && m.bar === 0 && m.text === '' && m.badge === '5', JSON.stringify(m));
  const url0 = p.url(); await orbClick(p); await p.goBack(); await wait(900); m = await M(p); ok('뒤로가기: 비서만 접힘', m.mode === 'rest' && p.url() === url0, JSON.stringify(m));
  await orbClick(p); await p.keyboard.press('Escape'); await wait(900); m = await M(p); ok('ESC: 접힘', m.mode === 'rest', JSON.stringify(m));

  /* 아래 메뉴를 누르면 접고 그 메뉴로 */
  await orbClick(p); await p.click('#mobileTabBar button[data-mtab="schedule"], #mobileTabBar [data-mtab="schedule"]'); await wait(1300);
  ok('아래 메뉴: 접히고 그 메뉴로(되돌아오지 않음)', await p.evaluate(() => AQ_AI.panel.mode === 'rest' && document.body.getAttribute('data-mtab') === 'schedule'), await p.evaluate(() => AQ_AI.panel.mode + ' ' + document.body.getAttribute('data-mtab')));

  /* 하나씩 결정하기 (한국 화면에서 눌러도 미국으로) */
  await p.evaluate(() => setMarket('KR')); await wait(900); await orbClick(p); await p.click('#aqAiDock [data-k="decide"]'); await wait(700);
  await p.click('#aqAiDock [data-go="mgr"]'); await p.waitForSelector('#mg3Fl', { timeout: 15000 }).catch(() => {}); await wait(900);
  const g = await p.evaluate(() => ({ mode: AQ_AI.panel.mode, mk: getCurrentMarket(), tab: document.body.getAttribute('data-mtab'), atab: document.body.getAttribute('data-atab'), flow: (document.getElementById('mg3Fl') || {}).textContent || '' }));
  ok('하나씩 결정하기: 접히고 미국 AI 매니저의 결정 화면', g.mode === 'rest' && g.mk === 'US' && g.tab === 'auto' && g.atab === 'manager' && /AAPL/.test(g.flow), JSON.stringify({ ...g, flow: g.flow.slice(0, 80) }));
  await p.screenshot({ path: path.join(OUT, 'ai_flow.png') });
  ok('비서에서는 승인 · 주문 호출이 없음', await p.evaluate(() => !window.__calls.some(c => /managerApprove|managerReject/.test(c[0]))));
  await p.evaluate(() => aqMgr3Close()); await wait(900);

  ok('오류 없음', !errs.length, errs.join(' | '));
  await ctx.close();

  /* 빈 상태 · 실패 · 다시 */
  ({ p, ctx, errs } = await open(b, { data: 'empty' })); await admin(p); await wait(3000); await orbClick(p); m = await M(p);
  ok('소식이 없으면: 배지 없음 · 「새 소식이 없어요」', m.badge === '' && m.text === '새 소식이 없어요' && !m.dots, JSON.stringify(m));
  await ctx.close();
  ({ p, ctx, errs } = await open(b, { data: 'fail' })); await admin(p); await wait(3000); await orbClick(p); m = await M(p);
  ok('못 받으면: 알리고 「다시」', /소식을 불러오지 못했어요/.test(m.text) && /다시/.test(m.text), JSON.stringify(m));
  await p.evaluate(() => { window.__mode = 'full'; }); await p.click('#aqAiDock [data-retry]'); await wait(1500); m = await M(p);
  ok('「다시」: 받아서 보여 줌', m.dots === 6 && /매도 제안/.test(m.text), JSON.stringify(m));
  /* 로그아웃 */
  await p.evaluate(() => { try { _aqAuth.user = null; } catch (e) {} document.body.setAttribute('data-role', 'guest'); window.dispatchEvent(new Event('aq:logout')); }); await wait(900); m = await M(p);
  ok('로그아웃: 접히고 내용 · 배지가 지워짐', m.mode === 'rest' && m.bar === 0 && m.text === '' && m.badge === '', JSON.stringify(m));
  await ctx.close();

  /* 좁은 폰 · 밝은 화면 · 움직임 줄이기 · 넓은 화면 */
  for (const [tag, o] of [['360', { w: 360, h: 740 }], ['light', { light: true }], ['reduced', { rm: 'reduce' }], ['wide', { w: 1440, h: 900, wide: true }]]) {
    ({ p, ctx, errs } = await open(b, o)); if (o.light) await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); document.body.setAttribute('data-theme', 'light'); });
    await admin(p); await wait(tag === 'reduced' ? 3000 : 3200); await orbClick(p); await p.click('#aqAiDock [data-k="news"]'); await wait(900); await p.click('#aqAiDock [data-more]'); await wait(600);
    m = await M(p);
    const col = tag === 'wide' ? await p.evaluate(() => ({ L: Math.round(document.getElementById('aqAi').getBoundingClientRect().right) + 16, nav: Math.round(document.getElementById('mobileTabBar').getBoundingClientRect().right), wide: document.documentElement.classList.contains('aq-wide') })) : null;
    ok(tag + ': 막대 · 카드가 화면 안 · 잘림 · 넘침 없음', m.mode === 'open' && m.barL >= 8 && m.barR <= (o.w || 390) && m.cardT >= 0 && m.cardB < m.barT && !m.cut.length && !m.small.length && m.overflow <= 0 && Math.abs(m.barR - m.orbR) <= 2, JSON.stringify(m));
    if (col) ok('wide: 폰 칸 안에 열림(왼쪽 메뉴 · 오른쪽 칸을 덮지 않음)', col.wide && m.barR <= col.L && m.barL >= col.nav, JSON.stringify({ ...col, barL: m.barL, barR: m.barR }));
    await p.screenshot({ path: path.join(OUT, 'ai_' + tag + '.png') });
    ok(tag + ': 오류 없음', !errs.length, errs.join(' | '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? '실패 ' + fails : '모두 통과'); process.exit(fails ? 1 : 0);
})();
