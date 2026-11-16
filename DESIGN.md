---
version: 1.0
name: AQUAMEL
updated: 2026-11-16
description: |
  AQUAMEL 앱(index.html 한 파일, 순수 HTML·JS PWA)의 화면 규칙. 투자 판단을 돕는 앱이라
  화려함보다 "숫자와 판단이 한눈에 읽히는 것"이 먼저다. 어두운 바탕 · 강조색 하나 ·
  넉넉한 위아래 여백 · 글은 최소 · 움직임은 손으로 조작할 때와 처음 들어올 때만.
  화면을 새로 만들거나 고치는 사람(사람이든 Claude든)은 작업 전에 이 파일을 끝까지 읽고 따른다.

colors:            # 다크(기본) — CSS 변수 이름 그대로
  bg: "#161618"            # --bg
  panel: "#1c1c1f"         # --panel (카드)
  panel-2: "#222226"       # --panel-hi / --bg-2 (카드 위 · 입력칸)
  bg-3: "#2a2a2e"          # --bg-3 (눌린 칩 · 선택 바탕)
  line: "#2c2c30"          # 꼭 필요할 때만 쓰는 가는 선 (기본은 선 없이 카드로 나눔)
  text-hi: "#ffffff"       # --text-hi (제목 · 숫자)
  text: "#d4d4d4"          # --text (본문)
  text-dim: "#9d9d9d"      # --text-dim (보조)
  text-mute: "#85858a"     # --text-mute (캡션 · 흐린 글자, 대비 4.5:1)
  accent: "#569cd6"        # --accent (강조 하나)
  accent-soft: "#22303d"   # --accent-soft (완료 · 선택 바탕)
  accent-text: "#8fc0ec"   # --accent-text (accent-soft 위 글자)
  accent-deep: "#2f6aa8"   # --accent-deep (주 버튼 · 스위치 켜짐 · 길게 누르기 채움)
  up: "#40c057"            # 오름 (미국 · 한국 모두 오름=초록)
  down: "#ff6b6b"          # 내림 (내림=빨강)
  danger-bg: "#3a2422"     # 위험한 확인 버튼 바탕
  danger-text: "#f0a08d"   # 위험한 확인 버튼 글자
  warn: "#dcdcaa"          # --warn
colors-light:      # [data-theme="light"] — 같은 이름, 값만 바뀜
  bg: "#ece6d3"
  panel: "#f3eddd"
  text-hi: "#1f1810"
  text: "#3a3220"
  text-dim: "#6b5d3f"
  text-mute: "#8a7e5e"
  accent: "#2a6cb0"
  accent-soft: "#dde7f2"
  accent-text: "#1f5a96"
  accent-deep: "#2a6cb0"

typography:        # 글꼴: 'Pretendard Variable', Pretendard, -apple-system, sans-serif · 숫자는 tabular-nums
  number-xl: { fontSize: 26px, fontWeight: 700 }   # 큰 수치 (--text-3xl)
  title:     { fontSize: 18px, fontWeight: 600 }   # 카드 제목 (--text-xl)
  body-strong: { fontSize: 15px, fontWeight: 500 } # 강조 본문 (--text-md)
  body:      { fontSize: 13px, fontWeight: 400, lineHeight: 1.6 }  # 본문 (--text-base)
  sub:       { fontSize: 12px, fontWeight: 400 }   # 보조 (--text-sm)
  caption:   { fontSize: 11px, fontWeight: 400 }   # 캡션 (--text-xs)
  # 위 6단만 쓴다. 12.5px · 11.5px · 13.5px 같은 반 픽셀은 새로 만들지 않는다.
  # 입력칸 글자는 16px (iOS 확대 막음).

rounded:
  sm: 6px        # --radius-sm (작은 딱지)
  md: 10px       # --radius-md (작은 카드 · 칸)
  lg: 16px       # --radius-lg (카드 · 시트 위 모서리)
  pill: 999px    # --radius-pill (버튼 · 칩 · 스위치)

spacing:         # 4의 배수 (--space-1 ~ --space-8)
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
  4xl: 40px
  screen-side: 20px      # 화면 좌우
  card-pad: 18~24px      # 카드 안쪽 (글이 카드 가장자리에 붙지 않게)
  card-gap: 10~12px      # 카드 사이

motion:
  fast: 120ms    # --t-fast (색 · 눌림)
  base: 200ms    # --t-base (선택 바탕 이동 · 스위치)
  slow: 320ms    # --t-slow (시트 · 펼치기)
  ease: "cubic-bezier(0.22, 1, 0.36, 1)"   # --ease-out, 곡선은 이것 하나
  hold: 800ms    # 길게 눌러 확정
  reduced: "prefers-reduced-motion이면 움직임 없이 바로 바뀜"

components:
  card:            { backgroundColor: "{colors.panel}", rounded: "{rounded.lg}", padding: "{spacing.card-pad}" }
  button-primary:  { backgroundColor: "{colors.accent-deep}", textColor: "#ffffff", rounded: "{rounded.pill}", height: 52px }
  button-secondary: { backgroundColor: "rgba(127,127,127,.16)", textColor: "{colors.text}", rounded: "{rounded.pill}", height: 52px }
  button-danger:   { backgroundColor: "{colors.danger-bg}", textColor: "{colors.danger-text}", rounded: "{rounded.pill}" }
  chip-active:     { backgroundColor: "{colors.accent-soft}", textColor: "{colors.accent-text}", rounded: "{rounded.pill}" }
  sheet:           { backgroundColor: "{colors.panel}", rounded: "16px 16px 0 0", padding: "12px 24px 28px", grip: "36x4px" }
  switch:          { size: "44x26px", knob: 22px, off: "#3a3a3f", on: "{colors.accent-deep}" }
  touch-target:    { min: 44px }
