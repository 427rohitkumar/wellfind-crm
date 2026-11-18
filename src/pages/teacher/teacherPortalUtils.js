import { getMyProfile, listMyAllocations } from '@/services/teacherPortalService'

/** Load profile + all (up to 100) allocations for the logged-in teacher. */
export async function loadTeacherPortal() {
  const [profile, allocRes] = await Promise.all([
    getMyProfile(),
    listMyAllocations({ limit: 100, sort: '-allocatedAt' }),
  ])
  return { profile, allocations: allocRes?.docs || [] }
}

export const LIVE_STATUSES = ['assigned', 'accepted', 'active']

export function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const k = keyFn(item)
    if (k) acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})
}

export function formatDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Human duration between two dates, e.g. "3 months", "12 days". */
export function durationBetween(from, to = new Date()) {
  const a = new Date(from)
  const b = new Date(to)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '—'
  const days = Math.max(0, Math.floor((b - a) / 86400000))
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`
  const months = Math.floor(days / 30)
  return months < 12 ? `${months} month${months === 1 ? '' : 's'}` : `${(days / 365).toFixed(1)} years`
}

/** When did a terminal allocation finish? Uses last status-history entry. */
export function endedAt(allocation) {
  const terminal = ['completed', 'rejected', 'cancelled']
  if (!terminal.includes(allocation.status)) return null
  const h = Array.isArray(allocation.statusHistory) ? allocation.statusHistory : []
  const last = h[h.length - 1]
  return last?.changedAt || allocation.updatedAt || null
}
