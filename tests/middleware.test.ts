import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { encode } from 'next-auth/jwt'
import middleware from '@/middleware'

// 실제 next-auth getToken으로 검증한다 (토큰 해석을 가짜로 대체하지 않는다). 시크릿은 테스트용 가짜 값.
const SECRET = 'test-only-secret-not-used-anywhere-else'
process.env.NEXTAUTH_SECRET = SECRET

async function request(path: string, claims?: Record<string, unknown>) {
  const headers = new Headers()
  if (claims) {
    const jwt = await encode({ token: claims as any, secret: SECRET })
    headers.set('cookie', `next-auth.session-token=${jwt}`)
  }
  return middleware(new NextRequest(`http://localhost:3001${path}`, { headers }) as any)
}

const isPassThrough = (res: Response) => res.headers.get('x-middleware-next') === '1'
const location = (res: Response) => res.headers.get('location') ?? ''

describe('미들웨어 접근 제어 (isSuperAdmin === true 만 허용)', () => {
  it('세션 없음 -> 로그인으로', async () => {
    const res = await request('/users')
    expect(res.status).toBe(307)
    expect(location(res)).toContain('/login?returnUrl=%2Fusers')
  })

  it('level 0이지만 isSuperAdmin 아님 -> 거부', async () => {
    const res = await request('/users', { id: '1', level: 0, isSuperAdmin: false })
    expect(isPassThrough(res)).toBe(false)
    expect(location(res)).toContain('/login')
  })

  it('일반 회원(level 1) -> 거부', async () => {
    const res = await request('/', { id: '2', level: 1, isSuperAdmin: false })
    expect(isPassThrough(res)).toBe(false)
    expect(location(res)).toContain('/login')
  })

  it('isSuperAdmin 필드가 없는 기존 토큰 -> 거부 (재로그인 필요)', async () => {
    const res = await request('/users', { id: '1', level: 0 })
    expect(isPassThrough(res)).toBe(false)
    expect(location(res)).toContain('/login')
  })

  it('isSuperAdmin(level 무관) -> 통과', async () => {
    const res = await request('/users', { id: '3', level: 1, isSuperAdmin: true })
    expect(isPassThrough(res)).toBe(true)
  })

  it('/login: 허용된 계정은 홈으로, 그 외(세션 없음, 허용되지 않은 토큰)는 로그인 화면 유지', async () => {
    const admin = await request('/login', { id: '3', isSuperAdmin: true })
    expect(location(admin)).toBe('http://localhost:3001/')
    expect(isPassThrough(await request('/login'))).toBe(true)
    expect(isPassThrough(await request('/login', { id: '2', level: 1, isSuperAdmin: false }))).toBe(true)
  })

  it('/api, /_next 는 미들웨어가 건드리지 않는다 (API 라우트는 자체 검사)', async () => {
    expect(isPassThrough(await request('/api/upload/unit'))).toBe(true)
    expect(isPassThrough(await request('/_next/static/x.js'))).toBe(true)
  })
})
