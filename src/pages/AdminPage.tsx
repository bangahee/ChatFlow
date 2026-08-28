import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  adminApi,
  ApiError,
  getErrorMessage,
  isAbortError,
} from "../api/client";
import type { AdminUserSummary, ChatItem } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/Alert";
import { Brand } from "../components/Brand";
import {
  ChatSkeleton,
  DateSeparator,
  MessagePair,
} from "../components/ChatMessages";
import { formatKstDate, getKstDateKey } from "../utils/date";

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

export function AdminPage() {
  const { token, user, logout, invalidateSession } = useAuth();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserSummary | null>(
    null,
  );
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const usersControllerRef = useRef<AbortController | null>(null);
  const chatsControllerRef = useRef<AbortController | null>(null);

  const handleProtectedError = useCallback(
    (error: unknown): boolean => {
      if (isUnauthorized(error)) {
        invalidateSession();
        return true;
      }
      if (isForbidden(error)) {
        setAccessDenied(true);
        return true;
      }
      return false;
    },
    [invalidateSession],
  );

  const loadUsers = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return;
      setUsersLoading(true);
      setUsersError(null);
      try {
        const result = await adminApi.listUsers(token, signal);
        if (!signal?.aborted) setUsers(result.items);
      } catch (error) {
        if (isAbortError(error) || handleProtectedError(error)) return;
        setUsersError(getErrorMessage(error));
      } finally {
        if (!signal?.aborted) setUsersLoading(false);
      }
    },
    [handleProtectedError, token],
  );

  const loadUserChats = useCallback(
    async (target: AdminUserSummary, signal?: AbortSignal) => {
      if (!token) return;
      setChatsLoading(true);
      setChatsError(null);
      setChats([]);
      try {
        const result = await adminApi.listUserChats(target.id, token, signal);
        if (signal?.aborted) return;
        setSelectedUser(result.user);
        setChats(result.items);
      } catch (error) {
        if (isAbortError(error) || handleProtectedError(error)) return;
        setChatsError(getErrorMessage(error));
      } finally {
        if (!signal?.aborted) setChatsLoading(false);
      }
    },
    [handleProtectedError, token],
  );

  const requestUserChats = useCallback(
    (target: AdminUserSummary) => {
      chatsControllerRef.current?.abort();
      const controller = new AbortController();
      chatsControllerRef.current = controller;
      setSelectedUser(target);
      void loadUserChats(target, controller.signal);
    },
    [loadUserChats],
  );

  useEffect(() => {
    const controller = new AbortController();
    usersControllerRef.current = controller;
    // The route mount is the source of truth for the initial administrator list.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadUsers(controller.signal);
    return () => controller.abort();
  }, [loadUsers]);

  useEffect(
    () => () => {
      usersControllerRef.current?.abort();
      chatsControllerRef.current?.abort();
    },
    [],
  );

  const retryUsers = () => {
    usersControllerRef.current?.abort();
    const controller = new AbortController();
    usersControllerRef.current = controller;
    void loadUsers(controller.signal);
  };

  const retryChats = () => {
    if (selectedUser) requestUserChats(selectedUser);
  };

  if (accessDenied) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            관리자 권한이 없습니다.
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            이 기능을 사용할 수 있는 계정으로 다시 로그인해 주세요.
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            로그아웃
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Brand compact />
            <span className="hidden rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700 sm:inline">
              관리자
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-32 truncate text-sm font-medium text-slate-500 sm:inline">
              {user?.username}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 sm:px-3"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <p className="text-sm font-semibold text-indigo-600">관리자 조회</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            사용자 대화 기록
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            사용자와 대화 기록을 조회할 수 있으며, 데이터는 수정하거나 삭제할 수 없습니다.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <section
            aria-labelledby="admin-user-list-title"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
              <h2 id="admin-user-list-title" className="font-bold text-slate-900">
                사용자 목록
              </h2>
              {!usersLoading && !usersError ? (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                  {users.length}명
                </span>
              ) : null}
            </div>

            {usersLoading ? (
              <div className="space-y-3 p-4" role="status" aria-label="사용자 목록을 불러오는 중">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none"
                  />
                ))}
              </div>
            ) : null}

            {!usersLoading && usersError ? (
              <div className="p-4">
                <Alert tone="error">
                  <p>사용자 목록을 불러오지 못했습니다.</p>
                  <p className="mt-1">{usersError}</p>
                </Alert>
                <button
                  type="button"
                  onClick={retryUsers}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  다시 시도
                </button>
              </div>
            ) : null}

            {!usersLoading && !usersError && users.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">
                등록된 사용자가 없습니다.
              </p>
            ) : null}

            {!usersLoading && !usersError && users.length > 0 ? (
              <ul className="max-h-[34rem] divide-y divide-slate-100 overflow-y-auto p-2 lg:max-h-[calc(100dvh-16rem)]">
                {users.map((item) => {
                  const selected = selectedUser?.id === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        aria-label={`${item.username} 사용자 대화 보기`}
                        aria-pressed={selected}
                        onClick={() => requestUserChats(item)}
                        className={`w-full rounded-xl px-3 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-indigo-100 ${
                          selected
                            ? "bg-indigo-50 text-indigo-900"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="block truncate text-sm font-bold">
                          {item.username}
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          가입 {formatKstDate(item.created_at)} · 대화 {item.chat_count}개
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>

          <section
            aria-labelledby="admin-chat-history-title"
            className="min-h-[28rem] rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            {!selectedUser ? (
              <div className="grid min-h-[28rem] place-items-center px-6 text-center">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-100 text-indigo-600">
                    <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden="true">
                      <path
                        d="M8 10h8m-8 4h5M5.5 5h13A1.5 1.5 0 0 1 20 6.5v9a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 3v-3h-1A1.5 1.5 0 0 1 4 15.5v-9A1.5 1.5 0 0 1 5.5 5Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h2 id="admin-chat-history-title" className="mt-4 font-bold text-slate-900">
                    사용자를 선택하세요
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    목록에서 사용자를 선택하면 전체 대화 기록을 확인할 수 있습니다.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <p className="text-xs font-semibold text-indigo-600">선택한 사용자</p>
                  <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="admin-chat-history-title" className="text-lg font-bold text-slate-900">
                      {selectedUser.username}님의 대화
                    </h2>
                    <span className="text-sm text-slate-500">
                      총 {selectedUser.chat_count}개
                    </span>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {chatsLoading ? <ChatSkeleton /> : null}

                  {!chatsLoading && chatsError ? (
                    <div>
                      <Alert tone="error">
                        <p>대화 기록을 불러오지 못했습니다.</p>
                        <p className="mt-1">{chatsError}</p>
                      </Alert>
                      <button
                        type="button"
                        onClick={retryChats}
                        className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-indigo-200"
                      >
                        다시 시도
                      </button>
                    </div>
                  ) : null}

                  {!chatsLoading && !chatsError && chats.length === 0 ? (
                    <div className="grid min-h-56 place-items-center text-center">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          대화 기록이 없습니다.
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          이 사용자는 아직 AI와 나눈 대화가 없습니다.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {!chatsLoading && !chatsError && chats.length > 0 ? (
                    <div className="space-y-1">
                      {chats.map((item, index) => {
                        const previous = chats[index - 1];
                        const showDate =
                          !previous ||
                          getKstDateKey(previous.created_at) !==
                            getKstDateKey(item.created_at);
                        return (
                          <div key={item.id} className="message-enter">
                            {showDate ? (
                              <DateSeparator createdAt={item.created_at} />
                            ) : null}
                            <MessagePair item={item} />
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
