import { Alert } from '@/components/ui/Alert'
import { usePermissions } from '@/hooks/usePermissions'
import { PageLoader } from '@/components/ui/Loaders'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, CheckCircle2, Clock3, GraduationCap, RefreshCw, School, Search, UserCheck, Users, UserRound } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Chart } from '../../components/ui'
import { fetchStudents } from '../../services/studentService'
import { fetchTeachers } from '../../services/teacherService'
import { fetchStudentEnquiries } from '../../services/studentEnquiryService'
import { useAuth } from '../../hooks/useAuth'

const classCategories = ['Nursery', 'LKG', 'UKG', ...Array.from({ length: 10 }, (_, index) => `Class ${index + 1}`)]
const boardCategories = ['CBSE', 'ICSE', 'BSEB (Bihar Board)', 'Other', 'Not Specified']
const currency = new Intl.NumberFormat('en-IN')

function normalizeClass(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[-_]/g, ' ')
  if (['nursery', 'pre nursery', 'pre-nursery'].includes(normalized)) return 'Nursery'
  if (normalized === 'lkg') return 'LKG'
  if (normalized === 'ukg') return 'UKG'
  const match = normalized.match(/(?:class|grade|standard)?\s*(\d{1,2})/)
  return match ? `Class ${Number(match[1])}` : ''
}

function normalizeGender(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (['male', 'm', 'man'].includes(normalized)) return 'Male'
  if (['female', 'f', 'woman'].includes(normalized)) return 'Female'
  if (['other', 'non-binary', 'nonbinary'].includes(normalized)) return 'Other / Prefer not to say'
  return 'Unknown / Not provided'
}

function normalizeBoard(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized.includes('cbse')) return 'CBSE'
  if (normalized.includes('icse')) return 'ICSE'
  if (normalized.includes('bihar') || normalized.includes('bseb')) return 'BSEB (Bihar Board)'
  return normalized ? 'Other' : 'Not Specified'
}

function countBy(records, getValue, categories) {
  return categories.map((category) => records.filter((record) => getValue(record) === category).length)
}

function MetricCard({ icon: Icon, label, value, helper, tone = 'primary' }) {
  return (
    <Card className={`academic-metric-card academic-metric-card--${tone}`}>
      <CardBody>
        <span className="academic-metric-card__icon"><Icon size={18} /></span>
        <div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div>
      </CardBody>
    </Card>
  )
}

function SectionCard({ title, description, children, className = '' }) {
  return <Card className={`academic-section-card ${className}`}><CardHeader><div><h2>{title}</h2>{description && <p>{description}</p>}</div></CardHeader><CardBody>{children}</CardBody></Card>
}

function EmptyState({ children }) {
  return <div className="academic-empty-state"><Search size={22} /><strong>{children}</strong></div>
}

function DistributionChart({ title, records, getGender }) {
  const categories = ['Male', 'Female', 'Other / Prefer not to say', 'Unknown / Not provided']
  const values = countBy(records, getGender, categories)
  const knownTotal = values.slice(0, 3).reduce((sum, value) => sum + value, 0)
  const options = {
    chart: { type: 'donut', toolbar: { show: false } },
    labels: categories,
    colors: ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-border-strong)'],
    legend: { position: 'bottom', labels: { colors: 'var(--color-muted-foreground)' } },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: { pie: { donut: { size: '68%' } } },
    tooltip: { theme: 'dark', y: { formatter: (value) => `${value} records` } },
  }
  return <SectionCard title={title} description={knownTotal ? `${knownTotal} records with known gender` : 'Gender is not available in the current data model'}><div className="academic-chart-wrap">{records.length ? <Chart type="donut" series={values} options={options} height={260} /> : <EmptyState>No profile records available</EmptyState>}</div></SectionCard>
}

