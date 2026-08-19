<!--
  LoginForm - Authentication form component.
  Handles username/password input with validation and error display.
  Emits no events — directly dispatches Vuex login action and navigates on success.
-->
<template>
  <form @submit.prevent="handleLogin" class="space-y-5">
    <!-- Error alert -->
    <BaseAlert v-if="authError" type="error" dismissible @dismiss="clearError">
      {{ authError }}
    </BaseAlert>

    <!-- Username -->
    <BaseInput
      v-model="form.username"
      label="Username"
      placeholder="Enter your username"
      :error="errors.username"
      input-id="login-username"
    />

    <!-- Password -->
    <BaseInput
      v-model="form.password"
      label="Password"
      type="password"
      placeholder="Enter your password"
      :error="errors.password"
      input-id="login-password"
    />

    <!-- Submit button -->
    <BaseButton
      type="submit"
      variant="primary"
      size="lg"
      :loading="loading"
      class="w-full"
    >
      Sign In
    </BaseButton>
  </form>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAlert from '@/components/ui/BaseAlert.vue'
import { validateUsername } from '@/domain/auth/identity'

const store = useStore()
const router = useRouter()

/** Form data */
const form = reactive({
  username: '',
  password: ''
})

/** Validation errors */
const errors = reactive({
  username: '',
  password: ''
})

/** Loading and error state from Vuex */
const loading = computed(() => store.state.auth.loading)
const authError = computed(() => store.state.auth.error)

/** Clear the auth error message */
const clearError = () => store.commit('auth/SET_ERROR', null)

/** Client-side validation before API call */
const validate = () => {
  errors.username = ''
  errors.password = ''
  let valid = true

  if (!validateUsername(form.username)) {
    errors.username = 'Enter a valid username'
    valid = false
  }
  if (!form.password) {
    errors.password = 'Password is required'
    valid = false
  }

  return valid
}

/** Handle form submission */
const handleLogin = async () => {
  if (!validate()) return

  try {
    await store.dispatch('auth/login', {
      username: form.username.trim(),
      password: form.password
    })
    router.push('/posts')
  } catch {
    // Error is handled by the store and displayed via authError
  }
}
</script>
