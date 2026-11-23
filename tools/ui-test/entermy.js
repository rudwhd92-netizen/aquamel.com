// 마이 하위메뉴(실시간 현황 · 누적 성과 · 운영 통계) 처음 들어올 때 움직임 시험 — node tools/ui-test/entermy.js   (v9.11: 숫자가 0에서 올라가다 값에 고정 · 선이 그어짐 · 들어올 때마다 · 움직임 줄이기면 없음)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · URL=배포주소 로 실제 사이트도 가능 · CHANNEL=msedge
//   로그인 · 토스 연결 없이 시험하려고 보유 종목 · 누적 성과 · 운영 통계 모양을 시험용 값으로 채워 넣는다(실제 데이터가 아님).
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
async function run(reduce) {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { errs.push(e.message); console.log('PAGEERR ' + e.message); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); document.body.setAttribute('data-broker', 'linked'); });
  await p.waitForFunction(() => _state.archive && _state.archive.length > 100, null, { timeout: 30000 }).catch(() => console.log('(아카이브 로딩 대기 시간 초과)'));
  const R = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms)); const out = { live: [], liveChart: [], perf: [], svg: [], stats: [] };
    const tks = ['CL', 'WMB', 'ELV', 'PLD']; _dashLastComputed = { holdings: tks.map((t, i) => ({ ticker: t, qty: 10 + i, cost: 1000 + i * 50, curPrice: 100 + i, avgPrice: 90 + i })) };
    const heroNow = () => { const e = document.querySelector('#lvHero .lvh-pl'); if (!e) return null; const reel = !!e.querySelector('.aq-rl'); return { t: reel ? 'REEL:' + e.getAttribute('aria-label') : e.textContent, reel, aria: e.getAttribute('aria-label') }; };   // 굴러가는 숫자판일 때는 속 글자가 아니라 aria-label(값)
    // ① 실시간 현황 — 두 번 들어옴
    for (let n = 0; n < 2; n++) {
      switchMobileTab('discover'); await wait(300);
      const smp = [], rv = []; const iv = setInterval(() => { const h = heroNow(); if (h) smp.push(h.t); const c = document.querySelector('#lvFeed .feed-item canvas'), ch = c && c._aqChart; if (ch && ch.$rv) rv.push(+ch.$rv.x.toFixed(2)); }, 30);
      switchMobileTab('board'); setBoardSubtab('live'); aqLiveBoardRender();
      await wait(400);
      document.querySelectorAll('#lvFeed .feed-item').forEach(it => { it.scrollIntoView(); try { if (!it.querySelector('canvas')._aqChart) aqRenderFeedChart(it, it.dataset.ticker, (_state.feedTf || {})[it.dataset.ticker] || '3M'); } catch (e) {} });
      await wait(2500); clearInterval(iv); window.scrollTo(0, 0);
      out.live.push({ smp, fin: heroNow(), rv });
    }
    // ② 누적 성과 — 시험용 값
    const snaps = Array.from({ length: 40 }, (_, i) => ({ date: '2025-' + (i < 28 ? '01' : '02') + '-' + String(1 + (i % 28)).padStart(2, '0'), totalProfit: i * 25 + (i % 5) * 7, totalEval: 5000 + i * 30, totalCost: 5000, realized: 0 }));
    const ctxd = { d: { totalProfit: 1234, totalROI: 12.34, principal: 10000, unrealized: 900, unrealROI: 9, realized: 334, totalAsset: 11234, pureRatio: 70, reinvRatio: 30, flows: { today: 120, week: 340, month: 800, todayDiff: 10, weekDiff: 20, monthDiff: 30 } }, sim: { snapshots: snaps, holdings: [] } };
    for (let n = 0; n < 2; n++) {
      setBoardSubtab('live'); await wait(300);
      const smp = [], sv = []; const iv = setInterval(() => { const v = document.querySelector('#perfX .pf-hero2 .v'); if (v) smp.push(v.textContent); const s = document.querySelector('#perfX .pf-svg'); if (s) sv.push(s.style.clipPath); }, 30);
      setBoardSubtab('performance'); try { aqPerfRender(ctxd); } catch (e) {}
      await wait(1200); const hidden = (document.querySelector('#perfX .pf-svg') || {}).style ? document.querySelector('#perfX .pf-svg').style.clipPath : 'none';
      const s0 = document.querySelector('#perfX .pf-svg'); if (s0) s0.scrollIntoView({ block: 'center' });
      await wait(1500); clearInterval(iv); window.scrollTo(0, 0);
      out.perf.push({ smp, fin: (document.querySelector('#perfX .pf-hero2 .v') || {}).textContent, hidden, sv, after: s0 ? s0.style.clipPath : null, n: document.querySelectorAll('#perfX .pf-svg').length });
    }
    // ③ 운영 통계 — 시험용 칸(통계 화면이 그리는 모양)
    setBoardSubtab('live'); await wait(300);
    const smp = []; const iv = setInterval(() => { const e = document.querySelector('#aqStatsBody .st-kv'); if (e) smp.push(e.textContent); }, 30);
    setBoardSubtab('stats');
    document.getElementById('aqStatsBody').innerHTML = '<div class="st-kpis"><div class="st-kpi"><div class="st-kk">매매</div><div class="st-kv">128회</div><div class="st-ks">하루 평균 1.5회</div></div><div class="st-kpi"><div class="st-kk">가장 오래 산 종목</div><div class="st-kv">342일</div></div></div>';
    await wait(1800); clearInterval(iv); out.stats = smp; out.statsFin = (document.querySelector('#aqStatsBody .st-kv') || {}).textContent; out.statsSub = (document.querySelector('#aqStatsBody .st-ks') || {}).textContent;
    return out;
  });
  await b.close(); return { R, errs };
}
const nums = s => (String(s).match(/-?\d[\d,]*\.?\d*/g) || []).map(x => parseFloat(x.replace(/,/g, '')));
(async () => {
  const m = await run(false);
  m.R.live.forEach((L, i) => {
    const live = L.smp.filter(t => !/^REEL:/.test(t)), v = live.map(t => nums(t)[0]).filter(x => x != null); const fin = nums(L.fin && L.fin.aria)[0];
    ok('실시간 현황 ' + (i + 1) + '번째: 맨 위 숫자가 0 근처에서 시작', v.length > 5 && v[0] <= fin * 0.3, live.slice(0, 3).join(' ← '));
    ok('실시간 현황 ' + (i + 1) + '번째: 올라가는 중간 값이 있음', v.some(x => x > fin * 0.2 && x < fin * 0.97), live.filter((_, k) => k % 4 === 0).slice(0, 8).join(' '));
    ok('실시간 현황 ' + (i + 1) + '번째: 끝에는 값에 고정 · 굴러가는 숫자판 복원', L.fin && L.fin.reel && /^[+\-]?\$?[\d,]+/.test(L.fin.aria || ''), JSON.stringify(L.fin && L.fin.aria));
    if (L.rv.length) ok('실시간 현황 ' + (i + 1) + '번째: 차트 선이 그어짐', L.rv.some(x => x > 0.05 && x < 0.95), L.rv.slice(0, 10).join(' '));
    else console.log('SKIP 실시간 현황 ' + (i + 1) + '번째 차트: 그려진 차트 없음(시세 데이터 없음)');
  });
  m.R.perf.forEach((P, i) => {
    const v = P.smp.map(t => nums(t)[0]).filter(x => x != null); const fin = nums(P.fin)[0];
    ok('누적 성과 ' + (i + 1) + '번째: 종합 수익금이 0에서 올라가 값에 고정', v.length > 5 && v[0] <= fin * 0.3 && v.some(x => x > fin * 0.2 && x < fin * 0.97) && v.at(-1) === fin, P.smp.filter((_, k) => k % 5 === 0).slice(0, 7).join(' '));
    if (P.n) ok('누적 성과 ' + (i + 1) + '번째: 화면 밖 선은 가려져 있다가 보이면 그어지고 끝나면 클립이 없음', /inset/.test(P.hidden) && P.after === '' && P.sv.some(x => /inset\(0px (?!100%)/.test(x)), 'hidden ' + P.hidden + ' · after "' + P.after + '"');
  });
  ok('운영 통계: 숫자가 0에서 올라가 값에 고정', nums(m.R.stats[0])[0] <= 128 * 0.3 && m.R.stats.some(t => nums(t)[0] > 128 * 0.2 && nums(t)[0] < 128 * 0.97) && m.R.statsFin === '128회', m.R.stats.filter((_, k) => k % 5 === 0).slice(0, 7).join(' '));
  ok('운영 통계: 글자가 섞인 칸(하루 평균 1.5회)도 숫자만 올라가 값에 고정', /^하루 평균 1\.5회$/.test(m.R.statsSub), m.R.statsSub);
  ok('오류 없음', m.errs.length === 0, m.errs.join(' | '));
  const r = await run(true);
  ok('움직임 줄이기: 처음부터 값 그대로(올라가는 숫자 · 클립 없음)', r.R.live.every(L => L.smp.every(t => /^REEL:/.test(t) && nums(t)[0] === nums(L.fin.aria)[0])) && r.R.perf.every(P => P.sv.every(x => !/inset/.test(x))) && r.R.stats.every(t => t === '128회'), '');
  ok('움직임 줄이기: 오류 없음', r.errs.length === 0);
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
