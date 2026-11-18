import { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogClose,
  Badge, Button
} from '@/components/ui'
import {
  User, Phone, Mail, MapPin, Clock, DollarSign,
  BookOpen, GraduationCap, Briefcase, FileText, Download,
  AlertCircle, Edit, Shield
} from 'lucide-react'
import { getStudentEnquiryById, STUDENT_ENQUIRY_STATUSES } from '@/services/studentEnquiryService'
import { getTeacherEnquiryById, TEACHER_APPLICATION_STATUSES, downloadTeacherDocument } from '@/services/teacherEnquiryService'
import { useEnquiryCounts } from '@/context/EnquiryCountContext'

export function InquiryDetailModal({
  isOpen,
  onClose,
  type, // 'student' | 'teacher'
  inquiryId,
  onOpenEdit,
}) {
  const { markAsRead } = useEnquiryCounts()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [downloadingDoc, setDownloadingDoc] = useState('')

  useEffect(() => {
    if (!isOpen || !inquiryId) return

    let isMounted = true
    const fetchDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        const result =
          type === 'student'
            ? await getStudentEnquiryById(inquiryId)
            : await getTeacherEnquiryById(inquiryId)

        const doc = result?.doc || result
        if (isMounted) {
          setData(doc)
        }

        // Persistent Read Tracking: Mark as read if currently unread
        if (doc && !doc.markAsRead) {
          markAsRead(type, inquiryId)
            .then((readRes) => {
              if (readRes?.doc && isMounted) {
                setData((prev) => (prev ? { ...prev, markAsRead: true } : prev))
              }
            })
            .catch((err) => {
              console.error(`Failed to mark ${type} enquiry #${inquiryId} as read:`, err)
            })
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load details.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDetail()

    return () => {
      isMounted = false
    }
  }, [isOpen, inquiryId, type, markAsRead])

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

  const studentStatusConfig = STUDENT_ENQUIRY_STATUSES.find(
    (s) => s.value === (data?.enquiryStatus || 'new')
  )
  const teacherStatusConfig = TEACHER_APPLICATION_STATUSES.find(
    (s) => s.value === (data?.applicationStatus || 'new')
  )

  const handleClose = () => {
    setData(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="lg">
        <DialogHeader
          title={
            type === 'student'
              ? `Student Enquiry #${inquiryId}`
              : `Teacher Application #${inquiryId}`
          }
          description={
            data?.createdAt
              ? `Submitted on ${new Date(data.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : ''
          }
          action={<DialogClose />}
        />

        <DialogBody className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {loading && (
            <div className="py-12 text-center text-muted-foreground">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-3" />
              <p>Loading enquiry details from server...</p>
            </div>
          )}

          {error && (
            <div
              className="alert alert--danger"
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-md, 0.5rem)',
                backgroundColor: 'color-mix(in oklch, var(--color-danger) 10%, var(--color-surface, #fff))',
                border: 'none',
                color: 'var(--color-danger, #e52629)',
              }}
            >
              <AlertCircle
                className="shrink-0 mt-0.5"
                style={{
                  width: '20px',
                  height: '20px',
                  color: 'var(--color-danger, #e52629)',
                }}
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold text-sm">Error loading enquiry</p>
                <p className="text-xs mt-0.5 opacity-90">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Header Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-surface-2 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {(data.name || data.fullName || 'W').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{data.name || data.fullName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {type === 'student' ? 'Student / Parent' : 'Teacher Applicant'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Status:
                  </span>
                  {type === 'student' ? (
                    <Badge variant={studentStatusConfig?.variant || 'neutral'} dot>
                      {studentStatusConfig?.label || data.enquiryStatus || 'New'}
                    </Badge>
                  ) : (
                    <Badge variant={teacherStatusConfig?.variant || 'neutral'} dot>
                      {teacherStatusConfig?.label || data.applicationStatus || 'New'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* STUDENT ENQUIRY DETAILS */}
              {type === 'student' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-primary" /> Contact Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{data.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <a
                            href={`tel:${data.phoneNumber}`}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {data.phoneNumber}
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Locality:</span>
                          <span className="font-medium flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            {data.locality}
                            {data.customLocality ? ` (${data.customLocality})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-primary" /> Academic Requirements
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Class / Level:</span>
                          <span className="font-medium">{data.studentClass}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Timing:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {data.preferredTiming}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-medium flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                            {data.budgetRange}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="p-4 rounded-lg border border-border bg-surface space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Subjects Requested
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {Array.isArray(data.subjects) && data.subjects.length > 0 ? (
                        data.subjects.map((s, idx) => {
                          const subName = typeof s === 'string' ? s : s?.subject
                          return (
                            <span
                              key={idx}
                              className="px-2.5 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary"
                            >
                              {subName}
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground">No subjects specified</span>
                      )}
                      {data.customSubject && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-info/10 text-info border border-info/20">
                          {data.customSubject} (Custom)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Additional Notes */}
                  {data.additionalNotes && (
                    <div className="p-4 rounded-lg border border-border bg-surface space-y-1">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Parent / Student Notes
                      </h4>
                      <p className="text-sm text-foreground/90 whitespace-pre-line mt-1">
                        {data.additionalNotes}
                      </p>
                    </div>
                  )}

                  {/* Internal Admin Management Section */}
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-primary" /> Admin Management
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenEdit?.(data)}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Update Management
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs block">Enquiry Status:</span>
                        <span className="font-semibold capitalize">
                          {data.enquiryStatus || 'new'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Assigned Admin ID:</span>
                        <span className="font-mono text-sm">
                          {data.assignedTo?.email || data.assignedTo || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-xs block mb-1">Admin Notes:</span>
                      <div className="text-sm bg-surface p-3 rounded border border-border/80 min-h-[50px] whitespace-pre-line">
                        {data.adminNotes || (
                          <span className="text-muted-foreground italic">No admin notes recorded yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TEACHER APPLICATION DETAILS */}
              {type === 'teacher' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-4 h-4 text-primary" /> Personal & Contact
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Full Name:</span>
                          <span className="font-medium">{data.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mobile:</span>
                          <a
                            href={`tel:${data.mobileNumber}`}
                            className="font-medium text-primary hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {data.mobileNumber}
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          {data.email ? (
                            <a
                              href={`mailto:${data.email}`}
                              className="font-medium text-primary hover:underline flex items-center gap-1"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              {data.email}
                            </a>
                          ) : (
                            <span className="text-muted-foreground italic">Not provided</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Teaching Locality:</span>
                          <span className="font-medium flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                            {data.teachingLocality}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-primary" /> Professional Background
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Highest Qualification:</span>
                          <span className="font-medium">{data.highestQualification}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Experience:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                            {data.teachingExperience}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Primary Subject:</span>
                          <span className="font-medium text-primary">{data.primarySubject}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Class Level Taught:</span>
                          <span className="font-medium">{data.classLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Availability:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {data.preferredAvailability}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KYC & Qualification Documents (Protected Admin Access) */}
                  <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-warning" /> KYC & Verification Documents (Authorized Only)
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Documents are securely fetched through authorized administrator session. Document URLs are never made public.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Aadhaar Document */}
                      <div className="p-3 rounded-lg border border-border bg-surface-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">Aadhaar / ID Proof</p>
                            <p className="text-xs text-muted-foreground">
                              {data.aadhaarDocument ? 'Uploaded by applicant' : 'No document uploaded'}
                            </p>
                          </div>
                        </div>
                        {data.aadhaarDocument && (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={downloadingDoc === 'aadhaar'}
                            onClick={() => handleDownloadDoc(data.aadhaarDocument, 'aadhaar')}
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        )}
                      </div>

                      {/* Qualification Certificate */}
                      <div className="p-3 rounded-lg border border-border bg-surface-2 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <GraduationCap className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">Qualification Certificate</p>
                            <p className="text-xs text-muted-foreground">
                              {data.qualificationDocument ? 'Uploaded by applicant' : 'No document uploaded'}
                            </p>
                          </div>
                        </div>
                        {data.qualificationDocument && (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={downloadingDoc === 'qualification'}
                            onClick={() => handleDownloadDoc(data.qualificationDocument, 'qualification')}
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  {data.additionalNotes && (
                    <div className="p-4 rounded-lg border border-border bg-surface space-y-1">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Applicant Notes
                      </h4>
                      <p className="text-sm text-foreground/90 whitespace-pre-line mt-1">
                        {data.additionalNotes}
                      </p>
                    </div>
                  )}

                  {/* Internal Admin Management Section */}
                  <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-primary" /> Review & Internal Management
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenEdit?.(data)}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Update Status & Notes
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs block">Application Status:</span>
                        <span className="font-semibold capitalize">
                          {data.applicationStatus || 'new'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Reviewed By:</span>
                        <span className="font-mono text-sm">
                          {data.reviewedBy?.email || data.reviewedBy || 'Not reviewed'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Reviewed At:</span>
                        <span className="text-sm">
                          {data.reviewedAt
                            ? new Date(data.reviewedAt).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground text-xs block mb-1">Admin Notes:</span>
                      <div className="text-sm bg-surface p-3 rounded border border-border/80 min-h-[50px] whitespace-pre-line">
                        {data.adminNotes || (
                          <span className="text-muted-foreground italic">No review notes recorded.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogBody>

        <DialogFooter justify="between">
          <Button variant="ghost" onClick={handleClose}>
            Close
          </Button>
          {data && (
            <Button
              variant="primary"
              onClick={() => {
                handleClose()
                onOpenEdit?.(data)
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Management
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
