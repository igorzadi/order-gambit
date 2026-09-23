import { Link } from 'react-router'
import { useMatch } from '../../context/matchState'

export default function Intro() {
  const context = useMatch()
  return (
    <section aria-labelledby="page-title">
      <h1 id="page-title">Introdução</h1>
      <p>Conheça as etapas do Order Gambit.</p>
      <Link className="next-link" to="/experiment" onClick={() => context?.dispatch({ type: 'intro-complete' })}>Avançar para Experimente</Link>
    </section>
  )
}
