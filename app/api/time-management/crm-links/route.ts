import { crmRepository } from '@/lib/crm/repository'
import { requireTimeSession } from '@/lib/server-auth'
import { createCrmLinksHandler } from '@/lib/time-management/crm-directory'

export const GET = createCrmLinksHandler({ getActor: requireTimeSession, repository: crmRepository })
