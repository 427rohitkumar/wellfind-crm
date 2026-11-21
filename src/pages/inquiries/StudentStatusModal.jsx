import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, GraduationCap, Globe, MapPin } from 'lucide-react'
import { Button } from '@/components/ui'
import { FormRow, Modal, Notice } from '@/pages/admin/adminUi'
import { inputCls } from '@/pages/admin/useLoad'
import { TEST_MODES, convertStudentEnquiry, createEnquiryTest, listEnquiryTests } from '@/services/adminApi'
import {
  getStudentStatusLabel,
  updateStudentEnquiry,
} from '@/services/studentEnquiryService'

const COPY = {
  contacted: {
    title: 'Mark as contacted',
    hint: 'Note what you discussed with the parent/student on the call.',
    cta: 'Save as Contacted',
  },
  in_progress: {
    title: 'Mark as verified / in progress',
    hint: 'Confirm that class, subjects, timing, locality and budget were verified on the call.',
    cta: 'Save as In Progress',
  },
  test: {
    title: 'Request assessment test',
    hint: 'Only for parents / students who want the test (it measures IQ, creativity and academic level). Skip it by moving the student straight to Students. Payment, tester and schedule are handled in the Tests menu.',
    cta: 'Request Test',
  },
  converted: {
    title: 'Move to Students',
    hint: 'The enquiry is complete (verified; test done or skipped). It leaves Inquiries and continues in the Students tab, where a teacher is allocated and the fee & commission are decided.',
    cta: 'Move to Students',
  },
  closed: {
    title: 'Close enquiry',
    hint: 'A reason is mandatory when closing an enquiry.',
    cta: 'Close Enquiry',
  },
}

/**
 * One modal for every admin status move on a student enquiry. It collects what
 * the target status needs (call notes, test details, close reason) and talks to
 * the backend: PATCH for normal moves, the convert endpoint for "Send to Allocation".
 */
export function StudentStatusModal({ enquiry, targetStatus, onClose, onDone }) {
  const current = enquiry.enquiryStatus || 'new'
  const reopening = current === 'closed'
  const isTest = targetStatus === 'test'
  const isConvert = targetStatus === 'converted'
  const reasonRequired = targetStatus === 'closed' || reopening
  const copy = COPY[targetStatus] || {
    title: `Change status to ${getStudentStatusLabel(targetStatus)}`,
    hint: '',
    cta: 'Update',
  }

  const [notes, setNotes] = useState('')
  const [reason, setReason] = useState('')
  const [testMode, setTestMode] = useState(enquiry.testMode === 'physical' ? 'physical' : 'digital')
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const mergedNotes = useMemo(() => {
    const trimmed = notes.trim()
    if (!trimmed) return null
    const stamp = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    const entry = `[${stamp} · ${getStudentStatusLabel(targetStatus)}] ${trimmed}`
    return enquiry.adminNotes ? `${enquiry.adminNotes}\n\n${entry}` : entry
  }, [notes, enquiry.adminNotes, targetStatus])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (reasonRequired && !reason.trim()) {
      setError('Please provide a reason.')
      return
    }
    setSaving(true)
    try {
      if (isTest) {
        // The test lives in the Tests module: create it there and open it.
        if (current === 'test') {
          const res = await listEnquiryTests({ enquiry: enquiry.id, limit: 1 })
          navigate(res?.docs?.[0] ? `/admin/tests/${res.docs[0].id}` : '/admin/tests')
          return
        }
        if (mergedNotes) await updateStudentEnquiry(enquiry.id, { adminNotes: mergedNotes })
        const created = await createEnquiryTest({ studentEnquiryId: enquiry.id, mode: testMode })
        onDone({ kind: 'test', testId: created?.id, enquiryId: enquiry.id })
      } else if (isConvert) {
        // Persist the call notes first, then create the student record.
        if (mergedNotes) await updateStudentEnquiry(enquiry.id, { adminNotes: mergedNotes })
        const res = await convertStudentEnquiry(enquiry.id, {})
        onDone({ kind: 'converted', studentId: res?.student?.id, enquiryId: enquiry.id })
      } else {
        const payload = { ...(mergedNotes ? { adminNotes: mergedNotes } : {}) }
        if (targetStatus !== current) payload.enquiryStatus = targetStatus
        if (reasonRequired) payload.changeReason = reason.trim()
        const res = await updateStudentEnquiry(enquiry.id, payload)
        onDone({ kind: 'updated', doc: res?.doc || res, enquiryId: enquiry.id })
      }
    } catch (err) {
      setError(err.message || 'Could not update the enquiry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={copy.title}
      description={`${enquiry.name} · #${enquiry.id} · ${getStudentStatusLabel(current)} → ${getStudentStatusLabel(targetStatus)}`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="wf-form">
        <Notice error={error} />
        {copy.hint && <p className="wf-muted">{copy.hint}</p>}

        {isTest && current === 'test' && (
          <p className="wf-muted">A test was already requested for this student. Open it in the Tests menu to manage payment, tester, schedule and report.</p>
        )}
        {isTest && current !== 'test' && (
          <div className="wf-modecards" role="radiogroup" aria-label="Test mode">
            {Object.entries(TEST_MODES).map(([key, m]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={testMode === key}
                className={`wf-modecard${testMode === key ? ' is-on' : ''}`}
                onClick={() => setTestMode(key)}
              >
                {key === 'physical' ? <MapPin size={20} /> : <Globe size={20} />}
                <strong>{m.label}</strong>
                <span className="wf-modecard__price">₹{m.fee}</span>
                <small>{key === 'physical' ? 'A tester visits, conducts the test and brings the report.' : 'The student takes an online quiz. Cheaper and quicker.'}</small>
              </button>
            ))}
          </div>
        )}

        {reasonRequired && (
          <FormRow label={targetStatus === 'closed' ? 'Reason for closing' : 'Reason for reopening'}>
            <input
              required
              className={inputCls}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Parent not interested / duplicate / enrolled elsewhere"
            />
          </FormRow>
        )}

        <FormRow label="Call notes (added to admin notes)">
          <textarea
            className={inputCls}
            rows={3}
            maxLength={1500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What was discussed with the parent / student?"
          />
        </FormRow>

        <div className="wf-formfoot">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving} variant={targetStatus === 'closed' ? 'warning' : 'primary'}>
            {isConvert ? <GraduationCap size={15} style={{ marginRight: 6 }} /> : isTest ? <ClipboardCheck size={15} style={{ marginRight: 6 }} /> : <ArrowRight size={15} style={{ marginRight: 6 }} />}
            {isTest && current === 'test' ? 'Open in Tests' : copy.cta}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
