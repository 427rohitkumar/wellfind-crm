import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button, Card, CardBody } from '@/components/ui'
import { respondToAllocation } from '@/services/teacherPortalService'
import { Modal, Notice, Pager, StatusBadge, FormRow } from '@/pages/admin/adminUi'
import { inputCls, useLoad } from '@/pages/admin/useLoad'
import { listMyAllocations } from '@/services/teacherPortalService'
import { durationBetween, endedAt, formatDate } from './teacherPortalUtils'

const FILTERS = ['all', 'assigned', 'accepted', 'active', 'completed', 'rejected', 'cancelled']

export default function TeacherStudents() {
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [respond, setRespond] = useState(null) // {row, status}
  const [detail, setDetail] = useState(null)

  const { data, loading, error, reload } = useLoad(
    () => listMyAllocations({ page, limit: 10, status, sort: '-allocatedAt' }),
    [page, status],
  )
  const rows = data?.docs || []

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">My Students</h1>
          <p className="page__description">Students allocated to you by Wellfind admin. Accept or reject new allocations.</p>
        </div>
        <div className="page__action"><Button variant="outline" onClick={reload}><RefreshCw size={16} className="mr-2" />Refresh</Button></div>
      </header>

      <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />

      <Card>
        <CardBody className="p-4">
          <select className={inputCls} style={{ width: 200 }} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} aria-label="Filter by status">
            {FILTERS.map((f) => <option key={f} value={f}>{f === 'all' ? 'All statuses' : f}</option>)}
          </select>
        </CardBody>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-y border-border">
                <th className="px-5 py-3">Student</th><th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Timing</th><th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Since</th><th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && error && <tr><td colSpan={6} className="px-5 py-8 text-center text-danger">{error}</td></tr>}
              {!loading && !error && rows.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No students found.</td></tr>}
              {!loading && rows.map((a) => (
                <tr key={a.id} className="border-b border-border">
                  <td className="px-5 py-3 font-medium">{a.student?.name}<div className="text-xs text-muted-foreground">{a.student?.studentClass} · {a.student?.locality}</div></td>
                  <td className="px-5 py-3">{a.subject}</td>
                  <td className="px-5 py-3">{a.student?.preferredTiming || '—'}</td>
                  <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3">{formatDate(a.allocatedAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-1.5 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setDetail(a)}>Details</Button>
                      {a.status === 'assigned' && (
                        <>
                          <Button size="sm" variant="success" onClick={() => setRespond({ row: a, status: 'accepted' })}>Accept</Button>
                          <Button size="sm" variant="danger" onClick={() => setRespond({ row: a, status: 'rejected' })}>Reject</Button>
                        </>
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

      {respond && (
        <RespondModal
          {...respond}
          onClose={() => setRespond(null)}
          onDone={(text) => { setRespond(null); setMsg({ error: '', success: text }); reload() }}
        />
      )}
      {detail && <DetailModal row={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function RespondModal({ row, status, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await respondToAllocation(row.id, status, reason.trim())
      onDone(`Allocation ${status}.`)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }
  return (
    <Modal title={`${status === 'accepted' ? 'Accept' : 'Reject'} allocation`} description={`${row.student?.name} · ${row.subject}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Notice error={error} />
        <FormRow label={status === 'rejected' ? 'Reason (recommended)' : 'Note (optional)'}>
          <textarea className={inputCls} rows={3} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormRow>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={status === 'accepted' ? 'success' : 'danger'} loading={saving}>Confirm {status === 'accepted' ? 'accept' : 'reject'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function DetailModal({ row, onClose }) {
  const history = Array.isArray(row.statusHistory) ? row.statusHistory : []
  const end = endedAt(row)
  return (
    <Modal wide title={row.student?.name || 'Student'} description={`${row.subject} · ${row.student?.studentClass || ''}`} onClose={onClose}>
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Locality</span><div className="font-medium">{row.student?.locality || '—'}</div></div>
        <div><span className="text-muted-foreground">Preferred timing</span><div className="font-medium">{row.student?.preferredTiming || '—'}</div></div>
        <div><span className="text-muted-foreground">Subjects</span><div className="font-medium">{(row.student?.subjects || []).join(', ') || '—'}</div></div>
        <div><span className="text-muted-foreground">Duration</span><div className="font-medium">{durationBetween(row.allocatedAt, end || new Date())}{end ? '' : ' (ongoing)'}</div></div>
      </div>
      {row.allocationNotes && <p className="text-sm"><span className="text-muted-foreground">Admin notes:</span> {row.allocationNotes}</p>}
      <div>
        <h3 className="text-sm font-semibold mb-2">History</h3>
        <ul className="space-y-2 text-sm">
          <li className="rounded-md border border-border px-3 py-2">Allocated · <span className="text-muted-foreground">{formatDate(row.allocatedAt)}</span></li>
          {history.map((h, i) => (
            <li key={i} className="rounded-md border border-border px-3 py-2">
              <StatusBadge status={h.toStatus} /> <span className="text-muted-foreground">{formatDate(h.changedAt)}</span>
              {h.reason && <div className="mt-1">{h.reason}</div>}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
