import { beforeEach, describe, expect, test, vi } from 'vitest'

const { forbiddenMock, redirectMock, requireAdminSessionMock } = vi.hoisted(() => ({
  forbiddenMock: vi.fn(() => { throw new Error('NEXT_HTTP_ERROR_FALLBACK;403') }),
  redirectMock: vi.fn(() => { throw new Error('NEXT_REDIRECT') }),
  requireAdminSessionMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({ forbidden: forbiddenMock, redirect: redirectMock }))

vi.mock('@/lib/server-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server-auth')>()
  return { ...actual, requireAdminSession: requireAdminSessionMock }
})

import { ServerAuthorizationError } from '@/lib/server-auth'
import TimeAdminMembersRoute from '@/app/(time)/time-management/admin/members/page'
import TimeAdminSummaryRoute from '@/app/(time)/time-management/admin/summary/page'

describe('time-management administrator pages', () => {
  beforeEach(() => {
    forbiddenMock.mockClear()
    redirectMock.mockClear()
    requireAdminSessionMock.mockRejectedValue(new ServerAuthorizationError('FORBIDDEN', 403))
  })

  test.each([
    ['members', TimeAdminMembersRoute],
    ['summary', TimeAdminSummaryRoute],
  ])('returns a 403 interruption for an agent on the %s page', async (_name, Page) => {
    await expect(Page()).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;403')

    expect(forbiddenMock).toHaveBeenCalledOnce()
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
