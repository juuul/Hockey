import { useState } from 'react'
import { useHockey } from '../context/HockeyContext'
import ResetModal from './ResetModal'
import { tel } from '../statistiek'
import './Timer.css'

function formatteer(ms: number) {
  const totaal = Math.floor(ms / 1000)
  const min = Math.floor(totaal / 60)
  const sec = totaal % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export default function Timer() {
  const { speeltijd: verstreken, timerLoopt: loopt, startTimer, pauzeTimer, stopTimer } = useHockey()
  const [stopVraag, setStopVraag] = useState(false)

  const start = () => {
    startTimer()
    tel('timer-start')
  }
  const pauze = () => {
    pauzeTimer()
    tel('timer-pauze')
  }
  const stop = () => {
    stopTimer()
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
