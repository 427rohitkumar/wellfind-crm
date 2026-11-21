import { Alert } from '@/components/ui/Alert'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Search,
  Users,
  UserRound,
  Workflow,
  X,
} from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { fetchStudents } from '@/services/studentService'
import { fetchTeachers } from '@/services/teacherService'
import { calculateCommission } from '@/data/commissionDemoData'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

function formatAllocationStatus(teacher) {
  const count = teacher.studentAllocation?.allocatedCount ?? 0
  if (teacher.studentAllocation?.status === 'allocated' || count > 0) return 'Allocated'
  if (teacher.studentAllocation?.status === 'partially_allocated') return 'Partially allocated'
  return 'Unallocated'
}

function TeacherStatus({ teacher }) {
  const status = teacher.account?.status === 'active' ? 'Available to review' : 'Unavailable'
  return (
    <Badge variant={status === 'Available to review' ? 'success' : 'neutral'} size="sm">
      {status}
    </Badge>
  )
}

function AllocationStatusCard({ title, icon: Icon, active, inactive, note }) {
  return (
    <Card variant="bordered" className="allocation-status-card">
      <CardHeader className="allocation-status-card__header">
        <div className="allocation-status-card__title">
          <span className="allocation-summary-card__icon allocation-summary-card__icon--blue">
            <Icon size={18} />
          </span>
          <h2>{title}</h2>
        </div>
        {note && <span className="allocation-status-card__note">{note}</span>}
      </CardHeader>
      <CardBody className="allocation-status-card__metrics">
        <div className="allocation-status-card__metric allocation-status-card__metric--active">
          <span>Active</span>
          <strong>{active}</strong>
        </div>
        <div className="allocation-status-card__metric allocation-status-card__metric--inactive">
          <span>Inactive</span>
          <strong>{inactive}</strong>
        </div>
      </CardBody>
    </Card>
  )
}

