import 'server-only'

import { ServerAuthorizationError } from '@/lib/server-auth'
import { safeTimeError } from './errors'
import { isAllowedTimeRoute } from './upstream'
import type { SignedTimeFetchInput, TimeActor } from '@/types/time-management'

type TimeProxyDependencies = {
  getActor: () => Promise<TimeActor>
  fetchTime: (input: SignedTimeFetchInput) => Promise<Response>
}

type TimeRouteContext = {
  params: Promise<{ path: string[] }>
}

async function actorOrResponse(getActor: () => Promise<TimeActor>): Promise<TimeActor | Response> {
  try {
    return await getActor()
  } catch (error) {
    if (error instanceof ServerAuthorizationError) {
      return safeTimeError(error.status, error.code, 'Access denied.')
    }
    return safeTimeError(503, 'AUTH_UNAVAILABLE', 'CRM authorization is temporarily unavailable.')
  }
}

export function createTimeProxyHandler({ getActor, fetchTime }: TimeProxyDependencies) {
  return async (request: Request, context: TimeRouteContext): Promise<Response> => {
    const { path: segments } = await context.params
    const path = `/${segments.join('/')}`
    if (!isAllowedTimeRoute(request.method, path)) {
      return safeTimeError(405, 'METHOD_NOT_ALLOWED', 'Time route is not allowed.')
    }

    const actor = await actorOrResponse(getActor)
    if (actor instanceof Response) return actor

    let body: unknown
    if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
      try {
        body = await request.json()
      } catch {
        return safeTimeError(400, 'INVALID_REQUEST', 'Request body must be valid JSON.')
      }
    }

    return fetchTime({
      actor,
      method: request.method,
      path,
      query: new URL(request.url).searchParams,
      body,
      signal: request.signal,
    })
  }
}

export function createTimeAccessHandler({ getActor, fetchTime }: TimeProxyDependencies) {
  return async (): Promise<Response> => {
    const actor = await actorOrResponse(getActor)
    if (actor instanceof Response) return actor
    return fetchTime({ actor, method: 'GET', path: '/session' })
  }
}
