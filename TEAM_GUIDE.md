# 웹 기반 AI 챗봇 서비스 팀 개발 가이드

## 1. 프로젝트 개요

본 프로젝트는 **React 기반 Frontend와 FastAPI 기반 Backend를 분리하여 개발하고, AI API와 Database를 연동한 웹 기반 AI 챗봇 서비스**를 구현하는 것을 목표로 한다.

### 배포 구조

```text
사용자 Browser
      │
      ▼
React Frontend
(Vercel)
      │
      │ HTTPS REST API
      ▼
FastAPI Backend
(Railway)
      │
      ├── Authentication
      ├── Database
      └── OpenAI API
```

### Repository 구성

```text
Frontend Repository
└── React / Vercel

Backend Repository
└── FastAPI / Railway / SQLite / OpenAI
```

---

# 2. 팀 역할 분담

## 2-1. 반가희 — Team Lead / Backend 1

### 주요 역할

* 전체 프로젝트 일정 및 개발 방향 조율
* Frontend / Backend API Contract 관리
* GitHub Branch / PR Workflow 관리
* Backend 서버 구조 및 인증
* HTTP API Interface
* 서버 Logging
* Railway 배포
* Frontend ↔ Backend 최종 Integration

### 담당 기능

```text
Backend 1
│
├── FastAPI 서버
│   ├── 서버 기본 구조 구성
│   ├── FastAPI Application 초기화
│   ├── Router 등록
│   ├── CORS Middleware 설정
│   └── HTTP Request / Response 처리
│
├── 회원가입 / 로그인 API
│   ├── POST /api/auth/register
│   ├── POST /api/auth/login
│   ├── 중복 아이디 확인
│   └── 로그인 정보 검증
│
├── 사용자 인증
│   ├── 비밀번호 Hashing
│   ├── 비밀번호 Hash 검증
│   ├── JWT Access Token 발급
│   ├── JWT 유효성 / 만료 검증
│   └── current_user 식별
│
├── 입력 검증
│   ├── Pydantic Schema
│   ├── username 길이 검증
│   ├── password 길이 검증
│   ├── 질문 최대 500자 검증
│   └── 공백 질문 차단
│
├── 보호된 API Router
│   ├── POST /api/chat
│   ├── GET /api/me/chats
│   └── DELETE /api/me/chats
│
│   ※ Router에서는 DB / AI 세부 로직을 직접 구현하기보다
│      Backend 2의 Service / Repository를 호출한다.
│
├── HTTP 오류 처리
│   ├── 400 Bad Request
│   ├── 401 Unauthorized
│   ├── 422 Validation Error
│   └── 500 Internal Server Error
│
├── 서버 Logging
│   ├── request_id 생성
│   ├── request_received
│   ├── 인증 관련 오류 기록
│   └── 요청 흐름 추적
│
├── 환경 설정 관리
│   ├── .env.example 최종 관리
│   ├── requirements.txt 최종 관리
│   ├── SECRET_KEY
│   └── DATABASE_URL
│
└── Railway 배포
    ├── Railway 프로젝트 연결
    ├── Uvicorn 실행 설정
    ├── Railway 환경변수 설정
    ├── Persistent Volume 연결
    └── Production 정상 동작 확인
```

### Team Lead 추가 책임

```text
Team Lead
├── 전체 일정 관리
├── GitHub Issue 배정
├── API Contract 변경 관리
├── PR Review
├── develop → main Merge 관리
├── 팀원별 Git 활동 확인
└── 최종 Regression Test 조율
```

---

## 2-2. 김두운 — Frontend

### 주요 역할

* React 기반 Frontend 구현
* 로그인 / 회원가입 / 채팅 화면 구성
* 사용자 Interaction 처리
* Backend API 연결
* JWT 인증 상태 관리
* Frontend 오류 처리
* Vercel 배포

### 담당 기능

