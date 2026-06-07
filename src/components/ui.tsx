import { ReactNode, ButtonHTMLAttributes } from 'react'
import { clamp } from '../utils'

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-ink-800 border border-ink-600/60 rounded-xl2 p-4 ${onClick ? 'active:scale-[0.99] transition cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-6 first:mt-0">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {action}
    </div>
  )
}

export function Button({ children, variant = 'primary', className = '', ...rest }: {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'outline'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold text-sm px-4 py-3 transition active:scale-[0.97] disabled:opacity-40'
  const variants = {
    primary: 'bg-accent text-ink-900 hover:bg-accent-dark',
    ghost: 'bg-ink-600/60 text-white hover:bg-ink-500',
    outline: 'border border-ink-500 text-white hover:bg-ink-700',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export function ProgressBar({ value, max, color = 'bg-accent' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? clamp((value / max) * 100, 0, 100) : 0
  return (
    <div className="h-2 w-full rounded-full bg-ink-600 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <div className="text-2xl font-bold tabular-nums leading-tight">{value}</div>
      <div className="text-xs text-muted mt-0.5">{label}</div>
      {sub && <div className="text-xs text-accent mt-0.5">{sub}</div>}
    </div>
  )
}

export function Chip({ children, active = false, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
        active ? 'bg-accent text-ink-900' : 'bg-ink-700 text-muted hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

// Circular ring progress (SVG)
export function Ring({ value, max, size = 140, stroke = 12, color = '#c6ff2e', track = '#22222a', children }: {
  value: number
  max: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? clamp(value / max, 0, 1) : 0
  const dash = c * pct
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`} strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-ink-700 border border-ink-600 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition ${props.className ?? ''}`}
    />
  )
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-ink-700 border border-ink-600 rounded-xl px-4 py-3 text-white outline-none focus:border-accent transition resize-none ${props.className ?? ''}`}
    />
  )
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      {right}
    </div>
  )
}
