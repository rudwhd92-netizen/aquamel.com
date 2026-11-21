# 토큰 수집기 (Claude Code 상태줄)

앱 설정 > 관리자 > **토큰 관리**에 보이는 숫자를 내 PC에서 올려 주는 작은 스크립트예요.

## 무엇을 하나
- Claude Code가 상태줄을 그릴 때 넘겨 주는 `rate_limits`(5시간 · 주간 사용 %, 초기화 시각)를 읽어
  ① 상태줄에 `5시간 남음 72% · 주간 59%`를 보여 주고 ② 서버로 숫자만 올려요.
- 올리는 것: 계정 무작위 해시 · 플랜 · 사용 % · 초기화 시각 · 시각.
  **이메일 · 이름 · 회사명 · 대화 내용은 읽지도 보내지도 않아요** (`test.js`가 확인).
- 한도는 구독(Pro · Max · Ultra) 계정에서 세션 첫 응답 뒤에 나타나요. 없으면 `한도 확인 중`.
- 계정을 전환해 써도(한 PC · 한 `~/.claude`) 지금 로그인한 계정의 해시로 올라가요. 쓰지 않는 계정은 서버에 마지막 값이 남고, 앱이 초기화 시각을 더해 보여 줘요.

## 설치
```
node tools/token-collector/setup.js          # 수집기 복사 + ~/.claude/settings.json 에 statusLine 추가 (백업 .bak-aquamel)
```
이미 다른 상태줄이 있으면 바꾸지 않고 알려 줘요.

## 서버에 연결 (수집 키)
1. 앱 > 설정 > 관리자 > 토큰 관리 > **수집기 연결** → 이름을 적으면 **연결 명령 한 줄**이 클립보드에 복사돼요 (화면에는 안 보여요).
2. PC 터미널(PowerShell)에 **붙여 넣고 엔터** — 키를 서버에 확인한 뒤 `~/.claude/aquamel-token-config.json`에 저장해요. (`node "$HOME/.claude/aquamel-statusline.js" --connect aqtk_…`)
- 먼저 `node tools/token-collector/setup.js` 로 수집기를 설치해 두어야 해요(새 PC는 한 번).
- `setup.js --key`(클립보드의 키를 읽음 · 없으면 붙여 넣기 입력)도 그대로 쓸 수 있어요.
- 수집 키는 숫자 올리기만 돼요(관리자 권한 아님). 새 PC는 키를 따로 만들고, 앱에서 언제든 지울 수 있어요.

## 시험
```
node tools/token-collector/test.js     # 가짜 계정 · 가짜 서버 (내 ~/.claude 를 건드리지 않음)
```

## 환경 변수 (시험용)
`AQ_CLAUDE_DIR`(설정 폴더) · `AQ_CLAUDE_JSON`(`~/.claude.json` 자리) · `AQ_SERVER`(서버 주소)
