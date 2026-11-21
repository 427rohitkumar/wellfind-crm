import { apiRequest } from './apiClient';

/**
 * Valid student enquiry statuses supported by backend
 */
export const STUDENT_ENQUIRY_STATUSES = [
  { value: 'new', label: 'New', variant: 'info' },
  { value: 'contacted', label: 'Contacted', variant: 'warning' },
  { value: 'in_progress', label: 'In Progress (Verified)', variant: 'primary' },
  { value: 'test', label: 'Test', variant: 'warning' },
  { value: 'converted', label: 'Ready for Allocation', variant: 'primary' },
  { value: 'allocated', label: 'Allocated', variant: 'success' },
  { value: 'closed', label: 'Closed', variant: 'neutral' },
];

export const STUDENT_TEST_MODES = [
  { value: 'physical', label: 'Physical (in person)' },
  { value: 'virtual', label: 'Virtual (online)' },
];

/**
 * Statuses an admin can move TO from a given status (mirrors backend
 * VALID_STUDENT_STATUS_TRANSITIONS). `converted` is performed through the
 * convert endpoint because it creates the Student record.
 */
export const STUDENT_ENQUIRY_TRANSITIONS = {
  new: ['contacted', 'closed'],
  contacted: ['in_progress', 'closed'],
  in_progress: ['test', 'converted', 'closed'],
  test: ['in_progress', 'converted', 'closed'],
  converted: ['closed'],
  allocated: [],
  closed: ['contacted', 'in_progress'],
};

export const getStudentStatusLabel = (value) =>
  STUDENT_ENQUIRY_STATUSES.find((s) => s.value === value)?.label || value || 'New';

/** Statuses reachable from `current` (plus `current` itself), as option objects. */
export function getStudentStatusOptions(current = 'new') {
  const reachable = new Set([current, ...(STUDENT_ENQUIRY_TRANSITIONS[current] || [])]);
  return STUDENT_ENQUIRY_STATUSES.filter((s) => reachable.has(s.value));
}

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

  // Enquiries that finished the inquiry stage (sent to allocation / allocated) now live in the
  // Students tab. They only show here when that status is picked explicitly in the filter.
  const hideMoved = !status ? [{ enquiryStatus: { not_in: ['converted', 'allocated'] } }] : [];

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
        and: [...hideMoved, { or: searchConditions }],
      };
    }
    params.set('where', JSON.stringify(whereObj));
  } else if (hideMoved.length > 0) {
    params.set('where', JSON.stringify({ and: hideMoved }));
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
    studentGender: data.studentGender || undefined,
    preferredTeacherGender: data.preferredTeacherGender || 'any',
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

