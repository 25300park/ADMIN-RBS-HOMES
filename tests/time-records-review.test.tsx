import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RecordsPage from '@/components/time-management/records-page'
import ReflectionPanel from '@/components/time-management/reflection-panel'
import ReviewPage from '@/components/time-management/review-page'

const category = { id: '11111111-1111-4111-8111-111111111111', name: 'Client service' }
const entryId = '22222222-2222-4222-8222-222222222222'

function wrapper(children: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>)
}

function recordsClient() {
  const mutations: Array<{ method: string; path: string; body: Record<string, unknown> }> = []
  return {
    mutations,
    get: vi.fn(async (path: string) => {
      if (path === '/categories') return { standard: [category], personal: [] }
      if (path.startsWith('/entries?businessDate=')) return {
        entries: [{
          id: entryId,
          standard_category_id: category.id,
          started_at: '2026-08-21T00:00:00.000Z',
          ended_at: '2026-08-21T00:45:00.000Z',
          notes: 'Initial client note',
          linked_entity_source: 'MYSQL_CRM',
          linked_entity_type: 'CONTACT',
          linked_entity_id: 'crm-contact-7',
          linked_entity_label: 'Acme Buyer',
          revisions: [{
            id: 'revision-1', entryId, changedAt: '2026-08-21T00:50:00.000Z',
            changedFields: ['notes'], changedBySelf: true,
          }],
        }],
      }
      throw new Error(`Unexpected GET ${path}`)
    }),
    createCommand: vi.fn((path: string, body: Record<string, unknown>) => async () => {
      mutations.push({ method: 'POST', path, body })
      return { entry: {} }
    }),
    createMutation: vi.fn((method: string, path: string, body: Record<string, unknown>) => async () => {
      mutations.push({ method, path, body })
      return { entry: { id: entryId, notes: body.notes } }
    }),
  }
}

