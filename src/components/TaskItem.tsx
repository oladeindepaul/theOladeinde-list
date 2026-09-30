import { format } from 'date-fns'
import { CheckCircle2, Trash2 } from 'lucide-react'
import type { CSSProperties, ReactNode, Ref } from 'react'
import { formatTimeRange, parseISODate } from '../lib/dates.ts'
import type { LocalTask } from '../lib/db.ts'
import { taskTypeMeta } from '../lib/task-types.ts'
import { toggleComplete } from '../lib/tasks.ts'
import { useTaskSheet } from './task-sheet-context.ts'

type Props = {
  task: LocalTask
  /** Show the date next to the time (for lists that mix days). */
  showDate?: boolean
  /** Optional drag handle rendered at the start of the row. */
  handle?: ReactNode
  ref?: Ref<HTMLLIElement>
  style?: CSSProperties
  dragging?: boolean
}

/** One task: tap the icon to complete, the text to edit, the bin to delete (with undo). */
export default function TaskItem({ task, showDate, handle, ref, style, dragging }: Props) {
  const { open, removeTask } = useTaskSheet()
  const meta = taskTypeMeta(task.type)
  const done = Boolean(task.completed_at)
  const Icon = done ? CheckCircle2 : meta.icon
  const date = showDate ? parseISODate(task.due_date) : null
  const when = [date && format(date, 'EEE, d MMM'), formatTimeRange(task.start_time, task.end_time)]
    .filter(Boolean)
    .join(' · ')

  return (
    <li
      ref={ref}
      style={style}
      className={`group relative flex items-start gap-3 border-t border-line py-4 first:border-t-0 ${
        dragging ? 'z-10 rounded-2xl border-transparent bg-surface shadow-xl ring-1 ring-line' : ''
      }`}
    >
      {handle}
      <button
        type="button"
        onClick={() => toggleComplete(task)}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        aria-pressed={done}
        className={`-m-2 mt-3 grid size-10 shrink-0 place-items-center rounded-full hover:bg-surface-2 ${
          done ? 'text-type-event' : meta.text
        }`}
      >
        <Icon size={22} strokeWidth={1.75} />
      </button>
      <button type="button" onClick={() => open({ task })} className="min-w-0 flex-1 text-left">
        <p className="text-xs text-muted">{meta.label}</p>
        <p className={`mt-0.5 font-semibold break-words ${done ? 'text-muted line-through' : ''}`}>{task.title}</p>
        <p className="mt-2 text-sm text-muted">{when}</p>
      </button>
      <button
        type="button"
        onClick={() => removeTask(task.id)}
        aria-label={`Delete "${task.title}"`}
        className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-red-600/10 hover:text-red-600 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
      >
        <Trash2 size={18} />
      </button>
    </li>
  )
}
