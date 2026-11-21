import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BarChart3, CheckCircle2, Clock3, Eye, Globe2, MousePointerClick,
  RefreshCw, Search, Users,
} from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Chart } from '../../components/ui'
import { analyticsPeriods, fetchAnalyticsOverview, normalizeAnalytics } from '../../services/analyticsService'

const numberFormat = new Intl.NumberFormat('en-IN')
const formatNumber = (value) => numberFormat.format(Math.round(value))
const formatTime = (seconds) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`
const chartBase = {
  chart: { toolbar: { show: false }, fontFamily: 'inherit', foreColor: 'var(--color-muted-foreground)' },
  grid: { borderColor: 'var(--color-border)', strokeDashArray: 4 },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' },
}

function AnalyticsCard({ title, description, children, className = '' }) {
  return <Card className={`website-analytics-card ${className}`}><CardHeader><div><h2>{title}</h2>{description && <p>{description}</p>}</div></CardHeader><CardBody>{children}</CardBody></Card>
}

function KpiCard({ metric, compare }) {
  const value = metric.key === 'engagementRate'
    ? `${Number(metric.value).toFixed(1)}%`
    : metric.key === 'viewsPerUser'
      ? Number(metric.value).toFixed(2)
      : metric.key === 'engagementTime'
        ? formatTime(Math.round(metric.value))
        : formatNumber(metric.value)
  return <Card className="website-analytics-kpi"><CardBody><span className="website-analytics-kpi__icon"><Globe2 size={17} /></span><div><span>{metric.label}</span><strong>{value}</strong>{compare && <small className={metric.change >= 0 ? 'is-positive' : 'is-negative'}>{metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% vs previous period</small>}</div></CardBody></Card>
}

export default function WebsiteAnalytics() {
  const [period, setPeriod] = useState('28d')
  const [compare, setCompare] = useState(true)
  const [selectedSeries, setSelectedSeries] = useState(['activeUsers', 'newUsers', 'sessions', 'views'])
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  // Real Google Analytics data (through the API). If it cannot be fetched, every number shows 0.
  useEffect(() => {
    let alive = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetchAnalyticsOverview(period === 'custom' ? '28d' : period)
      .then((res) => { if (alive) { setRaw(res); setError('') } })
      .catch((e) => { if (alive) { setRaw(null); setError(e.message || 'Could not load Google Analytics data.') } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [period, tick])

  const { kpis: analyticsKpis, trend: visibleTrend, channels: acquisitionChannels, landingPages, devices, geography, topEvents, summary } = useMemo(() => normalizeAnalytics(raw), [raw])
  const kpiValue = (key) => analyticsKpis.find((k) => k.key === key)?.value ?? 0
  const organicSearch = acquisitionChannels.find((c) => c.channel === 'Organic Search')
  const toggleSeries = (key) => setSelectedSeries((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  const trendSeries = [
    { key: 'activeUsers', name: 'Active Users', color: 'var(--color-primary)' },
    { key: 'newUsers', name: 'New Users', color: 'var(--color-success)' },
    { key: 'sessions', name: 'Sessions', color: 'var(--color-info)' },
    { key: 'views', name: 'Views', color: 'var(--color-warning)' },
  ]
  const trendConfig = { type: 'line', height: 330, series: trendSeries.filter((series) => selectedSeries.includes(series.key)).map((series) => ({ name: series.name, data: visibleTrend.map((point) => Math.round(point[series.key])) })), options: { ...chartBase, colors: trendSeries.filter((series) => selectedSeries.includes(series.key)).map((series) => series.color), stroke: { curve: 'smooth', width: 2 }, markers: { size: 3 }, xaxis: { categories: visibleTrend.map((point) => point.date) }, yaxis: { labels: { formatter: (value) => formatNumber(value) } }, tooltip: { theme: 'dark', y: { formatter: (value) => formatNumber(value) } }, legend: { show: false } } }
  const acquisitionConfig = { type: 'bar', height: 310, series: [{ name: 'Sessions', data: acquisitionChannels.map((channel) => Math.round(channel.sessions)) }, { name: 'Users', data: acquisitionChannels.map((channel) => Math.round(channel.users)) }], options: { ...chartBase, colors: ['var(--color-primary)', 'var(--color-success)'], plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } }, xaxis: { categories: acquisitionChannels.map((channel) => channel.channel) }, tooltip: { theme: 'dark', y: { formatter: (value) => formatNumber(value) } }, legend: { position: 'bottom', labels: { colors: 'var(--color-muted-foreground)' } } } }
  const deviceConfig = { type: 'donut', height: 250, series: devices.map((device) => device.value), options: { ...chartBase, labels: devices.map((device) => device.label), colors: ['var(--color-primary)', 'var(--color-info)', 'var(--color-warning)'], stroke: { width: 0 }, plotOptions: { pie: { donut: { size: '68%' } } }, legend: { position: 'bottom', labels: { colors: 'var(--color-muted-foreground)' } } } }
  const geographyConfig = { type: 'bar', height: 250, series: [{ name: 'Users', data: geography.map((item) => item.value) }], options: { ...chartBase, colors: ['var(--color-success)'], plotOptions: { bar: { borderRadius: 4, columnWidth: '48%' } }, xaxis: { categories: geography.map((item) => item.label) }, yaxis: { labels: { formatter: (value) => (value >= 1000 ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`) } }, legend: { show: false } } }
  const organicChannels = acquisitionChannels.filter((channel) => ['Organic Search', 'Organic Social'].includes(channel.channel))

  return <div className="page__section website-analytics-page"><header className="page__header"><div className="page__headline"><h1 className="page__title">Google Analytics</h1><p className="page__description">Website performance for wellfindacademic.com.</p></div></header><section className="website-analytics">
    <header className="website-analytics__header"><div><div className="website-analytics__eyebrow"><Globe2 size={16} /> Google Analytics 4 — {error ? 'Not Connected' : loading ? 'Loading' : 'Live Data'}</div><h2>Website Analytics</h2><p>Monitor website performance for <strong>wellfindacademic.com</strong>, fetched from Google Analytics 4.</p></div><div className="website-analytics__actions"><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Analytics date range">{Object.entries(analyticsPeriods).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}<option value="custom">Custom Range</option></select><label className="website-analytics__compare"><input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} /> Previous period</label><Button variant="outline" size="sm" onClick={refresh} disabled={loading}><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</Button></div></header>
    <div className="website-analytics__notice">{error ? <><Badge variant="warning" size="sm">NOT CONNECTED</Badge><span>{error} Showing zeros until the connection works.</span></> : <><Badge variant="success" size="sm">{loading ? 'LOADING' : 'LIVE'}</Badge><span>{loading ? 'Fetching data from Google Analytics…' : `Data from Google Analytics 4${raw?.range ? ` · ${raw.range.startDate} to ${raw.range.endDate}` : ''}. Days with no traffic show 0.`}</span></>}</div>
    <div className="website-analytics__kpis">{analyticsKpis.map((metric) => <KpiCard key={metric.key} metric={metric} compare={compare} />)}</div>
    <AnalyticsCard title="Traffic Overview" description={`${analyticsPeriods[period]?.label || 'Custom range'} · ${compare ? 'Compared with previous period' : 'Comparison disabled'}`} className="website-analytics__wide"><div className="website-analytics-series">{trendSeries.map((series) => <label key={series.key}><input type="checkbox" checked={selectedSeries.includes(series.key)} onChange={() => toggleSeries(series.key)} /><span style={{ backgroundColor: series.color }} />{series.name}</label>)}</div>{selectedSeries.length ? <Chart config={trendConfig} /> : <div className="website-analytics-empty"><Search size={22} />Select at least one metric series.</div>}</AnalyticsCard>
    <div className="website-analytics__grid website-analytics__grid--two"><AnalyticsCard title="Traffic Acquisition" description="Sessions and users by channel."><Chart config={acquisitionConfig} /></AnalyticsCard><AnalyticsCard title="Acquisition Details" description="Engagement and key events by channel."><div className="website-analytics-table-wrap"><table className="website-analytics-table"><thead><tr><th>Channel</th><th>Engagement</th><th>Key events</th></tr></thead><tbody>{acquisitionChannels.map((channel) => <tr key={channel.channel}><td>{channel.channel}</td><td>{channel.engagementRate}%</td><td>{formatNumber(channel.keyEvents)}</td></tr>)}</tbody></table></div></AnalyticsCard></div>
    <div className="website-analytics__grid website-analytics__grid--two"><AnalyticsCard title="Top Landing Pages" description="Pages receiving the most views."><div className="website-analytics-table-wrap"><table className="website-analytics-table"><thead><tr><th>Path</th><th>Views</th><th>Users</th><th>Key events</th></tr></thead><tbody>{landingPages.length === 0 && <tr><td colSpan={4}>No page data yet.</td></tr>}{landingPages.map((page) => <tr key={page.path}><td><strong>{page.path}</strong><small>{page.title}</small></td><td>{formatNumber(page.views)}</td><td>{formatNumber(page.users)}</td><td>{formatNumber(page.keyEvents)}</td></tr>)}</tbody></table></div><button className="website-analytics-link" type="button">View All Pages</button></AnalyticsCard><AnalyticsCard title="Engagement & Key Events" description="Ordinary events and configured key events are separated."><div className="website-analytics-event-summary"><div><Clock3 size={17} /><span>Engaged Sessions</span><strong>{formatNumber(summary.engagedSessions)}</strong></div><div><MousePointerClick size={17} /><span>Event Count</span><strong>{formatNumber(kpiValue('events'))}</strong></div><div><CheckCircle2 size={17} /><span>Key Events</span><strong>{formatNumber(summary.keyEvents)}</strong></div><div><BarChart3 size={17} /><span>Engagement Rate</span><strong>{Number(kpiValue('engagementRate')).toFixed(1)}%</strong></div></div><div className="website-analytics-events">{topEvents.map((event) => <div key={event.name}><span>{event.name}</span><strong>{formatNumber(event.count)}</strong>{event.keyEvent && <Badge variant="success" size="sm">Key event</Badge>}</div>)}</div></AnalyticsCard></div>
    <div className="website-analytics__grid website-analytics__grid--three"><AnalyticsCard title="Device Category" description="Share of users"><Chart config={deviceConfig} /></AnalyticsCard><AnalyticsCard title="New vs Returning Users" description="Share of users in this period"><div className="website-analytics-split"><div><Users size={20} /><strong>{formatNumber(kpiValue('newUsers'))}</strong><span>New users</span></div><div><RefreshCw size={20} /><strong>{formatNumber(summary.returningUsers)}</strong><span>Returning users</span></div></div></AnalyticsCard><AnalyticsCard title="Geography" description="Users by country"><Chart config={geographyConfig} /></AnalyticsCard></div>
    <div className="website-analytics__grid website-analytics__grid--two"><AnalyticsCard title="Organic Traffic Insights" description="GA4 acquisition data only; Search Console metrics are not included."><div className="website-analytics-organic"><div><Search size={18} /><span>Organic users</span><strong>{formatNumber(organicSearch?.users || 0)}</strong></div><div><Eye size={18} /><span>Organic sessions</span><strong>{formatNumber(organicSearch?.sessions || 0)}</strong></div></div><div className="website-analytics-organic-list">{organicChannels.map((channel) => <div key={channel.channel}><span>{channel.channel}</span><strong>{formatNumber(channel.sessions)} sessions</strong></div>)}</div></AnalyticsCard><AnalyticsCard title="Top Events" description="Most frequent events on the website."><div className="website-analytics-top-events">{topEvents.map((event, index) => <div key={event.name}><span className="website-analytics-rank">{index + 1}</span><span>{event.name}{event.keyEvent && <Badge variant="success" size="sm">Key event</Badge>}</span><strong>{formatNumber(event.count)}</strong></div>)}</div></AnalyticsCard></div>
  </section></div>
}
