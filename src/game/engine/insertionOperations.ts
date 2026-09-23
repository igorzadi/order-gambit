import type { InsertionState } from './insertionSort'

export type OperationCounts = {
  comparisons: number
  shifts: number
}

/** Counts value comparisons and shifts, excluding placement of the current card. */
export function countInsertionOperations(state: InsertionState): OperationCounts {
  const counts = { comparisons: 0, shifts: 0 }
  if (state.completed || state.currentCard === null) return counts

  for (let index = state.currentIndex - 1; index >= 0; index -= 1) {
    counts.comparisons += 1
    if (state.cards[index].value <= state.currentCard.value) break
    counts.shifts += 1
  }
  return counts
}
