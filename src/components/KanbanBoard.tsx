import { useCallback, useEffect, useState } from 'react'
import type React from 'react'
import {
  DndContext,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { api, databaseApi, isNotionAuthError } from '../api/client'
import { TaskCard } from './TaskCard'
import { AddTaskModal } from './AddTaskModal'
import { AddColumnModal } from './AddColumnModal'
import type { Task } from './types'

interface TasksByStatus {
  [status: string]: Task[]
}

interface KanbanBoardProps {
  onUnauthorized?: (message?: string) => void
  onChangeDatabase?: () => void
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  onUnauthorized,
  onChangeDatabase,
}) => {
  const [tasks, setTasks] = useState<TasksByStatus>({})
  const [columns, setColumns] = useState<string[]>([])
  const [databaseTitle, setDatabaseTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddColumn, setShowAddColumn] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(null)

      const [taskList, selectedDatabase] = await Promise.all([
        api.get<Task[]>('/tasks'),
        databaseApi.getSelected().catch(() => null),
      ])

      setDatabaseTitle(selectedDatabase?.title ?? null)

      const grouped: TasksByStatus = {}
      const cols: string[] = []

      taskList.forEach((task) => {
        const status = task.status || 'Без статуса'
        if (!grouped[status]) {
          grouped[status] = []
          cols.push(status)
        }
        grouped[status].push(task)
      })

      setTasks(grouped)
      setColumns(cols)
    } catch (error) {
      if (isNotionAuthError(error)) {
        onUnauthorized?.('Сессия Notion истекла. Подключите Notion снова.')
        return
      }

      setLoadError('Не удалось загрузить задачи. Проверьте подключение Notion.')
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [onUnauthorized])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const newStatus = over.id as string

    let taskToUpdate: Task | null = null
    let oldStatus = ''

    for (const [status, taskList] of Object.entries(tasks)) {
      const found = taskList.find((t) => t.id === taskId)
      if (found) {
        taskToUpdate = found
        oldStatus = status
        break
      }
    }

    if (!taskToUpdate || oldStatus === newStatus) return

    const updatedTask = { ...taskToUpdate, status: newStatus }

    setTasks((prev) => {
      const newTasks = { ...prev }
      newTasks[oldStatus] = newTasks[oldStatus].filter((t) => t.id !== taskId)
      if (!newTasks[newStatus]) {
        newTasks[newStatus] = []
      }
      newTasks[newStatus].push(updatedTask)
      return newTasks
    })

    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus })
    } catch (error) {
      console.error('Error updating task status:', error)
      await loadTasks()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Загрузка задач...</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-sm text-sm text-red-500" role="alert">
          {loadError}
        </p>
        <button
          type="button"
          onClick={() => void loadTasks()}
          className="rounded-xl px-6 py-3 text-sm font-medium"
          style={{
            backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
            color: 'var(--tg-theme-button-text-color, #ffffff)',
          }}
        >
          Повторить
        </button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-bold text-[var(--tg-theme-text-color,#1f2937)]">
              📊 Канбан-доска
            </h1>
            {databaseTitle && (
              <p className="truncate text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
                База: {databaseTitle}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {onChangeDatabase && (
              <button
                type="button"
                onClick={onChangeDatabase}
                className="rounded-lg px-4 py-2 text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--tg-theme-secondary-bg-color, #f3f4f6)',
                  color: 'var(--tg-theme-text-color, #1f2937)',
                }}
              >
                ← Сменить базу
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAddTask(true)}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
            >
              ➕ Добавить задачу
            </button>
            <button
              type="button"
              onClick={() => setShowAddColumn(true)}
              className="rounded-lg bg-green-500 px-4 py-2 text-sm text-white transition-colors hover:bg-green-600"
            >
              📂 Добавить колонку
            </button>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div
              key={column}
              className="min-w-[280px] bg-gray-50 rounded-lg p-3"
            >
              <h2 className="font-semibold text-gray-700 mb-3">
                {column} ({tasks[column]?.length || 0})
              </h2>
              <SortableContext
                items={tasks[column]?.map((t) => t.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {tasks[column]?.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {(!tasks[column] || tasks[column].length === 0) && (
                    <div className="text-sm text-gray-400 text-center py-4">
                      Нет задач
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>

      {showAddTask && (
        <AddTaskModal
          columns={columns}
          onClose={() => setShowAddTask(false)}
          onSuccess={loadTasks}
        />
      )}

      {showAddColumn && (
        <AddColumnModal
          onClose={() => setShowAddColumn(false)}
          onSuccess={loadTasks}
        />
      )}
    </div>
  )
}
