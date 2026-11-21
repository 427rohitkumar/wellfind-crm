import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Card, CardBody, CardHeader } from '@/components/ui'
import {
  approveTeacherEnquiry, createTeacherEvaluation, docsOf, fmtDateTime, listTeacherEvaluations, updateTeacherEvaluation,
} from '@/services/adminApi'
import { FormRow, Modal, Notice, StatusBadge } from './adminUi'
import { inputCls, useLoad } from './useLoad'

/**
 * Teacher evaluations (written test + interview) and final approval.
 * Props: enquiryId, applicationStatus, onChanged() — called after approve / evaluation change
 * so the parent can reload the enquiry.
 */
export default function TeacherEvaluationPanel({ enquiryId, applicationStatus, feeResolved = true, onChanged }) {
  const [modal, setModal] = useState(null) // {type:'form', evaluation?}
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [approving, setApproving] = useState(false)
  const { data, loading, error, reload } = useLoad(() => listTeacherEvaluations(enquiryId, { limit: 20 }), [enquiryId])
  const evals = docsOf(data)
  const locked = applicationStatus === 'approved' || applicationStatus === 'rejected'

  const saved = (text) => { setModal(null); setMsg({ error: '', success: text }); reload(); onChanged?.() }

  const approve = async () => {
    if (!window.confirm('Approve this teacher? A teacher profile and login account will be created.')) return
    setApproving(true)
    setMsg({ error: '', success: '' })
    try {
      const res = await approveTeacherEnquiry(enquiryId)
      setMsg({ error: '', success: `Teacher approved. Account: ${res?.user?.email || 'created'} — they activate via "Forgot password" OTP.` })
      onChanged?.()
    } catch (e) {
      setMsg({ error: e.message, success: '' })
    } finally {
      setApproving(false)
    }
  }

  return (
    <Card variant="hover">
      <CardHeader className="border-b border-border py-3.5 px-5 flex items-center justify-between gap-2">
        <h3 className="card__title">Evaluation &amp; approval</h3>
        <div className="flex gap-2">
          {!locked && <Button size="sm" variant="outline" onClick={() => setModal({ evaluation: null })}><Plus size={14} className="mr-1" />New evaluation</Button>}
          {applicationStatus === 'evaluation_completed' && <Button size="sm" variant="success" loading={approving} disabled={!feeResolved} title={!feeResolved ? 'Mark the registration fee as paid or skipped first' : undefined} onClick={approve}>Approve teacher</Button>}
        </div>
      </CardHeader>
      <CardBody className="p-5 space-y-3">
        <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />
        <Notice error={error} />
        {applicationStatus !== 'evaluation_completed' && !locked && (
          <p className="text-xs text-muted-foreground">Approval unlocks once the application is shortlisted and an evaluation (written test + interview) is completed.</p>
        )}
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && !error && evals.length === 0 && <p className="text-sm text-muted-foreground">No evaluations yet.</p>}
        {evals.map((ev) => (
          <div key={ev.id} className="rounded-md border border-border p-4 text-sm space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">Attempt {ev.attemptNumber} <StatusBadge status={ev.evaluationStatus} /></span>
              <span className="text-muted-foreground">{fmtDateTime(ev.evaluatedAt)}</span>
            </div>
            <div>Written: {ev.writtenTest ? `${ev.writtenTest.marksObtained}/${ev.writtenTest.totalMarks} (${ev.writtenTest.percentage}%)` : '—'}</div>
            <div>Interview: {ev.interview ? `${ev.interview.marksObtained}/${ev.interview.totalMarks} (${ev.interview.percentage}%)` : '—'}</div>
            <div>Quality score: <strong>{ev.qualityScore ?? '—'}</strong></div>
            {ev.overallRemarks && <div className="text-muted-foreground">{ev.overallRemarks}</div>}
            {!locked && <Button size="sm" variant="outline" onClick={() => setModal({ evaluation: ev })}>{ev.evaluationStatus === 'completed' ? 'Revise' : 'Continue'}</Button>}
          </div>
        ))}
      </CardBody>
      {modal && <EvaluationForm enquiryId={enquiryId} evaluation={modal.evaluation} onClose={() => setModal(null)} onSaved={saved} />}
    </Card>
  )
}

function EvaluationForm({ enquiryId, evaluation, onClose, onSaved }) {
  const editing = Boolean(evaluation)
  const completed = evaluation?.evaluationStatus === 'completed'
  const sec = (s) => ({ marks: s?.marksObtained ?? '', total: s?.totalMarks ?? '100', remarks: s?.remarks || '' })
  const [w, setW] = useState(sec(evaluation?.writtenTest))
  const [i, setI] = useState(sec(evaluation?.interview))
  const [overall, setOverall] = useState(evaluation?.overallRemarks || '')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const build = (s) =>
    s.marks === '' ? undefined : { marksObtained: Number(s.marks), totalMarks: Number(s.total), ...(s.remarks.trim() ? { remarks: s.remarks.trim() } : {}) }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const body = { writtenTest: build(w), interview: build(i), ...(overall.trim() ? { overallRemarks: overall.trim() } : {}) }
    if (!body.writtenTest && !body.interview) return setError('Enter marks for at least one section.')
    if (completed && !reason.trim()) return setError('A change reason is required to revise a completed evaluation.')
    setSaving(true)
    try {
      if (editing) {
        await updateTeacherEvaluation(enquiryId, evaluation.id, { ...body, ...(completed ? { changeReason: reason.trim() } : {}), ...(completed ? { evaluationStatus: 'completed' } : {}) })
      } else {
        await createTeacherEvaluation(enquiryId, body)
      }
      onSaved('Evaluation saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const Section = ({ title, s, set }) => (
    <fieldset className="rounded-md border border-border p-3 space-y-3">
      <legend className="px-1 text-sm font-medium">{title}</legend>
      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Marks obtained"><input type="number" min="0" className={inputCls} value={s.marks} onChange={(e) => set({ ...s, marks: e.target.value })} /></FormRow>
        <FormRow label="Total marks"><input type="number" min="1" className={inputCls} value={s.total} onChange={(e) => set({ ...s, total: e.target.value })} /></FormRow>
      </div>
      <FormRow label="Remarks"><input className={inputCls} maxLength={2000} value={s.remarks} onChange={(e) => set({ ...s, remarks: e.target.value })} /></FormRow>
    </fieldset>
  )

  return (
    <Modal wide title={editing ? `Evaluation attempt ${evaluation.attemptNumber}` : 'New evaluation'} description="Quality score is calculated server-side once both sections are recorded." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Notice error={error} />
        {Section({ title: 'Written test', s: w, set: setW })}
        {Section({ title: 'Interview', s: i, set: setI })}
        <FormRow label="Overall remarks (optional)"><textarea className={inputCls} rows={2} maxLength={3000} value={overall} onChange={(e) => setOverall(e.target.value)} /></FormRow>
        {completed && <FormRow label="Change reason (required)"><input className={inputCls} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} /></FormRow>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save</Button>
        </div>
      </form>
    </Modal>
  )
}
