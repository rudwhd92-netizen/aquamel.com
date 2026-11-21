# 탭 메뉴 Tab pill — 시안 (2026-11-21)

캔버스: https://claude.ai/artifact/7RpzcX1Bbx7zCvmWjAUQHs (본부장님만 열람 — 원본은 이 폴더의 .dc.html)

- 가안 A 회색 알약 (추천) · 가안 B 파란 알약(accent-soft) · 지금 밑줄형. 탭 이름은 앱의 실제 이름.
- 시안의 늘어남은 CSS 근사(앞 가장자리 .26s · 뒤 .52s). 실제 반영은 AQMotion 스프링으로.
- 라이선스: designbookmark 자체 모듈은 라이선스 표기가 없어 코드는 복사하지 않고 값(스프링)만 참고해 직접 짠다 (DESIGN_ROOM 5장).
- 원본 Tab pill 스프링: 앞 가장자리 620/40 · 뒤 가장자리 170/19 (shared tokens의 lead 620/36 · trail 190/19와 다름 → 모듈 고유 값으로 DESIGN.md에 추가 예정).
- 범위(본부장님 결정): 앱 메뉴 탭(.xtab-row)만 먼저 · 종목 창 탭은 나중. 비관리자에게는 AI 메뉴 자체를 숨김.
- 탐색 5개 줄은 390px에 안 들어가 가로로 밀기 + 활성 탭 자동 스크롤.
