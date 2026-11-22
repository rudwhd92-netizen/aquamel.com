---
version: 2.0
name: AQUAMEL
updated: 2026-11-18
description: |
  AQUAMEL 앱(index.html 한 파일, 순수 HTML·JS PWA)의 화면 규칙. 투자 판단을 돕는 앱이라
  화려함보다 "숫자와 판단이 한눈에 읽히는 것"이 먼저다. 어두운 바탕 · 강조색 하나 ·
  넉넉한 위아래 여백 · 글은 최소 · 움직임은 손과 상태를 따르는 스프링.
  화면을 새로 만들거나 고치는 사람(사람이든 Claude든)은 작업 전에 이 파일을 끝까지 읽고 따른다.

colors:            # 다크(기본) — CSS 변수 이름 그대로
  bg: "#161618"            # --bg (v8.67: #000에서 되돌림 — 본부장님 "너무 검정")
  panel: "#1c1c1f"         # --panel (카드)
  surface: "#222226"       # 부품 몸통 · 카드 안 칸 · 시트 안 줄
  fill-1: "rgba(255,255,255,.05)"   # 칸 · 입력칸
  fill-2: "rgba(255,255,255,.09)"   # 칩 · 딱지
  fill-3: "rgba(255,255,255,.14)"   # 눌린 칩 · 선택 바탕 · 막대
  object: "#2c2c2c"        # 카드 없이 떠 있는 물체 (섬 · 방울)
  # 옛 이름 --panel-2 · --bg-2(= surface #222226) · --bg-3 · --panel-hi(= 불투명 #2a2a2e)는 그대로 쓰이고, 화면별로 surface / fill-3으로 옮긴다 (v8.66)
  line: "#2c2c30"          # 선 · 그림자 없음이 기본. 꼭 필요할 때만 쓰는 가는 선
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
  fill-1: "rgba(23,24,26,.04)"
  fill-2: "rgba(23,24,26,.07)"
  fill-3: "rgba(23,24,26,.12)"
  object: "#e6e5e2"

typography:        # 글꼴: 'Pretendard Variable', Pretendard, -apple-system, sans-serif · 숫자는 tabular-nums
  number-xl: { fontSize: 26px, fontWeight: 700 }   # 큰 수치 (--text-3xl)
  title:     { fontSize: 18px, fontWeight: 600 }   # 카드 제목 (--text-xl)
  body-strong: { fontSize: 15px, fontWeight: 500 } # 강조 본문 (--text-md)
  body:      { fontSize: 13px, fontWeight: 400, lineHeight: 1.6 }  # 본문 (--text-base)
  sub:       { fontSize: 12px, fontWeight: 400 }   # 보조 (--text-sm)
  caption:   { fontSize: 11px, fontWeight: 400 }   # 캡션 (--text-xs)
  # 위 6단만 쓴다. 12.5px · 11.5px · 13.5px 같은 반 픽셀은 새로 만들지 않는다.
  # 입력칸 글자는 16px (iOS 확대 막음).

