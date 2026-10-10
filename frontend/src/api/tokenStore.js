/**
 * Token persistence.
 *
 * Tokens live in localStorage when the user ticked "تذكّرني" (remember me),
 * otherwise in sessionStorage. A single JSON payload holds access, refresh,
 * the user snapshot, and the remember flag so silent refreshes can re-persist
 * rotated tokens to the exact same store.
 */

const STORAGE_KEY = 'echole.auth'

export function getTokens() {
  if (typeof window === 'undefined') return null

  const raw =
    window.localStorage.getItem(STORAGE_KEY) ||
    window.sessionStorage.getItem(STORAGE_KEY)

  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed.access || !parsed.refresh) return null
    return parsed
  } catch {
    return null
  }
}

export function setTokens(tokens, remember) {
  if (typeof window === 'undefined') return

  clearTokens()
  const store = remember ? window.localStorage : window.sessionStorage
  store.setItem(STORAGE_KEY, JSON.stringify({ ...tokens, remember: Boolean(remember) }))
}

export function clearTokens() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  window.sessionStorage.removeItem(STORAGE_KEY)
}