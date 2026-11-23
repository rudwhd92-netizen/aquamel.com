// 관심 › 모의 매수(v9.12) 시험 — node tools/ui-test/watch.js   (발견과 같은 모양: 위 「관심 종목」 로고 줄 · 아래 종목 피드 · 모의매수가 가로선 · 최근에 담은 순서 · 들어올 때마다 통통 · 선 그어짐)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · URL=배포주소 로 실제 사이트도 가능 · CHANNEL=msedge
//   로그인 없이 시험하려고 관심 종목 4개를 시험용으로 이 브라우저(localStorage)에 넣는다 — 담은 때 · 기준 주가는 가짜 값(실제 데이터가 아님).
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
async function run(reduce) {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR ' + e.message); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); });
  await p.waitForFunction(() => _state.archive && _state.archive.length > 100, null, { timeout: 30000 }).catch(() => console.log('(아카이브 로딩 대기 시간 초과)'));
  await p.waitForFunction(() => Object.keys(_state._tickerOhlcv || {}).length > 5, null, { timeout: 40000 }).catch(() => console.log('(시세 로딩 대기 시간 초과)'));
  const R = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)); const out = {};
    // 시험용 관심 종목 4개: 시세가 있는 종목 중에서 · 기준가는 지금 가격의 0.8배(+25%) · 1.25배(−20%) · 0.97배 · 1.6배(기간 가격 범위 밖) · 담은 때는 3일 · 2일 · 1일 · 오늘 전
    const tks = []; for (const r of (_state.archive || [])) { const t = r.Ticker; if (t && !tks.includes(t) && findTickerSeries(t) && findTickerSeries(t).rows.length > 90) tks.push(t); if (tks.length >= 4) break; }
    out.tks = tks; const f = [0.8, 1.25, 0.97, 1.6], day = 864e5, now = Date.now(); const o = {}; const mk = getCurrentMarket();
    tks.forEach((t, i) => { const px = _aqLatestClose(t); o[mk + ':' + t] = { ticker: t, market: mk, col: 'short', addedAt: new Date(now - (3 - i) * day - 3600e3).toISOString(), order: i, buyPrice: +(px * f[i]).toFixed(2) }; });
    localStorage.setItem('aq_watchlist_v1', JSON.stringify(o)); out.exp = {}; tks.forEach((t, i) => { out.exp[t] = { px: _aqLatestClose(t), bp: o[mk + ':' + t].buyPrice }; });
    // ① 들어옴 — 로고 줄 + 피드 + 움직임 표본
    switchMobileTab('discover'); await wait(400);
    const runEnter = async () => {
      const smp = []; let iv = setInterval(() => { const els = [...document.querySelectorAll('#wlStrip .buy-point-item')]; smp.push({ t: performance.now(), f: els.map(e => [+(+e.style.opacity || (e.style.opacity === '' ? 1 : 0)).toFixed(2), e.style.transform]) }); }, 30);   // 표본마다 시각도 적음(화면 그리기가 몰리면 표본 간격이 늘어나서 개수로 세면 틀림)
      switchMobileTab('interest'); await wait(3800); clearInterval(iv);   // 네 번째 로고는 0.5초 늦게 시작하고 스프링 꼬리가 길어 넉넉히 기다림
      return smp;
    };
    out.enter1 = await runEnter();
    out.atab = document.body.getAttribute('data-atab'); out.mtab = document.body.getAttribute('data-mtab');
    out.strip = [...document.querySelectorAll('#wlStrip .buy-point-item')].map(e => ({ tk: e.dataset.ticker, ret: (e.querySelector('.bp-ret') || {}).textContent, cls: (e.querySelector('.bp-ret') || {}).className, op: e.style.opacity, tr: e.style.transform }));
    out.feedOrder = [...document.querySelectorAll('#wlFeed .feed-item')].map(e => e.dataset.ticker);
    out.chips = [...document.querySelectorAll('#wlFeed .feed-hold[data-wl]')].map(e => e.getAttribute('aria-label') || e.textContent);   // 굴러가는 숫자판은 속 글자가 아니라 aria-label(값)
    out.subs = [...document.querySelectorAll('#wlFeed .feed-sub')].map(e => e.textContent);
    out.title = (document.querySelector('#watchBoardCard > .card-header h2') || {}).textContent; out.titleShown = !!(document.querySelector('#watchBoardCard > .card-header') || {}).offsetParent;
    // ② 차트 — 가까이 가져가 그림 · 모의매수가 가로선 · 축 범위 · 그어짐
    const rv = {}; const iv2 = setInterval(() => document.querySelectorAll('#wlFeed .feed-item').forEach(it => { const cv = it.querySelector('canvas'), ch = cv && cv._aqChart; if (ch && ch.$rv) (rv[it.dataset.ticker] = rv[it.dataset.ticker] || []).push(+ch.$rv.x.toFixed(2)); }), 30);
    document.querySelectorAll('#wlFeed .feed-item').forEach(it => it.scrollIntoView()); await wait(300);
    document.querySelectorAll('#wlFeed .feed-item').forEach(it => { try { if (!it.querySelector('canvas')._aqChart) aqRenderFeedChart(it, it.dataset.ticker, '3M'); } catch (e) {} });
    await wait(1800); clearInterval(iv2); window.scrollTo(0, 0); out.rv = rv;
    out.chart = [...document.querySelectorAll('#wlFeed .feed-item')].map(it => { const ch = it.querySelector('canvas')._aqChart; if (!ch) return { tk: it.dataset.ticker, none: 1 }; const a = ((ch.options.plugins.annotation || {}).annotations || {}).simBuy, y = ch.scales.yPrice; return { tk: it.dataset.ticker, has: !!a, yMin: a && a.yMin, lo: y.min, hi: y.max }; });
    // ③ 다른 발견 피드 차트에는 모의매수 선이 없어야 함
    switchMobileTab('discover'); await wait(600); const d0 = document.querySelector('#feedScroll .feed-item canvas'); if (d0 && !d0._aqChart) { try { const it = d0.closest('.feed-item'); aqRenderFeedChart(it, it.dataset.ticker, '3M'); } catch (e) {} }
    const dc = d0 && d0._aqChart; out.discoverSim = dc ? !!(((dc.options.plugins.annotation || {}).annotations || {}).simBuy) : null;
    // ④ 다시 들어옴 — 로고가 다시 통통 · 비교분석 다녀오기
    out.enter2 = await runEnter();
    setAiSubtab('cmp'); await wait(300); out.cmpShown = { feed: !!(document.getElementById('watchFeedCard') || {}).offsetParent, strip: !!(document.getElementById('watchBoardCard') || {}).offsetParent, cmp: !!(document.getElementById('compareCard') || {}).offsetParent };
    const smp3 = []; const iv3 = setInterval(() => smp3.push([...document.querySelectorAll('#wlStrip .buy-point-item')].map(e => +(+e.style.opacity || (e.style.opacity === '' ? 1 : 0)).toFixed(2))), 30);
    setAiSubtab('sim'); await wait(2200); clearInterval(iv3); out.enter3 = smp3;
    // ⑤ ♥ 빼기는 한 번 물음
    const heart = document.querySelector('#wlFeed .feed-item .feed-act'); const n0 = AqWatchStore.getAll().length; let asked = 0;
    window.aqConfirm = async () => { asked++; return false; }; await aqFeedToggleWatch(heart.closest('.feed-item').dataset.ticker, heart); const n1 = AqWatchStore.getAll().length;
    window.aqConfirm = async () => { asked++; return true; }; await aqFeedToggleWatch(heart.closest('.feed-item').dataset.ticker, heart); await wait(300); const n2 = AqWatchStore.getAll().length;
    out.heart = { asked, n0, n1, n2, strip: document.querySelectorAll('#wlStrip .buy-point-item').length, feed: document.querySelectorAll('#wlFeed .feed-item').length };
    return out;
  });
  await b.close(); return { R, errs };
}
const num = s => parseFloat(String(s).replace(/[^\d.\-+]/g, ''));
(async () => {
  const m = await run(false); const R = m.R;
  ok('시험용 관심 종목 4개를 만듦(시세 있는 종목)', R.tks.length === 4, R.tks.join(' '));
  ok('관심 메뉴로 들어오면 모의 매수 · 제목 「관심 종목」이 보임', R.atab === 'sim' && R.mtab === 'auto' && R.title === '관심 종목' && R.titleShown, R.title);
  const exp = R.tks.slice().reverse();   // 마지막에 담은(오늘) 것이 맨 앞
  ok('로고 줄 순서 = 최근에 관심 누른 순서', JSON.stringify(R.strip.map(x => x.tk)) === JSON.stringify(exp), R.strip.map(x => x.tk).join(' '));
  ok('피드 순서도 같음', JSON.stringify(R.feedOrder) === JSON.stringify(exp), R.feedOrder.join(' '));
  ok('로고 등락률 = 담은 기준가에서 지금까지', R.strip.every(x => { const e = R.exp[x.tk]; return Math.abs(num(x.ret) - (e.px / e.bp - 1) * 100) < 0.11; }), R.strip.map(x => x.tk + ' ' + x.ret).join(' · '));
  ok('올라간 종목은 up · 내린 종목은 down 색', R.strip.every(x => { const e = R.exp[x.tk]; return e.px > e.bp ? /\bup\b/.test(x.cls) : /\bdown\b/.test(x.cls); }), R.strip.map(x => x.cls).join(' | '));
  ok('피드 이름 줄에 「관심 ±n%」가 같은 값', R.chips.length === 4 && R.chips.every((t, i) => { const e = R.exp[R.feedOrder[i]]; return /^관심 /.test(t) && Math.abs(num(t) - (e.px / e.bp - 1) * 100) < 0.11; }), R.chips.join(' · '));
  ok('피드 둘째 줄에 기준가 · 담은 때', R.subs.length === 4 && R.subs.every(t => /기준 /.test(t) && /(오늘|일 전) 담음/.test(t)), R.subs[0]);
  ok('피드 차트에 모의매수가 가로선이 있고 축 범위 안(범위 밖 기준가도)', R.chart.length === 4 && R.chart.every(c => c.has && c.yMin >= c.lo && c.yMin <= c.hi), R.chart.map(c => c.tk + ' ' + c.yMin + ' [' + (c.lo || 0).toFixed(1) + ',' + (c.hi || 0).toFixed(1) + ']').join(' | '));
  ok('발견 피드 차트에는 모의매수 선이 없음(관심 피드만)', R.discoverSim === false || R.discoverSim === null, String(R.discoverSim));
  const rvs = Object.values(R.rv); if (rvs.length) ok('피드 차트 선이 왼쪽에서 그어짐', rvs.some(a => a.some(x => x > 0.05 && x < 0.95)), rvs.map(a => a.slice(0, 6).join(',')).join(' | ')); else console.log('SKIP 그어짐 표본 없음');
  // 로고: 처음 숨었다가 · 차례로 · 끝에 제자리
  const col = (smp, i) => smp.map(x => x.f[i] && x.f[i][0]).filter(x => x != null);
  const first = (smp, i, th) => { const x = smp.find(q => q.f[i] && q.f[i][0] >= th); return x ? x.t : -1; };   // 처음 th 이상이 된 시각(ms)
  for (const [nm, smp] of [['첫 들어옴', R.enter1], ['다시 들어옴', R.enter2]]) {
    ok('로고 ' + nm + ': 처음엔 숨음 · 끝엔 제자리', col(smp, 0).some(x => x < 0.2) && smp.at(-1).f.every(v => v[0] === 1) && R.strip.every(x => x.op === '' && x.tr === ''), 'min ' + Math.min(...col(smp, 0)) + ' · 끝 ' + JSON.stringify(smp.at(-1).f.map(v => v[0])));
    const a = first(smp, 0, .5), c = first(smp, 2, .5); ok('로고 ' + nm + ': 하나씩 차례로(첫째가 셋째보다 확실히 먼저)', a >= 0 && c >= 0 && c - a >= 200, '첫째와 셋째 사이 ' + Math.round(c - a) + 'ms (간격 160ms × 2 = 320ms 기대)');
  }
  ok('비교분석으로 가면 피드 · 로고 줄은 숨고 비교분석이 보임', !R.cmpShown.feed && !R.cmpShown.strip && R.cmpShown.cmp, JSON.stringify(R.cmpShown));
  ok('비교분석에서 모의 매수로 돌아와도 로고가 다시 통통', R.enter3.map(f => f[0]).some(x => x < 0.2) && R.enter3.at(-1).every(v => v === 1), 'min ' + Math.min(...R.enter3.map(f => f[0])));
  ok('피드 ♥를 눌러 빼기 — 한 번 묻고 · 아니오면 그대로 · 예면 빠짐(줄 · 피드 모두)', R.heart.asked === 2 && R.heart.n0 === 4 && R.heart.n1 === 4 && R.heart.n2 === 3 && R.heart.strip === 3 && R.heart.feed === 3, JSON.stringify(R.heart));
  ok('오류 없음', m.errs.length === 0, m.errs.join(' | '));
  const r = await run(true);
  ok('움직임 줄이기: 로고가 처음부터 제자리(숨김 없음) · 오류 없음', r.R.enter1.every(x => x.f.every(v => v[0] === 1 && v[1] === '')) && r.errs.length === 0, '');
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
