import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Card, CardBody, CardHeader } from '@/components/ui'
import { CAPABILITY_LEVELS, createAssessment, docsOf, fmtDateTime, labelize, listAssessments } from '@/services/adminApi'
import { FormRow, Modal, Notice, StatusBadge } from './adminUi'
import { inputCls, useLoad } from './useLoad'

const splitList = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)

export default function StudentAssessments({ studentId }) {
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const { data, loading, error, reload } = useLoad(() => listAssessments(studentId, { limit: 50 }), [studentId])
  const rows = docsOf(data)

  return (
    <Card>
      <CardHeader className="border-b border-border py-3.5 px-5 flex items-center justify-between">
        <h3 className="card__title">Capability assessments</h3>
        <Button size="sm" onClick={() => setOpen(true)}><Plus size={14} className="mr-1" />Add assessment</Button>
      </CardHeader>
      <CardBody className="p-5 space-y-3">
        <Notice error={error} success={msg} onClose={() => setMsg('')} />
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && !error && rows.length === 0 && <p className="text-sm text-muted-foreground">No assessments recorded yet.</p>}
        {rows.map((a) => (
          <div key={a.id} className="rounded-md border border-border p-4 text-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{labelize(a.assessmentType)} <StatusBadge status={a.currentCapability} /></span>
              <span className="text-muted-foreground">{fmtDateTime(a.assessedAt)}</span>
            </div>
            <p><span className="text-muted-foreground">Previous performance:</span> {a.previousPerformance?.summary}
              {a.previousPerformance?.details && <span className="block text-muted-foreground">{a.previousPerformance.details}</span>}</p>
            <p><span className="text-muted-foreground">Strengths:</span> {(a.strengths || []).join(', ') || '—'}</p>
            <p><span className="text-muted-foreground">Weaknesses:</span> {(a.weaknesses || []).join(', ') || '—'}</p>
            {a.adminNotes && <p><span className="text-muted-foreground">Notes:</span> {a.adminNotes}</p>}
          </div>
        ))}
      </CardBody>
      {open && <AssessmentForm studentId={studentId} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); setMsg('Assessment recorded.'); reload() }} />}
    </Card>
  )
}

function AssessmentForm({ studentId, onClose, onSaved }) {
  const [f, setF] = useState({
    assessmentType: 'initial_review', summary: '', details: '', currentCapability: 'average',
    strengths: '', weaknesses: '', adminNotes: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createAssessment(studentId, {
        assessmentType: f.assessmentType.trim() || 'initial_review',
        previousPerformance: { summary: f.summary.trim(), ...(f.details.trim() ? { details: f.details.trim() } : {}) },
        currentCapability: f.currentCapability,
        strengths: splitList(f.strengths),
        weaknesses: splitList(f.weaknesses),
        ...(f.adminNotes.trim() ? { adminNotes: f.adminNotes.trim() } : {}),
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal wide title="New capability assessment" description="Does not require a physical test." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Notice error={error} />
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Assessment type"><input className={inputCls} maxLength={100} value={f.assessmentType} onChange={set('assessmentType')} /></FormRow>
          <FormRow label="Current capability">
            <select className={inputCls} value={f.currentCapability} onChange={set('currentCapability')}>
              {CAPABILITY_LEVELS.map((c) => <option key={c} value={c}>{labelize(c)}</option>)}
            </select>
          </FormRow>
        </div>
        <FormRow label="Previous performance summary"><input required className={inputCls} maxLength={500} value={f.summary} onChange={set('summary')} /></FormRow>
        <FormRow label="Details (optional)"><textarea className={inputCls} rows={2} maxLength={5000} value={f.details} onChange={set('details')} /></FormRow>
        <div className="grid grid-cols-2 gap-3">
          <FormRow label="Strengths" hint="Comma separated"><input className={inputCls} value={f.strengths} onChange={set('strengths')} /></FormRow>
          <FormRow label="Weaknesses" hint="Comma separated"><input className={inputCls} value={f.weaknesses} onChange={set('weaknesses')} /></FormRow>
        </div>
        <FormRow label="Admin notes (optional)"><textarea className={inputCls} rows={2} maxLength={5000} value={f.adminNotes} onChange={set('adminNotes')} /></FormRow>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save assessment</Button>
        </div>
      </form>
    </Modal>
  )
}
