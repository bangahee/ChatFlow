export interface User {
  id: number
  username: string
  is_admin: boolean
  created_at: string
}

export interface AuthCredentials {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
}

export interface ChatItem {
  id: number
  question: string
  response: string
  created_at: string
}

export interface ChatResponse extends ChatItem {
  request_id: string
}

export interface ChatHistoryResponse {
  items: ChatItem[]
  count: number
}

export interface DeleteChatHistoryResponse {
  message: string
  deleted_count: number
}

export interface AdminUserSummary {
  id: number
  username: string
  created_at: string
  chat_count: number
}

export interface AdminUserListResponse {
  items: AdminUserSummary[]
  count: number
}

export interface AdminChatHistoryResponse {
  user: AdminUserSummary
  items: ChatItem[]
  count: number
}

export interface ValidationErrorDetail {
  loc?: Array<string | number>
  msg?: string
  type?: string
}

export type ApiErrorKind = 'http' | 'network' | 'response'
