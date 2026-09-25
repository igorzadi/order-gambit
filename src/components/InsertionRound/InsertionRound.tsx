import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { InsertionLevel } from '../../game/levels/insertionLevels'
import { useInsertionRound } from '../../hooks/useInsertionRound'
import InsertionDeck from '../InsertionDeck/InsertionDeck'
import Feedback from '../Feedback/Feedback'
import type { InsertionRound as RoundResult } from '../../hooks/insertionRound'
import ProgressBar from '../ProgressBar/ProgressBar'

type CompletionProps = {
  keepAction?: { label: string; alwaysAvailable: boolean }
  currentRegionLabel?: string
  completionContent?: ReactNode
  onComplete?: (result: RoundResult) => void
  onReplay?: () => void
  futureRegionLabel?: string
  completionLabel?: string
}

type InsertionRoundViewProps = CompletionProps & {
  level: InsertionLevel
  round: ReturnType<typeof useInsertionRound>
}

export function InsertionRoundView({ level, round, onComplete, onReplay, futureRegionLabel, currentRegionLabel, keepAction, completionContent, completionLabel = 'Continuar' }: InsertionRoundViewProps) {
  const { state, currentCard, completed, canKeep, keepHere, feedback, attemptInsertion } = round
  const instructions = state.currentIndex > 1 && level.laterInstruction
    ? [level.laterInstruction] : level.instructions


  return (
    <section aria-labelledby="page-title">
      <h1 id="page-title">{level.title}</h1>
      {!completed && (
        <div aria-live="polite">
          {instructions.map((text) => <p key={text}>{text}</p>)}
          {level.helper && <p className="drag-instruction">{level.helper}</p>}
        </div>
      )}
      {round.performance && (
        <ProgressBar completed={round.performance.completedSteps} total={round.performance.insertions.length} />
      )}
      <InsertionDeck
        cards={state.cards}
        sortedUntil={state.sortedUntil}
        currentCard={currentCard}
        onInsert={attemptInsertion}
        showCurrentValue={level.showCurrentValue}
        futureRegionLabel={futureRegionLabel}
        currentRegionLabel={currentRegionLabel}
      />
      <Feedback result={feedback} correctMessage={level.correctFeedback} incorrectMessage={level.incorrectFeedback} />
      {round.operations && (
        <div className="operation-counts" role="status">
          <span>Comparações: {round.operations.comparisons}</span>
          <span>Deslocamentos: {round.operations.shifts}</span>
        </div>
      )}
      {(keepAction?.alwaysAvailable ? !completed && currentCard !== null : canKeep) && (
        <button className="next-link" type="button" onClick={() => {
          if (keepAction?.alwaysAvailable && currentCard) {
            attemptInsertion({ cardId: currentCard.id, targetPosition: state.currentIndex })
          } else keepHere()
        }}>{keepAction?.label ?? 'Manter aqui'}</button>
      )}
      {completed && (
        <div className="round-completion" role="status">
          {completionContent ?? <>
            <p>{level.completion[0]}</p>
            {level.completionHeading && <h2>{level.completionHeading}</h2>}
            {level.completion.slice(1).map((text) => <p key={text}>{text}</p>)}
          </>}
          {level.showComparison && (
            <div className="sequence-comparison">
              <p aria-label="Sequência inicial">{level.cards.map((card) => card.value).join(' ')}</p>
              <span aria-hidden="true">↓</span>
              <p aria-label="Sequência ordenada">{state.cards.map((card) => card.value).join(' ')}</p>
            </div>
          )}
          {round.performance && (
            <dl className="challenge-summary">
              <div><dt>Inserções concluídas</dt><dd>{round.performance.correctInsertions}</dd></div>
              <div><dt>Erros cometidos</dt><dd>{round.performance.incorrectAttempts}</dd></div>
              <div><dt>Pontuação obtida</dt><dd>{round.performance.score}</dd></div>
            </dl>
          )}
          {onComplete
            ? <button type="button" className="next-link" onClick={() => onComplete(round)}>{completionLabel}</button>
            : <Link className="next-link" to={level.nextPath}>{completionLabel}</Link>}
          {onReplay && <button type="button" className="next-link" onClick={onReplay}>REFAZER</button>}
        </div>
      )}
    </section>
  )
}

export default function InsertionRound({ level, trackOperations = false, persistRound = true, ...completion }: CompletionProps & {
  level: InsertionLevel
  trackOperations?: boolean
  persistRound?: boolean
}) {
  const round = useInsertionRound(level.cards, trackOperations, level.trackPerformance, persistRound ? level.id : undefined)
  return <InsertionRoundView level={level} round={round} {...completion} />
}
