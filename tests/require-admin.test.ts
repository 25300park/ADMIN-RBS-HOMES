import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NO_SESSION,
  NON_SUPER_ADMIN_SESSION,
  REGULAR_USER_SESSION,
  SUPER_ADMIN_SESSION,
} from './helpers'

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }))
vi.mock('next-auth', () => ({ getServerSession }))
vi.mock('@/lib/auth-options', () => ({ authOptions: {} }))

import { AdminAuthError, checkAdmin, isAdminClaim, requireAdmin } from '@/lib/require-admin'

describe('isAdminClaim: isSuperAdmin === true 만 허용', () => {
  it.each([
    [{ isSuperAdmin: true }, true],
    [{ isSuperAdmin: false }, false],
    [{ isSuperAdmin: 1 }, false],
    [{ isSuperAdmin: 'true' }, false],
    [{}, false],
    [{ level: 0 }, false],
    [{ level: 10 }, false],
    [null, false],
    [undefined, false],
  ])('%j -> %s', (subject, expected) => {
    expect(isAdminClaim(subject as any)).toBe(expected)
  })
})

describe('checkAdmin / requireAdmin', () => {
  beforeEach(() => getServerSession.mockReset())

  it('세션 없음 -> 401', async () => {
    getServerSession.mockResolvedValue(NO_SESSION)
    expect(await checkAdmin()).toEqual({ ok: false, status: 401 })
    await expect(requireAdmin()).rejects.toMatchObject({ name: 'AdminAuthError', status: 401 })
  })

  it.each([
    ['level 0이지만 isSuperAdmin 아님', NON_SUPER_ADMIN_SESSION],
    ['일반 회원(level 1)', REGULAR_USER_SESSION],
  ])('%s -> 403', async (_label, session) => {
    getServerSession.mockResolvedValue(session)
    expect(await checkAdmin()).toEqual({ ok: false, status: 403 })
    await expect(requireAdmin()).rejects.toBeInstanceOf(AdminAuthError)
  })

  it('isSuperAdmin(level 무관) -> 허용, 세션을 돌려준다', async () => {
    getServerSession.mockResolvedValue(SUPER_ADMIN_SESSION)
    expect(await requireAdmin()).toBe(SUPER_ADMIN_SESSION)
  })
})
