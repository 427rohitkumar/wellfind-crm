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

/** The logged-in teacher's own application: stages, documents, registration fee and payment details. */
export async function getMyApplication() {
  return unwrap(await apiRequest('/api/teacher-applications/me'))
}

/** Upload or replace documents. `formData` may hold aadhaarDocument and/or qualificationDocument. */
export async function uploadMyDocuments(formData) {
  return unwrap(await apiRequest('/api/teacher-applications/me/documents', { method: 'POST', body: formData }))
}

/** Tell us the registration fee was paid: { method: 'upi'|'bank_transfer'|'other', transactionRef }. */
export async function submitMyPayment(body) {
  return unwrap(
    await apiRequest('/api/teacher-applications/me/payment', { method: 'POST', body: JSON.stringify(body) }),
  )
}

/** Starts an online registration payment. Returns what Razorpay Checkout needs (key, order id, amount, prefill). */
export async function createPaymentOrder() {
  return unwrap(await apiRequest('/api/teacher-applications/me/payment/order', { method: 'POST' }))
}

/** Sends the Razorpay checkout result to the server, which verifies it and settles the fee. */
export async function verifyPayment(result) {
  return unwrap(
    await apiRequest('/api/teacher-applications/me/payment/verify', { method: 'POST', body: JSON.stringify(result) }),
  )
}

let checkoutScript = null
/** Loads Razorpay Checkout once. */
export function loadRazorpayCheckout() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in a browser.'))
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  checkoutScript ||= new Promise((resolve, reject) => {
    const el = document.createElement('script')
    el.src = 'https://checkout.razorpay.com/v1/checkout.js'
    el.async = true
    el.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Payment window could not load.')))
    el.onerror = () => { checkoutScript = null; reject(new Error('Could not load the payment window. Check your internet connection.')) }
    document.head.appendChild(el)
  })
  return checkoutScript
}
