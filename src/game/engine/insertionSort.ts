import type { CardItem } from '../types/CardItem'

export type InsertionState = {
  readonly cards: readonly Readonly<CardItem>[]
  /** Index of the next unprocessed card; cards.length when completed. */
  readonly currentIndex: number
  readonly currentCard: Readonly<CardItem> | null
  /** Inclusive end of the processed region; -1 for an empty sequence. */
  readonly sortedUntil: number
  /** Final zero-based index for the current card; null when completed. */
  readonly expectedPosition: number | null
  readonly completed: boolean
}

function buildState(
  cards: readonly Readonly<CardItem>[],
  currentIndex: number,
): InsertionState {
  const currentCard = cards[currentIndex] ?? null
  let expectedPosition: number | null = null

  if (currentCard !== null) {
    expectedPosition = currentIndex
    // Equal values stay before the current card, preserving original ID order.
    while (expectedPosition > 0 && cards[expectedPosition - 1].value > currentCard.value) {
      expectedPosition -= 1
    }
  }

  return {
    cards,
    currentIndex,
    currentCard,
    sortedUntil: currentIndex - 1,
    expectedPosition,
    completed: currentCard === null,
  }
}

export function createInsertionState(cards: readonly Readonly<CardItem>[]): InsertionState {
  if (new Set(cards.map((card) => card.id)).size !== cards.length) {
    throw new TypeError('Cada carta deve possuir um ID único.')
  }
  if (cards.some((card) => !Number.isFinite(card.value))) {
    throw new TypeError('Os valores das cartas devem ser números finitos.')
  }

  return buildState(cards.map((card) => ({ ...card })), Math.min(1, cards.length))
}

export function getCurrentCard(state: InsertionState): Readonly<CardItem> | null {
  return state.currentCard
}

export function getExpectedPosition(state: InsertionState): number | null {
  return state.expectedPosition
}

export function validateInsertion(state: InsertionState, targetPosition: number): boolean {
  return !state.completed && Number.isInteger(targetPosition)
    && targetPosition === getExpectedPosition(state)
}

/** Throws RangeError on invalid moves, including moves after completion. */
export function applyInsertion(state: InsertionState, targetPosition: number): InsertionState {
  if (!validateInsertion(state, targetPosition)) {
    throw new RangeError('Posição inválida para inserir a carta atual.')
  }

  const cards = [...state.cards]
  const [currentCard] = cards.splice(state.currentIndex, 1)
  cards.splice(targetPosition, 0, currentCard)
  return buildState(cards, state.currentIndex + 1)
}

export function isCompleted(state: InsertionState): boolean {
  return state.completed
}
