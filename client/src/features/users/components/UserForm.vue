<!--
  UserForm - Create/Edit user account form.
  Reused for both creating and editing users.
  Manager role only.
-->
<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Username -->
    <BaseInput
      v-model="form.username"
      label="Username"
      placeholder="Enter username"
      :error="errors.username"
    />

    <!-- Password -->
    <BaseInput
      v-model="form.password"
      label="Password"
      type="password"
      :placeholder="isEditing ? 'Leave empty to keep current' : 'Enter password'"
      :error="errors.password"
    />

    <!-- Role selector -->
    <BaseSelect
      v-model="form.role"
      label="Role"
      :options="roleOptions"
      :error="errors.role"
    />

    <!-- Action buttons -->
    <div class="flex justify-end gap-3 pt-2">
      <BaseButton variant="secondary" @click="$emit('cancel')">Cancel</BaseButton>
      <BaseButton type="submit" variant="primary" :loading="loading">
        {{ isEditing ? 'Update User' : 'Create User' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useStore } from 'vuex'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useToast } from '@/composables/useToast'
import { validateUsername } from '@/domain/auth/identity'

const props = defineProps({
  /** Existing user data for editing. If null, form is in create mode. */
  user: { type: Object, default: null }
})

const emit = defineEmits(['cancel', 'saved'])

const store = useStore()
const { success, error: showError } = useToast()

const isEditing = computed(() => !!props.user)
const loading = ref(false)

/** Role options for the select dropdown */
const roleOptions = [
  { value: 'Member', label: 'Member — Read-only access' },
  { value: 'Admin', label: 'Admin — Can manage posts' },
  { value: 'Manager', label: 'Manager — Full access' }
]

/** Form data — pre-filled if editing */
const form = reactive({
  username: props.user?.username || '',
  password: '',
  role: props.user?.role || 'Member'
})

const errors = reactive({
  username: '',
  password: '',
  role: ''
})

/** Client-side validation */
const validate = () => {
  errors.username = ''
  errors.password = ''
  errors.role = ''
  let valid = true

  if (!validateUsername(form.username)) {
    errors.username = 'Use 3–50 letters, numbers, dots, dashes, or underscores'
    valid = false
  }

  // Password required only for new users
  if (!isEditing.value && (!form.password || form.password.length < 8)) {
    errors.password = 'Password must be at least 8 characters'
    valid = false
  }

  // If editing and password provided, validate length
  if (isEditing.value && form.password && form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    valid = false
  }

  if (!form.role) {
    errors.role = 'Role is required'
    valid = false
  }

  return valid
}

/** Handle form submission */
const handleSubmit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const payload = {
      username: form.username.trim(),
      role: form.role
    }

    // Only include password if provided (supports partial update on edit)
    if (form.password) {
      payload.password = form.password
    }

    if (isEditing.value) {
      await store.dispatch('users/updateUser', { id: props.user.id, data: payload })
      success('User updated successfully')
    } else {
      payload.password = form.password // Required for create
      await store.dispatch('users/createUser', payload)
      success('User created successfully')
    }

    emit('saved')
  } catch (err) {
    showError(err.response?.data?.message || 'Failed to save user')
  } finally {
    loading.value = false
  }
}
</script>
