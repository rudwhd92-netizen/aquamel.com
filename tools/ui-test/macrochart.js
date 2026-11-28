// MACRO 「차트 크게」 · 펼침 기간 알약 시험 — node tools/ui-test/macrochart.js   (v9.48 · v9.49 · 로그인 없이 공개 자료만)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  for (const [name, width, height] of [['폰', 390, 844], ['넓은 화면', 1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width, height }, serviceWorkers: 'block' });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => { if (!/discoverMotionView/.test(e.message)) errs.push(e.message); });
    await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
    await p.addStyleTag({ content: '.aq-auth{display:none!important} #splashOverlay{display:none!important}' });
    await p.waitForFunction(() => _state.archive && _state.archive.length > 100 && (window._aqMarqueeItems || []).length, null, { timeout: 90000 });
    await p.waitForTimeout(3000);
    const wait = ms => p.waitForTimeout(ms);
    const state = () => p.evaluate(() => { const c = document.getElementById('chartCanvas'), r = c.getBoundingClientRect(), ch = Chart.getChart(c), t = document.getElementById('modalViewTabs'); return { active: document.getElementById('chartModal').classList.contains('active'), h: Math.round(r.height), pts: ch ? ch.data.labels.length : 0, tabs: t.getClientRects().length > 0 }; });
    const big = async tk => { await p.evaluate(tk => openMacroChart(tk), tk); await wait(1500); return state(); };
    const close = async () => { await p.evaluate(() => closeModal()); await wait(700); };
    const good = s => s.active && s.h > 150 && s.pts > 20;

    /* 머리글 띠의 지표 전부 (표본이 아주 적은 2년 국채는 뺌) */
    const items = await p.evaluate(() => window._aqMarqueeItems.map(x => x.ticker));
    const bad = [];
    for (const tk of items.filter(t => t !== '미국국채(2Y)')) { const s = await big(tk); if (!good(s) || s.tabs) bad.push(tk + ' ' + JSON.stringify(s)); await close(); }
    ok(name + ': 띠의 지표가 모두 큰 차트로 열림 · 종목 탭 줄 없음', !bad.length, bad.join(' / ') || items.length + '개');

    /* 종목의 탭을 본 뒤에도 */
    for (const [view, label] of [['report', 'AI 보고서'], ['map', '종목 정보'], ['position', '내 주식']]) {
      await p.evaluate(() => openChart('NVDA')); await wait(2500);
      await p.evaluate(v => aqSetModalView(v), view); await wait(1500); await close();
      const s = await big('VIX'); ok(name + ': ' + label + ' 탭을 본 뒤에도 차트', good(s), JSON.stringify(s));
      if (view === 'report') await p.screenshot({ path: path.join(OUT, 'macrochart_' + width + '.png') });
      await close();
    }
    await p.evaluate(() => openChart('NVDA')); await wait(2500);
    const st = await state(); ok(name + ': 매크로 뒤에 연 종목은 탭 줄 · 차트 그대로', good(st) && st.tabs, JSON.stringify(st)); await close();

    /* 기간 */
    await big('VIX'); const n3 = (await state()).pts;
    await p.evaluate(() => setChartTimeframe('modal', '1Y')); await wait(1500); const y = await p.evaluate(() => { const ch = Chart.getChart(document.getElementById('chartCanvas')); return ch && [ch.data.labels.length, String(ch.data.labels[0]), String(ch.data.labels[ch.data.labels.length - 1])]; });
    ok(name + ': 1Y로 바꾸면 1년 치', !!y && (Date.parse(y[2]) - Date.parse(y[1])) > 330 * 864e5, '3M ' + n3 + '점 · 1Y ' + JSON.stringify(y));
