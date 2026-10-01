import { Navigate, Route, Routes, useLocation } from 'react-router'
import type { ReactNode } from 'react'
import { MatchProvider } from './context/MatchContext'
import { useMatch } from './context/matchState'
import { canAccessPhase, phasePath } from './game/session/match'
import type { CurrentPhase } from './game/session/match'
import GameHeader from './components/GameHeader/GameHeader'
import Home from './pages/Home/Home'
import Experiment from './pages/Experiment/Experiment'
import Discover from './pages/Discover/Discover'
import Practice from './pages/Practice/Practice'
import Analyze from './pages/Analyze/Analyze'
import Challenge from './pages/Challenge/Challenge'
import Result from './pages/Result/Result'

export function PhaseGate({ phase, children }: { phase: CurrentPhase; children: ReactNode }) {
  const context = useMatch()
  const match = context?.match ?? null
  return canAccessPhase(match, phase) ? children
    : <Navigate to={phasePath(match?.progress.currentPhase ?? 'home')} replace />
}

export default function App() {
  return <MatchProvider><GameApp /></MatchProvider>
}

function GameApp() {
  const { pathname } = useLocation()
  return (
    <div className="app">
      <GameHeader variant={pathname === '/' || pathname === '/intro' || pathname === '/discover' || pathname === '/practice' || pathname === '/experiment' || pathname === '/analyze' || pathname === '/challenge' || pathname === '/result' ? 'experiment' : undefined} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/intro" element={<Navigate to="/experiment" replace />} />
          <Route path="/experiment" element={<PhaseGate phase="experiment"><Experiment /></PhaseGate>} />
          <Route path="/discover" element={<PhaseGate phase="discover"><Discover /></PhaseGate>} />
          <Route path="/practice" element={<PhaseGate phase="practice"><Practice /></PhaseGate>} />
          <Route path="/analyze" element={<PhaseGate phase="analyze"><Analyze /></PhaseGate>} />
          <Route path="/challenge" element={<PhaseGate phase="challenge"><Challenge /></PhaseGate>} />
          <Route path="/result" element={<PhaseGate phase="result"><Result /></PhaseGate>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
