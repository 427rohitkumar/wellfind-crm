import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button, Card, CardBody, CardHeader } from '@/components/ui'
import {
  CAPABILITY_LEVELS, assignTestTester, createStudentTest, docsOf, fmtDateTime, getTestReport, labelize,
  listReportShares, listStudentTests, listUsers, logReportShare, recordTestPayment, submitTestReport,
} from '@/services/adminApi'
import { FormRow, Modal, Notice, StatusBadge } from './adminUi'
import { inputCls, useLoad } from './useLoad'

const PAY_METHODS = ['cash', 'upi', 'card', 'bank_transfer', 'online', 'other']
const PAY_STATUSES = ['paid', 'pending', 'failed']

// datetime-local value -> ISO with explicit timezone (API requires Z / offset)
const toIso = (v) => (v ? new Date(v).toISOString() : undefined)

export default function StudentTests({ studentId }) {
  const [modal, setModal] = useState(null) // {type, test}
  const [msg, setMsg] = useState({ error: '', success: '' })
  const { data, loading, error, reload } = useLoad(() => listStudentTests(studentId, { limit: 50 }), [studentId])
  const tests = docsOf(data)
  const done = (text) => { setModal(null); setMsg({ error: '', success: text }); reload() }

  return (
    <Card>
      <CardHeader className="border-b border-border py-3.5 px-5 flex items-center justify-between">
        <h3 className="card__title">Optional physical tests (₹100)</h3>
        <Button size="sm" onClick={() => setModal({ type: 'create' })}><Plus size={14} className="mr-1" />Request test</Button>
      </CardHeader>
      <CardBody className="p-5 space-y-3">
        <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />
        <Notice error={error} />
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && !error && tests.length === 0 && <p className="text-sm text-muted-foreground">No physical tests requested.</p>}
        {tests.map((t) => (
          <div key={t.id} className="rounded-md border border-border p-4 text-sm space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">Test #{t.id} · {labelize(t.testType)} <StatusBadge status={t.status} /> <StatusBadge status={t.paymentStatus} /></span>
              <span className="text-muted-foreground">{t.location} · {fmtDateTime(t.scheduledAt)}</span>
            </div>
            <div className="text-muted-foreground">Tester: {t.assignedTester ? `User #${typeof t.assignedTester === 'object' ? t.assignedTester.id : t.assignedTester}` : 'Not assigned'}</div>
            <div className="flex flex-wrap gap-2">
              {t.paymentStatus !== 'paid' && <Button size="sm" variant="outline" onClick={() => setModal({ type: 'payment', test: t })}>Record payment</Button>}
              {t.paymentStatus === 'paid' && t.status !== 'report_available' && t.status !== 'completed' && (
                <Button size="sm" variant="outline" onClick={() => setModal({ type: 'tester', test: t })}>{t.assignedTester ? 'Reassign tester' : 'Assign tester'}</Button>
              )}
              {t.assignedTester && t.paymentStatus === 'paid' && t.status !== 'report_available' && (
                <Button size="sm" onClick={() => setModal({ type: 'submitReport', test: t })}>Submit report</Button>
              )}
              {t.status === 'report_available' && <Button size="sm" onClick={() => setModal({ type: 'report', test: t })}>View report &amp; sharing</Button>}
            </div>
          </div>
        ))}
      </CardBody>

      {modal?.type === 'create' && <CreateTest studentId={studentId} onClose={() => setModal(null)} onSaved={done} />}
      {modal?.type === 'payment' && <PaymentForm test={modal.test} onClose={() => setModal(null)} onSaved={() => done('Payment recorded.')} />}
      {modal?.type === 'tester' && <TesterForm test={modal.test} onClose={() => setModal(null)} onSaved={() => done('Tester assigned.')} />}
      {modal?.type === 'submitReport' && <ReportForm test={modal.test} onClose={() => setModal(null)} onSaved={() => done('Report submitted.')} />}
      {modal?.type === 'report' && <ReportView test={modal.test} onClose={() => setModal(null)} />}
    </Card>
  )
}

function useForm(initial) {
  const [f, setF] = useState(initial)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  return [f, set, setF]
}

function FormShell({ title, description, wide, onClose, onSubmit, submitLabel, children }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSubmit()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }
  return (
    <Modal wide={wide} title={title} description={description} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Notice error={error} />
        {children}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  )
}

