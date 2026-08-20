import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

type PackageManifest = {
  engines?: Record<string, string>
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  overrides?: Record<string, string>
}

async function readProjectFile(path: string): Promise<string> {
  return readFile(resolve(process.cwd(), path), 'utf8')
}

async function readManifest(): Promise<PackageManifest> {
  return JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8'))
}

describe('production dependency security floor', () => {
  test('pins the reviewed safe framework and boundary dependency versions', async () => {
    const manifest = await readManifest()

    expect(manifest.dependencies).toMatchObject({
      '@ant-design/nextjs-registry': '1.3.0',
      next: '16.3.1',
      'next-auth': '4.24.15',
      '@aws-sdk/client-s3': '3.1114.0',
      'nodemailer-v9': 'npm:nodemailer@9.0.5',
      swiper: '14.1.0',
      'write-excel-file': '4.1.1',
    })
    expect(manifest.dependencies).not.toHaveProperty('axios')
    expect(manifest.dependencies).not.toHaveProperty('nodemailer')
    expect(manifest.dependencies).not.toHaveProperty('@types/nodemailer')
    expect(manifest.dependencies).not.toHaveProperty('xlsx')
    expect(manifest.engines?.node).toBe('>=20.9.0')
    expect(manifest.overrides).toMatchObject({
      'brace-expansion@<=1.1.17': '1.1.18',
    })
  })

  test('uses the supported Next.js 16 ESLint CLI', async () => {
    const manifest = await readManifest()

    expect(manifest.scripts?.lint).toBe('eslint .')
    expect(manifest.devDependencies).toMatchObject({
      '@types/node': '20.19.43',
      '@types/nodemailer': '8.0.1',
      eslint: '9.39.2',
      'eslint-config-next': '16.3.1',
    })
  })

  test('loads the isolated safe mail transport instead of the NextAuth peer name', async () => {
    const source = await readProjectFile('lib/email.ts')

    expect(source).toContain("from 'nodemailer-v9'")
    expect(source).not.toContain("from 'nodemailer'")
  })
})
