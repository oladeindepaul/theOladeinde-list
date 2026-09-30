import { ChevronDown, Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.tsx'
import SortableTaskList from '../components/SortableTaskList.tsx'
import TaskItem from '../components/TaskItem.tsx'
import { useDefaultTaskDate, useTaskSheet } from '../components/task-sheet-context.ts'
import { useAuth } from '../lib/auth-context.ts'
import { todayISO } from '../lib/dates.ts'
import type { TaskType } from '../lib/db.ts'
import { groupTasks, type SectionKey, type TaskSection } from '../lib/task-groups.ts'
import { taskTypes } from '../lib/task-types.ts'
import { useAllTasks } from '../lib/tasks.ts'

const COLLAPSED_KEY = 'tasks:collapsed'

function readCollapsed(): Partial<Record<SectionKey, boolean>> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Fall through to the default.
  }
  return { completed: true }
}

function useCollapsed() {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const toggle = (key: SectionKey) =>
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next))
      } catch {
        // Not critical.
      }
      return next
    })
  return { collapsed, toggle }
}

function Section({ section, collapsed, onToggle }: { section: TaskSection; collapsed: boolean; onToggle: () => void }) {
  const id = `section-${section.key}`
  const isCompleted = section.key === 'completed'

  return (
    <section aria-labelledby={`${id}-title`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={id}
        className="flex w-full items-center gap-2 py-2 text-left"
      >
        <ChevronDown size={18} className={`text-muted transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        <h2
          id={`${id}-title`}
          className={`text-lg font-bold tracking-tight ${section.key === 'overdue' ? 'text-red-600' : ''}`}
        >
          {section.title}
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            section.key === 'overdue' ? 'bg-red-600/10 text-red-600' : 'bg-surface-2 text-muted'
          }`}
        >
          {section.count}
        </span>
      </button>

      {!collapsed && (
        <div id={id} className="mt-1 space-y-3">
          {section.groups.map((g) => (
            <div key={g.key} className="rounded-3xl bg-surface px-4 md:px-6">
              {g.label && <h3 className="pt-4 text-sm font-semibold text-muted">{g.label}</h3>}
              {isCompleted ? (
                <ul>
                  {g.tasks.map((t) => (
                    <TaskItem key={t.id} task={t} showDate />
                  ))}
                </ul>
              ) : (
                <SortableTaskList tasks={g.tasks} />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function TasksPage() {
  const { user } = useAuth()
  const { open } = useTaskSheet()
  const defaultDate = useDefaultTaskDate()
  const all = useAllTasks(user!.id)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<TaskType | 'all'>('all')
  const { collapsed, toggle } = useCollapsed()

  const sections = useMemo(() => {
    if (!all) return null
    const q = query.trim().toLowerCase()
    const filtered = all.filter(
      (t) =>
        (type === 'all' || t.type === type) &&
        (!q || t.title.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q)),
    )
    return groupTasks(filtered, todayISO())
  }, [all, query, type])

  const open_ = all?.filter((t) => !t.completed_at).length ?? 0
  const overdue = sections?.find((s) => s.key === 'overdue')?.count ?? 0
  const filtering = query.trim() !== '' || type !== 'all'

  return (
    <div className="lg:max-w-3xl">
      <PageHeader
        title="Tasks"
        action={
          <button
            type="button"
            onClick={() => open({ date: defaultDate })}
            aria-label="Add task"
            className="grid size-11 place-items-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/30 transition-transform active:scale-95"
          >
            <Plus size={24} />
          </button>
        }
      />
      {all && all.length > 0 && (
        <p className="-mt-4 mb-5 text-sm text-muted">
          {open_} open{overdue > 0 && <span className="text-red-600"> · {overdue} overdue</span>}
        </p>
      )}

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks"
          aria-label="Search tasks"
          className="w-full rounded-2xl border border-line bg-surface py-3 pr-11 pl-11 text-[15px] outline-none placeholder:text-muted focus:border-accent [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-2"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label="Filter by type"
        className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
      >
        {[{ value: 'all' as const, label: 'All', icon: null, text: '' }, ...taskTypes].map(({ value, label, icon: Icon, text }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={type === value}
            onClick={() => setType(value)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              type === value ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted hover:text-ink'
            }`}
          >
            {Icon && <Icon size={15} className={type === value ? '' : text} />}
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6">
        {sections === null ? null : sections.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-10 text-center">
            {filtering ? (
              <>
                <p className="font-medium">No tasks match.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setType('all')
                  }}
                  className="mt-3 text-sm font-semibold text-accent"
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p className="font-medium">No tasks yet.</p>
                <p className="mt-1 text-sm text-muted">Add your first one to get started.</p>
                <button
                  type="button"
                  onClick={() => open({ date: defaultDate })}
                  className="mt-4 text-sm font-semibold text-accent"
                >
                  + Add a task
                </button>
              </>
            )}
          </div>
        ) : (
          sections.map((s) => (
            <Section
              key={s.key}
              section={s}
              // Searching opens everything so matches aren't hidden.
              collapsed={!filtering && Boolean(collapsed[s.key])}
              onToggle={() => toggle(s.key)}
            />
          ))
        )}
      </div>
    </div>
  )
}
