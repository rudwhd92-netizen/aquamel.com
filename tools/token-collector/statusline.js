#!/usr/bin/env node
// AQUAMEL 토큰 수집기 — Claude Code 상태줄(statusLine) 스크립트
//   Claude Code가 상태줄을 그릴 때마다 이 스크립트에 JSON을 넘겨 준다(공식 기능 · https://code.claude.com/docs/en/statusline).
//   거기 들어 있는 rate_limits(five_hour · seven_day 의 used_percentage · resets_at)를 읽어
//   ① 상태줄에 '5시간 남음 72% · 주간 59%'를 보여 주고 ② 앱 서버(토큰 관리)로 숫자만 올린다.
//   - 올리는 것: 계정 무작위 해시 · 플랜 · 사용 % · 초기화 시각 · 시각. (이메일 · 이름 · 대화 내용은 읽지도 보내지도 않음)
//   - 서버 주소 · 수집 키는 ~/.claude/aquamel-token-config.json (setup.js 가 만듦) — 키가 없으면 보내지 않고 상태줄만 보여 줌
//   - 상태줄을 그리는 데 방해되지 않게: 항상 빨리 끝나고, 네트워크는 따로 띄운 프로세스(--send)가 맡음 · 실패해도 조용히 넘어감
//   - 한도(rate_limits)는 구독(Pro · Max · Ultra) 계정에서 세션 첫 응답 뒤에 나타남 — 없으면 '한도 확인 중'
// 시험용: AQ_CLAUDE_DIR(설정 폴더) · AQ_CLAUDE_JSON(~/.claude.json 자리) 환경변수로 바꿀 수 있음
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto'), https = require('https'), http = require('http');
const { spawn } = require('child_process');

const CLAUDE_DIR = process.env.AQ_CLAUDE_DIR || path.join(os.homedir(), '.claude');
const CLAUDE_JSON = process.env.AQ_CLAUDE_JSON || path.join(os.homedir(), '.claude.json');
const CFG = path.join(CLAUDE_DIR, 'aquamel-token-config.json');
const STATE = path.join(CLAUDE_DIR, 'aquamel-token-state.json');
const PENDING = path.join(CLAUDE_DIR, 'aquamel-token-pending.json');
const SEND_EVERY_SEC = 300;   // 값이 안 바뀌어도 5분마다 한 번은 '살아 있음'을 알림 (바뀌면 바로)

const readJSON = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return d; } };
const writeJSON = (p, o) => { try { fs.mkdirSync(path.dirname(p), { recursive: true }); const t = p + '.tmp'; fs.writeFileSync(t, JSON.stringify(o)); fs.renameSync(t, p); } catch (e) {} };

function win(w) {
  if (!w || typeof w !== 'object') return null;
  const u = Number(w.used_percentage); if (!isFinite(u) || u < 0 || u > 100) return null;
  const r = Number(w.resets_at);
  return { used: Math.round(u * 10) / 10, resets: isFinite(r) && r > 1e9 ? Math.round(r) : null };
}
const left = w => (w ? Math.max(0, Math.round(100 - w.used)) : null);

function showLine(five, seven) {
  const p = [];
  if (five) p.push('5시간 남음 ' + left(five) + '%');
  if (seven) p.push('주간 ' + left(seven) + '%');
  return p.length ? p.join(' · ') : '한도 확인 중';
}

function run(input) {
  const rl = (input && input.rate_limits) || {};
  const five = win(rl.five_hour), seven = win(rl.seven_day);
  process.stdout.write(showLine(five, seven));   // 상태줄 글자 — 먼저 내보내고 나머지는 조용히
  if (!five && !seven) return;
  let acct = null, plan = '';
  try {
    const oa = readJSON(CLAUDE_JSON, {}).oauthAccount || {};
    if (oa.accountUuid) acct = crypto.createHash('sha256').update('aquamel-token:' + oa.accountUuid).digest('hex').slice(0, 16);   // 되돌릴 수 없는 무작위 값
    plan = String(oa.seatTier || oa.organizationType || '').replace(/[^A-Za-z0-9_ .-]/g, '').slice(0, 24);
  } catch (e) {}
  if (!acct) return;
  const now = Math.floor(Date.now() / 1000);
  const st = readJSON(STATE, { accts: {} }); st.accts = st.accts || {};
  const a = st.accts[acct] || {};
  const sig = [five && Math.round(five.used), seven && Math.round(seven.used)].join(':');
  const due = sig !== a.sig || now - (a.sent || 0) >= SEND_EVERY_SEC;
  st.accts[acct] = Object.assign(a, { five, seven, plan, at: now, sig });
  const cfg = readJSON(CFG, null);
  if (due && cfg && cfg.key) {
    st.accts[acct].sent = now;   // 보내기 전에 표시 — 상태줄이 연달아 불려도 한 번만
    writeJSON(PENDING, { provider: 'claude', acct, plan, five, seven, at: now });
    try { spawn(process.execPath, [__filename, '--send'], { detached: true, stdio: 'ignore', windowsHide: true, env: process.env }).unref(); } catch (e) {}
  }
  writeJSON(STATE, st);
}

function send() {   // 따로 띄운 프로세스: pending 을 서버로 한 번 올리고 끝
  const cfg = readJSON(CFG, null), body = readJSON(PENDING, null);
  if (!cfg || !cfg.key || !body) return;
  let u; try { u = new URL((cfg.server || 'https://aquamel.duckdns.org').replace(/\/$/, '') + '/api?action=tokenIngest'); } catch (e) { return; }
  const data = JSON.stringify(body), lib = u.protocol === 'http:' ? http : https;
  const req = lib.request(u, { method: 'POST', timeout: 8000, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), Authorization: 'Bearer ' + cfg.key } }, res => { res.resume(); res.on('end', () => process.exit(0)); });
  req.on('error', () => process.exit(0)); req.on('timeout', () => { req.destroy(); process.exit(0); });
  req.end(data);
}

if (process.argv[2] === '--send') send();
else if (process.argv[2] === '--selftest') { /* 시험 도구(tools/token-collector/test.js)가 부름 */ module.exports = { win, left, showLine }; }
else {
  let raw = ''; process.stdin.setEncoding('utf8');
  process.stdin.on('data', c => { raw += c; });
  process.stdin.on('end', () => { try { run(JSON.parse(raw || '{}')); } catch (e) { process.stdout.write('한도 확인 중'); } });
}
