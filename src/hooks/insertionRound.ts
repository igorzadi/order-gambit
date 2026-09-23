import { applyInsertion, getCurrentCard, validateInsertion } from '../game/engine'
import type { InsertionState } from '../game/engine'
import { countInsertionOperations } from '../game/engine/insertionOperations'
import type { OperationCounts } from '../game/engine/insertionOperations'
import type { ChallengePerformance } from '../game/types/ChallengePerformance'
import { recordInsertionPerformance } from '../game/scoring/challengePerformance'

export type InsertionRound = {
  state: InsertionState
  feedback: 'correct' | 'incorrect' | null
  operations?: OperationCounts
  performance?: ChallengePerformance
}

export type InsertionAttempt = {
  cardId: string
  targetPosition: number
}

export function insertionRoundReducer(
  round: InsertionRound,
  attempt: InsertionAttempt,
): InsertionRound {
  const { state } = round
  const currentCard = getCurrentCard(state)
  // Ignore delayed events for a scored card or a finished challenge.
  if (round.performance && (state.completed || round.performance.insertions.some(
    (item) => item.cardId === attempt.cardId && item.points !== null,
  ))) return round

  const reject = (): InsertionRound => ({
    ...round,
    feedback: 'incorrect',
    ...(round.performance && currentCard ? {
      performance: recordInsertionPerformance(round.performance, currentCard.id, false, false),
    } : {}),
  })

  if (currentCard?.id !== attempt.cardId
    || !validateInsertion(state, attempt.targetPosition)) {
    return reject()
  }

  try {
    const nextState = applyInsertion(state, attempt.targetPosition)
    const work = round.operations ? countInsertionOperations(state) : null
    return {
      ...round,
      state: nextState,
      feedback: 'correct',
      ...(round.performance && currentCard ? {
        performance: recordInsertionPerformance(round.performance, currentCard.id, true, nextState.completed),
      } : {}),
      ...(work && round.operations ? {
        operations: {
          comparisons: round.operations.comparisons + work.comparisons,
          shifts: round.operations.shifts + work.shifts,
        },
      } : {}),
    }
  } catch (error) {
    if (error instanceof RangeError) return reject()
    throw error
  }
}
