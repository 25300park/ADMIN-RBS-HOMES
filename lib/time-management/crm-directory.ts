import 'server-only'

import { normalizeTimeRole } from '@/lib/auth-policy'
import { ServerAuthorizationError } from '@/lib/server-auth'
import type { CrmDirectoryRepository } from '@/lib/crm/repository'
import { safeTimeError } from './errors'
import type { TimeActor } from '@/types/time-management'

export type CrmLinkType = 'LISTING' | 'CONTACT' | 'LEAD' | 'DEAL'
type Environment = Record<string, string | undefined>
type GetActor = () => Promise<TimeActor>

type DirectoryInput = {
  repository: CrmDirectoryRepository
  actor: TimeActor
  query: string
  types: CrmLinkType[]
  limit: number
  env: Environment
}

class DirectoryRequestError extends Error {
  constructor(readonly status: number, readonly code: string, readonly safeMessage: string) {
    super(code)
  }
}

const clampLimit = (limit: number) => Math.min(50, Math.max(1, limit))
const safeLabel = (value: string) => value.trim().slice(0, 300)

export async function searchCrmDirectory({ repository, actor, query, types, limit, env }: DirectoryInput) {
  if (env.TIME_CRM_LINKS_ENABLED !== 'true') {
    throw new DirectoryRequestError(503, 'CRM_DIRECTORY_UNAVAILABLE', 'CRM directory is unavailable.')
  }
  const normalizedQuery = query.trim()
  const take = clampLimit(limit)
  const actorId = Number(actor.externalUserId)
  const results: Array<{ source: 'MYSQL_CRM'; type: 'LISTING' | 'CONTACT'; id: string; label: string }> = []

  if (types.includes('LISTING')) {
    const rows = await repository.searchTimeUnits({ actorId, actorRole: actor.timeRole, query: normalizedQuery, limit: take })
    results.push(...rows.map(row => ({ source: 'MYSQL_CRM' as const, type: 'LISTING' as const, id: String(row.id), label: safeLabel(row.title) })))
  }
  if (types.includes('CONTACT')) {
    const rows = await repository.searchTimeContacts({ actorId, actorRole: actor.timeRole, query: normalizedQuery, limit: take })
    results.push(...rows.map(row => ({ source: 'MYSQL_CRM' as const, type: 'CONTACT' as const, id: String(row.id), label: safeLabel(row.name) })))
  }
  return results.slice(0, take)
}

function parseLimit(value: string | null): number {
  if (value === null) return 20
  const parsed = Number(value)
  if (!Number.isInteger(parsed)) throw new DirectoryRequestError(400, 'INVALID_REQUEST', 'Directory query is invalid.')
  return clampLimit(parsed)
}

function parseQuery(value: string | null): string {
  const query = (value || '').trim()
  if (query.length > 100) throw new DirectoryRequestError(400, 'INVALID_REQUEST', 'Directory query is invalid.')
  return query
}

function parseTypes(search: URLSearchParams): CrmLinkType[] {
  const raw = search.getAll('types')
  if (raw.length === 0) return ['LISTING', 'CONTACT']
  const values = [...new Set(raw.flatMap(value => value.split(',')).map(value => value.trim()).filter(Boolean))]
  const allowed = new Set<CrmLinkType>(['LISTING', 'CONTACT', 'LEAD', 'DEAL'])
  if (values.length === 0 || values.some(value => !allowed.has(value as CrmLinkType))) {
    throw new DirectoryRequestError(400, 'INVALID_REQUEST', 'Directory query is invalid.')
  }
  return values as CrmLinkType[]
}

function safeFailure(error: unknown): Response {
  if (error instanceof ServerAuthorizationError) return safeTimeError(error.status, error.code, 'Access denied.')
  if (error instanceof DirectoryRequestError) return safeTimeError(error.status, error.code, error.safeMessage)
  return safeTimeError(503, 'CRM_DIRECTORY_UNAVAILABLE', 'CRM directory is unavailable.')
}

export function createCrmLinksHandler({ getActor, repository, env = process.env }: {
  getActor: GetActor; repository: CrmDirectoryRepository; env?: Environment
}) {
  return async (request: Request): Promise<Response> => {
    try {
      const actor = await getActor()
      const search = new URL(request.url).searchParams
      const data = await searchCrmDirectory({
        repository, actor, env, query: parseQuery(search.get('q')),
        types: parseTypes(search), limit: parseLimit(search.get('limit')),
      })
      return Response.json({ data }, { headers: { 'cache-control': 'no-store' } })
    } catch (error) { return safeFailure(error) }
  }
}

export function createMemberDirectoryHandler({ getAdmin, repository }: {
  getAdmin: GetActor; repository: CrmDirectoryRepository
}) {
  return async (request: Request): Promise<Response> => {
    try {
      await getAdmin()
      const search = new URL(request.url).searchParams
      const includeAdminsValue = search.get('includeAdmins')
      if (includeAdminsValue !== null && !['true', 'false'].includes(includeAdminsValue)) {
        throw new DirectoryRequestError(400, 'INVALID_REQUEST', 'Directory query is invalid.')
      }
      const includeAdmins = includeAdminsValue === 'true'
      const levels = includeAdmins ? [0, 10, 2, 3, 20, 30] : [2, 3, 20, 30]
      const rows = await repository.searchEligibleTimeMembers({
        query: parseQuery(search.get('q')), levels, limit: parseLimit(search.get('limit')),
      })
      const data = rows.flatMap(row => {
        const timeRole = normalizeTimeRole(row.level)
        return timeRole ? [{
          externalUserId: String(row.id), name: row.name?.trim() || `CRM User ${row.id}`,
          level: row.level, timeRole,
        }] : []
      })
      return Response.json({ data }, { headers: { 'cache-control': 'no-store' } })
    } catch (error) { return safeFailure(error) }
  }
}
