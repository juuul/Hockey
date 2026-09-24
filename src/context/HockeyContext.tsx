import React, { createContext, useContext, useState, useEffect } from 'react'
import { Player, Wissel } from '../types'
import { nieuweOpstelling } from '../opstelling'

interface HockeyContextType {
  spelers: Player[]
  wisselingen: Wissel[]
  vastePosities: Record<string, string[]>
  addSpeler: (naam: string) => void
  deleteSpeler: (id: string) => void
  toggleSpeler: (id: string) => void
  wissel: (uitId: string, inId: string, positie: string) => void
  resetWisselingen: () => void
  verplaats: (idA: string, idB: string) => void
  undo: () => void
  canUndo: boolean
  setVastePositie: (spelerId: string, keuze: number, positie: string | null) => void
}

// Test en live delen dezelfde origin (github.io), dus aparte opslag
const OPSLAG = import.meta.env.MODE === 'test' ? 'hockey_test' : 'hockey'

const HockeyContext = createContext<HockeyContextType | undefined>(undefined)

const INITIAL_PLAYERS: Player[] = [
  { id: '1', naam: 'Lizzy', positie: 'LW', inVeld: true, wisselCount: 0, isKeeper: false },
  { id: '2', naam: 'Fee', positie: 'RW', inVeld: true, wisselCount: 0, isKeeper: false },
  { id: '3', naam: 'Sarah', positie: 'LM', inVeld: true, wisselCount: 0, isKeeper: false },
  { id: '4', naam: 'Isa', positie: 'CM', inVeld: true, wisselCount: 0, isKeeper: false },
  { id: '5', naam: 'Evi', positie: 'RM', inVeld: true, wisselCount: 0, isKeeper: false },
  { id: '6', naam: 'Aster', positie: 'LBM', inVeld: true, wisselCount: 0, isKeeper: false },
  { id: '7', naam: 'Floor', positie: 'CBM', inVeld: true, wisselCount: 0, isKeeper: false },
  { id: '8', naam: 'Carice', positie: 'RBM', inVeld: true, wisselCount: 0, isKeeper: false },
  { id: '9', naam: 'Julia', positie: 'K', inVeld: true, wisselCount: 0, isKeeper: true },
  { id: '10', naam: 'Sara', positie: 'LW', inVeld: false, wisselCount: 0, isKeeper: false },
  { id: '11', naam: 'Benthe', positie: 'RW', inVeld: false, wisselCount: 0, isKeeper: false },
]

export function HockeyProvider({ children }: { children: React.ReactNode }) {
  const [spelers, setSpelers] = useState<Player[]>(() => {
    const saved = localStorage.getItem(`${OPSLAG}_spelers`)
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS
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

  const [history, setHistory] = useState<{ spelers: Player[]; wisselingen: Wissel[] }[]>([])

  const remember = () => {
    setHistory(h => [...h, { spelers, wisselingen }])
  }

  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    setSpelers(last.spelers)
    setWisselingen(last.wisselingen)
    setHistory(history.slice(0, -1))
  }

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_spelers`, JSON.stringify(spelers))
  }, [spelers])

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_wisselingen`, JSON.stringify(wisselingen))
  }, [wisselingen])

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
      wisselCount: 0,
      isKeeper: false,
    }
    setSpelers([...spelers, newSpeler])
  }

  const deleteSpeler = (id: string) => {
    remember()
    setSpelers(spelers.filter(s => s.id !== id))
  }

  const toggleSpeler = (id: string) => {
    remember()
    setSpelers(spelers.map(s =>
      s.id === id ? { ...s, inVeld: !s.inVeld } : s
    ))
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

  const resetWisselingen = () => {
    remember()
    setSpelers(nieuweOpstelling(spelers, vastePosities))
    setWisselingen([])
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
    <HockeyContext.Provider value={{ spelers, wisselingen, vastePosities, addSpeler, deleteSpeler, toggleSpeler, wissel, resetWisselingen, verplaats, undo, canUndo: history.length > 0, setVastePositie }}>
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
