import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, CardBody, CardHeader } from '@/components/ui'
import { STUDENT_RECORD_STATUSES, getStudentRecord, updateStudentRecord } from '@/services/adminApi'
import { Notice, StatusBadge } from './adminUi'
import { inputCls, useLoad } from './useLoad'
import StudentAssessments from './StudentAssessments'
import StudentMatching from './StudentMatching'
import StudentTests from './StudentTests'

const TABS = [
  ['assessments', 'Assessments'],
  ['matching', 'Teacher Matching'],
  ['tests', 'Physical Tests'],
]

export default function StudentRecordDetail() {
  const { id } = useParams()
  const [tab, setTab] = useState('assessments')
  const [msg, setMsg] = useState({ error: '', success: '' })
  const [saving, setSaving] = useState(false)
  const { data: s, loading, error, setData } = useLoad(() => getStudentRecord(id), [id])

  const changeStatus = async (status) => {
    setSaving(true)
    setMsg({ error: '', success: '' })
    try {
      const updated = await updateStudentRecord(id, { status })
      setData((prev) => ({ ...prev, ...(updated || {}), status }))
      setMsg({ error: '', success: 'Status updated.' })
    } catch (e) {
      setMsg({ error: e.message, success: '' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page__section py-16 text-center text-muted-foreground">Loading…</div>
  if (error || !s) {
    return (
      <div className="page__section">
        <Notice error={error || 'Student not found.'} />
        <Link to="/admin/student-records" className="text-primary text-sm">← Back to student records</Link>
      </div>
    )
  }

  const info = [
    ['Class', s.studentClass], ['Subjects', [...(s.subjects || []), s.customSubject].filter(Boolean).join(', ')],
    ['Locality', [s.locality, s.customLocality].filter(Boolean).join(' · ')], ['Preferred timing', s.preferredTiming],
    ['Budget', s.budgetRange], ['Parent', s.parentName], ['Phone', s.phoneNumber], ['Alt. phone', s.alternatePhoneNumber],
    ['Parent email', s.parentEmail], ['Learning notes', s.learningNotes],
  ]

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <Link to="/admin/student-records" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-1"><ArrowLeft size={14} />Student records</Link>
          <h1 className="page__title">{s.name}</h1>
          <p className="page__description flex items-center gap-2">Record #{s.id} <StatusBadge status={s.status} />
            {s.studentEnquiry && <Link className="text-primary" to={`/admin/student-enquiries/${typeof s.studentEnquiry === 'object' ? s.studentEnquiry.id : s.studentEnquiry}`}>View enquiry</Link>}
          </p>
        </div>
        <div className="page__action flex items-center gap-2">
          <select className={inputCls} style={{ width: 160 }} value={s.status} disabled={saving} onChange={(e) => changeStatus(e.target.value)} aria-label="Student status">
            {STUDENT_RECORD_STATUSES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
      </header>

      <Notice {...msg} onClose={() => setMsg({ error: '', success: '' })} />

      <Card className="mb-6">
        <CardHeader className="border-b border-border py-3.5 px-5"><h3 className="card__title">Student details</h3></CardHeader>
        <CardBody className="p-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          {info.map(([k, v]) => (
            <div key={k}><span className="text-muted-foreground">{k}</span><div className="font-medium">{v || '—'}</div></div>
          ))}
        </CardBody>
      </Card>

      <div className="flex gap-2 mb-4 border-b border-border" role="tablist">
        {TABS.map(([key, label]) => (
          <Button key={key} role="tab" aria-selected={tab === key} variant={tab === key ? 'primary' : 'ghost'} size="sm" onClick={() => setTab(key)}>{label}</Button>
        ))}
      </div>

      {tab === 'assessments' && <StudentAssessments studentId={id} />}
      {tab === 'matching' && <StudentMatching studentId={id} />}
      {tab === 'tests' && <StudentTests studentId={id} />}
    </div>
  )
}
