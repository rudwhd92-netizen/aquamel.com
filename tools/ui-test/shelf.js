// 책장 시험 — node tools/ui-test/shelf.js   (v9.33 · 가짜 서버 응답 · 지어낸 시험 값 — 실제 명부 · 라이브러리 값 아님)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
//   확인: 메뉴가 관리자에게만 보임 · 요약 숫자 · 명부 거르기 · 검색 · 더 보기 · 라이브러리 접이식 · 상태 점 · 오류 · 임시 · 폭 360 가로 넘침 없음
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };

function fake() {   // 지어낸 응답(SHELF_API.md 모양)
  const rows = [];
  for (let i = 0; i < 520; i++) rows.push({ market: 'US', ticker: 'T' + i, name: '시험회사' + i, sector: i % 2 ? '반도체' : '소프트웨어', grade: i < 490 ? '주전' : '후보', via: i % 10 ? '원본' : '13F 편입', since: '2026-11-25', reason: i % 10 ? '' : '시험 이유', fill: i < 500 ? '확정' : '대기' });
  for (let i = 0; i < 100; i++) rows.push({ market: 'KR', ticker: String(100000 + i), name: '한국시험' + i, sector: '전자', grade: '주전', via: '원본', since: '2026-11-20', reason: '', fill: '확정' });
  rows.push({ market: 'US', ticker: 'ZZTOP', name: '찾을회사', sector: '은행', grade: '후보', via: '특례 편입', since: '2026-11-01', reason: '특례', fill: '자동' });
  const roster = { source: '명부 표(company_roster)', total: rows.length,
    markets: [{ market: 'US', target: 500, starters: 490, candidates: 31, short: 10 }, { market: 'KR', target: 100, starters: 100, candidates: 0, short: 0 }],
    via: {}, fill: { 대기: 20, 자동: 1, 확정: 600 }, notes: [] };
  const C = ['초록', '빨강', '회색', '모름'];
  const items = [];
  ['가격', '재무·실적', '뉴스', '운영'].forEach((g, gi) => { for (let i = 0; i < 4; i++) items.push({ id: 'X' + gi + i, group: g, name: g + ' 항목 ' + i, desc: '', makers: [{ how: '시험 수집', file: '', source: '시험', job: '', when: '일간 · 06:00' }], stores: ['시험 파일'], readers: ['시험 화면'], paths_now: i + 1, paths_goal: 1, plan: i === 2 ? '통합 — 시험' : '유지 — 시험', normal: i ? '하루 한 번' : '', verified: i !== 3, why_unverified: [], status: { color: C[i], why: '시험 근거 ' + C[i] } }); });
  const T = { items: items.length, paths_now: 40, paths_goal: 16, 초록: 4, 빨강: 4, 회색: 4, 모름: 4, unverified: 4 };
  return { roster, rows, items, T };
}

async function prep(b, opts, admin) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, opts || {})); const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(([F, admin]) => {
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none');
    if (admin) { document.body.setAttribute('data-role', 'admin'); try { _aqAuth.user = { role: 'admin', username: 'adm' }; } catch (e) {} }
    else document.body.removeAttribute('data-role');
    window.__calls = []; window.__F = F; window.__mode = 'ok'; window.aqToast = () => {}; document.querySelectorAll('.aq-toast, .aq-toasts, #aqToasts').forEach(x => x.remove());
    window.apiCall = async (a, q) => {
      window.__calls.push([a, q]);
      if (a !== 'shelf') return { ok: true };
      if (document.body.getAttribute('data-role') !== 'admin') return { ok: false, error: 'admin only' };
      if (window.__mode === 'err') return { ok: false, error: '서버 오류(시험)' };
      const R = JSON.parse(JSON.stringify(F.roster));
      if (window.__mode === 'tmp') { R.source = '임시(명부 표 생성 전)'; R.notes = ['원본 시험 파일을 못 읽음']; }
      if (q.part === 'summary') return { ok: true, part: 'summary', roster: R, library: { groups: [], total: F.T } };
      if (q.part === 'roster') return { ok: true, part: 'roster', roster: Object.assign(R, { rows: F.rows }) };
      if (q.part === 'library') return { ok: true, part: 'library', items: F.items, summary: { groups: [], total: F.T } };
      return { ok: false, error: 'bad part' };
    };
  }, [fake(), admin]);
  return p;
}
const vis = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; }, sel);

