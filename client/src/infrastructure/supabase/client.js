import { createClient } from '@supabase/supabase-js'
import { runtimeConfig } from '@/config/runtime'

/**
 * The only Supabase client instance in the browser application.
 * Supabase owns encrypted session persistence and refresh-token rotation.
 */
export const supabase = createClient(
  runtimeConfig.supabaseUrl,
  runtimeConfig.supabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
)
