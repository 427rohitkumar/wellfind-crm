import { useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, Clock, Hash, IndianRupee, RefreshCw, Wallet } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { TableLoader } from '@/components/ui/Loaders'
import { Notice, StatusBadge } from '@/pages/admin/adminUi'
import { inputCls, useLoad } from '@/pages/admin/useLoad'
import { Stat } from '@/pages/payouts/payoutShared'
import { apiRequest } from '@/services/apiClient'
import { getMyApplication, getMyProfile } from '@/services/teacherPortalService'
import RegistrationRenewalCard from './RegistrationRenewalCard'
import { formatDate } from './teacherPortalUtils'

const money = (amount, currency = 'INR') =>
  amount == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
const monthLabel = (m) => {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}
const getPayouts = async () => {
  const res = await apiRequest('/api/teachers/me/payouts')
  return res && typeof res === 'object' && 'data' in res ? res.data : res
}

/** Fees & History: the registration fee, and what Wellfind has paid (or still owes) per student, per month. */
export default function TeacherFees() {
  const profile = useLoad(getMyProfile, [])
  const appState = useLoad(getMyApplication, [])
  const payouts = useLoad(getPayouts, [])
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [year, setYear] = useState('all')
  const [state, setState] = useState('all')

  const fee = profile.data?.registrationFee
  const rows = payouts.data?.rows || []
  const totals = payouts.data?.totals
  const years = useMemo(() => [...new Set(rows.map((r) => r.month.slice(0, 4)))].sort().reverse(), [rows])
  const shown = rows.filter((r) => (year === 'all' || r.month.startsWith(year)) && (state === 'all' || r.status === state))
  const refreshAll = () => { profile.reload(); appState.reload(); payouts.reload() }

  const feeCard = (
    <Card>
            <div className="wf-cardhead"><h3><IndianRupee size={18} />Registration fee</h3>{fee && <StatusBadge status={fee.status} />}</div>
            {!fee ? <div className="wf-testpad"><p className="wf-muted" style={{ margin: 0 }}>{profile.loading ? 'Loading…' : 'No registration fee record found.'}</p></div> : (
              <dl className="wf-info">
                <div><dt>Amount</dt><dd>{money(fee.amount, fee.currency)}</dd></div>
                <div><dt>Validity</dt><dd><CalendarClock size={14} />Academic year {fee.year || '—'}</dd></div>
                <div><dt>Paid on</dt><dd>{fee.paymentDate && fee.paymentDate !== 'Pending' ? formatDate(fee.paymentDate) : fee.paymentDate || '—'}</dd></div>
                <div><dt>Reference</dt><dd><Hash size={14} />{fee.transactionRef && fee.transactionRef !== 'None' ? fee.transactionRef : '—'}</dd></div>
              </dl>
            )}
            {fee?.status === 'pending' && <div className="wf-testpad" style={{ paddingTop: 0 }}><div className="wf-lock">Your registration fee is pending. Pay it from Application Status.</div></div>}
          </Card>
  )

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Fees &amp; History</h1>
          <p className="page__description">Your yearly registration fee, and the payments you received from Wellfind for each student, month by month.</p>
        </div>
        <div className="page__action"><Button variant="outline" onClick={refreshAll}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button></div>
      </header>

      <Notice error={profile.error || payouts.error || msg.error} success={msg.success} onClose={() => setMsg({ error: '', success: '' })} />

      {appState.data ? (
        <div className="wf-portal-grid">
          <div className="wf-portal-main">
            <RegistrationRenewalCard app={appState.data} onDone={refreshAll} onSuccess={(text) => setMsg({ error: '', success: text })} onError={(text) => setMsg({ error: text, success: '' })} />
          </div>
          <div className="wf-portal-side">
          <Card>
            <div className="wf-cardhead"><h3><IndianRupee size={18} />Registration fee</h3>{fee && <StatusBadge status={fee.status} />}</div>
            {!fee ? <div className="wf-testpad"><p className="wf-muted" style={{ margin: 0 }}>{profile.loading ? 'Loading…' : 'No registration fee record found.'}</p></div> : (
              <dl className="wf-info">
                <div><dt>Amount</dt><dd>{money(fee.amount, fee.currency)}</dd></div>
                <div><dt>Validity</dt><dd><CalendarClock size={14} />Academic year {fee.year || '—'}</dd></div>
                <div><dt>Paid on</dt><dd>{fee.paymentDate && fee.paymentDate !== 'Pending' ? formatDate(fee.paymentDate) : fee.paymentDate || '—'}</dd></div>
                <div><dt>Reference</dt><dd><Hash size={14} />{fee.transactionRef && fee.transactionRef !== 'None' ? fee.transactionRef : '—'}</dd></div>
              </dl>
            )}
            {fee?.status === 'pending' && <div className="wf-testpad" style={{ paddingTop: 0 }}><div className="wf-lock">Your registration fee is pending. Pay it from Application Status.</div></div>}
          </Card>
          </div>
        </div>
      ) : (
        feeCard
      )}

      <div className="wf-stat-grid">
        <Stat icon={CheckCircle2} label="Total received" value={totals ? money(totals.received) : '…'} note={totals ? `${totals.paidCount} payment${totals.paidCount === 1 ? '' : 's'}` : ''} tone="success" />
        <Stat icon={Clock} label="Yet to receive" value={totals ? money(totals.pending) : '…'} note={totals ? `${totals.pendingCount} month${totals.pendingCount === 1 ? '' : 's'} pending` : ''} tone="warning" />
        <Stat icon={Wallet} label="Students paid for" value={payouts.loading ? '…' : new Set(rows.map((r) => r.studentName)).size} note="Across all months" tone="info" />
      </div>

      <Card>
        <div className="wf-sectionhead" style={{ flexWrap: 'wrap' }}>
          <div><h3>Payment history</h3><p>What you were paid for each student, each month</p></div>
          <div className="wf-filterbar">
            <select className={inputCls} style={{ width: 130 }} value={year} onChange={(e) => setYear(e.target.value)} aria-label="Year">
              <option value="all">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className={inputCls} style={{ width: 150 }} value={state} onChange={(e) => setState(e.target.value)} aria-label="Status">
              <option value="all">Paid &amp; pending</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead><tr><th>Month</th><th>Student</th><th>Subject</th><th className="num">Amount</th><th>Status</th><th>Paid on</th><th>Reference</th></tr></thead>
            <tbody>
              {payouts.loading && <tr><td colSpan={7} style={{ padding: 0 }}><TableLoader columns={7} /></td></tr>}
              {!payouts.loading && !payouts.error && shown.length === 0 && <tr><td colSpan={7} className="wf-state">{rows.length === 0 ? 'No payments yet. A row appears for every month you teach a student.' : 'Nothing matches these filters.'}</td></tr>}
              {!payouts.loading && shown.map((r) => (
                <tr key={`${r.allocationId}-${r.month}`}>
                  <td className="wf-cell-title">{monthLabel(r.month)}</td>
                  <td>{r.studentName}<div className="wf-cell-sub">{r.studentClass}</div></td>
                  <td>{r.subject}</td>
                  <td className="num"><b>{money(r.status === 'paid' ? r.amount : r.due)}</b></td>
                  <td>{r.status === 'paid' ? <Badge size="sm" variant="success">Paid</Badge> : <Badge size="sm" variant="warning">Pending</Badge>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.paidAt ? formatDate(r.paidAt) : '—'}</td>
                  <td>{r.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
