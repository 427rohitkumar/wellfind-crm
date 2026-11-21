import { apiRequest, fetchPrivateDocumentBlob } from './apiClient';

/**
 * Valid teacher application statuses supported by backend
 */
export const TEACHER_APPLICATION_STATUSES = [
  { value: 'new', label: 'New', variant: 'info' },
  { value: 'under_review', label: 'Under Review', variant: 'warning' },
  { value: 'shortlisted', label: 'Shortlisted', variant: 'primary' },
  { value: 'approved', label: 'Approved', variant: 'success' },
  { value: 'rejected', label: 'Rejected', variant: 'danger' },
];

/**
 * Statuses an admin can move TO from a given status (mirrors backend
 * VALID_TEACHER_STATUS_TRANSITIONS). Approval needs shortlisting and a completed
 * evaluation first; `evaluation_completed` is set by the evaluation panel.
 */
export const TEACHER_STATUS_TRANSITIONS = {
  new: ['under_review', 'rejected'],
  under_review: ['shortlisted', 'rejected'],
  shortlisted: ['approved', 'rejected'],
  evaluation_completed: ['approved', 'rejected'],
  rejected: ['under_review'],
  approved: [],
};

/** Statuses reachable from `current` (plus `current` itself), as option objects. */
export function getTeacherStatusOptions(current = 'new') {
  const reachable = new Set([current, ...(TEACHER_STATUS_TRANSITIONS[current] || [])]);
  return TEACHER_APPLICATION_STATUSES.filter((s) => reachable.has(s.value));
}

/**
 * Filter options for Teacher Inquiries queue.
 * Approved applications exit the inquiry queue to the main Teachers module.
 */
export const TEACHER_INQUIRY_STATUS_FILTER_OPTIONS = [
  { value: 'new', label: 'New', variant: 'info' },
  { value: 'under_review', label: 'Under Review', variant: 'warning' },
  { value: 'shortlisted', label: 'Shortlisted', variant: 'primary' },
  { value: 'rejected', label: 'Rejected', variant: 'danger' },
];

/**
 * Valid teacher operational availability statuses (independent from hiring/application status)
 */
export const TEACHER_AVAILABILITY_STATUSES = [
  { value: 'available', label: 'Available (Full-time / Active)' },
  { value: 'partially_available', label: 'Partially Available (Limited slots)' },
  { value: 'allocated', label: 'Allocated (Assigned to students)' },
  { value: 'inactive', label: 'Inactive / On Leave' },
];

/**
 * List teacher enquiries with pagination, sorting, status filter, and search.
 * By default, approved applications are excluded from Teacher Inquiries.
 */
export async function fetchTeacherEnquiries({
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

  const andConditions = [];

  // Active inquiry queue rule:
  // Approved applications leave Teacher Inquiries and belong in the Teachers module.
  // If a specific non-approved status is chosen, filter by it.
  // If 'All Statuses' is selected, exclude 'approved' applications.
  if (status) {
    andConditions.push({ applicationStatus: { equals: status } });
    params.set('applicationStatus', status);
  } else {
    andConditions.push({ applicationStatus: { not_equals: 'approved' } });
    params.set('excludeApproved', 'true');
  }

  // Construct search conditions
  if (search.trim()) {
    const trimmed = search.trim();
    const searchConditions = [
      { fullName: { contains: trimmed } },
      { mobileNumber: { contains: trimmed } },
      { email: { contains: trimmed } },
      { primarySubject: { contains: trimmed } },
      { teachingLocality: { contains: trimmed } },
      { highestQualification: { contains: trimmed } },
    ];
    andConditions.push({ or: searchConditions });
  }

  params.set('where', JSON.stringify({ and: andConditions }));

  return apiRequest(`/api/teacher-enquiries?${params.toString()}`);
}

/**
 * Get a single teacher enquiry by ID (Payload built-in REST endpoint).
 * Returns the full document including internal management fields (applicationStatus, adminNotes, reviewedBy, reviewedAt)
 * and document relations (aadhaarDocument, qualificationDocument).
 */
export async function getTeacherEnquiryById(id) {
  return apiRequest(`/api/teacher-enquiries/${id}`);
}

/**
 * Update internal management fields or details of a teacher enquiry.
 * Supported fields: applicationStatus, adminNotes, reviewedBy, reviewedAt.
 */
export async function updateTeacherEnquiry(id, data) {
  return apiRequest(`/api/teacher-enquiries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a teacher enquiry by ID.
 */
export async function deleteTeacherEnquiry(id) {
  return apiRequest(`/api/teacher-enquiries/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Mark a teacher application as read. Idempotent and persisted on backend.
 */
export async function markTeacherEnquiryAsRead(id) {
  return apiRequest(`/api/teacher-enquiries/${id}/read`, {
    method: 'POST',
  });
}

/**
 * Securely retrieve private teacher document (KYC / qualification) with Bearer JWT.
 * Returns a Blob and an object URL for preview/download.
 */
export async function downloadTeacherDocument(docReference) {
  let docUrl = '';
  let docName = 'document';

  if (typeof docReference === 'string') {
    docUrl = docReference.startsWith('/') ? docReference : `/api/teacher-documents/${docReference}`;
  } else if (docReference && typeof docReference === 'object') {
    docUrl = docReference.url || (docReference.id ? `/api/teacher-documents/${docReference.id}` : '');
    docName = docReference.filename || docReference.alt || 'teacher-document';
  }

  if (!docUrl) {
    throw new Error('Invalid document reference.');
  }

  const blob = await fetchPrivateDocumentBlob(docUrl);
  return {
    blob,
    filename: docName,
    objectUrl: URL.createObjectURL(blob),
  };
}

