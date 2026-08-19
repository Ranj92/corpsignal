import { HttpError } from './http.ts'

export const ROLES = ['Member', 'Admin', 'Manager'] as const
export type AppRole = typeof ROLES[number]

const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,49}$/

export function validateUsername(value: unknown): string {
  const username = typeof value === 'string' ? value.trim() : ''
  if (!USERNAME_PATTERN.test(username)) {
    throw new HttpError(
      400,
      'Username must be 3–50 characters and use only letters, numbers, dots, dashes, or underscores',
      'invalid_username'
    )
  }
  return username
}

export function validateRole(value: unknown): AppRole {
  if (typeof value !== 'string' || !ROLES.includes(value as AppRole)) {
    throw new HttpError(400, 'Role must be Member, Admin, or Manager', 'invalid_role')
  }
  return value as AppRole
}

export function validatePassword(value: unknown, required = true): string | undefined {
  if ((value === undefined || value === null || value === '') && !required) return undefined
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw new HttpError(400, 'Password must be between 8 and 128 characters', 'invalid_password')
  }
  return value
}

export function usernameToAuthEmail(username: string): string {
  const domain = Deno.env.get('AUTH_EMAIL_DOMAIN')?.trim() || 'auth.corpsignal.invalid'
  return `${username.toLowerCase()}@${domain}`
}
