import { useSelectedDate } from './SelectedDate'
import { todayISO, daysAgoISO, prettyDate } from '../utils'

export function DateNav() {
  const { date, isToday, goPrev, goNext, goToday } = useSelectedDate()

  const label = date === todayISO() ? 'Today'
    : date === daysAgoISO(1) ? 'Yesterday'
    : prettyDate(date)

  return (
    <div className="flex items-center justify-between bg-ink-800 border border-ink-600/60 rounded-xl2 px-2 py-2 mb-4">
      <button onClick={goPrev} className="h-9 w-9 rounded-lg bg-ink-700 text-white flex items-center justify-center active:scale-90 transition" aria-label="Previous day">‹</button>
      <div className="text-center">
        <div className="text-sm font-semibold leading-tight">{label}</div>
        {!isToday && <button onClick={goToday} className="text-[11px] text-accent">Jump to today</button>}
      </div>
      <button
        onClick={goNext}
        disabled={isToday}
        className="h-9 w-9 rounded-lg bg-ink-700 text-white flex items-center justify-center active:scale-90 transition disabled:opacity-30"
        aria-label="Next day"
      >›</button>
    </div>
  )
}
