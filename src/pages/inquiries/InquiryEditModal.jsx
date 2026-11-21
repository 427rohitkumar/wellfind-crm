import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Loaders'
import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogClose,
  Button
} from '@/components/ui'
import { AlertCircle, Save, BookOpen, GraduationCap, Shield } from 'lucide-react'
import { updateStudentEnquiry, getStudentStatusOptions } from '@/services/studentEnquiryService'
import {
  updateTeacherEnquiry,
  getTeacherStatusOptions,
  TEACHER_AVAILABILITY_STATUSES
} from '@/services/teacherEnquiryService'
import { getAuthUser } from '@/services/apiClient'

function getInitialData(type, inquiry) {
  if (!inquiry) return null

  if (type === 'student') {
    let subjectsStr = ''
    if (Array.isArray(inquiry.subjects)) {
      subjectsStr = inquiry.subjects
        .map((s) => (typeof s === 'string' ? s : s?.subject))
        .filter(Boolean)
        .join(', ')
    }
    return {
      name: inquiry.name || '',
      phoneNumber: inquiry.phoneNumber || '',
      studentClass: inquiry.studentClass || '',
      subjectsText: subjectsStr,
      customSubject: inquiry.customSubject || '',
      locality: inquiry.locality || '',
      customLocality: inquiry.customLocality || '',
      preferredTiming: inquiry.preferredTiming || '',
      budgetRange: inquiry.budgetRange || '',
      status: inquiry.enquiryStatus || 'new',
      changeReason: '',
      adminNotes: inquiry.adminNotes || '',
      assignedTo:
        typeof inquiry.assignedTo === 'object' && inquiry.assignedTo?.id
          ? String(inquiry.assignedTo.id)
          : inquiry.assignedTo
          ? String(inquiry.assignedTo)
          : '',
    }
  } else {
    const currentUser = getAuthUser()
    return {
      fullName: inquiry.fullName || '',
      mobileNumber: inquiry.mobileNumber || '',
      email: inquiry.email || '',
      highestQualification: inquiry.highestQualification || '',
      teachingExperience: inquiry.teachingExperience || '',
      primarySubject: inquiry.primarySubject || '',
      classLevel: inquiry.classLevel || '',
      teachingLocality: inquiry.teachingLocality || '',
      status: inquiry.applicationStatus || 'new',
      availabilityStatus: inquiry.availabilityStatus || 'available',
      rejectionReason: '',
      changeReason: '',
      adminNotes: inquiry.adminNotes || '',
      reviewedBy:
        typeof inquiry.reviewedBy === 'object' && inquiry.reviewedBy?.id
          ? String(inquiry.reviewedBy.id)
          : inquiry.reviewedBy
          ? String(inquiry.reviewedBy)
          : currentUser?.id
          ? String(currentUser.id)
          : '',
    }
  }
}

