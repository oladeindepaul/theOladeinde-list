import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isThisMonth,
  isToday,
  startOfMonth,
  startOfToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TaskItem from '../components/TaskItem.tsx'
import { useTaskSheet } from '../components/task-sheet-context.ts'
import { useAuth } from '../lib/auth-context.ts'
import { parseISODate, toISODate } from '../lib/dates.ts'
import { taskTypeMeta } from '../lib/task-types.ts'
import { useTaskTypesByDay, useTasksOn } from '../lib/tasks.ts'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function MonthGrid({
  month,
  selected,
  userId,
  onSelect,
}: {
  month: Date
  selected: Date
  userId: string
  onSelect: (d: Date) => void
}) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const typesByDay = useTaskTypesByDay(userId, toISODate(days[0]), toISODate(days[days.length - 1]))

  return (
    <div className="grid grid-cols-7 gap-y-1 text-center">
      {WEEKDAYS.map((d) => (
        <div key={d} className="pb-2 text-xs font-medium text-muted sm:text-sm">
          {d}
        </div>
      ))}
      {/* Blank cells so the 1st lands on the right weekday. */}
      {Array.from({ length: getDay(days[0]) }, (_, i) => (
        <div key={`blank-${i}`} />
      ))}
      {days.map((day) => {
        const iso = toISODate(day)
        const isSelected = isSameDay(day, selected)
        const today = isToday(day)
        const types = typesByDay[iso] ?? []
        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelect(day)}
            aria-label={`${format(day, 'EEEE d MMMM')}${types.length ? `, ${types.length} kind(s) of task` : ''}`}
            aria-pressed={isSelected}
            className="group flex flex-col items-center py-0.5"
          >
            <span
              className={`grid size-10 place-items-center rounded-full text-[15px] font-medium transition-colors sm:size-11 ${
                isSelected
                  ? 'bg-ink text-bg'
                  : today
                    ? 'font-bold text-accent ring-2 ring-accent/30'
                    : 'group-hover:bg-surface-2'
              }`}
            >
              {format(day, 'd')}
            </span>
            <span className="mt-1 flex h-1.5 gap-0.5">
              {types.slice(0, 3).map((t) => (
                <span key={t} className={`size-1.5 rounded-full ${taskTypeMeta(t).dot}`} />
              ))}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function CalendarPage() {
  const { user } = useAuth()
  const userId = user!.id
  const { open } = useTaskSheet()
  const [params, setParams] = useSearchParams()
  const selected = parseISODate(params.get('date')) ?? startOfToday()
  const selectedISO = toISODate(selected)
  const [month, setMonth] = useState(() => startOfMonth(selected))
  const tasks = useTasksOn(userId, selectedISO)

  const select = (d: Date) => setParams({ date: toISODate(d) }, { replace: true })
  const goToday = () => {
    const t = startOfToday()
    setMonth(startOfMonth(t))
    select(t)
  }

  const heading = isToday(selected) ? "Today's Tasks" : format(selected, 'EEEE, d MMM')
  const showTodayButton = !isToday(selected) || !isThisMonth(month)

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-10">
      <section aria-label="Calendar" className="md:rounded-3xl md:bg-surface md:p-6 lg:sticky lg:top-10">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {format(month, 'MMMM')} <span className="font-medium text-muted">{format(month, 'yyyy')}</span>
          </h1>
          <div className="flex items-center gap-1">
            {showTodayButton && (
              <button
                type="button"
                onClick={goToday}
                className="mr-1 rounded-full border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface-2"
              >
                Today
              </button>
            )}
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
              className="grid size-10 place-items-center rounded-full hover:bg-surface-2"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
              className="grid size-10 place-items-center rounded-full hover:bg-surface-2"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <MonthGrid month={month} selected={selected} userId={userId} onSelect={select} />
      </section>

      <section aria-label={heading} className="mt-8 lg:mt-0">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{heading}</h2>
            {tasks && tasks.length > 0 && (
              <p className="text-sm text-muted">
                {tasks.filter((t) => t.completed_at).length} of {tasks.length} done
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => open({ date: selectedISO })}
            aria-label={`Add task on ${format(selected, 'd MMMM')}`}
            className="grid size-11 place-items-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/30 transition-transform active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>

        {tasks === undefined ? null : tasks.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-line p-8 text-center">
            <p className="font-medium">Nothing planned for this day.</p>
            <button
              type="button"
              onClick={() => open({ date: selectedISO })}
              className="mt-3 text-sm font-semibold text-accent"
            >
              + Add a task
            </button>
          </div>
        ) : (
          <ul className="md:rounded-3xl md:bg-surface md:px-6">
            {tasks.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
