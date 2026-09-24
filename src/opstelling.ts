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
// Door de geschudde volgorde wint bij een dubbele vaste positie een willekeurige speler.
export function nieuweOpstelling(spelers: Player[], vastePosities: Record<string, string>): Player[] {
  const geschud = schud(spelers.filter(s => !s.isKeeper))
  const basis = geschud.slice(0, VELD_VOLGORDE.length)
  const bank = geschud.slice(VELD_VOLGORDE.length)

  const placed = new Map<string, Player>()
  const vrij = [...VELD_VOLGORDE]
  basis.forEach(s => {
    const vast = vastePosities[s.id] as Position | undefined
    if (vast && vrij.includes(vast)) {
      vrij.splice(vrij.indexOf(vast), 1)
      placed.set(s.id, { ...s, inVeld: true, positie: vast, wisselCount: 0 })
    }
  })
  const vrijGeschud = schud(vrij)
  basis.filter(s => !placed.has(s.id)).forEach((s, i) => {
    placed.set(s.id, { ...s, inVeld: true, positie: vrijGeschud[i], wisselCount: 0 })
  })
  bank.forEach(s => placed.set(s.id, { ...s, inVeld: false, wisselCount: 1 }))

  return spelers.map(s => placed.get(s.id) ?? { ...s, wisselCount: 0 })
}
