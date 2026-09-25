import { useRef, useState } from 'react'
import { HockeyProvider } from './context/HockeyContext'
import Dashboard from './screens/Dashboard'
import Players from './screens/Players'
import Positions from './screens/Positions'
import Verversen from './components/Verversen'
import './App.css'

function AppContent() {
  const [screen, setScreen] = useState<'dashboard' | 'players' | 'positions'>('dashboard')
  const scrollVak = useRef<HTMLDivElement>(null)

  return (
    <div className="mobile-frame">
      <nav className="tabs">
        <button
          className={`tab-btn ${screen === 'dashboard' ? 'active' : ''}`}
          onClick={() => setScreen('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`tab-btn ${screen === 'players' ? 'active' : ''}`}
          onClick={() => setScreen('players')}
        >
          Spelers
        </button>
        <button
          className={`tab-btn ${screen === 'positions' ? 'active' : ''}`}
          onClick={() => setScreen('positions')}
        >
          Voorkeur
        </button>
      </nav>

      <div className="content" ref={scrollVak}>
        {screen === 'dashboard' && <Dashboard />}
        {screen === 'players' && <Players />}
        {screen === 'positions' && <Positions />}
      </div>
      <Verversen scrollVak={scrollVak} />
    </div>
  )
}

export default function App() {
  return (
    <HockeyProvider>
      <AppContent />
    </HockeyProvider>
  )
}
