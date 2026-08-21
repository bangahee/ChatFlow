import { Route, Routes } from 'react-router-dom'
import { IndexRoute, PublicOnly, RequireAuth } from './auth/RouteGuards'
import { ChatPage } from './pages/ChatPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexRoute />} />
      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/chat" element={<ChatPage />} />
      </Route>
      <Route path="*" element={<IndexRoute />} />
    </Routes>
  )
}
