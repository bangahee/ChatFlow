import type {
  AdminChatHistoryResponse,
  AdminUserListResponse,
  AuthCredentials,
  ChatHistoryResponse,
  ChatResponse,
  DeleteChatHistoryResponse,
  TokenResponse,
  User,
  ValidationErrorDetail,
  ApiErrorKind,
} from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:8000";
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  "",
);

export class ApiError extends Error {
  readonly status: number | null;
  readonly kind: ApiErrorKind;
  readonly details: unknown;

  constructor(
    message: string,
    options: {
      status?: number | null;
      kind: ApiErrorKind;
      details?: unknown;
    },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? null;
    this.kind = options.kind;
    this.details = options.details;
  }
}

const statusFallbacks: Record<number, string> = {
  400: "요청을 처리할 수 없습니다. 입력 내용을 확인해 주세요.",
  401: "인증 정보가 유효하지 않거나 만료되었습니다.",
  403: "이 작업을 수행할 권한이 없습니다.",
  404: "요청한 정보를 찾을 수 없습니다.",
  422: "입력값이 올바르지 않습니다.",
  500: "서버 처리 중 오류가 발생했습니다.",
  502: "AI 응답을 처리하는 중 오류가 발생했습니다.",
  503: "AI 서비스를 일시적으로 사용할 수 없습니다.",
  504: "AI 응답 시간이 초과되었습니다.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validationMessage(details: ValidationErrorDetail[]): string | null {
  const messages = details
    .map((detail) => {
      if (!detail.msg) return null;
      const field = detail.loc?.at(-1);
      return field ? `${String(field)}: ${detail.msg}` : detail.msg;
    })
    .filter((message): message is string => Boolean(message));

  return messages.length > 0 ? messages.join(", ") : null;
}

function responseErrorMessage(status: number, payload: unknown): string {
  if (isRecord(payload)) {
    if (typeof payload.detail === "string") return payload.detail;
    if (Array.isArray(payload.detail)) {
      const message = validationMessage(
        payload.detail.filter(isRecord) as ValidationErrorDetail[],
      );
      if (message) return message;
    }
  }

  return statusFallbacks[status] ?? "요청 처리 중 오류가 발생했습니다.";
}

function createUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  token?: string | null;
  body?: unknown;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { token, body, headers: customHeaders, ...requestOptions } = options;
  const headers = new Headers(customHeaders);

  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(createUrl(path), {
      ...requestOptions,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError("서버에 연결할 수 없습니다. 네트워크를 확인해 주세요.", {
      kind: "network",
      details: error,
    });
  }

  const rawBody = await response.text();
  let payload: unknown = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      throw new ApiError("서버 응답 형식이 올바르지 않습니다.", {
        status: response.status,
        kind: "response",
        details: error,
      });
    }
  }

  if (!response.ok) {
    throw new ApiError(responseErrorMessage(response.status, payload), {
      status: response.status,
      kind: "http",
      details: payload,
    });
  }

  return payload as T;
}

export const authApi = {
  register(credentials: AuthCredentials, signal?: AbortSignal) {
    return apiRequest<User>("/api/auth/register", {
      method: "POST",
      body: credentials,
      signal,
    });
  },

  login(credentials: AuthCredentials, signal?: AbortSignal) {
    return apiRequest<TokenResponse>("/api/auth/login", {
      method: "POST",
      body: credentials,
      signal,
    });
  },

  me(token: string, signal?: AbortSignal) {
    return apiRequest<User>("/api/me", { token, signal });
  },
};

export const chatApi = {
  list(token: string, signal?: AbortSignal) {
    return apiRequest<ChatHistoryResponse>("/api/me/chats", {
      token,
      signal,
    });
  },

  create(question: string, token: string, signal?: AbortSignal) {
    return apiRequest<ChatResponse>("/api/chat", {
      method: "POST",
      token,
      body: { question },
      signal,
    });
  },

  clear(token: string, signal?: AbortSignal) {
    return apiRequest<DeleteChatHistoryResponse>("/api/me/chats", {
      method: "DELETE",
      token,
      signal,
    });
  },
};

export const adminApi = {
  listUsers(token: string, signal?: AbortSignal) {
    return apiRequest<AdminUserListResponse>("/api/admin/users", {
      token,
      signal,
    });
  },

  listUserChats(userId: number, token: string, signal?: AbortSignal) {
    return apiRequest<AdminChatHistoryResponse>(
      `/api/admin/users/${userId}/chats`,
      { token, signal },
    );
  },
};

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "알 수 없는 오류가 발생했습니다.";
}