```text
Frontend
│
├── 화면 구성
│   ├── 로그인
│   ├── 회원가입
│   └── 채팅
│
├── 사용자 동작
│   ├── 버튼 클릭
│   ├── Enter 입력
│   └── Form Submit
│
├── 서버 통신
│   ├── POST /api/auth/login
│   ├── POST /api/auth/register
│   ├── POST /api/chat
│   ├── GET /api/me/chats
│   └── DELETE /api/me/chats
│
├── 인증 상태 관리
│   ├── JWT localStorage 저장
│   ├── Authorization Header 전달
│   ├── 로그아웃 시 Token 제거
│   ├── App 초기화 시 Token 확인
│   ├── 401 발생 시 인증 상태 초기화
│   └── Protected Route 처리
│
├── 사용자 입력
│   ├── 빈 입력 차단
│   ├── 500자 제한
│   └── 남은 글자 수 표시
│
├── 채팅 UI
│   ├── 사용자 / 챗봇 메시지 출력
│   ├── 날짜 구분선
│   ├── KST 시간 표시
│   └── 자동 Scroll
│
├── 오류 처리
│   ├── 로그인 오류
│   ├── 401 인증 오류
│   ├── Network Error
│   ├── Backend Error Message 추출
│   └── Object 직접 렌더링 방지
│
├── Frontend 보안
│   ├── React 기본 escaping 기반 렌더링
│   ├── dangerouslySetInnerHTML 사용 금지
│   └── 사용자 / AI 응답 HTML 직접 삽입 방지
│
├── 환경 설정
│   └── VITE_API_BASE_URL
│
└── Vercel 배포
    ├── GitHub Repository 연결
    ├── Production Build 확인
    ├── Backend API URL 환경변수 설정
    └── 배포 URL 정상 동작 확인
```

---

## 2-3. 박주영 — Backend 2 / Database / AI

### 주요 역할

* Database 설계 및 처리
* SQLAlchemy ORM
* ChatLog 저장 / 조회 / 삭제
* OpenAI API 연동
* 최근 대화 Context 구성
* AI Timeout / Retry / Error Handling
* AI 및 DB 관련 Logging

### 담당 기능

```text
Backend 2
│
├── Database 설계
│   ├── SQLite
│   ├── SQLAlchemy ORM
│   ├── User Table
│   ├── ChatLog Table
│   ├── Primary Key / Foreign Key
│   ├── User : ChatLog = 1:N 관계
│   └── nullable=False 등 데이터 제약조건
│
├── Database 처리
│   ├── DB Session 관리
│   ├── 사용자 데이터 저장 / 조회
│   ├── ChatLog 저장
│   ├── 사용자별 대화 기록 조회
│   ├── 사용자별 대화 기록 삭제
│   ├── commit()
│   └── rollback()
│
├── Repository / Service
│   ├── User Repository
│   ├── ChatLog Repository
│   └── Chat Service
│
├── AI API 연동
│   ├── OpenAI API 연결
│   ├── GPT-5 nano 모델 호출
│   ├── OPENAI_API_KEY 사용
│   ├── 사용자 질문 전달
│   └── AI Response 처리
│
├── 대화 Context
│   ├── 최근 3개 ChatLog 조회
│   ├── 이전 사용자 질문 가져오기
│   ├── 이전 AI 응답 가져오기
│   └── 현재 질문과 함께 AI에 전달
│
├── AI 오류 / 안정성 처리
│   ├── Timeout
│   ├── 최대 3회 Retry
│   ├── Exponential Backoff
│   ├── OpenAI API Error 처리
│   └── AI 호출 Logging
│
└── AI / DB 설정
    ├── OPENAI_API_KEY
    ├── DB 설정
    └── 필요한 Dependency 추가
```

### Backend 1과의 역할 경계

```text
POST /api/chat

[Backend 1 - 반가희]
Request 수신
→ request_id 생성
→ JWT 검증
→ current_user 확인
→ Pydantic 입력 검증

        ↓

[Backend 2 - 박주영]
최근 대화 조회
→ Context 구성
→ OpenAI 호출
→ AI 응답 수신
→ ChatLog 저장

        ↓

[Backend 1 - 반가희]
HTTP Response 반환
```

### GET /api/me/chats 흐름

```text
Frontend
    ↓
GET /api/me/chats
    ↓
[Backend 1]
JWT 검증
→ current_user 확인
    ↓
[Backend 2]
user_id 기준 ChatLog 조회
→ 시간순 또는 최신순 정렬
    ↓
[Backend 1]
Response Schema 변환
→ JSON 반환
    ↓
Frontend
```

