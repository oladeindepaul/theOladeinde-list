import { db, type LocalTask, type Task } from './db.ts'
import { supabase } from './supabase.ts'

const PAGE = 1000
let timer: ReturnType<typeof setTimeout> | undefined
let running: Promise<void> | null = null

function toRow(t: LocalTask): Task {
  const row: Partial<LocalTask> = { ...t }
  delete row.dirty
  return row as Task
}

// Postgres returns time as 'HH:mm:ss'; the app uses 'HH:mm'.
function fromRow(r: Task): LocalTask {
  return {
    ...r,
    start_time: r.start_time?.slice(0, 5) ?? null,
    end_time: r.end_time?.slice(0, 5) ?? null,
    dirty: 0,
  }
}

async function push(userId: string) {
  const dirty = await db.tasks.where('dirty').equals(1).filter((t) => t.user_id === userId).toArray()
  if (!dirty.length) return
  const { error } = await supabase.from('tasks').upsert(dirty.map(toRow))
  if (error) throw error
  // Only clear the flag if the task wasn't edited again while we were uploading.
  await db.transaction('rw', db.tasks, async () => {
    for (const t of dirty) {
      const current = await db.tasks.get(t.id)
      if (current && current.updated_at === t.updated_at) await db.tasks.update(t.id, { dirty: 0 })
    }
  })
}

async function pull(userId: string) {
  const key = `lastPulled:${userId}`
  let since = (await db.meta.get(key))?.value ?? '1970-01-01T00:00:00Z'

  for (;;) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .gt('updated_at', since)
      .order('updated_at')
      .limit(PAGE)
    if (error) throw error
    if (!data.length) return

    const rows = data as Task[]
    await db.transaction('rw', db.tasks, db.meta, async () => {
      for (const r of rows) {
        const local = await db.tasks.get(r.id)
        if (local?.dirty) continue // Local edit wins; it gets pushed next round.
        await db.tasks.put(fromRow(r))
      }
      since = rows[rows.length - 1].updated_at
      await db.meta.put({ key, value: since })
    })
    if (rows.length < PAGE) return
  }
}

async function run() {
  if (!navigator.onLine) return
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return
  try {
    await push(userId)
    await pull(userId)
  } catch (err) {
    // Stay quiet: changes remain in IndexedDB and retry on the next sync.
    console.warn('Sync failed, will retry', err)
  }
}

/** Push local changes and pull remote ones. Concurrent calls share one run. */
export function syncNow(): Promise<void> {
  running ??= run().finally(() => {
    running = null
  })
  return running
}

/** Debounced sync after local edits. */
export function scheduleSync(delay = 800) {
  clearTimeout(timer)
  timer = setTimeout(() => void syncNow(), delay)
}
