import { Navigate, Outlet } from 'react-router-dom'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from './AuthContext'

export function RequireAuth() {
  const { status } = useAuth()
  if (status === 'checking') return <LoadingScreen />
  return status === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />
}

export function PublicOnly() {
  const { status } = useAuth()
  if (status === 'checking') return <LoadingScreen />
  return status === 'authenticated' ? <Navigate to="/chat" replace /> : <Outlet />
}

export function IndexRoute() {
  const { status } = useAuth()
  if (status === 'checking') return <LoadingScreen />
  return <Navigate to={status === 'authenticated' ? '/chat' : '/login'} replace />
}
