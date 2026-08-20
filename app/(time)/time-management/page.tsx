import { redirect } from 'next/navigation'
import { ROUTES } from '@/utils/constants'
import { requireTimeSession } from '@/lib/server-auth'
import { signedTimeFetch } from '@/lib/time-management/upstream'

export default async function TimeManagementPage() {
  const actor = await requireTimeSession()
  const access = await signedTimeFetch({ actor, method: 'GET', path: '/session' })
  redirect(access.ok ? '/time-management/today' : ROUTES.TIME_PENDING)
}
