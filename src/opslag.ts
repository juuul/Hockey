// Test en live delen dezelfde origin (juliaan.eu), dus aparte opslag
export const OPSLAG = import.meta.env.MODE === 'test' ? 'hockey_test' : 'hockey'

// Per team een eigen opslag; zonder team de gewone (alleen deze telefoon)
export const teamOpslag = (teamId: string | null) => (teamId ? `${OPSLAG}_t_${teamId}` : OPSLAG)

// Kapotte of geblokkeerde opslag: gewoon met de standaardwaarde beginnen
export function lees<T>(prefix: string, sleutel: string, standaard: T): T {
  try {
    const saved = localStorage.getItem(`${prefix}_${sleutel}`)
    return saved ? JSON.parse(saved) : standaard
  } catch {
    return standaard
  }
}

export function schrijf(prefix: string, sleutel: string, waarde: unknown) {
  try {
    localStorage.setItem(`${prefix}_${sleutel}`, JSON.stringify(waarde))
  } catch {
    // vol of geblokkeerd: niets aan te doen
  }
}
