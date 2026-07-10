import { useEffect } from 'react'
import type React from 'react'
import { useTelegram } from '../hooks/useTelegram'
import {
  TELEGRAM_APP_LINK,
  type OAuthReturnState,
} from '../utils/oauthReturn'

interface OAuthReturnPageProps {
  state: OAuthReturnState
  onContinue: () => void
}

export const OAuthReturnPage: React.FC<OAuthReturnPageProps> = ({
  state,
  onContinue,
}) => {
  const { isInTelegram } = useTelegram()
  const isSuccess = state.status === 'success'

  useEffect(() => {
    if (isInTelegram && isSuccess) {
      onContinue()
    }
  }, [isInTelegram, isSuccess, onContinue])

  if (isInTelegram && isSuccess) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center p-6">
        <p className="text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
          Notion подключён. Загрузка…
        </p>
      </div>
    )
  }

  const handleOpenTelegram = () => {
    if (TELEGRAM_APP_LINK) {
      window.location.href = TELEGRAM_APP_LINK
      return
    }

    window.close()
  }

  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-[var(--tg-theme-text-color,#1f2937)]">
          {isSuccess ? 'Notion подключён' : 'Не удалось подключить Notion'}
        </h1>
        <p className="max-w-sm text-sm text-[var(--tg-theme-hint-color,#6b7280)]">
          {isSuccess
            ? 'Вернитесь в Telegram, чтобы выбрать базу данных и открыть канбан-доску.'
            : state.error ??
              'Попробуйте снова из Telegram Mini App.'}
        </p>
      </div>

      {isSuccess ? (
        <button
          type="button"
          onClick={handleOpenTelegram}
          className="rounded-xl px-6 py-3 text-sm font-medium"
          style={{
            backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
            color: 'var(--tg-theme-button-text-color, #ffffff)',
          }}
        >
          {TELEGRAM_APP_LINK ? 'Открыть в Telegram' : 'Закрыть вкладку'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpenTelegram}
          className="rounded-xl px-6 py-3 text-sm font-medium"
          style={{
            backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
            color: 'var(--tg-theme-button-text-color, #ffffff)',
          }}
        >
          {TELEGRAM_APP_LINK ? 'Вернуться в Telegram' : 'Закрыть вкладку'}
        </button>
      )}

      {!TELEGRAM_APP_LINK && (
        <p className="max-w-sm text-xs text-[var(--tg-theme-hint-color,#6b7280)]">
          Переключитесь обратно в Telegram вручную и откройте приложение через бота.
        </p>
      )}
    </div>
  )
}
