// 종목 페이지(v9.25) 시험 — node tools/ui-test/stockpage.js
//   차트 아래 Tab pill(뉴스가 첫 칸 · 있는 칸만) · 내부자 카드 + 날짜 젤리 슬라이더 · 공매도 게이지 · 위쪽 움직임이 끝나면 일반 글자로 · 스크롤하면 미니 머리 · 움직임 줄이기
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다 · 뉴스 · 업적은 가짜 응답 · 내부자 · 공매도 · 차트는 저장소의 실제 data 값(NVDA)
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8773/index.html', TK = process.env.TK || 'NVDA';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
async function open(b, motion) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: motion });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon|manifest|fonts\.g|CORS|아카이브|fetching the script/i.test(m.text())) errs.push(m.text().slice(0, 160)); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.waitForFunction(() => _state.archive && _state.archive.length > 100, null, { timeout: 30000 }).catch(() => {});
  await p.evaluate(() => {
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin');
    const o = window.apiCall;
    window.apiCall = async function (a, pr) {
      if (a === 'getBadges') return { ok: true, items: [{ code: 'RYAN_B', ticker: 'NVDA', date: '2026-09-12', kind: 'done', market: 'US' }] };
      if (a === 'leadGet' && pr && pr.mode === 'news') return { ok: true, at: '2026-11-23T08:10:00', cards: [{ kind: '이 종목', d: '2026-11-23', h: '소식 제목 예시', fx: '영향 예시', s: '요약', u: 'https://example.com' }] };
      return o ? o.apply(this, arguments) : { ok: false };
    };
  });
  await p.waitForFunction(tk => { try { return !!(_state.tickerSectorMap && _state.tickerSectorMap[tk]) && !!findTickerSeries(tk) && !!aqValuationFor(tk); } catch (e) { return false; } }, TK, { timeout: 40000 }).catch(() => {});
  await p.waitForTimeout(1200);
  return { p, errs };
}
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let { p, errs } = await open(b, 'no-preference');
  await p.evaluate(tk => openChart(tk), TK); await p.waitForTimeout(4200);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('#spTabs .xtab-btn')].map(t => t.textContent + (t.classList.contains('active') ? '*' : '')));
  ok('차트 아래: Tab pill 한 줄 — 뉴스가 첫 칸이고 처음에 열림', tabs[0] === '뉴스*' && tabs.includes('내부자') && tabs.includes('공매도'), tabs.join(' '));
  ok('차트 아래: 데이터 없는 칸은 안 나옴(NVDA는 시그널 이력 없음)', !tabs.some(t => /시그널/.test(t)));
  ok('차트 아래: 앱 공용 Tab pill 부품(aqTpSync 알약)', await p.evaluate(() => !!document.querySelector('#spTabs .aq-tp-ind')));
  ok('차트 아래: 접이식 머리(▶ 줄)는 안 보임 · 한 칸만 보임', await p.evaluate(() => { const on = [...document.querySelectorAll('#chartModal .sp-wrap')].filter(w => getComputedStyle(w).display !== 'none'); const hd = document.querySelector('#newsWrap > .aq-coll-head'); return on.length === 1 && getComputedStyle(hd).display === 'none'; }));
  // 탭 알약이 앱 표준처럼 움직임(v9.27) — 앞쪽 가장자리가 먼저 늘어났다 뒤가 따라옴(폭이 커졌다 돌아옴) · 한 프레임에 순간이동하지 않음
  const mv = await p.evaluate(async () => {
    const row = document.getElementById('spTabs'), btns = [...row.querySelectorAll('.xtab-btn')], ind = row.querySelector('.aq-tp-ind'), out = [];
    const from = btns.findIndex(b => b.classList.contains('active')), to = from === 0 ? 1 : 0; const t0 = performance.now(); btns[to].click();
    await new Promise(res => { const f = () => { const m = new DOMMatrix(getComputedStyle(ind).transform); out.push([performance.now() - t0, m.m41, parseFloat(ind.style.width)]); if (performance.now() - t0 < 800) requestAnimationFrame(f); else res(); }; f(); });
    const w = out.map(x => x[2]), fin = out[out.length - 1], start = out[0], mid = out.find(x => x[0] > 60) || fin;
    return { wMax: Math.max(...w), wEnd: fin[2], wStart: start[2], midLeft: Math.round(mid[1]), startLeft: Math.round(start[1]), endLeft: Math.round(fin[1]) };
  });
  ok('탭 알약: 앱 표준처럼 늘어났다 모이며 움직임(순간이동 아님)', mv.wMax > mv.wEnd + 8 && mv.midLeft > Math.min(mv.startLeft, mv.endLeft) + 4 && mv.midLeft < Math.max(mv.startLeft, mv.endLeft) - 4, JSON.stringify(mv));
  await p.evaluate(() => { document.querySelector('#spTabs .xtab-btn').click(); }); await p.waitForTimeout(900);
  const top = await p.evaluate(() => ({ px: document.querySelector('#modalPrice .mp-v').textContent, op: document.querySelector('#modalPrice .mp-v').style.opacity, desc: !document.querySelector('#modalDesc .sp-w'), clip: document.getElementById('chartCanvas').style.clipPath, chip: document.querySelector('#modalSubtitle .ms-chip').style.opacity, val: document.querySelector('#modalValuation .mv-v') && document.querySelector('#modalValuation .mv-v').textContent }));
  ok('위쪽: 움직임이 끝나면 일반 글자 · 값으로 돌아옴(가격 · 설명 · 차트 · 칩 · PER)', /^\$\d/.test(top.px) && top.op === '' && top.desc && top.clip === '' && top.chip === '' && /\d/.test(top.val || ''), JSON.stringify(top));
  const mc = '#chartModal .modal-content';
  ok('미니 머리: 처음엔 숨음', await p.evaluate(() => !document.getElementById('spMini').classList.contains('on')));
  await p.evaluate(mc => { document.querySelector(mc).scrollTop = 560; }, mc); await p.waitForTimeout(900);
  const mini = await p.evaluate(mc => { const m = document.getElementById('spMini'), r = m.getBoundingClientRect(), c = document.querySelector(mc).getBoundingClientRect(), bar = document.getElementById('spBar').getBoundingClientRect(); return { on: m.classList.contains('on'), top: Math.round(r.top - c.top), txt: m.textContent.replace(/\s+/g, ' '), barTop: Math.round(bar.top - c.top) }; }, mc);
  ok('미니 머리: 가격이 화면 밖으로 나가면 위에 붙음(이름 · 가격 · 등락)', mini.on && Math.abs(mini.top) <= 1 && /\$\d/.test(mini.txt), JSON.stringify(mini));
  const tx = await p.evaluate(mc => { const mcE = document.querySelector(mc); mcE.scrollTop = mcE.scrollHeight; return 0; }, mc); await p.waitForTimeout(500);
  const names = await p.evaluate(() => [...document.querySelectorAll('#spTabs .xtab-btn')].map(t => t.textContent));
  const click = async nm => { const i = names.indexOf(nm); const ts = await p.$$('#spTabs .xtab-btn'); await ts[i].click(); await p.waitForTimeout(1700); };
  await click('내부자');
  const ins = await p.evaluate(() => { const a = document.getElementById('insiderSellHistoryArea'); return { cards: a.querySelectorAll('.sp-pc').length, tiles: a.querySelectorAll('.sp-tile').length, table: !!a.querySelector('table'), jl: !!a.querySelector('.sp-j.aqj'), usd: a.querySelector('[data-k="usd"]').textContent, n: a.querySelector('[data-k="n"]').textContent, vis: getComputedStyle(document.getElementById('insiderSellHistoryWrap')).display }; });
  ok('내부자: 표가 사람별 카드 + 타일 3개 + 날짜 젤리 슬라이더로(aqJelly)', ins.cards >= 1 && ins.tiles === 3 && !ins.table && ins.jl && ins.vis !== 'none', JSON.stringify(ins));
  const jb = await (await p.$('#insiderSellHistoryArea .sp-j')).boundingBox();
  await p.mouse.move(jb.x + jb.width - 14, jb.y + 60); await p.mouse.down(); await p.mouse.move(jb.x + jb.width * 0.4, jb.y + 60, { steps: 8 }); await p.waitForTimeout(150); await p.mouse.up(); await p.waitForTimeout(1300);
  const after = await p.evaluate(() => ({ usd: document.querySelector('#insiderSellHistoryArea [data-k="usd"]').textContent, n: document.querySelector('#insiderSellHistoryArea [data-k="n"]').textContent, off: document.querySelectorAll('#insiderSellHistoryArea .sp-tx.off').length }));
  ok('내부자: 슬라이더를 밀면 그 날짜까지의 합계 · 거래가 바뀜', after.usd !== ins.usd && after.n !== ins.n, ins.usd + '/' + ins.n + ' → ' + after.usd + '/' + after.n);
  await (await p.$('#insiderSellHistoryArea .sp-ph')).click(); await p.waitForTimeout(1100);
  ok('내부자: 카드를 누르면 날짜별 거래가 펼쳐짐(스프링 높이)', await p.evaluate(() => { const b = document.querySelector('#insiderSellHistoryArea .sp-px'); return b.getBoundingClientRect().height > 40; }));
  await click('공매도');
  ok('공매도: 게이지 2개(업계 안 위치 · Days to Cover)가 차오름', await p.evaluate(() => [...document.querySelectorAll('#shortHistoryArea .ss-gauge')].every(g => parseFloat(g.querySelector('i').style.width) > 1) && document.querySelectorAll('#shortHistoryArea .ss-gauge').length === 2));
  // 공매도 아래에 업데이트 일자(시트의 SI_Settle_Date) — 날짜 형식이 달라도 읽힘 · 값이 없으면 줄 없음(v9.28)
  const up = await p.evaluate(tk => { const rec = _aqCrowdingList.find(r => r.ticker === tk); if (!rec) return { none: true }; const keep = rec.siDate, out = {}; const t = v => { rec.siDate = v; renderShortHistory(tk); const e = document.querySelector('#shortHistoryArea .ss-up'); return e ? e.textContent : ''; };
    out.iso = t('2026-11-14'); out.dt = t('2026-11-14T00:00:00.000Z'); out.slash = t('2026/11/14'); out.num = t('20261114'); out.serial = t('46340'); out.none = t(''); rec.siDate = keep; renderShortHistory(tk); return out; }, TK);
  ok('공매도: 아래에 「업데이트 YYYY.MM.DD 기준」 · 값이 없으면 줄이 안 나옴', up.iso === '업데이트 2026.11.14 기준' && up.slash === up.iso && up.num === up.iso && up.dt.startsWith('업데이트 2026.11.1') && up.serial === up.iso && up.none === '', JSON.stringify(up));
  await click('뉴스');
  ok('뉴스: 처음 칸으로 돌아오면 뉴스 카드가 보임', await p.evaluate(() => getComputedStyle(document.getElementById('newsWrap')).display !== 'none' && document.querySelectorAll('#newsArea .nw-row').length >= 1));
  // 장중 가격은 자릿수 롤링(aqRoll) — 그 상태에서 위쪽 움직임이 돌아도 가격이 $60123456789… 로 깨지면 안 됨(v9.26)
  const roll = await p.evaluate(async () => {
    const mp = document.getElementById('modalPrice'), pv = mp.querySelector('.mp-v'), pc = mp.querySelector('.price-chg');
    aqRoll(pv, '$60.12'); if (pc) aqRoll(pc, '+1.23%');
    const rolled = pv.textContent.length > 8;   // 롤링 칸이 실제로 붙었는지
    AQ_SP.topPlay(); await new Promise(r => setTimeout(r, 2600));
    const mini = document.getElementById('spMini');
    return { rolled, px: pv.textContent, pc: pc ? pc.textContent : '' };
  });
  ok('위쪽: 장중(자릿수 롤링) 가격에서도 움직임 뒤 값이 안 깨짐', roll.rolled && roll.px === '$60.12' && !/0123456789/.test(roll.px + roll.pc), JSON.stringify(roll));
  // 종목 지도 · AI 보고서 · 내 주식 화면에서는 차트 아래 알약 · 칸이 보이면 안 됨(v9.27) — 버튼을 실제로 눌러 봄
  const modes = await p.evaluate(async () => {
    const vis = () => { const d = id => { const e = document.getElementById(id); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; }; return d('spBar') || [...document.querySelectorAll('#chartModal .sp-wrap')].some(w => getComputedStyle(w).display !== 'none'); };
    const out = {}; document.body.setAttribute('data-broker', 'linked'); const btns = [...document.querySelectorAll('#modalViewTabs .xtab-btn')];
    for (const v of ['report', 'map', 'position']) { const b = btns.find(x => x.dataset.view === v); if (!b) { out[v] = 'nobtn'; continue; } b.click(); await new Promise(r => setTimeout(r, 900)); out[v] = vis(); }
    aqSetModalView('chart'); await new Promise(r => setTimeout(r, 900)); out.back = vis();
    return out;
  });
  ok('AI 보고서 · 종목 지도 · 내 주식 화면: 차트 아래 알약 · 칸이 숨음 · 차트로 돌아오면 다시 보임', modes.report === false && modes.map === false && modes.position === false && modes.back === true, JSON.stringify(modes));
  await p.evaluate(tk => { closeModal(); }, TK); await p.waitForTimeout(400);
  ok('닫으면 미니 머리 · 차트 가림이 정리됨', await p.evaluate(() => !document.getElementById('spMini').classList.contains('on') && document.getElementById('chartCanvas').style.clipPath === ''));
  ok('오류 없음(미국)', errs.length === 0, errs.join(' | ').slice(0, 300));
  // 움직임 줄이기 — 바로 최종 모습
  ({ p, errs } = await open(b, 'reduce'));
  await p.evaluate(tk => openChart(tk), TK); await p.waitForTimeout(1200);
  const rm = await p.evaluate(() => ({ px: document.querySelector('#modalPrice .mp-v').textContent, op: document.querySelector('#modalPrice .mp-v').style.opacity, clip: document.getElementById('chartCanvas').style.clipPath, tab: !!document.querySelector('#spTabs .xtab-btn.active') }));
  ok('움직임 줄이기: 가격 · 차트가 바로 최종 모습 · 탭은 그대로 나옴', /^\$\d/.test(rm.px) && rm.op === '' && rm.clip === '' && rm.tab, JSON.stringify(rm));
  ok('오류 없음(움직임 줄이기)', errs.length === 0, errs.join(' | ').slice(0, 300));
  console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); await b.close(); process.exit(fails ? 1 : 0);
})();
