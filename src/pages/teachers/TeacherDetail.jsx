import { Alert } from '@/components/ui/Alert'
import { PageLoader, Spinner } from '@/components/ui/Loaders'
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Card, CardHeader, CardBody,
  Button, Badge
} from '@/components/ui'
import { ArrowLeft, ChevronLeft, User, Users, Phone, Mail, MapPin, Clock, DollarSign, GraduationCap, Briefcase, FileText, Shield, AlertCircle, Calendar, Edit, Save, X, Loader2, Download, Check, ShieldCheck, Info } from 'lucide-react'
import { getTeacherById, updateTeacher, downloadTeacherDocument } from '@/services/teacherService'
import { DocumentPreviewModal } from '@/components/uploads/DocumentPreview'
import { resolveDocRef } from '@/components/uploads/docRef'
import { MyDocuments } from '@/components/uploads/MyDocuments'
import TeacherAdminControls from '@/pages/admin/TeacherAdminControls'
import { TeacherStatusBadge } from './TeacherStatusBadge'
import {
  REGISTRATION_FEE_CONFIG,
  KYC_CONFIG,
  ALLOCATION_CONFIG,
  ACCOUNT_CONFIG
} from './teachersSampleData'
import { getAuthUser } from '@/services/apiClient'
import { peek, revalidate } from '@/lib/queryClient'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'

