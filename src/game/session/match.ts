import { createInsertionState } from '../engine'
import { discoverLevel, practiceLevel, challengeLevel } from '../levels/insertionLevels'
import { analyzeLevels, analysisQuestions } from '../levels/analyzeLevels'
import { createChallengePerformance } from '../scoring/challengePerformance'
import { insertionRoundReducer } from '../../hooks/insertionRound'
import type { InsertionRound, InsertionAttempt } from '../../hooks/insertionRound'
import { analyzeFlowReducer, createAnalyzeFlow } from '../../pages/Analyze/analyzeFlow'
import type { AnalyzeFlow } from '../../pages/Analyze/analyzeFlow'
import type { CardItem } from '../types/CardItem'

export const phases = ['experiment', 'discover', 'practice', 'analyze', 'challenge'] as const
export type Phase = typeof phases[number]
export type CurrentPhase = 'home' | 'intro' | Phase | 'result'
export const roundLevels = {
  discover: discoverLevel, practice: practiceLevel, challenge: challengeLevel,
  'analyze-ordered': analyzeLevels.ordered, 'analyze-reversed': analyzeLevels.reversed,
}
export type RoundId = keyof typeof roundLevels
export type QuestionId = 'comparison' | 'shifts'
export type MatchEvent =
  | { type: 'intro-complete' }
  | { type: 'experiment-order'; ids: string[] }
  | { type: 'insertion'; roundId: RoundId; attempt: InsertionAttempt }
  | { type: 'analysis-finish' }
  | { type: 'analysis-select'; question: QuestionId; choice: string }
  | { type: 'analysis-answer'; question: QuestionId; choice: string }

export type SavedMatch = {
  version: 1
  id: string
  playerName: string
  startedAt: string
  events: MatchEvent[]
}
export type MatchProgress = {
  currentPhase: CurrentPhase
  completedPhases: Phase[]
  completed: boolean
  experiment: CardItem[]
  rounds: Record<RoundId, InsertionRound>
  analysis: AnalyzeFlow
  selections: Partial<Record<QuestionId, string>>
}
export type Match = { saved: SavedMatch; progress: MatchProgress }

function initialProgress(playerName: string): MatchProgress {
  const rounds = Object.fromEntries(Object.entries(roundLevels).map(([id, level]) => [id, {
    state: createInsertionState(level.cards), feedback: null,
    ...(id.startsWith('analyze-') ? { operations: { comparisons: 0, shifts: 0 } } : {}),
    ...(id === 'challenge' ? { performance: createChallengePerformance(level.cards) } : {}),
  }])) as Record<RoundId, InsertionRound>
  return {
    currentPhase: playerName ? 'experiment' : 'home', completedPhases: [], completed: false,
    experiment: [7, 3, 9, 5, 2].map((value, index) => ({ id: `card-${index + 1}`, value })),
    rounds, analysis: createAnalyzeFlow(), selections: {},
  }
}

export function createMatch(id: string, startedAt: string, playerName = ''): Match {
  return {
    saved: { version: 1, id, startedAt, playerName: playerName.trim(), events: [] },
    progress: initialProgress(playerName.trim()),
  }
}

function finishPhase(progress: MatchProgress, phase: Phase): MatchProgress {
  const index = phases.indexOf(phase)
  return {
    ...progress, completedPhases: [...progress.completedPhases, phase],
    currentPhase: phases[index + 1] ?? 'result', completed: phase === 'challenge',
  }
}

export function activeRoundId(progress: MatchProgress): RoundId | null {
  const phase = progress.currentPhase
  if (phase === 'discover' || phase === 'practice' || phase === 'challenge') return phase
  if (phase === 'analyze') {
    if (progress.analysis.activity === 'ordered') return 'analyze-ordered'
    if (progress.analysis.activity === 'reversed') return 'analyze-reversed'
  }
  return null
}

