import { practiceLevel } from './insertionLevels'
import type { InsertionLevel } from './insertionLevels'

export const analyzeLevels: Record<'ordered' | 'reversed', InsertionLevel> = {
  ordered: {
    ...practiceLevel,
    id: 'analyze-ordered',
    title: 'Experimento A — Sequência ordenada',
    cards: [1, 2, 3, 4, 5].map((value, index) => ({ id: `ordered-${index}`, value })),
    instructions: ['Execute o Insertion Sort e observe as operações realizadas.'],
    completion: ['Experimento A concluído.'],
    showComparison: false,
  },
  reversed: {
    ...practiceLevel,
    id: 'analyze-reversed',
    title: 'Experimento B — Sequência inversa',
    cards: [5, 4, 3, 2, 1].map((value, index) => ({ id: `reversed-${index}`, value })),
    instructions: ['Execute novamente o Insertion Sort e observe as operações realizadas.'],
    completion: ['Experimento B concluído.'],
    showComparison: false,
  },
}

export type AnalysisQuestion = {
  prompt: string
  choices: readonly { id: string; label: string }[]
  answer: string
  incorrect: string
}

export const analysisQuestions: Record<'comparison' | 'shifts', AnalysisQuestion> = {
  comparison: {
    prompt: 'Qual situação exigiu mais trabalho?',
    choices: [
      { id: 'a', label: 'A) Sequência já ordenada.' },
      { id: 'b', label: 'B) Sequência em ordem inversa.' },
      { id: 'c', label: 'C) Exatamente a mesma quantidade.' },
    ],
    answer: 'b',
    incorrect: 'Observe os números de comparações e deslocamentos dos dois experimentos.',
  },
  shifts: {
    prompt: 'Para inserir o 5 corretamente, quais valores da região ordenada precisam ser deslocados?',
    choices: [
      { id: 'a', label: 'A) Somente 2.' },
      { id: 'b', label: 'B) 2 e 4.' },
      { id: 'c', label: 'C) 6 e 8.' },
      { id: 'd', label: 'D) Todos.' },
    ],
    answer: 'c',
    incorrect: 'Observe quais cartas são maiores que 5 e estão na região ordenada.',
  },
}
