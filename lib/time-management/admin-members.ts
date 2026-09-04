import 'server-only'

import { isEligibleCrmUser, normalizeTimeRole } from '@/lib/auth-policy'
import type { CrmRepository } from '@/lib/crm/repository'
import { ServerAuthorizationError, type CurrentCrmActor } from '@/lib/server-auth'
import { safeTimeError } from './errors'
import type { SignedTimeFetchInput } from '@/types/time-management'

type Context = { params: Promise<{ externalUserId: string }> }

export function createAdminMemberUpdateHandler({
  getAdmin, repository, fetchTime,
}: {
  getAdmin: () => Promise<CurrentCrmActor>
  repository: CrmRepository
  fetchTime: (input: SignedTimeFetchInput) => Promise<Response>
}) {
  return async (request: Request, context: Context): Promise<Response> => {
    let actor: CurrentCrmActor
    try {
      actor = await getAdmin()
    } catch (error) {
      if (error instanceof ServerAuthorizationError) return safeTimeError(error.status, error.code, 'Access denied.')
      return safeTimeError(503, 'AUTH_UNAVAILABLE', 'CRM authorization is temporarily unavailable.')
    }

    const { externalUserId } = await context.params
    if (!/^[1-9]\d*$/.test(externalUserId)) return safeTimeError(400, 'INVALID_MEMBER', 'Member is invalid.')
    let body: { isActive?: unknown }
    try { body = await request.json() } catch { return safeTimeError(400, 'INVALID_REQUEST', 'Request body must be valid JSON.') }
    if (typeof body.isActive !== 'boolean' || Object.keys(body).length !== 1) return safeTimeError(400, 'INVALID_REQUEST', 'Member update is invalid.')

    const member = await repository.findUserById(Number(externalUserId))
    const role = member && normalizeTimeRole(member.level)
    if (!member || !role || !isEligibleCrmUser(member)) return safeTimeError(404, 'MEMBER_NOT_FOUND', 'Member is unavailable.')

    return fetchTime({
      actor,
      method: 'PUT',
      path: `/members/${externalUserId}`,
      body: { displayName: member.name?.trim() || `CRM User ${member.id}`, role, isActive: body.isActive },
      signal: request.signal,
    })
  }
}
