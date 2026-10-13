/**
 * Typed wrappers for the teacher revenue endpoint (AdminActions).
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

/**
 * GET /api/teacher-revenues/ — every teacher with their student count and
 * current/last month revenue.
 */
export function fetchTeacherRevenues() {
  return apiRequest('/api/teacher-revenues/').then(toResult)
}

/** GET /api/teacher-revenues/:id/ — one teacher with their revenue summary. */
export function fetchTeacherRevenue(id) {
  return apiRequest(`/api/teacher-revenues/${id}/`).then(toResult)
}

/**
 * GET /api/teacher-revenues/:id/revenue_entries/ — the recent revenue
 * movements for one teacher (one entry per student per month).
 */
export function fetchTeacherRevenueEntries(id) {
  return apiRequest(`/api/teacher-revenues/${id}/revenue_entries/`).then(toResult)
}
