import { describe, expect, it } from 'vitest'
import { calculateInsertionScore } from './insertionScore'
import { createChallengePerformance, recordInsertionPerformance } from './challengePerformance'

const cards = [{ id: 'first', value: 2 }, { id: 'current', value: 1 }]

describe('pontuação por inserção', () => {
  it.each([{ errors: 0, score: 100 }, { errors: 1, score: 75 }, { errors: 2, score: 50 }, { errors: 10, score: 50 }])(
    '$errors erros resultam em $score pontos', ({ errors, score }) => {
      expect(calculateInsertionScore(errors)).toBe(score)
    },
  )

  it.each([-1, 0.5, NaN, Infinity])('rejeita quantidade inválida de erros %s', (errors) => {
    expect(() => calculateInsertionScore(errors)).toThrow(RangeError)
  })

  it('registra tentativas sem pontuar até o acerto, sem mutar a entrada', () => {
    const initial = createChallengePerformance(cards)
    const wrong = recordInsertionPerformance(initial, 'current', false, false)
    expect(wrong.score).toBe(0)
    expect(wrong.completedSteps).toBe(0)
    expect(wrong.insertions[0]).toEqual({ cardId: 'current', attempts: 1, errors: 1, points: null })
    const correct = recordInsertionPerformance(wrong, 'current', true, true)
    expect(correct.score).toBe(75)
    expect(correct.completed).toBe(true)
    expect(correct.correctInsertions).toBe(1)
    expect(correct.insertions[0]).toEqual({ cardId: 'current', attempts: 2, errors: 1, points: 75 })
    expect(initial.score).toBe(0)
    expect(initial.insertions[0].attempts).toBe(0)
    expect(wrong.insertions[0].points).toBeNull()
  })

  it('não pontua duas vezes nem aceita cartas desconhecidas', () => {
    const initial = createChallengePerformance(cards)
    expect(recordInsertionPerformance(initial, 'unknown', true, false)).toBe(initial)
    const correct = recordInsertionPerformance(initial, 'current', true, true)
    expect(recordInsertionPerformance(correct, 'current', true, true)).toBe(correct)
    expect(recordInsertionPerformance(correct, 'current', false, true)).toBe(correct)
  })
})
