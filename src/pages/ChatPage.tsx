import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  ApiError,
  chatApi,
  getErrorMessage,
  isAbortError,
} from "../api/client";
import type { ChatItem } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { Alert } from "../components/Alert";
import { Brand } from "../components/Brand";
import {
  ChatSkeleton,
  DateSeparator,
  MessagePair,
  PendingMessage,
} from "../components/ChatMessages";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { getKstDateKey } from "../utils/date";
import { countCodePoints, validateQuestion } from "../utils/validation";
import { useSmartScroll } from "../hooks/useSmartScroll";

interface BannerState {
  tone: "error" | "success" | "info";
  message: string;
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

export function ChatPage() {
  const { user, token, logout, invalidateSession } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [question, setQuestion] = useState("");
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const operationControllerRef = useRef<AbortController | null>(null);
  // ChatPage 함수 내부 상단:
  const { showBottomButton, scrollToBottom } = useSmartScroll([
    chats,
    pendingQuestion,
  ]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleProtectedError = useCallback(
    (error: unknown): boolean => {
      if (!isUnauthorized(error)) return false;
      invalidateSession();
      return true;
    },
    [invalidateSession],
  );

  const loadHistory = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return;
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const history = await chatApi.list(token, signal);
        setChats(history.items);
      } catch (error) {
        if (isAbortError(error) || handleProtectedError(error)) return;
        setHistoryError(getErrorMessage(error));
      } finally {
        if (!signal?.aborted) setHistoryLoading(false);
      }
    },
    [handleProtectedError, token],
  );

  useEffect(() => {
    const controller = new AbortController();
    // The route mount is the source of truth for the initial history request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory(controller.signal);
    return () => controller.abort();
  }, [loadHistory]);

  useEffect(
    () => () => {
      operationControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({
      behavior: historyLoading ? "auto" : "smooth",
      block: "end",
    });
  }, [chats, pendingQuestion, historyLoading]);

  const reconcileAfterNetworkError = async (
    submittedQuestion: string,
    existingIds: Set<number>,
    signal: AbortSignal,
  ): Promise<boolean> => {
    if (!token) return false;
    try {
      const history = await chatApi.list(token, signal);
      setChats(history.items);
      return history.items.some(
        (item) =>
          !existingIds.has(item.id) && item.question === submittedQuestion,
      );
    } catch (error) {
      if (!isAbortError(error)) handleProtectedError(error);
      return false;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending || !token) return;

    const validationError = validateQuestion(question);
    setQuestionError(validationError);
    setSendError(null);
    setBanner(null);
    if (validationError) return;

    const submittedQuestion = question.trim();
    const existingIds = new Set(chats.map((item) => item.id));
    const controller = new AbortController();
    operationControllerRef.current = controller;
    setSending(true);
    setPendingQuestion(submittedQuestion);

    try {
      const response = await chatApi.create(
        submittedQuestion,
        token,
        controller.signal,
      );
      setChats((current) => [...current, response]);
      setQuestion("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setQuestionError(null);
    } catch (error) {
      if (isAbortError(error) || handleProtectedError(error)) return;

      if (error instanceof ApiError && error.kind === "network") {
        const recovered = await reconcileAfterNetworkError(
          submittedQuestion,
          existingIds,
          controller.signal,
        );
        if (recovered) {
          setQuestion("");
          setBanner({
            tone: "info",
            message: "연결이 끊겼지만 서버에 저장된 응답을 다시 불러왔습니다.",
          });
        } else {
          setSendError(
            `${getErrorMessage(error)} 전송 결과가 확인되지 않아 질문을 자동으로 다시 보내지 않았습니다.`,
          );
        }
      } else {
        setSendError(getErrorMessage(error));
      }
    } finally {
      setPendingQuestion(null);
      setSending(false);
      if (operationControllerRef.current === controller) {
        operationControllerRef.current = null;
      }
    }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // 👇 한글 입력 조합 중 Enter 중복 전송 방지
    if (event.nativeEvent.isComposing) {
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // 기존 submit 호출 로직 유지
    }
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }
    event.preventDefault();
    formRef.current?.requestSubmit();
  };

  const closeDeleteDialog = useCallback(() => {
    if (!deleting) setDeleteOpen(false);
  }, [deleting]);

  const handleDelete = async () => {
    if (!token || deleting) return;
    const controller = new AbortController();
    operationControllerRef.current = controller;
    setDeleting(true);
    setBanner(null);

    try {
      const result = await chatApi.clear(token, controller.signal);
      setChats([]);
      setDeleteOpen(false);
      setBanner({
        tone: "success",
        message: `${result.deleted_count}개의 대화 기록을 삭제했습니다.`,
      });
    } catch (error) {
      if (isAbortError(error) || handleProtectedError(error)) return;
      setDeleteOpen(false);
      setBanner({ tone: "error", message: getErrorMessage(error) });
    } finally {
      setDeleting(false);
      if (operationControllerRef.current === controller) {
        operationControllerRef.current = null;
      }
    }
  };

  const questionLength = countCodePoints(question);
  const remaining = 500 - questionLength;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
          <Brand compact />
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="mr-1 hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 sm:flex">
              <span className="grid size-6 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                {user?.username.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-36 truncate font-medium">
                {user?.username}
              </span>
            </div>
            <button
              ref={deleteButtonRef}
              type="button"
              disabled={chats.length === 0 || sending || deleting}
              onClick={() => setDeleteOpen(true)}
              className="rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
            >
              전체 삭제
            </button>
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6">
        <div className="flex-1 py-6 sm:py-8">
          {banner ? (
            <div className="mx-auto mb-5 max-w-3xl">
              <Alert tone={banner.tone}>
                <div className="flex items-start justify-between gap-3">
                  <span>{banner.message}</span>
                  <button
                    type="button"
                    onClick={() => setBanner(null)}
                    className="shrink-0 font-bold opacity-60 hover:opacity-100"
                    aria-label="알림 닫기"
                  >
                    ×
                  </button>
                </div>
              </Alert>
            </div>
          ) : null}

          <div className="mx-auto max-w-3xl" role="log" aria-live="polite">
            {historyLoading ? <ChatSkeleton /> : null}

            {!historyLoading && historyError ? (
              <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
                <p className="font-semibold text-slate-800">
                  대화를 불러오지 못했습니다.
                </p>
                <p className="mt-2 text-sm text-rose-600">{historyError}</p>
                <button
                  type="button"
                  onClick={() => void loadHistory()}
                  className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-indigo-200"
                >
                  다시 시도
                </button>
              </div>
            ) : null}

            {!historyLoading &&
            !historyError &&
            chats.length === 0 &&
            !pendingQuestion ? (
              <div className="flex min-h-[48vh] flex-col items-center justify-center text-center">
                <div className="grid size-16 place-items-center rounded-3xl bg-indigo-100 text-indigo-600">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="size-8"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 10h8m-8 4h5M5.5 5h13A1.5 1.5 0 0 1 20 6.5v9a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 3v-3h-1A1.5 1.5 0 0 1 4 15.5v-9A1.5 1.5 0 0 1 5.5 5Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h1 className="mt-5 text-xl font-bold text-slate-900">
                  무엇이든 물어보세요
                </h1>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  아래 입력창에 질문을 작성하고 Enter를 누르세요. Shift+Enter로
                  줄을 바꿀 수 있습니다.
                </p>
              </div>
            ) : null}

            {!historyLoading && !historyError
              ? chats.map((item, index) => {
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
                })
              : null}

            {pendingQuestion ? (
              <div className="message-enter">
                {chats.length === 0 ? (
                  <DateSeparator createdAt={new Date()} />
                ) : null}
                <PendingMessage question={pendingQuestion} />
              </div>
            ) : null}
            <div ref={scrollAnchorRef} className="h-2" />
          </div>
        </div>
        <div className="sticky bottom-0 z-10 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pb-4 pt-4 sm:pb-6">
          <div className="mx-auto max-w-3xl">
            {sendError ? (
              <div className="mb-3">
                <Alert tone="error">{sendError}</Alert>
              </div>
            ) : null}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-300/25 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100/80"
            >
              <label htmlFor="chat-question" className="sr-only">
                AI에게 보낼 질문
              </label>
              <textarea
                ref={textareaRef}
                id="chat-question"
                name="question"
                rows={2}
                value={question}
                disabled={sending}
                placeholder="AI에게 무엇이든 물어보세요…"
                onKeyDown={handleComposerKeyDown}
                onChange={(event) => {
                  setQuestion(event.target.value);
                  setQuestionError(null);
                  if (setSendError) setSendError(null);
                  // 👇 텍스트 길이에 따른 높이 자동 계산
                  if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
                  }
                }}
                className="max-h-40 min-h-14 w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-70 overflow-y-auto"
              />
              <div className="flex items-center justify-between gap-3 px-2 pb-1">
                <div className="min-w-0">
                  <p id="question-help" className="text-xs text-slate-400">
                    Enter 전송 · Shift+Enter 줄바꿈
                  </p>
                  {questionError ? (
                    <p
                      id="question-error"
                      className="mt-1 text-xs font-medium text-rose-600"
                    >
                      {questionError}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`text-xs font-medium ${remaining < 0 ? "text-rose-600" : "text-slate-400"}`}
                    aria-live="polite"
                  >
                    {remaining >= 0
                      ? `${remaining}자 남음`
                      : `${Math.abs(remaining)}자 초과`}
                  </span>
                  <button
                    type="submit"
                    disabled={sending || remaining < 0}
                    className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={sending ? "질문 전송 중" : "질문 전송"}
                  >
                    {sending ? (
                      <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="size-5"
                        aria-hidden="true"
                      >
                        <path
                          d="m5 12 14-7-4.5 14-2.8-5.2L5 12Zm6.7 1.8L19 5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        // return JSX 내부 main 닫는 태그 바로 앞에 추가:
        {showBottomButton && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-24 right-6 px-3.5 py-2 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-all z-20"
          >
            ↓ 최신 메시지
          </button>
        )}
      </main>

      {deleteOpen ? (
        <ConfirmDialog
          title="모든 대화를 삭제할까요?"
          description="삭제한 기록은 복구할 수 없으며, AI가 참고하는 이전 대화 문맥도 함께 초기화됩니다."
          confirmLabel="전체 삭제"
          busy={deleting}
          onConfirm={() => void handleDelete()}
          onClose={closeDeleteDialog}
          returnFocusRef={deleteButtonRef}
        />
      ) : null}
    </div>
  );
}
