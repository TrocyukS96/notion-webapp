import { useCallback, useEffect, useState } from 'react'
import type React from 'react'
import { authApi, databaseApi, type NotionDatabase } from '../api/client'
import { useTelegram } from '../hooks/useTelegram'

const SEARCH_DEBOUNCE_MS = 400

interface SelectDbPageProps {
  onDatabaseSelected?: () => void
}

export const SelectDbPage: React.FC<SelectDbPageProps> = ({
  onDatabaseSelected,
}) => {
  const { user, isReady } = useTelegram()
  const [checking, setChecking] = useState(true)
  const [query, setQuery] = useState('')
  const [databases, setDatabases] = useState<NotionDatabase[]>([])
  const [searching, setSearching] = useState(false)
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkSelectedDatabase = useCallback(async () => {
    if (!user?.id) {
      setChecking(false)
      return
    }

    try {
      const status = await authApi.getNotionStatus()

      if (status.authorized === true && status.selected_database_id) {
        onDatabaseSelected?.()
      }
    } catch {
      setError('Не удалось проверить выбранную базу')
    } finally {
      setChecking(false)
    }
  }, [user?.id, onDatabaseSelected])

  useEffect(() => {
    if (isReady) {
      checkSelectedDatabase()
    }
  }, [isReady, checkSelectedDatabase])

  useEffect(() => {
    if (!user?.id || checking) return

    const timeoutId = window.setTimeout(async () => {
      try {
        setSearching(true)
        setError(null)
        const results = await databaseApi.search(query.trim())
        setDatabases(results)
      } catch {
        setError('Не удалось найти базы данных')
        setDatabases([])
      } finally {
        setSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [query, user?.id, checking])

  const handleSelect = async (database: NotionDatabase) => {
    try {
      setSelectingId(database.id)
      setError(null)
      await databaseApi.select(database.id)
      onDatabaseSelected?.()
    } catch {
      setError('Не удалось выбрать базу данных')
    } finally {
      setSelectingId(null)
    }
  }

  if (!isReady || checking) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center p-6">
        <p className="text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
          Загрузка…
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold text-[var(--tg-theme-text-color,#1f2937)]">
          Выбор базы данных
        </h1>
        <p className="max-w-sm text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
          Откройте приложение через Telegram, чтобы выбрать базу Notion.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-[var(--tg-theme-text-color,#1f2937)]">
          Выберите базу данных
        </h1>
        <p className="text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
          Найдите базу с задачами в вашем Notion workspace.
        </p>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по названию…"
        className="tg-field"
      />

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {searching && databases.length === 0 && (
          <p className="py-4 text-center text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
            Поиск…
          </p>
        )}

        {!searching && databases.length === 0 && (
          <p className="py-4 text-center text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
            {query.trim() ? 'Ничего не найдено' : 'Базы данных не найдены'}
          </p>
        )}

        {databases.map((database) => {
          const isSelecting = selectingId === database.id

          return (
            <button
              key={database.id}
              type="button"
              onClick={() => handleSelect(database)}
              disabled={selectingId !== null}
              className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-opacity disabled:opacity-60"
              style={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #ffffff)',
                borderColor: 'var(--tg-theme-section-separator-color, #e5e7eb)',
                color: 'var(--tg-theme-text-color, #1f2937)',
              }}
            >
              <span className="font-medium">{database.title}</span>
              <span className="text-xs text-[var(--tg-theme-hint-color,#6b7280)]">
                {isSelecting ? 'Выбор…' : 'Выбрать'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
