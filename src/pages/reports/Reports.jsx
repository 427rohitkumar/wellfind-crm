import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownToLine, BarChart3, CalendarDays, Clock3, IndianRupee,
  RefreshCw, TrendingDown, TrendingUp, Users, WalletCards,
} from 'lucide-react'
import { Badge, Button, Card, CardBody, Chart } from '../../components/ui'
import { commissionDemoAssignments } from '../../data/commissionDemoData'

const demoTransactions = [
  { id: 'SP-26001', date: '2026-01-08', category: 'Student payments', party: 'Aarav Sharma', reference: 'UPI-AX91K2', amount: 15000, status: 'Completed', route: '/admin/student-payments' },
  { id: 'SP-26002', date: '2026-02-04', category: 'Student payments', party: 'Ananya Mehta', reference: 'NEFT-BC7721', amount: 10000, status: 'Completed', route: '/admin/student-payments' },
  { id: 'SP-26003', date: '2026-03-18', category: 'Student payments', party: 'Kabir Singh', reference: 'CARD-9F31Q', amount: 8000, status: 'Completed', route: '/admin/student-payments' },
  { id: 'SP-26004', date: '2026-04-12', category: 'Student payments', party: 'Diya Patel', reference: 'UPI-DP4412', amount: 6000, status: 'Completed', route: '/admin/student-payments' },
  { id: 'SP-26005', date: '2026-05-10', category: 'Student payments', party: 'Aarav Sharma', reference: 'CASH-AS0510', amount: 12000, status: 'Completed', route: '/admin/student-payments' },
  { id: 'SP-26006', date: '2026-06-14', category: 'Student payments', party: 'Ananya Mehta', reference: 'UPI-AM0614', amount: 7000, status: 'Pending', route: '/admin/student-payments' },
  { id: 'SP-26007', date: '2026-07-05', category: 'Student payments', party: 'Diya Patel', reference: 'MAT-DP0705', amount: 2500, status: 'Completed', route: '/admin/student-payments' },
  { id: 'SP-26008', date: '2026-08-22', category: 'Student payments', party: 'Kabir Singh', reference: 'CARD-KS0822', amount: 12000, status: 'Refunded', route: '/admin/student-payments' },
  { id: 'SP-26009', date: '2026-09-18', category: 'Student payments', party: 'Kabir Singh', reference: 'CARD-KS0918', amount: 8000, status: 'Completed', route: '/admin/student-payments' },
  { id: 'SP-26010', date: '2026-10-08', category: 'Student payments', party: 'Aarav Sharma', reference: 'UPI-AS1008', amount: 15000, status: 'Completed', route: '/admin/student-payments' },
  { id: 'RF-26001', date: '2026-04-04', category: 'Teacher registration fees', party: 'Priya Nair', reference: 'REG-PR-2601', amount: 5000, status: 'Received', route: '/admin/teacher-payments' },
  { id: 'RF-26002', date: '2026-04-08', category: 'Teacher registration fees', party: 'Rohan Kapoor', reference: 'REG-RK-2602', amount: 2500, status: 'Received', route: '/admin/teacher-payments' },
  { id: 'RF-26003', date: '2026-06-15', category: 'Teacher registration fees', party: 'Meera Iyer', reference: 'REG-MI-2603', amount: 5000, status: 'Received', route: '/admin/teacher-payments' },
  { id: 'RF-26004', date: '2026-09-11', category: 'Teacher registration fees', party: 'Arjun Malhotra', reference: 'REG-AM-2604', amount: 4500, status: 'Received', route: '/admin/teacher-payments' },
  { id: 'PO-26001', date: '2026-01-31', category: 'Teacher payouts', party: 'Priya Nair', reference: 'PAY-PR-0101', amount: 21000, status: 'Paid', route: '/admin/teacher-payments' },
  { id: 'PO-26002', date: '2026-02-28', category: 'Teacher payouts', party: 'Rohan Kapoor', reference: 'PAY-RK-0202', amount: 18000, status: 'Paid', route: '/admin/teacher-payments' },
  { id: 'PO-26003', date: '2026-03-31', category: 'Teacher payouts', party: 'Meera Iyer', reference: 'PAY-MI-0303', amount: 22000, status: 'Paid', route: '/admin/teacher-payments' },
  { id: 'PO-26004', date: '2026-04-30', category: 'Teacher payouts', party: 'Arjun Malhotra', reference: 'PAY-AM-0404', amount: 15000, status: 'Paid', route: '/admin/teacher-payments' },
  { id: 'PO-26005', date: '2026-05-31', category: 'Teacher payouts', party: 'Priya Nair', reference: 'PAY-PR-0501', amount: 24000, status: 'Paid', route: '/admin/teacher-payments' },
  { id: 'PO-26006', date: '2026-06-30', category: 'Teacher payouts', party: 'Rohan Kapoor', reference: 'PAY-RK-0602', amount: 18000, status: 'Pending', route: '/admin/teacher-payments' },
  { id: 'PO-26007', date: '2026-07-31', category: 'Teacher payouts', party: 'Meera Iyer', reference: 'PAY-MI-0703', amount: 22000, status: 'Paid', route: '/admin/teacher-payments' },
  { id: 'PO-26008', date: '2026-08-31', category: 'Teacher payouts', party: 'Arjun Malhotra', reference: 'PAY-AM-0804', amount: 15000, status: 'Paid', route: '/admin/teacher-payments' },
  { id: 'PO-26009', date: '2026-09-30', category: 'Teacher payouts', party: 'Priya Nair', reference: 'PAY-PR-0901', amount: 24000, status: 'Paid', route: '/admin/teacher-payments' },
  { id: 'PO-26010', date: '2026-10-10', category: 'Teacher payouts', party: 'Rohan Kapoor', reference: 'PAY-RK-1002', amount: 18000, status: 'Pending', route: '/admin/teacher-payments' },
]

