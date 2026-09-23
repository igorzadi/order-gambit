type Props = { completed: number; total: number }

export default function ProgressBar({ completed, total }: Props) {
  return (
    <div className="round-progress">
      <label htmlFor="round-progress">Passos concluídos: {completed} de {total}</label>
      <progress id="round-progress" value={completed} max={Math.max(1, total)} />
    </div>
  )
}
