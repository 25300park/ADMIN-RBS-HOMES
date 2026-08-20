import 'server-only'

import prisma from '@/lib/prisma'
import type { TimeRole } from '@/lib/auth-policy'

export type CrmSessionUser = {
  id: number
  name: string | null
  level: number
  status: number
}

export type CrmCredentialUser = CrmSessionUser & {
  username: string | null
  email: string | null
  password: string | null
}

export type CrmRepository = {
  findUserById(id: number): Promise<CrmSessionUser | null>
  findUserByEmail(email: string): Promise<CrmCredentialUser | null>
  searchTimeUnits?(input: TimeSearchInput): Promise<Array<{ id: number; title: string }>>
  searchTimeContacts?(input: TimeSearchInput): Promise<Array<{ id: number; name: string }>>
  searchEligibleTimeMembers?(input: MemberSearchInput): Promise<Array<{ id: number; name: string | null; level: number }>>
}

export type CrmDirectoryRepository = Required<Pick<CrmRepository,
  'searchTimeUnits' | 'searchTimeContacts' | 'searchEligibleTimeMembers'>>

type TimeSearchInput = { actorId: number; actorRole: TimeRole; query: string; limit: number }
type MemberSearchInput = { query: string; levels: number[]; limit: number }
type DirectoryPrisma = {
  user: { findUnique(args: unknown): Promise<unknown>; findMany(args: unknown): Promise<unknown> }
  unit: { findMany(args: unknown): Promise<unknown> }
  contact: { findMany(args: unknown): Promise<unknown> }
}

const clampLimit = (limit: number) => Math.min(50, Math.max(1, limit))

export function createCrmRepository(client: DirectoryPrisma): CrmRepository & CrmDirectoryRepository {
  return {
    findUserById(id) {
      return client.user.findUnique({
        where: { id },
        select: { id: true, name: true, level: true, status: true },
      }) as Promise<CrmSessionUser | null>
    },
    findUserByEmail(email) {
      return client.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          password: true,
          level: true,
          status: true,
        },
      }) as Promise<CrmCredentialUser | null>
    },
    searchTimeUnits({ actorId, actorRole, query, limit }) {
      const match = { title: { contains: query } }
      const scope = { OR: [{ agentId: actorId }, { adminId: actorId }] }
      const where = actorRole === 'admin'
        ? (query ? match : {})
        : (query ? { AND: [match, scope] } : scope)
      return client.unit.findMany({
        where, select: { id: true, title: true }, orderBy: { id: 'desc' }, take: clampLimit(limit),
      }) as Promise<Array<{ id: number; title: string }>>
    },
    searchTimeContacts({ actorId, actorRole, query, limit }) {
      const match = { name: { contains: query } }
      const scope = { OR: [{ userId: actorId }, { adminId: actorId }] }
      const where = actorRole === 'admin'
        ? (query ? match : {})
        : (query ? { AND: [match, scope] } : scope)
      return client.contact.findMany({
        where, select: { id: true, name: true }, orderBy: { id: 'desc' }, take: clampLimit(limit),
      }) as Promise<Array<{ id: number; name: string }>>
    },
    searchEligibleTimeMembers({ query, levels, limit }) {
      return client.user.findMany({
        where: { status: -1, level: { in: levels }, ...(query ? { name: { contains: query } } : {}) },
        select: { id: true, name: true, level: true }, orderBy: { id: 'asc' }, take: clampLimit(limit),
      }) as Promise<Array<{ id: number; name: string | null; level: number }>>
    },
  }
}

export const crmRepository = createCrmRepository(prisma as unknown as DirectoryPrisma)