### DELETE /api/me/chats 흐름

```text
Frontend
    ↓
DELETE /api/me/chats
    ↓
[Backend 1]
JWT 검증
→ current_user 확인
    ↓
[Backend 2]
해당 사용자의 ChatLog 삭제
→ commit()
→ 실패 시 rollback()
    ↓
[Backend 1]
HTTP Response 반환
    ↓
Frontend
```

---

## 2-4. 김승우 — QA / Test / Documentation

### 주요 역할

* 기능 테스트
* Integration Test
* DB 검증
* README 및 기술 문서 작성
* API 명세 및 ERD 관리
* 팀원별 작업 내용 정리
* 평가용 검증 자료 준비

### 담당 기능

```text
QA / Documentation
│
├── Backend Test
│   ├── 회원가입 성공
│   ├── 중복 회원가입
│   ├── 로그인 성공
│   ├── 로그인 실패
│   ├── JWT 없는 Chat 요청
│   ├── 빈 질문
│   ├── 500자 초과 질문
│   ├── ChatLog 조회
│   └── ChatLog 삭제
│
├── Integration Test
│   ├── Frontend → Backend
│   ├── Backend → OpenAI
│   ├── Backend → Database
│   └── 인증 상태 확인
│
├── DB 검증
│   ├── 확인용 SQL 또는 Script
│   ├── 사용자별 ChatLog 확인
│   └── README DB 확인 가이드
│
└── Documentation
    ├── 프로젝트 개요
    ├── 문제 정의
    ├── Target User
    ├── 핵심 Scenario
    ├── Architecture
    ├── API 명세
    ├── Request / Response 예시
    ├── ERD
    ├── 환경변수 설명
    ├── 실행 방법
    ├── 배포 방법
    ├── 팀 역할
    └── 개인별 작업 요약
```

---

# 3. 전체 역할 요약

```text
김두운
= 사용자가 보는 부분
= React / UI / API Client / Vercel

반가희
= 서버의 입구 + 인증 + 운영
= FastAPI / Auth / Router / Logging / Railway / Integration

박주영
= 서버 내부 데이터 + AI
= Database / Repository / OpenAI / Context / Retry

김승우
= 제대로 동작하는지 검증 + 설명
= Test / QA / DB Verification / Documentation
```

---

# 4. API Contract

Frontend와 Backend는 아래 API를 공통 Contract로 사용한다.

| Method | Endpoint | 인증 | 설명 |
|---|---|---|---|
| POST | `/api/auth/register` | X | 회원가입 |
| POST | `/api/auth/login` | X | 로그인 및 JWT 발급 |
| POST | `/api/chat` | O | AI 질문 전송 |
| GET | `/api/me/chats` | O | 내 대화 기록 조회 |
| DELETE | `/api/me/chats` | O | 내 대화 기록 삭제 |

API Contract가 변경되는 경우 개인 판단으로 수정하지 않고 팀에 먼저 공유한다.

API별로 다음 항목을 명확하게 정의한다.

```text
Method
Endpoint
Authentication 필요 여부
Request JSON
Response JSON
Success Status Code
Error Status Code
Error Response
```

---

# 5. Git Branch Strategy

Frontend / Backend Repository 모두 아래 Workflow를 기본으로 사용한다.

```text
main
 │
 └── develop
       │
       ├── feature/...
       ├── fix/...
       ├── test/...
       ├── docs/...
       └── chore/...
```

## 기본 개발 흐름

```text
GitHub Issue
    ↓
작업 Branch 생성
    ↓
개발
    ↓
Commit
    ↓
Push
    ↓
Pull Request
    ↓
Code Review
    ↓
develop Merge
    ↓
Integration Test
    ↓
develop → main Pull Request
    ↓
Production Release
```

---

# 6. Branch Naming Convention

## 기능 개발

```text
feature/login-page
feature/register-page
feature/chat-ui
feature/register-api
feature/login-api
feature/chat-api
feature/jwt-auth
feature/chat-context
feature/chat-history
feature/openai-api
```

