import { pb } from './server'

// Stuurt fouten van deze telefoon naar de server, zodat ze te vinden zijn zonder bij de telefoon te kunnen.
// Hooguit een paar per keer laden, en dezelfde fout maar één keer.

const gemeld = new Set<string>()
let aantal = 0

const versie = () =>
  `${import.meta.env.MODE} ${document.querySelector<HTMLScriptElement>('script[src*="assets/index-"]')?.src.split('/').pop() ?? 'dev'}`

export function meldFout(soort: string, bericht: string, stack = '') {
  const sleutel = `${soort}|${bericht}`
  if (gemeld.has(sleutel) || aantal >= 5) return
  gemeld.add(sleutel)
  aantal++
  try {
    fetch(pb.buildURL('/api/hockey/fout'), {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', ...(pb.authStore.isValid ? { Authorization: pb.authStore.token } : {}) },
      body: JSON.stringify({ soort, bericht, stack, adres: window.location.pathname, versie: versie() }),
    }).catch(() => {})
  } catch {
    // melden mag nooit zelf iets kapot maken
  }
}

export function startFoutmelder() {
  window.addEventListener('error', e => {
    // Laadfouten van bestanden (bv. een geblokkeerde teller) zijn geen app-fouten
    if (!(e instanceof ErrorEvent)) return
    meldFout('fout', e.message || String(e.error), e.error?.stack ?? `${e.filename}:${e.lineno}:${e.colno}`)
  })
  window.addEventListener('unhandledrejection', e => {
    const r = e.reason as { message?: string; stack?: string; status?: number } | undefined
    // Geen verbinding is geen fout in de app
    if (r?.status === 0) return
    meldFout('belofte', r?.message ?? String(r), r?.stack ?? '')
  })
  try {
    if (sessionStorage.getItem('hockey_herladen')) meldFout('herladen', 'Pagina opnieuw geladen: eigen bestand ontbrak (oude cache)')
  } catch {
    // geen opslag
  }
}
