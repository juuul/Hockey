import React, { createContext, useContext, useState, useEffect } from 'react'
import { Player, Position, Spelvorm, veldPosities, Wissel } from '../types'
import { nieuweOpstelling as lootOpstelling, resetTellers, stempelInkomers, haalUitVeld, zetMeedoen as zetMeedoenIn, plaatsIn as plaatsInOpstelling } from '../opstelling'

export interface Score {
  wij: number
  zij: number
}

interface HockeyContextType {
  spelers: Player[]
  wisselingen: Wissel[]
  vastePosities: Record<string, string[]>
  addSpeler: (naam: string) => void
  deleteSpeler: (id: string) => void
  zetMeedoen: (id: string, meedoen: boolean) => void
  plaatsIn: (id: string, positie: Position) => void
  wissel: (uitId: string, inId: string, positie: string) => void
  resetWissels: () => void
  nieuweOpstelling: () => void
  verplaats: (idA: string, idB: string) => void
  undo: () => void
  canUndo: boolean
  score: Score
  scoor: (team: keyof Score, verschil: 1 | -1, scorerId?: string | null) => void
  doelpunten: (string | null)[]
  spelvorm: Spelvorm
  kiesSpelvorm: (spelvorm: Spelvorm) => void
  resetScore: () => void
  setVastePositie: (spelerId: string, keuze: number, positie: string | null) => void
}

// Test en live delen dezelfde origin (github.io), dus aparte opslag
export const OPSLAG = import.meta.env.MODE === 'test' ? 'hockey_test' : 'hockey'

const HockeyContext = createContext<HockeyContextType | undefined>(undefined)

const INITIAL_PLAYERS: Player[] = [
  { id: '1', naam: 'Lizzy', positie: 'LW', inVeld: true, meedoen: true, wisselCount: 0, isKeeper: false },
  { id: '2', naam: 'Fee', positie: 'RW', inVeld: true, meedoen: true, wisselCount: 0, isKeeper: false },
  { id: '3', naam: 'Sarah', positie: 'LM', inVeld: true, meedoen: true, wisselCount: 0, isKeeper: false },
  { id: '4', naam: 'Isa', positie: 'CM', inVeld: true, meedoen: true, wisselCount: 0, isKeeper: false },
  { id: '5', naam: 'Evi', positie: 'RM', inVeld: true, meedoen: true, wisselCount: 0, isKeeper: false },
  { id: '6', naam: 'Aster', positie: 'LBM', inVeld: true, meedoen: true, wisselCount: 0, isKeeper: false },
  { id: '7', naam: 'Floor', positie: 'CBM', inVeld: true, meedoen: true, wisselCount: 0, isKeeper: false },
  { id: '8', naam: 'Carice', positie: 'RBM', inVeld: true, meedoen: true, wisselCount: 0, isKeeper: false },
  { id: '9', naam: 'Julia', positie: 'K', inVeld: true, meedoen: true, wisselCount: 0, isKeeper: true },
  { id: '10', naam: 'Sara', positie: 'LW', inVeld: false, meedoen: true, wisselCount: 0, isKeeper: false },
  { id: '11', naam: 'Benthe', positie: 'RW', inVeld: false, meedoen: true, wisselCount: 0, isKeeper: false },
]

