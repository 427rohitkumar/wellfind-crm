import { Alert } from '@/components/ui/Alert'
import { usePermissions } from '@/hooks/usePermissions'
import { TableLoader } from '@/components/ui/Loaders'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Card, CardHeader, CardBody, CardFooter,
  Button,
  Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell, TableSelectAll, TableSelectRow, TablePagination,
  InputGroup, InputGroupText,
  useTableSelection,
  DismissibleAlert,
} from '@/components/ui'
import {
  Search, Plus, Download, Mail, Phone,
  Eye, Edit, Trash2, X, CheckCircle,
  GraduationCap, MapPin, Clock,
  RefreshCw
} from 'lucide-react'
import {
  initialStudentsData,
  STUDENT_STATUS_CONFIG,
  CLASS_OPTIONS,
  LOCALITY_OPTIONS
} from './studentsSampleData'
import { StudentStatusBadge } from './StudentStatusBadge'
import { StudentDetailModal } from './StudentDetailModal'
import { StudentEditModal } from './StudentEditModal'
import { StudentDeleteModal } from './StudentDeleteModal'
import { StudentAddModal } from './StudentAddModal'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { Printer } from 'lucide-react'
import { STUDENT_COLUMNS, downloadCSV, fetchAllPages, printRows, today } from '@/utils/exportData'
import { peek, revalidate } from '@/lib/queryClient'

const GENDER_LABEL = { male: 'Male', female: 'Female', other: 'Other' }
const TEACHER_PREF_LABEL = { male: 'Male teacher', female: 'Female teacher', any: 'Any' }
import {
  fetchStudents,
  updateStudent,
  deleteStudent,
  createStudent
} from '@/services/studentService'

