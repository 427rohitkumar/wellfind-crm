import { Link, useNavigate } from 'react-router-dom'
import {
  Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell,
  TableSelectAll, TableSelectRow
} from '@/components/ui'
import {
  Eye, Trash2, MapPin, Phone, Mail,
  AlertCircle, GraduationCap, Briefcase, Loader2
} from 'lucide-react'
import { TEACHER_APPLICATION_STATUSES } from '@/services/teacherEnquiryService'
import { useEnquiryCounts } from '@/context/EnquiryCountContext'

export function TeacherInquiriesTab({
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

  const handleRowClick = (enquiry) => {
    navigate(`/admin/teacher-enquiries/${enquiry.id}`)
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
            sortDirection={sortConfig.key === 'fullName' ? sortConfig.direction : null}
            onSort={() => onSort('fullName')}
          >
            Teacher Name
          </TableHeaderCell>
          <TableHeaderCell scope="col">Mobile Number</TableHeaderCell>
          <TableHeaderCell scope="col">Email</TableHeaderCell>
          <TableHeaderCell scope="col">Highest Qualification</TableHeaderCell>
          <TableHeaderCell scope="col">Experience</TableHeaderCell>
          <TableHeaderCell
            scope="col"
            sortable
            sortDirection={sortConfig.key === 'primarySubject' ? sortConfig.direction : null}
            onSort={() => onSort('primarySubject')}
          >
            Primary Subject
          </TableHeaderCell>
          <TableHeaderCell scope="col">Class Level</TableHeaderCell>
          <TableHeaderCell
            scope="col"
            sortable
            sortDirection={sortConfig.key === 'teachingLocality' ? sortConfig.direction : null}
            onSort={() => onSort('teachingLocality')}
          >
            Locality
          </TableHeaderCell>
          <TableHeaderCell
            scope="col"
            sortable
            sortDirection={sortConfig.key === 'applicationStatus' ? sortConfig.direction : null}
            onSort={() => onSort('applicationStatus')}
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
            <TableCell colSpan={11} className="text-center py-12">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground font-medium">
                  Loading teacher applications...
                </span>
              </div>
            </TableCell>
          </TableRow>
        )}

        {error && !loading && (
          <TableRow>
            <TableCell colSpan={11} className="text-center py-12">
              <div className="flex flex-col items-center justify-center gap-2">
                <AlertCircle className="text-danger" size={24} />
                <span className="text-sm text-danger font-medium">
                  Failed to load teacher applications
                </span>
                <span className="text-xs text-muted-foreground">{error}</span>
              </div>
            </TableCell>
          </TableRow>
        )}

        {!loading && !error && inquiries.length === 0 && (
          <TableRow>
            <TableCell colSpan={11} className="text-center py-16">
              <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
                  <GraduationCap className="text-muted-foreground" size={24} />
                </div>
                <div className="text-sm font-semibold text-foreground">
                  No teacher applications found
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  There are no teacher applications matching your current search or status filter criteria.
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}

        {!loading &&
          !error &&
          inquiries.map((enquiry) => {
            const rowSelected = isSelected(enquiry.id)
            const isUnread = isEnquiryUnread('teacher', enquiry)
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
                        to={`/admin/teacher-enquiries/${enquiry.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-foreground hover:text-primary transition-colors block"
                      >
                        {enquiry.fullName}
                      </Link>
                      <div className="text-xs text-muted-foreground font-mono">
                        #{enquiry.id}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {/* Mobile */}
                <TableCell className="whitespace-nowrap">
                  <a
                    href={`tel:${enquiry.mobileNumber}`}
                    onClick={(e) => e.stopPropagation()}
                    className="table-phone-link font-mono text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Phone size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
                    <span>{enquiry.mobileNumber}</span>
                  </a>
                </TableCell>

                {/* Email */}
                <TableCell>
                  {enquiry.email ? (
                    <a
                      href={`mailto:${enquiry.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 truncate max-w-[150px]"
                      title={enquiry.email}
                    >
                      <Mail size={14} className="text-muted-foreground shrink-0" />
                      <span className="truncate">{enquiry.email}</span>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                {/* Highest Qualification */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    <GraduationCap size={14} className="text-muted-foreground shrink-0" />
                    <span className="font-medium truncate max-w-[140px]" title={enquiry.highestQualification}>
                      {enquiry.highestQualification}
                    </span>
                  </div>
                </TableCell>

                {/* Experience */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    <Briefcase size={14} className="text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[120px]" title={enquiry.teachingExperience}>
                      {enquiry.teachingExperience}
                    </span>
                  </div>
                </TableCell>

                {/* Primary Subject */}
                <TableCell>
                  <span className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary font-medium inline-block truncate max-w-[130px]">
                    {enquiry.primarySubject}
                  </span>
                </TableCell>

                {/* Class Level */}
                <TableCell>
                  <span className="text-xs text-foreground truncate max-w-[130px] block" title={enquiry.classLevel}>
                    {enquiry.classLevel}
                  </span>
                </TableCell>

                {/* Locality */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs text-foreground">
                    <MapPin size={14} className="text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[150px]" title={enquiry.teachingLocality}>
                      {enquiry.teachingLocality}
                    </span>
                  </div>
                </TableCell>

                {/* Quick Status Dropdown */}
                <TableCell className="smart-table-col-status" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start gap-1.5">
                    <select
                      value={enquiry.applicationStatus || 'new'}
                      data-status={enquiry.applicationStatus || 'new'}
                      disabled={isUpdating}
                      onChange={(e) => {
                        const newStatus = e.target.value
                        if (newStatus !== enquiry.applicationStatus) {
                          onQuickStatusChange?.(enquiry, newStatus)
                        }
                      }}
                      className="table-status-select"
                      title={`Current status: ${enquiry.applicationStatus || 'new'}. Change status.`}
                      aria-label={`Change status for teacher ${enquiry.id}`}
                    >
                      {TEACHER_APPLICATION_STATUSES.map((statusItem) => (
                        <option key={statusItem.value} value={statusItem.value}>
                          {statusItem.label}
                        </option>
                      ))}
                    </select>
                    {isUpdating && <Loader2 size={13} className="animate-spin text-primary shrink-0" />}
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
                      to={`/admin/teacher-enquiries/${enquiry.id}`}
                      className="table-action-btn"
                      aria-label={`View teacher application ${enquiry.id}`}
                      title="View application details page"
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
                      aria-label={`Delete application ${enquiry.id}`}
                      title="Delete application"
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
