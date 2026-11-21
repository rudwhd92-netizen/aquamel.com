# AQUAMEL 디자인 방 — 인계서

이 저장소의 **화면(UX/UI)** 은 디자인 방(별도 Claude Code 세션)이 맡는다.
서버 · 판단 체계(AI 매니저 · 예보 · 성적) · 앱 데이터 함수는 다른 방(이하 '서버 방')이 맡는다.
디자인 방은 작업을 시작할 때마다 `CLAUDE.md` → `DESIGN.md` → 이 파일 순서로 끝까지 읽는다.

## 1. 맡는 것 · 안 맡는 것

| 디자인 방 | 서버 방 |
|---|---|
| `index.html`의 CSS · 화면을 그리는 함수(`*Render`, `*Html`, `_draw*`) · 움직임 · 시트 · 버튼 모양 | `apiCall` 과 그 인자 · 서버가 주는 데이터 모양 · 데이터 받기/고치기 함수 |
| `DESIGN.md` (토큰 · 원칙 · 부품 표) | 서버 저장소(`aquamel-server`) 전부 |
| 캔버스 시안 | 판단 · 주문 · 예약 작업 |

- 화면에 필요한 데이터가 없으면 **지어내지 말고** 서버 방에 넘길 요청으로 정리해 본부장님께 알린다(이 파일 6장 '서버 방에 요청'에 한 줄).
- 버튼이 부르는 동작(승인 · 거부 · 주문 · 요청 등)의 **함수 이름과 인자는 바꾸지 않는다.** 모양과 자리만 바꾼다.
- 돈이 나가는 버튼은 반드시 `class="aq-hold"`(길게 눌러 실행). 확인 · 입력은 `aqConfirm` · `aqPrompt`.

## 2. 같은 파일에 두 방이 올린다

- push 전에 항상 `git pull --rebase`. 버전(`window.AQ_PWA_VERSION`)이 겹치면 다음 번호.
- 미국 거래일 매니저 줄(겨울 20:40~00:00, 여름 19:40~23:00)에는 배포하지 않는다(본부장님이 허락하면 예외).
- 한 번에 한 화면. 고친 함수 이름을 커밋 메시지와 버전 주석에 적는다.

## 3. 화면 지도 (어디를 고치나)

| 화면 | 들어가는 길 | 그리는 함수 · CSS |
|---|---|---|
| AI › AI 매니저 (미국) | `switchMobileTab('ai'); setAiSubtab('manager')` | `_mg3Html` · `_mg4Top` · `_mg4Map` · `_mg4Watch` · `_mg4Wl` · `_mg4Doors` · `aqMg4Tile` · CSS `.m4*` |
| 하나씩 결정 (전체 화면) | `aqMgr3Flow()` | `_mg3Page` · `_mg4WhyCards` · `_mg4Go` · CSS `.mg3-fl` · `.m4f` · `.mg3-bt` |
| 종목 판단 근거 전체 | `aqMgrStock(tk)` | 같은 이름 함수 (`#brSheet`) |
| AI › AI 예보 | `setAiSubtab('fc')` | `_fjDraw` · `aqFjOpen` · CSS `.fj2-*` |
| 뉴스 › 일간 이슈 | `setAiSubtab('wx')` | `aqDailyIssueRender` · `_diDraw` · `_mjHtml`(종목별 날씨) |
| 연구 › 종목 지도 | `setAiSubtab('maps')` | `aqMapToggle` · CSS `.sm2-*` (펼침 카드 = `AQ_MAP_EXPAND`) |
| 알림 (상단 종) | `aqNotiOpen()` | `_notiRender` · 당겨서 새로고침 `_npr` · 열고 닫기 `_nis` · CSS `.noti-*` |
| 설정 | 하단 마이 › 설정 | Stack panel `#setSP` · `_spSheet` · `_spIds` |
| 종목 상세 · 차트 | `openChart(tk)` | `drawChart` · 간단 차트 `aqMiniChartHtml` · AI 보고서 `openReportPanel` |
| 공통 대화창 | — | `_aqDlg` · `aqConfirm` · `aqPrompt` · `aqToast` |

