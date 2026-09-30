import { Link } from 'react-router'
import { useMatch } from '../../context/matchState'
import cardsExplosion from '../../assets/experiment/cards-explosion.png'
import '../Experiment/experiment.css'
import '../Home/home.css'

export default function Intro() {
  const context = useMatch()
  return (
    <section className="home-noir" aria-labelledby="page-title">
      <div className="experiment-art" aria-hidden="true">
        <img src={cardsExplosion} alt="" draggable={false} width="1536" height="1024" />
      </div>
      <div className="experiment-content home-content">
        <h1 id="page-title">Introdução</h1>
        <div className="experiment-panel home-intro">
          <p>Conheça as etapas do Order Gambit.</p>
        </div>
        <Link className="next-link" to="/experiment" onClick={() => context?.dispatch({ type: 'intro-complete' })}>Avançar para Experimente</Link>
      </div>
    </section>
  )
}
