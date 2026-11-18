import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, CardBody, CardHeader } from '@/components/ui'
import { getStudentMatches, saveStudentMatch } from '@/services/adminApi'
import { Notice, StatusBadge } from './adminUi'
import { useLoad } from './useLoad'

export default function StudentMatching({ studentId }) {
  const { data, loading, error, reload } = useLoad(() => getStudentMatches(studentId), [studentId])
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [busy, setBusy] = useState(null)
  const matches = data?.matches || []

  const save = async (teacherId, matchStatus) => {
    const adminNotes = window.prompt('Admin notes (optional):', '') ?? null
    if (adminNotes === null) return
    setBusy(`${teacherId}:${matchStatus}`)
    setMsg({ error: '', success: '' })
    try {
      await saveStudentMatch(studentId, { teacherId, matchStatus, ...(adminNotes.trim() ? { adminNotes: adminNotes.trim() } : {}) })
      setMsg({ error: '', success: `Match saved as ${matchStatus}.` })
    } catch (e) {
      setMsg({ error: e.message, success: '' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-border py-3.5 px-5 flex items-center justify-between">
        <h3 className="card__title">Eligible teachers {data ? `(${data.total})` : ''}</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={reload}>Refresh</Button>
          <Button size="sm" as={Link} to="/admin/allocation">Go to allocation</Button>
        </div>
      </CardHeader>
      <CardBody className="p-5 space-y-3">
        <p className="text-xs text-muted-foreground">Matched on approved/active status, subject, class level, locality and availability. Saving a decision never allocates a teacher.</p>
        <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />
        <Notice error={error} />
        {loading && <p className="text-sm text-muted-foreground">Finding matches…</p>}
        {!loading && !error && matches.length === 0 && <p className="text-sm text-muted-foreground">No eligible teachers found.</p>}
        {matches.map((m) => (
          <div key={m.teacherId} className="rounded-md border border-border p-4 text-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">{m.name} <StatusBadge status={m.availabilityStatus} /></div>
              <div className="text-muted-foreground">{m.primarySubject} · {m.classLevel} · {m.locality}</div>
              <div>Quality score: <strong>{m.qualityScore ?? '—'}</strong></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={busy !== null} loading={busy === `${m.teacherId}:shortlisted`} onClick={() => save(m.teacherId, 'shortlisted')}>Shortlist</Button>
              <Button size="sm" variant="danger" disabled={busy !== null} loading={busy === `${m.teacherId}:rejected`} onClick={() => save(m.teacherId, 'rejected')}>Reject</Button>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}
