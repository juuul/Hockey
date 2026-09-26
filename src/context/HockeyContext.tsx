import React, { createContext, useContext, useState, useEffect } from 'react'
import { Club, GespeeldeWedstrijd, OpstellingNaam, OPSTELLINGEN_PER_SPELVORM, Player, Position, Spelvorm, spelvormVan, veldPosities, Wissel, WedstrijdInfo } from '../types'
import { nieuweOpstelling as lootOpstelling, resetTellers, stempelInkomers, haalUitVeld, zetMeedoen as zetMeedoenIn, plaatsIn as plaatsInOpstelling, pasOpstellingAan } from '../opstelling'
import { nieuwId, vandaag, vindClub } from '../historie'

// Starttijdstip + opgebouwde tijd i.p.v. een teller: zo klopt de tijd ook na verversen of een vergrendeld scherm
export interface TimerStand {
  gestartOp: number | null
  opgebouwd: number
}

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
  timer: TimerStand
  startTimer: () => void
  pauzeTimer: () => void
  stopTimer: () => void
  allesResetten: () => void
  opstelling: OpstellingNaam
  kiesOpstelling: (opstelling: OpstellingNaam) => void
  resetScore: () => void
  setVastePositie: (spelerId: string, keuze: number, positie: string | null) => void
  clubs: Club[]
  clubToevoegen: (naam: string) => string
  hernoemClub: (id: string, naam: string) => void
  verwijderClub: (id: string) => void
  wedstrijd: WedstrijdInfo
  zetWedstrijd: (info: WedstrijdInfo) => void
  wedstrijden: GespeeldeWedstrijd[]
  wedstrijdAfsluiten: (info: WedstrijdInfo, tegenstander: string) => void
  wijzigWedstrijd: (id: string, info: WedstrijdInfo, tegenstander: string) => void
  verwijderWedstrijd: (id: string) => void
}

// Test en live delen dezelfde origin (github.io), dus aparte opslag
const OPSLAG = import.meta.env.MODE === 'test' ? 'hockey_test' : 'hockey'

const LEGE_WEDSTRIJD: WedstrijdInfo = { datum: null, clubId: null, thuis: true }

