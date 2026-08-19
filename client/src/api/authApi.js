/**
 * Authentication API module.
 * Provider-neutral authentication adapter backed by Supabase Auth.
 */
import { supabase } from '@/infrastructure/supabase/client'
import { assertBackendConfigured, runtimeConfig } from '@/config/runtime'
import { usernameToAuthEmail } from '@/domain/auth/identity'
import { ApplicationError, toApplicationError } from '@/infrastructure/supabase/errors'

const mapProfile = (profile) => ({
  id: profile.id,
  username: profile.username,
  role: profile.role
})

export default {
  /** Authenticate with the username users see while Supabase stores a synthetic email. */
  async login({ username, password }) {
    assertBackendConfigured()

    let email
    try {
      email = usernameToAuthEmail(username, runtimeConfig.authEmailDomain)
    } catch (error) {
      throw new ApplicationError(error.message, { code: 'invalid_username', status: 400, cause: error })
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw new ApplicationError('Invalid username or password', {
        code: 'invalid_credentials',
        status: 401,
        cause: error
      })
    }

    try {
      const user = await this.getProfile(data.user.id)
      return { session: data.session, user }
    } catch (profileError) {
      await supabase.auth.signOut({ scope: 'local' })
      throw profileError
    }
  },

  /** Read the persisted session. Supabase handles refresh-token rotation. */
  async getSession() {
    if (!runtimeConfig.isConfigured) return null

    const { data, error } = await supabase.auth.getSession()
    if (error) throw toApplicationError(error, 'Could not restore the session')
    return data.session
  },

  /** Subscribe to auth changes without leaking the provider subscription object. */
  onSessionChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer work that may call Supabase again until the auth callback releases its lock.
      setTimeout(() => callback(session), 0)
    })
    return () => data.subscription.unsubscribe()
  },

  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw toApplicationError(error, 'Logout failed')
  },

  /** Get the current application profile; roles are authoritative in public.profiles. */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role')
      .eq('id', userId)
      .single()

    if (error) throw toApplicationError(error, 'Could not load the user profile')
    return mapProfile(data)
  }
}
