import { Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import {
  IndexRoute,
  PublicOnly,
  RequireAdmin,
  RequireAuth,
  RequireChatUser,
} from "./auth/RouteGuards";
import { AdminPage } from "./pages/AdminPage";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<IndexRoute />} />
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<RequireChatUser />}>
            <Route path="/chat" element={<ChatPage />} />
          </Route>
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
        <Route path="*" element={<IndexRoute />} />
      </Routes>
    </ErrorBoundary>
  );
}
