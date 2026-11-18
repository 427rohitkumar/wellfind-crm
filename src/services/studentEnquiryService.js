import { apiRequest } from './apiClient';

/**
 * Valid student enquiry statuses supported by backend
 */
export const STUDENT_ENQUIRY_STATUSES = [
  { value: 'new', label: 'New', variant: 'info' },
  { value: 'contacted', label: 'Contacted', variant: 'warning' },
  { value: 'in_progress', label: 'In Progress', variant: 'primary' },
  { value: 'allocated', label: 'Allocated', variant: 'success' },
  { value: 'closed', label: 'Closed', variant: 'neutral' },
];

/**
 * List student enquiries with pagination, sorting, status filter, and search.
 */
export async function fetchStudentEnquiries({
  page = 1,
  limit = 10,
  sort = '-createdAt',
  status = '',
  search = '',
} = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  params.set('sort', sort);

  if (status) {
    params.set('enquiryStatus', status);
  }

  // Construct Payload `where` query for backend search
  if (search.trim()) {
    const trimmed = search.trim();
    const searchConditions = [
      { name: { contains: trimmed } },
      { phoneNumber: { contains: trimmed } },
      { locality: { contains: trimmed } },
      { studentClass: { contains: trimmed } },
    ];

    let whereObj;
    if (status) {
      whereObj = {
        and: [
          { enquiryStatus: { equals: status } },
          { or: searchConditions },
        ],
      };
    } else {
      whereObj = {
        or: searchConditions,
      };
    }
    params.set('where', JSON.stringify(whereObj));
  }

  return apiRequest(`/api/student-enquiries?${params.toString()}`);
}

/**
 * Get a single student enquiry by ID (Payload built-in REST endpoint).
 * Returns the full document including internal management fields (enquiryStatus, adminNotes, assignedTo).
 */
export async function getStudentEnquiryById(id) {
  return apiRequest(`/api/student-enquiries/${id}`);
}

/**
 * Update internal management fields or details of a student enquiry.
 * Supported fields: enquiryStatus, adminNotes, assignedTo.
 */
export async function updateStudentEnquiry(id, data) {
  return apiRequest(`/api/student-enquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Create a new student enquiry (used by admin to submit phone/in-person enquiries).
 * Submits to POST /api/student-enquiries.
 */
export async function createStudentEnquiry(data) {
  const payload = {
    name: (data.parentName || data.name || '').trim(),
    parentName: (data.parentName || data.name || '').trim(),
    phoneNumber: (data.phoneNumber || '').trim(),
    studentClass: (data.studentClass || '').trim(),
    subjects: Array.isArray(data.subjects) ? data.subjects : [data.subjects],
    preferredTiming: (data.preferredTiming || '').trim(),
    locality: (data.locality || '').trim(),
    budgetRange: (data.budgetRange || '').trim(),
    agreedToPolicy: Boolean(data.agreedToPolicy ?? true),
  };

  if (data.customSubject && data.customSubject.trim()) {
    payload.customSubject = data.customSubject.trim();
  }
  if (data.customLocality && data.customLocality.trim()) {
    payload.customLocality = data.customLocality.trim();
  }
  if (data.additionalNotes && data.additionalNotes.trim()) {
    payload.additionalNotes = data.additionalNotes.trim();
  }

  return apiRequest('/api/student-enquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a student enquiry by ID.
 */
export async function deleteStudentEnquiry(id) {
  return apiRequest(`/api/student-enquiries/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Mark a student enquiry as read. Idempotent and persisted on backend.
 */
export async function markStudentEnquiryAsRead(id) {
  return apiRequest(`/api/student-enquiries/${id}/read`, {
    method: 'POST',
  });
}

/**
 * Fetch persistent unread counts for both student and teacher enquiries.
 */
export async function fetchUnreadCounts() {
  return apiRequest('/api/inquiries/unread-counts');
}

