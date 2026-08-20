import { requireTimeSession } from '@/lib/server-auth'
import { createTimeAccessHandler } from '@/lib/time-management/proxy'
import { signedTimeFetch } from '@/lib/time-management/upstream'

export const GET = createTimeAccessHandler({ getActor: requireTimeSession, fetchTime: signedTimeFetch })
