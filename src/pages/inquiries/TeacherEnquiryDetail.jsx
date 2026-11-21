import { Alert } from '@/components/ui/Alert'
import { PageLoader, Spinner } from '@/components/ui/Loaders'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Card, CardHeader, CardBody,
  Button, Badge
} from '@/components/ui'
import { ArrowLeft, ChevronLeft, User, Phone, Mail, MapPin, Clock, GraduationCap, Briefcase, Shield, AlertCircle, FileText, History, Save, Download, ArrowRight, Check, X, IndianRupee, Eye, EyeOff, RefreshCw, Copy, KeyRound } from 'lucide-react'
import {
  getTeacherEnquiryById,
  updateTeacherEnquiry,
  downloadTeacherDocument,
  TEACHER_APPLICATION_STATUSES,
  getTeacherStatusOptions
} from '@/services/teacherEnquiryService'
import { fetchEnquiryAuditLog } from '@/services/enquiryAuditService'
import { getAuthUser } from '@/services/apiClient'
import { createTeacherAccount, generatePassword } from '@/services/adminApi'
import { useEnquiryCounts } from '@/context/EnquiryCountContext'
import TeacherEvaluationPanel from '@/pages/admin/TeacherEvaluationPanel'
import { DocumentPreviewModal } from '@/components/uploads/DocumentPreview'
import { resolveDocRef } from '@/components/uploads/docRef'

