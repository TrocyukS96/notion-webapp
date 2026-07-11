import { useCallback, useEffect, useRef, useState } from 'react'
import { authApi } from './api/client'
import { AuthPage } from './components/AuthPage'
import { KanbanBoard } from './components/KanbanBoard'
import { LoadingScreen } from './components/LoadingScreen'
import { OAuthReturnPage } from './components/OAuthReturnPage'
import { SelectDbPage } from './components/SelectDbPage'
import { useTelegram } from './hooks/useTelegram'
import {
  authMessageFromStatus,
  isNotionAuthorized,
  stepFromStatus,
  verifyNotionConnection,
  type AppStep,
} from './utils/notionAccess'
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
  const [oauthReturn, setOauthReturn] = useState<OAuthReturnState | null>(() =>
    readOAuthReturnState(),
  )
  const resolveInFlight = useRef(false)
  const oauthHandled = useRef(false)

  const resolveStep = useCallback(
    async (options?: { fromOAuth?: boolean }) => {
      if (resolveInFlight.current) return
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

        const status = await authApi.getNotionStatus()

        if (isNotionAuthorized(status) && stepFromStatus(status) === 'board') {
          const connectionWorks = await verifyNotionConnection()
          if (!connectionWorks) {
            setAuthMessage('Не удалось подключиться к Notion. Подключите Notion снова.')
            setStep('auth')
            return
          }
        }

        setAuthMessage(authMessageFromStatus(status, options?.fromOAuth))
        setStep(stepFromStatus(status))
      } catch {
        setAuthMessage('Не удалось проверить подключение Notion. Попробуйте снова.')
        setStep('auth')
      } finally {
        resolveInFlight.current = false
      }
    },
    [telegramUserId],
  )

  const handleOAuthContinue = useCallback(() => {
    clearOAuthReturnParams()
    setOauthReturn(null)
    resolveStep({ fromOAuth: true })
  }, [resolveStep])

  const handleUnauthorized = useCallback((message?: string) => {
    setAuthMessage(
      message ?? 'Подключите Notion, чтобы открыть канбан-доску.',
    )
    setStep('auth')
  }, [])

  useEffect(() => {
    if (!oauthReturn || oauthHandled.current) return

    if (oauthReturn.status === 'success' && isInTelegram) {
      oauthHandled.current = true
      handleOAuthContinue()
    }
  }, [oauthReturn, isInTelegram, handleOAuthContinue])

  useEffect(() => {
    if (oauthReturn?.status === 'success' && isInTelegram) return
    if (oauthReturn && !isInTelegram) return

    if (isReady) {
      resolveStep()
    }
  }, [isReady, resolveStep, oauthReturn, isInTelegram])

  useEffect(() => {
    const handleReturn = () => {
      if (document.visibilityState === 'visible') {
        resolveStep()
      }
    }

    document.addEventListener('visibilitychange', handleReturn)
    tg?.onEvent('viewportChanged', handleReturn)

    return () => {
      document.removeEventListener('visibilitychange', handleReturn)
    }
  }, [tg, resolveStep])

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
            message={isReady ? 'Проверка статуса…' : 'Загрузка…'}
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
