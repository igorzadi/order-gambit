import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useMatch } from '../../context/matchState'
import { phasePath } from '../../game/session/match'

export default function Home() {
  const context = useMatch()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const match = context?.match
  const active = match && match.progress.currentPhase !== 'home'
  return (
    <section aria-labelledby="page-title">
      <h1 id="page-title">Order Gambit</h1>
      <p>Organize cartas e descubra o Insertion Sort.</p>
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
    </section>
  )
}
