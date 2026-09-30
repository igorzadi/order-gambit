import { useState } from 'react'
import InsertionRound from '../../components/InsertionRound/InsertionRound'
import { discoverLevel } from '../../game/levels/insertionLevels'
import cardsExplosion from '../../assets/experiment/cards-explosion.png'
import '../Experiment/experiment.css'
import '../Home/home.css'
import './discover.css'

// A line break separates the two interaction instructions without changing their text.
const visualDiscoverLevel = {
  ...discoverLevel,
  helper: discoverLevel.helper.replace('. No celular', '.\nNo celular'),
}

export default function Discover() {
  const [replay, setReplay] = useState(0)
  return (
    <div className="home-noir discover-page">
      <div className="experiment-art" aria-hidden="true">
        <img src={cardsExplosion} alt="" draggable={false} width="1536" height="1024" />
      </div>
      <div className="experiment-content discover-round">
        <InsertionRound key={`${discoverLevel.id}-${replay}`} level={visualDiscoverLevel}
          persistRound={replay === 0} onReplay={() => setReplay((value) => value + 1)}
          futureRegionLabel="Parte não ordenada"
          completionContent={
            <div className="discover-revelation">
              <p className="discover-revelation-badge"><span aria-hidden="true">✓</span> DESCOBERTA CONCLUÍDA</p>
              <p className="discover-revelation-intro">{discoverLevel.completion[0]}</p>
              <h2>INSERTION SORT</h2>
              <p className="discover-revelation-explanation">{discoverLevel.completion[1]}</p>
              <div className="discover-revelation-analogy">
                <h3><span aria-hidden="true">♠</span> Pense em cartas na mão:</h3>
                <p>recebemos uma nova carta, procuramos sua posição e a inserimos entre as cartas já organizadas.</p>
              </div>
            </div>
          } />
      </div>
    </div>
  )
}
