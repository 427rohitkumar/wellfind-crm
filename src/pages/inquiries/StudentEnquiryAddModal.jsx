import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Loaders'
import { useState, useRef, useEffect } from 'react'
import { X, Check, MapPin, Clock, BookOpen, GraduationCap, User, Sparkles, ArrowLeft, ArrowRight, Send, CheckCircle2, RotateCcw } from 'lucide-react'
import {
  INITIAL_FORM_DATA,
  CLASS_OPTIONS,
  SUBJECT_OPTIONS,
  TIMING_OPTIONS,
  LOCALITY_OPTIONS,
  BUDGET_OPTIONS,
  STEP_LABELS,
  validateStep,
  validateEntireForm
} from './studentEnquiryFormSchema'
import { createStudentEnquiry } from '@/services/studentEnquiryService'

export function StudentEnquiryAddModal({
  isOpen,
  onClose,
  onSuccess
}) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [currentStep, setCurrentStep] = useState(1)
  const [stepError, setStepError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState(null)
  const [apiError, setApiError] = useState(null)

  const totalSteps = 6
  const modalBodyRef = useRef(null)

  // Reset state when modal is closed / opened
  useEffect(() => {
    if (!isOpen) {
      // Clear errors on close
      setStepError(null)
      setApiError(null)
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSubmitting, onClose])

  // Prevent background body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleFieldChange = (updated) => {
    setFormData((prev) => ({ ...prev, ...updated }))
    if (stepError && Object.keys(updated).includes(stepError.field)) {
      setStepError(null)
    }
    if (apiError) {
      setApiError(null)
    }
  }

  const goToStep = (targetStep) => {
    setCurrentStep(targetStep)
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (isSubmitting) return

    const error = validateStep(currentStep, formData)
    if (error) {
      setStepError(error)
      const fieldEl = document.getElementById(error.field)
      if (fieldEl) fieldEl.focus()
      return
    }

    setStepError(null)
    if (currentStep < totalSteps) {
      goToStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (isSubmitting || currentStep <= 1) return
    setStepError(null)
    goToStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    // Validate entire form across all 5 steps
    const fullError = validateEntireForm(formData)
    if (fullError) {
      setStepError(fullError)
      if (fullError.step !== currentStep) {
        goToStep(fullError.step)
      }
      setTimeout(() => {
        const fieldEl = document.getElementById(fullError.field)
        if (fieldEl) fieldEl.focus()
      }, 250)
      return
    }

    setIsSubmitting(true)
    setStepError(null)
    setApiError(null)

    try {
      const response = await createStudentEnquiry(formData)
      const createdEnquiry = response?.enquiry || response?.doc || response

      setSubmissionResult({
        status: 'success',
        message: 'Enquiry submitted successfully.',
        enquiry: createdEnquiry,
      })

      // Notify parent to refresh inquiry list & unread counts
      onSuccess?.(createdEnquiry)
    } catch (err) {
      setApiError(err.message || 'Failed to submit student enquiry. Please verify the information and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA)
    setCurrentStep(1)
    setStepError(null)
    setApiError(null)
    setSubmissionResult(null)
  }

  const progressPercentage = Math.round((currentStep / totalSteps) * 100)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-enquiry-modal-title"
      className="student-enquiry-modal-overlay select-none"
    >
      {/* Click backdrop to close */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => {
          if (!isSubmitting) onClose()
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="student-enquiry-modal-card">
        {/* Subtle decorative teal glows in corners */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -left-16 w-48 sm:w-64 h-48 sm:h-64 rounded-full bg-[#35D0BA]/15 blur-2xl -z-0"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-20 w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-[#35D0BA]/12 blur-3xl -z-0"
        />

        {/* Modal Header Bar */}
        <div className="student-enquiry-modal-header">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#35D0BA] animate-pulse" />
            <span
              id="student-enquiry-modal-title"
              className="text-xs sm:text-sm font-black text-[#101D36] tracking-tight uppercase"
            >
              Wellfind Academic — Home Tutor Enquiry (Admin Entry)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal (Escape)"
            className="p-1.5 sm:p-2 rounded-full bg-[#F4F8FC] border border-[#D7E2EE] text-[#101D36] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA] cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* SUCCESS CONFIRMATION VIEW */}
        {/* ========================================================= */}
        {submissionResult?.status === 'success' ? (
          <div className="w-full max-w-xl mx-auto my-auto p-6 sm:p-10 text-center flex flex-col items-center justify-center animate-fade-in z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#D7F6F1] border-2 border-[#35D0BA] flex items-center justify-center mb-5 shadow-sm">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-[#0F6F63]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#101D36] tracking-tight">
              Student Enquiry Created Successfully!
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-[#53647D] max-w-md mx-auto leading-relaxed">
              Enquiry for <strong className="text-[#101D36]">{formData.parentName}</strong> ({formData.studentClass}) in{' '}
              <strong className="text-[#101D36]">
                {formData.locality === 'Patna (Other Locality)' && formData.customLocality
                  ? `Patna (${formData.customLocality})`
                  : formData.locality}
              </strong>{' '}
              has been saved to the database.
            </p>

            {/* Confirmed Details Capsule */}
            <div className="mt-5 p-4 rounded-xl bg-[#F4F8FC] border border-[#D7E2EE] text-left text-xs sm:text-sm text-[#344054] w-full max-w-md space-y-1.5">
              <div className="text-[11px] font-bold text-[#53647D] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Confirmed Record</span>
                {submissionResult.enquiry?.id && (
                  <span className="font-mono text-primary font-bold">
                    #{submissionResult.enquiry.id}
                  </span>
                )}
              </div>
              <div>• <strong>Class</strong>: {formData.studentClass}</div>
              <div>• <strong>Subjects</strong>: {formData.subjects.join(', ')}{formData.customSubject ? `, ${formData.customSubject}` : ''}</div>
              <div>• <strong>Preferred Timing</strong>: {formData.preferredTiming}</div>
              <div>• <strong>Locality</strong>: {formData.locality === 'Patna (Other Locality)' && formData.customLocality ? `Patna (${formData.customLocality})` : formData.locality}</div>
              <div>• <strong>Contact Mobile</strong>: +91 {formData.phoneNumber}</div>
              <div>• <strong>Estimated Budget</strong>: {formData.budgetRange}</div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto flex-1 px-6 py-2.5 rounded-xl bg-[#35D0BA] text-[#101D36] font-bold text-sm shadow hover:bg-[#2FD0B6] transition-colors cursor-pointer"
              >
                Close Window
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D7E2EE] bg-white text-[#101D36] font-semibold text-xs sm:text-sm hover:bg-[#F4F8FC] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Add Another Enquiry</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* FIVE-STEP FORM VIEW */
          /* ========================================================= */
          <div className="student-enquiry-modal-content">
            {/* Top Progress Indicator */}
            <div className="student-enquiry-modal-progress">
              <div className="w-full max-w-5xl mx-auto">
                <div className="student-enquiry-progress-summary">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-[#D7F6F1] text-[#0F6F63] font-black text-[11px] sm:text-xs uppercase tracking-wider">
                      {currentStep}/{totalSteps} Steps
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#101D36] truncate">
                      {STEP_LABELS[currentStep - 1]}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#53647D]">
                    {progressPercentage}% Completed
                  </span>
                </div>

                {/* Progress bar container */}
                <div className="student-enquiry-progress-bar">
                  <div
                    className="student-enquiry-progress-fill"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                {/* Step dots row below bar */}
                <div className="student-enquiry-progress-steps">
                  {Array.from({ length: totalSteps }, (_, i) => i + 1).map((stepNumber) => {
                    const isCompleted = stepNumber < currentStep
                    const isCurrent = stepNumber === currentStep

                    return (
                      <div
                        key={stepNumber}
                        className={`student-enquiry-progress-step ${isCurrent ? 'is-current' : ''} ${
                          isCompleted ? 'is-completed' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            isCompleted
                              ? 'bg-[#35D0BA] ring-2 ring-[#35D0BA]/30'
                              : isCurrent
                              ? 'bg-[#101D36] scale-125 ring-2 ring-[#101D36]/20'
                              : 'bg-[#D7E2EE]'
                          }`}
                        />
                        <span
                          className={`text-[10px] md:text-[11px] font-medium transition-colors ${
                            isCurrent
                              ? 'text-[#101D36] font-bold'
                              : isCompleted
                              ? 'text-[#0F6F63]'
                              : 'text-[#8A9EB8]'
                          }`}
                        >
                          {STEP_LABELS[stepNumber - 1]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <div
              ref={modalBodyRef}
              className="student-enquiry-modal-body"
            >
              <div className="w-full max-w-5xl mx-auto">
                {/* ---------------------------------------------------- */}
                {/* STEP 1: CLASS SELECTION */}
                {/* ---------------------------------------------------- */}
                {currentStep === 1 && (
                  <div className="student-enquiry-step-row student-enquiry-step-row--timing animate-fade-in">
                    {/* Character Illustration (Left) */}
                    <div className="student-enquiry-col-illustration">
                      <div className="student-enquiry-img-wrapper">
                        <img
                          src="/class.png"
                          alt="Kaunsi class ke liye tutor required hai?"
                          className="student-enquiry-img"
                          loading="eager"
                        />
                      </div>
                      <span className="sr-only">Question: Kaunsi class ke liye tutor required hai?</span>
                    </div>

                    {/* Options (Right) */}
                    <div className="student-enquiry-col-form">
                      <div className="mb-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D7F6F1] text-[#0F6F63] text-xs font-bold uppercase tracking-wider mb-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Step 1 of 6</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#101D36] tracking-tight">
                          Select Student&apos;s Class
                        </h3>
                        <p className="text-xs sm:text-sm text-[#53647D] mt-0.5">
                          Choose the current academic standard for which home tuition is needed.
                        </p>
                      </div>

                      {/* Grid of Class Pills */}
                      <div className="student-enquiry-class-grid">
                        {CLASS_OPTIONS.map((item) => {
                          const isSelected = formData.studentClass === item.label

                          return (
                            <button
                              type="button"
                              key={item.label}
                              onClick={() => handleFieldChange({ studentClass: item.label })}
                              className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                                isSelected
                                  ? 'border-[#35D0BA] bg-[#EAF8F6] text-[#101D36] ring-2 ring-[#35D0BA]/30 shadow-xs'
                                  : 'border-[#D7E2EE] bg-white text-[#344054] hover:bg-[#F4F8FC] hover:border-[#B8CCE0]'
                              } ${stepError?.field === 'studentClass' && !formData.studentClass ? 'border-red-400 bg-red-50/50' : ''}`}
                            >
                              <div>
                                <span className="block text-xs sm:text-sm font-bold">{item.label}</span>
                                <span className="text-[10px] text-[#53647D] font-medium">
                                  {item.category}
                                </span>
                              </div>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-[#35D0BA] flex items-center justify-center shrink-0">
                                  <Check className="w-2.5 h-2.5 text-[#101D36] stroke-[3]" />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {stepError?.field === 'studentClass' && (
                        <p className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                          {stepError.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 2: SUBJECTS */}
                {/* ---------------------------------------------------- */}
                {currentStep === 2 && (
                  <div className="student-enquiry-step-row animate-fade-in">
                    {/* Character Illustration (Left) */}
                    <div className="student-enquiry-col-illustration">
                      <div className="student-enquiry-img-wrapper">
                        <img
                          src="/subject.png"
                          alt="Kaunse subjects ke liye tutor chahiye?"
                          className="student-enquiry-img"
                          loading="eager"
                        />
                      </div>
                      <span className="sr-only">Question: Kaunse subjects ke liye tutor chahiye?</span>
                    </div>

                    {/* Options (Right) */}
                    <div className="student-enquiry-col-form">
                      <div className="mb-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D7F6F1] text-[#0F6F63] text-xs font-bold uppercase tracking-wider mb-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Step 2 of 6</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#101D36] tracking-tight">
                          Select Required Subject(s)
                        </h3>
                        <p className="text-xs sm:text-sm text-[#53647D] mt-0.5">
                          Select one or multiple subjects where your child needs tutor assistance.
                        </p>
                      </div>

                      {/* Subjects Grid */}
                      <div className="student-enquiry-subject-grid">
                        {SUBJECT_OPTIONS.map((sub) => {
                          const isSelected = formData.subjects.includes(sub)

                          const handleToggleSubject = () => {
                            let updated
                            if (sub === 'All School Subjects') {
                              updated = formData.subjects.includes('All School Subjects')
                                ? []
                                : ['All School Subjects']
                            } else {
                              const withoutAll = formData.subjects.filter((s) => s !== 'All School Subjects')
                              if (withoutAll.includes(sub)) {
                                updated = withoutAll.filter((s) => s !== sub)
                              } else {
                                updated = [...withoutAll, sub]
                              }
                            }
                            handleFieldChange({ subjects: updated })
                          }

                          return (
                            <button
                              type="button"
                              key={sub}
                              onClick={handleToggleSubject}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                                isSelected
                                  ? 'border-[#35D0BA] bg-[#EAF8F6] text-[#101D36] ring-2 ring-[#35D0BA]/30 shadow-xs'
                                  : 'border-[#D7E2EE] bg-white text-[#344054] hover:bg-[#F4F8FC] hover:border-[#B8CCE0]'
                              } ${stepError?.field === 'subjects' && formData.subjects.length === 0 ? 'border-red-400 bg-red-50/50' : ''}`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                                  isSelected
                                    ? 'bg-[#35D0BA] border-[#35D0BA] text-[#101D36]'
                                    : 'border-[#CBD5E1] bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                              <span>{sub}</span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Custom Subject Note */}
                      <div className="student-enquiry-custom-subject">
                        <label
                          htmlFor="customSubject"
                          className="student-enquiry-custom-subject__label"
                        >
                          Other Subject / Specific Syllabus (Optional)
                        </label>
                        <input
                          type="text"
                          id="customSubject"
                          value={formData.customSubject || ''}
                          onChange={(e) => handleFieldChange({ customSubject: e.target.value })}
                          placeholder="e.g. NTSE foundation, Olympiad, Spoken English"
                          className="student-enquiry-custom-subject__input w-full rounded-xl border border-[#D7E2EE] bg-white text-xs sm:text-sm text-[#101D36] focus:outline-none focus:ring-2 focus:ring-[#35D0BA]/50 focus:border-[#35D0BA]"
                        />
                      </div>

                      {stepError?.field === 'subjects' && (
                        <p className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                          {stepError.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 3: PREFERRED TIMING */}
                {/* ---------------------------------------------------- */}
                {currentStep === 3 && (
                  <div className="student-enquiry-step-row student-enquiry-step-row--timing animate-fade-in">
                    {/* Character Illustration (Left) */}
                    <div className="student-enquiry-col-illustration">
                      <div className="student-enquiry-img-wrapper">
                        <img
                          src="/teaching-time.png"
                          alt="Padhai ke liye best timing kaunsi rahegi?"
                          className="student-enquiry-img"
                          loading="eager"
                        />
                      </div>
                      <span className="sr-only">Question: Padhai ke liye best timing kaunsi rahegi?</span>
                    </div>

                    {/* Options (Right) */}
                    <div className="student-enquiry-col-form">
                      <div className="mb-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D7F6F1] text-[#0F6F63] text-xs font-bold uppercase tracking-wider mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Step 3 of 6</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#101D36] tracking-tight">
                          Preferred Tuition Timing
                        </h3>
                        <p className="text-xs sm:text-sm text-[#53647D] mt-0.5">
                          Select the time slot that fits your child&apos;s school schedule and daily routine.
                        </p>
                      </div>

                      {/* Timing Cards List */}
                      <div className="student-enquiry-timing-options">
                        {TIMING_OPTIONS.map((slot) => {
                          const isSelected = formData.preferredTiming === slot.label

                          return (
                            <button
                              type="button"
                              key={slot.label}
                              onClick={() => handleFieldChange({ preferredTiming: slot.label })}
                              className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                                isSelected
                                  ? 'border-[#35D0BA] bg-[#EAF8F6] text-[#101D36] ring-2 ring-[#35D0BA]/30 shadow-xs'
                                  : 'border-[#D7E2EE] bg-white text-[#344054] hover:bg-[#F4F8FC] hover:border-[#B8CCE0]'
                              } ${stepError?.field === 'preferredTiming' && !formData.preferredTiming ? 'border-red-400 bg-red-50/50' : ''}`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'border-[#35D0BA] bg-[#35D0BA]'
                                      : 'border-[#CBD5E1] bg-white'
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#101D36]" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs sm:text-sm font-bold text-[#101D36]">
                                    {slot.label}
                                  </div>
                                  <div className="text-[10px] sm:text-[11px] text-[#53647D]">
                                    {slot.desc}
                                  </div>
                                </div>
                              </div>
                              <Clock
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-[#0F6F63]' : 'text-[#94A3B8]'
                                }`}
                              />
                            </button>
                          )
                        })}
                      </div>

                      {stepError?.field === 'preferredTiming' && (
                        <p className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                          {stepError.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 4: LOCALITY & BUDGET */}
                {/* ---------------------------------------------------- */}
                {currentStep === 4 && (
                  <div className="student-enquiry-step-row student-enquiry-step-row--budget animate-fade-in">
                    {/* Character Illustration (Left) */}
                    <div className="student-enquiry-col-illustration">
                      <div className="student-enquiry-img-wrapper">
                        <img
                          src="/budget-range-removebg.png"
                          alt="Aapka monthly budget range kitna rahega?"
                          className="student-enquiry-img"
                          loading="eager"
                        />
                      </div>
                      <span className="sr-only">Question: Aapka monthly budget range kitna rahega?</span>
                    </div>

                    {/* Options (Right) */}
                    <div className="student-enquiry-col-form">
                      <div className="mb-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D7F6F1] text-[#0F6F63] text-xs font-bold uppercase tracking-wider mb-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Step 4 of 6</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#101D36] tracking-tight">
                          Locality in Patna & Budget
                        </h3>
                        <p className="text-xs sm:text-sm text-[#53647D] mt-0.5">
                          Select your residential neighborhood for hyperlocal tutor matching.
                        </p>
                      </div>

                      <div className="student-enquiry-budget-form">
                        {/* Locality Dropdown */}
                        <div>
                          <label
                            htmlFor="localitySelect"
                            className="block text-xs font-bold text-[#101D36] uppercase tracking-wider mb-1"
                          >
                            Patna Locality / Area <span className="text-red-500">*</span>
                          </label>
                          <select
                            id="localitySelect"
                            value={formData.locality}
                            onChange={(e) => handleFieldChange({ locality: e.target.value })}
                            className={`w-full px-3 py-2 rounded-xl border text-xs sm:text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#35D0BA]/50 focus:border-[#35D0BA] ${
                              stepError?.field === 'locality' && !formData.locality
                                ? 'border-red-400 bg-red-50/50'
                                : 'border-[#D7E2EE] text-[#101D36]'
                            }`}
                          >
                            <option value="">-- Choose Your Patna Area --</option>
                            {LOCALITY_OPTIONS.map((loc) => (
                              <option key={loc} value={loc}>
                                {loc}
                              </option>
                            ))}
                          </select>

                          {formData.locality === 'Patna (Other Locality)' && (
                            <div className="mt-2">
                              <input
                                type="text"
                                id="customLocality"
                                value={formData.customLocality || ''}
                                onChange={(e) => handleFieldChange({ customLocality: e.target.value })}
                                placeholder="Enter your colony / landmark in Patna"
                                className={`w-full px-3 py-2 rounded-xl border bg-white text-xs sm:text-sm text-[#101D36] focus:outline-none focus:ring-2 focus:ring-[#35D0BA]/50 focus:border-[#35D0BA] ${
                                  stepError?.field === 'customLocality' ? 'border-red-400 bg-red-50/50' : 'border-[#D7E2EE]'
                                }`}
                              />
                            </div>
                          )}

                          {(stepError?.field === 'locality' || stepError?.field === 'customLocality') && (
                            <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                              {stepError.message}
                            </p>
                          )}
                        </div>

                        {/* Budget Range Selection */}
                        <div>
                          <label className="student-enquiry-budget-label block text-xs font-bold text-[#101D36] uppercase tracking-wider mb-1">
                            Estimated Monthly Budget Range <span className="text-[#53647D] lowercase font-normal">(optional)</span>
                          </label>
                          <div className="student-enquiry-budget-grid">
                            {BUDGET_OPTIONS.map((budget) => {
                              const isSelected = formData.budgetRange === budget

                              return (
                                <button
                                  type="button"
                                  key={budget}
                                  onClick={() => handleFieldChange({ budgetRange: budget })}
                                  className={`px-3 py-2 rounded-xl border text-left text-xs font-semibold transition-all duration-150 cursor-pointer ${
                                    isSelected
                                      ? 'border-[#35D0BA] bg-[#EAF8F6] text-[#101D36] ring-2 ring-[#35D0BA]/30 shadow-xs'
                                      : 'border-[#D7E2EE] bg-white text-[#344054] hover:bg-[#F4F8FC] hover:border-[#B8CCE0]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{budget}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-[#0F6F63] stroke-[3]" />}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 5: GENDER & TEACHER PREFERENCE */}
                {/* ---------------------------------------------------- */}
                {currentStep === 5 && (
                  <div className="animate-fade-in" style={{ maxWidth: 560, margin: '0 auto' }}>
                    <div className="mb-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D7F6F1] text-[#0F6F63] text-xs font-bold uppercase tracking-wider mb-1">
                        <User className="w-3.5 h-3.5" />
                        <span>Step 5 of 6</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#101D36] tracking-tight">Gender &amp; Teacher Preference</h3>
                      <p className="text-xs sm:text-sm text-[#53647D] mt-0.5">Helps us match a teacher who is the right fit for the student.</p>
                    </div>
                    <div className="student-enquiry-contact-fields">
                      <div>
                        <span className="block text-xs font-bold text-[#101D36] uppercase tracking-wider mb-1">Student&apos;s gender <span className="text-red-500">*</span></span>
                        <div className="wf-genderpick" role="radiogroup">
                          {[['male', 'Boy', '👦'], ['female', 'Girl', '👧'], ['other', 'Other', '🧑']].map(([v, l, e]) => (
                            <button key={v} type="button" role="radio" aria-checked={formData.studentGender === v} className={formData.studentGender === v ? 'is-on' : ''} onClick={() => handleFieldChange({ studentGender: v })}>
                              <span>{e}</span><b>{l}</b>
                            </button>
                          ))}
                        </div>
                        {stepError?.field === 'studentGender' && <p className="text-xs text-red-600 font-semibold mt-1">{stepError.message}</p>}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-[#101D36] uppercase tracking-wider mb-1">Preferred teacher <span className="text-[#53647D] lowercase font-normal">(optional)</span></span>
                        <div className="wf-genderpick" role="radiogroup">
                          {[['male', 'Male teacher', '👨‍🏫'], ['female', 'Female teacher', '👩‍🏫'], ['any', 'Anyone', '🙂']].map(([v, l, e]) => (
                            <button key={v} type="button" role="radio" aria-checked={formData.preferredTeacherGender === v} className={formData.preferredTeacherGender === v ? 'is-on' : ''} onClick={() => handleFieldChange({ preferredTeacherGender: v })}>
                              <span>{e}</span><b>{l}</b>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STEP 6: CONTACT DETAILS */}
                {/* ---------------------------------------------------- */}
                {currentStep === 6 && (
                  <div className="student-enquiry-step-row student-enquiry-step-row--top student-enquiry-step-row--contact animate-fade-in">
                    {/* Character & Summary (Left) */}
                    <div className="student-enquiry-col-illustration">
                      <div className="student-enquiry-img-wrapper" style={{ height: '140px' }}>
                        <img
                          src="/contact-no.png"
                          alt="Apna contact number fill kijiye."
                          className="student-enquiry-img"
                          style={{ maxHeight: '140px' }}
                          loading="eager"
                        />
                      </div>
                      <span className="sr-only">Question: Apna contact number fill kijiye.</span>

                      {/* Your Requirements Summary Capsule */}
                      <div className="student-enquiry-requirements-summary mt-2.5 w-full max-w-[270px] bg-[#F4F8FC] rounded-xl p-3 text-xs text-[#344054] space-y-1 text-left">
                        <div className="font-bold text-[#101D36] text-[11px] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#0F6F63]" />
                          <span>Your Requirements Summary</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#53647D]">Class:</span>
                          <span className="font-semibold text-[#101D36]">{formData.studentClass || 'Not selected'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#53647D]">Subjects:</span>
                          <span className="font-semibold text-[#101D36] truncate max-w-[150px]">
                            {formData.subjects.join(', ') || 'Not selected'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#53647D]">Locality:</span>
                          <span className="font-semibold text-[#101D36] truncate max-w-[150px]">
                            {formData.locality === 'Patna (Other Locality)' && formData.customLocality
                              ? `Patna (${formData.customLocality})`
                              : formData.locality || 'Not selected'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#53647D]">Timing:</span>
                          <span className="font-semibold text-[#101D36] truncate max-w-[150px]">{formData.preferredTiming || 'Flexible'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Inputs (Right) */}
                    <div className="student-enquiry-col-form">
                      <div className="mb-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D7F6F1] text-[#0F6F63] text-xs font-bold uppercase tracking-wider mb-1">
                          <User className="w-3.5 h-3.5" />
                          <span>Step 6 of 6</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#101D36] tracking-tight">
                          Student &amp; Contact Details
                        </h3>
                        <p className="text-xs sm:text-sm text-[#53647D] mt-0.5">
                          Our academic counselor in Patna will contact you to confirm tutor profiles and demo schedule.
                        </p>
                      </div>

                      <div className="student-enquiry-contact-fields">
                        {/* Parent Name */}
                        <div>
                          <label
                            htmlFor="parentName"
                            className="block text-xs font-bold text-[#101D36] uppercase tracking-wider mb-1"
                          >
                            Student&apos;s Name <span className="text-red-500">*</span>
                          </label>
                          <div className="student-enquiry-parent-name-field">
                            <input
                              type="text"
                              id="parentName"
                              value={formData.parentName}
                              onChange={(e) => handleFieldChange({ parentName: e.target.value })}
                              placeholder="Name of the student who will study"
                              className={`w-full px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${
                                stepError?.field === 'parentName'
                                  ? 'border-red-400 bg-red-50/50 focus:ring-red-300'
                                  : 'border-[#D7E2EE] bg-white text-[#101D36] focus:ring-[#35D0BA]/50 focus:border-[#35D0BA]'
                              }`}
                              required
                            />
                          </div>
                          {stepError?.field === 'parentName' && (
                            <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              {stepError.message}
                            </p>
                          )}
                        </div>

                        {/* Phone Number */}
                        <div>
                          <label
                            htmlFor="phoneNumber"
                            className="block text-xs font-bold text-[#101D36] uppercase tracking-wider mb-1"
                          >
                            10-Digit Mobile / WhatsApp Number <span className="text-red-500">*</span>
                          </label>
                          <div className="student-enquiry-phone-field relative flex">
                            <div className="student-enquiry-phone-prefix inline-flex items-center rounded-l-xl bg-[#F4F8FC] text-[#101D36] text-xs font-bold shrink-0">
                              IN +91
                            </div>
                            <input
                              type="tel"
                              id="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={(e) => {
                                const clean = e.target.value.replace(/\D/g, '').slice(0, 10)
                                handleFieldChange({ phoneNumber: clean })
                              }}
                              placeholder="9876543210"
                              maxLength={10}
                              className={`student-enquiry-phone-input w-full rounded-r-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${
                                stepError?.field === 'phoneNumber'
                                  ? 'border-red-400 bg-red-50/50 focus:ring-red-300'
                                  : 'border-[#D7E2EE] bg-white text-[#101D36] focus:ring-[#35D0BA]/50 focus:border-[#35D0BA]'
                              }`}
                              required
                            />
                          </div>
                          {stepError?.field === 'phoneNumber' && (
                            <p className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              {stepError.message}
                            </p>
                          )}
                        </div>

                        {/* Teacher Preference / Notes */}
                        <div>
                          <label
                            htmlFor="additionalNotes"
                            className="block text-xs font-bold text-[#101D36] uppercase tracking-wider mb-1"
                          >
                            Any specific teacher preference? <span className="text-[#53647D] lowercase font-normal">(optional)</span>
                          </label>
                          <div className="student-enquiry-preference-field">
                            <textarea
                              id="additionalNotes"
                              rows={2}
                              value={formData.additionalNotes}
                              onChange={(e) => handleFieldChange({ additionalNotes: e.target.value })}
                              placeholder="e.g. CBSE pattern, female tutor preferred, exam preparation focus"
                              className="w-full px-3.5 py-1.5 rounded-xl border border-[#D7E2EE] bg-white text-xs sm:text-sm text-[#101D36] focus:outline-none focus:ring-2 focus:ring-[#35D0BA]/50 focus:border-[#35D0BA]"
                            />
                          </div>
                        </div>

                        {/* Consent Checkbox */}
                        <div className="flex items-start gap-2 pt-0.5">
                          <input
                            type="checkbox"
                            id="agreedToPolicy"
                            checked={formData.agreedToPolicy}
                            onChange={(e) => handleFieldChange({ agreedToPolicy: e.target.checked })}
                            className="mt-0.5 rounded border-[#CBD5E1] text-[#0F6F63] focus:ring-[#35D0BA] cursor-pointer"
                          />
                          <label htmlFor="agreedToPolicy" className="text-[11px] text-[#53647D] leading-tight cursor-pointer">
                            I agree to be contacted by Wellfind Academic coordinators regarding home tutor options in Patna.
                          </label>
                        </div>
                        {stepError?.field === 'agreedToPolicy' && (
                          <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            {stepError.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Sticky Navigation Bar */}
            <div className="student-enquiry-modal-footer">
              <div className="w-full max-w-5xl mx-auto">
                {/* Global / Step Error Alert */}
                {(stepError?.message || apiError) && (
                  <Alert variant="error" title={apiError || stepError?.message} className="mb-2" />
                )}

                <div className="flex items-center justify-between gap-3">
                  {/* Previous Button */}
                  <div>
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrevious}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D7E2EE] bg-white text-[#101D36] text-xs sm:text-sm font-bold hover:bg-[#F4F8FC] hover:border-[#B8CCE0] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA] disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>
                    ) : (
                      <div className="w-16" />
                    )}
                  </div>

                  {/* Step counter */}
                  <div className="text-xs font-semibold text-[#53647D]">
                    Step {currentStep} of {totalSteps}
                  </div>

                  {/* Next Step or Submit Button */}
                  <div>
                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-5 sm:px-6 py-2 rounded-xl bg-[#35D0BA] text-[#101D36] font-bold text-xs sm:text-sm shadow hover:bg-[#2FD0B6] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA]"
                      >
                        <span>Next Step</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 px-6 sm:px-7 py-2 rounded-xl bg-[#35D0BA] text-[#101D36] font-black text-xs sm:text-sm shadow hover:bg-[#2FD0B6] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35D0BA] disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner size={16} />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Tuition Request</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