function applyEvent(progress: MatchProgress, event: MatchEvent): MatchProgress {
  if (event.type === 'intro-complete') {
    return progress.currentPhase === 'intro' ? { ...progress, currentPhase: 'experiment' } : progress
  }
  if (event.type === 'experiment-order') {
    if (progress.currentPhase !== 'experiment') return progress
    const cards = progress.experiment
    if (event.ids.length !== cards.length || new Set(event.ids).size !== cards.length
      || event.ids.some((id) => !cards.some((card) => card.id === id))) return progress
    if (event.ids.every((id, index) => cards[index].id === id)) return progress
    const experiment = event.ids.map((id) => cards.find((card) => card.id === id)!)
    const next = { ...progress, experiment }
    return experiment.every((card, i) => i === 0 || experiment[i - 1].value <= card.value)
      ? finishPhase(next, 'experiment') : next
  }
  if (event.type === 'insertion') {
    if (event.roundId !== activeRoundId(progress)) return progress
    const before = progress.rounds[event.roundId]
    if (before.state.completed) return progress
    const round = insertionRoundReducer(before, event.attempt)
    if (round === before) return progress
    const next = { ...progress, rounds: { ...progress.rounds, [event.roundId]: round } }
    if (round.state.completed && !event.roundId.startsWith('analyze-')) {
      return finishPhase(next, event.roundId as Phase)
    }
    return next
  }
  if (progress.currentPhase !== 'analyze') return progress
  if (event.type === 'analysis-finish') {
    const id = activeRoundId(progress)
    if (!id) return progress
    const analysis = analyzeFlowReducer(progress.analysis, { type: 'finish-experiment', result: progress.rounds[id] })
    return analysis === progress.analysis ? progress : { ...progress, analysis }
  }
  if (progress.analysis.activity !== event.question) return progress
  if (!analysisQuestions[event.question].choices.some((choice) => choice.id === event.choice)) return progress
  if (event.type === 'analysis-select') {
    return { ...progress, selections: { ...progress.selections, [event.question]: event.choice } }
  }
  const analysis = analyzeFlowReducer(progress.analysis, { type: 'answer', question: event.question, choice: event.choice })
  const next = { ...progress, analysis, selections: { ...progress.selections, [event.question]: event.choice } }
  return analysis.activity === 'completed' ? finishPhase(next, 'analyze') : next
}

export function updateMatch(match: Match, event: MatchEvent): Match {
  const progress = applyEvent(match.progress, event)
  return progress === match.progress ? match : {
    saved: { ...match.saved, events: [...match.saved.events, event] }, progress,
  }
}

export function phasePath(phase: CurrentPhase): string {
  return phase === 'home' ? '/' : `/${phase}`
}

export function canAccessPhase(match: Match | null, phase: CurrentPhase): boolean {
  if (phase === 'home') return true
  if (!match || !match.saved.playerName) return false
  if (phase === 'intro') return true
  return match.progress.currentPhase === phase || match.progress.completedPhases.includes(phase as Phase)
}

export function totalScore(match: Match): number {
  return match.progress.rounds.challenge.performance?.score ?? 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function isEvent(value: unknown): value is MatchEvent {
  if (!isRecord(value)) return false
  switch (value.type) {
    case 'intro-complete': case 'analysis-finish': return true
    case 'experiment-order': return Array.isArray(value.ids) && value.ids.every((id) => typeof id === 'string')
    case 'insertion': return typeof value.roundId === 'string' && Object.hasOwn(roundLevels, value.roundId)
      && isRecord(value.attempt) && typeof value.attempt.cardId === 'string'
      && Number.isSafeInteger(value.attempt.targetPosition)
    case 'analysis-select': case 'analysis-answer': return (value.question === 'comparison' || value.question === 'shifts')
      && typeof value.choice === 'string'
    default: return false
  }
}

/** Rebuilds every derived field with the engine; never trusts stored scores or state. */
export function restoreMatch(value: unknown): Match | null {
  if (!isRecord(value) || value.version !== 1 || typeof value.id !== 'string' || !value.id
    || typeof value.playerName !== 'string' || value.playerName.length > 60
    || value.playerName !== value.playerName.trim()
    || typeof value.startedAt !== 'string' || !Number.isFinite(Date.parse(value.startedAt))
    || !Array.isArray(value.events) || value.events.length > 10000) return null
  let match = createMatch(value.id, value.startedAt, value.playerName)
  try {
    for (const event of value.events) {
      if (!isEvent(event)) return null
      // Older saves include the introduction that is now skipped.
      if (event.type === 'intro-complete' && match.progress.currentPhase === 'experiment') continue
      const next = updateMatch(match, event)
      if (next === match) return null
      match = next
    }
  } catch { return null }
  return match
}
