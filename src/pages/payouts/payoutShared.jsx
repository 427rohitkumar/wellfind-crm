import { useState } from 'react'
import { Alert, Button } from '@/components/ui'
import { fmtDateTime, inr, listPayments, docsOf } from '@/services/adminApi'
import { Pager } from '@/pages/admin/adminUi'
import { inputCls, useLoad } from '@/pages/admin/useLoad'
import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react'
import { TableLoader } from '@/components/ui/Loaders'
import { CATEGORY_COLOR, CATEGORY_LABEL, METHOD_LABEL, STATUS_LABEL, STATUS_TONE } from './payoutConstants'


export function Stat({ icon: Icon, label, value, note, tone = 'primary' }) {
  return (
    <div className="wf-stat-card">
      <span className={`wf-stat-card__icon is-${tone}`}><Icon size={20} /></span>
      <div><small>{label}</small><b>{value}</b>{note && <span>{note}</span>}</div>
    </div>
  )
}

/** Marks a Razorpay test-mode transaction so nobody mistakes it for real money. */
export function TestBadge({ mode }) {
  if (mode !== 'test') return null
  return <span className="wf-testbadge" title="Razorpay test mode: not real money">TEST</span>
}

/** Razorpay connection status, in the shared alert style. */
export function GatewayAlert({ gw }) {
  if (!gw) return null
  if (!gw.configured) {
    return (
      <Alert variant="warning" title="Razorpay is not connected" icon={CreditCard}>
        Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the API .env and restart. Teachers will see “Online payment coming soon” until then.
      </Alert>
    )
  }
  if (!gw.webhookConfigured) {
    return (
      <Alert variant="warning" title={`Razorpay connected (${gw.mode} mode). Webhook not set`} icon={CreditCard}>
        Add RAZORPAY_WEBHOOK_SECRET and create the webhook in the Razorpay dashboard so payments confirm even if the teacher closes the page.
      </Alert>
    )
  }
  if (gw.mode === 'test') {
    return (
      <Alert variant="info" title="Razorpay connected (test mode). Webhook active" icon={CreditCard}>
        Payments below marked TEST are test transactions made with test keys. They are not real money.
      </Alert>
    )
  }
  return (
    <Alert variant="success" title="Razorpay connected (live mode). Webhook active" icon={CreditCard}>
      Payments, failures and refunds are verified and syncing automatically in real time.
    </Alert>
  )
}

/**
 * Payment ledger table for one category (or all). Filters: status, mode (test/live), search, dates.
 * `category` fixes the category; omit it to show a category filter.
 */
export function PaymentLedger({ category, title = 'Payment ledger', emptyText, onChanged }) {
  const [page, setPage] = useState(1)
  const [cat, setCat] = useState('all')
  const [status, setStatus] = useState('all')
  const [mode, setMode] = useState('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const effectiveCategory = category || cat

  const list = useLoad(
    () => listPayments({ page, limit: 15, category: effectiveCategory, status, mode, search: query, from, to }),
    [page, effectiveCategory, status, mode, query, from, to],
  )
  const rows = docsOf(list.data)
  const reset = (fn) => (e) => { setPage(1); fn(e.target.value) }

  return (
    <div className="card">
      <div className="wf-sectionhead">
        <div><h3>{title}</h3><p>{list.data?.totalDocs ?? 0} payments match</p></div>
        <div className="wf-logfilters">
          <input className={inputCls} placeholder="Search name, email, payment id…" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setQuery(search.trim()) } }}
            onBlur={() => { if (search.trim() !== query) { setPage(1); setQuery(search.trim()) } }} />
          {!category && (
            <select className={inputCls} value={cat} onChange={reset(setCat)}>
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
          <select className={inputCls} value={status} onChange={reset(setStatus)}>
            <option value="all">All statuses</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className={inputCls} value={mode} onChange={reset(setMode)}>
            <option value="all">Test + live</option>
            <option value="live">Live only</option>
            <option value="test">Test only</option>
          </select>
          <input type="date" className={inputCls} value={from} onChange={reset(setFrom)} aria-label="From date" />
          <input type="date" className={inputCls} value={to} onChange={reset(setTo)} aria-label="To date" />
          <Button variant="outline" size="sm" onClick={() => { list.reload(); onChanged?.() }} aria-label="Reload"><RefreshCw size={14} /></Button>
        </div>
      </div>
      <div className="wf-table-wrap">
        <table className="wf-table">
          <thead><tr><th>Date</th><th>Paid by</th><th>Category</th><th className="num">Amount</th><th>Status</th><th>Method</th><th>Gateway reference</th></tr></thead>
          <tbody>
            {list.loading && <tr><td colSpan={7} style={{ padding: 0 }}><TableLoader columns={7} /></td></tr>}
            {!list.loading && list.error && <tr><td colSpan={7} className="wf-state is-error">{list.error}</td></tr>}
            {!list.loading && !list.error && rows.length === 0 && (
              <tr><td colSpan={7} className="wf-state">{emptyText || 'No payments yet. They appear here as soon as someone pays.'}</td></tr>
            )}
            {!list.loading && rows.map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div className="wf-cell-title">{fmtDateTime(r.paidAt || r.createdAt)}</div>
                  <div className="wf-cell-sub">{r.paidAt ? 'Paid' : 'Started'}</div>
                </td>
                <td><div className="wf-cell-title">{r.payerName || '—'}</div><div className="wf-cell-sub">{r.payerEmail || r.payerPhone || ''}</div></td>
                <td>
                  <span className="wf-catlabel"><i style={{ background: CATEGORY_COLOR[r.category] }} />{CATEGORY_LABEL[r.category] || r.category}</span>
                  {/renewal/i.test(r.description || '') && <div className="wf-cell-sub">Yearly renewal</div>}
                </td>
                <td className="num"><b>{inr(r.amount)}</b> <TestBadge mode={r.mode} /></td>
                <td>
                  <span className={`wf-feebadge wf-feebadge--${STATUS_TONE[r.status] || 'pending'}`}>{STATUS_LABEL[r.status] || r.status}</span>
                  {r.failureReason && <div className="wf-cell-sub wf-cell-err" title={r.failureReason}><AlertTriangle size={12} />{r.failureReason}</div>}
                </td>
                <td>{r.method ? METHOD_LABEL[r.method] || r.method : '—'}</td>
                <td>
                  <div className="wf-cell-sub" style={{ marginTop: 0 }}>{r.razorpayPaymentId || '—'}</div>
                  {r.razorpayOrderId && <div className="wf-cell-sub">{r.razorpayOrderId}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager data={list.data} page={page} onPage={setPage} />
    </div>
  )
}
