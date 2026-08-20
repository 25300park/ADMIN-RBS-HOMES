import { expect, test, vi } from 'vitest'
import { createCrmRepository } from '@/lib/crm/repository'
import {
  createCrmLinksHandler,
  searchCrmDirectory,
} from '@/lib/time-management/crm-directory'

const admin = { externalUserId: '10', name: 'Admin', level: 10, timeRole: 'admin' as const }
const agent = { externalUserId: '182', name: 'Agent', level: 20, timeRole: 'agent' as const }

function prismaWithRows() {
  const unit = { findMany: vi.fn(async () => [{ id: 71, title: 'Riverside', ownerName: 'Private owner' }]) }
  const contact = { findMany: vi.fn(async () => [{ id: 81, name: 'Client Kim', email: 'private@example.test' }]) }
  const user = { findUnique: vi.fn(), findMany: vi.fn() }
  return { prisma: { unit, contact, user }, unit, contact }
}

test('Prisma queries select only canonical Unit and Contact fields with actor scope inside where', async () => {
  const fixture = prismaWithRows()
  const repository = createCrmRepository(fixture.prisma)

  await repository.searchTimeUnits!({ actorId: 182, actorRole: 'agent', query: 'river', limit: 20 })
  await repository.searchTimeContacts!({ actorId: 182, actorRole: 'agent', query: 'kim', limit: 20 })

  expect(fixture.unit.findMany).toHaveBeenCalledWith({
    where: { AND: [{ title: { contains: 'river' } }, { OR: [{ agentId: 182 }, { adminId: 182 }] }] },
    select: { id: true, title: true }, orderBy: { id: 'desc' }, take: 20,
  })
  expect(fixture.contact.findMany).toHaveBeenCalledWith({
    where: { AND: [{ name: { contains: 'kim' } }, { OR: [{ userId: 182 }, { adminId: 182 }] }] },
    select: { id: true, name: true }, orderBy: { id: 'desc' }, take: 20,
  })
})

test('administrators search all matches and canonical output contains no private model fields', async () => {
  const fixture = prismaWithRows()
  const repository = createCrmRepository(fixture.prisma)
  const results = await searchCrmDirectory({
    repository, actor: admin, query: '  client  ', types: ['LISTING', 'CONTACT'], limit: 99,
    env: { TIME_CRM_LINKS_ENABLED: 'true' },
  })

  expect(fixture.unit.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { title: { contains: 'client' } }, take: 50 }))
  expect(fixture.contact.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { name: { contains: 'client' } }, take: 50 }))
  expect(results).toEqual([
    { source: 'MYSQL_CRM', type: 'LISTING', id: '71', label: 'Riverside' },
    { source: 'MYSQL_CRM', type: 'CONTACT', id: '81', label: 'Client Kim' },
  ])
  expect(Object.keys(results[0])).toEqual(['source', 'type', 'id', 'label'])
  expect(Object.keys(results[1])).toEqual(['source', 'type', 'id', 'label'])
})

test('LEAD and DEAL are explicit empty placeholders and never query unrelated models', async () => {
  const fixture = prismaWithRows()
  await expect(searchCrmDirectory({
    repository: createCrmRepository(fixture.prisma), actor: agent, query: '', types: ['LEAD', 'DEAL'], limit: 20,
    env: { TIME_CRM_LINKS_ENABLED: 'true' },
  })).resolves.toEqual([])
  expect(fixture.unit.findMany).not.toHaveBeenCalled()
  expect(fixture.contact.findMany).not.toHaveBeenCalled()
})

test('canonical labels are trimmed to the shared 300-character snapshot contract', async () => {
  const title = `  ${'L'.repeat(350)}  `
  const repository = {
    searchTimeUnits: async () => [{ id: 91, title }],
    searchTimeContacts: async () => [],
    searchEligibleTimeMembers: async () => [],
  }
  const result = await searchCrmDirectory({
    repository, actor: admin, query: '', types: ['LISTING'], limit: 20,
    env: { TIME_CRM_LINKS_ENABLED: 'true' },
  })
  expect(result[0].label).toBe('L'.repeat(300))
})

test('disabled CRM links return a stable unavailable response without querying Prisma', async () => {
  const fixture = prismaWithRows()
  const handler = createCrmLinksHandler({
    getActor: async () => agent,
    repository: createCrmRepository(fixture.prisma),
    env: { TIME_CRM_LINKS_ENABLED: 'false' },
  })
  const response = await handler(new Request('https://crm.example.com/api/time-management/crm-links?q=kim&types=CONTACT&limit=10'))
  expect(response.status).toBe(503)
  expect(await response.json()).toEqual({ error: { code: 'CRM_DIRECTORY_UNAVAILABLE', message: 'CRM directory is unavailable.' } })
  expect(fixture.contact.findMany).not.toHaveBeenCalled()
})

test('invalid types and limits fail before any Prisma query', async () => {
  const fixture = prismaWithRows()
  const handler = createCrmLinksHandler({
    getActor: async () => admin,
    repository: createCrmRepository(fixture.prisma),
    env: { TIME_CRM_LINKS_ENABLED: 'true' },
  })
  for (const query of ['types=OWNER', 'types=', 'limit=not-a-number', `q=${'x'.repeat(101)}`]) {
    const response = await handler(new Request(`https://crm.example.com/api/time-management/crm-links?${query}`))
    expect(response.status).toBe(400)
  }
  expect(fixture.unit.findMany).not.toHaveBeenCalled()
  expect(fixture.contact.findMany).not.toHaveBeenCalled()
})
