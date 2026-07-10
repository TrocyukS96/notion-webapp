import { useCallback, useEffect, useState } from 'react'
import type React from 'react'
import { authApi } from '../api/client'
import { useTelegram } from '../hooks/useTelegram'

interface AuthPageProps {
  onAuthorized?: () => void
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthorized }) => {
  const { isReady, tg, telegramUserId } = useTelegram()
  const [checking, setChecking] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAuthStatus = useCallback(async () => {
    if (!telegramUserId) {
      setError('Откройте приложение через Telegram, чтобы проверить статус.')
      return
    }

    try {
      setChecking(true)
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
  }, [telegramUserId, onAuthorized])

  useEffect(() => {
    if (isReady && telegramUserId) {
      checkAuthStatus()
    }
  }, [isReady, telegramUserId, checkAuthStatus])

  const handleConnect = () => {
    if (!telegramUserId) {
      setError('Откройте приложение через Telegram, чтобы подключить Notion.')
      return
    }

    setConnecting(true)
    setError(null)

    const loginUrl = authApi.getNotionLoginUrl(telegramUserId)

    if (tg) {
      tg.openLink(loginUrl)
    } else {
      window.open(loginUrl, '_blank', 'noopener,noreferrer')
    }

    setConnecting(false)
  }

  if (!isReady) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center p-6">
        <p className="text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
          Загрузка…
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-[var(--tg-theme-text-color,#1f2937)]">
          {telegramUserId ? 'Подключите Notion' : 'TG Notion'}
        </h1>
        <p className="max-w-sm text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
          {telegramUserId
            ? 'Разрешите доступ к workspace, чтобы загружать задачи на канбан-доску.'
            : 'Откройте приложение через Telegram, чтобы подключить Notion.'}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting || checking}
          className="rounded-xl px-6 py-3 text-sm font-medium transition-opacity disabled:opacity-60"
          style={{
            backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
            color: 'var(--tg-theme-button-text-color, #ffffff)',
          }}
        >
          {connecting ? 'Открываем…' : 'Подключить Notion'}
        </button>

        {telegramUserId && (
          <button
            type="button"
            onClick={checkAuthStatus}
            disabled={checking || connecting}
            className="text-sm text-[var(--tg-theme-link-color,#3390ec)] transition-opacity disabled:opacity-60"
          >
            {checking ? 'Проверка…' : 'Я уже авторизовался'}
          </button>
        )}
      </div>

      {error && (
        <p className="max-w-sm text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {telegramUserId && (
        <p className="max-w-sm text-xs text-[var(--tg-theme-hint-color,#6b7280)]">
          После авторизации в Notion вернитесь в Telegram и нажмите «Я уже
          авторизовался».
        </p>
      )}
    </div>
  )
}
