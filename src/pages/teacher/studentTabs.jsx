import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Plus, Save, Trash2 } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import { FormRow, Modal, Notice } from '@/pages/admin/adminUi'
import { inputCls, useLoad } from '@/pages/admin/useLoad'
import {
  DAYS, SESSION_STATUS, WORK_STATUS, createSession, createWork, deleteSession, deleteWork, fmtTime,
  listSessions, listWork, saveTimetable, updateSession, updateWork,
} from '@/services/teachingService'

const todayStr = () => new Date().toISOString().slice(0, 10)
const SESSION_TONE = { scheduled: 'info', taught: 'success', missed: 'danger', cancelled: 'neutral' }
const WORK_TONE = { assigned: 'warning', submitted: 'info', graded: 'success', missed: 'danger' }

/* ------------------------------------------------------------------ Timetable */
export function TimetableTab({ id, detail, onChanged }) {
  const [slots, setSlots] = useState(() => detail.timetable.map((s) => ({ ...s })))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ error: '', success: '' })
  const readOnly = !detail.canRecord

  const set = (i, k) => (e) => setSlots((cur) => cur.map((s, j) => (j === i ? { ...s, [k]: e.target.value } : s)))
  const add = () => setSlots((cur) => [...cur, { day: 'mon', startTime: '17:00', endTime: '18:00' }])
  const remove = (i) => setSlots((cur) => cur.filter((_, j) => j !== i))

  const save = async () => {
    setSaving(true)
    setMsg({ error: '', success: '' })
    try {
      await saveTimetable(id, slots)
      setMsg({ error: '', success: 'Timetable saved.' })
      onChanged()
    } catch (e) {
      setMsg({ error: e.message || 'Could not save the timetable.', success: '' })
    } finally {
      setSaving(false)
    }
  }

  const hoursPerWeek = slots.reduce((n, s) => {
    const [h1, m1] = s.startTime.split(':').map(Number)
    const [h2, m2] = s.endTime.split(':').map(Number)
    return n + Math.max(0, h2 * 60 + m2 - (h1 * 60 + m1))
  }, 0) / 60

  return (
    <div className="wf-tdash">
      <Card>
        <div className="wf-cardhead"><h3><CalendarDays size={18} />Weekly timetable</h3><span className="wf-muted">{slots.length} class{slots.length === 1 ? '' : 'es'} a week · {hoursPerWeek.toFixed(1)} hours</span></div>
        <div className="wf-week">
          {DAYS.map(([k, label]) => {
            const day = slots.filter((s) => s.day === k).sort((a, b) => a.startTime.localeCompare(b.startTime))
            return (
              <div key={k} className={day.length ? 'has-class' : ''}>
                <b>{label.slice(0, 3)}</b>
                {day.length === 0 ? <span className="wf-muted">Off</span> : day.map((s, i) => <span key={i} className="wf-week__slot">{fmtTime(s.startTime)}<br />{fmtTime(s.endTime)}</span>)}
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="wf-cardhead"><h3>Edit slots</h3>{!readOnly && <Button size="sm" variant="outline" onClick={add}><Plus size={14} style={{ marginRight: 6 }} />Add slot</Button>}</div>
        <div className="wf-testpad">
          <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />
          {readOnly && <div className="wf-lock">The timetable can be changed once you accept the student and while the teaching is ongoing.</div>}
          {slots.length === 0 && <p className="wf-muted" style={{ margin: 0 }}>No weekly classes set yet. Add the days and times you teach this student.</p>}
          {slots.map((s, i) => (
            <div key={i} className="wf-slotrow">
              <select className={inputCls} value={s.day} onChange={set(i, 'day')} disabled={readOnly} aria-label="Day">{DAYS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              <input type="time" className={inputCls} value={s.startTime} onChange={set(i, 'startTime')} disabled={readOnly} aria-label="Start time" />
              <input type="time" className={inputCls} value={s.endTime} onChange={set(i, 'endTime')} disabled={readOnly} aria-label="End time" />
              {!readOnly && <Button size="sm" variant="danger" onClick={() => remove(i)} title="Remove"><Trash2 size={14} /></Button>}
            </div>
          ))}
          {!readOnly && <div><Button loading={saving} onClick={save}><Save size={15} style={{ marginRight: 6 }} />Save timetable</Button></div>}
        </div>
      </Card>
    </div>
  )
}

/* ------------------------------------------------------------------ Calendar */
function monthLabel(m) {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}
const shiftMonth = (m, delta) => {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function CalendarTab({ id, detail, onChanged }) {
  const [month, setMonth] = useState(todayStr().slice(0, 7))
  const { data, loading, error, reload } = useLoad(() => listSessions(id, month), [id, month])
  const [editing, setEditing] = useState(null) // { day, session? , planned? }
  const sessions = data?.sessions || []
  const planned = data?.planned || []

  const cells = useMemo(() => {
    const [y, mo] = month.split('-').map(Number)
    const first = new Date(y, mo - 1, 1)
    const lead = (first.getDay() + 6) % 7 // Monday first
    const dim = new Date(y, mo, 0).getDate()
    const out = Array.from({ length: lead }, () => null)
    for (let d = 1; d <= dim; d++) out.push(`${month}-${String(d).padStart(2, '0')}`)
    return out
  }, [month])

  const counts = ['taught', 'missed', 'scheduled', 'cancelled'].map((k) => [k, sessions.filter((s) => s.status === k).length])
  const done = () => { setEditing(null); reload(); onChanged() }

  return (
    <div className="wf-tdash">
      <Card>
        <div className="wf-cardhead">
          <h3><CalendarDays size={18} />{monthLabel(month)}</h3>
          <div className="wf-actions">
            <Button size="sm" variant="outline" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ChevronLeft size={14} /></Button>
            <Button size="sm" variant="outline" onClick={() => setMonth(todayStr().slice(0, 7))}>Today</Button>
            <Button size="sm" variant="outline" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Next month"><ChevronRight size={14} /></Button>
          </div>
        </div>
        <div className="wf-calsum">
          {counts.map(([k, n]) => <span key={k}><Badge size="sm" variant={SESSION_TONE[k]}>{SESSION_STATUS[k]}</Badge> {n}</span>)}
          <span className="wf-muted">{planned.length} more planned from the timetable</span>
        </div>
        {error && <div className="wf-state is-error">{error}</div>}
        <div className={`wf-cal${loading ? ' is-loading' : ''}`}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="wf-cal__head">{d}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} className="wf-cal__cell is-empty" />
            const mine = sessions.filter((s) => s.day === day)
            const plan = planned.filter((p) => p.day === day)
            return (
              <button
                key={day}
                type="button"
                className={`wf-cal__cell${day === todayStr() ? ' is-today' : ''}`}
                disabled={!detail.canRecord}
                onClick={() => setEditing({ day })}
                title={detail.canRecord ? 'Add a class on this day' : undefined}
              >
                <span className="wf-cal__num">{Number(day.slice(8))}</span>
                {mine.map((s) => (
                  <i key={s.id} className={`wf-cal__chip is-${s.status}`} onClick={(e) => { e.stopPropagation(); setEditing({ day, session: s }) }}>{fmtTime(s.startTime)} {s.topic || SESSION_STATUS[s.status]}</i>
                ))}
                {plan.map((p) => (
                  <i key={p.startTime} className="wf-cal__chip is-planned" onClick={(e) => { e.stopPropagation(); setEditing({ day, planned: p }) }}>{fmtTime(p.startTime)} planned</i>
                ))}
              </button>
            )
          })}
        </div>
        {!detail.canRecord && <div className="wf-testpad"><div className="wf-lock">Classes can be recorded once you accept the student.</div></div>}
      </Card>

      {editing && <SessionModal id={id} {...editing} onClose={() => setEditing(null)} onDone={done} />}
    </div>
  )
}

function SessionModal({ id, day, session, planned, onClose, onDone }) {
  const past = day <= todayStr()
  const [form, setForm] = useState({
    day,
    startTime: session?.startTime || planned?.startTime || '17:00',
    endTime: session?.endTime || planned?.endTime || '18:00',
    status: session?.status || (past ? 'taught' : 'scheduled'),
    topic: session?.topic || '',
    notes: session?.notes || '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (session) await updateSession(id, session.id, form)
      else await createSession(id, form)
      onDone()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }
  const remove = async () => {
    if (!window.confirm('Delete this class?')) return
    setSaving(true)
    try { await deleteSession(id, session.id); onDone() } catch (err) { setError(err.message); setSaving(false) }
  }

  return (
    <Modal title={session ? 'Edit class' : 'Add class'} description={new Date(day).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} onClose={onClose}>
      <form onSubmit={submit} className="wf-form">
        <Notice error={error} />
        <div className="wf-grid-2">
          <FormRow label="Start"><input type="time" required className={inputCls} value={form.startTime} onChange={set('startTime')} /></FormRow>
          <FormRow label="End"><input type="time" required className={inputCls} value={form.endTime} onChange={set('endTime')} /></FormRow>
        </div>
        <FormRow label="What happened">
          <div className="wf-presets" style={{ marginTop: 0 }}>
            {Object.entries(SESSION_STATUS).map(([k, l]) => <button key={k} type="button" className={form.status === k ? 'is-on' : ''} onClick={() => setForm((f) => ({ ...f, status: k }))}>{l}</button>)}
          </div>
        </FormRow>
        <FormRow label="Topic covered"><input className={inputCls} maxLength={200} value={form.topic} onChange={set('topic')} placeholder="e.g. Fractions: addition" /></FormRow>
        <FormRow label="Notes"><textarea className={inputCls} rows={3} maxLength={2000} value={form.notes} onChange={set('notes')} placeholder="Progress, what to revise next, anything for the parent…" /></FormRow>
        <div className="wf-formfoot">
          {session && <Button type="button" variant="danger" onClick={remove} style={{ marginRight: 'auto' }}>Delete</Button>}
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save</Button>
        </div>
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ Assignments & tests */
export function WorkTab({ id, detail, onChanged }) {
  const { data, loading, error, reload } = useLoad(() => listWork(id), [id])
  const [modal, setModal] = useState(null) // { type: 'new'|'grade'|'edit', item? }
  const [msg, setMsg] = useState({ error: '', success: '' })
  const docs = data?.docs || []
  const done = (text) => { setModal(null); setMsg({ error: '', success: text }); reload(); onChanged() }

  const quick = async (item, patch, text) => {
    setMsg({ error: '', success: '' })
    try { await updateWork(id, item.id, patch); done(text) } catch (e) { setMsg({ error: e.message, success: '' }) }
  }
  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    try { await deleteWork(id, item.id); done('Deleted.') } catch (e) { setMsg({ error: e.message, success: '' }) }
  }

  return (
    <Card>
      <div className="wf-cardhead"><h3><ClipboardList size={18} />Assignments &amp; tests</h3>{detail.canRecord && <Button size="sm" onClick={() => setModal({ type: 'new' })}><Plus size={14} style={{ marginRight: 6 }} />Give work</Button>}</div>
      <div className="wf-testpad" style={{ paddingBottom: 0 }}><Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} /></div>
      <div className="wf-table-wrap">
        <table className="wf-table">
          <thead><tr><th>Title</th><th>Type</th><th>Due</th><th>Status</th><th>Marks</th><th className="num">Actions</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="wf-state">Loading…</td></tr>}
            {error && <tr><td colSpan={6} className="wf-state is-error">{error}</td></tr>}
            {!loading && !error && docs.length === 0 && <tr><td colSpan={6} className="wf-state">No assignments or tests yet. Give your first one with “Give work”.</td></tr>}
            {docs.map((w) => (
              <tr key={w.id}>
                <td><div className="wf-cell-title">{w.title}</div>{w.description && <div className="wf-cell-sub" style={{ maxWidth: 320 }}>{w.description}</div>}{w.feedback && <div className="wf-cell-sub">Feedback: {w.feedback}</div>}</td>
                <td style={{ textTransform: 'capitalize' }}>{w.kind === 'test' ? 'Class test' : 'Assignment'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{w.dueDate ? new Date(w.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                <td><Badge size="sm" variant={WORK_TONE[w.status]}>{WORK_STATUS[w.status]}</Badge></td>
                <td>{w.marks != null ? <b>{w.marks}{w.maxMarks ? ` / ${w.maxMarks}` : ''}</b> : <span className="wf-muted">—</span>}</td>
                <td>
                  <div className="wf-actions" style={{ justifyContent: 'flex-end' }}>
                    {detail.canRecord && w.status === 'assigned' && <Button size="sm" variant="outline" onClick={() => quick(w, { status: 'submitted' }, 'Marked as submitted.')}>Submitted</Button>}
                    {detail.canRecord && ['assigned', 'submitted', 'graded'].includes(w.status) && <Button size="sm" onClick={() => setModal({ type: 'grade', item: w })}>{w.status === 'graded' ? 'Edit marks' : 'Grade'}</Button>}
                    {detail.canRecord && <Button size="sm" variant="danger" onClick={() => remove(w)} title="Delete"><Trash2 size={14} /></Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal?.type === 'new' && <NewWorkModal id={id} onClose={() => setModal(null)} onDone={() => done('Added.')} />}
      {modal?.type === 'grade' && <GradeModal id={id} item={modal.item} onClose={() => setModal(null)} onDone={() => done('Marks saved.')} />}
    </Card>
  )
}

function NewWorkModal({ id, onClose, onDone }) {
  const [form, setForm] = useState({ kind: 'assignment', title: '', description: '', dueDate: '', maxMarks: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createWork(id, { kind: form.kind, title: form.title, description: form.description, ...(form.dueDate ? { dueDate: form.dueDate } : {}), ...(form.maxMarks ? { maxMarks: Number(form.maxMarks) } : {}) })
      onDone()
    } catch (err) { setError(err.message); setSaving(false) }
  }
  return (
    <Modal title="Give work" description="An assignment or a class test for this student." onClose={onClose}>
      <form onSubmit={submit} className="wf-form">
        <Notice error={error} />
        <div className="wf-presets" style={{ marginTop: 0 }}>
          {[['assignment', 'Assignment'], ['test', 'Class test']].map(([k, l]) => <button key={k} type="button" className={form.kind === k ? 'is-on' : ''} onClick={() => setForm((f) => ({ ...f, kind: k }))}>{l}</button>)}
        </div>
        <FormRow label="Title"><input required className={inputCls} maxLength={200} value={form.title} onChange={set('title')} placeholder="e.g. Chapter 3 exercise" /></FormRow>
        <FormRow label="Details (optional)"><textarea className={inputCls} rows={3} maxLength={3000} value={form.description} onChange={set('description')} /></FormRow>
        <div className="wf-grid-2">
          <FormRow label="Due date"><input type="date" className={inputCls} value={form.dueDate} onChange={set('dueDate')} /></FormRow>
          <FormRow label="Maximum marks"><input type="number" min="1" className={inputCls} value={form.maxMarks} onChange={set('maxMarks')} /></FormRow>
        </div>
        <div className="wf-formfoot"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving}>Add</Button></div>
      </form>
    </Modal>
  )
}

function GradeModal({ id, item, onClose, onDone }) {
  const [marks, setMarks] = useState(item.marks ?? '')
  const [max, setMax] = useState(item.maxMarks ?? '')
  const [feedback, setFeedback] = useState(item.feedback || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateWork(id, item.id, { status: 'graded', marks: Number(marks), ...(max !== '' ? { maxMarks: Number(max) } : {}), feedback })
      onDone()
    } catch (err) { setError(err.message); setSaving(false) }
  }
  return (
    <Modal title="Grade" description={item.title} onClose={onClose}>
      <form onSubmit={submit} className="wf-form">
        <Notice error={error} />
        <div className="wf-grid-2">
          <FormRow label="Marks obtained"><input type="number" min="0" step="any" required className={inputCls} value={marks} onChange={(e) => setMarks(e.target.value)} /></FormRow>
          <FormRow label="Out of"><input type="number" min="1" className={inputCls} value={max} onChange={(e) => setMax(e.target.value)} /></FormRow>
        </div>
        <FormRow label="Feedback"><textarea className={inputCls} rows={3} maxLength={2000} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What went well, what to improve" /></FormRow>
        <div className="wf-formfoot"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" loading={saving}>Save marks</Button></div>
      </form>
    </Modal>
  )
}
