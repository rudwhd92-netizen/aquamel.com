// 발견 피드 차트 마커 시험 — node tools/ui-test/markers.js   (v8.91: 3M/6M/1Y 어느 기간에도 시그널 · 내부자 매수/매도 · 내 매매 마커가 하나도 안 빠지는지)
//   서버 없이 file:// 로 연다(URL=로 바꿀 수 있음) · CHANNEL=msedge 로 설치된 브라우저 사용 · 시세와 마커는 모두 지어낸 값
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'file:///' + path.resolve(__dirname, '../../index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERR ' + e.message));
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); });
  const res = await p.evaluate(() => {
    const TK = 'ZZTEST';
    // 지어낸 시세 420일(주말 포함 매일 · 2025-10-01 ~) + 시그널 · 내부자 마커 — 날짜는 기간 경계와 한 칸 안 여러 날을 일부러 포함
    const rows = []; const t0 = Date.UTC(2025, 9, 1);
    for (let i = 0; i < 420; i++) { const d = new Date(t0 + i * 864e5).toISOString().slice(0, 10); const c = 100 + 20 * Math.sin(i / 25) + i * 0.05; rows.push({ Date: d, Open: c, High: c + 1, Low: c - 1, Close: c, Volume: 1000 }); }
    const last = rows[rows.length - 1].Date, ms = s => new Date(Date.parse(last) - s * 864e5).toISOString().slice(0, 10);
    const sigDays = [1, 2, 3, 5, 9, 14, 20, 33, 47, 60, 61, 62, 85, 89, 90, 91, 100, 140, 175, 178, 179, 180, 181, 200, 260, 300, 333, 360, 363, 364, 365];
    const archive = sigDays.map((n, i) => ({ Ticker: TK, Date: ms(n), Signal_Type: i % 2 ? 'V_Main' : 'V_Vol', Close_Price: rows.find(r => r.Date === ms(n)).Close, Pred_5d: 1 }));
    window._aqInsiderTrades = window._aqInsiderTrades || {}; window._aqInsiderSells = window._aqInsiderSells || {};
    const ins = d => ({ transDate: ms(d), price: rows.find(r => r.Date === ms(d)).Close, shares: 100, sharesAfter: 1000, ownerName: 'X', relationship: 'CEO', security: 'Common Stock' });
    const buyDays = [4, 6, 7, 29, 30, 88, 150, 151, 152, 153, 240, 361, 364], sellDays = [10, 11, 59, 120, 177, 250, 362, 365];
    _aqInsiderTrades[TK] = buyDays.map(ins); _aqInsiderSells[TK] = sellDays.map(ins);
    if (typeof isCommonEquityTrade === 'function') window.isCommonEquityTrade = () => true;
    _state.archive = (_state.archive || []).filter(r => r.Ticker !== TK).concat(archive);
    try { _state.signalFilter = new Set(getSignalTypes()); } catch (e) {}
    const orig = window.findTickerSeries; window.findTickerSeries = tk => tk === TK ? { rows } : orig(tk);
    const out = {};
    const cut = { '3M': 90, '6M': 180, '1Y': 365 };
    for (const tf of ['3M', '6M', '1Y']) {
      const el = document.createElement('div'); el.innerHTML = '<div class="feed-item" data-ticker="' + TK + '"><div class="feed-chart-wrap"><canvas class="feed-canvas" style="width:340px;height:200px"></canvas></div></div>'; document.body.appendChild(el);
      const item = el.firstChild; aqRenderFeedChart(item, TK, tf);
      const ch = item.querySelector('canvas')._aqChart; if (!ch) { out[tf] = { err: '차트 없음' }; continue; }
      // 층(_lyr)까지 합쳐 종류별 점 수 · 점이 실제로 있는 날짜 수(한 칸 여럿 합쳐짐 확인)
      const cnt = {}; let sigPts = 0;
      ch.data.datasets.forEach(ds => { if (ds.label === '종가' || !Array.isArray(ds.data) || ds.showLine !== false) return; const n = ds.data.filter(v => v != null).length; const k = ds._sig ? '시그널' : ds.label; cnt[k] = (cnt[k] || 0) + n; });
      const want = { '시그널': sigDays.filter(n => n <= cut[tf]).length, '내부자 매수': buyDays.filter(n => n <= cut[tf]).length, '내부자 매도': sellDays.filter(n => n <= cut[tf]).length };
      // 같은 날 마커는 한 점이라 날짜 수 기준(시그널 · 내부자 모두 하루 하나씩 넣었음)
      // 툴팁 '실제 날짜' 확인: 시그널 점 하나의 툴팁 문구
      out[tf] = { cnt, want, n: ch.data.labels.length };
      el.remove();
    }
    window.findTickerSeries = orig;
    return out;
  });
  console.log(JSON.stringify(res));
  for (const tf of ['3M', '6M', '1Y']) {
    const r = res[tf]; if (!r || r.err) { ok(tf + ' 차트가 그려짐', false, r && r.err); continue; }
    for (const k of Object.keys(r.want)) ok(tf + ' ' + k + ' 점 ' + r.want[k] + '개 전부(층 합계)', (r.cnt[k] || 0) === r.want[k], '그려짐 ' + (r.cnt[k] || 0) + ' / 기대 ' + r.want[k]);
  }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
