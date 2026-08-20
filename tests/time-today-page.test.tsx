import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TodayPage from '@/components/time-management/today-page'

const categories = {
  standard: [
    { id: 'calls', name: 'Client calls', color: '#2563eb' },
    { id: 'search', name: 'Property search', color: '#16a34a' },
  ],
  personal: [],
}

const emptyPlan = { plan: null, allocations: [], varianceMinutes: 0 }

type ActiveEntry = null | {
  id: string
  standardCategoryId: string
  startedAt: string
  crmLink?: { source: 'MYSQL_CRM'; type: string; id: string; label: string }
}

function createFakeClient(options: { pending?: boolean; failStart?: boolean } = {}) {
  let active: ActiveEntry = null
  const calls: Array<{ method: string; path: string; body?: Record<string, unknown> }> = []
  const forever = new Promise<never>(() => {})

  return {
    calls,
    setActive(value: ActiveEntry) {
      active = value
    },
    get: vi.fn(async (path: string) => {
      if (options.pending) return forever
      if (path === '/categories') return categories
      if (path === '/plans/today') return emptyPlan
      if (path.startsWith('/crm-links')) {
        return { data: [{ source: 'MYSQL_CRM', type: 'CONTACT', id: 'crm-7', label: 'Acme Buyer' }] }
      }
      throw new Error(`Unexpected GET ${path}`)
    }),
    post: vi.fn(async (path: string, body?: Record<string, unknown>) => {
      calls.push({ method: 'POST', path, body })
      if (path === '/entries/timer/reconcile') {
        return { matches: false, authoritativeEntry: active }
      }
      throw new Error(`Unexpected POST ${path}`)
    }),
    put: vi.fn(async (path: string, body?: Record<string, unknown>) => {
      calls.push({ method: 'PUT', path, body })
      return emptyPlan
    }),
    createCommand: vi.fn((path: string, body?: Record<string, unknown>) => async () => {
      calls.push({ method: 'COMMAND', path, body })
      if (path.endsWith('/start')) {
        if (options.failStart) throw new Error('Timer service unavailable')
        active = {
          id: 'entry-start',
          standardCategoryId: String(body?.standardCategoryId),
          startedAt: '2026-08-21T00:00:00.000Z',
          crmLink: body?.crmLink as ActiveEntry extends infer _ ? any : never,
        }
      } else if (path.endsWith('/switch')) {
        active = {
          id: 'entry-switch',
          standardCategoryId: String(body?.standardCategoryId),
          startedAt: '2026-08-21T01:00:00.000Z',
          crmLink: body?.crmLink as ActiveEntry extends infer _ ? any : never,
        }
      } else if (path.endsWith('/stop')) {
        active = null
      }
      return { entry: active }
    }),
  }
}

function renderPage(client: ReturnType<typeof createFakeClient>, approvalActive = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TodayPage client={client as never} approvalActive={approvalActive} />
    </QueryClientProvider>,
  )
}

describe('native time-management today page', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows a loading state while daily data is pending', () => {
    renderPage(createFakeClient({ pending: true }))
    expect(screen.getByRole('status')).toHaveTextContent('Loading today’s work')
  })

  it('blocks controls when time-management approval is inactive', () => {
    const client = createFakeClient()
    renderPage(client, false)

    expect(screen.getByRole('heading', { name: 'Approval required' })).toBeInTheDocument()
    expect(client.get).not.toHaveBeenCalled()
  })

  it('shows an empty daily plan without inventing allocations', async () => {
    renderPage(createFakeClient())
    expect(await screen.findByText('No daily plan yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save daily plan' })).toBeEnabled()
  })

  it('selects a CRM record and performs start, atomic switch, and stop', async () => {
    const client = createFakeClient()
    renderPage(client)
    await screen.findByText('No timer running')

    fireEvent.change(screen.getByLabelText('CRM search'), { target: { value: 'Acme' } })
    fireEvent.click(screen.getByRole('button', { name: 'Search CRM' }))
    const crmSelect = await screen.findByLabelText('CRM record')
    fireEvent.change(crmSelect, { target: { value: 'CONTACT:crm-7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))

    expect(await screen.findByText('Running: Client calls')).toBeInTheDocument()
    expect(screen.getByText('Acme Buyer', { selector: 'p' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Work category'), { target: { value: 'search' } })
    fireEvent.click(screen.getByRole('button', { name: 'Switch task' }))
    expect(await screen.findByText('Running: Property search')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Stop timer' }))
    expect(await screen.findByText('No timer running')).toBeInTheDocument()
    expect(screen.getByLabelText('CRM record')).toHaveValue('')

    expect(client.calls.filter((call) => call.method === 'COMMAND').map((call) => call.path)).toEqual([
      '/entries/timer/start',
      '/entries/timer/switch',
      '/entries/timer/stop',
    ])
    expect(client.calls.find((call) => call.path.endsWith('/start'))?.body?.crmLink).toEqual({
      source: 'MYSQL_CRM',
      type: 'CONTACT',
      id: 'crm-7',
      label: 'Acme Buyer',
    })
  })

  it('surfaces an API failure and keeps the timer stopped', async () => {
    renderPage(createFakeClient({ failStart: true }))
    await screen.findByText('No timer running')

    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Timer service unavailable')
    expect(screen.getByText('No timer running')).toBeInTheDocument()
  })

  it('shows elapsed time for the authoritative running timer', async () => {
    const client = createFakeClient()
    client.setActive({
      id: 'elapsed-entry',
      standardCategoryId: 'calls',
      startedAt: new Date(Date.now() - 65_000).toISOString(),
    })
    renderPage(client)

    expect(await screen.findByText(/^Elapsed 00:01:0[45]$/)).toBeInTheDocument()
  })

  it('replaces local timer display with the server state after reconnecting', async () => {
    const client = createFakeClient()
    renderPage(client)
    await screen.findByText('No timer running')

    client.setActive({
      id: 'server-entry',
      standardCategoryId: 'search',
      startedAt: '2026-08-21T02:00:00.000Z',
      linked_entity_source: 'MYSQL_CRM',
      linked_entity_type: 'LISTING',
      linked_entity_id: 'listing-8',
      linked_entity_label: 'Riverside Condo',
    } as never)
    window.dispatchEvent(new Event('online'))

    expect(await screen.findByText('Running: Property search')).toBeInTheDocument()
    expect(screen.getByText('Riverside Condo', { selector: 'p' })).toBeInTheDocument()
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('rbs:time-management:active-timer:v1') || '{}')).toMatchObject({
        entryId: 'server-entry',
        categoryId: 'search',
      })
    })
  })
})
