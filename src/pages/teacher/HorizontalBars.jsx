export default function HorizontalBars({ data, empty = 'No data yet.' }) {
  const entries = Object.entries(data)
  const max = Math.max(1, ...entries.map(([, v]) => v))
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <ul className="space-y-2.5">
      {entries.map(([label, value]) => (
        <li key={label} className="text-sm">
          <div className="flex justify-between mb-1">
            <span className="capitalize">{label.replace(/_/g, ' ')}</span>
            <span className="font-medium">{value}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden" role="presentation">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
