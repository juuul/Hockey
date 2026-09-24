import { useState } from 'react'
import { useHockey } from '../context/HockeyContext'
import { Player } from '../types'
import AddPlayerModal from '../components/AddPlayerModal'
import DeletePlayerModal from '../components/DeletePlayerModal'
import './Players.css'

export default function Players() {
  const { spelers, addSpeler, deleteSpeler, toggleSpeler } = useHockey()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<{ id: string; naam: string } | null>(null)

  const fieldPlayers = spelers.filter(s => s.inVeld)
  const substitutes = spelers.filter(s => !s.inVeld)

  const handleDelete = (id: string, naam: string) => {
    setPlayerToDelete({ id, naam })
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (playerToDelete) {
      deleteSpeler(playerToDelete.id)
      setShowDeleteModal(false)
      setPlayerToDelete(null)
    }
  }

  const handleAddPlayer = (naam: string) => {
    addSpeler(naam)
    setShowAddModal(false)
  }

  const renderCard = (player: Player) => (
    <div key={player.id} className={`player-card ${player.inVeld ? 'player-card--field' : 'player-card--sub'}`}>
      <div className="player-name">{player.naam}</div>
      <span className="player-count">{player.wisselCount}×</span>
      <button
        className={`player-toggle ${player.inVeld ? 'on' : ''}`}
        onClick={() => toggleSpeler(player.id)}
        aria-label={player.inVeld ? 'Naar wissels' : 'Naar veld'}
      />
      <button
        className="delete-btn"
        onClick={() => handleDelete(player.id, player.naam)}
        aria-label={`${player.naam} verwijderen`}
      >
        ✕
      </button>
    </div>
  )

  return (
    <div className="players-screen">
      <div className="section-header">
        <div className="section-title">Opstelling</div>
        <button className="btn-icon" onClick={() => setShowAddModal(true)}>+ Speler</button>
      </div>

      <div className="players-list">
        {fieldPlayers.map(renderCard)}
      </div>

      {substitutes.length > 0 && (
        <>
          <div className="section-title">Wisselspelers</div>
          <div className="players-list">
            {substitutes.map(renderCard)}
          </div>
        </>
      )}

      <div className="stats-row">
        <div className="stat">
          <div className="stat-value">{fieldPlayers.filter(p => !p.isKeeper).length + (spelers.find(p => p.isKeeper && p.inVeld) ? 1 : 0)}</div>
          <div className="stat-label">Op Veld</div>
        </div>
        <div className="stat">
          <div className="stat-value">{substitutes.length}</div>
          <div className="stat-label">Wissel</div>
        </div>
      </div>

      {showAddModal && (
        <AddPlayerModal
          onAdd={handleAddPlayer}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showDeleteModal && playerToDelete && (
        <DeletePlayerModal
          playerName={playerToDelete.naam}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}
