import { useState } from 'react'
import './Modal.css'

interface Props {
  onAdd: (naam: string) => void
  onClose: () => void
}

export default function AddPlayerModal({ onAdd, onClose }: Props) {
  const [naam, setNaam] = useState('')

  const handleAdd = () => {
    if (!naam.trim()) {
      alert('Vul voornaam in')
      return
    }
    onAdd(naam)
    setNaam('')
  }

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-title">Speler Toevoegen</div>
        <input
          type="text"
          placeholder="Voornaam"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="modal-input"
          autoFocus
        />

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Annuleren</button>
          <button className="btn btn-primary" onClick={handleAdd}>Toevoegen</button>
        </div>
      </div>
    </div>
  )
}
