import { Brand } from './Brand'

export function LoadingScreen() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50">
      <div className="flex flex-col items-center gap-5" role="status">
        <Brand />
        <span className="size-7 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        <span className="sr-only">로그인 상태를 확인하고 있습니다.</span>
      </div>
    </main>
  )
}
