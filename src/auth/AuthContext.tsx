import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, isAbortError } from '../api/client'
import type { AuthCredentials, User } from '../api/types'

export const ACCESS_TOKEN_STORAGE_KEY = 'chatflow.accessToken'

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  token: string | null
  notice: string | null
  login: (credentials: AuthCredentials) => Promise<User>
  logout: () => void
  invalidateSession: (message?: string) => void
  consumeNotice: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialToken] = useState(() =>
    localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY),
  )
  const [status, setStatus] = useState<AuthStatus>(
    initialToken ? 'checking' : 'unauthenticated',
  )
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  useEffect(() => {
    const storedToken = initialToken
    if (!storedToken) return

    const controller = new AbortController()
    authApi
      .me(storedToken, controller.signal)
      .then((currentUser) => {
        setToken(storedToken)
        setUser(currentUser)
        setStatus('authenticated')
      })
      .catch((error: unknown) => {
        if (isAbortError(error)) return
        clearSession()
        setNotice('로그인 정보가 만료되었습니다. 다시 로그인해 주세요.')
      })

    return () => controller.abort()
  }, [clearSession, initialToken])

  const login = useCallback(async (credentials: AuthCredentials) => {
    const tokenResponse = await authApi.login(credentials)
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokenResponse.access_token)

    try {
      const currentUser = await authApi.me(tokenResponse.access_token)
      setToken(tokenResponse.access_token)
      setUser(currentUser)
      setNotice(null)
      setStatus('authenticated')
      return currentUser
    } catch (error) {
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    setNotice(null)
    clearSession()
  }, [clearSession])

  const invalidateSession = useCallback(
    (message = '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.') => {
      clearSession()
      setNotice(message)
    },
    [clearSession],
  )

  const consumeNotice = useCallback(() => setNotice(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      token,
      notice,
      login,
      logout,
      invalidateSession,
      consumeNotice,
    }),
    [
      status,
      user,
      token,
      notice,
      login,
      logout,
      invalidateSession,
      consumeNotice,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The provider and its companion hook intentionally share this module.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
