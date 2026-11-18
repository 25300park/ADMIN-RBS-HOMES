// lib/auth-options.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { type AdminLevel } from '@/utils/constants'
import { isAdminClaim } from '@/lib/require-admin'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email   
            },
          })

          // 허용 조건: isSuperAdmin === true (level은 보지 않는다)
          if (!user || !user.password || !isAdminClaim(user)) {
            return null
          }

          const isValid = await bcrypt.compare(
            credentials.password, 
            user.password
          )

          if (!isValid) {
            return null
          }

          return {
            id: user.id.toString(),
            username: user.username || '',
            email: user.email || '',
            level: user.level as AdminLevel,
            isSuperAdmin: user.isSuperAdmin,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.level = user.level
        token.isSuperAdmin = user.isSuperAdmin === true
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.level = token.level as AdminLevel
        session.user.isSuperAdmin = token.isSuperAdmin === true
      }
      return session
    }
  }
}