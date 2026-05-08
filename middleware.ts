import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequestWithAuth } from 'next-auth/middleware'
import { ADMIN_LEVEL } from '@/utils/constants'

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
  
  // 로그인 페이지 처리
  if (req.nextUrl.pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // 인증되지 않은 사용자
  if (!token) {
    return NextResponse.redirect(
      new URL(`/login?returnUrl=${encodeURIComponent(req.nextUrl.pathname)}`, req.url)
    )
  }

  // 관리자 권한이 없는 경우
  // if (![ADMIN_LEVEL.SUPER_ADMIN, ADMIN_LEVEL.ADMIN].includes(token.level)) {
  //   return new NextResponse(null, { status: 403 })
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/((?!_next|api|favicon.ico).*)',
  ]
}