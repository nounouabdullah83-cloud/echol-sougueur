/**
 * Shared API client.
 *
 * - baseURL comes from `import.meta.env.VITE_API_URL` and defaults to the
 *   local Django server.
 * - Attaches `Authorization: Bearer <access>` whenever a token is present.
 * - On a 401 from a normal (authenticated) request it attempts ONE refresh via
 *   `/api/auth/refresh/`, retries the original request once on success, and
 *   persists the rotated tokens. On failure it clears the tokens and returns
 *   the user to the login page.
 * - Never attempts a refresh for the login/refresh endpoints themselves
 *   (pass `auth: false` for those).
 */

import { clearTokens, getTokens, setTokens } from './tokenStore'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

let refreshInFlight = null

async function attemptRefresh() {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const stored = getTokens()
    if (!stored?.refresh) return null

    let response
    try {
      response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: stored.refresh }),
      })
    } catch {
      return null
    }

    if (!response.ok) return null

    let data
    try {
      data = await response.json()
    } catch {
      return null
    }

    // Rotation is enabled, so both tokens must come back.
    if (!data.access || !data.refresh) return null

    setTokens(
      { access: data.access, refresh: data.refresh, user: stored.user },
      stored.remember,
    )
    window.dispatchEvent(
      new CustomEvent('auth:tokens', {
        detail: { access: data.access, refresh: data.refresh },
      }),
    )
    return data
  })().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

function announceAuthExpired() {
  clearTokens()
  window.dispatchEvent(new CustomEvent('auth:expired'))
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

/**
 * Perform a request against the API.
 *
 * @param {string} path  Absolute path under the API base, e.g. `/api/auth/login/`.
 * @param {object} [options]
 * @param {string} [options.method='GET']
 * @param {object} [options.body]  Sent as JSON.
 * @param {boolean} [options.auth=true]  Attach the Bearer header; enables the
 *   silent 401-refresh-retry flow. Set `false` for login/refresh only.
 * @returns {Promise<Response>}
 */
export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, auth = true } = options

  const headers = { 'Content-Type': 'application/json' }
  const stored = getTokens()
  if (auth && stored?.access) {
    headers.Authorization = `Bearer ${stored.access}`
  }

  const doFetch = () =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

  let response = await doFetch()

  if (auth && response.status === 401) {
    const refreshed = await attemptRefresh()
    if (refreshed) {
      const current = getTokens()
      if (current?.access) headers.Authorization = `Bearer ${current.access}`
      response = await doFetch()
    } else {
      // Refresh token expired/invalid — the session is over.
      announceAuthExpired()
    }
  }

  return response
}