export default function TeacherDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tab state — General selected by default
  const [activeTab, setActiveTab] = useState('general')

  // Per-tab async data states (registration & teaching history are co-loaded
  // with the teacher profile; flags kept for lifecycle/loading parity)
  const [registrationHistoryLoading, setRegistrationHistoryLoading] = useState(false)
  const [registrationHistoryError, setRegistrationHistoryError] = useState(null)
  const [teachingHistoryLoading, setTeachingHistoryLoading] = useState(false)
  const [teachingHistoryError, setTeachingHistoryError] = useState(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')
  const [downloadingDoc, setDownloadingDoc] = useState(null)

  const loadTeacher = useCallback(async () => {
    const cacheKey = ['teacher-detail', id]
    const hasCache = peek(cacheKey) !== undefined
    if (!hasCache) setLoading(true) // revisit: paint from cache below, refresh quietly
    setError(null)
    try {
            const apply = (data) => {
        if (!data) {
          setError(`Teacher with ID "${id}" could not be found.`)
        } else {
          setTeacher(data)
          setFormData({
            name: data.name || '',
            email: data.email || '',
            mobile: data.mobile || '',
            primarySubject: data.primarySubject || '',
            qualification: data.qualification || '',
            experienceYears: data.experienceYears || 0,
            classLevels: data.classLevels || '',
            locality: data.locality || '',
            availability: data.availability || '',
            allocationStatus: data.studentAllocation?.status || 'unallocated',
            accountStatus: data.account?.status || 'active',
            adminNotes: data.kyc?.reviewNotes || data.applicantNotes || '',
          })
        }
        }
      const cached = peek(cacheKey)
      if (cached !== undefined) {
        apply(cached)
        setLoading(false)
        revalidate(cacheKey, async () => (await getTeacherById(id)) ?? null).then((fresh) => { if (JSON.stringify(fresh) !== JSON.stringify(cached)) apply(fresh) }).catch(() => {})
      } else {
        apply(await revalidate(cacheKey, async () => (await getTeacherById(id)) ?? null))
      }
    } catch (err) {
      setError(err.message || 'Failed to load teacher profile details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadTeacher()
    }
  }, [id, loadTeacher])

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()

    const errors = {}
    if (!formData.name?.trim()) errors.name = 'Teacher name is required'
    if (!formData.mobile?.trim()) errors.mobile = 'Mobile number is required'
    if (!formData.primarySubject?.trim()) errors.primarySubject = 'Primary subject is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSaving(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      const updatePayload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        primarySubject: formData.primarySubject.trim(),
        qualification: formData.qualification.trim(),
        experienceYears: Number(formData.experienceYears) || 0,
        classLevels: formData.classLevels.trim(),
        locality: formData.locality.trim(),
        availability: formData.availability.trim(),
        studentAllocation: {
          ...teacher.studentAllocation,
          status: formData.allocationStatus,
          studentsSummary: formData.allocationStatus === 'allocated' ? 'Assigned to Student' : 'Unallocated (Free)',
        },
        account: {
          ...teacher.account,
          status: formData.accountStatus,
        },
        adminNotes: formData.adminNotes.trim(),
      }

      const updated = await updateTeacher(id, updatePayload)
      setTeacher(updated)
      setIsEditing(false)
      setSaveSuccess('Teacher profile successfully updated.')
    } catch (err) {
      setSaveError(err.message || 'Failed to update teacher profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (teacher) {
      setFormData({
        name: teacher.name || '',
        email: teacher.email || '',
        mobile: teacher.mobile || '',
        primarySubject: teacher.primarySubject || '',
        qualification: teacher.qualification || '',
        experienceYears: teacher.experienceYears || 0,
        classLevels: teacher.classLevels || '',
        locality: teacher.locality || '',
        availability: teacher.availability || '',
        allocationStatus: teacher.studentAllocation?.status || 'unallocated',
        accountStatus: teacher.account?.status || 'active',
        adminNotes: teacher.kyc?.reviewNotes || teacher.applicantNotes || '',
      })
    }
    setFormErrors({})
    setSaveError('')
    setIsEditing(false)
  }

  const [previewDoc, setPreviewDoc] = useState(null)
  const previewKyc = (ref, name) => { const r = resolveDocRef(ref, name); setPreviewDoc({ url: r.url, name, mimeType: r.mimeType }) }

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
      alert(err.message || 'Failed to download verification document.')
    } finally {
      setDownloadingDoc(null)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'TC'
    return name
      .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  if (loading) {
    return (
      <PageLoader label="Loading teacher profile details" />
    )
  }

  if (error || !teacher) {
    return (
      <div className="page__section max-w-2xl mx-auto py-8">
        <Card className="border-danger/30">
          <CardBody className="py-12 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <div className="text-lg font-semibold text-foreground">Teacher Record Not Found</div>
            <p className="text-sm text-muted-foreground max-w-md">
              {error || `Teacher #${id} could not be retrieved from active records.`}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Button variant="outline" onClick={() => navigate('/admin/teachers')}>
                <ArrowLeft size={16} /> Back to Teachers
              </Button>
              <Button variant="primary" onClick={loadTeacher}>
                Retry
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  const currentUser = getAuthUser()

  /* Registration History tab data — derived from the single current
     registration fee record on the teacher profile. No separate payment-history
     endpoint exists in the backend, so we display the current record only and
     never invent historical payments. */
  const registrationRecords = teacher?.registrationFee
    ? [
        {
          id: `${teacher.id}-registration`,
          academicYear: teacher.registrationFee.year || '2026–2027',
          amount: Number(teacher.registrationFee.amount ?? 1000),
          currency: teacher.registrationFee.currency || 'INR',
          paymentDate: teacher.registrationFee.paymentDate || 'Pending',
          transactionRef: teacher.registrationFee.transactionRef || 'None',
          status: teacher.registrationFee.status || 'pending',
          paymentMethod: teacher.registrationFee.paymentMethod || '—',
        },
      ]
    : []

  /* Teaching History tab data — current student allocations persisted on the
     teacher profile. The backend does not store allocation start/end dates or
     completion history, so only current allocations are shown. */
  const teachingHistoryRecords = teacher?.studentAllocation?.students ?? []

  const feeBadgeVariant = (status) => {
    switch (status) {
      case 'paid':
      case 'successful':
        return 'success'
      case 'failed':
        return 'danger'
      case 'pending':
        return 'warning'
      case 'waived':
        return 'info'
      default:
        return 'neutral'
    }
  }

  const renderRegistrationHistoryTab = () => {
    if (registrationHistoryLoading) {
      return (
        <div className="page__section max-w-2xl mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <div className="text-sm font-medium text-muted-foreground">
            Loading registration history…
          </div>
        </div>
      )
    }
    if (registrationHistoryError) {
      return (
        <div className="page__section max-w-2xl mx-auto py-8">
          <Card className="border-danger/30">
            <CardBody className="py-12 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <div className="text-lg font-semibold text-foreground">
                Unable to load registration history
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                {registrationHistoryError.message ||
                  'Registration fee records could not be retrieved.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => {
                setRegistrationHistoryError(null)
                setRegistrationHistoryLoading(true)
                setTimeout(() => setRegistrationHistoryLoading(false), 500)
              }}>
                Retry
              </Button>
            </CardBody>
          </Card>
        </div>
      )
    }
    if (registrationRecords.length === 0) {
      return (
        <div className="page__section max-w-2xl mx-auto py-8">
          <Card variant="hover">
            <CardBody className="py-12 text-center flex flex-col items-center gap-4">
              <DollarSign size={32} className="text-muted-foreground shrink-0 mb-2 opacity-60" />
              <h3 className="text-base font-medium text-foreground">
                No registration fee records
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                This teacher has no registration fee payment on record.
              </p>
            </CardBody>
          </Card>
        </div>
      )
    }
    return (
      <div className="page__section teacher-registration-history py-8">
        <div className="card teacher-registration-history__card">
          <div className="card__header teacher-registration-history__header border-b border-border">
            <div className="flex items-start gap-3">
              <DollarSign size={18} className="text-success shrink-0" />
              <div>
                <h3 className="card__title">Registration Fee History</h3>
                <p className="teacher-registration-history__description">
                  Payment records sourced from the teacher profile. Newest first.
                </p>
              </div>
            </div>
          </div>
          <div className="card__body teacher-registration-history__body">
            <div className="teacher-registration-history__table-wrap" role="region" aria-label="Registration fee history table" tabIndex="0">
              <table className="teacher-registration-history__table">
                <colgroup>
                  <col className="teacher-registration-history__column--year" />
                  <col className="teacher-registration-history__column--amount" />
                  <col className="teacher-registration-history__column--status" />
                  <col className="teacher-registration-history__column--date" />
                  <col className="teacher-registration-history__column--reference" />
                  <col className="teacher-registration-history__column--method" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Academic Year</th>
                    <th scope="col" className="teacher-registration-history__numeric">Fee Amount</th>
                    <th scope="col">Payment Status</th>
                    <th scope="col">Payment Date</th>
                    <th scope="col">Transaction Reference</th>
                    <th scope="col">Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  {[...registrationRecords]
                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                    .map((record) => (
                      <tr key={record.id}>
                        <td className="teacher-registration-history__year">{record.academicYear}</td>
                        <td className="teacher-registration-history__amount">{`${record.currency === 'INR' ? '₹' : ''}${record.amount.toLocaleString('en-IN')}`}</td>
                        <td className="teacher-registration-history__status">
                          <Badge variant={feeBadgeVariant(record.status)} size="sm">
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </Badge>
                        </td>
                        <td>{record.paymentDate}</td>
                        <td>
                          <span className="teacher-registration-history__reference" title={record.transactionRef}>
                            {record.transactionRef}
                          </span>
                        </td>
                        <td className="text-muted-foreground">{record.paymentMethod}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="teacher-registration-history__notice">
              <Info size={16} aria-hidden="true" />
              <p>
                Only the current registration fee record is stored by the backend. No historical payment records are available.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTeachingHistoryTab = () => {
    if (teachingHistoryLoading) {
      return (
        <div className="page__section max-w-2xl mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <div className="text-sm font-medium text-muted-foreground">
            Loading teaching history…
          </div>
        </div>
      )
    }
    if (teachingHistoryError) {
      return (
        <div className="page__section max-w-2xl mx-auto py-8">
          <Card className="border-danger/30">
            <CardBody className="py-12 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <div className="text-lg font-semibold text-foreground">
                Unable to load teaching history
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                {teachingHistoryError.message ||
                  'Teaching allocation records could not be retrieved.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => {
                setTeachingHistoryError(null)
                setTeachingHistoryLoading(true)
                setTimeout(() => setTeachingHistoryLoading(false), 500)
              }}>
                Retry
              </Button>
            </CardBody>
          </Card>
        </div>
      )
    }
    if (teachingHistoryRecords.length === 0) {
      return (
        <div className="page__section max-w-2xl mx-auto py-8">
          <Card variant="hover">
            <CardBody className="py-12 text-center flex flex-col items-center gap-4">
              <Users size={32} className="text-muted-foreground shrink-0 mb-2 opacity-60" />
              <h3 className="text-base font-medium text-foreground">
                No teaching allocations on record
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                This teacher is not currently allocated to any students. The
                backend tracks current allocations but does not store
                start/end dates or completed teaching sessions, so a full
                teaching history is not available.
              </p>
            </CardBody>
          </Card>
        </div>
      )
    }
    return (
      <div className="page__section py-8">
        <div className="card">
          <div className="card__header border-b border-border py-4 px-6">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-primary shrink-0" />
              <h3 className="card__title">Teaching History</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current student allocations sourced from the teacher profile.
            </p>
          </div>
          <div className="card__body p-0">
            <div className="overflow-x-auto border-b border-border">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-2/50">
                    <th className="px-6 py-3 text-muted-foreground font-medium">Student</th>
                    <th className="px-6 py-3 text-muted-foreground font-medium">Class / Level</th>
                    <th className="px-6 py-3 text-muted-foreground font-medium">Subject</th>
                    <th className="px-6 py-3 text-muted-foreground font-medium">Allocation Date</th>
                    <th className="px-6 py-3 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teachingHistoryRecords.map((student) => (
                    <tr key={`${teacher.id}-${student.name}`} className="border-b border-border hover:bg-surface-2/50 transition-colors">
                      <td className="px-6 py-4 text-foreground font-medium">{student.name || 'Authorized Student'}</td>
                      <td className="px-6 py-4 text-foreground">{student.class || '—'}</td>
                      <td className="px-6 py-4 text-foreground">{student.subject || '—'}</td>
                      <td className="px-6 py-4 text-foreground">{teacher.studentAllocation?.allocationDate || '—'}</td>
                      <td className="px-6 py-4"><Badge variant="success" size="sm">Current</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 px-6 py-3 text-xs text-muted-foreground border-t border-border">
              Allocations shown are current assignments. The backend does not
              record allocation start/end dates or completed teaching sessions,
              so historical/completed allocations are not available. The
              teacher's availability status ({teacher.studentAllocation?.status ||
                'unallocated'}) is an operational flag and is not treated as
              teaching history.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page__section">
      {/* Top Header & Breadcrumbs adhering to Meridian standard */}
      <header className="page__header mb-6">
        <div className="page__headline">
          <nav className="breadcrumb mb-2">
            <span className="breadcrumb__item">
              <Link to="/admin/teachers" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <ChevronLeft size={14} /> Teachers
              </Link>
            </span>
            <span className="breadcrumb__item" aria-current="page">
              Teacher #{teacher.id}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page__title">{teacher.name}</h1>
            <TeacherStatusBadge type="account" value={teacher.account?.status} />
            <TeacherStatusBadge type="allocation" value={teacher.studentAllocation?.status} />
            {teacher.isRealApi && (
              <Badge variant="info" size="xs" dot>
                Live API Synced
              </Badge>
            )}
          </div>
          <p className="page__description">
            Teacher Faculty Profile &bull; Manage qualifications, registration fees, KYC verification, and student tutoring allocations.
          </p>
        </div>

        <div className="page__action flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/teachers')}>
                <ChevronLeft size={16} className="mr-1" /> Back to Teachers
              </Button>
              <Button variant="primary" size="sm" onClick={() => {
                setActiveTab('general')
                setIsEditing(true)
              }}>
                <Edit size={15} className="mr-1.5" /> Edit Teacher
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={saving}>
                <X size={16} className="mr-1" /> Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Spinner size={16} className="mr-1.5" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1.5" /> Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Success / Error Alerts */}
      {saveSuccess && (
        <Alert variant="success" title={saveSuccess} onClose={() => setSaveSuccess('')} />
      )}

      {saveError && (
        <Alert variant="error" title={saveError} onClose={() => setSaveError('')} />
      )}

      {/* Main Grid: 2/3 Content + 1/3 Sidebar Layout */}
      <Tabs
        defaultValue="general"
        value={activeTab}
        onValueChange={setActiveTab}
        className="teacher-detail-tabs"
      >
        <TabsList className="teacher-detail-tabs__list">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="registration-history">Registration History</TabsTrigger>
          <TabsTrigger value="teaching-history">Teaching History</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <div className="enquiry-detail-layout">
        {/* Left Column (2 Cols): Personal & Professional Side-by-Side, KYC Documents */}
        <div className="space-y-6">
          {/* Side-by-Side Cards: Personal Information + Professional Qualifications */}
          <div className="enquiry-cards-row">
            {/* Card 1: Personal Information */}
            <Card variant="hover" className="h-full flex flex-col">
              <CardHeader className="border-b border-border py-4 px-6">
                <div className="flex items-center gap-2.5">
                  <User size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">Personal Information</h3>
                </div>
              </CardHeader>
              <CardBody className="p-6 flex-1 flex flex-col justify-between">
                <div className="detail-card-fields">
                  <div className="detail-field-item">
                    <span className="detail-field-label">Full Name</span>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          className="field__control-input text-xs"
                          placeholder="Teacher Full Name"
                        />
                        {formErrors.name && (
                          <span className="text-[11px] text-danger mt-1 block">{formErrors.name}</span>
                        )}
                      </div>
                    ) : (
                      <span className="detail-field-value font-semibold">{teacher.name}</span>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Mobile Number</span>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formData.mobile}
                          onChange={(e) => handleFieldChange('mobile', e.target.value)}
                          className="field__control-input text-xs"
                          placeholder="+91 98765 43210"
                        />
                        {formErrors.mobile && (
                          <span className="text-[11px] text-danger mt-1 block">{formErrors.mobile}</span>
                        )}
                      </div>
                    ) : (
                      <a
                        href={`tel:${teacher.mobile}`}
                        className="detail-field-value detail-field-icon-row font-mono text-primary hover:underline font-medium"
                      >
                        <Phone size={15} className="text-muted-foreground shrink-0" />
                        <span>{teacher.mobile || '—'}</span>
                      </a>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Email Address</span>
                    {isEditing ? (
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className="field__control-input text-xs"
                        placeholder="teacher@wellfind.academic"
                      />
                    ) : teacher.email ? (
                      <a
                        href={`mailto:${teacher.email}`}
                        className="detail-field-value detail-field-icon-row text-primary hover:underline font-medium"
                      >
                        <Mail size={15} className="text-muted-foreground shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic text-sm">Not provided</span>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Preferred Availability</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.availability}
                        onChange={(e) => handleFieldChange('availability', e.target.value)}
                        className="field__control-input text-xs"
                        placeholder="e.g. Mon-Fri: 5:00 PM – 8:30 PM"
                      />
                    ) : (
                      <div className="detail-field-value detail-field-icon-row">
                        <Clock size={15} className="text-muted-foreground shrink-0" />
                        <span>{teacher.availability || 'Flexible'}</span>
                      </div>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Teaching Locality / Areas Covered</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.locality}
                        onChange={(e) => handleFieldChange('locality', e.target.value)}
                        className="field__control-input text-xs"
                        placeholder="e.g. Salt Lake, Sector 2, Kolkata"
                      />
                    ) : (
                      <div className="detail-field-value detail-field-icon-row font-medium">
                        <MapPin size={15} className="text-muted-foreground shrink-0" />
                        <span>{teacher.locality || 'Not specified'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {teacher.applicantNotes && !isEditing && (
                  <div className="detail-notes-card">
                    <span className="detail-notes-title">Applicant Introduction & Notes</span>
                    <p className="detail-notes-text">{teacher.applicantNotes}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Card 2: Professional Qualifications */}
            <Card variant="hover" className="h-full flex flex-col">
              <CardHeader className="border-b border-border py-4 px-6">
                <div className="flex items-center gap-2.5">
                  <GraduationCap size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">Professional Qualifications</h3>
                </div>
              </CardHeader>
              <CardBody className="p-6 flex-1 flex flex-col justify-between">
                <div className="detail-card-fields">
                  <div className="detail-field-item">
                    <span className="detail-field-label">Highest Qualification</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.qualification}
                        onChange={(e) => handleFieldChange('qualification', e.target.value)}
                        className="field__control-input text-xs"
                        placeholder="e.g. M.Sc. in Physics, B.Ed."
                      />
                    ) : (
                      <div className="detail-field-value detail-field-icon-row font-semibold">
                        <GraduationCap size={15} className="text-muted-foreground shrink-0" />
                        <span>{teacher.qualification || '—'}</span>
                      </div>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Primary Subject</span>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formData.primarySubject}
                          onChange={(e) => handleFieldChange('primarySubject', e.target.value)}
                          className="field__control-input text-xs"
                          placeholder="e.g. Mathematics"
                        />
                        {formErrors.primarySubject && (
                          <span className="text-[11px] text-danger mt-1 block">{formErrors.primarySubject}</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary font-semibold inline-block">
                          {teacher.primarySubject}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Teaching Experience</span>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={formData.experienceYears}
                        onChange={(e) => handleFieldChange('experienceYears', e.target.value)}
                        className="field__control-input text-xs"
                      />
                    ) : (
                      <div className="detail-field-value detail-field-icon-row">
                        <Briefcase size={15} className="text-muted-foreground shrink-0" />
                        <span>
                          {typeof teacher.experienceYears === 'number'
                            ? `${teacher.experienceYears} year${teacher.experienceYears === 1 ? '' : 's'}`
                            : teacher.experienceYears || 'Fresher'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Classes / Level Taught</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.classLevels}
                        onChange={(e) => handleFieldChange('classLevels', e.target.value)}
                        className="field__control-input text-xs"
                        placeholder="e.g. Classes 9–10 & CBSE"
                      />
                    ) : (
                      <span className="detail-field-value font-medium">{teacher.classLevels || '—'}</span>
                    )}
                  </div>
                </div>

                {teacher.kyc?.reviewNotes && !isEditing && (
                  <div className="detail-notes-card">
                    <span className="detail-notes-title">Admin Review & Credentials Notes</span>
                    <p className="detail-notes-text">{teacher.kyc.reviewNotes}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Card 3: KYC Verification & Uploaded Documents */}
          <Card variant="hover">
            <CardHeader className="border-b border-border py-4 px-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">KYC Documents & Verification</h3>
                </div>
                <TeacherStatusBadge type="kyc" value={teacher.kyc?.status} />
              </div>
            </CardHeader>
            <CardBody className="p-6 space-y-4">
              {/* Document 1: Aadhaar Card */}
              <div className="doc-row-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileText size={20} className="text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Identity / Aadhaar Card</div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {teacher.kyc?.aadhaarStatus || 'Government ID verification document'}
                    </span>
                  </div>
                </div>
                {teacher.kyc?.aadhaarDocument ? (
                  <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => previewKyc(teacher.kyc.aadhaarDocument, 'Identity / Aadhaar Card')}>Preview</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={downloadingDoc === 'aadhaar'}
                    onClick={() => handleDownloadDoc(teacher.kyc.aadhaarDocument, 'aadhaar_card')}
                  >
                    {downloadingDoc === 'aadhaar' ? (
                      <Spinner size={14} className="mr-1.5" />
                    ) : (
                      <Download size={14} className="mr-1.5" />
                    )}
                    <span>Download File</span>
                  </Button>
                  </div>
                ) : (
                  <Badge variant="neutral" size="sm">
                    {teacher.kyc?.status === 'verified' ? 'Verified ID' : 'Not Uploaded'}
                  </Badge>
                )}
              </div>

              {/* Document 2: Qualification Certificate */}
              <div className="doc-row-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <GraduationCap size={20} className="text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Highest Qualification Certificate</div>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {teacher.kyc?.qualificationStatus || 'Academic credentials and degree proof'}
                    </span>
                  </div>
                </div>
                {teacher.kyc?.qualificationDocument ? (
                  <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => previewKyc(teacher.kyc.qualificationDocument, 'Qualification Certificate')}>Preview</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={downloadingDoc === 'qualification'}
                    onClick={() => handleDownloadDoc(teacher.kyc.qualificationDocument, 'qualification_certificate')}
                  >
                    {downloadingDoc === 'qualification' ? (
                      <Spinner size={14} className="mr-1.5" />
                    ) : (
                      <Download size={14} className="mr-1.5" />
                    )}
                    <span>Download File</span>
                  </Button>
                  </div>
                ) : (
                  <Badge variant="neutral" size="sm">
                    {teacher.kyc?.status === 'verified' ? 'Verified Degree' : 'Not Uploaded'}
                  </Badge>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Registration Fee, Allocation & Account Lifecycle */}
        <div className="space-y-6">
          {/* Card: Registration Fee */}
          <Card variant="hover">
            <CardHeader className="border-b border-border py-4 px-6">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-success shrink-0" />
                  <h3 className="card__title">Registration Fee</h3>
                </div>
                <TeacherStatusBadge type="fee" value={teacher.registrationFee?.status} />
              </div>
            </CardHeader>
            <CardBody className="p-6 text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Fee Amount</span>
                <span className="font-semibold text-sm text-foreground">
                  ₹{(teacher.registrationFee?.amount ?? 1000).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Academic Year</span>
                <span className="text-foreground">{teacher.registrationFee?.year || '2026–2027'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Payment Date</span>
                <span className="text-foreground">{teacher.registrationFee?.paymentDate || 'Pending'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Transaction Reference</span>
                <span className="font-mono text-muted-foreground truncate max-w-[150px]" title={teacher.registrationFee?.transactionRef}>
                  {teacher.registrationFee?.transactionRef || 'None'}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Card: Availability & Student Allocation Management */}
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-surface-2 border-b border-border py-3.5 px-5">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-primary shrink-0" />
                <h3 className="card__title">Teacher Management</h3>
              </div>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              {/* Operational Availability Status */}
              <div className="field">
                <span className="field__label text-xs font-semibold block mb-1">
                  Student Allocation Status
                </span>
                {isEditing ? (
                  <select
                    value={formData.allocationStatus}
                    onChange={(e) => handleFieldChange('allocationStatus', e.target.value)}
                    className="field__control-select w-full text-xs"
                  >
                    {Object.entries(ALLOCATION_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="status-readonly-row">
                    <span className="text-xs text-foreground font-medium">Current Allocation</span>
                    <TeacherStatusBadge type="allocation" value={teacher.studentAllocation?.status} />
                  </div>
                )}
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Availability status indicates if tutor is currently free for student matchings.
                </span>
              </div>

              {/* Account Status */}
              <div className="field">
                <span className="field__label text-xs font-semibold block mb-1">
                  Teacher Account Status
                </span>
                {isEditing ? (
                  <select
                    value={formData.accountStatus}
                    onChange={(e) => handleFieldChange('accountStatus', e.target.value)}
                    className="field__control-select w-full text-xs"
                  >
                    {Object.entries(ACCOUNT_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="status-readonly-row">
                    <span className="text-xs text-foreground font-medium">Account State</span>
                    <TeacherStatusBadge type="account" value={teacher.account?.status} />
                  </div>
                )}
              </div>

              {/* Admin Staff Informational Row */}
              <div className="field">
                <span className="field__label text-xs font-semibold block mb-1">
                  Managing Staff Account
                </span>
                <div className="reviewer-info-row">
                  <div className="flex items-center gap-2.5 truncate">
                    <User size={15} className="text-muted-foreground shrink-0" />
                    <span className="font-mono text-foreground font-medium truncate text-xs">
                      {currentUser?.email || currentUser?.name || 'Administrator'}
                    </span>
                  </div>
                  <Badge variant="neutral" size="sm" className="shrink-0 font-normal">
                    Super Admin
                  </Badge>
                </div>
              </div>

              {/* Admin API controls: profile status + availability */}
              {!isEditing && (
                <TeacherAdminControls
                  teacherId={teacher.id}
                  userId={teacher.userId}
                  loginEmail={teacher.email}
                  status={teacher.status || teacher.account?.status}
                  availability={teacher.availability}
                  availabilityStatus={teacher.availabilityStatus}
                  onChanged={loadTeacher}
                />
              )}

              {/* Edit / Save Action Button */}
              {!isEditing ? (
                <Button
                  variant="primary"
                  className="w-full mt-2"
                  onClick={() => {
                    setActiveTab('general')
                    setIsEditing(true)
                  }}
                >
                  <Edit size={16} className="mr-1.5" /> Edit Teacher Record
                </Button>
              ) : (
                <div className="space-y-2 mt-2">
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner size={16} className="mr-1.5" /> Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-1.5" /> Save Record Updates
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X size={16} className="mr-1.5" /> Cancel Editing
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Metadata Card */}
          <Card variant="hover">
            <CardBody className="py-4 px-5 text-xs text-muted-foreground space-y-2.5">
              <div className="flex justify-between items-center">
                <span>Teacher ID</span>
                <span className="font-mono text-foreground font-semibold">#{teacher.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Registered Date</span>
                <span className="text-foreground">
                  {teacher.account?.createdAt ? new Date(teacher.account.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Data Source</span>
                <span className="font-mono text-xs text-foreground font-medium">
                  {teacher.isRealApi ? 'Payload CMS API' : 'Session Store'}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </TabsContent>
    <TabsContent value="registration-history">
      {renderRegistrationHistoryTab()}
    </TabsContent>
    <TabsContent value="teaching-history">
      {renderTeachingHistoryTab()}
    </TabsContent>
  </Tabs>
  {teacher.userId && <div style={{ marginTop: 20 }}><MyDocuments ownerId={teacher.userId} /></div>}
  {previewDoc && <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}
</div>
  )
}
