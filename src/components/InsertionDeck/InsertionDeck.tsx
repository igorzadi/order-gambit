import { DragDropProvider, useDraggable, useDroppable } from '@dnd-kit/react'
import type { CardItem } from '../../game/types/CardItem'
import Card from '../Card/Card'

type InsertionDeckProps = {
  cards: readonly CardItem[]
  sortedUntil: number
  currentCard: Readonly<CardItem> | null
  currentRegionLabel?: string
  showCurrentValue?: boolean
  futureRegionLabel?: string
  onInsert: (attempt: { cardId: string; targetPosition: number }) => void
}

function InsertionSlot({ position }: { position: number }) {
  const { ref, isDropTarget } = useDroppable({
    id: `insertion-position-${position}`,
    data: { position },
  })

  return (
    <div
      ref={ref}
      className={`insertion-slot${isDropTarget ? ' insertion-slot--over' : ''}`}
      aria-label={`Inserir na posição ${position + 1}`}
    >
      <span aria-hidden="true">↓</span>
    </div>
  )
}

function CurrentCard({ card }: { card: CardItem }) {
  const { ref, isDragSource } = useDraggable({ id: card.id })
  return <Card ref={ref} card={card} isDragging={isDragSource} />
}

export default function InsertionDeck({ cards, sortedUntil, currentCard, onInsert, showCurrentValue = false, futureRegionLabel = 'Ainda não processadas', currentRegionLabel = 'Carta atual' }: InsertionDeckProps) {
  const sortedCards = cards.slice(0, sortedUntil + 1)
  const futureCards = cards.slice(sortedUntil + 2)
  const sortedItems = sortedCards.flatMap((card, index) => [
    ...(currentCard ? [<InsertionSlot key={`slot-${index}`} position={index} />] : []),
    <Card key={`card-${card.id}`} card={card} disabled />,
  ])
  if (currentCard) {
    sortedItems.push(<InsertionSlot key={`slot-${sortedCards.length}`} position={sortedCards.length} />)
  }

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled) return
        const { source, target } = event.operation
        if (!source) return
        const position: unknown = target?.data.position
        onInsert({
          cardId: String(source.id),
          targetPosition: typeof position === 'number' ? position : -1,
        })
      }}
    >
      <div className="insertion-deck">
        <section className="card-region card-region--sorted" aria-label="Parte ordenada">
          <h2>Parte ordenada</h2>
          <div className="insertion-row">
            {sortedItems}
          </div>
        </section>
        {currentCard && (
          <section className="card-region card-region--current" aria-label={currentRegionLabel}>
            <h2>{currentRegionLabel}{showCurrentValue ? `: ${currentCard.value}` : ''}</h2>
            <CurrentCard key={currentCard.id} card={currentCard} />
          </section>
        )}
        {currentCard && futureCards.length > 0 && (
          <section className="card-region card-region--future" aria-label={futureRegionLabel}>
            <h2>{futureRegionLabel}</h2>
            <div className="insertion-row">
              {futureCards.map((card) => <Card key={card.id} card={card} disabled />)}
            </div>
          </section>
        )}
      </div>
    </DragDropProvider>
  )
}
