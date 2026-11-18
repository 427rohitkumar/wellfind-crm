import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Card, CardHeader, CardBody,
  Button, Badge
} from '@/components/ui'
import {
  ArrowLeft, ChevronLeft, User, Phone, Mail, MapPin, Clock, DollarSign,
  BookOpen, Calendar, Shield, AlertCircle, CheckCircle2,
  History, Save, Loader2, ArrowRight
} from 'lucide-react'
import { convertStudentEnquiry } from '@/services/adminApi'
import {
  getStudentEnquiryById,
  updateStudentEnquiry,
  STUDENT_ENQUIRY_STATUSES
} from '@/services/studentEnquiryService'
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
  const [converting, setConverting] = useState(false)
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

  const handleConvert = async () => {
    if (!window.confirm('Convert this enquiry into a student record? This cannot be undone.')) return
    setConverting(true)
    setSaveError('')
    try {
      const res = await convertStudentEnquiry(id)
      const studentId = res?.student?.id ?? res?.studentId ?? res?.id
      navigate(studentId ? `/admin/student-records/${studentId}` : '/admin/student-records')
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setConverting(false)
    }
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
      setSaveSuccess(`Status successfully updated to ${selectedStatus.toUpperCase()}`)
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
      <div className="page__section py-16 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <div className="text-sm font-medium text-muted-foreground">Loading student enquiry details...</div>
      </div>
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
              <Button variant="outline" onClick={() => navigate('/inquiries')}>
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
              <Link to="/inquiries" className="hover:text-primary transition-colors flex items-center gap-1.5">
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
          {['new', 'contacted', 'in_progress'].includes(data.enquiryStatus) && (
            <Button variant="success" size="sm" loading={converting} onClick={handleConvert}>
              <GraduationCap size={16} className="mr-1" /> Convert to Student
            </Button>
          )}
          {data.enquiryStatus === 'converted' && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/student-records?search=${encodeURIComponent(data.name || '')}`)}>
              <GraduationCap size={16} className="mr-1" /> View Student Record
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/inquiries')}>
            <ChevronLeft size={16} className="mr-1" /> Back to List
          </Button>
        </div>
      </header>

      {/* Success / Error Alerts */}
      {saveSuccess && (
        <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{saveSuccess}</span>
          </div>
          <button type="button" onClick={() => setSaveSuccess('')} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {saveError && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{saveError}</span>
          </div>
          <button type="button" onClick={() => setSaveError('')} className="text-xs opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Grid Layout: Main 2/3 + 1/3 columns */}
      <div className="enquiry-detail-layout">
        {/* Left Column (2 Cols): Student Requirements & Contact Details Side-by-Side, Audit */}
        <div className="space-y-6">
          {/* Side-by-Side Responsive Grid: Student & Academic Requirements + Contact Details & Locality */}
          <div className="enquiry-cards-row">
            {/* Card: Student & Academic Requirements */}
            <Card variant="hover" className="h-full flex flex-col">
              <CardHeader className="border-b border-border py-3.5 px-5">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">Academic Requirements</h3>
                </div>
              </CardHeader>
              <CardBody className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3.5 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Student / Parent Name</span>
                    <span className="font-semibold text-foreground text-sm block">{data.name}</span>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Grade / Class</span>
                    <span className="font-semibold text-foreground text-sm block">{data.studentClass || '—'}</span>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Subjects Required</span>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {Array.isArray(data.subjects) && data.subjects.length > 0 ? (
                        data.subjects.map((sub, idx) => (
                          <span key={idx} className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary font-semibold">
                            {typeof sub === 'string' ? sub : sub?.name || sub?.subject || JSON.stringify(sub)}
                          </span>
                        ))
                      ) : typeof data.subjects === 'string' && data.subjects ? (
                        <span className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary font-semibold">
                          {data.subjects}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">Not specified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Monthly Budget</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-foreground text-sm">
                      <DollarSign size={14} className="text-success shrink-0" />
                      <span>{data.budget ? `₹${data.budget}` : 'Flexible / Undisclosed'}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Preferred Schedule / Timings</span>
                    <span className="inline-flex items-center gap-2 text-foreground text-sm">
                      <Clock size={14} className="text-muted-foreground shrink-0" />
                      <span>{data.preferredTime || 'Flexible'}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Target Start Date</span>
                    <span className="inline-flex items-center gap-2 text-foreground text-sm">
                      <Calendar size={14} className="text-muted-foreground shrink-0" />
                      <span>{data.startDate ? new Date(data.startDate).toLocaleDateString() : 'Immediate'}</span>
                    </span>
                  </div>
                </div>

                {data.message && (
                  <div className="bg-surface-2 p-3.5 rounded-lg border border-border mt-2">
                    <span className="text-xs font-semibold text-muted-foreground block mb-1">Parent / Student Requirement Note</span>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{data.message}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Card: Contact Details & Locality */}
            <Card variant="hover" className="h-full flex flex-col">
              <CardHeader className="border-b border-border py-3.5 px-5">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">Contact Details & Locality</h3>
                </div>
              </CardHeader>
              <CardBody className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3.5 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Mobile Number</span>
                    <a
                      href={`tel:${data.phoneNumber || data.phone}`}
                      className="font-mono text-sm text-primary hover:underline inline-flex items-center gap-2 font-medium"
                    >
                      <Phone size={14} className="text-muted-foreground shrink-0" />
                      <span>{data.phoneNumber || data.phone || '—'}</span>
                    </a>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Email Address</span>
                    {data.email ? (
                      <a
                        href={`mailto:${data.email}`}
                        className="text-primary hover:underline inline-flex items-center gap-2 text-sm font-medium"
                      >
                        <Mail size={14} className="text-muted-foreground shrink-0" />
                        <span className="truncate">{data.email}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic text-sm">Not provided</span>
                    )}
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Locality / Address</span>
                    <span className="inline-flex items-center gap-2 text-foreground font-medium text-sm">
                      <MapPin size={14} className="text-muted-foreground shrink-0" />
                      <span>{data.locality || data.address || 'Not specified'}</span>
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Card: Audit & Transition History */}
          <Card variant="hover">
            <CardHeader className="border-b border-border py-3.5 px-5">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">Audit History</h3>
                </div>
                <Button variant="ghost" size="xs" onClick={loadAuditHistory} disabled={loadingAudit}>
                  {loadingAudit ? <Loader2 size={12} className="animate-spin mr-1" /> : 'Refresh History'}
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-5">
              {loadingAudit && (
                <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-primary shrink-0" />
                  <span>Loading audit trail...</span>
                </div>
              )}

              {auditError && (
                <div className="p-3 bg-surface-2 rounded-lg border border-border text-xs text-muted-foreground flex items-center gap-2">
                  <AlertCircle size={14} className="text-warning shrink-0" />
                  <span>{auditError}</span>
                </div>
              )}

              {!loadingAudit && !auditError && auditLogs.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No previous status transitions recorded for this enquiry.
                </div>
              )}

              {!loadingAudit && auditLogs.length > 0 && (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3.5 text-xs border-b border-border/50 pb-3.5 last:border-0 last:pb-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 shrink-0 ring-4 ring-primary/10" />
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-medium text-foreground">
                            Status changed: <span className="font-mono text-muted-foreground">{log.previousStatus || 'new'}</span>{' '}
                            <ArrowRight size={11} className="inline mx-1 text-muted-foreground" />{' '}
                            <span className="font-semibold text-primary">{log.newStatus}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {log.changedAt ? new Date(log.changedAt).toLocaleString() : ''}
                          </span>
                        </div>
                        {log.changeReason && (
                          <div className="text-xs text-muted-foreground bg-surface-2 p-2 rounded border border-border/60">
                            <span className="font-semibold text-foreground">Reason:</span> &ldquo;{log.changeReason}&rdquo;
                          </div>
                        )}
                        {log.changedBy && (
                          <div className="text-[11px] text-muted-foreground">
                            Admin: <span className="font-mono text-foreground font-medium">{typeof log.changedBy === 'object' ? log.changedBy?.email || log.changedBy?.id : log.changedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
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
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={saving}
                  className="field__control-select w-full"
                >
                  {STUDENT_ENQUIRY_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Track allocation and student onboarding lifecycle.
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
                    <Loader2 size={16} className="animate-spin mr-1.5" /> Saving Changes...
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
    </div>
  )
}
