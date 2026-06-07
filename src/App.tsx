import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Nutrition from './pages/Nutrition'
import Training from './pages/Training'
import Progress from './pages/Progress'
import CheckIn from './pages/CheckIn'
import Settings from './pages/Settings'
import CoachApp from './coach/CoachApp'
import { useAuth } from './auth/AuthProvider'
import Login from './auth/Login'
import { DumbbellIcon } from './components/icons'

export default function App() {
  const { configured, loading, session } = useAuth()

  // When the backend is configured, require a signed-in session.
  if (configured) {
    if (loading) return <Splash />
    if (!session) return <Login />
  }

  return (
    <Routes>
      <Route path="/coach/*" element={<CoachApp />} />
      <Route path="/*" element={<ClientApp />} />
    </Routes>
  )
}

function ClientApp() {
  const { configured, isCoach } = useAuth()
  // Coaches land on their dashboard by default.
  if (configured && isCoach) return <Navigate to="/coach" replace />
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/training" element={<Training />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  )
}

function Splash() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-3">
      <div className="h-14 w-14 rounded-2xl bg-accent/15 flex items-center justify-center animate-pulse">
        <DumbbellIcon className="text-accent" width={28} height={28} />
      </div>
      <p className="text-sm text-muted">Loading…</p>
    </div>
  )
}
