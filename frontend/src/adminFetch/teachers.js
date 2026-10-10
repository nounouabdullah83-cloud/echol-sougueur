/**
 * Typed wrappers for the Teacher endpoints (AdminActions).
 *
 * Each function returns a normalized `{ ok, status, data }` result.
 */

import { apiRequest } from '../api/client'

async function toResult(response) {
  try {
    return { ok: response.ok, status: response.status, data: await response.json() }
  } catch {
    return { ok: response.ok, status: response.status, data: null }
  }
}

/** GET /api/teachers/ — list all teachers. */
export function fetchTeachers() {
  return apiRequest('/api/teachers/').then(toResult)
}