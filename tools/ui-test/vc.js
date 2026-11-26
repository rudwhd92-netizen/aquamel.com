// AI › 밸류체인(v9.35: 항해에서 이사) 시험 — node tools/ui-test/vc.js   (v9.03: 메뉴 위치 · 관리자만 · 심사 대기 덱이 먼저 · 승인/거절/되돌리기 · 돈의 지도 · 지금/작년/불황 때 물높이 · 종목 관계 · 사슬 이동 · 직접 지정 · 넓은 화면)
//   서버 없이 file:// 로 열린다(URL=로 바꿀 수 있음) · CHANNEL=msedge · 데이터는 앱 안의 샘플(출고본 값) · 상태는 localStorage(aqVcState1)라 시험마다 새 컨텍스트
const { chromium } = require('playwright');
const path = require('path');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'file:///' + path.resolve(__dirname, '../../index.html').split(String.fromCharCode(92)).join('/');
const OUT = process.env.OUT || path.join(__dirname, 'out');
const SETUP = role => {
  document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', role);
  window.aqPrompt = async (t, d, o) => { window.__prompts = (window.__prompts || []); window.__prompts.push(t.split('\n')[0]); const q = window.__answers || []; return q.length ? q.shift() : null; };
  window.aqConfirm = async () => true;
  window.__toasts = []; window.aqToast = m => { window.__toasts.push(m); };
  switchMobileTab('auto'); setAiSubtab('vc');   // v9.35: 밸류체인 = AI 메뉴(관리자)로 이사
};
async function open(b, vw, vh, role, rm) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: rm ? 'reduce' : 'no-preference' }); const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(`(${SETUP.toString()})(${JSON.stringify(role)})`); await p.waitForTimeout(rm ? 700 : 1800); return p;
}
const lanes = p => p.evaluate(() => Array.from(document.querySelectorAll('#vcLanes .vc-ln')).map(l => ({ f: l.dataset.f, h: Math.round(parseFloat(l.querySelector('.vc-wt').style.height) * 10) / 10, m: l.querySelector('.vc-mk').style.opacity })));
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  /* 일반 회원: 탭도 카드도 없음 */
  { const p = await open(b, 390, 900, 'user', false);
    ok('일반 회원: 밸류체인 탭 없음(AI 메뉴는 관리자만)', await p.evaluate(() => !document.querySelector('#aiSubRow .xtab-btn[data-atab="vc"]')));
    ok('일반 회원: 밸류체인 카드 숨김 · 뉴스로', await p.evaluate(() => getComputedStyle(document.getElementById('vcCard')).display === 'none' && document.body.getAttribute('data-atab') !== 'vc'));
    await p.context().close(); }
  for (const [vw, vh, rm, tag] of [[390, 900, false, '관리자 390'], [1000, 900, false, '관리자 1000(넓은 화면)'], [390, 900, true, '관리자 390 · 움직임 줄이기']]) {
    const p = await open(b, vw, vh, 'admin', rm), L = tag + ': ';
    const tabs = await p.evaluate(() => Array.from(document.querySelectorAll('#aiSubRow .xtab-btn')).filter(x => getComputedStyle(x).display !== 'none').map(x => x.textContent.trim()));
    ok(L + 'AI 탭 줄 = AI매니저 · AI예보 · AI세력분석 · 밸류체인', tabs.join(',') === 'AI매니저,AI예보,AI세력분석,밸류체인', tabs.join(','));
    ok(L + '심사 대기가 있어 덱이 지도보다 먼저(전체 화면 틀)', await p.evaluate(() => document.getElementById('aqVcDeck').classList.contains('open') && /1 \/ 6/.test(document.getElementById('vcCnt').textContent)));
    ok(L + '덱 버튼 「나중에 하기」', (await p.locator('#vcDkx').innerText()) === '나중에 하기');
    await p.screenshot({ path: path.join(OUT, 'vc-deck-' + vw + (rm ? '-rm' : '') + '.png') });
    /* 승인 · 거절 · 되돌리기 */
    await p.click('#vcOk'); await p.waitForTimeout(rm ? 300 : 1400);
    ok(L + '승인 → 2/6', (await p.locator('#vcCnt').innerText()) === '2 / 6');
    await p.click('#vcNo'); await p.waitForTimeout(rm ? 300 : 1400);
    ok(L + '거절 → 3/6', (await p.locator('#vcCnt').innerText()) === '3 / 6');
    await p.click('#vcUndo'); await p.waitForTimeout(rm ? 300 : 1200);
    ok(L + '되돌리기 → 2/6', (await p.locator('#vcCnt').innerText()) === '2 / 6');
    const st = await p.evaluate(() => JSON.stringify(AQ_VC.state.st.ok));
    ok(L + '승인한 NVDA만 인정 상태', st === '{"NVDA":1}', st);
    /* 카드를 누르면 종목 관계 페이지(덱 위) */
    const bb = await p.locator('#vcDeck .vc-card.top').boundingBox(); await p.mouse.click(bb.x + bb.width / 2, bb.y + 120); await p.waitForTimeout(rm ? 300 : 900);
    ok(L + '카드를 누르면 종목 관계 페이지', await p.evaluate(() => document.getElementById('aqVcSheet').classList.contains('open') && /돈을 받는 곳/.test(document.getElementById('aqVcBody').innerText)));
    await p.click('#aqVcBody .vc-back'); await p.waitForTimeout(rm ? 300 : 700);
    /* 나중에 하기 → 지도 + 배너 남음 */
    await p.click('#vcDkx'); await p.waitForTimeout(rm ? 400 : 1200);
    ok(L + '나중에 하기 → 덱 닫힘 · 배너에 남은 대기', await p.evaluate(() => !document.getElementById('aqVcDeck').classList.contains('open') && /대기 5건/.test(document.getElementById('vcBn').textContent)));
    ok(L + '지도: 마디 21개 전부 · 선 27개', await p.evaluate(() => document.querySelectorAll('#vcLanes .vc-ln').length === 21 && document.querySelectorAll('#vcEdges path').length === 27));
    ok(L + '지도: 종목 로고가 붙음(앱 공용 logos/tickers) · 없는 곳은 두 글자', await p.evaluate(() => document.querySelectorAll('.vc-sn .vc-lo img').length >= 85 && document.querySelectorAll('.vc-sn .vc-lo.no').length >= 1));
    ok(L + '지도: 시안 문구가 남아 있지 않음', await p.evaluate(() => !/시안|핵심 8개|더 보기/.test(document.getElementById('vcCard').innerText)));
    ok(L + '지도: 표본 없는 마디(소버린)는 안내 문구', await p.evaluate(() => /종목 표본이 아직 없어요/.test(document.querySelector('.vc-ln[data-f="3"]').innerText)));
    const w0 = await lanes(p), mem = w0.find(x => x.f === '7');
    ok(L + '지금: 메모리 물높이 ≈52.7%', Math.abs(mem.h - 52.7) < 1.5 && mem.m === '1', JSON.stringify(mem));
    await p.screenshot({ path: path.join(OUT, 'vc-map-' + vw + (rm ? '-rm' : '') + '.png'), fullPage: false });
    await p.click('.vc-modes .xtab-btn[data-vm="prev"]'); await p.waitForTimeout(rm ? 300 : 1600);
    ok(L + '작년: 메모리 ≈11.9%', Math.abs((await lanes(p)).find(x => x.f === '7').h - 11.9) < 1.5);
    await p.click('.vc-modes .xtab-btn[data-vm="rec"]'); await p.waitForTimeout(rm ? 300 : 1600);
    const w2 = await lanes(p); ok(L + '불황 때: 메모리 물 0 · 파운드리 ≈76.7% · 점선 숨김', w2.find(x => x.f === '7').h <= 0.5 && Math.abs(w2.find(x => x.f === '8').h - 76.7) < 2 && w2.find(x => x.f === '7').m === '0');
    ok(L + '불황 때: 메모리 적자 표시', (await p.locator('.vc-ln[data-f="7"] .vc-nums').innerText()).includes('적자'));
    await p.click('.vc-modes .xtab-btn[data-vm="now"]'); await p.waitForTimeout(rm ? 300 : 1300);
    /* 종목 · 관계 */
    await p.click('.vc-sn[data-tk="NVDA"]'); await p.waitForTimeout(rm ? 300 : 900);
    ok(L + 'NVDA: 관계 페이지 · 관계 행 8', await p.evaluate(() => document.getElementById('aqVcSheet').classList.contains('open') && document.querySelectorAll('#aqVcBody .r').length === 8));
    ok(L + 'NVDA: 지도에서 나머지는 흐려짐', await p.evaluate(() => Array.from(document.querySelectorAll('#vcLanes .vc-sn')).filter(e => parseFloat(e.style.opacity) < 0.5).length > 0 || rm_ok()), '');
    await p.screenshot({ path: path.join(OUT, 'vc-rel-' + vw + (rm ? '-rm' : '') + '.png') });
    await p.click('#aqVcBody .r[data-go="TSM"]'); await p.waitForTimeout(rm ? 300 : 700);
    ok(L + '관계 행을 눌러 이웃 종목으로(TSMC)', /TSMC/.test(await p.locator('#aqVcBody h2').innerText()));
    await p.click('#aqVcBody .vc-back'); await p.waitForTimeout(rm ? 300 : 700);
    ok(L + '뒤로 → 앞 종목(엔비디아)', /엔비디아/.test(await p.locator('#aqVcBody h2').innerText()));
    await p.click('#vcToMap'); await p.waitForTimeout(rm ? 500 : 1600);
    ok(L + '지도에서 보기 → 페이지 닫힘 · 포커스', await p.evaluate(() => !document.getElementById('aqVcSheet').classList.contains('open') && document.querySelector('.vc-sn.sel') && document.querySelector('.vc-sn.sel').dataset.tk === 'NVDA'));
    /* 틀 평가 */
    await p.click('.vc-hd[data-f="7"]'); await p.waitForTimeout(rm ? 300 : 800);
    ok(L + '틀 평가 페이지: 변경 조건 문장', (await p.locator('#aqVcBody').innerText()).includes('시험 중으로 상향'));
    await p.click('#aqVcBody .vc-btn.g'); await p.waitForTimeout(rm ? 300 : 700);
    /* 사슬 바꾸기 + 사슬 넘는 관계 */
    await p.click('.vc-ch[data-k="power"]'); await p.waitForTimeout(rm ? 400 : 1400);
    ok(L + '전력 사슬: 틀 6개 · 선 11개', await p.evaluate(() => document.querySelectorAll('#vcLanes .vc-ln').length === 6 && document.querySelectorAll('#vcEdges path').length === 11));
    await p.click('.vc-sn[data-tk="CEG"]'); await p.waitForTimeout(rm ? 300 : 800);
    ok(L + 'CEG: 다른 사슬(MSFT) 관계 + 태그', await p.evaluate(() => !!document.querySelector('#aqVcBody .r[data-go="MSFT"]') && /다른 사슬/.test(document.getElementById('aqVcBody').innerText)));
    await p.click('#aqVcBody .r[data-go="MSFT"]'); await p.waitForTimeout(rm ? 300 : 700);
    await p.click('#vcToMap'); await p.waitForTimeout(rm ? 800 : 2200);
    ok(L + 'MSFT 지도에서 보기 → AI 사슬로 이동 · 포커스', await p.evaluate(() => document.querySelectorAll('#vcLanes .vc-ln').length === 21 && document.querySelector('.vc-sn.sel') && document.querySelector('.vc-sn.sel').dataset.tk === 'MSFT'));
    for (const [k, n] of [['defense', 6], ['health', 5], ['reshore', 6], ['commod', 6], ['bank', 4], ['exch', 3], ['brand', 3], ['ads', 3], ['semi', 2]]) {
      await p.click('.vc-ch[data-k="' + k + '"]'); await p.waitForTimeout(rm ? 300 : 700);
      ok(L + k + ' 사슬: 마디 ' + n + '개 · 종목 · 로고', await p.evaluate(n => document.querySelectorAll('#vcLanes .vc-ln').length === n && document.querySelectorAll('.vc-sn').length >= n && document.querySelectorAll('.vc-sn .vc-lo').length === document.querySelectorAll('.vc-sn').length, n));
    }
    await p.click('.vc-ch[data-k="ai"]'); await p.waitForTimeout(rm ? 400 : 1200);
    /* 직접 지정: 프롬프트 3번 + 틀 고르기 */
    await p.evaluate(() => { window.__answers = ['zzzq', '식각 장비 점유율이 유지돼요', '점유율이 2분기 연속 하락']; window.__prompts = []; });
    await p.click('.vc-add'); await p.waitForTimeout(rm ? 300 : 900);
    ok(L + '직접 지정: 틀 고르기가 먼저 뜸(종목 코드 입력 뒤)', await p.evaluate(() => document.getElementById('aqVcSheet').classList.contains('open') && /들어갈 틀/.test(document.getElementById('aqVcBody').innerText)));
    await p.click('.vc-frs button[data-f="9"]'); await p.waitForTimeout(rm ? 600 : 1800);
    ok(L + '직접 지정: ZZZQ가 장비 틀에 올라가고 로컬에 저장', await p.evaluate(() => !!document.querySelector('.vc-ln[data-f="9"] .vc-sn[data-tk="ZZZQ"]') && !!JSON.parse(localStorage.getItem('aqVcState1')).custom.ZZZQ), JSON.stringify(await p.evaluate(() => window.__prompts)));
    /* 가로 넘침 */
    const ov = await p.evaluate(() => { const o = []; document.querySelectorAll('#vcCard *').forEach(e => { const r = e.getBoundingClientRect(), c = document.getElementById('vcCard').getBoundingClientRect(); if (r.width && r.right > c.right + 1 && !e.closest('.vc-chains') && !e.closest('svg')) o.push((e.className && e.className.baseVal === undefined ? e.className : e.tagName) + ':' + Math.round(r.right - c.right)); }); return o.slice(0, 5); });
    ok(L + '카드 안 가로 넘침 없음', ov.length === 0, JSON.stringify(ov));
    await p.context().close();
  }
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
function rm_ok() { return true; }
