# (초안 · 미반영) DESIGN_ROOM.md 5장에 넣을 표 — designbookmark.com/motion 84개

조사일 2026-11-18 · 사이트 목록 원본: `designbookmark.com/motion` 페이지 안 모듈 목록(이름 · 분류 · 출처) 그대로.
합계 84 = designbookmark 53 · Kokonut UI 25 · SmoothUI 6.

상태: ✅ 옮김 · **2단계**(자주 쓰는 부품) · **3단계**(화면 작업 때) · 보류(쓸 곳은 있으나 원칙 · 데이터 확인 필요) · 안 씀(모바일 · 앱 기능과 안 맞음)

> 확인할 점
> - **Dynamic island는 지금 84개 목록에 없습니다.** SmoothUI 6개는 Siri orb · Exposure slider · Unlock Face ID · Scrubber · Task list · Music toggle입니다. 알림 창 `_nis`는 목록 밖(smoothui.dev 직접)에서 가져온 것으로 적어야 맞습니다. 목록 안에서 가장 가까운 것은 designbookmark **Morph island**입니다.
> - **Command button**은 두 번 나옵니다(designbookmark 자체 React판 · Kokonut UI판).
> - 겹치는 짝은 하나만 고릅니다: Hold to publish ↔ Hold button · Tab pill ↔ Smooth tab · Bottom bar ↔ Rubber dock · Streaming reply ↔ Typewriter · Goo thinking ↔ Thinking text.

## designbookmark 자체 (53)

