import PhaseTheme from '../../components/PhaseTheme/PhaseTheme'
import InsertionRound from '../../components/InsertionRound/InsertionRound'
import { challengeLevel } from '../../game/levels/insertionLevels'

export default function Challenge() {
  return (
    <PhaseTheme className="challenge-theme">
      <InsertionRound key={challengeLevel.id} level={challengeLevel} completionLabel="Ver resultado"
        completionContent={
          <div className="discover-revelation">
            <h2>{challengeLevel.completion[0]}</h2>
            {challengeLevel.completion.slice(1).map((text) => <p className="discover-revelation-explanation" key={text}>{text}</p>)}
          </div>
        } />
    </PhaseTheme>
  )
}
