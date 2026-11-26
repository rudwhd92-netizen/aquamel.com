// 종목 페이지 › 종목 정보 (v9.38) — node tools/ui-test/stockinfo.js
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
//   서버 응답은 시험용으로 만든 가짜 값(로그인 없이 확인) · 폭 360 · 390 · 넓은 화면 · 자료가 빠진 종목 · 가치사슬 12곳 이상
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const IGN = /Failed to load resource|net::ERR|CORS|discoverMotionView|fetching the script|아카이브|favicon|manifest|fonts\.g/;

const cell = (k, rows) => ({ k, v: rows, src: '', ls: rows.map(() => ({ s: '시험 자료' })) });
const FULL = {
  cells: [
    cell('무엇으로 버나', ['시험 문장 하나', '시험 문장 둘']),
    cell('사업 구성', ['가부문 10억 달러, 매출의 40% (시험)', '나부문 5억 달러, 25% (시험)', '다부문 3억 달러, 15% (시험)']),
    cell('고객사', ['고객 설명 한 줄']), cell('경쟁사', ['경쟁 설명 한 줄']), cell('공급을 움직이는 것', ['공급 설명']), cell('민감한 정책', ['정책 설명']),
    cell('최근 분기', ['분기 설명']), cell('거시 · 정성', ['금리 — 시험 이유']),
    cell('한눈에', ['하는 일: 시험용 부품을 만드는 회사', '고객사: 애플 · 엔비디아 · 가나다통신', '경쟁사: 라마바전자 · 사아자 · ACME', '정책: 관세 · 보조금 · 수출 규제', '공급: 핵심 원료를 한 곳에서 사 옴', '매출 구성: 가부문 40 · 나부문 25 · 다부문 15 · 라부문 12 · 마부문 8', '최근 분기: 2026년 3분기 / 매출 12억3,400만 달러 (한 해 전보다 19% 늘어남) / 영업이익 2억 달러 (5% 줄어듦)']),
  ],
  callcmp: { themes: ['수요', '가격'], q: [-1, 0, 1, 2].map((t, i) => ({ q: 'Q' + i, d: ['2026-02-04', '2026-05-06', '2026-08-05', '2026-11-04'][i], tone: [t], rev: [900 + i * 100], t: { 수요: [['-', 'u', 'u', 'e'][i], 'quote ' + i], 가격: [['-', 'e', 'd', 'u'][i], 'q'] } })), diff: ['가장 달라진 말 시험 문장', 'original sentence'] },
  vg: { ok: true, at: '2026-11-14', edges: ['AAPL', 'NVDA'].map(to => ({ to, name: '', kind: '경쟁', str: '중간' })).concat(Array.from({ length: 13 }, (_, i) => ({ to: '', name: 'Company ' + String.fromCharCode(65 + i), kind: '경쟁', str: '중간' }))), factors: [{ f: '데이터센터 투자', dir: '좋음' }, { f: '달러', dir: '섞임' }], rev: [], lead: [], warn: [], fmov: {} },
};
const SPARSE = { cells: [cell('무엇으로 버나', ['문장만 있는 지도']), cell('경쟁사', ['경쟁 문장'])], callcmp: null, vg: { ok: true, edges: [], factors: [], rev: [], lead: [], warn: [] } };

