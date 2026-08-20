import { beforeEach, describe, expect, test, vi } from 'vitest'

const { requireAdminSessionMock } = vi.hoisted(() => ({
  requireAdminSessionMock: vi.fn(),
}))

vi.mock('@/lib/server-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/server-auth')>()
  return { ...actual, requireAdminSession: requireAdminSessionMock }
})

import { withAdminRoute } from '@/lib/admin-route'
import { ServerAuthorizationError } from '@/lib/server-auth'

describe('administrator Route Handler guard', () => {
  beforeEach(() => {
    requireAdminSessionMock.mockReset()
  })

  test('returns a stable 403 without invoking an upload handler when authorization fails', async () => {
    requireAdminSessionMock.mockRejectedValue(new ServerAuthorizationError('UNAUTHENTICATED', 401))
    const upload = vi.fn(async () => Response.json({ uploaded: true }))

    const response = await withAdminRoute(upload)(new Request('http://localhost/api/upload'))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: { code: 'FORBIDDEN' } })
    expect(upload).not.toHaveBeenCalled()
  })

  test('invokes the wrapped handler only after administrator authorization succeeds', async () => {
    requireAdminSessionMock.mockResolvedValue({
      externalUserId: '180',
      name: 'Admin',
      level: 10,
      timeRole: 'admin',
    })
    const upload = vi.fn(async () => Response.json({ uploaded: true }, { status: 201 }))
    const request = new Request('http://localhost/api/upload')

    const response = await withAdminRoute(upload)(request)

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({ uploaded: true })
    expect(upload).toHaveBeenCalledWith(request, undefined)
  })

  test('does not hide unexpected handler or infrastructure failures', async () => {
    requireAdminSessionMock.mockRejectedValue(new Error('database unavailable'))
    const upload = vi.fn(async () => Response.json({ uploaded: true }))

    await expect(withAdminRoute(upload)(new Request('http://localhost/api/upload')))
      .rejects.toThrow('database unavailable')
    expect(upload).not.toHaveBeenCalled()
  })
})
