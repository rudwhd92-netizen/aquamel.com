// 상단 머리글 시험 — node tools/ui-test/header.js   (v9.44 · 실제 공개 data.json · 일정 파일을 읽기만 함)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
async function open(b, w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' }); await ctx.route('**/data/schedule/**', async r => { const res = await r.fetch(); await r.fulfill({ response: res, headers: { ...res.headers(), 'access-control-allow-origin': '*' } }); });   // 로컬 주소는 CORS 허용 목록 밖
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { if (!/discoverMotionView/.test(e.message)) errs.push(e.message); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.addStyleTag({ content: '.aq-auth{display:none!important}' });
  await p.evaluate(() => new MutationObserver(() => document.querySelectorAll('.aq-auth.open').forEach(x => x.classList.remove('open'))).observe(document.body, { subtree: true, attributes: true, childList: true }));
  await p.waitForFunction(() => document.getElementById('splashOverlay').style.display === 'none', null, { timeout: 90000, polling: 30 });
  const water = await p.evaluate(() => document.querySelector('.hero h1 .hl').style.clipPath.slice(0, 8));
  await p.waitForFunction(() => !document.getElementById('aqMst').hidden && document.querySelector('.hero-marquee-track .macro-chip'), null, { timeout: 30000, polling: 200 }); await p.waitForTimeout(2500);
  return { p, errs, ctx, water };
}
const rect = (p, s) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), b: Math.round(r.bottom) }; }, s);
const cross = (a, b) => a && b && a.x < b.r - 1 && b.x < a.r - 1 && a.y < b.b - 1 && b.y < a.b - 1;
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let { p, errs, ctx, water } = await open(b, 390, 844); const wait = ms => p.waitForTimeout(ms); const shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  ok('켤 때 AQUA에 물이 참(자름이 걸렸다가 풀림)', water === 'polygon(' || water === 'inset(10', water);
  await p.waitForFunction(() => !document.querySelector('.hero h1 .hl').style.clipPath, null, { timeout: 6000, polling: 100 }).catch(() => {});
  ok('다 차면 원래대로', await p.evaluate(() => !document.querySelector('.hero h1 .hl').style.clipPath && document.querySelectorAll('.hero h1 > span').length === 2 && document.querySelector('.hero h1').children.length === 2), await p.evaluate(() => { const h = document.querySelector('.hero h1'); return JSON.stringify([h.querySelector('.hl').style.clipPath.slice(0, 30), [...h.children].map(c => c.tagName + '.' + c.className)]); }));
  const at = await p.evaluate(() => { const y = s => Math.round(document.querySelector(s).getBoundingClientRect().top); return [y('.hero h1 .brand-aquamel'), y('.hero .market-switch'), y('#heroMarquee'), y('#buyPointsCard h2')].join(); });
  ok('평소 위치 그대로(이름 · 전환 · MACRO · 아래 제목)', at === '78,117,171,240', at);
  /* 장 상태 */
  const st = await p.evaluate(() => { const f = (m, t) => { const s = aqMarketState(m, Date.parse(t)); return s ? [s.open ? 'open' : s.holiday ? 'holiday' : 'closed', Math.round(s.left / 60000), s.early ? 'early' : ''].join(':') : 'null'; };
    return [f('US', '2026-11-26T12:00:00-05:00'), f('US', '2026-11-27T12:00:00-05:00'), f('US', '2026-11-27T14:00:00-05:00'), f('US', '2026-11-28T12:00:00-05:00'), f('KR', '2026-11-27T10:00:00+09:00'), f('KR', '2026-11-27T08:00:00+09:00')]; });
  ok('장 상태: 추수감사절 휴장 · 조기 폐장 · 주말 · 한국', JSON.stringify(st) === JSON.stringify(['holiday:1290:', 'open:60:early', 'closed:4050:', 'closed:2730:', 'open:330:', 'closed:60:']), JSON.stringify(st));
  const mst = await rect(p, '#aqMst'), t2 = await p.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.querySelector('.brand-investment')); return Math.round(r.getBoundingClientRect().right); });
  ok('장 상태 칸: 이름 · US|KR과 안 겹침', mst.x > t2 + 8 && mst.b <= (await rect(p, '.hero .market-switch')).y + 1 && mst.r <= 372, JSON.stringify(mst) + ' name→' + t2);
  await shot('header1');
  /* MACRO 펼침 */
  await p.locator('.hero-marquee-label').click(); await wait(1400); await shot('header2');
  ok('MACRO 글자 → 전체', await p.locator('.aq-mp-cell').count() >= 8 && (await rect(p, '#aqMacPanel')).h > 150 && await p.evaluate(() => !document.getElementById('macListSheet').classList.contains('open')));
  await p.locator('.aq-mp-cell').first().click(); await wait(1300); await shot('header3');
  ok('칸 → 값 · 1개월 선', await p.locator('.aq-mp-det').count() === 1 && /\d/.test(await p.locator('.aq-mp-v b').textContent()) && await p.locator('.aq-mp-ch path, .aq-mp-none').count() === 1);
  const first = await p.locator('.aq-mp-nm span').first().textContent(); await p.locator('.aq-mp [data-step="1"]').click(); await wait(900);
  ok('› 다음 지표', await p.locator('.aq-mp-nm span').first().textContent() !== first && /^2 \//.test(await p.locator('.aq-mp-nav span').textContent()));
  await p.locator('.aq-mp [data-close]').click(); await wait(1200);
  ok('닫으면 원래 간격', await p.evaluate(() => getComputedStyle(document.getElementById('aqMacPanel')).display === 'none' && Math.round(document.querySelector('#buyPointsCard h2').getBoundingClientRect().top) === 240));
  await p.evaluate(() => document.querySelector('.hero-marquee-track .macro-chip').click()); await wait(1200);
  ok('흐르는 지표를 눌러도 펼쳐지고 띠는 멈춤', await p.evaluate(() => document.getElementById('heroMarquee').classList.contains('aq-paused') && !!document.querySelector('.aq-mp-det')));
  await p.keyboard.press('Escape'); await p.locator('.aq-mp [data-close]').click(); await wait(1000);
  /* 접기 */
  const parts = () => p.evaluate(() => { const g = [...document.querySelectorAll('#aqHeadBar .hb-g')]; const r = e => { const x = e.getBoundingClientRect(); return { x: x.left, y: x.top, r: x.right, b: x.bottom }; };
    if (!g.length) return null; const range = document.createRange(); range.selectNodeContents(g[0]); const w = range.getBoundingClientRect(); return { brand: { x: w.left, y: w.top, r: w.right, b: w.bottom }, inv: +g[1].style.opacity, sw: r(g[2]), dot: r(g[3]), icons: g.slice(4).map(r) }; });
  const check = async (label, W) => { const q = await parts(); const all = q ? [q.brand, q.dot, q.sw].concat(q.icons) : []; let hit = '';
    all.forEach((a, i) => all.forEach((c, j) => { if (j > i && cross(a, c)) hit = i + '×' + j; }));
    ok(label, !!q && q.inv === 0 && !hit && all.every(a => a.x >= 0 && a.r <= W && a.b <= 62), q ? hit || JSON.stringify(all.map(a => [Math.round(a.x), Math.round(a.r)])) : await p.evaluate(() => JSON.stringify({ y: scrollY, h: document.scrollingElement.scrollHeight, top: document.querySelector('.hero h1').getBoundingClientRect().top, bar: document.getElementById('aqHeadBar').className, n: document.querySelectorAll('#aqHeadBar .hb-g').length }))); };
  const bad = [];
  for (let y = 25; y <= 130; y += 7) { await p.evaluate(y => scrollTo(0, y), y); await wait(120); const m = await parts(); if (!m) continue; const hit = m.icons.some(i => cross(m.sw, i) || cross(m.brand, i)) || cross(m.sw, m.brand); if (hit) bad.push(y + ':' + JSON.stringify([m.brand, m.sw, m.icons[0]].map(o => [Math.round(o.x), Math.round(o.y), Math.round(o.r), Math.round(o.b)]))); }
  ok('접히는 중간에도 이름 · US|KR · 단추가 안 겹침', bad.length === 0, bad.slice(0, 3).join('  '));
  await p.evaluate(() => scrollTo(0, 70)); await wait(500); await shot('header4');
  await p.evaluate(() => scrollTo(0, 500)); await wait(600); await shot('header5'); await check('접힘: 이름 · 점 · US|KR · 단추가 한 줄 · 안 겹침', 390);
  ok('접힌 동안 원래 것은 숨김', await p.evaluate(() => getComputedStyle(document.querySelector('.hero h1')).visibility === 'hidden'));
  await p.locator('#aqHeadBar .noti-bell').click(); await wait(900);
  ok('접힌 종 → 알림 창이 화면 안에', await p.evaluate(() => { const r = document.getElementById('aqNotiPop').getBoundingClientRect(); return document.getElementById('aqNotiPop').classList.contains('open') && r.top >= 0 && r.top < 120; })); await shot('header6');
  await p.evaluate(() => aqNotiClose()); await wait(600);
  await p.locator('#aqHeadBar .mkt-btn[data-market="KR"]').click(); await wait(1800);
  ok('접힌 US|KR로 시장 바꾸기', await p.evaluate(() => getCurrentMarket() === 'KR' && /한국/.test(document.getElementById('aqMst').textContent)));
  await p.evaluate(() => scrollTo(0, 0)); await wait(700); await shot('header7');
  ok('맨 위로 오면 접힌 줄 사라지고 원래대로', await p.evaluate(() => !document.getElementById('aqHeadBar').classList.contains('on') && getComputedStyle(document.querySelector('.hero h1')).visibility === 'visible'));
  await p.evaluate(() => setMarket('US')); await wait(1200);
  await p.evaluate(() => switchMobileTab('interest')); await wait(900);
  ok('관심에서 ☰ 파란 강조 없음', await p.evaluate(() => !document.getElementById('mobileMenuBtn').classList.contains('aq-hasact')));
  ok('오류 없음', errs.length === 0, errs.join(' | ').slice(0, 300)); await ctx.close();

  ({ p, errs, ctx } = await open(b, 360, 740));
  await p.evaluate(() => scrollTo(0, 500)); await p.waitForTimeout(600); await check('360 폭: 접힌 줄 안 겹침', 360); await p.screenshot({ path: path.join(OUT, 'header8.png') });
  ok('360 오류 없음', errs.length === 0, errs.join(' | ').slice(0, 200)); await ctx.close();

  ({ p, errs, ctx } = await open(b, 1280, 720));
  await p.evaluate(() => { const h = document.querySelector('.hero'); let e = h.parentElement; while (e && !(e.scrollHeight > e.clientHeight + 50 && /auto|scroll/.test(getComputedStyle(e).overflowY))) e = e.parentElement; (e || document.scrollingElement).scrollTop = 500; }); await p.waitForTimeout(800); await p.screenshot({ path: path.join(OUT, 'header9.png') });
  const q = await p.evaluate(() => { const bg = document.querySelector('#aqHeadBar.on .hb-bg'), col = document.querySelector('.hero').getBoundingClientRect(); if (!bg) return null; const r = bg.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), Math.round(col.left), Math.round(col.right)]; });
  ok('넓은 화면: 접힌 줄이 왼쪽 칸 안', !!q && q[0] >= q[2] - 19 && q[1] <= q[3] + 19, JSON.stringify(q));
  ok('넓은 화면 오류 없음', errs.length === 0, errs.join(' | ').slice(0, 200));
  console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); await b.close(); process.exit(fails ? 1 : 0);
})();
