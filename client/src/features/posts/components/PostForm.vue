<!--
  PostForm - Create/Edit post form.
  Reused for both creating and editing posts.
  Contains RichTextEditor for body and priority selector.
-->
<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Priority selector -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-slate-700">Priority</label>
      <div class="flex gap-2">
        <button
          v-for="p in PRIORITIES"
          :key="p.value"
          type="button"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 cursor-pointer',
            form.priority === p.value
              ? `${p.bgClass} ${p.textClass} ${p.borderClass}`
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          ]"
          @click="form.priority = p.value"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Rich text body editor -->
    <div class="space-y-1.5">
      <label class="block text-sm font-medium text-slate-700">Content</label>
      <RichTextEditor v-model="form.body" @asset-uploaded="trackUploadedAsset" />
      <p v-if="errors.body" class="text-xs text-rose-600">{{ errors.body }}</p>
    </div>

    <!-- Action buttons -->
    <div class="flex justify-end gap-3 pt-2">
      <BaseButton variant="secondary" @click="handleCancel">Cancel</BaseButton>
      <BaseButton type="submit" variant="primary" :loading="loading">
        {{ isEditing ? 'Update Post' : 'Create Post' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup>
import { reactive, computed, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import BaseButton from '@/components/ui/BaseButton.vue'
import RichTextEditor from './RichTextEditor.vue'
import { PRIORITIES } from '@/utils/constants'
import { useToast } from '@/composables/useToast'
import { sanitizeRichText } from '@/security/sanitizeRichText'
import { extractAssetIds } from '@/domain/posts/content'
import filesApi from '@/api/filesApi'

const props = defineProps({
  /** Existing post data for editing. If null, form is in create mode. */
  post: { type: Object, default: null }
})

const emit = defineEmits(['cancel', 'saved'])

const store = useStore()
const { success, error: showError } = useToast()

/** Determine if editing or creating */
const isEditing = computed(() => !!props.post)

/** Form data — pre-filled if editing */
const form = reactive({
  body: props.post?.body || '',
  priority: props.post?.priorityLevel ?? 0
})

const errors = reactive({ body: '' })
const loading = computed(() => store.state.posts.loading)
const uploadedAssetIds = new Set()
let wasSaved = false

const trackUploadedAsset = (assetId) => uploadedAssetIds.add(assetId)

const cleanupAssets = (assetIds) => {
  filesApi.cleanupImages([...assetIds]).catch(() => undefined)
}

const handleCancel = () => emit('cancel')

/** Validate before submission */
const validate = () => {
  errors.body = ''
  // Strip HTML to check for actual text content
  const textContent = form.body.replace(/<[^>]*>/g, '').trim()
  if (!textContent && !form.body.includes('<img')) {
    errors.body = 'Post content is required'
    return false
  }
  return true
}

/** Handle form submission — create or update */
const handleSubmit = async () => {
  if (!validate()) return

  try {
    const payload = {
      body: sanitizeRichText(form.body),
      priority: form.priority
    }

    if (isEditing.value) {
      await store.dispatch('posts/updatePost', { id: props.post.id, data: payload })
      success('Post updated successfully')
    } else {
      await store.dispatch('posts/createPost', payload)
      success('Post created successfully')
    }

    const attachedAssetIds = new Set(extractAssetIds(payload.body))
    const unusedUploads = [...uploadedAssetIds].filter(id => !attachedAssetIds.has(id))
    wasSaved = true
    cleanupAssets(unusedUploads)
    emit('saved')
  } catch (err) {
    showError(err.message || 'Failed to save post')
  }
}

onBeforeUnmount(() => {
  if (!wasSaved) cleanupAssets(uploadedAssetIds)
})
</script>
