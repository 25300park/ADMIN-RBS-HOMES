import 'server-only'

import prisma from '@/lib/prisma'

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
}

export const crmRepository: CrmRepository = {
  findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, level: true, status: true },
    })
  },
  findUserByEmail(email) {
    return prisma.user.findUnique({
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
    })
  },
}