const studentBalances = [
  { student: 'Aarav Sharma', date: '2026-01-08', balance: 3000 },
  { student: 'Ananya Mehta', date: '2026-02-04', balance: 2000 },
  { student: 'Kabir Singh', date: '2026-03-18', balance: 4000 },
  { student: 'Diya Patel', date: '2026-04-12', balance: 3000 },
]
const months = [['01', 'Jan'], ['02', 'Feb'], ['03', 'Mar'], ['04', 'Apr'], ['05', 'May'], ['06', 'Jun'], ['07', 'Jul'], ['08', 'Aug'], ['09', 'Sep'], ['10', 'Oct'], ['11', 'Nov'], ['12', 'Dec']]
const categories = ['All', 'Student payments', 'Teacher registration fees', 'Teacher payouts']
const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const formatDate = (date) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
const statusVariant = (status) => ({ Completed: 'success', Received: 'success', Paid: 'primary', Pending: 'warning', Refunded: 'info', Failed: 'danger' }[status] || 'neutral')

function SummaryCard({ icon: Icon, label, value, tone, helper }) {
  return <Card className={`payout-summary-card payout-summary-card--${tone}`}><CardBody><div className="payout-summary-card__icon"><Icon size={19} /></div><div><span>{label}</span><strong>{value}</strong><small>{helper}</small></div></CardBody></Card>
}

const chartBase = {
  chart: { toolbar: { show: false }, fontFamily: 'inherit', foreColor: 'var(--color-muted-foreground)' },
  grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
  dataLabels: { enabled: false },
  legend: { position: 'bottom', labels: { colors: 'var(--color-muted-foreground)' } },
  tooltip: { theme: 'dark', y: { formatter: (value) => currency.format(value) } },
}

