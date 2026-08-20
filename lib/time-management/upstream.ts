import 'server-only'

import { createHash, randomUUID } from 'node:crypto'
import { normalizeBffPathAndQuery, signBffRequest } from './bff-signature'
import { safeTimeError } from './errors'
import type { SignedTimeFetchInput } from '@/types/time-management'

type TimeEnvironment = Record<string, string | undefined>
type TimeFetch = (input: SignedTimeFetchInput) => Promise<Response>
type Dependencies = {
  fetchImpl?: typeof fetch
  env?: TimeEnvironment
  now?: () => Date
  nonce?: () => string
  timeoutMs?: number
}

const ROUTES: ReadonlyArray<[string, RegExp]> = [
  ['GET', /^\/session$/],
  ['GET', /^\/categories$/],
  ['POST', /^\/categories\/(?:standard|personal)$/],
  ['PATCH', /^\/categories\/(?:standard|personal)\/[^/]+$/],
  ['DELETE', /^\/categories\/personal\/[^/]+$/],
  ['GET', /^\/plans\/(?:today|\d{4}-\d{2}-\d{2})$/],
  ['PUT', /^\/plans\/today$/],
  ['GET', /^\/entries$/],
  ['POST', /^\/entries\/(?:timer\/(?:start|switch|stop|reconcile)|manual)$/],
  ['PATCH', /^\/entries\/[0-9a-f-]{36}$/i],
  ['GET', /^\/reflections\/(?:today(?:\/status)?|\d{4}-\d{2}-\d{2})$/],
  ['PUT', /^\/reflections\/today$/],
  ['POST', /^\/reflections\/today\/retry$/],
  ['GET', /^\/analytics\/(?:personal\/(?:today|\d{4}-\d{2}-\d{2})|admin\/members\/\d{4}-\d{2}-\d{2})$/],
  ['POST', /^\/analytics\/admin\/team-keywords$/],
  ['GET', /^\/push\/(?:vapid-public-key|reminders\/pending)$/],
  ['POST', /^\/push\/subscriptions$/],
  ['DELETE', /^\/push\/subscriptions$/],
  ['PUT', /^\/members\/[1-9]\d*$/],
]

export function isAllowedTimeRoute(method: string, path: string): boolean {
  if (!path.startsWith('/') || path.includes('..') || path.includes('\\') || /%2f|%5c/i.test(path)) return false
  const normalizedMethod = method.toUpperCase()
  return ROUTES.some(([allowedMethod, pattern]) => allowedMethod === normalizedMethod && pattern.test(path))
}

function readConfig(env: TimeEnvironment) {
  const rawUrl = env.TIME_API_INTERNAL_URL
  const kid = env.TIME_BFF_ACTIVE_KID
  if (!rawUrl || !kid || !/^[A-Za-z0-9_-]{1,32}$/.test(kid)) throw new Error('invalid time service config')
  const key = env[`TIME_BFF_SIGNING_KEY_${kid}`]
  if (!key || Buffer.byteLength(key) < 32) throw new Error('invalid time service config')
  const url = new URL(rawUrl)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('invalid time service config')
  }
  return { baseUrl: url.origin, kid, key }
}

function safeHeaders(source: Headers): Headers {
  const headers = new Headers()
  for (const name of ['content-type', 'cache-control', 'etag', 'last-modified', 'retry-after', 'x-request-id']) {
    const value = source.get(name)
    if (value) headers.set(name, value)
  }
  return headers
}

export function createSignedTimeFetch({
  fetchImpl = fetch,
  env = process.env,
  now = () => new Date(),
  nonce = randomUUID,
  timeoutMs = 10_000,
}: Dependencies = {}): TimeFetch {
  return async ({ actor, method, path, query, body, signal }) => {
    try {
      const { baseUrl, kid, key } = readConfig(env)
      const bodyBytes = body === undefined
        ? new Uint8Array()
        : new TextEncoder().encode(JSON.stringify(body))
      const issuedAt = Math.floor(now().getTime() / 1000)
      const pathAndQuery = normalizeBffPathAndQuery(
        `/internal/time-management${path}${query?.size ? `?${query.toString()}` : ''}`)
      const envelope = {
        kid, method: method.toUpperCase(), pathAndQuery, issuedAt, expiresAt: issuedAt + 60,
        nonce: nonce(), externalUserId: actor.externalUserId, role: actor.timeRole,
        bodyDigest: createHash('sha256').update(bodyBytes).digest('hex'),
      }
      const controller = new AbortController()
      let timedOut = false
      const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
      const relayAbort = () => controller.abort()
      signal?.addEventListener('abort', relayAbort, { once: true })
      try {
        const headers = new Headers({
          'x-time-bff-version': '1',
          'x-time-bff-kid': kid,
          'x-time-bff-issued-at': String(envelope.issuedAt),
          'x-time-bff-expires-at': String(envelope.expiresAt),
          'x-time-bff-nonce': envelope.nonce,
          'x-time-bff-external-user-id': envelope.externalUserId,
          'x-time-bff-role': envelope.role,
          'x-time-bff-content-sha256': envelope.bodyDigest,
          'x-time-bff-signature': signBffRequest(envelope, key),
        })
        if (body !== undefined) headers.set('content-type', 'application/json; charset=utf-8')
        const upstream = await fetchImpl(`${baseUrl}${pathAndQuery}`, {
          method: envelope.method,
          headers,
          body: body === undefined ? undefined : bodyBytes,
          signal: controller.signal,
          cache: 'no-store',
        })
        return new Response(upstream.body, { status: upstream.status, headers: safeHeaders(upstream.headers) })
      } catch {
        return timedOut
          ? safeTimeError(504, 'UPSTREAM_TIMEOUT', 'Time service request timed out.')
          : safeTimeError(503, 'UPSTREAM_UNAVAILABLE', 'Time service is temporarily unavailable.')
      } finally {
        clearTimeout(timer)
        signal?.removeEventListener('abort', relayAbort)
      }
    } catch {
      return safeTimeError(503, 'UPSTREAM_UNAVAILABLE', 'Time service is temporarily unavailable.')
    }
  }
}

export const signedTimeFetch = createSignedTimeFetch()
