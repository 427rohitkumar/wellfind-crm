import { TableLoader, Spinner } from '@/components/ui/Loaders'
import { useEffect, useState } from 'react'
import {
  AlertTriangle, CalendarClock, CheckCircle2, Inbox, Mail as MailIcon, PlugZap, RefreshCw, RotateCw, Send,
  XCircle,
} from 'lucide-react'
import { Alert, Button, Card, CardFooter, TablePagination } from '@/components/ui'
import {
  docsOf, fmtDateTime, getMailStats, listMailLogs, retryMail, runMailJob, sendTestMail, verifyMail,
} from '@/services/adminApi'
import { FormRow, Modal, Notice } from './adminUi'
import { inputCls, useLoad } from './useLoad'

const STATUS_LABEL = { sent: 'Sent', failed: 'Failed', skipped: 'Not sent', queued: 'Queued' }
const STATUS_TONE = { sent: 'paid', failed: 'failed', skipped: 'pending', queued: 'waived' }

function Stat({ icon: Icon, label, value, note, tone = 'primary' }) {
  return (
    <div className="wf-stat-card">
      <span className={`wf-stat-card__icon is-${tone}`}><Icon size={20} /></span>
      <div><small>{label}</small><b>{value}</b>{note && <span>{note}</span>}</div>
    </div>
  )
}