rounded:         # 안쪽 모서리 = 바깥 모서리 − 사이 여백. 코드의 --radius-sm/md/lg는 화면마다 3단계 시안 때 이 값으로 옮긴다.
  xs: 6px        # 키 · 작은 칩 · 딱지 · 지도 칸
  bar: 5px       # 막대
  row: 12px      # 패널 안 줄 · 아이콘 버튼
  tile: 14px     # 타일 · 가로 카드
  panel: 18px    # 메뉴 · 작은 패널 · 아래 칸 셋
  sheet: 24px    # 큰 패널 · 시트 위 모서리
  card: 28px     # 카드
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
  fast: 120ms    # --t-fast (색 · 눌림) — 색 · 눌림 같은 CSS 전환만
  base: 200ms    # --t-base (선택 바탕 이동 · 스위치)
  slow: 320ms    # --t-slow (시트 · 펼치기)
  ease: "cubic-bezier(0.22, 1, 0.36, 1)"   # --ease-out, CSS 전환 곡선은 이것 하나
  springs:         # 강성 감쇠 · 질량 1 · 출처 designbookmark motion-src/shared/tokens.css · 원본 값 그대로 · 모듈 고유 값은 옮길 때만 추가
    follow: "900 50"     # 손가락이 잡고 있는 것 (튕김 · 늦음 없음)
    settle: "280 22"     # 놓았을 때 · 값에 내려앉을 때 (작게 한 번 튕김)
    soft: "260 24"       # 큰 이동 (패널 · 시트 · 부품 전체)
    lead: "620 36"       # 늘어나는 선택 바탕, 움직이는 쪽 끝
    trail: "190 19"      # 늘어나는 선택 바탕, 뒤따르는 끝 (늘어남을 만듦)
    pop: "520 16"        # 고를 때 아이콘 · 숫자가 톡
    fade: "420 32"       # 투명도 · 작은 밀림
    stagger: 45ms        # 여러 개가 차례로 들어올 때 간격
    tab-pill: "앞 620 40 · 뒤 170 19"   # 모듈 고유 값(designbookmark Tab pill 원본 — 공용 lead 620 36 · trail 190 19와 조금 다름) · 탭 줄 알약의 두 가장자리
  hold: 1200ms   # 길게 눌러 확정 (원본 Hold to publish) · 코드 --hold-ms (v8.66)
  spring-expand: "강성/감쇠 (질량 1) · 펼침 240/21 · 상세 나타남 260/28 (0.16초 뒤) · 자리 300/26 · 크기 300/26 · 투명도 300/30"   # 펼침 카드에만 쓴다 · 출처: designbookmark expand-card (나머지 카드는 0.94배 · 위아래 24px 밀려나며 사라짐)
  reduced: "스프링은 감쇠를 2√강성으로(튕김 없이 움직임) · CSS 전환 · 흐림 · 저절로 도는 것은 바로 바뀜"

