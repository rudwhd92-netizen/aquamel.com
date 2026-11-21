// 토큰 수집기 시험 — node tools/token-collector/test.js   (가짜 계정 · 가짜 서버 · 내 진짜 ~/.claude 를 건드리지 않음)
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const { spawn, spawnSync } = require('child_process');
const SCRIPT = path.join(__dirname, 'statusline.js');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  · ' + x : '')); if (!c) fails++; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aqtok-')), claudeDir = path.join(tmp, 'dot-claude'), claudeJson = path.join(tmp, 'claude.json');
fs.mkdirSync(claudeDir);
const EMAIL = 'secret.person@example.com', NAME = 'Secret Person';
const setAccount = uuid => fs.writeFileSync(claudeJson, JSON.stringify({ oauthAccount: { accountUuid: uuid, emailAddress: EMAIL, displayName: NAME, fullName: NAME, organizationName: 'Secret Corp', seatTier: 'max_5x' } }));
const env = port => Object.assign({}, process.env, { AQ_CLAUDE_DIR: claudeDir, AQ_CLAUDE_JSON: claudeJson });
const input = (f, s) => JSON.stringify({ session_id: 's1', rate_limits: Object.assign({}, f == null ? {} : { five_hour: { used_percentage: f, resets_at: 1795300000 } }, s == null ? {} : { seven_day: { used_percentage: s, resets_at: 1795600000 } }) });
const run = (stdin, e) => { const t0 = Date.now(); const r = spawnSync(process.execPath, [SCRIPT], { input: stdin, env: e || env(), encoding: 'utf8', timeout: 8000 }); return { out: r.stdout, code: r.status, ms: Date.now() - t0 }; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const files = () => fs.readdirSync(claudeDir).map(f => fs.readFileSync(path.join(claudeDir, f), 'utf8')).join('\n');

(async () => {
  const hits = []; const srv = http.createServer((q, s) => { let b = ''; q.on('data', c => b += c); q.on('end', () => { hits.push({ url: q.url, auth: q.headers.authorization, body: b, method: q.method }); s.setHeader('content-type', 'application/json'); s.end('{"ok":true}'); }); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;

  // 1) 상태줄 글자
  setAccount('uuid-A');
  let r = run(input(28, 41)); ok('상태줄: 남은 % 로 보여 줌', r.out === '5시간 남음 72% · 주간 59%' && r.code === 0, JSON.stringify(r.out));
  ok('수집 키가 없으면 아무것도 안 보냄(기록만)', hits.length === 0 && !fs.existsSync(path.join(claudeDir, 'aquamel-token-pending.json')) && fs.existsSync(path.join(claudeDir, 'aquamel-token-state.json')));
  r = run(input(null, 41)); ok('주간만 있어도 보임', r.out === '주간 남음 59%' || r.out === '주간 59%', JSON.stringify(r.out));
  r = run(JSON.stringify({ session_id: 'x' })); ok('한도가 없으면 "한도 확인 중"', r.out === '한도 확인 중' && r.code === 0);
  r = run('이건 JSON이 아님'); ok('깨진 입력에도 멈추지 않음', r.out === '한도 확인 중' && r.code === 0);
  r = run(input(100, 0)); ok('0%/100% 경계', r.out === '5시간 남음 0% · 주간 100%', JSON.stringify(r.out));
  r = run(input(140, 5)); ok('범위 밖 값은 버림', r.out === '주간 95%' || r.out === '주간 남음 95%', JSON.stringify(r.out));

  // 2) 서버로 올리기
  fs.writeFileSync(path.join(claudeDir, 'aquamel-token-config.json'), JSON.stringify({ server: 'http://127.0.0.1:' + port, key: 'aqtk_TESTKEY_TESTKEY_TESTKEY_TESTKEY_00' }));
  fs.rmSync(path.join(claudeDir, 'aquamel-token-state.json'), { force: true });
  r = run(input(28, 41)); await sleep(1500);
  ok('키가 있으면 한 번 올림', hits.length === 1 && hits[0].method === 'POST' && hits[0].url === '/api?action=tokenIngest' && hits[0].auth === 'Bearer aqtk_TESTKEY_TESTKEY_TESTKEY_TESTKEY_00', hits.length + '번');
  let body = {}; try { body = JSON.parse((hits[0] || {}).body || '{}'); } catch (e) {}
  ok('올린 내용: 서비스 · 계정 해시 · 플랜 · 사용% · 초기화', body.provider === 'claude' && /^[a-f0-9]{16}$/.test(body.acct) && body.plan === 'max_5x' && body.five && body.five.used === 28 && body.five.resets === 1795300000 && body.seven && body.seven.used === 41, JSON.stringify(body));
  const sent = hits.map(h => h.body).join('\n') + files();
  ok('이메일 · 이름 · 회사명은 어디에도 없음(올린 것 · 기록 파일 모두)', !sent.includes(EMAIL) && !sent.includes(NAME) && !sent.includes('Secret Corp') && !sent.includes('uuid-A'));
  r = run(input(28, 41)); await sleep(800); ok('같은 값을 바로 또 불러도 다시 안 올림(5분 안)', hits.length === 1, hits.length + '번');
  r = run(input(29, 41)); await sleep(1200); ok('값이 바뀌면 바로 올림', hits.length === 2, hits.length + '번');
  setAccount('uuid-B'); r = run(input(5, 5)); await sleep(1200);
  let b2 = {}; try { b2 = JSON.parse((hits[2] || {}).body || '{}'); } catch (e) {}
  ok('계정을 바꾸면 다른 해시로 올림', hits.length === 3 && b2.acct && b2.acct !== body.acct, (b2.acct || '') + ' vs ' + body.acct);

  // 3) 서버가 꺼져 있어도 상태줄은 빠르고 조용함
  fs.writeFileSync(path.join(claudeDir, 'aquamel-token-config.json'), JSON.stringify({ server: 'http://127.0.0.1:1', key: 'aqtk_TESTKEY_TESTKEY_TESTKEY_TESTKEY_00' }));
  r = run(input(77, 10)); ok('서버가 없어도 상태줄은 즉시 끝남(1초 안)', r.out === '5시간 남음 23% · 주간 90%' && r.code === 0 && r.ms < 1500, r.ms + 'ms');
  await sleep(500); srv.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fails ? '\n실패 ' + fails + '건' : '\n전부 통과'); process.exit(fails ? 1 : 0);
})();
