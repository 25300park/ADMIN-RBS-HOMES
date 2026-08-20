export type TimeRole = 'admin' | 'agent'

const ADMIN_LEVELS = new Set([0, 10])
const AGENT_LEVELS = new Set([2, 3, 20, 30])

export function normalizeTimeRole(level: number): TimeRole | null {
  if (ADMIN_LEVELS.has(level)) return 'admin'
  if (AGENT_LEVELS.has(level)) return 'agent'
  return null
}

export function isEligibleCrmUser(user: { level: number; status: number }): boolean {
  return user.status === -1 && normalizeTimeRole(user.level) !== null
}
