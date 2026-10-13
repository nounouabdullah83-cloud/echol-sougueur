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
 * POST /api/students/:id/renew_subscription/ — reactivate the student's
 * subscription for another period and reset its renewal date.
 */
export function renewStudentSubscription(id) {
  return apiRequest(`/api/students/${id}/renew_subscription/`, {
    method: 'POST',
  }).then(toResult)
}