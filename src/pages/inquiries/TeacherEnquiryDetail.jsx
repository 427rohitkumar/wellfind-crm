import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Card, CardHeader, CardBody,
  Button, Badge
} from '@/components/ui'
import {
  ArrowLeft, ChevronLeft, User, Phone, Mail, MapPin, Clock,
  GraduationCap, Briefcase, Shield, AlertCircle, CheckCircle2,
  FileText, History, Save, Download, Loader2, ArrowRight
} from 'lucide-react'
import {
  getTeacherEnquiryById,
  updateTeacherEnquiry,
  downloadTeacherDocument,
  TEACHER_APPLICATION_STATUSES
} from '@/services/teacherEnquiryService'
import { fetchEnquiryAuditLog } from '@/services/enquiryAuditService'
import { getAuthUser } from '@/services/apiClient'
import { useEnquiryCounts } from '@/context/EnquiryCountContext'
import TeacherEvaluationPanel from '@/pages/admin/TeacherEvaluationPanel'

export default function TeacherEnquiryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { markAsRead } = useEnquiryCounts()
  const markedReadRef = useRef(null)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Management controls
  const [selectedStatus, setSelectedStatus] = useState('new')
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewedBy, setReviewedBy] = useState('')

  // Action states
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')
  const [downloadingDoc, setDownloadingDoc] = useState('')

  // Confirmation modal/state for rejection
  const [showConfirmReject, setShowConfirmReject] = useState(false)

  // Audit history
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [auditError, setAuditError] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getTeacherEnquiryById(id)
      const doc = res?.doc || res
      setData(doc)
      setSelectedStatus(doc.applicationStatus || 'new')
      setAdminNotes(doc.adminNotes || '')

      const currentUser = getAuthUser()
      setReviewedBy(
        typeof doc.reviewedBy === 'object' && doc.reviewedBy?.id
          ? String(doc.reviewedBy.id)
          : doc.reviewedBy ? String(doc.reviewedBy) : currentUser?.id ? String(currentUser.id) : ''
      )
    } catch (err) {
      setError(err.message || 'Failed to load teacher application.')
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadAuditHistory = useCallback(async () => {
    setLoadingAudit(true)
    setAuditError(null)
    try {
      const res = await fetchEnquiryAuditLog({ enquiryType: 'teacher', enquiryId: id })
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
        const res = await getTeacherEnquiryById(id)
        if (ignore) return
        const doc = res?.doc || res
        setData(doc)
        setSelectedStatus(doc.applicationStatus || 'new')
        setAdminNotes(doc.adminNotes || '')

        const currentUser = getAuthUser()
        setReviewedBy(
          typeof doc.reviewedBy === 'object' && doc.reviewedBy?.id
            ? String(doc.reviewedBy.id)
            : doc.reviewedBy ? String(doc.reviewedBy) : currentUser?.id ? String(currentUser.id) : ''
        )

        // Persistent Read Tracking: Mark as read if currently unread
        if (markedReadRef.current !== id) {
          markedReadRef.current = id
          if (!doc.markAsRead) {
            markAsRead('teacher', id)
              .then((readRes) => {
                if (readRes?.doc && !ignore) {
                  setData((prev) => (prev ? { ...prev, markAsRead: true } : prev))
                }
              })
              .catch((err) => {
                console.error('Failed to mark teacher enquiry as read:', err)
              })
          }
        }
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load teacher application.')
      } finally {
        if (!ignore) setLoading(false)
      }

      try {
        const auditRes = await fetchEnquiryAuditLog({ enquiryType: 'teacher', enquiryId: id })
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

    // Validation: if status is rejected, require a non-empty reason
    if (selectedStatus === 'rejected') {
      if (!showConfirmReject && data?.applicationStatus !== 'rejected') {
        setShowConfirmReject(true)
        return
      }
      if (!rejectionReason.trim()) {
        setSaveError('A valid rejection reason is mandatory when rejecting a teacher application.')
        return
      }
    }

    setSaving(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      const payload = {
        applicationStatus: selectedStatus,
        adminNotes: adminNotes.trim(),
        reviewedAt: new Date().toISOString(),
      }

      if (rejectionReason.trim()) {
        payload.changeReason = rejectionReason.trim()
        const reasonNote = `[Rejection Note]: ${rejectionReason.trim()}`
        payload.adminNotes = payload.adminNotes
          ? `${payload.adminNotes}\n${reasonNote}`
          : reasonNote
      }

      if (reviewedBy.trim()) {
        const parsed = Number(reviewedBy.trim())
        payload.reviewedBy = isNaN(parsed) ? reviewedBy.trim() : parsed
      }

      const res = await updateTeacherEnquiry(id, payload)
      const updated = res?.doc || res
      setData(updated)
      if (selectedStatus === 'approved') {
        setSaveSuccess('Teacher application approved! Corresponding teacher profile has been created in the Teachers module.')
      } else {
        setSaveSuccess(`Status successfully updated to ${selectedStatus.replace(/_/g, ' ').toUpperCase()}`)
      }
      setShowConfirmReject(false)
      setRejectionReason('')

      // Refresh audit logs
      loadAuditHistory()
    } catch (err) {
      setSaveError(err.message || 'Failed to update teacher application.')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadDoc = async (docRef, label) => {
    if (!docRef) return
    try {
      setDownloadingDoc(label)
      const { objectUrl, filename } = await downloadTeacherDocument(docRef)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename || `${label}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    } catch (err) {
      alert(err.message || 'Failed to securely download document.')
    } finally {
      setDownloadingDoc('')
    }
  }

  const getStatusBadge = (statusValue) => {
    const config = TEACHER_APPLICATION_STATUSES.find((s) => s.value === statusValue) || {
      label: statusValue || 'New',
      variant: 'info',
    }
    return (
      <Badge variant={config.variant} size="lg" dot>
        {config.label}
      </Badge>
    )
  }

  const getDocStatusConfig = (docRef) => {
    if (!docRef) {
      return {
        statusLabel: 'Not Provided',
        statusVariant: 'neutral',
        dot: false,
        pillText: 'Pending Upload',
        pillVariant: 'neutral',
        description: 'No document file uploaded by applicant',
      }
    }

    const explicitStatus =
      typeof docRef === 'object'
        ? docRef.status || docRef.verificationStatus || docRef.reviewStatus
        : null

    if (explicitStatus === 'verified' || explicitStatus === 'approved') {
      return {
        statusLabel: 'Verified',
        statusVariant: 'success',
        dot: true,
        pillText: 'Verified File',
        pillVariant: 'success',
        description: 'Official verified document record',
      }
    }
    if (explicitStatus === 'rejected' || explicitStatus === 'failed') {
      return {
        statusLabel: 'Rejected',
        statusVariant: 'danger',
        dot: true,
        pillText: 'Rejected File',
        pillVariant: 'danger',
        description: 'Document rejected during verification',
      }
    }
    if (explicitStatus === 'under_review' || explicitStatus === 'pending') {
      return {
        statusLabel: 'Under Review',
        statusVariant: 'warning',
        dot: true,
        pillText: 'Under Review',
        pillVariant: 'warning',
        description: 'Document uploaded and awaiting review',
      }
    }

    return {
      statusLabel: 'Available',
      statusVariant: 'success',
      dot: true,
      pillText: 'Available File',
      pillVariant: 'success',
      description: 'Document uploaded and available for verification',
    }
  }

  if (loading) {
    return (
      <div className="page__section py-16 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <div className="text-sm font-medium text-muted-foreground">Loading teacher application details...</div>
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
            <div className="text-lg font-semibold text-foreground">Application Not Found</div>
            <p className="text-sm text-muted-foreground max-w-md">
              {error || `Teacher application #${id} could not be retrieved or does not exist.`}
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
              Teacher Application #{data.id}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page__title">{data.fullName}</h1>
            {getStatusBadge(data.applicationStatus)}
          </div>
          <p className="page__description">
            Submitted {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'recently'} &bull; Review credentials, verify KYC files, and track decision audits.
          </p>
        </div>

        <div className="page__action flex items-center gap-2">
          {data.applicationStatus === 'approved' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const profileId = typeof data.teacherProfile === 'object' ? data.teacherProfile?.id : data.teacherProfile
                if (profileId) {
                  navigate(`/admin/teachers/${profileId}`)
                } else {
                  navigate('/teachers')
                }
              }}
            >
              <User size={16} className="mr-1" /> View Teacher Profile
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
        {/* Left Column (2 Cols): Personal & Professional Side-by-Side, Documents, Audit */}
        <div className="space-y-6">
          {/* Side-by-Side Responsive Grid: Personal Information + Professional Qualifications */}
          <div className="enquiry-cards-row">
            {/* Card: Personal Information */}
            <Card variant="hover" className="h-full flex flex-col">
              <CardHeader className="border-b border-border py-3.5 px-5">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">Personal Information</h3>
                </div>
              </CardHeader>
              <CardBody className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3.5 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Full Name</span>
                    <span className="font-semibold text-foreground text-sm block">{data.fullName}</span>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Mobile Number</span>
                    <a
                      href={`tel:${data.mobileNumber}`}
                      className="font-mono text-sm text-primary hover:underline inline-flex items-center gap-2 font-medium"
                    >
                      <Phone size={14} className="text-muted-foreground shrink-0" />
                      <span>{data.mobileNumber}</span>
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
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Preferred Availability</span>
                    <span className="inline-flex items-center gap-2 text-foreground text-sm">
                      <Clock size={14} className="text-muted-foreground shrink-0" />
                      <span>{data.preferredAvailability || 'Flexible / Any'}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Teaching Locality / Areas Covered</span>
                    <span className="inline-flex items-center gap-2 text-foreground font-medium text-sm">
                      <MapPin size={14} className="text-muted-foreground shrink-0" />
                      <span>{data.teachingLocality || 'Not specified'}</span>
                    </span>
                  </div>
                </div>

                {data.applicantNotes && (
                  <div className="bg-surface-2 p-3.5 rounded-lg border border-border mt-2">
                    <span className="text-xs font-semibold text-muted-foreground block mb-1">Applicant Introduction & Notes</span>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{data.applicantNotes}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Card: Professional & Teaching Qualifications */}
            <Card variant="hover" className="h-full flex flex-col">
              <CardHeader className="border-b border-border py-3.5 px-5">
                <div className="flex items-center gap-2">
                  <GraduationCap size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">Professional Qualifications</h3>
                </div>
              </CardHeader>
              <CardBody className="p-5 flex-1 flex flex-col justify-start space-y-4">
                <div className="space-y-3.5 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Highest Qualification</span>
                    <div className="inline-flex items-center gap-2 text-foreground font-semibold text-sm">
                      <GraduationCap size={14} className="text-muted-foreground shrink-0" />
                      <span>{data.highestQualification || '—'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Teaching Experience</span>
                    <div className="inline-flex items-center gap-2 text-foreground text-sm">
                      <Briefcase size={14} className="text-muted-foreground shrink-0" />
                      <span>{data.teachingExperience || 'Fresher'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Primary Subject</span>
                    <span className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary font-semibold inline-block">
                      {data.primarySubject}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1 font-medium">Class / Level Taught</span>
                    <span className="font-medium text-foreground text-sm block">{data.classLevel || '—'}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Card: KYC Verification & Uploaded Documents */}
          <Card variant="hover">
            <CardHeader className="border-b border-border py-3.5 px-5">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-primary shrink-0" />
                <h3 className="card__title">KYC Documents & Verification</h3>
              </div>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              {/* Aadhaar Document Card */}
              {(() => {
                const docConfig = getDocStatusConfig(data.aadhaarDocument)
                return (
                  <div className="doc-row-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <FileText size={20} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">Identity / Aadhaar Card</span>
                          <Badge variant={docConfig.statusVariant} size="sm" dot={docConfig.dot}>
                            {docConfig.statusLabel}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground block">
                          {data.aadhaarDocument
                            ? 'Official government identity proof document'
                            : docConfig.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                      {data.aadhaarDocument ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={downloadingDoc === 'aadhaar'}
                          onClick={() => handleDownloadDoc(data.aadhaarDocument, 'aadhaar_document')}
                        >
                          {downloadingDoc === 'aadhaar' ? (
                            <Loader2 size={14} className="animate-spin mr-1.5" />
                          ) : (
                            <Download size={14} className="mr-1.5" />
                          )}
                          <span>Download File</span>
                        </Button>
                      ) : (
                        <Badge variant={docConfig.pillVariant} size="sm">
                          {docConfig.pillText}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })()}

              {/* Qualification Document Card */}
              {(() => {
                const docConfig = getDocStatusConfig(data.qualificationDocument)
                return (
                  <div className="doc-row-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-10 h-10 rounded-lg bg-info/10 text-info flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                        <FileText size={20} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">Qualification Certificate</span>
                          <Badge variant={docConfig.statusVariant} size="sm" dot={docConfig.dot}>
                            {docConfig.statusLabel}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground block">
                          {data.qualificationDocument
                            ? 'Highest educational degree / certificate proof'
                            : docConfig.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                      {data.qualificationDocument ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={downloadingDoc === 'qualification'}
                          onClick={() => handleDownloadDoc(data.qualificationDocument, 'qualification_certificate')}
                        >
                          {downloadingDoc === 'qualification' ? (
                            <Loader2 size={14} className="animate-spin mr-1.5" />
                          ) : (
                            <Download size={14} className="mr-1.5" />
                          )}
                          <span>Download File</span>
                        </Button>
                      ) : (
                        <Badge variant={docConfig.pillVariant} size="sm">
                          {docConfig.pillText}
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })()}
            </CardBody>
          </Card>

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
                  No previous status transitions recorded for this application.
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
                            <ArrowRight size={11} className="inline mx-1 text-muted-foreground shrink-0" />{' '}
                            <span className="font-semibold text-primary">{log.newStatus}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {log.changedAt ? new Date(log.changedAt).toLocaleString() : ''}
                          </span>
                        </div>
                        {log.changeReason && (
                          <div className="text-xs text-muted-foreground bg-surface-2 p-2 rounded-md border border-border">
                            <span className="font-semibold text-foreground">Reason:</span> &ldquo;{log.changeReason}&rdquo;
                          </div>
                        )}
                        {log.changedBy && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                            <User size={12} className="text-muted-foreground shrink-0" />
                            <span>Admin ID:</span>
                            <span className="font-mono text-foreground font-medium">
                              {typeof log.changedBy === 'object' ? log.changedBy?.email || log.changedBy?.id : log.changedBy}
                            </span>
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
          <TeacherEvaluationPanel
            enquiryId={data.id}
            applicationStatus={data.applicationStatus}
            onChanged={loadData}
          />
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-surface-2 border-b border-border py-3.5 px-5">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-primary shrink-0" />
                <h3 className="card__title">Application Review</h3>
              </div>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              {/* Status Select */}
              <div className="field">
                <label className="field__label text-xs font-semibold block mb-1">
                  Application Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  disabled={saving}
                  className="field__control-select w-full"
                >
                  {TEACHER_APPLICATION_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Teacher availability (free / allocated) is tracked separately after approval.
                </span>
              </div>

              {/* Confirm Rejection Confirmation Warning */}
              {(showConfirmReject || selectedStatus === 'rejected') && (
                <div className="p-3.5 rounded-lg bg-danger/10 border border-danger/30 text-xs space-y-2">
                  <div className="font-semibold text-danger flex items-center gap-1.5">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>Mandatory Rejection Reason</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Please provide a clear reason for rejecting this teacher application.
                  </p>
                  <div>
                    <input
                      type="text"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Incomplete credentials or experience requirements not met"
                      className="field__control-input text-xs"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Internal Admin Review Notes */}
              <div className="field">
                <label className="field__label text-xs font-semibold block mb-1">
                  Reviewer Notes
                </label>
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={saving}
                  placeholder="Record verification notes, interview impressions, or qualifications check..."
                  className="field__control-textarea text-xs"
                />
              </div>

              {/* Reviewer Account Informational Row without rectangular border */}
              <div className="field">
                <span className="field__label text-xs font-semibold block mb-1">
                  Reviewer Account
                </span>
                <div className="reviewer-info-row">
                  <div className="flex items-center gap-2.5 truncate">
                    <User size={15} className="text-muted-foreground shrink-0" />
                    <span className="font-mono text-foreground font-medium truncate text-xs">
                      {currentUser?.email || currentUser?.name || `Admin #${reviewedBy || '1'}`}
                    </span>
                  </div>
                  <Badge variant="neutral" size="sm" className="shrink-0 font-normal">
                    Super Admin
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Authenticated administrator account recorded in the decision audit trail.
                </span>
              </div>

              {/* Save Button */}
              <Button
                variant={selectedStatus === 'rejected' ? 'danger' : 'primary'}
                className="w-full mt-2"
                onClick={handleStatusUpdate}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-1.5" /> Saving Review...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1.5" /> Save Application Review
                  </>
                )}
              </Button>
            </CardBody>
          </Card>

          {/* Meta card */}
          <Card variant="hover">
            <CardBody className="py-4 px-5 text-xs text-muted-foreground space-y-2.5">
              <div className="flex justify-between items-center">
                <span>Application ID</span>
                <span className="font-mono text-foreground font-semibold">#{data.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Submitted At</span>
                <span className="text-foreground">
                  {data.createdAt ? new Date(data.createdAt).toLocaleString() : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Reviewed</span>
                <span className="text-foreground">
                  {data.reviewedAt ? new Date(data.reviewedAt).toLocaleString() : 'Pending review'}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
