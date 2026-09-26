import { useRef, useState } from 'react'
import { HockeyProvider } from './context/HockeyContext'
import Dashboard from './screens/Dashboard'
import Players from './screens/Players'
import Positions from './screens/Positions'
import Historie from './screens/Historie'
import Verversen from './components/Verversen'
import './App.css'

type Scherm = 'dashboard' | 'players' | 'positions' | 'historie'

// Vier namen passen niet naast elkaar op een smalle telefoon: alleen het actieve tabblad toont zijn naam
const TABS: { id: Scherm; icoon: string; naam: string }[] = [
  { id: 'dashboard', icoon: '🏑', naam: 'Dashboard' },
  { id: 'players', icoon: '👥', naam: 'Spelers' },
  { id: 'positions', icoon: '⭐', naam: 'Voorkeur' },
  { id: 'historie', icoon: '📊', naam: 'Historie' },
]

function AppContent() {
  const [screen, setScreen] = useState<Scherm>('dashboard')
  const scrollVak = useRef<HTMLDivElement>(null)

  return (
    <div className="mobile-frame">
      <nav className="tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${screen === tab.id ? 'active' : ''}`}
            onClick={() => setScreen(tab.id)}
            aria-label={tab.naam}
            aria-current={screen === tab.id ? 'page' : undefined}
          >
            <span className="tab-icoon" aria-hidden="true">{tab.icoon}</span>
            {screen === tab.id && <span className="tab-naam">{tab.naam}</span>}
          </button>
        ))}
      </nav>

      <div className="content" ref={scrollVak}>
        {screen === 'dashboard' && <Dashboard />}
        {screen === 'players' && <Players />}
        {screen === 'positions' && <Positions />}
        {screen === 'historie' && <Historie />}
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
