import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, GraduationCap, RefreshCw, Users } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { TableLoader } from '@/components/ui/Loaders'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { Notice, Pager, StatusBadge } from '@/pages/admin/adminUi'
import { useLoad } from '@/pages/admin/useLoad'
import { Stat } from '@/pages/payouts/payoutShared'
import { listMyAllocations } from '@/services/teacherPortalService'
import { RespondModal } from './RespondModal'
import { formatDate } from './teacherPortalUtils'

const FILTERS = [['all', 'All'], ['assigned', 'New requests'], ['accepted', 'Accepted'], ['active', 'Active'], ['completed', 'Completed'], ['rejected', 'Rejected']]

export default function TeacherStudents() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [respond, setRespond] = useState(null) // { row, status }

  const { data, loading, error, reload } = useLoad(() => listMyAllocations({ page, limit: 10, status, sort: '-allocatedAt' }), [page, status])
  const all = useLoad(() => listMyAllocations({ limit: 100, sort: '-allocatedAt' }), [])
  const rows = data?.docs || []
  const every = all.data?.docs || []
  const count = (...s) => every.filter((a) => s.includes(a.status)).length

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">My Students</h1>
          <p className="page__description">Students Wellfind has allocated to you. Open a student to see what to teach, the timetable, classes, assignments and test report.</p>
        </div>
        <div className="page__action"><Button variant="outline" onClick={() => { reload(); all.reload() }}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button></div>
      </header>

      <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />

      <div className="wf-stat-grid">
        <Stat icon={Users} label="All students" value={all.loading ? '…' : every.length} note="Ever allocated to you" tone="info" />
        <Stat icon={Clock} label="New requests" value={all.loading ? '…' : count('assigned')} note="Accept or reject" tone="warning" />
        <Stat icon={CheckCircle2} label="Teaching now" value={all.loading ? '…' : count('accepted', 'active')} note="Accepted or active" tone="success" />
        <Stat icon={GraduationCap} label="Completed" value={all.loading ? '…' : count('completed')} note="Finished" />
      </div>

      <Card>
        <div className="wf-sectionhead" style={{ flexWrap: 'wrap' }}>
          <div className="wf-tabsbar" role="tablist" aria-label="Filter by status">
            {FILTERS.map(([k, l]) => (
              <button key={k} type="button" role="tab" aria-selected={status === k} className={status === k ? 'is-on' : ''} onClick={() => { setPage(1); setStatus(k) }}>{l}</button>
            ))}
          </div>
        </div>
        <div className="wf-table-wrap">
          <table className="wf-table wf-table--click">
            <thead>
              <tr><th>Student</th><th>Subject</th><th>Preferred timing</th><th>Status</th><th>Since</th><th className="num">Actions</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} style={{ padding: 0 }}><TableLoader columns={6} /></td></tr>}
              {!loading && error && <tr><td colSpan={6} className="wf-state is-error">{error}</td></tr>}
              {!loading && !error && rows.length === 0 && (
                <tr><td colSpan={6} className="wf-state">{status === 'all' ? 'No students have been allocated to you yet. They will appear here as soon as Wellfind allocates one.' : 'No students in this list.'}</td></tr>
              )}
              {!loading && rows.map((a) => (
                <tr key={a.id} tabIndex={0} onClick={() => navigate(`/teacher/students/${a.id}`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`/teacher/students/${a.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <PersonAvatar name={a.student?.name} gender={a.student?.gender} role="student" size={40} />
                      <div><div className="wf-cell-title">{a.student?.name}</div><div className="wf-cell-sub">{a.student?.studentClass} · {a.student?.locality}</div></div>
                    </div>
                  </td>
                  <td>{a.subject}</td>
                  <td>{a.student?.preferredTiming || '—'}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(a.allocatedAt)}</td>
                  <td>
                    <div className="wf-actions" style={{ justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                      {a.status === 'assigned' ? (
                        <>
                          <Button size="sm" variant="success" onClick={() => setRespond({ row: a, status: 'accepted' })}>Accept</Button>
                          <Button size="sm" variant="danger" onClick={() => setRespond({ row: a, status: 'rejected' })}>Reject</Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/teacher/students/${a.id}`)}>Open</Button>
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
          onDone={(text) => { setRespond(null); setMsg({ error: '', success: text }); reload(); all.reload() }}
        />
      )}
    </div>
  )
}
