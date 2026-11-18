import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogClose,
  Button
} from '@/components/ui'
import {
  Save, User, ShieldCheck
} from 'lucide-react'
import {
  REGISTRATION_FEE_CONFIG,
  KYC_CONFIG,
  ALLOCATION_CONFIG,
  ACCOUNT_CONFIG
} from './teachersSampleData'

function getInitialFormData(teacher) {
  if (!teacher) return null
  return {
    name: teacher.name || '',
    email: teacher.email || '',
    mobile: teacher.mobile || '',
    primarySubject: teacher.primarySubject || '',
    qualification: teacher.qualification || '',
    experienceYears: teacher.experienceYears || 0,
    classLevels: teacher.classLevels || '',
    locality: teacher.locality || '',
    availability: teacher.availability || '',
    registrationFeeStatus: teacher.registrationFee?.status || 'pending',
    registrationFeeAmount: teacher.registrationFee?.amount ?? 1000,
    transactionRef: teacher.registrationFee?.transactionRef || '',
    kycStatus: teacher.kyc?.status || 'pending',
    kycReviewNotes: teacher.kyc?.reviewNotes || '',
    allocationStatus: teacher.studentAllocation?.status || 'unallocated',
    accountStatus: teacher.account?.status || 'active',
  }
}

export function TeacherEditModal({
  isOpen,
  onClose,
  teacher,
  onSave
}) {
  const [formData, setFormData] = useState(() => getInitialFormData(teacher))
  const [errors, setErrors] = useState({})

  if (!teacher || !formData) return null

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Full name is required'
    if (!formData.mobile.trim()) newErrors.mobile = 'Mobile number is required'
    if (!formData.primarySubject.trim()) newErrors.primarySubject = 'Primary subject is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const updatedTeacher = {
      ...teacher,
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      primarySubject: formData.primarySubject,
      qualification: formData.qualification,
      experienceYears: Number(formData.experienceYears) || 0,
      classLevels: formData.classLevels,
      locality: formData.locality,
      availability: formData.availability,
      registrationFee: {
        ...teacher.registrationFee,
        status: formData.registrationFeeStatus,
        amount: Number(formData.registrationFeeAmount) || 0,
        transactionRef: formData.transactionRef || (formData.registrationFeeStatus === 'paid' ? 'TXN_UPDATED_LOCAL' : 'None'),
        paymentDate: formData.registrationFeeStatus === 'paid' && teacher.registrationFee?.status !== 'paid' ? 'Today' : teacher.registrationFee?.paymentDate,
      },
      kyc: {
        ...teacher.kyc,
        status: formData.kycStatus,
        reviewNotes: formData.kycReviewNotes,
        reviewedAt: formData.kycStatus === 'verified' && teacher.kyc?.status !== 'verified' ? 'Today' : teacher.kyc?.reviewedAt,
      },
      studentAllocation: {
        ...teacher.studentAllocation,
        status: formData.allocationStatus,
        studentsSummary: formData.allocationStatus === 'unallocated' ? 'Unallocated' : teacher.studentAllocation?.studentsSummary || 'Allocated',
      },
      account: {
        ...teacher.account,
        status: formData.accountStatus,
        updatedAt: 'Just now',
      },
    }

    onSave(updatedTeacher)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader
            title="Edit Teacher Profile & Status"
            description={`Update credentials, fee records, and verification status for ${teacher.name}`}
            action={<DialogClose />}
          />

          <DialogBody className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
            {/* Status Quick Management Cards */}
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> Status Management (Live UI Update)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Registration Fee Status */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Registration Fee
                  </label>
                  <select
                    className="select w-full text-xs"
                    value={formData.registrationFeeStatus}
                    onChange={(e) => handleChange('registrationFeeStatus', e.target.value)}
                  >
                    {Object.entries(REGISTRATION_FEE_CONFIG).map(([val, conf]) => (
                      <option key={val} value={val}>
                        {conf.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* KYC Status */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    KYC Status
                  </label>
                  <select
                    className="select w-full text-xs"
                    value={formData.kycStatus}
                    onChange={(e) => handleChange('kycStatus', e.target.value)}
                  >
                    {Object.entries(KYC_CONFIG).map(([val, conf]) => (
                      <option key={val} value={val}>
                        {conf.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Allocation Status */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Student Allocation
                  </label>
                  <select
                    className="select w-full text-xs"
                    value={formData.allocationStatus}
                    onChange={(e) => handleChange('allocationStatus', e.target.value)}
                  >
                    {Object.entries(ALLOCATION_CONFIG).map(([val, conf]) => (
                      <option key={val} value={val}>
                        {conf.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Status */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Account Status
                  </label>
                  <select
                    className="select w-full text-xs"
                    value={formData.accountStatus}
                    onChange={(e) => handleChange('accountStatus', e.target.value)}
                  >
                    {Object.entries(ACCOUNT_CONFIG).map(([val, conf]) => (
                      <option key={val} value={val}>
                        {conf.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Teacher Profile Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" /> Profile & Contact Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="input w-full text-sm"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g. Dr. Debabrata Banerjee"
                  />
                  {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="input w-full text-sm"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="e.g. teacher@example.com"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Mobile Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="input w-full text-sm"
                    value={formData.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                    placeholder="e.g. +91 98301 24510"
                  />
                  {errors.mobile && <p className="text-xs text-danger mt-1">{errors.mobile}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Primary Subject <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="input w-full text-sm"
                    value={formData.primarySubject}
                    onChange={(e) => handleChange('primarySubject', e.target.value)}
                    placeholder="e.g. Mathematics"
                  />
                  {errors.primarySubject && (
                    <p className="text-xs text-danger mt-1">{errors.primarySubject}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Highest Qualification
                  </label>
                  <input
                    type="text"
                    className="input w-full text-sm"
                    value={formData.qualification}
                    onChange={(e) => handleChange('qualification', e.target.value)}
                    placeholder="e.g. M.Sc. Physics (1st Class), B.Ed."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    className="input w-full text-sm"
                    value={formData.experienceYears}
                    onChange={(e) => handleChange('experienceYears', e.target.value)}
                    placeholder="e.g. 8"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Target Class Levels
                  </label>
                  <input
                    type="text"
                    className="input w-full text-sm"
                    value={formData.classLevels}
                    onChange={(e) => handleChange('classLevels', e.target.value)}
                    placeholder="e.g. Classes 9–12 (CBSE, ICSE), JEE Advanced"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Teaching Locality
                  </label>
                  <input
                    type="text"
                    className="input w-full text-sm"
                    value={formData.locality}
                    onChange={(e) => handleChange('locality', e.target.value)}
                    placeholder="e.g. Salt Lake, Sector 2, Kolkata"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Teaching Availability
                  </label>
                  <input
                    type="text"
                    className="input w-full text-sm"
                    value={formData.availability}
                    onChange={(e) => handleChange('availability', e.target.value)}
                    placeholder="e.g. Mon-Fri: 5:00 PM – 8:30 PM, Weekends: Morning"
                  />
                </div>
              </div>
            </div>

            {/* Fee & KYC Extra Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Registration Fee Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  className="input w-full text-sm"
                  value={formData.registrationFeeAmount}
                  onChange={(e) => handleChange('registrationFeeAmount', e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  className="input w-full text-sm font-mono"
                  value={formData.transactionRef}
                  onChange={(e) => handleChange('transactionRef', e.target.value)}
                  placeholder="e.g. TXN_WF_20260112_8491"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-foreground block mb-1">
                  KYC Review Notes & Audit Comments
                </label>
                <textarea
                  rows="2"
                  className="textarea w-full text-sm"
                  value={formData.kycReviewNotes}
                  onChange={(e) => handleChange('kycReviewNotes', e.target.value)}
                  placeholder="Add administrative review notes regarding ID and qualifications..."
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter justify="end">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              <Save className="w-4 h-4 mr-1.5" />
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
