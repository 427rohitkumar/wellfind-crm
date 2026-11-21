import { useState } from 'react'
import { CheckCircle2, Clock, IndianRupee, RefreshCw, Users, Wallet } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { TableLoader } from '@/components/ui/Loaders'
import { getFinanceSummary, getPaymentStats, inr, listTeacherPayouts, recordTeacherPayout, undoTeacherPayout } from '@/services/adminApi'
import { inputCls, useLoad } from '@/pages/admin/useLoad'
import { FormRow, Modal, Notice } from '@/pages/admin/adminUi'
import { usePermissions } from '@/hooks/usePermissions'
import { GatewayAlert, PaymentLedger, Stat } from './payoutShared'

/** Teacher Payments: registration fees paid through Razorpay, and what each teacher is due every month. */
export default function TeacherPayments() {
  const [tab, setTab] = useState('registration')
  const stats = useLoad(getPaymentStats, [])
  const finance = useLoad(getFinanceSummary, [])
  const reg = stats.data?.byCategory?.find((c) => c.key === 'teacher_registration')
  const f = finance.data?.totals
  const teachers = finance.data?.teachers || []
  const refresh = () => { stats.reload(); finance.reload() }

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Teacher Payments</h1>
          <p className="page__description">Yearly registration fees received from teachers, and the monthly payouts owed to them.</p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={refresh}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button>
        </div>
      </header>

      <GatewayAlert gw={stats.data?.gateway} />

      <div className="wf-stat-grid">
        <Stat icon={IndianRupee} label="Registration fees collected" value={reg ? inr(reg.collected) : '…'} note={reg ? `${reg.paidCount} payments` : ''} tone="success" />
        <Stat icon={Clock} label="Pending / failed" value={reg ? `${reg.pendingCount} / ${reg.failedCount}` : '…'} note="Started but not completed / declined" tone="warning" />
        <Stat icon={Users} label="Teachers with students" value={teachers.length || (f ? 0 : '…')} note={f ? `${f.liveAllocations} live allocations` : ''} />
        <Stat icon={Wallet} label="Payouts due per month" value={f ? inr(f.expectedTeacherPayouts) : '…'} note={f ? `${inr(f.expectedCommission)} Wellfind commission` : ''} tone="info" />
      </div>

      <div className="wf-seg" role="tablist" style={{ maxWidth: 420, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <button type="button" role="tab" aria-selected={tab === 'registration'} className={tab === 'registration' ? 'is-on' : ''} onClick={() => setTab('registration')}>Registration fees</button>
        <button type="button" role="tab" aria-selected={tab === 'payouts'} className={tab === 'payouts' ? 'is-on' : ''} onClick={() => setTab('payouts')}>Teacher payouts</button>
      </div>

      {tab === 'registration' ? (
        <PaymentLedger category="teacher_registration" title="Registration fee payments" emptyText="No registration payments yet. They appear here as soon as a teacher pays." onChanged={refresh} />
      ) : (
        <Card>
          <div className="wf-sectionhead"><div><h3>Monthly payouts due</h3><p>Sum of each teacher’s share across their live allocations</p></div></div>
          <div className="wf-table-wrap">
            <table className="wf-table">
              <thead><tr><th>Teacher</th><th className="num">Students</th><th className="num">Fees from families</th><th className="num">Wellfind commission</th><th className="num">Payout due</th></tr></thead>
              <tbody>
                {finance.loading && <tr><td colSpan={5} style={{ padding: 0 }}><TableLoader columns={5} /></td></tr>}
                {!finance.loading && finance.error && <tr><td colSpan={5} className="wf-state is-error">{finance.error}</td></tr>}
                {!finance.loading && !finance.error && teachers.length === 0 && <tr><td colSpan={5} className="wf-state">No teacher has live allocations with fee terms yet.</td></tr>}
                {!finance.loading && teachers.map((t) => (
                  <tr key={t.teacherId}>
                    <td className="wf-cell-title">{t.teacherName}</td>
                    <td className="num">{t.students}</td>
                    <td className="num">{inr(t.monthlyFee)}</td>
                    <td className="num">{inr(t.commission)}</td>
                    <td className="num"><b>{inr(t.payout)}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="wf-pad wf-muted"><CheckCircle2 size={12} style={{ display: 'inline', marginRight: 4 }} />Emails with each teacher’s monthly summary are sent from the Mail tab (Scheduled mails).</div>
        </Card>
      )}
      {tab === 'payouts' && <PayoutLedger onChanged={refresh} />}
    </div>
  )
}


const thisMonth = () => new Date().toISOString().slice(0, 7)
const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

/** What each teacher is owed for each student in a month, with "Mark paid" for the finance team. */
function PayoutLedger({ onChanged }) {
  const { can } = usePermissions()
  const [month, setMonth] = useState(thisMonth())
  const [state, setState] = useState('all')
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [pay, setPay] = useState(null)
  const { data, loading, error, reload } = useLoad(() => listTeacherPayouts({ month }), [month])
  const rows = (data?.rows || []).filter((r) => state === 'all' || r.status === state)
  const t = data?.totals

  const undo = async (r) => {
    if (!window.confirm(`Remove the "paid" mark for ${r.studentName}?`)) return
    try { await undoTeacherPayout(r.payoutId); setMsg({ error: '', success: 'Payment mark removed.' }); reload(); onChanged?.() } catch (e) { setMsg({ error: e.message, success: '' }) }
  }

  return (
    <Card>
      <div className="wf-sectionhead" style={{ flexWrap: 'wrap' }}>
        <div><h3>Monthly payouts to teachers</h3><p>{t ? `${inr(t.received)} paid · ${inr(t.pending)} still to pay in this month` : 'Per teacher, per student'}</p></div>
        <div className="wf-filterbar">
          <input type="month" className={inputCls} style={{ width: 170 }} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" />
          <select className={inputCls} style={{ width: 150 }} value={state} onChange={(e) => setState(e.target.value)} aria-label="Status">
            <option value="all">Paid &amp; pending</option><option value="pending">Pending</option><option value="paid">Paid</option>
          </select>
        </div>
      </div>
      <div className="wf-testpad" style={{ paddingBottom: 0 }}><Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} /></div>
      <div className="wf-table-wrap">
        <table className="wf-table">
          <thead><tr><th>Teacher</th><th>Student</th><th>Subject</th><th className="num">Amount</th><th>Status</th><th>Paid on</th><th>Reference</th><th className="num">Action</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8} style={{ padding: 0 }}><TableLoader columns={8} /></td></tr>}
            {!loading && error && <tr><td colSpan={8} className="wf-state is-error">{error}</td></tr>}
            {!loading && !error && rows.length === 0 && <tr><td colSpan={8} className="wf-state">No teaching recorded for this month.</td></tr>}
            {!loading && rows.map((r) => (
              <tr key={`${r.allocationId}-${r.month}`}>
                <td className="wf-cell-title">{r.teacherName}</td>
                <td>{r.studentName}<div className="wf-cell-sub">{r.studentClass}</div></td>
                <td>{r.subject}</td>
                <td className="num"><b>{inr(r.status === 'paid' ? r.amount : r.due)}</b></td>
                <td>{r.status === 'paid' ? <Badge size="sm" variant="success">Paid</Badge> : <Badge size="sm" variant="warning">Pending</Badge>}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.paidAt)}</td>
                <td>{r.reference || '—'}</td>
                <td>
                  <div className="wf-actions" style={{ justifyContent: 'flex-end' }}>
                    {can('payments', 'write') && (r.status === 'pending'
                      ? <Button size="sm" onClick={() => setPay(r)}>Mark paid</Button>
                      : <Button size="sm" variant="outline" onClick={() => undo(r)}>Undo</Button>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pay && <MarkPaidModal row={pay} onClose={() => setPay(null)} onDone={() => { setPay(null); setMsg({ error: '', success: 'Payment recorded.' }); reload(); onChanged?.() }} />}
    </Card>
  )
}

function MarkPaidModal({ row, onClose, onDone }) {
  const [amount, setAmount] = useState(row.due ?? '')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await recordTeacherPayout({ allocationId: row.allocationId, month: row.month, amount: Number(amount), paidAt, reference })
      onDone()
    } catch (err) { setError(err.message); setSaving(false) }
  }
  return (
    <Modal title="Mark as paid" description={`${row.teacherName} · ${row.studentName} · ${row.month}`} onClose={onClose}>
      <form onSubmit={submit} className="wf-form">
        <Notice error={error} />
        <div className="wf-grid-2">
          <FormRow label="Amount paid (₹)"><input type="number" min="0" step="any" required className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} /></FormRow>
          <FormRow label="Paid on"><input type="date" required className={inputCls} value={paidAt} onChange={(e) => setPaidAt(e.target.value)} /></FormRow>
        </div>
        <FormRow label="Reference (optional)" hint="UPI / bank transaction id"><input className={inputCls} maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} /></FormRow>
        <div className="wf-formfoot"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving}>Save</Button></div>
      </form>
    </Modal>
  )
}
