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

/** GET /api/teachers/:id/ — single teacher. */
export function fetchTeacher(id) {
  return apiRequest(`/api/teachers/${id}/`).then(toResult)
}

/** POST /api/teachers/ — create a teacher. */
export function createTeacher(payload) {
  return apiRequest('/api/teachers/', { method: 'POST', body: payload }).then(toResult)
}

/** DELETE /api/teachers/:id/ — remove a teacher. */
export function deleteTeacher(id) {
  return apiRequest(`/api/teachers/${id}/`, { method: 'DELETE' }).then(toResult)
}