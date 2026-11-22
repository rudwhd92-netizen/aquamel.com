// 탐색 › 종목리스트 행 시험 — node tools/ui-test/stocklist.js   (v8.92: B안 — 로고 · 종목명 · 티커 / 섹터 · 지도 딱지 없음 · 좁은 폭 두 줄 · 목록 폭 560 이상 한 줄 열 맞춤 · 행 높이 44 이상)
//   서버 없이 file:// 로 열린다(URL=로 바꿀 수 있음) · CHANNEL=msedge · 종목 · 시세는 모두 지어낸 값
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'file:///' + path.resolve(__dirname, '../../index.html').replace(/\\/g, '/');
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  const p = await (await b.newContext({ viewport: { width: 800, height: 900 } })).newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'));
  const html = await p.evaluate(() => {
    const NAMES = { NVDA: '엔비디아', '047810': '한국항공우주산업', '005930': '삼성전자' }; window.displayName = t => NAMES[t] || t;
    const items = [{ ticker: 'NVDA', sector: '반도체', close: 189.3, chg: 1.84 }, { ticker: '047810', sector: '항공우주 · 방산', close: 71300, chg: -0.45 }, { ticker: '005930', sector: '반도체', close: 82400, chg: 0.62 }, { ticker: 'ZZZZ', sector: '시험 섹터', close: 10, chg: 0 }];
    let box = document.getElementById('stockList'); if (!box) { box = document.createElement('div'); box.id = 'stockList'; document.body.appendChild(box); }
    box.style.cssText = 'width:360px;position:relative;background:#161618;padding:0 16px;box-sizing:content-box'; box.innerHTML = items.map(renderStockRow).join('');
    document.body.prepend(box); box.style.position = 'relative'; box.style.zIndex = 99999;
    return box.innerHTML;
  });
  ok('지도 딱지(.sl-mk) · has-map 없음', !/sl-mk|has-map|ml-row/.test(html));
  const probe = () => p.evaluate(() => [...document.querySelectorAll('#stockList .stock-list-row')].map(r => {
    const q = s => r.querySelector(s), rc = e => e ? e.getBoundingClientRect() : null, nm = rc(q('.sl-ticker')), tk = rc(q('.sl-tk')), sc = rc(q('.sl-sector')), lg = rc(r.firstElementChild);
    return { h: Math.round(r.getBoundingClientRect().height), nm: q('.sl-ticker').textContent, tk: q('.sl-tk') ? q('.sl-tk').textContent : '', sec: q('.sl-sector').textContent, tkSameLineAsName: tk ? Math.abs(tk.top - nm.top) < 6 : null, tkRightOfName: tk ? tk.left > nm.left : null, secBelow: sc.top > nm.bottom - 4, secSameLine: Math.abs(sc.top - nm.top) < 8, secRightOfTk: tk ? sc.left > tk.left : sc.left > nm.left, secW: Math.round(sc.width), logoLeftOfName: lg.right <= nm.left + 1, nameClipped: q('.sl-ticker').scrollWidth > q('.sl-ticker').clientWidth };
  }));
  let r = await probe();
  ok('행 높이 44 이상', r.every(x => x.h >= 44), r.map(x => x.h).join('/'));
  ok('순서: 로고 → 종목명 → 티커(같은 줄) → 섹터(아랫줄) — 폭 360', r.slice(0, 3).every(x => x.logoLeftOfName && x.tkSameLineAsName && x.tkRightOfName && x.secBelow), JSON.stringify(r[1]));
  ok('긴 이름(한국항공우주산업)도 섹터가 보임 · 이름 안 잘림', r[1].secW > 40 && !r[1].nameClipped, 'secW=' + r[1].secW);
  ok('한글 이름이 없는 종목(ZZZZ)은 티커를 두 번 그리지 않음', r[3].tk === '' && r[3].nm === 'ZZZZ');
  await p.screenshot({ path: path.join(OUT, 'stocklist_360.png'), clip: { x: 0, y: 0, width: 420, height: 300 } });
  await p.evaluate(() => { document.getElementById('stockList').style.width = '680px'; }); await p.waitForTimeout(200);
  r = await probe();
  ok('목록 폭 680: 한 줄 열 맞춤(이름 · 티커 · 섹터가 같은 줄)', r.slice(0, 3).every(x => x.tkSameLineAsName && x.secSameLine && x.secRightOfTk && x.h >= 44), JSON.stringify(r[0]));
  await p.screenshot({ path: path.join(OUT, 'stocklist_wide.png'), clip: { x: 0, y: 0, width: 760, height: 260 } });
  const sortMenu = await p.evaluate(() => [...document.querySelectorAll('#sortMenu button')].map(b => b.textContent.trim()));
  ok('정렬에 「지도 최신순」 없음', !sortMenu.some(t => /지도/.test(t)), sortMenu.join(' · '));
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
