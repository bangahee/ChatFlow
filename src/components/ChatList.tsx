import type { RefObject } from "react";
import type { ChatItem } from "../api/types";
import { getKstDateKey } from "../utils/date";
import {
  ChatSkeleton,
  DateSeparator,
  MessagePair,
  PendingMessage,
} from "./ChatMessages";
import { PromptChips } from "./PromptChips";

// 🏷️ ChatList Props 인터페이스 정의
interface ChatListProps {
  chats: ChatItem[];
  pendingQuestion: string | null;
  historyLoading: boolean;
  historyError: string | null;
  scrollAnchorRef: RefObject<HTMLDivElement | null>;
  onRetry: () => void;
  onSelectPrompt: (promptText: string) => void;
}

// 💬 대화 내역 목록 및 상태별 화면 렌더링 컴포넌트
export function ChatList({
  chats,
  pendingQuestion,
  historyLoading,
  historyError,
  scrollAnchorRef,
  onRetry,
  onSelectPrompt,
}: ChatListProps) {
  return (
    <div className="mx-auto max-w-3xl" role="log" aria-live="polite">
      {/* ⏳ 1. 초기 히스토리 로딩 스켈레톤 */}
      {historyLoading ? <ChatSkeleton /> : null}

      {/* ⚠️ 2. 히스토리 로드 실패 시 에러 안내 카드 */}
      {!historyLoading && historyError ? (
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-slate-800">
            대화를 불러오지 못했습니다.
          </p>
          <p className="mt-2 text-sm text-rose-600">{historyError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            다시 시도
          </button>
        </div>
      ) : null}

      {/* 💡 3. 대화 내역이 없는 초기 빈 화면 (추천 칩 노출) */}
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
            아래 입력창에 질문을 작성하거나 추천 프롬프트를 선택해 보세요.
          </p>
          <PromptChips onSelect={onSelectPrompt} />
        </div>
      ) : null}

      {/* 📜 4. 대화 메시지 버블 목록 (날짜 구분선 포함) */}
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

      {/* 🤖 5. AI 응답 생성 대기 메시지 */}
      {pendingQuestion ? (
        <div className="message-enter">
          {chats.length === 0 ? <DateSeparator createdAt={new Date()} /> : null}
          <PendingMessage question={pendingQuestion} />
        </div>
      ) : null}

      {/* ⚓ 자동 스크롤 앵커 */}
      <div ref={scrollAnchorRef} className="h-2" />
    </div>
  );
}
