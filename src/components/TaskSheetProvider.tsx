import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { deleteTask, restoreTask } from '../lib/tasks.ts'
import TaskSheet from './TaskSheet.tsx'
import { TaskSheetContext, type TaskSheetArgs } from './task-sheet-context.ts'

/** Owns the add/edit sheet and the "Task deleted · Undo" toast for the whole app. */
export default function TaskSheetProvider({ children }: { children: ReactNode }) {
  const [args, setArgs] = useState<TaskSheetArgs | null>(null)
  const [deletedId, setDeletedId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const open = useCallback((a: TaskSheetArgs = {}) => setArgs(a), [])
  const close = useCallback(() => setArgs(null), [])

  const removeTask = useCallback(async (id: string) => {
    await deleteTask(id)
    setDeletedId(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setDeletedId(null), 5000)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  async function undo() {
    if (!deletedId) return
    clearTimeout(timer.current)
    await restoreTask(deletedId)
    setDeletedId(null)
  }

  return (
    <TaskSheetContext.Provider value={{ open, removeTask }}>
      {children}
      {args && <TaskSheet args={args} onClose={close} onDelete={removeTask} />}
      {deletedId && (
        <div
          role="status"
          className="fixed bottom-[calc(7.5rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-5 rounded-2xl bg-ink py-3 pr-3 pl-5 text-sm whitespace-nowrap text-bg shadow-xl md:bottom-8"
        >
          Task deleted
          <button type="button" onClick={undo} className="rounded-xl px-3 py-1.5 font-semibold text-accent-soft hover:bg-white/10">
            Undo
          </button>
        </div>
      )}
    </TaskSheetContext.Provider>
  )
}
