import { CalendarClock, Hash, IndianRupee, Info, RefreshCw } from 'lucide-react'
import { Button, Card, CardBody, CardHeader } from '@/components/ui'
import { Notice, StatusBadge } from '@/pages/admin/adminUi'
import { useLoad } from '@/pages/admin/useLoad'
import { durationBetween, endedAt, formatDate, loadTeacherPortal } from './teacherPortalUtils'

const money = (amount, currency = 'INR') =>
  amount == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon size={16} className="mt-0.5 text-muted-foreground shrink-0" />
      <div><div className="text-muted-foreground">{label}</div><div className="font-medium">{children}</div></div>
    </div>
  )
}

export default function TeacherFees() {
  const { data, loading, error, reload } = useLoad(loadTeacherPortal, [])
  const fee = data?.profile?.registrationFee
  const allocations = data?.allocations || []

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Fees &amp; History</h1>
          <p className="page__description">Your registration fee and the history of students allocated to you.</p>
        </div>
        <div className="page__action"><Button variant="outline" onClick={reload}><RefreshCw size={16} className="mr-2" />Refresh</Button></div>
      </header>

      <Notice error={error} />

      <Card className="mb-6">
        <CardHeader className="border-b border-border py-3.5 px-5 flex items-center justify-between">
          <h3 className="card__title">Registration fee</h3>
          {fee && <StatusBadge status={fee.status} />}
        </CardHeader>
        <CardBody className="p-5">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : !fee ? (
            <p className="text-sm text-muted-foreground">No registration fee record found.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Row icon={IndianRupee} label="Amount">{money(fee.amount, fee.currency)}</Row>
              <Row icon={CalendarClock} label="Validity / duration">Academic year {fee.year || '—'}</Row>
              <Row icon={CalendarClock} label="Payment date">{fee.paymentDate && fee.paymentDate !== 'Pending' ? formatDate(fee.paymentDate) : fee.paymentDate || '—'}</Row>
              <Row icon={Hash} label="Transaction reference">{fee.transactionRef && fee.transactionRef !== 'None' ? fee.transactionRef : '—'}</Row>
            </div>
          )}
          {fee?.status === 'pending' && (
            <p className="mt-4 text-sm text-warning">Your registration fee is pending. Please contact Wellfind admin to complete the payment.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="border-b border-border py-3.5 px-5"><h3 className="card__title">Student allocation history</h3></CardHeader>
        <CardBody className="p-0">
          <div className="flex items-start gap-2 px-5 py-3 text-xs text-muted-foreground border-b border-border">
            <Info size={14} className="mt-0.5 shrink-0" />
            Per-student tuition fee payments are not recorded in the system yet; this shows each allocation with its duration and outcome.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-5 py-3">Student</th><th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Started</th><th className="px-5 py-3">Ended</th>
                  <th className="px-5 py-3">Duration</th><th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {!loading && allocations.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No allocation history yet.</td></tr>}
                {allocations.map((a) => {
                  const end = endedAt(a)
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium">{a.student?.name}</td>
                      <td className="px-5 py-3">{a.subject}</td>
                      <td className="px-5 py-3">{formatDate(a.allocatedAt)}</td>
                      <td className="px-5 py-3">{end ? formatDate(end) : '—'}</td>
                      <td className="px-5 py-3">{durationBetween(a.allocatedAt, end || new Date())}</td>
                      <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
