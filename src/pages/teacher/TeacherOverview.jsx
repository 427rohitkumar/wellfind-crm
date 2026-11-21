import { Link } from 'react-router-dom'
import { Award, BarChart3, BookOpen, CheckCircle, Clock, GraduationCap, IndianRupee, PieChart, RefreshCw, TrendingUp, UserCheck, Users } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { Notice, StatusBadge } from '@/pages/admin/adminUi'
import { useLoad } from '@/pages/admin/useLoad'
import HorizontalBars from './HorizontalBars'
import { LIVE_STATUSES, countBy, formatDate, loadTeacherPortal } from './teacherPortalUtils'

function Metric({ icon: Icon, label, value, note, tone = 'primary' }) {
  return (
    <div className="wf-stat-card">
      <span className={`wf-stat-card__icon is-${tone}`}><Icon size={20} /></span>
      <div><small>{label}</small><b>{value}</b>{note && <span>{note}</span>}</div>
    </div>
  )
}

/** Allocations per month for the last 6 months, oldest to newest. */
function lastSixMonths(allocations) {
  const now = new Date()
  const buckets = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets[d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })] = 0
  }
  allocations.forEach((a) => {
    const d = new Date(a.allocatedAt)
    if (Number.isNaN(d.getTime())) return
    const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    if (key in buckets) buckets[key] += 1
  })
  return buckets
}

export default function TeacherOverview({ hideHeader = false }) {
  const { user } = useAuth()
  const { data, loading, error, reload } = useLoad(loadTeacherPortal, [])
  const profile = data?.profile
  const allocations = data?.allocations || []

  const live = allocations.filter((a) => LIVE_STATUSES.includes(a.status))
  const pending = allocations.filter((a) => a.status === 'assigned')
  const completed = allocations.filter((a) => a.status === 'completed')
  const fee = profile?.registrationFee
  const displayName = profile?.name || (user?.email ? user.email.split('@')[0] : 'Teacher')
  const months = Object.entries(lastSixMonths(allocations))
  const maxMonth = Math.max(1, ...months.map(([, v]) => v))

  return (
    <div className="wf-tdash">
      {!hideHeader && (
        <Card>
          <div className="wf-next">
            <div>
              <small>Teacher portal</small>
              <h3>Welcome back, {displayName}</h3>
              <p style={{ marginBottom: 0 }}>{profile ? `${profile.primarySubject || 'Teacher'} · ${profile.locality || 'Wellfind Academic'}` : 'Wellfind Academic'}</p>
            </div>
            <div className="wf-actions">
              {profile && <Badge variant={profile.availabilityStatus === 'free' ? 'success' : 'warning'}><CheckCircle size={14} className="mr-1 inline" />{profile.availabilityStatus === 'free' ? 'Available for students' : 'Fully allocated'}</Badge>}
              <Button size="sm" variant="outline" onClick={reload}><RefreshCw size={14} style={{ marginRight: 6 }} />Refresh</Button>
            </div>
          </div>
        </Card>
      )}

      <Notice error={error} />

      <div className="wf-stat-grid">
        <Metric icon={Users} label="Allocated students" value={loading ? '…' : allocations.length} note="All time" tone="info" />
        <Metric icon={UserCheck} label="Current students" value={loading ? '…' : live.length} note="Assigned, accepted or active" />
        <Metric icon={Clock} label="Awaiting your response" value={loading ? '…' : pending.length} note="Accept or reject" tone="warning" />
        <Metric
          icon={IndianRupee}
          label="Registration fee"
          value={loading ? '…' : fee?.status ? fee.status.charAt(0).toUpperCase() + fee.status.slice(1) : '—'}
          note={fee?.year ? `Academic year ${fee.year}` : undefined}
          tone={fee?.status === 'paid' || fee?.status === 'waived' ? 'success' : 'warning'}
        />
      </div>

      {pending.length > 0 && (
        <Card>
          <div className="wf-cardhead"><h3><Clock size={18} />New allocations waiting for you</h3><Link to="/teacher/students" className="button button--primary button--sm">Respond</Link></div>
          <div className="wf-pendlist">
            {pending.slice(0, 3).map((a) => (
              <div key={a.id}><b>{a.student?.name} · {a.subject}</b><span>{a.student?.studentClass} · {a.student?.locality}</span></div>
            ))}
          </div>
        </Card>
      )}

      <div className="wf-portal-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <Card>
          <div className="wf-cardhead"><h3><PieChart size={18} />Allocations by status</h3></div>
          <div className="wf-testpad"><HorizontalBars data={countBy(allocations, (a) => a.status)} empty="No allocations yet." /></div>
        </Card>
        <Card>
          <div className="wf-cardhead"><h3><BarChart3 size={18} />Subjects taught</h3></div>
          <div className="wf-testpad"><HorizontalBars data={countBy(allocations, (a) => a.subject)} empty="No subjects yet." /></div>
        </Card>
        <Card>
          <div className="wf-cardhead"><h3><TrendingUp size={18} />New allocations</h3><span className="wf-muted">Last 6 months</span></div>
          <div className="wf-bars">
            {months.map(([label, v]) => (
              <div key={label} className="wf-bar" title={`${label}: ${v}`}>
                <div className="wf-bar__col"><span style={{ height: `${(v / maxMonth) * 100}%`, background: 'var(--color-primary)', minHeight: v ? 4 : 0 }} /></div>
                <b>{v}</b>
                <small>{label}</small>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="wf-cardhead">
          <h3><BookOpen size={18} />Recent allocations</h3>
          <span className="wf-muted"><Award size={13} style={{ display: 'inline', marginRight: 4 }} />{completed.length} completed</span>
        </div>
        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead><tr><th>Student</th><th>Class</th><th>Subject</th><th>Status</th><th>Allocated</th></tr></thead>
            <tbody>
              {allocations.length === 0 && !loading && (
                <tr><td colSpan={5} className="wf-state"><GraduationCap size={22} style={{ display: 'block', margin: '0 auto 6px' }} />No students have been allocated to you yet.</td></tr>
              )}
              {allocations.slice(0, 5).map((a) => (
                <tr key={a.id}>
                  <td className="wf-cell-title">{a.student?.name}<div className="wf-cell-sub">{a.student?.locality}</div></td>
                  <td>{a.student?.studentClass || '—'}</td>
                  <td>{a.subject}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDate(a.allocatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
