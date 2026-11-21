import { TableLoader, Spinner } from '@/components/ui/Loaders'
import { Link, useNavigate } from 'react-router-dom'
import {
  Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell,
  TableSelectAll, TableSelectRow
} from '@/components/ui'
import {
  Eye, Trash2, Clock, MapPin, Phone,
  AlertCircle, BookOpen
} from 'lucide-react'
import { getStudentStatusOptions } from '@/services/studentEnquiryService'
import { useEnquiryCounts } from '@/context/EnquiryCountContext'

export function StudentInquiriesTab({
  inquiries = [],
  loading = false,
  error = null,
  sortConfig,
  onSort,
  onDelete,
  onQuickStatusChange,
  updatingStatusId = null,
  selection,
}) {
  const navigate = useNavigate()
  const { isEnquiryUnread } = useEnquiryCounts()

  const {
    selectAll,
    isIndeterminate,
    toggleRow,
    toggleAll,
    isSelected,
  } = selection

  const formatSubjects = (subjects, customSubject) => {
    let list = []
    if (Array.isArray(subjects)) {
      list = subjects.map((s) => (typeof s === 'string' ? s : s?.subject)).filter(Boolean)
    }
    if (customSubject) {
      list.push(customSubject)
    }
    return list
  }

  const handleRowClick = (enquiry) => {
    // Navigate to student enquiry detail page
    navigate(`/admin/student-enquiries/${enquiry.id}`)
  }

  return (
    <Table hover alignMiddle>
      <TableHead variant="alt">
        <TableRow>
          <TableSelectAll
            checked={selectAll}
            indeterminate={isIndeterminate}
            onChange={toggleAll}
          />
          <TableHeaderCell
            scope="col"
            sortable
            sortDirection={sortConfig.key === 'name' ? sortConfig.direction : null}
            onSort={() => onSort('name')}
          >
            Student / Parent
          </TableHeaderCell>
          <TableHeaderCell scope="col">Phone Number</TableHeaderCell>
          <TableHeaderCell
            scope="col"
            sortable
            sortDirection={sortConfig.key === 'studentClass' ? sortConfig.direction : null}
            onSort={() => onSort('studentClass')}
          >
            Class
          </TableHeaderCell>
          <TableHeaderCell scope="col">Subjects</TableHeaderCell>
          <TableHeaderCell
            scope="col"
            sortable
            sortDirection={sortConfig.key === 'locality' ? sortConfig.direction : null}
            onSort={() => onSort('locality')}
          >
            Locality
          </TableHeaderCell>
          <TableHeaderCell scope="col">Preferred Timing</TableHeaderCell>
          <TableHeaderCell scope="col" align="end">
            Budget
          </TableHeaderCell>
          <TableHeaderCell
            scope="col"
            sortable
            sortDirection={sortConfig.key === 'enquiryStatus' ? sortConfig.direction : null}
            onSort={() => onSort('enquiryStatus')}
            className="smart-table-col-status"
          >
            Status
          </TableHeaderCell>
          <TableHeaderCell
            scope="col"
            sortable
            sortDirection={sortConfig.key === 'createdAt' ? sortConfig.direction : null}
            onSort={() => onSort('createdAt')}
          >
            Date
          </TableHeaderCell>
          <TableHeaderCell scope="col" align="end" sticky="right" className="smart-table-sticky-actions smart-table-sticky-actions-head">
            <span className="sr-only">Actions</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {loading && (
          <TableRow>
            <TableCell colSpan={10} style={{ padding: 0 }}><TableLoader columns={8} /></TableCell>
          </TableRow>
        )}

        {error && !loading && (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-12">
              <div className="flex flex-col items-center justify-center gap-2">
                <AlertCircle className="text-danger" size={24} />
                <span className="text-sm text-danger font-medium">
                  Failed to load student enquiries
                </span>
                <span className="text-xs text-muted-foreground">{error}</span>
              </div>
            </TableCell>
          </TableRow>
        )}

        {!loading && !error && inquiries.length === 0 && (
          <TableRow>
            <TableCell colSpan={10} className="text-center py-16">
              <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                  <BookOpen className="text-muted-foreground" size={24} />
                </div>
                <div className="text-sm font-semibold text-foreground">
                  No student enquiries found
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  There are no student enquiries matching your current search or status filter criteria.
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}

        {!loading &&
          !error &&
          inquiries.map((enquiry) => {
            const rowSelected = isSelected(enquiry.id)
            const isUnread = isEnquiryUnread('student', enquiry)
            const subjectList = formatSubjects(enquiry.subjects, enquiry.customSubject)
            const isUpdating = updatingStatusId === enquiry.id

            return (
              <TableRow
                key={enquiry.id}
                clickable
                selected={rowSelected}
                onClick={() => handleRowClick(enquiry)}
              >
                <TableSelectRow
                  checked={rowSelected}
                  onChange={() => toggleRow(enquiry.id)}
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Name */}
                <TableCell>
                  <div className="flex items-start gap-1.5">
                    {isUnread && (
                      <span
                        className="unread-indicator-dot shrink-0"
                        title="Unread enquiry"
                        aria-label="Unread enquiry"
                        role="status"
                      />
                    )}
                    <div className="min-w-0">
                      <Link
                        to={`/admin/student-enquiries/${enquiry.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-foreground hover:text-primary transition-colors block"
                      >
                        {enquiry.name}
                      </Link>
                      <div className="text-xs text-muted-foreground font-mono">
                        #{enquiry.id}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Phone */}
                <TableCell className="whitespace-nowrap">
                  <a
                    href={`tel:${enquiry.phoneNumber}`}
                    onClick={(e) => e.stopPropagation()}
                    className="table-phone-link font-mono text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Phone size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
                    <span>{enquiry.phoneNumber}</span>
                  </a>
                </TableCell>

                {/* Class */}
                <TableCell>
                  <span className="text-xs font-medium text-foreground">
                    {enquiry.studentClass}
                  </span>
                </TableCell>

                {/* Subjects */}
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {subjectList.slice(0, 2).map((sub, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary font-medium truncate max-w-[120px]"
                        title={sub}
                      >
                        {sub}
                      </span>
                    ))}
                    {subjectList.length > 2 && (
                      <span className="px-1.5 py-0.5 text-xs rounded bg-surface-3 text-muted-foreground font-medium">
                        +{subjectList.length - 2}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Locality */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    <MapPin size={14} className="text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[160px]" title={enquiry.locality}>
                      {enquiry.locality}
                    </span>
                  </div>
                  {enquiry.customLocality && (
                    <span
                      className="text-[11px] text-muted-foreground block truncate max-w-[160px] pl-5"
                      title={enquiry.customLocality}
                    >
                      {enquiry.customLocality}
                    </span>
                  )}
                </TableCell>

                {/* Preferred Timing */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                    <Clock size={14} className="text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[140px]" title={enquiry.preferredTiming}>
                      {enquiry.preferredTiming}
                    </span>
                  </div>
                </TableCell>

                {/* Budget Range */}
                <TableCell align="end" className="text-xs font-medium whitespace-nowrap">
                  {enquiry.budgetRange}
                </TableCell>

                {/* Quick Status Dropdown */}
                <TableCell className="smart-table-col-status" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start gap-1.5">
                    <select
                      value={enquiry.enquiryStatus || 'new'}
                      data-status={enquiry.enquiryStatus || 'new'}
                      disabled={isUpdating}
                      onChange={(e) => {
                        const newStatus = e.target.value
                        if (newStatus !== enquiry.enquiryStatus) {
                          onQuickStatusChange?.(enquiry, newStatus)
                        }
                      }}
                      className="table-status-select"
                      title={`Current status: ${enquiry.enquiryStatus || 'new'}. Change status.`}
                      aria-label={`Change status for enquiry ${enquiry.id}`}
                    >
                      {getStudentStatusOptions(enquiry.enquiryStatus || 'new').map((statusItem) => (
                        <option key={statusItem.value} value={statusItem.value}>
                          {statusItem.label}
                        </option>
                      ))}
                    </select>
                    {isUpdating && <Spinner size={14} />}
                  </div>
                </TableCell>

                {/* Submitted Date */}
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {enquiry.createdAt
                    ? new Date(enquiry.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </TableCell>

                {/* Actions */}
                <TableCell align="end" sticky="right" className="smart-table-sticky-actions" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      to={`/admin/student-enquiries/${enquiry.id}`}
                      className="table-action-btn"
                      aria-label={`View enquiry ${enquiry.id}`}
                      title="View enquiry details page"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye size={15} />
                    </Link>
                    <button
                      type="button"
                      className="table-action-btn table-action-btn--danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(enquiry)
                      }}
                      aria-label={`Delete enquiry ${enquiry.id}`}
                      title="Delete enquiry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
      </TableBody>
    </Table>
  )
}
