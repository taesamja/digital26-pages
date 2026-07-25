# Logic Lab: 불대수·진법 변환기

GitHub Pages 정적 프론트엔드와 Vercel Serverless Function으로 구성된 디지털 논리 학습 웹앱입니다.

## 기능

- 2/8/10/16진수 및 ASCII 실시간 변환
- 7종 논리 게이트 시뮬레이터와 진리표
- 진법 변환, 논리 게이트, 불 대수 문제 풀이
- `localStorage` 기반 정답률, 풀이 시간, 최근 기록 분석
- Vercel Function을 통한 Claude AI 튜터 질의응답
- 데스크톱 및 모바일 반응형 화면

상시 실행 Node.js 서버와 데이터베이스는 사용하지 않습니다. 학습 기록은 사용 중인 브라우저에만 저장되며 다른 기기와 동기화되지 않습니다. Claude API 키는 GitHub Pages가 아닌 Vercel 환경변수에 저장합니다.

## AI 튜터 설정

1. 이 저장소를 GitHub에 업로드합니다.
2. Vercel에서 `Add New > Project`를 선택하고 해당 GitHub 저장소를 Import합니다.
3. Vercel 프로젝트의 `Settings > Environment Variables`에 다음 값을 등록합니다.

| 이름 | 값 |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API 키 |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5-20251001` |
| `ALLOWED_ORIGINS` | `https://<사용자명>.github.io,http://127.0.0.1:4173` |

4. Vercel에서 Production 배포를 실행합니다.
5. 발급된 Vercel 주소를 루트의 `config.js`에 입력합니다.

```js
window.APP_CONFIG = {
  AI_API_URL: "https://digital26-api.vercel.app/api"
};
```

Vercel 주소 끝에는 `/api`를 포함하고 `/chat`은 포함하지 않습니다. Claude API 키를 `config.js` 또는 프론트엔드 파일에 입력하면 안 됩니다.

## 로컬 실행

`index.html`을 직접 열거나 정적 서버를 사용할 수 있습니다.

```bash
npx serve .
```

## GitHub Pages 배포

1. 이 폴더의 파일을 새 GitHub 저장소에 업로드합니다.
2. 저장소의 `Settings > Pages`로 이동합니다.
3. `Build and deployment`에서 `Deploy from a branch`를 선택합니다.
4. 브랜치를 `main`, 폴더를 `/(root)`로 설정하고 저장합니다.
5. 표시되는 `https://<사용자명>.github.io/<저장소명>/` 주소로 접속합니다.

모든 파일 경로가 상대 경로이므로 프로젝트 저장소 형태의 GitHub Pages에서도 동작합니다.
