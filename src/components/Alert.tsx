import type { ReactNode } from 'react'

interface AlertProps {
  tone?: 'error' | 'success' | 'info'
  children: ReactNode
}

const toneClasses = {
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-700',
}

export function Alert({ tone = 'info', children }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 text-sm leading-5 ${toneClasses[tone]}`}
    >
      {children}
    </div>
  )
}
