import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createMatch, updateMatch, restoreMatch, canAccessPhase, totalScore, activeRoundId, phasePath } from './match'
import type { Match, MatchEvent, RoundId } from './match'
import { loadMatch, saveMatch, clearMatch, MATCH_STORAGE_KEY } from '../../services/matchStorage'
import type { MatchStorage } from '../../services/matchStorage'
import { ResultView } from '../../pages/Result/Result'

const start = () => createMatch('match-1', '2026-09-23T12:00:00.000Z', ' Ana ')
const send = (match: Match, event: MatchEvent) => updateMatch(match, event)
function insertion(match: Match, roundId: RoundId, position: number) {
  return send(match, { type: 'insertion', roundId, attempt: {
    cardId: match.progress.rounds[roundId].state.currentCard!.id, targetPosition: position,
  } })
}
function finishRound(match: Match, id: RoundId) {
  let next = match
  for (let step = 0; step < 6; step += 1) {
    const state = next.progress.rounds[id].state
    if (state.completed) break
    next = insertion(next, id, state.expectedPosition!)
  }
  return next
}
function reachDiscover() {
  const intro = send(start(), { type: 'intro-complete' })
  return send(intro, { type: 'experiment-order', ids: ['card-5', 'card-2', 'card-4', 'card-1', 'card-3'] })
}
function reachAnalyze() { return finishRound(finishRound(reachDiscover(), 'discover'), 'practice') }
function reachComparison() {
  let match = finishRound(reachAnalyze(), 'analyze-ordered')
  match = send(match, { type: 'analysis-finish' })
  match = finishRound(match, 'analyze-reversed')
  return send(match, { type: 'analysis-finish' })
}
function reachChallenge() {
  let match = send(reachComparison(), { type: 'analysis-answer', question: 'comparison', choice: 'b' })
  match = send(match, { type: 'analysis-answer', question: 'shifts', choice: 'c' })
  return match
}
function memoryStorage(): MatchStorage {
  const data = new Map<string, string>()
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value) }, removeItem: (key) => { data.delete(key) } }
}
function roundTrip(match: Match) {
  const storage = memoryStorage()
  expect(saveMatch(storage, match)).toBe(true)
  const result = loadMatch(storage)
  expect(result.error).toBeNull()
  expect(result.match).toEqual(match)
  return result.match!
}