## 버그 수정

```text
fix/login-error
fix/jwt-expiration
fix/chat-scroll
fix/context-order
```

## 테스트

```text
test/auth-api
test/chat-validation
test/chat-history
```

## 문서

```text
docs/api-spec
docs/architecture
docs/deployment-guide
docs/team-guide
```

## 설정 및 관리

```text
chore/update-dependencies
chore/env-example
```

---

# 7. Branch 규칙

1. `main`에 직접 Push하지 않는다.
2. 가능하면 `develop`에도 직접 Push하지 않는다.
3. 모든 기능 작업은 별도 Branch에서 진행한다.
4. 하나의 Branch는 하나의 명확한 작업을 목표로 한다.
5. 작업 완료 후 `develop`을 대상으로 Pull Request를 생성한다.
6. 다른 팀원의 Review 후 Merge한다.
7. Production 배포 전 `develop → main` Pull Request를 생성한다.
8. Merge 후 사용이 끝난 Feature Branch는 삭제한다.

---

# 8. Commit Convention

## 기본 형식

```text
<type>(<scope>): <한국어 작업 내용>
```

`scope`는 선택 사항이다. 변경 범위가 명확한 경우 소문자 영문으로 작성하고,
범위를 별도로 구분할 필요가 없으면 아래처럼 생략한다.

```text
<type>: <한국어 작업 내용>
```

작업 내용은 한국어로 작성하되 API, JWT, Markdown, Railway처럼 의미 전달에
필요한 기술 용어와 고유명사는 원문 표기를 허용한다. GitHub가 자동 생성하는
Merge Commit 메시지는 이 규칙의 예외로 한다.

예시:

```text
feat: 로그인 API 구현
feat(auth): JWT access token 발급 로직 추가
fix: JWT 만료 처리 수정
fix(ui): 모바일 레이아웃 오류 수정
test: 회원가입 중복 테스트 추가
test(chat): 질문 전송 실패 테스트 추가
docs: API 명세 업데이트
docs(readme): 로컬 실행 방법 보완
refactor: chat service 로직 분리
chore: requirements 의존성 추가
```

## Commit Type

| Type | 의미 |
|---|---|
| `feat` | 새로운 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서 추가 및 수정 |
| `test` | 테스트 추가 및 수정 |
| `refactor` | 기능 변화 없이 코드 구조 개선 |
| `style` | 코드 Formatting 등 기능 변화 없는 수정 |
| `chore` | 설정, Dependency 등 기타 관리 작업 |
| `build` | Build 또는 배포 관련 설정 |
| `ci` | CI 관련 설정 |
| `perf` | 성능 개선 |

## 좋은 Commit Message 예시

```text
feat: 회원가입 API 구현
feat: JWT access token 발급 로직 추가
feat: 채팅 입력 글자 수 표시 추가
fix: 공백 질문 검증 오류 수정
fix: 401 응답 시 로그인 페이지 이동 처리
test: 로그인 실패 테스트 추가
docs: Railway 배포 방법 추가
refactor: AI 호출 로직 service로 분리
chore: OpenAI dependency 추가
```

## 피해야 할 Commit Message

```text
update
fix
수정
수정2
final
complete
완성
작업함
123
```

너무 많은 작업을 하나의 Commit에 넣는 것도 피한다.

### 권장

```text
feat: 로그인 페이지 구현
feat: 로그인 API 연결
feat: JWT localStorage 저장 로직 추가
```

### 비권장

```text
feat: frontend 전체 완성
```

---

# 9. Pull Request 사용 규칙

각 Repository에는 공통 Pull Request Template을 적용한다.

Pull Request는 단순 Merge 수단이 아니라 다음 내용을 기록하기 위해 사용한다.

* 누가 어떤 기능을 구현했는지
* 어떤 Issue와 연결된 작업인지
* 어떤 변경이 발생했는지
* 테스트는 어떻게 했는지
* 누가 Review했는지

## PR 생성 전 확인

* 최신 `develop` Branch를 반영한다.
* 로컬 실행을 확인한다.
* 관련 기능을 직접 테스트한다.
* 불필요한 Debug 코드가 없는지 확인한다.
* `.env` 또는 API Key가 포함되지 않았는지 확인한다.
* 변경된 파일을 확인한다.
* 관련 Issue 번호를 확인한다.

