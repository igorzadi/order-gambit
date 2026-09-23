import { describe, expect, it } from 'vitest'
import {
  applyInsertion,
  createInsertionState,
  getCurrentCard,
  getExpectedPosition,
  isCompleted,
  validateInsertion,
} from './index'
import type { InsertionState } from './index'

const makeCards = (values: number[]) => values.map((value, index) => ({
  id: `card-${index + 1}`,
  value,
}))
const reference = () => createInsertionState(makeCards([8, 3, 6, 2, 5]))
const values = (state: InsertionState) => state.cards.map((card) => card.value)

function finish(initial: InsertionState) {
  let state = initial
  for (let step = 0; step < initial.cards.length && !isCompleted(state); step += 1) {
    state = applyInsertion(state, getExpectedPosition(state)!)
  }
  expect(isCompleted(state)).toBe(true)
  return state
}

describe('Insertion Sort pedagógico', () => {
  it('inicia apenas com a primeira carta processada', () => {
    const state = reference()
    expect(values(state)).toEqual([8, 3, 6, 2, 5])
    expect(state.currentIndex).toBe(1)
    expect(state.sortedUntil).toBe(0)
    expect(getCurrentCard(state)).toEqual({ id: 'card-2', value: 3 })
    expect(getExpectedPosition(state)).toBe(0)
    expect(isCompleted(state)).toBe(false)
  })

  it.each([
    { moves: [0], expected: [3, 8, 6, 2, 5], ids: [2, 1, 3, 4, 5], currentIndex: 2, next: 1 },
    { moves: [0, 1], expected: [3, 6, 8, 2, 5], ids: [2, 3, 1, 4, 5], currentIndex: 3, next: 0 },
    { moves: [0, 1, 0], expected: [2, 3, 6, 8, 5], ids: [4, 2, 3, 1, 5], currentIndex: 4, next: 2 },
    { moves: [0, 1, 0, 2], expected: [2, 3, 5, 6, 8], ids: [4, 2, 5, 3, 1], currentIndex: 5, next: null },
  ])('aplica exatamente os passos $moves', ({ moves, expected, ids, currentIndex, next }) => {
    let state = reference()
    for (const position of moves) {
      expect(validateInsertion(state, position)).toBe(true)
      state = applyInsertion(state, position)
    }
    expect(values(state)).toEqual(expected)
    expect(state.cards.map((card) => card.id)).toEqual(ids.map((id) => `card-${id}`))
    expect(state.currentIndex).toBe(currentIndex)
    expect(state.sortedUntil).toBe(currentIndex - 1)
    expect(getExpectedPosition(state)).toBe(next)
    expect(getCurrentCard(state)).toEqual(state.cards[currentIndex] ?? null)
    expect(isCompleted(state)).toBe(currentIndex === 5)
  })

  it('conclui sem carta atual ou nova posição e rejeita passos adicionais', () => {
    const state = finish(reference())
    expect(state.currentIndex).toBe(state.cards.length)
    expect(state.sortedUntil).toBe(4)
    expect(getCurrentCard(state)).toBeNull()
    expect(getExpectedPosition(state)).toBeNull()
    expect(validateInsertion(state, 0)).toBe(false)
    expect(() => applyInsertion(state, 0)).toThrow(RangeError)
  })

  it.each([1, 2, -1, 5, 0.5, NaN, Infinity])('rejeita posição inválida %s sem mudar o estado', (position) => {
    const state = reference()
    const before = structuredClone(state)
    state.cards.forEach(Object.freeze)
    Object.freeze(state.cards)
    Object.freeze(state)
    expect(validateInsertion(state, position)).toBe(false)
    expect(() => applyInsertion(state, position)).toThrow(RangeError)
    expect(state).toEqual(before)
  })

  it('não aceita uma posição apenas por melhorar parcialmente a ordem', () => {
    const state = createInsertionState(makeCards([8, 3, 6, 2, 5]))
    const thirdStep = applyInsertion(applyInsertion(state, 0), 1)
    expect(getCurrentCard(thirdStep)?.value).toBe(2)
    expect(validateInsertion(thirdStep, 1)).toBe(false)
    expect(validateInsertion(thirdStep, 0)).toBe(true)
  })

  it('produz novo estado em uma inserção válida sem mutar a entrada', () => {
    const state = reference()
    const before = structuredClone(state)
    state.cards.forEach(Object.freeze)
    Object.freeze(state.cards)
    Object.freeze(state)
    const next = applyInsertion(state, 0)
    expect(next).not.toBe(state)
    expect(next.cards).not.toBe(state.cards)
    expect(state).toEqual(before)
  })

  it('copia a entrada e suas cartas ao criar o estado', () => {
    const input = makeCards([8, 3])
    const state = createInsertionState(input)
    input[0].value = 100
    input.reverse()
    expect(values(state)).toEqual([8, 3])
  })

  it('exige processar cada carta mesmo em uma sequência já ordenada', () => {
    let state = createInsertionState(makeCards([1, 2, 3, 4, 5]))
    for (let index = 1; index < 5; index += 1) {
      expect(isCompleted(state)).toBe(false)
      expect(getExpectedPosition(state)).toBe(index)
      state = applyInsertion(state, index)
      expect(values(state)).toEqual([1, 2, 3, 4, 5])
    }
    expect(isCompleted(state)).toBe(true)
  })

  it('processa a ordem inversa com inserções no início', () => {
    let state = createInsertionState(makeCards([5, 4, 3, 2, 1]))
    for (let index = 1; index < 5; index += 1) {
      expect(getExpectedPosition(state)).toBe(0)
      state = applyInsertion(state, 0)
      expect(values(state).slice(0, index + 1)).toEqual(
        Array.from({ length: index + 1 }, (_, offset) => 5 - index + offset),
      )
    }
    expect(values(state)).toEqual([1, 2, 3, 4, 5])
    expect(isCompleted(state)).toBe(true)
  })

  it('preserva a ordem original dos IDs entre valores repetidos', () => {
    const state = finish(createInsertionState([
      { id: '3a', value: 3 }, { id: '2a', value: 2 },
      { id: '3b', value: 3 }, { id: '2b', value: 2 }, { id: '3c', value: 3 },
    ]))
    expect(state.cards.map((card) => card.id)).toEqual(['2a', '2b', '3a', '3b', '3c'])
  })

  it('rejeita inserir uma carta antes de outra com valor igual', () => {
    const state = createInsertionState(makeCards([3, 3, 3]))
    expect(getExpectedPosition(state)).toBe(1)
    expect(validateInsertion(state, 0)).toBe(false)
    expect(finish(state).cards.map((card) => card.id)).toEqual(['card-1', 'card-2', 'card-3'])
  })

  it.each([{ input: [] }, { input: [7] }])('trata $input como concluído desde o início', ({ input }) => {
    const state = createInsertionState(makeCards(input))
    expect(isCompleted(state)).toBe(true)
    expect(state.currentIndex).toBe(input.length)
    expect(state.sortedUntil).toBe(input.length - 1)
    expect(getCurrentCard(state)).toBeNull()
    expect(getExpectedPosition(state)).toBeNull()
  })

  it('suporta valores negativos e decimais', () => {
    expect(values(finish(createInsertionState(makeCards([0, -2.5, 1.5, -2.5])))))
      .toEqual([-2.5, -2.5, 0, 1.5])
  })

  it('rejeita IDs repetidos', () => {
    expect(() => createInsertionState([{ id: 'a', value: 1 }, { id: 'a', value: 2 }]))
      .toThrow(TypeError)
  })

  it.each([NaN, Infinity, -Infinity])('rejeita valor não finito %s', (value) => {
    expect(() => createInsertionState(makeCards([value]))).toThrow(TypeError)
  })
})