/* v9.49: 펼침 칸 기간 알약 */
    await close(); await p.evaluate(() => { localStorage.removeItem('aq_mac_tf'); scrollTo(0, 0); });
    const chip = tk => p.evaluate(tk => document.querySelector('#heroMarqueeTrack .macro-chip[data-macro="' + tk + '"]').click(), tk);
    const panel = () => p.evaluate(() => { const q = s => document.querySelector('#aqMacPanel ' + s), line = q('.aq-mp-ch path'); return {
      pills: [...document.querySelectorAll('#aqMacPanel [data-per]')].map(b => b.dataset.per).join(' '), on: (q('[data-per].active') || {}).textContent, range: (q('.aq-mp-range') || {}).textContent, pts: line ? (line.getAttribute('d').match(/[ML]/g) || []).length : 0,
      none: (q('.aq-mp-none') || {}).textContent || '', h: Math.round(document.getElementById('aqMacPanel').getBoundingClientRect().height), in: Math.round(document.querySelector('#aqMacPanel .aq-mp-in').offsetHeight), hit: (() => { const b = q('[data-per="3M"]'); if (!b) return false; const r = b.getBoundingClientRect(); return [-8, 8].every(d => document.elementFromPoint(r.left + r.width / 2, (d < 0 ? r.top : r.bottom) + d) === b); })() }; });
    const per = async v => { await p.click('#aqMacPanel [data-per="' + v + '"]'); await wait(1200); return panel(); };
    await chip('VIX'); await wait(1500); const m1 = await panel();
    ok(name + ': 알약 4개 · 처음은 1M', m1.pills === '1M 3M 6M 1Y' && m1.on === '1M' && m1.pts > 15 && m1.pts < 28, JSON.stringify(m1));
    ok(name + ': 알약 위아래까지 눌림(44) · 칸 높이가 내용에 맞음', m1.hit && Math.abs(m1.h - m1.in - 1) <= 2, m1.h + ' / ' + m1.in);
    await p.screenshot({ path: path.join(OUT, 'macroper_' + width + '_1m.png') });
    const m3 = await per('3M'), m6 = await per('6M'), y1 = await per('1Y');
    ok(name + ': 3M · 6M · 1Y로 갈수록 긴 선 · 같은 높이', m3.on === '3M' && m3.pts > 55 && m6.pts > 115 && y1.pts > 235 && y1.h === m1.h, [m3.pts, m6.pts, y1.pts].join(' ') + ' · ' + y1.range);
    await p.screenshot({ path: path.join(OUT, 'macroper_' + width + '_1y.png') });
    await p.click('#aqMacPanel [data-big]'); await wait(1800);
    const tfOn = () => p.evaluate(() => [...document.querySelectorAll('.tf-toggle[data-target="modal"] button.active')].map(b => b.dataset.tf).join());
    ok(name + ': 「차트 크게」도 같은 기간', (await tfOn()) === '1Y' && good(await state()), await tfOn()); await close();
    await chip('은'); await wait(1500); const kept = await panel();
    ok(name + ': 고른 기간이 다른 지표에도 유지', kept.on === '1Y' && kept.pts > 235, kept.on + ' ' + kept.pts);
    await chip('KJP500'); await wait(1500); const k3 = await per('3M'); await p.click('#aqMacPanel [data-big]'); await wait(1800); const kb = await state(); await close();
    ok(name + ': KJP500 3M — 펼침과 큰 차트가 같은 점 수(날짜 기준)', k3.pts === kb.pts && k3.pts < 70, k3.pts + ' / ' + kb.pts);
    await chip('미국국채(2Y)'); await wait(1500); const t1 = await per('1M'), t2 = await per('1Y');
    ok(name + ': 값이 끊긴 지표는 마지막 날짜를 알림', t1.pts > 1 || /마지막 \d\d\/\d\d/.test(t1.none), (t1.none || '1M ' + t1.pts) + ' · 1Y ' + t2.pts);
    ok(name + ': 페이지 오류 0건', errs.length === 0, errs.slice(0, 3).join(' | '));
    await ctx.close();
  }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); process.exit(fails ? 1 : 0);
})();
