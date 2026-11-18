import { useMemo, useState } from 'react'
import {
  BarChart3, CheckCircle2, Clock3, Eye, Globe2, MousePointerClick,
  RefreshCw, Search, Users,
} from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Chart } from '../../components/ui'
import {
  acquisitionChannels, analyticsKpis, analyticsPeriods, devices, geography,
  landingPages, topEvents, trafficTrend,
} from '../../data/websiteAnalyticsDemoData'

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

function KpiCard({ metric, multiplier }) {
  const value = metric.key === 'engagementRate'
    ? `${(metric.value * (0.98 + multiplier * 0.02)).toFixed(1)}%`
    : metric.key === 'viewsPerUser'
      ? (metric.value * (0.98 + multiplier * 0.02)).toFixed(2)
      : metric.key === 'engagementTime'
        ? formatTime(Math.round(metric.value * (0.98 + multiplier * 0.02)))
        : formatNumber(metric.value * multiplier)
  return <Card className="website-analytics-kpi"><CardBody><span className="website-analytics-kpi__icon"><Globe2 size={17} /></span><div><span>{metric.label}</span><strong>{value}</strong><small className={metric.change >= 0 ? 'is-positive' : 'is-negative'}>{metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% vs previous period</small></div></CardBody></Card>
}

export default function WebsiteAnalytics() {
  const [period, setPeriod] = useState('28d')
  const [compare, setCompare] = useState(true)
  const [selectedSeries, setSelectedSeries] = useState(['activeUsers', 'newUsers', 'sessions', 'views'])
  const multiplier = analyticsPeriods[period]?.multiplier || 1
  const visibleTrend = useMemo(() => {
    const points = analyticsPeriods[period]?.points || 28
    return trafficTrend.slice(Math.max(0, trafficTrend.length - Math.min(points, trafficTrend.length)))
  }, [period])
  const toggleSeries = (key) => setSelectedSeries((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  const trendSeries = [
    { key: 'activeUsers', name: 'Active Users', color: 'var(--color-primary)' },
    { key: 'newUsers', name: 'New Users', color: 'var(--color-success)' },
    { key: 'sessions', name: 'Sessions', color: 'var(--color-info)' },
    { key: 'views', name: 'Views', color: 'var(--color-warning)' },
  ]
  const trendConfig = { type: 'line', height: 330, series: trendSeries.filter((series) => selectedSeries.includes(series.key)).map((series) => ({ name: series.name, data: visibleTrend.map((point) => Math.round(point[series.key] * multiplier)) })), options: { ...chartBase, colors: trendSeries.filter((series) => selectedSeries.includes(series.key)).map((series) => series.color), stroke: { curve: 'smooth', width: 2 }, markers: { size: 3 }, xaxis: { categories: visibleTrend.map((point) => point.date) }, yaxis: { labels: { formatter: (value) => formatNumber(value) } }, tooltip: { theme: 'dark', y: { formatter: (value) => formatNumber(value) } }, legend: { show: false } } }
  const acquisitionConfig = { type: 'bar', height: 310, series: [{ name: 'Sessions', data: acquisitionChannels.map((channel) => Math.round(channel.sessions * multiplier)) }, { name: 'Users', data: acquisitionChannels.map((channel) => Math.round(channel.users * multiplier)) }], options: { ...chartBase, colors: ['var(--color-primary)', 'var(--color-success)'], plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '55%' } }, xaxis: { categories: acquisitionChannels.map((channel) => channel.channel) }, tooltip: { theme: 'dark', y: { formatter: (value) => formatNumber(value) } }, legend: { position: 'bottom', labels: { colors: 'var(--color-muted-foreground)' } } } }
  const deviceConfig = { type: 'donut', height: 250, series: devices.map((device) => device.value), options: { ...chartBase, labels: devices.map((device) => device.label), colors: ['var(--color-primary)', 'var(--color-info)', 'var(--color-warning)'], stroke: { width: 0 }, plotOptions: { pie: { donut: { size: '68%' } } }, legend: { position: 'bottom', labels: { colors: 'var(--color-muted-foreground)' } } } }
  const geographyConfig = { type: 'bar', height: 250, series: [{ name: 'Users', data: geography.map((item) => item.value) }], options: { ...chartBase, colors: ['var(--color-success)'], plotOptions: { bar: { borderRadius: 4, columnWidth: '48%' } }, xaxis: { categories: geography.map((item) => item.label) }, yaxis: { labels: { formatter: (value) => `${Math.round(value / 1000)}k` } }, legend: { show: false } } }
  const organicChannels = acquisitionChannels.filter((channel) => ['Organic Search', 'Organic Social'].includes(channel.channel))

  return <div className="page__section website-analytics-page"><header className="page__header"><div className="page__headline"><h1 className="page__title">Google Analytics</h1><p className="page__description">Website performance for wellfindacademic.com.</p></div></header><section className="website-analytics">
    <header className="website-analytics__header"><div><div className="website-analytics__eyebrow"><Globe2 size={16} /> Google Analytics 4 — Demo Data</div><h2>Website Analytics</h2><p>Monitor simulated website performance for <strong>wellfindacademic.com</strong>. This data is not connected to Google Analytics.</p></div><div className="website-analytics__actions"><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Analytics date range">{Object.entries(analyticsPeriods).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}<option value="custom">Custom Range</option></select><label className="website-analytics__compare"><input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} /> Previous period</label><Button variant="outline" size="sm"><RefreshCw size={14} /> Refresh</Button></div></header>
    <div className="website-analytics__notice"><Badge variant="warning" size="sm">DEMO DATA</Badge><span>Not connected to Google Analytics. Metrics are simulated for interface preview only.</span></div>
    <div className="website-analytics__kpis">{analyticsKpis.map((metric) => <KpiCard key={metric.key} metric={metric} multiplier={multiplier} />)}</div>
    <AnalyticsCard title="Traffic Overview" description={`${analyticsPeriods[period]?.label || 'Custom range'} · ${compare ? 'Compared with previous period' : 'Comparison disabled'}`} className="website-analytics__wide"><div className="website-analytics-series">{trendSeries.map((series) => <label key={series.key}><input type="checkbox" checked={selectedSeries.includes(series.key)} onChange={() => toggleSeries(series.key)} /><span style={{ backgroundColor: series.color }} />{series.name}</label>)}</div>{selectedSeries.length ? <Chart config={trendConfig} /> : <div className="website-analytics-empty"><Search size={22} />Select at least one metric series.</div>}</AnalyticsCard>
    <div className="website-analytics__grid website-analytics__grid--two"><AnalyticsCard title="Traffic Acquisition" description="Sessions and users by channel."><Chart config={acquisitionConfig} /></AnalyticsCard><AnalyticsCard title="Acquisition Details" description="Engagement and key events by channel."><div className="website-analytics-table-wrap"><table className="website-analytics-table"><thead><tr><th>Channel</th><th>Engagement</th><th>Key events</th></tr></thead><tbody>{acquisitionChannels.map((channel) => <tr key={channel.channel}><td>{channel.channel}</td><td>{channel.engagementRate}%</td><td>{formatNumber(channel.keyEvents * multiplier)}</td></tr>)}</tbody></table></div></AnalyticsCard></div>
    <div className="website-analytics__grid website-analytics__grid--two"><AnalyticsCard title="Top Landing Pages" description="Pages receiving the most simulated views."><div className="website-analytics-table-wrap"><table className="website-analytics-table"><thead><tr><th>Path</th><th>Views</th><th>Users</th><th>Key events</th></tr></thead><tbody>{landingPages.map((page) => <tr key={page.path}><td><strong>{page.path}</strong><small>{page.title}</small></td><td>{formatNumber(page.views * multiplier)}</td><td>{formatNumber(page.users * multiplier)}</td><td>{formatNumber(page.keyEvents * multiplier)}</td></tr>)}</tbody></table></div><button className="website-analytics-link" type="button">View All Pages</button></AnalyticsCard><AnalyticsCard title="Engagement & Key Events" description="Ordinary events and configured key events are separated."><div className="website-analytics-event-summary"><div><Clock3 size={17} /><span>Engaged Sessions</span><strong>{formatNumber(12620 * multiplier)}</strong></div><div><MousePointerClick size={17} /><span>Event Count</span><strong>{formatNumber(58240 * multiplier)}</strong></div><div><CheckCircle2 size={17} /><span>Key Events</span><strong>{formatNumber(642 * multiplier)}</strong></div><div><BarChart3 size={17} /><span>Engagement Rate</span><strong>68.4%</strong></div></div><div className="website-analytics-events">{topEvents.map((event) => <div key={event.name}><span>{event.name}</span><strong>{formatNumber(event.count * multiplier)}</strong>{event.keyEvent && <Badge variant="success" size="sm">Key event</Badge>}</div>)}</div></AnalyticsCard></div>
    <div className="website-analytics__grid website-analytics__grid--three"><AnalyticsCard title="Device Category" description="Share of users"><Chart config={deviceConfig} /></AnalyticsCard><AnalyticsCard title="New vs Returning Users" description="Simulated user mix"><div className="website-analytics-split"><div><Users size={20} /><strong>{formatNumber(10872 * multiplier)}</strong><span>New users</span></div><div><RefreshCw size={20} /><strong>{formatNumber(1968 * multiplier)}</strong><span>Returning users</span></div></div></AnalyticsCard><AnalyticsCard title="Geography" description="Users by country"><Chart config={geographyConfig} /></AnalyticsCard></div>
    <div className="website-analytics__grid website-analytics__grid--two"><AnalyticsCard title="Organic Traffic Insights" description="GA4 acquisition data only; Search Console metrics are not included."><div className="website-analytics-organic"><div><Search size={18} /><span>Organic users</span><strong>{formatNumber(5120 * multiplier)}</strong></div><div><Eye size={18} /><span>Organic sessions</span><strong>{formatNumber(6840 * multiplier)}</strong></div></div><div className="website-analytics-organic-list">{organicChannels.map((channel) => <div key={channel.channel}><span>{channel.channel}</span><strong>{formatNumber(channel.sessions * multiplier)} sessions</strong></div>)}</div></AnalyticsCard><AnalyticsCard title="Top Events" description="Examples from the simulated GA4 event stream."><div className="website-analytics-top-events">{topEvents.map((event, index) => <div key={event.name}><span className="website-analytics-rank">{index + 1}</span><span>{event.name}{event.keyEvent && <Badge variant="success" size="sm">Key event</Badge>}</span><strong>{formatNumber(event.count * multiplier)}</strong></div>)}</div></AnalyticsCard></div>
  </section></div>
}
