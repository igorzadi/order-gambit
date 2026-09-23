import { useId, useState } from 'react'
import type { AnalysisQuestion as Question } from '../../game/levels/analyzeLevels'

type Props = {
  question: Question
  incorrect: boolean
  selected?: string
  onSelect?: (choice: string) => void
  onConfirm: (choice: string) => void
}

export default function AnalysisQuestion({ question, incorrect, onConfirm, selected: controlledSelection, onSelect }: Props) {
  const [localSelection, setLocalSelection] = useState('')
  const selected = controlledSelection ?? localSelection
  const setSelected = (choice: string) => {
    if (onSelect) onSelect(choice)
    else setLocalSelection(choice)
  }
  const name = useId()
  return (
    <form onSubmit={(event) => {
      event.preventDefault()
      if (selected) onConfirm(selected)
    }}>
      <fieldset className="analysis-question">
        <legend>{question.prompt}</legend>
        {question.choices.map((choice) => (
          <label key={choice.id}>
            <input type="radio" name={name} value={choice.id} checked={selected === choice.id}
              onChange={() => setSelected(choice.id)} />
            {choice.label}
          </label>
        ))}
      </fieldset>
      <p role="status">{incorrect ? question.incorrect : ''}</p>
      <button className="next-link" type="submit" disabled={!selected}>Confirmar</button>
    </form>
  )
}