function CreateTest({ studentId, onClose, onSaved }) {
  const [f, set] = useForm({ location: '', scheduledAt: '', notes: '' })
  return (
    <FormShell title="Request physical test" description="Fixed fee ₹100 INR." onClose={onClose} submitLabel="Request"
      onSubmit={async () => {
        await createStudentTest(studentId, {
          parentSelected: true, location: f.location.trim(),
          ...(f.scheduledAt ? { scheduledAt: toIso(f.scheduledAt) } : {}),
          ...(f.notes.trim() ? { notes: f.notes.trim() } : {}),
        })
        onSaved('Physical test requested.')
      }}>
      <FormRow label="Location"><input required className={inputCls} maxLength={250} value={f.location} onChange={set('location')} /></FormRow>
      <FormRow label="Scheduled at (optional)"><input type="datetime-local" className={inputCls} value={f.scheduledAt} onChange={set('scheduledAt')} /></FormRow>
      <FormRow label="Notes (optional)"><textarea className={inputCls} rows={2} maxLength={2000} value={f.notes} onChange={set('notes')} /></FormRow>
    </FormShell>
  )
}

function PaymentForm({ test, onClose, onSaved }) {
  const [f, set] = useForm({ paymentMethod: 'upi', paymentStatus: 'paid', transactionReference: '', notes: '' })
  return (
    <FormShell title={`Record payment — Test #${test.id}`} description="Amount is fixed at ₹100 INR." onClose={onClose} submitLabel="Record" onSubmit={async () => {
      await recordTestPayment(test.id, {
        amount: 100, currency: 'INR', paymentMethod: f.paymentMethod, paymentStatus: f.paymentStatus,
        transactionReference: f.transactionReference.trim(), ...(f.notes.trim() ? { notes: f.notes.trim() } : {}),
      })
      onSaved()
    }}>
      <div className="grid grid-cols-2 gap-3">
        <FormRow label="Method"><select className={inputCls} value={f.paymentMethod} onChange={set('paymentMethod')}>{PAY_METHODS.map((m) => <option key={m} value={m}>{labelize(m)}</option>)}</select></FormRow>
        <FormRow label="Status"><select className={inputCls} value={f.paymentStatus} onChange={set('paymentStatus')}>{PAY_STATUSES.map((m) => <option key={m}>{m}</option>)}</select></FormRow>
      </div>
      <FormRow label="Transaction reference"><input required className={inputCls} maxLength={150} value={f.transactionReference} onChange={set('transactionReference')} /></FormRow>
      <FormRow label="Notes (optional)"><textarea className={inputCls} rows={2} value={f.notes} onChange={set('notes')} /></FormRow>
    </FormShell>
  )
}

function TesterForm({ test, onClose, onSaved }) {
  const [f, set] = useForm({ testerUserId: '', scheduledAt: '', notes: '' })
  const { data, error } = useLoad(() => listUsers({ status: 'active', limit: 100 }), [])
  const users = docsOf(data)
  return (
    <FormShell title={`Assign tester — Test #${test.id}`} onClose={onClose} submitLabel="Assign" onSubmit={async () => {
      await assignTestTester(test.id, {
        testerUserId: Number(f.testerUserId),
        ...(f.scheduledAt ? { scheduledAt: toIso(f.scheduledAt) } : {}),
        ...(f.notes.trim() ? { notes: f.notes.trim() } : {}),
      })
      onSaved()
    }}>
      <Notice error={error} />
      <FormRow label="Tester (active user)">
        <select required className={inputCls} value={f.testerUserId} onChange={set('testerUserId')}>
          <option value="">Select…</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.email} ({u.role})</option>)}
        </select>
      </FormRow>
      <FormRow label="Scheduled at (optional)"><input type="datetime-local" className={inputCls} value={f.scheduledAt} onChange={set('scheduledAt')} /></FormRow>
      <FormRow label="Notes (optional)"><textarea className={inputCls} rows={2} value={f.notes} onChange={set('notes')} /></FormRow>
    </FormShell>
  )
}