못 찾으면 화면에 보이는 글자로 `index.html`을 검색한다. 함수 앞 주석에 버전과 본부장님 원문이 붙어 있다.

## 4. 작업 순서

1. 요청을 받으면 바꿀 화면의 기존 코드를 먼저 읽는다.
2. 새 화면 · 큰 변경은 **캔버스 시안**(모바일 390px 화면들)을 먼저 만든다. 본부장님 실제 화면 값을 넣는다(지어낸 숫자 · 문장 금지 — 모르면 [자리] 표시).
3. 승인 뒤 반영 → `tools/ui-test/`로 가짜 데이터 화면을 띄워 확인 → 버전 +0.01 → push.
4. 새 부품이 생기면 `DESIGN.md` 3장 표에 한 줄.
5. 보고는 짧게: 무엇이 바뀌었는지 + 시험 화면 캡처.
6. **결과물은 항상 저장소에 남긴다**(초안은 `docs/design/`). 본부장님은 노트북을 여러 대 쓰므로 한 컴퓨터에만 있는 파일은 없는 것과 같다.
7. **본부장님께 고를 것을 물을 때는 글 · 색 코드 · 전문 용어로 묻지 않는다.** 캔버스에 같은 화면을 '가안 A · 가안 B'로 나란히 그려 보여 주고, 추천안에 표시하고, 각 가안의 차이는 쉬운 말 한 줄로만 쓴다.

### 본부장님 화면 취향 (꼭 지킬 것)
- 글은 최소, 설명 문장 대신 숫자 · 딱지 · 짧은 이름. 위아래 여백 넉넉히. 색은 절제(강조색 하나).
- 한국 종목은 6자리 코드 대신 종목명. 존댓말 '~해요'체 문구.
- '조금 꾸민 수준'이 아니라 체계부터 다시 짠 것을 원할 때가 많다 — 기능은 그대로, 정보량은 줄이지 말고 배치를 바꾼다.
- 오픈소스 · 사이트의 움직임을 가져올 때는 스프링 값(강성 · 감쇠 · 시간)을 **원본 그대로** 쓰고 색 · 글꼴 · 모서리만 앱 것으로.

## 5. 장기 과제 — designbookmark.com/motion 룩앤필 이식

목표: 사이트의 모듈과 룩앤필을 앱에 옮긴다. 모듈 84개 = designbookmark 자체 53 · Kokonut UI 25 · SmoothUI 6.

- **이미 옮김 (목록 84개 안, 3개):** Pull to refresh(알림 `_npr`) · Stack panel(설정, Kokonut UI) · Expand card(종목 지도).
- **목록 밖에서 옮김:** Dynamic island(알림 열고 닫기 `_nis`, SmoothUI · MIT) — 지금 designbookmark 84개 목록에는 없음. 목록 안에서 가장 가까운 것은 Morph island.
- **0단계 목록과 권리:** 84개를 앱의 어느 화면 · 어디에 쓸지 짝짓는 표를 이 파일에 만든다. Kokonut UI · SmoothUI는 MIT(출처 주석). designbookmark 자체 모듈은 사이트에 라이선스 표기가 없다 — 본부장님께 확인을 받고, 받기 전에는 값(스프링 · 시간)만 참고해 직접 짠다. 짝짓기 표 초안: `docs/design/1_모듈표_DESIGN_ROOM_5장.md` · DESIGN.md v2 개정안 초안: `docs/design/2_DESIGN_v2_개정안.md` (둘 다 본부장님 확인 전).
- **1단계 공통 토대:** 사이트 공통 파일(tokens.css · base.css · motion.js)의 스프링 값 · 표면색 · 모서리를 `DESIGN.md` 토큰으로 옮기고, 알림 창의 스프링 엔진(`_npr` 안)을 앱 전체가 함께 쓰는 하나로 묶는다. DESIGN.md v2(2026-11-18 승인)에 토큰 · 원칙 6을 반영함 — 코드 반영 v8.66(다크 표면 색 한 곳 · 모서리 · 스프링 토큰 · `window.AQMotion` · 길게 눌러 1.2초). 남은 것: `_nis` · Stack panel · 펼침 카드를 AQMotion으로 옮기기, 화면에 직접 쓴 옛 색 정리.
- **2단계 자주 쓰는 부품부터:** 돈 · 결정(Hold to publish, Slide to confirm, Swipe deck, Undo button) → 고르기 · 입력(Segmented control, Tab pill, Toggle switch, Number stepper, Range slider, Wheel picker) → 화면 틀(Bottom bar, Notification stack, Step progress, Pagination dots, Morph popover) → AI 글(Streaming reply, Thinking text, Goo thinking, Typewriter).
  - **진행(2026-11-21):** Tab pill = 앱 메뉴 탭 줄(`.xtab-row`)에 v8.72로 반영(가안 A 회색 알약 · 시안 `docs/design/tab-pill/` · 두 가장자리 스프링 620/40 · 170/19 — designbookmark 라이선스 표기가 없어 값만 참고해 직접 구현). 종목 창 탭(`.modal-view-tabs`) · 밸류 창 탭(`#aqValTabs`)은 다음 단계. 시험: `tools/ui-test/tabpill.js`.