// Kapotte of geblokkeerde opslag: gewoon met de standaardwaarde beginnen
function lees<T>(sleutel: string, standaard: T): T {
  try {
    const saved = localStorage.getItem(`${OPSLAG}_${sleutel}`)
    return saved ? JSON.parse(saved) : standaard
  } catch {
    return standaard
  }
}

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

  const [opstelling, setOpstelling] = useState<OpstellingNaam>(() => {
    const saved = localStorage.getItem(`${OPSLAG}_opstelling`)
    if (saved) return JSON.parse(saved)
    // Vorige versie bewaarde alleen de spelvorm (9 of 6)
    const oudeSpelvorm = localStorage.getItem(`${OPSLAG}_spelvorm`)
    return OPSTELLINGEN_PER_SPELVORM[oudeSpelvorm ? (JSON.parse(oudeSpelvorm) as Spelvorm) : 9][0]
  })
  const spelvorm = spelvormVan(opstelling)
  const posities = veldPosities(opstelling)

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_opstelling`, JSON.stringify(opstelling))
  }, [opstelling])

  const [timer, setTimer] = useState<TimerStand>(() => {
    try {
      const saved = localStorage.getItem(`${OPSLAG}_timer`)
      if (saved) return JSON.parse(saved)
    } catch {
      // kapotte of geblokkeerde opslag: begin gewoon op 0
    }
    return { gestartOp: null, opgebouwd: 0 }
  })

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_timer`, JSON.stringify(timer))
  }, [timer])

  const startTimer = () => setTimer({ ...timer, gestartOp: Date.now() })
  const pauzeTimer = () => setTimer({ gestartOp: null, opgebouwd: timer.opgebouwd + (timer.gestartOp !== null ? Date.now() - timer.gestartOp : 0) })
  const stopTimer = () => setTimer({ gestartOp: null, opgebouwd: 0 })

  const [clubs, setClubs] = useState<Club[]>(() => lees('clubs', []))
  const [wedstrijd, zetWedstrijd] = useState<WedstrijdInfo>(() => lees('wedstrijd', LEGE_WEDSTRIJD))
  const [wedstrijden, setWedstrijden] = useState<GespeeldeWedstrijd[]>(() => lees('wedstrijden', []))

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_clubs`, JSON.stringify(clubs))
  }, [clubs])

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_wedstrijd`, JSON.stringify(wedstrijd))
  }, [wedstrijd])

  useEffect(() => {
    localStorage.setItem(`${OPSLAG}_wedstrijden`, JSON.stringify(wedstrijden))
  }, [wedstrijden])

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

  const kiesOpstelling = (nieuw: OpstellingNaam) => {
    if (nieuw === opstelling) return
    remember()
    setOpstelling(nieuw)
    setSpelers(pasOpstellingAan(spelers, veldPosities(nieuw)))
  }

  // Nieuwe wedstrijd: opnieuw loten, tellers, score en timer terug. Spelers, aanwezigheid, voorkeuren en opstelling blijven
  const allesResetten = () => {
    remember()
    zetSpelersRuw(resetTellers(lootOpstelling(spelers, vastePosities, posities).map(s => ({ ...s, inVolgorde: 0 }))))
    setWisselingen([])
    setScore({ wij: 0, zij: 0 })
    setDoelpunten([])
    stopTimer()
  }

  // Bestaat de naam al (hoofdletters maken niet uit), dan die club
  const clubToevoegen = (naam: string) => {
    const bestaand = vindClub(clubs, naam)
    if (bestaand) return bestaand.id
    const club: Club = { id: nieuwId(), naam: naam.trim(), laatstGebruikt: Date.now() }
    setClubs(c => [...c, club])
    return club.id
  }

  const hernoemClub = (id: string, naam: string) =>
    setClubs(clubs.map(c => (c.id === id ? { ...c, naam: naam.trim() } : c)))

  // Oude wedstrijden houden de naam die bij het opslaan gold
  const verwijderClub = (id: string) => {
    setClubs(clubs.filter(c => c.id !== id))
    if (wedstrijd.clubId === id) zetWedstrijd({ ...wedstrijd, clubId: null })
  }

  // Bewaart de wedstrijd en begint een nieuwe (zoals Alles resetten). Niet terug te draaien met Undo.
  // De naam gaat mee omdat een net toegevoegde club nog niet in 'clubs' staat
  const wedstrijdAfsluiten = (info: WedstrijdInfo, tegenstander: string) => {
    if (!info.clubId) return
    const clubId = info.clubId
    const gespeeld: GespeeldeWedstrijd = {
      id: nieuwId(),
      datum: info.datum ?? vandaag(),
      clubId,
      tegenstander,
      thuis: info.thuis,
      wij: score.wij,
      zij: score.zij,
      doelpunten: doelpunten.map(id => ({ spelerId: id, naam: spelers.find(s => s.id === id)?.naam ?? 'Onbekend' })),
      spelers: spelers.filter(s => s.meedoen).map(s => ({ id: s.id, naam: s.naam, wissels: s.wisselCount })),
      opstelling,
      opgeslagenOp: Date.now(),
    }
    setWedstrijden(w => [...w, gespeeld])
    setClubs(c => c.map(club => (club.id === clubId ? { ...club, laatstGebruikt: Date.now() } : club)))
    zetWedstrijd({ ...LEGE_WEDSTRIJD, thuis: info.thuis })
    allesResetten()
    setHistory([])
  }

  const wijzigWedstrijd = (id: string, info: WedstrijdInfo, tegenstander: string) =>
    setWedstrijden(wedstrijden.map(w => (w.id === id && info.clubId
      ? { ...w, datum: info.datum ?? w.datum, clubId: info.clubId, tegenstander, thuis: info.thuis }
      : w)))

  const verwijderWedstrijd = (id: string) => setWedstrijden(wedstrijden.filter(w => w.id !== id))

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
    <HockeyContext.Provider value={{ spelers, wisselingen, vastePosities, addSpeler, deleteSpeler, zetMeedoen, plaatsIn, wissel, resetWissels, nieuweOpstelling, verplaats, undo, canUndo: history.length > 0, setVastePositie, score, scoor, resetScore, doelpunten, spelvorm, opstelling, kiesOpstelling, timer, startTimer, pauzeTimer, stopTimer, allesResetten, clubs, clubToevoegen, hernoemClub, verwijderClub, wedstrijd, zetWedstrijd, wedstrijden, wedstrijdAfsluiten, wijzigWedstrijd, verwijderWedstrijd }}>
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
