import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'pre', 'code', 'hr', 'span', 'img'
]

const ALLOWED_ATTRIBUTES = ['src', 'alt', 'title', 'class', 'data-asset-id', 'style']

/**
 * Sanitize both before persistence and before v-html rendering. Inline styles
 * are reduced to Tiptap's supported text color so stored content cannot inject
 * arbitrary CSS.
 */
export function sanitizeRichText(html) {
  const sanitized = DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRIBUTES,
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form']
  })

  const document = new DOMParser().parseFromString(sanitized, 'text/html')
  for (const element of document.body.querySelectorAll('[style]')) {
    const color = element.style.color
    element.removeAttribute('style')
    if (color) element.style.color = color
  }

  return document.body.innerHTML
}
