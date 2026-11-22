// 섹터 시트 맨 위 기간별 평균 차트 시험 — node tools/ui-test/secchart.js   (v8.99: 각 기간 시작 = 1 · 뒤에 흐린 나스닥 · 3M/6M/1Y Tab pill · 종목 페이지 차트와 같은 모양)
//   서버 없이 file:// 로 열린다(URL=로 바꿀 수 있음) · CHANNEL=msedge · 지어낸 가격: 섹터 종목 A +1%/일 · B 0% · C −0.5%/일 → 하루 평균 +0.1667%, QQQ +0.2%/일 → 값을 직접 계산해 맞춰 봄
const { chromium } = require('playwright');
const path = require('path');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'file:///' + path.resolve(__dirname, '../../index.html').split(String.fromCharCode(92)).join('/');
const OUT = process.env.OUT || path.join(__dirname, 'out');
const SETUP = (withBm) => {
  const days = []; const d = new Date(Date.UTC(2026, 10, 20)); while (days.length < 420) { const w = d.getUTCDay(); if (w !== 0 && w !== 6) days.unshift(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() - 1); }
  const mk = (tk, c0, g) => days.map((dt, i) => { const c = c0 * Math.pow(1 + g, i); return { Ticker: tk, Date: dt, Open: c, High: c * 1.01, Low: c * 0.99, Close: c, Volume: 1000 }; });
  const sec = '🔬 반도체';
  const fake = { [sec]: [].concat(mk('AAA', 100, 0.01), mk('BBB', 50, 0), mk('CCC', 80, -0.005)), '📈 지수': withBm ? mk('QQQ', 300, 0.002) : mk('ZZZ', 10, 0) };
  Object.defineProperty(_state, 'sectors', { configurable: true, get() { return fake; }, set() {} });   // 앱의 늦은 데이터 불러오기가 지어낸 값을 덮지 못하게
  Object.defineProperty(_state, 'macroByMarket', { configurable: true, get() { return window.__macro || {}; }, set() {} });   // 앱이 가진 진짜 매크로 자료가 시험값을 흐리지 않게
  _state.tickerSectorMap = {}; _state.archive = [];
  window.fetchAdhocOhlcv = () => Promise.reject(new Error('test'));
  return { days, sec };
};
const OPEN = (sec) => { aqOpenSectorSheet(sec); };
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  for (const [vw, vh] of [[390, 800], [1000, 800]]) {
    const L = (vw < 600 ? '폰 ' : '와이드 ') + vw + ': ';
    const ctx = await b.newContext({ viewport: { width: vw, height: vh } }); const p = await ctx.newPage();
    p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
    await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'));
    const info = await p.evaluate(`(${SETUP.toString()})(true)`);
    await p.evaluate(`(${OPEN.toString()})(${JSON.stringify(info.sec)})`); await p.waitForTimeout(900);
    const data = () => p.evaluate(() => { const c = _aqSc.chart; if (!c) return null; const ds = c.data.datasets; const sec = ds.find(x => x._sec), bm = ds.find(x => x._bm); return { labels: c.data.labels, sec: sec.data, bm: bm ? bm.data : null, secColor: sec.borderColor, secW: sec.borderWidth, bmColor: bm ? bm.borderColor : null, bmW: bm ? bm.borderWidth : null, n: ds.length, w: c.canvas.clientWidth, h: c.canvas.clientHeight }; });
    const bd = (a, b2) => { let n = 0; const d = new Date(a + 'T00:00:00Z'), e = new Date(b2 + 'T00:00:00Z'); while (d < e) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w && w !== 6) n++; } return n; };
    const R = (1 + (0.01 + 0 - 0.005) / 3);   // 하루 평균 등락률 — 종목마다 같은 날 같은 비율이라 매일 같은 값 (A 는 오름 비율이 +1% 고정)
    for (const tf of ['3M', '6M', '1Y']) {
      if (tf !== '3M') { await p.click('#aqScTf [data-tf="' + tf + '"]'); await p.waitForTimeout(600); }
      const d = await data(); const first = d.labels[0], last = d.labels[d.labels.length - 1], k = bd(first, last);
      const exp = Math.pow(R, k), expB = Math.pow(1.002, k);
      ok(L + tf + ': 섹터 평균 선 시작 = 1 · 끝 = 하루 평균을 이어 곱한 값', Math.abs(d.sec[0] - 1) < 1e-9 && Math.abs(d.sec[d.sec.length - 1] - exp) < 1e-6, '끝 ' + d.sec[d.sec.length - 1].toFixed(5) + ' 기대 ' + exp.toFixed(5) + ' (' + k + '거래일)');
      ok(L + tf + ': 나스닥(QQQ) 선도 같은 시작일에 1 · 끝 = QQQ 비율', d.bm && Math.abs(d.bm[0] - 1) < 1e-9 && Math.abs(d.bm[d.bm.length - 1] - expB) < 1e-6, d.bm && d.bm[d.bm.length - 1].toFixed(5) + ' 기대 ' + expB.toFixed(5));
      const cutOk = await p.evaluate(([f, l, tf]) => { const c = _aqScCut(l, tf); return f >= c; }, [first, last, tf]);
      ok(L + tf + ': 시작일이 기간 안(' + (tf === '1Y' ? '365일' : tf === '6M' ? '180일' : '90일') + ')이고 끝은 마지막 거래일', cutOk && last === info.days[info.days.length - 1], first + ' → ' + last + ' · ' + d.labels.length + '점');
      ok(L + tf + ': 점 개수가 샘플링(3M 매일 · 6M 이틀에 한 칸 · 1Y 나흘에 한 칸)에 맞음', tf === '3M' ? d.labels.length === k + 1 : Math.abs(d.labels.length - (Math.floor(k / (tf === '6M' ? 2 : 4)) + 1)) <= 2, d.labels.length + '점 / ' + k);
      const hd = await p.evaluate(() => ({ s: document.getElementById('aqScSecV').textContent, b: document.getElementById('aqScBmV').textContent, bl: document.getElementById('aqScBmLb').textContent, act: document.querySelector('#aqScTf .xtab-btn.active').dataset.tf, ind: Math.round(parseFloat(document.querySelector('#aqScTf .aq-tp-ind').style.width) || 0) }));
      const pct = v => (v >= 1 ? '+' : '−') + Math.abs((v - 1) * 100).toFixed(1) + '%';
      ok(L + tf + ': 위 숫자 = 끝 값 퍼센트 · 알약이 고른 기간으로', hd.s === pct(d.sec[d.sec.length - 1]) && hd.b === pct(d.bm[d.bm.length - 1]) && hd.act === tf && hd.ind > 10, JSON.stringify(hd));
    }
    const d3 = await data();
    ok(L + '섹터 평균은 흰 굵은 선(2.5) · 나스닥은 흐린 선(반투명 · 더 가늘게)', d3.secColor === '#ffffff' && d3.secW === 2.5 && /rgba\(.*0\.\d+\)/.test(d3.bmColor) && d3.bmW < d3.secW && d3.n === 2, d3.secColor + ' ' + d3.secW + ' / ' + d3.bmColor + ' ' + d3.bmW);
    ok(L + '차트가 실제로 그려짐(폭 · 높이 0 아님)', d3.w > 150 && d3.h >= 200, d3.w + '×' + d3.h);
    // 십자 + 말풍선: 차트 위에 마우스
    const box = await p.locator('#aqScCanvas').boundingBox(); await p.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5); await p.waitForTimeout(250);
    ok(L + '마우스를 올리면 말풍선(섹터 평균 · 나스닥 둘 다)', await p.evaluate(() => { const t = _aqSc.chart.tooltip; return t.opacity > 0 && t.dataPoints.length === 2; }));
    await p.screenshot({ path: path.join(OUT, 'secchart_' + vw + '.png') });
    const m = await p.evaluate(() => { const sh = document.getElementById('aqSectorSheet'); return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, sc: sh.scrollHeight, ch: sh.clientHeight, ov: getComputedStyle(sh).overflowY, listOv: getComputedStyle(document.getElementById('aqSectorList')).overflowY, rows: document.querySelectorAll('#aqSectorList .insider-archive-item').length }; });
    ok(L + '가로 넘침 없음 · 시트는 전체가 스크롤(목록은 따로 안 스크롤) · 종목 3개 줄이 그대로', m.sw <= m.cw && m.ov === 'auto' && m.listOv === 'visible' && m.rows === 3, JSON.stringify(m));
    await p.evaluate(() => aqCloseSectorSheet());
    // 나스닥이 없을 때: 선 · 위 숫자 빼고 안내
    await p.evaluate(`(${SETUP.toString()})(false)`); await p.evaluate(() => { _aqSc.bmTried = true; });
    await p.evaluate(`(${OPEN.toString()})(${JSON.stringify(info.sec)})`); await p.waitForTimeout(700);
    const nb = await p.evaluate(() => ({ sec: _aqSc.chart && _aqSc.chart.data.datasets.length, bmHidden: document.getElementById('aqScBm').hidden, cap: document.getElementById('aqScCap').textContent }));
    ok(L + '나스닥 자료가 없으면 섹터 선만 · 위 숫자에서 나스닥 빠짐 · 안내 문구', nb.sec === 1 && nb.bmHidden && /나스닥 자료가/.test(nb.cap), JSON.stringify(nb));
    // 종목이 없는 섹터: 차트 숨김
    await p.evaluate(() => aqCloseSectorSheet()); await p.evaluate(() => { aqOpenSectorSheet('없는섹터'); }); await p.waitForTimeout(400);
    ok(L + '종목이 없는 섹터는 차트 칸을 숨김', await p.evaluate(() => document.getElementById('aqSecChart').hidden));
    // 매크로 나스닥 지수가 있으면 그것을 먼저 쓰고, 기간을 덮지 못하면(1Y) QQQ로
    await p.evaluate(() => { aqCloseSectorSheet(); });
    await p.evaluate(`(${SETUP.toString()})(true)`);
    await p.evaluate(() => { const days = _state.sectors['📈 지수'].map(r => r.Date).slice(-200); window.__macro = { US: days.map((d, i) => ({ Ticker: '나스닥 종합', Date: d, Close: 15000 * Math.pow(1.001, i) })) }; });
    await p.evaluate(`(${OPEN.toString()})(${JSON.stringify(info.sec)})`); await p.waitForTimeout(600);
    const names = {};
    for (const tf of ['3M', '6M', '1Y']) { if (tf !== '3M') { await p.click('#aqScTf [data-tf="' + tf + '"]'); await p.waitForTimeout(500); } names[tf] = await p.evaluate(() => document.getElementById('aqScBmLb').textContent); }
    ok(L + "매크로 나스닥 지수가 3M · 6M을 덮으면 '나스닥' · 1Y는 못 덮어 QQQ로",names['3M'] === '나스닥' && names['6M'] === '나스닥' && /QQQ/.test(names['1Y']), JSON.stringify(names));
    await ctx.close();
  }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
