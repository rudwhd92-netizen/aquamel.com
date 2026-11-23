// 일정 시험 — node tools/ui-test/sched.js   (v9.14: 실적시즌 시안 — 일정 요약본 · 분기 실적 블록 4개 · 서프라이즈 | 쇼크 · 흑자전환 · 분기 이동 · 시장 토글 · 하트 / v8.88: 통합캘린더 새 데이터 · 필터 4개 · 날짜 없는 내 종목 실적 · 한국 경제지표 한글 · 실적시즌 · Beat/Miss 조건부 · 종목명 폴백 · 한국 실적 · 예전 경로 폴백)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
//   서버 데이터는 가짜(시험용 JSON)로 가로채서 준다 — 실서버 · 로그인 필요 없음. 오늘 = 2026-11-22(일)로 고정.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'http://localhost:8773/index.html';

/* ── 가짜 서버 파일 ── */
const m = (eps, rev, oi) => ({ eps: Object.assign({ unit: 'USD/share', actual: null, expected: null, previous: null, surprise_pct: null }, eps || {}), revenue: Object.assign({ unit: 'USD', actual: null, expected: null, previous: null }, rev || {}), operating_income: Object.assign({ unit: null, actual: null }, oi || {}) });
const US = (tk, name, wd, o) => Object.assign({ id: 'earnings:US:' + tk + ':2026-09-30', instrument_id: 'US:' + tk, ticker: tk, market: 'US', name, name_ko: null, status: 'estimated', currency: 'USD', week_start: '2026-11-23', weekday: wd, result_metric: 'eps', result: 'pending', session: 'AMC', time_precision: 'minute', category: 'earnings', metrics: m() }, o);   // 실제 실적 파일처럼 kind 없음
const KR = (tk, name, wd, o) => Object.assign({ id: 'earnings:KR:' + tk + ':2026-09-30', instrument_id: 'KR:' + tk, ticker: tk, market: 'KR', name, name_ko: name, status: 'reported', currency: 'KRW', week_start: '2026-11-23', weekday: wd, result_metric: 'operating_income', result: 'unknown', session: 'TIME_TBD', time_precision: 'date', category: 'earnings', starts_at_kst: null, metrics: m() }, o);
const OI = (actual, previous, basis, unit) => ({ unit: unit || 'USD', actual, previous, previous_basis: basis === undefined ? 'qoq' : basis });   // previous_basis: 'qoq'일 때만 전분기 비교에 쓰임
const P2 = (mk, tk, name, o) => Object.assign((mk === 'KR' ? KR : US)(tk, name, 2, { status: 'reported', session: 'BMO', date_kst: '2026-08-11', local_date: '2026-08-11', week_start: '2026-08-10', starts_at_kst: mk === 'KR' ? null : '2026-08-11T22:00:00+09:00' }), { period_end: '2026-06-30' }, o);
const EARN2 = { schema_version: 2, quarter: '2026q2', revision: 'r2', generated_at: '2026-11-21T16:51:22Z', items: [
  P2('US', 'P1', '지난비트1', { metrics: m({ provider_comparison: { actual: 1.5, expected: 1, surprise_pct: 50 } }, {}, OI(2e8, 1e8)) }),
  P2('US', 'P2', '지난비트2', { metrics: m({ provider_comparison: { actual: 1.0, expected: 0.9, surprise_pct: 11.1 } }, {}, OI(3e8, 1e8)) }),
  P2('US', 'P3', '지난턴', { metrics: m({ actual: 1 }, {}, OI(1e8, -2e8)) }),
  P2('KR', 'K1', '지난한국턴', { metrics: m({}, { unit: 'KRW', actual: 1e12 }, OI(5e9, -1e9, 'qoq', 'KRW')) }),
] };
const EARN = { schema_version: 2, quarter: '2026q3', revision: 'r1', generated_at: '2026-11-21T16:51:22Z', items: [
  US('ADI', '아날로그 디바이시스', 2, { session: 'BMO', date_kst: '2026-11-24', local_date: '2026-11-24', starts_at_kst: '2026-11-24T22:00:00+09:00', metrics: m({ expected: 3.88 }) }),
  US('ZJ', 'ZJ', 2, { date_kst: '2026-11-25', local_date: '2026-11-24', starts_at_kst: '2026-11-25T06:00:00+09:00', metrics: m({ expected: 2.12 }) }),
  US('NKO', '영문사전회사', 2, { name_ko: '이름있는회사', date_kst: '2026-11-25', local_date: '2026-11-24', starts_at_kst: '2026-11-25T06:00:00+09:00' }),
  US('BEAT', '비트회사', 3, { status: 'reported', session: 'BMO', date_kst: '2026-11-25', local_date: '2026-11-25', starts_at_kst: '2026-11-25T22:00:00+09:00', result: 'beat', metrics: m({ actual: 1.0, previous: 0.8, provider_comparison: { actual: 1.1, expected: 1.0, surprise_pct: 10 } }, { actual: 24397000000 }) }),
  US('MISS', '미스회사', 3, { status: 'reported', session: 'BMO', date_kst: '2026-11-25', local_date: '2026-11-25', starts_at_kst: '2026-11-25T22:00:00+09:00', result: 'miss', metrics: m({ actual: 0.5, previous: 0.9, provider_comparison: { actual: 0.5, expected: 0.6, surprise_pct: -5.2 } }) }),
  US('UNK', '언노운회사', 3, { status: 'reported', session: 'BMO', date_kst: '2026-11-25', local_date: '2026-11-25', starts_at_kst: '2026-11-25T22:00:00+09:00', result: 'unknown', metrics: m({ actual: 4.56, previous: 6.04 }, { actual: 112694000000 }) }),
  US('MYTBD', '내날짜없는회사', 4, { status: 'reported', session: 'TIME_TBD', date_kst: null, local_date: null, starts_at_kst: null, time_precision: 'date', result: 'unknown', metrics: m({ actual: 2.0, previous: 1.0 }) }),
  US('OTHTBD', '남날짜없는회사', 4, { status: 'reported', session: 'TIME_TBD', date_kst: null, local_date: null, starts_at_kst: null, time_precision: 'date', result: 'unknown', metrics: m({ actual: 1.0 }) }),
  KR('042660', '한화오션', 3, { date_kst: '2026-11-25', local_date: '2026-11-25', metrics: m({}, { unit: 'KRW', actual: 3413870310097 }, { unit: 'KRW', actual: 485689713072, previous: -1000000000, previous_basis: 'qoq', expected: 400000000000, surprise_pct: 21.4 }) }),
  KR('055550', '신한지주', 3, { date_kst: '2026-11-25', local_date: '2026-11-25', metrics: m({}, { unit: 'KRW', actual: null }, { unit: 'KRW', actual: 1234500000000 }) }),
  US('UNVER', '미확정회사', 2, { session: 'AMC', date_kst: '2026-11-24', local_date: '2026-11-24', starts_at_kst: '2026-11-24T22:30:00+09:00', flags: ['period_unverified'], metrics: m({ expected: 1.5 }) }),
  US('F1', '필러일', 2, { session: 'TIME_TBD', date_kst: null, local_date: '2026-11-24', starts_at_kst: null, time_precision: 'date', metrics: m({ expected: 0.1 }) }),
  US('F2', '필러이', 2, { session: 'TIME_TBD', date_kst: null, local_date: '2026-11-24', starts_at_kst: null, time_precision: 'date', metrics: m({ expected: 0.2 }) }),
  US('F3', '필러삼', 2, { session: 'TIME_TBD', date_kst: null, local_date: '2026-11-24', starts_at_kst: null, time_precision: 'date', metrics: m({ expected: 0.3 }) }),
  US('T1', '턴어라운드1', 5, { status: 'reported', session: 'BMO', date_kst: '2026-11-27', local_date: '2026-11-27', starts_at_kst: '2026-11-27T22:00:00+09:00', metrics: m({ actual: 1 }, { actual: 3e8 }, OI(5e8, -3e8)) }),
  US('T2', '턴어라운드2', 5, { status: 'reported', session: 'BMO', date_kst: '2026-11-27', local_date: '2026-11-27', starts_at_kst: '2026-11-27T22:00:00+09:00', metrics: m({ actual: 1 }, {}, OI(2e8, -1e8)) }),
  US('Z0', '영에서양', 5, { status: 'reported', session: 'BMO', date_kst: '2026-11-27', local_date: '2026-11-27', starts_at_kst: '2026-11-27T22:00:00+09:00', metrics: m({ actual: 1 }, {}, OI(1e8, 0)) }),
  US('YOY', '전년비교', 5, { status: 'reported', session: 'BMO', date_kst: '2026-11-27', local_date: '2026-11-27', starts_at_kst: '2026-11-27T22:00:00+09:00', metrics: m({ actual: 1 }, {}, OI(1e8, -1e8, 'yoy')) }),
  US('NOB', '기준없음', 5, { status: 'reported', session: 'BMO', date_kst: '2026-11-27', local_date: '2026-11-27', starts_at_kst: '2026-11-27T22:00:00+09:00', metrics: m({ actual: 1 }, {}, OI(1e8, -1e8, null)) }),
  US('DN', '감소회사', 5, { status: 'reported', session: 'BMO', date_kst: '2026-11-27', local_date: '2026-11-27', starts_at_kst: '2026-11-27T22:00:00+09:00', metrics: m({ actual: 1 }, {}, OI(1e8, 3e8)) }),
  US('QUOTE', '별표회사', 5, { status: 'reported', session: 'BMO', date_kst: '2026-11-27', local_date: '2026-11-27', starts_at_kst: '2026-11-27T22:00:00+09:00', metrics: m({ actual: 2, provider_comparison: { actual: 2, expected: 1, surprise_pct: 100, basis: 'announcement_quoted' } }) }),
  US('FILED', '접수일회사', 5, { status: 'reported', session: 'TIME_TBD', date_kst: null, local_date: '2026-11-27', starts_at_kst: null, time_precision: 'date', flags: ['sec_filing_date'], metrics: m({ actual: 1 }) }),
  US('REV', '정정회사', 5, { status: 'revised', session: 'BMO', date_kst: '2026-11-27', local_date: '2026-11-27', starts_at_kst: '2026-11-27T22:00:00+09:00', metrics: m({ actual: 1 }) }),
] };
const mac = (id, title, d, t, mk, kind) => ({ id, kind: kind || 'macro', market: mk, instrument_ids: [], title, local_date: d, date_kst: d, starts_at_kst: t ? d + 'T' + t + ':00+09:00' : null, time_precision: t ? 'minute' : 'date', session: t ? 'INTRADAY' : 'TIME_TBD', category: kind === 'market_holiday' || kind === 'expiry' ? (kind === 'market_holiday' ? 'holiday' : 'expiry_filing') : 'macro', metrics: kind ? {} : { CPI: { unit: 'percent_yoy', actual: null, expected: null, previous: 3.1 } } });
const CAL = { schema_version: 2, month: '2026-11', revision: 'c1', items: [
  mac('macro:US:CPI:2026-11-10', '미국 소비자물가(CPI)', '2026-11-10', '22:30', 'US'),
  mac('macro:KR:CSI:2026-11-24', 'Consumer Survey Index (CSI) for November 2026', '2026-11-24', '06:00', 'KR'),
  mac('expiry:US:2026-11-20', '미국 월간 옵션 만기', '2026-11-20', null, 'US', 'expiry'),
  mac('holiday:US:2026-11-26', '미국 증시 휴장', '2026-11-26', null, 'US', 'market_holiday'),
] };
const INDEX = { schema_version: 2, status: 'partial', calendar: { '2026-11': 'calendar_2026-11.json' }, earnings_season: { '2026q3': 'earnings_2026q3.json', '2026q2': 'earnings_2026q2.json' }, file_revisions: { 'calendar_2026-11.json': 'c1', 'earnings_2026q3.json': 'r1', 'earnings_2026q2.json': 'r2' }, revision: 'i1' };
const FILES = { 'schedule_index.json': INDEX, 'calendar_2026-11.json': CAL, 'earnings_2026q3.json': EARN, 'earnings_2026q2.json': EARN2 };

