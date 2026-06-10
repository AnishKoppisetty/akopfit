import { useState } from 'react'
import { CheckIn } from '../types'
import { prettyDate } from '../utils'

export function PhotoCompare({ checkIns, onClose }: { checkIns: CheckIn[]; onClose: () => void }) {
  const withPhotos = checkIns.filter(c => c.photos.length > 0)
  // checkIns come in newest-first; default A = oldest, B = newest.
  const [aId, setAId] = useState(withPhotos[withPhotos.length - 1]?.id)
  const [bId, setBId] = useState(withPhotos[0]?.id)

  const a = withPhotos.find(c => c.id === aId)
  const b = withPhotos.find(c => c.id === bId)

  return (
    <div className="fixed inset-0 z-50 bg-ink-900 flex flex-col pt-safe pb-safe">
      <div className="flex items-center justify-between px-5 py-3 border-b border-ink-600/60">
        <h3 className="font-bold">Compare photos</h3>
        <button onClick={onClose} className="text-muted text-2xl leading-none">×</button>
      </div>

      {withPhotos.length < 2 ? (
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <p className="text-sm text-muted">Need at least two check-ins with photos to compare.</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-2 p-2 overflow-y-auto no-scrollbar">
          <CompareCol checkin={a} options={withPhotos} value={aId} onChange={setAId} />
          <CompareCol checkin={b} options={withPhotos} value={bId} onChange={setBId} />
        </div>
      )}
    </div>
  )
}

function CompareCol({ checkin, options, value, onChange }: {
  checkin?: CheckIn
  options: CheckIn[]
  value?: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-col">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="bg-ink-700 border border-ink-600 rounded-lg px-2 py-2 text-white text-sm mb-2 outline-none"
      >
        {options.map(o => <option key={o.id} value={o.id}>{prettyDate(o.date)}{o.weight ? ` · ${o.weight}` : ''}</option>)}
      </select>
      <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
        {checkin?.photos.map((src, i) => (
          <img key={i} src={src} className="w-full rounded-lg object-cover" />
        ))}
      </div>
    </div>
  )
}
