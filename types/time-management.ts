export type TimeRole = 'admin' | 'agent'

export type TimeActor = {
  externalUserId: string
  name: string
  level: number
  timeRole: TimeRole
}

export type SignedTimeFetchInput = {
  actor: TimeActor
  method: string
  path: string
  query?: URLSearchParams
  body?: unknown
  signal?: AbortSignal
}
