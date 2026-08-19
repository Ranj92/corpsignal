import { createAdminClient } from '../_shared/auth.ts'
import { assertAllowedOrigin } from '../_shared/cors.ts'
import { empty, handleError, HttpError, json, readJson } from '../_shared/http.ts'
import { usernameToAuthEmail, validatePassword, validateUsername } from '../_shared/identity.ts'

interface BootstrapRequest {
  username?: string
  password?: string
}

function secretsMatch(actual: string, expected: string): boolean {
  const encoder = new TextEncoder()
  const left = encoder.encode(actual)
  const right = encoder.encode(expected)
  let difference = left.length ^ right.length
  const length = Math.max(left.length, right.length)

  for (let index = 0; index < length; index++) {
    difference |= (left[index] || 0) ^ (right[index] || 0)
  }
  return difference === 0
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return empty(request)

  try {
    assertAllowedOrigin(request)
    if (request.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method_not_allowed')

    const expectedSecret = Deno.env.get('BOOTSTRAP_SECRET') || ''
    const suppliedSecret = request.headers.get('x-bootstrap-secret') || ''
    if (!expectedSecret || !secretsMatch(suppliedSecret, expectedSecret)) {
      throw new HttpError(401, 'Invalid bootstrap secret', 'invalid_bootstrap_secret')
    }

    const adminClient = createAdminClient()
    const { count, error: countError } = await adminClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (countError) throw countError
    if ((count || 0) > 0) {
      throw new HttpError(409, 'Bootstrap is disabled after the first account is created', 'already_bootstrapped')
    }

    const body = await readJson<BootstrapRequest>(request)
    const username = validateUsername(body.username)
    const password = validatePassword(body.password, true)!

    const { data, error } = await adminClient.auth.admin.createUser({
      email: usernameToAuthEmail(username),
      password,
      email_confirm: true,
      user_metadata: { username },
      app_metadata: { role: 'Manager' }
    })

    if (error || !data.user) throw error || new Error('Bootstrap returned no user')
    return json(request, { id: data.user.id, username, role: 'Manager' }, 201)
  } catch (error) {
    return handleError(request, error)
  }
})
