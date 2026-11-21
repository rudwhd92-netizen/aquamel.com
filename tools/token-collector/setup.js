#!/usr/bin/env node
// AQUAMEL 토큰 수집기 설치 — node tools/token-collector/setup.js [--key] [--no-settings] [--server URL]
//   1) statusline.js 를 ~/.claude/aquamel-statusline.js 로 복사
//   2) ~/.claude/settings.json 에 statusLine 추가 (이미 다른 상태줄이 있으면 건드리지 않고 알려 줌 · 바꾸기 전에 .bak-aquamel 백업)
//   3) --key : 클립보드의 수집 키(aqtk_…)를 서버에 확인(ping)한 뒤 ~/.claude/aquamel-token-config.json 에 저장
//      (앱 설정 > 관리자 > 토큰 관리 > '수집기 연결'에서 키를 만들어 복사한 직후에 실행 — 키가 채팅 · 화면에 남지 않음)
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https'), http = require('http');
const { execFileSync } = require('child_process');
const args = process.argv.slice(2), has = f => args.includes(f);
const CLAUDE_DIR = process.env.AQ_CLAUDE_DIR || path.join(os.homedir(), '.claude');
const DEST = path.join(CLAUDE_DIR, 'aquamel-statusline.js'), SETTINGS = path.join(CLAUDE_DIR, 'settings.json'), CFG = path.join(CLAUDE_DIR, 'aquamel-token-config.json');
const serverArg = args.indexOf('--server') >= 0 ? args[args.indexOf('--server') + 1] : '';
const SERVER = (serverArg || process.env.AQ_SERVER || 'https://aquamel.duckdns.org').replace(/\/$/, '');
const say = m => console.log(m);

function clipboard() {
  try {
    if (process.platform === 'win32') return execFileSync('powershell', ['-NoProfile', '-Command', 'Get-Clipboard'], { encoding: 'utf8', timeout: 8000 }).trim();
    if (process.platform === 'darwin') return execFileSync('pbpaste', { encoding: 'utf8', timeout: 5000 }).trim();
    return execFileSync('sh', ['-c', 'wl-paste 2>/dev/null || xclip -selection clipboard -o 2>/dev/null'], { encoding: 'utf8', timeout: 5000 }).trim();
  } catch (e) { return ''; }
}
function askHidden(q) {   // 클립보드에 키가 없을 때: 터미널에 붙여 넣기 (화면에는 * 로 가림)
  return new Promise(res => {
    if (!process.stdin.isTTY) { let b = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', c => { b += c; }); process.stdin.on('end', () => res(b.trim())); return; }
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false; rl._writeToOutput = t => { if (muted && t !== q) rl.output.write('*'.repeat(Math.max(0, t.length))); else rl.output.write(t); };
    rl.question(q, a => { rl.close(); process.stdout.write(NL_OUT); res(String(a || '').trim()); }); muted = true;
  });
}
const NL_OUT = '\n';
function post(url, key, body) {
  return new Promise(res => {
    const u = new URL(url), data = JSON.stringify(body), lib = u.protocol === 'http:' ? http : https;
    const r = lib.request(u, { method: 'POST', timeout: 10000, headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), Authorization: 'Bearer ' + key } }, resp => { let t = ''; resp.on('data', c => t += c); resp.on('end', () => { try { res(JSON.parse(t)); } catch (e) { res({ ok: false, error: 'bad response ' + resp.statusCode }); } }); });
    r.on('error', e => res({ ok: false, error: e.code || e.message })); r.on('timeout', () => { r.destroy(); res({ ok: false, error: 'timeout' }); });
    r.end(data);
  });
}

(async () => {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  fs.copyFileSync(path.join(__dirname, 'statusline.js'), DEST); say('✓ 수집기 복사: ' + DEST);

  if (!has('--no-settings')) {
    let st = {}; try { st = JSON.parse(fs.readFileSync(SETTINGS, 'utf8')); } catch (e) { if (fs.existsSync(SETTINGS)) { say('✗ settings.json 을 읽지 못했어요 — 건드리지 않았어요'); process.exit(1); } }
    const cmd = 'node "' + DEST + '"';
    if (st.statusLine && st.statusLine.command && st.statusLine.command.indexOf('aquamel-statusline') < 0) {
      say('! 이미 다른 상태줄이 있어요(' + st.statusLine.command + ') — 바꾸지 않았어요. 바꾸려면 그 설정을 지우고 다시 실행하세요.');
    } else if (!st.statusLine || st.statusLine.command !== cmd) {
      if (fs.existsSync(SETTINGS)) fs.copyFileSync(SETTINGS, SETTINGS + '.bak-aquamel');
      st.statusLine = { type: 'command', command: cmd };
      fs.writeFileSync(SETTINGS, JSON.stringify(st, null, 2) + '\n'); say('✓ settings.json 에 상태줄 추가 (백업: settings.json.bak-aquamel)');
    } else say('✓ 상태줄이 이미 설정돼 있어요');
  }

  if (has('--key')) {
    let key = clipboard();
    if (!/^aqtk_[A-Za-z0-9_-]{30,}$/.test(key)) {
      say('· 클립보드에 수집 키(aqtk_…)가 없어요. 직접 붙여 넣어 주세요 (붙여 넣으면 * 로 가려져요).');
      key = await askHidden('수집 키: ');
    }
    if (!/^aqtk_[A-Za-z0-9_-]{30,}$/.test(key)) { say('✗ 수집 키 모양이 아니에요(aqtk_ 로 시작해야 해요). 앱 > 토큰 관리 > 수집기 연결에서 새로 만들어 주세요.'); process.exit(1); }
    const r = await post(SERVER + '/api?action=tokenIngest', key, { ping: true });
    if (!r.ok) { say('✗ 서버가 키를 받아주지 않았어요: ' + (r.error || '')); process.exit(1); }
    fs.writeFileSync(CFG, JSON.stringify({ server: SERVER, key, label: r.label || '' }), { mode: 0o600 });
    say('✓ 수집 키 저장 — 서버 확인 완료' + (r.label ? ' (' + r.label + ')' : ''));
  } else if (!fs.existsSync(CFG)) say('· 수집 키는 아직 없어요 — 앱에서 만든 뒤 `node ' + __filename + ' --key` 를 실행하세요. (그동안은 상태줄 표시만 해요)');
  say('끝. Claude Code 를 새로 열거나 메시지를 한 번 보내면 상태줄에 한도가 보여요.');
})();
