import { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  ...p,
})

export const HomeIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
)
export const FlameIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3c0 3-4 4-4 8a4 4 0 0 0 8 0c0-1.5-1-2.5-1-4 2 1 3 3 3 5a6 6 0 1 1-12 0c0-5 6-6 6-9Z" /></svg>
)
export const DumbbellIcon = (p: P) => (
  <svg {...base(p)}><path d="M6.5 6.5 17.5 17.5" /><path d="M3 7v10M7 3v18" /><path d="M21 7v10M17 3v18" opacity="0" /><rect x="1.5" y="9" width="4" height="6" rx="1" /><rect x="18.5" y="9" width="4" height="6" rx="1" /><path d="M5.5 12h13" /></svg>
)
export const ChartIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 3v18h18" /><path d="M7 14l3-3 3 3 5-6" /></svg>
)
export const CameraIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 8h3l2-2h6l2 2h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
)
export const SettingsIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 2h-5l-.4 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4L3.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 2.6h5l.4-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.06-.33.1-.66.1-1Z" /></svg>
)
export const FootprintsIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 16c0-2 .5-3 .5-5C4.5 9 5.5 8 7 8s2 1.5 1.8 4c-.2 2-.3 3 .2 4.5.5 1.5-.5 3-2.5 3s-2.5-2-2.5-3.5Z" /><path d="M16 13c0-2 .5-3 .5-5 0-2 1-3 2.5-3s2 1.5 1.8 4c-.2 2-.3 3 .2 4.5.5 1.5-.5 3-2.5 3s-2.5-2-2.5-3.5Z" /></svg>
)
export const HeartIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5C19 15.5 12 20 12 20Z" /></svg>
)
export const PlusIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
)
export const CheckIcon = (p: P) => (
  <svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>
)
export const ChevronRight = (p: P) => (
  <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
)
export const MoonIcon = (p: P) => (
  <svg {...base(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
)
export const BoltIcon = (p: P) => (
  <svg {...base(p)}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
)