describe('native time records and review', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows the stored CRM snapshot and saves a confirmed record revision', async () => {
    const client = recordsClient()
    wrapper(<RecordsPage client={client as never} now={() => new Date('2026-08-21T03:00:00.000Z')} />)

    expect(await screen.findByText('Acme Buyer')).toBeInTheDocument()
    expect(screen.getByText('CRM link unavailable; showing stored snapshot.')).toBeInTheDocument()
    expect(screen.getByText('Changed by you')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Edit record' }))
    fireEvent.change(screen.getByLabelText('Revision notes'), { target: { value: 'Follow-up completed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save revision' }))
    expect(screen.getByRole('button', { name: 'Confirm revision' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm revision' }))

    await screen.findByText('Record revision saved.')
    expect(screen.getByText('Follow-up completed')).toBeInTheDocument()
    expect(client.mutations).toContainEqual({
      method: 'PATCH',
      path: `/entries/${entryId}`,
      body: { notes: 'Follow-up completed' },
    })
  })

  it('creates a manual 30-minute entry only after confirmation', async () => {
    const client = recordsClient()
    wrapper(<RecordsPage client={client as never} now={() => new Date('2026-08-21T03:00:00.000Z')} />)
    await screen.findByText('Initial client note')

    fireEvent.click(screen.getByRole('button', { name: 'Add manual entry' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save manual entry' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm manual entry' }))

    await screen.findByText('Manual entry saved.')
    const body = client.mutations.find((item) => item.path === '/entries/manual')?.body
    expect(body?.standardCategoryId).toBe(category.id)
    expect(Date.parse(String(body?.endedAt)) - Date.parse(String(body?.startedAt))).toBe(30 * 60 * 1000)
  })

  it('renders versioned reflection, metrics, and keyword-first AI review', async () => {
    const reflectionText = 'Private reflection text'
    const client = {
      get: vi.fn(async (path: string) => {
        if (path === '/analytics/personal/today') return {
          metrics: { completion: { plan: true, time: true, reflection: true }, planVarianceMinutes: -15, coreWorkRatio: 0.625 },
          reflection: { id: 'reflection-1', reflection_text: reflectionText, version: 2 },
          review: {
            keywords: ['follow-up', 'focus'], summary: 'Strong client progress.', wins: ['Closed a viewing'],
            blockers: ['Late documents'], next_actions: ['Call the owner'], reflection_version: 2,
          },
        }
        if (path === '/reflections/today') return {
          reflection: { id: 'reflection-1', reflection_text: reflectionText, version: 2 },
          review: { keywords: ['follow-up', 'focus'], summary: 'Strong client progress.' },
        }
        if (path === '/reflections/today/status') return { status: 'COMPLETED' }
        if (path === '/push/reminders/pending') return { reminders: [] }
        throw new Error(`Unexpected GET ${path}`)
      }),
      put: vi.fn(async () => ({ ai: { status: 'PROCESSING' } })),
      post: vi.fn(async () => ({ ai: { status: 'PROCESSING' } })),
    }
    wrapper(<ReviewPage client={client as never} />)

    expect(await screen.findByText('follow-up')).toBeInTheDocument()
    const keyword = screen.getByText('follow-up')
    const summary = screen.getByText('Strong client progress.')
    expect(keyword.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('Closed a viewing')).toBeInTheDocument()
    expect(screen.getByText('Late documents')).toBeInTheDocument()
    expect(screen.getByText('Call the owner')).toBeInTheDocument()
    expect(screen.getByText('Plan and time and reflection complete')).toBeInTheDocument()
    expect(screen.getByText('15 minutes under plan')).toBeInTheDocument()
    expect(screen.getByText('62.5% of tracked time')).toBeInTheDocument()
    expect(screen.getByText('Version 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Daily reflection')).toHaveAttribute('maxLength', '5000')
    expect(screen.getByText(/\/ 5000 characters/)).toBeInTheDocument()
  })

  it('keeps a failed reflection and retries only the AI review', async () => {
    const client = {
      get: vi.fn(async (path: string) => path.endsWith('/status')
        ? { status: 'FAILED', retryable: true }
        : { reflection: { id: 'reflection-1', reflection_text: 'Saved original', version: 3 }, review: null }),
      put: vi.fn(),
      post: vi.fn(async () => ({ ai: { status: 'PROCESSING' } })),
    }
    wrapper(<ReflectionPanel client={client as never} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('original reflection remains available')
    expect(screen.getByLabelText('Daily reflection')).toHaveValue('Saved original')
    fireEvent.click(screen.getByRole('button', { name: 'Retry AI review' }))

    expect(await screen.findByRole('status')).toHaveTextContent('AI review is processing')
    expect(client.post).toHaveBeenCalledWith('/reflections/today/retry', {})
  })

  it('refreshes the keyword review after a saved reflection finishes processing', async () => {
    let analyticsCalls = 0
    let statusCalls = 0
    const metrics = { completion: { plan: true, time: true, reflection: true }, planVarianceMinutes: 0, coreWorkRatio: 0.5 }
    const client = {
      get: vi.fn(async (path: string) => {
        if (path === '/analytics/personal/today') {
          analyticsCalls += 1
          return analyticsCalls === 1
            ? { metrics, reflection: null, review: null }
            : { metrics, reflection: { reflection_text: 'Saved today', version: 1 }, review: { keywords: ['completed-keyword'], summary: 'New review ready.', wins: [], blockers: [], next_actions: [] } }
        }
        if (path === '/reflections/today') return { reflection: null, review: null }
        if (path === '/reflections/today/status') {
          statusCalls += 1
          return { status: statusCalls === 1 ? 'NOT_STARTED' : 'COMPLETED' }
        }
        if (path === '/push/reminders/pending') return { reminders: [] }
        throw new Error(`Unexpected GET ${path}`)
      }),
      put: vi.fn(async () => ({ reflection: { version: 1 }, ai: { status: 'PROCESSING' } })),
      post: vi.fn(),
    }
    wrapper(<ReviewPage client={client as never} />)
    const editor = await screen.findByLabelText('Daily reflection')
    fireEvent.change(editor, { target: { value: 'Saved today' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save reflection' }))

    expect(await screen.findByText('completed-keyword', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('New review ready.')).toBeInTheDocument()
    expect(client.put).toHaveBeenCalledWith('/reflections/today', { reflectionText: 'Saved today' })
  })

  it('loads a historical reflection without replacing today’s editor', async () => {
    const client = {
      get: vi.fn(async (path: string) => {
        if (path === '/analytics/personal/today') return { metrics: { completion: { plan: false, time: false, reflection: false }, planVarianceMinutes: 0, coreWorkRatio: null }, reflection: null, review: null }
        if (path === '/reflections/today') return { reflection: null, review: null }
        if (path === '/reflections/today/status') return { status: 'NOT_STARTED' }
        if (path === '/reflections/2026-08-20') return {
          reflection: { reflection_text: 'Yesterday review', version: 4 },
          review: { keywords: ['planning'], summary: 'Prepared next steps.', wins: [], blockers: [], next_actions: ['Call lead'] },
        }
        if (path === '/push/reminders/pending') return { reminders: [] }
        throw new Error(`Unexpected GET ${path}`)
      }),
      put: vi.fn(), post: vi.fn(),
    }
    wrapper(<ReviewPage client={client as never} />)
    await screen.findByText('No AI review is available yet.')

    fireEvent.change(screen.getByLabelText('Review date'), { target: { value: '2026-08-20' } })
    fireEvent.click(screen.getByRole('button', { name: 'Load review date' }))

    expect(await screen.findByText('Yesterday review')).toBeInTheDocument()
    expect(screen.getByText('Historical version 4')).toBeInTheDocument()
    expect(screen.getByLabelText('Daily reflection')).toHaveValue('')
  })
})