- **3단계 화면 단위:** AI 매니저 → 발견 → 종목 상세 → 일정 · 뉴스 → 설정. 화면마다 시안 → 승인 → 반영.

## 6. 남은 일 · 서버 방에 요청

- AI 매니저: 업종 묶음 비중(반도체 46% 등)은 첫 화면에서 빠짐(하나씩 결정의 영향 칸에만 남음) — 계좌 지도에 업종 경계를 그어 살릴지 본부장님 확인 필요.
- AI 매니저: 계좌 지도 칸을 눌렀을 때의 '20일 추적'은 데이터 자리가 없어 아직 안 넣음.
- 한국 AI 매니저 화면은 '개발 중' 상태 그대로(서버 방 결정 대기).
- 결정(본부장님 2026-11-21): AI 메뉴(매니저 · 매수분석 · 예보)는 아직 베타라 비관리자에게 열지 않는다 — 하단 메뉴 AI는 `data-role-admin-tab`, `switchMobileTab('ai')` · `setAiSubtab`은 비관리자를 뉴스 AI 브리핑으로 돌림(v8.72). 열 때는 이 가드 두 곳과 하단 메뉴 속성을 같이 푼다.
- 토큰 관리(2026-11-21 본부장님 승인): 설정 > 관리자 > 계정 관리 아래. Claude 3계정(한 PC 전환) · 한도 남은 %가 핵심 · Codex/Gemini는 CLI + 웹/앱 · 회사 계정 합계도 서버로 보내도 됨. Claude = Claude Code 상태줄 `rate_limits`(공식) → 수집기 `tools/token-collector`(상태줄 스크립트 + 수집 전용 키) → 서버 `tokens.py`(`tokenIngest` · `tokenState` …) → 앱. Codex = 이 PC에 세션 기록 없음(앱형) · Gemini = 공식 경로 없음 → 우선 직접 입력. 서버 방에 알림: `tokens.py` · `tests/test_tokens.py` 새로 둠(app.py 3곳).
- 기능 다이어트(본부장님 2026-11-21 · v8.75): 일정 › 주간 일정 · AI 비서, 뉴스 › AI 브리핑 · 주간 이슈를 숨김 없이 삭제(탭 · 카드 · 화면 그리는 함수 · CSS). 일정 = 월간 일정만(탭 줄 없음) · 뉴스 = 일간 이슈(관리자) + 기관 13F(일반 사용자는 탭 줄 숨김). 옛 링크(brief · macro · pre · close → 뉴스 첫 탭 · guide · assist → 일정) · 알림(brief → 뉴스, guide → 일정)은 오류 없이 돌려보냄. AI 매니저 · 내 주식 스탠스 · 포트폴리오가 같이 쓰는 도우미(`_gm*` 가이드 상세 시트 · `_brHM` `_brP` · `_mcSheet` 등)는 남김. 시험 `tools/ui-test/diet.js`. 서버 방에 알림: 서버가 아직 알림 종류 `brief` · `guide`를 만들어 보낼 수 있음(앱은 뉴스 · 일정으로 돌려보냄) — 더 안 쓰면 서버에서 멈추면 됨.
- (서버 방에 요청할 것이 생기면 여기에 한 줄씩)