export function InquiryEditModal({
  isOpen,
  onClose,
  type, // 'student' | 'teacher'
  inquiry,
  onSuccess,
}) {
  const [formData, setFormData] = useState(() => getInitialData(type, inquiry))
  const [fieldErrors, setFieldErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  if (!isOpen || !inquiry || !formData) return null

  const initialStatus =
    type === 'student'
      ? inquiry.enquiryStatus || 'new'
      : inquiry.applicationStatus || 'new'

  const isStatusChanged = formData.status !== initialStatus

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = () => {
    const errors = {}

    if (type === 'student') {
      if (!formData.name?.trim()) errors.name = 'Student / Parent name is required'
      if (!formData.phoneNumber?.trim()) errors.phoneNumber = 'Phone number is required'

      // Mandatory reason rule: closing an enquiry requires a reason
      if (formData.status === 'closed' && initialStatus !== 'closed' && !formData.changeReason?.trim()) {
        errors.changeReason = 'A reason is mandatory when closing a student enquiry.'
      }
    } else {
      if (!formData.fullName?.trim()) errors.fullName = 'Teacher full name is required'
      if (!formData.mobileNumber?.trim()) errors.mobileNumber = 'Mobile number is required'
      if (!formData.primarySubject?.trim()) errors.primarySubject = 'Primary subject is required'

      // Mandatory reason rule: rejecting an application requires a reason
      if (formData.status === 'rejected' && !formData.rejectionReason?.trim()) {
        errors.rejectionReason = 'A valid rejection reason is mandatory when rejecting a teacher application.'
      }
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inquiry?.id) return

    if (!validate()) {
      setErrorMessage('Please resolve the required fields and reason rules above.')
      return
    }

    setSaving(true)
    setErrorMessage('')

    try {
      let updatedDoc = null

      if (type === 'student') {
        const payload = {
          name: formData.name.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          studentClass: formData.studentClass.trim(),
          locality: formData.locality.trim(),
          preferredTiming: formData.preferredTiming.trim(),
          budgetRange: formData.budgetRange.trim(),
          enquiryStatus: formData.status,
          adminNotes: formData.adminNotes.trim(),
        }

        if (formData.customLocality?.trim()) {
          payload.customLocality = formData.customLocality.trim()
        }

        if (formData.subjectsText !== undefined) {
          const parsedSubjects = formData.subjectsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
          if (
            Array.isArray(inquiry.subjects) &&
            inquiry.subjects.length > 0 &&
            typeof inquiry.subjects[0] === 'object'
          ) {
            payload.subjects = parsedSubjects.map((sub) => ({ subject: sub }))
          } else {
            payload.subjects = parsedSubjects
          }
        }

        if (formData.customSubject?.trim()) {
          payload.customSubject = formData.customSubject.trim()
        }

        if (formData.changeReason?.trim()) {
          payload.changeReason = formData.changeReason.trim()
          const reasonNote = `[Status Note - ${formData.status.toUpperCase()}]: ${formData.changeReason.trim()}`
          payload.adminNotes = payload.adminNotes
            ? `${payload.adminNotes}\n${reasonNote}`
            : reasonNote
        }

        if (formData.assignedTo?.trim()) {
          const parsedId = Number(formData.assignedTo.trim())
          payload.assignedTo = isNaN(parsedId) ? formData.assignedTo.trim() : parsedId
        }

        const res = await updateStudentEnquiry(inquiry.id, payload)
        updatedDoc = res?.doc || res || { ...inquiry, ...payload }
      } else {
        const payload = {
          fullName: formData.fullName.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          email: formData.email.trim(),
          highestQualification: formData.highestQualification.trim(),
          teachingExperience: formData.teachingExperience.trim(),
          primarySubject: formData.primarySubject.trim(),
          classLevel: formData.classLevel.trim(),
          teachingLocality: formData.teachingLocality.trim(),
          applicationStatus: formData.status,
          availabilityStatus: formData.availabilityStatus,
          adminNotes: formData.adminNotes.trim(),
          reviewedAt: new Date().toISOString(),
        }

        if (formData.status === 'rejected' && formData.rejectionReason?.trim()) {
          payload.changeReason = formData.rejectionReason.trim()
          const reasonNote = `[Rejection Reason]: ${formData.rejectionReason.trim()}`
          payload.adminNotes = payload.adminNotes
            ? `${payload.adminNotes}\n${reasonNote}`
            : reasonNote
        } else if (formData.changeReason?.trim()) {
          payload.changeReason = formData.changeReason.trim()
          const reasonNote = `[Status Note - ${formData.status.toUpperCase()}]: ${formData.changeReason.trim()}`
          payload.adminNotes = payload.adminNotes
            ? `${payload.adminNotes}\n${reasonNote}`
            : reasonNote
        }

        if (formData.reviewedBy?.trim()) {
          const parsedId = Number(formData.reviewedBy.trim())
          payload.reviewedBy = isNaN(parsedId) ? formData.reviewedBy.trim() : parsedId
        }

        const res = await updateTeacherEnquiry(inquiry.id, payload)
        updatedDoc = res?.doc || res || { ...inquiry, ...payload }
      }

      onSuccess?.(
        `${type === 'student' ? 'Student enquiry' : 'Teacher application'} #${inquiry.id} updated successfully.`,
        updatedDoc
      )
      handleClose()
    } catch (err) {
      const isForbidden = err.isForbidden || err.status === 403
      const isUnauthorized = err.isUnauthorized || err.status === 401
      if (isForbidden || isUnauthorized) {
        setErrorMessage('Access denied: Super admin privileges are required to edit enquiries.')
      } else {
        setErrorMessage(err.message || 'Failed to update enquiry on server.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setFieldErrors({})
    setErrorMessage('')
    onClose()
  }

  const title =
    type === 'student'
      ? `Edit Student Enquiry #${inquiry.id}`
      : `Edit Teacher Application #${inquiry.id}`

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !saving && handleClose()}>
      <DialogContent size="lg" className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader
            title={title}
            description={`Update fields, manage status, and enforce transition rules for ${
              inquiry.name || inquiry.fullName || 'applicant'
            }.`}
            action={!saving ? <DialogClose /> : null}
          />

          <DialogBody className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
            {/* Global Error Banner */}
            {errorMessage && (
              <Alert variant="error" title="Something needs your attention." />
            )}

            {/* Section 1: Status & Administration (Enforces Transition & Mandatory Reasons) */}
            <div className="p-4 rounded-lg bg-surface-2/60 border border-border/80 space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" />
                Status & Lifecycle Management
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Primary Status Selector */}
                <div>
                  <label
                    htmlFor="inquiryStatusSelect"
                    className="block text-xs font-semibold text-foreground mb-1"
                  >
                    {type === 'student' ? 'Enquiry Status' : 'Application Review Status'} <span className="text-danger">*</span>
                  </label>
                  <select
                    id="inquiryStatusSelect"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="field__input field__input--select w-full text-xs"
                    required
                    disabled={saving}
                  >
                    {type === 'student'
                      ? getStudentStatusOptions(initialStatus)
                          // Test scheduling and allocation hand-off have their own dialogs.
                          .filter((s) => s.value === initialStatus || !['test', 'converted'].includes(s.value))
                          .map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))
                      : getTeacherStatusOptions(initialStatus).map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                  </select>
                  <span className="text-[11px] text-muted-foreground block mt-1">
                    {type === 'student'
                      ? 'Select pipeline stage: New, Contacted, In Progress, Converted, or Closed.'
                      : 'Hiring review stage: New, Under Review, Shortlisted, Approved, or Rejected.'}
                  </span>
                </div>

                {/* Teacher Availability (Kept strictly separate from applicationStatus) */}
                {type === 'teacher' ? (
                  <div>
                    <label
                      htmlFor="teacherAvailabilitySelect"
                      className="block text-xs font-semibold text-foreground mb-1"
                    >
                      Teacher Availability Status
                    </label>
                    <select
                      id="teacherAvailabilitySelect"
                      value={formData.availabilityStatus}
                      onChange={(e) => handleChange('availabilityStatus', e.target.value)}
                      className="field__input field__input--select w-full text-xs"
                      disabled={saving}
                    >
                      {TEACHER_AVAILABILITY_STATUSES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-muted-foreground block mt-1">
                      Tutor operational availability (separate from application hiring status).
                    </span>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="assignedToInput"
                      className="block text-xs font-semibold text-foreground mb-1"
                    >
                      Assigned Staff User ID (Optional)
                    </label>
                    <input
                      type="text"
                      id="assignedToInput"
                      value={formData.assignedTo}
                      onChange={(e) => handleChange('assignedTo', e.target.value)}
                      placeholder="e.g. 1"
                      className="field__input w-full text-xs"
                      disabled={saving}
                    />
                    <span className="text-[11px] text-muted-foreground block mt-1">
                      Payload user ID assigned to coordinate this student enquiry.
                    </span>
                  </div>
                )}
              </div>

              {/* Mandatory Rejection Reason for Teacher Applications */}
              {type === 'teacher' && formData.status === 'rejected' && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-xs space-y-2">
                  <div className="font-semibold text-danger flex items-center gap-1.5">
                    <AlertCircle size={15} /> Mandatory Rejection Reason <span className="text-danger">*</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    A clear reason is required by backend policy when rejecting a teacher application. This is recorded in the audit trail.
                  </p>
                  <div>
                    <input
                      type="text"
                      value={formData.rejectionReason}
                      onChange={(e) => handleChange('rejectionReason', e.target.value)}
                      placeholder="e.g. Incomplete credentials or experience requirements not met"
                      className="field__input w-full text-xs bg-surface"
                      disabled={saving}
                      required
                    />
                    {fieldErrors.rejectionReason && (
                      <p className="text-xs text-danger mt-1">{fieldErrors.rejectionReason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Mandatory Closing Reason for Student Enquiries */}
              {type === 'student' && formData.status === 'closed' && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs space-y-2">
                  <div className="font-semibold text-warning flex items-center gap-1.5">
                    <AlertCircle size={15} /> Mandatory Reason for Closing Enquiry <span className="text-danger">*</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Closing marks this enquiry as terminated or completed. Please provide the reason.
                  </p>
                  <div>
                    <input
                      type="text"
                      value={formData.changeReason}
                      onChange={(e) => handleChange('changeReason', e.target.value)}
                      placeholder="e.g. Student enrolled elsewhere / Requirement fulfilled"
                      className="field__input w-full text-xs bg-surface"
                      disabled={saving}
                      required
                    />
                    {fieldErrors.changeReason && (
                      <p className="text-xs text-danger mt-1">{fieldErrors.changeReason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Optional Reason for other status transitions */}
              {isStatusChanged &&
                !(type === 'teacher' && formData.status === 'rejected') &&
                !(type === 'student' && formData.status === 'closed') && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Reason for Status Change (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.changeReason}
                      onChange={(e) => handleChange('changeReason', e.target.value)}
                      placeholder={`e.g. Transitioning from ${initialStatus} to ${formData.status}`}
                      className="field__input w-full text-xs"
                      disabled={saving}
                    />
                    <span className="text-[11px] text-muted-foreground block mt-1">
                      Recorded in the audit log for team visibility.
                    </span>
                  </div>
                )}

              {/* Admin Notes */}
              <div>
                <label
                  htmlFor="adminNotesTextarea"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  Internal Administrative Notes
                </label>
                <textarea
                  id="adminNotesTextarea"
                  rows={3}
                  value={formData.adminNotes}
                  onChange={(e) => handleChange('adminNotes', e.target.value)}
                  placeholder="Notes regarding phone calls, trial classes, verification, or coordinator remarks..."
                  className="field__input w-full p-2.5 resize-y text-xs"
                  disabled={saving}
                />
              </div>

              {type === 'teacher' && (
                <div>
                  <label
                    htmlFor="reviewedByInput"
                    className="block text-xs font-semibold text-foreground mb-1"
                  >
                    Reviewer Admin User ID (Optional)
                  </label>
                  <input
                    type="text"
                    id="reviewedByInput"
                    value={formData.reviewedBy}
                    onChange={(e) => handleChange('reviewedBy', e.target.value)}
                    placeholder="e.g. 1"
                    className="field__input w-full text-xs"
                    disabled={saving}
                  />
                </div>
              )}
            </div>

            {/* Section 2: Supported Data Fields */}
            {type === 'student' ? (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Student & Academic Requirements
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Student / Parent Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="e.g. Rohan Sen"
                      disabled={saving}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs text-danger mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Contact Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs font-mono"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      placeholder="e.g. +91 98301 22441"
                      disabled={saving}
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="text-xs text-danger mt-1">{fieldErrors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Grade / Class
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.studentClass}
                      onChange={(e) => handleChange('studentClass', e.target.value)}
                      placeholder="e.g. Class 10 (CBSE)"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Locality / Area
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.locality}
                      onChange={(e) => handleChange('locality', e.target.value)}
                      placeholder="e.g. Salt Lake, Sector 2"
                      disabled={saving}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Subjects Requested (Comma-separated)
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.subjectsText}
                      onChange={(e) => handleChange('subjectsText', e.target.value)}
                      placeholder="e.g. Mathematics, Physics, Chemistry"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Preferred Timing
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.preferredTiming}
                      onChange={(e) => handleChange('preferredTiming', e.target.value)}
                      placeholder="e.g. Weekday Evenings (5 PM - 7 PM)"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Budget Range
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.budgetRange}
                      onChange={(e) => handleChange('budgetRange', e.target.value)}
                      placeholder="e.g. ₹5,000 - ₹8,000/mo"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  Teacher Profile & Qualifications
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Teacher Full Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="e.g. Dr. Debolina Bose"
                      disabled={saving}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs text-danger mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Mobile Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs font-mono"
                      value={formData.mobileNumber}
                      onChange={(e) => handleChange('mobileNumber', e.target.value)}
                      placeholder="e.g. +91 98319 88102"
                      disabled={saving}
                    />
                    {fieldErrors.mobileNumber && (
                      <p className="text-xs text-danger mt-1">{fieldErrors.mobileNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="field__input w-full text-xs"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="e.g. debolina.bose@example.com"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Highest Qualification
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.highestQualification}
                      onChange={(e) => handleChange('highestQualification', e.target.value)}
                      placeholder="e.g. M.Sc. in Physics, B.Ed"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Primary Subject <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.primarySubject}
                      onChange={(e) => handleChange('primarySubject', e.target.value)}
                      placeholder="e.g. Mathematics"
                      disabled={saving}
                    />
                    {fieldErrors.primarySubject && (
                      <p className="text-xs text-danger mt-1">{fieldErrors.primarySubject}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Teaching Experience
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.teachingExperience}
                      onChange={(e) => handleChange('teachingExperience', e.target.value)}
                      placeholder="e.g. 5+ years"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Class Level
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.classLevel}
                      onChange={(e) => handleChange('classLevel', e.target.value)}
                      placeholder="e.g. Classes 9 to 12 (CBSE / ISC)"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Teaching Locality
                    </label>
                    <input
                      type="text"
                      className="field__input w-full text-xs"
                      value={formData.teachingLocality}
                      onChange={(e) => handleChange('teachingLocality', e.target.value)}
                      placeholder="e.g. South Kolkata, Tollygunge"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter justify="end">
            <Button variant="ghost" type="button" onClick={handleClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={saving} disabled={saving}>
              {saving ? (
                <>
                  <Spinner size={16} className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
