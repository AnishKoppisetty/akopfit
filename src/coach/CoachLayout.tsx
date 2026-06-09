import { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCoach } from './coachStore'
import { useAuth } from '../auth/AuthProvider'
import { clientStatus } from './derive'

export function CoachLayout({ children }: { children: ReactNode }) {
  const { data, logout, loading } = useCoach()
  const { configured, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const coachName = configured ? (profile?.name || data.coachName) : data.coachName
  const needsReply = data.clients.some(c => c.status === 'active' && clientStatus(c).checkInState === 'needs-reply')

  async function handleLogout() {
    if (configured) await signOut()
    else { logout(); navigate('/coach') }
  }

  return (
    <div className="min-h-full max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-ink-900/85 backdrop-blur-xl pt-safe">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">Coach Portal</div>
            <div className="text-lg font-bold leading-tight">{coachName}</div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-muted border border-ink-600 rounded-lg px-3 py-1.5 active:scale-95 transition"
          >
            Log out
          </button>
        </div>
        <div className="px-5 flex gap-1 border-b border-ink-600/60">
          <CoachTab to="/coach" end>Roster</CoachTab>
          <CoachTab to="/coach/checkins" dot={needsReply}>Check-ins</CoachTab>
        </div>
      </header>

      <main className="px-5 pt-5 pb-16">
        {loading
          ? <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted text-sm">
              <div className="h-8 w-8 rounded-full border-2 border-ink-600 border-t-accent animate-spin" />
              Loading your clients…
            </div>
          : children}
      </main>
    </div>
  )
}

function CoachTab({ to, end, dot, children }: { to: string; end?: boolean; dot?: boolean; children: ReactNode }) {
  return (
    <NavLink to={to} end={end} className="relative px-3 py-2.5 text-sm font-semibold">
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-white' : 'text-muted'}>{children}</span>
          {dot && <span className="absolute top-1.5 -right-0 h-2 w-2 rounded-full bg-rose-500" />}
          {isActive && <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-accent rounded-full" />}
        </>
      )}
    </NavLink>
  )
}
