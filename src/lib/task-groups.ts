import { format, isThisYear, isTomorrow, isYesterday } from 'date-fns'
import { parseISODate } from './dates.ts'
import type { LocalTask } from './db.ts'

export type SectionKey = 'overdue' | 'today' | 'upcoming' | 'anytime' | 'completed'

/** A reorderable run of tasks; Overdue and Upcoming have one per date. */
export type TaskGroup = { key: string; label?: string; tasks: LocalTask[] }
export type TaskSection = { key: SectionKey; title: string; count: number; groups: TaskGroup[] }

const byPosition = (a: LocalTask, b: LocalTask) => a.position - b.position

function dateLabel(iso: string) {
  const d = parseISODate(iso)!
  if (isTomorrow(d)) return 'Tomorrow'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, isThisYear(d) ? 'EEE, d MMM' : 'EEE, d MMM yyyy')
}

function groupByDate(tasks: LocalTask[], dateOrder: 1 | -1): TaskGroup[] {
  const map = new Map<string, LocalTask[]>()
  for (const t of tasks) {
    const list = map.get(t.due_date!) ?? []
    list.push(t)
    map.set(t.due_date!, list)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b) * dateOrder)
    .map(([date, list]) => ({ key: date, label: dateLabel(date), tasks: list.sort(byPosition) }))
}

/** Splits tasks into Overdue / Today / Upcoming / Anytime / Completed. Empty sections are left out. */
export function groupTasks(tasks: LocalTask[], today: string): TaskSection[] {
  const overdue: LocalTask[] = []
  const todays: LocalTask[] = []
  const upcoming: LocalTask[] = []
  const anytime: LocalTask[] = []
  const completed: LocalTask[] = []

  for (const t of tasks) {
    if (t.completed_at) completed.push(t)
    else if (!t.due_date) anytime.push(t)
    else if (t.due_date < today) overdue.push(t)
    else if (t.due_date === today) todays.push(t)
    else upcoming.push(t)
  }

  completed.sort((a, b) => b.completed_at!.localeCompare(a.completed_at!))

  const sections: TaskSection[] = [
    { key: 'overdue', title: 'Overdue', count: overdue.length, groups: groupByDate(overdue, -1) },
    { key: 'today', title: 'Today', count: todays.length, groups: [{ key: 'today', tasks: todays.sort(byPosition) }] },
    { key: 'upcoming', title: 'Upcoming', count: upcoming.length, groups: groupByDate(upcoming, 1) },
    { key: 'anytime', title: 'Anytime', count: anytime.length, groups: [{ key: 'anytime', tasks: anytime.sort(byPosition) }] },
    { key: 'completed', title: 'Completed', count: completed.length, groups: [{ key: 'completed', tasks: completed }] },
  ]
  return sections.filter((s) => s.count > 0)
}
