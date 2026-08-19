import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.57.4'
import { assertAllowedOrigin } from '../_shared/cors.ts'
import { empty, handleError, HttpError, json, readJson } from '../_shared/http.ts'
import { requireRole } from '../_shared/auth.ts'
import {
  usernameToAuthEmail,
  validatePassword,
  validateRole,
  validateUsername,
  type AppRole
} from '../_shared/identity.ts'

interface UserMutation {
  id?: string
  username?: string
  password?: string
  role?: AppRole
}

interface UserProfileRow {
  id: string
  username: string
  role: AppRole
  created_at: string
  updated_at: string
}

const USER_FIELDS = 'id, username, role, created_at, updated_at'

const mapUser = (profile: UserProfileRow) => ({
  id: profile.id,
  username: profile.username,
  role: profile.role,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at
})

async function requireExistingProfile(adminClient: SupabaseClient, id: string): Promise<UserProfileRow> {
  const { data, error } = await adminClient
    .from('profiles')
    .select(USER_FIELDS)
    .eq('id', id)
    .single()

  if (error || !data) throw new HttpError(404, 'User not found', 'user_not_found')
  return data as UserProfileRow
}

async function assertUsernameAvailable(adminClient: SupabaseClient, username: string, excludedId?: string) {
  let query = adminClient.from('profiles').select('id').eq('username', username)
  if (excludedId) query = query.neq('id', excludedId)
  const { data, error } = await query.maybeSingle()

  if (error) throw error
  if (data) throw new HttpError(409, 'Username already exists', 'username_conflict')
}

async function assertManagerCanBeRemoved(
  adminClient: SupabaseClient,
  target: UserProfileRow,
  nextRole?: AppRole
) {
  if (target.role !== 'Manager' || nextRole === 'Manager') return

  const { count, error } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'Manager')

  if (error) throw error
  if ((count || 0) <= 1) {
    throw new HttpError(409, 'The final Manager account cannot be removed or demoted', 'last_manager')
  }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return empty(request)

  try {
    assertAllowedOrigin(request)
    const { user: actor, adminClient } = await requireRole(request, ['Manager'])

    if (request.method === 'GET') {
      const { data, error } = await adminClient
        .from('profiles')
        .select(USER_FIELDS)
        .order('created_at', { ascending: false })

      if (error) throw error
      return json(request, ((data || []) as UserProfileRow[]).map(mapUser))
    }

    if (request.method === 'POST') {
      const body = await readJson<UserMutation>(request)
      const username = validateUsername(body.username)
      const password = validatePassword(body.password, true)!
      const role = validateRole(body.role)
      await assertUsernameAvailable(adminClient, username)

      const { data, error } = await adminClient.auth.admin.createUser({
        email: usernameToAuthEmail(username),
        password,
        email_confirm: true,
        user_metadata: { username },
        app_metadata: { role }
      })

      if (error || !data.user) {
        if (error?.message?.toLowerCase().includes('already')) {
          throw new HttpError(409, 'Username already exists', 'username_conflict')
        }
        throw error || new Error('User creation returned no user')
      }

      const profile = await requireExistingProfile(adminClient, data.user.id)
      return json(request, mapUser(profile), 201)
    }

    if (request.method === 'PUT') {
      const body = await readJson<UserMutation>(request)
      if (!body.id) throw new HttpError(400, 'User ID is required', 'user_id_required')

      const target = await requireExistingProfile(adminClient, body.id)
      const { data: authData, error: authError } = await adminClient.auth.admin.getUserById(body.id)
      if (authError || !authData.user) throw new HttpError(404, 'User not found', 'user_not_found')

      const username = body.username === undefined ? undefined : validateUsername(body.username)
      const password = validatePassword(body.password, false)
      const role = body.role === undefined ? undefined : validateRole(body.role)

      if (username && username.toLowerCase() !== String(target.username).toLowerCase()) {
        await assertUsernameAvailable(adminClient, username, body.id)
      }
      if (role) await assertManagerCanBeRemoved(adminClient, target, role)

      const changes: Record<string, unknown> = {}
      if (username) {
        changes.email = usernameToAuthEmail(username)
        changes.user_metadata = { ...authData.user.user_metadata, username }
      }
      if (password) changes.password = password
      if (role) changes.app_metadata = { ...authData.user.app_metadata, role }

      if (Object.keys(changes).length === 0) return json(request, mapUser(target))

      const { error } = await adminClient.auth.admin.updateUserById(body.id, changes)
      if (error) {
        if (error.message.toLowerCase().includes('already')) {
          throw new HttpError(409, 'Username already exists', 'username_conflict')
        }
        throw error
      }

      const profile = await requireExistingProfile(adminClient, body.id)
      return json(request, mapUser(profile))
    }

    if (request.method === 'DELETE') {
      const body = await readJson<UserMutation>(request)
      if (!body.id) throw new HttpError(400, 'User ID is required', 'user_id_required')
      if (body.id === actor.id) {
        throw new HttpError(409, 'You cannot delete your own account', 'self_delete_forbidden')
      }

      const target = await requireExistingProfile(adminClient, body.id)
      await assertManagerCanBeRemoved(adminClient, target)

      const { error } = await adminClient.auth.admin.deleteUser(body.id, false)
      if (error) throw error
      return empty(request)
    }

    throw new HttpError(405, 'Method not allowed', 'method_not_allowed')
  } catch (error) {
    return handleError(request, error)
  }
})