async function open(b, w, h, data, admin) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'dark' }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { if (!IGN.test(e.message)) errs.push(e.message); }); p.on('console', m => { if (m.type() === 'error' && !IGN.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' });
  await p.waitForFunction(() => document.querySelectorAll('#buyPointsScroll .buy-point-item').length > 0, null, { timeout: 60000 });
  await p.evaluate(a => {
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none');
    window.__calls = []; const real = window.apiCall; window.__data = a.data;
    window.apiCall = async (x, q) => {
      if (x === 'stockMapGet') { window.__calls.push(x); await new Promise(r => setTimeout(r, 120)); const d = window.__data; return { ok: true, ticker: q.ticker, map: { asof: '2026-11-16', cells: d.cells }, callcmp: d.callcmp, admin: false, can: false }; }
      if (x === 'leadGet') { await new Promise(r => setTimeout(r, 200)); return JSON.parse(JSON.stringify(window.__data.vg)); }
      return real(x, q);
    };
    window.__tk = []; window.aqOpenTk = t => window.__tk.push(t);
  }, { data });
  const tk = await p.evaluate(() => document.querySelector('#buyPointsScroll .buy-point-item').dataset.ticker);
  await p.evaluate(t => openChart(t), tk); await p.waitForTimeout(2500);
  await p.click('#modalViewTabs [data-view="map"]'); await p.waitForTimeout(2000);
  return { p, errs, ctx, tk };
}
const vis = async (p, s) => { await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), s); await p.waitForTimeout(1500); };
const layout = p => p.evaluate(() => {
  const m = document.getElementById('mapPanel'), r = m.getBoundingClientRect();
  return {
    out: [...m.querySelectorAll('.sm2-card, .si-vg button:not(.si-hide), .cc-gh, .si-key, .si-av')].filter(x => { const a = x.getBoundingClientRect(); return a.width && (a.right > r.right + 1 || a.left < r.left - 1); }).length,
    big: [...m.querySelectorAll('img')].filter(i => i.getBoundingClientRect().width > 48).length,   // 로고가 원본 크기로 새지 않게
    ic: [...m.querySelectorAll('.sm2-dg .si-av .si-ic, .si-vg .si-ic')].filter(x => x.getBoundingClientRect().width).map(x => Math.round(x.getBoundingClientRect().width)).filter((v, i, a) => a.indexOf(v) === i),
    hidden: [...m.querySelectorAll('.sm2-me, .sm2-box, .sm2-tile, .cc-row, .vg-g, .si-av, .si-vg button:not(.si-hide)')].filter(x => { const a = x.getBoundingClientRect(); return x.style.opacity === '0' && a.top < innerHeight - 40 && a.bottom > 40; }).length,
  };
});

