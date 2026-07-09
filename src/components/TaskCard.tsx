import type React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from './types'

interface TaskCardProps {
  task: Task
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const dueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('ru-RU')
    : null

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-sm p-3 cursor-grab hover:shadow-md transition-shadow"
    >
      <h4 className="font-medium text-gray-800 text-sm">{task.title}</h4>
      {task.description && (
        <p className="text-gray-500 text-xs mt-1 line-clamp-2">
          {task.description}
        </p>
      )}
      {dueDate && (
        <div className="text-xs text-gray-400 mt-2">📅 {dueDate}</div>
      )}
    </div>
  )
}
