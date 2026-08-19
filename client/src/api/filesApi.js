/**
 * Files API module.
 * Handles image upload for the rich text editor.
 */
import { invokeFunction } from '@/infrastructure/supabase/invokeFunction'
import { runtimeConfig } from '@/config/runtime'

export default {
  /**
   * Upload an image file. Returns the URL to embed in the editor.
   * @param {File} file - The image file to upload
   * @returns {Promise<{url: string, fileName: string, contentType: string, fileSize: number}>}
   */
  uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)

    return invokeFunction(runtimeConfig.functions.media, { body: formData })
  },

  /** Delete only unlinked media assets; attached images are protected server-side. */
  cleanupImages(assetIds) {
    if (!assetIds?.length) return Promise.resolve({ deletedAssetIds: [] })
    return invokeFunction(runtimeConfig.functions.media, {
      method: 'DELETE',
      body: { assetIds }
    })
  }
}
