import { redirect } from 'next/navigation'
import { requireTimeSession } from '@/lib/server-auth'
import { signedTimeFetch } from '@/lib/time-management/upstream'

export default async function TimeManagementPendingPage() {
  const actor = await requireTimeSession()
  const access = await signedTimeFetch({ actor, method: 'GET', path: '/session' })
  if (access.ok) redirect('/time-management/today')

  return (
    <section className="mx-auto max-w-2xl py-12 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Time management setup</h1>
      <p className="mt-3 text-muted-foreground">
        Your CRM account is eligible. Workspace activation will be available in the next setup step.
      </p>
    </section>
  )
}
