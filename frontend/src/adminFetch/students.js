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

/** GET /api/students/:id/ — single student. */
export function fetchStudent(id) {
  return apiRequest(`/api/students/${id}/`).then(toResult)
}

/** POST /api/students/ — create a student. */
export function createStudent(payload) {
  return apiRequest('/api/students/', { method: 'POST', body: payload }).then(toResult)
}

/**
 * DELETE /api/students/:id/ — permanently delete a student from the database.
 *
 * Also clears the student's group memberships and revenue entries (cascade).
 */
export function deleteStudent(id) {
  return apiRequest(`/api/students/${id}/`, { method: 'DELETE' }).then(toResult)
}