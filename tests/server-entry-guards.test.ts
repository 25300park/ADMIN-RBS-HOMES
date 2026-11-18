import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NO_SESSION,
  NON_SUPER_ADMIN_SESSION,
  REGULAR_USER_SESSION,
  SUPER_ADMIN_SESSION,
} from './helpers'

const { getServerSession, dbTouched } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  dbTouched: vi.fn(),
}))
vi.mock('next-auth', () => ({ getServerSession }))
vi.mock('@/lib/auth-options', () => ({ authOptions: {} }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(), getMessageEmailTemplate: vi.fn() }))

// DB는 건드리지 않는다: 접근 즉시 실패시켜, 거부된 요청이 DB까지 가지 않았음을 증명한다.
vi.mock('@/lib/prisma', () => {
  const trap: any = new Proxy(function () {}, {
    get: () => {
      dbTouched()
      throw new Error('DB touched')
    },
  })
  return { default: trap }
})

const root = path.resolve(__dirname, '..')
const actionFiles = fs.readdirSync(path.join(root, 'actions')).filter((f) => f.endsWith('.ts'))
const routeFiles = [
  'app/api/upload/editor/route.ts',
  'app/api/upload/file/route.ts',
  'app/api/upload/unit/route.ts',
  'app/api/upload/video/route.ts',
  'app/api/banner/upload/route.ts',
  'app/api/popup/upload/route.ts',
]

const denied = [
  ['세션 없음', NO_SESSION, 401],
  ['level 0이지만 isSuperAdmin 아님', NON_SUPER_ADMIN_SESSION, 403],
  ['일반 회원(level 1)', REGULAR_USER_SESSION, 403],
] as const

const exportedFunctions = (mod: Record<string, unknown>) =>
  Object.entries(mod).filter(([, v]) => typeof v === 'function') as [string, (...a: any[]) => any][]

describe('서버 액션 전수: 거부 조건에서는 DB에 닿기 전에 막힌다', () => {
  beforeEach(() => {
    getServerSession.mockReset()
    dbTouched.mockClear()
  })

  for (const file of actionFiles) {
    const modulePath = `@/actions/${file.replace(/\.ts$/, '')}`

    it(`actions/${file}: 모든 export 함수가 거부된다`, async () => {
      const fns = exportedFunctions(await import(/* @vite-ignore */ modulePath))
      expect(fns.length).toBeGreaterThan(0)

      for (const [label, session] of denied) {
        getServerSession.mockResolvedValue(session)
        for (const [name, fn] of fns) {
          await expect(fn({}), `${file} ${name} (${label})`).rejects.toMatchObject({ name: 'AdminAuthError' })
        }
      }
      expect(dbTouched).not.toHaveBeenCalled()
    })

    it(`actions/${file}: 허용 계정은 권한 검사를 통과한다 (이후 실패는 권한 오류가 아니다)`, async () => {
      getServerSession.mockResolvedValue(SUPER_ADMIN_SESSION)
      for (const [name, fn] of exportedFunctions(await import(/* @vite-ignore */ modulePath))) {
        const outcome = await Promise.resolve()
          .then(() => fn({}))
          .then(() => null, (e) => e)
        expect(outcome?.name, `${file} ${name}`).not.toBe('AdminAuthError')
      }
    })
  }
})

describe('업로드 API 라우트 전수: 세션 없음 401, 허용되지 않은 계정 403', () => {
  beforeEach(() => getServerSession.mockReset())

  for (const file of routeFiles) {
    for (const [label, session, status] of denied) {
      it(`${file} (${label}) -> ${status}`, async () => {
        getServerSession.mockResolvedValue(session)
        const mod = await import(/* @vite-ignore */ `@/${file.replace(/\.ts$/, '')}`)
        const res = await mod.POST(new Request('http://localhost:3001/x', { method: 'POST', body: new FormData() }))
        expect(res.status).toBe(status)
      })
    }
  }

  it('app/api 아래 route는 next-auth 핸들러와 위 6개뿐이다 (새 라우트가 생기면 이 목록에 넣고 검사하게 한다)', () => {
    const found: string[] = []
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (/^route\.(ts|js)$/.test(entry.name)) found.push(path.relative(root, full).replace(/\\/g, '/'))
      }
    }
    walk(path.join(root, 'app/api'))
    expect(found.sort()).toEqual([...routeFiles, 'app/api/auth/[...nextauth]/route.ts'].sort())
  })
})
