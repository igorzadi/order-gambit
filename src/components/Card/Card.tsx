import type { Ref } from 'react'
import type { CardItem } from '../../game/types/CardItem'

export type CardProps = {
  card: CardItem
  ref?: Ref<HTMLButtonElement>
  isDragging?: boolean
  disabled?: boolean
}

export default function Card({ card, ref, isDragging = false, disabled = false }: CardProps) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={`card${isDragging ? ' card--dragging' : ''}`}
      aria-label={`Carta ${card.value}`}
    >
      {card.value}
    </button>
  )
}
