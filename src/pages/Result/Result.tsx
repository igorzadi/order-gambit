import { useNavigate } from 'react-router'
import { useMatch } from '../../context/matchState'
import { totalScore } from '../../game/session/match'
import type { Match } from '../../game/session/match'

const phaseNames = { experiment: 'Experimente', discover: 'Descubra', practice: 'Pratique', analyze: 'Analise', challenge: 'Desafio' }

export function ResultView({ match, onRestart }: { match: Match; onRestart: () => void }) {
  const performance = match.progress.rounds.challenge.performance
  if (!match.progress.completed || !performance?.completed) return null
  return (
    <section aria-labelledby="page-title">
      <h1 id="page-title">🏆 Desafio concluído!</h1>
      <p>{match.saved.playerName}, sua partida foi concluída.</p>
      <h2>Fases concluídas</h2>
      <ul>{match.progress.completedPhases.map((phase) => <li key={phase}>{phaseNames[phase]}</li>)}</ul>
      <dl className="challenge-summary">
        <div><dt>Pontuação</dt><dd>{totalScore(match)}</dd></div>
        <div><dt>Inserções corretas</dt><dd>{performance.correctInsertions}</dd></div>
        <div><dt>Erros cometidos</dt><dd>{performance.incorrectAttempts}</dd></div>
      </dl>
      <p>No Insertion Sort, construímos uma região ordenada progressivamente, inserindo cada novo elemento em sua posição correta.</p>
      <figure className="result-example">
        <figcaption>Uma inserção por vez: parte ordenada | cartas restantes</figcaption>
        {['8 | 3 6 2 5', '3 8 | 6 2 5', '3 6 8 | 2 5', '2 3 6 8 | 5', '2 3 5 6 8'].map((step, index) => (
          <div key={step}>{index > 0 && <div aria-hidden="true">↓</div>}<p>{step}</p></div>
        ))}
      </figure>
      <button className="next-link" type="button" onClick={onRestart}>Jogar novamente</button>
    </section>
  )
}
export default function Result() {
  const context = useMatch()
  const navigate = useNavigate()
  if (!context?.match) return null
  return <ResultView match={context.match} onRestart={() => {
    context.restart()
    navigate('/', { replace: true })
  }} />
}
