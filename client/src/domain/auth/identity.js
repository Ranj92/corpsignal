const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{2,49}$/

export function normalizeUsername(username) {
  return username.trim().toLowerCase()
}

export function validateUsername(username) {
  return USERNAME_PATTERN.test(username.trim())
}

/** Supabase Auth uses an internal synthetic email; users continue to log in by username. */
export function usernameToAuthEmail(username, domain) {
  if (!validateUsername(username)) {
    throw new Error('Username must be 3–50 characters and use only letters, numbers, dots, dashes, or underscores')
  }

  return `${normalizeUsername(username)}@${domain}`
}
