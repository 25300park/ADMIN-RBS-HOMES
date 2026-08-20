import { expect, test, vi } from 'vitest'
import { ServerAuthorizationError } from '@/lib/server-auth'
import { createTimeAccessHandler, createTimeProxyHandler } from '@/lib/time-management/proxy'

const actor = { externalUserId: '84521', name: 'Agent Kim', level: 20, timeRole: 'agent' as const }

test('same-origin handler authenticates then forwards only parsed JSON and query state', async () => {
  const handler = createTimeProxyHandler({
    getActor: async () => actor,
    fetchTime: async (input) => {
      const matches = input.actor === actor
        && input.method === 'POST'
        && input.path === '/entries/timer/start'
        && input.query?.get('businessDate') === '2026-08-20'
        && JSON.stringify(input.body) === '{"requestId":"route-1"}'
      return Response.json({ forwarded: matches }, { status: matches ? 201 : 500 })
    },
  })
  const request = new Request('https://crm.example.com/api/time-management/entries/timer/start?businessDate=2026-08-20', {
    method: 'POST',
    headers: { cookie: 'crm-session=private', authorization: 'Bearer private', 'content-type': 'application/json' },
    body: '{"requestId":"route-1"}',
  })
  const response = await handler(request, { params: Promise.resolve({ path: ['entries', 'timer', 'start'] }) })
  expect(response.status).toBe(201)
  expect(await response.json()).toEqual({ forwarded: true })
})

test('same-origin handler rejects unsupported routes before any upstream request', async () => {
  const response = await createTimeProxyHandler({
    getActor: async () => actor,
    fetchTime: vi.fn(async () => Response.json({ unsafe: true })),
  })(new Request('https://crm.example.com/api/time-management/crm-links', { method: 'GET' }), {
    params: Promise.resolve({ path: ['crm-links'] }),
  })
  expect(response.status).toBe(405)
  expect(await response.json()).toEqual({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Time route is not allowed.' } })
})

test('same-origin handler maps fresh CRM authorization failures without internal detail', async () => {
  const handler = createTimeProxyHandler({
    getActor: async () => { throw new ServerAuthorizationError('UNAUTHENTICATED', 401) },
    fetchTime: async () => Response.json({ unsafe: true }),
  })
  const response = await handler(new Request('https://crm.example.com/api/time-management/session'), {
    params: Promise.resolve({ path: ['session'] }),
  })
  expect(response.status).toBe(401)
  expect(await response.json()).toEqual({ error: { code: 'UNAUTHENTICATED', message: 'Access denied.' } })
})

test('access handler resolves the current mapped session through the signed boundary', async () => {
  const response = await createTimeAccessHandler({
    getActor: async () => actor,
    fetchTime: async (input) => input.path === '/session' && input.method === 'GET'
      ? Response.json({ role: input.actor.timeRole })
      : Response.json({ error: true }, { status: 500 }),
  })()
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ role: 'agent' })
})
