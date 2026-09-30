import { useLiveQuery } from 'dexie-react-hooks'
import { db, type LocalTask, type TaskType } from './db.ts'
import { scheduleSync } from './sync.ts'

export type TaskInput = {
  title: string
  type: TaskType
  due_date: string | null
  start_time: string | null
  end_time: string | null
  notes: string | null
}

const now = () => new Date().toISOString()

/** Timed tasks first in time order, then untimed ones in the order they were added. */
function byTimeThenPosition(a: LocalTask, b: LocalTask) {
  if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time)
  if (a.start_time) return -1
  if (b.start_time) return 1
  return a.position - b.position
}

export async function addTask(userId: string, input: TaskInput) {
  const ts = now()
  await db.tasks.add({
    ...input,
    id: crypto.randomUUID(),
    user_id: userId,
    project_id: null,
    parent_id: null,
    priority: 0,
    completed_at: null,
    position: Date.now(),
    created_at: ts,
    updated_at: ts,
    deleted_at: null,
    dirty: 1,
  })
  scheduleSync()
}

export async function updateTask(id: string, patch: Partial<LocalTask>) {
  await db.tasks.update(id, { ...patch, updated_at: now(), dirty: 1 })
  scheduleSync()
}

// Soft delete so the deletion syncs to other devices and can be undone.
export const deleteTask = (id: string) => updateTask(id, { deleted_at: now() })
export const restoreTask = (id: string) => updateTask(id, { deleted_at: null })

export const toggleComplete = (task: LocalTask) =>
  updateTask(task.id, { completed_at: task.completed_at ? null : now() })

/** Live list of a day's tasks; re-renders on any change. */
export function useTasksOn(userId: string, date: string) {
  return useLiveQuery(
    () =>
      db.tasks
        .where('[user_id+due_date]')
        .equals([userId, date])
        .filter((t) => !t.deleted_at)
        .toArray()
        .then((list) => list.sort(byTimeThenPosition)),
    [userId, date],
  )
}

/** For calendar dots: the distinct types of open tasks on each day in a range. */
export function useTaskTypesByDay(userId: string, from: string, to: string) {
  return useLiveQuery(
    async () => {
      const list = await db.tasks
        .where('[user_id+due_date]')
        .between([userId, from], [userId, to], true, true)
        .filter((t) => !t.deleted_at && !t.completed_at)
        .toArray()
      const byDay: Record<string, TaskType[]> = {}
      for (const t of list) {
        const types = (byDay[t.due_date!] ??= [])
        if (!types.includes(t.type)) types.push(t.type)
      }
      return byDay
    },
    [userId, from, to],
    {} as Record<string, TaskType[]>,
  )
}
