import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogClose,
  Button
} from '@/components/ui'
import {
  User, Phone, Mail, MapPin, Clock, DollarSign,
  GraduationCap, BookOpen, Calendar, Edit, School, FileText
} from 'lucide-react'
import { StudentStatusBadge } from './StudentStatusBadge'

export function StudentDetailModal({
  isOpen,
  onClose,
  student,
  onOpenEdit,
}) {
  if (!student) return null

  const getInitials = (name) => {
    if (!name) return 'S'
    return name
      .replace(/^(Master|Miss|Mr\.|Mrs\.|Ms\.)\s+/i, '')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const renderValue = (val) => {
    if (val === undefined || val === null || val === '' || val === 'None') {
      return <span className="text-muted-foreground italic">Not specified</span>
    }
    return val
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader
          title="Student Profile & Enrolment"
          description={`Comprehensive student record for ${student.name} (${student.id})`}
          action={<DialogClose />}
        />

        <DialogBody className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Header Summary Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-surface-2 border border-border">
            <div className="flex items-center gap-3.5">
              <div
                className="relative shrink-0 rounded-full overflow-hidden bg-primary/10 text-primary font-semibold flex items-center justify-center ring-2 ring-border text-base"
                style={{ width: '52px', height: '52px', minWidth: '52px', minHeight: '52px' }}
              >
                {getInitials(student.name)}
              </div>
              <div>
                <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                  {student.name}
                  <StudentStatusBadge status={student.status} size="xs" />
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className="font-medium text-foreground">{student.studentClass}</span>
                  {student.schoolName && (
                    <>
                      <span>•</span>
                      <span>{student.schoolName}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onOpenEdit?.(student)
                }}
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Section 1: Contact & Guardian Details */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Contact & Guardian Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface rounded-xl border border-border p-4">
              <div>
                <div className="text-xs text-muted-foreground">Student / Parent Name</div>
                <div className="text-sm font-medium text-foreground mt-0.5">{renderValue(student.name)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Parent / Guardian Name</div>
                <div className="text-sm font-medium text-foreground mt-0.5">{renderValue(student.parentName || student.name)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Mobile Phone</div>
                <div className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <a href={`tel:${student.phone}`} className="hover:text-primary transition-colors">
                    {renderValue(student.phone)}
                  </a>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email Address</div>
                <div className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1.5 font-mono truncate">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <a href={`mailto:${student.email}`} className="hover:text-primary transition-colors truncate">
                    {renderValue(student.email)}
                  </a>
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground">Locality / Area</div>
                <div className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {renderValue(student.locality)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Academic Requirements & Enrolment */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              Academic Requirements & Tutoring Setup
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-surface rounded-xl border border-border p-4">
              <div>
                <div className="text-xs text-muted-foreground">Class / Standard</div>
                <div className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {renderValue(student.studentClass)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">School / Institution</div>
                <div className="text-sm font-medium text-foreground mt-0.5">
                  {renderValue(student.schoolName)}
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs text-muted-foreground mb-1.5">Enrolled Subjects</div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(student.subjects) && student.subjects.length > 0 ? (
                    student.subjects.map((sub, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-2 border border-border text-foreground"
                      >
                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                        {sub}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic text-xs">No subjects listed</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Preferred Class Timing</div>
                <div className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {renderValue(student.preferredTiming)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Tuition Budget Range</div>
                <div className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {renderValue(student.budgetRange)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Assigned Tutor / Teacher</div>
                <div className="text-sm font-medium text-primary mt-0.5">
                  {renderValue(student.assignedTeacher)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Sessions Per Week</div>
                <div className="text-sm font-medium text-foreground mt-0.5">
                  {student.sessionsPerWeek ? `${student.sessionsPerWeek} classes / week` : 'As per schedule'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Admin Notes & Enrolment History */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Administrative Notes & History
            </h4>
            <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
              <div>
                <div className="text-xs text-muted-foreground">Enrolment Date / Record Created</div>
                <div className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {student.submittedDate
                    ? new Date(student.submittedDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Internal Notes</div>
                <div className="text-xs text-foreground bg-surface-2 p-3 rounded-lg border border-border mt-1 whitespace-pre-wrap leading-relaxed">
                  {renderValue(student.adminNotes)}
                </div>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-mono">
            Student ID: <strong>{student.id}</strong>
          </div>
          <Button variant="neutral" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

