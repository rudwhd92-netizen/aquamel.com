// 마이 › 실시간 현황 · 종목 페이지 차트 시험 — node tools/ui-test/livechart.js   (v8.81: 3M/6M/1Y 작은 알약(Tab pill) · 기간 바꿀 때 선이 흘러가는 움직임이 틀 밖으로 안 나감)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다 · VP=390x844,1180x800 으로 화면 크기를 바꿈 · 차트가 그려지려면 저장소의 data 폴더가 같이 서빙돼야 한다
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const vpList = (process.env.VP || '390x844').split(',').map(v => v.split('x').map(Number));
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  for (const [W, H] of vpList) {
    const tag = W + 'x' + H; console.log('=== ' + tag);
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR ' + e.message); });
    await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
    await p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); document.body.setAttribute('data-broker', 'linked'); });

    await p.waitForFunction(() => _state.archive && _state.archive.length > 100, null, { timeout: 30000 }).catch(() => console.log('(아카이브 로딩 대기 시간 초과)'));
    // ───────── 마이 › 실시간 현황
    await p.evaluate(() => {
      const tks = ['CL', 'WMB', 'ELV', 'PLD']; _dashLastComputed = { holdings: tks.map((t, i) => ({ ticker: t, qty: 10 + i, cost: 1000 + i * 50, curPrice: 100 + i, avgPrice: 90 + i })) };
      switchMobileTab('board'); setBoardSubtab('live'); aqLiveBoardRender();
    });
    await p.waitForSelector('#lvFeed .feed-item', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1200);
    await p.evaluate(() => document.querySelectorAll('#lvFeed .feed-item').forEach(it => it.scrollIntoView()));
    await p.waitForTimeout(1500);
    await p.evaluate(() => { for (const it of document.querySelectorAll('#lvFeed .feed-item')) { if (!it.querySelector('canvas')._aqChart) { try { aqRenderFeedChart(it, it.dataset.ticker, (_state.feedTf || {})[it.dataset.ticker] || '3M'); } catch (e) { console.warn(e); } } } }); await p.waitForTimeout(800);
    const lv = await p.evaluate(() => { const its = [...document.querySelectorAll('#lvFeed .feed-item')]; const it = its[0], r = it && it.querySelector('.feed-tf'); const rr = r && r.getBoundingClientRect(); return { n: its.length, charts: its.filter(i => i.querySelector('canvas')._aqChart).length, pill: r && (Math.round(rr.width) + 'x' + Math.round(rr.height)), tpRow: !!(r && r.classList.contains('xtab-row')), ind: !!(r && r.querySelector('.aq-tp-ind')), range: !!(it && it.querySelector('.aq-discover-range')), sideDisp: it && getComputedStyle(it.querySelector('.feed-side')).display, cardW: document.getElementById('boardLiveCard').clientWidth }; });
    ok('실시간 현황: 보유 종목 카드가 그려짐', lv.n >= 4, JSON.stringify(lv));
    ok('실시간 현황: 알약이 작은 Tab pill (높이 32 이하)', lv.tpRow && lv.ind && parseInt((lv.pill || '0x99').split('x')[1]) <= 32, lv.pill);
    ok('실시간 현황: 변화율 글자(+n.n%) 표시', lv.range);
    ok('실시간 현황: 시그널 이력은 좁은 화면에서 숨김 / 넓으면 옆 칸', lv.cardW < 600 ? lv.sideDisp === 'none' : lv.sideDisp === 'flex', lv.sideDisp + ' / 폭 ' + lv.cardW);
    // 기간 전환: 모든 종목 · 7가지 길 · 움직이는 도중과 뒤
    const probeLv = () => p.evaluate(() => { const out = []; for (const it of document.querySelectorAll('#lvFeed .feed-item')) { const ch = it.querySelector('canvas')._aqChart; if (!ch || !ch.scales.yPrice) continue; const ds = ch.data.datasets.find(d => d.label === '종가'); const meta = ch.getDatasetMeta(ch.data.datasets.indexOf(ds)), A = ch.chartArea; const ys = meta.data.map(pt => pt.y).filter(v => isFinite(v)); out.push({ tk: it.dataset.ticker, bad: ys.filter(y => y < A.top - 1 || y > A.bottom + 1).length }); } return out; });
    const bad = []; const tks = await p.evaluate(() => [...document.querySelectorAll('#lvFeed .feed-item')].map(i => i.dataset.ticker));
    for (const tk of tks) for (const seq of [['6M'], ['1Y'], ['3M'], ['1Y', '6M'], ['6M', '3M'], ['3M', '1Y'], ['1Y', '3M']]) for (const tf of seq) {
      await p.evaluate(([a, c]) => aqFeedSetTf(a, c), [tk, tf]);
      for (const w of [40, 100, 160, 400]) { await p.waitForTimeout(w === 40 ? 40 : 60 + (w > 160 ? 240 : 0)); const r = (await probeLv()).find(x => x.tk === tk); if (r && r.bad) bad.push(tk + ' ' + tf + ' ' + w + 'ms ' + r.bad); }
    }
    ok('실시간 현황: 기간 전환 중/뒤 종가선이 틀 밖으로 안 나감', bad.length === 0, bad.length + '건 ' + bad.slice(0, 3).join(' / '));
    await p.evaluate(() => document.querySelector('#lvFeed .feed-item').scrollIntoView({ block: 'center' })); await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(OUT, 'live_' + tag + '.png') });

    // ───────── 종목 페이지 차트
    await p.evaluate(() => { switchMobileTab('discover'); });
    await p.evaluate(() => openChart('CL')); await p.waitForTimeout(2500);
    const md = await p.evaluate(() => { const r = document.querySelector('.tf-toggle[data-target="modal"]'), rr = r.getBoundingClientRect(), a = r.querySelector('button.active'), ind = r.querySelector('.aq-tp-ind'), ar = a.getBoundingClientRect(), ir = ind.getBoundingClientRect(); const ch = _chart; return { visible: rr.width > 0, pill: Math.round(rr.width) + 'x' + Math.round(rr.height), bg: getComputedStyle(r).backgroundColor, font: getComputedStyle(a).fontSize, act: a.textContent, indW: +ir.width.toFixed(1), btnW: +ar.width.toFixed(1), tpRow: r.classList.contains('xtab-row'), chart: !!(ch && ch.scales && ch.scales.yPrice) }; });
    ok('종목 차트: 모달이 열리고 차트가 그려짐', md.visible && md.chart, JSON.stringify(md));
    ok('종목 차트: 기간 알약이 작은 Tab pill (높이 32 이하 · 글자 12 이하)', md.tpRow && parseInt(md.pill.split('x')[1]) <= 32 && parseFloat(md.font) <= 12, md.pill + ' · ' + md.font);
    ok('종목 차트: 선택 바탕이 선택 버튼 안쪽에 맞음(알약 inset 4 이하)', Math.abs(md.btnW - md.indW) <= 9, md.indW + ' vs ' + md.btnW);
    await p.screenshot({ path: path.join(OUT, 'modal_' + tag + '.png') });
    const mbad = []; const probeM = () => p.evaluate(() => { const ch = _chart; if (!ch || !ch.scales.yPrice) return null; const ds = ch.data.datasets.find(d => d.label === '종가'); if (!ds) return null; const meta = ch.getDatasetMeta(ch.data.datasets.indexOf(ds)), A = ch.chartArea; const ys = meta.data.map(pt => pt.y).filter(v => isFinite(v)); const sc = ch.scales.yPrice; const exp = ds.data.map(v => sc.getPixelForValue(v)); let dev = 0; meta.data.forEach((pt, i) => { if (isFinite(exp[i]) && isFinite(pt.y)) dev = Math.max(dev, Math.abs(pt.y - exp[i])); }); return { bad: ys.filter(y => y < A.top - 1 || y > A.bottom + 1).length, dev: +dev.toFixed(2), n: ys.length }; });
    const settleDev = [];
    for (const seq of [['6M'], ['1Y'], ['3M'], ['1Y', '6M'], ['6M', '3M'], ['3M', '1Y'], ['1Y', '3M']]) for (const tf of seq) {
      await p.evaluate(tf => setChartTimeframe('modal', tf), tf);
      for (const w of [60, 120, 200, 400]) { await p.waitForTimeout(w === 60 ? 60 : 80 + (w > 200 ? 200 : 0)); const r = await probeM(); if (r && r.bad) mbad.push(tf + ' ' + w + 'ms ' + r.bad); }
      await p.waitForTimeout(900); const r = await probeM(); if (r) settleDev.push(r.dev);
    }
    ok('종목 차트: 기간 전환 중에 종가선이 틀 밖으로 안 나감', mbad.length === 0, mbad.length + '건 ' + mbad.slice(0, 3).join(' / '));
    ok('종목 차트: 멈춘 뒤 선이 실제 값 자리로 돌아옴(오차 1px 이하)', settleDev.length > 0 && Math.max(...settleDev) <= 1, 'max ' + Math.max(...settleDev));
    const act2 = await p.evaluate(() => ({ act: document.querySelector('.tf-toggle[data-target="modal"] button.active').textContent, st: _state.chartTimeframe.modal }));
    ok('종목 차트: 알약 선택 상태와 기간이 같음', act2.act === act2.st, JSON.stringify(act2));
    await p.screenshot({ path: path.join(OUT, 'modal2_' + tag + '.png') });
    ok('페이지 오류 0건', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
