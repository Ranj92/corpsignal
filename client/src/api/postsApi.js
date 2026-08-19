/**
 * Posts API module.
 * Handles CRUD operations, pagination, filtering, and search for posts.
 */
import { supabase } from '@/infrastructure/supabase/client'
import { toApplicationError } from '@/infrastructure/supabase/errors'
import { extractAssetIds } from '@/domain/posts/content'
import filesApi from './filesApi'

async function callRpc(name, parameters, fallbackMessage) {
  const { data, error } = await supabase.rpc(name, parameters)
  if (error) throw toApplicationError(error, fallbackMessage)
  return data
}

export default {
  /**
   * Get paginated list of posts with optional filters.
   * @param {Object} params - Query parameters
   * @param {number} [params.page] - Page number (1-based)
   * @param {number} [params.pageSize] - Items per page
   * @param {number} [params.priority] - Priority filter (0=Low, 1=Medium, 2=High)
   * @param {string} [params.search] - Search term for body text
   */
  getPosts(params = {}) {
    return callRpc('get_posts', {
      p_page: params.page || 1,
      p_page_size: params.pageSize || 20,
      p_priority: params.priority ?? null,
      p_search: params.search || null
    }, 'Failed to load posts')
  },

  /** Get a single post by ID. */
  getPost(id) {
    return callRpc('get_post', { p_post_id: id }, 'Failed to load the post')
  },

  /** Create a new post. Requires Manager or Admin role. */
  createPost(data) {
    return callRpc('create_post', {
      p_body: data.body,
      p_priority: data.priority,
      p_asset_ids: extractAssetIds(data.body)
    }, 'Failed to create the post')
  },

  /** Update an existing post. Requires Manager or Admin role. */
  async updatePost(id, data) {
    const result = await callRpc('update_post', {
      p_post_id: id,
      p_body: data.body,
      p_priority: data.priority,
      p_asset_ids: extractAssetIds(data.body)
    }, 'Failed to update the post')

    const { detachedAssetIds = [], ...post } = result
    filesApi.cleanupImages(detachedAssetIds).catch(() => undefined)
    return post
  },

  /** Delete a post. Requires Manager or Admin role. */
  async deletePost(id) {
    const result = await callRpc('delete_post', { p_post_id: id }, 'Failed to delete the post')

    // Database deletion is authoritative. R2 cleanup is best-effort and can be
    // retried later without making the successful post deletion look failed.
    if (result?.assetIds?.length) {
      filesApi.cleanupImages(result.assetIds).catch(() => undefined)
    }

    return result
  }
}
