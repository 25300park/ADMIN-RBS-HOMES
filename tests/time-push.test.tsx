import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PushSettings from '@/components/time-management/push-settings'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function api() {
  return {
    get: vi.fn(async (path: string) => {
      if (path === '/push/reminders/pending') return {
        reminders: [{ businessDate: '2026-08-20', body: 'Write today’s reflection', url: '/time-management/review' }],
      }
      if (path === '/push/vapid-public-key') return { publicKey: 'AQID' }
      throw new Error(`Unexpected GET ${path}`)
    }),
    post: vi.fn(async () => ({ subscription: { id: 'subscription-1' } })),
  }
}

describe('time-management reminder fallback', () => {
  it('keeps pending in-app reminders when Push is unavailable', async () => {
    const client = api()
    render(<PushSettings client={client as never} notification={null} serviceWorker={null} />)

    expect(await screen.findByText('Reflection reminder pending for 2026-08-20')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Enable push reminders' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('not supported')
    expect(screen.getByText('Reflection reminder pending for 2026-08-20')).toBeInTheDocument()
  })

  it('does not repeatedly prompt after permission is denied', async () => {
    const client = api()
    const requestPermission = vi.fn(async () => 'denied' as NotificationPermission)
    const notification = { permission: 'default' as NotificationPermission, requestPermission }
    render(<PushSettings client={client as never} notification={notification} serviceWorker={{} as never} />)
    await screen.findByText('Reflection reminder pending for 2026-08-20')

    fireEvent.click(screen.getByRole('button', { name: 'Enable push reminders' }))
    expect(await screen.findByText(/In-app reminders remain available/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Enable push reminders' }))
    expect(requestPermission).toHaveBeenCalledTimes(1)
  })

  it('registers the same-origin worker after user action and sends only the subscription', async () => {
    const client = api()
    const subscribe = vi.fn(async () => ({
      toJSON: () => ({ endpoint: 'https://push.example/subscription', keys: { p256dh: 'public-key', auth: 'auth-secret' } }),
    }))
    const register = vi.fn(async () => ({ pushManager: { subscribe } }))
    const notification = { permission: 'granted' as NotificationPermission, requestPermission: vi.fn() }
    render(<PushSettings client={client as never} notification={notification} serviceWorker={{ register } as never} />)
    await screen.findByText('Reflection reminder pending for 2026-08-20')
    expect(register).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Enable push reminders' }))

    expect(await screen.findByText('Push reminders are enabled.')).toBeInTheDocument()
    expect(register).toHaveBeenCalledWith('/time-management-sw.js', { scope: '/time-management/' })
    expect(client.post).toHaveBeenCalledWith('/push/subscriptions', {
      endpoint: 'https://push.example/subscription',
      keys: { p256dh: 'public-key', auth: 'auth-secret' },
    })
    const posted = JSON.stringify(client.post.mock.calls)
    expect(posted).not.toMatch(/service.role|provider.key|private.key/i)
  })
})
