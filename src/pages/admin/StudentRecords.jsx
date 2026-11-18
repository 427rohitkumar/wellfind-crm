import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Search } from 'lucide-react'
import { Button, Card, CardBody } from '@/components/ui'
import { STUDENT_RECORD_STATUSES, docsOf, fmtDateTime, listStudentRecords } from '@/services/adminApi'
import { Pager, StatusBadge } from './adminUi'
import { inputCls, useLoad } from './useLoad'

export default function StudentRecords() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('all')
  const initialSearch = new URLSearchParams(window.location.search).get('search') || ''
  const [search, setSearch] = useState(initialSearch)
  const [query, setQuery] = useState(initialSearch)

  const { data, loading, error, reload } = useLoad(
    () => listStudentRecords({ page, limit: 10, status, search: query }),
    [page, status, query],
  )
  const rows = docsOf(data)

  return (
    <div className="page__section">
      <header className="page__header">
        <div className="page__headline">
          <h1 className="page__title">Student Records</h1>
          <p className="page__description">Converted students — manage assessments, teacher matching and physical tests.</p>
        </div>
        <div className="page__action">
          <Button variant="outline" onClick={reload}><RefreshCw size={16} className="mr-2" />Refresh</Button>
        </div>
      </header>

      <Card>
        <CardBody className="p-4 flex flex-wrap gap-3">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()) }}>
            <input className={inputCls} placeholder="Name, phone or parent" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button type="submit" variant="outline"><Search size={16} /></Button>
          </form>
          <select className={inputCls} style={{ width: 170 }} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
            <option value="all">All statuses</option>
            {STUDENT_RECORD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </CardBody>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-y border-border">
                <th className="px-5 py-3">Student</th><th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Subjects</th><th className="px-5 py-3">Locality</th>
                <th className="px-5 py-3">Status</th><th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && error && <tr><td colSpan={6} className="px-5 py-8 text-center text-danger">{error}</td></tr>}
              {!loading && !error && rows.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No student records. Convert an enquiry to create one.</td></tr>}
              {!loading && rows.map((s) => (
                <tr key={s.id} className="border-b border-border hover:bg-surface-2">
                  <td className="px-5 py-3 font-medium"><Link className="text-primary hover:underline" to={`/admin/student-records/${s.id}`}>{s.name}</Link>
                    <div className="text-xs text-muted-foreground">{s.phoneNumber}</div></td>
                  <td className="px-5 py-3">{s.studentClass}</td>
                  <td className="px-5 py-3">{(s.subjects || []).join(', ')}</td>
                  <td className="px-5 py-3">{s.locality}</td>
                  <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-5 py-3">{fmtDateTime(s.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager data={data} page={page} onPage={setPage} />
      </Card>
    </div>
  )
}
