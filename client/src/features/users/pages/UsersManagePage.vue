<!--
  UsersManagePage - User account management page.
  Manager role only. Lists all users with create, edit, delete capabilities.
-->
<template>
  <AppLayout>
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Users</h1>
        <p class="text-sm text-slate-600 mt-1">Manage team accounts</p>
      </div>

      <BaseButton variant="primary" @click="openCreateModal">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        New User
      </BaseButton>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-20">
      <BaseSpinner size="lg" label="Loading users..." />
    </div>

    <!-- Users table -->
    <BaseCard v-else no-padding>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Created</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr
              v-for="user in users"
              :key="user.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <!-- Username with avatar -->
              <td class="px-5 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    {{ user.username.charAt(0).toUpperCase() }}
                  </div>
                  <span class="text-slate-800 font-medium">{{ user.username }}</span>
                </div>
              </td>

              <!-- Role badge -->
              <td class="px-5 py-3">
                <BaseBadge :variant="getRoleBadgeVariant(user.role)">
                  {{ user.role }}
                </BaseBadge>
              </td>

              <!-- Created date -->
              <td class="px-5 py-3 text-slate-600">
                <span :title="formatFullDateTime(user.createdAt)">
                  {{ formatRelativeTime(user.createdAt) }}
                </span>
              </td>

              <!-- Actions -->
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                    title="Edit user"
                    @click="openEditModal(user)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    class="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                    title="Delete user"
                    @click="confirmDelete(user)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-if="users.length === 0 && !loading" class="text-center py-12">
        <p class="text-slate-500">No users found</p>
      </div>
    </BaseCard>

    <!-- Create/Edit modal -->
    <BaseModal v-model="showFormModal" :title="editingUser ? 'Edit User' : 'Create User'">
      <UserForm
        :user="editingUser"
        @saved="handleFormSaved"
        @cancel="showFormModal = false"
      />
    </BaseModal>

    <!-- Delete confirmation modal -->
    <BaseModal v-model="showDeleteModal" title="Delete User" size="sm">
      <p class="text-sm text-slate-700">
        Are you sure you want to delete user <strong class="text-slate-900">{{ deletingUser?.username }}</strong>?
        This action cannot be undone.
      </p>
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
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import UserForm from '../components/UserForm.vue'
import { useToast } from '@/composables/useToast'
import { formatRelativeTime, formatFullDateTime } from '@/utils/formatters'

const store = useStore()
const { success, error: showError } = useToast()

/** Reactive state from Vuex */
const users = computed(() => store.state.users.users)
const loading = computed(() => store.state.users.loading)

/** Modal state */
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const editingUser = ref(null)
const deletingUser = ref(null)
const deleting = ref(false)

/** Map roles to badge color variants */
const getRoleBadgeVariant = (role) => ({
  Manager: 'rose',
  Admin: 'amber',
  Member: 'slate'
}[role] || 'slate')

const openCreateModal = () => {
  editingUser.value = null
  showFormModal.value = true
}

const openEditModal = (user) => {
  editingUser.value = user
  showFormModal.value = true
}

const handleFormSaved = () => {
  showFormModal.value = false
  editingUser.value = null
}

const confirmDelete = (user) => {
  deletingUser.value = user
  showDeleteModal.value = true
}

const handleDelete = async () => {
  deleting.value = true
  try {
    await store.dispatch('users/deleteUser', deletingUser.value.id)
    success('User deleted successfully')
    showDeleteModal.value = false
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to delete user')
  } finally {
    deleting.value = false
  }
}

/** Fetch users on mount */
onMounted(() => {
  store.dispatch('users/fetchUsers')
})
</script>
