import { apiRequest } from './apiClient';

/**
 * Fetch audit log history for an enquiry.
 * Backend Payload CMS REST collection: /api/enquiry-audit-log
 *
 * @param {Object} options
 * @param {'student'|'teacher'} options.enquiryType
 * @param {string|number} options.enquiryId
 */
export async function fetchEnquiryAuditLog({ enquiryType, enquiryId }) {
  if (!enquiryId) return { docs: [] };

  const params = new URLSearchParams();
  params.set('sort', '-changedAt');
  params.set('limit', '50');

  const whereObj = {
    and: [
      { enquiryType: { equals: enquiryType } },
      enquiryType === 'student'
        ? { studentEnquiry: { equals: enquiryId } }
        : { teacherEnquiry: { equals: enquiryId } },
    ],
  };

  params.set('where', JSON.stringify(whereObj));

  return apiRequest(`/api/enquiry-audit-log?${params.toString()}`);
}

