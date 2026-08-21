# ChatFlow Frontend

FastAPI 기반 [ChatFlow Backend](../ChatFlow-backend)와 통신하는 Vite + React
프런트엔드입니다. JWT 로그인, 사용자별 대화 기록, AI 질문 전송과 전체 기록
삭제 기능을 제공합니다.

## 주요 기능

- 회원가입 후 로그인 화면 이동
- JWT 로그인과 새로고침 시 세션 복원
- 인증 상태에 따른 공개/보호 라우트 분리
- 이전 대화 기록 조회와 KST 날짜 구분
- 500자 질문 입력, Enter 전송, Shift+Enter 줄바꿈
- AI 답변 대기 상태와 자동 스크롤
- 502/503/504 AI 오류와 네트워크 오류 안내
- 확인 절차가 포함된 사용자별 전체 대화 삭제
- 모바일과 데스크톱에 대응하는 반응형 UI

## 기술 구성

- Vite, React, TypeScript
- React Router
- Tailwind CSS
- Vitest, React Testing Library, MSW
- Vercel

인증 상태는 React Context로 관리하고, 대화 기록은 채팅 화면의 로컬 상태로
관리합니다. 별도의 전역 상태 라이브러리나 HTTP 클라이언트는 사용하지 않습니다.

```text
Browser
  └─ React / Vercel
       ├─ AuthProvider
       ├─ API client (fetch)
       └─ Login / Register / Chat
             │ HTTPS JSON + Bearer JWT
             ▼
         FastAPI / Railway
             ├─ SQLite
             └─ OpenAI API
```

## 로컬 실행

### 1. 요구 환경

- Node.js 24
- npm 11 이상
- 실행 중인 ChatFlow Backend

### 2. 설치

```bash
npm install
cp .env.example .env.local
```

`.env.local`에서 백엔드 주소를 설정합니다.

```env
VITE_API_BASE_URL=http://localhost:8000
```

값을 생략하면 개발 기본값 `http://localhost:8000`을 사용합니다. URL 끝의 `/`는
있어도 동일하게 처리됩니다.

### 3. 개발 서버

백엔드를 먼저 `http://localhost:8000`에서 실행한 뒤 프런트엔드를 시작합니다.

```bash
npm run dev
```

기본 접속 주소는 `http://localhost:5173`입니다. 백엔드의 `CORS_ORIGINS`에도
이 Origin이 포함되어 있어야 합니다.

## 환경 변수

| 변수 | 필수 | 설명 |
|---|---:|---|
| `VITE_API_BASE_URL` | 운영 O | FastAPI 서버의 Origin. 예: `https://example.up.railway.app` |

JWT, OpenAI API Key, 백엔드 Secret은 프런트엔드 환경 변수나 코드에 넣지
않습니다. 로그인으로 받은 JWT만 `chatflow.accessToken` 키에 저장합니다.

## API 연동

| Method | Endpoint | 인증 | 화면 동작 |
|---|---|---:|---|
| `POST` | `/api/auth/register` | X | 회원가입 |
| `POST` | `/api/auth/login` | X | JWT 발급 |
| `GET` | `/api/me` | O | 사용자 확인과 세션 복원 |
| `GET` | `/api/me/chats` | O | 이전 대화 조회 |
| `POST` | `/api/chat` | O | AI 질문과 응답 생성 |
| `DELETE` | `/api/me/chats` | O | 내 대화 전체 삭제 |

보호 API에는 다음 Header가 자동으로 추가됩니다.

```http
Authorization: Bearer <access_token>
```

보호 API가 401을 반환하면 저장된 토큰을 제거하고 로그인 화면으로 이동합니다.
서버의 `{ "detail": "..." }` 오류와 FastAPI 422 검증 배열은 공통 API
클라이언트에서 사용자용 문자열로 변환합니다.

## 품질 검사

```bash
npm run lint -- --max-warnings=0
npm test
npm run build
```

테스트는 MSW로 FastAPI 계약을 모의하므로 실제 DB나 OpenAI API를 호출하지
않습니다. `develop`과 `main` 대상 Push 및 Pull Request에서는 GitHub Actions가
위 세 명령을 모두 실행합니다.

## Vercel 배포

1. Vercel에서 이 저장소를 연결합니다.
2. Framework Preset은 Vite를 사용합니다.
3. `VITE_API_BASE_URL`에 HTTPS Railway Backend Origin을 등록합니다.
4. 배포된 Vercel Origin을 Railway의 `CORS_ORIGINS`에 등록합니다.
5. 다시 배포한 뒤 아래 항목을 확인합니다.

- `/health`가 외부에서 200을 반환하는지 확인
- 회원가입과 로그인
- 질문 전송과 AI 응답 표시
- 새로고침 후 세션과 대화 기록 복원
- 대화 전체 삭제와 로그아웃
- `/login`, `/register`, `/chat` 직접 접근

`vercel.json`은 SPA 경로를 `index.html`로 rewrite하므로 React Router 경로를
직접 열거나 새로고침해도 404가 발생하지 않습니다.

## 보안과 제한 사항

- 사용자 질문과 AI 답변은 JSX 일반 텍스트로만 렌더링합니다.
- `dangerouslySetInnerHTML`과 HTML/Markdown 삽입은 사용하지 않습니다.
- Refresh Token, 서버 로그아웃, 개별 대화 삭제, 페이지네이션, 스트리밍 응답은
  현재 백엔드 계약에 포함되지 않아 제공하지 않습니다.
- 네트워크가 POST 응답 전에 끊기면 질문을 자동 재전송하지 않습니다. 대신 기록을
  다시 조회해 서버에 저장된 응답이 있는지 먼저 확인합니다.
