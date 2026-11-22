// 일정 시험 — node tools/ui-test/sched.js   (v8.88: 통합캘린더 새 데이터 · 필터 4개 · 날짜 없는 내 종목 실적 · 한국 경제지표 한글 · 실적시즌 · Beat/Miss 조건부 · 종목명 폴백 · 한국 실적 · 예전 경로 폴백)
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
const EARN = { schema_version: 2, quarter: '2026q3', revision: 'r1', items: [
  US('ADI', '아날로그 디바이시스', 2, { session: 'BMO', date_kst: '2026-11-24', local_date: '2026-11-24', starts_at_kst: '2026-11-24T22:00:00+09:00', metrics: m({ expected: 3.88 }) }),
  US('ZJ', 'ZJ', 2, { date_kst: '2026-11-25', local_date: '2026-11-24', starts_at_kst: '2026-11-25T06:00:00+09:00', metrics: m({ expected: 2.12 }) }),
  US('NKO', '영문사전회사', 2, { name_ko: '이름있는회사', date_kst: '2026-11-25', local_date: '2026-11-24', starts_at_kst: '2026-11-25T06:00:00+09:00' }),
  US('BEAT', '비트회사', 3, { status: 'reported', session: 'BMO', date_kst: '2026-11-25', local_date: '2026-11-25', starts_at_kst: '2026-11-25T22:00:00+09:00', result: 'beat', metrics: m({ actual: 1.0, previous: 0.8, provider_comparison: { actual: 1.1, expected: 1.0, surprise_pct: 10 } }, { actual: 24397000000 }) }),
  US('MISS', '미스회사', 3, { status: 'reported', session: 'BMO', date_kst: '2026-11-25', local_date: '2026-11-25', starts_at_kst: '2026-11-25T22:00:00+09:00', result: 'miss', metrics: m({ actual: 0.5, previous: 0.9, provider_comparison: { actual: 0.5, expected: 0.6, surprise_pct: -5.2 } }) }),
  US('UNK', '언노운회사', 3, { status: 'reported', session: 'BMO', date_kst: '2026-11-25', local_date: '2026-11-25', starts_at_kst: '2026-11-25T22:00:00+09:00', result: 'unknown', metrics: m({ actual: 4.56, previous: 6.04 }, { actual: 112694000000 }) }),
  US('MYTBD', '내날짜없는회사', 4, { status: 'reported', session: 'TIME_TBD', date_kst: null, local_date: null, starts_at_kst: null, time_precision: 'date', result: 'unknown', metrics: m({ actual: 2.0, previous: 1.0 }) }),
  US('OTHTBD', '남날짜없는회사', 4, { status: 'reported', session: 'TIME_TBD', date_kst: null, local_date: null, starts_at_kst: null, time_precision: 'date', result: 'unknown', metrics: m({ actual: 1.0 }) }),
  KR('042660', '한화오션', 3, { date_kst: '2026-11-25', local_date: '2026-11-25', metrics: m({}, { unit: 'KRW', actual: 3413870310097 }, { unit: 'KRW', actual: 485689713072 }) }),
  KR('055550', '신한지주', 3, { date_kst: '2026-11-25', local_date: '2026-11-25', metrics: m({}, { unit: 'KRW', actual: null }, { unit: 'KRW', actual: 1234500000000 }) }),
] };
const mac = (id, title, d, t, mk, kind) => ({ id, kind: kind || 'macro', market: mk, instrument_ids: [], title, local_date: d, date_kst: d, starts_at_kst: t ? d + 'T' + t + ':00+09:00' : null, time_precision: t ? 'minute' : 'date', session: t ? 'INTRADAY' : 'TIME_TBD', category: kind === 'market_holiday' || kind === 'expiry' ? (kind === 'market_holiday' ? 'holiday' : 'expiry_filing') : 'macro', metrics: kind ? {} : { CPI: { unit: 'percent_yoy', actual: null, expected: null, previous: 3.1 } } });
const CAL = { schema_version: 2, month: '2026-11', revision: 'c1', items: [
  mac('macro:US:CPI:2026-11-10', '미국 소비자물가(CPI)', '2026-11-10', '22:30', 'US'),
  mac('macro:KR:CSI:2026-11-24', 'Consumer Survey Index (CSI) for November 2026', '2026-11-24', '06:00', 'KR'),
  mac('expiry:US:2026-11-20', '미국 월간 옵션 만기', '2026-11-20', null, 'US', 'expiry'),
  mac('holiday:US:2026-11-26', '미국 증시 휴장', '2026-11-26', null, 'US', 'market_holiday'),
] };
const INDEX = { schema_version: 2, status: 'partial', calendar: { '2026-11': 'calendar_2026-11.json' }, earnings_season: { '2026q3': 'earnings_2026q3.json' }, file_revisions: { 'calendar_2026-11.json': 'c1', 'earnings_2026q3.json': 'r1' }, revision: 'i1' };
const FILES = { 'schedule_index.json': INDEX, 'calendar_2026-11.json': CAL, 'earnings_2026q3.json': EARN };