describe('partida integrada', () => {
  it('cria identidade, jogador e data sem antecipar conclusões', () => {
    const match = start()
    expect(match.saved).toMatchObject({ id: 'match-1', playerName: 'Ana', startedAt: '2026-09-23T12:00:00.000Z' })
    expect(match.progress.currentPhase).toBe('experiment')
    expect(match.progress.completedPhases).toEqual([])
    expect(totalScore(match)).toBe(0)
    expect(match.progress.completed).toBe(false)
  })

  it('bloqueia acesso sem partida e fases não liberadas', () => {
    expect(canAccessPhase(null, 'home')).toBe(true)
    expect(canAccessPhase(null, 'intro')).toBe(false)
    const match = start()
    expect(canAccessPhase(match, 'intro')).toBe(true)
    for (const phase of ['discover', 'practice', 'analyze', 'challenge', 'result'] as const) {
      expect(canAccessPhase(match, phase)).toBe(false)
    }
    expect(phasePath(match.progress.currentPhase)).toBe('/experiment')
    expect(phasePath('home')).toBe('/')
    expect(match.progress.completedPhases).toEqual([])
  })

  it('libera Experiment diretamente após informar o nome', () => {
    const match = roundTrip(start())
    expect(match.progress.currentPhase).toBe('experiment')
    expect(canAccessPhase(match, 'experiment')).toBe(true)
    expect(canAccessPhase(match, 'discover')).toBe(false)
    expect(match.progress.completedPhases).toEqual([])
  })

  it('preserva partidas antigas que concluíram a introdução', () => {
    const legacy = { ...start().saved, events: [{ type: 'intro-complete' }] }
    expect(restoreMatch(legacy)?.progress.currentPhase).toBe('experiment')
  })

  it('retoma a ordem parcial de Experiment e registra apenas a conclusão real', () => {
    let match = send(start(), { type: 'intro-complete' })
    match = send(match, { type: 'experiment-order', ids: ['card-2', 'card-1', 'card-3', 'card-4', 'card-5'] })
    match = roundTrip(match)
    expect(match.progress.experiment.map((card) => card.value)).toEqual([3, 7, 9, 5, 2])
    expect(match.progress.completedPhases).toEqual([])
    match = send(match, { type: 'experiment-order', ids: ['card-5', 'card-2', 'card-4', 'card-1', 'card-3'] })
    expect(match.progress.currentPhase).toBe('discover')
    expect(match.progress.completedPhases).toEqual(['experiment'])
  })

  it('não aceita IDs ausentes ou repetidos na ordenação livre', () => {
    const match = send(start(), { type: 'intro-complete' })
    expect(send(match, { type: 'experiment-order', ids: ['card-1'] })).toBe(match)
    expect(send(match, { type: 'experiment-order', ids: Array(5).fill('card-1') })).toBe(match)
  })

  it('retoma Discover parcialmente sem duplicar a carta processada', () => {
    const match = roundTrip(insertion(reachDiscover(), 'discover', 0))
    expect(match.progress.rounds.discover.state.currentCard?.value).toBe(6)
    expect(match.progress.rounds.discover.state.cards.map((card) => card.value)).toEqual([3, 8, 6, 2, 5])
    expect(match.progress.currentPhase).toBe('discover')
  })

  it('retoma Practice no passo Manter aqui', () => {
    const match = roundTrip(insertion(finishRound(reachDiscover(), 'discover'), 'practice', 0))
    const state = match.progress.rounds.practice.state
    expect(state.currentCard?.value).toBe(8)
    expect(state.expectedPosition).toBe(state.currentIndex)
    expect(activeRoundId(match.progress)).toBe('practice')
  })

  it('preserva operações e resultados de Analyze entre atualizações', () => {
    let match = insertion(reachAnalyze(), 'analyze-ordered', 1)
    match = roundTrip(match)
    expect(match.progress.rounds['analyze-ordered'].operations).toEqual({ comparisons: 1, shifts: 0 })
    match = send(finishRound(match, 'analyze-ordered'), { type: 'analysis-finish' })
    match = insertion(match, 'analyze-reversed', 0)
    match = roundTrip(match)
    expect(match.progress.analysis.results.ordered).toEqual({ comparisons: 4, shifts: 0 })
    expect(match.progress.rounds['analyze-reversed'].operations).toEqual({ comparisons: 1, shifts: 1 })
  })

  it('preserva seleção pendente e feedback incorreto de Analyze', () => {
    let match = send(reachComparison(), { type: 'analysis-select', question: 'comparison', choice: 'a' })
    match = roundTrip(match)
    expect(match.progress.selections.comparison).toBe('a')
    expect(match.progress.analysis.activity).toBe('comparison')
    match = send(match, { type: 'analysis-answer', question: 'comparison', choice: 'a' })
    match = roundTrip(match)
    expect(match.progress.analysis.incorrect).toBe(true)
    expect(canAccessPhase(match, 'challenge')).toBe(false)
  })

  it('exige ambas as respostas para concluir Analyze', () => {
    let match = send(reachComparison(), { type: 'analysis-answer', question: 'comparison', choice: 'b' })
    match = roundTrip(match)
    expect(match.progress.analysis.activity).toBe('shifts')
    expect(canAccessPhase(match, 'challenge')).toBe(false)
    match = send(match, { type: 'analysis-answer', question: 'shifts', choice: 'c' })
    expect(match.progress.currentPhase).toBe('challenge')
    expect(match.progress.completedPhases).toContain('analyze')
  })

  it('preserva erros e pontos do Challenge e ignora inserções já pontuadas', () => {
    let match = insertion(reachChallenge(), 'challenge', 1)
    match = roundTrip(match)
    expect(match.progress.rounds.challenge.performance?.incorrectAttempts).toBe(1)
    match = insertion(match, 'challenge', 0)
    match = roundTrip(match)
    expect(totalScore(match)).toBe(75)
    const duplicate = send(match, { type: 'insertion', roundId: 'challenge', attempt: { cardId: 'challenge-card-2', targetPosition: 0 } })
    expect(duplicate).toBe(match)
    const result = roundTrip(finishRound(match, 'challenge'))
    expect(result.progress.completed).toBe(true)
    expect(totalScore(result)).toBe(475)
    expect(result.progress.rounds.challenge.performance?.insertions[0].attempts).toBe(2)
  })

  it('conclui as cinco fases e mantém o resultado após recarregar', () => {
    const match = roundTrip(finishRound(reachChallenge(), 'challenge'))
    expect(match.progress.completedPhases).toEqual(['experiment', 'discover', 'practice', 'analyze', 'challenge'])
    expect(match.progress.currentPhase).toBe('result')
    expect(canAccessPhase(match, 'result')).toBe(true)
    expect(canAccessPhase(match, 'discover')).toBe(true)
    expect(totalScore(match)).toBe(500)
    const html = renderToStaticMarkup(<ResultView match={match} onRestart={() => {}} />)
    expect(html).toContain('Ana, sua partida foi concluída.')
    expect(html).toContain('500')
    expect(html).toContain('8 | 3 6 2 5')
    expect(html).toContain('2 3 5 6 8')
    expect(html).toContain('Jogar novamente')
  })

  it('não exibe resultado de uma partida incompleta', () => {
    expect(renderToStaticMarkup(<ResultView match={start()} onRestart={() => {}} />)).toBe('')
  })

  it('não registra eventos de fases anteriores ou futuras', () => {
    const match = reachDiscover()
    expect(send(match, { type: 'insertion', roundId: 'challenge', attempt: { cardId: 'challenge-card-2', targetPosition: 0 } })).toBe(match)
    expect(send(match, { type: 'experiment-order', ids: ['card-1', 'card-2', 'card-3', 'card-4', 'card-5'] })).toBe(match)
    expect(send(match, { type: 'analysis-finish' })).toBe(match)
  })

  it('salva somente metadados e eventos, sem estados derivados nem pontuação duplicada', () => {
    const storage = memoryStorage()
    saveMatch(storage, insertion(reachChallenge(), 'challenge', 0))
    const raw = JSON.parse(storage.getItem(MATCH_STORAGE_KEY)!)
    expect(Object.keys(raw).sort()).toEqual(['events', 'id', 'playerName', 'startedAt', 'version'])
    expect(JSON.stringify(raw)).not.toContain('expectedPosition')
    expect(JSON.stringify(raw)).not.toContain('performance')
    expect(JSON.stringify(raw)).not.toContain('score')
  })

  it('limpa o registro anterior e reinicia com nova identidade e pontuação zero', () => {
    const storage = memoryStorage()
    const previous = finishRound(reachChallenge(), 'challenge')
    saveMatch(storage, previous)
    expect(clearMatch(storage)).toBe(true)
    expect(loadMatch(storage).match).toBeNull()
    const fresh = createMatch('match-2', '2026-09-23T13:00:00.000Z')
    saveMatch(storage, fresh)
    const recovered = loadMatch(storage).match!
    expect(recovered.saved.id).not.toBe(previous.saved.id)
    expect(recovered.progress.currentPhase).toBe('home')
    expect(recovered.saved.playerName).toBe('')
    expect(recovered.progress.completedPhases).toEqual([])
    expect(totalScore(recovered)).toBe(0)
    expect(canAccessPhase(recovered, 'result')).toBe(false)
  })

  it.each([null, {}, { ...start().saved, version: 2 }, { ...start().saved, startedAt: 'invalid' },
    { ...start().saved, events: [{ type: 'unknown' }] },
    { ...start().saved, events: [{ type: 'insertion', roundId: 'challenge', attempt: { cardId: 'x', targetPosition: 0 } }] },
  ])('rejeita registros inválidos %#', (value) => {
    expect(restoreMatch(value)).toBeNull()
  })

  it('reporta JSON corrompido e permite sobrescrever com nova partida', () => {
    const storage = memoryStorage()
    storage.setItem(MATCH_STORAGE_KEY, '{invalid')
    expect(loadMatch(storage).error).not.toBeNull()
    expect(loadMatch(storage).match).toBeNull()
    expect(saveMatch(storage, start())).toBe(true)
    expect(loadMatch(storage).error).toBeNull()
  })

  it('trata armazenamento indisponível sem lançar exceção', () => {
    const storage = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('quota') },
      removeItem: () => { throw new Error('blocked') },
    }
    expect(loadMatch(storage).match).toBeNull()
    expect(saveMatch(storage, start())).toBe(false)
    expect(clearMatch(storage)).toBe(false)
  })
})