export default function Dashboard() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [sources, setSources] = useState({ students: false, teachers: false, enquiries: false })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [dateRange, setDateRange] = useState('30d')

  const { can } = usePermissions()
  const loadDashboard = useCallback(async (refresh = false) => {
    setError('')
    if (refresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [studentResult, teacherResult, enquiryResult] = await Promise.all([
        can('students') ? fetchStudents({ page: 1, limit: 100, status: 'active' }) : Promise.resolve(null),
        can('teachers') ? fetchTeachers({ page: 1, limit: 100 }) : Promise.resolve(null),
        can('student_inquiries') ? fetchStudentEnquiries({ page: 1, limit: 100, sort: '-createdAt' }) : Promise.resolve(null),
      ])
      setStudents(studentResult?.docs || [])
      setTeachers(teacherResult?.docs || [])
      setEnquiries(enquiryResult?.docs || [])
      setSources({
        students: Boolean(studentResult?.isRealApi),
        teachers: Boolean(teacherResult?.isRealApi),
        enquiries: Array.isArray(enquiryResult?.docs),
      })
    } catch (loadError) {
      setError(loadError?.message || 'Dashboard data could not be loaded.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [can])

  // Initial data loading synchronizes the dashboard with the existing API services.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadDashboard() }, [loadDashboard])

  const periodStart = useMemo(() => {
    const now = new Date()
    if (dateRange === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (dateRange === '7d') return new Date(now.getTime() - 6 * 86400000)
    if (dateRange === '30d') return new Date(now.getTime() - 29 * 86400000)
    if (dateRange === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
    if (dateRange === 'year') return new Date(now.getFullYear(), 0, 1)
    return null
  }, [dateRange])
  const inPeriod = (value) => !periodStart || (value && new Date(value) >= periodStart)
  const activeStudents = students.filter((student) => ['active', 'enrolled', 'in_progress'].includes(student.status))
  const activeTeachers = teachers.filter((teacher) => teacher.account?.status === 'active')
  const approvedTeachers = teachers.filter((teacher) => teacher.approvalStatus === 'approved')
  const allocatedStudents = new Set(teachers.flatMap((teacher) => teacher.studentAllocation?.students || []).map((student) => typeof student === 'object' ? student.id : student).filter(Boolean))
  const studentsAwaiting = students.filter((student) => student.allocationStatus === 'unallocated')
  const periodEnquiries = enquiries.filter((enquiry) => inPeriod(enquiry.createdAt || enquiry.submittedDate))
  const pendingEnquiries = periodEnquiries.filter((enquiry) => ['new', 'contacted', 'in_progress'].includes(enquiry.enquiryStatus))
  const convertedEnquiries = periodEnquiries.filter((enquiry) => enquiry.enquiryStatus === 'allocated' || enquiry.enquiryStatus === 'converted')
  const classValues = countBy(students, (student) => normalizeClass(student.studentClass), classCategories)
  const boardValues = countBy(students, (student) => normalizeBoard(student.board || student.educationBoard), boardCategories)
  const trendDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = date.toISOString().slice(0, 10)
    return { label: date.toLocaleDateString('en-IN', { weekday: 'short' }), value: enquiries.filter((enquiry) => String(enquiry.createdAt || '').slice(0, 10) === key).length }
  })

  const trendOptions = { chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit' }, colors: ['var(--color-primary)'], stroke: { curve: 'smooth', width: 3 }, fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.04 } }, dataLabels: { enabled: false }, xaxis: { categories: trendDays.map((day) => day.label) }, yaxis: { labels: { formatter: (value) => Math.round(value) } }, tooltip: { theme: 'dark', y: { formatter: (value) => `${value} enquiries` } }, grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 } }
  const classOptions = { chart: { type: 'bar', toolbar: { show: false } }, colors: ['var(--color-primary)'], plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } }, dataLabels: { enabled: false }, xaxis: { categories: classCategories, labels: { rotate: -45 } }, yaxis: { labels: { formatter: (value) => Math.round(value) } }, tooltip: { theme: 'dark', y: { formatter: (value) => `${value} students` } }, grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 } }
  const boardOptions = { chart: { type: 'donut', toolbar: { show: false } }, labels: boardCategories, colors: ['var(--color-primary)', 'var(--color-info)', 'var(--color-warning)', 'var(--color-success)', 'var(--color-border-strong)'], legend: { position: 'bottom', labels: { colors: 'var(--color-muted-foreground)' } }, dataLabels: { enabled: false }, stroke: { width: 0 }, plotOptions: { pie: { donut: { size: '68%' } } }, tooltip: { theme: 'dark', y: { formatter: (value) => `${value} students` } } }

  if (loading) return <PageLoader label="Loading dashboard…" />

  return (
    <div className="page__section academic-dashboard">
      <header className="page__header">
        <div className="page__headline"><h1 className="page__title">Welcome back, {user?.name || user?.firstName || 'Admin'} <span aria-hidden="true">👋</span></h1><p className="page__description">Here is your Wellfind Academic operations overview.</p></div>
        <div className="academic-dashboard__actions"><select value={dateRange} onChange={(event) => setDateRange(event.target.value)} aria-label="Dashboard date range"><option value="today">Today</option><option value="7d">Last 7 Days</option><option value="30d">Last 30 Days</option><option value="month">This Month</option><option value="year">This Year</option></select><Button variant="outline" size="sm" onClick={() => void loadDashboard(true)} loading={refreshing}><RefreshCw size={15} /> Refresh</Button></div>
      </header>
      {error && <Alert variant="error" title={error} />}
      <div className="academic-data-note"><School size={16} /><span>CRM metrics use available records. Website analytics, gender, board, and capacity data are shown as unavailable when the source fields or secure integration are missing.</span></div>

      <section className="academic-metric-grid">
        <MetricCard icon={Users} label="Total Students" value={sources.students ? currency.format(students.length) : 'Unavailable'} helper={sources.students ? 'Live CRM records' : 'Live data unavailable'} />
        <MetricCard icon={UserCheck} label="Active Students" value={sources.students ? currency.format(activeStudents.length) : 'Unavailable'} helper="Active, enrolled, or in progress" tone="success" />
        <MetricCard icon={UserRound} label="Total Teachers" value={sources.teachers ? currency.format(teachers.length) : 'Unavailable'} helper={sources.teachers ? 'Approved profiles source' : 'Live data unavailable'} tone="info" />
        <MetricCard icon={CheckCircle2} label="Active Teachers" value={sources.teachers ? currency.format(activeTeachers.length) : 'Unavailable'} helper={`${approvedTeachers.length} approved`} tone="success" />
        <MetricCard icon={GraduationCap} label="Active Studies" value={sources.teachers ? currency.format(allocatedStudents.size) : 'Unavailable'} helper="Unique allocated students" tone="primary" />
        <MetricCard icon={Clock3} label="Students Awaiting Allocation" value={sources.students ? currency.format(studentsAwaiting.length) : 'Unavailable'} helper="Explicit unallocated status" tone="warning" />
        <MetricCard icon={CalendarDays} label="Today's Enquiries" value={sources.enquiries ? currency.format(enquiries.filter((enquiry) => String(enquiry.createdAt || '').slice(0, 10) === new Date().toISOString().slice(0, 10)).length) : 'Unavailable'} helper="Received today" tone="info" />
        <MetricCard icon={Clock3} label="Pending Enquiries" value={sources.enquiries ? currency.format(pendingEnquiries.length) : 'Unavailable'} helper="New, contacted, or in progress" tone="warning" />
      </section>

      <section className="academic-dashboard-grid academic-dashboard-grid--two">
        <SectionCard title="Students by Class" description="Normalized from the student class field."><Chart type="bar" series={[{ name: 'Students', data: classValues }]} options={classOptions} height={300} /></SectionCard>
        <SectionCard title="Students by Board" description="Board values are mapped without changing stored records."><Chart type="donut" series={boardValues} options={boardOptions} height={300} /></SectionCard>
      </section>
      <section className="academic-dashboard-grid academic-dashboard-grid--two">
        <DistributionChart title="Student Gender Distribution" records={students} getGender={(student) => normalizeGender(student.gender)} />
        <DistributionChart title="Teacher Gender Distribution" records={teachers} getGender={(teacher) => normalizeGender(teacher.gender)} />
      </section>
      <section className="academic-dashboard-grid academic-dashboard-grid--analytics">
        <SectionCard title="Daily Enquiry Trend" description="CRM enquiries received in the recent seven-day window."><Chart type="area" series={[{ name: 'Enquiries', data: trendDays.map((day) => day.value) }]} options={trendOptions} height={250} /></SectionCard>
      </section>
      <SectionCard title="Recent Enquiries" description="Latest enquiry records from the CRM." className="academic-recent-enquiries">
        <div className="academic-table-wrap"><table className="academic-table"><thead><tr><th>Enquiry ID</th><th>Student</th><th>Class</th><th>Subjects</th><th>Enquiry Date</th><th>Status</th><th>Assigned Teacher</th><th>Action</th></tr></thead><tbody>{loading ? <tr><td colSpan="8" className="academic-table__state">Loading enquiries…</td></tr> : !sources.enquiries ? <tr><td colSpan="8" className="academic-table__state">Enquiry data unavailable.</td></tr> : periodEnquiries.length === 0 ? <tr><td colSpan="8" className="academic-table__state">No enquiries found for the selected period.</td></tr> : periodEnquiries.slice(0, 8).map((enquiry) => <tr key={enquiry.id}><td><Link to={`/admin/student-enquiries/${enquiry.id}`}>{enquiry.id}</Link></td><td><strong>{enquiry.name || 'Not provided'}</strong></td><td>{enquiry.studentClass || 'Not provided'}</td><td>{Array.isArray(enquiry.subjects) ? enquiry.subjects.join(', ') : enquiry.subjects || 'Not provided'}</td><td>{enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleDateString('en-IN') : 'Not provided'}</td><td><Badge variant={enquiry.enquiryStatus === 'allocated' ? 'success' : enquiry.enquiryStatus === 'closed' ? 'neutral' : 'warning'} size="sm">{enquiry.enquiryStatus || 'Not provided'}</Badge></td><td>{enquiry.assignedTo?.name || 'Unassigned'}</td><td><Link className="academic-view-link" to={`/admin/student-enquiries/${enquiry.id}`}>View</Link></td></tr>)}</tbody></table></div><div className="academic-table-footer"><Link to="/admin/inquiries">View all enquiries</Link><span>{convertedEnquiries.length} converted in selected period</span></div>
      </SectionCard>
    </div>
  )
}
