import type { ChatItem } from '../api/types'
import { formatKstDate, formatKstTime } from '../utils/date'

export function DateSeparator({ createdAt }: { createdAt: string | Date }) {
  return (
    <div className="my-8 flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-slate-200" />
      <time className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
        {formatKstDate(createdAt)}
      </time>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

export function MessagePair({ item }: { item: ChatItem }) {
  return (
    <article className="space-y-5" aria-label="대화">
      <div className="flex justify-end gap-3">
        <div className="max-w-[86%] sm:max-w-[75%]">
          <div className="rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-[15px] leading-6 whitespace-pre-wrap text-white shadow-sm">
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
        <div className="max-w-[88%] sm:max-w-[78%]">
          <div className="rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-[15px] leading-7 whitespace-pre-wrap text-slate-700 shadow-sm">
            {item.response}
          </div>
          <time
            dateTime={item.created_at}
            className="mt-1.5 block pl-1 text-[11px] text-slate-400"
          >
            {formatKstTime(item.created_at)}
          </time>
        </div>
      </div>
    </article>
  )
}

export function PendingMessage({ question }: { question: string }) {
  const now = new Date()
  return (
    <article className="space-y-5" aria-label="전송 중인 대화">
      <div className="flex justify-end gap-3">
        <div className="max-w-[86%] sm:max-w-[75%]">
          <div className="rounded-2xl rounded-br-md bg-indigo-600 px-4 py-3 text-[15px] leading-6 whitespace-pre-wrap text-white opacity-90 shadow-sm">
            {question}
          </div>
          <span className="mt-1.5 block pr-1 text-right text-[11px] text-slate-400">
            {formatKstTime(now)}
          </span>
        </div>
      </div>
      <div className="flex items-start gap-3" role="status">
        <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
          <span className="size-3 animate-pulse rounded-full bg-white/90" />
        </div>
        <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="size-2 animate-bounce rounded-full bg-indigo-400 motion-reduce:animate-pulse"
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
          <span className="sr-only">AI가 답변을 작성하고 있습니다.</span>
        </div>
      </div>
    </article>
  )
}

export function ChatSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="대화 기록을 불러오는 중">
      {[0, 1].map((item) => (
        <div key={item} className="animate-pulse space-y-5 motion-reduce:animate-none">
          <div className="ml-auto h-16 w-2/3 rounded-2xl rounded-br-md bg-indigo-100" />
          <div className="flex gap-3">
            <div className="size-8 rounded-xl bg-slate-200" />
            <div className="h-24 w-3/4 rounded-2xl rounded-tl-md bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}
