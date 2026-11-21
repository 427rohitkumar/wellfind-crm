/** Shared helpers for the Export (CSV) and Print buttons of the list pages. */

const cell = (v) => {
  const s = v === null || v === undefined ? '' : String(v)
  // Quote everything and neutralise spreadsheet formulas (=, +, -, @ at the start).
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return `"${safe.replace(/"/g, '""')}"`
}

/** columns: [{ header, value: (row) => string|number }] */
export function downloadCSV(filename, columns, rows) {
  const lines = [columns.map((c) => cell(c.header)).join(','), ...rows.map((r) => columns.map((c) => cell(c.value(r))).join(','))]
  // BOM so Excel opens Hindi / special characters correctly.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/** Opens a clean printable page with just the table (not the whole CRM) and starts printing. */
export function printRows(title, columns, rows) {
  const w = window.open('', '_blank', 'width=1100,height=800')
  if (!w) return false
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;margin:24px;color:#101828}
  h1{font-size:20px;margin:0 0 4px} p{margin:0 0 16px;color:#667085;font-size:12px}
  table{width:100%;border-collapse:collapse;font-size:11.5px}
  th,td{border:1px solid #d0d5dd;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#f2f4f7;font-size:10.5px;text-transform:uppercase;letter-spacing:.03em}
  tr{page-break-inside:avoid}
  @page{size:landscape;margin:12mm}
</style></head><body>
<h1>${esc(title)}</h1><p>Wellfind Academic · ${rows.length} record${rows.length === 1 ? '' : 's'} · ${new Date().toLocaleString('en-IN')}</p>
<table><thead><tr>${columns.map((c) => `<th>${esc(c.header)}</th>`).join('')}</tr></thead>
<tbody>${rows.map((r) => `<tr>${columns.map((c) => `<td>${esc(c.value(r))}</td>`).join('')}</tr>`).join('')}</tbody></table>
<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body></html>`
  w.document.open()
  w.document.write(html)
  w.document.close()
  return true
}

/** Reads every page of a paginated list. `fetchPage(page)` must return { docs, totalPages }. */
export async function fetchAllPages(fetchPage, maxPages = 50) {
  const out = []
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetchPage(page)
    out.push(...(res?.docs || []))
    if (!res || page >= (res.totalPages || 1)) break
  }
  return out
}

export const today = () => new Date().toISOString().slice(0, 10)

const names = (subjects) => (Array.isArray(subjects) ? subjects.map((s) => (typeof s === 'string' ? s : s?.subject)).filter(Boolean).join('; ') : '')
const when = (v) => (v ? new Date(v).toLocaleString('en-IN') : '')

export const STUDENT_ENQUIRY_COLUMNS = [
  { header: 'ID', value: (r) => r.id },
  { header: 'Student name', value: (r) => r.name },
  { header: 'Gender', value: (r) => r.studentGender },
  { header: 'Teacher preference', value: (r) => r.preferredTeacherGender },
  { header: 'Phone', value: (r) => r.phoneNumber },
  { header: 'Class', value: (r) => r.studentClass },
  { header: 'Subjects', value: (r) => names(r.subjects) },
  { header: 'Locality', value: (r) => r.customLocality || r.locality },
  { header: 'Preferred timing', value: (r) => r.preferredTiming },
  { header: 'Budget', value: (r) => r.budgetRange },
  { header: 'Status', value: (r) => r.enquiryStatus || 'new' },
  { header: 'Submitted', value: (r) => when(r.createdAt) },
]

export const TEACHER_ENQUIRY_COLUMNS = [
  { header: 'ID', value: (r) => r.id },
  { header: 'Full name', value: (r) => r.fullName },
  { header: 'Gender', value: (r) => r.gender },
  { header: 'Mobile', value: (r) => r.mobileNumber },
  { header: 'Email', value: (r) => r.email },
  { header: 'Qualification', value: (r) => r.highestQualification },
  { header: 'Experience', value: (r) => r.teachingExperience },
  { header: 'Primary subject', value: (r) => r.primarySubject },
  { header: 'Class level', value: (r) => r.classLevel },
  { header: 'Locality', value: (r) => r.teachingLocality },
  { header: 'Availability', value: (r) => r.preferredAvailability },
  { header: 'Status', value: (r) => r.applicationStatus || 'new' },
  { header: 'Submitted', value: (r) => when(r.createdAt) },
]

export const STUDENT_COLUMNS = [
  { header: 'ID', value: (s) => s.id },
  { header: 'Student name', value: (s) => s.name },
  { header: 'Gender', value: (s) => s.gender },
  { header: 'Teacher preference', value: (s) => s.preferredTeacherGender },
  { header: 'Parent name', value: (s) => s.parentName },
  { header: 'Phone', value: (s) => s.phone },
  { header: 'Class', value: (s) => s.studentClass },
  { header: 'Subjects', value: (s) => (Array.isArray(s.subjects) ? s.subjects.join('; ') : '') },
  { header: 'Locality', value: (s) => s.locality },
  { header: 'Preferred timing', value: (s) => s.preferredTiming },
  { header: 'Budget', value: (s) => s.budgetRange },
  { header: 'Status', value: (s) => s.status },
  { header: 'Submitted', value: (s) => when(s.submittedDate) },
]

export const TEACHER_COLUMNS = [
  { header: 'ID', value: (t) => t.id },
  { header: 'Name', value: (t) => t.name },
  { header: 'Gender', value: (t) => t.gender },
  { header: 'Email', value: (t) => t.email },
  { header: 'Mobile', value: (t) => t.mobile },
  { header: 'Primary subject', value: (t) => t.primarySubject },
  { header: 'Qualification', value: (t) => t.qualification },
  { header: 'Experience (years)', value: (t) => t.experienceYears },
  { header: 'Registration fee', value: (t) => t.registrationFee?.status },
  { header: 'KYC', value: (t) => t.kyc?.status },
  { header: 'Allocation', value: (t) => t.studentAllocation?.status },
  { header: 'Account', value: (t) => t.account?.status },
]