export default function TeacherEnquiryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { markAsRead } = useEnquiryCounts()
  const markedReadRef = useRef(null)
  const autoReviewRef = useRef(null)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Management controls
  const [selectedStatus, setSelectedStatus] = useState('new')
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewedBy, setReviewedBy] = useState('')

  // Teacher login created when the application is shortlisted
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState(() => generatePassword())
  const [createdCreds, setCreatedCreds] = useState(null) // shown once after creation

  // Action states
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')
  const [downloadingDoc, setDownloadingDoc] = useState('')
  const [previewDoc, setPreviewDoc] = useState(null)

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
        let doc = res?.doc || res

        // Opening a brand-new application means the admin has started reviewing it:
        // move New -> Under Review automatically. Later statuses stay manual.
        if ((doc.applicationStatus || 'new') === 'new' && autoReviewRef.current !== id) {
          autoReviewRef.current = id
          try {
            const reviewer = getAuthUser()?.id
            const upd = await updateTeacherEnquiry(id, {
              applicationStatus: 'under_review',
              reviewedAt: new Date().toISOString(),
              ...(reviewer ? { reviewedBy: Number(reviewer) } : {}),
            })
            doc = upd?.doc || upd || { ...doc, applicationStatus: 'under_review' }
            if (!ignore) setSaveSuccess('Application moved to Under Review automatically.')
          } catch (err) {
            console.error('Auto move to Under Review failed:', err)
          }
        }
        if (ignore) return
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

    // Shortlisting also creates the teacher's dashboard login.
    const needsAccount =
      selectedStatus === 'shortlisted' && data?.applicationStatus !== 'shortlisted' && !data?.teacherUser
    const loginEmail = (accountEmail || data?.email || '').trim()
    if (needsAccount) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
        setSaveError('Enter a valid email address for the teacher login.')
        return
      }
      if (accountPassword.length < 8) {
        setSaveError('The password must be at least 8 characters.')
        return
      }
    }

    setSaving(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      if (needsAccount) {
        const created = await createTeacherAccount(id, { email: loginEmail, password: accountPassword })
        setCreatedCreds({ email: created?.user?.email || loginEmail, password: created?.password || accountPassword, mailSent: Boolean(created?.email?.sent), mailError: created?.email?.error || '' })
      }
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
      <PageLoader label="Loading teacher application details" />
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
  const feeStatus = data.registrationFee?.status || 'pending'
  const feeResolved = feeStatus === 'paid' || feeStatus === 'waived'

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
                  navigate('/admin/teachers')
                }
              }}
            >
              <User size={16} className="mr-1" /> View Teacher Profile
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/inquiries')}>
            <ChevronLeft size={16} className="mr-1" /> Back to List
          </Button>
        </div>
      </header>

      {/* Success / Error Alerts */}
      {saveSuccess && (
        <Alert variant="success" title={saveSuccess} onClose={() => setSaveSuccess('')} />
      )}

      {saveError && (
        <Alert variant="error" title={saveError} onClose={() => setSaveError('')} />
      )}
      <ApplicationFlow status={data.applicationStatus || 'new'} feeStatus={feeStatus} />

      {/* Grid Layout: Main 2/3 + 1/3 columns */}
      <div className="enquiry-detail-layout">
        {/* Left Column (2 Cols): Personal & Professional Side-by-Side, Documents, Audit */}
        <div className="space-y-6">
          {/* Side-by-Side Responsive Grid: Personal Information + Professional Qualifications */}
          <div className="enquiry-cards-row">
            {/* Card: Personal Information */}
            <Card variant="hover" className="h-full flex flex-col">
              <div className="wf-cardhead"><h3><User size={18} />Personal Information</h3></div>
              <dl className="wf-info">
                <div><dt>Full name</dt><dd>{data.fullName}</dd></div>
                <div>
                  <dt>Mobile</dt>
                  <dd>{data.mobileNumber ? <a href={`tel:${data.mobileNumber}`}><Phone size={15} />{data.mobileNumber}</a> : <span className="is-empty">Not provided</span>}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{data.email ? <a href={`mailto:${data.email}`}><Mail size={15} />{data.email}</a> : <span className="is-empty">Not provided</span>}</dd>
                </div>
                <div><dt>Availability</dt><dd><Clock size={15} />{data.preferredAvailability || 'Flexible / Any'}</dd></div>
                <div><dt>Teaching locality</dt><dd><MapPin size={15} />{data.teachingLocality || 'Not specified'}</dd></div>
              </dl>
              {data.applicantNotes && (
                <div className="wf-note">
                  <b>Applicant introduction &amp; notes</b>
                  <p>{data.applicantNotes}</p>
                </div>
              )}
            </Card>

            {/* Card: Professional & Teaching Qualifications */}
            <Card variant="hover" className="h-full flex flex-col">
              <div className="wf-cardhead"><h3><GraduationCap size={18} />Professional Qualifications</h3></div>
              <dl className="wf-info">
                <div><dt>Highest qualification</dt><dd><GraduationCap size={15} />{data.highestQualification || '—'}</dd></div>
                <div><dt>Experience</dt><dd><Briefcase size={15} />{data.teachingExperience || 'Fresher'}</dd></div>
                <div><dt>Primary subject</dt><dd>{data.primarySubject ? <span className="wf-chip">{data.primarySubject}</span> : '—'}</dd></div>
                <div><dt>Class level</dt><dd>{data.classLevel || '—'}</dd></div>
              </dl>
            </Card>
          </div>

          {/* Card: KYC Verification & Uploaded Documents */}
          <Card variant="hover">
            <div className="wf-cardhead"><h3><Shield size={18} />KYC Documents</h3></div>
            <div className="wf-docs">
              {[
                { key: 'aadhaar', label: 'Identity / Aadhaar Card', hint: 'Government identity proof', file: data.aadhaarDocument, name: 'aadhaar_document' },
                { key: 'qualification', label: 'Qualification Certificate', hint: 'Highest degree / certificate proof', file: data.qualificationDocument, name: 'qualification_certificate' },
              ].map((doc) => {
                const cfg = getDocStatusConfig(doc.file)
                return (
                  <div key={doc.key} className="wf-doc">
                    <span className="wf-doc__icon"><FileText size={20} /></span>
                    <div className="wf-doc__text">
                      <strong>{doc.label}</strong>
                      <span>{doc.file ? doc.hint : 'Not uploaded yet'}</span>
                    </div>
                    {doc.file ? (
                      <div className="wf-actions">
                      <Button variant="outline" size="sm" onClick={() => { const r = resolveDocRef(doc.file, doc.label); setPreviewDoc({ url: r.url, name: doc.label, mimeType: r.mimeType }) }}>Preview</Button>
                      <Button variant="outline" size="sm" disabled={downloadingDoc === doc.key} onClick={() => handleDownloadDoc(doc.file, doc.name)}>
                        {downloadingDoc === doc.key ? <Spinner size={14} style={{ marginRight: 6 }} /> : <Download size={14} style={{ marginRight: 6 }} />}
                        Download
                      </Button>
                      </div>
                    ) : (
                      <Badge variant={cfg.pillVariant} size="sm">{cfg.pillText}</Badge>
                    )}
                  </div>
                )
              })}
            </div>
            {!data.aadhaarDocument && !data.qualificationDocument && (
              <div className="wf-note">
                <b>How documents are collected</b>
                <p>After the call, the teacher gets login credentials from the admin team and uploads these documents from their own account.</p>
              </div>
            )}
          </Card>

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
                        <span className="wf-tl-from">{teacherStatusLabel(log.previousStatus || 'new')}</span>
                        <ArrowRight size={13} />
                        <span className="wf-tl-to">{teacherStatusLabel(log.newStatus)}</span>
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
          <TeacherEvaluationPanel
            enquiryId={data.id}
            applicationStatus={data.applicationStatus}
            feeResolved={feeResolved}
            onChanged={loadData}
          />
          {['shortlisted', 'evaluation_completed', 'approved'].includes(data.applicationStatus) && (
            <RegistrationFeeCard
              key={`${data.id}-${feeStatus}`}
              enquiry={data}
              locked={data.applicationStatus === 'approved'}
              onSaved={(doc) => {
                setData(doc)
                setSaveSuccess('Registration fee updated.')
              }}
              onError={(msg) => setSaveError(msg)}
            />
          )}
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
                  {getTeacherStatusOptions(data.applicationStatus || 'new')
                    .filter((st) => st.value !== 'approved' || feeResolved || data.applicationStatus === 'approved')
                    .map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Teacher availability (free / allocated) is tracked separately after approval.
                </span>
              </div>

              {selectedStatus === 'shortlisted' && data.applicationStatus !== 'shortlisted' && !data.teacherUser && (
                <TeacherAccountForm
                  email={accountEmail || data.email || ''}
                  onEmail={setAccountEmail}
                  password={accountPassword}
                  onPassword={setAccountPassword}
                  disabled={saving}
                />
              )}

              {createdCreds && <CredentialsNotice creds={createdCreds} onClose={() => setCreatedCreds(null)} />}

              {data.teacherUser && !createdCreds && (
                <div className="wf-acct wf-acct--done">
                  <KeyRound size={16} />
                  <div>
                    <b>Teacher login created</b>
                    <span>
                      {data.email} {'\u00B7'} credentials email: {data.credentialsEmailStatus === 'sent' ? 'sent' : 'not sent (SMTP not configured or failed)'}
                    </span>
                  </div>
                </div>
              )}

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
                    <Spinner size={16} className="mr-1.5" /> Saving Review...
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
      {previewDoc && <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
    </div>
  )
}

