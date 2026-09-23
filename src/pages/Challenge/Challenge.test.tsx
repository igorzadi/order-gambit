import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createInsertionState, getCurrentCard, getExpectedPosition, isCompleted } from '../../game/engine'
import { challengeLevel } from '../../game/levels/insertionLevels'
import { createChallengePerformance } from '../../game/scoring/challengePerformance'
import { insertionRoundReducer } from '../../hooks/insertionRound'
import type { InsertionRound } from '../../hooks/insertionRound'
import { InsertionRoundView } from '../../components/InsertionRound/InsertionRound'
import Challenge from './Challenge'

function start(): InsertionRound {
  return {
    state: createInsertionState(challengeLevel.cards),
    feedback: null,
    performance: createChallengePerformance(challengeLevel.cards),
  }
}
function attempt(round: InsertionRound, position: number) {
  return insertionRoundReducer(round, { cardId: round.state.currentCard!.id, targetPosition: position })
}
function render(round: InsertionRound) {
  const currentCard = getCurrentCard(round.state)
  return renderToStaticMarkup(<MemoryRouter>
    <InsertionRoundView level={challengeLevel} completionLabel="Ver resultado" round={{
      ...round,
      currentCard,
      completed: isCompleted(round.state),
      canKeep: currentCard !== null && getExpectedPosition(round.state) === round.state.currentIndex,
      keepHere: () => {}, attemptInsertion: () => {},
    }} />
  </MemoryRouter>)
}

describe('Desafio Final', () => {
  it('começa com a sequência solicitada, desempenho zerado e cinco passos', () => {
    const round = start()
    expect(round.state.cards.map((card) => card.value)).toEqual([6, 2, 7, 4, 1, 5])
    expect(round.state.currentCard?.value).toBe(2)
    expect(round.performance).toMatchObject({ correctInsertions: 0, incorrectAttempts: 0, completedSteps: 0, completed: false, score: 0 })
    expect(round.performance?.insertions).toHaveLength(5)
    const html = renderToStaticMarkup(<MemoryRouter><Challenge /></MemoryRouter>)
    expect(html).toContain('🏆 Desafio Final')
    expect(html).toContain('Agora é com você. Execute corretamente o Insertion Sort.')
    expect(html).toContain('Passos concluídos: 0 de 5')
    expect(html).not.toContain('href="/result"')
    expect(html).not.toContain('Comparações:')
  })

  it('preserva a sequência após erro e registra a tentativa sem pontuar', () => {
    const before = start()
    const wrong = attempt(before, 1)
    expect(wrong.state).toBe(before.state)
    expect(wrong.performance?.incorrectAttempts).toBe(1)
    expect(wrong.performance?.score).toBe(0)
    expect(wrong.performance?.completedSteps).toBe(0)
    expect(wrong.performance?.insertions[0].attempts).toBe(1)
    const html = render(wrong)
    expect(html).toContain('Essa inserção não mantém a região ordenada. Tente novamente.')
    expect(html).not.toContain('insertion-slot--over')
    expect(html).not.toContain('href="/result"')
    const correct = attempt(wrong, 0)
    expect(correct.performance?.score).toBe(75)
    expect(render(correct)).toContain('✓ Inserção correta!')
  })

  it('rejeita ID de carta futura e atribui a tentativa à inserção atual', () => {
    const before = start()
    const wrong = insertionRoundReducer(before, { cardId: 'challenge-card-3', targetPosition: 0 })
    expect(wrong.state).toBe(before.state)
    expect(wrong.performance?.insertions[0].errors).toBe(1)
    expect(wrong.performance?.insertions[1].attempts).toBe(0)
  })

  it('processa os cinco passos, incluindo Manter aqui, e conclui com 500 pontos', () => {
    let round = start()
    const expected = [
      [2, 6, 7, 4, 1, 5], [2, 6, 7, 4, 1, 5], [2, 4, 6, 7, 1, 5],
      [1, 2, 4, 6, 7, 5], [1, 2, 4, 5, 6, 7],
    ]
    for (const [index, position] of [0, 2, 1, 0, 3].entries()) {
      expect(render(round)).not.toContain('href="/result"')
      if (index === 1) expect(render(round)).toContain('Manter aqui')
      round = attempt(round, position)
      expect(round.state.cards.map((card) => card.value)).toEqual(expected[index])
      expect(round.performance?.completedSteps).toBe(index + 1)
      expect(round.performance?.score).toBe((index + 1) * 100)
    }
    expect(isCompleted(round.state)).toBe(true)
    expect(round.performance).toMatchObject({ completed: true, correctInsertions: 5, incorrectAttempts: 0, score: 500 })
    expect(round.performance?.insertions.every((step) => step.attempts === 1)).toBe(true)
    const html = render(round)
    expect(html).toContain('🏆 Desafio concluído!')
    expect(html).toContain('6 2 7 4 1 5')
    expect(html).toContain('1 2 4 5 6 7')
    expect(html).toContain('Inserções concluídas')
    expect(html).toContain('Erros cometidos')
    expect(html).toContain('Pontuação obtida')
    expect(html).toContain('href="/result"')
    expect(html).toContain('Ver resultado')
    expect(round.operations).toBeUndefined()
    expect(JSON.parse(JSON.stringify(round.performance))).toEqual(round.performance)
  })

  it('calcula separadamente a pontuação e as tentativas de cada inserção', () => {
    let round = attempt(start(), 0)
    round = attempt(round, 0) // 7 deve permanecer no índice 2.
    round = attempt(round, 2)
    round = attempt(round, 0) // 4 deve entrar no índice 1.
    round = attempt(round, 2)
    round = attempt(round, 1)
    round = attempt(round, 0)
    round = attempt(round, 3)
    expect(round.performance?.score).toBe(425)
    expect(round.performance?.incorrectAttempts).toBe(3)
    expect(round.performance?.insertions.map((step) => step.attempts)).toEqual([1, 2, 3, 1, 1])
    expect(round.performance?.insertions.map((step) => step.points)).toEqual([100, 75, 50, 100, 100])
  })

  it('ignora eventos de uma inserção já pontuada, inclusive após conclusão', () => {
    let round = attempt(start(), 0)
    const duplicate = insertionRoundReducer(round, { cardId: 'challenge-card-2', targetPosition: 0 })
    expect(duplicate).toBe(round)
    for (const position of [2, 1, 0, 3]) round = attempt(round, position)
    expect(insertionRoundReducer(round, { cardId: 'challenge-card-6', targetPosition: 3 })).toBe(round)
    expect(round.performance?.score).toBe(500)
  })

  it('não mistura tentativas com operações do algoritmo', () => {
    const initial = { ...start(), operations: { comparisons: 0, shifts: 0 } }
    const wrong = attempt(initial, 1)
    expect(wrong.operations).toEqual({ comparisons: 0, shifts: 0 })
    expect(wrong.performance?.incorrectAttempts).toBe(1)
    const correct = attempt(wrong, 0)
    expect(correct.operations).toEqual({ comparisons: 1, shifts: 1 })
    expect(correct.performance?.score).toBe(75)
  })
})
