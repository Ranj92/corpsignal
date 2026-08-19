import { supabase } from './client'
import { ApplicationError, toApplicationError } from './errors'
import { assertBackendConfigured } from '@/config/runtime'

/** Invoke an Edge Function and normalize all failures at the infrastructure boundary. */
export async function invokeFunction(name, options = {}) {
  assertBackendConfigured()

  const { data, error } = await supabase.functions.invoke(name, options)
  if (!error) return data

  let details = null
  if (error.context instanceof Response) {
    try {
      details = await error.context.clone().json()
    } catch {
      // The function may return an empty or non-JSON response.
    }
  }

  if (details?.message) {
    throw new ApplicationError(details.message, {
      code: details.code || 'edge_function_error',
      status: error.context?.status || 500,
      cause: error
    })
  }

  throw toApplicationError(error, `The ${name} service request failed`)
}
