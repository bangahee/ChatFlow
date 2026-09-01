import { useState } from "react";
import type { ChatItem } from "../api/types";
import { formatKstTime } from "../utils/date";
import { MarkdownRenderer } from "./MarkdownRenderer";

export function DateSeparator({ createdAt }: { createdAt: string | Date }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
        {new Intl.DateTimeFormat("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "short",
          timeZone: "Asia/Seoul",
        }).format(new Date(createdAt))}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-6 py-4" aria-label="대화 불러오는 중">
      <div className="flex justify-end">
        <div className="h-12 w-48 animate-pulse rounded-2xl rounded-br-md bg-indigo-100" />
      </div>
      <div className="flex items-start gap-3">
        <div className="size-8 animate-pulse rounded-xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-16 w-72 animate-pulse rounded-2xl rounded-tl-md bg-slate-200" />
          <div className="h-8 w-40 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export function PendingMessage({ question }: { question: string }) {
  return (
    <article className="space-y-5" aria-label="전송 중인 질문">
      <div className="flex justify-end gap-3">
        <div className="max-w-[86%] sm:max-w-[75%] min-w-0">
          <div className="rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-[15px] leading-6 whitespace-pre-wrap break-all text-white shadow-sm">
            {question}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-4 animate-spin">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="28 14"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="max-w-[88%] sm:max-w-[78%] min-w-0">
          <div className="inline-flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-500 shadow-sm break-all">
            <span className="size-2 animate-ping rounded-full bg-indigo-600" />
            <span>AI가 답변을 생성하고 있습니다…</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function MessagePair({ item }: { item: ChatItem }) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(item.response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="space-y-5" aria-label="대화">
      <div className="flex justify-end gap-3">
        <div className="max-w-[86%] sm:max-w-[75%] min-w-0">
          <div className="rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-[15px] leading-6 whitespace-pre-wrap break-all text-white shadow-sm">
            {item.question}
          </div>
          <time
            dateTime={item.created_at}
            className="mt-1.5 block pr-1 text-right text-[11px] text-slate-400"
          >
            {formatKstTime(item.created_at)}
          </time>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-4">
            <path
              d="M8 9.5h8M8 13h5M5.5 5h13A1.5 1.5 0 0 1 20 6.5v9a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 3v-3h-1A1.5 1.5 0 0 1 4 15.5v-9A1.5 1.5 0 0 1 5.5 5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="max-w-[88%] sm:max-w-[78%] min-w-0">
          <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-[15px] leading-7 text-slate-700 shadow-sm break-all">
            <MarkdownRenderer content={item.response} />
          </div>
          <div className="mt-1.5 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handleCopyAll}
              className="text-[11px] font-medium text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              {copied ? "✓ 전체 복사완료" : "📄 답변 복사"}
            </button>
            <time
              dateTime={item.created_at}
              className="text-[11px] text-slate-400"
            >
              {formatKstTime(item.created_at)}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
}
