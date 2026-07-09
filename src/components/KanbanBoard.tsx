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
import { api } from '../api/client'
import { TaskCard } from './TaskCard'
import { AddTaskModal } from './AddTaskModal'
import { AddColumnModal } from './AddColumnModal'
import type { Task } from './types'

interface TasksByStatus {
  [status: string]: Task[]
}

export const KanbanBoard: React.FC = () => {
  const [tasks, setTasks] = useState<TasksByStatus>({})
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
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
      const taskList = await api.get<Task[]>('/tasks')

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
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
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

  return (
    <div className="p-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">📊 Канбан-доска</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddTask(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            ➕ Добавить задачу
          </button>
          <button
            type="button"
            onClick={() => setShowAddColumn(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
          >
            📂 Добавить колонку
          </button>
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
