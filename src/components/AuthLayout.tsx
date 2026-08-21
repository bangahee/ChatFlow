import type { ReactNode } from 'react'
import { Brand } from './Brand'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.12),transparent_35%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-300 to-transparent"
        aria-hidden="true"
      />

      <section className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-2xl shadow-slate-300/30 backdrop-blur sm:p-8">
          <p className="mb-2 text-sm font-semibold text-indigo-600">{eyebrow}</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          대화는 로그인한 사용자별로 안전하게 저장됩니다.
        </p>
      </section>
    </main>
  )
}
