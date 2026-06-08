import { Link } from 'react-router-dom'
import { useCoach } from '../coachStore'
import { Card, Button } from '../../components/ui'
import { Avatar } from './Roster'
import { goalLabel } from '../derive'

export default function RemovedClients() {
  const { data, setClientStatus } = useCoach()
  const removed = data.clients.filter(c => c.status === 'removed')

  return (
    <div>
      <Link to="/coach" className="text-sm text-muted inline-flex items-center gap-1 mb-4">← Roster</Link>
      <h1 className="text-2xl font-bold mb-1">Removed clients</h1>
      <p className="text-sm text-muted mb-5">Their data is kept. Restore to give them access again.</p>

      {removed.length === 0 ? (
        <Card className="text-center py-10">
          <div className="text-3xl mb-2">🗂️</div>
          <p className="text-sm text-muted">No removed clients.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {removed.map(c => (
            <Card key={c.id} className="flex items-center gap-3 py-3">
              <Avatar name={c.name} />
              <div className="flex-1 min-w-0">
                <Link to={`/coach/client/${c.id}`} className="font-semibold truncate block">{c.name}</Link>
                <div className="text-xs text-muted truncate">{goalLabel(c.goal)} · {c.splitName}</div>
              </div>
              <Button variant="outline" onClick={() => setClientStatus(c.id, 'active')}>Restore</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
