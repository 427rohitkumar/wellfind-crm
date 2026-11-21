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
  Eye, Edit, Trash2, X, CheckCircle, AlertCircle,
  GraduationCap, RefreshCw, FileSpreadsheet
} from 'lucide-react'
import {
  initialTeachersData,
  REGISTRATION_FEE_CONFIG,
  KYC_CONFIG,
  ALLOCATION_CONFIG,
  ACCOUNT_CONFIG
} from './teachersSampleData'
import {
  fetchTeachers,
  updateTeacher,
  deleteTeacher
} from '@/services/teacherService'
import { TeacherStatusBadge } from './TeacherStatusBadge'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { TeacherDetailModal } from './TeacherDetailModal'
import { TeacherEditModal } from './TeacherEditModal'
import { Printer } from 'lucide-react'
import { TEACHER_COLUMNS, downloadCSV, fetchAllPages, printRows, today } from '@/utils/exportData'

function getFeeDisplay(fee) {
  const status = fee?.status || 'pending'
  const isWaived = status === 'waived' || fee?.amount === 0
  const amountText = isWaived
    ? 'Waived'
    : `₹${(fee?.amount ?? 1000).toLocaleString('en-IN')}`

  let tooltip = 'Waived'
  if (!isWaived) {
    let statusLabel
    if (status === 'paid' || status === 'successful') {
      statusLabel = 'Paid'
    } else if (status === 'failed') {
      statusLabel = 'Failed'
    } else if (status === 'pending') {
      statusLabel = 'Pending'
    } else {
      statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'
    }
    tooltip = `${statusLabel} — ${amountText}`
  }

  // Status colors:
  // Red dot: Failed
  // Green dot: Paid / successful
  // Blue dot: Pending
  // Gray dot: Waived or other statuses
  let dotClass = 'fee-status-dot--other'
  let dotColor = '#6b7280'
  if (status === 'failed') {
    dotClass = 'fee-status-dot--failed'
    dotColor = '#dc2626'
  } else if (status === 'paid' || status === 'successful') {
    dotClass = 'fee-status-dot--paid'
    dotColor = '#16a34a'
  } else if (status === 'pending') {
    dotClass = 'fee-status-dot--pending'
    dotColor = '#2563eb'
  } else if (isWaived) {
    dotClass = 'fee-status-dot--waived'
    dotColor = '#6b7280'
  }

  return { amountText, tooltip, dotClass, dotColor }
}

