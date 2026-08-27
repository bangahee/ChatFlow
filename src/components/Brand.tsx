interface BrandProps {
  compact?: boolean
  inverse?: boolean
}

export function Brand({ compact = false, inverse = false }: BrandProps) {
  return (
    <div className="flex items-center gap-3" aria-label="ChatFlow">
      <span
        className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20 ${
          compact ? 'size-9' : 'size-12'
        }`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={compact ? 'size-5' : 'size-7'}
        >
          <path
            d="M6.4 5.25h11.2A2.4 2.4 0 0 1 20 7.65v6.7a2.4 2.4 0 0 1-2.4 2.4h-5.08l-3.86 2.63c-.66.45-1.56-.02-1.56-.82v-1.81h-.7A2.4 2.4 0 0 1 4 14.35v-6.7a2.4 2.4 0 0 1 2.4-2.4Z"
            fill="white"
          />
          <path
            d="M8 10h8M8 13h5"
            stroke="#6366f1"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span
        className={`${compact ? 'text-xl' : 'text-2xl'} font-bold tracking-tight ${
          inverse ? 'text-white' : 'text-slate-950'
        }`}
      >
        ChatFlow
      </span>
    </div>
  )
}
