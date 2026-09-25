import { useState } from 'react'
import { useHockey } from '../context/HockeyContext'
import { Position, POSITIE_LABEL } from '../types'
import SubstituteModal from '../components/SubstituteModal'
import ResetModal from '../components/ResetModal'
import { tel } from '../statistiek'
import './Dashboard.css'

export default function Dashboard() {
  const { spelers, wissel, resetWisselingen, verplaats, plaatsIn, undo, canUndo, score, scoor, resetScore } = useHockey()
  const [showSubstituteModal, setShowSubstituteModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position>('LW')
  const [selectedPlayerName, setSelectedPlayerName] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)

  const fieldPlayers = spelers.filter(s => s.inVeld && !s.isKeeper)
  const keeper = spelers.find(s => s.isKeeper)
  const substitutes = spelers.filter(s => !s.inVeld && s.meedoen)

  const getPlayerByPosition = (pos: Position) =>
    pos === 'K' ? keeper : fieldPlayers.find(p => p.positie === pos)

  const handlePlayerClick = (position: Position) => {
    setSelectedPosition(position)
    setSelectedPlayerName(getPlayerByPosition(position)?.naam ?? '')
    setShowSubstituteModal(true)
  }

  const handleSubstitute = (inPlayerId: string) => {
    const outPlayer = getPlayerByPosition(selectedPosition)
    if (outPlayer) {
      wissel(outPlayer.id, inPlayerId, selectedPosition)
      tel('wissel')
    } else {
      plaatsIn(inPlayerId, selectedPosition)
      tel('lege-plek-gevuld')
    }
    setShowSubstituteModal(false)
  }

  const handleMove = (otherPlayerId: string) => {
    const player = getPlayerByPosition(selectedPosition)
    if (player) {
      verplaats(player.id, otherPlayerId)
      tel(selectedPosition === 'K' ? 'keeper-verplaatst' : 'verplaats')
      setShowSubstituteModal(false)
    }
  }

  const handleResetSubstitutions = () => {
    setShowResetModal(true)
  }

  const handleConfirmReset = () => {
    resetWisselingen()
    tel('reset')
    setShowResetModal(false)
  }

  const slot = (pos: Position) => {
    const player = getPlayerByPosition(pos)
    return (
      <button
        key={pos}
        className={`player-slot ${pos === 'K' ? 'keeper' : ''} ${player ? '' : 'leeg'}`}
        onClick={() => handlePlayerClick(pos)}
        aria-label={player ? undefined : `Lege plek ${POSITIE_LABEL[pos]}: iemand erin zetten`}
      >
        {player ? (
          <>
            <div className="name">{player.naam}</div>
            <div className="count">{player.wisselCount}×</div>
          </>
        ) : (
          <div className="name">+</div>
        )}
      </button>
    )
  }

  return (
    <>
    <div className="dashboard">
      <div className="score-regel">
        <button className="score-min" onClick={() => { scoor('wij', -1); tel('score-wij-min') }} disabled={score.wij === 0} aria-label="Doelpunt wij eraf">−</button>
        <button className="score-team wij" onClick={() => { scoor('wij', 1); tel('score-wij') }} aria-label={`Wij ${score.wij}, doelpunt erbij`}>
          <span className="score-naam">Wij</span>
          <span className="score-getal">{score.wij}</span>
        </button>
        <button className="score-team zij" onClick={() => { scoor('zij', 1); tel('score-zij') }} aria-label={`Zij ${score.zij}, doelpunt erbij`}>
          <span className="score-getal">{score.zij}</span>
          <span className="score-naam">Zij</span>
        </button>
        <button className="score-min" onClick={() => { scoor('zij', -1); tel('score-zij-min') }} disabled={score.zij === 0} aria-label="Doelpunt zij eraf">−</button>
      </div>

      <div className="field-container">
        <div className="field">
          <div className="field-row">{(['LW', 'RW'] as Position[]).map(slot)}</div>
          <div className="field-row">{(['LM', 'CM', 'RM'] as Position[]).map(slot)}</div>
          <div className="field-row">{(['LBM', 'CBM', 'RBM'] as Position[]).map(slot)}</div>
          <div className="field-row single">{slot('K')}</div>
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

    </div>

    {/* Bewust onder de vouw: alleen bereikbaar door te scrollen, zodat je er niet per ongeluk op tikt */}
    <div className="dashboard-knoppen">
      <button className="btn btn-secondary" onClick={() => { undo(); tel('undo') }} disabled={!canUndo}>Undo</button>
      <button className="btn btn-secondary" onClick={handleResetSubstitutions}>Reset wissels</button>
      <button className="btn btn-secondary" onClick={() => { resetScore(); tel('score-reset') }} disabled={score.wij === 0 && score.zij === 0}>Score 0 – 0</button>

      {showSubstituteModal && (
        <SubstituteModal
          playerName={selectedPlayerName}
          position={selectedPosition}
          substitutes={substitutes}
          fieldPlayers={fieldPlayers.filter(p => p.positie !== selectedPosition)}
          onSubstitute={handleSubstitute}
          onMove={handleMove}
          onClose={() => setShowSubstituteModal(false)}
          leegPlek={!getPlayerByPosition(selectedPosition)}
          alleenVerplaatsen={selectedPosition === 'K'}
        />
      )}

      {showResetModal && (
        <ResetModal
          onConfirm={handleConfirmReset}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </div>
    </>
  )
}
