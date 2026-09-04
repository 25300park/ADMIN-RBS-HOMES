import { redirect } from 'next/navigation'
import AdminMembersPage from '@/components/time-management/admin-members-page'
import { ServerAuthorizationError, requireAdminSession } from '@/lib/server-auth'
import TimeNavigation from '@/components/time-management/time-navigation'

export default async function TimeAdminMembersRoute() {
  try { await requireAdminSession() } catch (error) {
    if (error instanceof ServerAuthorizationError) redirect('/time-management/pending')
    throw error
  }
  return <div className="space-y-6"><TimeNavigation /><AdminMembersPage /></div>
}
