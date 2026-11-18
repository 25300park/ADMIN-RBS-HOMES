'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function login(
  email: string,
  password: string,
) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true, isSuperAdmin: true },
    })
    if (!user) {
      return { error: 'CREDENTIALS', message: 'Invalid username' }
    }

    if (user.isSuperAdmin !== true) {
      return { error: 'NOTADMIN', message: 'You do not have administrator privileges' }
    }
    const isValid = await bcrypt.compare(password, user.password || '')

    if (!isValid) {
      return { error: 'CREDENTIALS', message: 'Invalid password' }
    }

    // 브라우저에는 성공 여부만 돌려준다 (사용자 행, 비밀번호 해시 제외)
    return { success: true }

  } catch (error) {
    console.error('Login error:', error)
    return { error: 'SERVER', message: 'A server error occurred' }
  }
}