/** Admin "Mail" tab: delivery health, scheduled mails and the full email log. */
export default function Mail() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [status, setStatus] = useState('all')
  const [template, setTemplate] = useState('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [modal, setModal] = useState(null) // 'test'
  const [busy, setBusy] = useState('')
  const [jobResult, setJobResult] = useState(null)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  const stats = useLoad(getMailStats, [])
  const logs = useLoad(() => listMailLogs({ page, limit, status, template, search: query }), [page, limit, status, template, query])
  const rows = docsOf(logs.data)
  const t = stats.data?.totals
  const cfg = stats.data?.config
  const templateList = stats.data?.templateList || []

  const totalDocs = logs.data?.totalDocs ?? 0
  const totalPages = Math.max(1, logs.data?.totalPages ?? 1)

  useEffect(() => {
    if (logs.data?.totalPages && page > logs.data.totalPages) {
      setPage(logs.data.totalPages)
    }
  }, [logs.data?.totalPages, page])

  const refresh = () => { stats.reload(); logs.reload() }
  const flash = (text) => setMsg({ error: '', success: text })
  const fail = (text) => setMsg({ error: text, success: '' })

  const doVerify = async () => {
    setBusy('verify')
    try {
      const res = await verifyMail()
      res.ok ? flash(res.message) : fail(res.message)
    } catch (e) { fail(e.message) } finally { setBusy('') }
  }

  const doRetry = async (row) => {
    setBusy(`retry-${row.id}`)
    try {
      const res = await retryMail(row.id)
      res.ok ? flash(`Email to ${row.recipient} sent.`) : fail(res.error || 'The email was not delivered.')
      refresh()
    } catch (e) { fail(e.message); logs.reload() } finally { setBusy('') }
  }

  const doJob = async (job) => {
    setBusy(job)
    setJobResult(null)
    try {
      const res = await runMailJob(job, job === 'monthly_payout' ? { month } : {})
      setJobResult(res)
      refresh()
    } catch (e) { fail(e.message) } finally { setBusy('') }
  }

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Mail</h1>
          <p className="page__description">Every email the platform sends: delivery health, scheduled mails and a full log with retries.</p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={doVerify} disabled={busy === 'verify'}>
            {busy === 'verify' ? <Spinner size={16} /> : <PlugZap size={16} />}<span style={{ marginLeft: 8 }}>Check connection</span>
          </Button>
          <Button variant="outline" onClick={refresh}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button>
          <Button onClick={() => setModal('test')}><Send size={16} style={{ marginRight: 8 }} />Send test email</Button>
        </div>
      </header>

      <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />

      {cfg && (
        cfg.dryRun ? (
          <Alert variant="warning" title="Dry run is ON">Emails are recorded here but not actually sent (MAIL_DRY_RUN=true).</Alert>
        ) : cfg.configured ? (
          <Alert variant="success" title="SMTP configured" icon={MailIcon}>
            {cfg.host}:{cfg.port} · login {cfg.user} · sends as {cfg.fromName} &lt;{cfg.fromEmail}&gt;
          </Alert>
        ) : (
          <Alert variant="warning" title="SMTP is not configured" icon={MailIcon}>
            Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASSWORD in the API .env and restart. Until then emails are logged as “Not sent”.
          </Alert>
        )
      )}

      <div className="wf-stat-grid">
        <Stat icon={MailIcon} label="Total emails" value={t ? t.total : '…'} note={t ? `${t.last24h} in the last 24 hours` : ''} />
        <Stat icon={CheckCircle2} label="Sent" value={t ? t.sent : '…'} note="Delivered to the mail server" tone="success" />
        <Stat icon={XCircle} label="Failed" value={t ? t.failed : '…'} note={t ? `${t.failed7d} in the last 7 days` : ''} tone="warning" />
        <Stat icon={Inbox} label="Not sent" value={t ? t.skipped : '…'} note="SMTP off or dry run" tone="info" />
      </div>

      <Card variant="hover">
        <div className="wf-cardhead"><h3><CalendarClock size={18} />Scheduled mails</h3><span className="wf-muted">Run on demand, or call the job endpoint from a scheduler</span></div>
        <div className="wf-jobs">
          <div className="wf-job">
            <div><b>Registration expiry reminders</b><span>Emails teachers whose registration expires within {cfg?.expiryReminderDays?.join(' / ') || '30 / 7'} days, and those already expired. Each reminder goes out once.</span></div>
            <Button variant="outline" onClick={() => doJob('registration_expiry')} disabled={busy === 'registration_expiry'}>
              {busy === 'registration_expiry' ? <Spinner size={15} /> : 'Run now'}
            </Button>
          </div>
          <div className="wf-job">
            <div><b>Monthly payout summaries</b><span>Sends each teacher with live allocations a summary of their payout for the chosen month. Already-sent months are skipped.</span></div>
            <div className="wf-job__actions">
              <input type="month" className={inputCls} value={month} onChange={(e) => setMonth(e.target.value)} />
              <Button variant="outline" onClick={() => doJob('monthly_payout')} disabled={busy === 'monthly_payout' || !month}>
                {busy === 'monthly_payout' ? <Spinner size={15} /> : 'Send emails'}
              </Button>
            </div>
          </div>
          {jobResult && (
            <div className="wf-jobresult">
              <b>{jobResult.job === 'monthly_payout' ? 'Monthly payout' : 'Registration expiry'} run finished</b>
              <span>{jobResult.considered} considered {'·'} {jobResult.sent} sent {'·'} {jobResult.skipped} not sent {'·'} {jobResult.failed} failed {'·'} {jobResult.duplicates} already sent</span>
              {jobResult.details?.map((d, i) => <small key={i}>{d}</small>)}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="wf-sectionhead">
          <div><h3>Email log</h3><p>{logs.data?.totalDocs ?? 0} emails match</p></div>
          <div className="wf-logfilters">
            <input className={inputCls} placeholder="Search recipient or subject…" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setQuery(search.trim()) } }} onBlur={() => { if (search.trim() !== query) { setPage(1); setQuery(search.trim()) } }} />
            <select className={inputCls} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
              <option value="all">All statuses</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select className={inputCls} value={template} onChange={(e) => { setPage(1); setTemplate(e.target.value) }}>
              <option value="all">All mail types</option>
              {templateList.map((tp) => <option key={tp.key} value={tp.key}>{tp.label}</option>)}
            </select>
          </div>
        </div>
        <div className="wf-table-wrap">
          <table className="wf-table">
            <thead><tr><th>When</th><th>Recipient</th><th>Mail type</th><th>Subject</th><th>Status</th><th className="num">Tries</th><th className="num">Actions</th></tr></thead>
            <tbody>
              {logs.loading && <tr><td colSpan={7} style={{ padding: 0 }}><TableLoader columns={7} /></td></tr>}
              {!logs.loading && logs.error && <tr><td colSpan={7} className="wf-state is-error">{logs.error}</td></tr>}
              {!logs.loading && !logs.error && rows.length === 0 && <tr><td colSpan={7} className="wf-state">No emails yet. They appear here as soon as the system sends one.</td></tr>}
              {!logs.loading && rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(r.createdAt)}</td>
                  <td><div className="wf-cell-title">{r.recipient}</div>{r.recipientName && <div className="wf-cell-sub">{r.recipientName}</div>}</td>
                  <td>{templateList.find((x) => x.key === r.template)?.label || r.template}</td>
                  <td style={{ maxWidth: 280 }}>
                    <div>{r.subject}</div>
                    {r.error && <div className="wf-cell-sub wf-cell-err" title={r.error}><AlertTriangle size={12} />{r.error}</div>}
                  </td>
                  <td><span className={`wf-feebadge wf-feebadge--${STATUS_TONE[r.status] || 'pending'}`}>{STATUS_LABEL[r.status] || r.status}</span></td>
                  <td className="num">{r.attempts}</td>
                  <td className="num">
                    {r.status !== 'sent' && (
                      r.retryable ? (
                        <Button size="sm" variant="outline" onClick={() => doRetry(r)} disabled={busy === `retry-${r.id}`}>
                          {busy === `retry-${r.id}` ? <Spinner size={14} /> : <><RotateCw size={13} style={{ marginRight: 6 }} />Retry</>}
                        </Button>
                      ) : <span className="wf-muted" title="Contained a password or code, so it is not stored. Trigger it again.">Re-trigger</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            {totalDocs > 0 ? (
              <>
                Showing{' '}
                <strong className="text-foreground">
                  {(page - 1) * limit + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-foreground">
                  {Math.min(page * limit, totalDocs)}
                </strong>{' '}
                of <strong className="text-foreground">{totalDocs}</strong> emails
              </>
            ) : (
              'No emails to display'
            )}
          </div>

          <div className="flex items-center gap-3 order-1 sm:order-2">
            <select
              className="select text-xs"
              style={{ width: 'auto', height: '32px', padding: '2px 8px' }}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
              aria-label="Emails per page"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>

            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showFirstLast
              showPrevNext
            />
          </div>
        </CardFooter>
      </Card>

      {modal === 'test' && <TestMail cfg={cfg} onClose={() => setModal(null)} onDone={(res) => { setModal(null); res.ok ? flash('Test email sent. Check the inbox.') : fail(res.error || 'The test email was not delivered.'); refresh() }} />}
    </div>
  )
}

function TestMail({ cfg, onClose, onDone }) {
  const [to, setTo] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try { onDone(await sendTestMail(to.trim())) } catch (err) { setError(err.message) } finally { setSaving(false) }
  }
  return (
    <Modal title="Send a test email" description="Sends a short test message through your SMTP settings." onClose={onClose}>
      <form onSubmit={submit} className="wf-form">
        <Notice error={error} />
        <FormRow label="Send to" hint={cfg?.configured ? `From ${cfg.fromName} <${cfg.fromEmail}>` : 'SMTP is not configured, so this will only be logged.'}>
          <input type="email" required className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} placeholder="you@example.com" />
        </FormRow>
        <div className="wf-formfoot">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Send test</Button>
        </div>
      </form>
    </Modal>
  )
}
