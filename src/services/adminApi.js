/**
 * Wellfind CRM — Admin API (wellfind-api endpoints, super_admin only)
 *
 * Covers: users, students (operational records), assessments, matching,
 * physical tests, teacher allocations, teacher evaluations / approval,
 * teacher status & availability, and enquiry -> student conversion.
 *
 * Custom endpoints respond with `{ success, message, data }`; Payload built-ins
 * (e.g. /api/users) respond with the raw document / paginated object. `unwrap`
 * normalises both.
 */
import { apiRequest } from './apiClient'

const json = (method, body) => ({
  method,
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
})

const unwrap = (res) =>
  res && typeof res === 'object' && 'success' in res && 'data' in res ? res.data : res

function qs(params = {}) {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') sp.set(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : ''
}

async function call(path, options) {
  return unwrap(await apiRequest(path, options))
}

/* ------------------------------ Users ------------------------------ */
export const USER_ROLES = ['super_admin', 'operations_manager', 'student_counselor', 'teacher_coordinator', 'finance_manager', 'marketing_analyst', 'support_executive', 'teacher']
export const USER_STATUSES = ['active', 'blocked', 'suspended']

export const listUsers = (params) => call(`/api/users${qs(params)}`)
export const createUser = (body) => call('/api/users', json('POST', body))
export const updateUser = (id, body) => call(`/api/users/${id}`, json('PATCH', body))
export const deleteUser = (id) => call(`/api/users/${id}`, { method: 'DELETE' })
export const blockUser = (id) => call(`/api/auth/admin/users/${id}/block`, json('POST'))
export const unblockUser = (id) => call(`/api/auth/admin/users/${id}/unblock`, json('POST'))
export const suspendUser = (id) => call(`/api/auth/admin/users/${id}/suspend`, json('POST'))
export const reactivateUser = (id) => call(`/api/auth/admin/users/${id}/reactivate`, json('POST'))
export const resetUserPassword = (id) => call(`/api/auth/admin/users/${id}/reset-password`, json('POST'))

/* ------------------- Tests (IQ / creativity / academic level) ------------------- */
export const TEST_MODES = {
  physical: { label: 'Physical (offline)', short: 'Physical', fee: 99 },
  digital: { label: 'Digital (online)', short: 'Digital', fee: 49 },
}
export const TEST_STATUS_LABEL = {
  requested: 'Requested',
  scheduled: 'Scheduled',
  conducted: 'Conducted',
  report_ready: 'Report ready',
  cancelled: 'Cancelled',
}
export const LEVEL_LABEL = { excellent: 'Excellent', good: 'Good', average: 'Average', needs_support: 'Needs support' }

export const listEnquiryTests = (params) => call(`/api/admin/enquiry-tests${qs(params)}`)
export const getEnquiryTest = (id) => call(`/api/admin/enquiry-tests/${id}`)
export const createEnquiryTest = (body) => call('/api/admin/enquiry-tests', json('POST', body))
export const updateEnquiryTest = (id, body) => call(`/api/admin/enquiry-tests/${id}`, json('PATCH', body))
export const listTesters = () => call('/api/admin/enquiry-tests/testers')

/* ----------------------- Students (operational) ----------------------- */
export const STUDENT_RECORD_STATUSES = ['active', 'inactive', 'paused', 'completed']

export const listStudentRecords = (params) => call(`/api/students${qs(params)}`)
export const getStudentRecord = (id) => call(`/api/students/${id}`)
export const createStudentRecord = (body) => call('/api/students', json('POST', body))
export const updateStudentRecord = (id, body) => call(`/api/students/${id}`, json('PATCH', body))
export const convertStudentEnquiry = (enquiryId, body = {}) =>
  call(`/api/student-enquiries/${enquiryId}/convert`, json('POST', body))

/* ----------------------------- Assessments ----------------------------- */
export const CAPABILITY_LEVELS = ['excellent', 'good', 'average', 'needs_improvement', 'weak']

export const listAssessments = (studentId, params) =>
  call(`/api/students/${studentId}/assessments${qs(params)}`)
export const createAssessment = (studentId, body) =>
  call(`/api/students/${studentId}/assessments`, json('POST', body))