| # | 모듈 | 분류 | 앱에서 쓸 곳 | 바꿀 기존 부품 | 상태 |
|---|---|---|---|---|---|
| 1 | Invite people | Inputs | 앱에 초대 기능 없음 | — | 안 씀 |
| 2 | Focus mode | Cards | 하나씩 결정(`aqMgr3Flow`) 들어갈 때 주변을 물림 | `.mg3-fl` 진입 | 3단계 |
| 3 | Plan switch | Cards | AI 매니저 미국 · 한국 전환 | 매니저 상단 전환 | 3단계 |
| 4 | Letter limit | Inputs | `aqPrompt` 긴 메모(거부 사유 등) 글자 수 | `aqPrompt` multi | 보류 |
| 5 | Pull cord | Buttons | 설정 › 화면 테마(다크 · 라이트) | 테마 스위치 | 3단계 |
| 6 | Morph tooltip | Navigation | 용어 설명 딱지(예보 ● 시장 · ○ AI, 성적 지표) | — (새 부품) | 3단계 |
| 7 | Spring dropdown | Inputs | 정렬 · 기간 고르기(종목 지도 · 성적) | 시트 고르기 | 3단계 |
| 8 | File drop | Inputs | 파일 올리기 없음 | — | 안 씀 |
| 9 | Command button | Buttons | 키보드 단축키용(React 원본) | — | 안 씀 |
| 10 | Morph island | Cards | 상단 상태 섬(매니저 줄 진행 · 체결 소식) | 알림 `_nis`와 엔진 공유 | 3단계 |
| 11 | Goo menu | Buttons | 빠른 동작 묶음(+) — 앱에 자리 없음 | — | 보류 |
| 12 | Jelly slider | Inputs | 값 조절(Range slider 쪽을 먼저) | — | 보류 |
| 13 | Hold to publish | Buttons | 돈 나가는 버튼(주문 · 승인 · 조건부 승인) | `.aq-hold` | **2단계** |
| 14 | Swipe deck | Cards | 하나씩 결정 카드 넘기기 · 오늘의 인사이트 | `.fj2-stk` · `aqFjNext` | **2단계** |
| 15 | Springy input | Inputs | `aqPrompt` 입력칸 · 종목 검색칸 | 입력칸 | 3단계 |
| 16 | Rubber dock | Navigation | 하단 탭(Bottom bar와 둘 중 하나) | 하단 탭바 | 보류 |
| 17 | Parallax ticket | Cards | 체결 결과 한 장(기울임은 끔) | — | 보류 |
| 18 | Glass lens | Cards | 차트 길게 눌러 확대 | `drawChart` | 보류 |
| 19 | Pull to refresh | Cards | ✅ 알림 · 다음: 일간 이슈 · AI 매니저 | `_npr` | ✅ |
| 20 | Word roll | Text | 상태 문구 바뀜(판단 중 → 결정 대기) | 상태 글자 | 3단계 |
| 21 | Weight wave | Text | 장식 | — | 안 씀 |
| 22 | Goo morph | Text | 장식 | — | 안 씀 |
| 23 | Scramble text | Text | 숫자 · 글이 뒤섞여 보임(신뢰 해침) | — | 안 씀 |
| 24 | Read along | Text | 읽어 주기 기능 없음 | — | 안 씀 |
| 25 | Roll links | Text | 마우스 올림 전용 | — | 안 씀 |
| 26 | Prompt box | AI | AI에게 묻는 입력칸 [자리: 앱에 해당 칸이 있는지 확인] | — | 보류 |
| 27 | Streaming reply | AI | AI 보고서 · 판단 근거 글이 나타남 | `openReportPanel` | **2단계** |
| 28 | Ghost suggestion | AI | 종목 검색 자동완성(티커 → 종목명) | 검색칸 | 3단계 |
| 29 | Goo thinking | AI | 판단 중 표시(Thinking text와 하나) | `.aq-think` | **2단계** |
| 30 | Expand card | Cards | ✅ 종목 지도 · 다음: 발견 · 관심 종목 | `AQ_MAP_EXPAND` | ✅ |
| 31 | Fan cards | Cards | 결정할 종목 로고 줄 펼치기 | `.m4-strip` | 보류 |
| 32 | Stat card | Cards | 통합 성적 · 계좌 총액 큰 숫자 | `aqRoll` 숫자 카드 | 3단계 |
| 33 | Profile card | Cards | 종목 한 장 | `aqMg4Tile` | 3단계 |
| 34 | Magnetic button | Buttons | 커서 효과 | — | 안 씀 |
| 35 | Loading to success | Buttons | 요청 버튼 처리 → 완료 | `aqBtnLoad` · `aqBtnDone` | **2단계** |
| 36 | Copy button | Buttons | 복사 버튼(키 · 보고서) | — | 보류 |
| 37 | Like burst | Buttons | 관심 종목 담기(터짐 효과는 뺌) | 관심 버튼 | 보류 |
| 38 | Tab pill | Navigation | 앱 메뉴 탭 줄 전체(탐색 · 마이 · 연구 · 뉴스 · 운영 · AI — 일정 탭 줄은 v8.75에서 삭제) | `.xtab-row` · `aqTpSync` | **v8.72 반영** (종목 창 탭은 다음) |
| 38-2 | Parallax ticket (카드 뒤집기) | Cards | 종목 카드 길게 눌러 리포트 ↔ 차트 (AI리포트 · 발견 · 마이 › 실시간 현황) | `.fl-stage` · `enhance`(뒤집기 부품) · `_rpFeed` | **v8.83 반영** (스프링 값만 참고 · 코드 복사 안 함) |
| 39 | Bottom bar | Navigation | 하단 탭 — 9개 전부(아코디언 독 · 좁은 화면) | `#mobileTabBar.aq-dock` · `aqDockSync` | **v8.84 반영** (공통 스프링 숫자만 참고 · 원본 코드는 읽지 못해 복사 안 함) |
| 40 | Dynamic menu | Navigation | 종목 상세 ⋯ 메뉴 | — | 3단계 |
| 41 | Segmented control | Navigation | 고르기 버튼 묶음 | `AQ_SEG` | **2단계** |
| 42 | Sidebar collapse | Navigation | 데스크톱 옆 메뉴 | — | 안 씀 |
| 43 | Pagination dots | Navigation | 넘겨 보는 카드 점 | `_aqDotsInit` | **2단계** |
| 44 | Command palette | Navigation | 종목 검색 전체 화면 | 검색 | 3단계 |
| 45 | Step progress | Navigation | 오늘 밤 단계 | `.mg3-steps` | **2단계** |
| 46 | OTP code | Inputs | 설정 › 비밀번호 숫자 입력 [자리: 숫자 비밀번호인지 확인] | 비밀번호 입력 | 보류 |
| 47 | Toggle switch | Inputs | 켜고 끄기 | `.aq-sw` · `.aq-switch` | **2단계** |
| 48 | Star rating | Inputs | 쓸 곳 없음 | — | 안 씀 |
| 49 | Tag input | Inputs | 관심 종목 묶음 이름 | — | 보류 |
| 50 | Number stepper | Inputs | 조건부 승인 가격 · 수량 | `aqPrompt` 숫자 | **2단계** |
| 51 | Range slider | Inputs | 범위 · 비중 조절 | — | **2단계** |
| 52 | Password strength | Inputs | 설정 › 비밀번호 바꾸기 | — | 보류 |
| 53 | Checkbox list | Inputs | 할 일 · 여러 개 고르기 | 체크 줄 | 3단계 |

