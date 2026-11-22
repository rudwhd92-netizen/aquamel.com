// 뉴스 › 기관 13F 시험 — node tools/ui-test/f13.js   (v9.01: 카드가 커져 상세 · 분기 젤리 슬라이더 · 숫자 · 막대 · 글이 쭈르륵 · 「내 종목 있는 곳」 알약)
//   서버 없이 file:// 로 열린다(URL=로 바꿀 수 있음) · CHANNEL=msedge · 지어낸 값(f13Get 응답과 같은 모양: cards[] · 상세 r{cnt,new,exit,up,down,top,dir,ev,qs,q} · 의회 r{o})
const { chromium } = require('playwright');
const path = require('path');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'file:///' + path.resolve(__dirname, '../../index.html').split(String.fromCharCode(92)).join('/');
const OUT = process.env.OUT || path.join(__dirname, 'out');
const SETUP = role => {
  document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', role);
  const QS = ['2025-12-31', '2026-03-31', '2026-06-30', '2026-09-30'], ev = [{ k: '상위 10 비중', u: 'pct', vals: [61, 63, 66, 69] }, { k: '신고 총액', u: 'usd', vals: [262, 281, 267, 306] }, { k: '보유 종목 수', u: 'n', vals: [41, 38, 36, 35] }];
  const cards = [
    { key: 'm1067983', nm: '버크셔 해서웨이', who: '워런 버핏', mine: 2, card: '현금을 쌓으면서 보유 종목을 줄이고 있어요. 소수 종목에 더 집중하는 방향이에요.', ev, cnt: '이번 분기 새로 삼 1 · 다 팖 3', period: '2026-09-30' },
    { key: 'm1536411', nm: '듀케인 패밀리 오피스', who: '스탠리 드러켄밀러', mine: 0, card: 'AI 반도체 비중을 줄이고 에너지와 금융으로 옮기고 있어요.', ev, cnt: '이번 분기 새로 삼 5 · 다 팖 4', period: '2026-09-30' },
    { key: 'congress', nm: '미 의회 거래', who: '의원 공개 거래', mine: 1, card: '기술주 매수가 늘고 방산주 매도가 이어져요.', ev: [], cnt: '최근 45일 · 거래 182건', period: '2026-11-01' }];
  const TK = ['AAPL', 'BAC', 'AXP', 'KO', 'CVX', 'OXY', 'CB', 'KHC', 'MCO', 'DVA', 'V', 'MA'];
  window.__calls = [];
  const detail = (key, q) => {
    const qi = Math.max(0, QS.indexOf(q || QS[3])), k = qi + 1;
    const top = TK.slice(0, 10).map((t, i) => ({ tk: t, w: 28 - i * 2.3 + (i + qi) % 3, hist: [20, 22, 25, 28 - i * 2].map(x => Math.max(1, x - i)) })).sort((a, b) => b.w - a.w);
    return { ok: true, key, nm: '버크셔 해서웨이', who: '워런 버핏', n: 30 + qi, total: (240 + qi * 20) * 1e8, q: QS[qi], qs: QS, cnt: [k, qi, 2 + qi, 1],
      new: TK.slice(0, k).map((t, i) => ({ tk: t, w: 2 + i })), exit: qi ? TK.slice(5, 5 + qi).map((t, i) => ({ tk: t, w0: 1.5 + i })) : [], up: [{ tk: 'AAPL', chg: 40 + qi }, { tk: 'BAC', chg: 33 }], down: [{ tk: 'KO', chg: -28 }],
      dir: { dir: '현금을 쌓으면서 보유 종목을 줄이고 있어요. 소수 종목에 더 집중하는 방향이에요.', th: QS.map((x, i) => ({ q: x, t: i + '번째 분기에는 금융주 비중을 조금씩 늘렸어요.' })), say: { t: '지금은 좋은 사업을 합리적인 값에 살 기회가 드물어요.', s: '주주 서한', u: 'https://example.com/letter' }, im: { '같은 점': '현금 비중을 높이는 점이 같아요.', '다른 점': '상위 종목 집중도가 훨씬 높아요.', '볼 것': '다음 분기에 다 판 종목이 늘어나는지 봐요.' }, v: 1 },
      ev, top, held: ['AAPL'], etf: [] };
  };
  const congress = () => ({ ok: true, key: 'congress', nm: '미 의회 거래', who: '의원 공개 거래', dir: { dir: '기술주 매수가 늘고 방산주 매도가 이어져요.', th: [], im: {} }, ev: [], o: { buy: 104, sell: 78, members: 41, party: { D: 54, R: 46 }, top_buy: [{ tk: 'NVDA', n: 14, m: 9, lo: 15000, hi: 50000 }, { tk: 'MSFT', n: 11, m: 8, lo: 15000, hi: 50000 }], top_sell: [{ tk: 'LMT', n: 8, m: 6, lo: 15000, hi: 50000 }], notable: [{ who: '의원 A', tk: 'NVDA', side: 'buy', lo: 100000, hi: 250000, td: '2026-10-02', fd: '2026-10-20', own: 'S' }] } });
  window.apiCall = async (a, p) => { if (a !== 'f13Get') return { ok: false }; window.__calls.push(JSON.stringify(p || {})); if (!p || !p.key) return { ok: true, cards }; if (p.key === 'congress') return congress(); return detail(p.key, p.q); };
  window.__opened = []; window.openChart = tk => { window.__opened.push(tk); };
  _f13.list = null; _f13.ts = 0; _f13.key = null; _f13.q = null;
  switchMobileTab('news'); setAiSubtab('f13');
};
async function open(b, vw, vh, role, rm) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: rm ? 'reduce' : 'no-preference' }); const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(`(${SETUP.toString()})(${JSON.stringify(role)})`); await p.waitForTimeout(rm ? 900 : 3200); return p;
}
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  for (const [role, vw, vh] of [['user', 390, 1200], ['admin', 1000, 900]]) {
    const L = (role === 'user' ? '일반 회원 ' : '관리자 ') + vw + ': ';
    const p = await open(b, vw, vh, role);
    const s0 = await p.evaluate(() => ({ cards: document.querySelectorAll('#f13ListBox .f13-c').length, op: [...document.querySelectorAll('#f13ListBox .f13-c')].map(c => +c.style.opacity), words: [...document.querySelectorAll('#f13ListBox .f13-c')].map(c => [...c.querySelectorAll('.f13-dp .aqw')].every(w => w.classList.contains('on'))), vals: [...document.querySelector('#f13ListBox .f13-c .f13-ev').querySelectorAll('.f13-v b')].map(x => x.textContent), flt: document.getElementById('f13Flt').style.display, fl: [...document.querySelectorAll('#f13Flt .xtab-btn')].map(x => x.textContent), ind: Math.round(parseFloat((document.querySelector('#f13Flt .aq-tp-ind') || { style: {} }).style.width) || 0), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    ok(L + '기관 카드 3장이 나타나고 방향 글이 다 써지고 숫자가 끝값(69% · $306B · 35)', s0.cards === 3 && s0.op.every(o => o === 1) && s0.words.every(Boolean) && s0.vals.join() === '69%,$306B,35' && s0.sw <= s0.cw, JSON.stringify(s0));
    ok(L + '「내 종목 있는 곳」 알약(전체 3 · 내 종목 있는 곳 2) · Tab pill 붙음', s0.flt === '' && s0.fl.join() === '전체 3,내 종목 있는 곳 2' && s0.ind > 20, JSON.stringify([s0.fl, s0.ind]));
    await p.locator('#f13Card').screenshot({ path: path.join(OUT, 'f13_' + vw + '_a.png') }).catch(() => {});
    await p.click('#f13Flt [data-f="mine"]'); await p.waitForTimeout(700);
    ok(L + '「내 종목 있는 곳」: 듀케인(내 종목 0)이 빠져 2장', await p.evaluate(() => [...document.querySelectorAll('#f13ListBox .f13-c')].filter(c => !c.hidden).length === 2 && document.querySelector('#f13ListBox .f13-c[data-k="m1536411"]').hidden));
    await p.click('#f13Flt [data-f="all"]'); await p.waitForTimeout(600);
    // 카드 → 상세
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.click('#f13ListBox .f13-c[data-k="m1067983"]'); await p.waitForTimeout(90);
    const mid = await p.evaluate(() => ({ clip: document.getElementById('aqF13Sheet').style.clipPath, open: document.getElementById('aqF13Sheet').classList.contains('open'), other: +document.querySelector('#f13ListBox .f13-c[data-k="m1536411"]').style.opacity }));
    await p.waitForTimeout(7500);
    const d = await p.evaluate(() => ({ clip: document.getElementById('aqF13Sheet').style.clipPath, op: document.getElementById('aqF13Body').style.opacity, q: document.getElementById('f13Qv') && document.getElementById('f13Qv').textContent, nums: [...document.querySelectorAll('#f13Nums b')].map(x => x.textContent), acts: document.querySelectorAll('#f13Acts .f13-row').length, t10: document.querySelectorAll('#f13Top .f13-t10').length, widths: [...document.querySelectorAll('#f13Top .tr b')].map(x => Math.round(parseFloat(x.style.width))), words: [...document.querySelectorAll('#f13Bx .aqw')].every(w => w.classList.contains('on')), sub: document.getElementById('f13Sub').textContent, flow: [...document.getElementById('f13Flow').children].map(x => Math.round(parseFloat(x.style.width))), jl: !!document.querySelector('#f13Jl.aqj'), car: !!document.querySelector('#f13Bx .aq-car'), calls: window.__calls.join(' ') }));
    const wide = await p.evaluate(() => document.documentElement.classList.contains('aq-wide'));
    ok(L + '카드를 누르면 상세가 열림' + (wide ? '(와이드: 바로 오른쪽 칸)' : '(카드 자리에서 커짐 · 클립이 줄어듦)'), mid.open && (wide || (/inset\(/.test(mid.clip) && mid.clip !== d.clip)) && (d.clip === '' || /^inset\(0px/.test(d.clip)), mid.clip + ' → ' + d.clip);
    ok(L + '상세: 분기 슬라이더 · 최신 분기(26Q3) · 숫자 4개 · 한 일 줄 · 비중 상위 10 · 글이 다 써짐 · 커서 없음', d.jl && d.q === '26Q3' && d.nums.length === 4 && d.nums.every(x => x !== '0') && d.acts > 0 && d.t10 === 10 && d.widths.every(w => w > 0) && d.words && !d.car && d.flow.length === 2, JSON.stringify(d).slice(0, 360));
    await p.screenshot({ path: path.join(OUT, 'f13_' + vw + '_b.png') });
    // 슬라이더 → 분기 바꾸기(서버에 그 분기를 물음)
    await p.locator('#f13Jl').scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
    const box = await p.locator('#f13Jl').boundingBox();
    await p.mouse.move(box.x + box.width - 2, box.y + 52); await p.mouse.down(); await p.mouse.move(box.x + box.width * .05, box.y + 52, { steps: 8 }); await p.waitForTimeout(350);
    const m2 = await p.evaluate(() => ({ lab: +document.querySelector('#f13Jl .aqj-lab').style.opacity, qv: document.getElementById('f13Qv').textContent }));
    await p.mouse.up(); await p.waitForTimeout(1500);
    const m3 = await p.evaluate(() => ({ qv: document.getElementById('f13Qv').textContent, sub: document.getElementById('f13Sub').textContent, nums: [...document.querySelectorAll('#f13Nums b')].map(x => x.textContent), calls: window.__calls.filter(c => /2025-12-31/.test(c)).length, tr: document.querySelector('#f13Jl .aqj-t').style.transform, lab: +document.querySelector('#f13Jl .aqj-lab').style.opacity, op: document.getElementById('f13Bx').style.opacity }));
    ok(L + '슬라이더를 끝에서 끝으로 밀면: 방울이 뜨고(' + m2.qv + ') 놓으면 그 분기(25Q4) 자료를 불러와 숫자 · 목록이 바뀜 · 줄 · 방울 정리', m2.lab > .8 && m3.qv === '25Q4' && m3.calls >= 1 && m3.nums[0] === '1' && m3.sub !== d.sub && m3.tr === 'none' && m3.lab < .2 && m3.op === '', JSON.stringify([m2, m3]));
    await p.focus('#f13Jl'); const q0 = await p.getAttribute('#f13Jl', 'aria-valuenow'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1100);
    ok(L + '화살표 키로 한 분기 이동', +(await p.getAttribute('#f13Jl', 'aria-valuenow')) === +q0 + 1 && (await p.evaluate(() => document.getElementById('f13Qv').textContent)) === '26Q1', q0 + ' → ' + (await p.getAttribute('#f13Jl', 'aria-valuenow')));
    const fs_ = await p.evaluate(() => [...new Set([...document.querySelectorAll('#aqF13Sheet *, #f13Card *')].filter(e => e.children.length === 0 && e.textContent.trim() && e.offsetParent).map(e => getComputedStyle(e).fontSize))]);
    ok(L + '글자 크기가 6단계(26/18/15/13/12/11) 안', fs_.every(s => ['26px', '18px', '15px', '13px', '12px', '11px'].includes(s)), fs_.join(','));
    // 종목 이름 → 종목 페이지
    await p.click('#f13Top .f13-t10 .f13-lk >> nth=0'); ok(L + '종목 이름을 누르면 종목 페이지(openChart)', await p.evaluate(() => window.__opened.length >= 1), await p.evaluate(() => window.__opened.join()));
    // 닫기
    await p.click('.f13-back'); await p.waitForTimeout(900);
    ok(L + '← 누르면 닫히고 목록 카드가 제자리 · 클립 정리', await p.evaluate(() => { const sh = document.getElementById('aqF13Sheet'); return !sh.classList.contains('open') && sh.style.clipPath === '' && [...document.querySelectorAll('#f13ListBox .f13-c')].every(c => c.style.opacity === '' || +c.style.opacity === 1) && _f13.key === null; }));
    // 의회
    await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#f13ListBox .f13-c[data-k="congress"]'); await p.waitForTimeout(3200);
    const cg = await p.evaluate(() => ({ n: [...document.querySelectorAll('#aqF13Body [data-c]')].map(x => x.textContent), w: [...document.querySelectorAll('#aqF13Body .f13-pty i')].map(x => Math.round(parseFloat(x.style.width))), rows: document.querySelectorAll('#aqF13Body .f13-row').length, words: [...document.querySelectorAll('#aqF13Body .f13-dir .aqw')].every(w => w.classList.contains('on')) }));
    ok(L + '의회 상세: 숫자 3개(104 · 78 · 41) · 정당 막대 54:46 · 목록 · 방향 글', cg.n.join() === '104,78,41' && cg.w.join() === '54,46' && cg.rows >= 3 && cg.words, JSON.stringify(cg));
    await p.click('.f13-back'); await p.waitForTimeout(900);
    await p.context().close();
  }
  // 움직임 줄이기
  { const p = await open(b, 390, 900, 'user', true);
    ok('움직임 줄이기: 카드 · 글 · 숫자가 바로 끝값', await p.evaluate(() => [...document.querySelectorAll('#f13ListBox .f13-c')].every(c => c.style.opacity === '' || +c.style.opacity === 1) && [...document.querySelectorAll('#f13ListBox .aqw')].every(w => w.classList.contains('on')) && document.querySelector('#f13ListBox .f13-v b').textContent === '69%'));
    await p.evaluate(() => window.scrollTo(0, 0)); await p.click('#f13ListBox .f13-c[data-k="m1067983"]'); await p.waitForTimeout(1000);
    ok('움직임 줄이기: 상세가 바로 열리고 글이 다 보이고 클립 없음', await p.evaluate(() => { const sh = document.getElementById('aqF13Sheet'); return sh.classList.contains('open') && sh.style.clipPath === '' && [...document.querySelectorAll('#f13Bx .aqw')].every(w => w.classList.contains('on')) && document.querySelectorAll('#f13Top .f13-t10').length === 10; }));
    await p.click('.f13-back'); await p.waitForTimeout(500); ok('움직임 줄이기: 닫힘', await p.evaluate(() => !document.getElementById('aqF13Sheet').classList.contains('open')));
    await p.context().close(); }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
