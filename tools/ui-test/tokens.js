// 토큰 관리 화면 시험 — node tools/ui-test/tokens.js   (가짜 서버 · 지어낸 시험 값 — 실제 계정 값 아님)
//   앱을 먼저 띄운다: python3 -m http.server 8773 &   · CHANNEL=msedge 로 설치된 브라우저를 쓸 수 있다
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const NOW = () => Math.floor(Date.now() / 1000);
async function prep(b, opts) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }, opts || {})); const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(() => {
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin'); try { _aqAuth.user = { role: 'admin', username: 'adm' }; } catch (e) {}
    const now = Math.floor(Date.now() / 1000); window.__calls = [];
    window.__state = { ok: true, now, items: [   // 시험용 값 (지어냄)
      { acct: 'a1a1a1a1a1a1a1a1', provider: 'claude', alias: '시험 계정 가', plan: 'max_5x', src: 'auto', five: { used: 28, resets: now + 7800, at: now - 60 }, seven: { used: 59, resets: now + 3 * 86400, at: now - 60 }, seen: now - 60 },
      { acct: 'b2b2b2b2b2b2b2b2', provider: 'claude', alias: '시험 계정 나', plan: 'pro', src: 'auto', five: { used: 90, resets: now - 3600, at: now - 30 * 3600 }, seven: { used: 36, resets: now + 5 * 86400, at: now - 30 * 3600 }, seen: now - 30 * 3600 },
      { acct: 'c3c3c3c3c3c3c3c3', provider: 'claude', alias: '시험 계정 다', plan: 'pro', src: 'auto', five: { used: 92, resets: now + 2400, at: now - 3600 }, seven: { used: 88, resets: now + 2 * 86400, at: now - 3600 }, seen: now - 3600 },
      { acct: 'manual_gemini', provider: 'gemini', alias: 'Gemini', plan: '', src: 'manual', five: { used: 36, resets: null, at: now - 7200 }, seven: null, seen: now - 7200 },
    ], collectors: [{ id: 'abcd1234', label: '시험 PC', created: now - 86400, last: now - 120 }] };
    window.apiCall = async (a, p) => { window.__calls.push([a, p]); if (a === 'tokenState') return JSON.parse(JSON.stringify(window.__state)); if (a === 'tokenKeyCreate') return { ok: true, key: 'aqtk_TEST_ONLY', label: p.label }; return { ok: true }; };
    window.__ans = []; window.aqPrompt = async () => (window.__ans.length ? window.__ans.shift() : null); window.aqConfirm = async () => true; window.aqToast = () => {};
    try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { window.__clip = t; } }, configurable: true }); } catch (e) {}
  });
  return p;
}
const num = p => p.evaluate(() => document.getElementById('tkNum').textContent);
const bar = (p, id) => p.evaluate(id => parseFloat(document.getElementById(id).style.width), id);

