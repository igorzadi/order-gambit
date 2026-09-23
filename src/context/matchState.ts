import { createContext, useContext } from 'react'
import type { Match, MatchEvent } from '../game/session/match'

export type MatchContextValue = {
  match: Match | null
  error: string | null
  start: (name: string) => void
  restart: () => void
  dispatch: (event: MatchEvent) => void
}
export const MatchContext = createContext<MatchContextValue | null>(null)
export function useMatch() { return useContext(MatchContext) }
