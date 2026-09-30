import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { db, type AppNotification, type LocalTask } from './db.ts'

const MINUTE = 60_000
/** Missed by more than this (app was closed): add to the bell quietly, no pop-up. */
const POPUP_GRACE = 5 * MINUTE
/** Reminders older than this are ignored entirely. */
const CATCH_UP = 24 * 60 * MINUTE
/** Bell history is trimmed after 30 days. */
const KEEP = 30 * 24 * 60 * MINUTE
/** Re-check at least this often, even if nothing is due. */
const MAX_WAIT = 30_000

export type Reminder = { id: string; task: LocalTask; kind: 'start' | 'end'; at: Date }

function localDateTime(date: string, time: string) {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d, h, min)
}

/** A task with a date and start time reminds at the start, and again at the end time if it has one. */
export function remindersFor(task: LocalTask): Reminder[] {
  if (task.deleted_at || task.completed_at || !task.due_date || !task.start_time) return []
  const start = localDateTime(task.due_date, task.start_time)
  const list: Reminder[] = [{ id: `${task.id}:start:${start.toISOString()}`, task, kind: 'start', at: start }]
  if (task.end_time) {
    const end = localDateTime(task.due_date, task.end_time)
    list.push({ id: `${task.id}:end:${end.toISOString()}`, task, kind: 'end', at: end })
  }
  return list
}

export function nextReminder(tasks: LocalTask[], now: number): Reminder | null {
  let next: Reminder | null = null
  for (const t of tasks)
    for (const r of remindersFor(t)) if (r.at.getTime() > now && (!next || r.at < next.at)) next = r
  return next
}

/** "Dear Paul," + "It is time to <note, or the title if there's no note>." */
function compose(r: Reminder, firstName: string) {
  const title = `Dear ${firstName},`
  if (r.kind === 'end') return { title, body: `Your reminder "${r.task.title}" has ended.` }
  const what = (r.task.notes?.trim() || r.task.title)
    .replace(/\s+/g, ' ')
    .replace(/[.!\s]+$/, '')
    .slice(0, 200)
  return { title, body: `It is time to ${what}.` }
}

// ---------------------------------------------------------------------------
// Device alerts (system notifications)
// ---------------------------------------------------------------------------

export type AlertStatus = 'on' | 'off' | 'blocked' | 'unsupported' | 'ios-install'

export function alertStatus(): AlertStatus {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  const installed =
    matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  // iPhone/iPad only allow notifications for apps added to the Home Screen.
  if (!('Notification' in window)) return ios && !installed ? 'ios-install' : 'unsupported'
  if (Notification.permission === 'granted') return 'on'
  if (Notification.permission === 'denied') return 'blocked'
  return 'off'
}

export async function enableAlerts(): Promise<AlertStatus> {
  if ('Notification' in window) await Notification.requestPermission()
  return alertStatus()
}

async function showSystemNotification(n: AppNotification) {
  if (alertStatus() !== 'on') return
  const options: NotificationOptions = {
    body: n.body,
    tag: n.id,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: `/calendar?date=${n.due_date}` },
  }
  try {
    // Android only allows notifications through the service worker.
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(n.title, options)
    else new Notification(n.title, options)
  } catch (err) {
    console.warn('Could not show notification', err)
  }
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

/**
 * Watches the user's tasks and fires reminders on time: onInApp shows a banner, and
 * if the app isn't in focus a system notification is sent too (if allowed).
 * Every fired reminder is also saved for the bell.
 */
export function useReminderScheduler(
  userId: string,
  firstName: string,
  tasks: LocalTask[] | undefined,
  onInApp: (n: AppNotification) => void,
) {
  const onInAppRef = useRef(onInApp)
  useEffect(() => {
    onInAppRef.current = onInApp
  })

  useEffect(() => {
    void db.notifications
      .where('fire_at')
      .below(new Date(Date.now() - KEEP).toISOString())
      .delete()
  }, [])

  useEffect(() => {
    if (!tasks) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    async function check() {
      const now = Date.now()
      let next = Infinity

      for (const task of tasks!) {
        for (const r of remindersFor(task)) {
          const t = r.at.getTime()
          if (t > now) {
            next = Math.min(next, t)
            continue
          }
          if (now - t > CATCH_UP) continue

          const { title, body } = compose(r, firstName)
          const n: AppNotification = {
            id: r.id,
            user_id: userId,
            task_id: task.id,
            kind: r.kind,
            title,
            body,
            due_date: task.due_date!,
            fire_at: r.at.toISOString(),
            read_at: null,
          }
          try {
            await db.notifications.add(n) // Fails if already fired: that's our "only once" guard.
          } catch {
            continue
          }
          if (cancelled || now - t > POPUP_GRACE) continue
          // Always show the in-app banner; also alert the device if you're not looking at the app.
          onInAppRef.current(n)
          if (!document.hasFocus()) void showSystemNotification(n)
        }
      }

      if (!cancelled) timer = setTimeout(check, Math.max(1000, Math.min(next - Date.now(), MAX_WAIT)))
    }

    void check()
    // Browsers slow timers in background tabs; catch up as soon as the app is looked at again.
    const onWake = () => {
      clearTimeout(timer)
      void check()
    }
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)
    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
    }
  }, [tasks, userId, firstName])
}

// ---------------------------------------------------------------------------
// Bell data
// ---------------------------------------------------------------------------

export function useNotifications(userId: string) {
  return useLiveQuery(
    () => db.notifications.where('user_id').equals(userId).reverse().sortBy('fire_at'),
    [userId],
  )
}

export const markRead = (id: string) => db.notifications.update(id, { read_at: new Date().toISOString() })

export async function markAllRead(userId: string) {
  const ts = new Date().toISOString()
  await db.notifications
    .where('user_id')
    .equals(userId)
    .filter((n) => !n.read_at)
    .modify({ read_at: ts })
}

/** Current time that ticks every `ms`, for countdowns. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(i)
  }, [ms])
  return now
}
