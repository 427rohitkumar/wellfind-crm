import { apiRequest } from './apiClient'

const unwrap = (res) => (res && typeof res === 'object' && 'success' in res && 'data' in res ? res.data : res)

/** The signed-in user's own profile (admin or teacher). */
export async function getProfile() {
  return unwrap(await apiRequest('/api/profile'))
}

/** Updates basic details. The email can never be changed here. */
export async function updateProfile(body) {
  return unwrap(await apiRequest('/api/profile', { method: 'PATCH', body: JSON.stringify(body) }))
}
