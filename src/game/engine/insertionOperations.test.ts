import { describe, expect, it } from 'vitest'
import { applyInsertion, createInsertionState, getExpectedPosition, isCompleted } from './insertionSort'
import { countInsertionOperations } from './insertionOperations'
import { insertionRoundReducer } from '../../hooks/insertionRound'
import type { InsertionRound } from '../../hooks/insertionRound'

const stateFor = (values: number[]) => createInsertionState(values.map((value, i) => ({ id: `c${i}`, value })))

describe('operações convencionais do Insertion Sort', () => {
  it('conta a comparação que encerra a busca e apenas as cartas deslocadas', () => {
    let state = stateFor([3, 6, 8, 5])
    state = applyInsertion(applyInsertion(state, 1), 2)
    const before = structuredClone(state)
    expect(countInsertionOperations(state)).toEqual({ comparisons: 3, shifts: 2 })
    expect(state).toEqual(before)
  })

  it('não conta o limite do array nem a colocação da carta como operações', () => {
    const state = applyInsertion(stateFor([3, 6, 2]), 1)
    expect(countInsertionOperations(state)).toEqual({ comparisons: 2, shifts: 2 })
  })

  it('conta uma comparação e nenhum deslocamento ao manter a carta', () => {
    expect(countInsertionOperations(stateFor([1, 2]))).toEqual({ comparisons: 1, shifts: 0 })
  })

  it('interrompe em valores iguais, preservando a estabilidade', () => {
    expect(countInsertionOperations(stateFor([3, 3]))).toEqual({ comparisons: 1, shifts: 0 })
  })

  it.each([{ values: [] }, { values: [5] }])('não conta operações em estado concluído $values', ({ values }) => {
    expect(countInsertionOperations(stateFor(values))).toEqual({ comparisons: 0, shifts: 0 })
  })

  it.each([
    { values: [1, 2, 3, 4, 5], comparisons: 4, shifts: 0 },
    { values: [5, 4, 3, 2, 1], comparisons: 10, shifts: 10 },
  ])('acumula totais de $values', ({ values, comparisons, shifts }) => {
    let round: InsertionRound = { state: stateFor(values), feedback: null, operations: { comparisons: 0, shifts: 0 } }
    for (let step = 1; step < values.length; step += 1) {
      round = insertionRoundReducer(round, {
        cardId: round.state.currentCard!.id,
        targetPosition: getExpectedPosition(round.state)!,
      })
    }
    expect(isCompleted(round.state)).toBe(true)
    expect(round.operations).toEqual({ comparisons, shifts })
  })

  it('não conta tentativas erradas, IDs incorretos ou eventos duplicados', () => {
    const initial: InsertionRound = { state: stateFor([3, 2, 1]), feedback: null, operations: { comparisons: 0, shifts: 0 } }
    const wrong = insertionRoundReducer(initial, { cardId: 'c1', targetPosition: 1 })
    const wrongId = insertionRoundReducer(wrong, { cardId: 'c2', targetPosition: 0 })
    expect(wrongId.state).toBe(initial.state)
    expect(wrongId.operations).toEqual({ comparisons: 0, shifts: 0 })
    const correct = insertionRoundReducer(wrongId, { cardId: 'c1', targetPosition: 0 })
    const duplicate = insertionRoundReducer(correct, { cardId: 'c1', targetPosition: 0 })
    expect(duplicate.operations).toEqual({ comparisons: 1, shifts: 1 })
    expect(initial.operations).toEqual({ comparisons: 0, shifts: 0 })
  })

  it('mantém a contagem opcional nas fases anteriores', () => {
    const round = insertionRoundReducer({ state: stateFor([2, 1]), feedback: null }, { cardId: 'c1', targetPosition: 0 })
    expect(round.operations).toBeUndefined()
  })
})
