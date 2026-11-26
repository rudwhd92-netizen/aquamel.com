// 기능 다이어트 시험 — node tools/ui-test/diet.js   (v8.75: 일정 › 주간 일정 · AI 비서 / 뉴스 › AI 브리핑 · 주간 이슈 삭제)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const GONE_FN = ['aqGuideRender', '_aqGuideRenderPart', 'aqAsgBadge', '_gdIsAsg', 'aqDailyBriefRender', 'aqBriefRender', 'aqBriefMaybeLand', 'aqBriefMode', 'aqBriefDismiss', 'aqMacroRender', '_mcLoad', '_bnLoad', 'aqSchedSub'];
const GONE_ID = ['schedSubtabs', 'guideCard', 'assistCard', 'briefCard', 'preCard', 'closeCard', 'guideBody', 'assistBody', 'briefBody', 'asgBadge'];
async function prep(b, role, opts) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, opts || {})); const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR(' + role + ') ' + e.message); fails++; });
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR|favicon|manifest|fonts\.g|CORS policy|아카이브 로드 실패/i.test(m.text())) { console.log('CONSOLE.ERROR(' + role + ') ' + m.text().slice(0, 160)); fails++; } });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(role => { document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', role); document.body.setAttribute('data-broker', 'linked'); try { _aqAuth.user = { role, username: 'u' }; } catch (e) {} window.apiCall = async () => ({ ok: false }); }, role);
  return p;
}
const tabs = (p, sel) => p.evaluate(sel => Array.from(document.querySelectorAll(sel + ' .xtab-btn')).filter(b => b.offsetWidth > 0).map(b => b.textContent.trim()), sel);
const shown = p => p.evaluate(() => Array.from(document.querySelectorAll('section.card')).filter(c => { const r = c.getBoundingClientRect(); return r.height > 8 && getComputedStyle(c).display !== 'none' && getComputedStyle(c).visibility !== 'hidden'; }).map(c => c.id || c.className.split(' ')[0]));
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let p = await prep(b, 'admin');
  // 1) 지워진 것: 함수 · HTML id
  const gone = await p.evaluate(([fns, ids]) => ({ fn: fns.filter(f => typeof window[f] !== 'undefined'), id: ids.filter(i => document.getElementById(i)) }), [GONE_FN, GONE_ID]);
  ok('지운 함수가 하나도 안 남음', gone.fn.length === 0, gone.fn.join(',') || '13개 모두 없음');
  ok('지운 카드 · 탭 줄이 HTML에 없음', gone.id.length === 0, gone.id.join(',') || '10개 id 모두 없음');
  ok('주간 이슈(macroCard data-atab=macro) 카드 없음 · 거시 지표 카드(explore)는 그대로', await p.evaluate(() => !document.querySelector('section[data-atab="macro"]') && !!document.getElementById('macroCard')));

  // 2) 일정 — 월간 일정만 · 탭 줄 없음 · 빈 화면 아님
  await p.evaluate(() => switchMobileTab('schedule')); await p.waitForTimeout(1500);
  const sch = await p.evaluate(() => ({ mtab: document.body.dataset.mtab, rows: document.querySelectorAll('#setSchedRow, .xtab-row[data-ssub]').length, cal: !!document.querySelector('#scheduleCard, #majorEventsCard'), text: (document.querySelector('#scheduleCard') || {}).innerText ? document.querySelector('#scheduleCard').innerText.length : 0 }));
  ok('일정: 열림 · 탭 줄(월간/주간/AI 비서) 없음', sch.mtab === 'schedule' && sch.rows === 0 && !(await p.evaluate(() => document.querySelector('[data-ssub]'))), JSON.stringify(sch));
  const vs = await shown(p); ok('일정: 보이는 카드가 있음(빈 화면 아님)', vs.length > 0, vs.join(','));
  await p.screenshot({ path: path.join(OUT, 'diet_schedule.png') });

  // 3) 뉴스(관리자) — 일간 이슈 + 기관 13F
  await p.evaluate(() => switchMobileTab('news')); await p.waitForTimeout(1200);
  let t = await tabs(p, '#aiSubRow'); const act = await p.evaluate(() => document.body.dataset.atab);
  ok('뉴스(관리자): 탭 = 일간 이슈 · 기관13F (AI 브리핑 · 주간 이슈 없음)', JSON.stringify(t) === JSON.stringify(['일간 이슈', '기관13F']) && act === 'wx', t.join(' · ') + ' / 열린 탭 ' + act);   // v8.84: 9체계 — 탭 이름 '기관13F'
  ok('뉴스(관리자): 탭이 2개라 줄이 보임(알약)', await p.evaluate(() => { const s = document.getElementById('aiSubtabs'); return !s.classList.contains('aq-tab-solo') && s.getBoundingClientRect().height > 20 && !!document.querySelector('#aiSubRow .aq-tp-ind'); }));
  await p.screenshot({ path: path.join(OUT, 'diet_news_admin.png') });
  await p.evaluate(() => setAiSubtab('f13')); await p.waitForTimeout(900); ok('뉴스: 기관 13F로 전환', (await p.evaluate(() => document.body.dataset.atab)) === 'f13');

  // 4) 옛 링크 · 알림 이동 — 오류 없이 제자리로
  const legacy = await p.evaluate(() => { const r = {}; for (const k of ['brief', 'macro', 'pre', 'close', 'bogus']) { try { switchMobileTab('news'); setAiSubtab(k); r[k] = document.body.dataset.atab; } catch (e) { r[k] = 'ERR ' + e.message; } }
    for (const k of ['guide', 'assist']) { try { switchMobileTab('news'); setAiSubtab(k); r[k] = document.body.dataset.mtab; } catch (e) { r[k] = 'ERR ' + e.message; } } return r; });
  ok('옛 링크 brief · macro · pre · close · 모르는 값 → 뉴스 첫 탭(일간 이슈)', ['brief', 'macro', 'pre', 'close', 'bogus'].every(k => legacy[k] === 'wx'), JSON.stringify(legacy));
  ok('옛 링크 guide · assist → 일정 메뉴', legacy.guide === 'schedule' && legacy.assist === 'schedule');
  const noti = await p.evaluate(async () => { const r = {}; _noti.items = [{ nid: 'n1', type: 'brief', read: true, market: getCurrentMarket(), mode: 'pre' }, { nid: 'n2', type: 'guide', read: true, date: '2026-11-20' }];
    for (const i of [0, 1]) { try { switchMobileTab('explore'); _notiGo(i); await new Promise(x => setTimeout(x, 900)); r[i] = document.body.dataset.mtab + (document.body.dataset.mtab === 'auto' ? '/' + document.body.dataset.atab : ''); } catch (e) { r[i] = 'ERR ' + e.message; } } return r; });
  ok('알림 brief → 뉴스(첫 탭) · guide → 일정', noti[0] === 'auto/wx' && noti[1] === 'schedule', JSON.stringify(noti));
  const dflt = await p.evaluate(() => { localStorage.setItem('aq_agrp_news', 'brief'); switchMobileTab('news'); return document.body.dataset.atab; });
  ok('저장돼 있던 마지막 탭이 brief여도 뉴스는 일간 이슈로 열림', dflt === 'wx', dflt);

  // 5) 다른 메뉴는 그대로 — 연구 · AI · 탐색 · 마이 · 설정 토큰 관리
  await p.evaluate(() => switchMobileTab('research')); await p.waitForTimeout(900); t = await tabs(p, '#aiSubRow'); ok('연구: AI리포트 · 해자근거 (종목지도 · 모의매수 · 비교분석은 탐색 · 관심으로)', JSON.stringify(t) === JSON.stringify(['AI리포트', '해자근거']), t.join(' · '));
  await p.evaluate(() => switchMobileTab('ai')); await p.waitForTimeout(900); t = await tabs(p, '#aiSubRow'); ok('AI(관리자): AI매니저 · AI예보 · AI세력분석 · 밸류체인(항해에서 이사 · v9.35)', JSON.stringify(t) === JSON.stringify(['AI매니저', 'AI예보', 'AI세력분석', '밸류체인']), t.join(' · '));
  await p.evaluate(() => switchMobileTab('explore')); await p.waitForTimeout(900); ok('탐색 페이지: 탭 줄 5칸(섹터동향 · 종목리스트 · 내부자 매수 · 밸런스 종목 · V시그널 · v9.35)', (await tabs(p, '#exploreSubtabs')).length === 5);
  await p.evaluate(() => switchMobileTab('board')); await p.waitForTimeout(900); ok('마이: 실시간 현황 · 포트폴리오 · 누적 성과 · 운영 통계 (포트폴리오가 항해에서 이사 · v9.35)', (await tabs(p, '#boardSubtabs')).length === 4);
  await p.evaluate(() => { switchMobileTab('settings'); }); await p.waitForTimeout(900); ok('설정: 토큰 관리 행 그대로', await p.evaluate(() => Array.from(document.querySelectorAll('.set-row .sr-l')).some(e => e.textContent.trim() === '토큰 관리')));
  await p.close();

  // 6) 일반 사용자 — 뉴스는 기관 13F 하나 · 탭 줄 숨김 · 빈 화면 아님
  p = await prep(b, 'user'); await p.evaluate(() => switchMobileTab('news')); await p.waitForTimeout(1500);
  t = await p.evaluate(() => Array.from(document.querySelectorAll('#aiSubRow .xtab-btn')).map(b => b.textContent.trim())); const solo = await p.evaluate(() => ({ atab: document.body.dataset.atab, hidden: document.getElementById('aiSubtabs').classList.contains('aq-tab-solo') && getComputedStyle(document.getElementById('aiSubtabs')).display === 'none' }));
  ok('뉴스(일반): 일간 이슈 · 기관13F 두 탭 · 첫 탭 = 일간 이슈 · 탭 줄이 보임(v9.01: 일반 회원에게도 일간 이슈)', t.length === 2 && t[0] === '일간 이슈' && t[1] === '기관13F' && solo.atab === 'wx' && !solo.hidden, JSON.stringify(solo) + ' ' + t.join(','));
  const vs2 = await shown(p); ok('뉴스(일반): 보이는 카드가 있음(빈 화면 아님)', vs2.includes('macroWxCard'), vs2.join(','));
  await p.screenshot({ path: path.join(OUT, 'diet_news_user.png') });
  const leg2 = await p.evaluate(() => { const r = {}; for (const k of ['wx', 'brief', 'macro', 'manager', 'fc']) { setAiSubtab(k); r[k] = document.body.dataset.atab; } return r; });
  ok('일반: 브리핑 · 주간 이슈 · AI 링크 → 모두 뉴스 첫 탭(일간 이슈) · 일간 이슈는 그대로', Object.values(leg2).every(v => v === 'wx'), JSON.stringify(leg2)); await p.close();

  console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); console.log('캡처:', OUT); await b.close(); process.exit(fails ? 1 : 0);
})();
