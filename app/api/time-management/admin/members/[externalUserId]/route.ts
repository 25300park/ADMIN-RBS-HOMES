import { crmRepository } from '@/lib/crm/repository'
import { createAdminMemberUpdateHandler } from '@/lib/time-management/admin-members'
import { signedTimeFetch } from '@/lib/time-management/upstream'
import { requireAdminSession } from '@/lib/server-auth'

export const PUT = createAdminMemberUpdateHandler({ getAdmin: requireAdminSession, repository: crmRepository, fetchTime: signedTimeFetch })
