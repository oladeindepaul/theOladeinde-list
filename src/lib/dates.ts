import { format, isValid, parseISO } from 'date-fns'

/** Local calendar date as 'yyyy-MM-dd' (never UTC-shifted). */
export const toISODate = (d: Date) => format(d, 'yyyy-MM-dd')
export const todayISO = () => toISODate(new Date())

export function parseISODate(s: string | null | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = parseISO(s)
  return isValid(d) ? d : null
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return format(d, 'h:mm a')
}

export function formatTimeRange(start: string | null, end: string | null) {
  if (!start) return 'Anytime'
  return end ? `${formatTime(start)} - ${formatTime(end)}` : formatTime(start)
}
