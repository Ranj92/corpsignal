const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * Runtime configuration is centralized so infrastructure code never reads
 * environment variables directly. This keeps providers replaceable and makes
 * configuration failures deterministic.
 */
export const runtimeConfig = Object.freeze({
  supabaseUrl: supabaseUrl || 'http://127.0.0.1:54321',
  supabaseKey: supabaseKey || 'missing-supabase-key',
  authEmailDomain: import.meta.env.VITE_AUTH_EMAIL_DOMAIN?.trim() || 'auth.corpsignal.invalid',
  functions: Object.freeze({
    adminUsers: import.meta.env.VITE_ADMIN_USERS_FUNCTION?.trim() || 'admin-users',
    media: import.meta.env.VITE_MEDIA_FUNCTION?.trim() || 'media'
  }),
  isConfigured: Boolean(supabaseUrl && supabaseKey)
})

export function assertBackendConfigured() {
  if (!runtimeConfig.isConfigured) {
    throw new Error('Backend is not configured. Copy .env.example to .env and add the Supabase project values.')
  }
}
