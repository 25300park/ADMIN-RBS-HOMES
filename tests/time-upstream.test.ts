import { afterEach, expect, test, vi } from 'vitest'
import fixture from './fixtures/time-bff-v1.json'
import { createSignedTimeFetch, isAllowedTimeRoute } from '@/lib/time-management/upstream'

const actor = { externalUserId: '84521', name: 'Agent Kim', level: 20, timeRole: 'agent' as const }
const env = {
  TIME_API_INTERNAL_URL: 'https://railway.internal',
  TIME_BFF_ACTIVE_KID: 'current',
  TIME_BFF_SIGNING_KEY_current: fixture.key,
}

afterEach(() => vi.useRealTimers())

test('forwards the exact once-serialized body with sorted query and fresh BFF headers only', async () => {
  let captured: { url: string; init: RequestInit } | undefined
  const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    captured = { url: String(url), init: init || {} }
    return new Response('{"ok":true}', {
      status: 201,
      headers: { 'content-type': 'application/json', 'set-cookie': 'private=1', authorization: 'private', 'x-internal-host': 'railway.internal' },
    })
  })
  const signedTimeFetch = createSignedTimeFetch({
    fetchImpl, env, now: () => new Date(fixture.issuedAt * 1000), nonce: () => fixture.nonce,
  })

  const response = await signedTimeFetch({
    actor, method: 'POST', path: '/entries/timer/start',
    query: new URLSearchParams('z=last&filter=한글&a=space%20value&a=first'),
    body: { requestId: 'golden-1', notes: '서울 고객 응대' },
  })

  expect(captured?.url).toBe(`https://railway.internal${fixture.pathAndQuery}`)
  expect(new TextDecoder().decode(captured?.init.body as Uint8Array)).toBe(fixture.body)
  const headers = new Headers(captured?.init.headers)
  expect(headers.get('x-time-bff-signature')).toBe(fixture.signature)
  expect(headers.get('cookie')).toBeNull()
  expect(headers.get('authorization')).toBeNull()
  expect(response.status).toBe(201)
  expect(response.headers.get('content-type')).toBe('application/json')
  expect(response.headers.get('set-cookie')).toBeNull()
  expect(response.headers.get('x-internal-host')).toBeNull()
})

test('aborts after exactly ten seconds with a stable non-disclosing timeout', async () => {
  vi.useFakeTimers()
  const fetchImpl = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true })
  }))
  const signedTimeFetch = createSignedTimeFetch({ fetchImpl, env, now: () => new Date(), nonce: () => crypto.randomUUID() })
  const pending = signedTimeFetch({ actor, method: 'GET', path: '/session' })
  await vi.advanceTimersByTimeAsync(9_999)
  expect(fetchImpl).toHaveBeenCalledTimes(1)
  await vi.advanceTimersByTimeAsync(1)
  const response = await pending
  expect(response.status).toBe(504)
  expect(await response.json()).toEqual({ error: { code: 'UPSTREAM_TIMEOUT', message: 'Time service request timed out.' } })
})

test('maps unknown upstream failures without leaking the internal URL or signing key', async () => {
  const signedTimeFetch = createSignedTimeFetch({
    fetchImpl: async () => { throw new Error(`failed ${env.TIME_API_INTERNAL_URL} ${fixture.key}`) },
    env, now: () => new Date(), nonce: () => crypto.randomUUID(),
  })
  const response = await signedTimeFetch({ actor, method: 'GET', path: '/session' })
  const text = await response.text()
  expect(response.status).toBe(503)
  expect(text).toContain('UPSTREAM_UNAVAILABLE')
  expect(text).not.toContain(env.TIME_API_INTERNAL_URL)
  expect(text).not.toContain(fixture.key)
})

test('allow-list admits only existing method and route families', () => {
  expect(isAllowedTimeRoute('GET', '/entries')).toBe(true)
  expect(isAllowedTimeRoute('POST', '/entries/timer/start')).toBe(true)
  expect(isAllowedTimeRoute('PUT', '/members/84521')).toBe(true)
  expect(isAllowedTimeRoute('GET', '/members')).toBe(true)
  expect(isAllowedTimeRoute('DELETE', '/entries')).toBe(false)
  expect(isAllowedTimeRoute('DELETE', '/categories')).toBe(false)
  expect(isAllowedTimeRoute('POST', '/plans/today')).toBe(false)
  expect(isAllowedTimeRoute('POST', '/push/vapid-public-key')).toBe(false)
  expect(isAllowedTimeRoute('GET', '/members/84521')).toBe(false)
  expect(isAllowedTimeRoute('GET', '/crm-links')).toBe(false)
  expect(isAllowedTimeRoute('GET', '/../auth/me')).toBe(false)
  expect(isAllowedTimeRoute('GET', '/entries%2F..%2Fauth')).toBe(false)
})
