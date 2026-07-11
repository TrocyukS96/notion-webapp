import { useState } from 'react'
import type React from 'react'
import { authApi, isNotionAuthError } from '../api/client'
import { resolveTelegramUserId } from '../utils/telegramUser'

interface DeleteSessionButtonProps {
  onDeleted: () => void
}

export const DeleteSessionButton: React.FC<DeleteSessionButtonProps> = ({
  onDeleted,
}) => {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!resolveTelegramUserId()) {
      setError('Не удалось определить Telegram ID')
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await authApi.logoutNotion()
      onDeleted()
    } catch (err) {
      if (isNotionAuthError(err)) {
        onDeleted()
        return
      }

      setError('Не удалось удалить сессию')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--tg-theme-section-separator-color,#e5e7eb)] bg-[var(--tg-theme-bg-color,#ffffff)] p-3">
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={deleting}
        className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-opacity disabled:opacity-60"
        style={{
          backgroundColor: 'var(--tg-theme-secondary-bg-color, #f3f4f6)',
        }}
      >
        {deleting ? 'Удаление…' : 'Удалить сессию'}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
