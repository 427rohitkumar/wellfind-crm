import { useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button, Card, CardBody } from '@/components/ui'
import {
  ALLOCATION_STATUSES, ALLOCATION_TRANSITIONS, createAllocation, docsOf, fmtDateTime, labelize,
  listAllocations, listStudentRecords, listTeacherProfiles, updateAllocationNotes, updateAllocationStatus,
} from '@/services/adminApi'
import { FormRow, Modal, Notice, Pager, StatusBadge } from './adminUi'
import { inputCls, useLoad } from './useLoad'

export default function Allocations() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [modal, setModal] = useState(null) // {type:'create'} | {type:'status'|'detail', row}

  const { data, loading, error, reload } = useLoad(
    () => listAllocations({ page, limit: 10, status, sort: '-allocatedAt' }),
    [page, status],
  )
  const rows = docsOf(data)
  const done = (text) => { setModal(null); setMsg({ error: '', success: text }); reload() }

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Teacher Allocation</h1>
          <p className="page__description">Assign approved teachers to active students and track each allocation's lifecycle.</p>
        </div>
        <div className="page__action flex gap-2">
          <Button variant="outline" onClick={reload}><RefreshCw size={16} className="mr-2" />Refresh</Button>
          <Button onClick={() => setModal({ type: 'create' })}><Plus size={16} className="mr-2" />New allocation</Button>
        </div>
      </header>

      <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />

      <Card>
        <CardBody className="p-4">
          <select className={inputCls} style={{ width: 200 }} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
            <option value="all">All statuses</option>
            {ALLOCATION_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
          </select>
        </CardBody>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-y border-border">
                <th className="px-5 py-3">Student</th><th className="px-5 py-3">Teacher</th>
                <th className="px-5 py-3">Subject</th><th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Allocated</th><th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && error && <tr><td colSpan={6} className="px-5 py-8 text-center text-danger">{error}</td></tr>}
              {!loading && !error && rows.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No allocations yet.</td></tr>}
              {!loading && rows.map((a) => (
                <tr key={a.id} className="border-b border-border">
                  <td className="px-5 py-3 font-medium">{a.student?.name || `#${a.studentId}`}<div className="text-xs text-muted-foreground">{a.student?.studentClass} · {a.student?.locality}</div></td>
                  <td className="px-5 py-3">{a.teacher?.name || `#${a.teacherId}`}</td>
                  <td className="px-5 py-3">{a.subject}</td>
                  <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3">{fmtDateTime(a.allocatedAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setModal({ type: 'detail', row: a })}>Details</Button>
                      {(ALLOCATION_TRANSITIONS[a.status] || []).length > 0 && (
                        <Button size="sm" onClick={() => setModal({ type: 'status', row: a })}>Update status</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager data={data} page={page} onPage={setPage} />
      </Card>

      {modal?.type === 'create' && <CreateAllocation onClose={() => setModal(null)} onSaved={() => done('Allocation created.')} />}
      {modal?.type === 'status' && <StatusForm row={modal.row} onClose={() => setModal(null)} onSaved={() => done('Status updated.')} />}
      {modal?.type === 'detail' && <Detail row={modal.row} onClose={() => setModal(null)} onSaved={() => done('Notes updated.')} />}
    </div>
  )
}

function CreateAllocation({ onClose, onSaved }) {
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState({ studentId: '', teacherId: '', subject: '', allocationNotes: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    let alive = true
    Promise.all([
      listStudentRecords({ status: 'active', limit: 100, sort: 'name' }),
      listTeacherProfiles({ limit: 100 }),
    ])
      .then(([s, t]) => { if (alive) { setStudents(docsOf(s)); setTeachers(docsOf(t)) } })
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [])

  const student = students.find((s) => String(s.id) === form.studentId)
  const subjects = [...(student?.subjects || []), ...(student?.customSubject ? [student.customSubject] : [])]

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createAllocation({
        studentId: Number(form.studentId),
        teacherId: Number(form.teacherId),
        subject: form.subject.trim(),
        ...(form.allocationNotes.trim() ? { allocationNotes: form.allocationNotes.trim() } : {}),
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="New allocation" description="Teacher must be approved & active and match the subject and class." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Notice error={error} />
        <FormRow label="Student (active)">
          <select required className={inputCls} value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value, subject: '' }))}>
            <option value="">Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.studentClass}</option>)}
          </select>
        </FormRow>
        <FormRow label="Teacher" hint="Use a student's Matching tab to find eligible teachers.">
          <select required className={inputCls} value={form.teacherId} onChange={set('teacherId')}>
            <option value="">Select teacher…</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name || t.fullName} — {t.primarySubject}</option>)}
          </select>
        </FormRow>
        <FormRow label="Subject">
          <input required list="alloc-subjects" className={inputCls} maxLength={100} value={form.subject} onChange={set('subject')} />
          <datalist id="alloc-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
        </FormRow>
        <FormRow label="Notes (optional)">
          <textarea className={inputCls} rows={3} maxLength={2000} value={form.allocationNotes} onChange={set('allocationNotes')} />
        </FormRow>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Allocate</Button>
        </div>
      </form>
    </Modal>
  )
}

function StatusForm({ row, onClose, onSaved }) {
  const options = ALLOCATION_TRANSITIONS[row.status] || []
  const [status, setStatus] = useState(options[0] || '')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateAllocationStatus(row.id, status, reason.trim())
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Update allocation status" description={`${row.student?.name} ↔ ${row.teacher?.name} · ${row.subject}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Notice error={error} />
        <p className="text-sm">Current: <StatusBadge status={row.status} /></p>
        <FormRow label="New status">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            {options.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
          </select>
        </FormRow>
        <FormRow label="Reason (optional)">
          <textarea className={inputCls} rows={3} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormRow>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Update</Button>
        </div>
      </form>
    </Modal>
  )
}

function Detail({ row, onClose, onSaved }) {
  const [notes, setNotes] = useState(row.allocationNotes || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const history = Array.isArray(row.statusHistory) ? row.statusHistory : []

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await updateAllocationNotes(row.id, notes)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal wide title={`Allocation #${row.id}`} description={`${row.student?.name} ↔ ${row.teacher?.name} · ${row.subject}`} onClose={onClose}>
      <Notice error={error} />
      <FormRow label="Allocation notes">
        <textarea className={inputCls} rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FormRow>
      <div className="flex justify-end"><Button size="sm" loading={saving} onClick={save}>Save notes</Button></div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Status history</h3>
        {history.length === 0 ? <p className="text-sm text-muted-foreground">No history.</p> : (
          <ul className="space-y-2 text-sm">
            {history.map((h, i) => (
              <li key={i} className="rounded-md border border-border px-3 py-2">
                <StatusBadge status={h.status || h.toStatus} /> <span className="text-muted-foreground">{fmtDateTime(h.changedAt || h.at)}</span>
                {h.reason && <div className="mt-1">{h.reason}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
