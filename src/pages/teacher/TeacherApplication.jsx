import { Alert } from '@/components/ui/Alert'
import { PageLoader, Spinner } from '@/components/ui/Loaders'
import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, CheckCircle2, Clock, Copy, ExternalLink, FileText, IndianRupee, Lock, ShieldCheck, Upload } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { Notice } from '@/pages/admin/adminUi'
import { DocumentPreviewModal } from '@/components/uploads/DocumentPreview'
import { useLoad } from '@/pages/admin/useLoad'
import { getMyApplication, submitMyPayment, uploadMyDocuments } from '@/services/teacherPortalService'
import RegistrationRenewalCard from './RegistrationRenewalCard'
import { useRegistrationCheckout } from './useRegistrationCheckout'
import { buildSteps, formatDateTime } from './teacherApplicationUtils'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
const inputCls = 'input field__input w-full'

/** "Application Status" tab: where the application stands, documents, and registration fee payment. */
export default function TeacherApplication() {
  const { data: app, loading, error, reload } = useLoad(getMyApplication, [])
  const [msg, setMsg] = useState({ error: '', success: '' })

  // Deep link from the dashboard shortcut (#documents)
  useEffect(() => {
    if (app && window.location.hash === '#documents') {
      document.getElementById('documents')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [app])

  if (loading && !app) {
    return <PageLoader label="Loading your application…" />
  }
  if (!app) {
    return <Notice error={error || 'We could not find your application.'} />
  }

  const steps = buildSteps(app)
  const flash = (text) => setMsg({ error: '', success: text })
  const fail = (text) => setMsg({ error: text, success: '' })
  const done = () => reload()

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Application Status</h1>
          <p className="page__description">Follow your application, upload your documents and complete the registration payment.</p>
        </div>
      </header>

      <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />

      {app.rejected && (
        <Alert variant="error" title="Something needs your attention." />
      )}

      <div className="wf-portal-grid">
        <div className="wf-portal-main">
          <Card variant="hover">
            <div className="wf-cardhead"><h3><ShieldCheck size={18} />Progress</h3><span className={`wf-feebadge wf-feebadge--${app.approved ? 'paid' : app.rejected ? 'pending' : 'waived'}`}>{stageLabel(app)}</span></div>
            <ol className="wf-stepper">
              {steps.map((st) => (
                <li key={st.key} className={`wf-stepper__item is-${st.state}`}>
                  <span className="wf-stepper__dot">{st.state === 'done' ? <Check size={14} /> : st.state === 'active' ? <Clock size={14} /> : st.state === 'blocked' ? <Lock size={13} /> : null}</span>
                  <div>
                    <strong>{st.label}</strong>
                    <span>{st.note}</span>
                    {st.at && <small>{formatDateTime(st.at)}</small>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <DocumentsCard app={app} onDone={done} onSuccess={flash} onError={fail} />
        </div>

        <div className="wf-portal-side">
          <RegistrationRenewalCard app={app} onDone={done} onSuccess={flash} onError={fail} />
          <PaymentCard app={app} onDone={done} onSuccess={flash} onError={fail} />
          <Card variant="hover">
            <div className="wf-cardhead"><h3><FileText size={18} />Your details</h3></div>
            <dl className="wf-info">
              <div><dt>Name</dt><dd>{app.fullName}</dd></div>
              <div><dt>Subject</dt><dd><span className="wf-chip">{app.primarySubject}</span></dd></div>
              <div><dt>Class level</dt><dd>{app.classLevel}</dd></div>
              <div><dt>Locality</dt><dd>{app.teachingLocality}</dd></div>
              <div><dt>Applied on</dt><dd>{formatDateTime(app.submittedAt)}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  )
}

function stageLabel(app) {
  if (app.approved) return 'Approved'
  if (app.rejected) return 'Closed'
  if (app.status === 'shortlisted' || app.status === 'evaluation_completed') {
    return ['paid', 'waived'].includes(app.registrationFee.status) ? 'Awaiting approval' : 'Shortlisted'
  }
  return 'Under review'
}

function DocumentsCard({ app, onDone, onSuccess, onError }) {
  const docs = app.documents
  const [files, setFiles] = useState({ aadhaarDocument: null, qualificationDocument: null })
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const aRef = useRef(null)
  const qRef = useRef(null)

  const pick = (field) => (e) => {
    const file = e.target.files?.[0] || null
    if (file && file.size > MAX_BYTES) { onError('Each file must be 5 MB or smaller.'); e.target.value = ''; return }
    if (file && !ALLOWED.includes(file.type)) { onError('Only PDF, JPG and PNG files are allowed.'); e.target.value = ''; return }
    setFiles((f) => ({ ...f, [field]: file }))
  }

  const upload = async () => {
    const fd = new FormData()
    Object.entries(files).forEach(([k, v]) => v && fd.set(k, v))
    setSaving(true)
    try {
      await uploadMyDocuments(fd)
      setFiles({ aadhaarDocument: null, qualificationDocument: null })
      if (aRef.current) aRef.current.value = ''
      if (qRef.current) qRef.current.value = ''
      onSuccess('Documents uploaded. Our team will verify them.')
      onDone()
    } catch (err) {
      onError(err.message || 'Upload failed.')
    } finally {
      setSaving(false)
    }
  }

  const rows = [
    { field: 'aadhaarDocument', ref: aRef, label: 'Aadhaar card', hint: 'Government identity proof', doc: docs.aadhaar },
    { field: 'qualificationDocument', ref: qRef, label: 'Highest degree certificate', hint: 'Marksheet or degree certificate', doc: docs.qualification },
  ]
  const hasSelection = Boolean(files.aadhaarDocument || files.qualificationDocument)

  return (
    <Card variant="hover" id="documents">
      <div className="wf-cardhead">
        <h3><Upload size={18} />Documents</h3>
        <span className="wf-muted">{[docs.aadhaar, docs.qualification].filter((d) => d.uploaded).length} of 2 uploaded</span>
      </div>
      <div className="wf-docs">
        {rows.map(({ field, ref, label, hint, doc }) => (
          <div key={field} className="wf-doc wf-doc--upload">
            <span className={`wf-doc__icon ${doc.uploaded ? 'is-ok' : ''}`}>{doc.uploaded ? <CheckCircle2 size={20} /> : <FileText size={20} />}</span>
            <div className="wf-doc__text">
              {doc.uploaded && doc.url ? <button type="button" className="wf-doclink" onClick={() => setPreview({ url: doc.url, name: label, mimeType: doc.mimeType })}><strong>{label}</strong></button> : <strong>{label}</strong>}
              <span>
                {doc.uploaded ? `${doc.fileName} · uploaded ${formatDateTime(doc.uploadedAt)}` : hint}
              </span>
              {files[field] && <span style={{ color: 'var(--color-primary)' }}>Selected: {files[field].name}</span>}
            </div>
            {doc.uploaded && doc.url && <Button size="sm" variant="outline" onClick={() => setPreview({ url: doc.url, name: label, mimeType: doc.mimeType })}>Preview</Button>}
            {docs.canUpload && (
              <label className="wf-filebtn">
                <input ref={ref} type="file" accept=".pdf,image/jpeg,image/png" onChange={pick(field)} disabled={saving} />
                {doc.uploaded ? 'Replace' : 'Choose file'}
              </label>
            )}
          </div>
        ))}
        {!docs.canUpload && <p className="wf-muted" style={{ margin: 0 }}>Uploads are closed for this application.</p>}
        {docs.canUpload && (
          <div className="wf-formfoot" style={{ marginTop: 0 }}>
            <span className="wf-muted" style={{ marginRight: 'auto' }}>PDF, JPG or PNG, up to 5 MB each.</span>
            <Button onClick={upload} disabled={!hasSelection || saving}>
              {saving ? <Spinner size={15} /> : 'Upload selected'}
            </Button>
          </div>
        )}
      </div>
    {preview && <DocumentPreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </Card>
  )
}

const METHOD_LABEL = { upi: 'UPI', card: 'Card', netbanking: 'Net banking', wallet: 'Wallet', emi: 'EMI', bank_transfer: 'Bank transfer', razorpay: 'Online', manual: 'Manual' }
const PAY_TONE = { paid: 'paid', created: 'pending', failed: 'failed', refunded: 'waived' }
const PAY_LABEL = { paid: 'Paid', created: 'Not completed', failed: 'Failed', refunded: 'Refunded' }

function PaymentCard({ app, onDone, onSuccess, onError }) {
  const fee = app.registrationFee
  const pay = app.payment
  const online = pay.online?.enabled
  const [method, setMethod] = useState('upi')
  const [ref, setRef] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const opened = ['shortlisted', 'evaluation_completed', 'approved'].includes(app.status)
  const amount = `\u20B9${Number(fee.amount || 1000).toLocaleString('en-IN')}`
  const history = app.payments || []

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }

  // Online payment through Razorpay Checkout. The status then updates on its own.
  const { paying, pay: payOnline } = useRegistrationCheckout({
    onSuccess: () => onSuccess('Payment successful. Your registration fee is confirmed.'),
    onError,
    onDone,
  })

  // Fallback while online payments are not switched on: report a manual payment for verification.
  const submitManual = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await submitMyPayment({ method, transactionRef: ref.trim() })
      setRef('')
      onSuccess('Payment details submitted. We will verify and confirm shortly.')
      onDone()
    } catch (err) {
      onError(err.message || 'Could not submit payment details.')
    } finally {
      setSaving(false)
    }
  }

  let body
  if (fee.status === 'paid') {
    body = <div className="wf-paystate is-ok"><CheckCircle2 size={20} /><div><b>Payment received</b><span>Registration fee of {amount} is confirmed{fee.paidAt ? ` on ${formatDateTime(fee.paidAt)}` : ''}.</span></div></div>
  } else if (fee.status === 'waived') {
    body = <div className="wf-paystate is-ok"><CheckCircle2 size={20} /><div><b>Fee skipped</b><span>No registration fee is due for your application.</span></div></div>
  } else if (!opened) {
    body = <div className="wf-paystate"><Lock size={20} /><div><b>Opens after shortlisting</b><span>If you are shortlisted, you will pay the {amount} registration fee here. Registration is valid for one year.</span></div></div>
  } else {
    body = (
      <>
        {fee.status === 'submitted' && (
          <div className="wf-paystate is-wait"><Clock size={20} /><div><b>Payment submitted. Verification pending</b><span>Reference {fee.transactionRef}. We will confirm once it is verified.</span></div></div>
        )}
        <div className="wf-payamount"><small>Registration fee (valid for 1 year)</small><b>{amount}</b></div>
        {online ? (
          <>
            <Button onClick={payOnline} disabled={paying || !pay.canPay} className="w-full">
              {paying ? <><Spinner size={15} style={{ marginRight: 8 }} />Opening payment…</> : <><ShieldCheck size={15} style={{ marginRight: 8 }} />Pay {amount} securely</>}
            </Button>
            <p className="wf-muted" style={{ margin: 0, textAlign: 'center' }}>UPI, cards and net banking via Razorpay{pay.online.mode === 'test' ? ' (test mode)' : ''}. Your status updates automatically after payment.</p>
          </>
        ) : (
          <>
            {pay.instructions.upiId ? (
              <div className="wf-payupi">
                <div><small>Pay to UPI ID</small><code>{pay.instructions.upiId}</code></div>
                <div className="wf-payupi__actions">
                  <button type="button" onClick={() => copy(pay.instructions.upiId)}><Copy size={14} />{copied ? 'Copied' : 'Copy'}</button>
                  {pay.instructions.upiLink && <a href={pay.instructions.upiLink}><ExternalLink size={14} />Open UPI app</a>}
                </div>
              </div>
            ) : (
              <div className="wf-paystate"><AlertCircle size={20} /><div><b>Online payment coming soon</b><span>Payment will be available here shortly. We will email you as soon as it opens.</span></div></div>
            )}
            {pay.canPay && pay.instructions.upiId && (
              <form onSubmit={submitManual} className="wf-form" style={{ gap: 12 }}>
                <label className="wf-field">
                  <span className="wf-field__label">Payment method</span>
                  <select className={inputCls} value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="wf-field">
                  <span className="wf-field__label">Transaction / UTR reference</span>
                  <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 412345678901" minLength={4} maxLength={100} required />
                </label>
                <Button type="submit" disabled={saving || ref.trim().length < 4}>{saving ? <Spinner size={15} /> : `I have paid ${amount}`}</Button>
              </form>
            )}
          </>
        )}
      </>
    )
  }

  return (
    <Card variant="hover">
      <div className="wf-cardhead"><h3><IndianRupee size={18} />Registration Fee</h3><span className={`wf-feebadge wf-feebadge--${fee.status}`}>{{ pending: 'Pending', submitted: 'Verifying', paid: 'Paid', waived: 'Skipped' }[fee.status] || fee.status}</span></div>
      <div className="wf-feebody">
        {body}
        {history.length > 0 && (
          <div className="wf-payhist">
            <small>Payment history</small>
            {history.map((h) => (
              <div key={h.id} className="wf-payhist__row">
                <div><b>₹{Number(h.amount).toLocaleString('en-IN')}</b>{h.mode === 'test' && <span className="wf-testbadge">TEST</span>}<span>{formatDateTime(h.paidAt || h.createdAt)}{h.method ? ` · ${METHOD_LABEL[h.method] || h.method}` : ''}</span></div>
                <span className={`wf-feebadge wf-feebadge--${PAY_TONE[h.status] || 'pending'}`}>{PAY_LABEL[h.status] || h.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
