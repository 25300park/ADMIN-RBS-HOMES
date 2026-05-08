'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout, Button, Dropdown, Avatar, Space, Badge, Tooltip } from 'antd'
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  UserOutlined, 
  BellFilled,
  LogoutOutlined,
  CalendarOutlined,
  AlertOutlined,
  PhoneOutlined
} from '@ant-design/icons'
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
  const [alerts, setAlerts] = useState<AlertCounts>({
    scheduleAlert: 0,
    complainUnitAlert: 0,
    contactAlert: 0,
  })
  const [loading, setLoading] = useState(false)

  // 초기 로드
  useEffect(() => {
    fetchAlerts()
  }, [])

  // 30초마다 주기적으로 호출
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts()
    }, 30000) // 30초

    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const result = await getAlertCounts()
      
      if (result.success && result.data) {
        setAlerts(result.data)
      }
    } catch (error) {
      console.error('❌ Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalAlerts = 
    alerts.scheduleAlert + 
    alerts.complainUnitAlert + 
    alerts.contactAlert

  const alertMenuItems = [
    {
      key: 'schedule',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
          <CalendarOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
          <span>Tour Schedules</span>
          <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#ff4d4f' }}>
            {alerts.scheduleAlert}
          </span>
        </div>
      ),
      onClick: () => router.push('/schedules')
    },
    {
      key: 'complain',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
          <AlertOutlined style={{ fontSize: '16px', color: '#faad14' }} />
          <span>Complaints</span>
          <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#ff4d4f' }}>
            {alerts.complainUnitAlert}
          </span>
        </div>
      ),
      onClick: () => router.push('/complain')
    },
    {
      key: 'contact',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', justifyContent: 'spa' }}>
          <PhoneOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
          <span>Contact Inquiries</span>
          <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#ff4d4f' }}>
            {alerts.contactAlert}
          </span>
        </div>
      ),
      onClick: () => router.push('/contact')
    },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogoutOutlined />
          <span>Logout</span>
        </div>
      ),
      onClick: () => signOut({ callbackUrl: ROUTES.LOGIN })
    }
  ]

  return (
    <header 
      style={{ 
        padding: '0 24px',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #e6e6e6',
        height: '64px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* 토글 버튼 */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined style={{ fontSize: '18px' }} /> : <MenuFoldOutlined style={{ fontSize: '18px' }} />}
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '40px',
          width: '40px',
          borderRadius: '6px',
          transition: 'all 0.3s',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f5f5f5'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      />

      <Space size={24} style={{ marginRight: '8px' }}>
        {/* 알림 벨 */}
        <Tooltip title={`You have ${totalAlerts} new notifications`}>
          <Dropdown 
            menu={{ items: alertMenuItems }} 
            placement="bottomRight"
            trigger={['click']}
          >
            <div
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: totalAlerts > 0 ? '#e6f7ff' : '#f5f5f5',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = totalAlerts > 0 ? '#bae7ff' : '#efefef'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = totalAlerts > 0 ? '#e6f7ff' : '#f5f5f5'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <BellFilled 
                style={{ 
                  fontSize: '18px', 
                  color: totalAlerts > 0 ? '#1890ff' : '#999999'
                }} 
              />
              {totalAlerts > 0 && (
                <Badge 
                  count={totalAlerts > 99 ? '99+' : totalAlerts}
                  style={{
                    backgroundColor: '#ff4d4f',
                    color: '#fff',
                    boxShadow: '0 0 0 1px #fff',
                    fontSize: '11px',
                    height: '20px',
                    lineHeight: '20px',
                    minWidth: '20px',
                    position: 'absolute',
                    top: '-28px',
                    right: '-28px',
                    borderRadius: '10px',
                    fontWeight: 'bold'
                  }}
                />
              )}
            </div>
          </Dropdown>
        </Tooltip>

        {/* 구분선 */}
        <div style={{ 
          width: '1px', 
          height: '32px', 
          background: '#e6e6e6' 
        }} />

        {/* 사용자 프로필 */}
        <Dropdown 
          menu={{ items: userMenuItems }} 
          placement="bottomRight"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              borderRadius: '6px',
              padding: '6px 12px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Avatar 
              icon={<UserOutlined />}
              style={{
                cursor: 'pointer',
                border: '2px solid #fff'
              }}
              size={32}
            />
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              maxWidth: '150px'
            }}>
              <span style={{ 
                fontSize: '12px', 
                color: '#999999',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Account
              </span>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 500,
                color: '#262626',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {email}
              </span>
            </div>
          </div>
        </Dropdown>
      </Space>
    </header>
  )
}