import { apiRequest } from './apiClient'

const post = (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) })

/** Step 1 — emails a 4-digit OTP (response is always generic). */
export const requestPasswordReset = (email) => post('/api/auth/forgot-password', { email })

/** Step 2 — returns { resetAuthToken, resetAuthExpiresAt }. */
export const verifyResetOtp = (email, otp) => post('/api/auth/verify-otp', { email, otp })

/** Step 3 — sets the new password using the single-use token. */
export const resetPasswordWithToken = (resetAuthToken, password) =>
  post('/api/auth/reset-password', { resetAuthToken, password })
