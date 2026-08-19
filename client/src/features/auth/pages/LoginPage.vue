<!--
  LoginPage - Full-screen login page.
  Centered card layout with gradient background.
-->
<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <!-- Background decorative elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-indigo-600/10 blur-3xl" />
      <div class="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-purple-600/10 blur-3xl" />
    </div>

    <!-- Login card -->
    <div class="relative w-full max-w-md">
      <!-- Logo + Title -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25 mb-4">
          <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900">
          Corp<span class="text-indigo-600">Signal</span>
        </h1>
        <p class="text-slate-600 text-sm mt-1">Sign in to your account</p>
      </div>

      <!-- Form card -->
      <div class="bg-white backdrop-blur-xl rounded-2xl border border-slate-200 p-8 shadow-2xl">
        <LoginForm />
      </div>

      <!-- Footer -->
      <p class="text-center text-xs text-slate-400 mt-6">
        Contact your manager for account access
      </p>
    </div>
  </div>
</template>

<script setup>
import LoginForm from '../components/LoginForm.vue'
</script>
