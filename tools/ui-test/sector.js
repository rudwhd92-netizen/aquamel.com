// 항해 › 섹터동향 시험 — node tools/ui-test/sector.js   (v8.98: 한 줄 행 · Tab pill 토글 · 날짜 되감기 플레이어 · 통통 연속 기록)
//   서버 없이 file:// 로 열린다(URL=로 바꿀 수 있음) · CHANNEL=msedge · 지어낸 섹터(실제 computeSectorAnalysis 결과와 같은 모양: change · sigma · sigmaHist30(최신순) · adaptive{avg,delta})
const { chromium } = require('playwright');
const path = require('path');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const URL = process.env.URL || 'file:///' + path.resolve(__dirname, '../../index.html').split(String.fromCharCode(92)).join('/');
const OUT = process.env.OUT || path.join(__dirname, 'out');
const FAKE = () => {
  let a = 20261122; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const defs = [['🔬 반도체', '기술', 6, 0.6], ['🤖 AI 인프라', '기술', 4, 0.55], ['💻 소프트웨어', '기술', 5, -0.5], ['🛡️ 사이버보안', '기술', 3, 0.35], ['☁️ 클라우드', '기술', 0, 0], ['⚛️ 양자컴퓨팅', '기술', 2, -0.3],
    ['⚡ 전력·유틸리티', '에너지·산업', 0, 0], ['☢️ 원자력', '에너지·산업', 5, 0.5], ['🛢️ 에너지', '에너지·산업', 4, -0.6], ['🚀 방산·우주', '에너지·산업', 3, 0.4],
    ['🏦 금융', '금융·소비·헬스', 0, 0], ['💳 핀테크', '금융·소비·헬스', 0, 0], ['🩺 헬스케어', '금융·소비·헬스', 2, 0.3], ['🧬 바이오', '금융·소비·헬스', 3, -0.45], ['🛒 리테일', '금융·소비·헬스', 0, 0], ['🧴 소비재', '금융·소비·헬스', 0, 0]];
  const dates = []; const d = new Date(Date.UTC(2026, 10, 20)); while (dates.length < 30) { const w = d.getUTCDay(); if (w !== 0 && w !== 6) dates.unshift(d.toISOString().slice(0, 10)); d.setUTCDate(d.getUTCDate() - 1); }
  const m = {}, mega = {};
  defs.forEach(([k, mg, kk, bias]) => {
    let s = (rnd() - .5) * 1.4; const sg = [];
    for (let i = 0; i < 30; i++) { s = .4 * s + (rnd() - .5) * 2.3; sg.push(Math.round(Math.max(-3.3, Math.min(3.3, s + (i >= 30 - kk ? bias * 2.6 : 0))) * 10) / 10); }
    const avg = sg.slice(25).reduce((x, y) => x + y, 0) / 5, prev = sg.slice(20, 25).reduce((x, y) => x + y, 0) / 5;
    m[k] = { change: Math.round(sg[29] * 1.1 * 10) / 10 || .1, sigma: sg[29], sigmaHist30: dates.map((dt, i) => ({ date: dt, sigma: sg[i] })).reverse(), adaptive: { avg, delta: avg - prev, window: 5 }, latestDate: dates[29], tickerCount: 9 };
    mega[k.replace(/^\S+\s/, '')] = { mega: mg, n: 8 };
  });
  return { m, mega };
};
async function open(b, vw, vh, rm) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, hasTouch: false, reducedMotion: rm ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  p.on('pageerror', e => { console.log('PAGEERR ' + e.message); fails++; });
  await p.goto(URL, { timeout: 60000, waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  await p.evaluate(fake => {
    document.querySelectorAll('#aqAuth, #splashOverlay').forEach(x => x.style.display = 'none'); document.body.setAttribute('data-role', 'admin');
    window.computeSectorAnalysis = () => fake.m;
    const norm = k => String(k).replace(/^\S+\s/, '');
    window.aqSectorDef = key => fake.mega[norm(key)] || null;
    _secDef.byKey = { x: 1 };
    try { localStorage.removeItem('aq_sa_mode'); } catch (e) {}
    switchMobileTab('voyage'); setVoyageSubtab('trend'); renderSectorAnalysis();
  }, FAKE());
  await p.waitForTimeout(1600); return p;
}
const ind = (p, id) => p.evaluate(id => { const i = document.querySelector('#' + id + ' .aq-tp-ind'); return i ? { w: Math.round(parseFloat(i.style.width) || 0), t: i.style.transform } : null; }, id);
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined });
  for (const [vw, vh, wide] of [[390, 1000, false], [1000, 1000, true]]) {
    const L = (wide ? '와이드 ' : '폰 ') + vw + ': ';
    const p = await open(b, vw, vh);
    const st0 = await p.evaluate(() => ({ rows: document.querySelectorAll('#saList .sa2-r[data-sector-key]').length, sk: document.querySelectorAll('.sa-sk').length, first: [...document.querySelectorAll('#saList .sa2-nm')].slice(0, 3).map(x => x.textContent).join(','), h: Math.round(document.querySelector('#saList .sa2-r').getBoundingClientRect().height), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, old: !!document.getElementById('saBarList') || !!document.getElementById('saHeatmap'), vis: getComputedStyle(document.getElementById('sectorAnalysisCard')).display }));
    ok(L + '섹터 16개가 한 줄 행으로 · 이름에 이모지 없음 · 예전 막대/히트맵 패널 없음', st0.rows === 16 && !st0.old && !/\p{Extended_Pictographic}/u.test(st0.first), JSON.stringify(st0));
    ok(L + '행 높이 ' + (wide ? '48' : '64') + ' 이상(44 이상) · 가로 넘침 없음', st0.h >= (wide ? 48 : 64) && st0.sw <= st0.cw, st0.h + 'px');
    ok(L + '연속 기록 카드가 나오고 이모지 없음', st0.sk >= 2 && !/\p{Extended_Pictographic}/u.test(await p.evaluate(() => document.getElementById('sectorStreakScroll').textContent)), st0.sk + '장');
    const txt = await p.evaluate(() => document.getElementById('sectorAnalysisCard').innerText);
    ok(L + '카드 글에 이모지 · 영어 제목 없음', !/\p{Extended_Pictographic}/u.test(txt) && !/Custom Sectors|Cycle Analysis/.test(txt));
    const i0 = [await ind(p, 'saViewTabs'), await ind(p, 'saSortTabs')];
    ok(L + 'Tab pill 알약 2개(보기 · 정렬)가 앱 방식(aq-tp-ind)으로 붙음', i0.every(x => x && x.w > 20), JSON.stringify(i0));
    const sizes = await p.evaluate(() => [...new Set([...document.querySelectorAll('#sectorAnalysisCard *, #sectorStreakCard *')].filter(e => e.children.length === 0 && e.textContent.trim() && e.offsetParent).map(e => getComputedStyle(e).fontSize))]);
    ok(L + '글자 크기가 6단계(26/18/15/13/12/11) 안', sizes.every(s => ['26px', '18px', '15px', '13px', '12px', '11px'].includes(s)), sizes.join(','));
    if (wide) { const hdr = await p.evaluate(() => getComputedStyle(document.querySelector('.sa2-rh')).display); ok(L + '넓은 카드(640 이상)에서 열 머리 + 한 줄 펼침', hdr === 'grid', hdr); }
    await p.locator('#sectorAnalysisCard').screenshot({ path: path.join(OUT, 'sector_' + vw + '_a.png') }).catch(() => {});
    await p.locator('#sectorStreakCard').screenshot({ path: path.join(OUT, 'sector_' + vw + '_streak.png') }).catch(() => {});
    // 메가 토글: 알약이 옮겨 가고 머리글이 나옴
    await p.click('#saViewTabs [data-saview="mega"]'); await p.waitForTimeout(900);
    const i1 = await ind(p, 'saViewTabs');
    ok(L + '메가를 누르면 알약이 옮겨 감 · 메가 머리 3개', i1 && i1.t !== i0[0].t && (await p.locator('#saList .sa2-mg').count()) === 3, i0[0].t + ' → ' + (i1 && i1.t));
    await p.click('#saList .sa2-mg >> nth=0'); await p.waitForTimeout(700);
    const sub = await p.evaluate(() => document.querySelectorAll('#saList .sa2-sub').length);
    ok(L + '메가를 누르면 그 아래 섹터가 펼쳐짐', sub >= 2, sub + '개');
    await p.click('#saViewTabs [data-saview="sector"]'); await p.waitForTimeout(700);
    // 정렬: 이름 → 가나다순
    await p.click('#saSortTabs [data-sasort="name"]'); await p.waitForTimeout(700);
    const names = await p.evaluate(() => [...document.querySelectorAll('#saList .sa2-nm')].map(x => x.textContent));
    ok(L + '이름 정렬 = 가나다순', JSON.stringify(names) === JSON.stringify(names.slice().sort((x, y) => x.localeCompare(y, 'ko'))), names.slice(0, 3).join(','));
    await p.click('#saSortTabs [data-sasort="sig"]'); await p.waitForTimeout(500);
    const ranks = await p.evaluate(() => [...document.querySelectorAll('#saList .sa2-chip')].map(x => ({ 과열: 0, 반등: 1, 신호없음: 2, 조정: 3, 침체: 4 })[x.textContent]));
    ok(L + '시그널 정렬 = 과열 → 반등 → 신호없음 → 조정 → 침체 순', ranks.every((r, i) => i === 0 || r >= ranks[i - 1]), ranks.join(''));
    await p.click('#saSortTabs [data-sasort="chg"]'); await p.waitForTimeout(500);
    // 되감기
    await p.click('#saSortTabs [data-sasort="day"]'); await p.waitForTimeout(900);
    ok(L + '「날짜별 σ」를 누르면 플레이어가 열림', !(await p.evaluate(() => document.getElementById('saRw').hidden)));
    await p.locator('#saJl').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    const box = await p.locator('#saJl').boundingBox();
    await p.mouse.move(box.x + box.width - 2, box.y + 59); await p.mouse.down(); await p.mouse.move(box.x + box.width * .5, box.y + 59, { steps: 8 }); await p.waitForTimeout(500);
    const mid = await p.evaluate(() => ({ now: +document.getElementById('saJl').getAttribute('aria-valuenow'), lab: +document.getElementById('saJlLab').style.opacity, v: document.querySelector('#saList .sa2-pct .v').textContent, cap: document.getElementById('saRhBar').textContent }));
    ok(L + '손잡이를 밀면 날짜가 바뀌고 방울이 뜨고 값이 그날 σ로', mid.now >= 13 && mid.now <= 16 && mid.lab > .8 && /σ$/.test(mid.v), JSON.stringify(mid));
    await p.locator('#saRw').screenshot({ path: path.join(OUT, 'sector_' + vw + '_player.png') }).catch(() => {});
    await p.mouse.move(box.x + box.width + 60, box.y + 59, { steps: 6 }); await p.waitForTimeout(150);
    const over = await p.evaluate(() => document.getElementById('saJlTrack').style.transform);
    ok(L + '끝을 넘겨 당기면 줄이 늘어남(최대 18px)', /scale\(1\.0\d+/.test(over), over);
    await p.mouse.up(); await p.waitForTimeout(900);
    const after = await p.evaluate(() => ({ tr: document.getElementById('saJlTrack').style.transform, lab: +document.getElementById('saJlLab').style.opacity, now: +document.getElementById('saJl').getAttribute('aria-valuenow') }));
    ok(L + '놓으면 줄이 돌아오고 방울이 내려가고 마지막 날(오늘)에 내려앉음', after.tr === 'none' && after.lab < .2 && after.now === 29, JSON.stringify(after));
    await p.click('#saPlay'); await p.waitForTimeout(1800);
    const pl = await p.evaluate(() => ({ on: document.getElementById('saPlay').classList.contains('on'), now: +document.getElementById('saJl').getAttribute('aria-valuenow') }));
    ok(L + '재생하면 30일 전부터 하루씩 지나감', pl.on && pl.now >= 2 && pl.now <= 6, JSON.stringify(pl));
    await p.click('#saPlay'); await p.waitForTimeout(300);
    ok(L + '멈춤', !(await p.evaluate(() => document.getElementById('saPlay').classList.contains('on'))));
    await p.focus('#saJl'); const n0 = +(await p.getAttribute('#saJl', 'aria-valuenow')); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(200);
    ok(L + '화살표 키로 하루 이동', +(await p.getAttribute('#saJl', 'aria-valuenow')) === n0 + 1);
    await p.click('#saRwClose'); await p.waitForTimeout(600);
    ok(L + '닫기 → 오늘 등락으로 돌아옴', await p.evaluate(() => document.getElementById('saRw').hidden && /%$/.test(document.querySelector('#saList .sa2-pct .v').textContent)));
    // 띠를 누르면 그 날로 열림
    await p.click('#saList .sa2-r >> nth=0 >> .sa2-strip span[data-i="10"]', { position: { x: 1, y: 1 } }).catch(async () => { await p.evaluate(() => document.querySelector('#saList .sa2-strip span[data-i="10"]').click()); });
    await p.waitForTimeout(700);
    ok(L + '30일 띠의 한 칸을 누르면 그 날로 되감기가 열림', await p.evaluate(() => !document.getElementById('saRw').hidden && +document.getElementById('saJl').getAttribute('aria-valuenow') === 10));
    // 상세 창
    await p.click('#saRwClose'); await p.waitForTimeout(400);
    await p.evaluate(() => { window.__sm = null; window.openSectorModal = k => { window.__sm = k; }; });
    await p.click('#saList .sa2-r >> nth=0 >> .sa2-nm'); await p.waitForTimeout(300);
    ok(L + '행을 누르면 섹터 상세(openSectorModal)', await p.evaluate(() => !!window.__sm), await p.evaluate(() => window.__sm));
    await p.evaluate(() => { window.__sm = null; });
    await p.click('#sectorStreakScroll .sa-sk >> nth=0'); await p.waitForTimeout(300);
    ok(L + '연속 기록 카드를 누르면 섹터 상세', await p.evaluate(() => !!window.__sm));
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    ok(L + '끝까지 써 본 뒤에도 가로 넘침 없음', m.sw <= m.cw, JSON.stringify(m));
    await p.context().close();
  }
  // 움직임 줄이기: 튕김 없이 바로 바뀌고 오류 없음
  { const p = await open(b, 390, 1000, true); await p.click('#saSortTabs [data-sasort="day"]'); await p.waitForTimeout(500); await p.focus('#saJl'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(300); const k0 = +(await p.getAttribute('#saJl', 'aria-valuenow')); await p.click('#saPlay'); await p.waitForTimeout(1200);
    const r = await p.evaluate(() => ({ now: +document.getElementById('saJl').getAttribute('aria-valuenow'), thumb: document.getElementById('saJlThumb').style.transform, sk: [...document.querySelectorAll('.sa-sk')].every(c => +c.style.opacity === 1) }));
    ok('움직임 줄이기: 키로 이동(27) · 재생이 끝(29)까지 가고 · 연속 기록 카드가 바로 보임', k0 === 27 && r.now === 29 && r.sk, k0 + ' → ' + JSON.stringify(r)); await p.context().close(); }
  await b.close(); console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
