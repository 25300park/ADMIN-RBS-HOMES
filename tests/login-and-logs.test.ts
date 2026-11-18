import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ default: { user: { findUnique } } }))

import { login } from '@/app/login/action'

const FAKE_PASSWORD = 'fake-password-for-test'
const FAKE_HASH = bcrypt.hashSync(FAKE_PASSWORD, 4)
const row = (overrides: Record<string, unknown>) => ({
  password: FAKE_HASH,
  isSuperAdmin: true,
  level: 0,
  ...overrides,
})

afterEach(() => {
  vi.restoreAllMocks()
  findUnique.mockReset()
})

describe('로그인 action', () => {
  it('성공 시 브라우저로 돌려주는 값에 사용자 행과 비밀번호(해시)가 없다', async () => {
    findUnique.mockResolvedValue(row({}))
    const result: any = await login('super@example.invalid', FAKE_PASSWORD)
    expect(result).toEqual({ success: true })
    expect(JSON.stringify(result)).not.toContain(FAKE_HASH)
  })

  it('로그를 남기더라도 사용자 행이나 해시를 출력하지 않는다', async () => {
    const spies = [vi.spyOn(console, 'log'), vi.spyOn(console, 'error'), vi.spyOn(console, 'info')]
    findUnique.mockResolvedValue(row({}))
    await login('super@example.invalid', FAKE_PASSWORD)
    const printed = spies.flatMap((s) => s.mock.calls).map((c) => JSON.stringify(c)).join('\n')
    expect(printed).not.toContain(FAKE_HASH)
    expect(printed).not.toContain('super@example.invalid')
  })

  it('level 0이어도 isSuperAdmin이 아니면 거부', async () => {
    findUnique.mockResolvedValue(row({ isSuperAdmin: false, level: 0 }))
    expect(await login('x@example.invalid', FAKE_PASSWORD)).toMatchObject({ error: 'NOTADMIN' })
  })

  it('isSuperAdmin이면 level과 무관하게 허용', async () => {
    findUnique.mockResolvedValue(row({ level: 1 }))
    expect(await login('x@example.invalid', FAKE_PASSWORD)).toEqual({ success: true })
  })

  it('없는 계정, 틀린 비밀번호는 기존 메시지 그대로', async () => {
    findUnique.mockResolvedValue(null)
    expect(await login('none@example.invalid', 'x')).toMatchObject({ error: 'CREDENTIALS', message: 'Invalid username' })
    findUnique.mockResolvedValue(row({}))
    expect(await login('x@example.invalid', 'wrong')).toMatchObject({ error: 'CREDENTIALS', message: 'Invalid password' })
  })
})

describe('메일 오류 로그', () => {
  it('sendEmail 실패 시 원본 오류 객체와 수신자 주소를 로그에 남기지 않는다 (이름과 코드만)', async () => {
    vi.resetModules()
    const sendMail = vi.fn().mockRejectedValue(
      Object.assign(new Error('Invalid recipients: victim@example.invalid'), { code: 'EENVELOPE' })
    )
    vi.doMock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail }) } }))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { sendEmail } = await import('@/lib/email')
    await expect(sendEmail({ to: 'victim@example.invalid', subject: 's', html: 'h' })).rejects.toThrow('Failed to send email')

    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('victim@example.invalid')
    expect(errorSpy.mock.calls[0][1]).toEqual({ name: 'Error', code: 'EENVELOPE' })
  })

  it('소스에 수신자 이메일을 찍는 로그와 사용자 행 로그가 남아 있지 않다', () => {
    const root = path.resolve(__dirname, '..')
    const files = [
      ...fs.readdirSync(path.join(root, 'actions')).map((f) => `actions/${f}`),
      'lib/email.ts',
      'app/login/action.ts',
    ]
    const offenders: string[] = []
    for (const f of files) {
      fs.readFileSync(path.join(root, f), 'utf8').split('\n').forEach((line, i) => {
        if (/console\.\w+\(.*\$\{[^}]*email/i.test(line) || /console\.log\(user\)/.test(line)) offenders.push(`${f}:${i + 1}`)
      })
    }
    expect(offenders).toEqual([])
  })
})
