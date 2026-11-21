// AI 매니저 화면 시험 — node tools/ui-test/manager.js [night|after]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
const mode = process.argv[2] || 'night';
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined }); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.on('pageerror', e => console.log('PAGEERR ' + e.message));
  await p.goto(URL, { timeout: 40000 });
  await p.evaluate((mode) => {
    document.querySelectorAll('#aqAuth').forEach(x => x.style.display = 'none');
    document.body.setAttribute('data-role', 'admin'); try { _aqAuth.user = { role: 'admin' }; } catch (e) {}
    window.apiCall = async () => ({ ok: false });
    // 시험 값 (지어낸 수량 · 가격)
    const H = [['AAA', 40, 100, 150], ['BBB', 60, 50, 62], ['CCC', 25, 120, 90], ['DDD', 100, 30, 31], ['EEE', 10, 300, 280], ['FFF', 30, 80, 96], ['GGG', 50, 40, 38], ['HHH', 15, 200, 230], ['III', 20, 60, 55], ['JJJ', 8, 400, 410], ['KKK', 70, 20, 24], ['LLL', 12, 150, 140]];
    const stocks = {}; H.forEach(([t, q, a, n]) => stocks[t] = { name: t + ' 회사', held: true, qty: q, avg: a, now: n });
    stocks.WWW = { name: 'WWW 회사', held: false, now: 50 };
    const W = { '표': '3:0', '상황': '[상황 한 줄 — 판단의 결론]', '설득': '[설득 글 — 반대 사실부터 짚고, 그래도 이렇게 하는 까닭을 길게 쓴 줄글이 들어갑니다. 여섯 줄을 넘으면 접히고 설명 전체 읽기로 펼칩니다.] '.repeat(4), '어제': '보유', '계획': { n: 1, of: 2 },
      '예보관계': { k: '따름', why: '[예보와의 관계 한 줄]' }, '바뀐 것': '[어제와 달라진 까닭]', '반대 사실': ['[반대 쪽 사실 1] | 자료 [출처]', '[반대 쪽 사실 2] | 자료 [출처]'] };
    const st = mode === 'night' ? 'proposed' : 'done';
    const items = [
      { id: 1, rank: 1, status: st, mode: 'live', legs: [{ tk: 'CCC', side: 'SELL', qty: 10, price: 89 }], why: W, plan: { '방향': '줄이기', '지금 단계': '1/2', '도착': '[계획의 도착점]', '그만': '[그만두는 조건]', '오늘 단계': { n: 1, of: 2, '무엇': '[오늘 할 일]' } } },
      { id: 2, rank: 2, status: st, mode: 'live', legs: [{ tk: 'EEE', side: 'SELL', qty: 3, price: 282 }], why: { '표': '3:0', '상황': '[상황 한 줄]' } },
      { id: 3, rank: 3, status: mode === 'night' ? 'proposed' : 'expired', mode: 'live', legs: [{ tk: 'GGG', side: 'SELL', qty: 20, price: 39 }], why: { '표': '2:1', '상황': '[상황 한 줄]', '반대 표': { op: '보유', why: '[반대한 1표의 까닭]' } } },
      { id: 4, rank: 4, status: st, mode: 'live', legs: [{ tk: 'FFF', side: 'BUY', qty: 5, price: 95 }], why: { '표': '3:0', '상황': '[상황 한 줄]' } }
    ];
    _mg.mk = 'US'; _mg.ts = Date.now(); _mg.pxTs = Date.now();
    _mg.d = { ok: true, run: { day: '2026-11-17', v3: true, cash: 3000, head: '[오늘 밤 결론 한 줄]', result_at: '2026-11-17T14:00:00Z', checked: mode !== 'night' }, items, stocks,
      opinions: [{ tk: 'CCC', op: '분할 매도', held: true, ret: -25, votes: '3:0', prev: '보유', one: '[이 종목 판단 한 줄]' }], decide: [], diff_open: 1 };
    _mj.d = { mgr: { d: '2026-11-17', status: 'done', T: '2026-11-17T14:00:00Z', premise: { '한 줄': '[오늘의 전제]', '결론': '다지기', p: { '다지기': 40 } },
      hy: { watch: { w: [{ tk: 'EEE', side: 'SELL', max: 3, lo: 275, hi: 278, raw: '가격 ≤ $278.00', why: '[주시 까닭]' }, { tk: 'BBB', side: 'BUY', max: 10, lo: 60, hi: 61, raw: '등락 ≤ -3%', fired: true, res: { ok: true, qty: 10, price: 60.5 } }] } },
      plans: [{ tk: 'CCC', '방향': '줄이기', '지금 단계': '1/2', '도착': '[계획의 도착점]', '그만': '[그만두는 조건]' }],
      watch_why: [{ tk: 'WWW', op: '대기', why: { '표': '3:0', '상황': '[관심 종목 판단 한 줄]' } }] }, last: { stocks: { CCC: { w: '비우호' } } } };
    _mg.tr = { by_btn: {} };
    switchMobileTab('ai'); setAiSubtab('manager');
  }, mode);
  await p.waitForTimeout(600);
  await p.evaluate(() => { document.getElementById('mgrBody').innerHTML = _mgBox(); window.scrollTo(0, 0); });
  await p.waitForTimeout(800);
  const bb = await (await p.$('#mgrBody')).boundingBox();
  await p.setViewportSize({ width: 390, height: Math.ceil(bb.y + bb.height + 40) }); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(OUT, `manager_${mode}.png`), clip: { x: 0, y: bb.y - 10, width: 390, height: bb.height + 20 } });
  if (mode === 'night') {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => aqMgr3Flow()); await p.waitForTimeout(800);
    const h = await p.evaluate(() => { const f = document.getElementById('mg3Fl'); const s = f.scrollHeight; f.style.position = 'absolute'; f.style.height = s + 'px'; f.style.overflow = 'visible'; return s; });
    await p.setViewportSize({ width: 390, height: h + 120 }); await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, 'manager_flow.png') });
    await p.evaluate(() => aqMgr3Close()); await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(() => aqMg4Tile('CCC')); await p.waitForTimeout(400); await p.screenshot({ path: path.join(OUT, 'manager_tile.png') });
    await p.evaluate(() => { document.getElementById('mg3Sh')?.remove(); aqMg4WatchSh('EEE'); }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, 'manager_watch.png') });
  }
  console.log('저장:', OUT); await b.close(); process.exit(0);
})();
