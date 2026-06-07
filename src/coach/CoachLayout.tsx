import { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useCoach } from './coachStore'

export function CoachLayout({ children }: { children: ReactNode }) {
  const { data, logout } = useCoach()
  const navigate = useNavigate()

  return (
    <div className="min-h-full max-w-lg mx-auto">
      <header className="sticky top-0 z-30 bg-ink-900/85 backdrop-blur-xl pt-safe">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-accent font-semibold">Coach Portal</div>
            <div className="text-lg font-bold leading-tight">{data.coachName}</div>
          </div>
          <button
            onClick={() => { logout(); navigate('/coach') }}
            className="text-xs text-muted border border-ink-600 rounded-lg px-3 py-1.5 active:scale-95 transition"
          >
            Log out
          </button>
        </div>
        <div className="px-5 flex gap-1 border-b border-ink-600/60">
          <CoachTab to="/coach" end>Roster</CoachTab>
          <CoachTab to="/coach/checkins">Check-ins</CoachTab>
        </div>
      </header>

      <main className="px-5 pt-5 pb-16">{children}</main>
    </div>
  )
}

function CoachTab({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink to={to} end={end} className="relative px-3 py-2.5 text-sm font-semibold">
      {({ isActive }) => (
        <>
          <span className={isActive ? 'text-white' : 'text-muted'}>{children}</span>
          {isActive && <span className="absolute left-3 right-3 -bottom-px h-0.5 bg-accent rounded-full" />}
        </>
      )}
    </NavLink>
  )
}
