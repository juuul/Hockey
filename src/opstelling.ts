import { Player, Position, VELD_VOLGORDE, Wissel } from './types'

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
        placed.set(s.id, { ...s, inVeld: true, positie: wens })
      }
    })
  }
  const vrijGeschud = schud(vrij)
  basis.filter(s => !placed.has(s.id)).forEach((s, i) => {
    placed.set(s.id, { ...s, inVeld: true, positie: vrijGeschud[i] })
  })
  bank.forEach(s => placed.set(s.id, { ...s, inVeld: false }))

  return spelers.map(s => placed.get(s.id) ?? (s.meedoen ? s : { ...s, inVeld: false }))
}

// Wie op de bank zit, staat al één keer 'uit' en begint daarom op 1
export function resetTellers(spelers: Player[]): Player[] {
  return spelers.map(s => ({ ...s, wisselCount: s.meedoen && !s.inVeld ? 1 : 0 }))
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

// Minste wissels eerst; bij gelijke stand komt wie het laatst uit het veld ging onderaan
export function sorteerWissels(wissels: Player[], wisselingen: Wissel[]): Player[] {
  const laatstUit = (id: string) => wisselingen.map(w => w.uitSpeler).lastIndexOf(id)
  return [...wissels].sort((a, b) => a.wisselCount - b.wisselCount || laatstUit(a.id) - laatstUit(b.id))
}

// Wie net het veld in kwam, krijgt de huidige speeltijd als starttijd
export function stempelInkomers(oud: Player[], nieuw: Player[], speeltijd: number): Player[] {
  return nieuw.map(s => {
    const voorheen = oud.find(o => o.id === s.id)
    return s.inVeld && !voorheen?.inVeld ? { ...s, inSinds: speeltijd } : s
  })
}

export type VeldKleur = 'groen' | 'oranje' | 'rood'

// Relatief: langst erin = groen, net erin = rood. Liggen alle tijden binnen een minuut, dan geen kleur
export function veldKleuren(veldspelers: Player[], speeltijd: number): Record<string, VeldKleur> {
  const duur = veldspelers.map(s => ({ id: s.id, d: speeltijd - (s.inSinds ?? 0) }))
  if (duur.length === 0) return {}
  const min = Math.min(...duur.map(x => x.d))
  const max = Math.max(...duur.map(x => x.d))
  if (max - min < 60_000) return {}
  return Object.fromEntries(duur.map(({ id, d }) => {
    const t = (d - min) / (max - min)
    return [id, t >= 2 / 3 ? 'groen' : t <= 1 / 3 ? 'rood' : 'oranje']
  }))
}
