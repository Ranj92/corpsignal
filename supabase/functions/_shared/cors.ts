const DEFAULT_LOCAL_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']

function allowedOrigins(): Set<string> {
  const configured = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  return new Set([...DEFAULT_LOCAL_ORIGINS, ...configured])
}

export function assertAllowedOrigin(request: Request): void {
  const origin = request.headers.get('origin')
  if (origin && !allowedOrigins().has(origin)) {
    throw new Error('Origin is not allowed')
  }
}

export function corsHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-bootstrap-secret',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  }

  const origin = request.headers.get('origin')
  if (origin && allowedOrigins().has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}
