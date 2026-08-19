/** Application-facing error that hides provider-specific response shapes. */
export class ApplicationError extends Error {
  constructor(message, { code = 'unexpected_error', status = 500, cause } = {}) {
    super(message, { cause })
    this.name = 'ApplicationError'
    this.code = code
    this.status = status

    // Compatibility while legacy components are migrated to error.message.
    this.response = { status, data: { message } }
  }
}

export function toApplicationError(error, fallbackMessage) {
  if (error instanceof ApplicationError) return error

  const message = error?.message || fallbackMessage
  const status = error?.status || error?.context?.status || 500
  const code = error?.code || 'provider_error'
  return new ApplicationError(message, { code, status, cause: error })
}
