/**
 * Typed wrappers for the Group endpoints (AdminActions).
 *
 * Each function returns a normalized `{ ok, status, data }` result, matching
 * the pattern used in `src/api/auth.js`. Requires a valid access token which
 * `apiRequest` attaches automatically.
 */

import { apiRequest } from '../api/client'

async function toResult(response) {
  try {
    return { ok: response.ok, status: response.status, data: await response.json() }
  } catch {
    return { ok: response.ok, status: response.status, data: null }
  }
}

/** GET /api/groups/ — list all groups. */
export function fetchGroups() {
  return apiRequest('/api/groups/').then(toResult)
}

/** POST /api/groups/ — create a group. */
export function createGroup(payload) {
  return apiRequest('/api/groups/', { method: 'POST', body: payload }).then(toResult)
}

/** GET /api/groups/:id/ — single group. */
export function fetchGroup(id) {
  return apiRequest(`/api/groups/${id}/`).then(toResult)
}