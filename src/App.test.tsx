import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { API_BASE_URL } from './api/client'
import {
  ACCESS_TOKEN_STORAGE_KEY,
  AuthProvider,
} from './auth/AuthContext'
import { server } from './test/server'

const currentUser = {
  id: 1,
  username: 'chat_user',
  is_admin: false,
  created_at: '2026-08-20T03:00:00Z',
}

const adminUser = {
  id: 99,
  username: 'admin_user',
  is_admin: true,
  created_at: '2026-08-20T03:00:00Z',
}

function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

function installAuthenticatedHandlers(
  chats: Array<{
    id: number
    question: string
    response: string
    created_at: string
  }> = [],
  authenticatedUser = currentUser,
) {
  server.use(
    http.get(`${API_BASE_URL}/api/me`, () =>
      HttpResponse.json(authenticatedUser),
    ),
    http.get(`${API_BASE_URL}/api/me/chats`, () =>
      HttpResponse.json({ items: chats, count: chats.length }),
    ),
  )
}

describe('ChatFlow application', () => {
  it('토큰이 없는 사용자를 로그인 화면으로 보낸다', async () => {
    renderApp('/chat')

    expect(await screen.findByRole('heading', { name: '대화를 이어가세요' })).toBeVisible()
  })

  it('저장된 토큰으로 사용자와 이전 대화를 복원한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'valid-token')
    installAuthenticatedHandlers([
      {
        id: 10,
        question: '이전 질문',
        response: '이전 답변',
        created_at: '2026-08-20T15:30:00Z',
      },
    ])

    renderApp('/chat')

    expect(await screen.findByText('이전 질문')).toBeVisible()
    expect(screen.getByText('이전 답변')).toBeVisible()
    expect(screen.getByText(/2026년 8월 21일/)).toBeVisible()
    expect(screen.getByText('chat_user')).toBeVisible()
  })

  it('만료된 저장 토큰을 제거하고 안내한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'expired-token')
    server.use(
      http.get(`${API_BASE_URL}/api/me`, () =>
        HttpResponse.json({ detail: '만료되었습니다.' }, { status: 401 }),
      ),
    )

    renderApp('/chat')

    expect(
      await screen.findByText('로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'),
    ).toBeVisible()
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('회원가입 후 아이디와 완료 안내를 가지고 로그인으로 이동한다', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/auth/register`, () =>
        HttpResponse.json(currentUser, { status: 201 }),
      ),
    )
    const user = userEvent.setup()
    renderApp('/register')

    await user.type(screen.getByLabelText('아이디'), 'chat_user')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password123')
    await user.click(screen.getByRole('button', { name: '회원가입' }))

    expect(
      await screen.findByText('회원가입이 완료되었습니다. 로그인해 주세요.'),
    ).toBeVisible()
    expect(screen.getByLabelText('아이디')).toHaveValue('chat_user')
  })

  it('로그인 성공 시 토큰을 저장하고 채팅 화면에 진입한다', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/auth/login`, () =>
        HttpResponse.json({
          access_token: 'new-token',
          token_type: 'bearer',
          expires_in: 86400,
        }),
      ),
      http.get(`${API_BASE_URL}/api/me`, () => HttpResponse.json(currentUser)),
      http.get(`${API_BASE_URL}/api/me/chats`, () =>
        HttpResponse.json({ items: [], count: 0 }),
      ),
    )
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText('아이디'), 'chat_user')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('무엇이든 물어보세요')).toBeVisible()
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe('new-token')
  })

  it('잘못된 로그인 정보에 대한 서버 안내를 표시한다', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/auth/login`, () =>
        HttpResponse.json(
          { detail: '아이디 또는 비밀번호가 올바르지 않습니다.' },
          { status: 401 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText('아이디'), 'chat_user')
    await user.type(screen.getByLabelText('비밀번호'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(
      await screen.findByText('아이디 또는 비밀번호가 올바르지 않습니다.'),
    ).toBeVisible()
    expect(
      screen.queryByText('인증이 만료되었습니다. 다시 로그인해 주세요.'),
    ).not.toBeInTheDocument()
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('질문 전송 결과를 표시하고 전체 기록을 삭제한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'valid-token')
    installAuthenticatedHandlers()
    server.use(
      http.post(`${API_BASE_URL}/api/chat`, async ({ request }) => {
        const authorization = request.headers.get('Authorization')
        expect(authorization).toBe('Bearer valid-token')
        return HttpResponse.json(
          {
            id: 11,
            question: '새 질문',
            response: '새 답변',
            created_at: '2026-08-21T05:00:00Z',
            request_id: 'request-id',
          },
          { status: 201 },
        )
      }),
      http.delete(`${API_BASE_URL}/api/me/chats`, () =>
        HttpResponse.json({
          message: '대화 기록이 삭제되었습니다.',
          deleted_count: 1,
        }),
      ),
    )
    const user = userEvent.setup()
    renderApp('/chat')

    await screen.findByText('무엇이든 물어보세요')
    const composer = screen.getByLabelText('AI에게 보낼 질문')
    await user.type(composer, '새 질문')
    await user.keyboard('{Enter}')

    expect(await screen.findByText('새 답변')).toBeVisible()
    expect(composer).toHaveValue('')

    await user.click(screen.getByRole('button', { name: '전체 삭제' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/AI가 참고하는 이전 대화 문맥/)).toBeVisible()
    await user.click(within(dialog).getByRole('button', { name: '전체 삭제' }))

    expect(await screen.findByText('1개의 대화 기록을 삭제했습니다.')).toBeVisible()
    expect(screen.queryByText('새 답변')).not.toBeInTheDocument()
  })

  it('추천 프롬프트를 클릭하면 즉시 질문을 전송한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'valid-token')
    installAuthenticatedHandlers()
    const postHandler = vi.fn()
    server.use(
      http.post(`${API_BASE_URL}/api/chat`, async ({ request }) => {
        postHandler()
        expect(await request.json()).toEqual({
          question: '⚡️ React 렌더링 최적화 팁 알려줘',
        })
        return HttpResponse.json(
          {
            id: 13,
            question: '⚡️ React 렌더링 최적화 팁 알려줘',
            response: '메모이제이션을 필요한 곳에만 적용하세요.',
            created_at: '2026-08-21T05:00:00Z',
            request_id: 'prompt-request-id',
          },
          { status: 201 },
        )
      }),
    )
    const user = userEvent.setup()
    renderApp('/chat')

    await user.click(
      await screen.findByRole('button', {
        name: '⚡️ React 렌더링 최적화 팁 알려줘',
      }),
    )

    expect(await screen.findByText('메모이제이션을 필요한 곳에만 적용하세요.')).toBeVisible()
    expect(postHandler).toHaveBeenCalledTimes(1)
  })

  it('작성 중인 입력이 있어도 추천 프롬프트 전송 성공 후 입력창을 비운다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'valid-token')
    installAuthenticatedHandlers()
    server.use(
      http.post(`${API_BASE_URL}/api/chat`, () =>
        HttpResponse.json(
          {
            id: 14,
            question: '⚡️ React 렌더링 최적화 팁 알려줘',
            response: '추천 답변',
            created_at: '2026-08-21T05:00:00Z',
            request_id: 'prompt-draft-request-id',
          },
          { status: 201 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderApp('/chat')

    await screen.findByText('무엇이든 물어보세요')
    const composer = screen.getByLabelText('AI에게 보낼 질문')
    await user.type(composer, '작성 중인 질문')
    await user.click(
      screen.getByRole('button', {
        name: '⚡️ React 렌더링 최적화 팁 알려줘',
      }),
    )

    expect(await screen.findByText('추천 답변')).toBeVisible()
    expect(screen.getByLabelText('AI에게 보낼 질문')).toHaveValue('')
  })

  it('AI timeout 오류를 보여주고 입력한 질문을 보존한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'valid-token')
    installAuthenticatedHandlers()
    server.use(
      http.post(`${API_BASE_URL}/api/chat`, () =>
        HttpResponse.json(
          { detail: 'AI 응답 시간이 초과되었습니다.' },
          { status: 504 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderApp('/chat')

    await screen.findByText('무엇이든 물어보세요')
    const composer = screen.getByLabelText('AI에게 보낼 질문')
    await user.type(composer, '느린 질문')
    await user.click(screen.getByRole('button', { name: '질문 전송' }))

    expect(await screen.findByText('AI 응답 시간이 초과되었습니다.')).toBeVisible()
    expect(composer).toHaveValue('느린 질문')
  })

  it('보호 API의 401 응답으로 세션을 종료한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'valid-token')
    installAuthenticatedHandlers()
    server.use(
      http.post(`${API_BASE_URL}/api/chat`, () =>
        HttpResponse.json(
          { detail: '인증 자격 증명이 유효하지 않거나 만료되었습니다.' },
          { status: 401 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderApp('/chat')

    await screen.findByText('무엇이든 물어보세요')
    await user.type(screen.getByLabelText('AI에게 보낼 질문'), '질문')
    await user.click(screen.getByRole('button', { name: '질문 전송' }))

    expect(
      await screen.findByText('로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'),
    ).toBeVisible()
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('POST 네트워크 오류 뒤 저장된 기록을 조회해 중복 전송을 막는다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'valid-token')
    let historyRequests = 0
    server.use(
      http.get(`${API_BASE_URL}/api/me`, () => HttpResponse.json(currentUser)),
      http.get(`${API_BASE_URL}/api/me/chats`, () => {
        historyRequests += 1
        const items =
          historyRequests === 1
            ? []
            : [
                {
                  id: 20,
                  question: '연결 확인 질문',
                  response: '서버에 저장된 답변',
                  created_at: '2026-08-21T05:00:00Z',
                },
              ]
        return HttpResponse.json({ items, count: items.length })
      }),
      http.post(`${API_BASE_URL}/api/chat`, () => HttpResponse.error()),
    )
    const user = userEvent.setup()
    renderApp('/chat')

    await screen.findByText('무엇이든 물어보세요')
    const composer = screen.getByLabelText('AI에게 보낼 질문')
    await user.type(composer, '연결 확인 질문')
    await user.click(screen.getByRole('button', { name: '질문 전송' }))

    expect(await screen.findByText('서버에 저장된 답변')).toBeVisible()
    expect(
      screen.getByText('연결이 끊겼지만 서버에 저장된 응답을 다시 불러왔습니다.'),
    ).toBeVisible()
    expect(composer).toHaveValue('')
    expect(historyRequests).toBe(2)
  })

  it('500자를 초과한 질문의 전송을 차단한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'valid-token')
    installAuthenticatedHandlers()
    const postHandler = vi.fn()
    server.use(http.post(`${API_BASE_URL}/api/chat`, postHandler))
    renderApp('/chat')

    await screen.findByText('무엇이든 물어보세요')
    const composer = screen.getByLabelText('AI에게 보낼 질문')
    fireEvent.change(composer, { target: { value: '가'.repeat(501) } })

    expect(screen.getByText('1자 초과')).toBeVisible()
    expect(screen.getByRole('button', { name: '질문 전송' })).toBeDisabled()
    expect(postHandler).not.toHaveBeenCalled()
  })

  it('질문 길이와 Enter/Shift+Enter 동작을 검증한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'valid-token')
    installAuthenticatedHandlers()
    const postHandler = vi.fn(() =>
      HttpResponse.json(
        {
          id: 12,
          question: '첫 줄\n둘째 줄',
          response: '응답',
          created_at: '2026-08-21T05:00:00Z',
          request_id: 'request-id',
        },
        { status: 201 },
      ),
    )
    server.use(http.post(`${API_BASE_URL}/api/chat`, postHandler))
    const user = userEvent.setup()
    renderApp('/chat')

    await screen.findByText('무엇이든 물어보세요')
    const composer = screen.getByLabelText('AI에게 보낼 질문')
    await user.type(composer, '첫 줄{Shift>}{Enter}{/Shift}둘째 줄')
    expect(postHandler).not.toHaveBeenCalled()
    expect(composer).toHaveValue('첫 줄\n둘째 줄')

    await user.keyboard('{Enter}')
    await waitFor(() => expect(postHandler).toHaveBeenCalledTimes(1))
  })

  it('관리자가 채팅 경로에 직접 접근하면 관리자 화면으로 이동한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'admin-token')
    server.use(
      http.get(`${API_BASE_URL}/api/me`, () => HttpResponse.json(adminUser)),
      http.get(`${API_BASE_URL}/api/admin/users`, () =>
        HttpResponse.json({ items: [], count: 0 }),
      ),
    )

    renderApp('/chat')

    expect(await screen.findByRole('heading', { name: '사용자 대화 기록' })).toBeVisible()
    expect(screen.queryByText('무엇이든 물어보세요')).not.toBeInTheDocument()
  })

  it('관리자가 로그인하면 바로 관리자 화면으로 이동한다', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/auth/login`, () =>
        HttpResponse.json({
          access_token: 'admin-token',
          token_type: 'bearer',
          expires_in: 86400,
        }),
      ),
      http.get(`${API_BASE_URL}/api/me`, () => HttpResponse.json(adminUser)),
      http.get(`${API_BASE_URL}/api/admin/users`, () =>
        HttpResponse.json({ items: [], count: 0 }),
      ),
    )
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText('아이디'), 'admin_user')
    await user.type(screen.getByLabelText('비밀번호'), 'password123')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('heading', { name: '사용자 대화 기록' })).toBeVisible()
    expect(screen.queryByText('무엇이든 물어보세요')).not.toBeInTheDocument()
  })

  it('일반 사용자가 관리자 경로에 직접 접근하면 채팅 화면으로 돌려보낸다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'valid-token')
    installAuthenticatedHandlers()

    renderApp('/admin')

    expect(await screen.findByText('무엇이든 물어보세요')).toBeVisible()
    expect(screen.queryByText('사용자 대화 기록')).not.toBeInTheDocument()
  })

  it('관리자가 사용자 목록에서 선택한 사용자의 전체 대화를 조회한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'admin-token')
    const users = [
      {
        id: 2,
        username: 'target_user',
        created_at: '2026-08-21T03:00:00Z',
        chat_count: 2,
      },
      {
        id: 3,
        username: 'empty_user',
        created_at: '2026-08-20T03:00:00Z',
        chat_count: 0,
      },
    ]
    server.use(
      http.get(`${API_BASE_URL}/api/me`, () => HttpResponse.json(adminUser)),
      http.get(`${API_BASE_URL}/api/admin/users`, ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer admin-token')
        return HttpResponse.json({ items: users, count: users.length })
      }),
      http.get(`${API_BASE_URL}/api/admin/users/2/chats`, ({ request }) => {
        expect(request.headers.get('Authorization')).toBe('Bearer admin-token')
        return HttpResponse.json({
          user: users[0],
          items: [
            {
              id: 20,
              question: '첫 관리자 확인 질문',
              response: '**첫 답변**',
              created_at: '2026-08-21T04:00:00Z',
            },
            {
              id: 21,
              question: '두 번째 질문',
              response: '두 번째 답변',
              created_at: '2026-08-21T05:00:00Z',
            },
          ],
          count: 2,
        })
      }),
    )
    const user = userEvent.setup()
    renderApp('/admin')

    expect(
      await screen.findByRole('button', { name: 'target_user 사용자 대화 보기' }),
    ).toBeVisible()
    await user.click(
      screen.getByRole('button', { name: 'target_user 사용자 대화 보기' }),
    )

    expect(await screen.findByText('첫 관리자 확인 질문')).toBeVisible()
    expect(screen.getByText('첫 답변')).toBeVisible()
    expect(screen.getByText('두 번째 질문')).toBeVisible()
    expect(screen.getByText('두 번째 답변')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'target_user님의 대화' })).toBeVisible()
  })

  it('선택한 사용자의 대화가 없으면 빈 기록 안내를 표시한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'admin-token')
    const emptyUser = {
      id: 3,
      username: 'empty_user',
      created_at: '2026-08-20T03:00:00Z',
      chat_count: 0,
    }
    server.use(
      http.get(`${API_BASE_URL}/api/me`, () => HttpResponse.json(adminUser)),
      http.get(`${API_BASE_URL}/api/admin/users`, () =>
        HttpResponse.json({ items: [emptyUser], count: 1 }),
      ),
      http.get(`${API_BASE_URL}/api/admin/users/3/chats`, () =>
        HttpResponse.json({ user: emptyUser, items: [], count: 0 }),
      ),
    )
    const user = userEvent.setup()
    renderApp('/admin')

    await user.click(
      await screen.findByRole('button', { name: 'empty_user 사용자 대화 보기' }),
    )

    expect(await screen.findByText('대화 기록이 없습니다.')).toBeVisible()
  })

  it('관리자 사용자 목록 오류를 안내하고 다시 시도할 수 있다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'admin-token')
    let requestCount = 0
    server.use(
      http.get(`${API_BASE_URL}/api/me`, () => HttpResponse.json(adminUser)),
      http.get(`${API_BASE_URL}/api/admin/users`, () => {
        requestCount += 1
        return requestCount === 1
          ? HttpResponse.json({ detail: '목록 조회 실패' }, { status: 500 })
          : HttpResponse.json({ items: [], count: 0 })
      }),
    )
    const user = userEvent.setup()
    renderApp('/admin')

    expect(await screen.findByText('사용자 목록을 불러오지 못했습니다.')).toBeVisible()
    expect(screen.getByText('목록 조회 실패')).toBeVisible()
    await user.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(await screen.findByText('등록된 사용자가 없습니다.')).toBeVisible()
    expect(requestCount).toBe(2)
  })

  it('관리자 API의 403 응답을 권한 없음 화면으로 안내한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'admin-token')
    server.use(
      http.get(`${API_BASE_URL}/api/me`, () => HttpResponse.json(adminUser)),
      http.get(`${API_BASE_URL}/api/admin/users`, () =>
        HttpResponse.json({ detail: '관리자 권한이 필요합니다.' }, { status: 403 }),
      ),
    )
    renderApp('/admin')

    expect(await screen.findByText('관리자 권한이 없습니다.')).toBeVisible()
    expect(screen.getByText(/이 기능을 사용할 수 있는 계정/)).toBeVisible()
  })

  it('관리자 API의 401 응답으로 세션을 종료한다', async () => {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, 'admin-token')
    server.use(
      http.get(`${API_BASE_URL}/api/me`, () => HttpResponse.json(adminUser)),
      http.get(`${API_BASE_URL}/api/admin/users`, () =>
        HttpResponse.json(
          { detail: '인증 자격 증명이 유효하지 않거나 만료되었습니다.' },
          { status: 401 },
        ),
      ),
    )
    renderApp('/admin')

    expect(
      await screen.findByText('로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'),
    ).toBeVisible()
    expect(localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBeNull()
  })
  it('로그인 화면에서 아이디 입력 중 Enter를 누르면 비밀번호 입력란으로 포커스가 이동한다', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    const usernameInput = screen.getByLabelText('아이디')
    const passwordInput = screen.getByLabelText('비밀번호')

    await user.type(usernameInput, 'chat_user{enter}')
    expect(passwordInput).toHaveFocus()
  })

  it('회원가입 화면에서 Enter를 누르면 다음 입력란으로 순차적으로 포커스가 이동한다', async () => {
    const user = userEvent.setup()
    renderApp('/register')

    const usernameInput = screen.getByLabelText('아이디')
    const passwordInput = screen.getByLabelText('비밀번호')
    const confirmationInput = screen.getByLabelText('비밀번호 확인')

    await user.type(usernameInput, 'chat_user{enter}')
    expect(passwordInput).toHaveFocus()

    await user.type(passwordInput, 'password123{enter}')
    expect(confirmationInput).toHaveFocus()
  })
})
