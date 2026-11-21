/** Staff roles of the CRM (admin side) and what each one is for. Mirrors the API's lib/permissions.ts. */
export const STAFF_ROLES = ['operations_manager', 'student_counselor', 'teacher_coordinator', 'finance_manager', 'marketing_analyst', 'support_executive']
export const ADMIN_ROLES = ['super_admin', ...STAFF_ROLES]

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  operations_manager: 'Operations Manager',
  student_counselor: 'Student Counselor',
  teacher_coordinator: 'Teacher Coordinator',
  finance_manager: 'Finance Manager',
  marketing_analyst: 'Marketing Analyst',
  support_executive: 'Support Executive',
  teacher: 'Teacher',
}

export const ROLE_SUMMARY = {
  super_admin: 'Full access to everything, including user management, payments and analytics.',
  operations_manager: 'Runs day-to-day operations: enquiries, students, teachers, tests, allocation and mail. Can view analytics. No payments or user management.',
  student_counselor: 'Handles parents and students: enquiries, students, tests and teacher allocation. Can see teachers. No payments, analytics or teacher onboarding.',
  teacher_coordinator: 'Recruits and verifies teachers: applications, evaluation, KYC, approval and accounts. Can see allocations. No student data or payments.',
  finance_manager: 'Owns money: payments, teacher fees, payouts and commission reports. Can view students, teachers and allocations (read-only).',
  marketing_analyst: 'Tracks the website and leads: Google Analytics and student enquiries (read-only).',
  support_executive: 'Read-only view of enquiries, students, teachers, tests and allocations. Cannot change anything.',
}

export const MODULE_LABELS = {
  student_inquiries: 'Student inquiries',
  students: 'Students',
  teacher_inquiries: 'Teacher applications',
  teachers: 'Teachers',
  tests: 'Tests',
  allocation: 'Allocation',
  mail: 'Mail',
  payments: 'Payments & payouts',
  analytics: 'Google Analytics',
  users: 'User management',
}

/** Single source of truth for role -> home route. Add `student` here when that portal exists. */
export const ROLE_HOME = {
  teacher: '/teacher',
  ...Object.fromEntries(ADMIN_ROLES.map((r) => [r, '/admin'])),
}

export const homeForRole = (role) => ROLE_HOME[role] || null
export const roleLabel = (role) => ROLE_LABELS[role] || String(role || '').replace(/_/g, ' ')
