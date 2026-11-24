// 뉴스 › 일간 이슈 시험 — node tools/ui-test/news.js   (v9.01: 움직임 개편 · 일반 회원에게도 첫 탭 · 종목별 날씨 삭제)
//   서버 없이 file:// 로 열린다(URL=로 바꿀 수 있음) · CHANNEL=msedge · 지어낸 뉴스(leadGet newsDay와 같은 모양: d · t · tk · u · h · s · fx · kind)
const { chromium } = require('playwright');
const path = require('path');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'file:///' + path.resolve(__dirname, '../../index.html').split(String.fromCharCode(92)).join('/');
const OUT = process.env.OUT || path.join(__dirname, 'out');
const SETUP = role => {
  document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', role);
  const today = _kstToday(); const mk = (d, t, tk, h, s, fx) => ({ d: _gdAdd(today, d), t, tk, u: 'https://example.com/' + tk + d + t, h, s, fx, kind: '이 종목' });
  const items = [mk(0, '09:12', 'NVDA', '엔비디아, 차세대 칩 출하 일정 앞당겨', '신제품 출하가 한 분기 빨라질 전망이에요.', '좋음 · 매출 인식 시점이 빨라져요'), mk(0, '08:40', 'AAPL', '애플, 부품 공급망 일부 지연', '일부 모델의 출하가 늦어질 수 있어요.', '나쁨 · 단기 출하가 줄 수 있어요'), mk(0, '07:55', 'MSFT', '마이크로소프트, 클라우드 가격 조정 발표', '가격 구조를 바꾼다고 밝혔어요.', '중립 · 영향은 제한적이에요'),
    mk(-1, '22:10', 'TSLA', '테슬라, 신공장 가동 시기 확정', '다음 분기부터 양산에 들어가요.', '좋음 · 생산 능력이 늘어요'), mk(-1, '15:30', 'AMD', 'AMD, 데이터센터 점유율 확대', '서버용 칩 점유율이 올랐어요.', '좋음 · 점유율 상승'), mk(-1, '09:05', 'META', '메타, 광고 단가 소폭 하락', '일부 지역 단가가 내렸어요.', '나쁨 · 단기 매출 부담'),
    mk(-3, '10:00', 'INTC', '인텔, 파운드리 고객 확보 난항', '대형 고객 계약이 미뤄지고 있어요.', '나쁨 · 투자 부담이 커져요')];
  window.apiCall = async (a) => (a === 'leadGet' ? { ok: true, items } : { ok: false });
  window.__opened = []; window.openChart = tk => { window.__opened.push(tk); };
  try { _di.d = null; _di.open = {}; _di.f = 'all'; } catch (e) {}
  switchMobileTab('news');
};
async function open(b, vw, vh, role, rm) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: rm ? 'reduce' : 'no-preference' }); const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(`(${SETUP.toString()})(${JSON.stringify(role)})`); await p.waitForTimeout(rm ? 900 : 2600); return p;
}
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  for (const [role, vw, vh] of [['user', 390, 1100], ['admin', 1000, 900]]) {
    const L = (role === 'user' ? '일반 회원 ' : '관리자 ') + vw + ': ';
    const p = await open(b, vw, vh, role);
    const upd = await p.evaluate(() => { const sm = document.querySelector('#diBox .di-h small'), td = _kstToday().slice(5).replace('-', '/'); return { txt: sm ? sm.textContent : '', td }; });
    ok(L + '머리에 업데이트 시점(가장 최근 이슈의 날짜 · 시각)', upd.txt === '최근 7일 · 업데이트 ' + upd.td + ' 09:12', JSON.stringify(upd));
    const upd2 = await p.evaluate(() => { _di.at = '2026-11-23T08:10:00'; _diUpd(document.getElementById('diBox')); const a = document.querySelector('#diBox .di-h small').textContent; _di.at = ''; _diUpd(document.getElementById('diBox')); return a; });
    ok(L + '서버가 at을 주면 그 시각을 씀', upd2 === '최근 7일 · 업데이트 11/23 08:10', upd2);
    const t = await p.evaluate(() => ({ tabs: [...document.querySelectorAll('#aiSubRow .xtab-btn')].map(x => x.textContent.trim()), act: document.body.dataset.atab, mj: !!document.getElementById('mjBox'), txt: document.getElementById('macroWxCard').innerText, solo: document.getElementById('aiSubtabs').classList.contains('aq-tab-solo') }));
    ok(L + '뉴스 탭 = 일간 이슈 · 기관13F · 첫 탭이 일간 이슈', JSON.stringify(t.tabs) === JSON.stringify(['일간 이슈', '기관13F']) && t.act === 'wx' && !t.solo, JSON.stringify(t.tabs) + ' ' + t.act);
    ok(L + '「종목별 날씨」 없음(칸 · 글 모두)', !t.mj && !/종목별 날씨/.test(t.txt));
    const s0 = await p.evaluate(() => ({ items: document.querySelectorAll('#diTl .di2-it').length, op: [...document.querySelectorAll('#diTl .di2-it')].map(x => +x.style.opacity), sum: document.getElementById('diSum').innerText, selW: Math.round(parseFloat(document.getElementById('diSel').style.width)), mood: [...document.getElementById('diMood').children].map(x => Math.round(parseFloat(x.style.width))), chips: [...document.querySelectorAll('#diChips em')].map(x => x.textContent), days: document.querySelectorAll('#diStrip .di2-d').length, on: document.querySelector('#diStrip .di2-d.on').classList.contains('today'), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, ind: Math.round(parseFloat((document.querySelector('#diChips .aq-tp-ind') || { style: {} }).style.width) || 0) }));
    ok(L + '오늘 3건 · 모두 나타남 · 숫자가 끝값 · 분위기 막대 1/3씩 · 선택 원 36 · 가로 넘침 없음', s0.items === 3 && s0.op.every(o => o === 1) && /뉴스 3건 · 좋음 1 · 나쁨 1/.test(s0.sum) && s0.mood.every(m => m === 33) && s0.selW === 36 && s0.days === 7 && s0.on && s0.chips.join() === '3,0,0' && s0.sw <= s0.cw, JSON.stringify(s0));
    ok(L + '칩 알약이 앱 Tab pill로 붙음(aq-tp-ind 폭 > 20)', s0.ind > 20, String(s0.ind));
    const gap = await p.evaluate(() => { const r = e => document.querySelector(e).getBoundingClientRect(), ic = r('#diTl .di2-it:first-child .di2-ic'), tlw = r('#diTlw'), ch = r('#diChips'), sm = r('#diSum'), md = r('#diMood'); return { ringTop: Math.round(ic.top - 3 - tlw.top), chips2sum: Math.round(sm.top - ch.bottom), sum2mood: Math.round(md.top - sm.bottom), mood2tl: Math.round(tlw.top - md.bottom) }; });
    ok(L + '첫 이슈 로고 둘레 띠가 시간줄 칸 위에 안 잘림(위 여백 ≥ 0) · 칩 · 요약 · 막대 · 시간줄 사이 간격 확보', gap.ringTop >= 0 && gap.chips2sum >= 12 && gap.sum2mood >= 10 && gap.mood2tl >= 18, JSON.stringify(gap));
    await p.locator('#macroWxCard').screenshot({ path: path.join(OUT, 'news_' + vw + '_a.png') }).catch(() => {});
    // 날짜 누르기: 선택 원이 늘어나며 이동
    const dayBtn = '#diStrip .di2-d:nth-of-type(6)';   // 어제(21일 위치)
    const target = await p.evaluate(() => { const bs = [...document.querySelectorAll('#diStrip .di2-d')]; return bs[5].dataset.d; });
    await p.click('#diStrip .di2-d[data-d="' + target + '"]'); await p.waitForTimeout(70);
    const mid = await p.evaluate(() => Math.round(parseFloat(document.getElementById('diSel').style.width)));
    await p.waitForTimeout(1500);
    const s1 = await p.evaluate(() => ({ items: document.querySelectorAll('#diTl .di2-it').length, sum: document.getElementById('diSum').innerText, selW: Math.round(parseFloat(document.getElementById('diSel').style.width)), left: Math.round(parseFloat(document.getElementById('diSel').style.transform.slice(11))), btn: Math.round(document.querySelector('#diStrip .di2-d.on').offsetLeft + document.querySelector('#diStrip .di2-d.on').offsetWidth / 2 - 18), mood: [...document.getElementById('diMood').children].map(x => Math.round(parseFloat(x.style.width))) }));
    ok(L + '어제를 누르면: 이동 중 선택 원이 늘어남(폭 ' + mid + ') · 끝나면 36 · 3건(좋음 2 · 나쁨 1) · 막대 67:0:33', mid > 40 && Math.abs(s1.selW - 36) <= 1 && Math.abs(s1.left - s1.btn) <= 1 && s1.items === 3 && /뉴스 3건 · 좋음 2 · 나쁨 1/.test(s1.sum) && s1.mood.join() === '67,0,33', JSON.stringify(s1));
    // 칩: 보유 → (보유 0건) 빈 화면, 전체로
    await p.click('#diChips [data-f="held"]'); await p.waitForTimeout(900);
    ok(L + '보유 칩: 보유 종목이 없으면 "이 날은 뉴스가 없어요" · 칩 알약이 옮겨 감', await p.evaluate(() => /이 날은 뉴스가 없어요/.test(document.getElementById('diTl').innerText) && document.querySelector('#diChips .xtab-btn.active').dataset.f === 'held'));
    await p.click('#diChips [data-f="all"]'); await p.waitForTimeout(1500);
    // 펼침 + 쭈르륵
    const h0 = await p.evaluate(() => document.querySelector('#diTl .di2-it .di2-det').getBoundingClientRect().height);
    await p.click('#diTl .di2-it .di2-body'); await p.waitForTimeout(120);
    const hMid = await p.evaluate(() => document.querySelector('#diTl .di2-it .di2-det').getBoundingClientRect().height);
    await p.waitForTimeout(215);
    const part = await p.evaluate(() => { const w = [...document.querySelectorAll('#diTl .di2-it:first-child .aqw')]; return { on: w.filter(x => x.classList.contains('on')).length, total: w.length, car: !!document.querySelector('.aq-car') }; });
    await p.waitForTimeout(2200);
    const end = await p.evaluate(() => { const w = [...document.querySelectorAll('#diTl .di2-it:first-child .aqw')], d = document.querySelector('#diTl .di2-it:first-child .di2-det'); return { all: w.every(x => x.classList.contains('on')), car: !!document.querySelector('.aq-car'), auto: d.style.height, h: Math.round(d.getBoundingClientRect().height), exp: document.querySelector('#diTl .di2-it:first-child .di2-body').getAttribute('aria-expanded') }; });
    ok(L + '펼침: 높이 0 → 열림 → auto · 글이 쭈르륵(일부 → 전부) · 끝나면 커서 사라짐 · aria-expanded', h0 === 0 && hMid > 0 && part.on > 0 && part.on < part.total && part.car && end.all && !end.car && end.auto === 'auto' && end.exp === 'true' && end.h > 60, JSON.stringify([h0, Math.round(hMid), part, end]));
    await p.click('#diTl .di2-it .di2-body'); await p.waitForTimeout(1300);
    ok(L + '다시 누르면 접힘', await p.evaluate(() => Math.round(document.querySelector('#diTl .di2-it .di2-det').getBoundingClientRect().height) === 0));
    // 로고 · 종목 이름 → 종목 페이지
    await p.click('#diTl .di2-it .di2-ic'); await p.click('#diTl .di2-it .di2-tk');
    ok(L + '로고 · 종목 이름을 누르면 종목 페이지(openChart)', await p.evaluate(() => window.__opened.length === 2), await p.evaluate(() => window.__opened.join()));
    // 쓸기: 왼쪽으로 → 다음 날(오늘)
    const box = await p.locator('#diTlw').boundingBox();
    await p.mouse.move(box.x + 250, box.y + 40); await p.mouse.down(); await p.mouse.move(box.x + 170, box.y + 42, { steps: 6 });
    const drag = await p.evaluate(() => document.getElementById('diTl').style.transform);
    await p.mouse.move(box.x + 100, box.y + 42, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(1300);
    const sw = await p.evaluate(() => ({ on: document.querySelector('#diStrip .di2-d.on').classList.contains('today'), items: document.querySelectorAll('#diTl .di2-it').length }));
    ok(L + '시간줄을 왼쪽으로 쓸면 손가락을 따라오다 · 놓으면 다음 날(오늘 3건)', /translateX\(-/.test(drag) && sw.on && sw.items === 3, drag + ' → ' + JSON.stringify(sw));
    await p.mouse.move(box.x + 250, box.y + 40); await p.mouse.down(); await p.mouse.move(box.x + 225, box.y + 42, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(900);
    ok(L + '짧게 쓸면 제자리로 돌아옴(날짜 그대로)', await p.evaluate(() => document.querySelector('#diStrip .di2-d.on').classList.contains('today') && /translateX\(0/.test(document.getElementById('diTl').style.transform || 'translateX(0')));
    const fs_ = await p.evaluate(() => [...new Set([...document.querySelectorAll('#macroWxCard *')].filter(e => e.children.length === 0 && e.textContent.trim() && e.offsetParent).map(e => getComputedStyle(e).fontSize))]);
    ok(L + '글자 크기가 6단계(26/18/15/13/12/11) 안', fs_.every(s => ['26px', '18px', '15px', '13px', '12px', '11px'].includes(s)), fs_.join(','));
    ok(L + '로고 테두리는 그림자 없이 outline', await p.evaluate(() => { const e = document.querySelector('#diTl .di2-ic'); const c = getComputedStyle(e); return c.boxShadow === 'none' && c.outlineStyle === 'solid' && c.outlineWidth === '3px'; }));
    await p.context().close();
  }
  // 움직임 줄이기
  { const p = await open(b, 390, 900, 'user', true);
    ok('움직임 줄이기: 처음부터 모두 보이고 숫자 · 막대가 끝값', await p.evaluate(() => [...document.querySelectorAll('#diTl .di2-it')].every(x => +x.style.opacity === 1 || x.style.opacity === '') && /뉴스 3건/.test(document.getElementById('diSum').innerText) && Math.round(parseFloat(document.getElementById('diMood').children[0].style.width)) === 33));
    await p.click('#diTl .di2-it .di2-body'); await p.waitForTimeout(500);
    ok('움직임 줄이기: 펼치면 글이 바로 다 보임', await p.evaluate(() => [...document.querySelectorAll('#diTl .di2-it:first-child .aqw')].every(x => x.classList.contains('on')) && !document.querySelector('.aq-car')));
    await p.context().close(); }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
