import { Link } from 'react-router-dom'
import { useCoach } from '../coachStore'
import { CheckInCard } from '../components/CheckInCard'
import { Card } from '../../components/ui'

export default function CheckInInbox() {
  const { data } = useCoach()

  // flatten all check-ins with their client, newest first
  const all = data.clients.flatMap(c =>
    c.checkIns.map(ci => ({ client: c, ci })),
  ).sort((a, b) => b.ci.date.localeCompare(a.ci.date))

  const pending = all.filter(x => !x.ci.coachReply)
  const replied = all.filter(x => x.ci.coachReply)

  return (
    <div>
      <div className="mb-5">
        <Card className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold tabular-nums text-accent">{pending.length}</div>
            <div className="text-xs text-muted">awaiting your reply</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold tabular-nums">{replied.length}</div>
            <div className="text-xs text-muted">replied</div>
          </div>
        </Card>
      </div>

      {pending.length > 0 && (
        <>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">Needs reply</h2>
          <div className="space-y-3 mb-6">
            {pending.map(({ client, ci }) => (
              <ClientLinkedCard key={ci.id} client={client} ci={ci} />
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted mb-3">Replied</h2>
      {replied.length === 0 ? (
        <p className="text-sm text-muted">No replies yet.</p>
      ) : (
        <div className="space-y-3">
          {replied.map(({ client, ci }) => (
            <ClientLinkedCard key={ci.id} client={client} ci={ci} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClientLinkedCard({ client, ci }: { client: any; ci: any }) {
  return (
    <div>
      <Link to={`/coach/client/${client.id}`} className="text-xs text-muted underline ml-1 mb-1 inline-block">
        View {client.name}’s profile →
      </Link>
      <CheckInCard clientId={client.id} clientName={client.name} checkIn={ci} unit={client.unit} showClient />
    </div>
  )
}
