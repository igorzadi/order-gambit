import { afterEach, describe, expect, it, vi } from 'vitest'
import * as engine from '../game/engine'
import { insertionRoundReducer } from './insertionRound'
import type { InsertionRound } from './insertionRound'

function round(values = [8, 3, 6, 2, 5]): InsertionRound {
  return {
    state: engine.createInsertionState(values.map((value, index) => ({ id: `c${index}`, value }))),
    feedback: null,
  }
}

afterEach(() => vi.restoreAllMocks())

describe('integração da rodada guiada', () => {
  it('rejeita outra carta mesmo na posição correta', () => {
    const before = round()
    for (const cardId of ['c0', 'c2', 'desconhecida']) {
      const next = insertionRoundReducer(before, { cardId, targetPosition: 0 })
      expect(next.state).toBe(before.state)
      expect(next.feedback).toBe('incorrect')
    }
  })

  it('rejeita posição errada sem alterar ou avançar a rodada', () => {
    const before = round()
    const snapshot = structuredClone(before)
    const next = insertionRoundReducer(before, { cardId: 'c1', targetPosition: 1 })
    expect(next.state).toBe(before.state)
    expect(before).toEqual(snapshot)
    expect(next.feedback).toBe('incorrect')
  })

  it('rejeita soltura sem alvo', () => {
    const before = round()
    const next = insertionRoundReducer(before, { cardId: 'c1', targetPosition: -1 })
    expect(next.state).toBe(before.state)
    expect(next.feedback).toBe('incorrect')
  })

  it('permite tentar novamente e completar todos os passos', () => {
    let current = insertionRoundReducer(round(), { cardId: 'c1', targetPosition: 1 })
    const expected = [[3, 8, 6, 2, 5], [3, 6, 8, 2, 5], [2, 3, 6, 8, 5], [2, 3, 5, 6, 8]]
    for (const [index, targetPosition] of [0, 1, 0, 2].entries()) {
      current = insertionRoundReducer(current, { cardId: `c${index + 1}`, targetPosition })
      expect(current.state.cards.map((card) => card.value)).toEqual(expected[index])
      expect(current.feedback).toBe('correct')
    }
    expect(engine.isCompleted(current.state)).toBe(true)
  })

  it('confirma Manter aqui pelo motor sem deslocar as cartas', () => {
    const before = round([1, 2, 3])
    expect(engine.getExpectedPosition(before.state)).toBe(before.state.currentIndex)
    const next = insertionRoundReducer(before, { cardId: 'c1', targetPosition: 1 })
    expect(next.state.cards).toEqual(before.state.cards)
    expect(next.state.currentIndex).toBe(2)
    expect(next.feedback).toBe('correct')
  })

  it('rejeita eventos atrasados de uma carta já processada', () => {
    const current = insertionRoundReducer(round(), { cardId: 'c1', targetPosition: 0 })
    const next = insertionRoundReducer(current, { cardId: 'c1', targetPosition: 1 })
    expect(next.state).toBe(current.state)
    expect(next.feedback).toBe('incorrect')
  })

  it('trata RangeError do motor como tentativa incorreta', () => {
    const before = round()
    vi.spyOn(engine, 'applyInsertion').mockImplementation(() => { throw new RangeError('invalid') })
    const next = insertionRoundReducer(before, { cardId: 'c1', targetPosition: 0 })
    expect(next.state).toBe(before.state)
    expect(next.feedback).toBe('incorrect')
  })

  it('não oculta erros inesperados', () => {
    vi.spyOn(engine, 'applyInsertion').mockImplementation(() => { throw new Error('unexpected') })
    expect(() => insertionRoundReducer(round(), { cardId: 'c1', targetPosition: 0 }))
      .toThrow('unexpected')
  })
})
