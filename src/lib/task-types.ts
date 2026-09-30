import { Bell, CalendarDays, ChartPie, Circle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TaskType } from './db.ts'

type TaskTypeMeta = { value: TaskType; label: string; icon: LucideIcon; text: string; dot: string }

// Class names are spelled out in full so Tailwind can find them.
export const taskTypes: TaskTypeMeta[] = [
  { value: 'todo', label: 'To Do', icon: Circle, text: 'text-type-todo', dot: 'bg-type-todo' },
  { value: 'event', label: 'Event', icon: CalendarDays, text: 'text-type-event', dot: 'bg-type-event' },
  { value: 'reminder', label: 'Reminder', icon: Bell, text: 'text-type-reminder', dot: 'bg-type-reminder' },
  { value: 'milestone', label: 'Milestone', icon: ChartPie, text: 'text-type-milestone', dot: 'bg-type-milestone' },
]

export const taskTypeMeta = (t: TaskType) => taskTypes.find((m) => m.value === t)!
