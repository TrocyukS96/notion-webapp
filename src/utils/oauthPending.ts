const OAUTH_PENDING_KEY = 'notion_oauth_pending'

export function markOAuthPending(): void {
  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, '1')
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

export function clearOAuthPending(): void {
  try {
    sessionStorage.removeItem(OAUTH_PENDING_KEY)
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

export function isOAuthPending(): boolean {
  try {
    return sessionStorage.getItem(OAUTH_PENDING_KEY) === '1'
  } catch {
    return false
  }
}
