import { useCallback, useEffect, useState } from 'react'
import type React from 'react'
import { authApi } from '../api/client'
import { useTelegram } from '../hooks/useTelegram'

interface AuthPageProps {
  onAuthorized?: () => void
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthorized }) => {
  const { user, isReady, tg } = useTelegram()
  const [checking, setChecking] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAuthStatus = useCallback(async () => {
    if (!user?.id) {
      setChecking(false)
      return
    }

    try {
      setError(null)
      const status = await authApi.getNotionStatus()

      if (status.authorized) {
        onAuthorized?.()
      }
    } catch {
      setError('Не удалось проверить статус подключения')
    } finally {
      setChecking(false)
    }
  }, [user?.id, onAuthorized])

  useEffect(() => {
    if (isReady) {
      checkAuthStatus()
    }
  }, [isReady, checkAuthStatus])

  const handleConnect = () => {
    if (!user?.id) return

    setConnecting(true)
    setError(null)

    const loginUrl = authApi.getNotionLoginUrl(user.id)

    if (tg) {
      tg.openLink(loginUrl)
    } else {
      window.open(loginUrl, '_blank', 'noopener,noreferrer')
    }

    setConnecting(false)
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
          TG Notion
        </h1>
        <p className="max-w-sm text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
          Откройте приложение через Telegram, чтобы подключить Notion.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-[var(--tg-theme-text-color,#1f2937)]">
          Подключите Notion
        </h1>
        <p className="max-w-sm text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
          Разрешите доступ к workspace, чтобы загружать задачи на канбан-доску.
        </p>
      </div>

      <button
        type="button"
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-xl px-6 py-3 text-sm font-medium transition-opacity disabled:opacity-60"
        style={{
          backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
          color: 'var(--tg-theme-button-text-color, #ffffff)',
        }}
      >
        {connecting ? 'Открываем…' : 'Подключить Notion'}
      </button>

      {error && (
        <p className="max-w-sm text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <p className="max-w-sm text-xs text-[var(--tg-theme-hint-color,#6b7280)]">
        После авторизации в Notion вернитесь в Telegram и обновите приложение.
      </p>
    </div>
  )
}
