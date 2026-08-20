import 'server-only'

import { requireAdminSession, ServerAuthorizationError } from '@/lib/server-auth'

type AdminRouteHandler<Context = unknown> = (
  request: Request,
  context: Context | undefined,
) => Promise<Response>

export function withAdminRoute<Context = unknown>(handler: AdminRouteHandler<Context>) {
  return async (request: Request, context?: Context): Promise<Response> => {
    try {
      await requireAdminSession()
    } catch (error) {
      if (error instanceof ServerAuthorizationError) {
        return Response.json({ error: { code: 'FORBIDDEN' } }, { status: 403 })
      }
      throw error
    }

    return handler(request, context)
  }
}
