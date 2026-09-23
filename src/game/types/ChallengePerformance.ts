import type { CardItem } from './CardItem'

export type InsertionPerformance = {
  cardId: string
  attempts: number
  errors: number
  points: number | null
}

export type ChallengePerformance = {
  correctInsertions: number
  incorrectAttempts: number
  completedSteps: number
  completed: boolean
  score: number
  insertions: readonly InsertionPerformance[]
}

/** Serializable local snapshot for the future Result page or persistence service. */
export type ChallengeResult = {
  initialCards: readonly Readonly<CardItem>[]
  finalCards: readonly Readonly<CardItem>[]
  performance: ChallengePerformance
}
