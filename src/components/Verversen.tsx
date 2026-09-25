import { RefObject, useEffect, useState } from 'react'
import './Verversen.css'

const DREMPEL = 90

// Eigen "trek omlaag om te verversen": html/body scrollen niet (alleen .content), dus het browsergebaar werkt hier niet
export default function Verversen({ scrollVak }: { scrollVak: RefObject<HTMLElement> }) {
  const [afstand, setAfstand] = useState(0)

  useEffect(() => {
    const vak = scrollVak.current
    if (!vak) return
    let startY: number | null = null
    let huidig = 0

    const start = (e: TouchEvent) => {
      const inPopup = (e.target as Element).closest('.modal, .reset-modal-overlay')
      startY = vak.scrollTop <= 0 && !inPopup ? e.touches[0].clientY : null
    }
    const beweeg = (e: TouchEvent) => {
      if (startY === null) return
      huidig = Math.max(0, (e.touches[0].clientY - startY) * 0.5)
      setAfstand(huidig)
    }
    const eind = () => {
      if (startY !== null && huidig >= DREMPEL) window.location.reload()
      startY = null
      huidig = 0
      setAfstand(0)
    }

    vak.addEventListener('touchstart', start, { passive: true })
    vak.addEventListener('touchmove', beweeg, { passive: true })
    vak.addEventListener('touchend', eind)
    vak.addEventListener('touchcancel', eind)
    return () => {
      vak.removeEventListener('touchstart', start)
      vak.removeEventListener('touchmove', beweeg)
      vak.removeEventListener('touchend', eind)
      vak.removeEventListener('touchcancel', eind)
    }
  }, [scrollVak])

  if (afstand < 10) return null
  const klaar = afstand >= DREMPEL
  return (
    <div className={`verversen ${klaar ? 'klaar' : ''}`} style={{ transform: `translate(-50%, ${Math.min(afstand, DREMPEL + 30) - 20}px)` }}>
      {klaar ? '↻ Loslaten om te verversen' : '↓ Trek verder om te verversen'}
    </div>
  )
}
