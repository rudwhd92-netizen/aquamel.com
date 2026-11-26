// 탭 메뉴 Tab pill 시험 — node tools/ui-test/tabpill.js   (가짜 데이터 · 서버 · 로그인 없음)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다(Playwright 브라우저가 없을 때)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0;
const ok = (name, cond, extra) => { console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? '  · ' + extra : '')); if (!cond) fails++; };
const shot = async (p, sel, name) => { const b = await p.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return { y: r.y, h: r.height }; }, sel); await p.screenshot({ path: path.join(OUT, name), clip: { x: 0, y: Math.max(0, b.y - 14), width: p.viewportSize().width, height: b.h + 28 } }); };
// 알약 상태: 알약 가장자리와 고른 탭 가장자리(+inset — 줄의 --tp-inx, 메뉴 탭 줄은 3 · v8.82)
const state = (p, sel) => p.evaluate(sel => {
  const row = document.querySelector(sel), ind = row.querySelector(':scope > .aq-tp-ind'), a = row.querySelector(':scope > .xtab-btn.active');
  const m = /translateX\(([-\d.]+)px\)/.exec(ind.style.transform || ''); const x = m ? +m[1] : null, w = parseFloat(ind.style.width);
  const rr = row.getBoundingClientRect(), ar = a ? a.getBoundingClientRect() : null, aL = ar ? ar.left - rr.left + row.scrollLeft : null;   // 소수점까지
  const k = parseFloat(getComputedStyle(row).getPropertyValue('--tp-inx')) || 4;
  return { x, w, right: x + w, tl: ar ? aL + k : null, tr: ar ? aL + ar.width - k : null, k, rh: Math.round(rr.height), rw: Math.round(rr.width), fit: row.classList.contains('tp-fit'), op: ind.style.opacity, label: a ? a.textContent.trim() : '', sl: row.scrollLeft, sw: row.scrollWidth, cw: row.clientWidth, fl: row.style.getPropertyValue('--tp-l'), fr: row.style.getPropertyValue('--tp-r'), n: Array.from(row.children).filter(c => c.classList.contains('xtab-btn') && c.offsetWidth > 0).length };
}, sel);
const at = s => Math.abs(s.x - s.tl) < 0.6 && Math.abs(s.right - s.tr) < 0.6;
const waitSettled = async (p, sel, ms = 4000) => { const t0 = Date.now(); let s = await state(p, sel); while (!at(s) && Date.now() - t0 < ms) { await p.waitForTimeout(100); s = await state(p, sel); } return s; };   // 알약이 멈출 때까지(무거운 화면은 프레임이 밀려 늦게 도착)
// 페이지 안에서 직접 눌러 프레임마다 알약 기록 (눌린 시각을 정확히 맞춤)
const run = (p, rowSel, fn, ms) => p.evaluate(([rowSel, fn, ms]) => new Promise(res => {
  const row = document.querySelector(rowSel); const S = []; const t0 = performance.now(); let did = false, tClick = 0;
  (function f() { const now = performance.now() - t0; if (!did && now > 120) { did = true; tClick = now; (new Function(fn))(); }
    const ind = row.querySelector('.aq-tp-ind') || { style: { transform: S.length ? 'translateX(' + S[S.length - 1][1] + 'px)' : '', width: S.length ? S[S.length - 1][2] + 'px' : '0' } }; const m = /translateX\(([-\d.]+)px\)/.exec(ind.style.transform); S.push([Math.round(now), +m[1], parseFloat(ind.style.width)]); const stable = S.length > 12 && S.slice(-10).every(q => Math.abs(q[1] - S[S.length - 1][1]) < 0.05 && Math.abs(q[2] - S[S.length - 1][2]) < 0.05);   // 탭 내용이 처음 그려질 때 메인 스레드가 1초 넘게 막혀도(알약이 그 뒤에 움직임) 멈출 때까지 기록
    if (now < ms || (did && now - tClick < 6000 && !(stable && now - tClick > 500))) requestAnimationFrame(f); else res(S); })();
}), [rowSel, fn, ms]);
const prep = async (b, opts, role) => {
  const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, opts || {})); const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(role => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none');   // 로그인 막 · 시작 화면(말 로고)이 위를 덮으면 캡처가 안 보임
 document.body.setAttribute('data-role', role); document.body.setAttribute('data-broker', 'linked'); try { _aqAuth.user = { role }; } catch (e) {} window.apiCall = async () => ({ ok: false }); }, role || 'admin');
  return p;
};
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let p = await prep(b, null, 'admin');

  // 1) 탐색 페이지(발견 › 전체보기) — 탭 5개(섹터동향 · 종목리스트 · 내부자 매수 · 밸런스 종목 · V시그널 — v9.35: 넘치면 밀어서)
  await p.evaluate(() => switchMobileTab('explore')); await p.waitForTimeout(900);
  let s = await state(p, '#exploreSubtabs .xtab-row');
  ok('탐색: 알약이 고른 탭 자리 · 탭 5개', s.op === '' && at(s) && s.n === 5, JSON.stringify(s));
  await shot(p, '#exploreSubtabs .xtab-row', 'tabpill_explore_1.png');
  let R = await run(p, '#exploreSubtabs .xtab-row', "document.querySelector('#exploreSubtabs .xtab-btn[data-xtab=\"balance\"]').click()", 1300); await p.waitForTimeout(100);
  s = await waitSettled(p, '#exploreSubtabs .xtab-row'); const W = R.map(r => r[2]), w0 = W[0], wMax = Math.max(...W), fin = R[R.length - 1];
  ok('탐색: 이동 뒤 알약이 새 탭 자리에 정확히 멈춤', at(s), `${s.label} x=${s.x.toFixed(1)} 목표 ${s.tl}`);
  ok('탐색: 가는 동안 알약이 늘어났다 줄어듦', wMax > w0 + 30 && Math.abs(fin[2] - w0) < 25, `폭 ${w0.toFixed(0)} → 최대 ${wMax.toFixed(0)} → 끝 ${fin[2].toFixed(0)}`);
  const settle = R.findIndex((r, i) => R.slice(i).every(q => Math.abs(q[1] - fin[1]) < 0.5 && Math.abs(q[2] - fin[2]) < 0.5)); ok('탐색: 1초 안에 멈춤', settle > -1 && R[settle][0] - 120 < 1000, `${R[settle][0] - 120}ms`);
  await shot(p, '#exploreSubtabs .xtab-row', 'tabpill_explore_4.png');
  R = await run(p, '#exploreSubtabs .xtab-row', "document.querySelector('#exploreSubtabs .xtab-btn[data-xtab=\"list\"]').click()", 1300); s = await waitSettled(p, '#exploreSubtabs .xtab-row'); ok('탐색: 반대(왼쪽) 이동도 늘어났다 정확히 멈춤', at(s) && Math.max(...R.map(r => r[2])) > R[0][2] + 30, JSON.stringify(s) + ' 폭 ' + R[0][2] + '→' + Math.max(...R.map(r => r[2])));

  // 2) 마이 — 탭 4개(실시간 현황 · 포트폴리오 · 누적 성과 · 운영 통계 — v9.35: 포트폴리오가 항해에서 이사)
  await p.evaluate(() => switchMobileTab('board')); await p.waitForTimeout(900);
  R = await run(p, '#boardSubtabs .xtab-row', "document.querySelector('#boardSubtabs .xtab-btn[data-btab=\"performance\"]').click()", 1200); s = await waitSettled(p, '#boardSubtabs .xtab-row');
  ok('마이: 4개 줄 · 알약이 고른 탭 자리', at(s) && s.n === 4 && Math.max(...R.map(r => r[2])) > R[0][2] + 20, `${s.label} · 탭 ${s.n}개`); await shot(p, '#boardSubtabs .xtab-row', 'tabpill_board.png');

  // 3) AI (관리자) — 줄을 innerHTML로 다시 그려도 알약이 이어서 움직임
  await p.evaluate(() => switchMobileTab('ai')); await p.waitForTimeout(900);
  const aiTabs = await p.evaluate(() => Array.from(document.querySelectorAll('#aiSubRow .xtab-btn')).filter(b => b.offsetWidth > 0).map(b => b.textContent.trim()));
  ok('AI(관리자): 탭이 보임', aiTabs.length >= 1, aiTabs.join(' · ')); await shot(p, '#aiSubRow', 'tabpill_ai_admin.png');
  if (aiTabs.length >= 2) {
    R = await run(p, '#aiSubRow', "setAiSubtab(document.querySelector('#aiSubRow .xtab-btn:not(.active)').dataset.atab)", 1200); s = await state(p, '#aiSubRow');
    ok('AI: 줄이 다시 그려져도 알약이 이어서 늘어났다 멈춤', at(s) && Math.max(...R.map(r => r[2])) > R[0][2] + 15, `폭 ${R[0][2].toFixed(0)} → 최대 ${Math.max(...R.map(r => r[2])).toFixed(0)} · ${s.label}`);
  }
  // 4) 뉴스 · 연구 — 같은 줄에 다른 탭 묶음 (구성이 다르면 바로 놓임)
  await p.evaluate(() => switchMobileTab('news')); await p.waitForTimeout(900); s = await state(p, '#aiSubRow'); ok('뉴스: 구성이 달라도 알약이 고른 탭 자리', at(s) && s.n === 2, `${s.label} · 탭 ${s.n}개`); await shot(p, '#aiSubRow', 'tabpill_news.png');
  await p.evaluate(() => switchMobileTab('research')); await p.waitForTimeout(900); s = await state(p, '#aiSubRow'); ok('연구: 알약이 고른 탭 자리', at(s) && s.n === 2, `${s.label} · 탭 ${s.n}개`); await shot(p, '#aiSubRow', 'tabpill_research.png');
  // 일정 · 운영
  await p.close();

  // 5) 좁은 화면 — 넘치면 가로로 밀기 + 고른 탭을 가운데로 + 양끝 흐림
  p = await prep(b, { viewport: { width: 320, height: 800 } }, 'admin'); await p.evaluate(() => switchMobileTab('explore')); await p.waitForTimeout(900);
  s = await state(p, '#exploreSubtabs .xtab-row'); ok('좁은 화면(320): 탐색 5개 줄이 넘쳐 가로로 밀림 · 오른쪽만 흐림', s.sw > s.cw + 2 && s.fl === '0px' && s.fr === '20px', `scrollWidth ${s.sw} / ${s.cw} · l=${s.fl} r=${s.fr}`); await shot(p, '#exploreSubtabs .xtab-row', 'tabpill_narrow_1.png');
  const last = await p.evaluate(() => Array.from(document.querySelectorAll('#exploreSubtabs .xtab-btn')).pop().dataset.xtab);
  R = await run(p, '#exploreSubtabs .xtab-row', `setExploreSubtab('${last}')`, 1300); s = await state(p, '#exploreSubtabs .xtab-row');
  ok('좁은 화면: 마지막 탭 선택 → 줄이 밀려 탭이 보이고 알약이 멈춤 · 왼쪽 흐림', at(s) && s.sl > 5 && s.fl === '20px', `scrollLeft ${s.sl.toFixed(0)} · ${s.label}`); await shot(p, '#exploreSubtabs .xtab-row', 'tabpill_narrow_2.png'); await p.close();

  // 6) 움직임 줄이기 — 튕김 없이 (오른쪽 가장자리가 목표를 넘지 않음)
  p = await prep(b, { reducedMotion: 'reduce' }, 'admin'); await p.evaluate(() => switchMobileTab('board')); await p.waitForTimeout(900);
  R = await run(p, '#boardSubtabs .xtab-row', "document.querySelector('#boardSubtabs .xtab-btn[data-btab=\"stats\"]').click()", 1300);
  const edge = R.map(r => r[1] + r[2]), f2 = edge[edge.length - 1]; ok('움직임 줄이기: 튕김 없음(오른쪽 가장자리가 목표를 넘지 않음)', Math.max(...edge) <= f2 + 0.6, `최대 ${Math.max(...edge).toFixed(1)} · 끝 ${f2.toFixed(1)}`); await p.close();

  // 7) 비관리자 — AI 메뉴 숨김 · 예전 링크 우회
  p = await prep(b, null, 'user');
  const vis = await p.evaluate(() => { const g = m => { const el = document.querySelector('.mtab-btn[data-mtab="' + m + '"]'); return el ? getComputedStyle(el).display : 'none-el'; }; return { ai: g('ai'), news: g('news'), research: g('research') }; });
  ok('비관리자: 하단 메뉴에서 AI 숨김 · 연구는 보임 (v8.84: 뉴스도 하단 메뉴에)', vis.ai === 'none' && vis.research !== 'none' && vis.news !== 'none', JSON.stringify(vis));
  const go = await p.evaluate(() => { switchMobileTab('ai'); const a = document.body.dataset.atab; setAiSubtab('fc'); const b2 = document.body.dataset.atab; setAiSubtab('manager'); return { a, b2, c: document.body.dataset.atab, m: document.body.dataset.mtab }; });
  ok('비관리자: AI 링크로 와도 뉴스 첫 탭(일간 이슈)으로', go.a === 'wx' && go.b2 === 'wx' && go.c === 'wx' && go.m === 'auto', JSON.stringify(go));   // v8.75: AI 브리핑 삭제 — 비관리자 뉴스 첫 탭 = 기관 13F
  await p.evaluate(() => switchMobileTab('news')); await p.waitForTimeout(800); await p.screenshot({ path: path.join(OUT, 'tabpill_nonadmin_nav.png') });
  // 8) 종목 창 탭(.modal-view-tabs)은 예전 밑줄 그대로
  const mv = await p.evaluate(() => { const bt = document.querySelector('.modal-view-tabs .xtab-btn'), c = getComputedStyle(bt); return { pad: c.padding, after: getComputedStyle(bt, '::after').content }; });
  ok('종목 창 탭은 예전 밑줄 그대로', mv.pad === '11px 4px 10px' && mv.after !== 'none', JSON.stringify(mv));
  // 9) v8.82 가안 A — 탭 3개 이하는 글자 폭 알약(높이 36 · 왼쪽 정렬 · 탭 최소 72) · 4개는 꽉 채운 높이 40 · 안쪽 여백 3
  p = await prep(b, {}, 'admin');
  const geo = async (m, sel) => { await p.evaluate(m => switchMobileTab(m), m); await p.waitForTimeout(900); return state(p, sel); };
  let g = await geo('news', '#aiSubRow'); ok('뉴스(2개): 글자 폭 알약 · 높이 36 · 줄 폭이 화면 폭보다 훨씬 작음', g.fit && g.rh === 36 && g.rw < 220 && g.k === 3, JSON.stringify({ fit: g.fit, h: g.rh, w: g.rw, inset: g.k }));
  ok('뉴스(2개): 알약이 고른 탭 자리(안쪽 3)', Math.abs(g.x - g.tl) < 0.6 && Math.abs(g.right - g.tr) < 0.6, JSON.stringify({ x: g.x, tl: g.tl, right: g.right, tr: g.tr }));
  const minw = await p.evaluate(() => Math.min(...Array.from(document.querySelectorAll('#aiSubRow .xtab-btn')).filter(b => b.offsetWidth > 0).map(b => b.getBoundingClientRect().width)));
  ok('뉴스(2개): 탭 최소 폭 72 이상', minw >= 71.5, String(minw));
  g = await geo('ai', '#aiSubRow'); ok('AI(4개: 밸류체인이 이사 · 관리자): 꽉 채운 줄 · 높이 40', !g.fit && g.rh === 40, JSON.stringify({ fit: g.fit, h: g.rh, w: g.rw }));
  g = await geo('explore', '.explore-subtabs#exploreSubtabs .xtab-row'); ok('탐색(5개): 꽉 채운 줄 · 높이 40(글자 폭 알약은 3개 이하만)', !g.fit && g.rh === 40, JSON.stringify({ fit: g.fit, h: g.rh, w: g.rw }));
  ok('탐색(5개): 알약이 고른 탭 자리(안쪽 3)', Math.abs(g.x - g.tl) < 0.6 && Math.abs(g.right - g.tr) < 0.6, JSON.stringify({ x: g.x, tl: g.tl, right: g.right, tr: g.tr }));
  await p.evaluate(() => switchMobileTab('research')); await p.waitForTimeout(700); ok('AI리포트(v8.89): 거르기 알약 줄이 없음(검색 단추만)', await p.evaluate(() => !document.querySelector('#rpBar .xtab-row') && !!document.querySelector('#rpBar .rp-srch')));
  g = await geo('board', '#boardSubtabs .xtab-row'); ok('마이(4개): 꽉 채운 줄 · 높이 40', !g.fit && g.rh === 40, JSON.stringify({ fit: g.fit, h: g.rh, w: g.rw }));
  // 메뉴를 바꿔도(뉴스 2개 ↔ AI 3개 같은 줄) 줄 폭이 따라 바뀜
  g = await geo('news', '#aiSubRow'); const g2 = await geo('ai', '#aiSubRow'); const g3 = await geo('news', '#aiSubRow');
  ok('같은 줄(#aiSubRow)이 뉴스(2개: 글자 폭) → AI(4개: 꽉 채움) → 뉴스로 바뀌어도 폭 규칙이 따라 바뀜', g.fit && !g2.fit && g3.fit && g2.rw > g.rw + 20 && Math.abs(g3.rw - g.rw) < 2, JSON.stringify({ 뉴스: g.rw, AI: g2.rw, 다시뉴스: g3.rw }));
  await p.screenshot({ path: path.join(OUT, 'tabpill_v82_news.png') });
  console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); console.log('캡처:', OUT); await b.close(); process.exit(fails ? 1 : 0);
})();
