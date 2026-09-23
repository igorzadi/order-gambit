import { useReducer } from 'react'
import { useMatch } from '../context/matchState'
import { roundLevels } from '../game/session/match'
import type { RoundId } from '../game/session/match'
import { createInsertionState, getCurrentCard, getExpectedPosition, isCompleted } from '../game/engine'
import type { CardItem } from '../game/types/CardItem'
import { insertionRoundReducer } from './insertionRound'
import type { InsertionRound } from './insertionRound'
import { createChallengePerformance } from '../game/scoring/challengePerformance'

export function useInsertionRound(cards: readonly CardItem[], trackOperations = false, trackPerformance = false, roundId?: string) {
  const matchContext = useMatch()
  const [localRound, localAttempt] = useReducer(
    insertionRoundReducer,
    cards,
    (initialCards): InsertionRound => ({
      state: createInsertionState(initialCards),
      feedback: null,
      ...(trackOperations ? { operations: { comparisons: 0, shifts: 0 } } : {}),
      ...(trackPerformance ? { performance: createChallengePerformance(initialCards) } : {}),
    }),
  )
  const persistentId = roundId && Object.hasOwn(roundLevels, roundId) ? roundId as RoundId : null
  const persistedRound = persistentId ? matchContext?.match?.progress.rounds[persistentId] : undefined
  const round = persistedRound ?? localRound
  const attemptInsertion: typeof localAttempt = (attempt) => {
    if (persistedRound && persistentId) matchContext?.dispatch({ type: 'insertion', roundId: persistentId, attempt })
    else localAttempt(attempt)
  }
  const currentCard = getCurrentCard(round.state)
  const canKeep = currentCard !== null
    && getExpectedPosition(round.state) === round.state.currentIndex

  return {
    ...round,
    currentCard,
    completed: isCompleted(round.state),
    canKeep,
    attemptInsertion,
    keepHere: () => {
      if (currentCard && canKeep) {
        attemptInsertion({ cardId: currentCard.id, targetPosition: round.state.currentIndex })
      }
    },
  }
}
