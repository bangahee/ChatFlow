import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  chatApi,
  getErrorMessage,
  isAbortError,
} from "../api/client";
import type { ChatItem } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { validateQuestion } from "../utils/validation";

export interface BannerState {
  tone: "error" | "success" | "info";
  message: string;
}

// 🔐 401 Unauthorized 에러 판별 헬퍼
function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

// 💬 대화 세션의 모든 비즈니스 로직을 관리하는 커스텀 훅
export function useChatSession() {
  const { user, token, logout, invalidateSession } = useAuth();

  // 📦 대화 목록 및 전송 대기 상태
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // ⏳ 로딩 및 에러 상태
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  // 🚨 모달 및 피드백 알림 배너 상태
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState<BannerState | null>(null);

  // 🛑 비동기 요청 취소 컨트롤러 참조
  const operationControllerRef = useRef<AbortController | null>(null);

  // 🔑 401 세션 만료 시 토큰 정리 및 로그인 화면 유도
  const handleProtectedError = useCallback(
    (error: unknown): boolean => {
      if (!isUnauthorized(error)) return false;
      invalidateSession();
      return true;
    },
    [invalidateSession],
  );

  // 📥 대화 이력 불러오기
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

  // 🔄 컴포넌트 마운트 시 초기 이력 조회
  useEffect(() => {
    const controller = new AbortController();
    // The route mount is the source of truth for the initial history request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadHistory(controller.signal);
    return () => controller.abort();
  }, [loadHistory]);

  // 🧹 언마운트 시 진행 중인 비동기 요청 취소
  useEffect(
    () => () => {
      operationControllerRef.current?.abort();
    },
    [],
  );

  // 🔄 네트워크 장애 시 서버 저장 여부 확인 및 데이터 복구
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

  // 🚀 질문 전송 (일반 입력창 및 추천 프롬프트 칩 공용)
  const sendQuestion = async (textToSend: string): Promise<boolean> => {
    if (sending || !token) return false;

    // 1. 입력값 유효성 검증
    const validationError = validateQuestion(textToSend);
    setSendError(null);
    setBanner(null);
    if (validationError) {
      setSendError(validationError);
      return false;
    }

    const submittedQuestion = textToSend.trim();
    const existingIds = new Set(chats.map((item) => item.id));
    const controller = new AbortController();
    operationControllerRef.current = controller;

    setSending(true);
    setPendingQuestion(submittedQuestion);

    try {
      // 2. 백엔드 API 요청
      const response = await chatApi.create(
        submittedQuestion,
        token,
        controller.signal,
      );
      setChats((current) => [...current, response]);
      return true;
    } catch (error) {
      if (isAbortError(error) || handleProtectedError(error)) return false;

      // 3. 네트워크 에러 복구 분기
      if (error instanceof ApiError && error.kind === "network") {
        const recovered = await reconcileAfterNetworkError(
          submittedQuestion,
          existingIds,
          controller.signal,
        );
        if (recovered) {
          setBanner({
            tone: "info",
            message: "연결이 끊겼지만 서버에 저장된 응답을 다시 불러왔습니다.",
          });
          return true;
        }
        setSendError(
          `${getErrorMessage(error)} 전송 결과가 확인되지 않아 질문을 자동으로 다시 보내지 않았습니다.`,
        );
      } else {
        setSendError(getErrorMessage(error));
      }
      return false;
    } finally {
      setPendingQuestion(null);
      setSending(false);
      if (operationControllerRef.current === controller) {
        operationControllerRef.current = null;
      }
    }
  };

  // 🗑️ 대화 기록 전체 삭제
  const handleDeleteAll = async () => {
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

  return {
    user,
    chats,
    pendingQuestion,
    sending,
    historyLoading,
    historyError,
    sendError,
    deleteOpen,
    deleting,
    banner,
    setBanner,
    setSendError,
    setDeleteOpen,
    loadHistory,
    sendQuestion,
    handleDeleteAll,
    logout,
  };
}
