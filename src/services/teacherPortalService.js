import { apiRequest } from './apiClient'

const unwrap = (res) => (res && typeof res === 'object' && 'success' in res && 'data' in res ? res.data : res)

const qs = (params = {}) => {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && v !== 'all' && sp.set(k, String(v)))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/** Logged-in teacher's own profile + registration fee (GET /api/teachers/me). */
export async function getMyProfile() {
  return unwrap(await apiRequest('/api/teachers/me'))
}

/** Logged-in teacher's allocations (GET /api/teacher-allocations/my). */
export async function listMyAllocations(params) {
  const data = unwrap(await apiRequest(`/api/teacher-allocations/my${qs(params)}`))
  return Array.isArray(data) ? { docs: data } : data
}

/** Teachers may only set `accepted` or `rejected` on their own allocation. */
export async function respondToAllocation(id, status, reason) {
  return unwrap(
    await apiRequest(`/api/teacher-allocations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
    }),
  )
}
