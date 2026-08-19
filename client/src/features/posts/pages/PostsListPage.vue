<!--
  PostsListPage - Main posts feed page.
  Displays filtered, searchable list of expandable post cards.
  Manager/Admin can create, edit, delete posts via modals.
-->
<template>
  <AppLayout>
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Posts</h1>
        <p class="text-sm text-slate-600 mt-1">Team policies and announcements</p>
      </div>

      <!-- Create post button (Manager/Admin) -->
      <BaseButton v-if="canEditPosts" variant="primary" @click="openCreateModal">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Post
      </BaseButton>
    </div>

    <!-- Filters -->
    <div class="mb-6">
      <PostFilters />
    </div>

    <!-- Loading state -->
    <div v-if="loading && posts.length === 0" class="flex justify-center py-20">
      <BaseSpinner size="lg" label="Loading posts..." />
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && posts.length === 0" class="text-center py-20">
      <svg class="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="text-lg font-medium text-slate-600 mb-1">No posts yet</h3>
      <p class="text-sm text-slate-500">
        {{ hasActiveFilters ? 'Try adjusting your filters' : 'Posts will appear here when created' }}
      </p>
    </div>

    <!-- Posts list -->
    <div v-else class="space-y-4">
      <TransitionGroup name="post-list">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @edit="openEditModal"
          @delete="confirmDelete"
        />
      </TransitionGroup>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="mt-8">
      <BasePagination
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        @page-change="handlePageChange"
      />
    </div>

    <!-- Create/Edit modal -->
    <BaseModal v-model="showFormModal" :title="editingPost ? 'Edit Post' : 'Create Post'" size="lg">
      <PostForm
        :post="editingPost"
        @saved="handleFormSaved"
        @cancel="showFormModal = false"
      />
    </BaseModal>

    <!-- Delete confirmation modal -->
    <BaseModal v-model="showDeleteModal" title="Delete Post" size="sm">
      <p class="text-sm text-slate-700">Are you sure you want to delete this post? This action cannot be undone.</p>
      <template #footer>
        <BaseButton variant="secondary" @click="showDeleteModal = false">Cancel</BaseButton>
        <BaseButton variant="danger" :loading="deleting" @click="handleDelete">Delete</BaseButton>
      </template>
    </BaseModal>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BasePagination from '@/components/ui/BasePagination.vue'
import PostCard from '../components/PostCard.vue'
import PostForm from '../components/PostForm.vue'
import PostFilters from '../components/PostFilters.vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const store = useStore()
const { canEditPosts } = useAuth()
const { success, error: showError } = useToast()

/** Reactive state from Vuex */
const posts = computed(() => store.state.posts.posts)
const pagination = computed(() => store.state.posts.pagination)
const loading = computed(() => store.state.posts.loading)
const hasActiveFilters = computed(() => store.getters['posts/hasActiveFilters'])

/** Modal state */
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const editingPost = ref(null)
const deletingPostId = ref(null)
const deleting = ref(false)

/** Open create modal (empty form) */
const openCreateModal = () => {
  editingPost.value = null
  showFormModal.value = true
}

/** Open edit modal (pre-filled form) */
const openEditModal = (post) => {
  editingPost.value = post
  showFormModal.value = true
}

/** Handle form saved (create or edit) — close modal and refresh */
const handleFormSaved = () => {
  showFormModal.value = false
  editingPost.value = null
}

/** Show delete confirmation modal */
const confirmDelete = (postId) => {
  deletingPostId.value = postId
  showDeleteModal.value = true
}

/** Execute post deletion */
const handleDelete = async () => {
  deleting.value = true
  try {
    await store.dispatch('posts/deletePost', deletingPostId.value)
    success('Post deleted successfully')
    showDeleteModal.value = false
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to delete post')
  } finally {
    deleting.value = false
  }
}

/** Handle pagination page change */
const handlePageChange = (page) => {
  store.dispatch('posts/setPage', page)
  // Scroll to top of the list
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** Fetch posts on page mount */
onMounted(() => {
  store.dispatch('posts/fetchPosts')
})
</script>

<style scoped>
/* Post list animation */
.post-list-enter-active { transition: all 0.3s ease-out; }
.post-list-leave-active { transition: all 0.2s ease-in; }
.post-list-enter-from { opacity: 0; transform: translateY(10px); }
.post-list-leave-to { opacity: 0; transform: translateX(-20px); }
.post-list-move { transition: transform 0.3s ease; }
</style>
