import InsertionRound from '../../components/InsertionRound/InsertionRound'
import { discoverLevel } from '../../game/levels/insertionLevels'

export default function Discover() {
  return <InsertionRound key={discoverLevel.id} level={discoverLevel} />
}