export function HockeyProvider({ children }: { children: React.ReactNode }) {
  const [spelers, zetSpelersRuw] = useState<Player[]>(() => {
    const saved = localStorage.getItem(`${OPSLAG}_spelers`)
    // Oudere versies kenden 'meedoen' nog niet
    return saved ? JSON.parse(saved).map((sp: Player) => ({ ...sp, meedoen: sp.meedoen ?? true })) : INITIAL_PLAYERS
  })

  const [wisselingen, setWisselingen] = useState<Wissel[]>(() => {
    const saved = localStorage.getItem(`${OPSLAG}_wisselingen`)
    return saved ? JSON.parse(saved) : []
  })

  const [vastePosities, setVastePositiesState] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem(`${OPSLAG}_vaste_posities`)
    const parsed: Record<string, string | string[]> = saved ? JSON.parse(saved) : {}
    // Oudere versie bewaarde één positie per speler als string
    return Object.fromEntries(Object.entries(parsed).map(([id, v]) => [id, typeof v === 'string' ? [v, ''] : v]))
  })

  const [score, setScore] = useState<Score>(() => {
    const saved = localStorage.getItem(`${OPSLAG}_score`)
    return saved ? JSON.parse(saved) : { wij: 0, zij: 0 }
  })

  const setSpelers = (nieuw: Player[]) => zetSpelersRuw(stempelInkomers(spelers, nieuw))

  // Scorers van onze doelpunten, in volgorde; null = onbekend
  const [doelpunten, setDoelpunten] = useState<(string | null)[]>(() => {
    const saved = localStorage.getItem(`${OPSLAG}_doelpunten`)
    return saved ? JSON.parse(saved) : []
  })

  const [spelvorm, setSpelvorm] = useState<Spelvorm>(() => {
    const saved = localStorage.getItem(`${OPSLAG}_spelvorm`)
    return saved ? JSON.parse(saved) : 9
  })
  const posities = veldPosities(spelvorm)

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_spelvorm`, JSON.stringify(spelvorm))
  }, [spelvorm])

  const [history, setHistory] = useState<{ spelers: Player[]; wisselingen: Wissel[]; score: Score; doelpunten: (string | null)[] }[]>([])

  const remember = () => {
    setHistory(h => [...h, { spelers, wisselingen, score, doelpunten }])
  }

  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    zetSpelersRuw(last.spelers)
    setWisselingen(last.wisselingen)
    setScore(last.score)
    setDoelpunten(last.doelpunten)
    setHistory(history.slice(0, -1))
  }

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_spelers`, JSON.stringify(spelers))
  }, [spelers])

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_wisselingen`, JSON.stringify(wisselingen))
  }, [wisselingen])

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_score`, JSON.stringify(score))
  }, [score])

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_doelpunten`, JSON.stringify(doelpunten))
  }, [doelpunten])

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_vaste_posities`, JSON.stringify(vastePosities))
  }, [vastePosities])

  const addSpeler = (naam: string) => {
    remember()
    const newId = Math.max(...spelers.map(s => parseInt(s.id)), 0) + 1
    const newSpeler: Player = {
      id: newId.toString(),
      naam,
      positie: 'LW',
      inVeld: false,
      meedoen: true,
      wisselCount: 0,
      isKeeper: false,
    }
    setSpelers([...spelers, newSpeler])
  }

  const deleteSpeler = (id: string) => {
    remember()
    setSpelers(haalUitVeld(spelers, id).filter(s => s.id !== id))
  }

  const zetMeedoen = (id: string, meedoen: boolean) => {
    remember()
    setSpelers(zetMeedoenIn(spelers, id, meedoen, posities))
  }

  const plaatsIn = (id: string, positie: Position) => {
    remember()
    setSpelers(plaatsInOpstelling(spelers, id, positie))
  }


  const wissel = (uitId: string, inId: string, positie: string) => {
    remember()
    setSpelers(spelers.map(s => {
      if (s.id === inId) {
        return { ...s, inVeld: true, positie: positie as Player['positie'] }
      }
      if (s.id === uitId) {
        return { ...s, inVeld: false, wisselCount: s.wisselCount + 1 }
      }
      return s
    }))

    const newWissel: Wissel = {
      id: Date.now().toString(),
      tijdstip: new Date(),
      inSpeler: inId,
      uitSpeler: uitId,
      positie: positie as any,
    }
    setWisselingen([...wisselingen, newWissel])
  }

  const verplaats = (idA: string, idB: string) => {
    const a = spelers.find(s => s.id === idA)
    const b = spelers.find(s => s.id === idB)
    if (!a || !b) return
    remember()
    setSpelers(spelers.map(s => {
      if (s.id === idA) return { ...s, positie: b.positie, isKeeper: b.isKeeper, inVeld: b.inVeld }
      if (s.id === idB) return { ...s, positie: a.positie, isKeeper: a.isKeeper, inVeld: a.inVeld }
      return s
    }))
  }

  const resetWissels = () => {
    remember()
    setSpelers(resetTellers(spelers))
    setWisselingen([])
  }

  const nieuweOpstelling = () => {
    remember()
    zetSpelersRuw(lootOpstelling(spelers, vastePosities, posities).map(s => ({ ...s, inVolgorde: 0 })))
  }

  // Andere spelvorm = andere posities, dus meteen opnieuw loten
  const kiesSpelvorm = (nieuw: Spelvorm) => {
    if (nieuw === spelvorm) return
    remember()
    setSpelvorm(nieuw)
    zetSpelersRuw(lootOpstelling(spelers, vastePosities, veldPosities(nieuw)).map(s => ({ ...s, inVolgorde: 0 })))
  }

  const resetScore = () => {
    remember()
    setScore({ wij: 0, zij: 0 })
    setDoelpunten([])
  }

  const scoor = (team: keyof Score, verschil: 1 | -1, scorerId: string | null = null) => {
    if (score[team] + verschil < 0) return
    remember()
    setScore({ ...score, [team]: score[team] + verschil })
    if (team === 'wij') setDoelpunten(verschil === 1 ? [...doelpunten, scorerId] : doelpunten.slice(0, -1))
  }




  const setVastePositie = (spelerId: string, keuze: number, positie: string | null) => {
    const keuzes = [...(vastePosities[spelerId] ?? ['', ''])]
    keuzes[keuze] = positie ?? ''
    const newVaste = { ...vastePosities }
    if (keuzes.every(k => !k)) delete newVaste[spelerId]
    else newVaste[spelerId] = keuzes
    setVastePositiesState(newVaste)
  }


  return (
    <HockeyContext.Provider value={{ spelers, wisselingen, vastePosities, addSpeler, deleteSpeler, zetMeedoen, plaatsIn, wissel, resetWissels, nieuweOpstelling, verplaats, undo, canUndo: history.length > 0, setVastePositie, score, scoor, resetScore, doelpunten, spelvorm, kiesSpelvorm }}>
      {children}
    </HockeyContext.Provider>
  )
}

export function useHockey() {
  const context = useContext(HockeyContext)
  if (!context) {
    throw new Error('useHockey must be used within HockeyProvider')
  }
  return context
}
