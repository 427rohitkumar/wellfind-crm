import { Alert } from '@/components/ui/Alert'
import { clsx } from 'clsx'
import { useState, useEffect, useCallback } from 'react'
import {
  Card, CardHeader, CardBody, CardFooter,
  Button,
  InputGroup, InputGroupText,
  TablePagination,
  useTableSelection
} from '@/components/ui'
import { Search, RefreshCw, AlertCircle, GraduationCap, BookOpen, Key, LogIn, Download, X, Lock, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { StudentInquiriesTab } from './StudentInquiriesTab'
import { TeacherInquiriesTab } from './TeacherInquiriesTab'
import { InquiryDetailModal } from './InquiryDetailModal'
import { InquiryEditModal } from './InquiryEditModal'
import { InquiryDeleteModal } from './InquiryDeleteModal'
import { StudentEnquiryAddModal } from './StudentEnquiryAddModal'
import { StudentStatusModal } from './StudentStatusModal'
import {
  fetchStudentEnquiries,
  updateStudentEnquiry,
  STUDENT_ENQUIRY_STATUSES
} from '@/services/studentEnquiryService'
import {
  fetchTeacherEnquiries,
  updateTeacherEnquiry,
  TEACHER_INQUIRY_STATUS_FILTER_OPTIONS
} from '@/services/teacherEnquiryService'
import {
  setAuthSession,
  isAuthenticated
} from '@/services/apiClient'
import { useEnquiryCounts } from '@/context/EnquiryCountContext'
import { STUDENT_ENQUIRY_COLUMNS, TEACHER_ENQUIRY_COLUMNS, downloadCSV, fetchAllPages, printRows, today } from '@/utils/exportData'
import { usePermissions } from '@/hooks/usePermissions'

export default function Inquiries() {
  const { can } = usePermissions()
  const [activeTab, setActiveTab] = useState(() => (can('student_inquiries') ? 'student' : 'teacher')) // 'student' | 'teacher'
  const navigate = useNavigate()
  const [statusAction, setStatusAction] = useState(null) // { enquiry, target } for student status moves

  // Student Inquiries State
  const [studentInquiries, setStudentInquiries] = useState([])
  const [studentTotalDocs, setStudentTotalDocs] = useState(0)
  const [studentTotalPages, setStudentTotalPages] = useState(1)
  const [studentPage, setStudentPage] = useState(1)
  const [studentSearchInput, setStudentSearchInput] = useState('')
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [studentStatusFilter, setStudentStatusFilter] = useState('')
  const [studentSortConfig, setStudentSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
  const [studentLoading, setStudentLoading] = useState(false)
  const [studentError, setStudentError] = useState(null)
  const [studentAuthError, setStudentAuthError] = useState(false)

  // Teacher Inquiries State
  const [teacherInquiries, setTeacherInquiries] = useState([])
  const [teacherTotalDocs, setTeacherTotalDocs] = useState(0)
  const [teacherTotalPages, setTeacherTotalPages] = useState(1)
  const [teacherPage, setTeacherPage] = useState(1)
  const [teacherSearchInput, setTeacherSearchInput] = useState('')
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('')
  const [teacherStatusFilter, setTeacherStatusFilter] = useState('')
  const [teacherSortConfig, setTeacherSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
  const [teacherLoading, setTeacherLoading] = useState(false)
  const [teacherError, setTeacherError] = useState(null)
  const [teacherAuthError, setTeacherAuthError] = useState(false)

  // Modals state
  const [viewModal, setViewModal] = useState({ open: false, type: 'student', id: null })
  const [editModal, setEditModal] = useState({ open: false, type: 'student', inquiry: null })
  const [deleteModal, setDeleteModal] = useState({ open: false, type: 'student', inquiry: null })
  const [addStudentModalOpen, setAddStudentModalOpen] = useState(false)

  // Trigger re-fetch counter
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Shared enquiry-count service (keeps the sidebar badge and tab unread counts in sync)
  const { refreshCounts, decrementCount, studentUnreadCount, teacherUnreadCount } = useEnquiryCounts()

  // Quick status update loading state
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  // Toast / notification state
  const [toastMessage, setToastMessage] = useState(null)

  // Token configuration helper state
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [manualToken, setManualToken] = useState('')
  const [authErrorBanner, setAuthErrorBanner] = useState(null)

  const studentSelection = useTableSelection(studentInquiries)
  const teacherSelection = useTableSelection(teacherInquiries)

  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ text: msg, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 4500)
  }, [])

  // Debounce Student Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setStudentSearchQuery(studentSearchInput)
      setStudentPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [studentSearchInput])

  // Debounce Teacher Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setTeacherSearchQuery(teacherSearchInput)
      setTeacherPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [teacherSearchInput])

  // Data fetching effect
  useEffect(() => {
    let ignore = false

    const runFetch = async () => {
      await Promise.resolve()
      if (ignore) return

      if (activeTab === 'student') {
        setStudentLoading(true)
        setStudentError(null)
        setStudentAuthError(false)

        const sortParam =
          studentSortConfig.direction === 'desc'
            ? `-${studentSortConfig.key}`
            : studentSortConfig.key

        try {
          const res = await fetchStudentEnquiries({
            page: studentPage,
            limit: 10,
            sort: sortParam,
            status: studentStatusFilter,
            search: studentSearchQuery,
          })

          if (!ignore) {
            const docs = res?.docs || []
            setStudentInquiries(docs)
            setStudentTotalDocs(res?.totalDocs ?? docs.length)
            setStudentTotalPages(res?.totalPages ?? 1)
            setAuthErrorBanner(null)
            setStudentAuthError(false)
          }
        } catch (err) {
          if (!ignore) {
            setStudentError(err.message || 'Failed to load student enquiries.')
            const isAuth = Boolean(
              err.isUnauthorized ||
              err.isForbidden ||
              err.status === 401 ||
              err.status === 403 ||
              (err.message && /unauthorized|forbidden|super admin|401|403/i.test(err.message))
            )
            if (isAuth) {
              setStudentAuthError(true)
              setAuthErrorBanner(
                'Super admin access required. Please sign in with an administrator account to view student enquiries.'
              )
            }
          }
        } finally {
          if (!ignore) {
            setStudentLoading(false)
          }
        }
      } else {
        setTeacherLoading(true)
        setTeacherError(null)
        setTeacherAuthError(false)

        const sortParam =
          teacherSortConfig.direction === 'desc'
            ? `-${teacherSortConfig.key}`
            : teacherSortConfig.key

        try {
          const res = await fetchTeacherEnquiries({
            page: teacherPage,
            limit: 10,
            sort: sortParam,
            status: teacherStatusFilter,
            search: teacherSearchQuery,
          })

          if (!ignore) {
            const docs = res?.docs || []
            setTeacherInquiries(docs)
            setTeacherTotalDocs(res?.totalDocs ?? docs.length)
            setTeacherTotalPages(res?.totalPages ?? 1)
            setAuthErrorBanner(null)
            setTeacherAuthError(false)
          }
        } catch (err) {
          if (!ignore) {
            setTeacherError(err.message || 'Failed to load teacher applications.')
            const isAuth = Boolean(
              err.isUnauthorized ||
              err.isForbidden ||
              err.status === 401 ||
              err.status === 403 ||
              (err.message && /unauthorized|forbidden|super admin|401|403/i.test(err.message))
            )
            if (isAuth) {
              setTeacherAuthError(true)
              setAuthErrorBanner(
                'Super admin access required. Please sign in with an administrator account to view teacher applications.'
              )
            }
          }
        } finally {
          if (!ignore) {
            setTeacherLoading(false)
          }
        }
      }
    }

    runFetch()

    return () => {
      ignore = true
    }
  }, [
    activeTab,
    refreshTrigger,
    studentPage,
    studentSortConfig,
    studentStatusFilter,
    studentSearchQuery,
    teacherPage,
    teacherSortConfig,
    teacherStatusFilter,
    teacherSearchQuery,
  ])

  // Sorting handlers
  const handleStudentSort = (key) => {
    setStudentSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleTeacherSort = (key) => {
    setTeacherSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  // Quick status change handler from list row dropdown
  const handleQuickStatusChange = async (enquiry, newStatus) => {
    if (!enquiry || !newStatus) return
    const isStudent = activeTab === 'student'
    const enquiryId = enquiry.id

    // Student status moves always go through the status modal, which collects call
    // notes, test details or a close reason and uses the right backend endpoint.
    if (isStudent) {
      setStatusAction({ enquiry, target: newStatus })
      return
    }

    setUpdatingStatusId(enquiryId)
    try {
      if (isStudent) {
        await updateStudentEnquiry(enquiryId, { enquiryStatus: newStatus })
        setStudentInquiries((prev) =>
          prev.map((item) =>
            item.id === enquiryId ? { ...item, enquiryStatus: newStatus } : item
          )
        )
      } else {
        await updateTeacherEnquiry(enquiryId, {
          applicationStatus: newStatus,
          reviewedAt: new Date().toISOString(),
        })
        if (newStatus === 'approved') {
          // Approved teachers leave the active inquiry queue and move to Teachers network
          setTeacherInquiries((prev) => prev.filter((item) => item.id !== enquiryId))
          setTeacherTotalDocs((prev) => Math.max(0, prev - 1))
          decrementCount?.('teacher')
          showToast(`Teacher application #${enquiryId} approved and moved to Teachers network.`, 'success')
        } else {
          setTeacherInquiries((prev) =>
            prev.map((item) =>
              item.id === enquiryId ? { ...item, applicationStatus: newStatus } : item
            )
          )
          showToast(`Teacher application #${enquiryId} status updated to ${newStatus.replace('_', ' ').toUpperCase()}`)
        }
      }
      refreshCounts()
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error')
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const handleStatusActionDone = (result) => {
    setStatusAction(null)
    if (result.kind === 'test') {
      refreshCounts()
      navigate(result.testId ? `/admin/tests/${result.testId}` : '/admin/tests')
      return
    }
    if (result.kind === 'converted') {
      showToast('Student moved to the Students tab. Allocate a teacher from there.')
      // The enquiry has left the inquiry stage: drop it from this list.
      if (!studentStatusFilter) {
        setStudentInquiries((prev) => prev.filter((item) => item.id !== result.enquiryId))
        setStudentTotalDocs((prev) => Math.max(0, prev - 1))
      }
    } else if (result.doc?.id) {
      showToast(`Enquiry #${result.doc.id} updated.`)
      setStudentInquiries((prev) =>
        prev.map((item) => (item.id === result.doc.id ? { ...item, ...result.doc } : item))
      )
    }
    refreshCounts()
    setRefreshTrigger((prev) => prev + 1)
  }

  // Quick Edit success handler: update row data only after server confirmation
  const handleEditSuccess = (msg, updatedDoc) => {
    showToast(msg, 'success')
    if (updatedDoc && updatedDoc.id) {
      if (editModal.type === 'student') {
        setStudentInquiries((prev) =>
          prev.map((item) =>
            String(item.id) === String(updatedDoc.id) ? { ...item, ...updatedDoc } : item
          )
        )
      } else {
        if (updatedDoc.applicationStatus === 'approved') {
          setTeacherInquiries((prev) =>
            prev.filter((item) => String(item.id) !== String(updatedDoc.id))
          )
          setTeacherTotalDocs((prev) => Math.max(0, prev - 1))
          decrementCount?.('teacher')
        } else {
          setTeacherInquiries((prev) =>
            prev.map((item) =>
              String(item.id) === String(updatedDoc.id) ? { ...item, ...updatedDoc } : item
            )
          )
        }
      }
    } else {
      handleRefresh()
    }
    refreshCounts()
  }

  // Delete success handler: remove row from table only after server confirms deletion
  const handleDeleteSuccess = (msg, deletedId) => {
    showToast(msg, 'success')
    if (deletedId) {
      if (deleteModal.type === 'student') {
        setStudentInquiries((prev) =>
          prev.filter((item) => String(item.id) !== String(deletedId))
        )
        setStudentTotalDocs((prev) => Math.max(0, prev - 1))
        decrementCount?.('student')
        if (studentSelection.isSelected(deletedId)) {
          studentSelection.toggleRow(deletedId)
        }
      } else {
        setTeacherInquiries((prev) =>
          prev.filter((item) => String(item.id) !== String(deletedId))
        )
        setTeacherTotalDocs((prev) => Math.max(0, prev - 1))
        decrementCount?.('teacher')
        if (teacherSelection.isSelected(deletedId)) {
          teacherSelection.toggleRow(deletedId)
        }
      }
    } else {
      handleRefresh()
    }
    refreshCounts()
  }

  // Refresh active tab and synchronise the combined sidebar inquiry count
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
    showToast('Refreshing inquiries...')
    refreshCounts()
  }

  // Table export / print: the current tab with the current search and status filter, every page of it
  const [exporting, setExporting] = useState('')
  const loadAllOfTab = async () => {
    if (activeTab === 'student') {
      return fetchAllPages((page) => fetchStudentEnquiries({ page, limit: 100, sort: studentSortConfig.direction === 'desc' ? `-${studentSortConfig.key}` : studentSortConfig.key, status: studentStatusFilter, search: studentSearchQuery }))
    }
    return fetchAllPages((page) => fetchTeacherEnquiries({ page, limit: 100, sort: teacherSortConfig.direction === 'desc' ? `-${teacherSortConfig.key}` : teacherSortConfig.key, status: teacherStatusFilter, search: teacherSearchQuery }))
  }
  const tabInfo = () => (activeTab === 'student'
    ? { columns: STUDENT_ENQUIRY_COLUMNS, file: 'student-enquiries', title: 'Student enquiries' }
    : { columns: TEACHER_ENQUIRY_COLUMNS, file: 'teacher-applications', title: 'Teacher applications' })

  const handleExportCSV = async () => {
    setExporting('table')
    try {
      const docs = await loadAllOfTab()
      if (docs.length === 0) { showToast('Nothing to export for this filter.', 'warning'); return }
      const { columns, file } = tabInfo()
      downloadCSV(`wellfind-${file}-${today()}.csv`, columns, docs)
      showToast(`Exported ${docs.length} ${activeTab === 'student' ? 'student enquiries' : 'teacher applications'}.`)
    } catch (err) {
      showToast(err.message || 'Export failed.', 'error')
    } finally {
      setExporting('')
    }
  }

  const handleExportSelected = () => {
    const sel = activeTab === 'student' ? studentSelection : teacherSelection
    const docs = (activeTab === 'student' ? studentInquiries : teacherInquiries).filter((d) => sel.isSelected(d.id))
    if (docs.length === 0) return
    const { columns, file } = tabInfo()
    downloadCSV(`wellfind-${file}-selected-${today()}.csv`, columns, docs)
    showToast(`Exported ${docs.length} selected.`)
  }

  const handlePrintTable = async () => {
    setExporting('print')
    try {
      const docs = await loadAllOfTab()
      if (docs.length === 0) { showToast('Nothing to print for this filter.', 'warning'); return }
      const { columns, title } = tabInfo()
      if (!printRows(title, columns, docs)) showToast('Allow pop-ups for this site to print.', 'warning')
    } catch (err) {
      showToast(err.message || 'Print failed.', 'error')
    } finally {
      setExporting('')
    }
  }

  // Top button: everything, ignoring filters
  const [exportMenu, setExportMenu] = useState(false)
  const handleExportGlobal = async (which) => {
    setExportMenu(false)
    setExporting('global')
    try {
      let count = 0
      if (which !== 'teachers') {
        const all = await fetchAllPages((page) => fetchStudentEnquiries({ page, limit: 100 }))
        downloadCSV(`wellfind-all-student-enquiries-${today()}.csv`, STUDENT_ENQUIRY_COLUMNS, all)
        count += all.length
      }
      if (which !== 'students') {
        const all = await fetchAllPages((page) => fetchTeacherEnquiries({ page, limit: 100 }))
        downloadCSV(`wellfind-all-teacher-applications-${today()}.csv`, TEACHER_ENQUIRY_COLUMNS, all)
        count += all.length
      }
      showToast(`Exported ${count} records.`)
    } catch (err) {
      showToast(err.message || 'Export failed.', 'error')
    } finally {
      setExporting('')
    }
  }

  const handleSaveManualToken = (e) => {
    e.preventDefault()
    if (manualToken.trim()) {
      setAuthSession(manualToken.trim(), { role: 'super_admin' })
      setShowTokenInput(false)
      setManualToken('')
      showToast('Administrator JWT saved.')
      handleRefresh()
    }
  }

  const hasToken = isAuthenticated()

  const isAuthRequired = Boolean(
    (activeTab === 'student' ? studentAuthError : teacherAuthError) ||
    authErrorBanner ||
    (activeTab === 'student'
      ? studentError && /unauthorized|forbidden|super admin|401|403/i.test(studentError)
      : teacherError && /unauthorized|forbidden|super admin|401|403/i.test(teacherError))
  )

  const currentGeneralError = !isAuthRequired && (activeTab === 'student' ? studentError : teacherError)
  const currentLoading = activeTab === 'student' ? studentLoading : teacherLoading

  return (
    <div className="page__section">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="wf-toast"><Alert variant={toastMessage.type === 'error' ? 'error' : toastMessage.type === 'warning' ? 'warning' : 'success'} title={toastMessage.text} onClose={() => setToastMessage(null)} /></div>
      )}

      {/* Page Header matching Meridian Orders layout */}
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Inquiries</h1>
          <p className="page__description">
            Manage student enquiries and teacher applications.
          </p>
        </div>

        <div className="page__action">
          <div style={{ position: 'relative' }}>
            <Button
              variant="neutral"
              onClick={() => setExportMenu((v) => !v)}
              title="Export all enquiries, ignoring filters"
              disabled={isAuthRequired || exporting === 'global'}
              aria-haspopup="menu"
              aria-expanded={exportMenu}
            >
              <Download className="w-4 h-4 mr-1.5" />
              {exporting === 'global' ? 'Exporting…' : 'Export'}
            </Button>
            {exportMenu && (
              <div className="wf-menu" role="menu" onMouseLeave={() => setExportMenu(false)}>
                <button type="button" role="menuitem" onClick={() => handleExportGlobal('students')}>All student enquiries<small>CSV, every enquiry</small></button>
                <button type="button" role="menuitem" onClick={() => handleExportGlobal('teachers')}>All teacher applications<small>CSV, every application</small></button>
                <button type="button" role="menuitem" onClick={() => handleExportGlobal('both')}>Everything<small>2 CSV files</small></button>
              </div>
            )}
          </div>

          <Button
            variant="neutral"
            onClick={handleRefresh}
            title="Refresh table data"
            disabled={currentLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${currentLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          {!hasToken && (
            <Button
              variant="outline"
              onClick={() => setShowTokenInput(!showTokenInput)}
              title="Configure Admin Token"
            >
              <Key className="w-3.5 h-3.5 mr-1.5" />
              Auth
            </Button>
          )}
        </div>
      </header>

      <div className="page__body">
        {/* Tab Switcher: Segmented tabs positioned directly below heading in a clean, left-aligned layout */}
        <div className="flex items-center">
          <div
            className="toggle-group"
            role="tablist"
            aria-label="Inquiry Categories"
          >
            {can('student_inquiries') && (
            <button
              type="button"
              className="toggle"
              role="tab"
              aria-selected={activeTab === 'student'}
              data-state={activeTab === 'student' ? 'active' : undefined}
              onClick={() => {
                setActiveTab('student')
                studentSelection.clearSelection()
              }}
            >
              <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Student Inquiries</span>
              {studentUnreadCount !== null && studentUnreadCount > 0 && (
                <span
                  className={clsx(
                    'badge ms-2',
                    activeTab === 'student' ? 'badge--primary' : 'badge--soft'
                  )}
                  title={`${studentUnreadCount} unread student enquiries`}
                >
                  {studentUnreadCount}
                </span>
              )}
            </button>
            )}

            {can('teacher_inquiries') && (
            <button
              type="button"
              className="toggle"
              role="tab"
              aria-selected={activeTab === 'teacher'}
              data-state={activeTab === 'teacher' ? 'active' : undefined}
              onClick={() => {
                setActiveTab('teacher')
                teacherSelection.clearSelection()
              }}
            >
              <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Teacher Inquiries</span>
              {teacherUnreadCount !== null && teacherUnreadCount > 0 && (
                <span
                  className={clsx(
                    'badge ms-2',
                    activeTab === 'teacher' ? 'badge--primary' : 'badge--soft'
                  )}
                  title={`${teacherUnreadCount} unread teacher applications`}
                >
                  {teacherUnreadCount}
                </span>
              )}
            </button>
            )}
          </div>
        </div>

        {/* Quick Token Input Modal/Accordion for developer convenience */}
        {showTokenInput && (
          <Card variant="bordered" className="border-primary/30 bg-surface">
            <CardBody className="p-4">
              <form onSubmit={handleSaveManualToken} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" /> Paste Super Admin JWT Token
                  </h4>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setShowTokenInput(false)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Provide an existing Payload JWT for local testing. It will be stored in localStorage and sent in Authorization: Bearer headers.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="input flex-1 font-mono text-xs"
                    required
                  />
                  <Button type="submit" variant="primary" size="sm">
                    Save Token
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Filters Card */}
        <Card variant="bordered">
          <CardBody className="p-4">
            <div className="inquiries-toolbar flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Search Bar */}
              <InputGroup
                variant="search"
                className="inquiries-search-input"
                style={{ width: '320px', maxWidth: '100%' }}
              >
                <InputGroupText aria-hidden="true">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </InputGroupText>
                <input
                  type="search"
                  disabled={isAuthRequired}
                  placeholder={
                    isAuthRequired
                      ? 'Search disabled (sign in required)'
                      : activeTab === 'student'
                        ? 'Search student, phone, class, locality…'
                        : 'Search teacher, mobile, email, subject, locality…'
                  }
                  value={
                    activeTab === 'student'
                      ? studentSearchInput
                      : teacherSearchInput
                  }
                  onChange={(e) => {
                    if (activeTab === 'student') {
                      setStudentSearchInput(e.target.value)
                    } else {
                      setTeacherSearchInput(e.target.value)
                    }
                  }}
                  className="input"
                  aria-label="Search inquiries"
                />
              </InputGroup>

              {/* Status Filter Dropdown */}
              <select
                disabled={isAuthRequired}
                value={
                  activeTab === 'student'
                    ? studentStatusFilter
                    : teacherStatusFilter
                }
                onChange={(e) => {
                  if (activeTab === 'student') {
                    setStudentStatusFilter(e.target.value)
                    setStudentPage(1)
                  } else {
                    setTeacherStatusFilter(e.target.value)
                    setTeacherPage(1)
                  }
                }}
                className="select inquiries-status-select text-sm"
                style={{ width: 'auto', minWidth: '160px' }}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                {activeTab === 'student'
                  ? STUDENT_ENQUIRY_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))
                  : TEACHER_INQUIRY_STATUS_FILTER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
              </select>

              {/* Add Student Enquiry Button (Student Inquiries Tab only) */}
              {activeTab === 'student' && can('student_inquiries', 'write') && (
                <Button
                  variant="primary"
                  onClick={() => setAddStudentModalOpen(true)}
                  disabled={isAuthRequired}
                  className="shrink-0 flex items-center gap-1.5"
                  title="Add new student enquiry"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Student Enquiry
                </Button>
              )}

              {/* Clear filters button if active */}
              {!isAuthRequired &&
                ((activeTab === 'student' && (studentSearchInput || studentStatusFilter)) ||
                  (activeTab === 'teacher' && (teacherSearchInput || teacherStatusFilter))) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (activeTab === 'student') {
                      setStudentSearchInput('')
                      setStudentStatusFilter('')
                      setStudentPage(1)
                    } else {
                      setTeacherSearchInput('')
                      setTeacherStatusFilter('')
                      setTeacherPage(1)
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Inquiries Table Card */}
        <Card variant="hover" data-table-select>
          <CardHeader variant="flex">
            <div>
              <h3 className="card__title">
                {activeTab === 'student'
                  ? 'All Student Enquiries'
                  : 'All Teacher Applications'}
              </h3>
              <p className="card__description">
                {isAuthRequired
                  ? 'Access restricted'
                  : activeTab === 'student'
                    ? `${studentTotalDocs || 0} enquiries total`
                    : `${teacherTotalDocs || 0} applications total`}
              </p>
            </div>

            <div className="ms-auto flex items-center gap-2">
              <Button
                variant="neutral"
                size="sm"
                onClick={handleExportCSV}
                title="Download this table (current search and filter, all pages) as CSV"
                disabled={isAuthRequired || currentLoading || exporting === 'table'}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                {exporting === 'table' ? 'Exporting…' : 'Export'}
              </Button>
              <Button
                variant="neutral"
                size="sm"
                onClick={handlePrintTable}
                title="Print this table (current search and filter, all pages)"
                disabled={isAuthRequired || currentLoading || exporting === 'print'}
              >
                {exporting === 'print' ? 'Preparing…' : 'Print'}
              </Button>
            </div>
          </CardHeader>

          {/* Bulk Actions Bar */}
          {!isAuthRequired &&
            ((activeTab === 'student' && studentSelection.selectedCount > 0) ||
              (activeTab === 'teacher' && teacherSelection.selectedCount > 0)) && (
            <CardHeader variant="flex-alt" data-bulkbar>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {activeTab === 'student'
                    ? studentSelection.selectedCount
                    : teacherSelection.selectedCount}{' '}
                  selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 ms-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    studentSelection.clearSelection()
                    teacherSelection.clearSelection()
                  }}
                >
                  Clear Selection
                </Button>
                <Button variant="primary" size="sm" onClick={handleExportSelected}>
                  Export Selected
                </Button>
              </div>
            </CardHeader>
          )}

          <CardBody className="p-0">
            {isAuthRequired ? (
              <div className="inquiry-auth-alert">
                <div className="inquiry-auth-alert__icon">
                  <Lock aria-hidden="true" />
                </div>
                <h3 className="inquiry-auth-alert__title">
                  Authentication Required
                </h3>
                <p className="inquiry-auth-alert__description">
                  Your administrator session has expired or super admin privileges are required to view {activeTab === 'student' ? 'student enquiries' : 'teacher applications'}. Please sign in to continue.
                </p>
                <div className="inquiry-auth-alert__actions">
                  <Link to="/">
                    <Button variant="primary">
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setShowTokenInput(true)}
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Set JWT Token
                  </Button>
                </div>
              </div>
            ) : currentGeneralError ? (
              <div className="inquiry-auth-alert">
                <div
                  className="inquiry-auth-alert__icon"
                  style={{
                    backgroundColor: 'rgba(229, 38, 41, 0.12)',
                    borderColor: 'rgba(229, 38, 41, 0.25)',
                    color: '#e52629',
                  }}
                >
                  <AlertCircle aria-hidden="true" />
                </div>
                <h3 className="inquiry-auth-alert__title">
                  Failed to Load {activeTab === 'student' ? 'Student Enquiries' : 'Teacher Applications'}
                </h3>
                <p className="inquiry-auth-alert__description">
                  {currentGeneralError}
                </p>
                <div className="inquiry-auth-alert__actions">
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Try Again
                  </Button>
                </div>
              </div>
            ) : activeTab === 'student' ? (
              <StudentInquiriesTab
                inquiries={studentInquiries}
                loading={studentLoading}
                error={studentError}
                sortConfig={studentSortConfig}
                onSort={handleStudentSort}
                onView={(item) =>
                  setViewModal({ open: true, type: 'student', id: item.id })
                }
                onEdit={(item) =>
                  setEditModal({ open: true, type: 'student', inquiry: item })
                }
                onDelete={(item) =>
                  setDeleteModal({ open: true, type: 'student', inquiry: item })
                }
                onQuickStatusChange={handleQuickStatusChange}
                updatingStatusId={updatingStatusId}
                selection={studentSelection}
              />
            ) : (
              <TeacherInquiriesTab
                inquiries={teacherInquiries}
                loading={teacherLoading}
                error={teacherError}
                sortConfig={teacherSortConfig}
                onSort={handleTeacherSort}
                onView={(teacher) =>
                  setViewModal({ open: true, type: 'teacher', id: teacher.id })
                }
                onEdit={(teacher) =>
                  setEditModal({ open: true, type: 'teacher', inquiry: teacher })
                }
                onDelete={(teacher) =>
                  setDeleteModal({ open: true, type: 'teacher', inquiry: teacher })
                }
                onQuickStatusChange={handleQuickStatusChange}
                updatingStatusId={updatingStatusId}
                selection={teacherSelection}
              />
            )}
          </CardBody>

          {/* Pagination styled like original Orders page - hidden when auth/general error */}
          {!isAuthRequired && !currentGeneralError && (
            <CardFooter>
              <span className="text-xs text-muted-foreground">
                {activeTab === 'student' ? (
                  studentInquiries.length > 0 ? (
                    <>
                      Showing{' '}
                      <strong>
                        {(studentPage - 1) * 10 + 1}–{Math.min(studentPage * 10, studentTotalDocs)}
                      </strong>{' '}
                      of <strong>{studentTotalDocs}</strong> enquiries
                    </>
                  ) : (
                    'No enquiries to display'
                  )
                ) : teacherInquiries.length > 0 ? (
                  <>
                    Showing{' '}
                    <strong>
                      {(teacherPage - 1) * 10 + 1}–{Math.min(teacherPage * 10, teacherTotalDocs)}
                    </strong>{' '}
                    of <strong>{teacherTotalDocs}</strong> applications
                  </>
                ) : (
                  'No applications to display'
                )}
              </span>

              <TablePagination
                currentPage={activeTab === 'student' ? studentPage : teacherPage}
                totalPages={activeTab === 'student' ? studentTotalPages : teacherTotalPages}
                onPageChange={(page) => {
                  if (activeTab === 'student') {
                    setStudentPage(page)
                    studentSelection.clearSelection()
                  } else {
                    setTeacherPage(page)
                    teacherSelection.clearSelection()
                  }
                }}
                showFirstLast
                showPrevNext
              />
            </CardFooter>
          )}
        </Card>
      </div>

      {statusAction && (
        <StudentStatusModal
          key={`${statusAction.enquiry.id}-${statusAction.target}`}
          enquiry={statusAction.enquiry}
          targetStatus={statusAction.target}
          onClose={() => setStatusAction(null)}
          onDone={handleStatusActionDone}
        />
      )}

      {/* View Detail Modal */}
      <InquiryDetailModal
        key={`view-${viewModal.type}-${viewModal.id}`}
        isOpen={viewModal.open}
        onClose={() => setViewModal({ open: false, type: 'student', id: null })}
        type={viewModal.type}
        inquiryId={viewModal.id}
        onOpenEdit={(enquiry) => {
          setEditModal({ open: true, type: viewModal.type, inquiry: enquiry })
        }}
      />

      {/* Edit Management Modal */}
      <InquiryEditModal
        key={`edit-${editModal.type}-${editModal.inquiry?.id}`}
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, type: 'student', inquiry: null })}
        type={editModal.type}
        inquiry={editModal.inquiry}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <InquiryDeleteModal
        key={`delete-${deleteModal.type}-${deleteModal.inquiry?.id}`}
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: 'student', inquiry: null })}
        type={deleteModal.type}
        inquiry={deleteModal.inquiry}
        onSuccess={handleDeleteSuccess}
      />

      {/* Add Student Enquiry Five-Step Modal */}
      <StudentEnquiryAddModal
        isOpen={addStudentModalOpen}
        onClose={() => setAddStudentModalOpen(false)}
        onSuccess={(createdDoc) => {
          showToast(`Student enquiry #${createdDoc?.id || ''} added successfully.`)
          handleRefresh()
        }}
      />
    </div>
  )
}
