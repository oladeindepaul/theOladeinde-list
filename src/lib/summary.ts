import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns'
import { toISODate, todayISO } from './dates.ts'
import type { LocalTask } from './db.ts'

export type SummaryRange = 'today' | 'week' | 'month'

export const rangeLabels: Record<SummaryRange, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
}

/** Inclusive 'yyyy-MM-dd' bounds. Weeks start on Sunday, matching the calendar. */
function rangeBounds(range: SummaryRange) {
  const now = new Date()
  if (range === 'today') return { from: todayISO(), to: todayISO() }
  if (range === 'week') return { from: toISODate(startOfWeek(now)), to: toISODate(endOfWeek(now)) }
  return { from: toISODate(startOfMonth(now)), to: toISODate(endOfMonth(now)) }
}

function byDateThenTime(a: LocalTask, b: LocalTask) {
  return (
    (a.due_date ?? '').localeCompare(b.due_date ?? '') ||
    (a.start_time ?? '99').localeCompare(b.start_time ?? '99') ||
    a.position - b.position
  )
}

export type Summary = {
  today: number
  planned: number
  overdue: number
  completed: number
  /** Share of this range's tasks that are done, 0–1; null when nothing is planned. */
  progress: number | null
  /** Rest of today, or (if today is clear) the next few upcoming tasks. */
  upNext: LocalTask[]
  upNextIsToday: boolean
}

export function summarize(tasks: LocalTask[], range: SummaryRange): Summary {
  const today = todayISO()
  const { from, to } = rangeBounds(range)
  const inRange = (d: string | null) => d !== null && d >= from && d <= to

  const open = tasks.filter((t) => !t.completed_at)
  const todays = open.filter((t) => t.due_date === today).sort(byDateThenTime)
  const planned = open.filter((t) => inRange(t.due_date)).length
  // completed_at is a UTC timestamp; compare by the local day it was ticked off.
  const completed = tasks.filter((t) => t.completed_at && inRange(toISODate(new Date(t.completed_at)))).length
  const upcoming = open.filter((t) => t.due_date && t.due_date > today).sort(byDateThenTime)

  return {
    today: todays.length,
    planned,
    overdue: open.filter((t) => t.due_date && t.due_date < today).length,
    completed,
    progress: planned + completed > 0 ? completed / (planned + completed) : null,
    upNext: todays.length ? todays.slice(0, 5) : upcoming.slice(0, 3),
    upNextIsToday: todays.length > 0,
  }
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
