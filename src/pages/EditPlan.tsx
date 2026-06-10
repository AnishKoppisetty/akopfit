import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Button, Card, PageHeader, Textarea } from '../components/ui'
import { ProgramBuilder, withIds, cloneDays } from '../components/ProgramBuilder'
import { TrainingDay } from '../types'

export default function EditPlan() {
  const { data, proposeProgram, cancelProposal } = useStore()
  const navigate = useNavigate()

  const base = data.proposalPending && data.proposalDays?.length ? data.proposalDays : data.split
  const [days, setDays] = useState<TrainingDay[]>(() => withIds(cloneDays(base)))
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  function submit() {
    proposeProgram(days, note)
    setSent(true)
    setTimeout(() => navigate('/training'), 1200)
  }

  return (
    <div>
      <button onClick={() => navigate('/training')} className="text-sm text-muted mb-3">← Training</button>
      <PageHeader subtitle="Suggest changes" title="Edit my plan" />

      {data.proposalPending && !sent && (
        <Card className="mb-4 border-accent/30 bg-accent/[0.05]">
          <p className="text-sm">You have a request pending review. Saving here replaces it.</p>
          <button onClick={() => { cancelProposal(); navigate('/training') }} className="text-sm text-rose-400 mt-2">Cancel pending request</button>
        </Card>
      )}

      <p className="text-sm text-muted mb-4">Tweak your days and exercises, add a note, and send it to your coach to approve.</p>

      <ProgramBuilder days={days} onChange={setDays} showTemplate={false} />

      <div className="mt-4">
        <span className="text-xs text-muted mb-1.5 block">Note to your coach (optional)</span>
        <Textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. I’d like to move legs to Friday and add calf work…" />
      </div>

      <Button className="w-full mt-4" onClick={submit} disabled={sent}>
        {sent ? 'Sent to your coach ✓' : 'Send to coach for approval'}
      </Button>
    </div>
  )
}
