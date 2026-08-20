'use client'

const API_ROOT = '/api/time-management'
const SAFE_PATH = /^\/(?:[A-Za-z0-9._~-]+)(?:\/[A-Za-z0-9._~-]+)*$/

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

type ClientOptions = {
  fetchImpl?: FetchLike
  requestId?: () => string
}

export class TimeClientError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'TimeClientError'
    this.status = status
  }
}

export type TimeCommand<T> = () => Promise<T>

export type TimeClient = ReturnType<typeof createTimeClient>

function validatePath(path: string) {
  const [pathname, query, ...rest] = path.split('?')
  if (
    !SAFE_PATH.test(pathname)
    || pathname.includes('..')
    || /%2f|%5c|\\/i.test(path)
    || rest.length > 0
    || path.includes('#')
    || (query !== undefined && !/^[A-Za-z0-9._~!$'()*+,;=:@?%&-]*$/.test(query))
  ) {
    throw new Error('Invalid time-management path')
  }
}

async function readResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const body = response.status === 204 ? undefined : isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = typeof body === 'object' && body && 'error' in body ? body.error : undefined
    const message = typeof error === 'string'
      ? error
      : typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Time-management request failed'
    throw new TimeClientError(message, response.status)
  }

  return body as T
}

export function createTimeClient(options: ClientOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch
  const nextRequestId = options.requestId ?? (() => crypto.randomUUID())

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    validatePath(path)
    const hasBody = body !== undefined
    const response = await fetchImpl(`${API_ROOT}${path}`, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(body) } : {}),
    })
    return readResponse<T>(response)
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    delete: <T>(path: string) => request<T>('DELETE', path),
    createCommand<T>(path: string, body: Record<string, unknown> = {}): TimeCommand<T> {
      const requestId = nextRequestId()
      return () => request<T>('POST', path, { ...body, requestId })
    },
  }
}

export const timeClient = createTimeClient()
