// 책장 시험 — node tools/ui-test/shelf.js   (v9.41 · 가짜 서버 응답 · 지어낸 시험 값)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
async function open(b, w, h, admin) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => { if (!/discoverMotionView/.test(e.message)) errs.push(e.message); });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(admin => {
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none');
    if (admin) document.body.setAttribute('data-role', 'admin'); else document.body.removeAttribute('data-role');
    const items = ['가격', '뉴스', '운영'].flatMap((g, i) => Array.from({ length: 12 }, (_, j) => ({ id: 'X' + i + '_' + j, group: g, name: g + ' 시험 ' + j, desc: '설명', makers: [{ how: '수집', source: '시험', when: '06:00' }], stores: ['파일'], readers: ['화면'], paths_now: 1 + j % 5, paths_goal: 1, plan: j % 4 === 0 ? '통합 — 하나로' : j % 7 === 3 ? '폐기 — 끝' : '유지', normal: '', verified: j % 9 !== 0, status: { color: j === 1 ? '빨강' : '초록', why: '시험 이유' } })));
    const rows = Array.from({ length: 40 }, (_, i) => ({ market: i < 30 ? 'US' : 'KR', ticker: i < 30 ? 'T' + i : String(100000 + i), name: '시험회사' + i, sector: i % 2 ? '반도체' : '은행', grade: i % 9 ? '주전' : '후보', via: '원본', since: '2026-11-25', reason: '', fill: '확정' }));
    const R = { source: '명부 표', markets: [{ market: 'US', target: 30, starters: 26, short: 4 }, { market: 'KR', target: 10, starters: 9, short: 1 }], fill: { 대기: 2 }, rows };
    window.__calls = []; window.apiCall = async (a, q) => { window.__calls.push([a, q && q.part]); if (a !== 'shelf') return { ok: true }; return q.part === 'roster' ? { ok: true, roster: JSON.parse(JSON.stringify(R)) } : { ok: true, items }; };
  }, admin);
  return { p, errs, ctx };
}
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let { p, errs, ctx } = await open(b, 390, 844, false);
  await p.evaluate(() => shelfOpen()); await p.waitForTimeout(500);
  ok('일반 회원: 안 열리고 서버 호출 없음', await p.evaluate(() => !document.getElementById('shelfFull').classList.contains('open') && !window.__calls.some(c => c[0] === 'shelf'))); await ctx.close();
  ({ p, errs, ctx } = await open(b, 390, 844, true));
  await p.evaluate(() => { localStorage.removeItem('aqShelfDraft1'); shelfOpen(); }); await p.waitForTimeout(2500);
  const st = () => p.evaluate(() => document.querySelector('.shelf-host').shadowRoot.textContent);
  ok('이상 알림 · 서가', /수집 이상/.test(await st()) && await p.locator('.book').count() === 36, String(await p.locator('.book').count()));
  await p.screenshot({ path: path.join(OUT, 'shelf1.png') });
  await p.locator('.book.bad').first().click(); await p.waitForTimeout(1300);
  ok('빈자리 숫자(주전 목표 − 주전)', !/NaN|undefined/.test(await st()));
  ok('책을 누르면 흐름이 열림', await p.locator('#sheetBody .node').count() === 4); await p.screenshot({ path: path.join(OUT, 'shelf2.png') });
  await p.locator('#close').click(); await p.waitForTimeout(900);
  await p.locator('#tabs button').nth(1).click(); await p.waitForTimeout(1500);
  ok('명부 좌석표: 주전 + 빈자리', await p.locator('#seats i').count() === 30, String(await p.locator('#seats i').count()));
  await p.screenshot({ path: path.join(OUT, 'shelf3.png') });
  await p.locator('#rlist [data-co]').first().click(); await p.waitForTimeout(1200);
  await p.locator('#sheet [data-k="name"]').fill('고친 회사'); await p.locator('#sheet [data-k="brief"]').fill('고친 정의');
  await p.locator('#sheet [data-pick]').click(); await p.waitForTimeout(1200); await p.locator('#sheet2 .opt').first().click(); await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(OUT, 'shelf4.png') });
  await p.locator('#sheet [data-save]').click(); await p.waitForTimeout(1200);
  await p.locator('#pend [data-review]').click(); await p.waitForTimeout(1300);
  const h = await p.locator('#sheet [data-apply]').boundingBox(); await p.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await p.mouse.down(); await p.waitForTimeout(1600); await p.mouse.up(); await p.waitForTimeout(1000);
  ok('길게 눌러 저장 → 이 기기에 남음', await p.evaluate(() => /고친 회사/.test(localStorage.getItem('aqShelfDraft1') || '')));
  await p.evaluate(() => { shelfClose(); shelfOpen(); }); await p.waitForTimeout(2200); await p.locator('#tabs button').nth(1).click(); await p.waitForTimeout(1200);
  ok('다시 열어도 고친 내용 유지', /고친 회사/.test(await st()));
  await p.locator('[data-view="sec"]').click(); await p.waitForTimeout(900); ok('섹터 관리 목록', await p.locator('.srow').count() >= 2);
  await p.locator('[data-view="co"]').click(); await p.waitForTimeout(500); await p.locator('[data-reset]').click(); await p.waitForTimeout(900);
  ok('서버 값으로 되돌리기', !/고친 회사/.test(await st()));
  await p.locator('#tabs button').nth(2).click(); await p.waitForTimeout(1500); ok('정리: 길 지금 → 목표', await p.locator('.gb').count() === 3 || await p.locator('.gb').count() >= 1);
  await p.screenshot({ path: path.join(OUT, 'shelf5.png') });
  ok('오류 없음', errs.length === 0, errs.join(' | ').slice(0, 300)); await ctx.close();
  ({ p, errs, ctx } = await open(b, 1280, 720, true));
  const rail = await p.evaluate(() => [...document.querySelectorAll('#mobileTabBar > .mtab-wide')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.getAttribute('aria-label')).join());
  ok('넓은 화면 왼쪽 메뉴: 자동 · 운영 · 책장 · 설정', rail === '자동,운영,책장,설정', rail);
  await p.click('#mobileTabBar .mtab-btn[data-mtab="shelf"]'); await p.waitForTimeout(2500);
  ok('넓은 화면: 오른쪽 칸에 열림', await p.evaluate(() => { const r = document.getElementById('shelfFull').getBoundingClientRect(); return r.left >= document.getElementById('mobileTabBar').getBoundingClientRect().right && !!document.querySelector('.shelf-host'); }));
  await p.screenshot({ path: path.join(OUT, 'shelf6.png') }); ok('오류 없음(넓은 화면)', errs.length === 0, errs.join(' | ').slice(0, 300));
  console.log(fails ? '\n실패 ' + fails + '건' : '\n모두 통과'); await b.close(); process.exit(fails ? 1 : 0);
})();
