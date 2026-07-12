import type React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from './types'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
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
      className="bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
          aria-label="Перетащить задачу"
        >
          ⠿
        </button>
        <div className="min-w-0 flex-1">
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
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-blue-500"
            aria-label="Редактировать"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="rounded p-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-red-500"
            aria-label="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}
