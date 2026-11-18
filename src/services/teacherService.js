import { apiRequest, fetchPrivateDocumentBlob } from './apiClient'
import { initialTeachersData } from '../pages/teachers/teachersSampleData'

// In-memory session state for local fallback and offline editing
let sessionTeachers = [...initialTeachersData]

function normalizeTeacherDoc(doc) {
  if (!doc) return null
  const fee = doc.registrationFee || {}
  const kyc = doc.kyc || {}
  const alloc = doc.studentAllocation || {}
  const acct = doc.account || {}

  return {
    id: String(doc.id),
    name: doc.name || doc.fullName || 'Unnamed Teacher',
    email: doc.email || '',
    mobile: doc.mobile || doc.mobileNumber || '',
    avatar: doc.avatar || null,
    primarySubject: doc.primarySubject || 'General',
    qualification: doc.qualification || doc.highestQualification || '—',
    experienceYears: Number(doc.experienceYears) || 0,
    classLevels: doc.classLevels || doc.classLevel || 'All Levels',
    locality: doc.locality || doc.teachingLocality || 'Not specified',
    availability: doc.availability || doc.preferredAvailability || 'Flexible',
    applicantNotes: doc.applicantNotes || doc.additionalNotes || '',
    userId: typeof doc.user === 'object' && doc.user ? doc.user.id : doc.user || null,
    availabilityStatus: doc.availabilityStatus || 'free',
    status: doc.status || null,
    teacherEnquiry: doc.teacherEnquiry || null,
    teacherEnquiryId:
      typeof doc.teacherEnquiry === 'object'
        ? doc.teacherEnquiry?.id
        : doc.teacherEnquiry,
    approvalStatus: doc.approvalStatus || 'approved',
    registrationFee: {
      status: fee.status || 'pending',
      amount: fee.amount ?? 1000,
      currency: fee.currency || 'INR',
      year: fee.year || '2026–2027',
      paymentDate: fee.paymentDate || 'Pending',
      transactionRef: fee.transactionRef || 'None',
    },
    kyc: {
      status: kyc.status || 'verified',
      aadhaarStatus: kyc.aadhaarStatus || (kyc.aadhaarDocument ? 'Verified Document' : 'Not Uploaded'),
      qualificationStatus: kyc.qualificationStatus || (kyc.qualificationDocument ? 'Verified Document' : 'Not Uploaded'),
      reviewNotes: kyc.reviewNotes || '',
      reviewedAt: kyc.reviewedAt || 'Verified upon approval',
      aadhaarDocument: kyc.aadhaarDocument || null,
      qualificationDocument: kyc.qualificationDocument || null,
    },
    studentAllocation: {
      status: alloc.status || 'unallocated',
      allocatedCount: alloc.allocatedCount ?? 0,
      studentsSummary: alloc.studentsSummary || (alloc.status === 'allocated' ? 'Allocated' : 'Unallocated'),
      students: Array.isArray(alloc.students) ? alloc.students : [],
      assignedSubjects: Array.isArray(alloc.assignedSubjects)
        ? alloc.assignedSubjects
        : doc.primarySubject
          ? [doc.primarySubject]
          : [],
      allocationDate: alloc.allocationDate || 'None',
    },
    account: {
      status: acct.status || 'active',
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
    isRealApi: true,
  }
}

/**
 * Fetch approved teachers list from the backend API.
 * Ensures only teachers whose applications have been approved are returned.
 */
export async function fetchTeachers({
  search = '',
  sort = '-createdAt',
  page = 1,
  limit = 100,
} = {}) {
  try {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    params.set('sort', sort)

    const whereConditions = []

    // Approved profiles only
    whereConditions.push({ approvalStatus: { equals: 'approved' } })

    if (search.trim()) {
      const q = search.trim()
      whereConditions.push({
        or: [
          { name: { contains: q } },
          { email: { contains: q } },
          { mobile: { contains: q } },
          { primarySubject: { contains: q } },
          { qualification: { contains: q } },
          { locality: { contains: q } },
        ],
      })
    }

    if (whereConditions.length > 0) {
      params.set('where', JSON.stringify({ and: whereConditions }))
    }

    const response = await apiRequest(`/api/teachers?${params.toString()}`)
    if (response && Array.isArray(response.docs)) {
      const mapped = response.docs.map(normalizeTeacherDoc).filter(Boolean)
      return {
        docs: mapped,
        totalDocs: response.totalDocs ?? mapped.length,
        totalPages: response.totalPages ?? 1,
        page: response.page ?? 1,
        isRealApi: true,
      }
    }
  } catch (err) {
    console.warn('Could not load teachers from backend API, falling back to session data:', err)
  }

  return {
    docs: sessionTeachers,
    totalDocs: sessionTeachers.length,
    totalPages: 1,
    page: 1,
    isRealApi: false,
  }
}

/**
 * Get a single teacher record by ID.
 * Tries the real backend `/api/teachers/:id` first, then falls back to session.
 */
export async function getTeacherById(id) {
  if (!id) return null

  // Try real backend API first
  try {
    const doc = await apiRequest(`/api/teachers/${id}`)
    if (doc && (doc.id || doc.name)) {
      return normalizeTeacherDoc(doc)
    }
  } catch {
    // API offline or not found
  }

  // Check local session dataset
  const localMatch = sessionTeachers.find((t) => String(t.id) === String(id))
  if (localMatch) {
    return localMatch
  }

  return null
}

/**
 * Update an existing teacher record.
 */
export async function updateTeacher(id, updatedFields) {
  try {
    const updated = await apiRequest(`/api/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updatedFields),
    })
    if (updated) {
      return normalizeTeacherDoc(updated)
    }
  } catch {
    // Local fallback
  }

  // Update session
  sessionTeachers = sessionTeachers.map((t) => {
    if (String(t.id) === String(id)) {
      return { ...t, ...updatedFields }
    }
    return t
  })

  return sessionTeachers.find((t) => String(t.id) === String(id)) || updatedFields
}

/**
 * Delete a teacher record.
 */
export async function deleteTeacher(id) {
  try {
    await apiRequest(`/api/teachers/${id}`, {
      method: 'DELETE',
    })
  } catch {
    // Local fallback
  }

  sessionTeachers = sessionTeachers.filter((t) => String(t.id) !== String(id))
  return true
}

/**
 * Securely download KYC document
 */
export async function downloadTeacherDocument(documentRef) {
  return fetchPrivateDocumentBlob(documentRef)
}
