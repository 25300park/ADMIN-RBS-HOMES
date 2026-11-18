import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'
import { isAdminClaim } from '@/lib/require-admin'

export default async function middleware(req: NextRequestWithAuth) {
  // 제외할 경로 체크
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req })
  // 허용 조건: isSuperAdmin === true (level은 보지 않는다). 토큰이 없거나 허용되지 않으면 둘 다 거부.
  const isAdmin = isAdminClaim(token)

  // 로그인 페이지 처리 (허용되지 않은 토큰은 다시 로그인할 수 있게 둔다)
  if (req.nextUrl.pathname === '/login') {
    if (isAdmin) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // 인증되지 않았거나 관리자 권한이 없는 사용자
  if (!isAdmin) {
    return NextResponse.redirect(
      new URL(`/login?returnUrl=${encodeURIComponent(req.nextUrl.pathname)}`, req.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/((?!_next|api|favicon.ico).*)',
  ]
}
