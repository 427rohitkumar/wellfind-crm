import { CheckCircle2, Clock, IndianRupee, Percent, RefreshCw, TrendingUp, Users, Wallet } from 'lucide-react'
import { Alert, Button, Card } from '@/components/ui'
import { getFinanceSummary, getPaymentStats, inr } from '@/services/adminApi'
import { useLoad } from '@/pages/admin/useLoad'
import { CATEGORY_COLOR, METHOD_LABEL } from './payoutConstants'
import { GatewayAlert, PaymentLedger, Stat } from './payoutShared'

/** Payout Reports: the final billing report. Live Razorpay payments plus the commercial terms of allocations. */
export default function PayoutReports() {
  const stats = useLoad(getPaymentStats, [])
  const finance = useLoad(getFinanceSummary, [])
  const t = stats.data?.totals
  const gw = stats.data?.gateway
  const months = stats.data?.months || []
  const maxMonth = Math.max(1, ...months.map((m) => m.total))
  const f = finance.data?.totals
  const refresh = () => { stats.reload(); finance.reload() }

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Payout Reports</h1>
          <p className="page__description">The complete picture: what was collected through Razorpay, by category, and what the allocations are worth every month.</p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={refresh}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button>
        </div>
      </header>

      <GatewayAlert gw={gw} />
      {t?.testCount > 0 && (
        <Alert variant="info" title={`${t.testCount} test payment${t.testCount === 1 ? '' : 's'} included`}>
          {inr(t.testCollected)} of the totals below comes from Razorpay test mode. Use the “Live only” filter in the ledger to see real money only.
        </Alert>
      )}

      <div className="wf-stat-grid">
        <Stat icon={IndianRupee} label="Total collected" value={t ? inr(t.collected) : '…'} note={t ? `${inr(t.collectedToday)} today` : ''} tone="success" />
        <Stat icon={TrendingUp} label="Last 30 days" value={t ? inr(t.collected30d) : '…'} note={t ? `${inr(t.collected7d)} in the last 7 days` : ''} />
        <Stat icon={CheckCircle2} label="Successful payments" value={t ? t.paidCount : '…'} note={t ? (t.successRate != null ? `${t.successRate}% success rate · avg ${inr(t.averageTicket)}` : 'No attempts yet') : ''} tone="info" />
        <Stat icon={Clock} label="Pending / failed" value={t ? `${t.pendingCount} / ${t.failedCount}` : '…'} note="Started but not completed / declined" tone="warning" />
      </div>

      <div className="wf-pay-grid">
        <Card variant="hover">
          <div className="wf-cardhead"><h3><Wallet size={18} />By category</h3></div>
          <div className="wf-cats">
            {(stats.data?.byCategory || []).map((c) => (
              <div key={c.key} className="wf-cat" style={{ cursor: 'default' }}>
                <span className="wf-cat__dot" style={{ background: CATEGORY_COLOR[c.key] }} />
                <div><strong>{c.label}</strong><span>{c.paidCount} paid · {c.pendingCount} pending · {c.failedCount} failed</span></div>
                <b>{inr(c.collected)}</b>
              </div>
            ))}
            <p className="wf-muted" style={{ margin: '4px 2px 0' }}>Tuition fee payments will appear here once students pay online.</p>
          </div>
        </Card>

        <Card variant="hover">
          <div className="wf-cardhead"><h3><TrendingUp size={18} />Collected per month</h3><span className="wf-muted">Last 6 months</span></div>
          <div className="wf-bars">
            {months.map((m) => (
              <div key={m.month} className="wf-bar" title={`${m.label}: ${inr(m.total)}`}>
                <div className="wf-bar__col">
                  {Object.entries(m.byCategory).filter(([, v]) => v > 0).map(([k, v]) => (
                    <span key={k} style={{ height: `${(v / maxMonth) * 100}%`, background: CATEGORY_COLOR[k] }} />
                  ))}
                </div>
                <small>{m.label}</small>
                <b>{m.total ? inr(m.total) : '—'}</b>
              </div>
            ))}
          </div>
          {stats.data?.methods?.length > 0 && (
            <div className="wf-methods">
              <small>Payment methods</small>
              {stats.data.methods.map((m) => <span key={m.method} className="wf-chip">{METHOD_LABEL[m.method] || m.method} · {m.count}</span>)}
            </div>
          )}
        </Card>
      </div>

      <Card variant="hover">
        <div className="wf-cardhead"><h3><Users size={18} />Monthly allocation economics</h3><span className="wf-muted">From the fee and commission set at allocation</span></div>
        <div className="wf-stat-grid" style={{ padding: 18 }}>
          <Stat icon={Users} label="Live allocations" value={f ? f.liveAllocations : '…'} note={f?.withoutTerms ? `${f.withoutTerms} without fee terms` : 'All priced'} />
          <Stat icon={IndianRupee} label="Expected monthly fees" value={f ? inr(f.expectedMonthlyFees) : '…'} note="Paid by families" tone="success" />
          <Stat icon={Percent} label="Wellfind commission" value={f ? inr(f.expectedCommission) : '…'} note="Per month" tone="info" />
          <Stat icon={Wallet} label="Teacher payouts due" value={f ? inr(f.expectedTeacherPayouts) : '…'} note="Per month" tone="warning" />
        </div>
      </Card>

      <PaymentLedger title="All payments" />
    </div>
  )
}
