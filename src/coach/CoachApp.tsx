import { Routes, Route } from 'react-router-dom'
import { CoachProvider, useCoach } from './coachStore'
import { CoachLayout } from './CoachLayout'
import CoachLogin from './pages/CoachLogin'
import Roster from './pages/Roster'
import CheckInInbox from './pages/CheckInInbox'
import ClientDetail from './pages/ClientDetail'

export default function CoachApp() {
  return (
    <CoachProvider>
      <CoachRoutes />
    </CoachProvider>
  )
}

function CoachRoutes() {
  const { authed } = useCoach()
  if (!authed) return <CoachLogin />
  return (
    <CoachLayout>
      <Routes>
        <Route path="/" element={<Roster />} />
        <Route path="/checkins" element={<CheckInInbox />} />
        <Route path="/client/:id" element={<ClientDetail />} />
        <Route path="*" element={<Roster />} />
      </Routes>
    </CoachLayout>
  )
}
