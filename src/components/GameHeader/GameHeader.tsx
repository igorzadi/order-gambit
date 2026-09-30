import { Link } from 'react-router'
import logo from '../../assets/experiment/logo.png'

export default function GameHeader({ variant }: { variant?: 'experiment' }) {
  return (
    <header className="game-header">
      <Link to="/">{variant === 'experiment' ? <img className="experiment-logo" src={logo} alt="Order Gambit" width="1774" height="887" /> : 'Order Gambit'}</Link>
      {variant === 'experiment' && <span className="experiment-brand-caption">Pensamento<br />lógico<br />em jogo</span>}
    </header>
  )
}
