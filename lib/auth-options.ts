// lib/auth-options.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { ADMIN_LEVEL, type AdminLevel } from '@/utils/constants'

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

          if (!user || !user.password || 
              (user.level !== ADMIN_LEVEL.SUPER_ADMIN && 
               user.level !== ADMIN_LEVEL.ADMIN)) {
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
            level: user.level,
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
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.level = token.level as AdminLevel
      }
      return session
    }
  }
}