function ReportForm({ test, onClose, onSaved }) {
  const [f, set] = useForm({ marksObtained: '', totalMarks: '100', capability: 'average', remarks: '' })
  const [subjects, setSubjects] = useState([{ subject: '', marksObtained: '', totalMarks: '' }])
  const upd = (i, k) => (e) => setSubjects((rows) => rows.map((r, j) => (j === i ? { ...r, [k]: e.target.value } : r)))
  return (
    <FormShell wide title={`Submit report — Test #${test.id}`} description="One report per test; cannot be edited afterwards." onClose={onClose} submitLabel="Submit report" onSubmit={async () => {
      await submitTestReport(test.id, {
        marksObtained: Number(f.marksObtained), totalMarks: Number(f.totalMarks), capability: f.capability,
        subjectResults: subjects.map((s) => ({ subject: s.subject.trim(), marksObtained: Number(s.marksObtained), totalMarks: Number(s.totalMarks) })),
        ...(f.remarks.trim() ? { remarks: f.remarks.trim() } : {}),
      })
      onSaved()
    }}>
      <div className="grid grid-cols-3 gap-3">
        <FormRow label="Marks obtained"><input required type="number" min="0" className={inputCls} value={f.marksObtained} onChange={set('marksObtained')} /></FormRow>
        <FormRow label="Total marks"><input required type="number" min="1" className={inputCls} value={f.totalMarks} onChange={set('totalMarks')} /></FormRow>
        <FormRow label="Capability"><select className={inputCls} value={f.capability} onChange={set('capability')}>{CAPABILITY_LEVELS.map((c) => <option key={c} value={c}>{labelize(c)}</option>)}</select></FormRow>
      </div>
      <div className="space-y-2">
        <span className="text-sm font-medium">Subject results</span>
        {subjects.map((s, i) => (
          <div key={i} className="grid grid-cols-[1fr_90px_90px_auto] gap-2">
            <input required placeholder="Subject" className={inputCls} value={s.subject} onChange={upd(i, 'subject')} />
            <input required type="number" min="0" placeholder="Marks" className={inputCls} value={s.marksObtained} onChange={upd(i, 'marksObtained')} />
            <input required type="number" min="1" placeholder="Total" className={inputCls} value={s.totalMarks} onChange={upd(i, 'totalMarks')} />
            <Button type="button" size="sm" variant="ghost" disabled={subjects.length === 1} onClick={() => setSubjects((r) => r.filter((_, j) => j !== i))}>✕</Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={() => setSubjects((r) => [...r, { subject: '', marksObtained: '', totalMarks: '' }])}>+ Add subject</Button>
      </div>
      <FormRow label="Remarks (optional)"><textarea className={inputCls} rows={3} maxLength={5000} value={f.remarks} onChange={set('remarks')} /></FormRow>
    </FormShell>
  )
}

function ReportView({ test, onClose }) {
  const { data: report, loading, error } = useLoad(() => getTestReport(test.id), [test.id])
  const shares = useLoad(() => listReportShares(test.id), [test.id])
  const [share, setShare] = useState({ channel: 'whatsapp', recipient: '', status: 'sent', notes: '' })
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [saving, setSaving] = useState(false)
  const r = report?.report || report
  const logs = docsOf(shares.data?.shares || shares.data)

  const submitShare = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg({ error: '', success: '' })
    try {
      await logReportShare(test.id, { ...share, recipient: share.recipient.trim(), ...(share.notes.trim() ? {} : { notes: undefined }) })
      setMsg({ error: '', success: 'Sharing action logged (manual; delivery is not confirmed by any provider).' })
      shares.reload()
    } catch (err) {
      setMsg({ error: err.message, success: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal wide title={`Report — Test #${test.id}`} onClose={onClose}>
      <Notice error={error} />
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {r && (
        <div className="text-sm space-y-2">
          <p><strong>{r.marksObtained}/{r.totalMarks}</strong> <StatusBadge status={r.capability} /></p>
          <ul className="list-disc pl-5">
            {(r.subjectResults || []).map((s, i) => <li key={i}>{s.subject}: {s.marksObtained}/{s.totalMarks}</li>)}
          </ul>
          {r.remarks && <p className="text-muted-foreground">{r.remarks}</p>}
        </div>
      )}
      <hr className="border-border" />
      <h3 className="text-sm font-semibold">Log a sharing action</h3>
      <Notice {...msg} />
      <form onSubmit={submitShare} className="grid grid-cols-2 gap-3">
        <FormRow label="Channel"><select className={inputCls} value={share.channel} onChange={(e) => setShare({ ...share, channel: e.target.value })}><option value="whatsapp">WhatsApp</option><option value="phone_call">Phone call</option></select></FormRow>
        <FormRow label="Status"><select className={inputCls} value={share.status} onChange={(e) => setShare({ ...share, status: e.target.value })}>{['recorded', 'sent', 'completed', 'failed', 'no_answer'].map((s) => <option key={s} value={s}>{labelize(s)}</option>)}</select></FormRow>
        <FormRow label="Recipient phone"><input required className={inputCls} value={share.recipient} onChange={(e) => setShare({ ...share, recipient: e.target.value })} /></FormRow>
        <FormRow label="Notes"><input className={inputCls} value={share.notes} onChange={(e) => setShare({ ...share, notes: e.target.value })} /></FormRow>
        <div className="col-span-2 flex justify-end"><Button type="submit" size="sm" loading={saving}>Log action</Button></div>
      </form>
      {logs.length > 0 && (
        <ul className="text-sm space-y-1">
          {logs.map((l) => <li key={l.id}>{labelize(l.channel)} → {l.recipient} · {labelize(l.status)} · {fmtDateTime(l.sharedAt)}</li>)}
        </ul>
      )}
    </Modal>
  )
}
