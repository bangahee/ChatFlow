import { useEffect, useRef, useState } from "react";
import { Alert } from "../components/Alert";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ChatHeader } from "../components/ChatHeader";
import { ChatList } from "../components/ChatList";
import { ChatComposer } from "../components/ChatComposer";
import { useChatSession } from "../hooks/useChatSession";
import { useSmartScroll } from "../hooks/useSmartScroll";

// 🖥️ 챗봇 메인 워크스페이스 컨테이너 페이지
export function ChatPage() {
  // 🎣 대화 세션 비즈니스 로직 훅 연동
  const {
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
  } = useChatSession();

  // 🎯 포커스 및 스크롤 참조
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [composerKey, setComposerKey] = useState(0);

  // 📜 스마트 스크롤 제어 훅 연동
  const { showBottomButton, scrollToBottom } = useSmartScroll([
    chats,
    pendingQuestion,
  ]);

  // ⬇️ 메시지 추가 시 하단 스크롤 자동 동기화
  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({
      behavior: historyLoading ? "auto" : "smooth",
      block: "end",
    });
  }, [chats, pendingQuestion, historyLoading]);

  const handlePromptSelect = async (text: string) => {
    const success = await sendQuestion(text);
    if (success) {
      setComposerKey((current) => current + 1);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      {/* 🧭 1. 상단 네비게이션 헤더 */}
      <ChatHeader
        user={user}
        totalChats={chats.length}
        disabledActions={sending || deleting}
        deleteButtonRef={deleteButtonRef}
        onOpenDelete={() => setDeleteOpen(true)}
        onLogout={logout}
      />

      {/* 📄 2. 본문 대화 영역 */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6">
        <div className="flex-1 py-6 sm:py-8">
          {/* 📢 전역 피드백 배너 (네트워크 복구, 삭제 결과) */}
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

          {/* 💬 3. 대화 메시지 목록 */}
          <ChatList
            chats={chats}
            pendingQuestion={pendingQuestion}
            historyLoading={historyLoading}
            historyError={historyError}
            scrollAnchorRef={scrollAnchorRef}
            onRetry={() => void loadHistory()}
            onSelectPrompt={(text) => void handlePromptSelect(text)}
          />
        </div>

        {/* ⌨️ 4. 하단 질문 입력 영역 */}
        <ChatComposer
          key={composerKey}
          sending={sending}
          sendError={sendError}
          onSend={sendQuestion}
          onErrorChange={setSendError}
        />

        {/* 🚀 5. 최신 메시지 이동 플로팅 버튼 (대화 존재 시 노출) */}
        {showBottomButton && chats.length > 0 && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className="fixed bottom-24 right-6 px-3.5 py-2 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 text-xs font-semibold flex items-center gap-1.5 transition-all z-20"
          >
            ↓ 최신 메시지
          </button>
        )}
      </main>

      {/* 🗑️ 6. 전체 삭제 확인 모달 다이얼로그 */}
      {deleteOpen ? (
        <ConfirmDialog
          title="모든 대화를 삭제할까요?"
          description="삭제한 기록은 복구할 수 없으며, AI가 참고하는 이전 대화 문맥도 함께 초기화됩니다."
          confirmLabel="전체 삭제"
          busy={deleting}
          onConfirm={() => void handleDeleteAll()}
          onClose={() => {
            if (!deleting) setDeleteOpen(false);
          }}
          returnFocusRef={deleteButtonRef}
        />
      ) : null}
    </div>
  );
}
