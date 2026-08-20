import { describe, expect, test } from 'vitest'
import { authorizeRoute } from '@/proxy'

describe('role-partitioned CRM navigation', () => {
  test.each(['/', '/users'])('redirects an agent away from the administrative route %s', (pathname) => {
    expect(authorizeRoute(pathname, { timeRole: 'agent' })).toEqual({ redirect: '/time-management' })
  })

  test('allows an agent to remain inside the time-management route family', () => {
    expect(authorizeRoute('/time-management', { timeRole: 'agent' })).toEqual({ allow: true })
    expect(authorizeRoute('/time-management/pending', { timeRole: 'agent' })).toEqual({ allow: true })
  })

  test('does not confuse a similarly prefixed administrative route with the time route family', () => {
    expect(authorizeRoute('/time-management-admin', { timeRole: 'agent' })).toEqual({ redirect: '/time-management' })
  })

  test('allows an administrator to retain current and time-management routes', () => {
    expect(authorizeRoute('/', { timeRole: 'admin' })).toEqual({ allow: true })
    expect(authorizeRoute('/users', { timeRole: 'admin' })).toEqual({ allow: true })
    expect(authorizeRoute('/time-management', { timeRole: 'admin' })).toEqual({ allow: true })
  })

  test('sends authenticated users away from login to their role home', () => {
    expect(authorizeRoute('/login', { timeRole: 'admin' })).toEqual({ redirect: '/' })
    expect(authorizeRoute('/login', { timeRole: 'agent' })).toEqual({ redirect: '/time-management' })
  })

  test('redirects an anonymous user to login with the requested path', () => {
    expect(authorizeRoute('/users', null)).toEqual({ redirect: '/login?returnUrl=%2Fusers' })
    expect(authorizeRoute('/login', null)).toEqual({ allow: true })
  })

  test('treats a stale or malformed token as unauthenticated', () => {
    expect(authorizeRoute('/users', {})).toEqual({ redirect: '/login?returnUrl=%2Fusers' })
  })
})
