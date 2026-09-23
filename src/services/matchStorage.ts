import { restoreMatch } from '../game/session/match'
import type { Match } from '../game/session/match'

export const MATCH_STORAGE_KEY = 'order-gambit.match.v1'
export type MatchStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function loadMatch(storage: MatchStorage): { match: Match | null; error: string | null } {
  try {
    const raw = storage.getItem(MATCH_STORAGE_KEY)
    if (!raw) return { match: null, error: null }
    const match = restoreMatch(JSON.parse(raw))
    return { match, error: match ? null : 'O progresso salvo é inválido. Inicie uma nova partida.' }
  } catch {
    return { match: null, error: 'Não foi possível recuperar o progresso. Você pode iniciar uma nova partida.' }
  }
}
export function saveMatch(storage: MatchStorage, match: Match): boolean {
  try { storage.setItem(MATCH_STORAGE_KEY, JSON.stringify(match.saved)); return true } catch { return false }
}
export function clearMatch(storage: MatchStorage): boolean {
  try { storage.removeItem(MATCH_STORAGE_KEY); return true } catch { return false }
}
