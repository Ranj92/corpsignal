/**
 * Application-wide constants.
 * Centralized source of truth for roles, priorities, and other static values.
 */

/** User roles with their display labels and access levels */
export const ROLES = {
  MEMBER: 'Member',
  ADMIN: 'Admin',
  MANAGER: 'Manager'
}

/** Post priority levels with display labels, colors, and numeric values */
export const PRIORITIES = [
  { value: 0, label: 'Low', color: 'emerald', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-700', borderClass: 'border-emerald-500/30' },
  { value: 1, label: 'Medium', color: 'amber', bgClass: 'bg-amber-500/10', textClass: 'text-amber-700', borderClass: 'border-amber-500/30' },
  { value: 2, label: 'High', color: 'rose', bgClass: 'bg-rose-500/10', textClass: 'text-rose-600', borderClass: 'border-rose-500/30' }
]

/** Get priority config by numeric value */
export const getPriorityConfig = (value) => {
  return PRIORITIES.find(p => p.value === value) || PRIORITIES[0]
}

/** Roles that can create/edit/delete posts */
export const canManagePosts = (role) => {
  return role === ROLES.ADMIN || role === ROLES.MANAGER
}

/** Only Manager can manage user accounts */
export const canManageUsers = (role) => {
  return role === ROLES.MANAGER
}

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20