(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  // 1) 비관리자: 메뉴 항목 숨김 · 열기 막힘 · 서버 호출 없음
  let p = await prep(b, null, false);
  await p.evaluate(() => openMoDrawer()); await p.waitForTimeout(400);
  ok('비관리자: ☰ 안에 책장 없음', !(await vis(p, '.mo-drawer-item[onclick="shelfOpen()"]')));
  await p.evaluate(() => shelfOpen()); await p.waitForTimeout(500);
  ok('비관리자: shelfOpen 해도 안 열리고 서버 호출 없음', await p.evaluate(() => !document.getElementById('shelfFull').classList.contains('open') && !window.__calls.some(c => c[0] === 'shelf')));
  await p.close();

  // 2) 관리자: 메뉴 · 요약
  p = await prep(b, null, true);
  await p.evaluate(() => openMoDrawer()); await p.waitForTimeout(400);
  ok('관리자: ☰ 안에 책장 보임(설정 위)', await vis(p, '.mo-drawer-item[onclick="shelfOpen()"]') && await p.evaluate(() => { const it = [...document.querySelectorAll('#moDrawer .mo-drawer-item')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.textContent.trim()); return it.indexOf('책장') === it.indexOf('설정') - 1; }));
  await p.click('.mo-drawer-item[onclick="shelfOpen()"]'); await p.waitForTimeout(1500);
  ok('책장이 열리고 ☰은 닫힘', await p.evaluate(() => document.getElementById('shelfFull').classList.contains('open') && !document.getElementById('moDrawer').classList.contains('open')));
  const sum = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('#shelfSum b[data-k]')].map(b => [b.dataset.k, b.textContent])));
  ok('요약: 미국 490/500 · 후보 31 · 한국 100/100 · 대기 20', sum.us === '490/500' && sum.cand === '31' && sum.kr === '100/100' && sum.wait === '20', JSON.stringify(sum));
  ok('요약: 항목 16 · 길 40→16', sum.items === '16' && sum.paths === '40→16', JSON.stringify(sum));
  ok('서버 호출 = apiCall(shelf · summary · roster)', await p.evaluate(() => { const c = window.__calls.filter(x => x[0] === 'shelf').map(x => x[1].part); return c.includes('summary') && c.includes('roster') && !c.includes('library'); }));

  // 3) 명부: 지연 그리기 · 거르기 · 검색 · 펼침
  const cnt = () => p.evaluate(() => ({ n: document.querySelector('#shelfList .shelf-n').textContent, rows: document.querySelectorAll('#shelfList .shelf-r').length, more: !!document.querySelector('#shelfList .shelf-more') }));
  let c = await cnt(); ok('명부: 621개 중 80행만 그림 + 더 보기', c.n === '621개' && c.rows === 80 && c.more, JSON.stringify(c));
  await p.screenshot({ path: path.join(OUT, 'shelf_1_roster.png') });
  await p.click('#shelfList .shelf-more'); await p.waitForTimeout(200); c = await cnt(); ok('더 보기 → 160행', c.rows === 160, JSON.stringify(c));
  await p.click('#shelfChipsR [data-c="mk:KR"]'); await p.waitForTimeout(200); c = await cnt(); ok('한국 칩 → 100개', c.n === '100개', JSON.stringify(c));
  const kr = await p.evaluate(() => { const r = document.querySelector('#shelfList .shelf-r'); return { t: r.querySelector('.shelf-r1').textContent, x: r.nextElementSibling.querySelector('[data-raw]') && r.nextElementSibling.querySelector('[data-raw]').textContent }; });
  ok('한국 행: 회사명이 앞(코드는 행에 없고 펼침에만 data-raw)', kr.t === '한국시험0' && kr.x === '100000', JSON.stringify(kr));
  await p.click('#shelfChipsR [data-c="mk:KR"]'); await p.click('#shelfChipsR [data-c="gr:후보"]'); await p.waitForTimeout(200); c = await cnt(); ok('후보 칩 → 31개', c.n === '31개', JSON.stringify(c));
  await p.click('#shelfChipsR [data-c="gr:대기"]'); await p.waitForTimeout(200); c = await cnt(); ok('대기 칩 → 20개(채움 대기)', c.n === '20개', JSON.stringify(c));
  await p.click('#shelfChipsR [data-c="gr:대기"]'); await p.fill('#shelfQ', 'zztop'); await p.waitForTimeout(400); c = await cnt(); ok('검색(티커) → 1개', c.n === '1개', JSON.stringify(c));
  await p.fill('#shelfQ', '찾을'); await p.waitForTimeout(400); c = await cnt(); ok('검색(회사명) → 1개', c.n === '1개', JSON.stringify(c));
  await p.click('#shelfList .shelf-r'); await p.waitForTimeout(200);
  const ex = await p.evaluate(() => { const x = document.querySelector('#shelfList .shelf-x'); return x.classList.contains('open') ? x.innerText : ''; });
  ok('행을 누르면 날짜 · 이유 · 설명', ex.includes('2026-11-01') && ex.includes('특례') && ex.includes('자동'), ex.replace(/\n+/g, ' | '));
  await p.fill('#shelfQ', ''); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, 'shelf_1b_roster_open.png') });

  // 4) 라이브러리: 접이식 · 상태 점 · 길 강조 · 칩
  await p.click('#shelfTabs [data-shelf="library"]'); await p.waitForTimeout(1200);
  ok('라이브러리 탭 → library 호출', await p.evaluate(() => window.__calls.some(x => x[0] === 'shelf' && x[1].part === 'library')));
  const g = await p.evaluate(() => [...document.querySelectorAll('#shelfLib .shelf-g')].map(x => x.dataset.g + (x.classList.contains('collapsed') ? ':접' : ':펼')));
  ok('묶음 순서 가격 → 재무·실적 → 뉴스 → 운영 · 처음엔 접힘', g.join(',') === '가격:접,재무·실적:접,뉴스:접,운영:접', g.join(','));
  await p.click('#shelfLib .shelf-g[data-g="가격"] .aq-coll-head'); await p.waitForTimeout(600);
  ok('묶음 머리를 누르면 펼침', await p.evaluate(() => !document.querySelector('#shelfLib .shelf-g[data-g="가격"]').classList.contains('collapsed') && getComputedStyle(document.querySelector('#shelfLib .shelf-g[data-g="가격"] .aq-coll-body')).display !== 'none'));
  const dots = await p.evaluate(() => [...document.querySelectorAll('#shelfLib .shelf-g[data-g="가격"] .shelf-it')].map(it => { const d = it.querySelector('.shelf-dot'); const cs = getComputedStyle(d); return { st: d.dataset.st, cls: d.className, bg: cs.backgroundColor, ln: it.querySelector('.ln').textContent, hi: it.querySelector('.ln').classList.contains('hi') }; }));
  ok('상태 점: 정상 초록 · 실패 빨강 · 꺼 둠 회색 · 모름 테두리', dots[0].bg === 'rgb(64, 192, 87)' && dots[1].bg === 'rgb(255, 107, 107)' && /off/.test(dots[2].cls) && /unk/.test(dots[3].cls) && dots[3].bg === 'rgba(0, 0, 0, 0)', JSON.stringify(dots.map(d => d.st + ' ' + d.bg)));
  ok('길 수: 1→1은 강조 없음 · 2→1은 강조', dots[0].ln === '길 1→1' && !dots[0].hi && dots[1].ln === '길 2→1' && dots[1].hi);
  await p.click('#shelfLib .shelf-g[data-g="가격"] .shelf-it[data-id="X03"]'); await p.waitForTimeout(200);
  const det = await p.evaluate(() => document.querySelector('#shelfLib .shelf-it[data-id="X03"]').nextElementSibling.innerText);
  ok('항목 상세: 만드는 곳 · 쌓이는 곳 · 읽는 곳 · 기준 · 근거 · 계획 · 확인 필요', ['만드는 곳', '시험 수집', '쌓이는 곳', '읽는 곳', '정상 기준', '하루 한 번', '시험 근거 모름', '확인 필요', '계획', '유지'].every(k => det.includes(k)), det.replace(/\n+/g, ' | '));
  await p.click('#shelfLib .shelf-g[data-g="가격"] .shelf-it[data-id="X00"]'); await p.waitForTimeout(200);
  ok('정상 기준이 비면 "기준 없음"', (await p.evaluate(() => document.querySelector('#shelfLib .shelf-it[data-id="X00"]').nextElementSibling.innerText)).includes('기준 없음'));
  await p.screenshot({ path: path.join(OUT, 'shelf_2_library.png') });
  await p.click('#shelfChipsL [data-c="fail"]'); await p.waitForTimeout(300);
  const f = await p.evaluate(() => ({ n: document.querySelector('#shelfLib .shelf-n').textContent, st: [...document.querySelectorAll('#shelfLib .shelf-dot[data-st]')].map(d => d.dataset.st), open: [...document.querySelectorAll('#shelfLib .shelf-g')].every(g => !g.classList.contains('collapsed')) }));
  ok('실패만 보기 → 빨강 4개 · 묶음 펼쳐 보임', f.n === '4개' && f.st.every(s => s === '빨강') && f.open, JSON.stringify(f));
  await p.click('#shelfChipsL [data-c="fail"]'); await p.click('#shelfChipsL [data-c="merge"]'); await p.waitForTimeout(300);
  ok('통합 대상만 보기 → 4개', (await p.evaluate(() => document.querySelector('#shelfLib .shelf-n').textContent)) === '4개');
  await p.click('#shelfChipsL [data-c="merge"]'); await p.fill('#shelfLQ', '뉴스 항목 1'); await p.waitForTimeout(400);
  ok('라이브러리 검색 → 1개', (await p.evaluate(() => document.querySelector('#shelfLib .shelf-n').textContent)) === '1개');
  ok('응답 · 화면에 보유 · 관심 글자 없음', await p.evaluate(() => !/보유|관심/.test(document.getElementById('shelfBody').innerText)));

  // 5) 닫기 · 오류 · 임시
  await p.evaluate(() => shelfClose()); await p.waitForTimeout(300);
  ok('닫으면 책장 내용도 비움', await p.evaluate(() => !document.getElementById('shelfFull').classList.contains('open') && document.getElementById('shelfBody').innerHTML === ''));
  await p.evaluate(() => { window.__mode = 'err'; shelfOpen(); }); await p.waitForTimeout(600);
  ok('API 실패 → 작은 글씨 한 줄', await p.evaluate(() => [...document.querySelectorAll('#shelfBody .shelf-note')].some(n => n.textContent === '서버 오류(시험)')));
  await p.evaluate(() => { shelfClose(); window.__mode = 'tmp'; shelfOpen(); }); await p.waitForTimeout(800);
  ok('명부 임시 → "임시" 꼬리표 + notes 한 줄', await p.evaluate(() => document.querySelector('#shelfSumRoster .mgp-tag').textContent === '임시' && document.getElementById('shelfBody').innerText.includes('원본 시험 파일을 못 읽음')));
  await p.evaluate(() => { shelfClose(); window.__mode = 'ok'; }); await p.close();

  // 6) 폭 360 가로 넘침 없음 (명부 · 라이브러리)
  p = await prep(b, { viewport: { width: 360, height: 780 } }, true);
  await p.evaluate(() => shelfOpen()); await p.waitForTimeout(1500);
  const over = () => p.evaluate(() => { const b = document.getElementById('shelfBody'); let w = 0; b.querySelectorAll('*').forEach(e => { if (e.closest('.shelf-chips')) return; const r = e.getBoundingClientRect(); if (r.width && r.right > w) w = r.right; }); return { sw: b.scrollWidth, cw: b.clientWidth, right: Math.round(w), vw: innerWidth, doc: document.documentElement.scrollWidth }; });
  let o = await over(); ok('폭 360 명부: 가로 넘침 없음', o.sw <= o.cw + 1 && o.right <= o.vw && o.doc <= o.vw, JSON.stringify(o));
  await p.click('#shelfList .shelf-r'); await p.evaluate(() => shelfTab('library')); await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelectorAll('#shelfLib .shelf-g .aq-coll-head').forEach(h => h.click())); await p.waitForTimeout(700);
  await p.evaluate(() => document.querySelectorAll('#shelfLib .shelf-it').forEach(h => h.click())); await p.waitForTimeout(200);
  o = await over(); ok('폭 360 라이브러리(모두 펼침): 가로 넘침 없음', o.sw <= o.cw + 1 && o.right <= o.vw && o.doc <= o.vw, JSON.stringify(o));
  await p.screenshot({ path: path.join(OUT, 'shelf_3_narrow.png') }); await p.close();

  console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); console.log('캡처:', OUT); await b.close(); process.exit(fails ? 1 : 0);
})();
