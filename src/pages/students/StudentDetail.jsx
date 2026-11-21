import { Alert } from '@/components/ui/Alert'
import { PageLoader, Spinner } from '@/components/ui/Loaders'
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Card, CardHeader, CardBody,
  Button, Badge
} from '@/components/ui'
import { ArrowLeft, ChevronLeft, User, Phone, Mail, MapPin, Clock, DollarSign, BookOpen, Calendar, Shield, AlertCircle, GraduationCap, School, Edit, Save, X, Check } from 'lucide-react'
import { getStudentById, updateStudent } from '@/services/studentService'
import { StudentStatusBadge } from './StudentStatusBadge'
import { STUDENT_STATUS_CONFIG, CLASS_OPTIONS, LOCALITY_OPTIONS } from './studentsSampleData'
import { getAuthUser } from '@/services/apiClient'

export default function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saveError, setSaveError] = useState('')

  const loadStudent = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getStudentById(id)
      if (!data) {
        setError(`Student with ID "${id}" could not be found.`)
      } else {
        setStudent(data)
        setFormData({
          name: data.name || '',
          parentName: data.parentName || '',
          email: data.email || '',
          phone: data.phone || '',
          studentClass: data.studentClass || '',
          subjectsText: Array.isArray(data.subjects) ? data.subjects.join(', ') : (data.subjects || ''),
          locality: data.locality || '',
          preferredTiming: data.preferredTiming || '',
          budgetRange: data.budgetRange || '',
          status: data.status || 'active',
          assignedTeacher: data.assignedTeacher || '',
          schoolName: data.schoolName || '',
          sessionsPerWeek: data.sessionsPerWeek || 2,
          adminNotes: data.adminNotes || '',
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to load student details.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadStudent()
    }
  }, [id, loadStudent])

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
    if (!formData.name?.trim()) errors.name = 'Student name is required'
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required'
    if (!formData.studentClass?.trim()) errors.studentClass = 'Class is required'
    if (!formData.locality?.trim()) errors.locality = 'Locality is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setSaving(true)
    setSaveError('')
    setSaveSuccess('')

    try {
      const parsedSubjects = formData.subjectsText
        ? formData.subjectsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : []

      const updatePayload = {
        name: formData.name.trim(),
        parentName: formData.parentName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        studentClass: formData.studentClass.trim(),
        subjects: parsedSubjects,
        locality: formData.locality.trim(),
        preferredTiming: formData.preferredTiming.trim(),
        budgetRange: formData.budgetRange.trim(),
        status: formData.status,
        assignedTeacher: formData.assignedTeacher.trim(),
        schoolName: formData.schoolName.trim(),
        sessionsPerWeek: Number(formData.sessionsPerWeek) || 2,
        adminNotes: formData.adminNotes.trim(),
      }

      const updated = await updateStudent(id, updatePayload)
      setStudent(updated)
      setIsEditing(false)
      setSaveSuccess('Student record successfully updated.')
    } catch (err) {
      setSaveError(err.message || 'Failed to update student profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (student) {
      setFormData({
        name: student.name || '',
        parentName: student.parentName || '',
        email: student.email || '',
        phone: student.phone || '',
        studentClass: student.studentClass || '',
        subjectsText: Array.isArray(student.subjects) ? student.subjects.join(', ') : (student.subjects || ''),
        locality: student.locality || '',
        preferredTiming: student.preferredTiming || '',
        budgetRange: student.budgetRange || '',
        status: student.status || 'active',
        assignedTeacher: student.assignedTeacher || '',
        schoolName: student.schoolName || '',
        sessionsPerWeek: student.sessionsPerWeek || 2,
        adminNotes: student.adminNotes || '',
      })
    }
    setFormErrors({})
    setSaveError('')
    setIsEditing(false)
  }

  const getInitials = (name) => {
    if (!name) return 'ST'
    return name
      .replace(/^(Master|Miss|Mr\.|Mrs\.|Ms\.)\s+/i, '')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  if (loading) {
    return (
      <PageLoader label="Loading student profile details" />
    )
  }

  if (error || !student) {
    return (
      <div className="page__section max-w-2xl mx-auto py-8">
        <Card className="border-danger/30">
          <CardBody className="py-12 text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <div className="text-lg font-semibold text-foreground">Student Record Not Found</div>
            <p className="text-sm text-muted-foreground max-w-md">
              {error || `Student #${id} could not be retrieved from active records.`}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Button variant="outline" onClick={() => navigate('/admin/students')}>
                <ArrowLeft size={16} /> Back to Students
              </Button>
              <Button variant="primary" onClick={loadStudent}>
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
      <header className="page__header mb-6">
        <div className="page__headline">
          <nav className="breadcrumb mb-2">
            <span className="breadcrumb__item">
              <Link to="/admin/students" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <ChevronLeft size={14} /> Students
              </Link>
            </span>
            <span className="breadcrumb__item" aria-current="page">
              Student #{student.id}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page__title">{student.name}</h1>
            <StudentStatusBadge status={student.status} size="md" />
            {student.isRealApi && (
              <Badge variant="info" size="xs" dot>
                Live API Synced
              </Badge>
            )}
          </div>
          <p className="page__description">
            Enrolled Student Profile &bull; Manage academic requirements, parent communications, and active tutoring assignments.
          </p>
        </div>

        <div className="page__action flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/students')}>
                <ChevronLeft size={16} className="mr-1" /> Back to Students
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                <Edit size={15} className="mr-1.5" /> Edit Student
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
      <div className="enquiry-detail-layout">
        {/* Left Column (2 Cols): Side-by-Side Profile + Academic, plus Guardian & Locality */}
        <div className="space-y-6">
          {/* Side-by-Side Cards: Academic Requirements + Guardian/Contact */}
          <div className="enquiry-cards-row">
            {/* Card 1: Student Profile & Academic Information */}
            <Card variant="hover" className="h-full flex flex-col">
              <CardHeader className="border-b border-border py-4 px-6">
                <div className="flex items-center gap-2.5">
                  <GraduationCap size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">Academic Information</h3>
                </div>
              </CardHeader>
              <CardBody className="p-6 flex-1 flex flex-col justify-between">
                <div className="detail-card-fields">
                  <div className="detail-field-item">
                    <span className="detail-field-label">Student Name</span>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                          className="field__control-input text-xs"
                          placeholder="Student Name"
                        />
                        {formErrors.name && (
                          <span className="text-[11px] text-danger mt-1 block">{formErrors.name}</span>
                        )}
                      </div>
                    ) : (
                      <span className="detail-field-value font-semibold">{student.name}</span>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Class / Grade</span>
                    {isEditing ? (
                      <div>
                        <select
                          value={formData.studentClass}
                          onChange={(e) => handleFieldChange('studentClass', e.target.value)}
                          className="field__control-select text-xs w-full"
                        >
                          <option value="">Select Class</option>
                          {CLASS_OPTIONS.map((cls) => (
                            <option key={cls} value={cls}>
                              {cls}
                            </option>
                          ))}
                        </select>
                        {formErrors.studentClass && (
                          <span className="text-[11px] text-danger mt-1 block">{formErrors.studentClass}</span>
                        )}
                      </div>
                    ) : (
                      <span className="detail-field-value font-semibold">{student.studentClass || '—'}</span>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">School / Institution</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.schoolName}
                        onChange={(e) => handleFieldChange('schoolName', e.target.value)}
                        className="field__control-input text-xs"
                        placeholder="e.g. St. Xavier's High School"
                      />
                    ) : (
                      <div className="detail-field-value detail-field-icon-row">
                        <School size={15} className="text-muted-foreground shrink-0" />
                        <span>{student.schoolName || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Subjects</span>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formData.subjectsText}
                          onChange={(e) => handleFieldChange('subjectsText', e.target.value)}
                          className="field__control-input text-xs"
                          placeholder="Comma separated: Mathematics, Physics"
                        />
                        <span className="text-[11px] text-muted-foreground block mt-0.5">Separate subjects with commas</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {Array.isArray(student.subjects) && student.subjects.length > 0 ? (
                          student.subjects.map((sub, idx) => (
                            <span key={idx} className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary font-semibold">
                              {sub}
                            </span>
                          ))
                        ) : student.subjects ? (
                          <span className="px-2.5 py-1 text-xs rounded-md bg-primary/10 text-primary font-semibold">
                            {student.subjects}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">Not specified</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Preferred Schedule / Timing</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.preferredTiming}
                        onChange={(e) => handleFieldChange('preferredTiming', e.target.value)}
                        className="field__control-input text-xs"
                        placeholder="e.g. Weekday Evenings (5 PM - 7 PM)"
                      />
                    ) : (
                      <div className="detail-field-value detail-field-icon-row">
                        <Clock size={15} className="text-muted-foreground shrink-0" />
                        <span>{student.preferredTiming || 'Flexible'}</span>
                      </div>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Target Sessions Per Week</span>
                    {isEditing ? (
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={formData.sessionsPerWeek}
                        onChange={(e) => handleFieldChange('sessionsPerWeek', e.target.value)}
                        className="field__control-input text-xs"
                      />
                    ) : (
                      <span className="detail-field-value font-semibold">
                        {student.sessionsPerWeek ? `${student.sessionsPerWeek} sessions / week` : '2 sessions / week'}
                      </span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Card 2: Parent / Guardian & Locality */}
            <Card variant="hover" className="h-full flex flex-col">
              <CardHeader className="border-b border-border py-4 px-6">
                <div className="flex items-center gap-2.5">
                  <User size={18} className="text-primary shrink-0" />
                  <h3 className="card__title">Parent / Guardian & Locality</h3>
                </div>
              </CardHeader>
              <CardBody className="p-6 flex-1 flex flex-col justify-between">
                <div className="detail-card-fields">
                  <div className="detail-field-item">
                    <span className="detail-field-label">Parent / Guardian Name</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.parentName}
                        onChange={(e) => handleFieldChange('parentName', e.target.value)}
                        className="field__control-input text-xs"
                        placeholder="Parent / Guardian Name"
                      />
                    ) : (
                      <span className="detail-field-value font-semibold">
                        {student.parentName || student.name || '—'}
                      </span>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Contact Phone</span>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          className="field__control-input text-xs"
                          placeholder="+91 98765 43210"
                        />
                        {formErrors.phone && (
                          <span className="text-[11px] text-danger mt-1 block">{formErrors.phone}</span>
                        )}
                      </div>
                    ) : (
                      <a
                        href={`tel:${student.phone}`}
                        className="detail-field-value detail-field-icon-row font-mono text-primary hover:underline font-medium"
                      >
                        <Phone size={15} className="text-muted-foreground shrink-0" />
                        <span>{student.phone || '—'}</span>
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
                        placeholder="parent@example.com"
                      />
                    ) : student.email ? (
                      <a
                        href={`mailto:${student.email}`}
                        className="detail-field-value detail-field-icon-row text-primary hover:underline font-medium"
                      >
                        <Mail size={15} className="text-muted-foreground shrink-0" />
                        <span className="truncate">{student.email}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic text-sm">Not provided</span>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Locality / Address</span>
                    {isEditing ? (
                      <div>
                        <select
                          value={formData.locality}
                          onChange={(e) => handleFieldChange('locality', e.target.value)}
                          className="field__control-select text-xs w-full"
                        >
                          <option value="">Select Locality</option>
                          {LOCALITY_OPTIONS.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                        {formErrors.locality && (
                          <span className="text-[11px] text-danger mt-1 block">{formErrors.locality}</span>
                        )}
                      </div>
                    ) : (
                      <div className="detail-field-value detail-field-icon-row font-medium">
                        <MapPin size={15} className="text-muted-foreground shrink-0" />
                        <span>{student.locality || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  <div className="detail-field-item">
                    <span className="detail-field-label">Tuition Budget Range</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.budgetRange}
                        onChange={(e) => handleFieldChange('budgetRange', e.target.value)}
                        className="field__control-input text-xs"
                        placeholder="e.g. ₹5,000 - ₹7,000 / mo"
                      />
                    ) : (
                      <div className="detail-field-value detail-field-icon-row font-semibold">
                        <DollarSign size={15} className="text-success shrink-0" />
                        <span>{student.budgetRange || 'Flexible'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {student.adminNotes && !isEditing && (
                  <div className="detail-notes-card">
                    <span className="detail-notes-title">Internal Notes & History</span>
                    <p className="detail-notes-text">{student.adminNotes}</p>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Additional Section: Tutor Allocation & Academic Tracking */}
          <Card variant="hover">
            <CardHeader className="border-b border-border py-3.5 px-5">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-primary shrink-0" />
                <h3 className="card__title">Tutor Allocation & Learning Plan</h3>
              </div>
            </CardHeader>
            <CardBody className="p-5 text-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1 font-medium">Assigned Teacher</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.assignedTeacher}
                      onChange={(e) => handleFieldChange('assignedTeacher', e.target.value)}
                      className="field__control-input text-xs"
                      placeholder="e.g. Dr. Debabrata Banerjee"
                    />
                  ) : (
                    <span className="font-semibold text-foreground text-sm block">
                      {student.assignedTeacher || 'Unassigned'}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block mb-1 font-medium">Curriculum Track</span>
                  <span className="text-foreground font-medium text-sm block">
                    {student.studentClass?.includes('ICSE')
                      ? 'CISCE / ICSE Board'
                      : student.studentClass?.includes('CBSE')
                      ? 'CBSE Central Board'
                      : student.studentClass?.includes('State')
                      ? 'State Secondary Board'
                      : 'Comprehensive Curriculum'}
                  </span>
                </div>
              </div>

              {isEditing && (
                <div className="field">
                  <label className="field__label text-xs font-semibold block mb-1">
                    Coordinator / Administrator Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.adminNotes}
                    onChange={(e) => handleFieldChange('adminNotes', e.target.value)}
                    className="field__control-textarea text-xs"
                    placeholder="Add student progress records, specific tutor requirements, or parent feedback..."
                  />
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Enrollment Management & Status Administration */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-surface-2 border-b border-border py-3.5 px-5">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-primary shrink-0" />
                <h3 className="card__title">Enrollment Management</h3>
              </div>
            </CardHeader>
            <CardBody className="p-5 space-y-4">
              {/* Enrollment Status */}
              <div className="field">
                <span className="field__label text-xs font-semibold block mb-1">
                  Student Account Status
                </span>
                {isEditing ? (
                  <select
                    value={formData.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="field__control-select w-full text-xs"
                  >
                    {Object.entries(STUDENT_STATUS_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="status-readonly-row">
                    <span className="text-xs text-foreground font-medium">Current Status</span>
                    <StudentStatusBadge status={student.status} size="sm" />
                  </div>
                )}
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Controls tuition session tracking and teacher billing.
                </span>
              </div>

              {/* Reviewer / Admin Staff Informational Row */}
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
                <span className="text-[11px] text-muted-foreground block mt-1">
                  Authorized administrator managing this student portfolio.
                </span>
              </div>

              {/* Edit / Save Action Button */}
              {!isEditing ? (
                <Button
                  variant="primary"
                  className="w-full mt-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={16} className="mr-1.5" /> Edit Student Record
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
                <span>Student ID</span>
                <span className="font-mono text-foreground font-semibold">#{student.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Registered Date</span>
                <span className="text-foreground">
                  {student.submittedDate ? new Date(student.submittedDate).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Data Source</span>
                <span className="font-mono text-xs text-foreground font-medium">
                  {student.isRealApi ? 'Payload CMS API' : 'Session Store'}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

