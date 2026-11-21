import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Brain, Check, CheckCircle2, ChevronLeft, ClipboardCheck, Clock, FileText, GraduationCap, History, IndianRupee,
  Lock, Mail, MapPin, MessageCircle, Phone, Send, Sparkles, UserCheck, Globe, BookOpen, Ban,
} from 'lucide-react'
import { Alert, Badge, Button, Card } from '@/components/ui'
import { PageLoader } from '@/components/ui/Loaders'
import { FormRow, Notice } from '@/pages/admin/adminUi'
import { inputCls, useLoad } from '@/pages/admin/useLoad'
import {
  LEVEL_LABEL, TEST_MODES, TEST_STATUS_LABEL,
  convertStudentEnquiry, getEnquiryTest, listTesters, updateEnquiryTest,
} from '@/services/adminApi'
import { ModeBadge } from './Tests'
import { PAY_VARIANT, STATUS_VARIANT, fmtWhen } from './testShared'

const pad = (n) => String(n).padStart(2, '0')
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STEPS = [
  { key: 'requested', title: 'Requested', text: 'Parent / student opted for the test.' },
  { key: 'payment', title: 'Payment', text: 'The test fee is collected before anything is booked.' },
  { key: 'scheduled', title: 'Scheduled', text: 'Tester allocated (physical) or quiz time set (digital).' },
  { key: 'conducted', title: 'Conducted', text: 'The test has been taken.' },
  { key: 'report_ready', title: 'Report ready', text: 'IQ, creativity and academic level recorded.' },
]

function stepStates(t) {
  const paid = t.payment.status !== 'pending'
  const order = ['requested', 'scheduled', 'conducted', 'report_ready']
  const idx = order.indexOf(t.status)
  const states = {
    requested: 'done',
    payment: paid ? 'done' : 'active',
    scheduled: idx >= 1 ? 'done' : paid ? 'active' : 'idle',
    conducted: idx >= 2 ? 'done' : idx === 1 ? 'active' : 'idle',
    report_ready: idx >= 3 ? 'done' : idx === 2 ? 'active' : 'idle',
  }
  return states
}

function ScoreCard({ label, icon: Icon, score, level }) {
  return (
    <div className="wf-scorecard">
      <small><Icon size={12} style={{ display: 'inline', marginRight: 4 }} />{label}</small>
      <b>{score}</b>
      <div className={`wf-scorebar is-${level}`}><i style={{ width: `${Math.min(100, Math.max(0, score))}%` }} /></div>
      <span className={`wf-lvl is-${level}`}>{LEVEL_LABEL[level]}</span>
    </div>
  )
}

