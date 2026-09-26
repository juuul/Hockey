import { useEffect, useState } from 'react'
import { OPSLAG } from '../context/HockeyContext'
import ResetModal from './ResetModal'
import { tel } from '../statistiek'
import './Timer.css'

// Starttijdstip + opgebouwde tijd i.p.v. een teller: zo klopt de tijd ook na verversen of een vergrendeld scherm
interface TimerStand {
  gestartOp: number | null
  opgebouwd: number
}

const SLEUTEL = `${OPSLAG}_timer`

function laad(): TimerStand {
  try {
    const saved = localStorage.getItem(SLEUTEL)
    if (saved) return JSON.parse(saved)
  } catch {
    // kapotte of geblokkeerde opslag: begin gewoon op 0
  }
  return { gestartOp: null, opgebouwd: 0 }
}

function formatteer(ms: number) {
  const totaal = Math.floor(ms / 1000)
  const min = Math.floor(totaal / 60)
  const sec = totaal % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export default function Timer() {
  const [stand, setStand] = useState<TimerStand>(laad)
  const [nu, setNu] = useState(Date.now())
  const [stopVraag, setStopVraag] = useState(false)
  const loopt = stand.gestartOp !== null

  useEffect(() => {
    localStorage.setItem(SLEUTEL, JSON.stringify(stand))
  }, [stand])

  useEffect(() => {
    if (!loopt) return
    setNu(Date.now())
    const id = setInterval(() => setNu(Date.now()), 250)
    return () => clearInterval(id)
  }, [loopt])

  const verstreken = stand.opgebouwd + (loopt ? nu - stand.gestartOp! : 0)

  const start = () => {
    setStand({ ...stand, gestartOp: Date.now() })
    tel('timer-start')
  }
  const pauze = () => {
    setStand({ gestartOp: null, opgebouwd: verstreken })
    tel('timer-pauze')
  }
  const stop = () => {
    setStand({ gestartOp: null, opgebouwd: 0 })
    setStopVraag(false)
    tel('timer-stop')
  }

  return (
    <div className={`timer ${loopt ? 'loopt' : ''}`}>
      <div className="timer-tijd" aria-live="off">{formatteer(verstreken)}</div>
      <div className="timer-knoppen">
        <button className="btn timer-start" onClick={start} disabled={loopt}>Start</button>
        <button className="btn btn-secondary" onClick={pauze} disabled={!loopt}>Pauze</button>
        <button className="btn btn-secondary" onClick={() => setStopVraag(true)} disabled={!loopt && verstreken === 0}>Stop</button>
      </div>

      {stopVraag && (
        <ResetModal
          titel="Timer stoppen?"
          regels={[{ icoon: '⏱', tekst: `De tijd (${formatteer(verstreken)}) gaat terug naar 0:00` }]}
          bevestig="Ja, stop timer"
          onConfirm={stop}
          onCancel={() => setStopVraag(false)}
        />
      )}
    </div>
  )
}
