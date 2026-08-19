import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.57.4'
import { HttpError } from './http.ts'
import type { AppRole } from './identity.ts'

interface Profile {
  id: string
  username: string
  role: AppRole
}

export interface AuthContext {
  user: User
  profile: Profile
  adminClient: SupabaseClient
}

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export function createAdminClient(): SupabaseClient {
  return createClient(
    requiredEnvironment('SUPABASE_URL'),
    requiredEnvironment('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function requireRole(request: Request, allowedRoles: AppRole[]): Promise<AuthContext> {
  const authorization = request.headers.get('authorization') || ''
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) throw new HttpError(401, 'Authentication required', 'unauthenticated')

  const authClient = createClient(
    requiredEnvironment('SUPABASE_URL'),
    requiredEnvironment('SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } }
  )

  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData.user) {
    throw new HttpError(401, 'Session is invalid or expired', 'invalid_session')
  }

  const adminClient = createAdminClient()
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('id, username, role')
    .eq('id', userData.user.id)
    .single<Profile>()

  if (profileError || !profile) {
    throw new HttpError(403, 'Application profile is missing', 'profile_missing')
  }

  if (!allowedRoles.includes(profile.role)) {
    throw new HttpError(403, 'You do not have permission to perform this action', 'forbidden')
  }

  return { user: userData.user, profile, adminClient }
}
