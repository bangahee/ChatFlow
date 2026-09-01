import type { RefObject } from "react";
import type { User } from "../api/types";
import { Brand } from "./Brand";

// 🏷️ ChatHeader Props 인터페이스 정의
interface ChatHeaderProps {
  user: User | null;
  totalChats: number;
  disabledActions: boolean;
  deleteButtonRef: RefObject<HTMLButtonElement | null>;
  onOpenDelete: () => void;
  onLogout: () => void;
}

// 🧭 상단 네비게이션 및 세션 요약 헤더 컴포넌트
export function ChatHeader({
  user,
  totalChats,
  disabledActions,
  deleteButtonRef,
  onOpenDelete,
  onLogout,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* ✨ 서비스 로고 브랜딩 */}
        <Brand compact />

        {/* 🧰 사용자 정보 및 상단 액션 영역 */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 👤 사용자 프로필 뱃지 */}
          <div className="mr-1 hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 sm:flex">
            <span className="grid size-6 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {user?.username.charAt(0).toUpperCase()}
            </span>
            <span className="max-w-36 truncate font-medium">
              {user?.username}
            </span>
          </div>

          {/* 💬 실시간 대화 수 통계 뱃지 */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
            <span>💬 총 {totalChats}개 대화</span>
          </div>

          {/* 🗑️ 전체 삭제 트리거 버튼 */}
          <button
            ref={deleteButtonRef}
            type="button"
            disabled={totalChats === 0 || disabledActions}
            onClick={onOpenDelete}
            className="rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
          >
            전체 삭제
          </button>

          {/* 🚪 로그아웃 버튼 */}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-200 sm:px-3"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
