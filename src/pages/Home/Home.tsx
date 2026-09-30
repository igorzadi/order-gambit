import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useMatch } from '../../context/matchState'
import { phasePath } from '../../game/session/match'
import cardsExplosion from '../../assets/experiment/cards-explosion.png'
import '../Experiment/experiment.css'
import './home.css'

export default function Home() {
  const context = useMatch()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const match = context?.match
  const active = match && match.progress.currentPhase !== 'home'
  return (
    <section className="home-noir" aria-labelledby="page-title">
      <div className="experiment-art" aria-hidden="true"><img src={cardsExplosion} alt="" draggable={false} width="1536" height="1024" /></div>
      <br/>
      <div className="experiment-content home-content">
        <h1 id="page-title">Order Gambit</h1>
        <div className="experiment-panel home-intro"><p>Organize cartas!</p></div>
        {active ? (
          <>
            <p>Olá, {match.saved.playerName}. Continue de onde parou.</p>
            <Link className="next-link" to={phasePath(match.progress.currentPhase)}>
              {match.progress.completed ? 'Ver resultado' : 'Continuar partida'}
            </Link>
            <button className="next-link" type="button" onClick={() => { context.restart(); setName('') }}>Nova partida</button>
          </>
        ) : (
          <form onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim()) return
            context?.start(name)
            navigate('/intro')
          }}>
            <label htmlFor="player-name">Nome ou apelido</label>
            <input id="player-name" value={name} maxLength={60} required autoComplete="nickname"
              onChange={(event) => setName(event.target.value)} />
            <button className="next-link" type="submit" disabled={!name.trim()}>Começar</button>
          </form>
        )}
      </div>
    </section>
  )
}
