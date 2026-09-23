import { isCompleted } from '../../game/engine'
import type { OperationCounts } from '../../game/engine/insertionOperations'
import { analysisQuestions, analyzeLevels } from '../../game/levels/analyzeLevels'
import type { InsertionRound } from '../../hooks/insertionRound'

export type AnalyzeFlow = {
  activity: 'ordered' | 'reversed' | 'comparison' | 'shifts' | 'completed'
  results: Partial<Record<'ordered' | 'reversed', OperationCounts>>
  incorrect: boolean
}

export type AnalyzeAction =
  | { type: 'finish-experiment'; result: InsertionRound }
  | { type: 'answer'; question: 'comparison' | 'shifts'; choice: string }

export function createAnalyzeFlow(): AnalyzeFlow {
  return { activity: 'ordered', results: {}, incorrect: false }
}

export function analyzeFlowReducer(flow: AnalyzeFlow, action: AnalyzeAction): AnalyzeFlow {
  if (action.type === 'finish-experiment') {
    if (flow.activity !== 'ordered' && flow.activity !== 'reversed') return flow
    const { state, operations } = action.result
    const initialCards = analyzeLevels[flow.activity].cards
    if (!isCompleted(state) || !operations || state.cards.length !== initialCards.length
      || !initialCards.every((card) => state.cards.some((item) => item.id === card.id && item.value === card.value))) {
      return flow
    }
    return {
      activity: flow.activity === 'ordered' ? 'reversed' : 'comparison',
      results: { ...flow.results, [flow.activity]: { ...operations } },
      incorrect: false,
    }
  }

  if (flow.activity !== action.question) return flow
  if (action.choice !== analysisQuestions[action.question].answer) {
    return { ...flow, incorrect: true }
  }
  return {
    ...flow,
    activity: action.question === 'comparison' ? 'shifts' : 'completed',
    incorrect: false,
  }
}
