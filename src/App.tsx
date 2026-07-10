import { useCallback, useEffect, useRef, useState } from 'react'
import { authApi, type NotionAuthStatus } from './api/client'
import { AuthPage } from './components/AuthPage'
import { KanbanBoard } from './components/KanbanBoard'
import { LoadingScreen } from './components/LoadingScreen'
import { OAuthReturnPage } from './components/OAuthReturnPage'
import { SelectDbPage } from './components/SelectDbPage'
import { useTelegram } from './hooks/useTelegram'
import {
  clearOAuthReturnParams,
  readOAuthReturnState,
  type OAuthReturnState,
} from './utils/oauthReturn'
import { resolveTelegramUserId } from './utils/telegramUser'

type AppStep = 'loading' | 'auth' | 'select-db' | 'board'

function stepFromStatus(status: NotionAuthStatus): AppStep {
  if (status.authorized !== true) {
    return 'auth'
  }

  if (!status.selected_database_id) {
    return 'select-db'
  }

  return 'board'
}

function App() {
  const { user, isReady, tg, telegramUserId, isInTelegram } = useTelegram()
  const [step, setStep] = useState<AppStep>('loading')
  const [oauthReturn, setOauthReturn] = useState<OAuthReturnState | null>(() =>
    readOAuthReturnState(),
  )
  const resolveInFlight = useRef(false)
  const oauthHandled = useRef(false)

  const handleDatabaseSelected = useCallback(() => {
    setStep('board')
  }, [])

  const resolveStep = useCallback(async () => {
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
        setStep('auth')
        return
      }

      const status = await authApi.getNotionStatus()
      setStep(stepFromStatus(status))
    } catch {
      setStep('auth')
    } finally {
      resolveInFlight.current = false
    }
  }, [telegramUserId])

  const handleOAuthContinue = useCallback(() => {
    clearOAuthReturnParams()
    setOauthReturn(null)
    resolveStep()
  }, [resolveStep])

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
        return <AuthPage />
      case 'select-db':
        return <SelectDbPage onDatabaseSelected={handleDatabaseSelected} />
      case 'board':
        return <KanbanBoard />
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
