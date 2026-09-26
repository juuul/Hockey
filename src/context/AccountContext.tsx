import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Gebruiker, pb, Team } from '../server'

interface AccountContextType {
  gebruiker: Gebruiker | null
  teams: Team[]
  teamsLaden: () => Promise<void>
  inloggen: (email: string, wachtwoord: string) => Promise<void>
  uitloggen: () => void
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [gebruiker, setGebruiker] = useState<Gebruiker | null>(() => (pb.authStore.isValid ? (pb.authStore.record as Gebruiker) : null))
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => pb.authStore.onChange((_, record) => setGebruiker(pb.authStore.isValid ? (record as Gebruiker) : null)), [])

  const teamsLaden = useCallback(async () => {
    if (!pb.authStore.isValid) return setTeams([])
    setTeams(await pb.collection('teams').getFullList<Team>({ sort: 'naam', expand: 'beheerders,bewerkers,kijkers' }))
  }, [])

  // Bij het opstarten de inlog verversen (en uitloggen als het account niet meer bestaat)
  useEffect(() => {
    if (!pb.authStore.isValid) return
    pb.collection('users').authRefresh()
      .then(() => teamsLaden())
      .catch(err => { if (err?.status === 401 || err?.status === 404) pb.authStore.clear() })
  }, [teamsLaden])

  useEffect(() => { if (!gebruiker) setTeams([]) }, [gebruiker])

  const inloggen = async (email: string, wachtwoord: string) => {
    await pb.collection('users').authWithPassword(email.trim().toLowerCase(), wachtwoord)
    await teamsLaden()
  }

  const uitloggen = () => pb.authStore.clear()

  return (
    <AccountContext.Provider value={{ gebruiker, teams, teamsLaden, inloggen, uitloggen }}>
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  const context = useContext(AccountContext)
  if (!context) throw new Error('useAccount must be used within AccountProvider')
  return context
}