export default function Teachers() {
  const { can } = usePermissions()
  const canWrite = (m) => can(m, 'write')
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState(initialTeachersData)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [feeFilter, setFeeFilter] = useState('')
  const [kycFilter, setKycFilter] = useState('')
  const [allocationFilter, setAllocationFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const pageSize = 8

  // Modal states
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)
  const [activeBanner, setActiveBanner] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ text: msg, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 4500)
  }, [])

  // Load teachers from backend API
  const loadTeachers = useCallback(async (showNotification = false) => {
    setLoading(true)
    try {
      const res = await fetchTeachers()
      if (res?.docs) {
        setTeachers(res.docs)
        if (showNotification) {
          showToast(`Refreshed ${res.docs.length} teacher profile(s).`)
        }
      }
    } catch (err) {
      console.error('Failed to load teachers:', err)
      if (showNotification) {
        showToast('Failed to refresh teachers.', 'warning')
      }
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    let ignore = false
    const init = async () => {
      await loadTeachers(false)
    }
    void init()
    return () => {
      ignore = true
    }
  }, [loadTeachers])

  // Filtered dataset
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        teacher.name.toLowerCase().includes(q) ||
        teacher.email.toLowerCase().includes(q) ||
        teacher.mobile.toLowerCase().includes(q) ||
        teacher.primarySubject.toLowerCase().includes(q) ||
        teacher.qualification.toLowerCase().includes(q)

      const matchesFee = !feeFilter || teacher.registrationFee?.status === feeFilter
      const matchesKyc = !kycFilter || teacher.kyc?.status === kycFilter
      const matchesAllocation = !allocationFilter || teacher.studentAllocation?.status === allocationFilter
      const matchesAccount = !accountFilter || teacher.account?.status === accountFilter

      return matchesSearch && matchesFee && matchesKyc && matchesAllocation && matchesAccount
    })
  }, [teachers, searchQuery, feeFilter, kycFilter, allocationFilter, accountFilter])

  // Sorted dataset
  const sortedTeachers = useMemo(() => {
    return [...filteredTeachers].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      if (sortConfig.key === 'registrationFee') {
        aVal = a.registrationFee?.status || ''
        bVal = b.registrationFee?.status || ''
      } else if (sortConfig.key === 'kyc') {
        aVal = a.kyc?.status || ''
        bVal = b.kyc?.status || ''
      } else if (sortConfig.key === 'allocation') {
        aVal = a.studentAllocation?.status || ''
        bVal = b.studentAllocation?.status || ''
      } else if (sortConfig.key === 'account') {
        aVal = a.account?.status || ''
        bVal = b.account?.status || ''
      } else if (sortConfig.key === 'experienceYears') {
        aVal = a.experienceYears || 0
        bVal = b.experienceYears || 0
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredTeachers, sortConfig])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTeachers.length / pageSize))
  const paginatedTeachers = sortedTeachers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Selection
  const {
    selectedRows,
    selectAll,
    isIndeterminate,
    toggleRow,
    toggleAll,
    isSelected,
    selectedCount,
    clearSelection,
  } = useTableSelection(sortedTeachers)

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page)
      clearSelection()
    },
    [clearSelection]
  )

  const hasActiveFilters = Boolean(
    searchQuery || feeFilter || kycFilter || allocationFilter || accountFilter
  )

  const handleClearFilters = () => {
    setSearchQuery('')
    setFeeFilter('')
    setKycFilter('')
    setAllocationFilter('')
    setAccountFilter('')
    setCurrentPage(1)
    clearSelection()
  }

  // Row actions
  const handleViewTeacher = (teacher) => {
    navigate(`/admin/teachers/${teacher.id}`)
  }

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher)
    setIsEditOpen(true)
  }

  const handleSaveTeacher = async (updatedTeacher) => {
    try {
      await updateTeacher(updatedTeacher.id, updatedTeacher)
    } catch (err) {
      console.warn('API update teacher error:', err)
    }
    setTeachers((prev) =>
      prev.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t))
    )
    if (selectedTeacher && selectedTeacher.id === updatedTeacher.id) {
      setSelectedTeacher(updatedTeacher)
    }
    setActiveBanner({
      type: 'success',
      title: 'Teacher Profile Updated:',
      message: `Teacher profile for ${updatedTeacher.name} was updated successfully.`,
    })
    showToast(`Teacher profile for ${updatedTeacher.name} updated successfully.`)
  }

  const handleDeleteTeacher = async (teacherId, teacherName) => {
    if (window.confirm(`Are you sure you want to remove teacher record for ${teacherName}?`)) {
      try {
        await deleteTeacher(teacherId)
      } catch (err) {
        console.warn('API delete teacher error:', err)
      }
      setTeachers((prev) => prev.filter((t) => t.id !== teacherId))
      clearSelection()
      setActiveBanner({
        type: 'warning',
        title: 'Teacher Record Removed:',
        message: `Teacher record for ${teacherName} has been removed.`,
      })
      showToast(`Teacher record for ${teacherName} removed.`, 'warning')
    }
  }

  const handleAddTeacher = () => {
    const newTch = {
      id: `TCH-${String(teachers.length + 1).padStart(3, '0')}`,
      name: 'New Teacher Candidate',
      email: 'candidate@wellfind.academic',
      mobile: '+91 98000 00000',
      avatar: null,
      primarySubject: 'General Science',
      qualification: 'B.Sc., B.Ed.',
      experienceYears: 1,
      classLevels: 'Classes 6–10',
      locality: 'Kolkata Central',
      availability: 'Mon-Fri: Evening',
      registrationFee: {
        status: 'pending',
        amount: 1000,
        currency: 'INR',
        year: '2026–2027',
        paymentDate: 'Pending',
        transactionRef: 'None',
      },
      kyc: {
        status: 'pending',
        aadhaarStatus: 'Pending Upload',
        qualificationStatus: 'Pending Upload',
        reviewNotes: 'New profile created in UI.',
        reviewedAt: 'Pending',
      },
      studentAllocation: {
        status: 'unallocated',
        allocatedCount: 0,
        studentsSummary: 'Unallocated',
        students: [],
        assignedSubjects: ['Science'],
        allocationDate: 'None',
      },
      account: {
        status: 'active',
        createdAt: 'Just now',
        updatedAt: 'Just now',
      },
      isSampleData: true,
    }
    setTeachers([newTch, ...teachers])
    setSelectedTeacher(newTch)
    setIsEditOpen(true)
    setActiveBanner({
      type: 'success',
      title: 'Draft Teacher Created:',
      message: 'Created new draft teacher record. You can edit the profile details now.',
    })
    showToast('Created new draft teacher record. You can edit it now.')
  }

  // Bulk actions
  const handleBulkStatusChange = (statusKey, newValue) => {
    const selectedIds = Array.from(selectedRows)
    setTeachers((prev) =>
      prev.map((t) => {
        if (!selectedIds.includes(t.id)) return t
        if (statusKey === 'account') {
          return { ...t, account: { ...t.account, status: newValue, updatedAt: 'Just now' } }
        }
        if (statusKey === 'fee') {
          return { ...t, registrationFee: { ...t.registrationFee, status: newValue } }
        }
        return t
      })
    )
    clearSelection()
    setActiveBanner({
      type: 'success',
      title: 'Bulk Update Completed:',
      message: `Updated status for ${selectedIds.length} teacher record(s).`,
    })
    showToast(`Updated status for ${selectedIds.length} teachers.`)
  }

  // Table export / print: what is on screen (search, filters and sorting applied)
  const handleExportCSV = () => {
    if (sortedTeachers.length === 0) {
      setActiveBanner({ type: 'warning', title: 'Export Skipped:', message: 'No teacher records available to export.' })
      return
    }
    downloadCSV(`wellfind-teachers-${today()}.csv`, TEACHER_COLUMNS, sortedTeachers)
    setActiveBanner({ type: 'success', title: 'Export Complete:', message: `Exported ${sortedTeachers.length} teacher records to CSV file.` })
    showToast(`Exported ${sortedTeachers.length} teacher records to CSV.`)
  }

  const handlePrint = () => {
    if (sortedTeachers.length === 0) {
      setActiveBanner({ type: 'warning', title: 'Print Skipped:', message: 'No teacher records to print.' })
      return
    }
    if (!printRows('Teachers', TEACHER_COLUMNS, sortedTeachers)) {
      setActiveBanner({ type: 'warning', title: 'Print blocked:', message: 'Allow pop-ups for this site to print.' })
    }
  }

  // Top button: every approved teacher, ignoring search and filters
  const [exportingAll, setExportingAll] = useState(false)
  const handleExportAll = async () => {
    setExportingAll(true)
    try {
      const all = await fetchAllPages((page) => fetchTeachers({ page, limit: 100 }))
      downloadCSV(`wellfind-all-teachers-${today()}.csv`, TEACHER_COLUMNS, all)
      showToast(`Exported all ${all.length} teachers.`)
    } catch (err) {
      showToast(err.message || 'Could not export all teachers.', 'error')
    } finally {
      setExportingAll(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'T'
    return name
      .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    <div className="page__section">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="wf-toast"><Alert variant={toastMessage.type === 'error' ? 'error' : toastMessage.type === 'warning' ? 'warning' : 'success'} title={toastMessage.text} onClose={() => setToastMessage(null)} /></div>
      )}

      {/* Page Header matching Meridian layout */}
      <header className="page__header mb-6">
        <div className="page__headline">
          <h1 className="page__title">Teachers</h1>
          <p className="page__description">
            Manage teacher profiles, registration fees, verification, and student allocations.
          </p>
        </div>
        <div className="page__action flex items-center gap-2">
          <Button
            variant="neutral"
            onClick={() => loadTeachers(true)}
            disabled={loading}
            title="Refresh teacher records"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </Button>
          <Button variant="neutral" onClick={handleExportAll} disabled={exportingAll} title="Download every teacher as CSV, ignoring filters">
            <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
            {exportingAll ? 'Exporting…' : 'Export all'}
          </Button>
          {canWrite('teachers') && (
          <Button variant="primary" onClick={handleAddTeacher}>
            <Plus className="w-4 h-4 mr-1.5" aria-hidden="true" />
            Add teacher
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
                  placeholder="Search name, subject, mobile…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                    clearSelection()
                  }}
                  className="input"
                  aria-label="Search teachers"
                />
              </InputGroup>

              {/* Registration Fee Filter */}
              <select
                value={feeFilter}
                onChange={(e) => {
                  setFeeFilter(e.target.value)
                  setCurrentPage(1)
                  clearSelection()
                }}
                className="select text-xs"
                style={{ width: 'auto', minWidth: '160px' }}
                aria-label="Filter by registration fee"
              >
                <option value="">All Registration Fees</option>
                {Object.entries(REGISTRATION_FEE_CONFIG).map(([val, conf]) => (
                  <option key={val} value={val}>
                    Fee: {conf.label}
                  </option>
                ))}
              </select>

              {/* KYC Status Filter */}
              <select
                value={kycFilter}
                onChange={(e) => {
                  setKycFilter(e.target.value)
                  setCurrentPage(1)
                  clearSelection()
                }}
                className="select text-xs"
                style={{ width: 'auto', minWidth: '140px' }}
                aria-label="Filter by KYC status"
              >
                <option value="">All KYC Statuses</option>
                {Object.entries(KYC_CONFIG).map(([val, conf]) => (
                  <option key={val} value={val}>
                    KYC: {conf.label}
                  </option>
                ))}
              </select>

              {/* Allocation Filter */}
              <select
                value={allocationFilter}
                onChange={(e) => {
                  setAllocationFilter(e.target.value)
                  setCurrentPage(1)
                  clearSelection()
                }}
                className="select text-xs"
                style={{ width: 'auto', minWidth: '150px' }}
                aria-label="Filter by student allocation"
              >
                <option value="">All Allocations</option>
                {Object.entries(ALLOCATION_CONFIG).map(([val, conf]) => (
                  <option key={val} value={val}>
                    Allocation: {conf.label}
                  </option>
                ))}
              </select>

              {/* Account Status Filter */}
              <select
                value={accountFilter}
                onChange={(e) => {
                  setAccountFilter(e.target.value)
                  setCurrentPage(1)
                  clearSelection()
                }}
                className="select text-xs"
                style={{ width: 'auto', minWidth: '135px' }}
                aria-label="Filter by account status"
              >
                <option value="">All Accounts</option>
                {Object.entries(ACCOUNT_CONFIG).map(([val, conf]) => (
                  <option key={val} value={val}>
                    Account: {conf.label}
                  </option>
                ))}
              </select>

              {/* Clear filters button */}
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
                    setTeachers([...initialTeachersData])
                    handleClearFilters()
                    showToast('Reset teachers data to initial dataset.')
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

        {/* Teachers Table Card */}
        <Card variant="hover" data-table-select>
          <CardHeader variant="flex">
            <div>
              <h3 className="card__title">All Teachers</h3>
              <p className="card__description">
                {sortedTeachers.length} {sortedTeachers.length === 1 ? 'teacher' : 'teachers'} found
                {hasActiveFilters ? ' (filtered)' : ''}
              </p>
            </div>
            <div className="ms-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} title="Download the teachers shown in this table">
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} title="Print the teachers shown in this table">
                <Printer className="w-3.5 h-3.5 mr-1.5" />
                Print
              </Button>
            </div>
          </CardHeader>

          {/* Bulk Action Bar */}
          {selectedCount > 0 && (
            <CardHeader variant="flex-alt" data-bulkbar>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  <strong>{selectedCount}</strong> {selectedCount === 1 ? 'teacher' : 'teachers'} selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 ms-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const emails = sortedTeachers
                      .filter((t) => isSelected(t.id))
                      .map((t) => t.email)
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
                  onClick={() => handleBulkStatusChange('account', 'active')}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-success" />
                  Mark Active
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkStatusChange('account', 'suspended')}
                >
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-danger" />
                  Suspend
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

          {/* Table Container with Controlled Fixed Column Layout */}
          <CardBody className="p-0">
            <Table hover alignMiddle className="table--compact">
              <colgroup>
                  <col style={{ width: '48px' }} />   {/* Checkbox */}
                  <col style={{ width: '220px' }} />  {/* Teacher Profile */}
                  <col style={{ width: '140px' }} />  {/* Mobile Number */}
                  <col style={{ width: '90px' }} />   {/* Gender */}
                  <col style={{ width: '140px' }} />  {/* Primary Subject */}
                  <col style={{ width: '160px' }} />  {/* Qualification */}
                  <col style={{ width: '75px' }} />   {/* Experience */}
                  <col style={{ width: '115px' }} />  {/* Registration Fee */}
                  <col style={{ width: '100px' }} />  {/* KYC Status */}
                  <col style={{ width: '145px' }} />  {/* Student Allocation */}
                  <col style={{ width: '100px' }} />  {/* Account Status */}
                  <col style={{ width: '100px' }} />  {/* Actions */}
                </colgroup>

                <TableHead variant="alt">
                  <TableRow>
                    <TableSelectAll
                      checked={selectAll}
                      indeterminate={isIndeterminate}
                      onChange={toggleAll}
                    />

                    {/* 1. Teacher */}
                    <TableHeaderCell
                      scope="col"
                      sortable
                      sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
                      onSort={() => handleSort('name')}
                    >
                      Teacher
                    </TableHeaderCell>

                    {/* 2. Mobile Number */}
                    <TableHeaderCell scope="col">
                      Mobile Number
                    </TableHeaderCell>

                    <TableHeaderCell scope="col">Gender</TableHeaderCell>

                    {/* 3. Primary Subject */}
                    <TableHeaderCell
                      scope="col"
                      sortable
                      sortDirection={sortConfig.key === 'primarySubject' ? sortConfig.direction : null}
                      onSort={() => handleSort('primarySubject')}
                    >
                      Primary Subject
                    </TableHeaderCell>

                    {/* 4. Qualification */}
                    <TableHeaderCell
                      scope="col"
                      sortable
                      sortDirection={sortConfig.key === 'qualification' ? sortConfig.direction : null}
                      onSort={() => handleSort('qualification')}
                    >
                      Qualification
                    </TableHeaderCell>

                    {/* 5. Experience */}
                    <TableHeaderCell
                      scope="col"
                      sortable
                      sortDirection={sortConfig.key === 'experienceYears' ? sortConfig.direction : null}
                      onSort={() => handleSort('experienceYears')}
                    >
                      Experience
                    </TableHeaderCell>

                    {/* 6. Registration Fee */}
                    <TableHeaderCell
                      scope="col"
                      sortable
                      sortDirection={sortConfig.key === 'registrationFee' ? sortConfig.direction : null}
                      onSort={() => handleSort('registrationFee')}
                    >
                      Registration Fee
                    </TableHeaderCell>

                    {/* 7. KYC Status */}
                    <TableHeaderCell
                      scope="col"
                      sortable
                      sortDirection={sortConfig.key === 'kyc' ? sortConfig.direction : null}
                      onSort={() => handleSort('kyc')}
                    >
                      KYC Status
                    </TableHeaderCell>

                    {/* 8. Student Allocation */}
                    <TableHeaderCell
                      scope="col"
                      sortable
                      sortDirection={sortConfig.key === 'allocation' ? sortConfig.direction : null}
                      onSort={() => handleSort('allocation')}
                    >
                      Student Allocation
                    </TableHeaderCell>

                    {/* 9. Account Status */}
                    <TableHeaderCell
                      scope="col"
                      sortable
                      sortDirection={sortConfig.key === 'account' ? sortConfig.direction : null}
                      onSort={() => handleSort('account')}
                    >
                      Account Status
                    </TableHeaderCell>

                    {/* 10. Actions */}
                    <TableHeaderCell scope="col" align="end" sticky="right">
                      <span className="sr-only">Actions</span>
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={12} style={{ padding: 0 }}><TableLoader columns={8} /></TableCell>
                    </TableRow>
                  )}
                  {!loading && paginatedTeachers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={12} className="table-empty-state-cell">
                        <div className="table-empty-state">
                          <GraduationCap className="table-empty-state__icon" aria-hidden="true" />
                          <h3 className="table-empty-state__title">No approved teachers found</h3>
                          <p className="table-empty-state__description">
                            {hasActiveFilters
                              ? 'Try clearing your search query or adjusting your filters'
                              : 'Approved teacher applications from Teacher Inquiries will appear here.'}
                          </p>
                          {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={handleClearFilters}>
                              Clear all filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && paginatedTeachers.map((teacher) => (
                    <TableRow
                      key={teacher.id}
                      clickable
                      selected={isSelected(teacher.id)}
                      onClick={(e) => {
                        // Prevent row click if clicking checkbox, buttons, or links
                        if (e.target.closest('input[type="checkbox"], button, a')) return
                        handleViewTeacher(teacher)
                      }}
                    >
                      <TableSelectRow
                        checked={isSelected(teacher.id)}
                        onChange={() => toggleRow(teacher.id)}
                      />

                      {/* 1. Teacher column */}
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0 teacher-profile">
                          <PersonAvatar src={teacher.avatar} name={teacher.name} gender={teacher.gender} role="teacher" size={38} />
                          <div className="min-w-0 flex-1 teacher-info">
                            <Link
                              to={`/admin/teachers/${teacher.id}`}
                              className="font-medium text-sm text-foreground hover:text-primary transition-colors text-left block truncate w-full teacher-name"
                              title={teacher.name}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {teacher.name}
                            </Link>
                            <div
                              className="text-xs text-muted-foreground truncate w-full font-mono mt-0.5 teacher-email"
                              title={teacher.email}
                            >
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Mobile Number */}
                      <TableCell className="whitespace-nowrap">
                        <a
                          href={`tel:${teacher.mobile}`}
                          className="table-phone-link inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
                          <span>{teacher.mobile}</span>
                        </a>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {{ male: 'Male', female: 'Female', other: 'Other' }[teacher.gender] || <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>

                      {/* 3. Primary Subject */}
                      <TableCell>
                        <span className="badge badge--neutral text-xs font-medium">
                          {teacher.primarySubject}
                        </span>
                      </TableCell>

                      {/* 4. Qualification */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-foreground min-w-0 qualification-cell">
                          <GraduationCap className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="truncate min-w-0 qualification-text" title={teacher.qualification}>
                            {teacher.qualification}
                          </span>
                        </div>
                      </TableCell>

                      {/* 5. Experience */}
                      <TableCell className="whitespace-nowrap text-xs font-medium text-muted-foreground">
                        {teacher.experienceYears ? `${teacher.experienceYears} yrs` : '–'}
                      </TableCell>

                      {/* 6. Registration Fee */}
                      <TableCell className="whitespace-nowrap">
                        {(() => {
                          const { amountText, tooltip, dotClass, dotColor } = getFeeDisplay(teacher.registrationFee)
                          return (
                            <div
                              className="fee-status-indicator inline-flex items-center gap-1.5 whitespace-nowrap cursor-default"
                              title={tooltip}
                            >
                              <span
                                className={`fee-status-dot ${dotClass}`}
                                style={{
                                  width: '7.5px',
                                  height: '7.5px',
                                  borderRadius: '50%',
                                  backgroundColor: dotColor,
                                  flexShrink: 0,
                                  display: 'inline-block',
                                }}
                                aria-hidden="true"
                              />
                              <span className="text-xs font-medium text-foreground">
                                {amountText}
                              </span>
                            </div>
                          )
                        })()}
                      </TableCell>

                      {/* 7. KYC Status */}
                      <TableCell className="whitespace-nowrap">
                        <TeacherStatusBadge type="kyc" value={teacher.kyc?.status} />
                      </TableCell>

                      {/* 8. Student Allocation */}
                      <TableCell className="whitespace-nowrap">
                        <div className="status-badge-row min-w-0">
                          <TeacherStatusBadge
                            type="allocation"
                            value={teacher.studentAllocation?.status}
                          />
                          <span
                            className="badge-text text-[11px] text-muted-foreground leading-none truncate"
                            title={teacher.studentAllocation?.studentsSummary || 'Unallocated'}
                          >
                            {teacher.studentAllocation?.studentsSummary || 'Unallocated'}
                          </span>
                        </div>
                      </TableCell>

                      {/* 9. Account Status */}
                      <TableCell className="whitespace-nowrap">
                        <TeacherStatusBadge type="account" value={teacher.account?.status} />
                      </TableCell>

                      {/* 10. Actions */}
                      <TableCell align="end" sticky="right" className="whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link
                            to={`/admin/teachers/${teacher.id}`}
                            className="button button--ghost button--neutral button--icon-only button--sm"
                            aria-label={`View details of ${teacher.name}`}
                            title="View teacher profile page"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </Link>
                          {canWrite('teachers') && (
                          <button
                            type="button"
                            className="button button--ghost button--danger button--icon-only button--sm"
                            aria-label={`Delete ${teacher.name}`}
                            title="Remove teacher"
                            onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
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
                {sortedTeachers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-foreground">
                {Math.min(currentPage * pageSize, sortedTeachers.length)}
              </strong>{' '}
              of <strong className="text-foreground">{sortedTeachers.length}</strong> teachers
            </div>
            <div className="order-1 sm:order-2 ms-auto">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showFirstLast
                showPrevNext
              />
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Modals */}
      <TeacherDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        teacher={selectedTeacher}
        onOpenEdit={(tch) => {
          setSelectedTeacher(tch)
          setIsEditOpen(true)
        }}
      />

      <TeacherEditModal
        key={selectedTeacher?.id || 'new'}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        teacher={selectedTeacher}
        onSave={handleSaveTeacher}
      />
    </div>
  )
}
