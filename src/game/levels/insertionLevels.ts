import type { CardItem } from '../types/CardItem'

export type InsertionLevel = {
  id: string
  title: string
  cards: readonly CardItem[]
  instructions: readonly string[]
  laterInstruction?: string
  helper: string
  showCurrentValue: boolean
  correctFeedback: string
  incorrectFeedback: string
  completion: readonly string[]
  completionHeading?: string
  showComparison: boolean
  nextPath: string
  trackPerformance?: boolean
}

export const discoverLevel: InsertionLevel = {
  id: 'discover',
  title: '💡 Descubra',
  cards: [8, 3, 6, 2, 5].map((value, index) => ({ id: `discover-card-${index + 1}`, value })),
  instructions: [
    'A primeira carta já pode ser considerada ordenada.',
    'Agora observe a próxima carta.',
    'Onde o 3 deve ser inserido para manter a parte esquerda ordenada?',
  ],
  laterInstruction: 'Insira a próxima carta na posição correta.',
  helper: 'Arraste a carta atual para um espaço com ↓ na parte ordenada. No celular, toque e segure antes de arrastar.',
  showCurrentValue: false,
  correctFeedback: '✓ Exatamente. A parte ordenada cresceu.',
  incorrectFeedback: 'Tente novamente.',
  completion: [
    'Você acabou de executar um algoritmo de ordenação.',
    'O Insertion Sort percorre os elementos e insere cada novo elemento na posição correta da parte que já está ordenada.',
    'É semelhante a organizar cartas na mão: recebemos uma nova carta, procuramos sua posição e a inserimos entre as cartas já organizadas.',
  ],
  completionHeading: 'Insertion Sort',
  showComparison: false,
  nextPath: '/practice',
}

export const practiceLevel: InsertionLevel = {
  id: 'practice',
  title: '🎯 Pratique',
  cards: [7, 4, 8, 3, 6, 2].map((value, index) => ({ id: `practice-card-${index + 1}`, value })),
  instructions: ['Agora é sua vez. Execute o Insertion Sort.'],
  helper: 'Observe a carta atual e insira-a na posição correta da região já ordenada.',
  showCurrentValue: true,
  correctFeedback: '',
  incorrectFeedback: 'A carta precisa ser inserida de modo que toda a região à esquerda continue ordenada.',
  completion: ['🎯 Você executou um Insertion Sort completo.'],
  showComparison: true,
  nextPath: '/analyze',
}

export const challengeLevel: InsertionLevel = {
  id: 'challenge',
  title: '🏆 Desafio Final',
  cards: [6, 2, 7, 4, 1, 5].map((value, index) => ({ id: `challenge-card-${index + 1}`, value })),
  instructions: ['Agora é com você. Execute corretamente o Insertion Sort.'],
  helper: '',
  showCurrentValue: true,
  correctFeedback: '✓ Inserção correta!',
  incorrectFeedback: 'Essa inserção não mantém a região ordenada. Tente novamente.',
  completion: [
    '🏆 Desafio concluído!',
    'No Insertion Sort, construímos uma região ordenada progressivamente, inserindo cada novo elemento em sua posição correta.',
  ],
  showComparison: true,
  nextPath: '/result',
  trackPerformance: true,
}