components:
  card:            { backgroundColor: "{colors.panel}", rounded: "{rounded.card}", padding: "{spacing.card-pad}" }
  button-primary:  { backgroundColor: "{colors.accent-deep}", textColor: "#ffffff", rounded: "{rounded.pill}", height: 52px }
  button-secondary: { backgroundColor: "rgba(127,127,127,.16)", textColor: "{colors.text}", rounded: "{rounded.pill}", height: 52px }
  button-danger:   { backgroundColor: "{colors.danger-bg}", textColor: "{colors.danger-text}", rounded: "{rounded.pill}" }
  chip-active:     { backgroundColor: "{colors.accent-soft}", textColor: "{colors.accent-text}", rounded: "{rounded.pill}" }
  sheet:           { backgroundColor: "{colors.panel}", rounded: "24px 24px 0 0", padding: "12px 24px 28px", grip: "36x4px" }   # 긴 상세 화면용
  dialog:          { backgroundColor: "{colors.panel}", rounded: "{rounded.sheet}", position: "입력 = 화면 위쪽 10% (키보드가 올라오면 보이는 칸 안) · 확인 = 가운데" }
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
6. **움직임은 손과 상태를 따른다.** 처음 들어올 때 · 손으로 조작할 때 · 상태가 바뀔 때만 움직인다. 위치 · 크기는 공용 스프링으로, 가져온 움직임은 원본 값 그대로.
   - 쓴다: 스프링이 만드는 늘어남 · 튕김(젤리 슬라이더 · 늘어나는 선택 바탕 · 방울), 모양이 바뀌는 순간의 짧은 흐림(예: 알림 창 내용 흐림 5px → 0).
   - 쓰지 않는다: 손대지 않아도 저절로 반복하는 장식(오로라 · 구슬 · 물결 · 뒤섞이는 글자), 커서 따라오기 · 기울임(모바일), 숫자를 가리는 흐림, 터지는 입자.

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
| 돈이 나가는 버튼 | 버튼에 `class="aq-hold"` — 1.2초(`--hold-ms`) 길게 눌러야 실행. 주문 · 승인 · 조건부 승인 |
| 스프링 움직임 | 공용 스프링 엔진 `window.AQMotion` — `S(x, k, c)` 스프링 하나 · `tune(s, k, c)`(움직임 줄이기면 튕김 없이) · `step(s, dt)` · `clamp` · `token('--x')` · `spring('--spring-soft')` → [강성, 감쇠] · `register({ frame(dt), render(), idle() })` → 떼는 함수 · `kick()`. rAF 고리 하나(dt 최대 1/30 · 4번 나눔)가 모두 쉬면 스스로 멈춤. 새 움직임은 이것과 `--spring-*` 토큰으로 |
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
| 하위 페이지로 들어가기 | 설정 Stack panel `#setSP` — 시트 id를 `_spIds()`에 넣으면 `aqSetSheet(id, true)`가 아래 시트 대신 하위 페이지로 밀어 넣음 · `‹ 앞 페이지` · 오른쪽으로 쓸어 돌아가기 · 뒤로가기. 움직임 값은 원본(Kokonut UI stack-panel, MIT) 그대로라 위 motion 토큰의 예외(밀기 420 · 돌아가기 340 · 높이 380ms) |
| 당겨서 새로고침 | 알림 창 `_npr` — 목록 맨 위에서 아래로 당김 · 스프링(강성/감쇠) 따라오기 900/50 · 돌아가기 260/18 · 방울 380/20 · 크기 420/18 · 기준 88px (designbookmark Pull to Refresh 그대로). 창 모양도 원본대로: 카드 모서리 28 · 바탕 #262626 · 선/그림자 없음 · 머리 제목 왼쪽 + 상태 글씨 오른쪽 · 줄 `.noti-av` 38 동그라미(종류별 색 22% 납작한 바탕 + 같은 색 선 아이콘, 입체감 없음) · 제목 13/500 · 한 줄 12 · 지난 시간 11 · 안 읽음 주황 점 7 · 줄 사이 선 없음. 다른 목록에 쓰려면 이 묶음을 그대로 옮김 |
| 종에서 나오는 창 (다이내믹 아일랜드) | 알림 창 `_nis` — 종 자리 동그라미에서 카드로 스프링 확장 · 닫을 때 다시 종으로 빨려 들어감. 틀 0.25초 · 튕김 열 때 0.3 / 닫을 때 0, 내용 흐림 5px→0 · 0.9→1 · 0.05초 늦게 (smoothui Dynamic Island 값). 움직이는 동안 바탕은 `.noti-shell`이 그리고 카드는 `clip-path`로 그 모양대로 잘림. 움직임 줄이기 설정이면 바로 열고 닫음. 다른 팝업에 쓰려면 이 묶음을 옮김 |
| 상태 꼬리표 | `<span class="mgp-tag">` — 단계 상태 · 지금 단계 숫자(2/3) 같은 짧은 딱지. 기본은 회색(`bg-3` 바탕 · `text-dim` 글자), 지금 · 실행됨만 `.on`(`accent-soft` 바탕 · `accent-text` 글자) |
| 조용한 들어가는 줄 | `.df-door` — 안 써도 되는 선택 입력으로 가는 한 줄(이름 + 숫자). 색 · 배지 · 알림 점 없이 `text-dim` 글자만 · 숫자가 0이면 그리지 않음 (AI 매니저 '다르게 한 것') |
| 시트 안 하나 고르기 칩 | `.mg3-sh .ch.df-ch` — 누르면 `.on`(chip-active: `accent-soft` 바탕 · `accent-text` 글자) · 다시 누르면 풀림 · 높이 44px |
| 결정할 종목 로고 줄 | `.m4-strip` + `.m4-lg` — 로고 44px(금주의 발견 56px보다 작게) 가로 나열 · 테두리 `--rg`: 매수 `up` 초록 · 매도 `down` 빨강 (본부장님 지정) · 아래 티커 11 · 매수/매도 11 · 결정 끝난 것은 흐리게 (AI 매니저 맨 위 할 일 카드) |
| 계좌 지도 | `_mg4Map()` — 보유 금액만큼 칸(squarified treemap, `_mg4Sq`) + 현금 칸(accent 선) · 오늘 손대는 종목만 `bg-3` 바탕 + 매도 빨강 · 매수 초록 안쪽 테두리 · 큰 칸만 이름 · 한 줄 · 누르면 종목 한 장(`aqMg4Tile`) |
| 매니저 카드 | `.m4c` — `panel` 바탕 · 모서리 16 · 안쪽 22 · 머리 `.m4-h`(제목 15/600 왼쪽 · 보조 12 오른쪽) · 상태 딱지 `.m4-tag`(기본 회색 · `.on` = accent-soft) |
| 탭 메뉴 (Tab pill) | 앱 메뉴의 탭 줄 `.xtab-row` > `.xtab-btn` — 탭 4개 이상은 화면 폭을 채운 높이 40 알약(`fill-1`) · 탭 3개 이하(뉴스 · AI)는 글자 폭에 맞춘 높이 36 알약을 왼쪽 정렬(탭 최소 72 · 좌우 16, `aqTpSync`가 보이는 탭 수로 `.tp-fit`을 붙임 · v8.82 가안 A 승인 · `docs/design/tab-pill-v2/`) · 선택 바탕은 알약 하나(`fill-3`, 줄 안쪽 3px — 줄마다 `--tp-inx`)가 두 가장자리 스프링으로 늘어났다 줄며 옮겨 감(가는 쪽 620/40 · 뒤쪽 170/19) · 글자 13/600 · 고른 탭 `text-hi` · 나머지 `text-dim` · `aqTpSync(row, anim)`(`AQMotion` 위에서 줄마다 상태 · 탭을 다시 그리거나(innerHTML) 숨겨도 이어서 · 구성이 다르거나 처음 보이면 바로 놓음) · 줄이 넘치면 가로로 밀고 고른 탭을 가운데로(양끝 흐림 `--tp-l` `--tp-r`) · 탭 하나뿐이면 알약 없음 · 알림 점은 탭 안 오른쪽 위. 종목 창 탭(`.modal-view-tabs`) · 밸류 창 탭은 아직 예전 밑줄 (v8.72 · 시안 `docs/design/tab-pill/`) |
| 남은 한도 미터 (토큰 관리) | 설정 > 관리자 > '계정 관리' 아래 '토큰 관리'(`aqTokOpen` · `#setTokFull` · `.aq-archfull` 틀) — 카드(`panel` · 모서리 28) 안에 큰 숫자 하나(26/700 · 고른 계정 5시간 남은 %) + 5시간 막대(accent) · 주간 막대(`text-dim`) 높이 14 · 15% 이하만 `--kr-down` 빨강 · 아래 계정 행(`.tk-acc` 44px · 고른 행은 `fill-1` 바탕으로 펼쳐 초기화 시각 · 확인 시각 · 이름 바꾸기 · 지우기) · 큰 숫자 · 막대 = `AQMotion` soft 스프링 · 펼침 = CSS 전환(`--t-slow`) · 초기화 시각이 지난 창은 100% · 6시간 넘게 못 받은 자동 값은 '마지막 확인값' 딱지 · 값은 내 PC 수집기(`tools/token-collector` · Claude Code 상태줄)가 서버(`tokens.py`)에 올림 · Gemini 등은 직접 입력 (v8.74 · 시안 `docs/design/token-meter/` 가안 A) |
| 종목 카드 뒤집기 (AI리포트 · 발견 · 실시간 현황) | 종목 카드의 차트 영역(`.feed-chart-wrap`)을 `.fl-stage > .fl-flipper > .fl-face 2장`으로 감싸 앞면 · 뒷면(리포트 핵심 3블록 `.rc` · 차트)을 길게 눌러(0.45초 · 8px 이내) 스프링 180도로 뒤집음. AI리포트는 앞 리포트 · 뒤 차트, 발견 · 마이 › 실시간 현황은 앞 차트 · 뒤 리포트(보고서가 있는 종목만). 평소엔 바탕 위에 바로 놓이고(카드 면 없음) 누르는 동안만 카드 면(`--panel`)이 나타나며 살짝 눌리고(0.965) 눌린 쪽으로 기울고(최대 8도) 테두리가 강조색으로. 스프링 뒤집기 170/15 · 눌림 520/30 · 기울기 900/50(`AQMotion`) · 오른쪽 위 작은 단서 단추(터치 영역 44)로도 넘김 · 반사광 · 그림자 없음 · 움직임 줄이기면 기울기 없음. 핵심 3블록 = ① 5단계(변하지 않는 진실) ② 8번 '왜 이렇게 판단했나요?' 첫 문단 + 최종 의견 알약 ③ 6-1 변하지 않는 진실(옛 양식은 안내 문구). 뒷면 차트 · 리포트는 처음 뒤집을 때(또는 화면에 들어올 때) 실제 크기로 그림 · 시그널 이력은 카드 폭 600 이상일 때만 오른쪽(발견과 같음) · AI리포트 위 한 줄 = 전체 · 보유 · 관심 · 매수의견 알약(높이 40) + 검색 단추(44) (v8.83 · 시안 `docs/design/report-flip/`) |
| 메뉴 9체계 · 하단 메뉴 (v8.84) | 최상위 메뉴 9개 — 발견 · 탐색 · 관심 · 연구 · AI · 뉴스 · 일정 · 항해 · 마이(AI는 관리자만이라 일반 사용자는 8개). 관심(하트) · 항해(돛단배)는 선 굵기 1.8 · 뷰박스 24로 기존 7개와 같게. 하위 탭: 탐색 = 종목리스트 · 내부자 매수 · 밸런스 종목 / 관심 = 모의매수 · 비교분석 / 연구 = AI리포트 · 해자근거 / AI = AI매니저 · AI예보 · AI세력분석 / 뉴스 = 일간 이슈 · 기관13F / 일정 = 통합캘린더 · 실적시즌 / 항해 = 섹터동향 · AS-IS 포트폴리오 · TO-BE 포트폴리오 / 마이 = 실시간 현황 · 누적 성과 · 운영 통계. 개발예정 탭(해자근거 · AI세력분석 · 실적시즌 · TO-BE 포트폴리오)은 `.aq-soon` 한 줄 안내("○○는 준비 중이에요" + 들어올 자리 한 줄). 내부 키는 그대로(`data-mtab` · `data-atab` · `data-xtab` · `data-btab`) + 새 `data-vtab`(항해) · `data-ctab`(일정) — 카드 표시 규칙(CSS)은 그대로 쓰고 메뉴만 다시 묶음(`_AQ_AGRP` — 관심 = `interest`). 예전 링크(`setExploreSubtab('trend')` · `setAiSubtab('maps')` · `switchMobileTab('sector')` · `setBoardSubtab('holdings')`)는 새 자리로 우회 |
| 하단 메뉴 아코디언 독 (좁은 화면 · v8.84) | `#mobileTabBar.aq-dock` — 9개가 한 줄에 전부(5개 제한 폐지 · 탐색 · 뉴스를 ☰로 보내던 규칙 삭제). 켜진 칸만 70px로 글자(12px)가 펼쳐지고 나머지는 아이콘 20px만. 칸 폭 · 알약은 AQMotion 스프링: 펼침 340/21 · 접힘 420/30 · 알약 가는 쪽 620/36 · 꼬리 190/19 · 아이콘 팝 520/16(designbookmark 공통 tokens.css 숫자만 · 코드는 복사 안 함 · Bottom bar 전용 값은 원본을 읽지 못해 쓰지 않음). 칸 높이 56 · 비활성 칸 폭 360폭 31px / 412폭 38px로 44px 규칙에 모자람(9칸 × 44 = 396px라 한 줄 배치로는 불가능) — 칸이 붙어 빈틈 없고 높이로 보완, 사용자 확정. 와이드(`html.aq-wide`)는 독을 풀고 세로 메뉴: 칸 높이 50 · 간격 2로 9개 + 관리자 3개가 700 안에. 선택 바탕은 독이 자기 것(`.aq-dk-ind`)을 움직이고 `aqSegSync`는 독을 건너뜀 |
| 종목리스트 + 종목지도 병합 (v8.84) | 탐색 › 종목리스트 하나 — 연구 › 종목지도 목록 카드는 삭제(펼침 카드 코드는 재사용). 지도가 있는 종목(`stockMapList` → `_mlIdx`)에 `지도` 딱지(`.sl-mk` · 윤곽 알약 11px), 누르면 그 자리에서 지도 카드가 펼침(`aqMlXp` — 기존 펼침 스프링 그대로), 지도 없으면 종목 페이지. 별도 '종목 페이지' 줄은 없고 지도 카드 머리줄(`.sm-head`) 오른쪽 끝에 글자 버튼 '종목페이지 ›'(`.mlx-pg2` · 44px 터치) — 누르면 종목 페이지(와이드는 오른쪽 칸). 전체/지도 토글 없음. 정렬 4가지: 등락률 높은순 · 섹터 강한순 · 지도 최신순 · 상대 PER 낮은 순(지도 있는 종목이 먼저). 와이드도 왼쪽 칸은 폰과 똑같고 종목페이지 버튼만 오른쪽 칸을 씀. 줄은 `onclick` 속성이라 전역 '종목 줄 누르면 종목 페이지'(v5.34)가 건너뜀 |
| 와이드 왼쪽 메뉴 접기 (Sidebar collapse · v8.85) | `html.aq-wide` 세로 메뉴 맨 위 화살표(`.aq-rail-tg` · 44px)로 펼침 90px(아이콘 + 오른쪽 두 글자 · 칸 높이 44) ↔ 접힘 56px(아이콘만). 아이콘 자리는 두 상태에서 그대로(왼쪽 12px). 폭은 `--aqR`을 AQMotion 스프링으로 움직이고(펼침 340/21 · 접힘 420/30) 글자는 칸마다 45ms 시차로 나타남(420/32) — 폰 화면 칸과 오른쪽 열림 칸이 따라 이동. 접히면 칸에 `title`(툴팁) · 화살표 `aria-expanded`. 접힘은 이 기기에 기억(`aq_rail`)해 첫 그림부터 적용. 좁은 화면(아코디언 독)에는 없음. designbookmark 공통 tokens.css 숫자만 · Sidebar collapse 원본 코드는 읽지 못해 복사 안 함 |

