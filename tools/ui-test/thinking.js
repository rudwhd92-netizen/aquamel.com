// 로딩 문구 Thinking text 시험 — node tools/ui-test/thinking.js   (v8.93: 문구 자리 표식(.aq-tt)이 화면에 붙으면 돌고 · 문구가 바뀌고 · 데이터로 교체되면 바로 정리 · 안 보이는 자리는 시작 안 함 · 움직임 줄이기 · .aq-think 그라데이션 없음)
//   서버 없이 file:// 로 열린다(URL=로 바꿀 수 있음) · CHANNEL=msedge
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'file:///' + path.resolve(__dirname, '../../index.html').replace(/\\/g, '/');
async function open(b, opt) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: 420, height: 800 } }, opt || {})); const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'));
  await p.evaluate(() => { const d = document.createElement('div'); d.id = 'ttBox'; d.style.cssText = 'position:fixed;left:0;top:0;width:400px;z-index:99999;background:#161618;color:#d4d4d4;padding:20px;font-size:15px'; document.body.appendChild(d); const h = document.createElement('div'); h.id = 'ttHid'; h.style.cssText = 'display:none'; document.body.appendChild(h); });
  return p;
}
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let p = await open(b);
  const base = await p.evaluate(() => window.AQ_TT_LIVE());   // file:// 에서는 데이터가 안 와서 앱 자체 로딩 자리 몇 곳이 이미 돎 — 아래는 이 기준값과의 차이로 셈
  console.log('  (앱 자체가 돌리는 로딩 자리 ' + base + '곳 — 기준값)');
  const L = () => p.evaluate(b0 => window.AQ_TT_LIVE() - b0, base);
  // 1) 동적으로 붙임 — 일반 · 피드 · AI리포트 · 일정
  await p.evaluate(() => { document.getElementById('ttBox').innerHTML = ['init', 'feed', 'rpt', 'cal'].map(k => '<div class="mg-empty"><span class="aq-tt" data-tt="' + k + '">불러오는 중…</span></div>').join(''); });
  await p.waitForTimeout(700);
  const s1 = await p.evaluate(() => ({ live: window.AQ_TT_LIVE(), on: document.querySelectorAll('#ttBox .aq-tt-on').length, letters: document.querySelectorAll('#ttBox .tt-c').length, txt: [...document.querySelectorAll('#ttBox .tt-w:not(.out)')].map(e => e.textContent.replace(/ /g, ' ')) }));
  ok('4개가 모두 돌기 시작 · 글자 단위로 그림', s1.on === 4 && s1.letters > 40, JSON.stringify(s1));
  ok('영역별 문구 세트(초기 · 피드 · AI리포트 · 일정)', /실시간 데이터/.test(s1.txt[0]) && /신호를 모으고/.test(s1.txt[1]) && /보고서를 불러오고/.test(s1.txt[2]) && /일정을 불러오고/.test(s1.txt[3]), s1.txt.join(' | '));
  await p.waitForTimeout(1300);   // 첫 문구 뒤 약 2초 — 두 번째 문구(1.5초에 바뀌고 3초에 세 번째로)
  const s2 = await p.evaluate(() => [...document.querySelectorAll('#ttBox .tt-w:not(.out)')].map(e => e.textContent.replace(/ /g, ' ')));
  ok('1.5초 뒤 문구가 다음 것으로 바뀜', s2.every((t, i) => t !== s1.txt[i]), s2.join(' | '));
  await p.screenshot({ path: path.join(OUT, 'thinking_b.png'), clip: { x: 0, y: 0, width: 420, height: 200 } });
  // 2) 데이터 도착 → 즉시 정리
  await p.evaluate(() => { document.getElementById('ttBox').innerHTML = '<div>데이터가 도착했어요</div>'; });
  await p.waitForTimeout(250);
  ok('데이터로 교체되면 0.25초 안에 전부 정리(새는 것 0 · 상자 안 0)', (await p.evaluate(() => window.AQ_TT_LIVE(true))) === 0 && (await p.evaluate(() => document.querySelectorAll('#ttBox .aq-tt-on').length)) === 0);
  // 3) 안 보이는 자리는 시작하지 않음
  await p.evaluate(() => { document.getElementById('ttHid').innerHTML = '<span class="aq-tt" data-tt="feed">로딩 중…</span>'; }); await p.waitForTimeout(400);
  const hid = await p.evaluate(() => ({ on: document.querySelector('#ttHid .aq-tt').classList.contains('aq-tt-on'), txt: document.querySelector('#ttHid .aq-tt').textContent }));
  ok('숨겨진 자리는 시작 안 함(문구 그대로)', !hid.on && hid.txt === '로딩 중…', JSON.stringify(hid));
  // 4) 도는 중에 다 바꿔도 새 것이 이어서 돎 · 10번 반복해도 새지 않음
  for (let i = 0; i < 10; i++) { await p.evaluate(() => { document.getElementById('ttBox').innerHTML = '<div><span class="aq-tt" data-tt="feed">로딩 중…</span></div>'; }); await p.waitForTimeout(60); }
  await p.evaluate(() => { document.getElementById('ttBox').innerHTML = ''; }); await p.waitForTimeout(300);
  ok('10번 붙였다 떼도 새는 것 0', (await p.evaluate(() => window.AQ_TT_LIVE(true))) === 0 && (await p.evaluate(() => document.querySelectorAll('#ttBox .aq-tt-on').length)) === 0);
  // 5) 그라데이션 없음
  const th = await p.evaluate(() => { const e = document.createElement('span'); e.className = 'aq-think'; e.textContent = 'x'; document.body.appendChild(e); const c = getComputedStyle(e); const r = { bg: c.backgroundImage, an: c.animationName }; e.remove(); return r; });
  ok('.aq-think 그라데이션 없음', th.bg === 'none', JSON.stringify(th));
  await p.context().close();
  // 6) 움직임 줄이기
  p = await open(b, { reducedMotion: 'reduce' }); const baseRm = await p.evaluate(() => window.AQ_TT_LIVE());
  await p.evaluate(() => { document.getElementById('ttBox').innerHTML = '<div><span class="aq-tt" data-tt="feed">로딩 중…</span></div>'; }); await p.waitForTimeout(400);
  const rm = await p.evaluate(() => ({ on: document.querySelectorAll('#ttBox .aq-tt-on').length, letters: document.querySelectorAll('#ttBox .tt-c').length, dots: document.querySelectorAll('#ttBox .tt-dots').length, txt: document.querySelector('#ttBox .tt-w').textContent }));
  ok('움직임 줄이기: 글자 떠오름 · 점 없이 문구만', rm.on === 1 && rm.letters === 0 && rm.dots === 0 && /신호를 모으고/.test(rm.txt), JSON.stringify(rm));
  await p.evaluate(() => { document.getElementById('ttBox').innerHTML = ''; }); await p.waitForTimeout(300);
  ok('움직임 줄이기: 끝나면 새는 것 0', (await p.evaluate(() => window.AQ_TT_LIVE(true))) === 0);
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
