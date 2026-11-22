// 메뉴 9체계 시험 — node tools/ui-test/ia9.js   (v8.84: 하단 메뉴 9개 전부 · 아코디언 독 · 와이드 세로 메뉴 12칸 · 하위 탭 구성 · 종목리스트 + 종목지도 병합)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다 · 종목리스트가 그려지려면 저장소의 data 폴더가 같이 서빙돼야 한다
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'http://localhost:8773/index.html';
const MENUS = ['발견', '탐색', '관심', '연구', 'AI', '뉴스', '일정', '항해', '마이'];
const SUBS = { discover: null, explore: ['종목리스트', '내부자 매수', '밸런스 종목'], interest: ['모의매수', '비교분석'], research: ['AI리포트', '해자근거'], ai: ['AI매니저', 'AI예보', 'AI세력분석'], news: ['일간 이슈', '기관13F'], schedule: ['통합캘린더', '실적시즌'], voyage: ['섹터동향', 'AS-IS 포트폴리오', 'TO-BE 포트폴리오'], board: ['실시간 현황', '누적 성과', '운영 통계'] };
const KEYS = ['discover', 'explore', 'interest', 'research', 'ai', 'news', 'schedule', 'voyage', 'board'];
const DOCK7 = MENUS.filter(n => n !== '관심' && n !== '일정');   // v8.97: 좁은 화면(독)은 관심 · 일정을 ☰ 메뉴로 — 하단 7개
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  async function open(vp) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
    await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
    await p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); });
    await p.waitForTimeout(600); return p;
  }
  const dockState = p => p.evaluate(() => { const bar = document.getElementById('mobileTabBar'), a = bar.querySelector(':scope > .mtab-btn.active'), ind = bar.querySelector(':scope > .aq-dk-ind'); if (!a || !ind) return null; const ar = a.getBoundingClientRect(), ir = ind.getBoundingClientRect(), lb = a.querySelector('.mtab-label'); const others = [...bar.querySelectorAll(':scope > .mtab-btn')].filter(x => x !== a && getComputedStyle(x).display !== 'none'); return { n: a.getAttribute('aria-label'), dl: +(ir.left - ar.left).toFixed(1), dw: +(ir.width - ar.width).toFixed(1), lab: +parseFloat(getComputedStyle(lb).opacity).toFixed(2), othersLab: Math.max(...others.map(x => +parseFloat(getComputedStyle(x.querySelector('.mtab-label')).opacity))), aw: Math.round(ar.width) }; });
  const rowsOf = p => p.evaluate(() => { const vis = el => el && el.offsetParent !== null; const rows = [...document.querySelectorAll('.explore-subtabs')].filter(vis); return rows.map(r => [...r.querySelectorAll('.xtab-btn')].filter(x => x.offsetWidth > 0).map(x => x.textContent.trim())); });

  /* ── 좁은 화면 390 ── */
  for (const [label, vp] of [['폰 360', { width: 360, height: 780 }], ['폰 412', { width: 412, height: 860 }]]) {
    if (process.env.ONLY) continue;
    const p = await open(vp);
    const st = await p.evaluate(() => { const bar = document.getElementById('mobileTabBar'), br = bar.getBoundingClientRect(); const bt = [...bar.querySelectorAll(':scope > .mtab-btn')].filter(x => getComputedStyle(x).display !== 'none'); return { dock: bar.classList.contains('aq-dock'), n: bt.length, names: bt.map(x => x.getAttribute('aria-label')), inside: bt.every(x => { const r = x.getBoundingClientRect(); return r.left >= br.left - 0.5 && r.right <= br.right + 0.5 && r.width > 20; }), minW: Math.min(...bt.map(x => x.getBoundingClientRect().width)), h: Math.round(bt[0].getBoundingClientRect().height), barW: Math.round(br.width) }; });
    ok(label + ': 하단 메뉴 7개(관심 · 일정은 ☰ 메뉴로 · v8.97)', st.dock && st.n === 7 && st.inside && JSON.stringify(st.names) === JSON.stringify(DOCK7), JSON.stringify(st));
    ok(label + ': 칸이 붙어 있어 빈틈 없이 누를 수 있음(높이 56 · 칸 폭 28 이상)', st.h >= 56 && st.minW >= 28, 'min ' + st.minW.toFixed(1) + 'px × ' + st.h);
    // 눌러 보기 — 켜진 칸만 글자가 펼쳐지고, 바탕은 켜진 칸과 같은 자리·폭으로 멈춤
    for (let i = 0; i < KEYS.length; i++) {
      await p.evaluate(k => switchMobileTab(k), KEYS[i]); await p.waitForTimeout(600);
      let r = null; for (let t = 0; t < 14; t++) { r = await dockState(p); if (r && Math.abs(r.dl) <= 1 && Math.abs(r.dw) <= 1 && r.othersLab < .05) break; await p.waitForTimeout(300); }

      if (MENUS[i] === '관심' || MENUS[i] === '일정') { const hm = await p.evaluate(() => ({ ham: document.getElementById('mobileMenuBtn').classList.contains('aq-hasact'), bar: [...document.querySelectorAll('#mobileTabBar > .mtab-btn')].filter(x => x.classList.contains('active') && getComputedStyle(x).display !== 'none').length })); ok(label + ': ' + MENUS[i] + ' 선택 — 하단 바에는 없고 ☰ 메뉴가 강조됨', hm.ham && hm.bar === 0, JSON.stringify(hm)); continue; }
      ok(label + ': ' + MENUS[i] + ' 선택 — 바탕 = 켜진 칸 · 글자는 켜진 칸만', !!r && r.n === MENUS[i] && Math.abs(r.dl) <= 1 && Math.abs(r.dw) <= 1 && r.lab > .95 && r.othersLab < .05, JSON.stringify(r));
    }
    // 하위 탭 구성
    if (label === '폰 360') {
      for (let i = 0; i < KEYS.length; i++) {
        await p.evaluate(k => { document.body.setAttribute('data-broker', 'linked'); switchMobileTab(k); }, KEYS[i]); await p.waitForTimeout(500);
        const rows = await rowsOf(p); const want = SUBS[KEYS[i]];
        const got = rows.find(r => want && r.length === want.length && want.every((w, j) => r[j] === w));
        ok(MENUS[i] + ' 하위 탭 = ' + (want ? want.join(' / ') : '없음'), want ? !!got : rows.length === 0 || rows.every(r => r.length === 0), JSON.stringify(rows));
      }
      // 이관: 섹터동향 카드는 항해, 포트폴리오는 항해 › AS-IS, 마이에는 포트폴리오 탭 없음
      await p.evaluate(() => { switchMobileTab('voyage'); setVoyageSubtab('trend'); }); await p.waitForTimeout(500);
      let v = await p.evaluate(() => ({ sa: getComputedStyle(document.getElementById('sectorAnalysisCard')).display, pf: getComputedStyle(document.getElementById('boardHoldingsCard')).display, tobe: getComputedStyle(document.getElementById('voyageTobeCard')).display }));
      ok('항해 › 섹터동향: 섹터 동향 카드만', v.sa !== 'none' && v.pf === 'none' && v.tobe === 'none', JSON.stringify(v));
      await p.evaluate(() => setVoyageSubtab('asis')); await p.waitForTimeout(400);
      v = await p.evaluate(() => ({ sa: getComputedStyle(document.getElementById('sectorAnalysisCard')).display, pf: getComputedStyle(document.getElementById('boardHoldingsCard')).display, dash: !!document.querySelector('#boardHoldingsCard #dashPortfolioCard') }));
      ok('항해 › AS-IS 포트폴리오: 포트폴리오 카드(기존 카드가 그 안으로)', v.sa === 'none' && v.pf !== 'none' && v.dash, JSON.stringify(v));
      await p.evaluate(() => setVoyageSubtab('tobe')); await p.waitForTimeout(400);
      v = await p.evaluate(() => ({ tobe: getComputedStyle(document.getElementById('voyageTobeCard')).display, txt: document.getElementById('voyageTobeCard').innerText }));
      ok('항해 › TO-BE 포트폴리오: 준비 중 안내', v.tobe !== 'none' && /준비 중/.test(v.txt), v.txt.replace(/\s+/g, ' '));
      for (const [k, a, id, name] of [['research', 'moat', 'moatCard', '연구 › 해자근거'], ['ai', 'force', 'forceCard', 'AI › AI세력분석']]) {
        await p.evaluate(([k, a]) => { switchMobileTab(k); setAiSubtab(a); }, [k, a]); await p.waitForTimeout(500);
        const t = await p.evaluate(id => ({ d: getComputedStyle(document.getElementById(id)).display, txt: document.getElementById(id).innerText }), id);
        ok(name + ': 준비 중 안내(깨진 화면 없음)', t.d !== 'none' && /준비 중/.test(t.txt), t.txt.replace(/\s+/g, ' '));
      }
      await p.evaluate(() => { switchMobileTab('schedule'); setScheduleSubtab('earn'); }); await p.waitForTimeout(500);
      let sc = await p.evaluate(() => ({ earn: getComputedStyle(document.getElementById('earnSeasonCard')).display, cal: getComputedStyle(document.getElementById('scheduleCard')).display }));
      ok('일정 › 실적시즌: 준비 중 카드만(달력 숨김)', sc.earn !== 'none' && sc.cal === 'none', JSON.stringify(sc));
      await p.evaluate(() => setScheduleSubtab('cal')); await p.waitForTimeout(400);
      sc = await p.evaluate(() => ({ earn: getComputedStyle(document.getElementById('earnSeasonCard')).display, cal: getComputedStyle(document.getElementById('scheduleCard')).display }));
      ok('일정 › 통합캘린더: 달력 복귀', sc.earn === 'none' && sc.cal !== 'none', JSON.stringify(sc));
      // 예전 링크
      const old = await p.evaluate(() => { const r = {}; try { switchMobileTab('explore'); setExploreSubtab('trend'); r.trend = document.body.dataset.mtab + '/' + document.body.dataset.vtab; } catch (e) { r.trend = 'ERR ' + e.message; } try { switchMobileTab('news'); setAiSubtab('maps'); r.maps = document.body.dataset.mtab + '/' + document.body.dataset.xtab; } catch (e) { r.maps = 'ERR ' + e.message; } try { switchMobileTab('sector'); r.sector = document.body.dataset.mtab + '/' + document.body.dataset.atab; } catch (e) { r.sector = 'ERR ' + e.message; } try { switchMobileTab('board'); setBoardSubtab('holdings'); r.hold = document.body.dataset.mtab + '/' + document.body.dataset.btab; } catch (e) { r.hold = 'ERR ' + e.message; } return r; });
      ok('예전 링크: 섹터 동향 → 항해', old.trend === 'voyage/trend', old.trend);
      ok('예전 링크: 종목 지도 → 탐색 › 종목리스트', old.maps === 'explore/list', old.maps);
      ok('예전 링크: 관심(sector) → 관심 › 모의매수', old.sector === 'auto/sim', old.sector);
      ok('예전 링크: 마이 › 포트폴리오 → 실시간 현황', old.hold === 'board/live', old.hold);
      // 화면이 와이드로 바뀌었다 돌아와도(돌려 놓기) 독 ↔ 세로 메뉴가 따라 바뀜
      const tg = await p.evaluate(async () => { const r = document.documentElement, bar = document.getElementById('mobileTabBar'), w = ms => new Promise(x => setTimeout(x, ms)); r.classList.add('aq-wide'); await w(400); const a = { dock: bar.classList.contains('aq-dock'), ind: !!bar.querySelector(':scope > .aq-dk-ind'), inl: bar.querySelector('.mtab-btn').style.width }; r.classList.remove('aq-wide'); await w(900); const b = { dock: bar.classList.contains('aq-dock'), ind: !!bar.querySelector(':scope > .aq-dk-ind') }; return { a, b }; });
      ok('와이드로 바뀌면 독이 풀리고(세로 메뉴) 돌아오면 다시 독', !tg.a.dock && !tg.a.ind && tg.a.inl === '' && tg.b.dock && tg.b.ind, JSON.stringify(tg));
      await p.screenshot({ path: path.join(OUT, 'ia9_phone.png') });
    }
    await p.context().close();
  }

  /* ── 비관리자: AI 숨김 → 8개, 켜진 칸 · 바탕 정상 ── */
  { const p = await open({ width: 360, height: 780 }); await p.evaluate(() => document.body.setAttribute('data-role', 'user')); await p.waitForTimeout(900);
    const r = await p.evaluate(() => { const bar = document.getElementById('mobileTabBar'); const bt = [...bar.querySelectorAll(':scope > .mtab-btn')].filter(x => getComputedStyle(x).display !== 'none'); const a = bar.querySelector(':scope > .mtab-btn.active'), ind = bar.querySelector(':scope > .aq-dk-ind'); const ar = a.getBoundingClientRect(), ir = ind.getBoundingClientRect(); return { n: bt.length, dl: +(ir.left - ar.left).toFixed(1), dw: +(ir.width - ar.width).toFixed(1) }; });
    ok('일반 사용자: 하단 메뉴 6개(AI 숨김 · 관심 · 일정은 ☰) · 바탕 = 켜진 칸', r.n === 6 && Math.abs(r.dl) <= 1 && Math.abs(r.dw) <= 1, JSON.stringify(r));
    await p.context().close(); }

  /* ── v8.86: 넓은 화면(폰이 아닌 폭)은 예전 균등 메뉴 · 좁은 화면만 독 ── */
  for (const [label, vp, wantDock] of [['폭 460(바 428)', { width: 460, height: 860 }, true], ['폭 480(바 448)', { width: 480, height: 860 }, false], ['폭 600 세로', { width: 600, height: 960 }, false]]) {
    const p = await open(vp);
    const r = await p.evaluate(() => { const bar = document.getElementById('mobileTabBar'); const bt = [...bar.querySelectorAll(':scope > .mtab-btn')].filter(x => getComputedStyle(x).display !== 'none'); const a = bar.querySelector(':scope > .mtab-btn.active'), ind = bar.querySelector(':scope > .aq-seg-ind'), ar = a.getBoundingClientRect(), ir = ind ? ind.getBoundingClientRect() : null; const ws = bt.map(x => x.getBoundingClientRect().width); return { wide: document.documentElement.classList.contains('aq-wide'), dock: bar.classList.contains('aq-dock'), dk: !!bar.querySelector(':scope > .aq-dk-ind'), n: bt.length, min: +Math.min(...ws).toFixed(1), max: +Math.max(...ws).toFixed(1), seg: ir ? { dl: +(ir.left - ar.left).toFixed(1), dw: +(ir.width - ar.width).toFixed(1) } : null, labelBelow: getComputedStyle(bt[0]).flexDirection, fs: getComputedStyle(bt[0].querySelector('.mtab-label')).fontSize }; });
    if (wantDock) ok(label + ': 좁은 화면 = 아코디언 독(7개)', !r.wide && r.dock && r.dk && r.n === 7, JSON.stringify(r));
    else ok(label + ': 넓은 화면(폰 아님) = 예전 균등 메뉴(글자 아래 · 칸 44 이상 · 바탕 = 켜진 칸)', !r.wide && !r.dock && !r.dk && r.n === 9 && r.min >= 44 && r.max - r.min < 1 && r.labelBelow === 'column' && r.seg && Math.abs(r.seg.dl) <= 1 && Math.abs(r.seg.dw) <= 1, JSON.stringify(r));
    if (!wantDock) { await p.evaluate(() => switchMobileTab('voyage')); const segNow = () => p.evaluate(() => { const bar = document.getElementById('mobileTabBar'), a = bar.querySelector(':scope > .mtab-btn.active'), ind = bar.querySelector(':scope > .aq-seg-ind'), ar = a.getBoundingClientRect(), ir = ind.getBoundingClientRect(); return { n: a.getAttribute('aria-label'), dl: +(ir.left - ar.left).toFixed(1), dw: +(ir.width - ar.width).toFixed(1) }; }); await p.waitForTimeout(600); let q = await segNow(); for (let i = 0; i < 10 && !(Math.abs(q.dl) <= 1.5 && Math.abs(q.dw) <= 1.5); i++) { await p.waitForTimeout(300); q = await segNow(); } ok(label + ': 메뉴를 눌러도 예전 방식 바탕이 따라감', q.n === '항해' && Math.abs(q.dl) <= 1.5 && Math.abs(q.dw) <= 1.5, JSON.stringify(q)); }
    await p.context().close();
  }

  /* ── v8.86: 항해 › AS-IS 포트폴리오 — 종목 추가 없음 · 보유 종목 전부 한 번에 ── */
  { const p = await open({ width: 390, height: 844 });
    await p.evaluate(() => { switchMobileTab('voyage'); setVoyageSubtab('asis'); }); await p.waitForTimeout(800);
    const mk = (n) => p.evaluate(n => { const tk = Object.keys(_state.tickerSectorMap || {}).slice(0, n); return tk.map((t, i) => ({ ticker: t, sector: _state.tickerSectorMap[t], qty: 1, evalVal: 1000 + i * 10, cost: 900 + i * 10, roi: 5 })); }, n);
    for (let i = 0; i < 40; i++) { if (await p.evaluate(() => Object.keys(_state.tickerSectorMap || {}).length >= 40)) break; await p.waitForTimeout(500); }   // 데이터가 늦게 들어와도 기다림
    const hs = await mk(40); ok('AS-IS 시험 자료: 가짜 보유 40종목', hs.length === 40);
    for (const mode of ['t', 'mega', 'sec']) {
      const r = await p.evaluate(([hs, mode]) => { _pvSet('mode', mode); _pv.open = {}; _pv.all = false; aqPvRender(hs); const body = document.getElementById('dashHoldingsBody'); return { rows: body.querySelectorAll('.pv-tr').length, more: !!body.querySelector('.pv-more2'), txt: /더 보기/.test(body.innerText), grp: body.querySelectorAll('.pv-gr').length, add: !!document.querySelector('#dashHoldingsCard .watch-add-btn') || /종목 추가/.test(document.getElementById('dashHoldingsCard').innerText) }; }, [hs, mode]);
      ok('AS-IS(' + mode + '): 보유 40종목이 한 번에 · 더 보기 없음 · 종목 추가 버튼 없음', r.rows === 40 && !r.more && !r.txt && !r.add, JSON.stringify(r));
    }
    // 잘림 없이 전부 — 목록 칸이 안쪽 스크롤 없이 내용 높이만큼 늘어나고 마지막 종목이 카드 안에 완전히 들어옴
    for (const mode of ['t', 'mega']) {
      await p.evaluate(([hs, mode]) => { _pvSet('mode', mode); _pv.open = {}; aqPvRender(hs); window.scrollTo(0, 0); }, [hs, mode]); await p.waitForTimeout(400);
      const c = await p.evaluate(() => { const b = document.getElementById('dashHoldingsBody'), card = document.getElementById('dashHoldingsCard'), rows = [...b.querySelectorAll('.pv-tr')], last = rows[rows.length - 1].getBoundingClientRect(), cr = card.getBoundingClientRect(), cs = getComputedStyle(b), ch = getComputedStyle(card); const chain = []; for (let n = b; n && n !== document.body; n = n.parentElement) { const o = getComputedStyle(n); if ((o.overflowY === 'auto' || o.overflowY === 'scroll' || o.overflowY === 'hidden') && n.scrollHeight > n.clientHeight + 1) chain.push((n.id || n.className) + ':' + n.scrollHeight + '/' + n.clientHeight); } return { scrollH: b.scrollHeight, clientH: b.clientHeight, ov: cs.overflowY, maxH: ch.maxHeight, lastIn: last.bottom <= cr.bottom + 1, clipped: chain }; });
      ok('AS-IS(' + mode + '): 보유 종목 칸이 잘리지 않음(안쪽 스크롤 없음 · 마지막 종목이 카드 안)', c.scrollH <= c.clientH + 1 && c.ov === 'visible' && c.maxH === 'none' && c.lastIn && c.clipped.length === 0, JSON.stringify(c));
    }
    // 묶음 줄을 누르면 접힘 · 다시 누르면 펼침
    const tg = await p.evaluate(() => { const b = document.querySelector('#dashHoldingsBody .pv-gr'), n0 = document.querySelectorAll('#dashHoldingsBody .pv-tr').length; b.click(); const n1 = document.querySelectorAll('#dashHoldingsBody .pv-tr').length; document.querySelector('#dashHoldingsBody .pv-gr').click(); const n2 = document.querySelectorAll('#dashHoldingsBody .pv-tr').length; return { n0, n1, n2 }; });
    ok('AS-IS: 묶음을 누르면 접히고 다시 누르면 펼침', tg.n1 < tg.n0 && tg.n2 === tg.n0, JSON.stringify(tg));
    await p.context().close(); }

  /* ── 와이드 1000×700 ── */
  { const p = await open({ width: 1000, height: 700 });
    const w = await p.evaluate(() => { const bar = document.getElementById('mobileTabBar'), br = bar.getBoundingClientRect(); const bt = [...bar.querySelectorAll(':scope > .mtab-btn')].filter(x => getComputedStyle(x).display !== 'none'); return { wide: document.documentElement.classList.contains('aq-wide'), dock: bar.classList.contains('aq-dock'), n: bt.length, order: bt.slice(0, 9).map(x => x.getAttribute('aria-label')), fit: bar.scrollHeight <= bar.clientHeight + 1, last: Math.round(bt[bt.length - 1].getBoundingClientRect().bottom), vh: innerHeight, h: Math.round(bt[0].getBoundingClientRect().height) }; });
    ok('와이드: 세로 메뉴(독 아님) · 9개 + 관리자 3개 = 12칸이 스크롤 없이 700 안에', w.wide && !w.dock && w.n === 12 && w.fit && w.last <= w.vh, JSON.stringify(w));
    ok('와이드: 순서 = 발견 · 탐색 · 관심 · 연구 · AI · 뉴스 · 일정 · 항해 · 마이', JSON.stringify(w.order) === JSON.stringify(MENUS), JSON.stringify(w.order));
    // v8.85 왼쪽 메뉴 접기 — 펼침 90 ↔ 접힘 56 · 아이콘 자리 그대로 · 오른쪽 열림 칸이 따라 넓어짐 · 접힘 기억
    const rail = () => p.evaluate(() => { const bar = document.getElementById('mobileTabBar'), br = bar.getBoundingClientRect(), bt = [...bar.querySelectorAll(':scope > .mtab-btn')].filter(x => getComputedStyle(x).display !== 'none'); const ic = bt[0].querySelector('.mtab-icon').getBoundingClientRect(), lb = bt[0].querySelector('.mtab-label'); const lr = lb.getBoundingClientRect(); return { w: Math.round(br.width), ic: Math.round(ic.left - br.left), lab: +parseFloat(getComputedStyle(lb).opacity).toFixed(2), labIn: lr.right <= br.right + 0.5, n: bt.length, h: Math.round(bt[0].getBoundingClientRect().height), last: Math.round(bt[bt.length - 1].getBoundingClientRect().bottom), col: Math.round(document.querySelector('.container').getBoundingClientRect().left), after: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--aqL')) || null, aqR: getComputedStyle(document.documentElement).getPropertyValue('--aqR').trim(), tg: !!bar.querySelector(':scope > .aq-rail-tg') }; });
    const settle = async () => { let r = null; for (let i = 0; i < 12; i++) { await p.waitForTimeout(250); const n = await rail(); if (r && n.w === r.w && n.lab === r.lab) return n; r = n; } return r; };
    let r0 = await rail(); ok('와이드: 펼친 왼쪽 메뉴 90px · 아이콘 옆 두 글자(칸 높이 44) · 12칸이 700 안에', r0.tg && r0.w === 90 && r0.lab === 1 && r0.labIn && r0.h === 44 && r0.n === 12 && r0.last <= 700, JSON.stringify(r0));
    await p.click('.aq-rail-tg'); const r1 = await settle();
    ok('접기: 56px · 글자 숨김 · 아이콘 자리 그대로 · 폰 화면 칸이 같이 왼쪽으로', r1.w === 56 && r1.lab === 0 && Math.abs(r1.ic - r0.ic) <= 1 && r1.col === r0.col - 34, JSON.stringify(r1));
    ok('접기: 접으면 title(툴팁) · aria-expanded=false', await p.evaluate(() => document.querySelector('#mobileTabBar .mtab-btn').title.length > 0 && document.querySelector('.aq-rail-tg').getAttribute('aria-expanded') === 'false'));
    await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
    await p.evaluate(() => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); }); await p.waitForTimeout(800);
    const r2 = await rail(); ok('접힘 기억: 다시 열어도 56px · 글자 숨김', r2.w === 56 && r2.lab === 0 && parseFloat(r2.aqR) === 56, JSON.stringify(r2));
    await p.click('.aq-rail-tg'); const r3 = await settle(); ok('펼치기: 90px · 글자 돌아옴 · 폰 화면 칸 제자리', r3.w === 90 && r3.lab === 1 && r3.labIn && r3.col === r0.col, JSON.stringify(r3));
    await p.screenshot({ path: path.join(OUT, 'ia9_rail_open.png') });
    await p.context().close(); }

  /* ── 종목리스트 + 종목지도 병합 ── */
  for (const [label, vp] of [['폰', { width: 390, height: 844 }], ['와이드', { width: 1000, height: 700 }]]) {
    if (process.env.ONLY && process.env.ONLY !== label) continue;
    const p = await open(vp);
    await p.evaluate(() => {   // 지도가 있는 종목을 정해 둠(서버 stockMapList 대신) — 실제 기본 데이터의 첫 종목들
      window.__opened = []; window.openChart = (t) => { window.__opened.push(t); return Promise.resolve(); };
      window.apiCall = (function (o) { return function (name, a) { if (name === 'stockMapList') { const tk = Object.keys(_state.tickerSectorMap || {}).slice(0, 40); window.__mapTk = tk.slice(0, 3); return Promise.resolve({ ok: true, items: tk.slice(0, 3).map((t, i) => ({ ticker: t, at: '2026-11-0' + (i + 1), vp: 20 + i * 30, vk: 'PER' })) }); } if (name === 'stockMapGet') return Promise.resolve({ ok: true, map: { asof: '2026-11-20', ck: [] }, can: true, left: 3 }); return o.apply(this, arguments); }; })(window.apiCall);
    });
    await p.evaluate(() => { switchMobileTab('explore'); setExploreSubtab('list'); }); await p.waitForTimeout(1500);
    for (let i = 0; i < 40; i++) { if (await p.evaluate(() => document.querySelectorAll('#stockList .stock-list-row').length > 50)) break; await p.waitForTimeout(500); }   // 데이터가 늦게 들어와도 기다림
    await p.evaluate(() => aqMapIdxLoad(true)); await p.waitForTimeout(1500);
    const s = await p.evaluate(() => { const rows = [...document.querySelectorAll('#stockList .stock-list-row')]; const mk = rows.filter(r => r.classList.contains('has-map')); return { rows: rows.length, mk: mk.length, tags: mk.every(r => r.querySelector('.sl-mk') && r.querySelector('.sl-mk').textContent === '지도'), toggle: !!document.querySelector('#stockListCard .pills, #stockListCard [data-f]'), sort: [...document.querySelectorAll('#sortMenu button')].map(x => x.textContent.trim()) }; });
    ok(label + ': 종목리스트에 지도 딱지 없음(v8.92 — ' + s.mk + '개) · 전체/지도 토글 없음', s.rows > 50 && s.mk === 0 && !s.toggle, JSON.stringify({ rows: s.rows, mk: s.mk }));
    ok(label + ': 정렬 3가지(등락률 · 섹터 · 상대 PER — 「지도 최신순」은 v8.92에서 없앰)', JSON.stringify(s.sort) === JSON.stringify(['등락률 높은순', '섹터 강한순', '상대 PER 낮은 순']), JSON.stringify(s.sort));
    // v8.92: 지도 펼침 · 「종목페이지 ›」 · 「지도 최신순」은 없앰 — 어느 행이든 누르면 바로 종목 페이지
    const plain = await p.evaluate(() => { const r = document.querySelector('#stockList .stock-list-row'); r.click(); return { opened: window.__opened.slice(), tk: r.dataset.ticker, card: !!document.querySelector('#stockList .mlx') }; });
    ok(label + ': 행을 누르면 바로 종목 페이지(카드 안 펼침 · v8.92)', plain.opened.length === 1 && plain.opened[0] === plain.tk && !plain.card, JSON.stringify(plain));
    await p.screenshot({ path: path.join(OUT, 'ia9_list_' + (label === '폰' ? 'phone' : 'wide') + '.png') });
    await p.context().close();
  }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
