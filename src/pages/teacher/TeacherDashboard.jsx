import { Link } from 'react-router-dom'
import { Award, BookOpen, CheckCircle, Clock, GraduationCap, IndianRupee, RefreshCw, UserCheck, Users } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { Notice, StatusBadge } from '@/pages/admin/adminUi'
import { useLoad } from '@/pages/admin/useLoad'
import HorizontalBars from './HorizontalBars'
import { LIVE_STATUSES, countBy, formatDate, loadTeacherPortal } from './teacherPortalUtils'

function Metric({ icon: Icon, label, value, note, tone = 'primary' }) {
  return (
    <Card>
      <CardBody className="p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg bg-${tone}/10 text-${tone} flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
        </div>
      </CardBody>
    </Card>
  )
}

/** Allocations per month for the last 6 months, oldest → newest. */
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

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useLoad(loadTeacherPortal, [])
  const profile = data?.profile
  const allocations = data?.allocations || []

  const live = allocations.filter((a) => LIVE_STATUSES.includes(a.status))
  const pending = allocations.filter((a) => a.status === 'assigned')
  const completed = allocations.filter((a) => a.status === 'completed')
  const fee = profile?.registrationFee
  const displayName = profile?.name || (user?.email ? user.email.split('@')[0] : 'Teacher')

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {displayName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile ? `${profile.primarySubject || 'Teacher'} · ${profile.locality || 'Wellfind Academic'}` : 'Wellfind Academic Teacher Portal'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {profile && (
            <Badge variant={profile.availabilityStatus === 'free' ? 'success' : 'warning'} className="px-3 py-1">
              <CheckCircle className="w-4 h-4 mr-1.5 inline" />
              {profile.availabilityStatus === 'free' ? 'Available for students' : 'Fully allocated'}
            </Badge>
          )}
          <span className="text-xs px-2.5 py-1 rounded bg-muted text-muted-foreground font-mono">{user?.email}</span>
          <Button size="sm" variant="outline" onClick={reload}><RefreshCw size={14} className="mr-1" />Refresh</Button>
        </div>
      </div>

      <Notice error={error} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric icon={Users} label="Allocated students" value={loading ? '…' : allocations.length} note="All time" tone="info" />
        <Metric icon={UserCheck} label="Current students" value={loading ? '…' : live.length} note="Assigned, accepted or active" />
        <Metric icon={Clock} label="Awaiting your response" value={loading ? '…' : pending.length} note="Accept or reject" tone="warning" />
        <Metric
          icon={IndianRupee}
          label="Registration fee"
          value={loading ? '…' : fee?.status ? fee.status.toUpperCase() : '—'}
          note={fee?.year ? `Academic year ${fee.year}` : undefined}
          tone={fee?.status === 'paid' || fee?.status === 'waived' ? 'success' : 'danger'}
        />
      </div>

      {pending.length > 0 && (
        <Card className="border-warning/30">
          <CardHeader className="border-b border-border py-3.5 px-5 flex items-center justify-between">
            <h3 className="card__title">New allocations waiting for you</h3>
            <Link to="/teacher/students" className="text-sm text-primary">Respond →</Link>
          </CardHeader>
          <CardBody className="p-5 text-sm space-y-2">
            {pending.slice(0, 3).map((a) => (
              <div key={a.id} className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{a.student?.name} — {a.subject}</span>
                <span className="text-muted-foreground">{a.student?.studentClass} · {a.student?.locality}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="border-b border-border py-3.5 px-5"><h3 className="card__title">Allocations by status</h3></CardHeader>
          <CardBody className="p-5"><HorizontalBars data={countBy(allocations, (a) => a.status)} empty="No allocations yet." /></CardBody>
        </Card>
        <Card>
          <CardHeader className="border-b border-border py-3.5 px-5"><h3 className="card__title">Subjects taught</h3></CardHeader>
          <CardBody className="p-5"><HorizontalBars data={countBy(allocations, (a) => a.subject)} empty="No subjects yet." /></CardBody>
        </Card>
        <Card>
          <CardHeader className="border-b border-border py-3.5 px-5"><h3 className="card__title">New allocations (6 months)</h3></CardHeader>
          <CardBody className="p-5"><HorizontalBars data={lastSixMonths(allocations)} /></CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border py-3.5 px-5 flex items-center justify-between">
          <h3 className="card__title flex items-center gap-2"><BookOpen size={16} /> Recent allocations</h3>
          <span className="text-xs text-muted-foreground"><Award size={12} className="inline mr-1" />{completed.length} completed</span>
        </CardHeader>
        <CardBody className="p-0">
          {allocations.length === 0 && !loading ? (
            <p className="p-5 text-sm text-muted-foreground">No students have been allocated to you yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {allocations.slice(0, 5).map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium">{a.student?.name}</td>
                    <td className="px-5 py-3">{a.subject}</td>
                    <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(a.allocatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
