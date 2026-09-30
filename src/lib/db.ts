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

// Local-first store: the UI reads and writes here, sync.ts mirrors it to Supabase.
export const db = new Dexie('oladeinde-list') as Dexie & {
  tasks: EntityTable<LocalTask, 'id'>
  meta: EntityTable<Meta, 'key'>
}

db.version(1).stores({
  tasks: 'id, [user_id+due_date], dirty',
  meta: 'key',
})
