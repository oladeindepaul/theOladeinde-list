import { format } from 'date-fns'
import { Check, ChevronDown, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AvatarPicker from '../components/AvatarPicker.tsx'
import NotificationBell from '../components/NotificationBell.tsx'
import TaskItem from '../components/TaskItem.tsx'
import { useTaskSheet } from '../components/task-sheet-context.ts'
import { displayName, useAuth } from '../lib/auth-context.ts'
import { parseISODate, todayISO } from '../lib/dates.ts'
import { greeting, rangeLabels, summarize, type SummaryRange } from '../lib/summary.ts'
import { useAllTasks } from '../lib/tasks.ts'

const RANGE_KEY = 'home:range'

function readRange(): SummaryRange {
  try {
    const r = localStorage.getItem(RANGE_KEY)
    if (r === 'today' || r === 'week' || r === 'month') return r
  } catch {
    // Default below.
  }
  return 'week'
}

/** The hand-drawn wave from the inspo cards. */
function Squiggle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 64 28" className={`h-7 w-16 ${className}`} fill="none" aria-hidden="true">
      <path
        d="M2 14c3 0 3-9 6-9s3 18 6 18 3-20 6-20 3 22 6 22 3-18 6-18 3 14 6 14 3-8 6-8 3 5 6 5 3-3 6-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type StatCardProps = { value: number; label: string; to: string; bg: string; wave: string }

function StatCard({ value, label, to, bg, wave }: StatCardProps) {
  return (
    <Link
      to={to}
      className={`group flex flex-col justify-between rounded-3xl p-4 transition-transform active:scale-[0.98] sm:p-5 ${bg}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
        <Squiggle className={wave} />
      </div>
      <div className="mt-5 flex items-center justify-between text-sm font-medium">
        <span>{label}</span>
        <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

/** Green ring that fills as tasks are ticked off, with "done/total" inside; a full green disc with a tick at 100%. */
function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 40
  const c = 2 * Math.PI * r
  const complete = total > 0 && done >= total
  const value = total > 0 ? Math.min(done / total, 1) : 0

  return (
    <div
      role="img"
      aria-label={complete ? `All ${total} tasks done` : `${done} of ${total} tasks done`}
      className="relative grid size-24 shrink-0 place-items-center"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-surface-2" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap={complete ? 'butt' : 'round'}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value)}
          className={`stroke-success transition-[stroke-dashoffset] duration-700 ease-out ${value === 0 ? 'opacity-0' : ''}`}
        />
        {/* At 100% the centre fills in green too. */}
        <circle
          cx="50"
          cy="50"
          r={r + 5}
          className={`fill-success transition-all duration-500 ${complete ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
          style={{ transformOrigin: '50px 50px' }}
        />
      </svg>
      {complete ? (
        <Check size={44} strokeWidth={3} className="relative animate-[pop_400ms_ease-out] text-white" aria-hidden="true" />
      ) : (
        <span className="relative text-lg font-bold tabular-nums" aria-hidden="true">
          {done}/{total}
        </span>
      )}
    </div>
  )
}

export default function HomePage() {
  const { user, profile } = useAuth()
  const { open } = useTaskSheet()
  const all = useAllTasks(user!.id)
  const [range, setRange] = useState<SummaryRange>(readRange)
  const summary = useMemo(() => (all ? summarize(all, range) : null), [all, range])
  const rangeWord = range === 'today' ? 'today' : range === 'week' ? 'this week' : 'this month'

  function changeRange(r: SummaryRange) {
    setRange(r)
    try {
      localStorage.setItem(RANGE_KEY, r)
    } catch {
      // Not critical.
    }
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AvatarPicker size={52} />
          <Link to="/settings" className="min-w-0">
            <p className="text-sm text-muted">{greeting()}</p>
            <p className="truncate text-lg leading-tight font-semibold">{displayName(user, profile)}</p>
          </Link>
        </div>
        <NotificationBell />
      </header>

      <p className="mt-6 text-sm text-muted">{format(parseISODate(todayISO())!, 'EEEE, d MMMM')}</p>

      <section aria-labelledby="overview-title" className="mt-2">
        <div className="mb-4 flex items-center justify-between">
          <h1 id="overview-title" className="text-2xl font-bold tracking-tight">
            Overview
          </h1>
          <label className="relative">
            <span className="sr-only">Summary period</span>
            <select
              value={range}
              onChange={(e) => changeRange(e.target.value as SummaryRange)}
              className="appearance-none rounded-xl border border-line bg-surface py-2 pr-9 pl-3 text-sm font-medium outline-none focus:border-accent"
            >
              {(Object.keys(rangeLabels) as SummaryRange[]).map((r) => (
                <option key={r} value={r}>
                  {rangeLabels[r]}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard value={summary?.today ?? 0} label="Today" to="/calendar" bg="bg-card-purple" wave="text-wave-purple" />
          <StatCard
            value={summary?.planned ?? 0}
            label="Planned"
            to="/calendar"
            bg="bg-card-peach"
            wave="text-wave-peach"
          />
          <StatCard
            value={summary?.overdue ?? 0}
            label="Overdue"
            to="/tasks"
            bg="bg-card-sky"
            wave="text-wave-sky"
          />
          <StatCard
            value={summary?.completed ?? 0}
            label="Completed"
            to="/tasks"
            bg="bg-card-mint"
            wave="text-wave-mint"
          />
        </div>
      </section>

      {summary && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-labelledby="up-next-title">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="up-next-title" className="text-xl font-bold tracking-tight">
                {summary.upNextIsToday ? 'Up next today' : 'Coming up'}
              </h2>
              <Link to="/calendar" className="text-sm font-semibold text-accent">
                View calendar
              </Link>
            </div>

            {summary.upNext.length > 0 ? (
              <ul className="rounded-3xl bg-surface px-4 md:px-6">
                {summary.upNext.map((t) => (
                  <TaskItem key={t.id} task={t} showDate={!summary.upNextIsToday} />
                ))}
              </ul>
            ) : (
              <div className="rounded-3xl border border-dashed border-line p-8 text-center">
                <p className="font-medium">{all!.length ? "You're all caught up." : 'Nothing planned yet.'}</p>
                <p className="mt-1 text-sm text-muted">What do you want to get done?</p>
                <button
                  type="button"
                  onClick={() => open({ date: todayISO() })}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Plus size={18} />
                  Plan a task
                </button>
              </div>
            )}
          </section>

          <section aria-labelledby="progress-title" className="self-start rounded-3xl bg-surface p-5">
            <h2 id="progress-title" className="font-bold">
              Progress {rangeWord}
            </h2>
            {summary.progress === null ? (
              <p className="mt-2 text-sm text-muted">Nothing scheduled {rangeWord}. Add a task to start tracking.</p>
            ) : (
              <div className="mt-3 flex items-center gap-4">
                <ProgressRing done={summary.completed} total={summary.completed + summary.planned} />
                <div>
                  {summary.planned === 0 ? (
                    <>
                      <p className="text-xl font-bold text-success">All done!</p>
                      <p className="text-sm text-muted">Every task {rangeWord} is ticked off.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold tabular-nums">{Math.round(summary.progress * 100)}%</p>
                      <p className="text-sm text-muted">
                        {summary.completed} of {summary.completed + summary.planned} tasks done
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
            {summary.overdue > 0 && (
              <Link
                to="/tasks"
                className="mt-4 flex items-center justify-between rounded-2xl bg-red-600/10 px-4 py-3 text-sm font-medium text-red-600"
              >
                {summary.overdue} overdue task{summary.overdue === 1 ? '' : 's'} to catch up on
                <ChevronRight size={16} />
              </Link>
            )}
          </section>
        </div>
      )}
    </>
  )
}
