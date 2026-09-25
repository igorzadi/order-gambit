import { useState } from 'react'
import InsertionRound from '../../components/InsertionRound/InsertionRound'
import { practiceLevel } from '../../game/levels/insertionLevels'
import cardsExplosion from '../../assets/experiment/cards-explosion.png'
import '../Experiment/experiment.css'
import '../Home/home.css'
import '../Discover/discover.css'
import './practice.css'

const practicePresentation = {
  ...practiceLevel,
  showCurrentValue: false,
  instructions: [
    ...practiceLevel.instructions,
    'Analise a carta da vez e decida onde ela deve ficar na parte ordenada.',
  ],
  helper: 'Se ela já estiver na posição correta, use MANTER POSIÇÃO.',
}

export default function Practice() {
  const [replay, setReplay] = useState(0)
  return (
    <div className="home-noir discover-page practice-page">
      <div className="experiment-art" aria-hidden="true">
        <img src={cardsExplosion} alt="" draggable={false} width="1536" height="1024" />
      </div>
      <div className="experiment-content discover-round">
        <InsertionRound key={`${practiceLevel.id}-${replay}`} level={practicePresentation}
          persistRound={replay === 0} onReplay={() => setReplay((value) => value + 1)}
          currentRegionLabel="CARTA DA VEZ"
          keepAction={{ label: 'MANTER POSIÇÃO', alwaysAvailable: true }}
          completionContent={
            <div className="discover-revelation">
              <h2>{practiceLevel.completion[0]}</h2>
            </div>
          } />
      </div>
    </div>
  )
}
