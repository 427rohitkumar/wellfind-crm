import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogClose,
  Button
} from '@/components/ui'
import {
  User, Phone, Mail, MapPin, Clock, DollarSign,
  GraduationCap, Briefcase, FileText, CheckCircle2,
  Users, Calendar, Edit, ShieldCheck, Hash
} from 'lucide-react'
import { TeacherStatusBadge } from './TeacherStatusBadge'

export function TeacherDetailModal({
  isOpen,
  onClose,
  teacher,
  onOpenEdit,
}) {
  if (!teacher) return null

  const getInitials = (name) => {
    if (!name) return 'T'
    return name
      .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, '')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const renderValue = (val) => {
    if (val === undefined || val === null || val === '' || val === 'None') {
      return <span className="text-muted-foreground italic">Not available</span>
    }
    return val
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader
          title="Teacher Profile & Verification"
          description={`Comprehensive record and credentials for ${teacher.name} (${teacher.id})`}
          action={<DialogClose />}
        />

        <DialogBody className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Header Summary Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-2 border border-border">
            <div className="flex items-center gap-3.5">
              <div
                className="relative shrink-0 rounded-full overflow-hidden bg-neutral ring-2 ring-border"
                style={{ width: '52px', height: '52px', minWidth: '52px', minHeight: '52px' }}
              >
                {teacher.avatar ? (
                  <img
                    src={teacher.avatar}
                    alt={teacher.name}
                    className="w-full h-full object-cover block"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg"
                    style={{ width: '100%', height: '100%' }}
                  >
                    {getInitials(teacher.name)}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-foreground">{teacher.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-muted text-muted-foreground">
                    {teacher.id}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>{teacher.primarySubject}</span>
                  <span>•</span>
                  <span>{teacher.qualification}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Account Status
                </span>
                <TeacherStatusBadge type="account" value={teacher.account?.status} />
              </div>
            </div>
          </div>

          {/* SECTION 1: PROFILE */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" /> Teacher Profile & Contact
              </h4>
              <span className="text-xs text-muted-foreground font-medium">Primary Info</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name:
                </span>
                <span className="font-medium text-foreground text-right">{teacher.name}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address:
                </span>
                <a
                  href={`mailto:${teacher.email}`}
                  className="font-medium text-primary hover:underline text-right break-all"
                >
                  {teacher.email}
                </a>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Mobile Number:
                </span>
                <a
                  href={`tel:${teacher.mobile}`}
                  className="font-medium text-primary hover:underline font-mono"
                >
                  {teacher.mobile}
                </a>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Highest Qualification:
                </span>
                <span className="font-medium text-foreground text-right">{renderValue(teacher.qualification)}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" /> Teaching Experience:
                </span>
                <span className="font-medium text-foreground">
                  {teacher.experienceYears ? `${teacher.experienceYears} years` : 'Not available'}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Primary Subject:
                </span>
                <span className="font-medium text-foreground">{renderValue(teacher.primarySubject)}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Target Class Levels:
                </span>
                <span className="font-medium text-foreground text-right">{renderValue(teacher.classLevels)}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Teaching Locality:
                </span>
                <span className="font-medium text-foreground text-right">{renderValue(teacher.locality)}</span>
              </div>

              <div className="md:col-span-2 flex items-start justify-between gap-2 pt-2 border-t border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5 shrink-0">
                  <Clock className="w-3.5 h-3.5" /> Teaching Availability:
                </span>
                <span className="font-medium text-foreground text-right">{renderValue(teacher.availability)}</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: REGISTRATION FEE */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-primary" /> Annual Registration Fee
              </h4>
              <TeacherStatusBadge type="fee" value={teacher.registrationFee?.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Annual Fee Amount:</span>
                <span className="font-semibold text-foreground">
                  {teacher.registrationFee?.amount === 0
                    ? 'Waived (₹0)'
                    : `₹${(teacher.registrationFee?.amount || 1000).toLocaleString('en-IN')} / year`}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Payment Status:</span>
                <span className="font-medium">
                  <TeacherStatusBadge type="fee" value={teacher.registrationFee?.status} />
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Registration / Renewal Year:</span>
                <span className="font-medium text-foreground">
                  {renderValue(teacher.registrationFee?.year || '2026–2027')}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Payment Date:</span>
                <span className="font-medium text-foreground">
                  {renderValue(teacher.registrationFee?.paymentDate)}
                </span>
              </div>

              <div className="md:col-span-2 flex items-start justify-between gap-2 pt-2 border-t border-border/50">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Transaction Reference:
                </span>
                <span className="font-mono text-xs font-semibold bg-muted px-2 py-1 rounded text-foreground">
                  {renderValue(teacher.registrationFee?.transactionRef)}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: KYC VERIFICATION */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> KYC Verification & Compliance
              </h4>
              <TeacherStatusBadge type="kyc" value={teacher.kyc?.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">KYC Status:</span>
                <span>
                  <TeacherStatusBadge type="kyc" value={teacher.kyc?.status} />
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Verification Date:</span>
                <span className="font-medium text-foreground">
                  {renderValue(teacher.kyc?.reviewedAt)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Aadhaar Document Status:</span>
                <span className="font-medium text-foreground text-right">
                  {renderValue(teacher.kyc?.aadhaarStatus)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Qualification Document:</span>
                <span className="font-medium text-foreground text-right">
                  {renderValue(teacher.kyc?.qualificationStatus)}
                </span>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-border/50 space-y-1.5">
                <span className="text-muted-foreground text-xs font-medium block">
                  Super Admin Review Notes:
                </span>
                <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs text-foreground leading-relaxed">
                  {renderValue(teacher.kyc?.reviewNotes)}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: STUDENT ALLOCATION */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Student Allocation Details
              </h4>
              <TeacherStatusBadge type="allocation" value={teacher.studentAllocation?.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Allocation Status:</span>
                <span>
                  <TeacherStatusBadge type="allocation" value={teacher.studentAllocation?.status} />
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Allocation Date:</span>
                <span className="font-medium text-foreground">
                  {renderValue(teacher.studentAllocation?.allocationDate)}
                </span>
              </div>

              <div className="md:col-span-2 flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Assigned Subjects:</span>
                <span className="font-medium text-foreground text-right">
                  {teacher.studentAllocation?.assignedSubjects?.length > 0
                    ? teacher.studentAllocation.assignedSubjects.join(', ')
                    : 'None assigned'}
                </span>
              </div>

              {/* List of allocated students */}
              <div className="md:col-span-2 pt-2 border-t border-border/50 space-y-2">
                <span className="text-muted-foreground text-xs font-medium block">
                  Allocated Students ({teacher.studentAllocation?.students?.length || 0}):
                </span>

                {teacher.studentAllocation?.students && teacher.studentAllocation.students.length > 0 ? (
                  <div className="space-y-2">
                    {teacher.studentAllocation.students.map((student, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-surface-2 border border-border text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          <span className="font-semibold text-foreground">{student.name}</span>
                          <span className="text-muted-foreground font-mono">({student.class})</span>
                        </div>
                        <span className="font-medium px-2 py-0.5 rounded bg-surface border border-border text-foreground">
                          {student.subject}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-surface-2 border border-dashed border-border text-center text-xs text-muted-foreground">
                    No students currently allocated to this teacher.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 5: ACCOUNT METADATA */}
          <div className="p-4 rounded-xl border border-border bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" /> Account Status & Timeline
              </h4>
              <TeacherStatusBadge type="account" value={teacher.account?.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Account Status:</span>
                <span>
                  <TeacherStatusBadge type="account" value={teacher.account?.status} />
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">System Record ID:</span>
                <span className="font-mono font-medium text-foreground">{teacher.id}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Registered At:</span>
                <span className="font-medium text-foreground">
                  {renderValue(teacher.account?.createdAt)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium text-foreground">
                  {renderValue(teacher.account?.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter justify="between">
          <Button
            variant="outline"
            onClick={() => {
              onClose()
              if (onOpenEdit) onOpenEdit(teacher)
            }}
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Edit Teacher Profile
          </Button>

          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
