import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthPage } from './components/AuthPage'
import { KanbanBoard } from './components/KanbanBoard'
import { LoadingScreen } from './components/LoadingScreen'
import { OAuthReturnPage } from './components/OAuthReturnPage'
import { SelectDbPage } from './components/SelectDbPage'
import { useTelegram } from './hooks/useTelegram'
import {
  authMessageFromStatus,
  fetchNotionStatus,
  stepFromStatus,
  type AppStep,
} from './utils/notionAccess'
import { isOAuthPending } from './utils/oauthPending'
import {
  clearOAuthReturnParams,
  readOAuthReturnState,
  type OAuthReturnState,
} from './utils/oauthReturn'
import { resolveTelegramUserId } from './utils/telegramUser'

function App() {
  const { user, isReady, tg, telegramUserId, isInTelegram } = useTelegram()
  const [step, setStep] = useState<AppStep>('loading')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [oauthReturn, setOauthReturn] = useState<OAuthReturnState | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)
  const resolveInFlight = useRef(false)
  const pendingFromOAuth = useRef(false)

  const resolveStep = useCallback(
    async (options?: { fromOAuth?: boolean }) => {
      if (resolveInFlight.current) {
        if (options?.fromOAuth) {
          pendingFromOAuth.current = true
        }
        return
      }

      resolveInFlight.current = true
      setStep('loading')

      try {
        let currentTelegramUserId = telegramUserId ?? resolveTelegramUserId()

        if (!currentTelegramUserId) {
          await new Promise((resolve) => window.setTimeout(resolve, 400))
          currentTelegramUserId = telegramUserId ?? resolveTelegramUserId()
        }

        if (!currentTelegramUserId) {
          setAuthMessage('Откройте приложение через Telegram, чтобы подключить Notion.')
          setStep('auth')
          return
        }

        const shouldRetryOAuth = Boolean(options?.fromOAuth)
        const status = await fetchNotionStatus(
          shouldRetryOAuth ? { fromOAuth: true } : undefined,
        )

        setAuthMessage(authMessageFromStatus(status, shouldRetryOAuth))
        setStep(stepFromStatus(status))
      } catch {
        setAuthMessage('Не удалось проверить подключение Notion. Попробуйте снова.')
        setStep('auth')
      } finally {
        resolveInFlight.current = false

        if (pendingFromOAuth.current) {
          pendingFromOAuth.current = false
          void resolveStep({ fromOAuth: true })
        }
      }
    },
    [telegramUserId],
  )

  const completeOAuthReturn = useCallback(async () => {
    clearOAuthReturnParams()
    setOauthReturn(null)
    await resolveStep({ fromOAuth: true })
  }, [resolveStep])

  const handleOAuthContinue = useCallback(() => {
    void completeOAuthReturn()
  }, [completeOAuthReturn])

  const handleUnauthorized = useCallback((message?: string) => {
    setAuthMessage(
      message ?? 'Подключите Notion, чтобы открыть канбан-доску.',
    )
    setStep('auth')
  }, [])

  useEffect(() => {
    if (!isReady || bootstrapped) return

    let cancelled = false

    const bootstrap = async () => {
      const detectedOAuth = readOAuthReturnState()

      if (cancelled) return

      if (detectedOAuth) {
        setOauthReturn(detectedOAuth)

        if (detectedOAuth.status === 'success' && isInTelegram) {
          await completeOAuthReturn()
          if (!cancelled) setBootstrapped(true)
          return
        }

        if (!isInTelegram) {
          setBootstrapped(true)
          return
        }
      }

      if (isOAuthPending()) {
        await resolveStep({ fromOAuth: true })
      } else {
        await resolveStep()
      }

      if (!cancelled) setBootstrapped(true)
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [isReady, isInTelegram, bootstrapped, completeOAuthReturn, resolveStep])

  useEffect(() => {
    if (!bootstrapped) return

    const handleReturn = () => {
      if (document.visibilityState !== 'visible') return

      const state = readOAuthReturnState()
      if (state?.status === 'success') {
        setOauthReturn(state)
        void completeOAuthReturn()
        return
      }

      if (isOAuthPending()) {
        void resolveStep({ fromOAuth: true })
      }
    }

    document.addEventListener('visibilitychange', handleReturn)
    tg?.onEvent('viewportChanged', handleReturn)

    return () => {
      document.removeEventListener('visibilitychange', handleReturn)
    }
  }, [tg, bootstrapped, completeOAuthReturn, resolveStep])

  if (oauthReturn && !(oauthReturn.status === 'success' && isInTelegram)) {
    return (
      <div className="app">
        <OAuthReturnPage state={oauthReturn} onContinue={handleOAuthContinue} />
      </div>
    )
  }

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <LoadingScreen
            message={
              isReady
                ? isOAuthPending()
                  ? 'Завершение авторизации Notion…'
                  : 'Проверка статуса…'
                : 'Загрузка…'
            }
          />
        )
      case 'auth':
        return <AuthPage message={authMessage} />
      case 'select-db':
        return (
          <SelectDbPage
            onDatabaseSelected={() => resolveStep()}
            onUnauthorized={handleUnauthorized}
          />
        )
      case 'board':
        return <KanbanBoard onUnauthorized={handleUnauthorized} />
    }
  }

  return (
    <div className="app">
      {user && (
        <div className="app__user">
          {user.first_name} {user.last_name ?? ''}
        </div>
      )}
      {renderContent()}
    </div>
  )
}

export default App
