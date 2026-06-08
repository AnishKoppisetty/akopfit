import { useAuth } from './AuthProvider'
import { Button } from '../components/ui'

export function AwaitingApproval() {
  const { profile, signOut, refreshProfile } = useAuth()
  return (
    <Centered>
      <div className="text-4xl mb-4">⏳</div>
      <h1 className="text-2xl font-bold mb-2">Pending approval</h1>
      <p className="text-sm text-muted mb-8">
        Thanks{profile?.name ? `, ${profile.name}` : ''}! Your coach has your details and will
        approve your account shortly. You’ll get full access as soon as they do.
      </p>
      <Button className="w-full mb-3" onClick={() => refreshProfile()}>Check again</Button>
      <button onClick={() => signOut()} className="text-sm text-muted underline">Sign out</button>
    </Centered>
  )
}

export function Removed() {
  const { signOut } = useAuth()
  return (
    <Centered>
      <div className="text-4xl mb-4">👋</div>
      <h1 className="text-2xl font-bold mb-2">Account inactive</h1>
      <p className="text-sm text-muted mb-8">
        Your access has been removed by your coach. Reach out to them if you think this is a mistake.
      </p>
      <button onClick={() => signOut()} className="text-sm text-muted underline">Sign out</button>
    </Centered>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full max-w-sm mx-auto px-6 flex flex-col justify-center text-center pt-safe pb-safe">
      {children}
    </div>
  )
}
