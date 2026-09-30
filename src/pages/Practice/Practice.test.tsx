import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import Practice from './Practice'
import { practiceLevel } from '../../game/levels/insertionLevels'
import { createInsertionState } from '../../game/engine'
import { insertionRoundReducer } from '../../hooks/insertionRound'
import type { InsertionRound } from '../../hooks/insertionRound'

describe('decisão de manter posição na Pratique', () => {
  it('oferece a ação desde a primeira carta, sem revelar sua validade no rótulo', () => {
    const html = renderToStaticMarkup(<MemoryRouter><Practice /></MemoryRouter>)
    expect(html).toContain('MANTER POSIÇÃO</button>')
    expect(html).toContain('<h2>CARTA DA VEZ</h2>')
    expect(html).not.toContain('CARTA DA VEZ:')
  })

  it('valida manter somente após a tentativa e permite corrigir a decisão', () => {
    const initial: InsertionRound = { state: createInsertionState(practiceLevel.cards), feedback: null }
    const wrong = insertionRoundReducer(initial, { cardId: practiceLevel.cards[1].id, targetPosition: 1 })
    expect(wrong.state).toBe(initial.state)
    expect(wrong.feedback).toBe('incorrect')
    const inserted = insertionRoundReducer(wrong, { cardId: practiceLevel.cards[1].id, targetPosition: 0 })
    const kept = insertionRoundReducer(inserted, { cardId: practiceLevel.cards[2].id, targetPosition: 2 })
    expect(kept.state.cards).toEqual(inserted.state.cards)
    expect(kept.state.currentIndex).toBe(3)
    expect(kept.feedback).toBe('correct')
  })
})
