import { describe, expect, test } from 'vitest'
import type { CrmRepository, CrmSessionUser } from '@/lib/crm/repository'
import { createServerAuth, ServerAuthorizationError } from '@/lib/server-auth'

function repositoryWith(user: CrmSessionUser | null): CrmRepository {
  return {
    findUserById: async () => user,
    findUserByEmail: async () => null,
  }
}

function sessionFor(id: string | null) {
  return async () => id ? ({ user: { id } }) : null
}

describe('current CRM server authorization', () => {
  test('returns a minimal current actor using the fresh MySQL row', async () => {
    const auth = createServerAuth({
      getSession: sessionFor('182'),
      repository: repositoryWith({ id: 182, name: 'Agent Kim', level: 20, status: -1 }),
    })

    await expect(auth.requireTimeSession()).resolves.toEqual({
      externalUserId: '182',
      name: 'Agent Kim',
      level: 20,
      timeRole: 'agent',
    })
  })

  test('allows only current administrator levels through the admin guard', async () => {
    for (const level of [0, 10]) {
      const auth = createServerAuth({
        getSession: sessionFor('180'),
        repository: repositoryWith({ id: 180, name: 'Admin', level, status: -1 }),
      })
      await expect(auth.requireAdminSession()).resolves.toMatchObject({ timeRole: 'admin' })
    }

    const agentAuth = createServerAuth({
      getSession: sessionFor('182'),
      repository: repositoryWith({ id: 182, name: 'Agent', level: 2, status: -1 }),
    })
    await expect(agentAuth.requireAdminSession()).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 })
  })

  test('rejects missing, malformed, deleted, stopped, and newly ineligible identities', async () => {
    const cases = [
      { getSession: sessionFor(null), user: null, code: 'UNAUTHENTICATED', status: 401 },
      { getSession: sessionFor('not-an-id'), user: null, code: 'UNAUTHENTICATED', status: 401 },
      { getSession: sessionFor('182'), user: null, code: 'FORBIDDEN', status: 403 },
      { getSession: sessionFor('182'), user: { id: 182, name: 'Stopped', level: 2, status: 0 }, code: 'FORBIDDEN', status: 403 },
      { getSession: sessionFor('182'), user: { id: 182, name: 'Owner', level: 4, status: -1 }, code: 'FORBIDDEN', status: 403 },
    ] as const

    for (const item of cases) {
      const auth = createServerAuth({
        getSession: item.getSession,
        repository: repositoryWith(item.user),
      })
      await expect(auth.requireTimeSession()).rejects.toMatchObject({ code: item.code, status: item.status })
    }
  })

  test('uses a non-sensitive fallback when the current name is blank', async () => {
    const auth = createServerAuth({
      getSession: sessionFor('182'),
      repository: repositoryWith({ id: 182, name: '   ', level: 3, status: -1 }),
    })

    await expect(auth.requireTimeSession()).resolves.toMatchObject({ name: 'CRM User 182' })
  })

  test('authorization errors expose only a stable code and status', () => {
    const error = new ServerAuthorizationError('FORBIDDEN', 403)
    expect(error).toMatchObject({ name: 'ServerAuthorizationError', code: 'FORBIDDEN', status: 403 })
    expect(error.message).toBe('Access denied')
  })
})
