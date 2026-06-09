import { useStore } from '../store'
import { Link } from 'react-router-dom'
import { Card, Ring, ProgressBar, PageHeader, SectionTitle } from '../components/ui'
import { FootprintsIcon, HeartIcon, DumbbellIcon, ChevronRight, SettingsIcon, BoltIcon, BellIcon } from '../components/icons'
import { todayISO, todaySplitIndex, prettyDate, dayMacros } from '../utils'

export default function Home() {
  const { data, getDailyLog, setWater, unreadReplies } = useStore()
  const { profile, targets, split, checkIns } = data
  const today = todayISO()
  const log = getDailyLog(today)

  const totals = dayMacros(log)
  const cals = totals.calories
  const calsLeft = Math.max(targets.calories - cals, 0)
  const splitIdx = todaySplitIndex(split.length)
  const todayDay = split[splitIdx]
  const latestCheckIn = checkIns[0]
  const water = log.water ?? 0

  const macros = [
    { label: 'Protein', val: totals.protein, tgt: targets.protein, color: 'bg-rose-400' },
    { label: 'Carbs', val: totals.carbs, tgt: targets.carbs, color: 'bg-sky-400' },
    { label: 'Fat', val: totals.fat, tgt: targets.fat, color: 'bg-amber-400' },
  ]

  return (
    <div>
      <PageHeader
        subtitle={greeting() + ','}
        title={profile.name}
        right={
          <div className="flex items-center gap-2">
            <Link to="/checkin" className="relative p-2 rounded-full bg-ink-700 text-muted">
              <BellIcon width={20} height={20} />
              {unreadReplies > 0 && <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-ink-700" />}
            </Link>
            <Link to="/settings" className="p-2 rounded-full bg-ink-700 text-muted">
              <SettingsIcon width={20} height={20} />
            </Link>
          </div>
        }
      />

      {/* Calorie hero */}
      <Card className="flex items-center gap-5">
        <Ring value={cals} max={targets.calories} size={132} stroke={13}>
          <div className="text-2xl font-bold tabular-nums leading-none">{calsLeft}</div>
          <div className="text-[11px] text-muted mt-1">cal left</div>
        </Ring>
        <div className="flex-1 space-y-3">
          {macros.map(m => (
            <div key={m.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted">{m.label}</span>
                <span className="tabular-nums">{m.val}<span className="text-muted">/{m.tgt}g</span></span>
              </div>
              <ProgressBar value={m.val} max={m.tgt} color={m.color} />
            </div>
          ))}
          <Link to="/nutrition" className="text-xs text-accent font-semibold inline-flex items-center">
            Log food <ChevronRight width={14} height={14} />
          </Link>
        </div>
      </Card>

      {/* Quick activity */}
      <SectionTitle>Today’s activity</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          to="/progress"
          Icon={FootprintsIcon}
          label="Steps"
          value={(log.steps ?? 0).toLocaleString()}
          tgt={`/ ${targets.steps.toLocaleString()}`}
          val={log.steps ?? 0} max={targets.steps} color="bg-emerald-400"
        />
        <StatTile
          to="/progress"
          Icon={HeartIcon}
          label="Cardio"
          value={`${log.cardioMinutes ?? 0} min`}
          tgt={`/ ${targets.cardioMinutes} min`}
          val={log.cardioMinutes ?? 0} max={targets.cardioMinutes} color="bg-rose-400"
        />
      </div>

      {/* Water */}
      <SectionTitle>Water</SectionTitle>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted">{water} / {targets.water} glasses</span>
          <div className="flex gap-2">
            <button onClick={() => setWater(today, water - 1)} className="h-8 w-8 rounded-lg bg-ink-700 text-white text-lg active:scale-90 transition">−</button>
            <button onClick={() => setWater(today, water + 1)} className="h-8 w-8 rounded-lg bg-accent text-ink-900 text-lg font-bold active:scale-90 transition">+</button>
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: targets.water }).map((_, i) => (
            <button
              key={i}
              onClick={() => setWater(today, i + 1 === water ? i : i + 1)}
              className={`flex-1 h-9 rounded-md transition ${i < water ? 'bg-sky-400' : 'bg-ink-600'}`}
            />
          ))}
        </div>
      </Card>

      {/* Today's training */}
      <SectionTitle>Today’s training</SectionTitle>
      <Link to="/training">
        <Card className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${todayDay?.rest ? 'bg-ink-600' : 'bg-accent/15'}`}>
            <DumbbellIcon className={todayDay?.rest ? 'text-muted' : 'text-accent'} width={24} height={24} />
          </div>
          <div className="flex-1">
            <div className="font-semibold">{todayDay?.rest ? 'Rest Day' : todayDay?.focus}</div>
            <div className="text-xs text-muted">
              {todayDay?.rest ? 'Recover & hit your steps' : `${todayDay?.label} · ${todayDay?.exercises.length} exercises`}
            </div>
          </div>
          <ChevronRight className="text-muted" />
        </Card>
      </Link>

      {/* Coach message */}
      {latestCheckIn?.coachReply && (
        <>
          <SectionTitle>From {profile.coachName}</SectionTitle>
          <Card>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-accent text-ink-900 flex items-center justify-center font-bold text-sm shrink-0">
                {initials(profile.coachName)}
              </div>
              <div>
                <p className="text-sm leading-relaxed">{latestCheckIn.coachReply}</p>
                <div className="text-[11px] text-muted mt-2">{prettyDate(latestCheckIn.date)}</div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Check-in nudge */}
      <SectionTitle>Weekly check-in</SectionTitle>
      <Link to="/checkin">
        <Card className="flex items-center gap-4 border-accent/30">
          <div className="h-12 w-12 rounded-xl bg-accent/15 flex items-center justify-center">
            <BoltIcon className="text-accent" width={24} height={24} />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Submit your check-in</div>
            <div className="text-xs text-muted">Progress pics, weight & how the week went</div>
          </div>
          <ChevronRight className="text-muted" />
        </Card>
      </Link>
    </div>
  )
}

function StatTile({ to, Icon, label, value, tgt, val, max, color }: any) {
  return (
    <Link to={to}>
      <Card className="h-full">
        <div className="flex items-center gap-2 mb-3 text-muted">
          <Icon width={18} height={18} />
          <span className="text-xs">{label}</span>
        </div>
        <div className="text-2xl font-bold tabular-nums leading-none">{value}</div>
        <div className="text-[11px] text-muted mb-2">{tgt}</div>
        <ProgressBar value={val} max={max} color={color} />
      </Card>
    </Link>
  )
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
