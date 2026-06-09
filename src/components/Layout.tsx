import { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { HomeIcon, FlameIcon, DumbbellIcon, ChartIcon, CameraIcon } from './icons'
import { useStore } from '../store'

const tabs = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/nutrition', label: 'Nutrition', Icon: FlameIcon },
  { to: '/training', label: 'Training', Icon: DumbbellIcon },
  { to: '/progress', label: 'Progress', Icon: ChartIcon },
  { to: '/checkin', label: 'Check-in', Icon: CameraIcon },
]

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const { loading, unreadReplies } = useStore()
  return (
    <div className="min-h-full flex flex-col max-w-md mx-auto relative">
      <main className="flex-1 px-5 pt-safe pb-28">
        {loading
          ? <div className="flex flex-col items-center justify-center h-[70vh] gap-3 text-muted text-sm">
              <div className="h-8 w-8 rounded-full border-2 border-ink-600 border-t-accent animate-spin" />
              Loading…
            </div>
          : <div className="pt-6">{children}</div>}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-ink-800/90 backdrop-blur-xl border-t border-ink-600/60 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-5">
          {tabs.map(({ to, label, Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
            const showDot = to === '/checkin' && unreadReplies > 0
            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center gap-1 py-3 text-[10px] font-medium"
              >
                <span className="relative">
                  <Icon className={active ? 'text-accent' : 'text-muted'} width={22} height={22} />
                  {showDot && <span className="absolute -top-0.5 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-ink-800" />}
                </span>
                <span className={active ? 'text-accent' : 'text-muted'}>{label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
