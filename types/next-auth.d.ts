import 'next-auth'
import type { TimeRole } from '@/lib/auth-policy'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      level: number
      timeRole: TimeRole
    }
  }

  interface User {
    id: string
    email: string
    username: string
    level: number
    timeRole: TimeRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    username: string
    level: number
    timeRole: TimeRole
  }
}
