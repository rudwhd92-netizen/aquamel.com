// 지금 가격 3초 시험 — node tools/ui-test/live3.js   (v9.46 · 가짜 가격 응답 · 실제 API는 막음)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => { if (!/discoverMotionView/.test(e.message)) errs.push(e.message); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'));
  await p.addStyleTag({ content: '.aq-auth{display:none!important} #splashOverlay{display:none!important}' });
  await p.waitForFunction(() => _state.archive && _state.archive.length > 100 && Object.keys(_state.sectors || {}).length, null, { timeout: 60000 });
  await p.waitForTimeout(8000);   // 첫 화면이 그려지고 앱의 첫 가격 요청(8초)이 지난 뒤
  await p.evaluate(() => { document.body.setAttribute('data-role', 'admin'); document.body.setAttribute('data-broker', 'linked'); });
  // 여기부터 가짜 로그인 값을 쓰므로 서버 API를 막음(값이 서버로 가지 않게)
  await ctx.route(/aquamel\.duckdns\.org\/api|script\.google\.com/, r => r.abort());
  await p.evaluate(() => {
    window.__calls = []; window.__px = {}; window.__ses = { key: 'regularMarket', label: '정규장', date: null }; window.__fail = false; window.__none = new Set();
    window.apiCall = async (action, params) => {
      if (action !== 'livePx') return { ok: false, error: 'test' };
      const tks = String(params.tickers).split(','); __calls.push({ t: Date.now(), n: tks.length, tks });
      if (__fail) throw new Error('fail');
      const prices = {}; tks.forEach(t => { if (!__none.has(t)) prices[t] = [__px[t] != null ? __px[t] : 100, new Date().toISOString()]; });
      return { ok: true, linked: true, session: __ses, prices };
    };
    localStorage.setItem('aq_session_token', 'test');
  });
  const wait = ms => p.waitForTimeout(ms);
  const calls = (since) => p.evaluate(s => __calls.filter(c => c.t >= s), since);
  const now = () => p.evaluate(() => Date.now());

  /* 전체 → 3초 */
  let t0 = await now(); await p.evaluate(() => aqLiveTick(true)); await wait(10500);
  let c = await calls(t0); const full = c.filter(x => x.n > 200), fast = c.filter(x => x.n <= 200);
  ok('전체 목록은 한 번 · 그 뒤는 200개 이하만', full.length === 1 && fast.length >= 2, c.map(x => x.n).join(','));
  const gap = fast.slice(1).map((x, i) => x.t - fast[i].t);
  ok('3초 간격', gap.length && gap.every(g => g > 2500 && g < 4000), gap.join(','));

  /* 목록: 보이는 줄만 · 값이 3초 안에 바뀜 */
  await p.evaluate(() => {
    const tks = [...new Set(Object.values(_state.sectors).flat().map(r => r && r.Ticker).filter(Boolean))].slice(0, 300);
    const box = document.createElement('div'); box.id = 't3'; box.style.cssText = 'position:absolute;left:0;top:0;width:390px;background:#161618;z-index:99999';
    box.innerHTML = tks.map(t => renderStockRow({ ticker: t, sector: '시험', close: 50, chg: 1 })).join(''); document.body.appendChild(box); window.__rows = tks; scrollTo(0, 0);
  });
  await wait(3500); t0 = await now(); await wait(3200);
  c = await calls(t0); const last = c[c.length - 1];
  const rowInfo = await p.evaluate(() => { const v = [...document.querySelectorAll('#t3 [data-lp]')].filter(r => { const x = r.getBoundingClientRect(); return x.bottom > 0 && x.top < innerHeight; }).map(r => r.dataset.lp); return { v, far: __rows[250] }; });
  ok('보이는 줄은 3초 갱신에 포함 · 멀리 있는 줄은 빠짐', !!last && rowInfo.v.every(t => last.tks.includes(t)) && !last.tks.includes(rowInfo.far), last && last.n + '종목 · 보이는 줄 ' + rowInfo.v.length);
  const first = rowInfo.v[1];
  await p.evaluate(t => { __px[t] = 123.45; }, first); await wait(3600);
  const shown = await p.evaluate(t => { const e = document.querySelector('#t3 [data-lp="' + t + '"]'); return [e._aqRoll, document.querySelector('#t3 [data-lc="' + t + '"]')._aqRoll]; }, first);
  ok('바뀐 가격이 3초 안에 화면에', /123\.45/.test(shown[0]) && /\+146\.90%/.test(shown[1]), shown.join(' · '));
  await p.evaluate(() => scrollTo(0, 100000)); await wait(3600); c = await calls(await now() - 3300);
  const bottom = await p.evaluate(() => __rows[__rows.length - 1]);
  ok('스크롤해서 보이면 3초 안에 들어옴', c.length && c[c.length - 1].tks.includes(bottom), bottom);

  /* 토스에 없는 코드는 3초 갱신에서 빠짐 */
  await p.evaluate(() => { scrollTo(0, 0); }); const gone = await p.evaluate(() => { const t = __rows[2]; __none.add(t); return t; }); await wait(7000);
  c = await calls(await now() - 3300);
  ok('값이 없는 코드는 다시 묻지 않음', c.length && !c[c.length - 1].tks.includes(gone), gone);
  await p.evaluate(() => { __none.clear(); document.getElementById('t3').remove(); scrollTo(0, 0); });

  /* 차트: 값이 그대로면 다시 그리지 않음 */
  await p.evaluate(() => openChart('CL')); await wait(5000);
  await p.waitForFunction(() => _chart && _chart.$liveTk, null, { timeout: 15000 }).catch(() => {});
  await p.evaluate(() => { __px.CL = 111; }); await wait(4000);
  await p.evaluate(() => { window.__upd = 0; const u = _chart.update.bind(_chart); _chart.update = (...a) => { __upd++; return u(...a); }; }); t0 = await now(); await wait(7000);
  const idle = await p.evaluate(() => __upd); c = await calls(t0);
  ok('종목 창: 3초마다 그 종목을 받음', c.length >= 2 && c.every(x => x.tks.includes('CL')), c.map(x => x.n).join(','));
  ok('값이 그대로면 차트를 다시 그리지 않음', idle === 0, 'update ' + idle + '번');
  await p.evaluate(() => { __px.CL = 112; }); await wait(3800);
  const moved = await p.evaluate(() => ({ u: __upd, px: _chart.$livePx, head: (document.querySelector('#modalPrice .mp-v') || {})._aqRoll }));
  ok('값이 바뀌면 차트 · 가격 줄이 따라감', moved.u >= 1 && moved.px === 112 && /112/.test(moved.head || ''), JSON.stringify(moved));
  await p.screenshot({ path: path.join(OUT, 'live3_modal.png') });
  await p.evaluate(() => closeChart && closeChart()).catch(() => p.keyboard.press('Escape')); await wait(1200);

  /* 포트폴리오: 숫자만 바뀌고 전체는 다시 그리지 않음 */
  await p.evaluate(() => {
    const H = ['CL', 'WMB', 'ELV', 'PLD'].map((t, i) => ({ ticker: t, qty: 10, cost: 900, curPrice: 100, avgpx: 90, evalVal: 1000, roi: 11, sector: '시험' }));
    _dashLastComputed = { holdings: H, allHoldings: H }; switchMobileTab('board'); setBoardSubtab('portfolio'); aqPvRender(H);
  });
  await wait(4500);
  await p.evaluate(() => { document.querySelector('#aqPvTop .pv-hero').__keep = 1; });
  const before = await p.evaluate(() => document.querySelector('#aqPvTop .pv-hero').innerText);
  await p.evaluate(() => { __px.CL = 130; __px.WMB = 104; }); await wait(4200);
  const pv = await p.evaluate(() => { const h = document.querySelector('#aqPvTop .pv-hero'); const row = document.querySelector('#dashHoldingsBody .pv-tr[data-ticker="CL"] .pv-r'); return { keep: !!h.__keep, sum: h.querySelector(':scope > b')._aqRoll || h.querySelector(':scope > b').textContent, day: h.querySelectorAll(':scope > div > span')[1].textContent, row: row && row.innerText.replace(/\n/g, ' '), block: row && getComputedStyle(row.querySelector('span')).display }; });
  ok('포트폴리오: 화면은 그대로 두고 숫자만 바뀜', pv.keep && /4,340/.test(pv.sum), JSON.stringify(pv) + ' / 처음 ' + before.replace(/\n/g, ' '));
  ok('보유 줄 숫자도 바뀜', !pv.row || (/1,300/.test(pv.row) && /\+30/.test(pv.row)), pv.row);
  await p.screenshot({ path: path.join(OUT, 'live3_pv.png') });

  /* 장이 닫히면 멈춤 */
  await p.evaluate(() => { __ses = null; }); await wait(4000); t0 = await now(); await wait(7000);
  ok('장이 닫히면 3초 갱신이 멈춤', (await calls(t0)).filter(x => x.n <= 200).length === 0);
  /* 실패하면 뜸하게 */
  await p.evaluate(() => { __ses = { key: 'regularMarket', label: '정규장', date: null }; return aqLiveTick(true); }); await wait(500);
  await p.evaluate(() => { __fail = true; }); t0 = await now(); await wait(20000);
  const bad = await calls(t0);
  ok('실패가 이어지면 점점 뜸하게', bad.length >= 1 && bad.length <= 3, bad.length + '번 / 20초');
  ok('페이지 오류 0건', errs.length === 0, errs.slice(0, 3).join(' | '));
  await ctx.close(); await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); process.exit(fails ? 1 : 0);
})();
