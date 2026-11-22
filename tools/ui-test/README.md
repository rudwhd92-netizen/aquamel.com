# 화면 시험 도구 (가짜 데이터)

서버 · 로그인 없이 화면을 띄워 캡처한다. 데이터는 모두 지어낸 시험 값이다(실제 계좌 값을 여기 넣지 않는다 — 공개 저장소).

```bash
# 저장소 맨 위에서
python3 -m http.server 8773 &          # 앱을 로컬로 띄움
node tools/ui-test/manager.js night     # AI 매니저 — 결정할 시간 + 하나씩 결정 + 종목 한 장 + 오늘 주시
node tools/ui-test/manager.js after     # AI 매니저 — 결정 뒤 결과
node tools/ui-test/notifications.js     # 알림 창 — 열기 · 당겨서 새로고침
node tools/ui-test/tabpill.js           # 탭 메뉴 Tab pill — 알약이 늘어났다 멈춤 · 줄 다시 그리기 · 좁은 화면 · 움직임 줄이기 · 비관리자 AI 숨김 (17항목)
node tools/ui-test/tokens.js            # 토큰 관리 화면 — 설정 행 · 큰 숫자 · 막대 · 초기화 지난 창 · 빨강 · 동작 호출 · 좁은 화면 · 넓은 화면 (가짜 서버 · 지어낸 값)
node tools/ui-test/diet.js              # 기능 다이어트(v8.75) — 지운 함수 · 카드 · 탭 줄 없음 · 일정 · 뉴스 구성 · 옛 링크 · 알림 이동 · 일반 사용자 뉴스 · 다른 메뉴 그대로
node tools/ui-test/discover.js          # 발견 차트(v8.78) — 3M/6M/1Y 알약 크기 · 기간 전환 중/뒤 선이 틀 밖으로 안 나감
node tools/ui-test/livechart.js         # 마이 › 실시간 현황 · 종목 차트(v8.81) — 작은 알약 · 기간 전환 중/뒤 선이 틀 밖으로 안 나감 · 멈춘 뒤 실제 값 자리로
node tools/ui-test/reportflip.js        # 종목 카드 뒤집기 · AI리포트(v8.83) — 핵심 3블록 · 길게 누르기 · 8px 취소 · 뒷면 차트 지연 렌더링 · 거르기 · 검색 · 발견 · 실시간 현황 · 카드 폭 600 이상(가상 보고서 fixtures/)
node tools/ui-test/navbar.js            # 하단 메뉴(v8.80) — 선택 바탕이 선택 버튼 폭과 같음(관리자로 확인돼 버튼 수가 바뀌어도)
node tools/ui-test/ia9.js               # 메뉴 9체계(v8.84) — 하단 메뉴 9개 전부 · 아코디언 독 · 와이드 12칸 · 하위 탭 구성 · 이관 · 예전 링크 · 종목리스트 + 종목지도 병합 · 와이드 왼쪽 메뉴 접기(v8.85)(ONLY=폰|와이드로 한쪽만)
node tools/ui-test/sched.js             # 일정(v8.88) — 통합캘린더 새 데이터 · 필터 4개 · 날짜 없는 내 종목 실적 · 한국 경제지표 한글 · 실적시즌 · Beat/Miss 조건부 · 종목명 폴백 · 한국 실적 · 예전 경로 폴백 (서버 파일은 가짜로 가로챔 · 오늘 = 2026-11-22 고정)
node tools/ui-test/perf-load.js <URL> <CPU배속>    # 속도 — 시작 화면이 사라질 때까지 · 메인 스레드 막힌 시간 · 무거운 함수 (CPU 4면 폰 흉내 · 버전끼리 번갈아 3번씩 재서 중앙값 비교)
node tools/ui-test/perf-switch.js <URL> <CPU배속>  # 속도 — 화면 전환마다 걸리는 시간 · 무거운 함수의 호출자
```

- 캡처는 `tools/ui-test/out/`(git에 안 올림)에 쌓인다. `OUT=경로`로 바꿀 수 있다.
- Playwright가 필요하다(`require('playwright')`). 클라우드 세션에는 깔려 있다.
- 공통 요령: 로그인 막(`#aqAuth`)을 숨기고, `apiCall`을 가짜로 바꾸고, 화면이 쓰는 전역(`_mg`, `_mj`, `_noti` …)에 시험 값을 넣은 뒤 그리는 함수를 직접 부른다.
- 새 화면을 시험할 때는 이 파일들을 본떠 하나 더 만든다.
