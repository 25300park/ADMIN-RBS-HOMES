import type { Session } from 'next-auth'

/**
 * admin 접근 허용 조건의 단일 정의: isSuperAdmin === true 인 계정만 허용한다.
 * level 값은 보지 않는다. 세션, JWT 토큰, 사용자 객체 어디에든 같은 기준으로 쓴다.
 * (미들웨어는 Edge에서 돌기 때문에 이 함수는 의존성 없이 순수하게 유지한다.)
 */
export function isAdminClaim(
  subject: { isSuperAdmin?: unknown } | null | undefined
): boolean {
  return subject?.isSuperAdmin === true
}

// strict 모드가 꺼진 프로젝트라 판별 유니온이 좁혀지지 않아 단일 형태로 둔다.
// ok가 true면 session이, false면 status(401: 세션 없음, 403: 허용되지 않은 계정)가 채워진다.
export type AdminCheck = {
  ok: boolean
  session?: Session
  status?: 401 | 403
}

export class AdminAuthError extends Error {
  status: 401 | 403

  constructor(status: 401 | 403) {
    super(status === 401 ? 'Unauthorized' : 'Forbidden')
    this.name = 'AdminAuthError'
    this.status = status
  }
}

/**
 * 서버에서 세션을 읽어 허용 여부를 돌려준다. API 라우트처럼 응답 코드를 직접 만들 때 쓴다.
 * 401: 세션 없음, 403: 세션은 있으나 isSuperAdmin이 아님.
 */
export async function checkAdmin(): Promise<AdminCheck> {
  // 미들웨어(Edge 번들)는 isAdminClaim만 쓴다. next-auth 서버 모듈이 Edge 번들에 딸려 들어가
  // 빌드가 깨지지 않도록, 이 분기는 Edge 빌드에서 번들에서 제외된다 (NEXT_RUNTIME은 빌드 시 치환됨).
  if (process.env.NEXT_RUNTIME !== 'edge') {
    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth-options')

    const session = await getServerSession(authOptions)
    if (!session?.user) return { ok: false, status: 401 }
    if (!isAdminClaim(session.user)) return { ok: false, status: 403 }
    return { ok: true, session }
  }
  // Edge에서 호출되면 안 되는 경로다. 허용하지 않는 쪽으로 닫는다.
  return { ok: false, status: 401 }
}

/** 서버 액션과 서버 진입점의 첫 줄에서 호출한다. 허용되지 않으면 AdminAuthError를 던진다. */
export async function requireAdmin(): Promise<Session> {
  const result = await checkAdmin()
  if (!result.ok) throw new AdminAuthError(result.status as 401 | 403)
  return result.session
}
