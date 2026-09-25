import './ResetModal.css'

interface ResetModalProps {
  onConfirm: () => void
  onCancel: () => void
}

export default function ResetModal({ onConfirm, onCancel }: ResetModalProps) {
  return (
    <div className="reset-modal-overlay">
      <div className="reset-modal">
        <h2>Wissels Resetten?</h2>

        <div className="reset-info">
          <div className="info-item">
            <span className="info-icon">↺</span>
            <span className="info-text">Alle wissels worden op 0 gezet</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🔀</span>
            <span className="info-text">Basis wordt geloot, vaste posities blijven staan</span>
          </div>
          <div className="info-item">
            <span className="info-icon">⚽</span>
            <span className="info-text">Score wordt 0 – 0</span>
          </div>
        </div>

        <div className="reset-buttons">
          <button className="btn btn-cancel" onClick={onCancel}>
            Annuleren
          </button>
          <button className="btn btn-confirm" onClick={onConfirm}>
            Ja, Reset Alles
          </button>
        </div>
      </div>
    </div>
  )
}