| 발견 이력 · 검색 팔레트 | 이력 상세와 차트 포커스는 260/24. 검색은 화면 위쪽에서 열고 방향키·Enter·Esc를 지원한다. 팔레트 크기와 결과 행은 AQMotion으로 움직이며, 넓은 화면에서는 오른쪽 칸에 연다. 차트 기간 알약(3M · 6M · 1Y)은 차트 위에 얹히는 작은 알약(높이 26 · 글자 11 · 선택 바탕은 Tab pill 스프링)이고, 기간을 바꿀 때의 움직임은 차트 축을 건드리지 않고 선 높이만 섞는다(선이 틀 밖으로 나가지 않게 · v8.78). 발견 · 마이 › 실시간 현황(`#lvFeed`) · 종목 페이지 차트(`.tf-toggle[data-target=modal]` · `setChartTimeframe`)가 같은 방식이다(v8.81). |

## 4. 하지 않는 것

- `confirm()` · `prompt()` · `alert()` 직접 호출
- 한국 종목 코드를 그대로 화면에
- 반 픽셀 글자 크기, 토큰 밖 색 · 모서리
- 이모지 아이콘, 그라데이션 바탕, 왼쪽 굵은 테두리 카드
- 그림자 · 테두리 선(카드 · 버튼)
- 손대지 않아도 저절로 반복하는 장식 · 커서 효과 · 터지는 입자
- 설명 문장이 두 줄 넘는 카드
- 손가락 닿는 곳이 44px보다 작은 버튼
- 입력칸이 있는 창을 화면 아래에 두기 (키보드가 가림) — 확인 · 입력 창은 `aqConfirm` · `aqPrompt`가 위쪽 · 가운데에 띄움
- 가로 2분할(`html.aq-wide`)에서 시트 · 전체 화면 창이 왼쪽 메뉴 · 폰 화면을 덮게 두기 — 새로 만드는 `position: fixed` 창 · 시트 · 아래 버튼 줄은 `index.html`의 'html.aq-wide 오른쪽 칸' 규칙에 넣어 오른쪽 칸(`left: var(--aqL)`)에 열고, 넓은 화면(가로 1000×700)으로 찍어 확인한다

