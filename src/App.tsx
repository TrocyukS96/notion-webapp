import { useCallback, useEffect, useState } from 'react'
import { authApi } from './api/client'
import { AuthPage } from './components/AuthPage'
import { KanbanBoard } from './components/KanbanBoard'
import { LoadingScreen } from './components/LoadingScreen'
import { SelectDbPage } from './components/SelectDbPage'
import { useTelegram } from './hooks/useTelegram'

type AppStep = 'loading' | 'auth' | 'select-db' | 'board'

function App() {
  const { user, isReady } = useTelegram()
  const [step, setStep] = useState<AppStep>('loading')

  const handleDatabaseSelected = useCallback(() => {
    setStep('board')
  }, [])

  const resolveStep = useCallback(async () => {
    setStep('loading')

    if (!user?.id) {
      setStep('auth')
      return
    }

    try {
      const status = await authApi.getNotionStatus()

      if (!status.authorized) {
        setStep('auth')
      } else if (!status.selected_database_id) {
        setStep('select-db')
      } else {
        setStep('board')
      }
    } catch {
      setStep('auth')
    }
  }, [user?.id])

  useEffect(() => {
    if (isReady) {
      resolveStep()
    }
  }, [isReady, resolveStep])

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <LoadingScreen
            message={isReady ? 'Проверка статуса…' : 'Загрузка…'}
          />
        )
      case 'auth':
        return <AuthPage onAuthorized={resolveStep} />
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
