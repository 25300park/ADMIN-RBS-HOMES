import type { NextAuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { isEligibleCrmUser, normalizeTimeRole, type TimeRole } from '@/lib/auth-policy'
import { crmRepository, type CrmRepository } from '@/lib/crm/repository'

type PasswordComparer = (plainText: string, passwordHash: string) => Promise<boolean>

type CredentialsAuthorizerDependencies = {
  repository: CrmRepository
  comparePassword: PasswordComparer
}

export type AuthenticatedCrmUser = User & {
  id: string
  username: string
  email: string
  level: number
  timeRole: TimeRole
}

export function createCredentialsAuthorizer({
  repository,
  comparePassword,
}: CredentialsAuthorizerDependencies) {
  return async function authorize(
    credentials: { email?: string; password?: string } | undefined,
  ): Promise<AuthenticatedCrmUser | null> {
    if (!credentials?.email || !credentials.password) return null

    try {
      const user = await repository.findUserByEmail(credentials.email)
      if (!user?.password || !isEligibleCrmUser(user)) return null

      const timeRole = normalizeTimeRole(user.level)
      if (!timeRole || !(await comparePassword(credentials.password, user.password))) return null

      return {
        id: String(user.id),
        username: user.username ?? '',
        email: user.email ?? '',
        level: user.level,
        timeRole,
      }
    } catch {
      console.error('CRM authentication failed')
      return null
    }
  }
}

export const authorizeCrmCredentials = createCredentialsAuthorizer({
  repository: crmRepository,
  comparePassword: bcrypt.compare,
})

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: authorizeCrmCredentials,
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authenticatedUser = user as AuthenticatedCrmUser
        token.id = authenticatedUser.id
        token.username = authenticatedUser.username
        token.level = authenticatedUser.level
        token.timeRole = authenticatedUser.timeRole
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.username = token.username
      session.user.level = token.level
      session.user.timeRole = token.timeRole
      return session
    },
  },
}
