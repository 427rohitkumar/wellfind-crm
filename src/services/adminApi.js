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
export const USER_ROLES = ['super_admin', 'teacher']
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
export const updateAllocationStatus = (id, status, reason) =>
  call(`/api/teacher-allocations/${id}/status`, json('PATCH', { status, ...(reason ? { reason } : {}) }))

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
