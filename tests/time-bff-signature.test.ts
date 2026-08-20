import fixture from './fixtures/time-bff-v1.json'
import { expect, test } from 'vitest'
import { canonicalBffRequest, signBffRequest } from '@/lib/time-management/bff-signature'

const base = {
  kid: fixture.kid,
  method: fixture.method,
  pathAndQuery: fixture.pathAndQuery,
  issuedAt: fixture.issuedAt,
  expiresAt: fixture.expiresAt,
  nonce: fixture.nonce,
  externalUserId: fixture.externalUserId,
  role: fixture.role as 'agent',
  bodyDigest: fixture.bodyDigest,
}

test('Next.js produces the reviewed Express HMAC v1 golden vector', () => {
  expect(canonicalBffRequest(base)).toBe(fixture.canonical)
  expect(signBffRequest(base, fixture.key)).toBe(fixture.signature)
})

test('canonicalization percent-encodes and sorts query entries by encoded key and value', () => {
  expect(canonicalBffRequest({
    ...base,
    pathAndQuery: '/internal/time-management/entries/timer/start?z=last&filter=한글&a=space%20value&a=first',
  })).toBe(fixture.canonical)
})
