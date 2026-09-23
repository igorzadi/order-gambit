import { useRef, useState } from 'react'
import { MatchContext } from './matchState'
import type { ReactNode } from 'react'
import { createMatch, updateMatch } from '../game/session/match'
import type { Match } from '../game/session/match'
import { clearMatch, loadMatch, saveMatch } from '../services/matchStorage'

export function MatchProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(() => {
    if (typeof window === 'undefined') return { match: null, error: null }
    try { return loadMatch(window.localStorage) } catch {
      return { match: null, error: 'O armazenamento local está indisponível.' }
    }
  })
  const [match, setMatch] = useState<Match | null>(loaded.match)
  const [error, setError] = useState<string | null>(loaded.error)
  const current = useRef(match)
  function commit(next: Match) {
    current.current = next
    setMatch(next)
    try {
      setError(saveMatch(window.localStorage, next) ? null : 'Não foi possível salvar. O progresso será perdido ao recarregar.')
    } catch { setError('Não foi possível salvar. O progresso será perdido ao recarregar.') }
  }
  function fresh(name = '') {
    return createMatch(crypto.randomUUID(), new Date().toISOString(), name)
  }
  return (
    <MatchContext.Provider value={{ match, error,
      start: (name) => {
        const playerName = name.trim()
        if (!playerName || playerName.length > 60) return
        const draft = current.current
        commit(draft?.progress.currentPhase === 'home'
          ? createMatch(draft.saved.id, draft.saved.startedAt, playerName) : fresh(playerName))
      },
      restart: () => {
        try { clearMatch(window.localStorage) } catch { /* commit reports unavailable storage. */ }
        commit(fresh())
      },
      dispatch: (event) => {
        if (!current.current) return
        const next = updateMatch(current.current, event)
        if (next !== current.current) commit(next)
      },
    }}>
      {error && <p className="storage-notice" role="status">{error}</p>}
      {children}
    </MatchContext.Provider>
  )
}
