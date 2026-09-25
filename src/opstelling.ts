import { Player, Position, VELD_VOLGORDE } from './types'

function schud<T>(lijst: T[]): T[] {
  const kopie = [...lijst]
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[kopie[i], kopie[j]] = [kopie[j], kopie[i]]
  }
  return kopie
}

// Eerst eerlijk loten wie begint, pas daarna plaatsen: anders zitten spelers met een vaste positie nooit op de bank.
// Eerst krijgt iedereen zo mogelijk zijn 1e keuze, daarna zijn 2e. Door de geschudde volgorde wint bij een dubbele keuze een willekeurige speler.
export function nieuweOpstelling(spelers: Player[], vastePosities: Record<string, string[]>): Player[] {
  const geschud = schud(spelers.filter(s => !s.isKeeper && s.meedoen))
  const basis = geschud.slice(0, VELD_VOLGORDE.length)
  const bank = geschud.slice(VELD_VOLGORDE.length)

  const placed = new Map<string, Player>()
  const vrij = [...VELD_VOLGORDE]
  for (const keuze of [0, 1]) {
    basis.filter(s => !placed.has(s.id)).forEach(s => {
      const wens = vastePosities[s.id]?.[keuze] as Position | undefined
      if (wens && vrij.includes(wens)) {
        vrij.splice(vrij.indexOf(wens), 1)
        placed.set(s.id, { ...s, inVeld: true, positie: wens, wisselCount: 0 })
      }
    })
  }
  const vrijGeschud = schud(vrij)
  basis.filter(s => !placed.has(s.id)).forEach((s, i) => {
    placed.set(s.id, { ...s, inVeld: true, positie: vrijGeschud[i], wisselCount: 0 })
  })
  bank.forEach(s => placed.set(s.id, { ...s, inVeld: false, wisselCount: 1 }))

  return spelers.map(s => placed.get(s.id) ?? (s.meedoen ? { ...s, wisselCount: 0 } : { ...s, inVeld: false, wisselCount: 0 }))
}

// Een vrijgekomen veldplek wordt gevuld door de meedoende wisselspeler met de minste wissels; het doel blijft leeg (keeper kies je bewust)
export function haalUitVeld(spelers: Player[], id: string): Player[] {
  const speler = spelers.find(s => s.id === id)
  if (!speler?.inVeld) return spelers
  const zonder = spelers.map(s => s.id === id ? { ...s, inVeld: false, isKeeper: false } : s)
  if (speler.isKeeper) return zonder
  const invaller = zonder
    .filter(s => !s.inVeld && s.meedoen && s.id !== id)
    .sort((a, b) => a.wisselCount - b.wisselCount)[0]
  return invaller
    ? zonder.map(s => s.id === invaller.id ? { ...s, inVeld: true, positie: speler.positie } : s)
    : zonder
}

export function zetMeedoen(spelers: Player[], id: string, meedoen: boolean): Player[] {
  if (!meedoen) return haalUitVeld(spelers, id).map(s => s.id === id ? { ...s, meedoen: false } : s)
  const bezet = new Set(spelers.filter(s => s.inVeld && !s.isKeeper).map(s => s.positie))
  const leeg = VELD_VOLGORDE.find(p => !bezet.has(p))
  return spelers.map(s => s.id === id ? { ...s, meedoen: true, inVeld: !!leeg, positie: leeg ?? s.positie } : s)
}

export function plaatsIn(spelers: Player[], id: string, positie: Position): Player[] {
  const basis = positie === 'K' ? haalUitVeld(spelers, id) : spelers
  return basis.map(s => s.id === id ? { ...s, inVeld: true, positie, isKeeper: positie === 'K' } : s)
}
