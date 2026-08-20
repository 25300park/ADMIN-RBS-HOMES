import { redirect } from 'next/navigation'
import { requireTimeSession } from '@/lib/server-auth'
import { signedTimeFetch } from '@/lib/time-management/upstream'
import { ROUTES } from '@/utils/constants'
import TimeNavigation from '@/components/time-management/time-navigation'
import TodayPage from '@/components/time-management/today-page'

export default async function TimeManagementTodayPage() {
  const actor = await requireTimeSession()
  const access = await signedTimeFetch({ actor, method: 'GET', path: '/session' })
  if (!access.ok) redirect(ROUTES.TIME_PENDING)

  return (
    <div className="space-y-6">
      <TimeNavigation />
      <TodayPage approvalActive />
    </div>
  )
}
