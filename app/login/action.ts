'use server'

import { authorizeCrmCredentials } from '@/lib/auth-options'

export async function login(email: string, password: string) {
  const user = await authorizeCrmCredentials({ email, password })
  if (!user) {
    return { error: 'CREDENTIALS', message: 'Invalid email or password' } as const
  }

  return {
    success: true,
    destination: user.timeRole === 'admin' ? '/' : '/time-management',
  } as const
}
