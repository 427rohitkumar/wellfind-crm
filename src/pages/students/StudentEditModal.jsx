import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogClose,
  Button
} from '@/components/ui'
import { Save, User, GraduationCap } from 'lucide-react'
import { STUDENT_STATUS_CONFIG, CLASS_OPTIONS, LOCALITY_OPTIONS } from './studentsSampleData'

function getInitialFormData(student) {
  if (!student) return null
  return {
    name: student.name || '',
    parentName: student.parentName || '',
    email: student.email || '',
    phone: student.phone || '',
    studentClass: student.studentClass || '',
    subjectsText: Array.isArray(student.subjects) ? student.subjects.join(', ') : '',
    locality: student.locality || '',
    preferredTiming: student.preferredTiming || '',
    budgetRange: student.budgetRange || '',
    status: student.status || 'active',
    assignedTeacher: student.assignedTeacher || '',
    schoolName: student.schoolName || '',
    adminNotes: student.adminNotes || '',
  }
}

export function StudentEditModal({
  isOpen,
  onClose,
  student,
  onSave,
}) {
  const [formData, setFormData] = useState(() => getInitialFormData(student))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  if (!student || !formData) return null

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Student name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.studentClass.trim()) newErrors.studentClass = 'Class is required'
    if (!formData.locality.trim()) newErrors.locality = 'Locality is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      const parsedSubjects = formData.subjectsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const updatedRecord = {
        name: formData.name.trim(),
        parentName: formData.parentName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        studentClass: formData.studentClass.trim(),
        subjects: parsedSubjects.length > 0 ? parsedSubjects : ['General Studies'],
        locality: formData.locality.trim(),
        preferredTiming: formData.preferredTiming.trim(),
        budgetRange: formData.budgetRange.trim(),
        status: formData.status,
        assignedTeacher: formData.assignedTeacher.trim() || 'Unassigned',
        schoolName: formData.schoolName.trim(),
        adminNotes: formData.adminNotes.trim(),
      }

      await onSave(student.id, updatedRecord)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader
          title="Edit Student Profile"
          description={`Update academic records, status, and guardian details for ${student.name}`}
          action={<DialogClose />}
        />

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
            {/* Section 1: Basic & Guardian Info */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Student & Guardian Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Student Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Rohan Sen"
                  />
                  {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Parent / Guardian Name
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.parentName}
                    onChange={(e) => handleChange('parentName', e.target.value)}
                    placeholder="e.g. Amitabha Sen"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Mobile Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className="field__input w-full font-mono text-xs"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+91 98301 22441"
                  />
                  {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="field__input w-full text-xs font-mono"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="parent@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Locality / Area <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    list="localities-list"
                    className="field__input w-full"
                    value={formData.locality}
                    onChange={(e) => handleChange('locality', e.target.value)}
                    placeholder="e.g. Salt Lake, Sector 2"
                  />
                  <datalist id="localities-list">
                    {LOCALITY_OPTIONS.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                  {errors.locality && <p className="text-xs text-danger mt-1">{errors.locality}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    School / Institution Name
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.schoolName}
                    onChange={(e) => handleChange('schoolName', e.target.value)}
                    placeholder="e.g. St. Xavier's Collegiate"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Academic Requirements */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Academic Setup & Preferences
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Class / Standard <span className="text-danger">*</span>
                  </label>
                  <select
                    className="select w-full"
                    value={formData.studentClass}
                    onChange={(e) => handleChange('studentClass', e.target.value)}
                  >
                    <option value="">Select Class</option>
                    {CLASS_OPTIONS.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                  {errors.studentClass && <p className="text-xs text-danger mt-1">{errors.studentClass}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Enrolment Status
                  </label>
                  <select
                    className="select w-full"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    {Object.entries(STUDENT_STATUS_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Subjects (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.subjectsText}
                    onChange={(e) => handleChange('subjectsText', e.target.value)}
                    placeholder="Mathematics, Physics, Chemistry"
                  />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Separate subjects with commas. Badges will update automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Preferred Timing
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.preferredTiming}
                    onChange={(e) => handleChange('preferredTiming', e.target.value)}
                    placeholder="e.g. Weekday Evenings (5–7 PM)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Tuition Budget Range
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.budgetRange}
                    onChange={(e) => handleChange('budgetRange', e.target.value)}
                    placeholder="e.g. ₹5,000 - ₹7,000 / mo"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Assigned Tutor / Teacher
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.assignedTeacher}
                    onChange={(e) => handleChange('assignedTeacher', e.target.value)}
                    placeholder="e.g. Dr. Debabrata Banerjee"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Admin Notes */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Administrative Notes
              </label>
              <textarea
                rows={3}
                className="field__input w-full text-xs"
                value={formData.adminNotes}
                onChange={(e) => handleChange('adminNotes', e.target.value)}
                placeholder="Add internal notes on student preferences, exam schedules, or progress..."
              />
            </div>
          </DialogBody>

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="neutral" type="button" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

