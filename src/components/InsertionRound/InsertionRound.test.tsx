import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createInsertionState, getCurrentCard, getExpectedPosition, isCompleted } from '../../game/engine'
import { discoverLevel, practiceLevel } from '../../game/levels/insertionLevels'
import type { InsertionLevel } from '../../game/levels/insertionLevels'
import { insertionRoundReducer } from '../../hooks/insertionRound'
import type { InsertionRound } from '../../hooks/insertionRound'
import { InsertionRoundView } from './InsertionRound'
import Practice from '../../pages/Practice/Practice'
import Discover from '../../pages/Discover/Discover'

const start = (level: InsertionLevel): InsertionRound => ({
  state: createInsertionState(level.cards), feedback: null,
})

function insert(round: InsertionRound, position: number) {
  return insertionRoundReducer(round, {
    cardId: getCurrentCard(round.state)!.id,
    targetPosition: position,
  })
}

function complete(level: InsertionLevel, positions: number[]) {
  return positions.reduce(insert, start(level))
}

function render(level: InsertionLevel, round: InsertionRound) {
  const currentCard = getCurrentCard(round.state)
  return renderToStaticMarkup(
    <MemoryRouter>
      <InsertionRoundView level={level} round={{
        ...round,
        currentCard,
        completed: isCompleted(round.state),
        canKeep: currentCard !== null && getExpectedPosition(round.state) === round.state.currentIndex,
        keepHere: () => {},
        attemptInsertion: () => {},
      }} />
    </MemoryRouter>,
  )
}

describe('Practice e rodada compartilhada', () => {
  it('inicia Practice com a sequência e a carta atual solicitadas', () => {
    const round = start(practiceLevel)
    expect(round.state.cards.map((card) => card.value)).toEqual([7, 4, 8, 3, 6, 2])
    expect(getCurrentCard(round.state)).toEqual({ id: 'practice-card-2', value: 4 })
    const html = renderToStaticMarkup(<MemoryRouter><Practice /></MemoryRouter>)
    expect(html).toContain('🎯 Pratique')
    expect(html).toContain('Agora é sua vez. Execute o Insertion Sort.')
    expect(html).toContain('<h2>CARTA DA VEZ</h2>')
    expect(html).toContain('aria-label="Carta 4"')
    expect(html).not.toContain('Carta atual: 4')
    expect(html).not.toContain('href="/analyze"')
  })

  it('mantém o estado e currentCard quando a posição é incorreta', () => {
    const before = start(practiceLevel)
    const next = insert(before, 1)
    expect(next.state).toBe(before.state)
    expect(next.state.currentIndex).toBe(1)
    expect(getCurrentCard(next.state)?.value).toBe(4)
    expect(next.feedback).toBe('incorrect')
    const html = render(practiceLevel, next)
    expect(html).toContain('A carta precisa ser inserida de modo que toda a região à esquerda continue ordenada.')
    expect(html).not.toContain('Tente novamente.')
    expect(html).not.toContain('href="/analyze"')
    expect(html).not.toContain('insertion-slot--over')
  })

  it('rejeita o ID de uma carta futura mesmo no destino correto', () => {
    const before = start(practiceLevel)
    const next = insertionRoundReducer(before, { cardId: 'practice-card-3', targetPosition: 0 })
    expect(next.state).toBe(before.state)
    expect(next.feedback).toBe('incorrect')
  })

  it('processa cada carta e conclui a sequência completa da Practice', () => {
    let round = start(practiceLevel)
    const currentValues = [4, 8, 3, 6, 2]
    const expected = [
      [4, 7, 8, 3, 6, 2],
      [4, 7, 8, 3, 6, 2],
      [3, 4, 7, 8, 6, 2],
      [3, 4, 6, 7, 8, 2],
      [2, 3, 4, 6, 7, 8],
    ]
    for (const [index, position] of [0, 2, 0, 2, 0].entries()) {
      expect(getCurrentCard(round.state)?.value).toBe(currentValues[index])
      expect(isCompleted(round.state)).toBe(false)
      expect(render(practiceLevel, round)).not.toContain('href="/analyze"')
      round = insert(round, position)
      expect(round.state.cards.map((card) => card.value)).toEqual(expected[index])
    }
    expect(isCompleted(round.state)).toBe(true)
    expect(getCurrentCard(round.state)).toBeNull()
  })

  it('oferece Manter aqui para 8 e avança sem reorganizar', () => {
    const before = insert(start(practiceLevel), 0)
    expect(render(practiceLevel, before)).toContain('Manter aqui')
    expect(getExpectedPosition(before.state)).toBe(before.state.currentIndex)
    const next = insert(before, before.state.currentIndex)
    expect(next.state.cards).toEqual(before.state.cards)
    expect(getCurrentCard(next.state)?.value).toBe(3)
    expect(render(practiceLevel, next)).not.toContain('Manter aqui')
  })

  it('libera Analyze somente na conclusão e mostra a comparação das sequências', () => {
    const round = complete(practiceLevel, [0, 2, 0, 2, 0])
    const html = render(practiceLevel, round)
    expect(html).toContain('🎯 Você executou um Insertion Sort completo.')
    expect(html).toContain('aria-label="Sequência inicial">7 4 8 3 6 2')
    expect(html).toContain('aria-label="Sequência ordenada">2 3 4 6 7 8')
    expect(html).toContain('href="/analyze"')
    expect(html).toContain('Continuar')
    expect(html).not.toContain('Manter aqui')
  })

  it('não acrescenta orientação de Discover nos passos seguintes de Practice', () => {
    const html = render(practiceLevel, insert(start(practiceLevel), 0))
    expect(html).toContain('Carta atual: 8')
    expect(html).not.toContain('Onde o 3')
    expect(html).not.toContain('Insira a próxima carta na posição correta.')
    expect(html).not.toContain('A parte ordenada cresceu.')
  })

  it('preserva a introdução e o feedback de erro de Discover', () => {
    const html = renderToStaticMarkup(<MemoryRouter><Discover /></MemoryRouter>)
    expect(html).toContain('💡 Descubra')
    expect(html).toContain('A primeira carta já pode ser considerada ordenada.')
    expect(html).toContain('Onde o 3 deve ser inserido')
    expect(html).not.toContain('href="/practice"')
    expect(render(discoverLevel, insert(start(discoverLevel), 1))).toContain('Tente novamente.')
  })

  it('preserva o suporte reduzido e a conclusão de Discover', () => {
    const afterFirst = render(discoverLevel, insert(start(discoverLevel), 0))
    expect(afterFirst).toContain('Insira a próxima carta na posição correta.')
    expect(afterFirst).toContain('✓ Exatamente. A parte ordenada cresceu.')
    expect(afterFirst).not.toContain('Onde o 3')
    const round = complete(discoverLevel, [0, 1, 0, 2])
    expect(round.state.cards.map((card) => card.value)).toEqual([2, 3, 5, 6, 8])
    const html = render(discoverLevel, round)
    expect(html).toContain('Você acabou de executar um algoritmo de ordenação.')
    expect(html).toContain('Insertion Sort')
    expect(html).toContain('href="/practice"')
    expect(html).not.toContain('href="/analyze"')
  })

  it('mantém as rodadas e configurações independentes', () => {
    const original = structuredClone(practiceLevel.cards)
    complete(practiceLevel, [0, 2, 0, 2, 0])
    expect(practiceLevel.cards).toEqual(original)
    expect(start(practiceLevel).state.currentIndex).toBe(1)
    expect(start(discoverLevel).state.cards.map((card) => card.value)).toEqual([8, 3, 6, 2, 5])
  })
})
