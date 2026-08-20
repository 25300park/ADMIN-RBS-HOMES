import { requireTimeSession } from '@/lib/server-auth'
import { createTimeProxyHandler } from '@/lib/time-management/proxy'
import { signedTimeFetch } from '@/lib/time-management/upstream'

const handler = createTimeProxyHandler({ getActor: requireTimeSession, fetchTime: signedTimeFetch })

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
