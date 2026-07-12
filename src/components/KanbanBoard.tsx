import { useCallback, useEffect, useState } from 'react'
import type React from 'react'
import {
  DndContext,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  columnsApi,
  databaseApi,
  isNotionAuthError,
  tasksApi,
} from '../api/client'
import { TaskCard } from './TaskCard'
import { TaskModal } from './TaskModal'
import { AddColumnModal } from './AddColumnModal'
import type { Task } from './types'

interface TasksByStatus {
  [status: string]: Task[]
}

interface KanbanBoardProps {
  onUnauthorized?: (message?: string) => void
  onChangeDatabase?: () => void
}

interface KanbanColumnProps {
  column: string
  tasks: Task[]
  canDelete: boolean
  onDeleteColumn: (column: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  canDelete,
  onDeleteColumn,
  onEditTask,
  onDeleteTask,
}) => {
  const { setNodeRef } = useDroppable({ id: column })

  return (
    <div
      ref={setNodeRef}
      className="min-w-[280px] bg-gray-50 rounded-lg p-3"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-gray-700">
          {column} ({tasks.length})
        </h2>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDeleteColumn(column)}
            className="rounded p-1 text-xs text-gray-400 hover:bg-gray-200 hover:text-red-500"
            aria-label={`Удалить колонку ${column}`}
            title="Удалить колонку"
          >
            ✕
          </button>
        )}
      </div>
      <SortableContext
        id={column}
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-4">
              Нет задач
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
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
  const [editingTask, setEditingTask] = useState<Task | null>(null)

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

      const [taskList, columnList, selectedDatabase] = await Promise.all([
        tasksApi.getTasks(),
        columnsApi.list().catch(() => [] as string[]),
        databaseApi.getSelected().catch(() => null),
      ])

      setDatabaseTitle(selectedDatabase?.title ?? null)

      const grouped: TasksByStatus = {}
      const cols = [...columnList]

      taskList.forEach((task) => {
        const status = task.status || 'Без статуса'
        if (!grouped[status]) {
          grouped[status] = []
        }
        if (!cols.includes(status)) {
          cols.push(status)
        }
        grouped[status].push(task)
      })

      cols.forEach((column) => {
        if (!grouped[column]) {
          grouped[column] = []
        }
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
    let newStatus: string | undefined

    if (columns.includes(over.id as string)) {
      newStatus = over.id as string
    } else {
      for (const [status, taskList] of Object.entries(tasks)) {
        if (taskList.some((task) => task.id === over.id)) {
          newStatus = status
          break
        }
      }
    }

    if (!newStatus) return

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
      await tasksApi.updateTask(taskId, { status: newStatus })
    } catch (error) {
      console.error('Error updating task status:', error)
      await loadTasks()
    }
  }

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Удалить задачу «${task.title}»?`)) return

    try {
      await tasksApi.deleteTask(task.id)
      await loadTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Не удалось удалить задачу')
    }
  }

  const handleDeleteColumn = async (column: string) => {
    if (!window.confirm(`Удалить колонку «${column}»? Задачи будут перенесены в другую колонку.`)) {
      return
    }

    try {
      await columnsApi.delete(column)
      await loadTasks()
    } catch (error) {
      console.error('Error deleting column:', error)
      alert('Не удалось удалить колонку')
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
            <KanbanColumn
              key={column}
              column={column}
              tasks={tasks[column] ?? []}
              canDelete={columns.length > 1}
              onDeleteColumn={(columnName) => void handleDeleteColumn(columnName)}
              onEditTask={setEditingTask}
              onDeleteTask={(taskToDelete) => void handleDeleteTask(taskToDelete)}
            />
          ))}
        </div>
      </DndContext>

      {showAddTask && (
        <TaskModal
          columns={columns}
          onClose={() => setShowAddTask(false)}
          onSuccess={loadTasks}
        />
      )}

      {editingTask && (
        <TaskModal
          columns={columns}
          task={editingTask}
          onClose={() => setEditingTask(null)}
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
