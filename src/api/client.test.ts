import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { API_BASE_URL, ApiError, authApi } from './client'
import { server } from '../test/server'

describe('API client', () => {
  it('서버의 detail 문자열을 ApiError로 변환한다', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/auth/register`, () =>
        HttpResponse.json(
          { detail: '이미 존재하는 아이디입니다.' },
          { status: 400 },
        ),
      ),
    )

    await expect(
      authApi.register({ username: 'chat_user', password: 'password123' }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      kind: 'http',
      message: '이미 존재하는 아이디입니다.',
    })
  })

  it('FastAPI 422 오류 배열에서 필드 메시지를 추출한다', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/auth/register`, () =>
        HttpResponse.json(
          {
            detail: [
              {
                loc: ['body', 'username'],
                msg: 'String should have at least 3 characters',
                type: 'string_too_short',
              },
            ],
          },
          { status: 422 },
        ),
      ),
    )

    const promise = authApi.register({ username: 'ab', password: 'password123' })
    await expect(promise).rejects.toBeInstanceOf(ApiError)
    await expect(promise).rejects.toMatchObject({
      status: 422,
      message: 'username: String should have at least 3 characters',
    })
  })

  it('fetch 실패를 네트워크 오류로 구분한다', async () => {
    server.use(
      http.post(`${API_BASE_URL}/api/auth/login`, () => HttpResponse.error()),
    )

    await expect(
      authApi.login({ username: 'chat_user', password: 'password123' }),
    ).rejects.toMatchObject({
      status: null,
      kind: 'network',
      message: '서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.',
    })
  })
})
