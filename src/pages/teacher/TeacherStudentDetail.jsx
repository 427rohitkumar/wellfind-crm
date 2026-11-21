import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Brain, BookOpen, CalendarDays, CheckCircle2, ChevronLeft, ClipboardCheck, ClipboardList, Clock, FileText, GraduationCap, Lock, MapPin, Phone, Sparkles, UserRound } from 'lucide-react'
import { Alert, Badge, Button, Card } from '@/components/ui'
import { PageLoader } from '@/components/ui/Loaders'
import { PersonAvatar } from '@/components/ui/PersonAvatar'
import { StatusBadge } from '@/pages/admin/adminUi'
import { useLoad } from '@/pages/admin/useLoad'
import { Stat } from '@/pages/payouts/payoutShared'
import { LEVEL_LABEL, TEST_MODES } from '@/services/adminApi'
import { DAY_LABEL, fmtTime, getStudentDetail } from '@/services/teachingService'
import { RespondModal } from './RespondModal'
import { CalendarTab, TimetableTab, WorkTab } from './studentTabs'
import { durationBetween, formatDate } from './teacherPortalUtils'

const TABS = [['overview', 'Overview'], ['timetable', 'Timetable'], ['calendar', 'Calendar'], ['work', 'Assignments & tests'], ['assessment', 'Test report']]

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

