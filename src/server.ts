import PocketBase, { ClientResponseError, LocalAuthStore, RecordModel } from 'pocketbase'

// Test en live delen dezelfde origin: elk een eigen inlog-opslag
const OPSLAG = import.meta.env.MODE === 'test' ? 'hockey_test' : 'hockey'

export const pb = new PocketBase(import.meta.env.VITE_SERVER ?? 'https://serverbot.taild1b3c5.ts.net', new LocalAuthStore(`${OPSLAG}_auth`))
pb.autoCancellation(false)

export type Rol = 'beheerder' | 'bewerker' | 'kijker'
export const ROL_VELD: Record<Rol, 'beheerders' | 'bewerkers' | 'kijkers'> = { beheerder: 'beheerders', bewerker: 'bewerkers', kijker: 'kijkers' }
export const ROL_TEKST: Record<Rol, string> = { beheerder: 'Beheerder', bewerker: 'Bewerker', kijker: 'Kijker' }
export const ROL_UITLEG: Record<Rol, string> = {
  beheerder: 'mag alles in dit team',
  bewerker: 'mag score en wissels bijhouden',
  kijker: 'kijkt alleen mee',
}

export interface Gebruiker extends RecordModel { email: string; name: string; superadmin: boolean }
export interface Team extends RecordModel {
  naam: string
  beheerders: string[]
  bewerkers: string[]
  kijkers: string[]
  expand?: { beheerders?: Gebruiker[]; bewerkers?: Gebruiker[]; kijkers?: Gebruiker[] }
}
export interface Uitnodiging extends RecordModel { team: string; email: string; rol: Rol }

export const rolIn = (team: Team, userId: string): Rol | null =>
  team.beheerders.includes(userId) ? 'beheerder' : team.bewerkers.includes(userId) ? 'bewerker' : team.kijkers.includes(userId) ? 'kijker' : null

// Adres van deze app (test of live), voor de links in uitnodigingsmails
export const appAdres = () => window.location.origin + window.location.pathname.replace(/index\.html$/, '')

export function foutTekst(fout: unknown): string {
  if (fout instanceof ClientResponseError) {
    if (fout.status === 0) return 'Geen verbinding met de server. Probeer het later nog eens.'
    const velden = Object.values(fout.response?.data ?? {}) as { message?: string }[]
    return fout.response?.message && !velden.length ? fout.response.message : velden[0]?.message ?? fout.message
  }
  return String(fout)
}