(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  async function open(vp, mode) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, timezoneId: 'Asia/Seoul', locale: 'ko-KR' }); const p = await ctx.newPage();
    p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
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
  const stubMine = p => p.evaluate(() => { lsSet(lsKeyPF('US'), [{ ticker: 'ADI', qty: 3 }, { ticker: 'MYTBD', qty: 2 }]); });

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
    ok('11/25: 남의 종목 실적은 한 줄로 요약(7곳) → 실적시즌으로 이동', t25.some(r => /실적 발표 7곳 \(내 종목 외\)/.test(r.ti) && /aqSchGoEarn/.test(r.onclick)), JSON.stringify(t25.map(r => r.ti)));
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

    /* ───── 실적시즌 ───── */
    await p.evaluate(() => setScheduleSubtab('earn')); await p.waitForTimeout(700);
    const st = await p.evaluate(() => ({ card: getComputedStyle(document.getElementById('earnSeasonCard')).display, cal: getComputedStyle(document.getElementById('scheduleCard')).display, wk: document.getElementById('earWkT').textContent, strip: [...document.querySelectorAll('#earStrip button')].map(x => x.textContent.replace(/\s+/g, '')), on: document.querySelector('#earStrip .on') && document.querySelector('#earStrip .on').textContent.slice(0, 1), sum: document.getElementById('earSum').textContent.replace(/\s+/g, ' ').trim() }));
    ok('실적시즌 탭: 실적시즌 카드만(달력 숨김)', st.card !== 'none' && st.cal === 'none', JSON.stringify(st));
    ok('일요일(11/22)이면 곧 시작하는 주(11/23 ~ 11/27) · 월~금 5칸 · 발표가 있는 첫 날(화) 선택', st.wk === '11/23 ~ 11/27' && st.strip.length === 5 && st.on === '화', JSON.stringify(st));
    ok('시즌 요약: 발표 · 예정 · 내 종목 숫자', /2026년 3분기 실적시즌/.test(st.sum) && /발표 7 · 예정 3 · 내 종목 2/.test(st.sum), st.sum);
    const hs = await p.evaluate(() => { const r = s => [...document.querySelectorAll(s)].map(x => Math.round(x.getBoundingClientRect().height)); return { strip: r('#earStrip button'), nav: r('.sch-nav'), chip: r('#earMine'), row: r('.sch-row'), pill: r('#earMk .xtab-btn'), ow: document.documentElement.scrollWidth <= document.documentElement.clientWidth }; });
    ok('터치 영역 44px 이상(요일 칸 · 주 이동 · 내 종목만 · 줄)', hs.strip.every(h => h >= 44) && hs.nav.every(h => h >= 44) && hs.chip[0] >= 44 && hs.row.every(h => h >= 44) && hs.ow, JSON.stringify(hs));

    const rows = () => p.evaluate(() => [...document.querySelectorAll('#earList .sch-row')].map(r => ({ nm: r.querySelector('.sch-bd b').childNodes[0].textContent, chips: [...r.querySelectorAll('em')].map(e => e.textContent), sub: (r.querySelector('.sch-bd i') || {}).textContent || '', rt: (r.querySelector('.sch-rt') || {}).textContent || '', bm: (r.querySelector('.sch-bm') || {}).textContent || '', bmc: (r.querySelector('.sch-bm') || { className: '' }).className, tk: r.dataset.tk })));
    const grp = () => p.evaluate(() => [...document.querySelectorAll('#earList .sch-grp')].map(g => g.textContent.replace(/\s+/g, ' ')));
    const day = async d => { await p.click('#earStrip button[data-day="' + d + '"]'); await p.waitForTimeout(250); };
    let r2 = await rows(), g2 = await grp();
    ok('화: 장 시작 전(내 종목 ADI 먼저) → 장 마감 후 묶음', /장 시작 전/.test(g2[0]) && /장 마감 후/.test(g2[1]) && r2[0].nm === '아날로그 디바이시스' && r2[0].chips.includes('보유'), JSON.stringify({ g2, r: r2.map(r => r.nm) }));
    ok('발표 전: 한국시간 · 예상 EPS만(「-」 없음)', /한국시간 22:00/.test(r2[0].sub) && /3\.88예상 EPS/.test(r2[0].rt) && !/^-|\s-\s/.test(r2[0].rt), JSON.stringify(r2[0]));
    ok('종목명: 서버 name이 코드뿐(ZJ)이면 코드, name_ko 있으면 name_ko', r2.some(r => r.nm === 'ZJ') && r2.some(r => r.nm === '이름있는회사') && !r2.some(r => r.nm === '영문사전회사'), JSON.stringify(r2.map(r => r.nm)));
    await day(3); r2 = await rows();
    const by = n => r2.find(r => r.nm === n) || {};
    ok('Beat: 서버가 beat 를 주면 초록 점 + 「예상 상회 +10.0%」', /예상 상회 \+10\.0%/.test(by('비트회사').bm) && /\bup\b/.test(by('비트회사').bmc), JSON.stringify(by('비트회사')));
    ok('Miss: 서버가 miss 를 주면 빨강 점 + 「예상 하회 -5.2%」', /예상 하회 -5\.2%/.test(by('미스회사').bm) && /\bdn\b/.test(by('미스회사').bmc), JSON.stringify(by('미스회사')));
    ok('unknown 이면 뱃지 없음 · 실제 EPS와 이전 값만', by('언노운회사').bm === '' && /4\.56/.test(by('언노운회사').rt) && /이전 6\.04/.test(by('언노운회사').rt) && /매출 1,127억 달러/.test(by('언노운회사').sub), JSON.stringify(by('언노운회사')));
    ok('발표 후 매출 줄: 미국 달러 표기(억 달러)', /매출 244억 달러/.test(by('비트회사').sub), by('비트회사').sub);
    ok('한국: 영업이익 크게 · 매출 작게(조·억 원)', /4,857억 원영업이익/.test(by('한화오션').rt) && /매출 3\.4조 원/.test(by('한화오션').sub), JSON.stringify(by('한화오션')));
    ok('한국 금융지주: 매출이 없으면 매출 줄 자체를 감춤', by('신한지주').sub === '' && /영업이익/.test(by('신한지주').rt), JSON.stringify(by('신한지주')));
    ok('한국 종목에 「한국」 꼬리표', by('한화오션').chips.includes('한국'));
    // 시장 알약
    await p.click('#earMk .xtab-btn[data-mk="한국"]'); await p.waitForTimeout(250); r2 = await rows();
    ok('시장 알약 「한국」: 한국 종목만', r2.length === 2 && r2.every(r => r.chips.includes('한국')), JSON.stringify(r2.map(r => r.nm)));
    await p.click('#earMk .xtab-btn[data-mk="전체"]'); await p.waitForTimeout(200);
    // 목: 날짜 없는 85건 유형
    await day(4); r2 = await rows(); g2 = await grp();
    ok('날짜 없는 실적은 해당 요일(목) 「시간 미정」 묶음에', g2.length === 1 && /시간 미정/.test(g2[0]) && r2.length === 2, JSON.stringify({ g2, r: r2.map(r => r.nm) }));
    // 내 종목만
    await p.click('#earMine'); await p.waitForTimeout(250); r2 = await rows();
    ok('내 종목만: 목요일엔 내날짜없는회사만', r2.length === 1 && r2[0].nm === '내날짜없는회사', JSON.stringify(r2.map(r => r.nm)));
    const sd = await p.evaluate(() => [...document.querySelectorAll('#earStrip button')].map(b => b.textContent.replace(/\s+/g, '')));
    ok('내 종목만: 요일 칸 건수도 따라서 바뀜', sd[1] === '화1곳' && sd[2] === '수0곳' && sd[3] === '목1곳', JSON.stringify(sd));
    await p.click('#earMine'); await day(2);
    // 주 이동
    const wk2 = await p.evaluate(() => ({ t: document.getElementById('earWkT').textContent, prev: document.getElementById('earPrev').disabled, next: document.getElementById('earNext').disabled, now: document.getElementById('earNow').disabled }));
    ok('주 이동: 데이터가 한 주뿐이면 ‹ › 이번 주 모두 막힘', wk2.t === '11/23 ~ 11/27' && wk2.prev && wk2.next && wk2.now, JSON.stringify(wk2));
    // 종목 줄 누르면 종목페이지
    await p.click('#earList .sch-row[data-tk="ADI"]'); const op = await p.evaluate(() => window.__opened);
    ok('줄을 누르면 종목페이지(openChart)', op.length === 1 && op[0] === 'ADI', JSON.stringify(op));
    // 달력 → 실적시즌 이동
    await p.evaluate(() => { setScheduleSubtab('cal'); }); await p.waitForTimeout(300);
    await p.evaluate(() => { aqCalendarSelectDate('2026-11-25'); }); await p.waitForTimeout(250);
    await p.evaluate(() => { const r = [...document.querySelectorAll('#calSelectedList .tl-row')].find(x => /내 종목 외/.test(x.textContent)); r.click(); }); await p.waitForTimeout(500);
    const go = await p.evaluate(() => ({ ctab: document.body.getAttribute('data-ctab'), on: document.querySelector('#earStrip .on').textContent.slice(0, 1) }));
    ok('달력의 「실적 발표 N곳」을 누르면 실적시즌으로 — 그 날 첫 실적의 시장 거래일(화)로 열림', go.ctab === 'earn' && go.on === '화', JSON.stringify(go));
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

  /* ───────── 와이드 1000×700 ───────── */
  {
    const p = await open({ width: 1000, height: 700 }); await stubMine(p);
    await p.evaluate(() => { window.__opened = []; window.openChart = t => window.__opened.push(t); switchMobileTab('schedule'); setScheduleSubtab('earn'); });
    await until(p, () => window.AqSch && AqSch.ready()); await p.waitForTimeout(600);
    const w = await p.evaluate(() => ({ wide: document.documentElement.classList.contains('aq-wide'), rows: document.querySelectorAll('#earList .sch-row').length, ow: document.documentElement.scrollWidth <= document.documentElement.clientWidth, h: Math.min(...[...document.querySelectorAll('#earList .sch-row')].map(r => r.getBoundingClientRect().height)) }));
    ok('와이드: 실적시즌 목록이 같은 구조로 보임 · 가로 넘침 없음 · 줄 44 이상', w.wide && w.rows >= 3 && w.ow && w.h >= 44, JSON.stringify(w));
    await p.click('#earList .sch-row'); const op = await p.evaluate(() => window.__opened);
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
    const e = await p.evaluate(() => ({ txt: document.getElementById('earList').textContent.replace(/\s+/g, ' ').trim(), retry: !!document.querySelector('#earList .sch-retry') }));
    ok('받기 실패: 실적시즌은 빈 화면 대신 안내 + 다시 불러오기', /불러오지 못했어요/.test(e.txt) && e.retry, JSON.stringify(e));
    await p.context().close();
  }

  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
