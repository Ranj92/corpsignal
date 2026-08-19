import { corsHeaders } from './cors.ts'

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = 'request_error'
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  })
}

export function empty(request: Request, status = 204): Response {
  return new Response(null, { status, headers: corsHeaders(request) })
}

export function handleError(request: Request, error: unknown): Response {
  if (error instanceof HttpError) {
    return json(request, { message: error.message, code: error.code }, error.status)
  }

  if (error instanceof Error && error.message === 'Origin is not allowed') {
    return json(request, { message: error.message, code: 'origin_forbidden' }, 403)
  }

  console.error(error)
  return json(request, { message: 'An unexpected server error occurred', code: 'internal_error' }, 500)
}

export async function readJson<T>(request: Request): Promise<T> {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new HttpError(415, 'Content-Type must be application/json', 'unsupported_media_type')
  }

  try {
    return await request.json() as T
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON', 'invalid_json')
  }
}
