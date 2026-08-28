import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, getErrorMessage } from '../api/client'
import { Alert } from '../components/Alert'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { validatePassword, validateUsername } from '../utils/validation'

interface FieldErrors {
  username?: string
  password?: string
  confirmation?: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const confirmationInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors: FieldErrors = {
      username: validateUsername(username) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirmation:
        confirmation === password ? undefined : '비밀번호가 일치하지 않습니다.',
    }
    setFieldErrors(errors)
    setSubmitError(null)

    if (errors.username || errors.password || errors.confirmation) return

    setSubmitting(true)
    try {
      await authApi.register({ username: username.trim(), password })
      navigate('/login', {
        replace: true,
        state: {
          username: username.trim(),
          message: '회원가입이 완료되었습니다. 로그인해 주세요.',
        },
      })
    } catch (error) {
      setSubmitError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUsernameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      passwordInputRef.current?.focus()
    }
  }

  const handlePasswordKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      confirmationInputRef.current?.focus()
    }
  }

  return (
    <AuthLayout
      eyebrow="새로운 대화를 시작해요"
      title="ChatFlow 계정 만들기"
      description="간단한 정보만 입력하면 나만의 대화 공간을 만들 수 있어요."
    >
      {submitError ? <Alert tone="error">{submitError}</Alert> : null}

      <form className="mt-5 space-y-5" onSubmit={handleSubmit} noValidate>
        <FormField
          id="register-username"
          label="아이디"
          name="username"
          type="text"
          autoComplete="username"
          autoFocus
          value={username}
          error={fieldErrors.username}
          hint="3~50자의 영문, 숫자, 밑줄(_)만 가능합니다. (외 특수문자 불가)"
          placeholder="chat_user"
          onKeyDown={handleUsernameKeyDown}
          onChange={(event) => {
            setUsername(event.target.value)
            setFieldErrors((current) => ({ ...current, username: undefined }))
          }}
        />
        <FormField
          ref={passwordInputRef}
          id="register-password"
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          error={fieldErrors.password}
          hint="8자 이상 128자 이하로 입력하세요."
          placeholder="8자 이상 입력"
          onKeyDown={handlePasswordKeyDown}
          onChange={(event) => {
            setPassword(event.target.value)
            setFieldErrors((current) => ({ ...current, password: undefined }))
          }}
        />
        <FormField
          ref={confirmationInputRef}
          id="register-password-confirmation"
          label="비밀번호 확인"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          error={fieldErrors.confirmation}
          placeholder="비밀번호를 한 번 더 입력"
          onChange={(event) => {
            setConfirmation(event.target.value)
            setFieldErrors((current) => ({ ...current, confirmation: undefined }))
          }}
        />
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? '계정 만드는 중…' : '회원가입'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        이미 계정이 있나요?{' '}
        <Link
          to="/login"
          className="font-bold text-indigo-600 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          로그인
        </Link>
      </p>
    </AuthLayout>
  )
}
