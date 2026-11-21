import { apiRequest, fetchPrivateDocumentBlob } from './apiClient'

/** Upload helpers for the API's /api/uploads (stored on Cloudinary once it is configured). */

export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp'
export const DOCUMENT_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp'
export const MAX_AVATAR_MB = 5
export const MAX_DOCUMENT_MB = 10

const unwrap = (res) => (res && typeof res === 'object' && 'success' in res && 'data' in res ? res.data : res)

/** Client-side pre-check so people get an instant message; the server checks again. */
export function checkFile(file, purpose) {
  if (!file) return 'Choose a file first.'
  const max = purpose === 'avatar' ? MAX_AVATAR_MB : MAX_DOCUMENT_MB
  if (file.size > max * 1024 * 1024) return `The file must be ${max} MB or smaller.`
  const ok = purpose === 'avatar' ? ['image/jpeg', 'image/png', 'image/webp'] : ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (!ok.includes(file.type)) return purpose === 'avatar' ? 'Use a JPG, PNG or WebP image.' : 'Allowed files: PDF, JPG, PNG or WebP.'
  return ''
}

export async function uploadAvatar(file) {
  const body = new FormData()
  body.append('purpose', 'avatar')
  body.append('file', file)
  return unwrap(await apiRequest('/api/uploads', { method: 'POST', body }))
}

export async function removeAvatar() {
  return unwrap(await apiRequest('/api/uploads/avatar', { method: 'DELETE' }))
}

export async function uploadDocument(file, { label, category } = {}) {
  const body = new FormData()
  body.append('purpose', 'document')
  body.append('file', file)
  if (label) body.append('label', label)
  if (category) body.append('category', category)
  return unwrap(await apiRequest('/api/uploads', { method: 'POST', body }))
}

export async function listMyDocuments(ownerId) {
  return unwrap(await apiRequest(ownerId ? `/api/uploads?userId=${encodeURIComponent(ownerId)}` : '/api/uploads'))
}

export async function deleteDocument(id) {
  return unwrap(await apiRequest(`/api/uploads/${id}`, { method: 'DELETE' }))
}

/** Opens a private file in a new tab (it needs the login token, so it is fetched as a blob first). */
export async function openDocument(doc) {
  const blob = await fetchPrivateDocumentBlob(doc.url)
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