## Kokonut UI (25) · MIT

| 모듈 | 분류 | 앱에서 쓸 곳 | 바꿀 기존 부품 | 상태 |
|---|---|---|---|---|
| Detent dial | Inputs | 쓸 곳 없음(Wheel picker 쪽) | — | 안 씀 |
| Agent steps | AI | AI 매니저 판단 진행 단계 | `.mg3-steps` 진행 중 | 3단계 |
| Hold button | Buttons | Hold to publish와 겹침 | `.aq-hold` | 보류 |
| Boarding pass | Cards | 체결 결과 한 장 | — | 보류 |
| Marker text | Text | AI 보고서 핵심 문장 표시 | — | 3단계 |
| Smooth tab | Navigation | Tab pill과 겹침 | — | 보류 |
| Slide to confirm | Buttons | 한꺼번에 승인 같은 큰 결정 | `.aq-hold` 일부 | **2단계** |
| Notification stack | Cards | 알림(토스트) 쌓임 | `aqToast` | **2단계** |
| Wheel picker | Inputs | 날짜 · 시간 · 수량 고르기 | 입력칸 | **2단계** |
| Dynamic text | Text | 장식 | — | 안 씀 |
| Voice input | AI | 음성 기능 없음 | — | 안 씀 |
| Tool approval | AI | 승인 · 거부 카드 | 하나씩 결정 `_mg4Go` | 3단계 |
| Toolbar | Navigation | 차트 기간 · 도구 줄 | 차트 버튼 | 3단계 |
| Cart button | Buttons | 쇼핑용 | — | 안 씀 |
| Page flip | Cards | 장식 | — | 안 씀 |
| Signature pad | Inputs | 쓸 곳 없음 | — | 안 씀 |
| Undo button | Buttons | 거부 · 지우기 되돌리기(알림 밀어 지우기) | — | **2단계** |
| Card field | Inputs | 카드 번호 입력 없음 | — | 안 씀 |
| Stack panel | Navigation | ✅ 설정 | `#setSP` | ✅ |
| Typewriter | Text | Streaming reply와 겹침 | — | **2단계**(둘 중 하나) |
| Thinking text | AI | 판단 중 글자 | `.aq-think` | **2단계** |
| Glass player | Cards | 음악 플레이어 | — | 안 씀 |
| Bell button | Buttons | 상단 종(새 알림 올 때) | `#mobileNotiBtn` | 3단계 |
| Morph popover | Buttons | 줄 ⋯ → 작은 창 | — | **2단계** |
| Command button | Buttons | 키보드 단축키 | — | 안 씀 |

