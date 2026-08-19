<!--
  RichTextEditor - Tiptap-based rich text editor wrapper.
  Features: Bold, Italic, Underline, Text Color picker, Image paste/drag-drop.
  Emits HTML content via v-model. Toolbar uses icon buttons.
-->
<template>
  <div class="rich-text-editor rounded-lg border border-slate-200 bg-white overflow-hidden">
    <!-- Toolbar -->
    <div v-if="editor" class="flex items-center gap-1 px-3 py-2 border-b border-slate-200 bg-slate-50/90 flex-wrap">
      <!-- Bold -->
      <button
        type="button"
        :class="['toolbar-btn', { 'toolbar-btn-active': editor.isActive('bold') }]"
        title="Bold"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
      </button>

      <!-- Italic -->
      <button
        type="button"
        :class="['toolbar-btn', { 'toolbar-btn-active': editor.isActive('italic') }]"
        title="Italic"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <line x1="19" y1="4" x2="10" y2="4" />
          <line x1="14" y1="20" x2="5" y2="20" />
          <line x1="15" y1="4" x2="9" y2="20" />
        </svg>
      </button>

      <!-- Underline -->
      <button
        type="button"
        :class="['toolbar-btn', { 'toolbar-btn-active': editor.isActive('underline') }]"
        title="Underline"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3" />
          <line x1="4" y1="21" x2="20" y2="21" />
        </svg>
      </button>

      <!-- Separator -->
      <div class="w-px h-5 bg-slate-200 mx-1" />

      <!-- Text Color picker -->
      <div class="relative">
        <button
          type="button"
          class="toolbar-btn flex items-center gap-1"
          title="Text Color"
          @click="showColorPicker = !showColorPicker"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <!-- Color preview dot -->
          <span :style="{ backgroundColor: currentColor }" class="w-3 h-3 rounded-full border border-slate-500" />
        </button>

        <!-- Color palette dropdown -->
        <div
          v-if="showColorPicker"
          class="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-200 rounded-lg shadow-xl z-10 grid grid-cols-6 gap-1"
        >
          <button
            v-for="color in colorPalette"
            :key="color"
            type="button"
            :style="{ backgroundColor: color }"
            class="w-6 h-6 rounded-md border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
            :title="color"
            @click="setColor(color)"
          />
          <!-- Reset to default -->
          <button
            type="button"
            class="w-6 h-6 rounded-md border border-slate-300 hover:scale-110 transition-transform flex items-center justify-center text-xs text-slate-600 cursor-pointer"
            title="Default color"
            @click="removeColor"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Separator -->
      <div class="w-px h-5 bg-slate-200 mx-1" />

      <!-- Image upload button -->
      <button
        type="button"
        class="toolbar-btn"
        title="Insert Image"
        @click="triggerImageUpload"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 15l-5-5L5 21" />
        </svg>
      </button>

      <!-- Hidden file input for image upload -->
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        class="hidden"
        @change="handleFileSelect"
      />
    </div>

    <!-- Editor content area -->
    <EditorContent
      :editor="editor"
      class="prose prose-slate prose-sm max-w-none px-4 py-3 min-h-[120px] focus-within:ring-1 focus-within:ring-indigo-500/30 transition-shadow"
    />
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import filesApi from '@/api/filesApi'
import { sanitizeRichText } from '@/security/sanitizeRichText'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  /** HTML content (v-model) */
  modelValue: { type: String, default: '' },
  /** Placeholder text shown when editor is empty */
  placeholder: { type: String, default: 'Write your post content here...' }
})

const emit = defineEmits(['update:modelValue', 'asset-uploaded'])
const { error: showError } = useToast()

const showColorPicker = ref(false)
const currentColor = ref('#0f172a') // slate-900 default
const fileInput = ref(null)

/** Color palette for the text color picker */
const colorPalette = [
  '#0f172a', '#dc2626', '#ea580c', '#d97706', '#65a30d', '#059669',
  '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#334155', '#64748b'
]

/** Preserve the storage asset identity in HTML so post saves can attach images atomically. */
const ManagedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      assetId: {
        default: null,
        parseHTML: element => element.getAttribute('data-asset-id'),
        renderHTML: attributes => attributes.assetId
          ? { 'data-asset-id': attributes.assetId }
          : {}
      }
    }
  }
})

/** Initialize Tiptap editor with extensions */
const editor = useEditor({
  content: sanitizeRichText(props.modelValue),
  extensions: [
    StarterKit,
    TextStyle,
    Color,
    Underline,
    ManagedImage.configure({
      inline: true,
      allowBase64: false,
      HTMLAttributes: {
        class: 'rounded-lg max-w-full h-auto my-2'
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    })
  ],
  editorProps: {
    attributes: {
      class: 'outline-none'
    },
    /** Handle image paste from clipboard */
    handlePaste: (view, event) => {
      const items = event.clipboardData?.items
      if (!items) return false

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault()
          const file = item.getAsFile()
          if (file) uploadAndInsertImage(file)
          return true
        }
      }
      return false
    },
    /** Handle image drag-and-drop */
    handleDrop: (view, event) => {
      const files = event.dataTransfer?.files
      if (!files || files.length === 0) return false

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          event.preventDefault()
          uploadAndInsertImage(file)
          return true
        }
      }
      return false
    }
  },
  /** Emit content changes back to parent via v-model */
  onUpdate: ({ editor: ed }) => {
    emit('update:modelValue', sanitizeRichText(ed.getHTML()))
  }
})

/** Sync external modelValue changes into the editor */
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(sanitizeRichText(newValue), false)
  }
})

/** Apply text color to selected text */
const setColor = (color) => {
  currentColor.value = color
  editor.value?.chain().focus().setColor(color).run()
  showColorPicker.value = false
}

/** Remove text color (reset to default) */
const removeColor = () => {
  currentColor.value = '#0f172a'
  editor.value?.chain().focus().unsetColor().run()
  showColorPicker.value = false
}

/** Open the native file picker for image selection */
const triggerImageUpload = () => {
  fileInput.value?.click()
}

/** Handle file selected from the file picker */
const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    uploadAndInsertImage(file)
  }
  // Reset input so the same file can be selected again
  event.target.value = ''
}

/**
 * Uploads an image to the server and inserts it into the editor.
 * Used by paste, drag-drop, and file picker handlers.
 */
const uploadAndInsertImage = async (file) => {
  try {
    const uploadedImage = await filesApi.uploadImage(file)
    // Insert the image at the current cursor position
    editor.value?.chain().focus().setImage({
      src: uploadedImage.url,
      alt: uploadedImage.originalName,
      assetId: uploadedImage.id
    }).run()
    emit('asset-uploaded', uploadedImage.id)
  } catch (error) {
    showError(error.message || 'Image upload failed')
  }
}

/** Cleanup on component unmount */
onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
@reference "tailwindcss";
.toolbar-btn {
  @apply p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer;
}
.toolbar-btn-active {
  @apply bg-indigo-600/20 text-indigo-600;
}

/* Style the Tiptap editor content area */
:deep(.tiptap) {
  min-height: 100px;
  color: #0f172a;
}
:deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #64748b;
  pointer-events: none;
  height: 0;
}
:deep(.tiptap img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 0.5rem 0;
}
</style>
