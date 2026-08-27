import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { validatePassword, validateUsername } from '../utils/validation'

interface LoginLocationState {
  username?: string
  message?: string
}

interface FieldErrors {
  username?: string
  password?: string
}

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login, notice, consumeNotice } = useAuth()
  const state = (location.state ?? {}) as LoginLocationState
  const [username, setUsername] = useState(state.username ?? '')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [infoMessage] = useState<string | null>(state.message ?? notice)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (notice) consumeNotice()
  }, [consumeNotice, notice])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors: FieldErrors = {
      username: validateUsername(username) ?? undefined,
      password: validatePassword(password) ?? undefined,
    }
    setFieldErrors(errors)
    setSubmitError(null)

    if (errors.username || errors.password) return

    setSubmitting(true)
    try {
      await login({ username: username.trim(), password })
      navigate('/chat', { replace: true })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="다시 오신 것을 환영해요"
      title="대화를 이어가세요"
      description="로그인하면 저장된 대화를 불러오고 AI와 바로 이야기할 수 있어요."
    >
      <div className="space-y-4">
        {infoMessage ? <Alert tone="success">{infoMessage}</Alert> : null}
        {submitError ? <Alert tone="error">{submitError}</Alert> : null}
      </div>

      <form className="mt-5 space-y-5" onSubmit={handleSubmit} noValidate>
        <FormField
          id="login-username"
          label="아이디"
          name="username"
          type="text"
          autoComplete="username"
          autoFocus
          value={username}
          error={fieldErrors.username}
          placeholder="chat_user"
          onChange={(event) => {
            setUsername(event.target.value)
            setFieldErrors((current) => ({ ...current, username: undefined }))
          }}
        />
        <FormField
          id="login-password"
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={fieldErrors.password}
          placeholder="8자 이상 입력"
          onChange={(event) => {
            setPassword(event.target.value)
            setFieldErrors((current) => ({ ...current, password: undefined }))
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="mr-2 size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              로그인 중…
            </>
          ) : (
            '로그인'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        아직 계정이 없나요?{' '}
        <Link
          to="/register"
          className="font-bold text-indigo-600 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          회원가입
        </Link>
      </p>
    </AuthLayout>
  )
}
