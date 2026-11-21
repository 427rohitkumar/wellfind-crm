import { apiRequest } from './apiClient'

export const analyticsPeriods = {
  today: { label: 'Today' },
  yesterday: { label: 'Yesterday' },
  '7d': { label: 'Last 7 Days' },
  '28d': { label: 'Last 28 Days' },
  '30d': { label: 'Last 30 Days' },
  '90d': { label: 'Last 90 Days' },
  month: { label: 'This Month' },
  year: { label: 'This Year' },
}

const KPI_LABELS = [
  ['users', 'Total Users'],
  ['newUsers', 'New Users'],
  ['sessions', 'Sessions'],
  ['views', 'Views'],
  ['viewsPerUser', 'Views per Active User'],
  ['engagementTime', 'Avg. Engagement Time'],
  ['engagementRate', 'Engagement Rate'],
  ['events', 'Event Count'],
]

const DEFAULT_CHANNELS = ['Organic Search', 'Direct', 'Organic Social', 'Referral', 'Paid Search', 'Email', 'Unassigned']
const DEFAULT_EVENTS = [
  { name: 'page_view', keyEvent: false },
  { name: 'session_start', keyEvent: false },
  { name: 'form_start', keyEvent: false },
  { name: 'form_submit', keyEvent: true },
  { name: 'click', keyEvent: false },
]

/** Same shape the page always rendered, with zeros wherever Google returned nothing. */
export function normalizeAnalytics(data) {
  const d = data || {}
  const kpis = KPI_LABELS.map(([key, label]) => ({ key, label, value: d.kpis?.[key]?.value ?? 0, change: d.kpis?.[key]?.change ?? 0 }))

  const channels = DEFAULT_CHANNELS.map((channel) => {
    const found = (d.channels || []).find((c) => c.channel === channel)
    return found || { channel, sessions: 0, users: 0, engagementRate: 0, keyEvents: 0 }
  })
  // Keep any extra channels Google reports (e.g. "Display", "Cross-network").
  for (const c of d.channels || []) if (!DEFAULT_CHANNELS.includes(c.channel)) channels.push(c)
  channels.sort((a, b) => b.sessions - a.sessions)

  const devices = ['Desktop', 'Mobile', 'Tablet'].map((label) => ({ label, value: (d.devices || []).find((x) => x.label === label)?.value ?? 0 }))
  const topEvents = (d.topEvents && d.topEvents.length ? d.topEvents : DEFAULT_EVENTS.map((e) => ({ ...e, count: 0 })))

  return {
    live: Boolean(data),
    kpis,
    trend: d.trend?.length ? d.trend : [{ date: '—', activeUsers: 0, newUsers: 0, sessions: 0, views: 0 }],
    channels,
    landingPages: d.landingPages || [],
    devices,
    geography: d.geography?.length ? d.geography : [{ label: 'No data', value: 0 }],
    topEvents,
    summary: { engagedSessions: 0, keyEvents: 0, returningUsers: 0, ...(d.summary || {}) },
  }
}

export async function fetchAnalyticsOverview(period = '28d') {
  const res = await apiRequest(`/api/admin/analytics/overview?period=${encodeURIComponent(period)}`)
  return res && typeof res === 'object' && 'data' in res ? res.data : res
}
