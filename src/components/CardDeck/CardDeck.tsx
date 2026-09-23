import { DragDropProvider } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import { move } from '@dnd-kit/helpers'
import type { CardItem } from '../../game/types/CardItem'
import Card from '../Card/Card'

export type CardDeckProps = {
  cards: readonly CardItem[]
  disabled?: boolean
  onChange: (cards: CardItem[]) => void
}

function SortableCard({ card, index, disabled }: { card: CardItem; index: number; disabled: boolean }) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: card.id,
    index,
    disabled,
    transition: null,
  })

  return (
    <li ref={ref} className="card-slot">
      <Card disabled={disabled} card={card} ref={handleRef} isDragging={isDragSource} />
    </li>
  )
}

export default function CardDeck({ cards, onChange, disabled = false }: CardDeckProps) {
  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled || disabled) return

        // dnd-kit previews the order during dragging; commit it on release.
        const nextCards = move([...cards], event)
        if (nextCards.some((card, index) => card.id !== cards[index].id)) {
          onChange(nextCards)
        }
      }}
    >
      <ul className="card-deck" aria-label="Cartas reordenáveis">
        {cards.map((card, index) => (
          <SortableCard disabled={disabled} key={card.id} card={card} index={index} />
        ))}
      </ul>
    </DragDropProvider>
  )
}