---

# AQUAMEL DESIGN.md

## 1. 원칙

1. **숫자와 판단이 먼저 읽힌다.** 장식보다 위계. 한 화면에 큰 숫자는 하나만.
2. **색은 절제한다.** 강조색은 accent 하나. 오름·내림·위험 말고는 색으로 뜻을 만들지 않는다. 새 색(hex)을 화면 코드에 직접 쓰지 않고 위 토큰만 쓴다.
3. **글은 최소.** 설명 문장 대신 숫자 · 딱지 · 짧은 이름. 문장이 필요하면 한 줄.
4. **여백은 넉넉하게.** 카드 안쪽 18~24px, 위아래 여백을 아끼지 않는다. 글이 카드 가장자리에 붙으면 안 된다.
5. **선 대신 카드로 나눈다.** 구분선은 꼭 필요할 때만 `line`.
6. **움직임은 이유가 있을 때만.** 처음 들어올 때, 손으로 조작할 때. 출렁 · 번짐 · 젤리 · 오로라 · 커서 효과는 쓰지 않는다.

## 2. 글자 · 말투

- 한국 종목은 **6자리 코드(006600) 대신 종목명**. 화면 글자는 앱이 자동으로 바꾸지만(`_aqKrSweep`), 새로 만드는 화면도 처음부터 `displayName(tk)` / `aqTkLabel(tk)`로 이름을 쓴다. 코드가 꼭 보여야 하는 곳만 `data-raw`.
- 문구는 짧은 '~해요'체. 버튼은 동사 하나(요청 · 승인 · 거부 · 돌아가기).
- 이모지 아이콘 금지. 아이콘은 가는 선(stroke 1.6~2) SVG.
- 숫자는 `font-variant-numeric: tabular-nums`. 등락은 `+1.2%` / `−1.2%`.

## 3. 부품 (이미 앱에 있는 것 — 새로 만들지 말고 이것을 쓴다)

| 쓰임 | 쓰는 법 |
|---|---|
| 확인 묻기 | `await aqConfirm('제목\n설명')` → true/false. 삭제 · 취소 · 중단 문구면 버튼이 위험 색. **`confirm()` 금지** |
| 입력 받기 | `await aqPrompt('제목\n설명', 기본값, { ghost, multi, type, inputmode, ok, cancel })` → 글자 또는 null. **`prompt()` 금지** |
| 알림 | `aqToast('글', ms)` — 아래에 쌓임, 누르면 펼침, ×로 치움. `alert()`도 자동으로 여기로 옴 |
| 돈이 나가는 버튼 | 버튼에 `class="aq-hold"` — 0.8초 길게 눌러야 실행. 주문 · 승인 · 조건부 승인 |
| 요청 버튼 | `aqBtnLoad(el)` → 처리 → `aqBtnDone(el, ok, '요청됨')` |
| 기다리는 글자 | `<span class="aq-think">판단 중</span>` |
| 고르기 버튼 | 버튼 묶음 클래스를 `AQ_SEG`에 넣으면 선택 바탕이 미끄러짐 (`.active` 또는 `.on`) |
| 켜고 끄기 | `<input type="checkbox" class="aq-sw">` 또는 기존 `.aq-switch` |
| 접이식 칸 | `.aq-coll` + `aqToggleColl(head)` (높이가 부드럽게) |
| 바뀌는 숫자 | `aqRoll(el, '$742.18')` — 바뀐 자리만 굴러감 |
| 넘겨 보는 카드 | 가로 스크롤 + `_aqDotsInit(root)` 쪽 점 |
| 단계 | `.mg3-steps` (끝난 단계 체크 · 지금 단계 빛 · 선으로 이음) |
| 시장 · AI 위치 | `_fjG(x, small)` — 비관~낙관 선 위에 ● 시장 · ○ AI · 사이 간격 (AI 거시 예보) |
| 겹친 카드 넘기기 | `.fj2-stk` + `_fjStkLay()` · `aqFjNext()` — 다음 버튼 · 옆으로 밀기 (오늘의 인사이트) |
| 줄 펼치기 | `.fj2-ex` 안에 넣고 줄에 `.open` — `aqFjTg(btn, key)` |

## 4. 하지 않는 것

- `confirm()` · `prompt()` · `alert()` 직접 호출
- 한국 종목 코드를 그대로 화면에
- 반 픽셀 글자 크기, 토큰 밖 색 · 모서리
- 이모지 아이콘, 그라데이션 바탕, 왼쪽 굵은 테두리 카드
- 설명 문장이 두 줄 넘는 카드
- 손가락 닿는 곳이 44px보다 작은 버튼

## 5. 작업 규칙

- 화면 작업 전: 이 파일 → 바꿀 화면의 기존 코드 순서로 읽는다.
- 앱을 고치면 `window.AQ_PWA_VERSION`을 +0.01, 주석에 무엇을 바꿨는지 한 줄.
- 푸시 전에 `git pull --rebase` (여러 방이 같은 저장소에 올림). 번호가 겹치면 다음 번호로.
- 미국 거래일 매니저 줄(겨울 20:40~00:00)에는 배포하지 않는다 (본부장님이 허락하면 예외).
- 새 부품이 생기면 3장 표에 한 줄 더한다.
