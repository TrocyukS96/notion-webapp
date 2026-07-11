import { useState } from 'react'
import type React from 'react'
import { authApi } from '../api/client'
import { useTelegram } from '../hooks/useTelegram'
import { resolveTelegramUserId } from '../utils/telegramUser'

interface AuthPageProps {
  message?: string | null
}

export const AuthPage: React.FC<AuthPageProps> = ({ message }) => {
  const { isReady, tg, isInTelegram } = useTelegram()
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = () => {
    const currentTelegramUserId = resolveTelegramUserId()

    if (!currentTelegramUserId) {
      setError(
        isInTelegram
          ? 'Не удалось определить пользователя Telegram. Перезапустите приложение.'
          : 'Откройте приложение через Telegram, чтобы подключить Notion.',
      )
      return
    }

    setConnecting(true)
    setError(null)

    const loginUrl = authApi.getNotionLoginUrl(currentTelegramUserId)

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
          Подключите Notion
        </h1>
        <p className="max-w-sm text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
          Разрешите доступ к workspace, чтобы загружать задачи на канбан-доску.
        </p>
        {message && (
          <p className="max-w-sm text-sm text-red-500" role="alert">
            {message}
          </p>
        )}
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
        {connecting ? 'Открываем…' : message ? 'Подключить Notion снова' : 'Подключить Notion'}
      </button>

      {error && (
        <p className="max-w-sm text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <p className="max-w-sm text-xs text-[var(--tg-theme-hint-color,#6b7280)]">
        Откроется браузер для авторизации Notion. После подтверждения вы будете
        перенаправлены обратно в Telegram.
      </p>
    </div>
  )
}
