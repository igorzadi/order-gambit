type FeedbackProps = {
  result: 'correct' | 'incorrect' | null
  correctMessage?: string
  incorrectMessage?: string
}

export default function Feedback({
  result,
  correctMessage = '✓ Exatamente. A parte ordenada cresceu.',
  incorrectMessage = 'Tente novamente.',
}: FeedbackProps) {
  return (
    <p className={`move-feedback${result ? ` move-feedback--${result}` : ''}`} role="status">
      {result === 'correct' && correctMessage}
      {result === 'incorrect' && incorrectMessage}
    </p>
  )
}
