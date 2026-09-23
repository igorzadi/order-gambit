import { useReducer } from 'react'
import { useMatch } from '../../context/matchState'
import type { QuestionId } from '../../game/session/match'
import { Link } from 'react-router'
import InsertionRound from '../../components/InsertionRound/InsertionRound'
import AnalysisQuestion from '../../components/AnalysisQuestion/AnalysisQuestion'
import { analysisQuestions, analyzeLevels } from '../../game/levels/analyzeLevels'
import { analyzeFlowReducer, createAnalyzeFlow } from './analyzeFlow'
import type { AnalyzeAction, AnalyzeFlow } from './analyzeFlow'

type Props = {
  flow: AnalyzeFlow
  dispatch: (action: AnalyzeAction) => void
  selections?: Partial<Record<QuestionId, string>>
  onSelect?: (question: QuestionId, choice: string) => void
}

export function AnalyzeView({ flow, dispatch, selections, onSelect }: Props) {
  const { activity, results } = flow
  const experiment = activity === 'ordered' || activity === 'reversed' ? activity : null
  const question = activity === 'comparison' || activity === 'shifts' ? activity : null

  return (
    <div className="analysis-page">
      <h1>🔎 Analise</h1>
      {experiment && (
        <InsertionRound
          key={experiment}
          level={analyzeLevels[experiment]}
          trackOperations
          completionLabel={experiment === 'ordered' ? 'Próximo experimento' : 'Comparar resultados'}
          onComplete={(result) => dispatch({ type: 'finish-experiment', result })}
        />
      )}
      {results.ordered && results.reversed && (
        <section aria-label="Comparação dos experimentos" className="analysis-results">
          {(['ordered', 'reversed'] as const).map((id) => (
            <article key={id}>
              <h2>{analyzeLevels[id].title}</h2>
              <p aria-label="Sequência inicial">{analyzeLevels[id].cards.map((card) => card.value).join(' ')}</p>
              <p>Comparações: {results[id]!.comparisons}</p>
              <p>Deslocamentos: {results[id]!.shifts}</p>
            </article>
          ))}
        </section>
      )}
      {(activity === 'shifts' || activity === 'completed') && (
        <section className="analysis-explanation" aria-label="Casos do Insertion Sort">
          <h2>MELHOR CASO</h2>
          <p>Na sequência já ordenada, cada nova carta precisa de apenas uma comparação e nenhum deslocamento.</p>
          <p>Complexidade: O(n).</p>
          <h2>PIOR CASO</h2>
          <p>Na sequência inversa, cada nova carta precisa atravessar toda a região ordenada.</p>
          <p>Complexidade: O(n²).</p>
          <h2>CASO MÉDIO</h2>
          <p>Complexidade: O(n²).</p>
          <p>A organização inicial influencia a quantidade de trabalho: sequências com mais elementos fora de ordem podem exigir mais comparações e deslocamentos.</p>
        </section>
      )}
      {question && (
        <section aria-label="Questão de análise">
          {question === 'shifts' && <p className="analysis-example">[2, 4, 6, 8] | [5]</p>}
          <AnalysisQuestion key={question} question={analysisQuestions[question]} incorrect={flow.incorrect}
            selected={selections?.[question] ?? (onSelect ? '' : undefined)}
            onSelect={onSelect ? (choice) => onSelect(question, choice) : undefined}
            onConfirm={(choice) => dispatch({ type: 'answer', question, choice })} />
        </section>
      )}
      {activity === 'completed' && (
        <section className="round-completion" role="status">
          <p>Correto! O 6 e o 8 precisam avançar uma posição para abrir espaço para o 5.</p>
          <h2>🔎 Análise concluída!</h2>
          <p>Você observou que o trabalho realizado pelo Insertion Sort depende da organização inicial dos elementos.</p>
          <Link className="next-link" to="/challenge">Continuar</Link>
        </section>
      )}
    </div>
  )
}

export default function Analyze() {
  const context = useMatch()
  const [localFlow, localDispatch] = useReducer(analyzeFlowReducer, undefined, createAnalyzeFlow)
  const progress = context?.match?.progress
  const dispatch = (action: AnalyzeAction) => {
    if (!progress) return localDispatch(action)
    if (action.type === 'finish-experiment') context?.dispatch({ type: 'analysis-finish' })
    else context?.dispatch({ type: 'analysis-answer', question: action.question, choice: action.choice })
  }
  return <AnalyzeView flow={progress?.analysis ?? localFlow} dispatch={dispatch}
    selections={progress?.selections}
    onSelect={progress ? (question, choice) => context?.dispatch({ type: 'analysis-select', question, choice }) : undefined} />
}
