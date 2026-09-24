import { useState } from 'react'
import { useHockey } from '../context/HockeyContext'
import { POSITIE_LABEL, Position } from '../types'
import Toast from '../components/Toast'
import './Positions.css'

const POSITIONS: Position[] = ['LW', 'RW', 'LM', 'CM', 'RM', 'LBM', 'CBM', 'RBM']

export default function Positions() {
  const { spelers, vastePosities, setVastePosities } = useHockey()
  const fieldPlayers = spelers.filter(s => !s.isKeeper)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleSetPosition = (spelerId: string, spelersNaam: string, positie: Position | null) => {
    setVastePosities(spelerId, positie)
    if (positie) {
      setToastMessage(`✓ ${spelersNaam} → ${POSITIE_LABEL[positie]}`)
    } else {
      setToastMessage(`✓ Vaste positie verwijderd voor ${spelersNaam}`)
    }
    setShowToast(true)
  }

  return (
    <div className="positions-screen">
      <h2>Vaste Posities Instellen</h2>
      <p className="help-text">Selecteer welke speler op welke positie hoort. Bij reset worden spelers random neerzet.</p>

      <div className="positions-list">
        {fieldPlayers.map(player => (
          <div key={player.id} className="position-item">
            <div className="player-name">{player.naam}</div>
            <div className="position-buttons">
              <select
                value={vastePosities[player.id] || ''}
                onChange={(e) => handleSetPosition(player.id, player.naam, e.target.value ? (e.target.value as Position) : null)}
                className="position-select"
              >
                <option value="">Geen vaste positie</option>
                {POSITIONS.map(pos => (
                  <option key={pos} value={pos}>
                    {POSITIE_LABEL[pos]} ({pos})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
