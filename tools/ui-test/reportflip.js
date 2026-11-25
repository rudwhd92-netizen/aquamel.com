// 종목 카드 뒤집기 · AI리포트 시험 — node tools/ui-test/reportflip.js   (v8.83: 연구 › AI리포트 · 발견 · 마이 › 실시간 현황)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다 · 발견 카드는 저장소의 data 폴더가 같이 서빙돼야 그려진다
//   보고서 본문은 tools/ui-test/fixtures/ 의 가상 보고서로 바꿔 끼운다(서버 호출 없음)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
const FIX = fs.readFileSync(path.join(__dirname, 'fixtures', 'report_v3.txt'), 'utf8'), LEG = fs.readFileSync(path.join(__dirname, 'fixtures', 'report_legacy.txt'), 'utf8');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
async function prep(b, vp) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon|manifest|fonts\.g|CORS policy|아카이브 로드 실패/i.test(m.text())) console.log('CONSOLE.ERROR ' + m.text().slice(0, 160)); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.waitForFunction(() => _state.archive && _state.archive.length > 100, null, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(800);
  await p.evaluate(([fix, leg]) => {   // 데이터가 다 들어온 뒤에 가짜 목록을 넣고, 인덱스를 다시 받아 덮어쓰지 못하게 막음
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); document.body.setAttribute('data-broker', 'linked');
    fetchReportsIndex = async () => {};
    const STUB = { US: { CL: ['2026-11-20'], WMB: ['2026-11-18'], ELV: ['2026-11-19'], PLD: ['2026-11-17'] }, KR: {} };
    Object.defineProperty(_state, 'reports', { get: () => STUB, set: () => {}, configurable: true });   // 늦게 도착하는 실제 인덱스가 덮어쓰지 못하게
    fetchReportContent = async (tk, d) => (String(tk).toUpperCase() === 'PLD' ? leg : fix);   // PLD만 옛 양식
  }, [FIX, LEG]);
  return p;
}
const rotY = (p, sel) => p.evaluate(sel => { const f = document.querySelector(sel + ' .fl-flipper'); const m = f && /rotateY\(([-\d.]+)deg\)/.exec(f.style.transform); return m ? +m[1] : 0; }, sel);
const stageBox = async (p, sel) => p.evaluate(sel => { const e = document.querySelector(sel + ' .fl-stage').getBoundingClientRect(); return { x: e.x, y: e.y, w: e.width, h: e.height }; }, sel);
async function hold(p, sel, ms, dx) {
  await p.evaluate(sel => document.querySelector(sel + ' .fl-stage').scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(300);
  const bx = await stageBox(p, sel); const x = bx.x + bx.w * 0.4, y = bx.y + bx.h * 0.55;
  await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(ms);
  if (dx) { await p.mouse.move(x + dx, y + 2, { steps: 5 }); await p.waitForTimeout(500); }
  await p.mouse.up(); await p.waitForTimeout(1100);
}
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });

  // ───────── 연구 › AI리포트 (모바일 390)
  let p = await prep(b, { width: 390, height: 844 });
  await p.evaluate(() => { switchMobileTab('research'); setAiSubtab('report'); buildAnalysisGrid(); });
  await p.waitForSelector('#rpFeed .feed-item', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1500);
  const bar = await p.evaluate(() => { const bar = document.getElementById('rpBar'), s = bar.querySelector('.rp-srch'), rs = s.getBoundingClientRect(); return { flt: bar.querySelectorAll('.rp-flt, [data-rf]').length, sub: (bar.querySelector('.rp-sub') || {}).textContent || '', srchH: Math.round(rs.height), srchW: Math.round(rs.width) }; });
  ok('AI리포트(v8.89): 전체 · 보유 · 관심 · 매수의견 알약이 없음 · 검색 단추만 남음', bar.flt === 0 && /최신순/.test(bar.sub) && !/내 종목 먼저/.test(bar.sub) && bar.srchH === 44 && bar.srchW === 44, JSON.stringify(bar));
  const n = await p.evaluate(() => document.querySelectorAll('#rpFeed .feed-item').length);
  ok('AI리포트: 보고서 있는 종목 4개가 발견과 같은 카드(.feed-item)로 나옴', n === 4, String(n));
  await p.evaluate(() => document.querySelectorAll('#rpFeed .feed-item').forEach(i => i.scrollIntoView())); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('#rpFeed .feed-item[data-ticker="CL"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(800);
  const core = await p.evaluate(() => { const it = document.querySelector('#rpFeed .feed-item[data-ticker="CL"]'), rs = it.querySelector('.fl-front .rs'); const host = it.querySelector('.rc-host'), f = it.querySelector('.fl-front'); const sl = rs ? [...rs.querySelectorAll('.rs-sl')] : []; const more = rs && rs.querySelector('.rs-more'), mb = more && more.getBoundingClientRect(), mcs = more && getComputedStyle(more); return { n: sl.length, q: !!(rs && rs.querySelector('.rs-q')), pill: !!(rs && rs.querySelector('.rs-pill')), st: ((rs && rs.querySelector('.rs-stt')) || {}).textContent, dots: rs ? rs.querySelectorAll('.rs-dots button').length : 0, op: !!(rs && rs.querySelector('.rc-op')), fit: !!rs && rs.scrollHeight <= f.clientHeight + 1 && sl.every(x => x.scrollHeight <= x.clientHeight + 1), moreH: mb ? Math.round(mb.height) : 0, moreBg: mcs ? mcs.backgroundColor : '', moreTxt: more ? more.textContent.trim() : '' }; });
  ok('AI리포트(v8.96): 카드 안 슬라이드 3장(① 5 WHYS 문답 · ② 최종 판정 · ③ 선언문 한 문장) · 점 3개', core.n === 3 && core.dots === 3 && core.q && core.pill && core.st === '사람들은 앞으로도 문서를 만들고, 회사는 그 문서를 정리할 도구가 필요해요.', JSON.stringify({ n: core.n, q: core.q, pill: core.pill, st: core.st }));
  ok('AI리포트(v8.89): ② 슬라이드에 의견 알약 · 슬라이드 안에 들어감(잘림 없음)', core.op && core.fit, JSON.stringify({ op: core.op, fit: core.fit }));
  ok('AI리포트(v8.89): 전문 보기 = 작은 글자 버튼(바탕 없음 · 터치 높이 44)', core.moreTxt === '전문 보기 ›' && core.moreH >= 44 && /rgba\(0, 0, 0, 0\)|transparent/.test(core.moreBg), JSON.stringify({ h: core.moreH, bg: core.moreBg }));
  const legacy = await p.evaluate(() => { const it = document.querySelector('#rpFeed .feed-item[data-ticker="PLD"]'); const rc = it && it.querySelector('.fl-front .rc'); return rc ? rc.innerText : ''; });
  ok('AI리포트: 옛 양식 보고서는 안내 문구 + 전문 보기(깨지지 않음)', /옛 양식/.test(legacy) && /보고서 전문 보기/.test(legacy), legacy.replace(/\s+/g, ' ').slice(0, 60));
  const noChart = await p.evaluate(() => [...document.querySelectorAll('#rpFeed .feed-item')].map(i => !!(i.querySelector('canvas') && i.querySelector('canvas')._aqChart)));
  ok('AI리포트(모바일): 뒷면 차트는 아직 안 그림(지연 렌더링)', noChart.every(x => !x), JSON.stringify(noChart));
  ok('AI리포트(모바일): 시그널 이력은 숨김(발견과 같음)', await p.evaluate(() => getComputedStyle(document.querySelector('#rpFeed .feed-side')).display) === 'none');
  // 길게 눌러 뒤집기
  const sel = '#rpFeed .feed-item[data-ticker="CL"]';
  await hold(p, sel, 650); let r = await rotY(p, sel);
  ok('AI리포트: 길게 누르면 차트 면으로 뒤집힘', Math.abs(r - 180) < 4, 'rotY ' + r.toFixed(1));
  const ch = await p.evaluate(sel => { const it = document.querySelector(sel), cv = it.querySelector('canvas'); return { chart: !!cv._aqChart, w: cv.clientWidth, h: cv.clientHeight, pill: !!it.querySelector('.feed-tf .aq-tp-ind'), act: (it.querySelector('.feed-tf button.active') || {}).textContent }; }, sel);
  ok('AI리포트: 뒷면 차트가 처음 뒤집을 때 실제 크기로 그려짐(폭 0 아님) · 3M/6M/1Y 알약', ch.chart && ch.w > 200 && ch.h > 200 && ch.pill && ch.act === '3M', JSON.stringify(ch));
  const pillOK = await p.evaluate(sel => { const it = document.querySelector(sel), r = it.querySelector('.feed-tf'), a = r.querySelector('button.active'), i = r.querySelector('.aq-tp-ind'); const ar = a.getBoundingClientRect(), ir = i.getBoundingClientRect(); return { btnW: Math.round(ar.width), indW: Math.round(ir.width), dx: Math.round(ir.left - ar.left) }; }, sel);
  ok('AI리포트: 뒤집힌 뒤 알약 바탕이 선택 버튼 자리(안쪽 4)', Math.abs(pillOK.indW - (pillOK.btnW - 8)) <= 2 && Math.abs(pillOK.dx - 4) <= 2, JSON.stringify(pillOK));
  await p.screenshot({ path: path.join(OUT, 'rp_flipped.png') });
  // 8px 넘게 움직이면 취소 → 차트 스크럽
  const r0 = await rotY(p, sel); await hold(p, sel, 300, 40); ok('누른 채 8px 넘게 이동하면 뒤집기 취소(회전 그대로)', Math.abs((await rotY(p, sel)) - r0) < 4);
  await hold(p, sel, 150); ok('0.15초만 누르면 안 뒤집힘', Math.abs((await rotY(p, sel)) - r0) < 4);
  // 단서 단추로 돌아옴
  await p.evaluate(sel => { const it = document.querySelector(sel); [...it.querySelectorAll('.fl-face')].find(f => !f.inert).querySelector('.fl-cue').click(); }, sel); await p.waitForTimeout(1200);
  ok('작은 단서 단추를 누르면 리포트 면으로 복귀', Math.abs(await rotY(p, sel)) < 4);
  const cueH = await p.evaluate(sel => { const c = document.querySelector(sel + ' .fl-cue').getBoundingClientRect(); return [Math.round(c.width), Math.round(c.height)]; }, sel);
  ok('뒤집기 단서 단추의 터치 영역 44 이상', cueH[0] >= 44 && cueH[1] >= 44, cueH.join('x'));
  // 평소에는 카드 면 없음 · 누를 때만
  const lift0 = await p.evaluate(sel => getComputedStyle(document.querySelector(sel + ' .fl-stage')).getPropertyValue('--lift').trim(), sel);
  ok('평소에는 배경 카드 면이 없음(발견과 같은 모양)', parseFloat(lift0) === 0, '--lift ' + lift0);
  // 순서(알약 없음) · 검색
  const order = await p.evaluate(() => [...document.querySelectorAll('#rpFeed .feed-item')].map(i => i.dataset.ticker));
  ok('AI리포트(v8.89): 카드 4장이 그대로 나옴(알약으로 거르지 않음)', order.length === 4, order.join(','));
  // v9.23: 순서 = 최신 리포트순(내 종목 먼저 아님) · 위 로고 줄도 같은 순서
  ok('AI리포트(v9.23): 카드 순서는 최신 리포트순', order.join(',') === 'CL,ELV,WMB,PLD', order.join(','));
  await p.evaluate(() => { window.__gh = _glHeld; _glHeld = () => new Set(['PLD']); buildAnalysisGrid(); }); await p.waitForTimeout(600);   // 가장 오래된 PLD를 보유 종목으로 만들어도
  ok('AI리포트(v9.23): 보유 종목이어도 앞으로 오지 않음', (await p.evaluate(() => [...document.querySelectorAll('#rpFeed .feed-item')].map(i => i.dataset.ticker).join(','))) === 'CL,ELV,WMB,PLD');
  await p.evaluate(() => { _glHeld = window.__gh; buildAnalysisGrid(); }); await p.waitForTimeout(600);
  const strip = await p.evaluate(() => { const s = document.getElementById('rpStrip'), h = document.getElementById('rpHead'), items = [...s.querySelectorAll('.buy-point-item')], r = s.getBoundingClientRect(), ir = items.map(i => i.getBoundingClientRect()); return { vis: !s.hidden && !h.hidden && r.height > 0, tks: items.map(i => i.dataset.ticker).join(','), dates: items.map(i => (i.querySelector('.bp-date') || {}).textContent).join(','), logo: items.every(i => i.querySelector('.bp-logo,img,.aq-logo-fb')), lr: ir.every((b, k) => k === 0 || b.left > ir[k - 1].left + 20), below: r.top > h.getBoundingClientRect().top, aboveBar: r.bottom <= document.getElementById('rpBar').getBoundingClientRect().top + 24, ttl: h.querySelector('h2').textContent.trim() }; });
  ok('AI리포트(v9.23): 위 로고 줄 — 최신 리포트순(좌 → 우)', strip.vis && strip.tks === 'CL,ELV,WMB,PLD' && strip.lr, JSON.stringify(strip));
  ok('AI리포트(v9.23): 로고 줄 — 로고 · 날짜 · 제목 · 카드 위', strip.logo && strip.dates === '11/20,11/19,11/18,11/17' && strip.below && strip.aboveBar && strip.ttl === '최신 리포트');
  // 들어올 때마다 로고가 통통(발견과 같은 부품) — 다른 메뉴에 갔다 오면 처음부터 다시 · 크기가 1을 넘었다 내려앉음
  await p.evaluate(() => { switchMobileTab('discover'); }); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__sc = []; window.__op = []; switchMobileTab('research'); const t0 = performance.now(); (function s() { const el = document.querySelector('#rpStrip .buy-point-item'); if (el) { const m = /scale\(([\d.]+)\)/.exec(el.style.transform || ''); window.__sc.push(m ? +m[1] : 1); window.__op.push(el.style.opacity === '' ? 1 : +el.style.opacity); } if (performance.now() - t0 < 2600) requestAnimationFrame(s); })(); });
  await p.waitForTimeout(150);
  const early = await p.evaluate(() => [...document.querySelectorAll('#rpStrip .buy-point-item')].map(i => i.style.opacity === '' ? 1 : +i.style.opacity));
  await p.waitForTimeout(3000);
  const mv = await p.evaluate(() => ({ max: Math.max(...window.__sc), minOp: Math.min(...window.__op), end: [...document.querySelectorAll('#rpStrip .buy-point-item')].every(i => i.style.opacity === '' && i.style.transform === '') }));
  ok('AI리포트(v9.23): 들어올 때 로고가 차례로 떠오름(뒤쪽 로고는 아직 숨음)', early.length === 4 && early[early.length - 1] < 0.5, early.join(','));
  ok('AI리포트(v9.23): 로고가 통통(1배를 넘겼다 내려앉음) · 끝나면 스타일 정리', mv.max > 1.02 && mv.minOp < 0.5 && mv.end, JSON.stringify(mv));
  await p.evaluate(() => { switchMobileTab('research'); }); await p.waitForTimeout(400);
  ok('AI리포트(v9.23): 같은 메뉴를 다시 눌러도 로고가 다시 숨지 않음', await p.evaluate(() => [...document.querySelectorAll('#rpStrip .buy-point-item')].every(i => i.style.opacity === '')));
  // v9.31: 최신 리포트 머리줄 = 발견의 「금주의 발견」과 같은 부품(.card-header h2 + .st-more) · 전체보기 → 전체 화면 시트(최신순 전체 목록)
  const hd = await p.evaluate(() => { const g = s => { const e = document.querySelector(s); if (!e) return null; const cs = getComputedStyle(e), r = e.getBoundingClientRect(); return { fs: cs.fontSize, fw: cs.fontWeight, ls: cs.letterSpacing, x: Math.round(r.x), y: Math.round(r.y), txt: e.textContent.trim() }; };
    const a = g('#rpHead h2'), b = g('#rpHead .st-more'), logo = g('#rpStrip .bp-logo'), h = g('#rpHead'); return { a, b, dy: logo.y - h.y }; });
  ok('최신 리포트 머리줄: 발견과 같은 모양(글자 13/700 · 전체보기 12/700 · 머리 → 로고 48px)', hd.a.fs === '13px' && hd.a.fw === '700' && hd.a.ls === '-0.4px' && hd.b.fs === '12px' && hd.b.fw === '700' && hd.b.txt === '전체보기 ›' && hd.dy === 48, JSON.stringify(hd));
  await p.evaluate(() => { window.__opened = []; });
  await p.click('#rpHead .st-more'); await p.waitForTimeout(500);
  const full = await p.evaluate(() => { const ov = document.getElementById('aqRpFull'), rows = [...ov.querySelectorAll('.rpf-row')]; return { open: ov.classList.contains('open') && getComputedStyle(ov).display !== 'none', title: ov.querySelector('.aq-archfull-t').textContent, n: document.getElementById('aqRpFullN').textContent, tks: rows.map(r => r.dataset.ticker).join(','), dates: rows.map(r => r.querySelector('.rpf-d').textContent).join(','), bodyLock: document.body.classList.contains('aq-archfull-open') }; });
  ok('전체보기: 전체 화면 시트가 열리고 최신 리포트순 전체 목록', full.open && full.title === '최신 리포트' && full.tks === 'CL,ELV,WMB,PLD' && full.dates === '11/20,11/19,11/18,11/17' && full.n === '4종목' && full.bodyLock, JSON.stringify(full));
  await p.evaluate(() => document.querySelector('#aqRpFull .aq-archfull-x').click()); await p.waitForTimeout(700);   // 폰에서는 ← 가 숨고 쓸어서 닫음(발견의 누적 시그널과 같음) — 버튼 함수를 직접 누름
  ok('전체보기: ← 로 닫힘', await p.evaluate(() => !document.getElementById('aqRpFull').classList.contains('open') && !document.body.classList.contains('aq-archfull-open')));
  await p.click('#rpHead .st-more'); await p.waitForTimeout(700); await p.click('#aqRpFull .rpf-row[data-ticker="WMB"]'); await p.waitForTimeout(300);
  ok('전체보기: 종목을 누르면 그 종목 리포트가 열림(목록은 그대로 남아 있다가 리포트를 닫으면 돌아옴)', await p.evaluate(() => document.getElementById('aqRpFull').classList.contains('open') && document.getElementById('chartModal').classList.contains('active') && String(_state.openTicker).toUpperCase() === 'WMB'));
  await p.evaluate(() => closeModal()); await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelector('#aqRpFull .aq-archfull-x').click()); await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelector('#rpBar .rp-srch').click()); await p.waitForTimeout(300);
  await p.fill('#rpQi', 'cl'); await p.waitForTimeout(900);
  ok('검색: 입력한 종목만 남음', await p.evaluate(() => [...document.querySelectorAll('#rpFeed .feed-item')].map(i => i.dataset.ticker).join(',')) === 'CL');
  await p.evaluate(() => document.querySelector('#rpBar .rp-srch').click()); await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelector('#rpFeed .feed-item') && document.querySelector('#rpFeed .feed-item').scrollIntoView({ block: 'start' })); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, 'rp_mobile.png') });

  // ───────── 발견 (앞 차트 · 뒤 리포트, 보고서 있는 종목만)
  await p.evaluate(() => { switchMobileTab('discover'); }); await p.waitForTimeout(2000);
  await p.evaluate(() => { const r = document.getElementById('aqDiscoverCategories'); if (r) { r.querySelector('[data-kind="signal"]').click(); r.querySelector('[data-kind="all"]').click(); } });
  await p.waitForSelector('#feedScroll .feed-item', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1500);
  const dis = await p.evaluate(() => [...document.querySelectorAll('#feedScroll .feed-item')].map(i => i.dataset.ticker + ':' + (i.querySelector('.fl-stage') ? 'Y' : 'n')).join(' '));
  const wrapped = await p.evaluate(() => [...document.querySelectorAll('#feedScroll .feed-item')].filter(i => ['CL', 'WMB', 'ELV', 'PLD'].includes(i.dataset.ticker)).every(i => !!i.querySelector('.fl-stage')) && [...document.querySelectorAll('#feedScroll .feed-item')].filter(i => !['CL', 'WMB', 'ELV', 'PLD'].includes(i.dataset.ticker)).every(i => !i.querySelector('.fl-stage')));
  ok('발견: 보고서가 있는 종목만 뒤집기 부품이 붙음(없는 종목은 그대로)', wrapped, dis);
  const dsel = '#feedScroll .feed-item[data-ticker="CL"]';
  if (await p.evaluate(s => !!document.querySelector(s), dsel)) {
    await hold(p, dsel, 650); r = await rotY(p, dsel);
    const back = await p.evaluate(s => { const rc = document.querySelector(s + ' .fl-back .rs'); return rc ? rc.textContent : ''; }, dsel);
    ok('발견: 길게 누르면 리포트 핵심 면(슬라이드 3장)으로 뒤집힘', Math.abs(r - 180) < 4 && /고객은 가격이 아니라/.test(back) && /사람들은 앞으로도/.test(back), 'rotY ' + r.toFixed(1));
    await hold(p, dsel, 650); ok('발견: 다시 길게 누르면 차트 면으로 돌아옴', Math.abs(await rotY(p, dsel)) < 4);
    const cv = await p.evaluate(s => { const c = document.querySelector(s + ' canvas'); return { chart: !!c._aqChart, w: c.clientWidth }; }, dsel); ok('발견: 차트는 그대로 그려져 있음', cv.chart && cv.w > 200, JSON.stringify(cv));
  } else ok('발견: CL 카드가 있음', false, '피드에 CL 없음');
  const noRep = await p.evaluate(() => { const it = [...document.querySelectorAll('#feedScroll .feed-item')].find(i => !i.querySelector('.fl-stage')); return it ? it.dataset.ticker : null; });
  if (noRep) { const w = await p.evaluate(t => { const it = document.querySelector('#feedScroll .feed-item[data-ticker="' + t + '"]'); it.scrollIntoView({ block: 'center' }); const r = it.querySelector('.feed-chart-wrap').getBoundingClientRect(); return { x: r.x + r.width * .4, y: r.y + r.height * .5 }; }, noRep); await p.waitForTimeout(300); await p.mouse.move(w.x, w.y); await p.mouse.down(); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(500);
    ok('발견: 보고서 없는 종목은 길게 눌러도 반응 없음(뒤집힘 · 단서 없음)', await p.evaluate(t => { const it = document.querySelector('#feedScroll .feed-item[data-ticker="' + t + '"]'); return !it.querySelector('.fl-stage') && !it.querySelector('.fl-cue'); }, noRep), noRep); }

  // ───────── 마이 › 실시간 현황
  await p.evaluate(() => {
    _dashLastComputed = { holdings: ['CL', 'WMB', 'ZZZZ'].map((t, i) => ({ ticker: t, qty: 10 + i, cost: 1000 + i * 50, curPrice: 100 + i, avgPrice: 90 + i })) };
    switchMobileTab('board'); setBoardSubtab('live'); aqLiveBoardRender();
  });
  await p.waitForSelector('#lvFeed .feed-item', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1500);
  const live = await p.evaluate(() => [...document.querySelectorAll('#lvFeed .feed-item')].map(i => i.dataset.ticker + ':' + (i.querySelector('.fl-stage') ? 'Y' : 'n')).join(' '));
  ok('실시간 현황: 보고서가 있는 종목(CL · WMB)만 뒤집기 부품, 없는 종목(ZZZZ)은 그대로', /CL:Y/.test(live) && /WMB:Y/.test(live) && /ZZZZ:n/.test(live), live);
  const lsel = '#lvFeed .feed-item[data-ticker="CL"]';
  await hold(p, lsel, 650); r = await rotY(p, lsel);
  ok('실시간 현황: 길게 누르면 리포트 핵심 면으로 뒤집힘', Math.abs(r - 180) < 4 && /고객은 가격이 아니라/.test(await p.evaluate(s => (document.querySelector(s + ' .fl-back .rs') || {}).textContent || '', lsel)), 'rotY ' + r.toFixed(1));
  await p.close();

  // ───────── 카드 폭 600 이상(700px): 왼쪽 리포트 · 오른쪽 시그널 이력 / 2분할 가로(1000x700): 카드 폭 394 → 모바일과 같음
  for (const [W, H, wide] of [[700, 900, true], [1000, 700, false]]) {
    p = await prep(b, { width: W, height: H });
    await p.evaluate(() => { switchMobileTab('research'); setAiSubtab('report'); buildAnalysisGrid(); });
    await p.waitForSelector('#rpFeed .feed-item', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1200);
    await p.evaluate(() => document.querySelector('#rpFeed .feed-item[data-ticker="CL"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(1500);
    const m = await p.evaluate(() => { const it = document.querySelector('#rpFeed .feed-item[data-ticker="CL"]'), sd = it.querySelector('.feed-side'), st = it.querySelector('.fl-stage').getBoundingClientRect(), sr = sd.getBoundingClientRect(); return { cardW: Math.round(it.getBoundingClientRect().width), side: getComputedStyle(sd).display, sideRight: sr.width > 0 && sr.left >= st.right - 1, chart: !!it.querySelector('canvas')._aqChart, rows: it.querySelectorAll('.feed-side .fs-row').length, wideCls: document.documentElement.classList.contains('aq-wide') }; });
    if (wide) ok(`카드 폭 600 이상(${W}px): 왼쪽 리포트 · 오른쪽 시그널 이력(차트도 같이 그려짐)`, m.side !== 'none' && m.sideRight && m.chart, JSON.stringify(m));
    else ok(`2분할 가로(${W}x${H}): 카드 폭이 600 미만이라 모바일과 같음(시그널 이력 숨김)`, m.wideCls && m.side === 'none' && m.cardW < 600, JSON.stringify(m));
    await p.screenshot({ path: path.join(OUT, 'rp_' + W + 'x' + H + '.png') });
    await p.close();
  }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); console.log('캡처:', OUT); process.exit(fails ? 1 : 0);
})();
