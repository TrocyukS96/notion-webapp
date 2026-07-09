import { KanbanBoard } from './components/KanbanBoard'
import { useTelegram } from './hooks/useTelegram'

function App() {
  const { user } = useTelegram()

  return (
    <div className="app">
      {user && (
        <div className="app__user">
          {user.first_name} {user.last_name ?? ''}
        </div>
      )}
      <KanbanBoard />
    </div>
  )
}

export default App
