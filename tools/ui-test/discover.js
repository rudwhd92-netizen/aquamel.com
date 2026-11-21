// 발견 피드 차트 시험 — node tools/ui-test/discover.js   (v8.78: 3M/6M/1Y 알약 크기 · 기간을 바꾸는 도중과 뒤에 종가선이 차트 틀 밖으로 나가지 않는지)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다 · 피드가 그려지려면 저장소의 data 폴더가 같이 서빙돼야 한다
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'http://localhost:8773/index.html';
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERR ' + e.message));
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); });
  await p.evaluate(() => switchMobileTab('discover')); await p.waitForTimeout(2500);
  await p.evaluate(() => { const r = document.getElementById('aqDiscoverCategories'); if (r) { r.querySelector('[data-kind="signal"]').click(); } }); await p.waitForTimeout(700);
  await p.evaluate(() => { const r = document.getElementById('aqDiscoverCategories'); if (r) { r.querySelector('[data-kind="all"]').click(); } }); await p.waitForTimeout(1500);
  if (false) console.log('아카이브 행 수', await p.evaluate(() => (_state.archive || []).length), '· 종목 시세 샘플', await p.evaluate(() => { const t = (document.querySelector('#feedScroll .feed-item') || {}).dataset; return t && t.ticker; }));
  await p.evaluate(() => { for (const it of document.querySelectorAll('#feedScroll .feed-item')) { if (!it.querySelector('canvas')._aqChart) { try { aqRenderFeedChart(it, it.dataset.ticker, (_state.feedTf || {})[it.dataset.ticker] || '3M'); } catch (e) {} } } }); await p.waitForTimeout(800);
  const pill = await p.evaluate(() => { const r = document.querySelector('#feedScroll .feed-tf'), bs = [...r.querySelectorAll('button')]; const q = b => { const k = b.getBoundingClientRect(); return Math.round(k.width) + 'x' + Math.round(k.height); }; const rr = r.getBoundingClientRect(); return { row: Math.round(rr.width) + 'x' + Math.round(rr.height), btns: bs.map(q).join(' '), font: getComputedStyle(bs[0]).fontSize, ind: !!r.querySelector('.aq-tp-ind') }; });
  ok('3M/6M/1Y 알약이 작음(높이 32 이하 · 글자 12 이하)', parseInt(pill.row.split('x')[1]) <= 32 && parseFloat(pill.font) <= 12, JSON.stringify(pill));
  await p.screenshot({ path: path.join(OUT, 'discover_pill.png') });
  const info = await p.evaluate(() => [...document.querySelectorAll('#feedScroll .feed-item')].map(i => i.dataset.ticker + ':' + !!(i.querySelector('canvas') && i.querySelector('canvas')._aqChart)));
  console.log('피드 종목 ' + info.length);
  // 한 시점의 틀 검사: 종가 선의 모든 점이 chartArea 안에 있는지 · 척도 범위가 데이터 범위를 덮는지
  const probe = () => p.evaluate(() => {
    const out = [];
    for (const it of document.querySelectorAll('#feedScroll .feed-item')) {
      const c = it.querySelector('canvas'), ch = c && c._aqChart; if (!ch || !ch.scales.yPrice) continue;
      const ds = ch.data.datasets.find(d => d.label === '종가'); if (!ds) continue;
      const meta = ch.getDatasetMeta(ch.data.datasets.indexOf(ds)), A = ch.chartArea, sc = ch.scales.yPrice;
      const ys = meta.data.map(pt => pt.y).filter(v => isFinite(v));
      const dmin = Math.min(...ds.data.filter(v => v != null)), dmax = Math.max(...ds.data.filter(v => v != null));
      const above = ys.filter(y => y < A.top - 1).length, below = ys.filter(y => y > A.bottom + 1).length;
      out.push({ tk: it.dataset.ticker, above, below, n: ys.length, scMin: +sc.min.toFixed(2), scMax: +sc.max.toFixed(2), dMin: +dmin.toFixed(2), dMax: +dmax.toFixed(2), fixed: ch.options.scales.yPrice.min != null || ch.options.scales.yPrice.max != null });
    }
    return out;
  });
  const bad = new Map(); const seen = new Set();
  const paths = [['6M'], ['1Y'], ['3M'], ['1Y', '6M'], ['6M', '3M'], ['3M', '1Y'], ['1Y', '3M']];
  const tks = await p.evaluate(() => [...document.querySelectorAll('#feedScroll .feed-item')].map(i => i.dataset.ticker));
  for (const tk of tks.slice(0, 10)) {
    for (const seq of paths) {
      for (const tf of seq) {
        await p.evaluate(([tk, tf]) => aqFeedSetTf(tk, tf), [tk, tf]);
        // 움직이는 도중 4번 · 멈춘 뒤 1번 검사
        for (const w of [30, 90, 150, 300, 900]) {
          await p.waitForTimeout(w === 30 ? 30 : w - [30, 90, 150, 300, 900][[30, 90, 150, 300, 900].indexOf(w) - 1]);
          const r = (await probe()).find(x => x.tk === tk);
          if (!r) continue;
          const mid = w < 900;
          if (r.above + r.below > 0 || (!mid && (r.scMin > r.dMin + 1e-6 || r.scMax < r.dMax - 1e-6))) {
            const key = tk + ' ' + tf + (mid ? ' [도중 ' + w + 'ms]' : ' [멈춘 뒤]');
            if (!bad.has(key)) bad.set(key, r);
          }
        }
      }
    }
  }
  ok('기간 전환(3M·6M·1Y · 7가지 길 · 움직이는 도중과 멈춘 뒤)에 종가선이 틀 밖으로 안 나감', bad.size === 0, bad.size + '건 ' + [...bad.keys()].slice(0, 4).join(' / '));
  ok('검사한 차트가 있음(피드가 그려짐)', tks.length > 0 && (await probe()).length > 0, tks.length + '종목');
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