/** One allocated student: who they are, what to teach, timetable, classes, assignments and the assessment report. */
export default function TeacherStudentDetail() {
  const { id } = useParams()
  const { data: d, loading, error, reload } = useLoad(() => getStudentDetail(id), [id])
  const [tab, setTab] = useState('overview')
  const [respond, setRespond] = useState(null)

  if (loading && !d) return <PageLoader label="Loading student…" />
  if (error || !d) {
    return (
      <div className="page__section">
        <Alert variant="error" title={error || 'Student not found.'} />
        <Link to="/teacher/students" className="button button--outline"><ChevronLeft size={16} /> Back to My Students</Link>
      </div>
    )
  }

  const s = d.student
  const allSubjects = [...s.subjects, ...(s.customSubject ? [s.customSubject] : [])]
  const place = s.customLocality ? `${s.locality} (${s.customLocality})` : s.locality
  const slotsByDay = Object.entries(DAY_LABEL).map(([k, label]) => [label, d.timetable.filter((t) => t.day === k)]).filter(([, l]) => l.length)

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <nav className="breadcrumb mb-2">
            <span className="breadcrumb__item"><Link to="/teacher/students" className="hover:text-primary transition-colors flex items-center gap-1.5"><ChevronLeft size={14} /> My Students</Link></span>
            <span className="breadcrumb__item" aria-current="page">{s.name}</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <PersonAvatar name={s.name} gender={s.gender} role="student" size={56} />
            <div>
              <h1 className="page__title" style={{ marginBottom: 4 }}>{s.name}</h1>
              <div className="wf-actions"><StatusBadge status={d.status} /><span className="wf-chip">{d.subject}</span><span className="wf-muted">{s.studentClass} · {place}</span></div>
            </div>
          </div>
        </div>
        {d.status === 'assigned' && (
          <div className="page__action">
            <Button variant="success" onClick={() => setRespond({ row: { id: d.id, student: s, subject: d.subject }, status: 'accepted' })}>Accept</Button>
            <Button variant="danger" onClick={() => setRespond({ row: { id: d.id, student: s, subject: d.subject }, status: 'rejected' })}>Reject</Button>
          </div>
        )}
      </header>

      {d.status === 'assigned' && <Alert variant="info" title="This is a new allocation">Accept it to see the parent&apos;s contact, set the timetable and record classes and work.</Alert>}

      <div className="wf-tabsbar" role="tablist" aria-label="Student sections">
        {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'is-on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'overview' && (
        <>
          <div className="wf-stat-grid">
            <Stat icon={CheckCircle2} label="Classes taught" value={d.stats.taught} note={`${d.stats.missed} missed`} tone="success" />
            <Stat icon={CalendarDays} label="Upcoming classes" value={d.stats.upcoming} note="Scheduled ahead" tone="info" />
            <Stat icon={ClipboardList} label="Work pending" value={d.stats.pendingWork} note="Assigned or to grade" tone="warning" />
            <Stat icon={ClipboardCheck} label="Graded" value={d.stats.gradedWork} note="Assignments and tests" />
          </div>

          <div className="wf-portal-grid">
            <div className="wf-portal-main">
              <Card>
                <div className="wf-cardhead"><h3><BookOpen size={18} />What to teach</h3></div>
                <dl className="wf-info">
                  <div><dt>Subject</dt><dd><span className="wf-chip">{d.subject}</span></dd></div>
                  <div><dt>Student wants</dt><dd>{allSubjects.length ? allSubjects.map((x) => <span key={x} className="wf-chip">{x}</span>) : <span className="is-empty">—</span>}</dd></div>
                  <div><dt>Class</dt><dd>{s.studentClass}</dd></div>
                  <div><dt>Preferred timing</dt><dd><Clock size={14} />{s.preferredTiming || '—'}</dd></div>
                </dl>
                {s.learningNotes && <div className="wf-note"><b>Learning notes</b><p>{s.learningNotes}</p></div>}
                {d.notes && <div className="wf-note"><b>Note from Wellfind</b><p>{d.notes}</p></div>}
              </Card>

              <Card>
                <div className="wf-cardhead"><h3><CalendarDays size={18} />Weekly timetable</h3><Button size="sm" variant="outline" onClick={() => setTab('timetable')}>Edit</Button></div>
                {slotsByDay.length === 0 ? (
                  <div className="wf-testpad"><p className="wf-muted" style={{ margin: 0 }}>No timetable yet. Set the days and times you teach this student.</p></div>
                ) : (
                  <dl className="wf-info">{slotsByDay.map(([label, list]) => <div key={label}><dt>{label}</dt><dd>{list.map((t, i) => <span key={i} className="wf-chip">{fmtTime(t.startTime)} – {fmtTime(t.endTime)}</span>)}</dd></div>)}</dl>
                )}
              </Card>
            </div>

            <div className="wf-portal-side">
              <Card>
                <div className="wf-cardhead"><h3><UserRound size={18} />Student &amp; parent</h3></div>
                <dl className="wf-info">
                  <div><dt>Student</dt><dd>{s.name}</dd></div>
                  <div><dt>Area</dt><dd><MapPin size={14} />{place}</dd></div>
                  <div><dt>Parent</dt><dd>{s.parentName || <span className="is-empty">Shown after you accept</span>}</dd></div>
                  <div><dt>Phone</dt><dd>{s.phoneNumber ? <a href={`tel:${s.phoneNumber}`}><Phone size={14} />{s.phoneNumber}</a> : <span className="is-empty"><Lock size={12} style={{ display: 'inline', marginRight: 4 }} />Shown after you accept</span>}</dd></div>
                </dl>
              </Card>
              <Card>
                <div className="wf-cardhead"><h3><GraduationCap size={18} />Teaching since</h3></div>
                <dl className="wf-info">
                  <div><dt>Allocated</dt><dd>{formatDate(d.allocatedAt)}</dd></div>
                  <div><dt>Duration</dt><dd>{durationBetween(d.allocatedAt)}</dd></div>
                </dl>
              </Card>
            </div>
          </div>
        </>
      )}

      {tab === 'timetable' && <TimetableTab key={d.timetable.length + d.status} id={id} detail={d} onChanged={reload} />}
      {tab === 'calendar' && <CalendarTab id={id} detail={d} onChanged={reload} />}
      {tab === 'work' && <WorkTab id={id} detail={d} onChanged={reload} />}

      {tab === 'assessment' && (
        <Card>
          <div className="wf-cardhead"><h3><Brain size={18} />Assessment test report</h3>{d.assessment && <Badge size="sm" variant={d.assessment.status === 'report_ready' ? 'success' : 'warning'}>{d.assessment.status.replace(/_/g, ' ')}</Badge>}</div>
          {!d.assessment && <div className="wf-testpad"><div className="wf-lock"><FileText size={16} />The parent did not take Wellfind&apos;s assessment test for this student, so there is no report. Your own class tests are under “Assignments &amp; tests”.</div></div>}
          {d.assessment && !d.assessment.report && (
            <div className="wf-testpad">
              <div className="wf-lock"><Clock size={16} />{TEST_MODES[d.assessment.mode]?.label || d.assessment.mode} test is {d.assessment.status.replace(/_/g, ' ')}. {d.assessment.status === 'conducted' ? 'The report is being written.' : 'The result will appear here when the report is ready.'}</div>
            </div>
          )}
          {d.assessment?.report && (
            <>
              <div className="wf-scorecards">
                <ScoreCard label="IQ level" icon={Brain} score={d.assessment.report.iqScore} level={d.assessment.report.iqLevel} />
                <ScoreCard label="Creativity" icon={Sparkles} score={d.assessment.report.creativityScore} level={d.assessment.report.creativityLevel} />
                <ScoreCard label="Academic level" icon={BookOpen} score={d.assessment.report.academicScore} level={d.assessment.report.academicLevel} />
              </div>
              {d.assessment.report.hoursPerWeek != null && <dl className="wf-info"><div><dt>Suggested effort</dt><dd>{d.assessment.report.hoursPerWeek} hours / week</dd></div></dl>}
              {d.assessment.report.recommendation && <div className="wf-note"><b>Guidance for you</b><p>{d.assessment.report.recommendation}</p></div>}
              {d.assessment.report.strengths && <div className="wf-note"><b>Strengths</b><p>{d.assessment.report.strengths}</p></div>}
              {d.assessment.report.improvementAreas && <div className="wf-note"><b>Areas to improve</b><p>{d.assessment.report.improvementAreas}</p></div>}
            </>
          )}
        </Card>
      )}

      {respond && <RespondModal {...respond} onClose={() => setRespond(null)} onDone={() => { setRespond(null); reload() }} />}
    </div>
  )
}
