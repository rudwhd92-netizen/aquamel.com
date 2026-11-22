// 하단 메뉴 시험 — node tools/ui-test/navbar.js   (v8.80: 선택 바탕이 선택 버튼 폭과 항상 같음 — 로그인 뒤 관리자로 확인돼 'AI' 버튼이 나타나도)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  for (const [label, vp] of [['세로 390', { width: 390, height: 844 }], ['가로 2분할 1180', { width: 1180, height: 800 }]]) {
    const p = await (await b.newContext({ viewport: vp })).newPage();
    p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
    await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
    await p.evaluate(() => document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'));
    const m = () => p.evaluate(() => { const bar = document.querySelector('.mobile-tab-bar'), a = bar.querySelector(':scope > button.active'), ind = bar.querySelector(':scope > .aq-dk-ind') || bar.querySelector(':scope > .aq-seg-ind'), ar = a.getBoundingClientRect(), ir = ind.getBoundingClientRect(); return { n: [...bar.querySelectorAll(':scope > button')].filter(x => x.offsetWidth > 0).length, btn: +ar.width.toFixed(1), ind: +ir.width.toFixed(1), dl: +(ir.left - ar.left).toFixed(1), dr: +(ir.right - ar.right).toFixed(1) }; });
    const same = r => Math.abs(r.ind - r.btn) <= 0.6 && Math.abs(r.dl) <= 0.6 && Math.abs(r.dr) <= 0.6;
    let r = await m(); ok(label + ': 처음(게스트) 바탕 = 선택 버튼', same(r), JSON.stringify(r));
    await p.evaluate(() => document.body.setAttribute('data-role', 'admin')); await p.waitForTimeout(800);
    r = await m(); ok(label + ': 관리자로 확인돼 버튼 수가 바뀐 뒤에도 바탕 = 선택 버튼', same(r), JSON.stringify(r));
    await p.evaluate(() => document.body.setAttribute('data-role', 'user')); await p.waitForTimeout(800);
    r = await m(); ok(label + ': 일반으로 바뀐 뒤에도', same(r), JSON.stringify(r));
    await p.close();
  }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