---

# 10. Pull Request 제목 규칙

예시:

```text
[FE] 로그인 페이지 및 인증 상태 처리
[FE] 채팅 UI 구현

[BE] JWT 인증 API 구현
[BE] Chat API Router 구현

[DB] ChatLog 저장 및 조회 구현

[AI] OpenAI API 연동
[AI] 최근 3개 대화 Context 구성

[TEST] 인증 API 테스트 추가

[DOCS] API 명세 업데이트

[DEPLOY] Railway 배포 설정
```

---

# 11. Code Review 규칙

Reviewer는 최소한 아래 내용을 확인한다.

```text
기능이 요구사항대로 동작하는가?
기존 기능을 깨뜨리지 않는가?
API Contract와 일치하는가?
민감정보가 포함되어 있지 않은가?
불필요한 Debug 코드가 남아있지 않은가?
파일 구조가 역할에 맞게 분리되어 있는가?
오류 상황이 처리되어 있는가?
코드를 이해하기 어렵게 중복 작성하지 않았는가?
```

가능하면 자기 PR을 자신이 바로 Merge하지 않고 다른 팀원이 확인한다.

---

# 12. GitHub Issue 사용 규칙

각 Repository에는 공통 Issue Template을 적용한다.

가능하면 모든 기능 개발은 Issue에서 시작한다.

예시:

```text
[Frontend] 로그인 페이지 구현
[Frontend] 회원가입 페이지 구현
[Frontend] Chat UI 구현
[Frontend] JWT 인증 상태 관리
[Frontend] Vercel 배포

[Backend] FastAPI 기본 구조 구현
[Backend] 회원가입 API 구현
[Backend] 로그인 API 구현
[Backend] JWT 인증 구현
[Backend] Chat API Router 구현
[Backend] CORS 설정
[Backend] Railway 배포

[Database] User Model 구현
[Database] ChatLog Model 구현
[Database] ChatLog 저장 기능 구현
[Database] 사용자별 ChatLog 조회 구현
[Database] ChatLog 삭제 구현

[AI] OpenAI API 연동
[AI] 최근 3개 Context 구성
[AI] Timeout 구현
[AI] Retry 및 Exponential Backoff 구현

[Test] 회원가입 API 테스트
[Test] 로그인 API 테스트
[Test] Chat 입력 검증 테스트
[Test] ChatLog 테스트

[Docs] 프로젝트 개요 작성
[Docs] API 명세 작성
[Docs] Architecture 작성
[Docs] ERD 작성
[Docs] 실행 및 배포 가이드 작성
```

기본 흐름:

```text
Issue
  ↓
Branch
  ↓
Commit
  ↓
Pull Request
  ↓
Review
  ↓
develop Merge
```

---

# 13. 민감정보 관리

다음 정보는 절대 GitHub Repository에 직접 Push하지 않는다.

```text
.env
실제 API Key
SECRET_KEY 실제 값
DB Password
JWT Token
개인 인증 정보
```

## Backend `.gitignore`

```gitignore
.env
.venv/
__pycache__/
*.pyc
.pytest_cache/
```

## Frontend `.gitignore`

```gitignore
.env
.env.local
node_modules/
dist/
```

---

# 14. `.env.example`

실제 값은 작성하지 않고 필요한 환경변수 이름만 작성한다.

## Backend

```env
SECRET_KEY=
DATABASE_URL=
OPENAI_API_KEY=
```

## Frontend

```env
VITE_API_BASE_URL=
```

---

# 15. Frontend ↔ Backend 연결

개발 환경에서는 예를 들어 다음과 같이 연결한다.

```text
React
http://localhost:5173

        ↓

FastAPI
http://localhost:8000
```

배포 환경에서는:

```text
React
https://example.vercel.app

        ↓

FastAPI
https://example.up.railway.app
```

Frontend에서는 Backend 주소를 코드에 직접 작성하지 않고:

```text
VITE_API_BASE_URL
```

환경변수를 사용한다.

---

# 16. CORS 관리

