import { forbidden } from 'next/navigation'
import AdminSummaryPage from '@/components/time-management/admin-summary-page'
import { ServerAuthorizationError, requireAdminSession } from '@/lib/server-auth'
import TimeNavigation from '@/components/time-management/time-navigation'

export default async function TimeAdminSummaryRoute() {
  try { await requireAdminSession() } catch (error) {
    if (error instanceof ServerAuthorizationError) forbidden()
    throw error
  }
  return <div className="space-y-6"><TimeNavigation /><AdminSummaryPage /></div>
}
