import { useState } from 'react'
import { useMatch } from '../../context/matchState'
import { Link } from 'react-router'
import CardDeck from '../../components/CardDeck/CardDeck'
import type { CardItem } from '../../game/types/CardItem'
import { Hand } from 'lucide-react'
import cardsExplosion from '../../assets/experiment/cards-explosion.png'
import './experiment.css'

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
    <section className="experiment-noir" aria-labelledby="page-title">
      <div className="experiment-art" aria-hidden="true"><img src={cardsExplosion} alt="" draggable={false} width="1536" height="1024" /></div>
      <div className="experiment-content">
        <p className="experiment-eyebrow"><span aria-hidden="true">♠</span> Fase 1</p>
        <h1 id="page-title">Experimente</h1>
        <div className="experiment-panel experiment-brief">
          <p>VOCÊ RECEBEU ALGUMAS CARTAS.<span>ORGANIZE-AS DO MENOR PARA O MAIOR.</span></p>
        </div>
        <div className="experiment-table">
          <CardDeck disabled={context?.match?.progress.completedPhases.includes('experiment')} cards={cards} onChange={setCards} />
        </div>
        <section className="experiment-panel experiment-gesture" aria-labelledby="experiment-how-to">
          <Hand aria-hidden="true" size={48} strokeWidth={1.5} />
          <div>
            <h2 id="experiment-how-to">COMO JOGAR</h2>
            <p>Arraste uma carta até a posição desejada.</p>
            <p>No celular, toque e segure antes de arrastar.</p>
          </div>
        </section>
        <div aria-live="polite" aria-atomic="true">
          {isComplete && (
            <div className="experiment-panel experiment-feedback">
              <h2>✓ Muito bem!</h2>
              <p className="experiment-completion-explanation">Você encontrou uma maneira de organizar as cartas.</p>
              <div className="experiment-completion-next"><p>Mas existe uma estratégia para fazer isso passo a passo. Vamos descobri-la?</p></div>
              <Link className="next-link" to="/discover">Continuar</Link>
            </div>
          )}
        </div>
        <footer className="experiment-footer" aria-hidden="true">
          <span>“Boas jogadas sempre revelam<br />uma estratégia.”</span>
        </footer>
      </div>
    </section>
  )
}