Frontend와 Backend가 서로 다른 Origin에서 실행되므로 FastAPI에 CORS 설정이 필요하다.

```text
Frontend
Vercel

https://example.vercel.app

        ↓ HTTPS Request

Backend
Railway

https://example.up.railway.app
```

Backend에서 허용할 항목:

```text
Vercel Frontend Origin
Authorization Header
Content-Type
필요한 HTTP Method
```

Production에서는 모든 Origin을 `*`로 허용하기보다 실제 Frontend URL을 허용하는 것을 원칙으로 한다.

---

# 17. 인증 흐름

```text
사용자 로그인
    ↓
POST /api/auth/login
    ↓
FastAPI
    ↓
ID / Password 검증
    ↓
JWT 발급
    ↓
React
    ↓
localStorage 저장
    ↓
이후 보호 API 요청
    ↓
Authorization: Bearer <JWT>
    ↓
FastAPI JWT 검증
    ↓
current_user 확인
    ↓
API 처리
```

Frontend에서는:

```text
JWT 저장
→ API 요청 시 Authorization Header 추가
→ 401 발생 시 인증 상태 제거
→ 로그인 화면으로 이동
```

---

# 18. Chat 처리 흐름

```text
사용자 질문 입력
      ↓
React
      ↓
POST /api/chat
      ↓
FastAPI Router
      ↓
JWT 검증
      ↓
입력 검증
      ↓
최근 3개 ChatLog 조회
      ↓
Context 구성
      ↓
OpenAI API 호출
      ↓
AI Response 수신
      ↓
ChatLog DB 저장
      ↓
HTTP Response 반환
      ↓
React
      ↓
채팅 화면 출력
```

---

# 19. Context 구성

최소한 최근 3개의 사용자 대화를 Context로 사용한다.

```text
DB

최근 ChatLog 3개
│
├── User Question 1
│   └── AI Answer 1
│
├── User Question 2
│   └── AI Answer 2
│
└── User Question 3
    └── AI Answer 3

        +

현재 질문

        ↓

OpenAI API
```

---

# 20. AI 안정성 처리

AI API 호출 시 다음을 적용한다.

```text
AI Call
  │
  ├── Success
  │      ↓
  │   Response 처리
  │
  └── Failure
         ↓
      Timeout / API Error 확인
         ↓
      Retry
         ↓
      Exponential Backoff
         ↓
      최대 Retry 횟수 초과
         ↓
      사용자 오류 안내
```

## 기본 요구사항

* Timeout 설정
* 최대 3회 Retry
* Exponential Backoff
* AI API Error 처리
* 서버 비정상 종료 방지
* 사용자에게 오류 메시지 반환

---

# 21. Logging

서버 로그에는 최소한 아래 이벤트를 기록한다.

```text
request_received
ai_call_start
ai_call_success
ai_call_failure
db_save_success
db_save_failure
```

예:

```text
INFO request_received user_id=12 request_id=abc123 path=/api/chat
INFO ai_call_start user_id=12 request_id=abc123
INFO ai_call_success request_id=abc123 latency_ms=1240
INFO db_save_success user_id=12 chat_id=987
```

민감정보와 사용자 질문 전체를 불필요하게 로그에 남기지 않는다.

---

# 22. Frontend 보안

React에서는 일반 JSX 렌더링을 사용한다.

예:

```jsx
<div>{message}</div>
```

사용자 또는 AI 응답을 HTML로 직접 삽입하지 않는다.

피해야 할 방식:

```jsx
dangerouslySetInnerHTML
```

기본 원칙:

```text
React 기본 escaping 사용
사용자 입력을 HTML로 직접 실행하지 않기
AI 응답을 HTML로 직접 삽입하지 않기
dangerouslySetInnerHTML 사용 금지
```

---

# 23. 배포 책임

## Frontend — 김두운

```text
React
  ↓
GitHub Frontend Repository
  ↓
Vercel
```

담당:

* Vercel과 GitHub Repository 연결
* Production Build 확인
* `VITE_API_BASE_URL` 설정
* 배포 후 로그인 / 회원가입 / Chat 화면 확인
* 실제 Backend와 통신 확인

## Backend — 반가희

