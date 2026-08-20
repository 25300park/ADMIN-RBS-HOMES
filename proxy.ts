import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import type { TimeRole } from '@/lib/auth-policy'

type RouteToken = { timeRole?: TimeRole } | null
type RouteDecision = { allow: true } | { redirect: string }

export function authorizeRoute(pathname: string, token: RouteToken): RouteDecision {
  const timeRole = token?.timeRole

  if (pathname === '/login') {
    if (timeRole === 'admin') return { redirect: '/' }
    if (timeRole === 'agent') return { redirect: '/time-management' }
    return { allow: true }
  }

  if (timeRole !== 'admin' && timeRole !== 'agent') {
    return { redirect: `/login?returnUrl=${encodeURIComponent(pathname)}` }
  }

  const isTimeRoute = pathname === '/time-management' || pathname.startsWith('/time-management/')
  if (timeRole === 'agent' && !isTimeRoute) {
    return { redirect: '/time-management' }
  }

  return { allow: true }
}

export default async function proxy(req: NextRequest) {
  const token = await getToken({ req })
  const decision = authorizeRoute(req.nextUrl.pathname, token)

  if ('redirect' in decision) {
    return NextResponse.redirect(new URL(decision.redirect, req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/((?!_next|api|favicon.ico).*)'],
}
