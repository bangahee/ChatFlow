const KST_TIME_ZONE = 'Asia/Seoul'

const dateKeyFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: KST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: KST_TIME_ZONE,
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
})

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: KST_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

export function getKstDateKey(value: string | Date): string {
  const parts = dateKeyFormatter.formatToParts(toDate(value))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function formatKstDate(value: string | Date): string {
  return dateFormatter.format(toDate(value))
}

export function formatKstTime(value: string | Date): string {
  return timeFormatter.format(toDate(value)).replace('24:', '00:')
}