const teacherStatusLabel = (value) =>
  TEACHER_APPLICATION_STATUSES.find((st) => st.value === value)?.label || value || 'New'

const TEACHER_FLOW = [
  { key: 'new', label: 'New' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'payment', label: 'Payment \u20B91,000' },
  { key: 'approved', label: 'Approved' },
]

const FEE_LABELS = { paid: 'Paid', waived: 'Skipped', pending: 'Pending', submitted: 'Submitted' }

/** Lifecycle: New, Under Review, Shortlisted, Registration payment (paid or skipped), Approved. */
function ApplicationFlow({ status, feeStatus }) {
  if (status === 'rejected') {
    return <Alert variant="error" title="Application rejected">This application was rejected. See the status history for the reason.</Alert>
  }
  const rank = { new: 0, under_review: 1, shortlisted: 2, evaluation_completed: 2, approved: 4 }[status] ?? 0
  const feeDone = feeStatus === 'paid' || feeStatus === 'waived'
  const stateOf = (key, i) => {
    if (key === 'payment') {
      if (rank >= 2 && feeDone) return 'done'
      return rank === 2 ? 'active' : 'idle'
    }
    if (key === 'approved') {
      if (status === 'approved') return 'done'
      return rank === 2 && feeDone ? 'active' : 'idle'
    }
    if (key === 'shortlisted') return rank >= 2 ? 'done' : 'idle'
    return rank > i ? 'done' : rank === i ? 'active' : 'idle'
  }
  return (
    <ol className="wf-flow" aria-label="Application progress">
      {TEACHER_FLOW.map((st, i) => {
        const state = stateOf(st.key, i)
        return (
          <li key={st.key}>
            <span className={`wf-step${state === 'active' ? ' is-active' : state === 'done' ? ' is-done' : ''}`}>
              {state === 'done' && <Check size={12} />}
              {st.label}
              {st.key === 'payment' && rank >= 2 && <em>({FEE_LABELS[feeStatus] || 'Pending'})</em>}
            </span>
            {i < TEACHER_FLOW.length - 1 && <ArrowRight size={13} className="wf-step-sep" />}
          </li>
        )
      })}
    </ol>
  )
}