export default function Reports() {
  const [filters, setFilters] = useState({ month: 'All', year: '2026', category: 'All', from: '', to: '' })
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const filteredTransactions = useMemo(() => demoTransactions.filter((transaction) => {
    return (filters.month === 'All' || transaction.date.slice(5, 7) === filters.month)
      && (filters.year === 'All' || transaction.date.startsWith(filters.year))
      && (filters.category === 'All' || transaction.category === filters.category)
      && (!filters.from || transaction.date >= filters.from)
      && (!filters.to || transaction.date <= filters.to)
  }), [filters])
  const receivedStudents = filteredTransactions.filter((item) => item.category === 'Student payments' && item.status === 'Completed').reduce((sum, item) => sum + item.amount, 0)
  const receivedRegistration = filteredTransactions.filter((item) => item.category === 'Teacher registration fees' && item.status === 'Received').reduce((sum, item) => sum + item.amount, 0)
  const paidTeachers = filteredTransactions.filter((item) => item.category === 'Teacher payouts' && item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0)
  const pendingPayouts = filteredTransactions.filter((item) => item.category === 'Teacher payouts' && item.status === 'Pending').reduce((sum, item) => sum + item.amount, 0)
  const outstandingStudentFees = (filters.category === 'All' || filters.category === 'Student payments')
    ? studentBalances.filter((item) => (filters.month === 'All' || item.date.slice(5, 7) === filters.month)
      && (filters.year === 'All' || item.date.startsWith(filters.year))
      && (!filters.from || item.date >= filters.from)
      && (!filters.to || item.date <= filters.to))
      .reduce((sum, item) => sum + item.balance, 0)
    : 0
  const commissionEligible = filteredTransactions.filter((item) => item.category === 'Student payments' && item.status === 'Completed')
  const commissionEarned = commissionEligible.reduce((sum, transaction) => {
    const assignment = commissionDemoAssignments.find((item) => item.studentName === transaction.party)
    return sum + (assignment ? transaction.amount * assignment.commissionPercent / 100 : 0)
  }, 0)
  const commissionAwaiting = filteredTransactions.filter((item) => item.category === 'Student payments' && item.status === 'Pending').reduce((sum, transaction) => {
    const assignment = commissionDemoAssignments.find((item) => item.studentName === transaction.party)
    return sum + (assignment ? transaction.amount * assignment.commissionPercent / 100 : 0)
  }, 0)
  const monthlyData = months.map(([value, label]) => {
    const records = filteredTransactions.filter((item) => item.date.slice(5, 7) === value)
    return {
      label,
      students: records.filter((item) => item.category === 'Student payments' && item.status === 'Completed').reduce((sum, item) => sum + item.amount, 0),
      registration: records.filter((item) => item.category === 'Teacher registration fees' && item.status === 'Received').reduce((sum, item) => sum + item.amount, 0),
      payouts: records.filter((item) => item.category === 'Teacher payouts' && item.status === 'Paid').reduce((sum, item) => sum + item.amount, 0),
    }
  })
  const recent = [...filteredTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)
  const statusCounts = ['Completed', 'Received', 'Paid', 'Pending', 'Refunded', 'Failed'].map((status) => ({ status, count: filteredTransactions.filter((item) => item.status === status).length })).filter((item) => item.count)
  const trendsConfig = { type: 'line', height: 320, series: [{ name: 'Student payments received', data: monthlyData.map((item) => item.students) }, { name: 'Teacher registration fees received', data: monthlyData.map((item) => item.registration) }, { name: 'Teacher payouts paid', data: monthlyData.map((item) => item.payouts) }], options: { ...chartBase, colors: ['var(--color-success)', 'var(--color-info)', 'var(--color-primary)'], stroke: { curve: 'smooth', width: 3 }, markers: { size: 3 }, xaxis: { categories: monthlyData.map((item) => item.label) }, yaxis: { labels: { formatter: (value) => `₹${Math.round(value / 1000)}k` } } } }
  const flowConfig = { type: 'bar', height: 280, series: [{ name: 'Money received', data: [receivedStudents + receivedRegistration] }, { name: 'Paid to teachers', data: [paidTeachers] }], options: { ...chartBase, colors: ['var(--color-success)', 'var(--color-primary)'], plotOptions: { bar: { columnWidth: '42%', borderRadius: 5 } }, xaxis: { categories: ['Selected period'] }, yaxis: { labels: { formatter: (value) => `₹${Math.round(value / 1000)}k` } } } }
  const collectionConfig = { type: 'donut', height: 280, series: [receivedStudents, receivedRegistration], options: { ...chartBase, labels: ['Student fees received', 'Teacher registration fees'], colors: ['var(--color-success)', 'var(--color-info)'], stroke: { width: 0 }, plotOptions: { pie: { donut: { size: '68%' } } } } }
  const statusConfig = { type: 'donut', height: 280, series: statusCounts.map((item) => item.count), options: { ...chartBase, labels: statusCounts.map((item) => item.status), colors: ['var(--color-success)', 'var(--color-info)', 'var(--color-primary)', 'var(--color-warning)', '#8b5cf6', 'var(--color-danger)'], stroke: { width: 0 }, plotOptions: { pie: { donut: { size: '68%' } } } } }
  const commissionTrendConfig = { type: 'bar', height: 260, series: [{ name: 'Commission recognized', data: monthlyData.map((item) => { const transactions = filteredTransactions.filter((transaction) => transaction.date.slice(5, 7) === months.find(([, label]) => label === item.label)?.[0] && transaction.category === 'Student payments' && transaction.status === 'Completed'); return transactions.reduce((sum, transaction) => { const assignment = commissionDemoAssignments.find((candidate) => candidate.studentName === transaction.party); return sum + (assignment ? transaction.amount * assignment.commissionPercent / 100 : 0) }, 0) }) }], options: { ...chartBase, colors: ['var(--color-info)'], plotOptions: { bar: { columnWidth: '46%', borderRadius: 4 } }, xaxis: { categories: monthlyData.map((item) => item.label) }, yaxis: { labels: { formatter: (value) => `₹${Math.round(value / 1000)}k` } } } }

  return <div className="page__section payout-dashboard">
    <header className="page__header"><div className="page__headline"><nav aria-label="breadcrumb"><ol className="breadcrumb"><li className="breadcrumb__item"><Link to="/admin">Dashboard</Link></li><li className="breadcrumb__item" aria-current="page">Payout</li></ol></nav><h1 className="page__title">Payout Analytics <Badge variant="info" size="sm">Demo Data</Badge></h1><p className="page__description">Review incoming student and registration fees separately from outgoing teacher payouts.</p></div><div className="page__action"><Button variant="outline" onClick={() => setFilters({ month: 'All', year: '2026', category: 'All', from: '', to: '' })}><RefreshCw size={15} /> Refresh</Button><Button variant="outline" onClick={() => { const csv = ['Date,Type,Party,Reference,Amount,Status', ...recent.map((item) => `${item.date},${item.category},${item.party},${item.reference},${item.amount},${item.status}`)].join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'payout-analytics-demo.csv'; link.click() }}><ArrowDownToLine size={15} /> Export</Button></div></header>
    <div className="payments-demo-banner"><WalletCards size={16} /><span>Demo Data — Not Connected to Backend. Incoming and outgoing categories use separate calculation rules.</span></div>
    <div className="payout-filters"><label><span>Month</span><select value={filters.month} onChange={(event) => updateFilter('month', event.target.value)}><option>All</option>{months.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>Year</span><select value={filters.year} onChange={(event) => updateFilter('year', event.target.value)}><option>All</option><option>2026</option><option>2025</option></select></label><label><span>Transaction category</span><select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label><span>From</span><input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} /></label><label><span>To</span><input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} /></label></div>
    <section className="payout-summary-grid"><SummaryCard icon={IndianRupee} label="Student Payments Received" value={currency.format(receivedStudents)} tone="success" helper="Incoming · completed only" /><SummaryCard icon={TrendingDown} label="Teacher Payouts Paid" value={currency.format(paidTeachers)} tone="primary" helper="Outgoing · paid only" /><SummaryCard icon={Users} label="Teacher Registration Fees Received" value={currency.format(receivedRegistration)} tone="info" helper="Incoming · received only" /><SummaryCard icon={WalletCards} label="Outstanding Student Fees" value={currency.format(outstandingStudentFees)} tone="warning" helper="Demo unpaid balances" /><SummaryCard icon={Clock3} label="Pending Teacher Payouts" value={currency.format(pendingPayouts)} tone="danger" helper="Outgoing · awaiting payment" /></section>
    <Card className="commission-analytics"><div className="payout-card-heading"><div><h2>Commission &amp; Earnings</h2><p>Calculated from eligible student payments; expected commission is not treated as cash received.</p></div><Badge variant="warning" size="sm">Demo calculation</Badge></div><div className="commission-analytics__metrics"><div><span>Commission earned / recognized</span><strong>{currency.format(commissionEarned)}</strong></div><div><span>Commission awaiting recognition</span><strong>{currency.format(commissionAwaiting)}</strong></div><div><span>Teacher payouts calculated</span><strong>{currency.format(commissionEligible.reduce((sum, transaction) => { const assignment = commissionDemoAssignments.find((item) => item.studentName === transaction.party); return sum + (assignment?.teacherPayoutAmount || 0) }, 0))}</strong></div><div><span>Teacher payouts completed</span><strong>{currency.format(paidTeachers)}</strong></div></div><div className="commission-analytics__chart"><Chart config={commissionTrendConfig} /></div><div className="commission-analytics__teachers">{commissionDemoAssignments.map((assignment) => <div key={assignment.id}><span>{assignment.teacherName} · {assignment.studentName}</span><strong>{assignment.commissionPercent}% · {currency.format(assignment.commissionAmount)} monthly commission</strong></div>)}</div></Card>
    <section className="payout-chart-grid payout-chart-grid--wide"><Card><div className="payout-card-heading"><div><h2>Monthly financial trends</h2><p>Received and paid amounts by month</p></div><TrendingUp size={18} /></div><Chart config={trendsConfig} /></Card></section>
    <section className="payout-chart-grid"><Card><div className="payout-card-heading"><div><h2>Incoming vs outgoing</h2><p>Selected period totals</p></div><BarChart3 size={18} /></div><Chart config={flowConfig} /></Card><Card><div className="payout-card-heading"><div><h2>Collection breakdown</h2><p>Incoming payments only</p></div><IndianRupee size={18} /></div><Chart config={collectionConfig} /></Card><Card><div className="payout-card-heading"><div><h2>Payment status overview</h2><p>Transaction counts by status</p></div><CalendarDays size={18} /></div><Chart config={statusConfig} /></Card></section>
    <Card className="payout-transactions"><div className="payout-card-heading"><div><h2>Recent financial transactions</h2><p>{filteredTransactions.length} demo records match the selected filters.</p></div></div><div className="payments-table-wrap"><table className="payments-table"><thead><tr><th>Date</th><th>Transaction type</th><th>Student / teacher</th><th>Reference</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>{recent.length === 0 ? <tr><td colSpan="7" className="payments-empty"><WalletCards size={28} /><strong>No transactions match the filters</strong><span>Try a wider date range or another category.</span></td></tr> : recent.map((item) => <tr key={item.id}><td>{formatDate(item.date)}</td><td>{item.category}</td><td>{item.party}</td><td><code>{item.reference}</code></td><td className="payments-amount">{currency.format(item.amount)}</td><td><Badge variant={statusVariant(item.status)} dot size="sm">{item.status}</Badge></td><td><Link className="payout-view-link" to={item.route}>View {item.category === 'Student payments' ? 'student' : 'teacher'} payments</Link></td></tr>)}</tbody></table></div></Card>
  </div>
}
