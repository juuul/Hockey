import { useState } from 'react'
import { useHockey } from '../context/HockeyContext'
import { WedstrijdInfo } from '../types'
import { vandaag, vindClub, zoekClubs } from '../historie'
import './Modal.css'
import './WedstrijdModal.css'

interface Props {
  titel: string
  start: WedstrijdInfo
  bevestig: string
  clubVerplicht?: boolean
  uitleg?: string
  onOpslaan: (info: WedstrijdInfo, tegenstander: string) => void
  onClose: () => void
}

// Een nieuwe club wordt pas bij Opslaan echt toegevoegd, zodat je geen losse clubs overhoudt na Annuleren
export default function WedstrijdModal({ titel, start, bevestig, clubVerplicht, uitleg, onOpslaan, onClose }: Props) {
  const { clubs, clubToevoegen } = useHockey()
  const [datum, setDatum] = useState(start.datum ?? vandaag())
  const [thuis, setThuis] = useState(start.thuis)
  const [clubId, setClubId] = useState<string | null>(start.clubId)
  const [nieuweClub, setNieuweClub] = useState<string | null>(null)
  const [zoek, setZoek] = useState('')

  const gekozenNaam = nieuweClub ?? clubs.find(c => c.id === clubId)?.naam ?? null
  const gevonden = zoekClubs(clubs, zoek)
  const kanNieuw = zoek.trim() !== '' && !vindClub(clubs, zoek)

  const kiesBestaand = (id: string) => {
    setClubId(id)
    setNieuweClub(null)
    setZoek('')
  }
  const kiesNieuw = () => {
    setNieuweClub(zoek.trim())
    setClubId(null)
    setZoek('')
  }

  const opslaan = () => {
    const id = nieuweClub ? clubToevoegen(nieuweClub) : clubId
    // Datum van vandaag niet vastzetten: een wedstrijd die je morgen afsluit krijgt dan ook de juiste datum
    const vasteDatum = !start.datum && datum === vandaag() ? null : datum
    onOpslaan({ datum: vasteDatum, clubId: id, thuis }, gekozenNaam ?? '')
  }

  return (
    <div className="modal show" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{titel}</div>
        <div className="wedstrijd-velden">
          {uitleg && <p className="wedstrijd-uitleg">{uitleg}</p>}

          <label className="wedstrijd-label">
            Datum
            <input type="date" className="modal-input wedstrijd-datum" value={datum} onChange={e => e.target.value && setDatum(e.target.value)} />
          </label>

          <div className="keuze-knoppen" role="radiogroup" aria-label="Thuis of uit">
            {[true, false].map(t => (
              <button key={String(t)} role="radio" aria-checked={thuis === t} className={`keuze-knop ${thuis === t ? 'actief' : ''}`} onClick={() => setThuis(t)}>
                {t ? 'Thuis' : 'Uit'}
              </button>
            ))}
          </div>

          <div className="wedstrijd-label">Tegenstander</div>
          {gekozenNaam && (
            <div className="gekozen-club">
              <span className="gekozen-club-naam">{gekozenNaam}</span>
              <button className="gekozen-club-weg" onClick={() => { setClubId(null); setNieuweClub(null) }} aria-label="Andere tegenstander">✕</button>
            </div>
          )}
          <input
            type="text"
            className="modal-input"
            placeholder={clubs.length ? 'Zoek of typ een nieuwe club' : 'Naam van de club'}
            value={zoek}
            onChange={e => setZoek(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && kanNieuw && kiesNieuw()}
          />
          <div className="club-lijst">
            {kanNieuw && (
              <button className="modal-option nieuw" onClick={kiesNieuw}>
                <span className="modal-option-name">+ {zoek.trim()}</span>
                <span className="modal-option-place">nieuw</span>
              </button>
            )}
            {gevonden.map(c => (
              <button key={c.id} className={`modal-option ${c.id === clubId && !nieuweClub ? 'selected' : ''}`} onClick={() => kiesBestaand(c.id)}>
                <span className="modal-option-name">{c.naam}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Annuleren</button>
          <button className="btn btn-primary" onClick={opslaan} disabled={clubVerplicht && !gekozenNaam}>{bevestig}</button>
        </div>
      </div>
    </div>
  )
}
