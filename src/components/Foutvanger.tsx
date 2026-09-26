import { Component, ReactNode } from 'react'
import { meldFout } from '../foutmelder'

// Crasht de app tijdens het tekenen, dan geen wit scherm maar een melding met 'Opnieuw laden'
export default class Foutvanger extends Component<{ children: ReactNode }, { fout: boolean }> {
  state = { fout: false }

  static getDerivedStateFromError() {
    return { fout: true }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    meldFout('crash', error.message, `${error.stack ?? ''}\n${info.componentStack ?? ''}`)
  }

  render() {
    if (!this.state.fout) return this.props.children
    return (
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontSize: 'var(--base-readable-size)', width: '100%' }}>
        <strong>Er ging iets mis.</strong>
        <span>De fout is doorgegeven. Je gegevens staan nog op de telefoon.</span>
        <button
          style={{ minHeight: 68, fontSize: 'var(--base-readable-size)', fontWeight: 700, borderRadius: 12, border: 'none', background: '#1e40af', color: 'white', fontFamily: 'inherit' }}
          onClick={() => window.location.reload()}
        >
          Opnieuw laden
        </button>
      </div>
    )
  }
}
