/**
 * Typed wrappers for the Student endpoints (AdminActions).
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

/** GET /api/students/ — list all students. */
export function fetchStudents() {
  return apiRequest('/api/students/').then(toResult)
}