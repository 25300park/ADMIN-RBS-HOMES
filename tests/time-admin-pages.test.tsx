import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminMembersPage from '@/components/time-management/admin-members-page'
import AdminSummaryPage from '@/components/time-management/admin-summary-page'

function wrapper(children: React.ReactNode) {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{children}</QueryClientProvider>)
}

afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('time administration pages', () => {
  it('activates a CRM directory member through the server-derived activation endpoint', async () => {
    const client = {
      get: vi.fn(async (path: string) => {
        if (path.startsWith('/admin/member-directory')) return { members: [{ externalUserId: '84521', name: 'Agent Kim', level: 20, timeRole: 'agent' }] }
        if (path === '/members?externalUserIds=84521') return { members: [] }
        throw new Error(`Unexpected GET ${path}`)
      }),
    }
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({ id: 'time-user-1', name: 'Agent Kim', role: 'agent', isActive: true }))
    wrapper(<AdminMembersPage client={client as never} fetchImpl={fetchImpl} />)

    expect(await screen.findByText('Agent Kim')).toBeInTheDocument()
    expect(screen.getByText('Not activated')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Activate Agent Kim' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm activation' }))

    expect(await screen.findByText('Active')).toBeInTheDocument()
    expect(fetchImpl).toHaveBeenCalledWith('/api/time-management/admin/members/84521', expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ isActive: true }), credentials: 'same-origin',
    }))
    expect(String(fetchImpl.mock.calls[0][1]?.body)).not.toContain('Agent Kim')
    expect(String(fetchImpl.mock.calls[0][1]?.body)).not.toContain('agent')
  })

  it('requires confirmation before deactivation and keeps the member history message intact', async () => {
    const client = {
      get: vi.fn(async (path: string) => path.startsWith('/admin/member-directory')
        ? { members: [{ externalUserId: '84521', name: 'Agent Kim', level: 20, timeRole: 'agent' }] }
        : { members: [{ externalUserId: '84521', role: 'agent', isActive: true }] }),
    }
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({ id: 'time-user-1', name: 'Agent Kim', role: 'agent', isActive: false }))
    wrapper(<AdminMembersPage client={client as never} fetchImpl={fetchImpl} />)

    await screen.findByText('Active')
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate Agent Kim' }))
    expect(screen.getByText('Access will be removed; existing time records will be retained.')).toBeInTheDocument()
    expect(fetchImpl).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm deactivation' }))
    expect(await screen.findByText('Not activated')).toBeInTheDocument()
    expect(fetchImpl).toHaveBeenCalledWith('/api/time-management/admin/members/84521', expect.objectContaining({ body: JSON.stringify({ isActive: false }) }))
  })

  it('shows privacy-safe team metrics and suppresses keywords below three contributors', async () => {
    const privateReflection = 'Do not reveal this private reflection'
    const client = {
      get: vi.fn(async (path: string) => {
        if (path.startsWith('/analytics/admin/members/')) return { members: [{ user: { id: 'time-user-1', name: 'Agent Kim' }, metrics: { completion: { plan: true, time: true }, planVarianceMinutes: -10, coreWorkRatio: 0.5 } }] }
        throw new Error(`Unexpected GET ${path}`)
      }),
      post: vi.fn(async () => ({ status: 'INSUFFICIENT_DATA', contributorCount: 2, keywords: [privateReflection] })),
    }
    wrapper(<AdminSummaryPage client={client as never} />)

    expect(await screen.findByText('Agent Kim')).toBeInTheDocument()
    expect(screen.getByText('Plan and time complete')).toBeInTheDocument()
    expect(screen.getByText('10 minutes under plan')).toBeInTheDocument()
    expect(screen.getByText('50.0% core work')).toBeInTheDocument()
    expect(screen.getByText('Team keywords require at least three contributors.')).toBeInTheDocument()
    expect(screen.queryByText(privateReflection)).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain('reflection')
  })
})
