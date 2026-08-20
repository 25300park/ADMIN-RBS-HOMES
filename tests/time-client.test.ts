import { describe, expect, it, vi } from 'vitest'
import { createTimeClient, TimeClientError } from '@/lib/time-management/client'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

describe('time-management browser client', () => {
  it('sends requests only through the same-origin Next.js proxy', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({ ok: true }))
    const client = createTimeClient({ fetchImpl })

    await client.get('/categories')
    await client.put('/plans/today', { availableMinutes: 480, allocations: [] })

    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      '/api/time-management/categories',
      '/api/time-management/plans/today',
    ])
    expect(fetchImpl.mock.calls[0][1]).toMatchObject({ credentials: 'same-origin' })
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({ method: 'PUT', credentials: 'same-origin' })
  })

  it('keeps one requestId when a mutation command is retried', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({ entry: { id: 'entry-1' } }))
    const requestId = vi.fn(() => 'request-123')
    const client = createTimeClient({ fetchImpl, requestId })
    const start = client.createCommand('/entries/timer/start', {
      requestId: 'caller-value-must-not-win',
      standardCategoryId: 'category-1',
    })

    await start()
    await start()

    const payloads = fetchImpl.mock.calls.map(([, init]) => JSON.parse(String(init?.body)))
    expect(requestId).toHaveBeenCalledTimes(1)
    expect(payloads).toEqual([
      { requestId: 'request-123', standardCategoryId: 'category-1' },
      { requestId: 'request-123', standardCategoryId: 'category-1' },
    ])
  })

  it('keeps the generated requestId for retried PATCH revisions', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({ entry: {} }))
    const client = createTimeClient({ fetchImpl, requestId: () => 'revision-request' })
    const revision = client.createMutation('PATCH', '/entries/11111111-1111-4111-8111-111111111111', {
      notes: 'Updated client note',
    })

    await revision()
    await revision()

    expect(fetchImpl.mock.calls.map(([url, init]) => ({
      url,
      method: init?.method,
      body: JSON.parse(String(init?.body)),
    }))).toEqual([
      {
        url: '/api/time-management/entries/11111111-1111-4111-8111-111111111111',
        method: 'PATCH',
        body: { notes: 'Updated client note', requestId: 'revision-request' },
      },
      {
        url: '/api/time-management/entries/11111111-1111-4111-8111-111111111111',
        method: 'PATCH',
        body: { notes: 'Updated client note', requestId: 'revision-request' },
      },
    ])
  })

  it('allows an encoded query while keeping it on the same-origin proxy path', async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({ data: [] }))
    const client = createTimeClient({ fetchImpl })

    await client.get('/crm-links?q=Acme%20Buyer&limit=10')

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/time-management/crm-links?q=Acme%20Buyer&limit=10',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it.each([
    'https://supabase.example/rest/v1/time_entries',
    '//railway.example/internal/time-management/session',
    '/categories/../session',
    '/categories%2fprivate',
    '/categories\\private',
  ])('rejects a path that could bypass the same-origin proxy: %s', async (path) => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({}))
    const client = createTimeClient({ fetchImpl })

    await expect(client.get(path)).rejects.toThrow('Invalid time-management path')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('returns a safe API error without losing the response status', async () => {
    const client = createTimeClient({
      fetchImpl: vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => jsonResponse({
        error: { code: 'TIMER_ALREADY_STOPPED', message: 'Timer is already stopped' },
      }, 409)),
    })

    await expect(client.post('/entries/timer/reconcile', {})).rejects.toEqual(
      expect.objectContaining<Partial<TimeClientError>>({
        name: 'TimeClientError',
        message: 'Timer is already stopped',
        status: 409,
      }),
    )
  })
})
