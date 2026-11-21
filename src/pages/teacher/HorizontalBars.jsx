export default function HorizontalBars({ data, empty = 'No data yet.' }) {
  const entries = Object.entries(data)
  const max = Math.max(1, ...entries.map(([, v]) => v))
  if (entries.length === 0) return <p className="wf-empty" style={{ margin: 0 }}>{empty}</p>
  return (
    <ul className="wf-hbars">
      {entries.map(([label, value]) => (
        <li key={label}>
          <div><span>{label.replace(/_/g, ' ')}</span><b>{value}</b></div>
          <i role="presentation"><em style={{ width: `${(value / max) * 100}%` }} /></i>
        </li>
      ))}
    </ul>
  )
}
