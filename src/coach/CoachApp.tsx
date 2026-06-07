import { Routes, Route } from 'react-router-dom'
import { CoachProvider, useCoach } from './coachStore'
import { CoachLayout } from './CoachLayout'
import CoachLogin from './pages/CoachLogin'
import Roster from './pages/Roster'
import CheckInInbox from './pages/CheckInInbox'
import ClientDetail from './pages/ClientDetail'
import ProgramEditor from './pages/ProgramEditor'
import { useAuth } from '../auth/AuthProvider'
import { Button } from '../components/ui'

export default function CoachApp() {
  return (
    <CoachProvider>
      <CoachRoutes />
    </CoachProvider>
  )
}

function CoachRoutes() {
  const { configured, isCoach, signOut } = useAuth()
  const { authed } = useCoach()

  // Real auth: only the coach role may enter the portal.
  if (configured) {
    if (!isCoach) return <NotCoach onSignOut={signOut} />
  } else if (!authed) {
    // Local demo mode (no backend): keep the passcode gate.
    return <CoachLogin />
  }

  return (
    <CoachLayout>
      <Routes>
        <Route path="/" element={<Roster />} />
        <Route path="/checkins" element={<CheckInInbox />} />
        <Route path="/client/:id" element={<ClientDetail />} />
        <Route path="/client/:id/program" element={<ProgramEditor />} />
        <Route path="*" element={<Roster />} />
      </Routes>
    </CoachLayout>
  )
}

function NotCoach({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="min-h-full max-w-sm mx-auto px-6 flex flex-col justify-center text-center pt-safe">
      <h1 className="text-2xl font-bold mb-2">Coach access only</h1>
      <p className="text-sm text-muted mb-8">
        This area is for coaches. You’re signed in as a client — head back to your app.
      </p>
      <a href="/" className="mb-3"><Button className="w-full">Go to my app</Button></a>
      <button onClick={onSignOut} className="text-sm text-muted underline">Sign out</button>
    </div>
  )
}
