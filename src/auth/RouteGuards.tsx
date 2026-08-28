import { Navigate, Outlet } from 'react-router-dom'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from './AuthContext'

export function RequireAuth() {
  const { status } = useAuth()
  if (status === 'checking') return <LoadingScreen />
  return status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />
}

export function RequireAdmin() {
  const { status, user } = useAuth()
  if (status === 'checking') return <LoadingScreen />
  return user?.is_admin ? <Outlet /> : <Navigate to="/chat" replace />
}

export function RequireChatUser() {
  const { status, user } = useAuth()
  if (status === 'checking') return <LoadingScreen />
  return user?.is_admin ? <Navigate to="/admin" replace /> : <Outlet />
}

export function PublicOnly() {
  const { status, user } = useAuth()
  if (status === 'checking') return <LoadingScreen />
  return status === 'authenticated' ? (
    <Navigate to={user?.is_admin ? '/admin' : '/chat'} replace />
  ) : (
    <Outlet />
  )
}

export function IndexRoute() {
  const { status, user } = useAuth()
  if (status === 'checking') return <LoadingScreen />
  return (
    <Navigate
      to={status === 'authenticated' ? (user?.is_admin ? '/admin' : '/chat') : '/login'}
      replace
    />
  )
}