(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let { p, errs, ctx } = await open(b, 390, 844, FULL);
  const head = await p.evaluate(() => ({ tab: document.querySelector('#modalViewTabs [data-view="map"]').textContent.trim(), heads: [...document.querySelectorAll('#mapPanel .sm-head > b, #mapPanel .si-h b')].map(x => x.textContent), av: document.querySelectorAll('#mapPanel .si-av').length, it: document.querySelectorAll('#mapPanel .si-it').length }));
  ok('탭 이름 「종목 정보」 · 구역 순서 그대로', head.tab === '종목 정보' && head.heads.join('|') === '누구와 엮여 있나|무엇으로 버나|최근 분기|실적 콜 비교|분기 매출|가치사슬', head.heads.join('|'));
  ok('관계도: 고객 3곳 로고 원 · 경쟁 · 정책 3줄씩', head.av === 3 && head.it === 6, head.av + '/' + head.it);
  let L = await layout(p); ok('첫 화면: 넘침 없음 · 로고 44px · 보이는 칸은 모두 나타남', L.out === 0 && L.big === 0 && L.ic.join() === '44' && L.hidden === 0, JSON.stringify(L));
  // 관계도 누름: 설명이 열리고 이어진 선이 켜짐 · 다시 누르면 접힘
  await p.click('#mapPanel .sm2-dg > .sm2-box.w >> nth=0 >> .si-bl'); await p.waitForTimeout(1300);
  const o1 = await p.evaluate(() => ({ open: !!document.querySelector('#mapPanel .sm2-open'), h: (document.querySelector('#mapPanel .sm2-open') || { style: {} }).style.height || '', lit: document.querySelector('#mapPanel .sm2-dg').dataset.lit, text: ((document.querySelector('#mapPanel .sm2-open') || {}).textContent || '').includes('고객 설명') }));
  ok('고객 칸을 누르면 설명이 열리고 위 선이 켜짐', o1.open && o1.h === '' && o1.lit === 'top' && o1.text, JSON.stringify(o1));
  await p.click('#mapPanel .sm2-dg > .sm2-box.w >> nth=0 >> .si-bl'); await p.waitForTimeout(1300);
  ok('다시 누르면 접히고 선도 원래대로', await p.evaluate(() => !document.querySelector('#mapPanel .sm2-open') && !document.querySelector('#mapPanel .sm2-on') && !document.querySelector('#mapPanel .sm2-dg').dataset.lit));
  await p.click('#mapPanel .si-av[onclick] >> nth=0'); await p.waitForTimeout(300);
  ok('고객 로고를 누르면 종목 페이지로(설명 칸은 안 열림)', await p.evaluate(() => window.__tk.length === 1 && !document.querySelector('#mapPanel .sm2-open')), await p.evaluate(() => window.__tk.join()));
  // 매출 막대
  await vis(p, '#mapPanel .sm2-bar'); await p.click('#mapPanel .sm2-bar i >> nth=1'); await p.waitForTimeout(700);
  const bar = await p.evaluate(() => ({ big: document.querySelector('#mapPanel .si-big').textContent, read: (document.querySelector('#mapPanel .si-read') || {}).textContent || '', leg: [...document.querySelectorAll('#mapPanel .sm2-leg > span')].map(x => x.textContent).join('|'), op: [...document.querySelectorAll('#mapPanel .sm2-bar i')].map(i => i.style.opacity).join() }));
  ok('막대를 누르면 큰 숫자 · 원문 줄이 그 사업으로 · 칸 밝기는 그대로', bar.big === '25%나부문' && /^나부문 5억/.test(bar.read) && bar.op === '1,0.62,0.3,0.18', JSON.stringify(bar));
  const t = await p.evaluate(() => [...document.querySelectorAll('#mapPanel .sm2-tile')].map(x => [x.querySelector('b').textContent, (x.querySelector('.si-dl i') || {}).textContent, (x.querySelector('.si-dl i') || {}).className].join('/')));
  await vis(p, '#mapPanel .sm2-g2');
  ok('최근 분기: 숫자 · 늘면 초록 · 줄면 빨강 알약', t[0] === '12억3,400만달러/▲ 19%/up' && t[1] === '2억달러/▼ 5%/dn', t.join(' | '));
  // 실적 콜: 분기 고르기
  await vis(p, '#mapPanel .cc-card'); await p.click('#mapPanel .cc-gh span[data-qi="1"]'); await p.waitForTimeout(1200);
  const q = await p.evaluate(() => { const c = document.querySelector('#mapPanel .si-col').getBoundingClientRect(), h = document.querySelector('#mapPanel .cc-gh span.on').getBoundingClientRect(), k = document.querySelector('#mapPanel .si-key').getBoundingClientRect();
    return { on: document.querySelector('#mapPanel .cc-gh span.on').textContent, dx: Math.round(c.left - h.left), dw: Math.round(c.width - h.width), clear: Math.round(k.top - c.bottom), xl: document.querySelector('#mapPanel .cc-xl span.on').textContent, tone: document.querySelector('#mapPanel .cc-tn > div > span.on b').textContent, pips: [...document.querySelectorAll('#mapPanel .si-pips')].map(x => x.querySelectorAll('u.f').length).join(), guide: !!document.querySelector('#mapPanel .cc-leg') }; });
  ok('날짜를 누르면 칠한 칸 · 아래 막대 · 분위기가 같은 분기로 · 범례는 안 덮음', q.on === '26.05.06' && q.xl === '26.05.06' && q.tone === '중립' && Math.abs(q.dx) <= 1 && Math.abs(q.dw) <= 1 && q.clear >= 0, JSON.stringify(q));
  ok('분위기 눈금 1 · 3 · 4 · 5칸 · 회사 전망이 없으면 범례 없음', q.pips === '2,3,4,5' && !q.guide, q.pips);
  // 가치사슬
  await vis(p, '#mapPanel .si-vg');
  const v0 = await p.evaluate(() => ({ head: document.querySelector('#mapPanel .vg-g > small').textContent, shown: [...document.querySelectorAll('#mapPanel .si-vg button')].filter(x => x.offsetParent && !x.classList.contains('si-more')).length, more: (document.querySelector('#mapPanel .si-more .si-ic') || {}).textContent, first: document.querySelector('#mapPanel .si-vg button').textContent }));
  ok('가치사슬: 15곳 · 중요도 한 번만 · 7곳 + 「+8」 · 상장사가 앞', v0.head === '경쟁 15곳중요도 중간' && v0.shown === 7 && v0.more === '+8' && /AAPL|NVDA/.test(v0.first), JSON.stringify(v0));
  await p.click('#mapPanel .si-more'); await p.waitForTimeout(1200);
  ok('「더 보기」: 15곳 모두', await p.evaluate(() => [...document.querySelectorAll('#mapPanel .si-vg button')].filter(x => x.offsetParent && x.style.opacity !== '0').length === 15));
  L = await layout(p); ok('가치사슬 펼친 뒤 넘침 없음', L.out === 0 && L.big === 0, JSON.stringify(L));
  // 영역별로 보기
  await vis(p, '#mapPanel .sm2-fh'); await p.click('#mapPanel .sm2-fh'); await p.waitForTimeout(900); await p.click('#mapPanel .sm2-rw >> nth=1'); await p.waitForTimeout(1300);
  ok('영역별로 보기: 칸 수 · 줄 수 표시 · 줄을 누르면 펼침', await p.evaluate(() => /\d+개/.test(document.querySelector('#mapPanel .sm2-fh em').textContent) && /\d+줄/.test(document.querySelector('#mapPanel .sm2-rw .si-n').textContent) && /가부문 10억/.test((document.querySelector('#mapPanel .sm2-open') || {}).textContent || '')));
  // 같은 내용을 다시 받으면 다시 그리지 않음
  await p.evaluate(() => { document.querySelector('#mapPanel .sm2-dg').__keep = 1; aqMapOpen(_state.openTicker, true); }); await p.waitForTimeout(900);
  ok('서버 값이 그대로면 화면을 다시 만들지 않음(펼친 칸 유지)', await p.evaluate(() => document.querySelector('#mapPanel .sm2-dg').__keep === 1 && !!document.querySelector('#mapPanel .sm2-open')));
  // 탭을 나갔다 들어오면 처음부터 다시 움직임
  await p.click('#modalViewTabs [data-view="chart"]').catch(() => p.evaluate(() => aqSetModalView('chart'))); await p.waitForTimeout(500);
  await p.evaluate(() => { document.querySelector('#chartModal .modal-content').scrollTop = 0; aqSetModalView('map'); });
  const early = await p.evaluate(() => document.querySelector('#mapPanel .sm2-me').style.opacity !== ''); await p.waitForTimeout(2200);
  ok('탭에 다시 들어오면 움직임이 처음부터 · 끝나면 모두 보임', early && (await layout(p)).hidden === 0);
  ok('오류 없음', errs.length === 0, errs.join(' | ').slice(0, 300)); await ctx.close();

  // 자료가 빠진 지도
  ({ p, errs, ctx } = await open(b, 390, 844, SPARSE));
  const s = await p.evaluate(() => ({ dg: !!document.querySelector('#mapPanel .sm2-dg'), title: !!document.querySelector('#mapPanel .sm-head > b'), cc: !!document.querySelector('#mapPanel #ccSec'), rows: document.querySelectorAll('#mapPanel .sm2-rw').length, text: document.getElementById('mapPanel').textContent.includes('영역별로 보기') }));
  ok('자료가 빠진 지도: 관계도 · 제목 · 콜 비교 없이도 영역별 보기는 나옴', !s.dg && !s.title && !s.cc && s.rows >= 3 && s.text && errs.length === 0, JSON.stringify(s) + ' ' + errs.join('|').slice(0, 200)); await ctx.close();

  // 좁은 폰 360 · 넓은 화면
  for (const [w, h] of [[360, 780], [1280, 800]]) {
    ({ p, errs, ctx } = await open(b, w, h, FULL));
    const n = await p.evaluate(() => [...document.querySelectorAll('#mapPanel .si-it > span:last-child')].filter(x => !/\s/.test(x.textContent.trim()) && x.getClientRects().length > 1).length);
    L = await layout(p); ok(w + ': 넘침 · 잘림 없음 · 낱말이 중간에서 꺾이지 않음', L.out === 0 && L.big === 0 && L.hidden === 0 && n === 0 && errs.length === 0, JSON.stringify(L) + ' 꺾임 ' + n + ' ' + errs.join('|').slice(0, 160)); await ctx.close();
  }
  console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); await b.close(); process.exit(fails ? 1 : 0);
})();
