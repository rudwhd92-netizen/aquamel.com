// 책장 시험 — node tools/ui-test/shelf.js   (v9.42 · 가짜 서버 · 지어낸 시험 값 · 실제 서버에는 아무것도 보내지 않음)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
async function open(b, w, h, admin, draft) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  await ctx.route('https://aquamel.duckdns.org/**', r => r.abort());
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { if (!/discoverMotionView/.test(e.message)) errs.push(e.message); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(({ admin, draft }) => {
    localStorage.removeItem('aqShelfDraft1'); localStorage.removeItem('aqShelfPending1'); if (draft) localStorage.setItem('aqShelfDraft1', JSON.stringify(draft));
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none');
    if (admin) document.body.setAttribute('data-role', 'admin'); else document.body.removeAttribute('data-role');
    const items = ['가격', '뉴스', '운영'].flatMap((g, i) => Array.from({ length: 12 }, (_, j) => ({ id: 'X' + i + '_' + j, group: g, name: g + ' 시험 ' + j, desc: '설명', makers: [{ how: '수집', source: '시험', when: '06:00' }], stores: ['파일'], readers: ['화면'], paths_now: 1 + j % 5, paths_goal: 1, plan: j % 4 === 0 ? '통합 — 하나로' : j % 7 === 3 ? '폐기 — 끝' : '유지', normal: '', verified: j % 9 !== 0, status: { color: j === 1 ? '빨강' : '초록', why: '시험 이유' } })));
    const S = window.__S = { rev: 0, calls: [], posts: [], logs: [], reply: null,
      rows: Array.from({ length: 40 }, (_, i) => ({ market: i < 30 ? 'US' : 'KR', ticker: i < 30 ? 'T' + i : String(100000 + i), name: '시험회사' + i, sector: i % 2 ? '💾 반도체' : '은행', grade: i % 9 ? '주전' : '후보', via: '원본', since: '2026-11-25', reason: '', fill: '확정', brief: '', detail: '' })),
      sectors: { US: [{ name: '💾 반도체', code: 'S1', mega: '기술', def: '칩을 만든다', n: 0 }, { name: '은행', code: 'F1', mega: '금융', def: '', n: 0 }, { name: '빈섹터', code: '', mega: '금융', def: '', n: 0 }], KR: [{ name: '💾 반도체', code: '', mega: '', def: '', n: 0 }, { name: '은행', code: '', mega: '', def: '', n: 0 }] } };
    const view = () => ({ source: '명부 표(company_roster)', rev: S.rev, sectors: S.sectors, rows: S.rows, fill: { 대기: 2 }, markets: [{ market: 'US', target: 30 }, { market: 'KR', target: 10 }] });
    window.apiCall = async (a, q) => { S.calls.push([a, q && q.part]); if (a !== 'shelf') return { ok: true }; if (q.part === 'roster') return JSON.parse(JSON.stringify({ ok: true, roster: view() })); if (q.part === 'roster_log') return JSON.parse(JSON.stringify({ ok: true, logs: S.logs })); return { ok: true, items }; };
    const real = window.fetch;
    window.fetch = async (u, o) => {
      const m = String(u).match(/action=shelf&part=(roster_save|roster_undo)/); if (!m) return real(u, o);
      const body = JSON.parse(o.body); S.posts.push({ part: m[1], body, auth: o.headers.Authorization, method: o.method });
      const send = r => ({ json: async () => r });
      if (S.reply) { const r = S.reply; S.reply = null; return send(r); }
      if (body.base_rev !== S.rev) return send({ ok: false, conflict: true, rev: S.rev });
      if (m[1] === 'roster_save') {
        const changes = [];
        body.ops.forEach(op => {
          if (op.op === 'row_set') { let r = S.rows.find(x => x.market === op.market && x.ticker === op.ticker); const before = !!r, f = {}; if (!r) { r = { market: op.market, ticker: op.ticker, brief: '', detail: '', reason: '', grade: '주전' }; S.rows.push(r); } ['name', 'sector', 'grade', 'brief', 'detail', 'reason'].forEach(k => { if (k in op) { f[k] = { before: r[k], after: op[k] }; r[k] = op[k]; } }); changes.push({ target: ['row', op.market, op.ticker], before, after: true, fields: f }); }
          if (op.op === 'row_del') S.rows = S.rows.filter(x => !(x.market === op.market && x.ticker === op.ticker));
          if (op.op === 'sector_set') { const old = op.renameFrom || op.name; let x = S.sectors[op.market].find(s => s.name === old); if (!x) { x = { name: op.name, code: '', mega: '', def: '' }; S.sectors[op.market].push(x); } if (op.renameFrom) { x.name = op.name; S.rows.forEach(r => { if (r.market === op.market && r.sector === old) r.sector = op.name; }); } ['mega', 'def'].forEach(k => { if (k in op) x[k] = op[k]; }); }
          if (op.op === 'sector_del') { S.rows.forEach(r => { if (r.market === op.market && r.sector === op.name) r.sector = op.moveTo; }); S.sectors[op.market] = S.sectors[op.market].filter(s => s.name !== op.name); }
        });
        S.rev++; S.logs.unshift({ change_id: S.rev, at: '2026-11-27T09:0' + (S.rev % 10) + ':00+09:00', who: 'me', changes }); return send({ ok: true, rev: S.rev, change_id: S.rev, applied: body.ops.length });
      }
      const g = S.logs.find(x => x.change_id === body.change_id); g.changes.forEach(c => { const r = S.rows.find(x => x.market === c.target[1] && x.ticker === c.target[2]); if (r) Object.entries(c.fields).forEach(([k, v]) => { r[k] = v.before; }); }); S.rev++; return send({ ok: true, rev: S.rev, change_id: S.rev, applied: 1 });
    };
  }, { admin, draft });
  return { p, errs, ctx };
}
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let { p, errs, ctx } = await open(b, 390, 844, false);
  await p.evaluate(() => shelfOpen()); await p.waitForTimeout(500);
  ok('일반 회원: 안 열리고 서버 호출 없음', await p.evaluate(() => !document.getElementById('shelfFull').classList.contains('open') && !window.__S.calls.some(c => c[0] === 'shelf'))); await ctx.close();

  ({ p, errs, ctx } = await open(b, 390, 844, true));
  const wait = ms => p.waitForTimeout(ms);
  const st = () => p.evaluate(() => document.querySelector('.shelf-host').shadowRoot.textContent);
  const S = f => p.evaluate(f);
  const click = async (sel, ms) => { await p.locator(sel).first().click(); await wait(ms || 900); };
  const hold = async () => { const h = await p.locator('#sheet [data-apply]').boundingBox(); await p.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await p.mouse.down(); await wait(1550); await p.mouse.up(); await wait(1200); };
  await p.evaluate(() => shelfOpen()); await wait(2500);
  ok('이상 알림 · 서가', /수집 이상/.test(await st()) && await p.locator('.book').count() === 36);
  await p.screenshot({ path: path.join(OUT, 'shelf1.png') });
  await click('.book.bad', 1300); ok('책을 누르면 흐름이 열림', await p.locator('#sheetBody .node').count() === 4); await click('#close');
  await click('#tabs button >> nth=1', 1500);
  ok('명부 좌석표', await p.locator('#seats i').count() === 30, String(await p.locator('#seats i').count()));
  ok('섹터 이름은 그림글자 없이 보임', !/💾/.test(await st()));

  /* v9.49: 전체 · 주전 · 후보 거르기 (미국 30곳 = 주전 26 · 후보 4) */
  const gr = () => p.evaluate(() => { const r = document.querySelector('.shelf-host').shadowRoot, seg = r.getElementById('grSeg'), b = [...seg.querySelectorAll('button')], pl = seg.querySelector('.pill').getBoundingClientRect(), on = b.find(x => x.getAttribute('aria-selected') === 'true'), o = on.getBoundingClientRect(); return { label: b.map(x => x.textContent).join(' '), on: on.textContent, under: Math.abs(pl.left - o.left) < 2 && Math.abs(pl.width - o.width) < 2, n: r.querySelector('#rlist .ln-n').textContent, grades: [...new Set([...r.querySelectorAll('#rlist .co .gr')].map(x => x.textContent))].join(), h: Math.round(seg.getBoundingClientRect().height) }; });
  const g0 = await gr(); ok('거르기: 수 · 처음은 전체', g0.label === '전체30 주전26 후보4' && g0.on === '전체30' && g0.under && g0.h === 44, JSON.stringify(g0));
  await click('#grSeg [data-gr="후보"]'); const gc = await gr(); ok('후보만', gc.n === '4곳' && gc.grades === '후보' && gc.under, JSON.stringify(gc));
  await p.screenshot({ path: path.join(OUT, 'shelf_gr.png') });
  await p.locator('#rq').fill('t9'); await wait(500); const gq = await gr(); ok('검색과 함께: 수가 따라감', gq.label === '전체1 주전0 후보1' && gq.n === '1곳', JSON.stringify(gq)); await p.locator('#rq').fill(''); await wait(400);
  await click('[data-mk="KR"]'); const gk = await gr(); ok('시장을 바꿔도 고른 거르기 유지', gk.on.startsWith('후보') && gk.grades === '후보' && gk.under, JSON.stringify(gk)); await click('[data-mk="US"]');
  await click('#grSeg [data-gr="주전"]'); const gj = await gr(); ok('주전만', gj.n === '26곳' && gj.grades === '주전', JSON.stringify(gj));
  await click('[data-multi]'); await click('#rlist [data-co="T1"]', 300); await click('#grSeg [data-gr="후보"]', 500);
  ok('거르기를 바꾸면 고른 것은 비움', await p.evaluate(() => /0곳 고름/.test(document.querySelector('.shelf-host').shadowRoot.textContent)));
  await click('[data-multi]'); await click('#grSeg [data-gr=""]');

  /* 종목 고치기 → 저장 */
  await click('#rlist [data-co="T1"]', 1100);
  ok('티커는 고칠 수 없음 · 한 줄 정의 20자', await p.locator('#sheet [data-k="t"]').getAttribute('readonly') !== null && await p.locator('#sheet [data-k="brief"]').getAttribute('maxlength') === '20');
  await p.locator('#sheet [data-k="name"]').fill('고친 회사'); await p.locator('#sheet [data-k="brief"]').fill('고친 정의');
  await click('#sheet [data-save]', 1000);
  ok('담기만 하면 서버에 안 보냄', await S(() => window.__S.posts.length === 0));
  await S(() => { shelfClose(); }); await wait(300); await S(() => shelfOpen()); await wait(2200); await click('#tabs button >> nth=1', 1200);
  ok('닫았다 열어도 담은 것이 남음', /바꾼 것 1개/.test(await st()) && /고친 회사/.test(await st()));
  await click('#pend [data-review]', 1200); await p.screenshot({ path: path.join(OUT, 'shelf2.png') }); await hold();
  const p1 = await S(() => window.__S.posts[0]);
  ok('저장: POST · 로그인 토큰 머리 · 판 번호 0 · 바꾼 칸만', p1 && p1.method === 'POST' && /^Bearer /.test(p1.auth) && JSON.stringify(p1.body) === JSON.stringify({ base_rev: 0, ops: [{ op: 'row_set', market: 'US', ticker: 'T1', name: '고친 회사', brief: '고친 정의' }] }), JSON.stringify(p1 && p1.body));
  ok('저장 뒤 새 값 · 담은 것 비움', /고친 회사/.test(await st()) && await S(() => !localStorage.getItem('aqShelfPending1')) && !(await p.locator('#pend').isVisible()));

  /* 판 충돌 → 새로 읽고 다시 확인 */
  await click('#rlist [data-co="T2"]', 1100); await p.locator('#sheet [data-k="detail"]').fill('상세 시험'); await click('#sheet [data-save]', 900);
  await S(() => { window.__S.rev++; window.__S.rows.find(r => r.ticker === 'T2').name = '남이 고친 이름'; });
  await click('#pend [data-review]', 1100); await hold();
  ok('충돌: 알려 주고 담은 것 유지', /먼저 바뀌었어요/.test(await st()) && /상세 시험/.test(await st()));
  await p.screenshot({ path: path.join(OUT, 'shelf3.png') }); await hold();
  ok('충돌 뒤 다시 누르면 저장(남이 고친 칸 유지)', await S(() => { const r = window.__S.rows.find(x => x.ticker === 'T2'); return r.detail === '상세 시험' && r.name === '남이 고친 이름'; }));

  /* 서버 거절 이유 */
  await click('#rlist [data-co="T3"]', 1100); await p.locator('#sheet [data-k="name"]').fill('거절될 이름'); await click('#sheet [data-save]', 900);
  await S(() => { window.__S.reply = { ok: false, errors: [{ i: 0, why: '회사명이 비었습니다' }] }; });
  await click('#pend [data-review]', 1100); await hold();
  ok('거절 이유 표시 · 저장 단추 잠김', /회사명이 비었습니다/.test(await st()) && await p.locator('#sheet [data-apply]').isDisabled());
  await click('#sheet [data-undo="0"]', 1000); ok('✕ 로 빼면 원래 값', !/거절될 이름/.test(await p.locator('#rlist').textContent()) && await p.evaluate(() => !localStorage.getItem('aqShelfPending1')));

  /* 섹터: 이름 바꾸기 · 없애며 옮기기 */
  await click('[data-view="sec"]'); await click('.srow[data-sec="은행"]', 1100); await p.locator('#sheet [data-k="name"]').fill('은행업'); await click('#sheet [data-savesec]', 900);
  await click('.srow[data-sec="은행업"]', 1100); await click('#sheet [data-delsec]', 1100); await click('#sheet2 .opt[data-opt="💾 반도체"]', 1100);
  await click('#pend [data-review]', 1100); await hold();
  const p2 = await S(() => window.__S.posts[window.__S.posts.length - 1].body.ops);
  ok('섹터 작업 순서 · 칸', JSON.stringify(p2) === JSON.stringify([{ op: 'sector_set', market: 'US', name: '은행업', renameFrom: '은행' }, { op: 'sector_del', market: 'US', name: '은행업', moveTo: '💾 반도체' }]), JSON.stringify(p2));

  /* 새 종목 · 여러 개 · 빼기 */
  await click('[data-view="co"]'); await click('.add[data-add]', 1100);
  await p.locator('#sheet [data-k="name"]').fill('새 회사'); await p.locator('#sheet [data-k="t"]').fill('ex.a'); await click('#sheet [data-pick]', 1100); await click('#sheet2 .opt', 1100); await click('#sheet [data-save]', 900);
  await click('[data-multi]'); await click('#rlist [data-co="T4"]', 300); await click('#rlist [data-co="T5"]', 300); await click('#bulk [data-bgrade]', 1100); await click('#sheet2 .opt[data-opt="후보"]', 1100);
  await click('#rlist [data-co="T6"]', 1100); await click('#sheet [data-remove]', 1100);
  await click('#pend [data-review]', 1100); await hold();
  const p3 = await S(() => window.__S.posts[window.__S.posts.length - 1].body.ops);
  ok('새 종목(점 → 붙임표) · 자격 여러 개 · 빼기', p3[0].ticker === 'EX-A' && !('isNew' in p3[0]) && p3.some(o => o.op === 'row_del' && o.ticker === 'T6') && p3.filter(o => o.grade === '후보' && o.op === 'row_set').length >= 1, JSON.stringify(p3));

  /* 기록 · 되돌리기 */
  await click('[data-view="log"]', 1100); ok('바꾼 기록(서버)', await p.locator('.hrow').count() === 4, String(await p.locator('.hrow').count()));
  await p.screenshot({ path: path.join(OUT, 'shelf4.png') });
  await p.locator('.hrow [data-revert="1"]').click(); await wait(1100); ok('되돌리기는 확인 먼저', await S(() => !window.__S.posts.some(x => x.part === 'roster_undo')));
  await hold();
  ok('길게 눌러 되돌리기', await S(() => { const u = window.__S.posts.filter(x => x.part === 'roster_undo')[0]; return !!u && u.body.change_id === 1 && Number.isInteger(u.body.base_rev) && window.__S.rows.find(r => r.ticker === 'T1').name === '시험회사1'; }));

  await click('#tabs button >> nth=2', 1500); ok('정리: 길 지금 → 목표', await p.locator('.gb').count() >= 1);
  ok('오류 없음', errs.length === 0, errs.join(' | ').slice(0, 300)); await ctx.close();

  /* 예전 기기 저장분 → 담은 것으로 */
  ({ p, errs, ctx } = await open(b, 390, 844, true, { rows: { US: { set: [{ t: 'T7', name: '기기에서 고친 이름', sector: '반도체', grade: '주전', brief: '', detail: '', reason: '' }], del: [] }, KR: { set: [], del: [] } }, secs: {} }));
  await p.evaluate(() => shelfOpen()); await p.waitForTimeout(2500);
  ok('기기에 두었던 고침 → 담은 것 · 자동 전송 없음', await p.evaluate(() => { const q = JSON.parse(localStorage.getItem('aqShelfPending1') || '[]'); return q.length === 1 && JSON.stringify(q[0].ops) === JSON.stringify([{ op: 'row_set', market: 'US', ticker: 'T7', name: '기기에서 고친 이름' }]) && !localStorage.getItem('aqShelfDraft1') && !window.__S.posts.length; }));
  ok('오류 없음(옮김)', errs.length === 0, errs.join(' | ').slice(0, 300)); await ctx.close();

  ({ p, errs, ctx } = await open(b, 1280, 720, true));
  const rail = await p.evaluate(() => [...document.querySelectorAll('#mobileTabBar > .mtab-wide')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.getAttribute('aria-label')).join());
  ok('넓은 화면 왼쪽 메뉴: 자동 · 운영 · 책장 · 설정', rail === '자동,운영,책장,설정', rail);
  await p.click('#mobileTabBar .mtab-btn[data-mtab="shelf"]'); await p.waitForTimeout(2500);
  ok('넓은 화면: 오른쪽 칸에 열림', await p.evaluate(() => { const r = document.getElementById('shelfFull').getBoundingClientRect(); return r.left >= document.getElementById('mobileTabBar').getBoundingClientRect().right && !!document.querySelector('.shelf-host'); }));
  ok('오류 없음(넓은 화면)', errs.length === 0, errs.join(' | ').slice(0, 300));
  console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); await b.close(); process.exit(fails ? 1 : 0);
})();