```text
FastAPI
  ↓
GitHub Backend Repository
  ↓
Railway
```

담당:

* Railway와 GitHub Repository 연결
* Uvicorn 실행 설정
* 환경변수 설정
* `SECRET_KEY`
* `DATABASE_URL`
* `OPENAI_API_KEY`
* Persistent Volume 연결
* 배포 후 API 정상 동작 확인

---

# 24. 공통 Definition of Done

하나의 Issue가 완료되었다고 판단하려면 가능한 한 아래 조건을 충족한다.

* [ ] 요구 기능이 구현되었다.
* [ ] 로컬에서 정상 동작한다.
* [ ] 오류 상황을 확인했다.
* [ ] 관련 테스트를 수행했다.
* [ ] Commit Message Convention을 지켰다.
* [ ] Pull Request를 생성했다.
* [ ] 다른 팀원이 Review했다.
* [ ] `develop`에 Merge되었다.
* [ ] API 변경 시 관련 문서를 수정했다.
* [ ] 민감정보가 Git에 포함되지 않았다.

---

# 25. 권장 개발 순서

## Phase 1 — Project Setup

```text
Repository 구성
→ develop Branch 생성
→ PR Template 적용
→ Issue Template 적용
→ Commit Convention 공유
→ GitHub Issue 생성
→ 환경 설정
```

## Phase 2 — 기본 기능

```text
회원가입
→ 로그인
→ JWT
→ Chat 화면
→ Mock Chat API
```

Mock Chat API 단계에서는 아직 실제 OpenAI API를 연결하지 않고 임시 응답을 사용해도 된다.

예:

```json
{
  "answer": "임시 테스트 응답입니다."
}
```

목표:

```text
Frontend
→ Backend
→ Response
→ Frontend 출력
```

전체 연결이 정상 동작하는지 먼저 확인한다.

## Phase 3 — Database

```text
User
→ ChatLog
→ 대화 저장
→ 대화 조회
→ 대화 삭제
```

## Phase 4 — AI

```text
OpenAI API
→ 최근 3개 Context
→ AI Response
→ ChatLog DB 저장
```

## Phase 5 — 안정성

```text
Timeout
→ Retry
→ Exponential Backoff
→ Logging
→ Error Handling
→ Validation
```

## Phase 6 — 배포

```text
React → Vercel

FastAPI → Railway

SQLite → Persistent Volume
```

## Phase 7 — Final QA

```text
Regression Test
→ README 최종화
→ API 문서 확인
→ ERD 확인
→ 팀원별 작업 정리
→ Git History 확인
→ 외부 Network 접속 확인
```

---

# 26. 팀원별 Commit 관리

평가 요구사항:

```text
팀원별 유의미한 Commit 최소 10회 이상
```

따라서 마지막에 Commit 수를 맞추려고 억지로 작업을 나누기보다 처음부터 기능 단위로 Commit한다.

예:

```text
feat: 로그인 페이지 UI 구현
feat: 로그인 입력 검증 추가
feat: 로그인 API 연결
feat: JWT 저장 로직 구현
fix: 로그인 오류 메시지 처리
```

하나의 큰 Commit:

```text
feat: 로그인 기능 완성
```

보다는 기능 단위 Commit을 권장한다.

단, 단순히 Commit 수를 늘리기 위해 의미 없는 변경을 반복하지 않는다.

---

# 27. 팀 공통 작업 원칙

```text
1. main에 직접 Push하지 않는다.

2. 가능하면 develop에도 직접 Push하지 않는다.

3. 모든 기능은 GitHub Issue에서 시작한다.

4. 기능별 Branch를 생성한다.

5. 의미 있는 단위로 Commit한다.

6. Commit Convention을 따른다.

7. develop으로 Pull Request를 생성한다.

8. 다른 팀원의 Review 후 Merge한다.

9. API Contract를 임의로 변경하지 않는다.

10. API 변경 시 Frontend / Backend / Docs 담당자에게 공유한다.

11. .env와 API Key를 절대 Push하지 않는다.

12. 각 팀원은 최소 10개의 유의미한 Commit을 남긴다.

13. Merge 전 로컬 테스트를 수행한다.

14. Production 배포 전 develop에서 Integration Test를 수행한다.
```

