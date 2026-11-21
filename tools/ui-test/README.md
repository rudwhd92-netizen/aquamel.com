# 화면 시험 도구 (가짜 데이터)

서버 · 로그인 없이 화면을 띄워 캡처한다. 데이터는 모두 지어낸 시험 값이다(실제 계좌 값을 여기 넣지 않는다 — 공개 저장소).

```bash
# 저장소 맨 위에서
python3 -m http.server 8773 &          # 앱을 로컬로 띄움
node tools/ui-test/manager.js night     # AI 매니저 — 결정할 시간 + 하나씩 결정 + 종목 한 장 + 오늘 주시
node tools/ui-test/manager.js after     # AI 매니저 — 결정 뒤 결과
node tools/ui-test/notifications.js     # 알림 창 — 열기 · 당겨서 새로고침
node tools/ui-test/tabpill.js           # 탭 메뉴 Tab pill — 알약이 늘어났다 멈춤 · 줄 다시 그리기 · 좁은 화면 · 움직임 줄이기 · 비관리자 AI 숨김 (17항목)
```

- 캡처는 `tools/ui-test/out/`(git에 안 올림)에 쌓인다. `OUT=경로`로 바꿀 수 있다.
- Playwright가 필요하다(`require('playwright')`). 클라우드 세션에는 깔려 있다.
- 공통 요령: 로그인 막(`#aqAuth`)을 숨기고, `apiCall`을 가짜로 바꾸고, 화면이 쓰는 전역(`_mg`, `_mj`, `_noti` …)에 시험 값을 넣은 뒤 그리는 함수를 직접 부른다.
- 새 화면을 시험할 때는 이 파일들을 본떠 하나 더 만든다.
