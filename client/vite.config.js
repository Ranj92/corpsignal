import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

/**
 * Vite configuration for CorpSignal frontend.
 * - @/ path alias for src/ directory
 * - Tailwind CSS v4 via Vite plugin
 * - Supabase and Edge Functions are called directly; no local API proxy is needed
 */
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      '@': import.meta.dirname + '/src'
    }
  },
  server: {
    port: 5173
  }
})
