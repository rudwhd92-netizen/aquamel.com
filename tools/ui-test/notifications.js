// 알림 창 시험 — 열기 · 당겨서 새로고침 · 새 알림 들어옴
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT || path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:8773/index.html';
(async () => {
  const b = await chromium.launch({ channel: process.env.CHANNEL || undefined }); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  p.on('pageerror', e => console.log('PAGEERR ' + e.message));
  await p.goto(URL, { timeout: 40000 });
  await p.evaluate(() => {
    document.querySelectorAll('#aqAuth').forEach(x => x.style.display = 'none');
    const mk = (n, line, mins, t, extra) => Object.assign({ nid: n, type: t || 'brief', at: new Date(Date.now() - mins * 60e3).toISOString(), line, chip: '', read: false, market: 'US' }, extra || {});
    window._feed = [mk(1, '[알림 한 줄]', 2), mk(2, '[알림 한 줄]', 18, 'mgr'), mk(3, '[알림 한 줄]', 60, 'report', { ticker: 'AAA' }), mk(4, '[알림 한 줄]', 1500, 'brief', { read: true })];
    window.apiCall = async (a) => { if (a === 'getFeed') { await new Promise(r => setTimeout(r, 300)); return { ok: true, items: window._feed }; } return { ok: true }; };
    _noti.items = window._feed.slice(); _noti.ts = Date.now() - 120e3;
    window._feed = [mk(9, '[새로 들어온 알림]', 0, 'mgr')].concat(window._feed);
    _noti.ts = Date.now(); aqNotiOpen();
  });
  await p.waitForTimeout(700); await p.screenshot({ path: path.join(OUT, 'noti_open.png') });
  const bb = await (await p.$('#aqNotiList')).boundingBox();
  await p.mouse.move(bb.x + 150, bb.y + 20); await p.mouse.down();
  await p.mouse.move(bb.x + 150, bb.y + 230, { steps: 10 }); await p.waitForTimeout(200); await p.screenshot({ path: path.join(OUT, 'noti_pull.png') });
  await p.mouse.up(); await p.waitForTimeout(1600); await p.screenshot({ path: path.join(OUT, 'noti_after.png') });
  console.log('저장:', OUT); await b.close(); process.exit(0);
})();
