import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogClose,
  Button
} from '@/components/ui'
import { Plus, User, GraduationCap } from 'lucide-react'
import { CLASS_OPTIONS, LOCALITY_OPTIONS } from './studentsSampleData'

export function StudentAddModal({
  isOpen,
  onClose,
  onAdd,
}) {
  const [formData, setFormData] = useState({
    name: '',
    parentName: '',
    phone: '',
    email: '',
    studentClass: 'Class 10 (ICSE)',
    subjectsText: 'Mathematics, Science',
    locality: 'Salt Lake, Sector 2',
    preferredTiming: 'Weekday Evenings (5 PM - 7 PM)',
    budgetRange: '₹5,000 - ₹7,000 / mo',
    status: 'enrolled',
    assignedTeacher: '',
    schoolName: '',
    adminNotes: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

    setLoading(true)
    try {
      const parsedSubjects = formData.subjectsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      await onAdd({
        name: formData.name.trim(),
        parentName: formData.parentName.trim() || formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        studentClass: formData.studentClass.trim(),
        subjects: parsedSubjects.length > 0 ? parsedSubjects : ['General Studies'],
        locality: formData.locality.trim(),
        preferredTiming: formData.preferredTiming.trim(),
        budgetRange: formData.budgetRange.trim(),
        status: formData.status,
        assignedTeacher: formData.assignedTeacher.trim() || 'Unassigned',
        schoolName: formData.schoolName.trim(),
        adminNotes: formData.adminNotes.trim(),
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader
          title="Add New Student"
          description="Enrol an active student profile directly into Wellfind Academic."
          action={<DialogClose />}
        />

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
            {/* Student & Guardian Info */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Student & Contact Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Student Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Sayan Mukherjee"
                    autoFocus
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
                    placeholder="e.g. Alok Mukherjee"
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
                    placeholder="+91 98300 00000"
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
                    list="new-localities-list"
                    className="field__input w-full"
                    value={formData.locality}
                    onChange={(e) => handleChange('locality', e.target.value)}
                    placeholder="e.g. New Town, Action Area 1"
                  />
                  <datalist id="new-localities-list">
                    {LOCALITY_OPTIONS.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                  {errors.locality && <p className="text-xs text-danger mt-1">{errors.locality}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    School / Institution
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.schoolName}
                    onChange={(e) => handleChange('schoolName', e.target.value)}
                    placeholder="e.g. South Point High School"
                  />
                </div>
              </div>
            </div>

            {/* Academic Setup */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Academic Setup
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Class / Standard <span className="text-danger">*</span>
                  </label>
                  <select
                    className="select w-full"
                    value={formData.studentClass}
                    onChange={(e) => handleChange('studentClass', e.target.value)}
                  >
                    {CLASS_OPTIONS.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Status
                  </label>
                  <select
                    className="select w-full"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <option value="enrolled">Enrolled</option>
                    <option value="active">Active</option>
                    <option value="in_progress">In Progress</option>
                    <option value="paused">Paused</option>
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
                    placeholder="Weekday Evenings (5–7 PM)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Budget Range
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.budgetRange}
                    onChange={(e) => handleChange('budgetRange', e.target.value)}
                    placeholder="₹5,000 - ₹7,000 / mo"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Assigned Tutor (Optional)
                  </label>
                  <input
                    type="text"
                    className="field__input w-full"
                    value={formData.assignedTeacher}
                    onChange={(e) => handleChange('assignedTeacher', e.target.value)}
                    placeholder="e.g. Dr. Debabrata Banerjee (or leave empty)"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Admin Notes
              </label>
              <textarea
                rows={2}
                className="field__input w-full text-xs"
                value={formData.adminNotes}
                onChange={(e) => handleChange('adminNotes', e.target.value)}
                placeholder="Initial onboarding requirements or comments..."
              />
            </div>
          </DialogBody>

          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="neutral" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              <Plus className="w-4 h-4 mr-1.5" />
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

