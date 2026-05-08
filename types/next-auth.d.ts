import "next-auth";
import { JWT } from "next-auth/jwt";
import { AdminLevel } from '@/utils/constants/menu'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      level: AdminLevel
    }
  }

  interface User {
    id: string
    email: string
    username: string
    level: AdminLevel
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    username: string
    level: AdminLevel
  }
}