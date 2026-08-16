'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dropdown, Badge, Avatar } from 'antd'
import { 
  Menu as MenuIcon, 
  Bell, 
  User, 
  LogOut, 
  Calendar, 
  AlertCircle, 
  Phone 
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { ROUTES } from '@/utils/constants'
import { getAlertCounts } from '@/actions/notification-action'

interface AlertCounts {
  scheduleAlert: number
  complainUnitAlert: number
  contactAlert: number
}

interface HeaderProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  email: string
}

export default function Header({ collapsed, setCollapsed, email }: HeaderProps) {
  const router = useRouter()
  const [alerts, setAlerts] = useState<AlertCounts>({ scheduleAlert: 0, complainUnitAlert: 0, contactAlert: 0 })

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const result = await getAlertCounts()
      if (result.success && result.data) setAlerts(result.data)
    } catch (error) {
      console.error('❌ Error fetching alerts:', error)
    }
  }

  const totalAlerts = alerts.scheduleAlert + alerts.complainUnitAlert + alerts.contactAlert

  const alertMenuItems = [
    {
      key: 'schedule',
      label: (
        <div className="flex items-center gap-3 py-1 px-2 w-56">
          <Calendar size={16} className="text-primary" />
          <span className="text-sm font-medium">Tour Schedules</span>
          <span className="ml-auto text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
            {alerts.scheduleAlert}
          </span>
        </div>
      ),
      onClick: () => router.push('/schedules')
    },
    {
      key: 'complain',
      label: (
        <div className="flex items-center gap-3 py-1 px-2 w-56">
          <AlertCircle size={16} className="text-warning" />
          <span className="text-sm font-medium">Complaints</span>
          <span className="ml-auto text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
            {alerts.complainUnitAlert}
          </span>
        </div>
      ),
      onClick: () => router.push('/complain')
    },
    {
      key: 'contact',
      label: (
        <div className="flex items-center gap-3 py-1 px-2 w-56">
          <Phone size={16} className="text-success" />
          <span className="text-sm font-medium">Inquiries</span>
          <span className="ml-auto text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
            {alerts.contactAlert}
          </span>
        </div>
      ),
      onClick: () => router.push('/contact')
    }
  ]

  const userMenuItems = [
    {
      key: 'logout',
      label: (
        <div className="flex items-center gap-2 text-destructive py-1 px-2">
          <LogOut size={16} />
          <span className="font-medium">Logout</span>
        </div>
      ),
      onClick: () => signOut({ callbackUrl: ROUTES.LOGIN })
    }
  ]

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-white px-6 border-b border-border shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <MenuIcon size={20} />
        </button>
      </div>

      <div className="flex items-center gap-6">
        <Dropdown menu={{ items: alertMenuItems }} trigger={['click']} placement="bottomRight">
          <div className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors">
            <Bell size={20} />
            {totalAlerts > 0 && (
              <Badge 
                count={totalAlerts > 99 ? '99+' : totalAlerts}
                className="absolute -top-1 -right-1"
                style={{ backgroundColor: 'hsl(var(--destructive))' }}
              />
            )}
          </div>
        </Dropdown>

        <div className="h-6 w-px bg-border" />

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                Account
              </span>
              <span className="text-sm font-semibold text-foreground leading-tight">
                {email}
              </span>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  )
}