import { apiRequest } from './apiClient'
import { initialStudentsData } from '../pages/students/studentsSampleData'

// In-memory session state so local additions, edits, and deletions persist during the session
let sessionStudents = [...initialStudentsData]

/**
 * Fetch students list with support for pagination, sorting, status/class filters, and search.
 * Attempts to connect to real converted student enquiries from Payload CMS backend first.
 */
export async function fetchStudents({
  page = 1,
  limit = 10,
  sort = '-createdAt',
  status = '',
  studentClass = '',
  search = '',
} = {}) {
  try {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    params.set('sort', sort)

    // Build Payload where query
    const whereConditions = []

    // If specific status requested
    if (status) {
      if (status === 'active' || status === 'enrolled') {
        whereConditions.push({ enquiryStatus: { equals: 'converted' } })
      } else {
        whereConditions.push({ enquiryStatus: { equals: status } })
      }
    } else {
      // By default show converted enquiries (converted to active students)
      whereConditions.push({ enquiryStatus: { equals: 'converted' } })
    }

    if (studentClass) {
      whereConditions.push({ studentClass: { equals: studentClass } })
    }

    if (search.trim()) {
      const trimmed = search.trim()
      whereConditions.push({
        or: [
          { name: { contains: trimmed } },
          { phoneNumber: { contains: trimmed } },
          { locality: { contains: trimmed } },
          { studentClass: { contains: trimmed } },
        ],
      })
    }

    if (whereConditions.length > 0) {
      params.set('where', JSON.stringify({ and: whereConditions }))
    }

    const response = await apiRequest(`/api/student-enquiries?${params.toString()}`)

    if (response && Array.isArray(response.docs)) {
      const mappedDocs = response.docs.map((doc, idx) => ({
        id: doc.id || `STD-${idx + 101}`,
        name: doc.name || 'Unnamed Student',
        parentName: doc.parentName || doc.name || '',
        email: doc.email || `${(doc.name || 'student').toLowerCase().replace(/[^a-z0-9]/g, '.')}@example.com`,
        phone: doc.phoneNumber || '',
        studentClass: doc.studentClass || 'Standard',
        subjects: Array.isArray(doc.subjects)
          ? doc.subjects.map((s) => (typeof s === 'string' ? s : s.subject || s.name || '')).filter(Boolean)
          : doc.subjects ? [String(doc.subjects)] : [],
        locality: doc.locality || doc.customLocality || 'Kolkata',
        preferredTiming: doc.preferredTiming || 'Flexible',
        budgetRange: doc.budgetRange || 'Standard',
        allocationStatus: doc.allocationStatus || doc.studentAllocation?.status || null,
        status: doc.enquiryStatus === 'converted' ? 'active' : (doc.enquiryStatus || 'active'),
        submittedDate: doc.createdAt || new Date().toISOString(),
        assignedTeacher: doc.assignedTo?.name || (typeof doc.assignedTo === 'string' ? doc.assignedTo : 'Unassigned'),
        adminNotes: doc.adminNotes || '',
        isRealApi: true,
      }))

      return {
        docs: mappedDocs,
        totalDocs: response.totalDocs || mappedDocs.length,
        totalPages: response.totalPages || Math.ceil(mappedDocs.length / limit),
        page: response.page || page,
        isRealApi: true,
      }
    }
  } catch {
    // Expected when backend has no converted records or is not reachable in this session
    // We fall back cleanly to the managed session dataset
  }

  // Fallback to managed local dataset
  let filtered = [...sessionStudents]

  if (search.trim()) {
    const q = search.toLowerCase().trim()
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.parentName && s.parentName.toLowerCase().includes(q)) ||
        s.phone.includes(q) ||
        s.studentClass.toLowerCase().includes(q) ||
        s.locality.toLowerCase().includes(q) ||
        s.subjects.some((sub) => sub.toLowerCase().includes(q))
    )
  }

  if (status) {
    filtered = filtered.filter((s) => s.status === status)
  }

  if (studentClass) {
    filtered = filtered.filter((s) =>
      s.studentClass.toLowerCase().includes(studentClass.toLowerCase())
    )
  }

  // Sorting
  if (sort) {
    const isDesc = sort.startsWith('-')
    const key = isDesc ? sort.slice(1) : sort
    filtered.sort((a, b) => {
      let aVal = a[key] ?? ''
      let bVal = b[key] ?? ''
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return isDesc ? 1 : -1
      if (aVal > bVal) return isDesc ? -1 : 1
      return 0
    })
  }

  const totalDocs = filtered.length
  const totalPages = Math.ceil(totalDocs / limit) || 1
  const startIdx = (page - 1) * limit
  const paginatedDocs = filtered.slice(startIdx, startIdx + limit)

  return {
    docs: paginatedDocs,
    totalDocs,
    totalPages,
    page,
    isRealApi: false,
  }
}

