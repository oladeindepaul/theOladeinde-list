import { createContext, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { parseISODate, todayISO } from '../lib/dates.ts'
import type { LocalTask } from '../lib/db.ts'

export type TaskSheetArgs = { date?: string; task?: LocalTask }

type TaskSheetContextValue = {
  /** Open the add sheet (optionally for a date) or the edit sheet (pass task). */
  open: (args?: TaskSheetArgs) => void
  /** Delete with an "Undo" toast. */
  removeTask: (id: string) => Promise<void>
}

export const TaskSheetContext = createContext<TaskSheetContextValue | null>(null)

export function useTaskSheet() {
  const ctx = useContext(TaskSheetContext)
  if (!ctx) throw new Error('useTaskSheet must be used inside TaskSheetProvider')
  return ctx
}

/** New tasks default to the day open on the calendar, otherwise today. */
export function useDefaultTaskDate() {
  const { pathname, search } = useLocation()
  if (pathname === '/calendar') {
    const d = new URLSearchParams(search).get('date')
    if (parseISODate(d)) return d!
  }
  return todayISO()
}
