import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, History, Info, RefreshCw, UserMinus, UserPlus, XCircle } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { TableLoader } from '@/components/ui/Loaders'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { Notice } from '@/pages/admin/adminUi'
import { useLoad } from '@/pages/admin/useLoad'
import { Stat } from '@/pages/payouts/payoutShared'
import { listMyAllocations } from '@/services/teacherPortalService'
import { durationBetween, endedAt, formatDate } from './teacherPortalUtils'

const OUTCOME = {
  assigned: ['Waiting for your reply', 'warning'],
  accepted: ['Teaching', 'success'],
  active: ['Teaching', 'success'],
  completed: ['Completed', 'info'],
  cancelled: ['De-allocated', 'danger'],
  rejected: ['You rejected', 'neutral'],
}
const EVENT = {
  accepted: ['You accepted the student', CheckCircle2],
  active: ['Teaching started', CheckCircle2],
  completed: ['Teaching completed', CheckCircle2],
  cancelled: ['Student de-allocated by Wellfind', UserMinus],
  rejected: ['You rejected the allocation', XCircle],
}

/** Every student ever allocated to this teacher: when they came, when they left and why. */
export default function TeacherHistory() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useLoad(() => listMyAllocations({ limit: 100, sort: '-allocatedAt' }), [])
  const rows = data?.docs || []

  // One timeline of events, newest first.
  const events = rows
    .flatMap((a) => [
      { at: a.allocatedAt, kind: 'allocated', a },
      ...(Array.isArray(a.statusHistory) ? a.statusHistory : []).filter((h) => EVENT[h.toStatus]).map((h) => ({ at: h.changedAt, kind: h.toStatus, reason: h.reason, a })),
    ])
    .filter((e) => e.at)
    .sort((x, y) => new Date(y.at) - new Date(x.at))

  const count = (...s) => rows.filter((a) => s.includes(a.status)).length

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Allocation History</h1>
          <p className="page__description">When each student was allocated to you, and when they were de-allocated, completed or rejected.</p>
        </div>
        <div className="page__action"><Button variant="outline" onClick={reload}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button></div>
      </header>

      <Notice error={error} />

      <div className="wf-stat-grid">
        <Stat icon={UserPlus} label="Ever allocated" value={loading ? '…' : rows.length} note="All students" tone="info" />
        <Stat icon={CheckCircle2} label="Teaching now" value={loading ? '…' : count('assigned', 'accepted', 'active')} note="Running allocations" tone="success" />
        <Stat icon={History} label="Completed" value={loading ? '…' : count('completed')} note="Finished well" />
        <Stat icon={UserMinus} label="De-allocated / rejected" value={loading ? '…' : count('cancelled', 'rejected')} note="Ended early" tone="warning" />
      </div>

      <div className="wf-portal-grid">
        <div className="wf-portal-main">
          <Card>
            <div className="wf-cardhead"><h3><History size={18} />All allocations</h3></div>
            <div className="wf-table-wrap">
              <table className="wf-table wf-table--click">
                <thead><tr><th>Student</th><th>Subject</th><th>Allocated on</th><th>Ended on</th><th>Duration</th><th>Outcome</th></tr></thead>
                <tbody>
                  {loading && <tr><td colSpan={6} style={{ padding: 0 }}><TableLoader columns={6} /></td></tr>}
                  {!loading && !error && rows.length === 0 && <tr><td colSpan={6} className="wf-state">No allocation history yet.</td></tr>}
                  {!loading && rows.map((a) => {
                    const end = endedAt(a)
                    const [label, tone] = OUTCOME[a.status] || [a.status, 'neutral']
                    return (
                      <tr key={a.id} tabIndex={0} onClick={() => navigate(`/teacher/students/${a.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/teacher/students/${a.id}`)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <PersonAvatar name={a.student?.name} gender={a.student?.gender} role="student" size={34} />
                            <div><div className="wf-cell-title">{a.student?.name}</div><div className="wf-cell-sub">{a.student?.studentClass}</div></div>
                          </div>
                        </td>
                        <td>{a.subject}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(a.allocatedAt)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{end ? formatDate(end) : <span className="wf-muted">Ongoing</span>}</td>
                        <td>{durationBetween(a.allocatedAt, end || new Date())}</td>
                        <td><Badge size="sm" variant={tone}>{label}</Badge></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="wf-portal-side">
          <Card>
            <div className="wf-cardhead"><h3><ArrowRight size={18} />Timeline</h3></div>
            {events.length === 0 && !loading && <div className="wf-testpad"><p className="wf-muted" style={{ margin: 0 }}>Nothing yet.</p></div>}
            <ul className="wf-timeline">
              {events.map((e, i) => {
                const [text] = e.kind === 'allocated' ? ['Student allocated to you'] : EVENT[e.kind]
                return (
                  <li key={i}>
                    <div className="wf-tl-top"><b>{text}</b><span className="wf-tl-time">{formatDate(e.at)}</span></div>
                    <div className="wf-cell-sub">{e.a.student?.name} · {e.a.subject}</div>
                    {e.reason && <div className="wf-tl-reason">{e.reason}</div>}
                  </li>
                )
              })}
            </ul>
          </Card>
          <div className="wf-lock"><Info size={16} />A student is “de-allocated” when Wellfind ends the allocation. “Completed” means the teaching finished normally.</div>
        </div>
      </div>
    </div>
  )
}
