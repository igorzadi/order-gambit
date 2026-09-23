import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createInsertionState, getExpectedPosition } from '../../game/engine'
import { analyzeLevels } from '../../game/levels/analyzeLevels'
import { insertionRoundReducer } from '../../hooks/insertionRound'
import type { InsertionRound } from '../../hooks/insertionRound'
import { analyzeFlowReducer, createAnalyzeFlow } from './analyzeFlow'
import type { AnalyzeFlow } from './analyzeFlow'
import { AnalyzeView } from './Analyze'

function initialRound(id: 'ordered' | 'reversed'): InsertionRound {
  return { state: createInsertionState(analyzeLevels[id].cards), feedback: null, operations: { comparisons: 0, shifts: 0 } }
}
function finish(id: 'ordered' | 'reversed') {
  let round = initialRound(id)
  for (let i = 1; i < analyzeLevels[id].cards.length; i += 1) {
    round = insertionRoundReducer(round, { cardId: round.state.currentCard!.id, targetPosition: getExpectedPosition(round.state)! })
  }
  return round
}
function experimentsDone() {
  let flow = createAnalyzeFlow()
  flow = analyzeFlowReducer(flow, { type: 'finish-experiment', result: finish('ordered') })
  return analyzeFlowReducer(flow, { type: 'finish-experiment', result: finish('reversed') })
}
function render(flow: AnalyzeFlow) {
  return renderToStaticMarkup(<MemoryRouter><AnalyzeView flow={flow} dispatch={() => {}} /></MemoryRouter>)
}

describe('progressão de Analyze', () => {
  it('inicia em A e impede o avanço prematuro ou fora de ordem', () => {
    const flow = createAnalyzeFlow()
    expect(flow.activity).toBe('ordered')
    expect(analyzeFlowReducer(flow, { type: 'finish-experiment', result: initialRound('ordered') })).toBe(flow)
    expect(analyzeFlowReducer(flow, { type: 'finish-experiment', result: finish('reversed') })).toBe(flow)
    expect(analyzeFlowReducer(flow, { type: 'answer', question: 'comparison', choice: 'b' })).toBe(flow)
    const html = render(flow)
    expect(html).toContain('Comparações: 0')
    expect(html).not.toContain('Próximo experimento')
    expect(html).not.toContain('href="/challenge"')
  })

  it('preserva os resultados de A e inicia B com contadores zerados', () => {
    const flow = analyzeFlowReducer(createAnalyzeFlow(), { type: 'finish-experiment', result: finish('ordered') })
    expect(flow.activity).toBe('reversed')
    expect(flow.results.ordered).toEqual({ comparisons: 4, shifts: 0 })
    expect(flow.results.reversed).toBeUndefined()
    expect(render(flow)).toContain('Comparações: 0')
    expect(analyzeFlowReducer(flow, { type: 'finish-experiment', result: finish('ordered') })).toBe(flow)
  })

  it('apresenta os dois totais calculados e a primeira questão após B', () => {
    const flow = experimentsDone()
    expect(flow.activity).toBe('comparison')
    expect(flow.results).toEqual({ ordered: { comparisons: 4, shifts: 0 }, reversed: { comparisons: 10, shifts: 10 } })
    const html = render(flow)
    expect(html).toContain('Comparações: 4')
    expect(html).toContain('Comparações: 10')
    expect(html).toContain('1 2 3 4 5')
    expect(html).toContain('5 4 3 2 1')
    expect(html).toContain('Qual situação exigiu mais trabalho?')
    expect(html).not.toContain('MELHOR CASO')
    expect(html).not.toContain('href="/challenge"')
  })

  it.each(['a', 'c', ''])('primeira questão rejeita %s e permite nova tentativa', (choice) => {
    const before = experimentsDone()
    const wrong = analyzeFlowReducer(before, { type: 'answer', question: 'comparison', choice })
    expect(wrong.activity).toBe('comparison')
    expect(wrong.results).toBe(before.results)
    expect(render(wrong)).toContain('Observe os números de comparações e deslocamentos dos dois experimentos.')
    const correct = analyzeFlowReducer(wrong, { type: 'answer', question: 'comparison', choice: 'b' })
    expect(correct.activity).toBe('shifts')
    expect(correct.incorrect).toBe(false)
    expect(render(correct)).toContain('MELHOR CASO')
    expect(render(correct)).toContain('[2, 4, 6, 8] | [5]')
  })

  it.each(['a', 'b', 'd'])('segunda questão rejeita %s sem liberar conclusão', (choice) => {
    const flow = analyzeFlowReducer(experimentsDone(), { type: 'answer', question: 'comparison', choice: 'b' })
    const wrong = analyzeFlowReducer(flow, { type: 'answer', question: 'shifts', choice })
    expect(wrong.activity).toBe('shifts')
    expect(render(wrong)).toContain('Observe quais cartas são maiores que 5 e estão na região ordenada.')
    expect(render(wrong)).not.toContain('href="/challenge"')
  })

  it('impede respostas fora da etapa e libera Challenge apenas após ambos os acertos', () => {
    const comparison = experimentsDone()
    expect(analyzeFlowReducer(comparison, { type: 'answer', question: 'shifts', choice: 'c' })).toBe(comparison)
    const shifts = analyzeFlowReducer(comparison, { type: 'answer', question: 'comparison', choice: 'b' })
    const completed = analyzeFlowReducer(shifts, { type: 'answer', question: 'shifts', choice: 'c' })
    expect(completed.activity).toBe('completed')
    const html = render(completed)
    expect(html).toContain('Correto! O 6 e o 8 precisam avançar uma posição para abrir espaço para o 5.')
    expect(html).toContain('🔎 Análise concluída!')
    expect(html).toContain('href="/challenge"')
    expect(analyzeFlowReducer(completed, { type: 'answer', question: 'shifts', choice: 'a' })).toBe(completed)
  })
})
