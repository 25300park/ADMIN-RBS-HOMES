import { redirect } from 'next/navigation'
import RecordsPage from '@/components/time-management/records-page'
import TimeNavigation from '@/components/time-management/time-navigation'
import { requireTimeSession } from '@/lib/server-auth'
import { signedTimeFetch } from '@/lib/time-management/upstream'
import { ROUTES } from '@/utils/constants'

export default async function TimeManagementRecordsPage() {
  const actor = await requireTimeSession()
  const access = await signedTimeFetch({ actor, method: 'GET', path: '/session' })
  if (!access.ok) redirect(ROUTES.TIME_PENDING)
  return <div className="space-y-6"><TimeNavigation /><RecordsPage /></div>
}
