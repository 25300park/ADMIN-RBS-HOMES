import 'server-only'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isEligibleCrmUser, normalizeTimeRole, type TimeRole } from '@/lib/auth-policy'
import { crmRepository, type CrmRepository } from '@/lib/crm/repository'

export type CurrentCrmActor = {
  externalUserId: string
  name: string
  level: number
  timeRole: TimeRole
}

type SessionReader = () => Promise<{ user?: { id?: unknown } } | null>

type ServerAuthDependencies = {
  getSession: SessionReader
  repository: CrmRepository
}

export class ServerAuthorizationError extends Error {
  readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN'
  readonly status: 401 | 403

  constructor(code: 'UNAUTHENTICATED' | 'FORBIDDEN', status: 401 | 403) {
    super('Access denied')
    this.name = 'ServerAuthorizationError'
    this.code = code
    this.status = status
  }
}

export function createServerAuth({ getSession, repository }: ServerAuthDependencies) {
  async function currentActor(): Promise<CurrentCrmActor> {
    const session = await getSession()
    const rawId = session?.user?.id
    if (typeof rawId !== 'string' || !/^[1-9]\d*$/.test(rawId)) {
      throw new ServerAuthorizationError('UNAUTHENTICATED', 401)
    }

    const id = Number(rawId)
    if (!Number.isSafeInteger(id)) {
      throw new ServerAuthorizationError('UNAUTHENTICATED', 401)
    }

    const user = await repository.findUserById(id)
    if (!user || !isEligibleCrmUser(user)) {
      throw new ServerAuthorizationError('FORBIDDEN', 403)
    }

    const timeRole = normalizeTimeRole(user.level)
    if (!timeRole) {
      throw new ServerAuthorizationError('FORBIDDEN', 403)
    }

    return {
      externalUserId: String(user.id),
      name: user.name?.trim() || `CRM User ${user.id}`,
      level: user.level,
      timeRole,
    }
  }

  return {
    requireTimeSession: currentActor,
    async requireAdminSession(): Promise<CurrentCrmActor> {
      const actor = await currentActor()
      if (actor.timeRole !== 'admin') {
        throw new ServerAuthorizationError('FORBIDDEN', 403)
      }
      return actor
    },
  }
}

const serverAuth = createServerAuth({
  getSession: () => getServerSession(authOptions),
  repository: crmRepository,
})

export const requireAdminSession = serverAuth.requireAdminSession
export const requireTimeSession = serverAuth.requireTimeSession