---

# 28. 평가 전 최종 체크리스트

## 기능

* [ ] 회원가입이 정상 동작한다.
* [ ] 중복 회원가입이 차단된다.
* [ ] 로그인이 정상 동작한다.
* [ ] 로그인 후 JWT가 발급된다.
* [ ] 로그인하지 않은 사용자는 보호 API를 사용할 수 없다.
* [ ] Chat 페이지에서 질문 입력이 가능하다.
* [ ] 질문 후 AI 응답이 같은 화면에 표시된다.
* [ ] 최근 3개의 대화 Context가 적용된다.
* [ ] ChatLog가 DB에 저장된다.
* [ ] 사용자별 대화 기록 조회가 가능하다.
* [ ] 사용자별 대화 기록 삭제가 가능하다.

## 입력 검증

* [ ] 빈 질문이 차단된다.
* [ ] 공백만 있는 질문이 차단된다.
* [ ] 500자 초과 질문이 차단된다.
* [ ] username / password 검증이 적용되어 있다.

## 오류 처리

* [ ] 잘못된 로그인 정보에 오류가 반환된다.
* [ ] JWT가 없거나 잘못된 경우 401이 반환된다.
* [ ] AI Timeout 상황에서 서버가 종료되지 않는다.
* [ ] AI API 실패 시 사용자에게 오류 안내가 표시된다.
* [ ] DB 저장 실패 시 rollback이 수행된다.
* [ ] Network Error가 Frontend에서 처리된다.

## Logging

* [ ] `request_received` 로그가 존재한다.
* [ ] `ai_call_start` 로그가 존재한다.
* [ ] `ai_call_success` 또는 실패 로그가 존재한다.
* [ ] `db_save_success` 또는 실패 로그가 존재한다.
* [ ] `request_id`로 요청 흐름을 추적할 수 있다.

## 보안

* [ ] `.env`가 GitHub에 올라가지 않았다.
* [ ] `.env.example`이 존재한다.
* [ ] API Key가 코드에 직접 작성되어 있지 않다.
* [ ] `SECRET_KEY`가 코드에 직접 작성되어 있지 않다.
* [ ] Frontend에서 OpenAI API를 직접 호출하지 않는다.
* [ ] React에서 사용자 입력을 HTML로 직접 렌더링하지 않는다.

## 배포

* [ ] Frontend가 Vercel에 배포되어 있다.
* [ ] Backend가 Railway에 배포되어 있다.
* [ ] Frontend에서 Production Backend API 호출이 가능하다.
* [ ] Railway 환경변수가 정상 설정되어 있다.
* [ ] SQLite Persistent Volume이 연결되어 있다.
* [ ] 외부 Network에서 서비스 URL 접속이 가능하다.

## 협업

* [ ] `main / develop` Branch Strategy가 적용되어 있다.
* [ ] 기능별 Branch 기록이 존재한다.
* [ ] PR 기반 Merge 기록이 존재한다.
* [ ] PR Review 기록이 존재한다.
* [ ] 모든 팀원이 유의미한 Commit 10회 이상을 보유한다.
* [ ] Commit Convention을 사용하고 있다.
* [ ] PR Template을 사용하고 있다.
* [ ] Issue Template을 사용하고 있다.

## 문서

* [ ] 프로젝트 개요가 작성되어 있다.
* [ ] 문제 정의가 작성되어 있다.
* [ ] Target User가 작성되어 있다.
* [ ] 핵심 Scenario가 작성되어 있다.
* [ ] Architecture가 작성되어 있다.
* [ ] API 명세가 작성되어 있다.
* [ ] Request / Response 예시가 존재한다.
* [ ] DB 구조 또는 ERD가 존재한다.
* [ ] 환경변수 설정 방법이 작성되어 있다.
* [ ] 로컬 실행 방법이 작성되어 있다.
* [ ] 배포 방법이 작성되어 있다.
* [ ] DB 확인 방법이 작성되어 있다.
* [ ] 팀원별 역할이 작성되어 있다.
* [ ] 개인별 작업 요약이 Git History와 크게 모순되지 않는다.