## 5. 작업 규칙

- 화면 작업 전: 이 파일 → 바꿀 화면의 기존 코드 순서로 읽는다.
- 앱을 고치면 `window.AQ_PWA_VERSION`을 +0.01, 주석에 무엇을 바꿨는지 한 줄.
- 푸시 전에 `git pull --rebase` (여러 방이 같은 저장소에 올림). 번호가 겹치면 다음 번호로.
- 미국 거래일 매니저 줄(겨울 20:40~00:00)에는 배포하지 않는다 (본부장님이 허락하면 예외).
- 새 부품이 생기면 3장 표에 한 줄 더한다.

## 6. v2 적용 상태 (2026-11-18 승인)

- 원칙 6: 움직임은 손과 상태를 따르는 스프링으로 개정했다.
- 표면: 처음엔 사이트 단계(바탕 #000 · 카드 #171717)로 정했으나 2026-11-18 v8.67에서 본부장님 요청으로 예전 값(바탕 #161618 · 카드 #1c1c1f · 몸통 #222226)으로 되돌림. 채움 3단 · object 토큰은 그대로.
- 모서리: 사이트 8단(카드 28)을 토큰에 넣었다.
- 움직임 줄이기: 임계 감쇠(튕김 없이 움직임)로 정했다.
- 길게 눌러 확정: 1.2초로 정했다.

코드 반영 (v8.66, DESIGN_ROOM.md 5장 1단계):

- 색 토큰: 다크 표면 색을 index.html의 `v8.66` 다크 블록 한 곳으로(v8.67부터 바탕 #161618 · 카드 #1c1c1f · surface #222226 · fill-1/2/3 · object · 눌림 `--bg-3`/`--panel-hi` #2a2a2e). 라이트는 fill-1/2/3 · object · surface만 더함. 화면 코드에 직접 쓴 옛 색(#1c1c1f 등)은 화면별로 옮긴다.
- 모서리 토큰 `--r-xs` ~ `--r-card`와 스프링 토큰 `--spring-*` · `--stagger`를 :root에 넣음(모서리는 아직 화면에서 안 씀 — 3단계 시안 때).
- 공용 스프링 엔진 `window.AQMotion` — 알림 당겨서 새로고침(`_npr`)이 이 계산을 씀. `_nis` · Stack panel · 펼침 카드는 아직 따로.
- 길게 눌러 확정 1.2초(`--hold-ms`, CSS 채움과 JS 타이머가 같은 값).

시안 캔버스: https://claude.ai/artifact/EbNC3oaVzXZaAM4GfaQWfh
