// 이력 칸 토글 · AI리포트 슬라이드 시험 — node tools/ui-test/slides.js   (v8.89)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다 · 차트 · 이력은 저장소의 data 폴더가 같이 서빙돼야 그려진다
//   ① 발견 · 마이 › 실시간 현황의 오른쪽 이력 칸(폭 600 이상): 안쪽 스크롤 없음 · 휠이 화면으로 이어짐 · 시그널/내부자 토글 · 높이
//   ② 연구 › AI리포트: 카드 안 슬라이드 · 점 스프링 · 밀기 · 길게 누르기와 밀기가 안 섞임 (보고서는 fixtures/ 가상 보고서)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
const FIX = fs.readFileSync(path.join(__dirname, 'fixtures', 'report_v3.txt'), 'utf8'), LEG = fs.readFileSync(path.join(__dirname, 'fixtures', 'report_legacy.txt'), 'utf8');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
async function prep(b, vp) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.waitForFunction(() => _state.archive && _state.archive.length > 100, null, { timeout: 30000 }).catch(() => console.log('(아카이브 로딩 대기 시간 초과)'));
  await p.waitForTimeout(800);
  await p.evaluate(([fix, leg]) => {
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); document.body.setAttribute('data-broker', 'linked');
    fetchReportsIndex = async () => {};
    const STUB = { US: { CL: ['2026-11-20'], WMB: ['2026-11-18'], ELV: ['2026-11-19'], PLD: ['2026-11-17'] }, KR: {} };
    Object.defineProperty(_state, 'reports', { get: () => STUB, set: () => {}, configurable: true });
    fetchReportContent = async (tk, d) => (String(tk).toUpperCase() === 'PLD' ? leg : fix);
  }, [FIX, LEG]);
  return p;
}
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });

  /* ───────── ① 오른쪽 이력 칸 (폭 700 = 카드 폭 600 이상) ───────── */
  {
    const p = await prep(b, { width: 700, height: 900 });
    const tks = await p.evaluate(() => { const c = {}; (_state.archive || []).forEach(r => { if (r.Ticker) c[r.Ticker] = (c[r.Ticker] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12).map(x => x[0]); });
    await p.evaluate(t => { _dashLastComputed = { holdings: t.map((x, i) => ({ ticker: x, qty: 10 + i, cost: 1000 + i * 50, curPrice: 100 + i, avgPrice: 90 + i })) }; switchMobileTab('board'); setBoardSubtab('live'); aqLiveBoardRender(); }, tks);
    await p.waitForSelector('#lvFeed .feed-item', { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(1500);
    await p.evaluate(() => document.querySelectorAll('#lvFeed .feed-item').forEach(it => it.scrollIntoView())); await p.waitForTimeout(1800);
    const snap = tf => p.evaluate(tf => [...document.querySelectorAll('#lvFeed .feed-item')].map(it => { aqFeedSetTf(it.dataset.ticker, tf); return it.dataset.ticker; }), tf);
    const probe = () => p.evaluate(() => [...document.querySelectorAll('#lvFeed .feed-item')].map(it => { const s = it.querySelector('.feed-side'); if (!s || getComputedStyle(s).display === 'none') return null; const cs = getComputedStyle(s), tabs = [...s.querySelectorAll('.fs-tabs .xtab-btn')]; return { tk: it.dataset.ticker, ov: cs.overflowY, ob: cs.overscrollBehaviorY, h: Math.round(s.getBoundingClientRect().height), sh: s.scrollHeight, ch: s.clientHeight, tabs: tabs.map(x => x.textContent.trim()).join('|'), act: (tabs.find(x => x.classList.contains('active')) || {}).dataset ? tabs.find(x => x.classList.contains('active')).dataset.fst : '', rows: s.querySelectorAll('.fs-row').length, old: !!s.querySelector('.aq-discover-insiders') }; }).filter(Boolean));
    for (const tf of ['3M', '6M', '1Y']) {
      await snap(tf); await p.waitForTimeout(900);
      const r = await probe();
      ok('이력 칸 ' + tf + ': 카드 ' + r.length + '장 — 안쪽 스크롤 없음(overflow visible · 끝에서 막힘 없음)', r.length >= 4 && r.every(x => x.ov === 'visible' && x.ob === 'auto'), JSON.stringify(r.slice(0, 2)));
      ok('이력 칸 ' + tf + ': 내용이 칸에 다 들어감(스크롤 길이 = 칸 높이) · 높이 380 ~ 420', r.every(x => x.sh <= x.ch + 1 && x.h >= 380 && x.h <= 420), r.filter(x => !(x.sh <= x.ch + 1 && x.h >= 380 && x.h <= 420)).map(x => x.tk + ':' + x.sh + '/' + x.ch + '/' + x.h).join(' ') || 'ok');
      ok('이력 칸 ' + tf + ': 맨 위 알약 「시그널 N | 내부자 N」 · 목록은 5줄 이하 · 예전 「내부자 리스트」 덧붙임 없음', r.every(x => /^시그널 \d+\|내부자 \d+$/.test(x.tabs) && x.rows <= 5 && !x.old), r.slice(0, 3).map(x => x.tabs + '/' + x.rows).join(' , '));
    }
    // 토글
    await snap('6M'); await p.waitForTimeout(900);
    const cand = await p.evaluate(() => { for (const it of document.querySelectorAll('#lvFeed .feed-item')) { const s = it.querySelector('.feed-side'), ins = s && s.querySelector('.fs-tabs [data-fst="ins"]'), sig = s && s.querySelector('.fs-tabs [data-fst="sig"]'); if (ins && sig && !ins.disabled && !sig.disabled) return it.dataset.ticker; } return null; });
    ok('시험에 쓸 종목(시그널 · 내부자 둘 다 있음)이 있음', !!cand, String(cand));
    if (cand) {
      const sel = '#lvFeed .feed-item[data-ticker="' + cand + '"]';
      const before = await p.evaluate(sel => { const s = document.querySelector(sel + ' .feed-side'); return { h: Math.round(s.getBoundingClientRect().height), act: s.querySelector('.fs-tabs .active').dataset.fst, sig: s.querySelectorAll('.fs-row[data-sig]').length }; }, sel);
      await p.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(300);
      await p.click(sel + ' .fs-tabs [data-fst="ins"]'); await p.waitForTimeout(700);
      const after = await p.evaluate(sel => { const s = document.querySelector(sel + ' .feed-side'), a = s.querySelector('.fs-tabs .active'), ind = s.querySelector('.fs-tabs .aq-tp-ind'); const rows = [...s.querySelectorAll('.fs-row')]; return { h: Math.round(s.getBoundingClientRect().height), sh: s.scrollHeight, ch: s.clientHeight, act: a.dataset.fst, ins: s.querySelectorAll('.fs-row[data-ins]').length, sig: s.querySelectorAll('.fs-row[data-sig]').length, rows: rows.length, kinds: [...s.querySelectorAll('.fs-k')].map(x => x.textContent).join(','), foot: (s.querySelector('.fs-foot') || {}).textContent || '', ind: !!ind, indOn: ind ? Math.abs(ind.getBoundingClientRect().left - a.getBoundingClientRect().left) < 6 : false, minH: Math.min(...rows.map(r => r.getBoundingClientRect().height)), ex: rows.every(r => r.nextElementSibling && r.nextElementSibling.classList.contains('aq-discover-detail')) }; }, sel);
      ok('토글 「내부자」: 같은 칸에서 내부자 목록(최대 5줄)으로 바뀜 · 매수/매도 글자 · 아래 전체 보기', after.act === 'ins' && after.ins >= 1 && after.ins <= 5 && after.sig === 0 && /^(매수|매도)(,(매수|매도))*$/.test(after.kinds) && /내부자 \d+건 전체/.test(after.foot), JSON.stringify(after));
      ok('토글 후에도 칸 높이 그대로 · 안쪽 스크롤 없음 · 줄 높이 44 이상 · 알약 바탕이 고른 쪽 위치', Math.abs(after.h - before.h) <= 2 && after.sh <= after.ch + 1 && after.minH >= 44 && after.ind && after.indOn, JSON.stringify({ before, after: { h: after.h, sh: after.sh, ch: after.ch, minH: after.minH, ind: after.ind, indOn: after.indOn } }));
      ok('내부자 줄에도 펼침 설명 자리(.aq-discover-detail)가 붙음', after.ex);
      // 줄 눌러 펼침 → 칸 안쪽 스크롤 안 생김
      await p.click(sel + ' .fs-row[data-ins="0"]'); await p.waitForTimeout(700);
      const open = await p.evaluate(sel => { const s = document.querySelector(sel + ' .feed-side'), r = s.querySelector('.fs-row[data-ins="0"]'); return { exp: r.getAttribute('aria-expanded'), sh: s.scrollHeight, ch: s.clientHeight, ov: getComputedStyle(s).overflowY, pt: !!document.querySelector(sel + ' .aq-discover-marker:not([hidden])') }; }, sel);
      ok('내부자 줄을 누르면 펼쳐지고(차트에 날짜 표시) 칸에 스크롤이 생기지 않음', open.exp === 'true' && open.sh <= open.ch + 1 && open.ov === 'visible' && open.pt, JSON.stringify(open));
      // 기간을 바꿔도 고른 쪽 기억
      await p.evaluate(t => aqFeedSetTf(t, '3M'), cand); await p.waitForTimeout(900);
      const keep = await p.evaluate(sel => { const a = document.querySelector(sel + ' .feed-side .fs-tabs .active'); return a ? a.dataset.fst : ''; }, sel);
      ok('기간(3M)을 바꿔도 고른 「내부자」 쪽을 기억(그쪽에 건수가 있으면)', keep === 'ins' || keep === 'sig', keep);
      // 다시 시그널
      await p.click(sel + ' .fs-tabs [data-fst="sig"]'); await p.waitForTimeout(600);
      const back = await p.evaluate(sel => { const s = document.querySelector(sel + ' .feed-side'); return { act: s.querySelector('.fs-tabs .active').dataset.fst, sig: s.querySelectorAll('.fs-row[data-sig]').length, mk: !!document.querySelector(sel + ' .aq-discover-marker[hidden]') || !document.querySelector(sel + ' .aq-discover-marker') }; }, sel);
      ok('다시 「시그널」로 돌아오면 시그널 줄 · 차트 표시는 지워짐', back.act === 'sig' && back.sig >= 1 && back.mk, JSON.stringify(back));
      // 휠이 화면으로 이어짐(칸이 가져가지 않음)
      await p.evaluate(sel => { window.scrollTo(0, 0); document.querySelector(sel).scrollIntoView({ block: 'start' }); }, sel); await p.waitForTimeout(400);
      const bb = await p.evaluate(sel => { const r = document.querySelector(sel + ' .feed-side').getBoundingClientRect(); return { x: r.left + r.width / 2, y: Math.min(r.top + 120, innerHeight - 40), y0: scrollY }; }, sel);
      await p.mouse.move(bb.x, bb.y); for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, 250); await p.waitForTimeout(180); }
      const y1 = await p.evaluate(() => scrollY);
      ok('이력 칸 위에서 휠을 굴리면 화면이 그대로 내려감(안쪽에 갇히지 않음)', y1 - bb.y0 >= 600, bb.y0 + ' → ' + y1);
    }
    // 0건인 쪽은 알약이 흐리고 눌리지 않음
    const dis = await p.evaluate(() => { const o = []; document.querySelectorAll('#lvFeed .feed-item').forEach(it => it.querySelectorAll('.fs-tabs .xtab-btn').forEach(bt => { if (/ 0$/.test(bt.textContent.trim())) o.push({ tk: it.dataset.ticker, dis: bt.disabled, act: bt.classList.contains('active') }); })); return o; });
    ok('건수가 0인 쪽 알약은 눌리지 않고 선택 상태도 아님(해당 종목 ' + dis.length + '개)', dis.every(x => x.dis && !x.act), JSON.stringify(dis.slice(0, 3)));
    await p.screenshot({ path: path.join(OUT, 'slides_side.png') });
    await p.context().close();
  }

  /* ───────── ② 연구 › AI리포트 슬라이드 (390) ───────── */
  {
    const p = await prep(b, { width: 390, height: 844 });
    await p.evaluate(() => { switchMobileTab('research'); setAiSubtab('report'); buildAnalysisGrid(); });
    await p.waitForSelector('#rpFeed .feed-item', { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(1500);
    await p.evaluate(() => document.querySelectorAll('#rpFeed .feed-item').forEach(i => i.scrollIntoView())); await p.waitForTimeout(1500);
    const sel = '#rpFeed .feed-item[data-ticker="CL"]';
    await p.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(800);
    const st = () => p.evaluate(sel => { const rs = document.querySelector(sel + ' .fl-front .rs'), strip = rs.querySelector('.rs-strip'), act = rs.querySelector('.rs-act'), dots = [...rs.querySelectorAll('.rs-dots button')]; const m = /translateX\(([-\d.]+)%\)/.exec(strip.style.transform); const ar = act.getBoundingClientRect(); return { x: m ? -parseFloat(m[1]) / 100 : 0, sel: dots.map(d => d.getAttribute('aria-selected')).join(','), aw: Math.round(ar.width * 10) / 10, ac: Math.round((ar.left + ar.width / 2) * 10) / 10, dc: dots.map(d => { const r = d.getBoundingClientRect(); return Math.round((r.left + r.width / 2) * 10) / 10; }) }; }, sel);
    const s0 = await st();
    ok('슬라이드 시작: 첫 장 · 점 3개 · 알약 = 첫 점 위(폭 20)', s0.x === 0 && s0.sel === 'true,false,false' && Math.abs(s0.aw - 20) <= 1 && Math.abs(s0.ac - s0.dc[0]) <= 1.5, JSON.stringify(s0));
    const viz = await p.evaluate(sel => { const q = c => document.querySelector(sel + ' .fl-front ' + c); return { gauge: !!q('.rs-gauge i'), big: (q('.rs-big') || {}).textContent, scale: document.querySelectorAll(sel + ' .fl-front .rs-scale i.on').length, scaleOn: (q('.rs-scale-l .on') || {}).textContent, two: !!q('.rs-two'), axis: document.querySelectorAll(sel + ' .fl-front .rs-axis .d:not(.next)').length, next: document.querySelectorAll(sel + ' .fl-front .rs-axis .d.next').length, cp: (q('.rs-axis') || {}).previousElementSibling ? q('.rs-axis').previousElementSibling.textContent : '' }; }, sel);
    ok('시각화: ① 고점 대비 위치 막대 + 큰 숫자 · ② 의견 눈금(분할 매수) + 보고서 가격 → 지금 · ③ 보고서 날짜 점', viz.gauge && /^[+-]?\d+\.\d%$/.test(viz.big || '') && viz.scale === 1 && viz.scaleOn === '분할 매수' && viz.axis === 1 && viz.next === 1 && /보고서 1개 · 다시 볼 날까지 D-\d+/.test(viz.cp), JSON.stringify(viz));
    // 점 누르기
    const dotXY = async i => p.evaluate(([sel, i]) => { const r = document.querySelectorAll(sel + ' .fl-front .rs-dots button')[i].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, [sel, i]);
    let [x2, y2] = await dotXY(2); await p.mouse.click(x2, y2);
    let wmax = 0; for (let i = 0; i < 14; i++) { await p.waitForTimeout(40); const s = await st(); wmax = Math.max(wmax, s.aw); }
    await p.waitForTimeout(900); const s2 = await st();
    ok('점(셋째)을 누르면 셋째 슬라이드로 · 알약이 늘어났다가(폭 20 → 더 길게) 새 점 위에 모임', Math.abs(s2.x - 2) < 0.02 && s2.sel === 'false,false,true' && Math.abs(s2.aw - 20) <= 1 && Math.abs(s2.ac - s2.dc[2]) <= 1.5 && wmax > 26, JSON.stringify({ wmax, s2 }));
    const hit = await p.evaluate(sel => { const d = document.querySelector(sel + ' .fl-front .rs-dots'), m = document.querySelector(sel + ' .fl-front .rs-more'); return { dotsH: Math.round(d.getBoundingClientRect().height), moreH: Math.round(m.getBoundingClientRect().height), moreW: Math.round(m.getBoundingClientRect().width), hitOK: (() => { const b = d.querySelector('button').getBoundingClientRect(); const e = document.elementFromPoint(b.left + b.width / 2, b.top - 14); return e === d.querySelector('button'); })() }; }, sel);
    ok('점 터치 영역: 줄 높이 44 · 점 위아래 14px까지 눌림 · 전문 보기 44', hit.dotsH >= 44 && hit.moreH >= 44 && hit.hitOK, JSON.stringify(hit));
    // 밀어서 넘기기(오른쪽으로 밀면 이전)
    const vb = await p.evaluate(sel => { const r = document.querySelector(sel + ' .fl-front .rs-view').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; }, sel);
    await p.mouse.move(vb.x + 80, vb.y + 70); await p.mouse.down(); await p.mouse.move(vb.x + 200, vb.y + 72, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(1000);
    const s1 = await st(); ok('오른쪽으로 밀면 이전(둘째) 슬라이드', Math.abs(s1.x - 1) < 0.02 && s1.sel === 'false,true,false', JSON.stringify(s1));
    await p.mouse.move(vb.x + 260, vb.y + 70); await p.mouse.down(); await p.mouse.move(vb.x + 140, vb.y + 70, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(1000);
    const s3 = await st(); ok('왼쪽으로 밀면 다음(셋째) 슬라이드', Math.abs(s3.x - 2) < 0.02, JSON.stringify(s3));
    await p.mouse.move(vb.x + 80, vb.y + 70); await p.mouse.down(); await p.mouse.move(vb.x + 200, vb.y + 70, { steps: 4 }); await p.mouse.move(vb.x + 90, vb.y + 70, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(900);
    const s4 = await st(); ok('짧게 밀었다 놓으면(40px 미만) 제자리', Math.abs(s4.x - 2) < 0.02, JSON.stringify(s4));
    // 밀기 · 길게 누르기가 안 섞임
    const rot = () => p.evaluate(sel => { const f = document.querySelector(sel + ' .fl-flipper'); const m = f && /rotateY\(([-\d.]+)deg\)/.exec(f.style.transform); return m ? +m[1] : 0; }, sel);
    await p.mouse.move(vb.x + 60, vb.y + 60); await p.mouse.down(); await p.mouse.move(vb.x + 110, vb.y + 62, { steps: 3 }); await p.waitForTimeout(700); await p.mouse.up(); await p.waitForTimeout(900);
    ok('누른 채 옆으로 밀면(8px 넘게) 뒤집히지 않고 슬라이드만 넘어감', Math.abs(await rot()) < 4, 'rotY ' + (await rot()).toFixed(1));
    let xBeforeFlip = 0;
    await p.mouse.move(vb.x + 60, vb.y + 60); await p.mouse.down(); await p.waitForTimeout(750); await p.mouse.up(); await p.waitForTimeout(1300);
    xBeforeFlip = (await st()).x;
    const rr = await rot(); ok('슬라이드를 가만히 길게 누르면 차트로 뒤집힘(예전 그대로)', Math.abs(rr - 180) < 4, 'rotY ' + rr.toFixed(1));
    const back = await p.evaluate(sel => { const cv = document.querySelector(sel + ' canvas'); return { chart: !!(cv && cv._aqChart), w: cv ? cv.clientWidth : 0 }; }, sel);
    ok('뒤집힌 면에 차트가 그려져 있음', back.chart && back.w > 200, JSON.stringify(back));
    await p.screenshot({ path: path.join(OUT, 'slides_flipped.png') });
    await p.evaluate(sel => { [...document.querySelector(sel).querySelectorAll('.fl-face')].find(f => !f.inert).querySelector('.fl-cue').click(); }, sel); await p.waitForTimeout(1300);
    { const rv = await rot(), sv = await st(); ok('단서 단추로 돌아오면 보던 슬라이드 그대로', Math.abs(rv) < 4 && Math.abs(sv.x - xBeforeFlip) < 0.05, 'rotY ' + rv.toFixed(1) + ' · 슬라이드 ' + sv.x); }
    // 옛 양식 · 슬라이드 없는 카드
    const leg = await p.evaluate(() => { const it = document.querySelector('#rpFeed .feed-item[data-ticker="PLD"]'); return { rs: !!it.querySelector('.fl-front .rs'), more: (it.querySelector('.fl-front .rc-full') || {}).textContent || '', bg: it.querySelector('.fl-front .rc-full') ? getComputedStyle(it.querySelector('.fl-front .rc-full')).backgroundColor : '' }; });
    ok('옛 양식 보고서: 슬라이드 대신 안내 + 작은 글자 「보고서 전문 보기」', !leg.rs && /보고서 전문 보기/.test(leg.more) && /rgba\(0, 0, 0, 0\)|transparent/.test(leg.bg), JSON.stringify(leg));
    // 위 알약 없음 · 보유 먼저
    const top = await p.evaluate(() => ({ flt: document.querySelectorAll('#rpBar [data-rf]').length }));
    ok('위쪽 전체 · 보유 · 관심 · 매수의견 알약 없음', top.flt === 0, JSON.stringify(top));
    await p.evaluate(() => { document.querySelector('#rpFeed .feed-item[data-ticker="CL"]').scrollIntoView({ block: 'start' }); }); await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(OUT, 'slides_phone.png') });
    // 순서: 관심 종목을 올려 두면 보유 다음에 나옴 → 보유(WMB) · 관심(ELV)이 앞
    await p.evaluate(() => { _glHeld = () => new Set(['WMB']); _glWatch = () => new Set(['ELV']); buildAnalysisGrid(); }); await p.waitForTimeout(1500);
    const ord = await p.evaluate(() => ({ tks: [...document.querySelectorAll('#rpFeed .feed-item')].map(i => i.dataset.ticker), tag: !!document.querySelector('#rpFeed .feed-item[data-ticker="ELV"] .rp-tag') }));
    ok('순서: 보유 → 관심 → 나머지 · 관심 종목 카드에 「관심」 꼬리표', ord.tks[0] === 'WMB' && ord.tks[1] === 'ELV' && ord.tag, JSON.stringify(ord));
    await p.context().close();
  }


  /* ───────── ③ 발견 · 마이 › 실시간 현황: 카드 뒷면(리포트)도 슬라이드 (390) — v8.90 ───────── */
  for (const [name, root, go] of [['발견', '#feedScroll', () => { switchMobileTab('discover'); }], ['마이 › 실시간 현황', '#lvFeed', () => { _dashLastComputed = { holdings: ['CL', 'WMB', 'ELV'].map((t, i) => ({ ticker: t, qty: 10 + i, cost: 1000 + i * 50, curPrice: 100 + i, avgPrice: 90 + i })) }; switchMobileTab('board'); setBoardSubtab('live'); aqLiveBoardRender(); }]]) {
    const p = await prep(b, { width: 390, height: 844 });
    await p.evaluate(go); await p.waitForSelector(root + ' .feed-item[data-ticker="CL"] .fl-stage', { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(2500);
    const sel = root + ' .feed-item[data-ticker="CL"]';
    const has = await p.evaluate(s => !!document.querySelector(s), sel); ok(name + ': CL 카드가 있음', has);
    if (!has) { await p.context().close(); continue; }
    await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(900);
    const rot = () => p.evaluate(s => { const f = document.querySelector(s + ' .fl-flipper'); const m = f && /rotateY\(([-\d.]+)deg\)/.exec(f.style.transform); return m ? +m[1] : 0; }, sel);
    const hold = async () => { await p.evaluate(s => document.querySelector(s + ' .fl-stage').scrollIntoView({ block: 'center' }), sel); await p.waitForTimeout(500); const r = await p.evaluate(s => { const k = document.querySelector(s + ' .fl-stage').getBoundingClientRect(); return { x: k.left + k.width * 0.4, y: k.top + k.height * 0.55 }; }, sel); await p.mouse.move(r.x, r.y); await p.mouse.down(); await p.waitForTimeout(750); await p.mouse.up(); await p.waitForTimeout(1300); };
    await hold();
    ok(name + ': 길게 누르면 리포트 면으로 뒤집힘', Math.abs((await rot()) - 180) < 4, 'rotY ' + (await rot()).toFixed(1));
    const v = await p.evaluate(s => { const rs = document.querySelector(s + ' .fl-back .rs'); const sl = rs ? [...rs.querySelectorAll('.rs-sl')] : []; const host = document.querySelector(s + ' .fl-back'); const more = rs && rs.querySelector('.rs-more'); return { n: sl.length, dots: rs ? rs.querySelectorAll('.rs-dots button').length : 0, labels: sl.map(x => x.querySelector('.rs-lab').textContent.replace(/\s+/g, ' ').trim().slice(0, 8)), viz: sl.every(x => x.querySelector('.rs-viz').innerHTML.length > 30), fit: !!rs && rs.scrollHeight <= host.clientHeight + 1 && sl.every(x => x.scrollHeight <= x.clientHeight + 1), old: !!document.querySelector(s + ' .fl-back .rc-b'), moreH: more ? Math.round(more.getBoundingClientRect().height) : 0, big: !!document.querySelector(s + ' .fl-back .rc-full') }; }, sel);
    ok(name + ' 뒷면: 슬라이드 3장 · 점 3개 · 그림이 있음 · 잘림 없음 · 예전 3블록 없음 · 큰 버튼 없음(작은 「전문 보기」 44)', v.n === 3 && v.dots === 3 && v.viz && v.fit && !v.old && !v.big && v.moreH >= 44, JSON.stringify(v));
    // 점 누름 → 셋째
    const xy = await p.evaluate(s => { const r = document.querySelectorAll(s + ' .fl-back .rs-dots button')[2].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
    await p.mouse.click(xy[0], xy[1]); await p.waitForTimeout(1000);
    const x1 = await p.evaluate(s => { const m = /translateX\(([-\d.]+)%\)/.exec(document.querySelector(s + ' .fl-back .rs-strip').style.transform); return m ? -parseFloat(m[1]) / 100 : 0; }, sel);
    ok(name + ' 뒷면: 점을 누르면 셋째 슬라이드', Math.abs(x1 - 2) < 0.02 && Math.abs(await rot() - 180) < 4, 'x ' + x1);
    // 밀기: 뒤집히지 않고 슬라이드만
    const vb = await p.evaluate(s => { const r = document.querySelector(s + ' .fl-back .rs-view').getBoundingClientRect(); return { x: r.left, y: r.top }; }, sel);
    await p.mouse.move(vb.x + 80, vb.y + 70); await p.mouse.down(); await p.mouse.move(vb.x + 200, vb.y + 72, { steps: 8 }); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(1000);
    const x2 = await p.evaluate(s => { const m = /translateX\(([-\d.]+)%\)/.exec(document.querySelector(s + ' .fl-back .rs-strip').style.transform); return m ? -parseFloat(m[1]) / 100 : 0; }, sel);
    ok(name + ' 뒷면: 오른쪽으로 밀면 이전 슬라이드 · 뒤집히지 않음', Math.abs(x2 - 1) < 0.02 && Math.abs(await rot() - 180) < 4, 'x ' + x2 + ' rot ' + (await rot()).toFixed(1));
    await p.screenshot({ path: path.join(OUT, 'slides_back_' + (root === '#lvFeed' ? 'live' : 'disc') + '.png') });
    // 가만히 길게 → 차트로
    await hold();
    const cv = await p.evaluate(s => { const c = document.querySelector(s + ' canvas'); return { chart: !!(c && c._aqChart), w: c ? c.clientWidth : 0 }; }, sel);
    ok(name + ' 뒷면: 가만히 길게 누르면 차트로 돌아옴 · 차트 그려져 있음', Math.abs(await rot()) < 4 && cv.chart && cv.w > 200, 'rot ' + (await rot()).toFixed(1) + ' ' + JSON.stringify(cv));
    await p.context().close();
  }

  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
