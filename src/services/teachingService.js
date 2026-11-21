import { apiRequest } from './apiClient'

const unwrap = (res) => (res && typeof res === 'object' && 'success' in res && 'data' in res ? res.data : res)
const json = (method, body) => ({ method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) })
const base = (id) => `/api/teacher-allocations/${id}`

/** "My Students": one allocation = one student the signed-in teacher teaches. */
export const getStudentDetail = async (id) => unwrap(await apiRequest(`${base(id)}/detail`))
export const saveTimetable = async (id, slots) => unwrap(await apiRequest(`${base(id)}/timetable`, json('PUT', { slots })))

export const listSessions = async (id, month) => unwrap(await apiRequest(`${base(id)}/sessions${month ? `?month=${month}` : ''}`))
export const createSession = async (id, body) => unwrap(await apiRequest(`${base(id)}/sessions`, json('POST', body)))
export const updateSession = async (id, sid, body) => unwrap(await apiRequest(`${base(id)}/sessions/${sid}`, json('PATCH', body)))
export const deleteSession = async (id, sid) => unwrap(await apiRequest(`${base(id)}/sessions/${sid}`, { method: 'DELETE' }))

export const listWork = async (id) => unwrap(await apiRequest(`${base(id)}/work`))
export const createWork = async (id, body) => unwrap(await apiRequest(`${base(id)}/work`, json('POST', body)))
export const updateWork = async (id, wid, body) => unwrap(await apiRequest(`${base(id)}/work/${wid}`, json('PATCH', body)))
export const deleteWork = async (id, wid) => unwrap(await apiRequest(`${base(id)}/work/${wid}`, { method: 'DELETE' }))

export const DAYS = [
  ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'], ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday'],
]
export const DAY_LABEL = Object.fromEntries(DAYS)
export const SESSION_STATUS = { scheduled: 'Scheduled', taught: 'Taught', missed: 'Missed', cancelled: 'Cancelled' }
export const WORK_STATUS = { assigned: 'Assigned', submitted: 'Submitted', graded: 'Graded', missed: 'Missed' }

export const fmtTime = (t) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}
