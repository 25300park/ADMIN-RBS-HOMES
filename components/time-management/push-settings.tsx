'use client'

import { useEffect, useState } from 'react'
import { Alert, Button, Card } from 'antd'
import type { TimeClient } from '@/lib/time-management/client'
import { timeClient } from '@/lib/time-management/client'

type NotificationApi = { permission: NotificationPermission; requestPermission: () => Promise<NotificationPermission> }
type WorkerRegistration = { pushManager: { subscribe: (options: PushSubscriptionOptionsInit) => Promise<{ toJSON: () => unknown }> } }
type ServiceWorkerApi = { register: (scriptURL: string, options: RegistrationOptions) => Promise<WorkerRegistration> }
type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } }

function decodeVapidKey(value: unknown): Uint8Array {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('invalid public key')
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function subscriptionFrom(value: unknown): Subscription | null {
  const candidate = value as Partial<Subscription>
  return typeof candidate?.endpoint === 'string' && typeof candidate.keys?.p256dh === 'string' && typeof candidate.keys.auth === 'string'
    ? { endpoint: candidate.endpoint, keys: { p256dh: candidate.keys.p256dh, auth: candidate.keys.auth } }
    : null
}

type Props = {
  client?: Pick<TimeClient, 'get' | 'post'>
  notification?: NotificationApi | null
  serviceWorker?: ServiceWorkerApi | null
}

export default function PushSettings({ client = timeClient, notification, serviceWorker }: Props) {
  const resolvedNotification = notification === undefined
    ? (typeof window !== 'undefined' && 'Notification' in window ? window.Notification : null)
    : notification
  const resolvedWorker = serviceWorker === undefined
    ? (typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? navigator.serviceWorker : null)
    : serviceWorker
  const [reminders, setReminders] = useState<string[]>([])
  const [prompted, setPrompted] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let cancelled = false
    void client.get<{ reminders?: Array<{ businessDate?: string; business_date?: string }> }>('/push/reminders/pending')
      .then((result) => {
        if (cancelled) return
        setReminders((result.reminders ?? []).flatMap((item) => {
          const date = item.businessDate ?? item.business_date
          return typeof date === 'string' ? [date] : []
        }))
      })
      .catch(() => !cancelled && setError('Pending reminders could not be loaded.'))
    return () => { cancelled = true }
  }, [client])

  const enablePush = async () => {
    setError('')
    if (!resolvedNotification || !resolvedWorker) return setError('Push reminders are not supported in this browser.')
    if (prompted && resolvedNotification.permission !== 'granted') return
    setPending(true)
    try {
      let permission = resolvedNotification.permission
      if (permission === 'denied') {
        setPrompted(true)
        return setMessage('Push permission was not granted. In-app reminders remain available.')
      }
      if (permission !== 'granted') {
        setPrompted(true)
        permission = await resolvedNotification.requestPermission()
      }
      if (permission !== 'granted') return setMessage('Push permission was not granted. In-app reminders remain available.')
      const registration = await resolvedWorker.register('/time-management-sw.js', { scope: '/time-management/' })
      const { publicKey } = await client.get<{ publicKey?: unknown }>('/push/vapid-public-key')
      const subscription = subscriptionFrom((await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(publicKey) })).toJSON())
      if (!subscription) throw new Error('invalid subscription')
      await client.post('/push/subscriptions', subscription)
      setMessage('Push reminders are enabled.')
    } catch {
      setError('Push reminders could not be enabled. In-app reminders remain available.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card title="Reminder settings">
      <div className="space-y-3">
        {reminders.map((date) => <p key={date} role="status" className="rounded-lg bg-warning/10 p-3">Reflection reminder pending for {date}</p>)}
        {message && <p role="status">{message}</p>}
        {error && <Alert role="alert" type="error" showIcon message={error} />}
        <p className="text-sm text-muted-foreground">Pending reminders stay visible whether or not browser Push is enabled.</p>
        <Button className="min-h-11" loading={pending} disabled={prompted && resolvedNotification?.permission !== 'granted'} onClick={() => void enablePush()}>
          Enable push reminders
        </Button>
      </div>
    </Card>
  )
}