/** Registration fee (\₹1,000): admin marks it Pending, Paid or Skipped before approval. */
function RegistrationFeeCard({ enquiry, locked, onSaved, onError }) {
  const fee = enquiry.registrationFee || {}
  const [status, setStatus] = useState(fee.status === 'submitted' ? 'paid' : fee.status || 'pending')
  const [ref, setRef] = useState(fee.transactionRef || '')
  const [notes, setNotes] = useState(fee.notes || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await updateTeacherEnquiry(enquiry.id, {
        registrationFee: {
          status,
          amount: fee.amount ?? 1000,
          transactionRef: ref.trim(),
          notes: notes.trim(),
          paymentDate: status === 'paid' ? (fee.paymentDate || new Date().toISOString()) : null,
        },
      })
      onSaved(res?.doc || res)
    } catch (err) {
      onError(err.message || 'Could not update the registration fee.')
    } finally {
      setSaving(false)
    }
  }

  // A settled payment is a receipt, not a form: nothing to confirm or edit by hand.
  if (fee.status === 'paid') {
    const online = fee.paymentMethod === 'razorpay'
    const methodLabel = { razorpay: 'Razorpay (online)', upi: 'UPI', bank_transfer: 'Bank transfer', other: 'Other' }[fee.paymentMethod] || 'Marked paid by admin'
    return (
      <Card variant="hover">
        <div className="wf-cardhead">
          <h3><IndianRupee size={18} />Registration Fee</h3>
          <span className="wf-feebadge wf-feebadge--paid">Paid</span>
        </div>
        <div className="wf-feebody">
          <div className="wf-feeamount">
            <small>Amount received</small>
            <b>₹{(fee.amount ?? 1000).toLocaleString('en-IN')}</b>
          </div>
          <div className="wf-paystate is-ok">
            <Check size={20} />
            <div>
              <b>{online ? 'Paid securely online. Confirmed automatically' : 'Payment received'}</b>
              <span>
                {methodLabel}
                {fee.paymentDate ? ` · ${new Date(fee.paymentDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : ''}
              </span>
            </div>
          </div>
          {fee.expiresAt && (
            <dl className="wf-info" style={{ padding: 0 }}>
              <div><dt>Valid until</dt><dd>{new Date(fee.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</dd></div>
            </dl>
          )}
          {fee.transactionRef && (
            <dl className="wf-info" style={{ padding: 0 }}>
              <div><dt>{online ? 'Payment ID' : 'Reference'}</dt><dd style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13 }}>{fee.transactionRef}</dd></div>
            </dl>
          )}
          {!locked && <p className="wf-muted" style={{ margin: 0 }}>Nothing to verify. You can now approve this application.</p>}
        </div>
      </Card>
    )
  }

  return (
    <Card variant="hover">
      <div className="wf-cardhead">
        <h3><IndianRupee size={18} />Registration Fee</h3>
        <span className={`wf-feebadge wf-feebadge--${fee.status || 'pending'}`}>{FEE_LABELS[fee.status || 'pending']}</span>
      </div>
      <div className="wf-feebody">
        <div className="wf-feeamount">
          <small>Amount</small>
          <b>₹{(fee.amount ?? 1000).toLocaleString('en-IN')}</b>
        </div>
        {fee.status === 'submitted' && (
          <div className="wf-acct wf-acct--warn">
            <div className="wf-acct__head">
              <IndianRupee size={16} />
              <div>
                <b>Teacher says they paid</b>
                <span>
                  {fee.paymentMethod === 'upi' ? 'UPI' : fee.paymentMethod === 'bank_transfer' ? 'Bank transfer' : 'Other'} {'\u00B7'} ref <strong>{fee.transactionRef}</strong>. Check your bank/UPI, then mark Paid.
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="wf-seg" role="radiogroup" aria-label="Registration fee status">
          {[['pending', 'Pending'], ['paid', 'Paid'], ['waived', 'Skip']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={status === value}
              disabled={locked || saving}
              className={status === value ? 'is-on' : ''}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {status === 'paid' && (
          <input className="input field__input w-full" placeholder="Transaction / receipt reference (optional)" maxLength={200} value={ref} onChange={(e) => setRef(e.target.value)} disabled={locked || saving} />
        )}
        <textarea className="input field__input w-full" rows={2} placeholder={status === 'waived' ? 'Why is the fee skipped? (optional)' : 'Notes (optional)'} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={locked || saving} />
        {!locked && (
          <Button variant="primary" className="w-full" onClick={save} disabled={saving || (status === (fee.status || 'pending') && ref === (fee.transactionRef || '') && notes === (fee.notes || ''))}>
            {saving ? <Spinner size={15} /> : 'Save fee status'}
          </Button>
        )}
        {fee.status !== 'paid' && fee.status !== 'waived' && !locked && (
          <p className="wf-muted" style={{ margin: 0 }}>Approval unlocks once the fee is marked Paid or Skipped.</p>
        )}
      </div>
    </Card>
  )
}

/** Shown when "Shortlisted" is selected: login email + random or manual password for the teacher dashboard. */
function TeacherAccountForm({ email, onEmail, password, onPassword, disabled }) {
  const [show, setShow] = useState(true)
  return (
    <div className="wf-acct">
      <div className="wf-acct__head">
        <KeyRound size={16} />
        <div>
          <b>Create teacher login</b>
          <span>Created when you save. The teacher uses it to sign in to their dashboard; the credentials are emailed to them.</span>
        </div>
      </div>
      <label className="wf-field">
        <span className="wf-field__label">Login email</span>
        <input type="email" className="input field__input w-full" value={email} onChange={(e) => onEmail(e.target.value)} disabled={disabled} />
      </label>
      <label className="wf-field">
        <span className="wf-field__label">Password</span>
        <div className="wf-pw">
          <input type={show ? 'text' : 'password'} className="input field__input w-full" value={password} onChange={(e) => onPassword(e.target.value)} disabled={disabled} autoComplete="off" spellCheck={false} />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} disabled={disabled}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          <button type="button" onClick={() => onPassword(generatePassword())} aria-label="Generate a new random password" title="Generate random password" disabled={disabled}><RefreshCw size={16} /></button>
        </div>
        <span className="wf-field__hint">Random alphanumeric by default. You can type your own (min 8 characters).</span>
      </label>
    </div>
  )
}

/** One-time credentials summary after the account is created. */
function CredentialsNotice({ creds, onClose }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Email: ${creds.email}\nPassword: ${creds.password}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard may be unavailable */
    }
  }
  return (
    <div className={`wf-acct ${creds.mailSent ? 'wf-acct--done' : 'wf-acct--warn'}`}>
      <div className="wf-acct__head">
        <Check size={16} />
        <div>
          <b>{creds.mailSent ? 'Account created and credentials emailed' : 'Account created. Email not sent'}</b>
          <span>{creds.mailSent ? `Sent to ${creds.email}.` : 'SMTP is not set up yet, so share these credentials with the teacher yourself. They are shown only now.'}</span>
        </div>
        <button type="button" className="wf-acct__x" onClick={onClose} aria-label="Dismiss"><X size={14} /></button>
      </div>
      <div className="wf-acct__creds">
        <div><small>Email</small><code>{creds.email}</code></div>
        <div><small>Password</small><code>{creds.password}</code></div>
        <button type="button" onClick={copy}><Copy size={14} />{copied ? 'Copied' : 'Copy'}</button>
      </div>
    </div>
  )
}
