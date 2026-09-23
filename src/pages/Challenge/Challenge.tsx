import InsertionRound from '../../components/InsertionRound/InsertionRound'
import { challengeLevel } from '../../game/levels/insertionLevels'

export default function Challenge() {
  return <InsertionRound key={challengeLevel.id} level={challengeLevel} completionLabel="Ver resultado" />
}
