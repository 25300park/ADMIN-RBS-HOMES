'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function login(
  email: string,
  password: string,
) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })
    console.log(user)
    if (!user) {
      return { error: 'CREDENTIALS', message: 'Invalid username' }
    }

    if (user.level !== 0) {
      return { error: 'NOTADMIN', message: 'You do not have administrator privileges' }
    }
    const isValid = await bcrypt.compare(password, user.password || '')
    
    if (!isValid) {
      return { error: 'CREDENTIALS', message: 'Invalid password' }
    }

    return { success: true, user }

  } catch (error) {
    console.error('Login error:', error)
    return { error: 'SERVER', message: 'A server error occurred' }
  }
}