/* ------------------------------- Matching ------------------------------- */
export const MATCH_STATUSES = ['eligible', 'shortlisted', 'rejected']

export const getStudentMatches = (studentId) => call(`/api/students/${studentId}/matches`)
export const saveStudentMatch = (studentId, body) =>
  call(`/api/students/${studentId}/matches`, json('POST', body))

/* ---------------------------- Physical tests ---------------------------- */
export const listStudentTests = (studentId, params) =>
  call(`/api/students/${studentId}/tests${qs(params)}`)
export const createStudentTest = (studentId, body) =>
  call(`/api/students/${studentId}/tests`, json('POST', body))
export const getStudentTest = (testId) => call(`/api/student-tests/${testId}`)
export const recordTestPayment = (testId, body) =>
  call(`/api/student-tests/${testId}/payment`, json('POST', body))
export const assignTestTester = (testId, body) =>
  call(`/api/student-tests/${testId}/assign-tester`, json('PATCH', body))
export const getTestReport = (testId) => call(`/api/student-tests/${testId}/report`)
export const submitTestReport = (testId, body) =>
  call(`/api/student-tests/${testId}/report`, json('POST', body))
export const listReportShares = (testId) => call(`/api/student-tests/${testId}/report/share`)
export const logReportShare = (testId, body) =>
  call(`/api/student-tests/${testId}/report/share`, json('POST', body))

/* --------------------------- Teacher allocations --------------------------- */
export const ALLOCATION_STATUSES = ['assigned', 'accepted', 'active', 'completed', 'rejected', 'cancelled']
export const ALLOCATION_TRANSITIONS = {
  assigned: ['accepted', 'rejected', 'cancelled'],
  accepted: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  rejected: [],
  completed: [],
  cancelled: [],
}

export const listAllocations = (params) => call(`/api/teacher-allocations${qs(params)}`)
export const getAllocation = (id) => call(`/api/teacher-allocations/${id}`)
export const createAllocation = (body) => call('/api/teacher-allocations', json('POST', body))
export const updateAllocationNotes = (id, allocationNotes) =>
  call(`/api/teacher-allocations/${id}`, json('PATCH', { allocationNotes }))
/** Update notes and/or commercial terms: { allocationNotes?, monthlyFee?, commissionPercent? } */
export const updateAllocation = (id, body) => call(`/api/teacher-allocations/${id}`, json('PATCH', body))
export const updateAllocationStatus = (id, status, reason) =>
  call(`/api/teacher-allocations/${id}/status`, json('PATCH', { status, ...(reason ? { reason } : {}) }))

export const DEFAULT_COMMISSION_PERCENT = 25

/**
 * Calculates allocation terms with smart teacher payout rounding.
 * Teacher payout is rounded according to roundingRule (default: nearest ₹100),
 * and the remaining amount automatically balances into Wellfind commission.
 */
export function calcAllocationTerms(
  monthlyFee,
  commissionPercent,
  roundingRule = 'round100',
  customPayout = null,
) {
  const fee = Number(monthlyFee)
  const pct = Number(commissionPercent)
  if (!Number.isFinite(fee) || !Number.isFinite(pct) || fee <= 0 || pct < 0 || pct > 100) return null

  const rawCommission = Math.round(((fee * pct) / 100) * 100) / 100
  const rawPayout = Math.round((fee - rawCommission) * 100) / 100

  let payout = rawPayout

  if (roundingRule === 'custom' && customPayout !== null && customPayout !== undefined && customPayout !== '') {
    const cp = Number(customPayout)
    if (Number.isFinite(cp) && cp >= 0 && cp <= fee) {
      payout = cp
    }
  } else if (roundingRule === 'round100') {
    payout = Math.round(rawPayout / 100) * 100
  } else if (roundingRule === 'round50') {
    payout = Math.round(rawPayout / 50) * 50
  } else if (roundingRule === 'floor100') {
    payout = Math.floor(rawPayout / 100) * 100
  } else if (roundingRule === 'floor50') {
    payout = Math.floor(rawPayout / 50) * 50
  } else if (roundingRule === 'none') {
    payout = rawPayout
  }

  // Ensure payout stays within [0, fee]
  payout = Math.max(0, Math.min(fee, payout))
  const commission = Math.round((fee - payout) * 100) / 100
  const effectivePct = fee > 0 ? Math.round((commission / fee) * 10000) / 100 : pct
  const diffFromRaw = Math.round((payout - rawPayout) * 100) / 100

  return {
    fee,
    pct,
    rawCommission,
    rawPayout,
    commission,
    payout,
    effectivePct,
    diffFromRaw,
    roundingRule,
  }
}

