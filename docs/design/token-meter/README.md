# 토큰 관리 (설정 > 관리자 > 계정 관리 아래) — 조사 + 시안 (2026-11-21)

캔버스: https://claude.ai/artifact/7LS5QunL53KGfFYpuPhrz9 (본부장님만 열람 · 원본은 이 폴더 .dc.html) — 숫자는 모두 예시

## 본부장님 답 (2026-11-21)
- Claude 계정 3개 = 한 PC에서 전환 · 가장 중요한 것 = **한도 남은 %** · Codex/Gemini = CLI + 웹/앱 · 회사 계정 합계도 서버로 보내도 됨

## 한도 % 를 읽는 방법 (조사 · 이 PC 확인)
- **Claude (공식)**: Claude Code 상태줄(statusLine) 입력 JSON의 `rate_limits.five_hour / seven_day` → `used_percentage`(0~100) · `resets_at`(epoch 초). Pro/Max/Ultra 구독자 · 세션 첫 API 응답 뒤에 나타남 · 창이 지나면 사라짐 · **계정 식별 필드는 없음**(→ 상태줄 스크립트가 `~/.claude.json`의 oauthAccount를 읽어 꼬리표). 이 PC Claude Code 2.1.330, 지금 `statusLine` 설정 없음. 한도는 계정 전체(웹·앱·CLI 합산)라 웹 사용분도 % 에 반영됨. 출처 https://code.claude.com/docs/en/statusline · 일부 버전 누락 보고 https://github.com/anthropics/claude-code/issues/45133
- Claude (비공식): `api.anthropic.com/api/oauth/usage` + OAuth 토큰 — 문서 없음 · 지금 로그인한 1계정만 읽힘 → 쓰지 않음
- Codex: 로컬 `rollout-*.jsonl`의 `token_count.rate_limits`(primary≈5시간 · secondary≈7일)가 공개 구현에 있으나 **이 PC에는 rollout 0개**(앱형, `.codex/sqlite`만) → 확인 필요 · 비공식 사용량 조회 도구 있음
- Gemini: 공식 프로그램 경로 없음 · CLI는 Antigravity CLI로 이전 중(`/usage` 화면 전용) → 처음엔 직접 입력
- 토큰 개수(참고): Claude Code 기록 `~/.claude/projects/*.jsonl`의 `message.usage`에 입력·출력·캐시 토큰 + 모델 + 시각

## 설계 결정
- 계정 한 폴더(~/.claude) 전환 → 기록에 계정 없음 → 상태줄 스크립트가 session_id ↔ 계정 짝을 기록(그 뒤 transcript 합계를 계정에 배정)
- 쓰지 않는 계정은 '마지막 확인값 + 초기화 시각'(초기화 지났으면 100%), 마지막 확인 시각을 항상 표시
- 서버에는 합계 · 별칭만(대화 내용 · 이메일 안 보냄)
- 상태줄은 한 개만 가능 → 지금 상태줄 없음 · AI Token Monitor 앱과 겹치는지 확인 필요
- Storage meter: 라이선스 표기 없어 값(스프링)만 참고해 직접 구현 · 색은 DESIGN.md(accent 하나 + 회색 · 위험만 빨강)
