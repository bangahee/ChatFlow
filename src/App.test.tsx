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
) {
  server.use(
    http.get(`${API_BASE_URL}/api/me`, () => HttpResponse.json(currentUser)),
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
})
