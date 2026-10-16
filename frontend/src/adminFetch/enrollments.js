/**
 * Typed wrappers for the Enrollment endpoints (AdminActions).
 *
 * An enrollment is one student's membership of one group, and the
 * subscription lives on it: renewing affects *only* that group — every other
 * group the student belongs to keeps its own dates.
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

/** GET /api/enrollments/ — list every enrollment (optionally filtered). */
export function fetchEnrollments(params = '') {
  return apiRequest(`/api/enrollments/${params}`).then(toResult)
}

/** GET /api/enrollments/:id/ — a single enrollment. */
export function fetchEnrollment(id) {
  return apiRequest(`/api/enrollments/${id}/`).then(toResult)
}

/**
 * POST /api/enrollments/:id/renew/ — restart this enrollment's subscription
 * for another period (defaults to today; pass an ISO `renewal_date` to
 * backdate it) and credit the group's teacher for the month.
 */
export function renewEnrollment(id, renewalDate) {
  const body = renewalDate ? { renewal_date: renewalDate } : undefined
  return apiRequest(`/api/enrollments/${id}/renew/`, {
    method: 'POST',
    body,
  }).then(toResult)
}
