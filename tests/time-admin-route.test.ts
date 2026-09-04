import { expect, test, vi } from 'vitest'
import { ServerAuthorizationError } from '@/lib/server-auth'
import { createAdminMemberUpdateHandler } from '@/lib/time-management/admin-members'

test('admin activation derives the current CRM name and normalized role instead of accepting browser identity fields', async () => {
  const fetchTime = vi.fn(async (input) => Response.json({ id: 'time-user-1', name: 'Agent Kim', role: 'agent', isActive: true }))
  const handler = createAdminMemberUpdateHandler({
    getAdmin: async () => ({ externalUserId: '10', name: 'Admin', level: 10, timeRole: 'admin' }),
    repository: { findUserById: async () => ({ id: 84521, name: 'Agent Kim', level: 20, status: -1 }), findUserByEmail: async () => null },
    fetchTime,
  })

  const response = await handler(new Request('https://crm.example.com/api/time-management/admin/members/84521', {
    method: 'PUT', body: JSON.stringify({ isActive: true }),
  }), { params: Promise.resolve({ externalUserId: '84521' }) })

  expect(response.status).toBe(200)
  expect(fetchTime).toHaveBeenCalledWith(expect.objectContaining({
    method: 'PUT', path: '/members/84521', body: { displayName: 'Agent Kim', role: 'agent', isActive: true },
  }))
})

test('agent sessions are denied before CRM lookup or time-service request', async () => {
  const repository = { findUserById: vi.fn(), findUserByEmail: vi.fn() }
  const fetchTime = vi.fn()
  const handler = createAdminMemberUpdateHandler({
    getAdmin: async () => { throw new ServerAuthorizationError('FORBIDDEN', 403) }, repository, fetchTime,
  })

  const response = await handler(new Request('https://crm.example.com/api/time-management/admin/members/84521', {
    method: 'PUT', body: JSON.stringify({ isActive: true }),
  }), { params: Promise.resolve({ externalUserId: '84521' }) })

  expect(response.status).toBe(403)
  expect(repository.findUserById).not.toHaveBeenCalled()
  expect(fetchTime).not.toHaveBeenCalled()
})
