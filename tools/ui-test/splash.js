// 로딩 화면(차오름) 시험 — node tools/ui-test/splash.js   (v9.43 · 서버 응답은 붙들어 두고 진행률을 직접 넣음)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
async function open(b, w, h, opt) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: w, height: h }, serviceWorkers: 'block' }, opt));
  await ctx.route('https://aquamel.duckdns.org/**', () => {});   // 응답을 붙듦 → 로딩 화면이 남음
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { if (!/discoverMotionView/.test(e.message)) errs.push(e.message); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.addStyleTag({ content: '.aq-auth{display:none!important}' });
  await p.evaluate(() => new MutationObserver(() => document.querySelectorAll('.aq-auth.open').forEach(x => x.classList.remove('open'))).observe(document.body, { subtree: true, attributes: true, childList: true }));
  await p.evaluate(() => document.querySelectorAll('.aq-auth.open').forEach(x => x.classList.remove('open')));
  await p.waitForFunction(() => typeof _splash !== 'undefined' && _splash.target >= 15, null, { timeout: 30000, polling: 100 }); await p.waitForTimeout(500);   // 앱의 자체 로딩 시작이 끝난 뒤에 값을 넣음
  return { p, errs, ctx };
}
const water = p => p.evaluate(() => { const d = document.getElementById('splashDisc').getContext('2d').getImageData(80, 290, 1, 1).data; return [d[0], d[1], d[2]].join(); });
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let { p, errs, ctx } = await open(b, 390, 844);
  const shot = n => p.screenshot({ path: path.join(OUT, n + '.png') });
  ok('앱 바탕색 · 버전', await p.evaluate(() => getComputedStyle(document.getElementById('splashOverlay')).backgroundColor === getComputedStyle(document.body).backgroundColor && document.getElementById('splashVersion').textContent === 'v' + window.AQ_PWA_VERSION));
  await p.evaluate(() => splashUpdate(55)); await p.waitForTimeout(900);
  ok('진행률 · 단계 글', await p.evaluate(() => /^5\d%$/.test(document.getElementById('splashProgressText').textContent) && document.getElementById('splashSay').textContent === '정리하는 중'), await p.evaluate(() => document.getElementById('splashProgressText').textContent + ' | ' + document.getElementById('splashSay').textContent + ' | ' + _splash.raf));
  ok('물이 참(아래쪽이 파랑)', /^69,159,210$|^47,106,168$/.test(await water(p)), await water(p)); await shot('splash1');
  await p.evaluate(() => { splashUpdate(100); splashHide(); }); await p.waitForTimeout(330); await shot('splash2');
  const mid = await p.evaluate(() => { const h = [...document.querySelectorAll('.hero h1 > span')]; return { out: document.getElementById('splashOverlay').classList.contains('fade-out'), plain: document.getElementById('splashOverlay').classList.contains('plain'), hidden: h.every(x => x.style.visibility === 'hidden') }; });
  ok('이름이 머리글로 날아가는 중(머리글은 잠시 가림)', mid.out && !mid.plain && mid.hidden, JSON.stringify(mid));
  await p.waitForTimeout(1300); await shot('splash3');
  ok('다 걷힘 · 머리글 다시 보임', await p.evaluate(() => document.getElementById('splashOverlay').style.display === 'none' && [...document.querySelectorAll('.hero h1 > span')].every(x => !x.style.visibility)));
  await p.evaluate(() => splashShow()); await p.waitForTimeout(300);
  ok('다시 띄우면 처음 상태', await p.evaluate(() => { const o = document.getElementById('splashOverlay'); return o.style.display === 'flex' && !o.classList.contains('fade-out') && !document.getElementById('splashDisc').style.transform && [...document.getElementById('splashBrand').children].every(x => !x.style.transform) && /^\d%$/.test(document.getElementById('splashProgressText').textContent); }));
  await p.evaluate(() => { splashUpdate(55); }); await p.waitForTimeout(600); await p.evaluate(() => splashError('연결이 안 돼요. 잠시 뒤 다시 눌러 주세요.')); await p.waitForTimeout(500); await shot('splash4');
  ok('실패: 물이 회색으로 빠지고 다시 시도 52px', await p.evaluate(() => { const r = document.querySelector('.splash-retry').getBoundingClientRect(); return r.height === 52 && getComputedStyle(document.getElementById('splashLoader')).display === 'none'; }) && /^(58,58,63|74,74,80|34,34,38)$/.test(await water(p)), await water(p));
  await p.evaluate(() => splashShow()); await p.waitForTimeout(200);
  ok('실패 뒤 다시 띄우면 물 색 복귀', await p.evaluate(() => getComputedStyle(document.getElementById('splashError')).display === 'none' && getComputedStyle(document.getElementById('splashLoader')).display !== 'none'));
  ok('오류 없음', errs.length === 0, errs.join(' | ').slice(0, 300)); await ctx.close();

  for (const [w, h, n, opt] of [[1280, 720, 'wide', {}], [360, 640, 'small', {}], [390, 844, 'reduced', { reducedMotion: 'reduce' }]]) {
    ({ p, errs, ctx } = await open(b, w, h, opt));
    await p.evaluate(() => splashUpdate(55)); await p.waitForTimeout(900); await p.screenshot({ path: path.join(OUT, 'splash_' + n + '.png') });
    const fit = await p.evaluate(() => { const v = document.getElementById('splashVersion').getBoundingClientRect(), l = document.getElementById('splashLoader').getBoundingClientRect(); return l.bottom < v.top && document.getElementById('splashBrand').getBoundingClientRect().width < innerWidth; });
    ok(n + ': 겹침 없이 들어감', fit);
    await p.evaluate(() => { splashUpdate(100); splashHide(); }); await p.waitForTimeout(1700);
    ok(n + ': 걷힘 · 오류 없음', await p.evaluate(() => document.getElementById('splashOverlay').style.display === 'none') && errs.length === 0, errs.join(' | ').slice(0, 200)); await ctx.close();
  }
  console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); await b.close(); process.exit(fails ? 1 : 0);
})();