## SmoothUI (6) · MIT

| 모듈 | 분류 | 앱에서 쓸 곳 | 바꿀 기존 부품 | 상태 |
|---|---|---|---|---|
| Siri orb | AI | 저절로 도는 장식(원칙 6) | — | 안 씀 |
| Exposure slider | Inputs | 쓸 곳 없음 | — | 안 씀 |
| Unlock Face ID | Cards | 앱 잠금 풀기 [자리: 잠금 화면이 있는지 확인] | — | 보류 |
| Scrubber | Inputs | 차트 · 성적 날짜 훑기 | `drawChart` 십자선 | 3단계 |
| Task list | AI | 매니저 오늘 밤 할 일 | `.mg3-steps` | 3단계 |
| Music toggle | Buttons | 음악 기능 없음 | — | 안 씀 |

## 집계

| 상태 | 개수 |
|---|---|
| ✅ 옮김(목록 안) | 3 (Pull to refresh · Expand card · Stack panel) — Dynamic island는 목록 밖 |
| 2단계 | 20 (겹치는 짝 포함 — 고르면 줄어듦) |
| 3단계 | 21 |
| 보류 | 17 |
| 안 씀 | 23 |
| 합계 | 84 |

## 권리 (0단계)

- **Kokonut UI · SmoothUI: MIT.** GitHub 저장소 LICENSE 확인(kokonut-labs/kokonutui · educlopez/smoothui). 옮길 때 함수 앞 주석에 `출처 이름 · 모듈 · MIT`.
- **designbookmark 자체 53개: 라이선스 표기 없음.** 확인한 곳과 결과:
  - `/motion` 바닥글: `© DesignBookmark 2026`만 있음. 라이선스 · 사용 조건 문구 없음.
  - `/terms`(2026-10-23 갱신): 목록 사이트 · 계정 · 등록 · 후원 내용만. 코드 사용 조건 없음.
  - 모듈 원본(`/motion-src/<이름>/index.html`)과 복사용 코드(`/motion-src/code/db-*.txt`): 머리 주석이 `Hold Button, by DesignBookmark (https://designbookmark.com/motion#db-hold-button)` 정도. 라이선스 없음.
  - 공통 파일 `tokens.css` · `base.css` · `motion.js`: 라이선스 없음.
  - 사이트 소개 글은 "복사해서 자기 프로젝트에 붙여 넣으라"는 취지. 쓰라고 만든 것으로는 보이지만, 정식 허락(라이선스)은 아님.
- **처리 방법 (제안)**
  1. 본부장님이 운영자에게 앱(유료 · 비공개 여부 포함) 사용 허락과 출처 표기 방식을 묻습니다. 문의 글 초안은 제가 만들 수 있습니다. 보내는 것은 본부장님이 합니다.
  2. 답을 받기 전에는 지금처럼 합니다. 스프링 · 시간 숫자만 가져오고, 코드는 앱 구조(순수 JS · 앱 토큰)로 직접 짭니다. 원본 HTML · CSS · SVG는 복사하지 않습니다. 주석에는 `움직임 값: designbookmark <모듈 이름>`을 남깁니다.
  3. 허락을 받으면 받은 조건대로 표기합니다(예: 설정 › 정보에 출처 한 줄).
  4. 거절하거나 답이 없으면 designbookmark 자체 모듈은 2 · 3단계에서 Kokonut · SmoothUI 짝(Hold button · Smooth tab · Thinking text · Typewriter)이나 앱 고유 부품으로 바꿉니다.
  - 이미 옮긴 designbookmark 것(Pull to refresh · Expand card)과 `_npr` 스프링 계산은 2번 방식에 해당합니다. `_npr`의 계산식은 `motion.js`와 같은 일반 스프링 식입니다.
  - 법률 판단이 아니라 정리입니다.
