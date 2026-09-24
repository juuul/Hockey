declare global {
  interface Window {
    goatcounter?: { count: (opties: { path: string; title?: string; event?: boolean }) => void }
  }
}

export function startStatistiek() {
  if (!import.meta.env.PROD) return
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://gc.zgo.at/count.js'
  script.dataset.goatcounter = 'https://juuul.goatcounter.com/count'
  document.head.appendChild(script)
}

export function tel(knop: string) {
  const voorvoegsel = import.meta.env.MODE === 'test' ? 'test/' : ''
  window.goatcounter?.count({ path: `${voorvoegsel}hockey-${knop}`, title: `Hockey: ${knop}`, event: true })
}
