import { describe, expect, test, vi } from 'vitest'
import type { CrmCredentialUser, CrmRepository } from '@/lib/crm/repository'
import { createCredentialsAuthorizer } from '@/lib/auth-options'

function repositoryWith(user: CrmCredentialUser | null): CrmRepository {
  return {
    findUserById: async () => user,
    findUserByEmail: async () => user,
  }
}

function crmUser(overrides: Partial<CrmCredentialUser> = {}): CrmCredentialUser {
  return {
    id: 182,
    name: 'CRM User',
    username: 'agent.kim',
    email: 'agent@example.com',
    password: 'stored-password-hash',
    level: 2,
    status: -1,
    ...overrides,
  }
}

describe('CRM credentials authorization', () => {
  test.each([
    [0, 'admin'],
    [10, 'admin'],
    [2, 'agent'],
    [3, 'agent'],
    [20, 'agent'],
    [30, 'agent'],
  ] as const)('admits active level %s as %s without returning credential fields', async (level, timeRole) => {
    const comparePassword = vi.fn(async () => true)
    const authorize = createCredentialsAuthorizer({
      repository: repositoryWith(crmUser({ level })),
      comparePassword,
    })

    const result = await authorize({ email: 'agent@example.com', password: 'entered-password' })

    expect(result).toEqual({
      id: '182',
      username: 'agent.kim',
      email: 'agent@example.com',
      level,
      timeRole,
    })
    expect(result).not.toHaveProperty('password')
    expect(result).not.toHaveProperty('passwordHash')
    expect(comparePassword).toHaveBeenCalledWith('entered-password', 'stored-password-hash')
  })

  test.each([
    ['stopped account', crmUser({ status: 0 })],
    ['suspended account', crmUser({ status: 1 })],
    ['unapproved level', crmUser({ level: 4 })],
    ['missing password hash', crmUser({ password: null })],
  ])('rejects %s before exposing an authenticated user', async (_label, user) => {
    const authorize = createCredentialsAuthorizer({
      repository: repositoryWith(user),
      comparePassword: async () => true,
    })

    await expect(authorize({ email: 'agent@example.com', password: 'entered-password' })).resolves.toBeNull()
  })

  test('rejects a wrong password and missing credentials', async () => {
    const authorize = createCredentialsAuthorizer({
      repository: repositoryWith(crmUser()),
      comparePassword: async () => false,
    })

    await expect(authorize({ email: 'agent@example.com', password: 'wrong-password' })).resolves.toBeNull()
    await expect(authorize(undefined)).resolves.toBeNull()
  })
})