(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  let p = await prep(b);
  // 1) 설정 목록: 계정 관리 바로 아래
  await p.evaluate(() => switchMobileTab('settings')); await p.waitForTimeout(1200);
  const rows = await p.evaluate(() => Array.from(document.querySelectorAll('.set-row .sr-l')).map(e => e.textContent.trim()));
  const ia = rows.indexOf('계정 관리');
  ok('설정 > 관리자: 계정 관리 바로 아래 토큰 관리', ia >= 0 && rows[ia + 1] === '토큰 관리', rows.slice(ia, ia + 3).join(' → '));
  ok('설정 행에 계정 수가 보임', (await p.evaluate(() => document.getElementById('setTokVal').textContent)) === '4개 계정');
  await p.screenshot({ path: path.join(OUT, 'tokens_0_settings.png') });

  // 2) 페이지 열기 · 첫 계정이 큰 숫자
  await p.evaluate(() => aqTokOpen()); await p.waitForTimeout(1800);
  ok('페이지가 열림', await p.evaluate(() => document.getElementById('setTokFull').classList.contains('open')));
  ok('큰 숫자 = 고른 계정 5시간 남은 % (72)', (await num(p)) === '72', await num(p));
  ok('막대 = 72 · 주간 41', Math.abs(await bar(p, 'tkB5') - 72) < 0.6 && Math.abs(await bar(p, 'tkB7') - 41) < 0.6, (await bar(p, 'tkB5')).toFixed(1) + ' / ' + (await bar(p, 'tkB7')).toFixed(1));
  ok('첫 행만 펼침 · 나머지는 접힘(숨김)', await p.evaluate(() => { const a = [...document.querySelectorAll('#setTokBody .tk-acc')]; return a[0].classList.contains('on') && a.slice(1).every(x => !x.classList.contains('on') && getComputedStyle(x.querySelector('.tk-pan > div')).visibility === 'hidden'); }));
  await p.screenshot({ path: path.join(OUT, 'tokens_1_open.png') });

  // 3) 초기화 시각이 지난 계정은 100%, 마지막 확인값 딱지
  await p.click('#setTokBody .tk-acc[data-i="1"] .tk-row'); await p.waitForTimeout(1600);
  ok('초기화 지난 5시간 = 100% 로 표시', (await num(p)) === '100', await num(p));
  const det = await p.evaluate(() => document.querySelector('#setTokBody .tk-acc.on .tk-det').innerText);
  ok('"초기화됨" · "마지막 확인값" · 주간 64%', det.includes('초기화됨') && det.includes('마지막 확인값') && det.includes('주간 남음 64%'), det.replace(/\n+/g, ' | '));
  await p.screenshot({ path: path.join(OUT, 'tokens_2_reset.png') });

  // 4) 15% 이하는 빨강(위험) — 8%
  await p.click('#setTokBody .tk-acc[data-i="2"] .tk-row'); await p.waitForTimeout(1600);
  const red = await p.evaluate(() => { const bigLow = document.getElementById('tkBig').classList.contains('low'); const rowLow = document.querySelector('#setTokBody .tk-acc[data-i="2"] .tk-pc').classList.contains('low'); const c = getComputedStyle(document.querySelector('#tkBig .tk-n')).color; return { bigLow, rowLow, c }; });
  ok('8% 는 빨강 (큰 숫자 · 행 모두)', (await num(p)) === '8' && red.bigLow && red.rowLow && red.c === 'rgb(255, 107, 107)', JSON.stringify(red));
  await p.screenshot({ path: path.join(OUT, 'tokens_3_low.png') });

  // 5) 직접 입력(Gemini) — 주간 없음 '—'
  await p.click('#setTokBody .tk-acc[data-i="3"] .tk-row'); await p.waitForTimeout(1600);
  const d3 = await p.evaluate(() => document.querySelector('#setTokBody .tk-acc.on .tk-det').innerText);
  ok('직접 입력: 64% · 주간 — · "직접 입력" 딱지', (await num(p)) === '64' && d3.includes('주간 —') && d3.includes('직접 입력'), d3.replace(/\n+/g, ' | '));

  // 6) 동작: 이름 바꾸기 · 지우기 · 직접 입력 · 수집기 연결 · 수집기 지우기
  await p.evaluate(() => { window.__ans = ['개인']; }); await p.evaluate(() => aqTokRename('a1a1a1a1a1a1a1a1')); await p.waitForTimeout(300);
  let calls = await p.evaluate(() => window.__calls.filter(c => c[0] !== 'tokenState'));
  ok('이름 바꾸기 → tokenAlias(acct · alias)', calls.some(c => c[0] === 'tokenAlias' && c[1].acct === 'a1a1a1a1a1a1a1a1' && c[1].alias === '개인'), JSON.stringify(calls.slice(-1)));
  await p.evaluate(() => aqTokRemove('b2b2b2b2b2b2b2b2')); await p.waitForTimeout(300);
  calls = await p.evaluate(() => window.__calls.filter(c => c[0] !== 'tokenState')); ok('지우기 → tokenRemove', calls.some(c => c[0] === 'tokenRemove' && c[1].acct === 'b2b2b2b2b2b2b2b2'));
  await p.evaluate(() => { window.__ans = ['40', '70']; }); await p.evaluate(() => aqTokManual('codex')); await p.waitForTimeout(300);
  calls = await p.evaluate(() => window.__calls.filter(c => c[0] !== 'tokenState')); ok('직접 입력 → tokenManual(남은 %)', calls.some(c => c[0] === 'tokenManual' && c[1].provider === 'codex' && c[1].five_left === '40' && c[1].seven_left === '70'));
  await p.evaluate(() => { window.__ans = ['회사', '35', '60']; }); await p.evaluate(() => aqTokManual('claude')); await p.waitForTimeout(300);
  calls = await p.evaluate(() => window.__calls.filter(c => c[0] !== 'tokenState')); ok('Claude 직접 입력(Team 등) → tokenManual(이름 · 남은 %)', calls.some(c => c[0] === 'tokenManual' && c[1].provider === 'claude' && c[1].alias === '회사' && c[1].five_left === '35' && c[1].seven_left === '60'));
  ok('직접 입력 버튼 3개(Claude · Gemini · Codex)', await p.evaluate(() => [...document.querySelectorAll('#setTokBody .tk-sec')].pop().querySelectorAll('button').length === 3));
  await p.evaluate(() => { window.__ans = ['회사 PC']; }); await p.evaluate(() => aqTokKeyNew()); await p.waitForTimeout(300);
  calls = await p.evaluate(() => window.__calls.filter(c => c[0] !== 'tokenState')); const clip = await p.evaluate(() => window.__clip);
  ok('수집기 연결 → 키 만들고 클립보드에 복사(화면에는 안 보임)', calls.some(c => c[0] === 'tokenKeyCreate' && c[1].label === '회사 PC') && clip === 'aqtk_TEST_ONLY' && !(await p.evaluate(() => document.body.innerText.includes('aqtk_TEST_ONLY'))));
  await p.evaluate(() => aqTokKeyDel('abcd1234')); await p.waitForTimeout(300);
  calls = await p.evaluate(() => window.__calls.filter(c => c[0] !== 'tokenState')); ok('수집기 지우기 → tokenKeyRevoke', calls.some(c => c[0] === 'tokenKeyRevoke' && c[1].id === 'abcd1234'));
  await p.evaluate(() => { document.getElementById('setTokBody').scrollTop = 99999; }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, 'tokens_4_tools.png') });

  // 7) 닫기 · 빈 상태 · 서버 오류
  await p.evaluate(() => aqTokClose()); await p.waitForTimeout(500); ok('닫으면 설정으로 돌아옴', await p.evaluate(() => !document.getElementById('setTokFull').classList.contains('open')));
  await p.evaluate(() => { window.__state = { ok: true, now: Math.floor(Date.now() / 1000), items: [], collectors: [] }; _tk.d = null; aqTokOpen(); }); await p.waitForTimeout(900);
  ok('값이 없으면 안내 + 수집기 연결 버튼', await p.evaluate(() => document.getElementById('setTokBody').innerText.includes('아직 받은 한도가 없어요') && !!document.querySelector('#setTokBody button.btn')));
  await p.screenshot({ path: path.join(OUT, 'tokens_5_empty.png') });
  await p.evaluate(() => { window.apiCall = async () => ({ ok: false, error: 'admin only' }); _tk.d = null; aqTokLoad(); }); await p.waitForTimeout(500);
  ok('관리자가 아니면 안내만', await p.evaluate(() => document.getElementById('setTokBody').innerText.includes('관리자만 볼 수 있어요'))); await p.close();

  // 8) 움직임 줄이기 · 좁은 화면
  p = await prep(b, { reducedMotion: 'reduce', viewport: { width: 320, height: 760 } }); await p.evaluate(() => { aqTokOpen(); }); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__w = []; const el = document.getElementById('tkB5'); const t0 = performance.now(); (function f() { window.__w.push(parseFloat(el.style.width)); if (performance.now() - t0 < 1500) requestAnimationFrame(f); })(); document.querySelector('#setTokBody .tk-acc[data-i="2"] .tk-row').click(); }); await p.waitForTimeout(1800);
  const W = await p.evaluate(() => window.__w); const fin = W[W.length - 1];
  ok('움직임 줄이기: 막대가 튕기지 않음(목표 8을 넘어 내려가지 않음)', Math.min(...W) >= fin - 0.6 && Math.abs(fin - 8) < 0.6, `최소 ${Math.min(...W).toFixed(1)} · 끝 ${fin.toFixed(1)}`);
  ok('좁은 화면(320): 가로로 넘치지 않음', await p.evaluate(() => { const b = document.getElementById('setTokBody'); return b.scrollWidth <= b.clientWidth + 1; }));
  await p.screenshot({ path: path.join(OUT, 'tokens_6_narrow.png') }); await p.close();

  // 9) 넓은 화면(가로 2분할) — 페이지가 왼쪽 메뉴를 덮지 않고 오른쪽 칸에 열림 (DESIGN.md 4장)
  p = await prep(b, { viewport: { width: 1000, height: 700 } }); await p.evaluate(() => { try { aqWideToggle && 0; } catch (e) {} document.documentElement.classList.add('aq-wide'); aqTokOpen(); }); await p.waitForTimeout(1500);
  const wide = await p.evaluate(() => { const r = document.getElementById('setTokFull').getBoundingClientRect(); const L = getComputedStyle(document.documentElement).getPropertyValue('--aqL').trim(); return { left: Math.round(r.left), w: Math.round(r.width), L }; });
  ok('넓은 화면: 오른쪽 칸에 열림(왼쪽 메뉴를 안 덮음)', wide.left > 100 || wide.L !== '', JSON.stringify(wide)); await p.screenshot({ path: path.join(OUT, 'tokens_7_wide.png') }); await p.close();

  console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); console.log('캡처:', OUT); await b.close(); process.exit(fails ? 1 : 0);
})();
