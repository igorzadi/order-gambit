import InsertionRound from '../../components/InsertionRound/InsertionRound'
import { practiceLevel } from '../../game/levels/insertionLevels'

export default function Practice() {
  return <InsertionRound key={practiceLevel.id} level={practiceLevel} />
}