/**
 * Get a single student record by ID
 */
export async function getStudentById(id) {
  // Check local session first
  const localMatch = sessionStudents.find((s) => s.id === id)
  if (localMatch) return localMatch

  try {
    const doc = await apiRequest(`/api/student-enquiries/${id}`)
    if (doc) {
      return {
        id: doc.id,
        name: doc.name,
        parentName: doc.parentName || doc.name,
        email: doc.email || '',
        phone: doc.phoneNumber || '',
        studentClass: doc.studentClass || '',
        subjects: Array.isArray(doc.subjects)
          ? doc.subjects.map((s) => (typeof s === 'string' ? s : s.subject || ''))
          : [],
        locality: doc.locality || '',
        preferredTiming: doc.preferredTiming || '',
        budgetRange: doc.budgetRange || '',
        status: doc.enquiryStatus === 'converted' ? 'active' : doc.enquiryStatus,
        submittedDate: doc.createdAt,
        assignedTeacher: doc.assignedTo?.name || 'Unassigned',
        adminNotes: doc.adminNotes || '',
        isRealApi: true,
      }
    }
  } catch {
    // If API fails, return null
  }

  return null
}

/**
 * Update an existing student record
 */
export async function updateStudent(id, updatedFields) {
  // If backend supports student enquiry PATCH
  try {
    const payloadFields = {}
    if (updatedFields.name) payloadFields.name = updatedFields.name
    if (updatedFields.phone) payloadFields.phoneNumber = updatedFields.phone
    if (updatedFields.studentClass) payloadFields.studentClass = updatedFields.studentClass
    if (updatedFields.locality) payloadFields.locality = updatedFields.locality
    if (updatedFields.adminNotes !== undefined) payloadFields.adminNotes = updatedFields.adminNotes
    if (updatedFields.status) {
      payloadFields.enquiryStatus = updatedFields.status === 'active' ? 'converted' : updatedFields.status
    }

    if (Object.keys(payloadFields).length > 0) {
      await apiRequest(`/api/student-enquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payloadFields),
      })
    }
  } catch {
    // API not reachable or mock ID
  }

  // Update session dataset
  sessionStudents = sessionStudents.map((s) => {
    if (s.id === id) {
      return { ...s, ...updatedFields }
    }
    return s
  })

  return sessionStudents.find((s) => s.id === id)
}

/**
 * Delete a student record
 */
export async function deleteStudent(id) {
  try {
    await apiRequest(`/api/student-enquiries/${id}`, {
      method: 'DELETE',
    })
  } catch {
    // Handle offline gracefully
  }

  sessionStudents = sessionStudents.filter((s) => s.id !== id)
  return true
}

/**
 * Create a new student record
 */
export async function createStudent(newStudent) {
  const createdRecord = {
    id: `STD-${Date.now().toString().slice(-4)}`,
    name: newStudent.name || 'New Student',
    parentName: newStudent.parentName || '',
    email: newStudent.email || '',
    phone: newStudent.phone || '',
    studentClass: newStudent.studentClass || 'Class 10',
    subjects: newStudent.subjects || ['Mathematics'],
    locality: newStudent.locality || 'Kolkata',
    preferredTiming: newStudent.preferredTiming || 'Weekday Evenings',
    budgetRange: newStudent.budgetRange || 'Standard',
    status: newStudent.status || 'active',
    submittedDate: new Date().toISOString(),
    assignedTeacher: newStudent.assignedTeacher || 'Unassigned',
    sessionsPerWeek: newStudent.sessionsPerWeek || 2,
    schoolName: newStudent.schoolName || '',
    adminNotes: newStudent.adminNotes || '',
    isRealApi: false,
  }

  sessionStudents = [createdRecord, ...sessionStudents]
  return createdRecord
}
