import { useState, type FormEvent } from 'react'
import type React from 'react'
import { columnsApi } from '../api/client'

interface AddColumnModalProps {
  onClose: () => void
  onSuccess: () => void
}

export const AddColumnModal: React.FC<AddColumnModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      setLoading(true)
      setError(null)
      await columnsApi.create(title.trim())
      onSuccess()
      onClose()
    } catch (submitError) {
      console.error('Error creating column:', submitError)
      setError('Не удалось добавить колонку')
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
        <h3 className="text-lg font-semibold mb-4">Новая колонка</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Название колонки (статус)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="tg-field"
            autoFocus
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
              className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