/** One test: payment, tester & schedule, the digital quiz placeholder, and the IQ / creativity / academic report. */
export default function TestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: t, setData, error, loading } = useLoad(() => getEnquiryTest(id), [id])
  const testers = useLoad(() => listTesters(), [])

  const [msg, setMsg] = useState({ ok: '', err: '' })
  const [busy, setBusy] = useState('')
  const [form, setForm] = useState({ tester: '', scheduledAt: '', venue: '', schedulingNote: '' })
  const [rep, setRep] = useState({ iqScore: '', creativityScore: '', academicScore: '', strengths: '', improvementAreas: '', recommendation: '', hoursPerWeek: '', testerNotes: '' })
  const [payRef, setPayRef] = useState('')

  // Seed the forms once per loaded test (re-seed after each save).
  const stamp = t?.updatedAt
  useEffect(() => {
    if (!t) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({ tester: t.tester?.id ? String(t.tester.id) : '', scheduledAt: toLocalInput(t.scheduledAt), venue: t.venue || '', schedulingNote: t.schedulingNote || '' })
    const r = t.report || {}
    setRep({
      iqScore: r.iqScore ?? '', creativityScore: r.creativityScore ?? '', academicScore: r.academicScore ?? '',
      strengths: r.strengths || '', improvementAreas: r.improvementAreas || '', recommendation: r.recommendation || '',
      hoursPerWeek: r.hoursPerWeek ?? '', testerNotes: r.testerNotes || '',
    })
    setPayRef(t.payment.reference || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamp])

  if (loading) return <PageLoader label="Loading test" />
  if (error || !t) {
    return (
      <div className="page__section">
        <Alert variant="error" title={error || 'Test not found.'} />
        <Button variant="outline" onClick={() => navigate('/admin/tests')}><ChevronLeft size={16} /> Back to Tests</Button>
      </div>
    )
  }

  const physical = t.mode === 'physical'
  const locked = t.status === 'report_ready' || t.status === 'cancelled'
  const payOk = t.payment.status !== 'pending'
  const states = stepStates(t)

  const act = async (key, body, okText) => {
    setBusy(key)
    setMsg({ ok: '', err: '' })
    try {
      const res = await updateEnquiryTest(t.id, body)
      setData(res)
      setMsg({ ok: okText, err: '' })
      return true
    } catch (e) {
      setMsg({ ok: '', err: e.message || 'Could not update the test.' })
      return false
    } finally {
      setBusy('')
    }
  }

  const num = (v) => (v === '' || v === null ? undefined : Number(v))
  const reportBody = () => ({
    iqScore: num(rep.iqScore), creativityScore: num(rep.creativityScore), academicScore: num(rep.academicScore),
    strengths: rep.strengths, improvementAreas: rep.improvementAreas, recommendation: rep.recommendation, testerNotes: rep.testerNotes,
    hoursPerWeek: rep.hoursPerWeek === '' ? null : Number(rep.hoursPerWeek),
  })

  const saveSchedule = () => {
    if (!form.scheduledAt) return setMsg({ ok: '', err: 'Choose a date and time.' })
    const body = { scheduledAt: new Date(form.scheduledAt).toISOString(), schedulingNote: form.schedulingNote }
    if (physical) {
      body.tester = form.tester ? Number(form.tester) : null
      body.venue = form.venue
    }
    return act('schedule', body, 'Schedule saved.')
  }
  const confirmSchedule = async () => {
    if (!form.scheduledAt) return setMsg({ ok: '', err: 'Choose a date and time.' })
    const body = { scheduledAt: new Date(form.scheduledAt).toISOString(), schedulingNote: form.schedulingNote, status: 'scheduled' }
    if (physical) { body.tester = form.tester ? Number(form.tester) : null; body.venue = form.venue }
    return act('schedule', body, physical ? 'Tester allocated and test scheduled.' : 'Online test scheduled.')
  }

  const moveToStudents = async () => {
    setBusy('move')
    setMsg({ ok: '', err: '' })
    try {
      await convertStudentEnquiry(t.studentEnquiryId, {})
      navigate('/admin/students')
    } catch (e) {
      setMsg({ ok: '', err: e.message || 'Could not move the student.' })
      setBusy('')
    }
  }

  const r = t.report

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <nav className="breadcrumb mb-2">
            <span className="breadcrumb__item">
              <Link to="/admin/tests" className="hover:text-primary transition-colors flex items-center gap-1.5"><ChevronLeft size={14} /> Tests</Link>
            </span>
            <span className="breadcrumb__item" aria-current="page">Test #{t.id}</span>
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page__title">{t.student?.name || `Enquiry #${t.studentEnquiryId}`}</h1>
            <Badge size="lg" variant={STATUS_VARIANT[t.status] || 'neutral'} dot>{TEST_STATUS_LABEL[t.status]}</Badge>
            <ModeBadge mode={t.mode} />
          </div>
          <p className="page__description">
            {TEST_MODES[t.mode]?.label} · ₹{t.fee}. Assesses IQ, creativity and academic level to match the best teacher and set the effort needed.
          </p>
        </div>
        <div className="page__action flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/student-enquiries/${t.studentEnquiryId}`)}>
            <FileText size={16} className="mr-1" /> View enquiry
          </Button>
          {t.student && ['test', 'in_progress'].includes(t.student.enquiryStatus) && (
            <Button variant="success" size="sm" loading={busy === 'move'} onClick={moveToStudents}>
              <GraduationCap size={16} className="mr-1" /> {t.status === 'report_ready' ? 'Move to Students' : 'Skip & move to Students'}
            </Button>
          )}
        </div>
      </header>

      <Notice error={msg.err} success={msg.ok} onClose={() => setMsg({ ok: '', err: '' })} />

      <div className="wf-portal-grid">
        <div className="wf-portal-main">
          {/* Progress */}
          <Card>
            <div className="wf-cardhead"><h3><ClipboardCheck size={18} />Progress</h3></div>
            <ol className="wf-stepper">
              {STEPS.map((s) => {
                const st = t.status === 'cancelled' ? 'idle' : states[s.key]
                return (
                  <li key={s.key} className={`wf-stepper__item is-${st}`}>
                    <span className="wf-stepper__dot">{st === 'done' ? <Check size={14} /> : st === 'active' ? <Clock size={14} /> : null}</span>
                    <div>
                      <strong>{s.title}</strong>
                      <span>{s.text}</span>
                    </div>
                  </li>
                )
              })}
            </ol>
            {t.status === 'cancelled' && <div className="wf-lock" style={{ margin: '0 22px 20px' }}><Ban size={16} />This test was cancelled.</div>}
          </Card>

          {/* Report */}
          <Card>
            <div className="wf-cardhead">
              <h3><Brain size={18} />Assessment report</h3>
              {r && <Badge size="sm" variant="success">Ready</Badge>}
            </div>

            {r && t.status === 'report_ready' ? (
              <>
                <div className="wf-scorecards">
                  <ScoreCard label="IQ level" icon={Brain} score={r.iqScore} level={r.iqLevel} />
                  <ScoreCard label="Creativity" icon={Sparkles} score={r.creativityScore} level={r.creativityLevel} />
                  <ScoreCard label="Academic level" icon={BookOpen} score={r.academicScore} level={r.academicLevel} />
                </div>
                <dl className="wf-info">
                  <div><dt>Suggested effort</dt><dd>{r.hoursPerWeek != null ? `${r.hoursPerWeek} hours / week` : <span className="is-empty">Not set</span>}</dd></div>
                  <div><dt>Reported</dt><dd>{fmtWhen(r.reportedAt)}</dd></div>
                </dl>
                {r.recommendation && <div className="wf-note"><b>Guidance for the teacher</b><p>{r.recommendation}</p></div>}
                {r.strengths && <div className="wf-note"><b>Strengths</b><p>{r.strengths}</p></div>}
                {r.improvementAreas && <div className="wf-note"><b>Areas to improve</b><p>{r.improvementAreas}</p></div>}
                {r.testerNotes && <div className="wf-note"><b>Tester notes</b><p>{r.testerNotes}</p></div>}
              </>
            ) : t.status === 'conducted' ? (
              <div className="wf-testpad">
                <p className="wf-muted" style={{ margin: 0 }}>Enter the scores out of 100 and guidance for the teacher. {physical ? 'The tester brings these back after the visit.' : 'Use the quiz result for the scores.'}</p>
                <div className="wf-grid-2" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                  <FormRow label="IQ score (0-100)"><input type="number" min="0" max="100" className={inputCls} value={rep.iqScore} onChange={(e) => setRep({ ...rep, iqScore: e.target.value })} /></FormRow>
                  <FormRow label="Creativity (0-100)"><input type="number" min="0" max="100" className={inputCls} value={rep.creativityScore} onChange={(e) => setRep({ ...rep, creativityScore: e.target.value })} /></FormRow>
                  <FormRow label="Academic (0-100)"><input type="number" min="0" max="100" className={inputCls} value={rep.academicScore} onChange={(e) => setRep({ ...rep, academicScore: e.target.value })} /></FormRow>
                </div>
                <FormRow label="Guidance for the teacher" hint="Required. Focus areas and how much effort this student needs.">
                  <textarea className={inputCls} rows={3} maxLength={2000} value={rep.recommendation} onChange={(e) => setRep({ ...rep, recommendation: e.target.value })} />
                </FormRow>
                <div className="wf-grid-2">
                  <FormRow label="Strengths"><textarea className={inputCls} rows={3} maxLength={2000} value={rep.strengths} onChange={(e) => setRep({ ...rep, strengths: e.target.value })} /></FormRow>
                  <FormRow label="Areas to improve"><textarea className={inputCls} rows={3} maxLength={2000} value={rep.improvementAreas} onChange={(e) => setRep({ ...rep, improvementAreas: e.target.value })} /></FormRow>
                </div>
                <div className="wf-grid-2">
                  <FormRow label="Suggested hours per week"><input type="number" min="0" max="40" className={inputCls} value={rep.hoursPerWeek} onChange={(e) => setRep({ ...rep, hoursPerWeek: e.target.value })} /></FormRow>
                  <FormRow label="Tester notes"><input className={inputCls} maxLength={2000} value={rep.testerNotes} onChange={(e) => setRep({ ...rep, testerNotes: e.target.value })} /></FormRow>
                </div>
                <div className="wf-formfoot" style={{ padding: 0 }}>
                  <Button variant="outline" loading={busy === 'draft'} onClick={() => act('draft', { report: reportBody() }, 'Draft saved.')}>Save draft</Button>
                  <Button loading={busy === 'final'} onClick={async () => { await act('final', { report: reportBody(), status: 'report_ready' }, 'Report is ready.') }}>
                    <CheckCircle2 size={15} style={{ marginRight: 6 }} />Finish report
                  </Button>
                </div>
              </div>
            ) : (
              <div className="wf-testpad">
                <div className="wf-lock"><Lock size={16} />The report opens once the test has been conducted. It records IQ, creativity and academic level, plus guidance for the teacher.</div>
              </div>
            )}
          </Card>

          {/* Digital quiz / physical tester panel */}
          {!locked && (
            <Card>
              <div className="wf-cardhead"><h3>{physical ? <UserCheck size={18} /> : <Globe size={18} />}{physical ? 'Tester visit' : 'Online quiz'}</h3></div>
              <div className="wf-testpad">
                {physical ? (
                  <p className="wf-muted" style={{ margin: 0 }}>A tester visits the student at the address below, conducts the test on paper and brings the scores back. Enter them in the report once the visit is done.</p>
                ) : (
                  <>
                    <p className="wf-muted" style={{ margin: 0 }}>The student takes a self-run quiz online. The quiz module (question bank, timer and automatic scoring) is the next phase; until then, enter the scores by hand after the student finishes.</p>
                    <div className="wf-lock"><Lock size={16} />Quiz link and automatic scoring are not available yet.</div>
                  </>
                )}
                {t.status === 'scheduled' && (
                  <div><Button loading={busy === 'conducted'} onClick={() => act('conducted', { status: 'conducted' }, 'Marked as conducted. Enter the report next.')}>
                    <CheckCircle2 size={15} style={{ marginRight: 6 }} />Mark test as conducted
                  </Button></div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="wf-portal-side">
          {/* Student */}
          <Card>
            <div className="wf-cardhead"><h3><GraduationCap size={18} />Student</h3></div>
            <dl className="wf-info">
              <div><dt>Name</dt><dd>{t.student?.name || '—'}</dd></div>
              <div><dt>Phone</dt><dd>{t.student?.phoneNumber ? <a href={`tel:${t.student.phoneNumber}`}><Phone size={14} />{t.student.phoneNumber}</a> : '—'}</dd></div>
              <div><dt>Class</dt><dd>{t.student?.studentClass || '—'}</dd></div>
              <div><dt>Subjects</dt><dd>{(t.student?.subjects || []).map((s) => <span key={s} className="wf-chip">{s}</span>)}</dd></div>
              <div><dt>Locality</dt><dd>{t.student?.locality || '—'}</dd></div>
            </dl>
          </Card>

          {/* Payment */}
          <Card>
            <div className="wf-cardhead">
              <h3><IndianRupee size={18} />Payment</h3>
              <Badge size="sm" variant={PAY_VARIANT[t.payment.status]}>{t.payment.status}</Badge>
            </div>
            <div className="wf-payrow">
              <div><small className="wf-muted">Test fee ({TEST_MODES[t.mode]?.short})</small><div className="wf-payrow__amt">₹{t.fee}</div></div>
              {t.payment.paidAt && <span className="wf-muted">Paid {fmtWhen(t.payment.paidAt)}</span>}
            </div>
            <div className="wf-testpad" style={{ paddingTop: 0 }}>
              <Alert variant="info" title="Online payment comes later">
                Payment must be done before the test is booked. Until the gateway is connected, record it by hand here.
              </Alert>
              {!locked && (
                <>
                  <FormRow label="Reference (optional)"><input className={inputCls} maxLength={120} value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="UPI / receipt no." /></FormRow>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" disabled={t.payment.status === 'paid'} loading={busy === 'paid'} onClick={() => act('paid', { paymentStatus: 'paid', paymentReference: payRef }, 'Marked as paid.')}>Mark paid</Button>
                    <Button size="sm" variant="outline" disabled={t.payment.status === 'waived'} loading={busy === 'waived'} onClick={() => act('waived', { paymentStatus: 'waived', paymentReference: payRef }, 'Fee waived.')}>Waive</Button>
                    {payOk && t.status === 'requested' && <Button size="sm" variant="ghost" loading={busy === 'pending'} onClick={() => act('pending', { paymentStatus: 'pending' }, 'Payment set back to pending.')}>Reset</Button>}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Schedule */}
          {!locked && ['requested', 'scheduled'].includes(t.status) && (
            <Card>
              <div className="wf-cardhead"><h3><Clock size={18} />{physical ? 'Tester & schedule' : 'Schedule'}</h3></div>
              <div className="wf-testpad">
                {!payOk && <div className="wf-lock"><Lock size={16} />Collect or waive the payment first. Scheduling opens after that.</div>}
                {physical && (
                  <FormRow label="Tester">
                    <select className={inputCls} disabled={!payOk} value={form.tester} onChange={(e) => setForm({ ...form, tester: e.target.value })}>
                      <option value="">Select a tester…</option>
                      {(testers.data?.docs || []).map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role === 'teacher' ? 'teacher' : 'admin'})</option>)}
                    </select>
                  </FormRow>
                )}
                <FormRow label={physical ? 'Date & time' : 'Quiz date & time'}>
                  <input type="datetime-local" className={inputCls} disabled={!payOk} value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
                </FormRow>
                {physical && (
                  <FormRow label="Address" hint="Where the tester meets the student.">
                    <input className={inputCls} disabled={!payOk} maxLength={500} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
                  </FormRow>
                )}
                <FormRow label="Note (optional)"><input className={inputCls} disabled={!payOk} maxLength={1000} value={form.schedulingNote} onChange={(e) => setForm({ ...form, schedulingNote: e.target.value })} /></FormRow>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" disabled={!payOk} loading={busy === 'schedule'} onClick={t.status === 'scheduled' ? saveSchedule : confirmSchedule}>
                    {t.status === 'scheduled' ? 'Update schedule' : physical ? 'Allocate & schedule' : 'Schedule test'}
                  </Button>
                  <Button size="sm" variant="ghost" loading={busy === 'cancel'} onClick={() => act('cancel', { status: 'cancelled' }, 'Test cancelled.')}>Cancel test</Button>
                </div>
              </div>
            </Card>
          )}
          {locked && t.scheduledAt && (
            <Card>
              <div className="wf-cardhead"><h3><Clock size={18} />Schedule</h3></div>
              <dl className="wf-info">
                <div><dt>When</dt><dd>{fmtWhen(t.scheduledAt)}</dd></div>
                {physical && <div><dt>Tester</dt><dd>{t.tester?.email || '—'}</dd></div>}
                {physical && <div><dt>Address</dt><dd><MapPin size={14} />{t.venue || '—'}</dd></div>}
              </dl>
            </Card>
          )}

          {/* Report delivery (placeholder) */}
          <Card>
            <div className="wf-cardhead"><h3><Send size={18} />Share report</h3></div>
            <div className="wf-testpad">
              <p className="wf-muted" style={{ margin: 0 }}>Once ready, the report will be sent to the parent by WhatsApp or email.</p>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" disabled title="Coming soon"><MessageCircle size={14} className="mr-1" />WhatsApp</Button>
                <Button size="sm" variant="outline" disabled title="Coming soon"><Mail size={14} className="mr-1" />Email</Button>
              </div>
              <span className="wf-muted">Not connected yet.</span>
            </div>
          </Card>

          {/* History */}
          <Card>
            <div className="wf-cardhead"><h3><History size={18} />History</h3></div>
            <ul className="wf-timeline">
              {[...t.history].reverse().map((h, i) => (
                <li key={i}>
                  <div className="wf-tl-top"><b>{String(h.type).replace(/_/g, ' ')}</b><span className="wf-tl-time">{fmtWhen(h.at)}</span></div>
                  {h.note && <div className="wf-tl-reason">{h.note}</div>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
