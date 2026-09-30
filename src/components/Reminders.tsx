import { BellRing, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { displayName, useAuth } from '../lib/auth-context.ts'
import { db, type AppNotification } from '../lib/db.ts'
import { markRead, useReminderScheduler } from '../lib/reminders.ts'
import { useAllTasks } from '../lib/tasks.ts'
import { useTaskSheet } from './task-sheet-context.ts'

/** Runs the reminder scheduler and shows an in-app banner when one fires while you're using the app. */
export default function Reminders() {
  const { user, profile } = useAuth()
  const { open } = useTaskSheet()
  const tasks = useAllTasks(user!.id)
  const [banner, setBanner] = useState<AppNotification | null>(null)
  const firstName = displayName(user, profile).split(' ')[0]

  const show = useCallback((n: AppNotification) => setBanner(n), [])
  useReminderScheduler(user!.id, firstName, tasks, show)

  // Hide after 12s of the app being on screen, so a reminder that fires while you're away is still there when you return.
  useEffect(() => {
    if (!banner) return
    let t: ReturnType<typeof setTimeout> | undefined
    const start = () => {
      if (document.visibilityState === 'visible' && t === undefined) t = setTimeout(() => setBanner(null), 12_000)
    }
    start()
    document.addEventListener('visibilitychange', start)
    return () => {
      clearTimeout(t)
      document.removeEventListener('visibilitychange', start)
    }
  }, [banner])

  if (!banner) return null

  async function view() {
    const n = banner!
    setBanner(null)
    await markRead(n.id)
    const task = await db.tasks.get(n.task_id)
    if (task && !task.deleted_at) open({ task })
  }

  return (
    <div
      role="alert"
      className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-50 mx-auto flex max-w-md items-start gap-3 rounded-3xl bg-ink p-4 text-bg shadow-2xl md:right-6 md:left-auto md:mx-0 md:w-96"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent text-white">
        <BellRing size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{banner.title}</p>
        <p className="mt-0.5 text-sm break-words opacity-80">{banner.body}</p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={view} className="rounded-xl bg-accent px-3 py-1.5 text-sm font-semibold text-white">
            View task
          </button>
          <button
            type="button"
            onClick={() => {
              void markRead(banner.id)
              setBanner(null)
            }}
            className="rounded-xl px-3 py-1.5 text-sm font-semibold opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      </div>
      <button type="button" onClick={() => setBanner(null)} aria-label="Close" className="-m-1 p-1 opacity-60 hover:opacity-100">
        <X size={18} />
      </button>
    </div>
  )
}
