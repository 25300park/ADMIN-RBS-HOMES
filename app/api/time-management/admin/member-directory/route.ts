import { crmRepository } from '@/lib/crm/repository'
import { requireAdminSession } from '@/lib/server-auth'
import { createMemberDirectoryHandler } from '@/lib/time-management/crm-directory'

export const GET = createMemberDirectoryHandler({ getAdmin: requireAdminSession, repository: crmRepository })
