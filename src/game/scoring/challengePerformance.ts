import type { CardItem } from '../types/CardItem'
import type { ChallengePerformance } from '../types/ChallengePerformance'
import { calculateInsertionScore } from './insertionScore'

export function createChallengePerformance(cards: readonly CardItem[]): ChallengePerformance {
  return {
    correctInsertions: 0,
    incorrectAttempts: 0,
    completedSteps: 0,
    completed: cards.length <= 1,
    score: 0,
    insertions: cards.slice(1).map((card) => ({ cardId: card.id, attempts: 0, errors: 0, points: null })),
  }
}

export function recordInsertionPerformance(
  performance: ChallengePerformance,
  cardId: string,
  correct: boolean,
  completed: boolean,
): ChallengePerformance {
  const insertion = performance.insertions.find((item) => item.cardId === cardId)
  if (performance.completed || !insertion || insertion.points !== null) return performance

  const points = correct ? calculateInsertionScore(insertion.errors) : null
  return {
    correctInsertions: performance.correctInsertions + Number(correct),
    incorrectAttempts: performance.incorrectAttempts + Number(!correct),
    completedSteps: performance.completedSteps + Number(correct),
    completed: correct && completed,
    score: performance.score + (points ?? 0),
    insertions: performance.insertions.map((item) => item === insertion ? {
      ...item,
      attempts: item.attempts + 1,
      errors: item.errors + Number(!correct),
      points,
    } : item),
  }
}