(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined, executablePath: process.env.CHROMIUM_BIN || undefined });
  async function open(vp, mode) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, timezoneId: 'Asia/Seoul', locale: 'ko-KR' }); const p = await ctx.newPage();
    p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
    await p.route('**/*', r => (new globalThis.URL(r.request().url()).origin === new globalThis.URL(URL).origin || r.request().url().startsWith('https://cdn.jsdelivr.net/npm/chart')) ? r.continue() : r.abort());
    if (process.env.CHART_JS) await p.route('**/chart.umd.min.js', r => r.fulfill({path: process.env.CHART_JS, contentType:'text/javascript'}));
    await p.route(/aquamel\.duckdns\.org\/data\/schedule\//, r => {
      if (mode === 'down') return r.abort();
      const f = r.request().url().split('/').pop().split('?')[0]; const body = FILES[f];
      if (!body) return r.fulfill({ status: 404, body: '' });
      return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    });
    if (mode === 'down') await p.route(/aquamel\.duckdns\.org\/(api|data\.json)/, r => r.abort());   // 예전 시트 경로(/api)도 막아서 결과를 고정
    await p.clock.setFixedTime(new Date('2026-11-22T12:00:00+09:00'));
    await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
    await p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); });
    await p.waitForTimeout(400); return p;
  }
  const until = async (p, fn, arg, n = 40) => { for (let i = 0; i < n; i++) { const r = await p.evaluate(fn, arg); if (r) return r; await p.waitForTimeout(250); } return null; };
  const stubMine = p => p.evaluate(() => { document.body.setAttribute('data-role','admin'); lsSet(lsKeyPF('US'), [{ ticker: 'ADI', qty: 3 }, { ticker: 'MYTBD', qty: 2 }]); });

  /* ───────── 폰 360 · 새 데이터 ───────── */
  {
    const p = await open({ width: 360, height: 780 }); await stubMine(p);
    let opened = []; await p.evaluate(() => { window.__opened = []; window.openChart = t => window.__opened.push(t); });
    await p.evaluate(() => { switchMobileTab('schedule'); setScheduleSubtab('cal'); aqCal.current = new Date(2026, 10, 1); aqCal.selected = '2026-11-24'; });
    const rdy = await until(p, () => window.AqSch && AqSch.ready());
    ok('통합캘린더: 새 일정 데이터를 받음(경제지표 · 만기 · 휴장 · 실적)', !!rdy);
    await p.evaluate(() => aqCalendarRender()); await p.waitForTimeout(500);

    // 필터 칩 4개 · 44px
    const chips = await p.evaluate(() => [...document.querySelectorAll('.cal-filter-chip')].map(c => ({ k: c.dataset.filter, t: c.textContent.trim(), h: Math.round(c.getBoundingClientRect().height) })));
    const fit = await p.evaluate(() => { const r = document.querySelector('.cal-filter-row'); return { sw: r.scrollWidth, cw: r.clientWidth }; });
    ok('필터 칩 4개(경제지표 · 실적 · 만기·휴장 · 매매) · 높이 44 이상 · 360 폭에서 한 줄에 다 보임', JSON.stringify(chips.map(c => c.t)) === JSON.stringify(['경제지표', '실적', '만기·휴장', '매매']) && chips.every(c => c.h >= 44) && fit.sw <= fit.cw + 1, JSON.stringify({ chips, fit }));

    // 달력 점
    const dots = await p.evaluate(() => { const g = d => { const c = document.querySelector('.cal-cell[data-date="' + d + '"]'); return c ? [...c.querySelectorAll('.cal-cell-dot')].map(x => x.className.replace('cal-cell-dot ', '')) : null; }; return { d10: g('2026-11-10'), d20: g('2026-11-20'), d24: g('2026-11-24'), d25: g('2026-11-25'), d26: g('2026-11-26'), d23: g('2026-11-23') }; });
    ok('11/10 경제지표 점(파랑)', dots.d10 && dots.d10.includes('cal-dot-sch-mac'), JSON.stringify(dots.d10));
    ok('11/20 만기 점(회색)', dots.d20 && dots.d20.includes('cal-dot-sch-exp'), JSON.stringify(dots.d20));
    ok('11/24 경제지표 점', dots.d24 && dots.d24.includes('cal-dot-sch-mac'), JSON.stringify(dots.d24));
    ok('11/25 남의 종목 실적 점(흰색)', dots.d25 && dots.d25.includes('cal-dot-sch-ear') && !dots.d25.includes('cal-dot-sch-my'), JSON.stringify(dots.d25));
    ok('11/24 내 종목 실적 점(속 빈 파란 테두리) — 보유 ADI', dots.d24 && dots.d24.includes('cal-dot-sch-my'), JSON.stringify(dots.d24));
    ok('11/26 휴장 점 + 날짜 없던 내 종목 실적(시간 미정) 점', dots.d26 && dots.d26.includes('cal-dot-sch-exp') && dots.d26.includes('cal-dot-sch-my'), JSON.stringify(dots.d26));

    // 고른 날 목록
    const tl = day => p.evaluate(async d => { aqCalendarSelectDate(d); await new Promise(r => setTimeout(r, 250)); return [...document.querySelectorAll('#calSelectedList .tl-row')].map(r => ({ t: r.querySelector('.tl-time').textContent, ti: r.querySelector('.tl-title').textContent.trim(), de: r.querySelector('.tl-detail').textContent.trim(), onclick: r.getAttribute('onclick') || '' })); }, day);
    const t24 = await tl('2026-11-24');
    ok('11/24: 한국 경제지표 영문 제목이 한글로(소비자심리지수)', t24.some(r => /한국 11월 소비자심리지수/.test(r.ti)) && !t24.some(r => /Consumer Survey/.test(r.ti)), JSON.stringify(t24.map(r => r.ti)));
    ok('11/24: 내 종목(ADI)은 한 줄씩 — 보유 · 장 시작 전 · EPS 예상', t24.some(r => /아날로그 디바이시스 실적 발표/.test(r.ti) && /보유/.test(r.de) && /장 시작 전/.test(r.de) && /EPS 예상 3\.88/.test(r.de)), JSON.stringify(t24.filter(r => /아날로그/.test(r.ti))));
    const t25 = await tl('2026-11-25');
    ok('11/25: 남의 종목 실적은 한 줄로 요약(5건) → 실적시즌으로 이동', t25.some(r => /실적 발표 5건 \(내 종목 외\)/.test(r.ti) && /aqSchGoEarn/.test(r.onclick)), JSON.stringify(t25.map(r => r.ti)));
    const t26 = await tl('2026-11-26');
    ok('11/26: 날짜 없던 내 종목(MYTBD)은 월요일+요일로 계산해 (시간 미정) 꼬리표', t26.some(r => /내날짜없는회사 실적 발표 \(시간 미정\)/.test(r.ti)), JSON.stringify(t26.map(r => r.ti)));
    ok('11/26: 날짜 없던 남의 종목(OTHTBD)은 달력 목록에 안 나옴(요약 줄에도 안 셈)', !t26.some(r => /남날짜없는회사/.test(r.ti)) && !t26.some(r => /실적 발표 \d+곳/.test(r.ti)), JSON.stringify(t26.map(r => r.ti)));
    ok('11/26: 미국 증시 휴장도 같은 날', t26.some(r => /미국 증시 휴장/.test(r.ti)));
    const t10 = await tl('2026-11-10');
    ok('경제지표: 이전 값만 있으면 「이전 3.1%」, 예상이 비면 「-」 없이 감춤', t10.some(r => /이전 3\.1%/.test(r.de) && !/예상/.test(r.de) && !/-\s*$/.test(r.de)), JSON.stringify(t10.map(r => r.de)));

    // 필터: 경제지표 끄면 점 · 목록에서 사라짐
    await p.evaluate(() => aqCalToggleFilter('macro')); await p.waitForTimeout(300);
    const off = await p.evaluate(() => { const c = document.querySelector('.cal-cell[data-date="2026-11-10"]'); return { dots: c.querySelectorAll('.cal-cell-dot').length, chip: document.querySelector('.cal-filter-chip[data-filter="macro"]').classList.contains('off') }; });
    ok('필터 「경제지표」 끄면 11/10 점이 사라지고 칩이 흐려짐', off.dots === 0 && off.chip, JSON.stringify(off));
    await p.evaluate(() => aqCalToggleFilter('macro'));

    /* ───── 실적시즌 (v9.14 시안) ───── */
    await p.evaluate(() => { window.__pvCalls = []; window.__pvRows = []; const o = window.apiCall; window.apiCall = async (n, q) => { if (n === 'userDataGet') { window.__pvCalls.push(q && q.dataType); return { ok: true, rows: window.__pvRows }; } return o ? o(n, q) : { ok: false }; }; });   // 관리자 전용 검증 자료를 시험용 응답으로
    await p.evaluate(() => setScheduleSubtab('earn')); await p.waitForTimeout(700);
    const T = s => p.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }, s);
    const rowsI = () => p.evaluate(() => [...document.querySelectorAll('#earList .ear-r')].map(r => ({ d: r.querySelector('.ear-d').innerText.replace(/\s+/g, ' ').trim(), filed: r.querySelector('.ear-d').classList.contains('filed'), nm: r.querySelector('.ear-nm').textContent, my: !!r.querySelector('.ear-my'), notes: [...r.querySelectorAll('.ear-note')].map(x => x.textContent), v: [...r.querySelectorAll('.ear-v > *')].map(x => x.textContent), vc: (r.querySelector('.ear-v > b:last-child') || {}).className || '', va: (r.querySelector('.ear-v > b:last-child') || { getAttribute() {} }).getAttribute('aria-label') || '', pend: (r.querySelector('.ear-p') || {}).innerText ? r.querySelector('.ear-p').innerText.replace(/\s+/g, ' ').trim() : '', first: r.classList.contains('first'), today: r.classList.contains('today') })));
    const blks = () => p.evaluate(() => [...document.querySelectorAll('#earBlocks .ear-blk')].map(b => ({ key: b.dataset.blk, h: b.querySelector('.ear-bh h4').innerText.replace(/\s+/g, ' ').trim(), cnt: b.querySelector('.cnt').textContent, empty: (b.querySelector('.ear-empty') || {}).textContent || '', colh: b.querySelector('.ear-ch').innerText.replace(/\s+/g, ' ').trim(), tip: !!b.querySelector('.tip'), rows: [...b.querySelectorAll('.ear-br')].map(r => ({ nm: r.querySelector('.ear-bn b').textContent, a: r.querySelector('.ear-bv span').textContent, b: r.querySelector('.ear-bv b').textContent, cls: r.querySelector('.ear-bv b').className, aria: r.querySelector('.ear-bv b').getAttribute('aria-label') || '' })) })));
    const bk = (bs, k) => bs.find(b => b.key === k) || { rows: [] };
    const st = await p.evaluate(() => ({ card: getComputedStyle(document.getElementById('earnSeasonCard')).display, cal: getComputedStyle(document.getElementById('scheduleCard')).display }));
    ok('실적시즌 탭: 실적시즌 카드만(달력 숨김)', st.card !== 'none' && st.cal === 'none', JSON.stringify(st));
    const hd = { title: await T('#earTitle'), asof: await T('#earAsOf'), colh: await T('#earColh'), all: await T('#earAll'), gone: await p.evaluate(() => !document.getElementById('earDesc') && !document.getElementById('earMeta')), q: await p.evaluate(() => [document.getElementById('earPrevQ').disabled, document.getElementById('earNextQ').disabled]) };
    ok('머리: 「2026년 3분기 실적」 · 파일 시각(한국시간) 「11월 22일 01:51 기준」 · 이전 분기만 눌림', hd.title === '2026년 3분기 실적' && hd.asof === '11월 22일 01:51 기준' && hd.q[0] === false && hd.q[1] === true, JSON.stringify(hd));
    ok('글은 최소: 설명 문장 · 날짜 범위 줄이 없음', hd.gone, '');
    ok('개수는 「전체 일정 보기 · 21건」 단추에(발표 횟수는 건)', /^전체 일정 보기 · 21건$/.test(hd.all), hd.all);
    ok('컬럼 머리(미국): 날짜 종목 매출 EPS EPS 컨센대비', hd.colh === '날짜 종목 매출 EPS EPS 컨센대비', hd.colh);
    const ord = await p.evaluate(() => { const y = s => document.querySelector(s).getBoundingClientRect().top; return [y('#earTitle'), y('#earAsOf'), y('#season-calendar'), y('#earBody .ear-sep'), y('#earBoard')]; });
    ok('폰 읽는 순서: 분기 이름 → 그 아래 기준 시각 → 일정 → 구분 띠 → 분기 실적', ord.every((v, i) => i === 0 || v > ord[i - 1]), JSON.stringify(ord.map(Math.round)));
    const bleed = await p.evaluate(() => { const s = document.querySelector('#earBody .ear-sep').getBoundingClientRect(); return { l: Math.round(s.left), w: Math.round(s.width), vw: innerWidth }; });
    ok('구분 띠가 화면 좌우 끝까지', bleed.l === 0 && bleed.w === bleed.vw, JSON.stringify(bleed));

    // 요약본: 직전 발표일 · 오늘이 없으니 예정 3일
    let r2 = await rowsI();
    const heads = r2.filter(r => r.first).map(r => r.d);
    ok('요약본: 예정 날짜 3개(11/24 화 · 11/25 수 · 11/26 목) — 날짜는 한 번만', JSON.stringify(heads) === JSON.stringify(['11/24 화', '11/25 수', '11/26 목']) && r2.filter(r => r.d).length === 3, JSON.stringify(heads));
    ok('요약본: 내 종목(ADI) 먼저 + 작은 점 · 앞으로의 줄에는 「발표 예정」만(한국시간은 오늘 줄에만)', r2[0].nm === '아날로그 디바이시스' && r2[0].my && r2[0].pend === '발표 예정', JSON.stringify(r2[0]));
    const unv = r2.find(r => r.nm === '미확정회사');
    const unvU = await p.evaluate(() => { const rs = [...document.querySelectorAll('#earList .ear-r')], r = rs.find(x => x.querySelector('.ear-nm').textContent === '미확정회사'), u = r.querySelector('.ear-p .unv'); return { u: !!u, title: u && u.title, aria: r.querySelector('.ear-p').getAttribute('aria-label'), others: rs.filter(x => x !== r).some(x => x.querySelector('.ear-p .unv')) }; });
    ok('분기 미확정(period_unverified): 줄마다 글자를 붙이지 않고 「발표 예정」 점선 밑줄 + 읽어 주는 글 · 해당 종목만', !!unv && unv.notes.length === 0 && unvU.u && unvU.title === '분기 미확정' && /분기 미확정/.test(unvU.aria) && !unvU.others && unv.pend === '발표 예정', JSON.stringify([unv, unvU]));
    ok('목록 아래 점선 안내는 한 줄 · 짧게(발표 예정 = 분기 미확정)', /^점선 밑줄: .*발표 예정 = 분기 미확정/.test(await T('#earList .ear-foot')) && (await p.evaluate(() => document.querySelectorAll('#earList .ear-foot').length)) === 1, await T('#earList .ear-foot'));
    ok('앞으로의 미국 줄에는 한국 날짜 · 시간 · 「시간 미정」을 붙이지 않음(글이 많아지지 않게)', r2.filter(r => /필러|미확정/.test(r.nm) || r.nm === '아날로그 디바이시스').every(r => r.pend === '발표 예정'), JSON.stringify(r2.slice(0, 6).map(r => r.pend)));
    const g1 = r2.findIndex((r, i) => i > 0 && r.first);
    ok('한 날짜는 5줄까지 + 「외 N건」 안내(11/24는 7건)', g1 === 5 && await p.evaluate(() => /^외 2건/.test(document.querySelector('#earList .ear-more').textContent)), 'g1=' + g1);
    ok('종목명: 서버 name이 코드뿐(ZJ)이면 코드, name_ko 있으면 name_ko', await p.evaluate(() => { const n = [...document.querySelectorAll('#earList .ear-nm')].map(x => x.textContent); return n.includes('ZJ') && n.includes('이름있는회사') && !n.includes('영문사전회사'); }));
    const ch = await p.evaluate(() => { const c = document.querySelector('#earList .ear-chip').getBoundingClientRect(), r = document.querySelector('#earList .ear-r').getBoundingClientRect(); return { chip: Math.round(c.height), row: Math.round(r.height), ow: document.documentElement.scrollWidth <= document.documentElement.clientWidth }; });
    ok('줄 높이 44 이상(진짜 터치 영역) · 알약 28 · 가로 넘침 없음', ch.chip === 28 && ch.row >= 44 && ch.row <= 70 && ch.ow, JSON.stringify(ch));
    await p.waitForTimeout(900);   // 줄이 떠오르는 움직임이 끝난 뒤에 재기
    const hit = await p.evaluate(() => { const c = document.querySelector('#earList .ear-chip'), r = c.getBoundingClientRect(); const x = r.left + 10, y = r.top - 6; const el = document.elementFromPoint(x, y); return !!el && (el === c || c.contains(el)); });
    ok('알약 위쪽 6px 밖도 눌림(투명 확장 · 줄 44)', hit);
    const ln = await p.evaluate(() => ({ r: getComputedStyle(document.querySelector('#earList .ear-r')).borderBottomWidth, last: getComputedStyle(document.querySelector('#earList .ear-r.last')).borderBottomWidth, b: getComputedStyle(document.querySelector('#earBlocks .ear-br')).borderBottomWidth }));
    ok('선 대신 간격: 일정 줄 · 분기 실적 줄 사이에 가는 선이 없음', ln.r === '0px' && ln.last === '0px' && ln.b === '0px', JSON.stringify(ln));
    const tone = await p.evaluate(() => { const b = document.querySelector('#earBoard .ear-tone button'), r = b.getBoundingClientRect(), a = getComputedStyle(b, '::after'); return { h: Math.round(r.height), ext: parseInt(a.top) + parseInt(a.bottom) }; });
    ok('서프라이즈 | 쇼크 알약: 눈에 보이는 높이 32 + 투명 확장으로 누르는 영역 44 이상', tone.h + Math.abs(tone.ext) >= 44, JSON.stringify(tone));
    // 오늘 줄에만 한국 날짜 · 시간: 시계를 미국 현지 11/24 새벽으로
    await p.clock.setFixedTime(new Date('2026-11-24T18:00:00+09:00')); await p.evaluate(() => { setMarket('KR'); setMarket('US'); }); await p.waitForTimeout(700);
    const tdy = (await rowsI()).filter(r => r.today);
    ok('오늘(미국 현지) 줄에만 한국 날짜 · 시간 — 「오늘 발표 한국 11/24 22:00」 · 시각 없는 줄은 「시간 미정」', tdy.some(r => r.nm === '아날로그 디바이시스' && r.pend === '오늘 발표 한국 11/24 22:00') && tdy.some(r => /필러/.test(r.nm) && r.pend === '오늘 발표 시간 미정'), JSON.stringify(tdy.slice(0, 4).map(r => [r.nm, r.pend])));
    await p.clock.setFixedTime(new Date('2026-11-22T12:00:00+09:00')); await p.evaluate(() => { setMarket('KR'); setMarket('US'); }); await p.waitForTimeout(500);

    // 전체 일정 보기
    ok('「전체 일정 보기」 버튼이 보임', await p.evaluate(() => !document.getElementById('earAll').hidden));
    await p.click('#earAll'); await p.waitForTimeout(300); r2 = await rowsI();
    ok('전체 일정: 21건이 날짜순으로 모두 · 버튼은 「요약만 보기」', r2.length === 21 && /요약만 보기/.test(await T('#earAll')), r2.length + '건');
    const by = n => r2.find(r => r.nm === n) || {};
    ok('발표 완료 줄: 매출 | EPS | EPS 컨센대비 — 상회 초록 · 하회 빨강 · 컨센 없으면 「-」', JSON.stringify(by('비트회사').v) === JSON.stringify(['244억', '1.10', '+10.0%']) && by('비트회사').vc === 'up' && by('미스회사').v[2] === '−5.2%' && by('미스회사').vc === 'dn' && JSON.stringify(by('언노운회사').v) === JSON.stringify(['1,127억', '4.56', '-']), JSON.stringify([by('비트회사').v, by('미스회사').v, by('언노운회사').v]));
    ok('같은 숫자로: 공급자 EPS 1.10(= 계산에 쓴 실제값)을 보여줌', by('비트회사').v[1] === '1.10');
    ok('발표문 기준값은 별표(*) + 읽어 주는 글 「발표문 인용 기준」', by('별표회사').v[2] === '+100%*' && /발표문 인용 기준/.test(by('별표회사').va), JSON.stringify(by('별표회사')));
    ok('공시 접수일(sec_filing_date)은 날짜에 점선 밑줄', by('접수일회사').filed === true && by('비트회사').filed === false, JSON.stringify([by('접수일회사').filed, by('비트회사').filed]));
    ok('정정 공시(status revised)는 발표 완료 숫자 + 「정정 공시」 딱지', by('정정회사').notes.includes('정정 공시') && by('정정회사').v.length === 3, JSON.stringify(by('정정회사')));
    ok('날짜 없던 내 종목(MYTBD)은 요일로 계산한 날짜(11/26 목)에', r2.some(r => r.nm === '내날짜없는회사') && r2.find(r => r.nm === '내날짜없는회사').my === true);
    await p.click('#earAll'); await p.waitForTimeout(250);
    ok('「요약만 보기」로 돌아옴', (await rowsI()).length < 21 && /전체 일정 보기/.test(await T('#earAll')));

    // 검색
    await p.fill('#earSearch', '비트'); await p.waitForTimeout(250); r2 = await rowsI();
    ok('종목 찾기: 이름이 맞는 종목만(전체 일정으로 찾음)', r2.length === 1 && r2[0].nm === '비트회사', JSON.stringify(r2.map(r => r.nm)));
    await p.fill('#earSearch', '없는이름zz'); await p.waitForTimeout(250);
    ok('종목 찾기: 없으면 「찾는 종목이 없어요.」', /찾는 종목이 없어요/.test(await T('#earList')));
    await p.fill('#earSearch', ''); await p.waitForTimeout(250);

    // 분기 실적 — 미국
    let bs = await blks();
    ok('분기 실적 블록 4개(지난 분기 · 이번 분기 서프라이즈 · 지난 분기 · 이번 분기 흑자전환)', bs.length === 4 && /^지난 분기 서프라이즈 2개 2026년 2분기/.test(bs[0].h) && /^이번 분기 서프라이즈 2개 2026년 3분기/.test(bs[1].h) && /^지난 분기 흑자전환 1개/.test(bs[2].h) && /^이번 분기 흑자전환 2개/.test(bs[3].h), JSON.stringify(bs.map(b => b.h)));
    ok('서프라이즈 줄: EPS 실제 + 굵은 예상 대비 — 큰 순서(+100%* → +10.0%)', JSON.stringify(bk(bs, 'c-beat').rows.map(r => [r.nm, r.a, r.b])) === JSON.stringify([['별표회사', '2.00', '+100%*'], ['비트회사', '1.10', '+10.0%']]), JSON.stringify(bk(bs, 'c-beat').rows));
    ok('흑자전환: 이전 < 0 < 이번만(0→양수 · 전년 비교 · 기준 없음은 제외) — 개선 폭 큰 순서', JSON.stringify(bk(bs, 'c-turn').rows.map(r => [r.nm, r.a, r.b])) === JSON.stringify([['턴어라운드1', '−3억 →', '5억'], ['턴어라운드2', '−1억 →', '2억']]), JSON.stringify(bk(bs, 'c-turn').rows));
    ok('컬럼 머리: 「EPS · 예상 대비」 · 「2분기 실적 → 3분기 실적」 · 「1분기 실적 → 2분기 실적」 · 흑자전환에만 ⓘ', bk(bs, 'c-beat').colh === '종목 EPS · 예상 대비' && bk(bs, 'c-turn').colh === '종목 2분기 실적 → 3분기 실적' && bk(bs, 'p-turn').colh === '종목 1분기 실적 → 2분기 실적' && bk(bs, 'c-turn').tip && !bk(bs, 'c-beat').tip);
    ok('별표 설명은 짧게 한 줄(* 발표문 인용 기준)이 블록 아래에', /^\* 발표문 인용 기준$/.test(await T('#earBlocks .ear-foot')), await T('#earBlocks .ear-foot'));
    await p.click('#earBoard .ear-tone button[data-tone="miss"]'); await p.waitForTimeout(250); bs = await blks();
    ok('쇼크로 바꾸면 앞 두 블록만 바뀜(이번 분기 1개 · 지난 분기 「해당 종목이 없어요」)', /^지난 분기 쇼크 0개/.test(bs[0].h) && bk(bs, 'p-miss').empty === '해당 종목이 없어요.' && /^이번 분기 쇼크 1개/.test(bs[1].h) && bk(bs, 'c-miss').rows[0].b === '−5.2%' && bk(bs, 'c-miss').rows[0].cls === 'dn' && /흑자전환 2개/.test(bs[3].h), JSON.stringify(bs.map(b => b.h + ' ' + b.empty)));
    await p.click('#earBoard .ear-tone button[data-tone="beat"]'); await p.waitForTimeout(200);
    // 분기 이동
    await p.click('#earPrevQ'); await p.waitForTimeout(300); bs = await blks();
    const q2 = { title: await T('#earTitle'), q: await p.evaluate(() => [document.getElementById('earPrevQ').disabled, document.getElementById('earNextQ').disabled]) };
    ok('분기 이동: 2026년 2분기(이전 분기 막힘 · 다음 분기 열림)', q2.title === '2026년 2분기 실적' && q2.q[0] === true && q2.q[1] === false, JSON.stringify(q2));
    ok('그 앞 분기 파일이 없으면 지난 분기 블록은 「이전 분기 자료가 없어요.」', bk(bs, 'p-beat').empty === '이전 분기 자료가 없어요.' && /—/.test(bk(bs, 'p-beat').cnt) && /^이번 분기 서프라이즈 2개 2026년 2분기/.test(bs[1].h), JSON.stringify(bs.map(b => b.h + ' ' + b.empty)));
    await p.click('#earNextQ'); await p.waitForTimeout(300);
    // 한국
    await p.evaluate(() => setMarket('KR')); await p.waitForTimeout(500); bs = await blks(); r2 = await rowsI();
    const kr = { colh: await T('#earColh'), all: await T('#earAll'), mk: await p.evaluate(() => [...new Set([...document.querySelectorAll('#earList .ear-chip')].map(c => c.dataset.mk))]) };
    ok('앱 시장 KR: 일정 · 컬럼 머리가 한국만(영업이익) · 설명 없음', kr.colh === '날짜 종목 매출 영업이익 영업이익 컨센대비' && kr.mk.length === 1 && kr.mk[0] === 'KR' && !(await p.evaluate(() => document.getElementById('earDesc'))), JSON.stringify(kr));
    const k = n => r2.find(r => r.nm === n) || {};
    ok('한국 줄: 매출(조 · 억) | 영업이익 | 영업이익 컨센대비 · 매출이 없으면 「-」', JSON.stringify(k('한화오션').v) === JSON.stringify(['3.4조', '4,857억', '+21.4%']) && k('한화오션').vc === 'up' && JSON.stringify(k('신한지주').v) === JSON.stringify(['-', '1.2조', '-']), JSON.stringify([k('한화오션').v, k('신한지주').v]));
    ok('한국 모드: 줄마다 「한국」 딱지를 달지 않음(시장은 앱 토글 하나로만 구분)', !(await p.evaluate(() => /한국/.test([...document.querySelectorAll('#earList .ear-chip')].map(c => c.textContent).join('')))));
    ok('한국 블록: 예상 대비는 영업이익 기준(이번 분기 1개) · 지난 분기는 비교 자료 없음 → 「비교 자료가 아직 없어요.」', /^이번 분기 서프라이즈 1개/.test(bs[1].h) && bk(bs, 'c-beat').colh === '종목 영업이익 · 예상 대비' && bk(bs, 'c-beat').rows[0].a === '4,857억' && bk(bs, 'p-beat').empty === '비교 자료가 아직 없어요.', JSON.stringify(bs.map(b => b.h + ' ' + b.empty)));
    ok('한국 흑자전환: 지난 분기 1개(영업이익 KRW) · 이번 분기 1개(한화오션 −10억 → 4,857억)', /흑자전환 1개/.test(bs[2].h) && bk(bs, 'p-turn').rows[0].b === '50억' && bk(bs, 'c-turn').rows[0].a === '−10억 →' && bk(bs, 'c-turn').rows[0].b === '4,857억', JSON.stringify(bs.map(b => b.h)));
    // 관리자 전용 검증 자료(KR_EARNINGS_REVIEW): 공개 쌍이 없는 한국 종목에만 겹쳐 씀 · 공개 쌍이 있으면 공개가 이김
    await p.evaluate(() => {
      const row = (quarter, tk, o) => ({ quarter, instrument_id: 'KR:' + tk, market: 'KR', ticker: tk, metrics: { operating_income: Object.assign({ unit: 'KRW' }, o) } });
      window.__pvRows = [
        row('2026q3', '055550', { actual: 1234500000000, expected: 1000000000000, surprise_pct: 23.46, estimate_as_of: '2026-11-10' }),
        row('2026q3', '042660', { actual: 485689713072, expected: 1, surprise_pct: 99999, estimate_as_of: '2026-11-01' }),
        row('2026q2', 'K1', { actual: 5e9, expected: 4e9, surprise_pct: 25, expected_kind: 'announcement_quoted' })
      ];
      window.__pvCalls = []; AqSch._priv.reset(); setMarket('US'); setMarket('KR');
    });
    await p.waitForTimeout(900); bs = await blks(); r2 = await rowsI();
    const pvc = await p.evaluate(() => window.__pvCalls.slice());
    ok('관리자 + 한국: userDataGet({dataType:KR_EARNINGS_REVIEW})를 한 번 부름', pvc.length === 1 && pvc[0] === 'KR_EARNINGS_REVIEW', JSON.stringify(pvc));
    ok('겹쳐 쓰기: 이번 분기 서프라이즈 2개 — 신한지주(검증 자료 +23.5%, 점선 밑줄)가 앞 · 한화오션은 공개 쌍(+21.4%)이 이김', /^이번 분기 서프라이즈 2개/.test(bs[1].h) && JSON.stringify(bk(bs, 'c-beat').rows.map(r => [r.nm, r.b, /\bpv\b/.test(r.cls)])) === JSON.stringify([['신한지주', '+23.5%', true], ['한화오션', '+21.4%', false]]), JSON.stringify(bk(bs, 'c-beat').rows));
    ok('발표문 기준(expected_kind)은 별표 · 지난 분기 서프라이즈 1개(지난한국턴 +25.0%*)', /^지난 분기 서프라이즈 1개/.test(bs[0].h) && bk(bs, 'p-beat').rows[0].b === '+25.0%*' && /pv/.test(bk(bs, 'p-beat').rows[0].cls), JSON.stringify(bk(bs, 'p-beat').rows));
    const sh = r2.find(r => r.nm === '신한지주') || { v: [], vc: '' }, hw = r2.find(r => r.nm === '한화오션') || { v: [], vc: '' };
    ok('일정 줄에도: 신한지주 영업이익 컨센대비 +23.5%(점선 밑줄) · 공개 쌍 한화오션은 그대로', sh.v[2] === '+23.5%' && /pv/.test(sh.vc) && !/pv/.test(hw.vc), JSON.stringify([sh, hw]));
    ok('점선 안내: 「숫자 = 관리자 전용 자료」(블록 · 일정 둘 다) + 별표 설명은 짧게', /관리자 전용 자료/.test(await T('#earBlocks')) && /관리자 전용 자료/.test(await T('#earList')) && /발표문 인용 기준/.test(await T('#earBlocks')));
    await p.evaluate(() => { document.body.setAttribute('data-role', 'guest'); window.dispatchEvent(new Event('aq:logout')); }); await p.waitForTimeout(500);
    const lo = await p.evaluate(() => ({ pv: document.querySelectorAll('#earBody .pv').length, c: [...document.querySelectorAll('#earBlocks .ear-blk')][1].querySelector('.cnt').textContent }));
    ok('로그아웃(aq:logout) 하면 검증 자료를 비우고 공개 데이터만(이번 분기 서프라이즈 1개)', lo.pv === 0 && lo.c === '1개', JSON.stringify(lo));
    await p.evaluate(() => { document.body.setAttribute('data-role', 'admin'); window.dispatchEvent(new Event('aq:login')); }); await p.waitForTimeout(900);
    ok('다시 로그인(aq:login)하면 다시 읽어서 채움(이번 분기 서프라이즈 2개)', /이번 분기 서프라이즈 2개/.test((await blks())[1].h), (await blks())[1].h);
    const pvu = await p.evaluate(() => {
      const ev = (act, local) => ({ q: '2026q3', mk: 'KR', raw: { instrument_id: 'KR:X', local_date: local || '2026-11-25', metrics: { operating_income: { actual: act } } } });
      const t = (o, e) => { AqSch._priv.set(new Map([['2026q3|KR:X', { quarter: '2026q3', instrument_id: 'KR:X', metrics: { operating_income: Object.assign({ unit: 'KRW', actual: 100, expected: 80, surprise_pct: 25, estimate_as_of: '2026-11-01' }, o) } }]])); return AqSch._priv.pair(e || ev(100)); };
      const q = r => r && { quoted: r.quoted, pct: r.pct };
      return { dated: q(t({})), after: q(t({ estimate_as_of: '2026-11-26' })), calendar: t({ expected_kind: 'calendar_unnamed' }), untimed: t({ expected_kind: 'untimed' }), nodate: t({ estimate_as_of: '' }), mismatch: t({}, ev(200)), usd: t({ unit: 'USD' }), zero: t({ expected: 0 }), nopct: t({ surprise_pct: null }), consensus: q(t({ expected_kind: 'consensus_dated', estimate_as_of: '' })) };
    });
    ok('검증 자료 규칙: 기록일<발표일=발표 전(표시 없음) · 발표일 이후=별표 · 집계기관 미명시 · 기록 시점 미확인 · 실제값 불일치 · 단위 다름 · 예상 0 · 비율 없음은 쓰지 않음', !!pvu.dated && pvu.dated.quoted === false && !!pvu.after && pvu.after.quoted === true && pvu.calendar === null && pvu.untimed === null && pvu.nodate === null && pvu.mismatch === null && pvu.usd === null && pvu.zero === null && pvu.nopct === null && !!pvu.consensus && pvu.consensus.quoted === false, JSON.stringify(pvu));
    await p.evaluate(() => { window.__pvRows = []; AqSch._priv.reset(); });
    await p.evaluate(() => setMarket('US')); await p.waitForTimeout(500);
    const back = { all: await T('#earAll'), n: (await blks()).length, mk: await p.evaluate(() => [...new Set([...document.querySelectorAll('#earList .ear-chip')].map(c => c.dataset.mk))]), b0: (await blks())[1].h };
    ok('미국으로 돌아오면 일정 · 블록이 모두 미국으로', /전체 일정 보기 · 21건/.test(back.all) && back.mk.length === 1 && back.mk[0] === 'US' && /서프라이즈 2개/.test(back.b0), JSON.stringify(back));

    // 블록 안에서
    await p.click('#earBlocks .ear-bn[data-tk="BEAT"]'); let op = await p.evaluate(() => window.__opened);
    ok('블록 줄의 종목을 누르면 종목페이지(openChart)', op.length === 1 && op[0] === 'BEAT', JSON.stringify(op));
    await p.click('#earList .ear-chip[data-tk="ADI"]'); op = await p.evaluate(() => window.__opened);
    ok('일정의 종목 알약을 누르면 종목페이지(openChart)', op.length === 2 && op[1] === 'ADI', JSON.stringify(op));
    const hh = await p.evaluate(() => { const b = document.querySelector('#earBlocks .ear-heart').getBoundingClientRect(); return { h: Math.round(b.height), w: Math.round(b.width) }; });
    ok('분기 실적 줄: 하트 누르는 칸 높이 44 이상', hh.h >= 44, JSON.stringify(hh));
    // 하트 = 관심(모의매수) 담기 · 빼기는 한 번 물음
    await p.evaluate(() => { window.__asked = 0; window.aqAskSimPrice = async () => 100; window.aqConfirm = async () => { window.__asked++; return window.__yes; }; try { localStorage.removeItem('aq_watchlist_v1'); } catch (e) {} });
    await p.click('#earBlocks .ear-heart[data-heart="BEAT"]'); await p.waitForTimeout(300);
    const h1 = await p.evaluate(() => ({ has: AqWatchStore.has('US', 'BEAT'), on: document.querySelector('#earBlocks .ear-heart[data-heart="BEAT"]').classList.contains('on') }));
    await p.evaluate(() => { window.__yes = false; }); await p.click('#earBlocks .ear-heart[data-heart="BEAT"]'); await p.waitForTimeout(300);
    const h2 = await p.evaluate(() => ({ has: AqWatchStore.has('US', 'BEAT'), asked: window.__asked }));
    await p.evaluate(() => { window.__yes = true; }); await p.click('#earBlocks .ear-heart[data-heart="BEAT"]'); await p.waitForTimeout(300);
    const h3 = await p.evaluate(() => ({ has: AqWatchStore.has('US', 'BEAT'), asked: window.__asked, on: document.querySelector('#earBlocks .ear-heart[data-heart="BEAT"]').classList.contains('on') }));
    ok('하트: 누르면 담김(색이 채워짐) · 다시 누르면 한 번 묻고 · 아니오면 그대로 · 예면 빠짐', h1.has && h1.on && h2.has && h2.asked === 1 && !h3.has && h3.asked === 2 && !h3.on, JSON.stringify({ h1, h2, h3 }));

    // 달력 → 실적시즌
    await p.evaluate(() => { setScheduleSubtab('cal'); }); await p.waitForTimeout(300);
    await p.evaluate(() => { aqCalendarSelectDate('2026-11-25'); }); await p.waitForTimeout(250);
    await p.evaluate(() => { const r = [...document.querySelectorAll('#calSelectedList .tl-row')].find(x => /내 종목 외/.test(x.textContent)); r.click(); }); await p.waitForTimeout(600);
    const go = await p.evaluate(() => ({ ctab: document.body.getAttribute('data-ctab'), g: !!document.querySelector('#earList [data-date="2026-11-25"]'), all: document.getElementById('earAll').textContent.trim(), q: document.getElementById('earTitle').textContent }));
    ok('달력의 「실적 발표 N건」을 누르면 실적시즌의 전체 일정이 열리고 그 날짜(11/25)가 있음 · 같은 시장', go.ctab === 'earn' && go.g && /요약만 보기/.test(go.all) && go.q === '2026년 3분기 실적', JSON.stringify(go));
    await p.screenshot({ path: path.join(OUT, 'sched_phone_earn.png') });
    await p.evaluate(() => { setScheduleSubtab('cal'); aqCal.selected = '2026-11-24'; aqCalendarRender(); }); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(OUT, 'sched_phone_cal.png') });

    // 종목명 폴백 순서
    const nm = await p.evaluate(() => {
      const mk = (raw, tk, mkt) => ({ raw, tk, mk: mkt || 'US' }); const f = AqSch.nameOf; const out = {};
      _state.tickerCompanyMaps = _state.tickerCompanyMaps || {}; _state.tickerCompanyMaps.US = _state.tickerCompanyMaps.US || {};
      out.a = f(mk({ name_ko: '한글이름', name: 'Eng' }, 'ZZA'));
      _state.tickerCompanyMaps.US.ZZB = '사전한글'; out.b = f(mk({ name: '서버이름' }, 'ZZB'));
      _state.tickerCompanyMaps.US.ZZC = 'English Dict Name'; out.c = f(mk({ name: '서버한글' }, 'ZZC'));
      out.d = f(mk({ name: 'ZZD' }, 'ZZD')); out.e = f(mk({ name: '서버이름E' }, 'ZZE')); out.f = f(mk({ name: '' }, 'ZZF'));
      return out;
    });
    ok('종목명 폴백: name_ko → 앱 한글 사전 → (코드와 다른) name → 코드', nm.a === '한글이름' && nm.b === '사전한글' && nm.c === '서버한글' && nm.d === 'ZZD' && nm.e === '서버이름E' && nm.f === 'ZZF', JSON.stringify(nm));
    const bm = await p.evaluate(() => [AqSch.beatMiss({ result: 'beat', metrics: { eps: {} } }), AqSch.beatMiss({ result: 'unknown', metrics: { eps: {} } }), AqSch.beatMiss({ result: 'pending', metrics: {} }), AqSch.beatMiss({ metrics: {} }), AqSch.beatMiss({ result: 'unknown', metrics: { eps: { provider_comparison: { result: 'miss', surprise_pct: -3 } } } })]);
    ok('Beat/Miss 분기: provider_comparison.result 우선 → 상위 result · unknown/pending/없음은 null', bm[0] && bm[0].r === 'beat' && bm[1] === null && bm[2] === null && bm[3] === null && bm[4] && bm[4].r === 'miss' && bm[4].pct === -3, JSON.stringify(bm));
    await p.context().close();
  }

  /* ───────── 관리자가 아니면 검증 자료를 부르지도 쓰지도 않음 ───────── */
  {
    const p = await open({ width: 360, height: 780 });
    await p.evaluate(() => { window.__pvCalls = []; const o = window.apiCall; window.apiCall = async (n, q) => { if (n === 'userDataGet') { window.__pvCalls.push(q && q.dataType); return { ok: true, rows: [] }; } return o ? o(n, q) : { ok: false }; }; switchMobileTab('schedule'); setScheduleSubtab('earn'); setMarket('KR'); });
    await until(p, () => window.AqSch && AqSch.ready()); await p.waitForTimeout(900);
    await p.evaluate(() => { AqSch._priv.set(new Map([['2026q3|KR:055550', { quarter: '2026q3', instrument_id: 'KR:055550', metrics: { operating_income: { unit: 'KRW', actual: 1234500000000, expected: 1e12, surprise_pct: 23.46, estimate_as_of: '2026-11-10' } } }]])); setMarket('US'); setMarket('KR'); }); await p.waitForTimeout(600);
    const na = await p.evaluate(() => ({ role: document.body.getAttribute('data-role'), calls: window.__pvCalls.length, pv: document.querySelectorAll('#earBody .pv').length, c: [...document.querySelectorAll('#earBlocks .ear-blk')][1].querySelector('.cnt').textContent }));
    ok('관리자가 아니면: userDataGet을 부르지 않고 · 검증 자료가 있어도 쓰지 않음(이번 분기 서프라이즈 1개 그대로)', na.role !== 'admin' && na.calls === 0 && na.pv === 0 && na.c === '1개', JSON.stringify(na));
    await p.context().close();
  }

  /* ───────── 와이드 1000×700 ───────── */
  {
    const p = await open({ width: 1000, height: 700 }); await stubMine(p);
    await p.evaluate(() => { window.__opened = []; window.openChart = t => window.__opened.push(t); switchMobileTab('schedule'); setScheduleSubtab('earn'); });
    await until(p, () => window.AqSch && AqSch.ready()); await p.waitForTimeout(600);
    const w = await p.evaluate(() => ({ wide: document.documentElement.classList.contains('aq-wide'), rows: document.querySelectorAll('#earList .ear-r').length, blocks: document.querySelectorAll('#earBlocks .ear-blk').length, ow: document.documentElement.scrollWidth <= document.documentElement.clientWidth, h: Math.min(...[...document.querySelectorAll('#earList .ear-r')].map(r => r.getBoundingClientRect().height)) }));
    ok('와이드: 실적시즌이 폰과 같은 구조(일정 줄 + 블록 4개)로 보임 · 가로 넘침 없음', w.wide && w.rows >= 3 && w.blocks === 4 && w.ow && w.h >= 32, JSON.stringify(w));
    await p.click('#earList .ear-chip'); const op = await p.evaluate(() => window.__opened);
    ok('와이드: 줄을 누르면 종목페이지를 연다(오른쪽 패널 · 중간 단계 없음)', op.length === 1, JSON.stringify(op));
    await p.screenshot({ path: path.join(OUT, 'sched_wide_earn.png') });
    await p.context().close();
  }

  /* ───────── 서버 파일을 못 받을 때 ───────── */
  {
    const p = await open({ width: 360, height: 780 }, 'down');
    await p.evaluate(() => { switchMobileTab('schedule'); setScheduleSubtab('cal'); aqCal.current = new Date(2026, 10, 1); aqCalendarRender(); }); await p.waitForTimeout(2500);
    const f = await p.evaluate(() => ({ ready: !!(window.AqSch && AqSch.ready()), cells: document.querySelectorAll('#calendarGrid .cal-cell').length, chips: document.querySelectorAll('.cal-filter-chip').length }));
    ok('받기 실패: 달력은 그대로 그려지고(예전 시트 경로) 새 데이터 없음으로 표시', !f.ready && f.cells >= 35 && f.chips === 4, JSON.stringify(f));
    await p.evaluate(() => setScheduleSubtab('earn')); await p.waitForTimeout(2500);
    const e = await p.evaluate(() => ({ txt: document.getElementById('earList').textContent.replace(/\s+/g, ' ').trim(), retry: !!document.querySelector('#earList .ear-retry') }));
    ok('받기 실패: 실적시즌은 빈 화면 대신 안내 + 다시 불러오기', /불러오지 못했어요/.test(e.txt) && e.retry, JSON.stringify(e));
    await p.context().close();
  }

  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