export const inr = (v) =>
  v === null || v === undefined || v === ''
    ? '—'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(v))

/** Creates the teacher's dashboard login: { email?, password? } -> { user, password, passwordGenerated, email: { sent, error } } */
export const createTeacherAccount = (enquiryId, body = {}) =>
  call(`/api/teacher-enquiries/${enquiryId}/create-account`, json('POST', body))

/** Random alphanumeric password (no look-alike characters) with upper, lower and digit. */
export function generatePassword(length = 12) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  const rnd = (n) => {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0] % n
  }
  const chars = [upper[rnd(upper.length)], lower[rnd(lower.length)], digits[rnd(digits.length)]]
  while (chars.length < length) chars.push(all[rnd(all.length)])
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rnd(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

/* ------------------- Teacher evaluations / approval / status ------------------- */
export const listTeacherEvaluations = (enquiryId, params) =>
  call(`/api/teacher-enquiries/${enquiryId}/evaluations${qs(params)}`)
export const createTeacherEvaluation = (enquiryId, body) =>
  call(`/api/teacher-enquiries/${enquiryId}/evaluations`, json('POST', body))
export const updateTeacherEvaluation = (enquiryId, evaluationId, body) =>
  call(`/api/teacher-enquiries/${enquiryId}/evaluations/${evaluationId}`, json('PATCH', body))
export const approveTeacherEnquiry = (enquiryId) =>
  call(`/api/teacher-enquiries/${enquiryId}/approve`, json('POST'))
export const getEvaluationWeights = () => apiRequest('/api/globals/teacher-evaluation-config')
export const updateEvaluationWeights = (body) =>
  apiRequest('/api/globals/teacher-evaluation-config', json('POST', body))

export const TEACHER_PROFILE_STATUSES = ['active', 'inactive', 'suspended']
export const setTeacherStatus = (id, status) => call(`/api/teachers/${id}/status`, json('PATCH', { status }))
export const setTeacherAvailability = (id, body) =>
  call(`/api/teachers/${id}/availability`, json('PATCH', body))

/* ---------------------------------- Mail ---------------------------------- */
export const getMailStats = () => call('/api/admin/mail/stats')
export const listMailLogs = (params) => call(`/api/admin/mail/logs${qs(params)}`)
export const retryMail = (id) => call(`/api/admin/mail/logs/${id}/retry`, json('POST'))
export const sendTestMail = (to) => call('/api/admin/mail/test', json('POST', { to }))
export const verifyMail = () => call('/api/admin/mail/verify', json('POST'))
export const runMailJob = (job, body = {}) => call('/api/admin/mail/jobs', json('POST', { job, ...body }))

/* -------------------------------- Payments -------------------------------- */
export const getPaymentStats = () => call('/api/admin/payments/stats')
export const listPayments = (params) => call(`/api/admin/payments${qs(params)}`)
export const getFinanceSummary = () => call('/api/admin/payments/finance')
export const listTeacherPayouts = (params) => call(`/api/admin/payments/payouts${qs(params)}`)
export const recordTeacherPayout = (body) => call('/api/admin/payments/payouts', json('POST', body))
export const undoTeacherPayout = (id) => call(`/api/admin/payments/payouts/${id}`, { method: 'DELETE' })

/* -------------------------------- Helpers -------------------------------- */
export const docsOf = (res) => (Array.isArray(res) ? res : res?.docs || [])

export const fmtDateTime = (v) => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const labelize = (s) =>
  String(s ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

/* Teacher profiles (approved teachers) — raw API, no sample-data fallback */
export const listTeacherProfiles = (params) => call(`/api/teachers${qs(params)}`)

/* ------------------------- Google Analytics (via API) ------------------------- */
export const getAnalyticsStatus = () => call('/api/admin/analytics/status')