export default function Allocation() {
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [studentSource, setStudentSource] = useState(false)
  const [teacherSource, setTeacherSource] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('students')
  const [search, setSearch] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [allocationPanelOpen, setAllocationPanelOpen] = useState(false)
  const [teacherSearch, setTeacherSearch] = useState('')
  const [commercialTerms, setCommercialTerms] = useState({
    monthlyFee: '4000',
    commissionPercent: '25',
    effectiveDate: '2026-10-01',
    notes: '',
  })
  const isDemoPreview = import.meta.env.DEV && !studentSource

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const [studentResponse, teacherResponse] = await Promise.all([
        fetchStudents({ page: 1, limit: 100, status: 'active' }),
        fetchTeachers({ page: 1, limit: 100 }),
      ])
      setStudents(studentResponse?.docs || [])
      setTeachers(teacherResponse?.docs || [])
      setStudentSource(Boolean(studentResponse?.isRealApi))
      setTeacherSource(Boolean(teacherResponse?.isRealApi))
    } catch (loadError) {
      setError(loadError?.message || 'Allocation records could not be loaded.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    const eligibleStudents = studentSource
      ? students.filter((student) => student.allocationStatus === 'unallocated')
      : isDemoPreview
        ? students
        : []
    if (!query) return eligibleStudents
    return eligibleStudents.filter((student) => {
      const haystack = [
        student.name,
        student.id,
        student.studentClass,
        student.locality,
        student.preferredTiming,
        ...(student.subjects || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [isDemoPreview, search, studentSource, students])

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase()
    const eligibleTeachers = teacherSource
      ? teachers.filter((teacher) => teacher.account?.status === 'active')
      : isDemoPreview
        ? teachers
        : []
    if (!query) return eligibleTeachers
    return eligibleTeachers.filter((teacher) =>
      [teacher.name, teacher.id, teacher.primarySubject, teacher.locality, teacher.availability]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [isDemoPreview, search, teacherSource, teachers])

  const hasStudentAllocationStatus = studentSource && students.some(
    (student) => ['unallocated', 'allocated', 'partially_allocated'].includes(student.allocationStatus),
  )

  const teacherAllocationSummary = useMemo(() => {
    if (!teacherSource) return { active: 'Unavailable', inactive: 'Unavailable' }

    return teachers.reduce(
      (summary, teacher) => {
        const status = teacher.studentAllocation?.status
        if (status === 'allocated' || status === 'partially_allocated') summary.active += 1
        else if (status === 'unallocated') summary.inactive += 1
        return summary
      },
      { active: 0, inactive: 0 },
    )
  }, [teacherSource, teachers])

  const toggleStudent = (id) => {
    setSelectedStudentIds((current) =>
      current.includes(id) ? current.filter((studentId) => studentId !== id) : [...current, id],
    )
  }

  const toggleAllStudents = () => {
    const visibleIds = filteredStudents.map((student) => student.id)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedStudentIds.includes(id))
    setSelectedStudentIds((current) =>
      allSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])],
    )
  }

  const selectedStudents = students.filter((student) => selectedStudentIds.includes(student.id))
  const canOpenAllocationReview = selectedStudentIds.length > 0
    && (isDemoPreview || (hasStudentAllocationStatus && teacherSource))
  const selectedTeacher = teachers.find((teacher) => teacher.id === selectedTeacherId)
  const calculatedTerms = calculateCommission({
    monthlyFee: Math.max(Number(commercialTerms.monthlyFee) || 0, 0),
    commissionPercent: Math.min(Math.max(Number(commercialTerms.commissionPercent) || 0, 0), 100),
  })
  const termsAreValid = commercialTerms.monthlyFee !== ''
    && Number(commercialTerms.monthlyFee) >= 0
    && commercialTerms.commissionPercent !== ''
    && Number(commercialTerms.commissionPercent) >= 0
    && Number(commercialTerms.commissionPercent) <= 100
  const modalTeachers = useMemo(() => {
    const query = teacherSearch.trim().toLowerCase()
    if (!query) return filteredTeachers
    return filteredTeachers.filter((teacher) =>
      [teacher.name, teacher.id, teacher.primarySubject, teacher.classLevels, teacher.locality]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }, [filteredTeachers, teacherSearch])

  const studentChecks = useMemo(() => {
    if (!selectedTeacher) return []
    return selectedStudents.map((student) => {
      const subjects = student.subjects || []
      const subjectMatch = subjects.length > 0 && (
        subjects.some((subject) =>
          selectedTeacher.primarySubject?.toLowerCase().includes(subject.toLowerCase())
          || subject.toLowerCase().includes(selectedTeacher.primarySubject?.toLowerCase() || ''),
        )
      )
      const classConfigured = Boolean(selectedTeacher.classLevels)
      const localityConfigured = Boolean(selectedTeacher.locality && student.locality)
      const timingConfigured = Boolean(selectedTeacher.availability && student.preferredTiming)
      return {
        student,
        subjectMatch,
        classConfigured,
        localityConfigured,
        timingConfigured,
      }
    })
  }, [selectedStudents, selectedTeacher])

  const removeSelectedStudent = (id) => {
    setSelectedStudentIds((current) => current.filter((studentId) => studentId !== id))
    if (selectedStudentIds.length <= 1) setAllocationPanelOpen(false)
  }

  return (
    <main className="allocation-page">
      <header className="allocation-page__header">
        <div>
          <div className="allocation-page__eyebrow">
            <Workflow size={16} aria-hidden="true" />
            Operations workspace
          </div>
          <h1>Allocation Management</h1>
          <p>Match students with suitable teachers and manage teaching capacity and availability.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadData(true)}
          loading={refreshing}
          aria-label="Refresh allocation data"
        >
          <RefreshCw size={15} />
          Refresh
        </Button>
      </header>

      {error && <Alert variant="error" title={error} />}

      <section className="allocation-status-summary" aria-label="Student and teacher allocation status">
        <AllocationStatusCard
          title="Student Allocation"
          icon={Users}
          active="Not configured"
          inactive="Not configured"
        />
        <AllocationStatusCard
          title="Teacher Allocation"
          icon={UserRound}
          active={teacherAllocationSummary.active}
          inactive={teacherAllocationSummary.inactive}
        />
      </section>

      <Card variant="bordered" className="allocation-workspace">
        <CardHeader className="allocation-workspace__header">
          <div>
            <h2>Allocation workspace</h2>
            <p>Select eligible students, review an approved teacher, then confirm an allocation when backend support is available.</p>
          </div>
          <div className="allocation-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search students or teachers"
              aria-label="Search allocation records"
            />
          </div>
        </CardHeader>
        <CardBody className="allocation-workspace__body">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="allocation-tabs">
              <TabsTrigger value="students"><Users size={15} /> Students to Allocate</TabsTrigger>
              <TabsTrigger value="teachers"><UserRound size={15} /> Teacher Availability</TabsTrigger>
              <TabsTrigger value="records"><ClipboardList size={15} /> Allocation Records</TabsTrigger>
            </TabsList>

            <TabsContent value="students">
              <p className="allocation-tab-guidance">Select only students with an explicit unallocated status, then choose a suitable approved teacher.</p>
              <div className="allocation-toolbar">
                <div>
                  {studentSource && hasStudentAllocationStatus
                    ? <><strong>{filteredStudents.length}</strong> unallocated student records</>
                    : <strong>Student allocation status unavailable</strong>}
                  {selectedStudentIds.length > 0 && <span> · {selectedStudentIds.length} selected</span>}
                </div>
                <Button
                  size="sm"
                  disabled={!canOpenAllocationReview}
                  onClick={() => setAllocationPanelOpen(true)}
                >
                  <Workflow size={15} />
                  {isDemoPreview ? 'Preview Allocate Teacher' : 'Allocate Teacher'}
                </Button>
              </div>
              {isDemoPreview && <p className="allocation-source-note">Demo preview data only. No real allocation can be created or saved.</p>}
              <div className="allocation-table-wrap">
                <table className="allocation-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" checked={filteredStudents.length > 0 && filteredStudents.every((student) => selectedStudentIds.includes(student.id))} onChange={toggleAllStudents} aria-label="Select all students" /></th>
                      <th>Student</th><th>Class</th><th>Subjects</th><th>Locality</th><th>Preferred timing</th><th>Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" className="allocation-table__state">Loading student records…</td></tr>
                    ) : !studentSource && !isDemoPreview ? (
                      <tr><td colSpan="7" className="allocation-table__state"><strong>Live student allocation data is unavailable</strong><small>Session or fallback records are not shown here. Connect the student allocation API before selecting students.</small></td></tr>
                    ) : !hasStudentAllocationStatus && !isDemoPreview ? (
                      <tr><td colSpan="7" className="allocation-table__state"><strong>Student allocation status is not configured</strong><small>The backend does not currently identify which students are unallocated.</small></td></tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr><td colSpan="7" className="allocation-table__state"><strong>No unallocated students</strong><small>There are no eligible students waiting for a teacher.</small></td></tr>
                    ) : filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td><input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} aria-label={`Select ${student.name}`} /></td>
                        <td><strong>{student.name}</strong><small>{student.id}</small></td>
                        <td>{student.studentClass || '—'}</td>
                        <td>{student.subjects?.join(', ') || '—'}</td>
                        <td><MapPin size={14} /> {student.locality || '—'}</td>
                        <td>{student.preferredTiming || '—'}</td>
                        <td><Badge variant="neutral" size="sm">{isDemoPreview ? 'Demo preview' : student.allocationStatus}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="teachers">
              <p className="allocation-tab-guidance">Approved active teachers are listed here for review. Capacity and remaining seats appear only when configured by the backend.</p>
              <div className="allocation-toolbar"><div><strong>{filteredTeachers.length}</strong> approved active teacher records</div></div>
              {isDemoPreview && <p className="allocation-source-note">Demo preview teacher data only. Availability and capacity are not live.</p>}
              <div className="allocation-table-wrap">
                <table className="allocation-table">
                  <thead><tr><th>Teacher</th><th>Subject / classes</th><th>Locality</th><th>Availability</th><th>Active students</th><th>Max capacity</th><th>Remaining capacity</th><th>Status</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan="8" className="allocation-table__state">Loading teacher records…</td></tr> : !teacherSource && !isDemoPreview ? <tr><td colSpan="8" className="allocation-table__state"><strong>Live teacher availability is unavailable</strong><small>Session or fallback records are not shown as eligible teachers.</small></td></tr> : filteredTeachers.length === 0 ? <tr><td colSpan="8" className="allocation-table__state"><strong>No eligible teachers available</strong><small>Review teacher approval and active account status before allocating.</small></td></tr> : filteredTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td><strong>{teacher.name}</strong><small>{teacher.id}</small></td>
                        <td>{teacher.primarySubject || '—'}<small>{teacher.classLevels || 'Class range not configured'}</small></td>
                        <td><MapPin size={14} /> {teacher.locality || 'Not configured'}</td>
                        <td>{teacher.availability || 'Not configured'}</td>
                        <td>{teacher.studentAllocation?.allocatedCount ?? 0}</td>
                        <td>Not configured</td>
                        <td>Not configured</td>
                        <td><TeacherStatus teacher={teacher} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="records">
              <p className="allocation-tab-guidance">Review persisted student-teacher assignments and their lifecycle here.</p>
              <div className="allocation-capability-empty">
                <ClipboardList size={28} />
                <h3>Allocation records are not available yet</h3>
                <p>The backend currently stores only a teacher allocation count and status. It does not expose student-teacher assignment records or lifecycle actions.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardBody>
      </Card>

      {allocationPanelOpen && (
        <div className="allocation-panel-backdrop" role="presentation" onMouseDown={() => setAllocationPanelOpen(false)}>
          <section className="allocation-panel allocation-panel--form" role="dialog" aria-modal="true" aria-labelledby="allocation-panel-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className="allocation-panel__header">
              <div>
                <span className="allocation-page__eyebrow"><Workflow size={15} /> Allocation review</span>
                <h2 id="allocation-panel-title">Allocate Teacher</h2>
                <p>Review selected students and choose the most suitable teacher.</p>
              </div>
              <div className="allocation-panel__header-actions">
                <span className="allocation-panel__count">{selectedStudents.length} student{selectedStudents.length === 1 ? '' : 's'}</span>
                <button type="button" onClick={() => setAllocationPanelOpen(false)} aria-label="Close allocation review"><X size={20} /></button>
              </div>
            </header>

            <div className="allocation-panel__body">
              <div className="allocation-panel__notice">
                <AlertCircle size={17} />
                <span>{isDemoPreview ? 'Demo preview only. These records are not live and no assignment will be created or saved.' : 'This is a review-only workflow. The backend does not yet provide an assignment endpoint, capacity limit, or persisted student-teacher relationship.'}</span>
              </div>

              <div className="allocation-form-grid">
                <section className="allocation-form-section">
                  <div className="allocation-form-section__heading">
                    <div><span className="allocation-form-section__step">1</span><div><h3>Selected students</h3><p>These students will be reviewed for the same teacher.</p></div></div>
                    <Badge variant="neutral" size="sm">{selectedStudents.length} selected</Badge>
                  </div>
                  <div className="allocation-student-list">
                    {selectedStudents.length === 0 ? (
                      <div className="allocation-form-empty"><Users size={24} /><strong>No students selected</strong><span>Close this form and select at least one student from the table.</span></div>
                    ) : selectedStudents.map((student) => (
                      <div className="allocation-student-item" key={student.id}>
                        <div>
                          <strong>{student.name}</strong>
                          <small>{student.id} · {student.studentClass || 'Class not configured'}</small>
                          <span>{student.subjects?.join(', ') || 'Subjects not configured'} · {student.locality || 'Locality not configured'}</span>
                          <span>Preferred time: {student.preferredTiming || 'Not configured'} · Status: {student.allocationStatus || 'Unallocated'}</span>
                        </div>
                        <button type="button" onClick={() => removeSelectedStudent(student.id)} aria-label={`Remove ${student.name}`}><X size={15} /></button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="allocation-form-section">
                  <div className="allocation-form-section__heading">
                    <div><span className="allocation-form-section__step">2</span><div><h3>Choose a teacher</h3><p>Only approved active teachers from live data are shown.</p></div></div>
                  </div>
                  <div className="allocation-panel__search">
                    <Search size={16} aria-hidden="true" />
                    <input type="search" value={teacherSearch} onChange={(event) => setTeacherSearch(event.target.value)} placeholder="Search by name, subject, class or locality" aria-label="Search teachers" />
                  </div>
                  <div className="allocation-teacher-list">
                    {!teacherSource && !isDemoPreview ? (
                      <div className="allocation-form-empty"><UserRound size={24} /><strong>Live teacher data unavailable</strong><span>Fallback records are not eligible for allocation.</span></div>
                    ) : modalTeachers.length === 0 ? (
                      <div className="allocation-form-empty"><UserRound size={24} /><strong>No eligible teachers available</strong><span>Try another search or review teacher approval and active status.</span></div>
                    ) : modalTeachers.map((teacher) => {
                      const isSelected = selectedTeacherId === teacher.id
                      return (
                        <button type="button" className={`allocation-teacher-card${isSelected ? ' is-selected' : ''}`} key={teacher.id} onClick={() => setSelectedTeacherId(teacher.id)}>
                          <span className="allocation-teacher-card__radio">{isSelected && <span />}</span>
                          <span className="allocation-teacher-card__content">
                            <span className="allocation-teacher-card__top"><strong>{teacher.name}</strong><Badge variant={isDemoPreview ? 'neutral' : 'success'} size="sm">{isDemoPreview ? 'Demo preview' : 'Approved · Active'}</Badge></span>
                            <span className="allocation-teacher-card__meta">{teacher.id} · {teacher.primarySubject || 'Subject not configured'} · {teacher.classLevels || 'Classes not configured'}</span>
                            <span className="allocation-teacher-card__meta">{teacher.qualification || 'Qualification not configured'} · {teacher.experienceYears || 0} years experience</span>
                            <span className="allocation-teacher-card__meta"><MapPin size={13} /> {teacher.locality || 'Service locality not configured'} · {teacher.availability || 'Availability not configured'}</span>
                            <span className="allocation-teacher-card__capacity">{teacher.studentAllocation?.allocatedCount ?? 0} active students · Capacity: Not configured · Remaining: Not configured</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="allocation-form-section allocation-commercial-terms">
                  <div className="allocation-form-section__heading">
                    <div><span className="allocation-form-section__step">3</span><div><h3>Internal Commission Configuration</h3><p>CRM admin only. Configure internal terms for this demo allocation.</p></div></div>
                    <Badge variant="warning" size="sm">Proposed terms</Badge>
                  </div>
                  <div className="allocation-commercial-grid">
                    <label>Agreed monthly tuition fee (INR)<input type="number" min="0" value={commercialTerms.monthlyFee} onChange={(event) => setCommercialTerms((current) => ({ ...current, monthlyFee: event.target.value }))} /></label>
                    <label>Commission calculation type<select value="Percentage" disabled><option>Percentage</option></select></label>
                    <label>Wellfind commission percentage<input type="number" min="0" max="100" step="0.01" value={commercialTerms.commissionPercent} onChange={(event) => setCommercialTerms((current) => ({ ...current, commissionPercent: event.target.value }))} /></label>
                    <label>Teacher payout percentage<input value={`${calculatedTerms.teacherPayoutPercent}%`} readOnly /></label>
                    <label>Effective start date<input type="date" value={commercialTerms.effectiveDate} onChange={(event) => setCommercialTerms((current) => ({ ...current, effectiveDate: event.target.value }))} /></label>
                    <label>Internal notes (optional)<input value={commercialTerms.notes} onChange={(event) => setCommercialTerms((current) => ({ ...current, notes: event.target.value }))} placeholder="Add internal terms context" /></label>
                  </div>
                  {!termsAreValid && <p className="allocation-commercial-error" role="alert">Enter a non-negative fee and a commission percentage between 0% and 100%.</p>}
                  <div className="allocation-commercial-breakdown">
                    <div><span>Student monthly fee</span><strong>{currency.format(calculatedTerms.monthlyFee)}</strong></div>
                    <div><span>Wellfind commission ({calculatedTerms.commissionPercent}%)</span><strong>{currency.format(calculatedTerms.commissionAmount)}</strong></div>
                    <div><span>Teacher monthly share ({calculatedTerms.teacherPayoutPercent}%)</span><strong>{currency.format(calculatedTerms.teacherPayoutAmount)}</strong></div>
                  </div>
                  <p className="allocation-commercial-basis">Calculation basis: monthly fee × commission percentage. Teacher share is fee minus commission. Internal CRM tracking only.</p>
                </section>
              </div>

              <section className="allocation-match-summary">
                <div className="allocation-form-section__heading allocation-compatibility-heading"><div><span className="allocation-form-section__step">4</span><div><h3>Compatibility review</h3><p>Checks use only fields currently available in the data model.</p></div></div></div>
                {!selectedTeacher ? (
                  <div className="allocation-match-summary__empty">Select a teacher to review subject compatibility and configuration warnings.</div>
                ) : (
                  <div className="allocation-match-summary__content">
                    <div className="allocation-match-summary__teacher"><strong>{selectedTeacher.name}</strong><span>{selectedStudents.length} selected student{selectedStudents.length === 1 ? '' : 's'}</span></div>
                    {studentChecks.map(({ student, subjectMatch, classConfigured, localityConfigured, timingConfigured }) => (
                      <div className="allocation-check-row" key={student.id}>
                        <strong>{student.name}</strong>
                        <span className={subjectMatch ? 'is-pass' : 'is-warning'}>{subjectMatch ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} Subject {subjectMatch ? 'matches' : 'needs review'}</span>
                        <span className="is-warning"><AlertCircle size={14} /> Class eligibility {classConfigured ? 'requires review' : 'not configured'}</span>
                        <span className="is-warning"><AlertCircle size={14} /> {localityConfigured && timingConfigured ? 'Locality and timing require backend validation' : 'Locality/timing not fully configured'}</span>
                      </div>
                    ))}
                    <div className="allocation-match-summary__limitations"><AlertCircle size={15} /> Capacity limits, schedule conflicts, and persisted assignment validation are unavailable.</div>
                  </div>
                )}
              </section>
            </div>

            <footer className="allocation-panel__footer">
              <span className="allocation-panel__footer-note">Preview only — no assignment will be created or saved.</span>
              <div><Button variant="outline" onClick={() => setAllocationPanelOpen(false)}>Cancel</Button><Button disabled={!isDemoPreview || !selectedTeacher || selectedStudents.length === 0 || !termsAreValid}>Preview Allocation</Button></div>
            </footer>
          </section>
        </div>
      )}
    </main>
  )
}
