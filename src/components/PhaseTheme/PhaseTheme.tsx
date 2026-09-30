import type { ReactNode } from 'react'
import cardsExplosion from '../../assets/experiment/cards-explosion.png'
import '../../pages/Experiment/experiment.css'
import '../../pages/Home/home.css'
import '../../pages/Discover/discover.css'
import '../../pages/Practice/practice.css'
import './phaseTheme.css'

/** Presentation only; the wrapped page owns all state, actions and navigation. */
export default function PhaseTheme({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`home-noir discover-page practice-page phase-theme ${className}`}>
      <div className="experiment-art" aria-hidden="true">
        <img src={cardsExplosion} alt="" draggable={false} width="1536" height="1024" />
      </div>
      <div className="experiment-content discover-round">{children}</div>
    </div>
  )
}
