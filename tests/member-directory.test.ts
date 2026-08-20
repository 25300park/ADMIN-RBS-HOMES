import { expect, test, vi } from 'vitest'
import { ServerAuthorizationError } from '@/lib/server-auth'
import { createCrmRepository } from '@/lib/crm/repository'
import { createMemberDirectoryHandler } from '@/lib/time-management/crm-directory'

function fixture() {
  const user = {
    findUnique: vi.fn(),
    findMany: vi.fn(async () => [
      { id: 201, name: 'Agent Kim', level: 20 },
      { id: 202, name: null, level: 3 },
    ]),
  }
  return { prisma: { user, unit: { findMany: vi.fn() }, contact: { findMany: vi.fn() } }, user }
}

test('admin member directory selects only safe active eligible rows and excludes admin levels by default', async () => {
  const db = fixture()
  const handler = createMemberDirectoryHandler({
    getAdmin: async () => ({ externalUserId: '10', name: 'Admin', level: 10, timeRole: 'admin' }),
    repository: createCrmRepository(db.prisma),
  })
  const response = await handler(new Request('https://crm.example.com/api/time-management/admin/member-directory?q=kim&limit=999'))
  expect(response.status).toBe(200)
  expect(db.user.findMany).toHaveBeenCalledWith({
    where: { status: -1, level: { in: [2, 3, 20, 30] }, name: { contains: 'kim' } },
    select: { id: true, name: true, level: true }, orderBy: { id: 'asc' }, take: 50,
  })
  expect(await response.json()).toEqual({ data: [
    { externalUserId: '201', name: 'Agent Kim', level: 20, timeRole: 'agent' },
    { externalUserId: '202', name: 'CRM User 202', level: 3, timeRole: 'agent' },
  ] })
})

test('admin levels are included only through an explicit includeAdmins search', async () => {
  const db = fixture()
  const handler = createMemberDirectoryHandler({
    getAdmin: async () => ({ externalUserId: '10', name: 'Admin', level: 10, timeRole: 'admin' }),
    repository: createCrmRepository(db.prisma),
  })
  const response = await handler(new Request('https://crm.example.com/api/time-management/admin/member-directory?includeAdmins=true'))
  expect(response.status).toBe(200)
  expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { status: -1, level: { in: [0, 10, 2, 3, 20, 30] } },
  }))
})

test('non-admin sessions are rejected before member lookup', async () => {
  const db = fixture()
  const handler = createMemberDirectoryHandler({
    getAdmin: async () => { throw new ServerAuthorizationError('FORBIDDEN', 403) },
    repository: createCrmRepository(db.prisma),
  })
  const response = await handler(new Request('https://crm.example.com/api/time-management/admin/member-directory'))
  expect(response.status).toBe(403)
  expect(await response.json()).toEqual({ error: { code: 'FORBIDDEN', message: 'Access denied.' } })
  expect(db.user.findMany).not.toHaveBeenCalled()
})

test('member directory validates includeAdmins, query, and limit before lookup', async () => {
  const db = fixture()
  const handler = createMemberDirectoryHandler({
    getAdmin: async () => ({ externalUserId: '10', name: 'Admin', level: 10, timeRole: 'admin' }),
    repository: createCrmRepository(db.prisma),
  })
  for (const query of ['includeAdmins=yes', 'limit=1.5', `q=${'x'.repeat(101)}`]) {
    const response = await handler(new Request(`https://crm.example.com/api/time-management/admin/member-directory?${query}`))
    expect(response.status).toBe(400)
  }
  expect(db.user.findMany).not.toHaveBeenCalled()
})