export default function Students() {
  const navigate = useNavigate()
  const [studentsList, setStudentsList] = useState(initialStudentsData)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [localityFilter, setLocalityFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: 'submittedDate', direction: 'desc' })
  const pageSize = 8

  // Modals state
  const [detailModal, setDetailModal] = useState({ open: false, student: null })
  const [editModal, setEditModal] = useState({ open: false, student: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, student: null })
  const { can } = usePermissions()
  const canWrite = (m) => can(m, 'write')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [feedbackToast, setFeedbackToast] = useState(null)
  const [activeBanner, setActiveBanner] = useState(null)

  // Fetch / load students asynchronously
  const handleManualSync = useCallback(() => {
    setLoading(true)
    fetchStudents({
      page: 1,
      limit: 100,
      sort: sortConfig.direction === 'desc' ? `-${sortConfig.key}` : sortConfig.key,
    })
      .then((res) => {
        if (res?.docs) {
          setStudentsList(res.docs)
          setActiveBanner({
            type: 'success',
            title: 'Sync Complete:',
            message: `Successfully synchronized ${res.docs.length} student records${res.isRealApi ? ' from live API' : ''}.`,
          })
        }
      })
      .catch((err) => {
        setActiveBanner({
          type: 'error',
          title: 'Sync Failed:',
          message: err?.message || 'Failed to synchronize student records. Please check connection.',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [sortConfig])

  useEffect(() => {
    let isMounted = true
    const params = {
      page: 1,
      limit: 100,
      sort: sortConfig.direction === 'desc' ? `-${sortConfig.key}` : sortConfig.key,
    }
    const cacheKey = ['students', params]
    const cached = peek(cacheKey)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cached?.docs) setStudentsList(cached.docs) // instant paint, refreshed below
    revalidate(cacheKey, () => fetchStudents(params))
      .then((res) => {
        if (isMounted && res?.docs) {
          setStudentsList(res.docs)
        }
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [sortConfig])

  // Filter change handlers that immediately set page to 1
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
    setCurrentPage(1)
  }

  const handleClassFilterChange = (e) => {
    setClassFilter(e.target.value)
    setCurrentPage(1)
  }

  const handleLocalityFilterChange = (e) => {
    setLocalityFilter(e.target.value)
    setCurrentPage(1)
  }

  // Filtering
  const filteredStudents = useMemo(() => {
    return studentsList.filter((student) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesName = student.name?.toLowerCase().includes(q)
        const matchesParent = student.parentName?.toLowerCase().includes(q)
        const matchesPhone = student.phone?.includes(q)
        const matchesClass = student.studentClass?.toLowerCase().includes(q)
        const matchesLocality = student.locality?.toLowerCase().includes(q)
        const matchesSubject = student.subjects?.some((s) => s.toLowerCase().includes(q))
        const matchesTeacher = student.assignedTeacher?.toLowerCase().includes(q)

        if (!matchesName && !matchesParent && !matchesPhone && !matchesClass && !matchesLocality && !matchesSubject && !matchesTeacher) {
          return false
        }
      }

      // Status filter
      if (statusFilter && student.status !== statusFilter) {
        return false
      }

      // Class filter
      if (classFilter && !student.studentClass?.toLowerCase().includes(classFilter.toLowerCase())) {
        return false
      }

      // Locality filter
      if (localityFilter && !student.locality?.toLowerCase().includes(localityFilter.toLowerCase())) {
        return false
      }

      return true
    })
  }, [studentsList, searchQuery, statusFilter, classFilter, localityFilter])

  // Sorting
  const sortedStudents = useMemo(() => {
    if (!sortConfig.key) return filteredStudents

    return [...filteredStudents].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      if (sortConfig.key === 'subjects') {
        aVal = Array.isArray(a.subjects) ? a.subjects.join(', ') : ''
        bVal = Array.isArray(b.subjects) ? b.subjects.join(', ') : ''
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredStudents, sortConfig])

  // Pagination
  const totalPages = Math.ceil(sortedStudents.length / pageSize) || 1
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedStudents.slice(startIndex, startIndex + pageSize)
  }, [sortedStudents, currentPage, pageSize])

  // Table selection hook
  const {
    selectedRows,
    selectAll,
    isIndeterminate,
    toggleRow,
    toggleAll,
    isSelected,
    selectedCount,
    clearSelection,
  } = useTableSelection(paginatedStudents)

  // Sort handler
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Toast feedback helper
  const showToast = (message, type = 'success') => {
    setFeedbackToast({ message, type })
    setTimeout(() => setFeedbackToast(null), 4000)
  }

  // Edit save handler
  const handleSaveStudent = async (id, updatedFields) => {
    try {
      await updateStudent(id, updatedFields)
      setStudentsList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updatedFields } : s))
      )
      setActiveBanner({
        type: 'success',
        title: 'Student Updated:',
        message: `Student record for ${updatedFields.name || 'Student'} updated successfully.`,
      })
      showToast(`Student record for ${updatedFields.name || 'Student'} updated successfully.`)
    } catch {
      setActiveBanner({
        type: 'error',
        title: 'Update Failed:',
        message: 'Failed to update student record. Please try again.',
      })
      showToast('Failed to update student record.', 'danger')
    }
  }

  // Delete handler
  const handleDeleteStudent = async (id) => {
    try {
      await deleteStudent(id)
      setStudentsList((prev) => prev.filter((s) => s.id !== id))
      setActiveBanner({
        type: 'warning',
        title: 'Student Removed:',
        message: 'Student record removed successfully.',
      })
      showToast('Student record removed successfully.')
    } catch {
      setActiveBanner({
        type: 'error',
        title: 'Delete Failed:',
        message: 'Failed to delete student record.',
      })
      showToast('Failed to delete student record.', 'danger')
    }
  }

  // Add student handler
  const handleAddStudent = async (newStudentData) => {
    try {
      const created = await createStudent(newStudentData)
      setStudentsList((prev) => [created, ...prev])
      setActiveBanner({
        type: 'success',
        title: 'Student Enrolled:',
        message: `Student ${created.name} enrolled successfully!`,
      })
      showToast(`Student ${created.name} enrolled successfully!`)
    } catch {
      setActiveBanner({
        type: 'error',
        title: 'Enrollment Failed:',
        message: 'Failed to add student. Please check the entered information.',
      })
      showToast('Failed to add student.', 'danger')
    }
  }

  // Bulk status update
  const handleBulkStatusChange = (newStatus) => {
    const statusLabel = STUDENT_STATUS_CONFIG[newStatus]?.label || newStatus
    setStudentsList((prev) =>
      prev.map((s) => (selectedRows.has(s.id) ? { ...s, status: newStatus } : s))
    )
    setActiveBanner({
      type: 'success',
      title: 'Bulk Update Completed:',
      message: `Updated status to "${statusLabel}" for ${selectedCount} student(s).`,
    })
    showToast(`Updated status to "${statusLabel}" for ${selectedCount} students.`)
    clearSelection()
  }

  // Table export / print: what is on screen (search, filters and sorting applied)
  const handleExportCSV = () => {
    if (sortedStudents.length === 0) {
      setActiveBanner({ type: 'warning', title: 'Export Skipped:', message: 'No student records available to export.' })
      return
    }
    downloadCSV(`wellfind-students-${today()}.csv`, STUDENT_COLUMNS, sortedStudents)
    setActiveBanner({ type: 'success', title: 'Export Complete:', message: `Exported ${sortedStudents.length} student records to CSV file.` })
  }

  const handlePrint = () => {
    if (sortedStudents.length === 0) {
      setActiveBanner({ type: 'warning', title: 'Print Skipped:', message: 'No student records to print.' })
      return
    }
    if (!printRows('Students', STUDENT_COLUMNS, sortedStudents)) {
      setActiveBanner({ type: 'warning', title: 'Print blocked:', message: 'Allow pop-ups for this site to print.' })
    }
  }

  // Top button: every student, ignoring search and filters
  const [exportingAll, setExportingAll] = useState(false)
  const handleExportAll = async () => {
    setExportingAll(true)
    try {
      const all = await fetchAllPages((page) => fetchStudents({ page, limit: 100 }))
      downloadCSV(`wellfind-all-students-${today()}.csv`, STUDENT_COLUMNS, all)
      setActiveBanner({ type: 'success', title: 'Export Complete:', message: `Exported all ${all.length} students.` })
    } catch (err) {
      setActiveBanner({ type: 'warning', title: 'Export failed:', message: err.message || 'Could not export all students.' })
    } finally {
      setExportingAll(false)
    }
  }

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setClassFilter('')
    setLocalityFilter('')
    setCurrentPage(1)
  }

  const hasActiveFilters = searchQuery || statusFilter || classFilter || localityFilter

  // Initials generator
  const getInitials = (name) => {
    if (!name) return 'S'
    return name
      .replace(/^(Master|Miss|Mr\.|Mrs\.|Ms\.)\s+/i, '')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <div className="page__section space-y-6">
      {/* Toast Feedback Notification */}
      {feedbackToast && (
        <div className="wf-toast"><Alert variant={feedbackToast.type === 'danger' ? 'error' : 'success'} title={feedbackToast.message} onClose={() => setFeedbackToast(null)} /></div>
      )}

      {/* Page Header matching Meridian layout */}
      <header className="page__header mb-6">
        <div className="page__headline">
          <h1 className="page__title">Students</h1>
          <p className="page__description">
            Manage active student profiles, class requirements, preferred timings, and tutor allocations.
          </p>
        </div>
        <div className="page__action flex items-center gap-2">
          <Button variant="neutral" onClick={handleManualSync} disabled={loading} title="Refresh student records">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Sync
          </Button>
          <Button variant="neutral" onClick={handleExportAll} disabled={exportingAll} title="Download every student as CSV, ignoring filters">
            <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
            {exportingAll ? 'Exporting…' : 'Export all'}
          </Button>
          {canWrite('students') && (
          <Button variant="primary" onClick={() => setAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Add student
          </Button>
          )}
        </div>
      </header>

      {/* Dynamic Status Alert */}
      {activeBanner && (
        <DismissibleAlert
          type={activeBanner.type}
          title={activeBanner.title}
          message={activeBanner.message}
          onDismiss={() => setActiveBanner(null)}
          dismissLabel="Dismiss notification"
        />
      )}

      <div className="page__body">
        {/* Search & Filters Toolbar */}
        <Card variant="bordered" className="mb-6">
          <CardBody className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search input */}
              <InputGroup variant="search" className="w-full sm:w-64 lg:w-72">
                <InputGroupText aria-hidden="true">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </InputGroupText>
                <input
                  type="search"
                  placeholder="Search name, phone, subject…"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="input"
                  aria-label="Search students"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="input-group__text hover:text-foreground cursor-pointer"
                    onClick={() => {
                      setSearchQuery('')
                      setCurrentPage(1)
                    }}
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </InputGroup>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="select text-xs"
                style={{ width: 'auto', minWidth: '140px' }}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                {Object.entries(STUDENT_STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    Status: {cfg.label}
                  </option>
                ))}
              </select>

              {/* Class Filter */}
              <select
                value={classFilter}
                onChange={handleClassFilterChange}
                className="select text-xs"
                style={{ width: 'auto', minWidth: '140px' }}
                aria-label="Filter by class"
              >
                <option value="">All Classes</option>
                {CLASS_OPTIONS.map((cls) => (
                  <option key={cls} value={cls}>
                    Class: {cls}
                  </option>
                ))}
              </select>

              {/* Locality Filter */}
              <select
                value={localityFilter}
                onChange={handleLocalityFilterChange}
                className="select text-xs"
                style={{ width: 'auto', minWidth: '140px' }}
                aria-label="Filter by locality"
              >
                <option value="">All Localities</option>
                {LOCALITY_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    Locality: {loc}
                  </option>
                ))}
              </select>

              {/* Reset Filter Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear Filters
                </Button>
              )}

              <div className="ms-auto flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStudentsList([...initialStudentsData])
                    handleClearFilters()
                    showToast('Reset student records to initial dataset.')
                  }}
                  title="Reset sample data"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Students Table Card */}
        <Card variant="hover" data-table-select>
          <CardHeader variant="flex">
            <div>
              <h3 className="card__title">All Students</h3>
              <p className="card__description">
                {sortedStudents.length} {sortedStudents.length === 1 ? 'student' : 'students'} found
                {hasActiveFilters ? ' (filtered)' : ''}
              </p>
            </div>
            <div className="ms-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} title="Download the students shown in this table">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} title="Print the students shown in this table">
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print
              </Button>
            </div>
          </CardHeader>
          {/* Bulk Action Header Bar */}
          {selectedCount > 0 && (
            <CardHeader variant="flex-alt" data-bulkbar>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  <strong>{selectedCount}</strong> {selectedCount === 1 ? 'student' : 'students'} selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 ms-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const emails = sortedStudents
                      .filter((s) => isSelected(s.id))
                      .map((s) => s.email)
                      .filter(Boolean)
                      .join(',')
                    window.location.href = `mailto:${emails}`
                  }}
                >
                  <Mail className="w-3.5 h-3.5 mr-1" />
                  Email Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange('active')}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-success" />
                  Mark Active
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-xs text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </CardHeader>
          )}

          <CardBody className="p-0">
            <Table hover alignMiddle className="table--compact">
              <colgroup>
                <col style={{ width: '48px' }} />   {/* Checkbox */}
                <col style={{ width: '220px' }} />  {/* Student / Parent */}
                <col style={{ width: '135px' }} />  {/* Phone Number */}
                <col style={{ width: '130px' }} />  {/* Class */}
                <col style={{ width: '100px' }} />  {/* Gender */}
                <col style={{ width: '130px' }} />  {/* Teacher preference */}
                <col style={{ width: '160px' }} />  {/* Subjects */}
                <col style={{ width: '130px' }} />  {/* Locality */}
                <col style={{ width: '150px' }} />  {/* Preferred Timing */}
                <col style={{ width: '110px' }} />  {/* Budget Range */}
                <col style={{ width: '110px' }} />  {/* Status */}
                <col style={{ width: '115px' }} />  {/* Submitted Date */}
                <col style={{ width: '176px' }} />  {/* Actions */}
              </colgroup>

              <TableHead variant="alt">
                <TableRow>
                  <TableSelectAll
                    checked={selectAll}
                    indeterminate={isIndeterminate}
                    onChange={toggleAll}
                  />

                  {/* 1. Student / Parent Name */}
                  <TableHeaderCell
                    scope="col"
                    sortable
                    sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
                    onSort={() => handleSort('name')}
                  >
                    Student / Parent
                  </TableHeaderCell>

                  {/* 2. Phone Number */}
                  <TableHeaderCell scope="col">Phone Number</TableHeaderCell>

                  {/* 3. Class */}
                  <TableHeaderCell
                    scope="col"
                    sortable
                    sortDirection={sortConfig.key === 'studentClass' ? sortConfig.direction : null}
                    onSort={() => handleSort('studentClass')}
                  >
                    Class
                  </TableHeaderCell>

                  <TableHeaderCell scope="col">Gender</TableHeaderCell>
                  <TableHeaderCell scope="col">Teacher wanted</TableHeaderCell>

                  {/* 4. Subjects */}
                  <TableHeaderCell scope="col">Subjects</TableHeaderCell>

                  {/* 5. Locality */}
                  <TableHeaderCell
                    scope="col"
                    sortable
                    sortDirection={sortConfig.key === 'locality' ? sortConfig.direction : null}
                    onSort={() => handleSort('locality')}
                  >
                    Locality
                  </TableHeaderCell>

                  {/* 6. Preferred Timing */}
                  <TableHeaderCell scope="col">Preferred Timing</TableHeaderCell>

                  {/* 7. Budget Range */}
                  <TableHeaderCell scope="col" align="end">
                    Budget Range
                  </TableHeaderCell>

                  {/* 8. Student Status */}
                  <TableHeaderCell
                    scope="col"
                    sortable
                    sortDirection={sortConfig.key === 'status' ? sortConfig.direction : null}
                    onSort={() => handleSort('status')}
                  >
                    Status
                  </TableHeaderCell>

                  {/* 9. Submitted / Enrolled Date */}
                  <TableHeaderCell
                    scope="col"
                    sortable
                    sortDirection={sortConfig.key === 'submittedDate' ? sortConfig.direction : null}
                    onSort={() => handleSort('submittedDate')}
                  >
                    Submitted Date
                  </TableHeaderCell>

                  {/* 10. Actions (Sticky Right) */}
                  <TableHeaderCell scope="col" align="end" sticky="right">
                    <span className="sr-only">Actions</span>
                  </TableHeaderCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading && studentsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} style={{ padding: 0 }}><TableLoader columns={8} /></TableCell>
                  </TableRow>
                ) : paginatedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="table-empty-state-cell">
                      <div className="table-empty-state">
                        <GraduationCap className="table-empty-state__icon" aria-hidden="true" />
                        <h3 className="table-empty-state__title">No students found</h3>
                        <p className="table-empty-state__description">
                          {hasActiveFilters
                            ? 'Try clearing your search query or adjusting your filters'
                            : 'No active student records are currently available'}
                        </p>
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" onClick={handleClearFilters}>
                            Clear all filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedStudents.map((student) => (
                  <TableRow
                    key={student.id}
                    clickable
                    selected={isSelected(student.id)}
                    onClick={(e) => {
                      if (e.target.closest('input[type="checkbox"], button, a')) return
                      navigate(`/admin/students/${student.id}`)
                    }}
                  >
                    {/* Selection Checkbox */}
                    <TableSelectRow
                      checked={isSelected(student.id)}
                      onChange={() => toggleRow(student.id)}
                    />

                    {/* 1. Student / Parent Name */}
                    <TableCell>
                      <div className="flex items-center gap-2.5 min-w-0 teacher-profile">
                        <PersonAvatar src={student.avatar} name={student.name} gender={student.gender} role="student" size={38} />
                        <div className="min-w-0 flex-1 teacher-info">
                          <Link
                            to={`/admin/students/${student.id}`}
                            className="font-medium text-sm text-foreground hover:text-primary transition-colors text-left block truncate w-full teacher-name"
                            title={student.name}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {student.name}
                          </Link>
                          <div
                            className="text-xs text-muted-foreground truncate w-full mt-0.5 teacher-email"
                            title={student.parentName ? `Parent: ${student.parentName}` : `Teacher preference: ${TEACHER_PREF_LABEL[student.preferredTeacherGender] || 'Any'}`}
                          >
                            {student.parentName ? `Parent: ${student.parentName}` : `Teacher: ${TEACHER_PREF_LABEL[student.preferredTeacherGender] || 'Any'}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* 2. Phone Number */}
                    <TableCell className="whitespace-nowrap">
                      <a
                        href={`tel:${student.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="table-phone-link inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                      >
                        <Phone size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
                        <span>{student.phone || '—'}</span>
                      </a>
                    </TableCell>

                    {/* 3. Class */}
                    <TableCell className="whitespace-nowrap">
                      <span className="badge badge--neutral text-xs font-medium">
                        {student.studentClass}
                      </span>
                    </TableCell>

                    <TableCell className="whitespace-nowrap">
                      {GENDER_LABEL[student.gender] ? <span className="badge badge--neutral text-xs font-medium">{GENDER_LABEL[student.gender]}</span> : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="text-xs">{TEACHER_PREF_LABEL[student.preferredTeacherGender] || 'Any'}</span>
                    </TableCell>

                    {/* 4. Subjects */}
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                        {Array.isArray(student.subjects) && student.subjects.length > 0 ? (
                          student.subjects.slice(0, 2).map((sub, i) => (
                            <span
                              key={i}
                              className="badge badge--neutral text-[11px] font-medium truncate max-w-[120px]"
                              title={sub}
                            >
                              {sub}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                        {Array.isArray(student.subjects) && student.subjects.length > 2 && (
                          <span
                            className="badge badge--neutral text-[10px] font-medium shrink-0"
                            title={student.subjects.slice(2).join(', ')}
                          >
                            +{student.subjects.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* 5. Locality */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-foreground min-w-0" title={student.locality}>
                        <MapPin size={15} className="text-muted-foreground shrink-0" aria-hidden="true" />
                        <span className="truncate">{student.locality || '—'}</span>
                      </div>
                    </TableCell>

                    {/* 6. Preferred Timing */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-foreground min-w-0" title={student.preferredTiming}>
                        <Clock size={15} className="text-muted-foreground shrink-0" aria-hidden="true" />
                        <span className="truncate">{student.preferredTiming || 'Flexible'}</span>
                      </div>
                    </TableCell>

                    {/* 7. Budget Range */}
                    <TableCell align="end" className="whitespace-nowrap font-medium text-xs text-foreground">
                      {student.budgetRange || '—'}
                    </TableCell>

                    {/* 8. Student Status */}
                    <TableCell className="whitespace-nowrap">
                      <StudentStatusBadge status={student.status} />
                    </TableCell>

                    {/* 9. Submitted Date */}
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {student.submittedDate
                        ? new Date(student.submittedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '—'}
                    </TableCell>

                    {/* 10. Actions (Sticky Right) */}
                    <TableCell align="end" sticky="right" className="whitespace-nowrap smart-table-sticky-actions">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {student.status === 'awaiting_allocation' && canWrite('allocation') && (
                          <Link
                            to={`/admin/allocation?enquiry=${student.id}`}
                            className="button button--primary button--sm"
                            title="Allocate a teacher to this student"
                          >
                            Allocate
                          </Link>
                        )}
                        <Link
                          to={`/admin/students/${student.id}`}
                          className="button button--ghost button--icon button--sm"
                          aria-label={`View details of ${student.name}`}
                          title="View student profile page"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        {canWrite('students') && (
                        <button
                          type="button"
                          className="button button--ghost button--icon button--sm text-danger hover:bg-danger/10"
                          aria-label={`Delete ${student.name}`}
                          title="Delete student"
                          onClick={() => setDeleteModal({ open: true, student })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardBody>

        {/* Pagination Footer */}
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            Showing{' '}
            <strong className="text-foreground">
              {sortedStudents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            to{' '}
            <strong className="text-foreground">
              {Math.min(currentPage * pageSize, sortedStudents.length)}
            </strong>{' '}
            of <strong className="text-foreground">{sortedStudents.length}</strong> students
          </div>

          <div className="order-1 sm:order-2">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardFooter>
      </Card>
    </div>

      {/* Modals */}
      <StudentDetailModal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, student: null })}
        student={detailModal.student}
        onOpenEdit={(s) => setEditModal({ open: true, student: s })}
      />

      <StudentEditModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, student: null })}
        student={editModal.student}
        onSave={handleSaveStudent}
      />

      <StudentDeleteModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, student: null })}
        student={deleteModal.student}
        onConfirm={handleDeleteStudent}
      />

      <StudentAddModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddStudent}
      />
    </div>
  )
}
