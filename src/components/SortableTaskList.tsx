import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useState } from 'react'
import type { LocalTask } from '../lib/db.ts'
import { reorderTask } from '../lib/tasks.ts'
import TaskItem from './TaskItem.tsx'

function SortableTask({ task }: { task: LocalTask }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <TaskItem
      task={task}
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      dragging={isDragging}
      handle={
        // Dragging starts only from the grip, so the rest of the row still scrolls on phones.
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Reorder "${task.title}"`}
          className="-ml-2 mt-1 grid h-10 w-7 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-muted/60 hover:text-ink active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>
      }
    />
  )
}

/** Drag-and-drop list (mouse, touch and keyboard: focus the grip, Space, arrows, Space). */
export default function SortableTaskList({ tasks }: { tasks: LocalTask[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Show the new order immediately; drop it once the saved order comes back from the database.
  const [optimistic, setOptimistic] = useState<LocalTask[] | null>(null)
  const [source, setSource] = useState(tasks)
  if (source !== tasks) {
    setSource(tasks)
    setOptimistic(null)
  }
  const ordered = optimistic ?? tasks

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    setOptimistic(reorderTask(ordered, String(active.id), String(over.id)))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ordered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul>
          {ordered.map((t) => (
            <SortableTask key={t.id} task={t} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
