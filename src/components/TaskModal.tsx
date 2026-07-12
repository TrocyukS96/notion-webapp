import { useState, type FormEvent } from 'react'
import type React from 'react'
import { tasksApi } from '../api/client'
import type { CreateTaskData, Task } from './types'

interface TaskModalProps {
  columns: string[]
  task?: Task
  onClose: () => void
  onSuccess: () => void
}

export const TaskModal: React.FC<TaskModalProps> = ({
  columns,
  task,
  onClose,
  onSuccess,
}) => {
  const isEdit = Boolean(task)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState(task?.status ?? columns[0] ?? 'Без статуса')
  const [dueDate, setDueDate] = useState(task?.due_date?.slice(0, 10) ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const data: CreateTaskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      due_date: dueDate || undefined,
    }

    try {
      setLoading(true)
      setError(null)

      if (isEdit && task) {
        await tasksApi.updateTask(task.id, {
          ...data,
          due_date: dueDate || '',
        })
      } else {
        await tasksApi.createTask(data)
      }

      onSuccess()
      onClose()
    } catch (submitError) {
      console.error('Error saving task:', submitError)
      setError('Не удалось сохранить задачу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="tg-panel rounded-xl p-5 w-full max-w-md shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {isEdit ? 'Редактировать задачу' : 'Новая задача'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Название"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="tg-field"
            autoFocus
          />
          <textarea
            placeholder="Описание (необязательно)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="tg-field resize-y"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="tg-field"
          >
            {columns.map((column) => (
              <option key={column} value={column}>
                {column}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="tg-field"
          />
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
