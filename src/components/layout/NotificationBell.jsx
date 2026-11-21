import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BookOpen, CheckCheck, GraduationCap, IndianRupee, Inbox } from 'lucide-react'
import { fetchStudentEnquiries } from '@/services/studentEnquiryService'
import { fetchTeacherEnquiries } from '@/services/teacherEnquiryService'
import { inr, listPayments } from '@/services/adminApi'
import { usePermissions } from '@/hooks/usePermissions'
import { PushToggle } from './PushToggle'

const SEEN_KEY = 'wellfind_notif_seen_at'
const ICONS = { student: BookOpen, teacher: GraduationCap, payment: IndianRupee }

const readSeen = () => {
  try { return Number(localStorage.getItem(SEEN_KEY)) || 0 } catch { return 0 }
}

function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} day${Math.floor(s / 86400) > 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

/** Bell with the latest student enquiries, teacher applications and payments (admin). */
export function NotificationBell({ enabled = true }) {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [seenAt, setSeenAt] = useState(readSeen)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    const [s, t, p] = await Promise.allSettled([
      can('student_inquiries') ? fetchStudentEnquiries({ limit: 5, sort: '-createdAt' }) : Promise.resolve(null),
      can('teacher_inquiries') ? fetchTeacherEnquiries({ limit: 5, sort: '-createdAt' }) : Promise.resolve(null),
      can('payments') ? listPayments({ limit: 5, status: 'paid' }) : Promise.resolve(null),
    ])
    const out = []
    if (s.status === 'fulfilled') {
      for (const e of s.value?.docs || []) out.push({ id: `s${e.id}`, type: 'student', at: e.createdAt, title: 'New student enquiry', text: `${e.name} · ${e.studentClass}${e.locality ? ` · ${e.locality}` : ''}`, to: `/admin/student-enquiries/${e.id}` })
    }
    if (t.status === 'fulfilled') {
      for (const e of t.value?.docs || []) out.push({ id: `t${e.id}`, type: 'teacher', at: e.createdAt, title: 'New teacher application', text: `${e.fullName} · ${e.primarySubject || 'Teacher'}`, to: `/admin/teacher-enquiries/${e.id}` })
    }
    if (p.status === 'fulfilled') {
      for (const x of p.value?.docs || []) out.push({ id: `p${x.id}`, type: 'payment', at: x.paidAt || x.createdAt, title: 'Payment received', text: `${inr(x.amount)}${x.payerName ? ` from ${x.payerName}` : ''}`, to: '/admin/payouts/reports' })
    }
    out.sort((a, b) => new Date(b.at) - new Date(a.at))
    setItems(out.slice(0, 8))
    setLoading(false)
  }, [enabled, can])

  // Load once on mount (for the unread dot); it reloads whenever the panel is opened.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [])

  const unread = items.filter((i) => new Date(i.at).getTime() > seenAt).length
  const markAll = () => {
    const now = Date.now()
    try { localStorage.setItem(SEEN_KEY, String(now)) } catch { /* ignore */ }
    setSeenAt(now)
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="button button--ghost button--neutral button--icon-only wf-bellbtn" onClick={() => { if (!open) void load(); setOpen((v) => !v) }} aria-label="Notifications" aria-expanded={open}>
        <Bell size={20} />
        {unread > 0 && <span className="wf-bellbtn__dot" aria-label={`${unread} unread`}>{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="wf-notif" role="dialog" aria-label="Notifications">
          <div className="wf-notif__head">
            <div><h3>Notifications</h3><span>{unread > 0 ? `${unread} new` : 'All caught up'}</span></div>
            <button type="button" onClick={markAll} disabled={unread === 0}><CheckCheck size={14} />Mark all read</button>
          </div>
          <div className="wf-notif__list">
            {loading && items.length === 0 && <div className="wf-notif__empty">Loading…</div>}
            {!loading && items.length === 0 && <div className="wf-notif__empty"><Inbox size={26} />No notifications yet</div>}
            {items.map((n) => {
              const Icon = ICONS[n.type]
              const isNew = new Date(n.at).getTime() > seenAt
              return (
                <button key={n.id} type="button" className={`wf-notif__item${isNew ? ' is-new' : ''}`} onClick={() => { setOpen(false); navigate(n.to) }}>
                  <span className={`wf-notif__icon is-${n.type}`}><Icon size={16} /></span>
                  <span className="wf-notif__body">
                    <b>{n.title}</b>
                    <span>{n.text}</span>
                    <small>{ago(n.at)}</small>
                  </span>
                  {isNew && <i className="wf-notif__new" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
          <PushToggle />
        </div>
      )}
    </div>
  )
}
