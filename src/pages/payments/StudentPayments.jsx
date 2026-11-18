import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownToLine,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  IndianRupee,
  Plus,
  RefreshCw,
  Search,
  X,
  WalletCards,
  XCircle,
} from 'lucide-react'
import { Badge, Button, Card, CardBody } from '../../components/ui'

const students = [
  { id: 'STU-1001', name: 'Aarav Sharma', className: 'Class 10', feeBalance: 18000 },
  { id: 'STU-1002', name: 'Ananya Mehta', className: 'Class 8', feeBalance: 12000 },
  { id: 'STU-1003', name: 'Kabir Singh', className: 'Class 12', feeBalance: 24000 },
  { id: 'STU-1004', name: 'Diya Patel', className: 'Class 6', feeBalance: 9000 },
]

const initialPayments = [
  { id: 'PAY-26001', studentId: 'STU-1001', date: '2026-10-08', academicYear: '2026-27', type: 'Tuition fee', amount: 15000, method: 'UPI', reference: 'UPI-AX91K2', status: 'Completed', recordedAt: '2026-10-08T10:15:00', notes: 'First instalment' },
  { id: 'PAY-26002', studentId: 'STU-1002', date: '2026-10-04', academicYear: '2026-27', type: 'Tuition fee', amount: 10000, method: 'Bank Transfer', reference: 'NEFT-BC7721', status: 'Completed', recordedAt: '2026-10-04T14:20:00', notes: '' },
  { id: 'PAY-26003', studentId: 'STU-1003', date: '2026-09-18', academicYear: '2026-27', type: 'Admission fee', amount: 8000, method: 'Card', reference: 'CARD-9F31Q', status: 'Completed', recordedAt: '2026-09-18T09:05:00', notes: 'Admission processing' },
  { id: 'PAY-26004', studentId: 'STU-1001', date: '2026-08-12', academicYear: '2026-26', type: 'Tuition fee', amount: 12000, method: 'Cash', reference: 'CASH-260812', status: 'Completed', recordedAt: '2026-08-12T11:40:00', notes: '' },
  { id: 'PAY-26005', studentId: 'STU-1004', date: '2026-10-12', academicYear: '2026-27', type: 'Tuition fee', amount: 6000, method: 'UPI', reference: 'UPI-PENDING4', status: 'Pending', recordedAt: '2026-10-12T16:30:00', notes: 'Awaiting confirmation' },
  { id: 'PAY-26006', studentId: 'STU-1003', date: '2026-10-10', academicYear: '2026-27', type: 'Tuition fee', amount: 12000, method: 'Bank Transfer', reference: 'NEFT-FAILED8', status: 'Failed', recordedAt: '2026-10-10T12:10:00', notes: 'Bank response pending' },
  { id: 'PAY-26007', studentId: 'STU-1002', date: '2025-12-20', academicYear: '2025-26', type: 'Tuition fee', amount: 7000, method: 'Card', reference: 'CARD-REF22', status: 'Refunded', recordedAt: '2025-12-20T13:00:00', notes: 'Refunded on request' },
  { id: 'PAY-26008', studentId: 'STU-1004', date: '2026-07-05', academicYear: '2026-27', type: 'Materials fee', amount: 2500, method: 'Other', reference: 'MAT-260705', status: 'Completed', recordedAt: '2026-07-05T10:00:00', notes: 'Course materials' },
]

const months = [
  ['01', 'January'], ['02', 'February'], ['03', 'March'], ['04', 'April'],
  ['05', 'May'], ['06', 'June'], ['07', 'July'], ['08', 'August'],
  ['09', 'September'], ['10', 'October'], ['11', 'November'], ['12', 'December'],
]
const years = ['2026', '2025']
const statuses = ['All', 'Completed', 'Pending', 'Failed', 'Refunded']
const methods = ['All', 'UPI', 'Cash', 'Bank Transfer', 'Card', 'Other']

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const formatDate = (date) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
const studentFor = (id) => students.find((student) => student.id === id)

function statusVariant(status) {
  return { Completed: 'success', Pending: 'warning', Failed: 'danger', Refunded: 'info' }[status] || 'neutral'
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  return (
    <Card className={`payments-summary-card payments-summary-card--${tone}`}>
      <CardBody>
        <div className="payments-summary-card__icon"><Icon size={19} /></div>
        <div><span>{label}</span><strong>{value}</strong></div>
      </CardBody>
    </Card>
  )
}

function Modal({ title, description, children, onClose, className = '' }) {
  return (
    <div className="payments-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`payments-modal ${className}`} role="dialog" aria-modal="true" aria-labelledby="payments-modal-title">
        <header className="payments-modal__header">
          <div><h2 id="payments-modal-title">{title}</h2><p>{description}</p></div>
          <button type="button" className="payments-modal__close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        {children}
      </section>
    </div>
  )
}

