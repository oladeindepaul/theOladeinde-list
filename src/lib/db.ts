import Dexie, { type EntityTable } from 'dexie'

export type TaskType = 'todo' | 'event' | 'reminder' | 'milestone'

/** Mirrors public.tasks in supabase/schema.sql. Dates are local 'yyyy-MM-dd', times 'HH:mm'. */
export type Task = {
  id: string
  user_id: string
  project_id: string | null
  parent_id: string | null
  title: string
  notes: string | null
  type: TaskType
  priority: number
  due_date: string | null
  start_time: string | null
  end_time: string | null
  completed_at: string | null
  position: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** dirty = 1 means the change hasn't reached Supabase yet. */
export type LocalTask = Task & { dirty: 0 | 1 }

type Meta = { key: string; value: string }

/** A reminder that has fired (start or end of a task). Kept on this device only. */
export type AppNotification = {
  /** `${taskId}:${kind}:${scheduled ISO time}` so each reminder fires once, and re-arms if the time changes. */
  id: string
  user_id: string
  task_id: string
  kind: 'start' | 'end'
  title: string
  body: string
  due_date: string
  fire_at: string
  read_at: string | null
}

// Local-first store: the UI reads and writes here, sync.ts mirrors tasks to Supabase.
export const db = new Dexie('oladeinde-list') as Dexie & {
  tasks: EntityTable<LocalTask, 'id'>
  meta: EntityTable<Meta, 'key'>
  notifications: EntityTable<AppNotification, 'id'>
}

db.version(1).stores({
  tasks: 'id, [user_id+due_date], dirty',
  meta: 'key',
})
// v2: plain user_id index so undated ("Anytime") tasks can be listed too.
db.version(2).stores({
  tasks: 'id, user_id, [user_id+due_date], dirty',
})
// v3: fired reminders for the bell.
db.version(3).stores({
  notifications: 'id, user_id, fire_at',
})
