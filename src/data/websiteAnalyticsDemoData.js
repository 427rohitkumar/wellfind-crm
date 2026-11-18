export const analyticsPeriods = {
  today: { label: 'Today', points: 1, multiplier: 0.18 },
  yesterday: { label: 'Yesterday', points: 1, multiplier: 0.16 },
  '7d': { label: 'Last 7 Days', points: 7, multiplier: 0.72 },
  '28d': { label: 'Last 28 Days', points: 28, multiplier: 1 },
  '30d': { label: 'Last 30 Days', points: 30, multiplier: 1.08 },
  '90d': { label: 'Last 90 Days', points: 90, multiplier: 2.92 },
  month: { label: 'This Month', points: 30, multiplier: 1.08 },
  year: { label: 'This Year', points: 365, multiplier: 11.6 },
}

export const analyticsKpis = [
  { key: 'users', label: 'Total Users', value: 12840, change: 12.4 },
  { key: 'newUsers', label: 'New Users', value: 10872, change: 10.8 },
  { key: 'sessions', label: 'Sessions', value: 18420, change: 8.2 },
  { key: 'views', label: 'Views', value: 42180, change: 15.1 },
  { key: 'viewsPerUser', label: 'Views per Active User', value: 3.28, change: 4.6 },
  { key: 'engagementTime', label: 'Avg. Engagement Time', value: 142, change: 6.1 },
  { key: 'engagementRate', label: 'Engagement Rate', value: 68.4, change: -2.3 },
  { key: 'events', label: 'Event Count', value: 58240, change: 18.7 },
]

export const trafficTrend = [
  { date: 'Oct 01', activeUsers: 420, newUsers: 360, sessions: 610, views: 1380 },
  { date: 'Oct 02', activeUsers: 510, newUsers: 428, sessions: 720, views: 1640 },
  { date: 'Oct 03', activeUsers: 470, newUsers: 390, sessions: 680, views: 1510 },
  { date: 'Oct 04', activeUsers: 620, newUsers: 510, sessions: 860, views: 1980 },
  { date: 'Oct 05', activeUsers: 700, newUsers: 590, sessions: 940, views: 2240 },
  { date: 'Oct 06', activeUsers: 660, newUsers: 548, sessions: 900, views: 2100 },
  { date: 'Oct 07', activeUsers: 780, newUsers: 650, sessions: 1050, views: 2480 },
]

export const acquisitionChannels = [
  { channel: 'Organic Search', sessions: 6840, users: 5120, engagementRate: 72.8, keyEvents: 284 },
  { channel: 'Direct', sessions: 4210, users: 3180, engagementRate: 66.2, keyEvents: 176 },
  { channel: 'Organic Social', sessions: 2640, users: 2110, engagementRate: 61.5, keyEvents: 98 },
  { channel: 'Referral', sessions: 1890, users: 1420, engagementRate: 70.1, keyEvents: 86 },
  { channel: 'Paid Search', sessions: 1740, users: 1280, engagementRate: 64.7, keyEvents: 72 },
  { channel: 'Email', sessions: 720, users: 560, engagementRate: 78.4, keyEvents: 48 },
  { channel: 'Unassigned', sessions: 380, users: 270, engagementRate: 49.2, keyEvents: 12 },
]

export const landingPages = [
  { path: '/', title: 'Wellfind Academic | Find the right tutor', views: 12840, users: 8420, sessions: 6840, engagementTime: 156, keyEvents: 312 },
  { path: '/services', title: 'Tutoring Services | Wellfind Academic', views: 8240, users: 5140, sessions: 3820, engagementTime: 204, keyEvents: 184 },
  { path: '/find-a-tutor', title: 'Find a Tutor', views: 6920, users: 4380, sessions: 3180, engagementTime: 238, keyEvents: 226 },
  { path: '/become-a-teacher', title: 'Become a Teacher', views: 4820, users: 3220, sessions: 2140, engagementTime: 186, keyEvents: 142 },
  { path: '/about', title: 'About Wellfind Academic', views: 3180, users: 2440, sessions: 1840, engagementTime: 118, keyEvents: 34 },
  { path: '/contact', title: 'Contact Wellfind Academic', views: 2460, users: 1820, sessions: 1390, engagementTime: 96, keyEvents: 92 },
]

export const devices = [
  { label: 'Desktop', value: 54 },
  { label: 'Mobile', value: 39 },
  { label: 'Tablet', value: 7 },
]

export const geography = [
  { label: 'India', value: 10420 },
  { label: 'United Arab Emirates', value: 840 },
  { label: 'United States', value: 620 },
  { label: 'United Kingdom', value: 430 },
]

export const topEvents = [
  { name: 'page_view', count: 42180, keyEvent: false },
  { name: 'session_start', count: 18420, keyEvent: false },
  { name: 'form_start', count: 1840, keyEvent: false },
  { name: 'form_submit', count: 642, keyEvent: true },
  { name: 'click', count: 2840, keyEvent: false },
]
