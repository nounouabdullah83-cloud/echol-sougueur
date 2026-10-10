/**
 * Typed wrappers for the AdminAuth JWT endpoints.
 *
 * Each function returns a normalized `{ ok, status, data }` result.
 * Login/refresh deliberately opt out of the client's silent refresh flow.
 */

import { apiRequest } from './client'

async function toResult(response) {
  try {
    return { ok: response.ok, status: response.status, data: await response.json() }
  } catch {
    return { ok: response.ok, status: response.status, data: null }
  }
}

/** POST /api/auth/login/ — email + password (no username exists). */
export function login({ email, password }) {
  return apiRequest('/api/auth/login/', {
    method: 'POST',
    body: { email, password },
    auth: false,
  }).then(toResult)
}

/** POST /api/auth/refresh/ — rotation enabled: returns a NEW access + refresh. */
export function refresh(refreshToken) {
  return apiRequest('/api/auth/refresh/', {
    method: 'POST',
    body: { refresh: refreshToken },
    auth: false,
  }).then(toResult)
}

/** POST /api/auth/logout/ — blacklists the refresh token (requires Bearer access). */
export function logout(refreshToken) {
  return apiRequest('/api/auth/logout/', {
    method: 'POST',
    body: { refresh: refreshToken },
  }).then(toResult)
}

/** POST /api/auth/change-password/ — authenticated; requires old + new + confirm. */
export function changePassword({ old_password, new_password, new_password2 }) {
  return apiRequest('/api/auth/change-password/', {
    method: 'POST',
    body: { old_password, new_password, new_password2 },
  }).then(toResult)
}