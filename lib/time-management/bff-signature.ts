import 'server-only'

import { createHmac } from 'node:crypto'
import type { TimeRole } from '@/types/time-management'

export const BFF_VERSION = 'TIME-BFF-HMAC-SHA256-V1'

export type BffCanonicalInput = {
  kid: string
  method: string
  pathAndQuery: string
  issuedAt: number
  expiresAt: number
  nonce: string
  externalUserId: string
  role: TimeRole
  bodyDigest: string
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
}

export function normalizeBffPathAndQuery(pathAndQuery: string): string {
  const parsed = new URL(pathAndQuery, 'http://time-bff.internal')
  const query = [...parsed.searchParams.entries()]
    .map(([key, value]) => [encodeRfc3986(key), encodeRfc3986(value)] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey !== rightKey) return leftKey < rightKey ? -1 : 1
      if (leftValue === rightValue) return 0
      return leftValue < rightValue ? -1 : 1
    })
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  return `${parsed.pathname}${query ? `?${query}` : ''}`
}

export function canonicalBffRequest(input: BffCanonicalInput): string {
  return [
    BFF_VERSION,
    input.kid,
    input.method.toUpperCase(),
    normalizeBffPathAndQuery(input.pathAndQuery),
    input.issuedAt,
    input.expiresAt,
    input.nonce,
    input.externalUserId,
    input.role,
    input.bodyDigest,
  ].join('\n')
}

export function signBffRequest(input: BffCanonicalInput, key: string): string {
  return createHmac('sha256', key).update(canonicalBffRequest(input)).digest('base64url')
}
