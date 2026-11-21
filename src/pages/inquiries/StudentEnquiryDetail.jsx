import { Alert } from '@/components/ui/Alert'
import { PageLoader, Spinner } from '@/components/ui/Loaders'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Card, CardHeader, CardBody,
  Button, Badge
} from '@/components/ui'
import { ArrowLeft, ChevronLeft, User, Phone, Mail, MapPin, Clock, DollarSign, BookOpen, Calendar, Shield, AlertCircle, History, Save, ArrowRight, GraduationCap, ClipboardCheck, Globe, Check } from 'lucide-react'
import {
  getStudentEnquiryById,
  updateStudentEnquiry,
  getStudentStatusOptions,
  getStudentStatusLabel,
  STUDENT_ENQUIRY_STATUSES
} from '@/services/studentEnquiryService'
import { StudentStatusModal } from './StudentStatusModal'
import { listEnquiryTests } from '@/services/adminApi'
import { fetchEnquiryAuditLog } from '@/services/enquiryAuditService'
import { getAuthUser } from '@/services/apiClient'
import { useEnquiryCounts } from '@/context/EnquiryCountContext'

export default function StudentEnquiryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { markAsRead } = useEnquiryCounts()
  const markedReadRef = useRef(null)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Management controls
  const [statusAction, setStatusAction] = useState(null) // { target } for the status modal
  const [selectedStatus, setSelectedStatus] = useState('new')
  const [adminNotes, setAdminNotes] = useState('')
  const [reason, setReason] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  // Action states
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  // Confirmation modal/state for closing
  const [showConfirmClose, setShowConfirmClose] = useState(false)

  // Audit history
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [auditError, setAuditError] = useState(null)

  const handleActionDone = (result) => {
    setStatusAction(null)
    if (result.kind === 'test') {
      navigate(result.testId ? `/admin/tests/${result.testId}` : '/admin/tests')
      return
    }
    if (result.kind === 'converted') {
      // The enquiry is complete: the student continues in the Students tab, where a teacher is allocated.
      navigate('/admin/students')
      return
    }
    if (result.doc?.id) {
      setData(result.doc)
      setSelectedStatus(result.doc.enquiryStatus || 'new')
      setAdminNotes(result.doc.adminNotes || '')
    }
    setSaveSuccess('Enquiry updated.')
    loadAuditHistory()
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getStudentEnquiryById(id)
      const doc = res?.doc || res
      setData(doc)
      setSelectedStatus(doc.enquiryStatus || 'new')
      setAdminNotes(doc.adminNotes || '')
      setAssignedTo(
        typeof doc.assignedTo === 'object' && doc.assignedTo?.id
          ? String(doc.assignedTo.id)
          : doc.assignedTo ? String(doc.assignedTo) : ''
      )
    } catch (err) {
      setError(err.message || 'Failed to load student enquiry.')
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadAuditHistory = useCallback(async () => {
    setLoadingAudit(true)
    setAuditError(null)
    try {
      const res = await fetchEnquiryAuditLog({ enquiryType: 'student', enquiryId: id })
      setAuditLogs(res?.docs || [])
    } catch (err) {
      setAuditError(err.message || 'Could not load audit history.')
    } finally {
      setLoadingAudit(false)
    }
  }, [id])

  useEffect(() => {
    let ignore = false
    async function init() {
      try {
        const res = await getStudentEnquiryById(id)
        if (ignore) return
        const doc = res?.doc || res
        setData(doc)
        setSelectedStatus(doc.enquiryStatus || 'new')
        setAdminNotes(doc.adminNotes || '')
        setAssignedTo(
          typeof doc.assignedTo === 'object' && doc.assignedTo?.id
            ? String(doc.assignedTo.id)
            : doc.assignedTo ? String(doc.assignedTo) : ''
        )

        // Persistent Read Tracking: Mark as read if currently unread
        if (markedReadRef.current !== id) {
          markedReadRef.current = id
          if (!doc.markAsRead) {
            markAsRead('student', id)
              .then((readRes) => {
                if (readRes?.doc && !ignore) {
                  setData((prev) => (prev ? { ...prev, markAsRead: true } : prev))
                }
              })
              .catch((err) => {
                console.error('Failed to mark student enquiry as read:', err)
              })
          }
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load student enquiry.')
      } finally {
        if (!ignore) setLoading(false)
      }

      try {
        const auditRes = await fetchEnquiryAuditLog({ enquiryType: 'student', enquiryId: id })
        if (!ignore) setAuditLogs(auditRes?.docs || [])
      } catch (err) {
        if (!ignore) setAuditError(err.message || 'Could not load audit history.')
      } finally {
        if (!ignore) setLoadingAudit(false)
      }
    }

    if (id) {
      void init()
    }

    return () => {
      ignore = true
    }
  }, [id, markAsRead])

  // The test itself lives in the Tests module: find this enquiry's test and open it.
  const openTest = async () => {
    try {
      const res = await listEnquiryTests({ enquiry: id, limit: 1 })
      const test = res?.docs?.[0]
      navigate(test ? `/admin/tests/${test.id}` : '/admin/tests')
    } catch (err) {
      setSaveError(err.message || 'Could not open the test.')
    }
  }

  const handleStatusUpdate = async (e) => {
    if (e) e.preventDefault()

    // Validation: closing an enquiry requires a reason if desired
    if (selectedStatus === 'closed' && !showConfirmClose && data?.enquiryStatus !== 'closed') {
      setShowConfirmClose(true)
      return
    }

    setSaving(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      const payload = {
        enquiryStatus: selectedStatus,
        adminNotes: adminNotes.trim(),
      }

      if (reason.trim()) {
        payload.changeReason = reason.trim()
      }

      if (assignedTo.trim()) {
        const parsed = Number(assignedTo.trim())
        payload.assignedTo = isNaN(parsed) ? assignedTo.trim() : parsed
      }

      const res = await updateStudentEnquiry(id, payload)
      const updated = res?.doc || res
      setData(updated)
      setSaveSuccess(`Saved. Status is now ${getStudentStatusLabel(selectedStatus)}.`)
      setShowConfirmClose(false)
      setReason('')

      // Refresh audit logs
      loadAuditHistory()
    } catch (err) {
      setSaveError(err.message || 'Failed to update student enquiry status.')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (statusValue) => {
    const config = STUDENT_ENQUIRY_STATUSES.find((s) => s.value === statusValue) || {
      label: statusValue || 'New',
      variant: 'info',
    }
    return (
      <Badge variant={config.variant} size="lg" dot>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <PageLoader label="Loading student enquiry details" />
    )
  }

  if (error || !data) {
    return (
      <div className="page__section max-w-2xl mx-auto py-8">
        <Card className="border-danger/30">
          <CardBody className="py-12 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <div className="text-lg font-semibold text-foreground">Enquiry Not Found</div>
            <p className="text-sm text-muted-foreground max-w-md">
              {error || `Student enquiry #${id} could not be retrieved or does not exist.`}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Button variant="outline" onClick={() => navigate('/admin/inquiries')}>
                <ArrowLeft size={16} /> Back to Inquiries
              </Button>
              <Button variant="primary" onClick={loadData}>
                Retry
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const currentUser = getAuthUser()

  return (
    <div className="page__section">
      {/* Top Header & Breadcrumbs adhering to Meridian standard */}
      <header className="page__header">
        <div className="page__headline">
          <nav className="breadcrumb mb-2">
            <span className="breadcrumb__item">
              <Link to="/admin/inquiries" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <ChevronLeft size={14} /> Inquiries
              </Link>
            </span>
            <span className="breadcrumb__item" aria-current="page">
              Student Enquiry #{data.id}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page__title">{data.name}</h1>
            {getStatusBadge(data.enquiryStatus)}
          </div>
          <p className="page__description">
            Submitted {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'recently'} &bull; Review student requirements, tutor assignment, and status transitions.
          </p>
        </div>

        <div className="page__action flex items-center gap-2">
          {data.enquiryStatus === 'in_progress' && (
            <Button variant="outline" size="sm" onClick={() => setStatusAction({ target: 'test' })}>
              <ClipboardCheck size={16} className="mr-1" /> Request Test
            </Button>
          )}
          {data.enquiryStatus === 'test' && (
            <Button variant="outline" size="sm" onClick={openTest}>
              <ClipboardCheck size={16} className="mr-1" /> Open in Tests
            </Button>
          )}
          {['in_progress', 'test'].includes(data.enquiryStatus) && (
            <Button variant="success" size="sm" onClick={() => setStatusAction({ target: 'converted' })}>
              <GraduationCap size={16} className="mr-1" /> Move to Students
            </Button>
          )}
          {['converted', 'allocated'].includes(data.enquiryStatus) && (
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/students')}>
              <GraduationCap size={16} className="mr-1" /> Open in Students
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/inquiries')}>
            <ChevronLeft size={16} className="mr-1" /> Back to List
          </Button>
        </div>
      </header>

      <EnquiryFlow status={data.enquiryStatus || 'new'} hadTest={Boolean(data.testMode)} />

      {/* Success / Error Alerts */}
      {saveSuccess && (
        <Alert variant="success" title={saveSuccess} onClose={() => setSaveSuccess('')} />
      )}

      {saveError && (
        <Alert variant="error" title={saveError} onClose={() => setSaveError('')} />
      )}

      {/* Grid Layout: Main 2/3 + 1/3 columns */}
      <div className="enquiry-detail-layout">
        {/* Left Column (2 Cols): Student Requirements & Contact Details Side-by-Side, Audit */}
        <div className="space-y-6">
          {/* Side-by-Side Responsive Grid: Student & Academic Requirements + Contact Details & Locality */}
          <div className="enquiry-cards-row">
            {/* Card: Student & Academic Requirements */}
            <Card variant="hover" className="h-full flex flex-col">
              <div className="wf-cardhead"><h3><BookOpen size={18} />Academic Requirements</h3></div>
              <dl className="wf-info">
                <div><dt>Student / Parent</dt><dd>{data.name}</dd></div>
                <div><dt>Grade / Class</dt><dd>{data.studentClass || '—'}</dd></div>
                <div><dt>Student gender</dt><dd>{{ male: 'Boy', female: 'Girl', other: 'Other' }[data.studentGender] || <span className="is-empty">Not given</span>}</dd></div>
                <div><dt>Teacher wanted</dt><dd>{{ male: 'Male teacher', female: 'Female teacher', any: 'Anyone' }[data.preferredTeacherGender] || 'Anyone'}</dd></div>
                <div>
                  <dt>Subjects</dt>
                  <dd>
                    {(() => {
                      const list = Array.isArray(data.subjects)
                        ? data.subjects.map((s) => (typeof s === 'string' ? s : s?.name || s?.subject)).filter(Boolean)
                        : data.subjects ? [data.subjects] : []
                      if (data.customSubject) list.push(data.customSubject)
                      return list.length
                        ? list.map((s, i) => <span key={i} className="wf-chip">{s}</span>)
                        : <span className="is-empty">Not specified</span>
                    })()}
                  </dd>
                </div>
                <div><dt>Monthly budget</dt><dd><DollarSign size={15} />{data.budgetRange || 'Flexible / Undisclosed'}</dd></div>
                <div><dt>Preferred timing</dt><dd><Clock size={15} />{data.preferredTiming || 'Flexible'}</dd></div>
                <div><dt>Target start</dt><dd><Calendar size={15} />{data.startDate ? new Date(data.startDate).toLocaleDateString() : 'Immediate'}</dd></div>
              </dl>
              {(data.additionalNotes || data.message) && (
                <div className="wf-note">
                  <b>Parent / student note</b>
                  <p>{data.additionalNotes || data.message}</p>
                </div>
              )}
            </Card>

            {/* Card: Contact Details & Locality */}
            <Card variant="hover" className="h-full flex flex-col">
              <div className="wf-cardhead"><h3><User size={18} />Contact &amp; Locality</h3></div>
              <dl className="wf-info">
                <div>
                  <dt>Mobile</dt>
                  <dd>
                    {data.phoneNumber || data.phone
                      ? <a href={`tel:${data.phoneNumber || data.phone}`}><Phone size={15} />{data.phoneNumber || data.phone}</a>
                      : <span className="is-empty">Not provided</span>}
                  </dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    {data.email
                      ? <a href={`mailto:${data.email}`}><Mail size={15} />{data.email}</a>
                      : <span className="is-empty">Not provided</span>}
                  </dd>
                </div>
                <div>
                  <dt>Locality</dt>
                  <dd><MapPin size={15} />{[data.locality, data.customLocality].filter(Boolean).join(' · ') || 'Not specified'}</dd>
                </div>
              </dl>
            </Card>
          </div>

          {data.testMode && (
            <Card variant="hover">
              <CardHeader className="border-b border-border py-3.5 px-5">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">Assessment Test</h3>
                </div>
              </CardHeader>
              <CardBody className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1 font-medium">Mode</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    {data.testMode === 'physical' ? <MapPin size={14} /> : <Globe size={14} />}
                    {data.testMode === 'physical' ? 'Physical (₹99)' : data.testMode === 'digital' ? 'Digital (₹49)' : 'Virtual'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1 font-medium">Scheduled</span>
                  <span className="font-semibold">{data.testScheduledAt ? new Date(data.testScheduledAt).toLocaleString() : '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1 font-medium">{data.testMode === 'physical' ? 'Address' : 'Meeting link'}</span>
                  <span className="font-semibold break-all">{data.testVenue || '—'}</span>
                </div>
                {data.testNotes && (
                  <div className="sm:col-span-3 bg-surface-2 p-3 rounded-lg border border-border text-xs whitespace-pre-wrap">{data.testNotes}</div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Card: Audit & Transition History */}
          <Card variant="hover">
            <div className="wf-cardhead">
              <h3><History size={18} />Status History</h3>
              <Button variant="ghost" size="xs" onClick={loadAuditHistory} disabled={loadingAudit}>
                {loadingAudit ? <Spinner size={14} /> : 'Refresh'}
              </Button>
            </div>
            {loadingAudit && <div className="wf-empty">Loading history…</div>}
            {auditError && <div className="wf-empty">{auditError}</div>}
            {!loadingAudit && !auditError && auditLogs.length === 0 && (
              <div className="wf-empty">No status changes recorded yet.</div>
            )}
            {!loadingAudit && auditLogs.length > 0 && (
              <ol className="wf-timeline">
                {auditLogs.map((log) => (
                  <li key={log.id}>
                    <div className="wf-tl-top">
                      <span className="wf-tl-change">
                        <span className="wf-tl-from">{getStudentStatusLabel(log.previousStatus || 'new')}</span>
                        <ArrowRight size={13} />
                        <span className="wf-tl-to">{getStudentStatusLabel(log.newStatus)}</span>
                      </span>
                      <span className="wf-tl-time">{log.changedAt ? new Date(log.changedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    {log.changeReason && <div className="wf-tl-reason">{log.changeReason}</div>}
                    {log.changedBy && (
                      <div className="wf-tl-by">by {typeof log.changedBy === 'object' ? log.changedBy?.email || 'Admin' : 'Admin'}</div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* Right Column: Status Management & Administration */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-surface-2 border-b border-border py-3.5 px-5">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-primary shrink-0" />
                <h3 className="card__title">Enquiry Management</h3>
              </div>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              {/* Status Select */}
              <div className="field">
                <label className="field__label text-xs font-semibold block mb-1">
                  Enquiry Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    const value = e.target.value
                    // Test scheduling and allocation hand-off need extra details: use the modal.
                    if (value === 'test' || value === 'converted') {
                      setStatusAction({ target: value })
                      return
                    }
                    setSelectedStatus(value)
                  }}
                  disabled={saving}
                  className="field__control-select w-full"
                >
                  {getStudentStatusOptions(data.enquiryStatus || 'new').map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Talk to the parent, verify details, optional test, then send to allocation.
                </span>
              </div>

              {/* Confirm Close Confirmation Warning */}
              {(showConfirmClose || selectedStatus === 'closed') && (
                <div className="p-3.5 rounded-lg bg-warning/10 border border-warning/30 text-xs space-y-2">
                  <div className="font-semibold text-warning-emphasis flex items-center gap-1.5">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>Reason for Closing</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Provide context for closing this student enquiry (e.g. matched, cancelled, duplicate).
                  </p>
                  <div>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="e.g. Student enrolled with assigned tutor"
                      className="field__control-input text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Internal Staff Notes */}
              <div className="field">
                <label className="field__label text-xs font-semibold block mb-1">
                  Admin Internal Notes
                </label>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={saving}
                  placeholder="Add coordination notes, preferred tutors, or parent follow-up notes..."
                  className="field__control-textarea text-xs"
                />
              </div>

              {/* Assigned Staff Informational Row without rectangular border */}
              <div className="field">
                <span className="field__label text-xs font-semibold block mb-1">
                  Assigned Staff User
                </span>
                <div className="reviewer-info-row">
                  <div className="flex items-center gap-2.5 truncate">
                    <User size={15} className="text-muted-foreground shrink-0" />
                    <span className="font-mono text-foreground font-medium truncate text-xs">
                      {currentUser?.email || currentUser?.name || (assignedTo ? `Staff #${assignedTo}` : 'Admin')}
                    </span>
                  </div>
                  <Badge variant="neutral" size="sm" className="shrink-0 font-normal">
                    Super Admin
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Authenticated administrator managing this student enquiry.
                </span>
              </div>

              {/* Save Button */}
              <Button
                variant={selectedStatus === 'closed' ? 'warning' : 'primary'}
                className="w-full mt-2"
                onClick={handleStatusUpdate}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner size={16} className="mr-1.5" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1.5" /> Save Management Changes
                  </>
                )}
              </Button>
            </CardBody>
          </Card>

          {/* Meta card */}
          <Card variant="hover">
            <CardBody className="py-4 px-5 text-xs text-muted-foreground space-y-2.5">
              <div className="flex justify-between items-center">
                <span>Enquiry ID</span>
                <span className="font-mono text-foreground font-semibold">#{data.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Submitted At</span>
                <span className="text-foreground">
                  {data.createdAt ? new Date(data.createdAt).toLocaleString() : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Updated</span>
                <span className="text-foreground">
                  {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : '—'}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {statusAction && (
        <StudentStatusModal
          enquiry={data}
          targetStatus={statusAction.target}
          onClose={() => setStatusAction(null)}
          onDone={handleActionDone}
        />
      )}
    </div>
  )
}

const FLOW_STEPS = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'in_progress', label: 'Verified' },
  { key: 'test', label: 'Test', optional: true },
  { key: 'converted', label: 'Allocation' },
  { key: 'allocated', label: 'Allocated' },
]

/** Lifecycle: New, Contacted, Verified, optional Test, Allocation, Allocated. */
function EnquiryFlow({ status, hadTest }) {
  if (status === 'closed') {
    return <Alert variant="warning" title="Enquiry closed">This enquiry is closed. Reopen it from the management panel to continue the flow.</Alert>
  }
  const currentIdx = FLOW_STEPS.findIndex((st) => st.key === status)
  return (
    <ol className="wf-flow" aria-label="Enquiry progress">
      {FLOW_STEPS.map((st, i) => {
        const skipped = st.optional && i < currentIdx && !hadTest
        const done = i < currentIdx && !skipped
        const active = i === currentIdx
        return (
          <li key={st.key}>
            <span className={`wf-step${active ? ' is-active' : done ? ' is-done' : ''}`}>
              {done && <Check size={12} />}
              {st.label}
              {st.optional && <em>{skipped ? '(skipped)' : '(optional)'}</em>}
            </span>
            {i < FLOW_STEPS.length - 1 && <ArrowRight size={13} className="wf-step-sep" />}
          </li>
        )
      })}
    </ol>
  )
}
