import { useState } from 'react'
import { useMatch } from '../../context/matchState'
import { Link } from 'react-router'
import CardDeck from '../../components/CardDeck/CardDeck'
import type { CardItem } from '../../game/types/CardItem'

export default function Experiment() {
  const context = useMatch()
  const [localCards, setLocalCards] = useState<CardItem[]>(() =>
    [7, 3, 9, 5, 2].map((value, index) => ({ id: `card-${index + 1}`, value })),
  )
  const cards = context?.match?.progress.experiment ?? localCards
  const setCards = (next: CardItem[]) => {
    if (context?.match) context.dispatch({ type: 'experiment-order', ids: next.map((card) => card.id) })
    else setLocalCards(next)
  }
  const isComplete = cards.every(
    (card, index) => index === 0 || cards[index - 1].value <= card.value,
  )

  return (
    <section aria-labelledby="page-title">
      <h1 id="page-title">🃏 Experimente</h1>
      <p>Você recebeu algumas cartas. Organize-as do menor para o maior.</p>
      <p>Arraste uma carta até a posição desejada. No celular, toque e segure antes de arrastar.</p>
      <CardDeck disabled={context?.match?.progress.completedPhases.includes('experiment')} cards={cards} onChange={setCards} />
      <div aria-live="polite" aria-atomic="true">
        {isComplete && (
          <div className="experiment-feedback">
            <h2>✓ Muito bem!</h2>
            <p>Você encontrou uma maneira de organizar as cartas.</p>
            <p>Mas existe uma estratégia para fazer isso passo a passo. Vamos descobri-la?</p>
            <Link className="next-link" to="/discover">Continuar</Link>
          </div>
        )}
      </div>
    </section>
  )
}
