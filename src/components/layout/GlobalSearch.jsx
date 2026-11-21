import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, GraduationCap, Search, UserRound } from 'lucide-react'
import { fetchStudentEnquiries } from '@/services/studentEnquiryService'
import { fetchTeacherEnquiries } from '@/services/teacherEnquiryService'
import { docsOf, listTeacherProfiles } from '@/services/adminApi'
import { usePermissions } from '@/hooks/usePermissions'

const GROUPS = [
  { key: 'students', label: 'Students & enquiries', icon: BookOpen },
  { key: 'applications', label: 'Teacher applications', icon: GraduationCap },
  { key: 'teachers', label: 'Teachers', icon: UserRound },
]

/** Admin search across student enquiries/students, teacher applications and approved teachers. */
export function GlobalSearch() {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const ref = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState({ students: [], applications: [], teachers: [] })

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return undefined
    let alive = true
    const timer = setTimeout(async () => {
      setLoading(true)
      const where = JSON.stringify({ or: [{ name: { contains: q } }, { mobile: { contains: q } }, { primarySubject: { contains: q } }] })
      const [s, a, t] = await Promise.allSettled([
        can('student_inquiries') ? fetchStudentEnquiries({ search: q, limit: 5 }) : Promise.resolve(null),
        can('teacher_inquiries') ? fetchTeacherEnquiries({ search: q, limit: 5 }) : Promise.resolve(null),
        can('teachers') ? listTeacherProfiles({ where, limit: 5 }) : Promise.resolve(null),
      ])
      if (!alive) return
      setResults({
        students: s.status === 'fulfilled' ? (s.value?.docs || []).map((e) => ({ id: e.id, title: e.name, sub: `${e.studentClass || ''}${e.locality ? ` · ${e.locality}` : ''}`, to: `/admin/student-enquiries/${e.id}` })) : [],
        applications: a.status === 'fulfilled' ? (a.value?.docs || []).map((e) => ({ id: e.id, title: e.fullName, sub: `${e.primarySubject || 'Applicant'}${e.mobileNumber ? ` · ${e.mobileNumber}` : ''}`, to: `/admin/teacher-enquiries/${e.id}` })) : [],
        teachers: t.status === 'fulfilled' ? docsOf(t.value).map((p) => ({ id: p.id, title: p.name, sub: `${p.primarySubject || ''}${p.mobile ? ` · ${p.mobile}` : ''}`, to: `/admin/teachers/${p.id}` })) : [],
      })
      setLoading(false)
    }, 300)
    return () => { alive = false; clearTimeout(timer) }
  }, [query, can])

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])

  const ready = query.trim().length >= 2
  const total = GROUPS.reduce((n, g) => n + results[g.key].length, 0)
  const go = (to) => { setOpen(false); setQuery(''); navigate(to) }

  return (
    <div className="wf-gsearch" ref={ref}>
      <form className="input-group input-group--search" role="search" onSubmit={(e) => e.preventDefault()}>
        <span className="input-group__text" aria-hidden="true"><Search size={16} /></span>
        <input
          type="search"
          className="input"
          placeholder="Search inquiries, students, teachers…"
          aria-label="Search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </form>

      {open && ready && (
        <div className="wf-gsearch__panel" role="listbox">
          {loading && total === 0 && <div className="wf-gsearch__empty">Searching…</div>}
          {!loading && total === 0 && <div className="wf-gsearch__empty">No matches for “{query.trim()}”.</div>}
          {GROUPS.map(({ key, label, icon: Icon }) => results[key].length > 0 && (
            <div key={key} className="wf-gsearch__group">
              <div className="wf-gsearch__label">{label}</div>
              {results[key].map((r) => (
                <button key={`${key}${r.id}`} type="button" className="wf-gsearch__item" onClick={() => go(r.to)}>
                  <span className="wf-gsearch__icon"><Icon size={15} /></span>
                  <span className="wf-gsearch__text"><b>{r.title}</b><small>{r.sub}</small></span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
