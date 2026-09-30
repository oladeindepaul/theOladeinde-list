import { BellRing, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth-context.ts'
import { todayISO } from '../lib/dates.ts'
import type { TaskType } from '../lib/db.ts'
import { taskTypes } from '../lib/task-types.ts'
import { addTask, updateTask } from '../lib/tasks.ts'
import type { TaskSheetArgs } from './task-sheet-context.ts'

const field =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-muted focus:border-accent'

type Props = {
  args: TaskSheetArgs
  onClose: () => void
  onDelete: (id: string) => Promise<void>
}

/** Add/edit task form: a bottom sheet on phones, a centred dialog on tablets and up. */
export default function TaskSheet({ args, onClose, onDelete }: Props) {
  const { user } = useAuth()
  const editing = args.task
  const [title, setTitle] = useState(editing?.title ?? '')
  const [type, setType] = useState<TaskType>(editing?.type ?? 'todo')
  const [date, setDate] = useState(editing?.due_date ?? args.date ?? todayISO())
  const [start, setStart] = useState(editing?.start_time ?? '')
  const [end, setEnd] = useState(editing?.end_time ?? '')
  const [notes, setNotes] = useState(editing?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // Stop the page behind from scrolling while the sheet is open.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError('Give your task a title.')
    if (end && !start) return setError('Add a start time too.')
    if (start && end && end <= start) return setError('End time must be after the start time.')

    const input = {
      title: title.trim(),
      type,
      due_date: date || null,
      start_time: start || null,
      end_time: end || null,
      notes: notes.trim() || null,
    }
    setSaving(true)
    if (editing) await updateTask(editing.id, input)
    else await addTask(user!.id, input)
    onClose()
  }

  async function remove() {
    if (!editing) return
    await onDelete(editing.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 md:items-center md:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-sheet-title"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-surface px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl md:max-w-lg md:rounded-[28px] md:p-6"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line md:hidden" />
        <div className="mb-5 flex items-center justify-between">
          <h2 id="task-sheet-title" className="text-xl font-bold">
            {editing ? 'Edit task' : 'New task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            ref={titleRef}
            className={`${field} text-base font-semibold`}
            placeholder="What do you need to do?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setError(null)
            }}
            maxLength={200}
          />

          <div className="grid grid-cols-2 gap-2 min-[400px]:grid-cols-4" role="radiogroup" aria-label="Type">
            {taskTypes.map(({ value, label, icon: Icon, text }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={type === value}
                onClick={() => setType(value)}
                className={`flex items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-sm font-medium transition-colors ${
                  type === value ? 'border-ink bg-ink text-bg' : 'border-line text-muted hover:text-ink'
                }`}
              >
                <Icon size={16} className={type === value ? '' : text} />
                {label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Date</span>
            <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Start</span>
              <input
                type="time"
                className={field}
                value={start}
                onChange={(e) => {
                  setStart(e.target.value)
                  setError(null)
                }}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">End</span>
              <input
                type="time"
                className={field}
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value)
                  setError(null)
                }}
              />
            </label>
          </div>
          {start && date && (
            <p className="-mt-2 flex items-center gap-1.5 text-sm text-muted">
              <BellRing size={15} className="shrink-0 text-accent" />
              {end ? "You'll be reminded when it starts and when it ends." : "You'll be reminded when it starts."}
            </p>
          )}

          <textarea
            className={`${field} min-h-24 resize-y`}
            placeholder="Notes (shown in the reminder: “It is time to …”)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          {editing && (
            <button
              type="button"
              onClick={remove}
              aria-label="Delete task"
              className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line text-red-600 hover:bg-red-600/10"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl border border-line font-semibold hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-12 flex-1 rounded-2xl bg-accent font-semibold text-white disabled:opacity-60"
          >
            {editing ? 'Save' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  )
}
