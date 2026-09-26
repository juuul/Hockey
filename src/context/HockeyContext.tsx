import React, { createContext, useContext, useState, useEffect } from 'react'
import { Player, Position, Wissel } from '../types'
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
  scoor: (team: keyof Score, verschil: 1 | -1) => void
  resetScore: () => void
  speeltijd: number
  timerLoopt: boolean
  startTimer: () => void
  pauzeTimer: () => void
  stopTimer: () => void
  setVastePositie: (spelerId: string, keuze: number, positie: string | null) => void
}

// Test en live delen dezelfde origin (github.io), dus aparte opslag
const OPSLAG = import.meta.env.MODE === 'test' ? 'hockey_test' : 'hockey'

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

  // Starttijdstip + opgebouwde tijd i.p.v. een teller: zo klopt de tijd ook na verversen of een vergrendeld scherm
  const [timer, setTimer] = useState<{ gestartOp: number | null; opgebouwd: number }>(() => {
    const saved = localStorage.getItem(`${OPSLAG}_timer`)
    return saved ? JSON.parse(saved) : { gestartOp: null, opgebouwd: 0 }
  })
  const [nu, setNu] = useState(Date.now())
  const timerLoopt = timer.gestartOp !== null
  const speeltijd = timer.opgebouwd + (timer.gestartOp !== null ? nu - timer.gestartOp : 0)

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_timer`, JSON.stringify(timer))
  }, [timer])

  useEffect(() => {
    if (!timerLoopt) return
    setNu(Date.now())
    const id = setInterval(() => setNu(Date.now()), 500)
    return () => clearInterval(id)
  }, [timerLoopt])

  const huidigeSpeeltijd = () => timer.opgebouwd + (timer.gestartOp !== null ? Date.now() - timer.gestartOp : 0)

  const setSpelers = (nieuw: Player[]) => zetSpelersRuw(stempelInkomers(spelers, nieuw, huidigeSpeeltijd()))

  const startTimer = () => setTimer({ ...timer, gestartOp: Date.now() })
  const pauzeTimer = () => setTimer({ gestartOp: null, opgebouwd: huidigeSpeeltijd() })
  const stopTimer = () => {
    setTimer({ gestartOp: null, opgebouwd: 0 })
    zetSpelersRuw(spelers.map(s => s.inVeld ? { ...s, inSinds: 0 } : s))
  }

  const [history, setHistory] = useState<{ spelers: Player[]; wisselingen: Wissel[]; score: Score }[]>([])

  const remember = () => {
    setHistory(h => [...h, { spelers, wisselingen, score }])
  }

  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    zetSpelersRuw(last.spelers)
    setWisselingen(last.wisselingen)
    setScore(last.score)
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
    setSpelers(zetMeedoenIn(spelers, id, meedoen))
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
    const tijd = huidigeSpeeltijd()
    zetSpelersRuw(lootOpstelling(spelers, vastePosities).map(s => s.inVeld ? { ...s, inSinds: tijd } : s))
  }

  const resetScore = () => {
    remember()
    setScore({ wij: 0, zij: 0 })
  }

  const scoor = (team: keyof Score, verschil: 1 | -1) => {
    if (score[team] + verschil < 0) return
    remember()
    setScore({ ...score, [team]: score[team] + verschil })
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
    <HockeyContext.Provider value={{ spelers, wisselingen, vastePosities, addSpeler, deleteSpeler, zetMeedoen, plaatsIn, wissel, resetWissels, nieuweOpstelling, verplaats, undo, canUndo: history.length > 0, setVastePositie, score, scoor, resetScore, speeltijd, timerLoopt, startTimer, pauzeTimer, stopTimer }}>
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
