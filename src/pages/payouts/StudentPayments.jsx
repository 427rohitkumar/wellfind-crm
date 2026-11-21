import { CheckCircle2, Clock, IndianRupee, Percent, RefreshCw, Users } from 'lucide-react'
import { Alert, Button, Card } from '@/components/ui'
import { TableLoader } from '@/components/ui/Loaders'
import { getFinanceSummary, getPaymentStats, inr, labelize } from '@/services/adminApi'
import { useLoad } from '@/pages/admin/useLoad'
import { StatusBadge } from '@/pages/admin/adminUi'
import { GatewayAlert, PaymentLedger, Stat } from './payoutShared'

/** Student Payments: what families pay for tuition. Online tuition collection will land in the ledger below. */
export default function StudentPayments() {
  const stats = useLoad(getPaymentStats, [])
  const finance = useLoad(getFinanceSummary, [])
  const tuition = stats.data?.byCategory?.find((c) => c.key === 'tuition_fee')
  const f = finance.data?.totals
  const rows = finance.data?.allocations || []
  const refresh = () => { stats.reload(); finance.reload() }

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Student Payments</h1>
          <p className="page__description">Tuition fees from families: the monthly fee agreed at allocation, and every online payment received.</p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={refresh}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button>
        </div>
      </header>

      <GatewayAlert gw={stats.data?.gateway} />
      <Alert variant="info" title="Online tuition payments are not collected yet" icon={IndianRupee}>
        Families do not pay through Razorpay yet, so the ledger below stays empty. The table of monthly fees shows what each allocated student is expected to pay.
      </Alert>

      <div className="wf-stat-grid">
        <Stat icon={IndianRupee} label="Collected online" value={tuition ? inr(tuition.collected) : '…'} note={tuition ? `${tuition.paidCount} payments` : ''} tone="success" />
        <Stat icon={Clock} label="Pending / failed" value={tuition ? `${tuition.pendingCount} / ${tuition.failedCount}` : '…'} note="Started but not completed / declined" tone="warning" />
        <Stat icon={Users} label="Students with live allocation" value={f ? f.liveAllocations : '…'} note={f?.withoutTerms ? `${f.withoutTerms} without fee terms` : 'All priced'} />
        <Stat icon={Percent} label="Expected monthly fees" value={f ? inr(f.expectedMonthlyFees) : '…'} note={f ? `${inr(f.expectedCommission)} Wellfind commission` : ''} tone="info" />
      </div>

      <Card>
        <div className="wf-sectionhead"><div><h3>Monthly fees by student</h3><p>From the fee decided when the teacher was allocated</p></div></div>
        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead><tr><th>Student</th><th>Teacher</th><th>Subject</th><th>Allocation</th><th className="num">Monthly fee</th><th className="num">Commission</th><th className="num">Teacher payout</th></tr></thead>
            <tbody>
              {finance.loading && <tr><td colSpan={7} style={{ padding: 0 }}><TableLoader columns={7} /></td></tr>}
              {!finance.loading && finance.error && <tr><td colSpan={7} className="wf-state is-error">{finance.error}</td></tr>}
              {!finance.loading && !finance.error && rows.length === 0 && <tr><td colSpan={7} className="wf-state">No live allocations yet.</td></tr>}
              {!finance.loading && rows.map((r) => (
                <tr key={r.id}>
                  <td><div className="wf-cell-title">{r.studentName}</div><div className="wf-cell-sub">{r.studentClass}</div></td>
                  <td>{r.teacherName}</td>
                  <td>{r.subject}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="num"><b>{r.monthlyFee != null ? inr(r.monthlyFee) : '—'}</b></td>
                  <td className="num">{r.commissionAmount != null ? <>{inr(r.commissionAmount)}<div className="wf-cell-sub" style={{ justifyContent: 'flex-end' }}>{r.commissionPercent}%</div></> : '—'}</td>
                  <td className="num">{r.teacherPayout != null ? inr(r.teacherPayout) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <PaymentLedger category="tuition_fee" title="Tuition fee payments" emptyText="No tuition payments yet. Online tuition payments will appear here." onChanged={refresh} />
      <p className="wf-muted"><CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />Status labels: {labelize('assigned')}, {labelize('accepted')} and {labelize('active')} allocations are counted.</p>
    </div>
  )
}
