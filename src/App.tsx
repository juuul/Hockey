import { useEffect, useRef, useState } from 'react'
import { HockeyProvider } from './context/HockeyContext'
import { AccountProvider, useAccount } from './context/AccountContext'
import { useHockey } from './context/HockeyContext'
import ResetModal from './components/ResetModal'
import Account, { AccountStart } from './screens/Account'
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
  const [account, setAccount] = useState<{ start: AccountStart } | null>(null)

  // Links uit de mail: #uitnodiging=…, #wachtwoord=… of #aanmelding=…. Daarna het # weghalen, zodat verversen het niet opnieuw opent
  useEffect(() => {
    const m = window.location.hash.match(/^#(uitnodiging|wachtwoord|aanmelding)=(.+)$/)
    if (!m) return
    setAccount({ start: { soort: m[1] as 'uitnodiging' | 'wachtwoord' | 'aanmelding', token: decodeURIComponent(m[2]) } })
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [])

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
        {screen === 'dashboard' && <Dashboard openAccount={() => setAccount({ start: null })} />}
        {screen === 'players' && <Players openAccount={() => setAccount({ start: null })} />}
        {screen === 'positions' && <Positions />}
        {screen === 'historie' && <Historie />}
      </div>
      <Verversen scrollVak={scrollVak} />
      {account && <Account start={account.start} onClose={() => setAccount(null)} />}
      <OvernemenVraag />
    </div>
  )
}

// Eerste keer in een leeg team: meenemen wat op deze telefoon staat?
function OvernemenVraag() {
  const { overnemenVraag, overnemen } = useHockey()
  const { actiefTeam } = useAccount()
  if (!overnemenVraag) return null
  const { spelers, clubs, wedstrijden } = overnemenVraag
  return (
    <ResetModal
      titel={`Gegevens naar ${actiefTeam?.naam ?? 'het team'}?`}
      regels={[
        { icoon: '👥', tekst: `${spelers} spelers met voorkeuren` },
        { icoon: '🏟', tekst: `${clubs} clubs` },
        { icoon: '📊', tekst: `${wedstrijden} wedstrijden` },
        { icoon: '📱', tekst: 'Wat nu op deze telefoon staat, komt in het team' },
      ]}
      bevestig="Ja, meenemen"
      annuleer="Nee, leeg beginnen"
      onConfirm={() => overnemen(true)}
      onCancel={() => overnemen(false)}
    />
  )
}

// Per team een eigen set gegevens: bij een ander team begint de app-state opnieuw (key)
function MetTeam() {
  const { actiefTeamId, magBewerken } = useAccount()
  return (
    <HockeyProvider key={actiefTeamId ?? 'lokaal'} teamId={actiefTeamId} magBewerken={magBewerken}>
      <AppContent />
    </HockeyProvider>
  )
}

export default function App() {
  return (
    <AccountProvider>
      <MetTeam />
    </AccountProvider>
  )
}
