import 'server-only'

export function safeTimeError(status: number, code: string, message: string): Response {
  return Response.json({ error: { code, message } }, {
    status,
    headers: { 'cache-control': 'no-store' },
  })
}
