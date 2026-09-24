import { useState } from 'react'
import { useHockey } from '../context/HockeyContext'
import { Position } from '../types'
import SubstituteModal from '../components/SubstituteModal'
import ResetModal from '../components/ResetModal'
import Toast from '../components/Toast'
import './Dashboard.css'

export default function Dashboard() {
  const { spelers, wissel, resetWisselingen, verplaats, undo, canUndo } = useHockey()
  const [showSubstituteModal, setShowSubstituteModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position>('LW')
  const [selectedPlayerName, setSelectedPlayerName] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const fieldPlayers = spelers.filter(s => s.inVeld && !s.isKeeper)
  const keeper = spelers.find(s => s.isKeeper)
  const substitutes = spelers.filter(s => !s.inVeld)

  const getPlayerByPosition = (pos: Position) =>
    pos === 'K' ? keeper : fieldPlayers.find(p => p.positie === pos)

  const handlePlayerClick = (position: Position) => {
    const player = getPlayerByPosition(position)
    if (player) {
      setSelectedPosition(position)
      setSelectedPlayerName(player.naam)
      setShowSubstituteModal(true)
    }
  }

  const handleSubstitute = (inPlayerId: string) => {
    const outPlayer = getPlayerByPosition(selectedPosition)
    if (outPlayer) {
      wissel(outPlayer.id, inPlayerId, selectedPosition)
      setShowSubstituteModal(false)
    }
  }

  const handleMove = (otherPlayerId: string) => {
    const player = getPlayerByPosition(selectedPosition)
    if (player) {
      verplaats(player.id, otherPlayerId)
      setShowSubstituteModal(false)
    }
  }

  const handleResetSubstitutions = () => {
    setShowResetModal(true)
  }

  const handleConfirmReset = () => {
    resetWisselingen()
    setShowResetModal(false)
    setToastMessage('✓ Wissels gereset & spelers willekeurig neergeplaatst')
    setShowToast(true)
  }

  return (
    <div className="dashboard">
      <div className="field-container">
        <div className="field">
          {/* Aanval */}
          <div className="field-row">
            {['LW', 'RW'].map((pos) => {
              const player = getPlayerByPosition(pos as Position)
              return (
                <button
                  key={pos}
                  className="player-slot"
                  onClick={() => handlePlayerClick(pos as Position)}
                >
                  <div className="name">{player?.naam}</div>
                  <div className="count">{player?.wisselCount}×</div>
                </button>
              )
            })}
          </div>

          {/* Midden */}
          <div className="field-row">
            {['LM', 'CM', 'RM'].map((pos) => {
              const player = getPlayerByPosition(pos as Position)
              return (
                <button
                  key={pos}
                  className="player-slot"
                  onClick={() => handlePlayerClick(pos as Position)}
                >
                  <div className="name">{player?.naam}</div>
                  <div className="count">{player?.wisselCount}×</div>
                </button>
              )
            })}
          </div>

          {/* Verdediging */}
          <div className="field-row">
            {['LBM', 'CBM', 'RBM'].map((pos) => {
              const player = getPlayerByPosition(pos as Position)
              return (
                <button
                  key={pos}
                  className="player-slot"
                  onClick={() => handlePlayerClick(pos as Position)}
                >
                  <div className="name">{player?.naam}</div>
                  <div className="count">{player?.wisselCount}×</div>
                </button>
              )
            })}
          </div>

          {/* Keeper */}
          <div className="field-row single">
            <button className="player-slot keeper" onClick={() => handlePlayerClick('K')}>
              <div className="name">{keeper?.naam}</div>
              <div className="count" style={{ color: '#7c2d12' }}>{keeper?.wisselCount}×</div>
            </button>
          </div>
        </div>
      </div>

      {/* Wisselspelers */}
      <div className="substitutes-section">
        <div className="section-title">Wissels</div>
        <div className="substitutes-list">
          {substitutes.map(sub => (
            <div key={sub.id} className="substitute-item">
              <span className="name">{sub.naam}</span>
              <span className="count">{sub.wisselCount}×</span>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="button-group">
        <button className="btn btn-secondary" onClick={undo} disabled={!canUndo}>Undo</button>
        <button className="btn btn-secondary" onClick={handleResetSubstitutions}>Reset wissels</button>
      </div>

      {showSubstituteModal && (
        <SubstituteModal
          playerName={selectedPlayerName}
          position={selectedPosition}
          substitutes={substitutes}
          fieldPlayers={fieldPlayers.filter(p => p.positie !== selectedPosition)}
          onSubstitute={handleSubstitute}
          onMove={handleMove}
          onClose={() => setShowSubstituteModal(false)}
          alleenVerplaatsen={selectedPosition === 'K'}
        />
      )}

      {showResetModal && (
        <ResetModal
          onConfirm={handleConfirmReset}
          onCancel={() => setShowResetModal(false)}
        />
      )}

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
