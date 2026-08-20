import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import { requireTimeSession } from '@/lib/server-auth'
import RouteClientLayout from '@/components/route-client-layout'
import { AuthProvider } from '@/providers'
import { MENU_ITEMS, ROUTES, TIME_MENU_ITEMS } from '@/utils/constants'

export default async function TimeManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const actor = await requireTimeSession()
  const session = await getServerSession(authOptions)

  if (!session?.user) redirect(ROUTES.LOGIN)

  const menus = actor.timeRole === 'admin'
    ? MENU_ITEMS.filter((menu) => menu.allowedLevels.includes(actor.level))
    : TIME_MENU_ITEMS.filter((menu) => menu.allowedLevels.includes(actor.level))

  return (
    <AuthProvider session={session}>
      <RouteClientLayout authorizedMenus={menus} showAdminAlerts={actor.timeRole === 'admin'}>
        {children}
      </RouteClientLayout>
    </AuthProvider>
  )
}
