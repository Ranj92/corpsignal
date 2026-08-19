/**
 * Read receipts API module.
 * Handles marking posts as read and retrieving read receipts.
 */
import { supabase } from '@/infrastructure/supabase/client'
import { toApplicationError } from '@/infrastructure/supabase/errors'

async function callRpc(name, parameters, fallbackMessage) {
  const { data, error } = await supabase.rpc(name, parameters)
  if (error) throw toApplicationError(error, fallbackMessage)
  return data
}

export default {
  /** Mark a post as read by the current user. Idempotent. */
  markAsRead(postId) {
    return callRpc('mark_post_read', { p_post_id: postId }, 'Failed to mark the post as read')
  },

  /** Get all read receipts for a post. Manager/Admin only. */
  getReceipts(postId) {
    return callRpc('get_post_receipts', { p_post_id: postId }, 'Failed to load read receipts')
  }
}
