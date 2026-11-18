export const commissionAssignments = [
  {
    id: 'ASSIGN-1001',
    studentId: 'STU-1001',
    studentName: 'Aarav Sharma',
    teacherId: 'TCH-2001',
    teacherName: 'Priya Nair',
    monthlyFee: 4000,
    commissionPercent: 25,
    effectiveDate: '2026-10-01',
    acceptanceStatus: 'Accepted',
  },
  {
    id: 'ASSIGN-1002',
    studentId: 'STU-1002',
    studentName: 'Ananya Mehta',
    teacherId: 'TCH-2002',
    teacherName: 'Rohan Kapoor',
    monthlyFee: 5000,
    commissionPercent: 20,
    effectiveDate: '2026-10-01',
    acceptanceStatus: 'Awaiting Teacher Acceptance',
  },
  {
    id: 'ASSIGN-1003',
    studentId: 'STU-1003',
    studentName: 'Kabir Singh',
    teacherId: 'TCH-2003',
    teacherName: 'Meera Iyer',
    monthlyFee: 6000,
    commissionPercent: 30,
    effectiveDate: '2026-09-01',
    acceptanceStatus: 'Accepted',
  },
]

export const calculateCommission = (assignment) => {
  const commissionAmount = assignment.monthlyFee * assignment.commissionPercent / 100
  return {
    ...assignment,
    teacherPayoutPercent: 100 - assignment.commissionPercent,
    commissionAmount,
    teacherPayoutAmount: assignment.monthlyFee - commissionAmount,
  }
}

export const commissionDemoAssignments = commissionAssignments.map(calculateCommission)
