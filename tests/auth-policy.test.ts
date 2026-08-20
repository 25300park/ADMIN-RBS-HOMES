import { describe, expect, test } from 'vitest'
import { isEligibleCrmUser, normalizeTimeRole } from '@/lib/auth-policy'

describe('CRM time-access policy', () => {
  test('normalizes only approved administrator, agent, and broker levels', () => {
    expect(normalizeTimeRole(0)).toBe('admin')
    expect(normalizeTimeRole(10)).toBe('admin')
    expect(normalizeTimeRole(2)).toBe('agent')
    expect(normalizeTimeRole(3)).toBe('agent')
    expect(normalizeTimeRole(20)).toBe('agent')
    expect(normalizeTimeRole(30)).toBe('agent')
    expect(normalizeTimeRole(1)).toBeNull()
    expect(normalizeTimeRole(4)).toBeNull()
    expect(normalizeTimeRole(40)).toBeNull()
    expect(normalizeTimeRole(999)).toBeNull()
  })

  test('requires the current MySQL account to be normal and eligible', () => {
    expect(isEligibleCrmUser({ level: 2, status: -1 })).toBe(true)
    expect(isEligibleCrmUser({ level: 10, status: -1 })).toBe(true)
    expect(isEligibleCrmUser({ level: 2, status: 0 })).toBe(false)
    expect(isEligibleCrmUser({ level: 2, status: 1 })).toBe(false)
    expect(isEligibleCrmUser({ level: 1, status: -1 })).toBe(false)
  })
})
