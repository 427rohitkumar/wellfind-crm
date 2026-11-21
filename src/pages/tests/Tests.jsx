import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CheckCircle2, ClipboardCheck, Eye, FileText, Globe, IndianRupee, MapPin, Phone, RefreshCw, Search } from 'lucide-react'
import { Alert, Badge, Button, Card } from '@/components/ui'
import { TableLoader } from '@/components/ui/Loaders'
import { LEVEL_LABEL, TEST_MODES, TEST_STATUS_LABEL, listEnquiryTests } from '@/services/adminApi'
import { useLoad, inputCls } from '@/pages/admin/useLoad'
import { Pager } from '@/pages/admin/adminUi'
import { Stat } from '@/pages/payouts/payoutShared'

import { PAY_VARIANT, STATUS_VARIANT, fmtWhen } from './testShared'

export function ModeBadge({ mode }) {
  const digital = mode === 'digital'
  return (
    <Badge size="sm" variant={digital ? 'info' : 'primary'}>
      {digital ? <Globe size={12} className="mr-1 inline" /> : <MapPin size={12} className="mr-1 inline" />}
      {TEST_MODES[mode]?.short || mode}
    </Badge>
  )
}

/** Tests: students / parents who asked for the assessment test. Skipped tests never show up here. */
export default function Tests() {
  const [status, setStatus] = useState('')
  const [mode, setMode] = useState('')
  const [payment, setPayment] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, error, loading, reload } = useLoad(
    () => listEnquiryTests({ status, mode, payment, search, page, limit: 10 }),
    [status, mode, payment, search, page],
  )
  const c = data?.counts
  const rows = data?.docs || []

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Tests</h1>
          <p className="page__description">
            Students who opted for the assessment test. It measures IQ, creativity and academic level, so the best teacher can be matched and knows how much effort the student needs.
          </p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={reload}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button>
        </div>
      </header>

      <div className="wf-stat-grid">
        <Stat icon={ClipboardCheck} label="Requested" value={c ? c.requested : '…'} note="Waiting to be scheduled" tone="warning" />
        <Stat icon={IndianRupee} label="Awaiting payment" value={c ? c.awaitingPayment : '…'} note={data ? `₹${data.fees.physical} physical · ₹${data.fees.digital} digital` : ''} tone="info" />
        <Stat icon={CalendarClock} label="Scheduled" value={c ? c.scheduled : '…'} note="Tester / quiz booked" />
        <Stat icon={FileText} label="Conducted" value={c ? c.conducted : '…'} note="Report to be written" tone="info" />
        <Stat icon={CheckCircle2} label="Report ready" value={c ? c.reportReady : '…'} note="Ready for allocation" tone="success" />
      </div>

      <Card>
        <div className="wf-sectionhead" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div><h3>All tests</h3><p>{data ? `${data.totalDocs} total` : 'Loading…'}</p></div>
          <div className="wf-filterbar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--color-muted-foreground)' }} />
              <input
                className={inputCls}
                style={{ paddingLeft: 30, width: 220 }}
                placeholder="Search student or phone"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput.trim()); setPage(1) } }}
                onBlur={() => { if (searchInput.trim() !== search) { setSearch(searchInput.trim()); setPage(1) } }}
              />
            </div>
            <select className={inputCls} style={{ width: 'auto' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="Status">
              <option value="">All statuses</option>
              {Object.entries(TEST_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className={inputCls} style={{ width: 'auto' }} value={mode} onChange={(e) => { setMode(e.target.value); setPage(1) }} aria-label="Mode">
              <option value="">Both modes</option>
              <option value="physical">Physical</option>
              <option value="digital">Digital</option>
            </select>
            <select className={inputCls} style={{ width: 'auto' }} value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1) }} aria-label="Payment">
              <option value="">Any payment</option>
              <option value="pending">Payment pending</option>
              <option value="paid">Paid</option>
              <option value="waived">Waived</option>
            </select>
          </div>
        </div>

        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead>
              <tr>
                <th>Student / Parent</th>
                <th>Class &amp; Subjects</th>
                <th>Mode &amp; fee</th>
                <th>Payment</th>
                <th>Schedule / Tester</th>
                <th>Status</th>
                <th>Result</th>
                <th className="num">Open</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ padding: 0 }}><TableLoader columns={8} /></td></tr>}
              {!loading && error && <tr><td colSpan={8} className="wf-state is-error">{error}</td></tr>}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="wf-state">
                    No tests yet. When a parent wants the test, open the enquiry in Inquiries and choose “Test” in its status menu.
                  </td>
                </tr>
              )}
              {!loading && rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/admin/tests/${t.id}`} className="wf-cell-title">{t.student?.name || `Enquiry #${t.studentEnquiryId}`}</Link>
                    <div className="wf-cell-sub"><Phone size={12} />{t.student?.phoneNumber || '—'}</div>
                  </td>
                  <td>
                    <div className="wf-cell-title">{t.student?.studentClass || '—'}</div>
                    <div className="wf-cell-sub" style={{ maxWidth: 240 }}>{(t.student?.subjects || []).join(', ') || '—'}</div>
                  </td>
                  <td>
                    <ModeBadge mode={t.mode} />
                    <div className="wf-cell-sub">₹{t.fee}</div>
                  </td>
                  <td><Badge size="sm" variant={PAY_VARIANT[t.payment.status] || 'neutral'}>{t.payment.status}</Badge></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div className="wf-cell-title">{fmtWhen(t.scheduledAt)}</div>
                    <div className="wf-cell-sub">{t.mode === 'physical' ? (t.tester?.email || 'No tester yet') : 'Online quiz'}</div>
                  </td>
                  <td><Badge size="sm" variant={STATUS_VARIANT[t.status] || 'neutral'}>{TEST_STATUS_LABEL[t.status] || t.status}</Badge></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {t.report ? (
                      <div className="wf-cell-sub" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                        <span>IQ <b>{t.report.iqScore}</b> · Cr <b>{t.report.creativityScore}</b> · Ac <b>{t.report.academicScore}</b></span>
                        <span className={`wf-lvl is-${t.report.academicLevel}`}>{LEVEL_LABEL[t.report.academicLevel]}</span>
                      </div>
                    ) : <span className="wf-muted">—</span>}
                  </td>
                  <td>
                    <div className="wf-actions">
                      <Link to={`/admin/tests/${t.id}`} className="table-action-btn" title="Open test"><Eye size={15} /></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager data={data} page={page} onPage={setPage} />
      </Card>
      {!loading && !error && data && (
        <Alert variant="info" title="Skipping the test is decided at enquiry time">
          Students who skip the test are never listed here. When a test report is ready (or the test is skipped) the student moves on to the Students tab for teacher allocation.
        </Alert>
      )}
    </div>
  )
}
