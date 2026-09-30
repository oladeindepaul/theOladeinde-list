import { format, formatDistanceStrict } from 'date-fns'
import { Bell, BellOff, BellRing, CheckCheck, Flag, Timer } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../lib/auth-context.ts'
import { db, type AppNotification } from '../lib/db.ts'
import {
  alertStatus,
  enableAlerts,
  markAllRead,
  markRead,
  nextReminder,
  useNotifications,
  useNow,
  type AlertStatus,
} from '../lib/reminders.ts'
import { useAllTasks } from '../lib/tasks.ts'
import { useTaskSheet } from './task-sheet-context.ts'

function AlertsRow({ status, onEnable }: { status: AlertStatus; onEnable: () => void }) {
  if (status === 'on') return null
  const text: Record<Exclude<AlertStatus, 'on'>, string> = {
    off: 'Get reminders on this device, even when the app is in the background.',
    blocked: 'Alerts are blocked. Allow notifications for this site in your browser settings.',
    unsupported: "This browser can't show alerts. You'll still see reminders here and in the app.",
    'ios-install': 'On iPhone/iPad, tap Share → Add to Home Screen, then open the app from there to get alerts.',
  }
  return (
    <div className="mx-4 mb-3 flex items-start gap-3 rounded-2xl bg-accent-soft p-3 text-sm">
      <BellOff size={18} className="mt-0.5 shrink-0 text-accent" />
      <p className="flex-1">{text[status]}</p>
      {status === 'off' && (
        <button type="button" onClick={onEnable} className="shrink-0 rounded-xl bg-accent px-3 py-1.5 font-semibold text-white">
          Turn on
        </button>
      )}
    </div>
  )
}

type PanelProps = {
  userId: string
  items: AppNotification[]
  unread: number
  onOpenItem: (n: AppNotification) => void
}

/** Mounted only while open, so its clock starts fresh and ticks every second for the countdown. */
function NotificationPanel({ userId, items, unread, onOpenItem }: PanelProps) {
  const tasks = useAllTasks(userId)
  const now = useNow(1000)
  const [status, setStatus] = useState<AlertStatus>(alertStatus)
  const next = tasks ? nextReminder(tasks, now) : null

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="fixed inset-x-4 top-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] z-40 flex max-h-[70dvh] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl md:absolute md:inset-x-auto md:top-14 md:right-0 md:w-96"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-lg font-bold">Notifications</h2>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => markAllRead(userId)}
            className="flex items-center gap-1 text-sm font-semibold text-accent"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      <AlertsRow status={status} onEnable={async () => setStatus(await enableAlerts())} />

      {next && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
          <Timer size={20} className="shrink-0 text-accent" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{next.kind === 'start' ? next.task.title : `${next.task.title} ends`}</p>
            <p className="text-muted" aria-live="off">
              {format(next.at, 'EEE h:mm a')} · in {formatDistanceStrict(next.at, now)}
            </p>
          </div>
        </div>
      )}

      <ul className="min-h-0 flex-1 overflow-y-auto pb-2">
        {items.length === 0 ? (
          <li className="px-6 pt-2 pb-6 text-center text-sm text-muted">
            No reminders yet. Give a task a start time and you&apos;ll be reminded when it begins and ends.
          </li>
        ) : (
          items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onOpenItem(n)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-2"
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                    n.kind === 'start' ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'
                  }`}
                >
                  {n.kind === 'start' ? <BellRing size={17} /> : <Flag size={17} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm break-words ${n.read_at ? 'text-muted' : 'font-medium'}`}>
                    {n.title} {n.body}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {formatDistanceStrict(new Date(n.fire_at), now, { addSuffix: true })}
                  </span>
                </span>
                {!n.read_at && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

/** Home header bell: unread badge, countdown to the next reminder, and reminder history. */
export default function NotificationBell() {
  const { user } = useAuth()
  const { open: openTask } = useTaskSheet()
  const items = useNotifications(user!.id) ?? []
  const [isOpen, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const unread = items.filter((n) => !n.read_at).length

  useEffect(() => {
    if (!isOpen) return
    const onDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen])

  async function openItem(n: AppNotification) {
    await markRead(n.id)
    const task = await db.tasks.get(n.task_id)
    setOpen(false)
    if (task && !task.deleted_at) openTask({ task })
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="relative grid size-12 place-items-center rounded-full border border-line bg-surface"
      >
        <Bell size={22} strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[11px] font-bold text-white ring-2 ring-bg">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {isOpen && <NotificationPanel userId={user!.id} items={items} unread={unread} onOpenItem={openItem} />}
    </div>
  )
}