export default function StudentPayments() {
  const [payments, setPayments] = useState(initialPayments)
  const [filters, setFilters] = useState({ query: '', month: '10', year: '2026', status: 'All', method: 'All', from: '', to: '' })
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [recordOpen, setRecordOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('8')
  const [historyFilters, setHistoryFilters] = useState({ query: '', month: 'All', year: 'All' })
  const [form, setForm] = useState({ studentId: '', academicYear: '2026-27', type: 'Tuition fee', amount: '', date: '2026-10-30', method: 'UPI', reference: '', status: 'Completed', notes: '' })
  const [formError, setFormError] = useState('')

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const student = studentFor(payment.studentId)
    const haystack = `${student?.name || ''} ${payment.studentId} ${payment.reference}`.toLowerCase()
    return (!filters.query || haystack.includes(filters.query.toLowerCase()))
      && (filters.month === 'All' || payment.date.slice(5, 7) === filters.month)
      && (filters.year === 'All' || payment.date.slice(0, 4) === filters.year)
      && (filters.status === 'All' || payment.status === filters.status)
      && (filters.method === 'All' || payment.method === filters.method)
      && (!filters.from || payment.date >= filters.from)
      && (!filters.to || payment.date <= filters.to)
  }), [filters, payments])

  const metrics = useMemo(() => {
    const visibleStudentIds = new Set(filteredPayments.map((payment) => payment.studentId))
    return {
      collected: filteredPayments.filter((payment) => payment.status === 'Completed').reduce((sum, payment) => sum + payment.amount, 0),
      pending: filteredPayments.filter((payment) => payment.status === 'Pending').reduce((sum, payment) => sum + payment.amount, 0),
      outstanding: students.filter((student) => visibleStudentIds.has(student.id)).reduce((sum, student) => sum + Math.max(student.feeBalance - payments.filter((payment) => payment.studentId === student.id && payment.status === 'Completed').reduce((paid, payment) => paid + payment.amount, 0), 0), 0),
      count: filteredPayments.length,
    }
  }, [filteredPayments, payments])

  const pageCount = Math.max(1, Math.ceil(filteredPayments.length / Number(pageSize)))
  const pagePayments = filteredPayments.slice((page - 1) * Number(pageSize), page * Number(pageSize))
  const selectedStudent = selectedPayment && studentFor(selectedPayment.studentId)
  const selectedHistory = selectedPayment
    ? payments.filter((payment) => {
      if (payment.studentId !== selectedPayment.studentId) return false
      const student = studentFor(payment.studentId)
      return (!historyFilters.query || `${student?.name} ${payment.reference} ${payment.type}`.toLowerCase().includes(historyFilters.query.toLowerCase()))
        && (historyFilters.month === 'All' || payment.date.slice(5, 7) === historyFilters.month)
        && (historyFilters.year === 'All' || payment.date.slice(0, 4) === historyFilters.year)
    }).sort((a, b) => b.date.localeCompare(a.date))
    : []

  const updateFilter = (key, value) => {
    setPage(1)
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const exportCsv = () => {
    const headers = ['Demo Data', 'Student', 'Student ID', 'Payment Date', 'Academic Year', 'Fee / Payment Type', 'Amount (INR)', 'Payment Method', 'Transaction Reference', 'Status']
    const rows = filteredPayments.map((payment) => [studentFor(payment.studentId)?.name, payment.studentId, payment.date, payment.academicYear, payment.type, payment.amount, payment.method, payment.reference, payment.status])
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'student-payments-demo-data.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const submitPayment = (event) => {
    event.preventDefault()
    if (!form.studentId || !form.amount || Number(form.amount) <= 0 || !form.date || !form.reference.trim()) {
      setFormError('Select a student and enter a valid amount, date, and transaction reference.')
      return
    }
    setPayments((current) => [{
      ...form,
      id: `DEMO-${Date.now()}`,
      amount: Number(form.amount),
      reference: form.reference.trim(),
      recordedAt: new Date().toISOString(),
    }, ...current])
    setFormError('')
    setRecordOpen(false)
    setForm((current) => ({ ...current, studentId: '', amount: '', reference: '', notes: '' }))
  }

  return (
    <div className="page__section payments-page">
      <header className="page__header">
        <div className="page__headline">
          <nav aria-label="breadcrumb"><ol className="breadcrumb"><li className="breadcrumb__item"><Link to="/admin">Dashboard</Link></li><li className="breadcrumb__item" aria-current="page">Student Payments</li></ol></nav>
          <h1 className="page__title">Student Payments <Badge variant="info" size="sm">Demo Data</Badge></h1>
          <p className="page__description">Track student fee payments, transaction history, and outstanding balances.</p>
        </div>
        <div className="page__action payments-page__actions">
          <Button variant="outline" onClick={() => setFilters({ query: '', month: '10', year: '2026', status: 'All', method: 'All', from: '', to: '' })}><RefreshCw size={15} /> Refresh</Button>
          <Button variant="outline" onClick={exportCsv}><ArrowDownToLine size={15} /> Export</Button>
          <Button onClick={() => setRecordOpen(true)}><Plus size={16} /> Record Payment</Button>
        </div>
      </header>
      <div className="payments-demo-banner"><FileText size={16} /><span>Demo only — payment records are held in memory and are not saved to the backend.</span></div>

      <section className="payments-summary-grid" aria-label="Payment summary">
        <SummaryCard icon={IndianRupee} label="Total Collected" value={currency.format(metrics.collected)} tone="success" />
        <SummaryCard icon={Clock3} label="Pending Payments" value={currency.format(metrics.pending)} tone="warning" />
        <SummaryCard icon={WalletCards} label="Outstanding Balance" value={currency.format(metrics.outstanding)} tone="primary" />
        <SummaryCard icon={CalendarDays} label="Transactions in Period" value={metrics.count.toLocaleString('en-IN')} tone="info" />
      </section>

      <Card variant="bordered" className="payments-panel">
        <div className="payments-filters">
          <label className="payments-filter payments-filter--search"><span>Search</span><div><Search size={16} /><input value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} placeholder="Student, ID or reference" /></div></label>
          <label className="payments-filter"><span>Month</span><select value={filters.month} onChange={(event) => updateFilter('month', event.target.value)}><option value="All">All months</option>{months.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="payments-filter"><span>Year</span><select value={filters.year} onChange={(event) => updateFilter('year', event.target.value)}><option value="All">All years</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
          <label className="payments-filter"><span>Status</span><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="payments-filter"><span>Method</span><select value={filters.method} onChange={(event) => updateFilter('method', event.target.value)}>{methods.map((method) => <option key={method}>{method}</option>)}</select></label>
          <label className="payments-filter"><span>From</span><input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} /></label>
          <label className="payments-filter"><span>To</span><input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} /></label>
          <Button variant="ghost" size="sm" onClick={() => setFilters({ query: '', month: '10', year: '2026', status: 'All', method: 'All', from: '', to: '' })}>Clear Filters</Button>
        </div>
        <div className="payments-table-heading"><div><h2>Payment history</h2><p>{filteredPayments.length} demo transaction{filteredPayments.length === 1 ? '' : 's'} match the current filters.</p></div><label className="payments-page-size">Rows <select value={pageSize} onChange={(event) => { setPage(1); setPageSize(event.target.value) }}><option>8</option><option>5</option><option>20</option></select></label></div>
        <div className="payments-table-wrap">
          <table className="payments-table">
            <thead><tr><th>Student</th><th>Student ID</th><th>Payment Date</th><th>Academic Year</th><th>Fee / Payment Type</th><th>Amount</th><th>Payment Method</th><th>Transaction Reference</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{pagePayments.length === 0 ? <tr><td colSpan="10" className="payments-empty"><WalletCards size={28} /><strong>No payment records match these filters</strong><span>Try clearing a filter or selecting another period.</span></td></tr> : pagePayments.map((payment) => {
              const student = studentFor(payment.studentId)
              return <tr key={payment.id} onClick={() => { setSelectedPayment(payment); setHistoryFilters({ query: '', month: 'All', year: 'All' }) }}><td><strong>{student?.name}</strong><small>{student?.className}</small></td><td>{payment.studentId}</td><td>{formatDate(payment.date)}</td><td>{payment.academicYear}</td><td>{payment.type}</td><td className="payments-amount">{currency.format(payment.amount)}</td><td>{payment.method}</td><td><code>{payment.reference}</code></td><td><Badge variant={statusVariant(payment.status)} dot size="sm">{payment.status}</Badge></td><td><Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); setSelectedPayment(payment) }}><Eye size={14} /> View Details</Button></td></tr>
            })}</tbody>
          </table>
        </div>
        <div className="payments-pagination"><span>Showing {pagePayments.length ? (page - 1) * Number(pageSize) + 1 : 0}–{Math.min(page * Number(pageSize), filteredPayments.length)} of {filteredPayments.length}</span><div><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={15} /></Button><span>Page {page} of {pageCount}</span><Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}><ChevronRight size={15} /></Button></div></div>
      </Card>

      {selectedPayment && <Modal title="Payment details" description="Demo transaction and student payment history." onClose={() => setSelectedPayment(null)} className="payments-modal--details">
        <div className="payments-detail-summary"><div><span>Student</span><strong>{selectedStudent?.name}</strong><small>{selectedPayment.studentId} · {selectedStudent?.className}</small></div><div><span>Amount</span><strong>{currency.format(selectedPayment.amount)}</strong><Badge variant={statusVariant(selectedPayment.status)} dot>{selectedPayment.status}</Badge></div></div>
        <div className="payments-detail-grid">{[['Payment date', formatDate(selectedPayment.date)], ['Academic year', selectedPayment.academicYear], ['Payment type', selectedPayment.type], ['Payment method', selectedPayment.method], ['Transaction reference', selectedPayment.reference], ['Recorded timestamp', new Date(selectedPayment.recordedAt).toLocaleString('en-IN')]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
        {selectedPayment.notes && <div className="payments-notes"><strong>Notes</strong><p>{selectedPayment.notes}</p></div>}
        <div className="payments-history"><div className="payments-history__heading"><div><h3>Student payment history</h3><p>Newest transactions appear first.</p></div><div className="payments-history__filters"><input aria-label="Search student history" placeholder="Search history" value={historyFilters.query} onChange={(event) => setHistoryFilters((current) => ({ ...current, query: event.target.value }))} /><select aria-label="History month" value={historyFilters.month} onChange={(event) => setHistoryFilters((current) => ({ ...current, month: event.target.value }))}><option>All</option>{months.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select aria-label="History year" value={historyFilters.year} onChange={(event) => setHistoryFilters((current) => ({ ...current, year: event.target.value }))}><option>All</option>{years.map((year) => <option key={year}>{year}</option>)}</select></div></div><div className="payments-history__stats"><span><strong>{currency.format(selectedHistory.filter((item) => item.status === 'Completed').reduce((sum, item) => sum + item.amount, 0))}</strong> completed</span><span><strong>{currency.format(Math.max((selectedStudent?.feeBalance || 0) - selectedHistory.filter((item) => item.status === 'Completed').reduce((sum, item) => sum + item.amount, 0), 0))}</strong> outstanding</span><span><strong>{selectedHistory.length}</strong> transactions</span></div>{selectedHistory.map((payment) => <div className="payments-history__row" key={payment.id}><div><strong>{payment.type}</strong><small>{formatDate(payment.date)} · {payment.method} · {payment.reference}</small></div><div><strong>{currency.format(payment.amount)}</strong><Badge variant={statusVariant(payment.status)} size="sm">{payment.status}</Badge></div></div>)}</div>
      </Modal>}

      {recordOpen && <Modal title="Record payment" description="Add a temporary demo transaction for UI preview." onClose={() => { setRecordOpen(false); setFormError('') }} className="payments-modal--record">
        <form onSubmit={submitPayment}><div className="payments-form-notice"><FileText size={16} /><span>Demo only — not saved to the backend or sent to a payment provider.</span></div><div className="payments-form-grid">
          <label>Student<select value={form.studentId} onChange={(event) => setForm((current) => ({ ...current, studentId: event.target.value }))}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.id}</option>)}</select></label>
          <label>Student ID<input value={form.studentId || 'Select a student first'} readOnly /></label>
          <label>Academic year<select value={form.academicYear} onChange={(event) => setForm((current) => ({ ...current, academicYear: event.target.value }))}><option>2026-27</option><option>2025-26</option></select></label>
          <label>Fee / payment type<select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}><option>Tuition fee</option><option>Admission fee</option><option>Materials fee</option><option>Other</option></select></label>
          <label>Amount (INR)<input type="number" min="1" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="e.g. 12000" /></label>
          <label>Payment date<input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} /></label>
          <label>Payment method<select value={form.method} onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}>{methods.slice(1).map((method) => <option key={method}>{method}</option>)}</select></label>
          <label>Transaction reference<input value={form.reference} onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))} placeholder="e.g. UPI-DEMO-001" /></label>
          <label>Payment status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>{statuses.slice(1).map((status) => <option key={status}>{status}</option>)}</select></label>
          <label className="payments-form-grid__wide">Notes (optional)<textarea rows="3" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Add context for this demo record" /></label>
        </div>{formError && <p className="payments-form-error" role="alert"><XCircle size={16} />{formError}</p>}<footer className="payments-modal__footer"><Button variant="outline" onClick={() => setRecordOpen(false)}>Cancel</Button><Button type="submit"><Plus size={15} /> Add Demo Payment</Button></footer></form>
      </Modal>}
    </div>
  )
}
