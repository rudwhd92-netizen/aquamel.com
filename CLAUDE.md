# AQUAMEL 앱 저장소 — 작업 규칙

- 앱은 `index.html` 한 파일(순수 HTML·JS PWA). `main`에 push하면 바로 배포된다.
- **화면을 만들거나 고치기 전에 반드시 `DESIGN.md`를 끝까지 읽고 따른다.** (색 · 글자 · 여백 · 움직임 토큰, 이미 있는 부품, 하지 않는 것)
- 고칠 때마다 `window.AQ_PWA_VERSION` +0.01. push 전에 `git pull --rebase`, 번호가 겹치면 다음 번호로.
- 미국 거래일 매니저 줄(겨울 20:40~00:00)에는 배포하지 않는다.
