/**
 * Users API module.
 * Handles user account management (Manager role only).
 */
import { invokeFunction } from '@/infrastructure/supabase/invokeFunction'
import { runtimeConfig } from '@/config/runtime'

const invokeUsers = (method, body) => invokeFunction(runtimeConfig.functions.adminUsers, { method, body })

export default {
  /** Get all users. Manager role required. */
  getUsers() {
    return invokeUsers('GET')
  },

  /** Get a single user by ID. Manager role required. */
  async getUser(id) {
    const users = await invokeUsers('GET')
    return users.find(user => user.id === id) || null
  },

  /** Create a new user account. Manager role required. */
  createUser(data) {
    return invokeUsers('POST', data)
  },

  /** Update a user account. Manager role required. */
  updateUser(id, data) {
    return invokeUsers('PUT', { id, ...data })
  },

  /** Delete a user account. Manager role required. */
  deleteUser(id) {
    return invokeUsers('DELETE', { id })
  }
}
