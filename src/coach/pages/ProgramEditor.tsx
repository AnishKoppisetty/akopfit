import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useCoach } from '../coachStore'
import { Button } from '../../components/ui'
import { CheckIcon } from '../../components/icons'
import { ProgramBuilder, withIds, cloneDays } from '../../components/ProgramBuilder'
import { TrainingDay } from '../../types'

export default function ProgramEditor() {
  const { id } = useParams()
  const { getClient, updateProgram } = useCoach()
  const navigate = useNavigate()
  const client = getClient(id ?? '')

  const [days, setDays] = useState<TrainingDay[]>(() => client ? withIds(cloneDays(client.program)) : [])
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-4">Client not found.</p>
        <Link to="/coach" className="text-accent underline">Back to roster</Link>
      </div>
    )
  }

  const onChange = (d: TrainingDay[]) => { setDays(d); setDirty(true); setSaved(false) }

  function save() {
    updateProgram(client!.id, days)
    setDirty(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="pb-24">
      <Link to={`/coach/client/${client.id}`} className="text-sm text-muted inline-flex items-center gap-1 mb-3">← {client.name.split(' ')[0]}</Link>
      <h1 className="text-2xl font-bold mb-1">Training program</h1>
      <p className="text-sm text-muted mb-4">Build {client.name.split(' ')[0]}’s split — drag the ⠿ handles to reorder.</p>

      <ProgramBuilder days={days} onChange={onChange} />

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-ink-900/90 backdrop-blur-xl border-t border-ink-600/60 pb-safe">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <Button className="flex-1" onClick={save} disabled={!dirty}>
            {saved ? <><CheckIcon width={18} height={18} /> Saved</> : dirty ? 'Save program' : 'Saved'}
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/coach/client/${client.id}`)}>Done</Button>
        </div>
      </div>
    </div>
  )
}
