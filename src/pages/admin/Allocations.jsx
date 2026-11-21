import { TableLoader } from '@/components/ui/Loaders'
import { usePermissions } from '@/hooks/usePermissions'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Plus, RefreshCw, UserPlus } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import {
  ALLOCATION_STATUSES, ALLOCATION_TRANSITIONS, DEFAULT_COMMISSION_PERCENT, calcAllocationTerms, createAllocation,
  docsOf, fmtDateTime, inr, labelize, listAllocations, listStudentRecords, listTeacherProfiles,
  updateAllocation, updateAllocationStatus,
} from '@/services/adminApi'
import { FormRow, Modal, Notice, Pager, StatusBadge } from './adminUi'
import { inputCls, useLoad } from './useLoad'

const LIVE_STATUSES = ['assigned', 'accepted', 'active']

export default function Allocations() {
  const { can } = usePermissions()
  const canEdit = can('allocation', 'write')
  const [searchParams, setSearchParams] = useSearchParams()
  const presetStudent = searchParams.get('student') || ''
  const presetEnquiry = searchParams.get('enquiry') || ''

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const [tab, setTab] = useState('awaiting')
  const [msg, setMsg] = useState({ error: '', success: '' })
  // {type:'create', studentId?} | {type:'status'|'detail', row}
  const [modal, setModal] = useState(presetStudent || presetEnquiry ? { type: 'create', studentId: presetStudent, enquiryId: presetEnquiry } : null)

  const { data, loading, error, reload } = useLoad(
    () => listAllocations({ page, limit: 10, status, sort: '-allocatedAt' }),
    [page, status],
  )
  const rows = docsOf(data)

  // Students waiting for a teacher: active student records without a live allocation.
  const queue = useLoad(async () => {
    const [students, live] = await Promise.all([
      listStudentRecords({ status: 'active', limit: 100, sort: '-createdAt' }),
      listAllocations({ limit: 100 }),
    ])
    const allocated = new Set(
      docsOf(live).filter((a) => LIVE_STATUSES.includes(a.status)).map((a) => String(a.studentId)),
    )
    return docsOf(students).filter((s) => !allocated.has(String(s.id)))
  }, [])
  const waiting = queue.data || []

  const closeModal = () => {
    setModal(null)
    if (searchParams.has('student') || searchParams.has('enquiry')) setSearchParams({}, { replace: true })
  }
  const done = (text) => {
    closeModal()
    setMsg({ error: '', success: text })
    reload()
    queue.reload()
  }
  const refreshAll = () => { reload(); queue.reload() }

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Teacher Allocation</h1>
          <p className="page__description">Match verified students with approved teachers, decide the fee and Wellfind commission, and track each allocation.</p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={refreshAll}><RefreshCw size={16} style={{ marginRight: 8 }} />Refresh</Button>
          {canEdit && <Button onClick={() => setModal({ type: 'create' })}><Plus size={16} style={{ marginRight: 8 }} />New allocation</Button>}
        </div>
      </header>

      <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />

      <div className="wf-tabsbar" role="tablist" aria-label="Allocation categories">
        <button type="button" role="tab" aria-selected={tab === 'awaiting'} className={tab === 'awaiting' ? 'is-on' : ''} onClick={() => setTab('awaiting')}>
          Awaiting allocation ({queue.loading ? '…' : waiting.length})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'allocated'} className={tab === 'allocated' ? 'is-on' : ''} onClick={() => setTab('allocated')}>
          Allocated ({data ? data.totalDocs ?? rows.length : '…'})
        </button>
      </div>

      {tab === 'awaiting' && (
        <Card>
          <div className="wf-sectionhead">
            <div>
              <h3>Awaiting teacher allocation</h3>
              <p>Students sent from Inquiries (after the call and optional test). Click a row to allocate a teacher.</p>
            </div>
          </div>
          <div className="wf-table-wrap">
            <table className="wf-table wf-table--click">
              <thead>
                <tr><th>Student</th><th>Class &amp; locality</th><th>Subjects</th><th>Timing</th><th>Budget</th><th className="num">Action</th></tr>
              </thead>
              <tbody>
                {queue.loading && <tr><td colSpan={6} style={{ padding: 0 }}><TableLoader columns={6} /></td></tr>}
                {!queue.loading && queue.error && <tr><td colSpan={6} className="wf-state is-error">{queue.error}</td></tr>}
                {!queue.loading && !queue.error && waiting.length === 0 && <tr><td colSpan={6} className="wf-state">No students are waiting. Move a verified enquiry to Students from the Inquiries tab.</td></tr>}
                {!queue.loading && waiting.map((s) => (
                  <tr key={s.id} tabIndex={0} onClick={() => canEdit && setModal({ type: 'create', studentId: String(s.id) })} onKeyDown={(e) => e.key === 'Enter' && canEdit && setModal({ type: 'create', studentId: String(s.id) })}>
                    <td className="wf-cell-title">{s.name}</td>
                    <td>{s.studentClass}<div className="wf-cell-sub">{s.locality}</div></td>
                    <td>{[...(s.subjects || []), s.customSubject].filter(Boolean).join(', ') || '—'}</td>
                    <td>{s.preferredTiming || '—'}</td>
                    <td>{s.budgetRange || '—'}</td>
                    <td className="num">
                      {canEdit && <Button size="sm" onClick={(e) => { e.stopPropagation(); setModal({ type: 'create', studentId: String(s.id) }) }}>
                        <UserPlus size={14} style={{ marginRight: 4 }} />Allocate
                      </Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'allocated' && (
        <Card>
          <div className="wf-sectionhead">
            <div><h3>Allocated students</h3><p>Click a row for the fee, commission and status history.</p></div>
            <select className={inputCls} style={{ width: 200 }} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }} aria-label="Status">
              <option value="all">All statuses</option>
              {ALLOCATION_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
            </select>
          </div>
          <div className="wf-table-wrap">
            <table className="wf-table wf-table--click">
              <thead>
                <tr>
                  <th>Student</th><th>Teacher</th>
                  <th>Subject</th><th>Status</th>
                  <th className="num">Monthly fee</th>
                  <th className="num">Wellfind commission</th>
                  <th className="num">Teacher payout</th>
                  <th>Allocated</th><th className="num">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} style={{ padding: 0 }}><TableLoader columns={9} /></td></tr>}
                {!loading && error && <tr><td colSpan={9} className="wf-state is-error">{error}</td></tr>}
                {!loading && !error && rows.length === 0 && <tr><td colSpan={9} className="wf-state">No allocations yet.</td></tr>}
                {!loading && rows.map((a) => (
                  <tr key={a.id} tabIndex={0} onClick={() => setModal({ type: 'detail', row: a })} onKeyDown={(e) => e.key === 'Enter' && setModal({ type: 'detail', row: a })}>
                    <td className="wf-cell-title">{a.student?.name || `#${a.studentId}`}<div className="wf-cell-sub">{a.student?.studentClass} · {a.student?.locality}</div></td>
                    <td>{a.teacher?.name || `#${a.teacherId}`}</td>
                    <td>{a.subject}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td className="num">{inr(a.monthlyFee)}</td>
                    <td className="num">
                      {inr(a.commissionAmount)}
                      {a.commissionPercent != null && <div className="wf-cell-sub" style={{ justifyContent: 'flex-end' }}>{a.commissionPercent}%</div>}
                    </td>
                    <td className="num">{inr(a.teacherPayout)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(a.allocatedAt)}</td>
                    <td>
                      <div className="wf-actions" onClick={(e) => e.stopPropagation()}>
                        {canEdit && (ALLOCATION_TRANSITIONS[a.status] || []).length > 0 && (
                          <Button size="sm" onClick={() => setModal({ type: 'status', row: a })}>Update status</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager data={data} page={page} onPage={setPage} />
        </Card>
      )}

      {modal?.type === 'create' && <CreateAllocation presetStudentId={modal.studentId} presetEnquiryId={modal.enquiryId} onClose={closeModal} onSaved={() => done('Teacher allocated. The enquiry is now marked Allocated.')} />}
      {modal?.type === 'status' && <StatusForm row={modal.row} onClose={closeModal} onSaved={() => done('Status updated.')} />}
      {modal?.type === 'detail' && <Detail row={modal.row} onClose={closeModal} onSaved={() => done('Allocation updated.')} />}
    </div>
  )
}

/** Fee, commission %, rounding strategy and live preview of commission & teacher payout. */
function TermsFields({
  fee,
  pct,
  setFee,
  setPct,
  roundingRule = 'round100',
  setRoundingRule,
  customPayout = '',
  setCustomPayout,
  studentBudget = '',
  required = false,
}) {
  const terms = calcAllocationTerms(fee, pct, roundingRule, customPayout)
  // With a custom payout the commission % is an output: keep the field in step with the real split.
  const customActive = roundingRule === 'custom' && customPayout !== '' && terms
  const effective = customActive ? String(terms.effectivePct) : null
  useEffect(() => {
    if (effective !== null && effective !== String(pct)) setPct(effective)
  }, [effective, pct, setPct])

  const COMMISSION_PRESETS = [20, 25, 30, 50]
  const ROUNDING_OPTIONS = [
    { value: 'round100', label: 'Nearest ₹100 (Recommended, e.g. ₹2,625 → ₹2,600)' },
    { value: 'round50', label: 'Nearest ₹50 (e.g. ₹2,625 → ₹2,650)' },
    { value: 'floor100', label: 'Round down to ₹100 (Floor, e.g. ₹2,675 → ₹2,600)' },
    { value: 'floor50', label: 'Round down to ₹50 (Floor, e.g. ₹2,640 → ₹2,600)' },
    { value: 'none', label: 'Exact (No rounding, e.g. ₹2,625.00)' },
    { value: 'custom', label: 'Custom teacher payout amount…' },
  ]

  return (
    <div className="wf-terms">
      <div className="wf-callout">
        {studentBudget ? <><b>Parent&apos;s stated budget: {studentBudget}</b><span>Enter the final monthly fee agreed with the parent below.</span></> : <span>The parent gave no budget. Enter the agreed monthly fee below.</span>}
      </div>

      <div className="wf-grid-2">
        <FormRow label="Final agreed monthly fee (₹)" hint="Charged to the parent per month">
          <input type="number" min="1" step="any" required={required} className={inputCls} placeholder="e.g. 3500" value={fee} onChange={(e) => setFee(e.target.value)} />
        </FormRow>
        <FormRow label="Wellfind commission (%)" hint={customActive ? 'Calculated from the custom teacher payout' : 'Platform commission share'}>
          <input type="number" min="0" max="100" step="any" required={required} disabled={Boolean(customActive)} className={inputCls} placeholder="e.g. 25" value={pct} onChange={(e) => setPct(e.target.value)} />
        </FormRow>
      </div>
      <div className="wf-presets">
        <span>Quick pick</span>
        {COMMISSION_PRESETS.map((p) => (
          <button key={p} type="button" disabled={Boolean(customActive)} className={Number(pct) === p ? 'is-on' : ''} onClick={() => setPct(String(p))}>{p}%</button>
        ))}
      </div>

      <FormRow label="Teacher payout rounding" hint="The payout is rounded to a clean amount; the balance goes to Wellfind.">
        <select className={inputCls} value={roundingRule} onChange={(e) => setRoundingRule?.(e.target.value)}>
          {ROUNDING_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </FormRow>

      {roundingRule === 'custom' && (
        <FormRow label="Custom monthly teacher payout (₹)" hint="Wellfind gets fee minus payout">
          <input type="number" min="0" max={fee || 100000} step="any" className={inputCls} placeholder="e.g. 2600" value={customPayout} onChange={(e) => setCustomPayout?.(e.target.value)} />
        </FormRow>
      )}

      {terms ? (
        <div className="wf-breakdown">
          <div className="wf-breakdown__rows">
            <div><span>Parent pays</span><b>{inr(terms.fee)}</b></div>
            <div><span>Commission ({terms.pct}%)</span><span>− {inr(terms.rawCommission)}</span></div>
            <div><span>Teacher share before rounding</span><span>{inr(terms.rawPayout)}</span></div>
            {terms.diffFromRaw !== 0 && (
              <div className="is-adjust">
                <span>Rounding adjustment</span>
                <span>{terms.diffFromRaw < 0 ? `${inr(terms.diffFromRaw)} to teacher, ${inr(Math.abs(terms.diffFromRaw))} to Wellfind` : `+${inr(terms.diffFromRaw)} to teacher, taken from Wellfind`}</span>
              </div>
            )}
          </div>
          <div className="wf-breakdown__cards">
            <div className="is-teacher">
              <small>Teacher receives</small>
              <b>{inr(terms.payout)}</b>
              <span>{Math.round((terms.payout / terms.fee) * 1000) / 10}% of the fee, per month</span>
            </div>
            <div className="is-wellfind">
              <small>Wellfind commission</small>
              <b>{inr(terms.commission)}</b>
              <span>Effective {terms.effectivePct}%</span>
            </div>
          </div>
          <p className="wf-breakdown__check"><CheckCircle2 size={13} /> {inr(terms.payout)} + {inr(terms.commission)} = {inr(terms.fee)}</p>
        </div>
      ) : (
        <div className="wf-callout"><span>Enter the fee and commission to see the live payout split.</span></div>
      )}
    </div>
  )
}

function CreateAllocation({ presetStudentId = '', presetEnquiryId = '', onClose, onSaved }) {
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState({ studentId: presetStudentId, teacherId: '', subject: '', allocationNotes: '' })
  const [fee, setFee] = useState('')
  const [pct, setPct] = useState(String(DEFAULT_COMMISSION_PERCENT))
  const [roundingRule, setRoundingRule] = useState('round100')
  const [customPayout, setCustomPayout] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    let alive = true
    Promise.all([
      listStudentRecords({ status: 'active', limit: 100, sort: 'name' }),
      listTeacherProfiles({ limit: 100 }),
    ])
      .then(([s, t]) => {
        if (!alive) return
        const list = docsOf(s)
        setStudents(list)
        setTeachers(docsOf(t))
        // Opened from "Allocate": prefill the subject and the parent's budget hint.
        const preset = list.find((x) => String(x.id) === presetStudentId || (presetEnquiryId && String(x.studentEnquiry) === presetEnquiryId))
        if (preset) {
          const first = preset.subjects?.[0] || preset.customSubject || ''
          setForm((f) => ({ ...f, studentId: String(preset.id), subject: f.subject || first }))
        }
      })
      .catch((e) => alive && setError(e.message))
    return () => { alive = false }
  }, [presetStudentId, presetEnquiryId])

  const student = students.find((s) => String(s.id) === form.studentId)
  const subjects = useMemo(
    () => [...(student?.subjects || []), ...(student?.customSubject ? [student.customSubject] : [])],
    [student],
  )
  const subjectKey = form.subject.trim().toLowerCase()
  const isMatch = (t) => Boolean(subjectKey) && String(t.primarySubject || '').toLowerCase().includes(subjectKey)
  const orderedTeachers = [...teachers].sort((a, b) => Number(isMatch(b)) - Number(isMatch(a)))

  const pickStudent = (e) => {
    const id = e.target.value
    const picked = students.find((s) => String(s.id) === id)
    const first = picked?.subjects?.[0] || picked?.customSubject || ''
    setForm((f) => ({ ...f, studentId: id, subject: first, teacherId: '' }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const terms = calcAllocationTerms(fee, pct, roundingRule, customPayout)
    if (!terms) {
      setError('Enter a valid monthly fee and a commission between 0 and 100.')
      return
    }
    setSaving(true)
    try {
      await createAllocation({
        studentId: Number(form.studentId),
        teacherId: Number(form.teacherId),
        subject: form.subject.trim(),
        monthlyFee: Number(fee),
        commissionPercent: Number(pct),
        teacherPayout: terms.payout,
        commissionAmount: terms.commission,
        ...(form.allocationNotes.trim() ? { allocationNotes: form.allocationNotes.trim() } : {}),
      })
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal wide title="New allocation" description="Pick the student, match a teacher, then decide the fee and commission." onClose={onClose}>
      <form onSubmit={submit} className="wf-form">
        <Notice error={error} />

        <section className="wf-section">
          <h4 className="wf-section__title"><span>1</span>Student &amp; subject</h4>
          <div className="wf-grid-2">
            <FormRow label="Student">
              <select required className={inputCls} value={form.studentId} onChange={pickStudent}>
                <option value="">Select student…</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.studentClass}</option>)}
              </select>
            </FormRow>
            <FormRow label="Subject to teach">
              {subjects.length > 0 ? (
                <select required className={inputCls} value={form.subject} onChange={set('subject')}>
                  <option value="">Select subject…</option>
                  {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input required className={inputCls} maxLength={100} value={form.subject} onChange={set('subject')} placeholder="Select a student first" />
              )}
            </FormRow>
          </div>
          {student && (
            <div className="wf-summary">
              <span>{student.studentClass}</span>
              <span>{student.locality}</span>
              <span>{student.preferredTiming}</span>
              {student.budgetRange && <span className="is-accent">Parent budget {student.budgetRange}</span>}
            </div>
          )}
        </section>

        <section className="wf-section">
          <h4 className="wf-section__title"><span>2</span>Teacher</h4>
          <FormRow label="Assign teacher" hint="Teachers matching the subject are listed first (★). Must be approved & active and cover the class.">
            <select required className={inputCls} value={form.teacherId} onChange={set('teacherId')} disabled={teachers.length === 0}>
              <option value="">{teachers.length === 0 ? 'No approved teachers available' : 'Select teacher…'}</option>
              {orderedTeachers.map((t) => (
                <option key={t.id} value={t.id}>{isMatch(t) ? '★ ' : ''}{t.name || t.fullName} — {t.primarySubject}</option>
              ))}
            </select>
          </FormRow>
          {teachers.length === 0 && (
            <p className="wf-muted">Approve a teacher application first (Inquiries → Teacher Inquiries), then come back to allocate.</p>
          )}
        </section>

        <section className="wf-section">
          <h4 className="wf-section__title"><span>3</span>Fee &amp; commission</h4>
          <TermsFields
            fee={fee}
            pct={pct}
            setFee={setFee}
            setPct={setPct}
            roundingRule={roundingRule}
            setRoundingRule={setRoundingRule}
            customPayout={customPayout}
            setCustomPayout={setCustomPayout}
            studentBudget={student?.budgetRange}
            required
          />
        </section>

        <FormRow label="Notes (optional)">
          <textarea className={inputCls} rows={2} maxLength={2000} value={form.allocationNotes} onChange={set('allocationNotes')} />
        </FormRow>
        <div className="wf-formfoot">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Allocate</Button>
        </div>
      </form>
    </Modal>
  )
}

function StatusForm({ row, onClose, onSaved }) {
  const options = ALLOCATION_TRANSITIONS[row.status] || []
  const [status, setStatus] = useState(options[0] || '')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateAllocationStatus(row.id, status, reason.trim())
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Update allocation status" description={`${row.student?.name} ↔ ${row.teacher?.name} · ${row.subject}`} onClose={onClose}>
      <form onSubmit={submit} className="wf-form">
        <Notice error={error} />
        <p className="text-sm">Current: <StatusBadge status={row.status} /></p>
        <FormRow label="New status">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            {options.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
          </select>
        </FormRow>
        <FormRow label="Reason (optional)">
          <textarea className={inputCls} rows={3} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormRow>
        <div className="wf-formfoot">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Update</Button>
        </div>
      </form>
    </Modal>
  )
}

function Detail({ row, onClose, onSaved }) {
  const [notes, setNotes] = useState(row.allocationNotes || '')
  const [fee, setFee] = useState(row.monthlyFee != null ? String(row.monthlyFee) : '')
  const [pct, setPct] = useState(row.commissionPercent != null ? String(row.commissionPercent) : String(DEFAULT_COMMISSION_PERCENT))
  const [roundingRule, setRoundingRule] = useState('round100')
  const [customPayout, setCustomPayout] = useState(row.teacherPayout != null ? String(row.teacherPayout) : '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const history = Array.isArray(row.statusHistory) ? row.statusHistory : []

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const body = { allocationNotes: notes }
      if (fee !== '') {
        const terms = calcAllocationTerms(fee, pct, roundingRule, customPayout)
        if (!terms) throw new Error('Enter a valid monthly fee and a commission between 0 and 100.')
        body.monthlyFee = Number(fee)
        body.commissionPercent = Number(pct)
        body.teacherPayout = terms.payout
        body.commissionAmount = terms.commission
      }
      await updateAllocation(row.id, body)
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal wide title={`Allocation #${row.id}`} description={`${row.student?.name} ↔ ${row.teacher?.name} · ${row.subject}`} onClose={onClose}>
      <Notice error={error} />
      <TermsFields
        fee={fee}
        pct={pct}
        setFee={setFee}
        setPct={setPct}
        roundingRule={roundingRule}
        setRoundingRule={setRoundingRule}
        customPayout={customPayout}
        setCustomPayout={setCustomPayout}
        studentBudget={row.student?.budgetRange}
      />
      <FormRow label="Allocation notes">
        <textarea className={inputCls} rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FormRow>
      <div className="wf-formfoot"><Button size="sm" loading={saving} onClick={save}>Save changes</Button></div>
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "4px 0 10px" }}>Status history</h3>
        {history.length === 0 ? <p className="wf-muted">No history.</p> : (
          <ul className="wf-hist">
            {history.map((h, i) => (
              <li key={i}>
                <StatusBadge status={h.status || h.toStatus} /> <span className="text-muted-foreground">{fmtDateTime(h.changedAt || h.at)}</span>
                {h.reason && <div className="mt-1">{h.reason}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
