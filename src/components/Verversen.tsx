import { RefObject, useEffect, useState } from 'react'
import './Verversen.css'

const DREMPEL = 90

// Eigen "trek omlaag om te verversen": html/body scrollen niet (alleen .content), dus het browsergebaar werkt hier niet
export default function Verversen({ scrollVak }: { scrollVak: RefObject<HTMLElement> }) {
  const [afstand, setAfstand] = useState(0)
  const [laden, setLaden] = useState(false)

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
      if (startY !== null && huidig >= DREMPEL) {
        setLaden(true)
        // Even laten zien dat er ververst wordt; de draaiende pijl loopt door tot de pagina opnieuw laadt
        setTimeout(() => window.location.reload(), 150)
      } else {
        setAfstand(0)
      }
      startY = null
      huidig = 0
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

  if (!laden && afstand < 4) return null
  const zichtbaar = laden ? DREMPEL : Math.min(afstand, DREMPEL + 20)
  const klaar = laden || afstand >= DREMPEL
  return (
    <div
      className={`verversen ${klaar ? 'klaar' : ''} ${laden ? 'laden' : ''}`}
      style={{ transform: `translate(-50%, ${zichtbaar * 0.8}px)`, opacity: Math.min(1, zichtbaar / (DREMPEL * 0.6)) }}
      role="status"
      aria-label={laden ? 'Verversen' : klaar ? 'Loslaten om te verversen' : 'Trek verder om te verversen'}
    >
      <svg
        className="verversen-pijl"
        style={laden ? undefined : { transform: `rotate(${zichtbaar * 3}deg)` }}
        viewBox="0 0 24 24"
        width="26"
        height="26"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 12a8 8 0 1 1-2.34-5.66" />
        <path d="M20 4v5h-5" />
      </svg>
    </div>
  )
}
