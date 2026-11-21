import { useId } from 'react'
import { clsx } from 'clsx'

/**
 * Wellfind loaders. Three pieces, all inline SVG (no extra dependencies):
 *  - PageLoader  : the branded magnifier + rotating ring, for page-level loading.
 *  - TableLoader : shimmering skeleton rows that fit inside a table body.
 *  - Spinner     : the small ring used inside buttons (inherits the text colour).
 */

/** Full page loader. Centres itself in the content area so the surrounding layout never shifts. */
export function PageLoader({ label = 'Loading…', fullScreen = false, size = 64, className = '' }) {
  return (
    <div
      className={clsx('wf-pageloader', fullScreen && 'wf-pageloader--screen', className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <svg
        viewBox="0 0 220 220"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="wf-pageloader__icon"
      >
        <line x1="142" y1="142" x2="188" y2="188" stroke="#00897B" strokeWidth="26" strokeLinecap="round" />
        <line x1="135" y1="135" x2="152" y2="152" stroke="#00897B" strokeWidth="10" />
        <circle cx="95" cy="95" r="66" fill="#ffffff" stroke="#00897B" strokeWidth="11" />
        <g>
          <circle cx="77" cy="67" r="16" fill="#0A1D42" />
          <path d="M 45 103 C 45 86, 62 84, 73 86 L 98 111 L 84 128 C 72 138, 45 125, 45 103 Z" fill="#0A1D42" />
          <circle cx="111" cy="95" r="13" fill="#53627A" />
          <path d="M 85 126 C 85 112, 102 108, 114 111 C 127 114, 130 128, 121 138 C 110 148, 85 142, 85 126 Z" fill="#53627A" stroke="#ffffff" strokeWidth="3" />
          <polygon points="96,74 117,69 135,80 114,85" fill="#00897B" />
          <path d="M 103 78 L 103 84 C 103 84, 114 88, 124 83 L 124 78 Z" fill="#00897B" />
          <line x1="131" y1="79" x2="131" y2="93" stroke="#00897B" strokeWidth="2.2" />
          <circle cx="131" cy="94" r="2.5" fill="#00897B" />
          <path d="M 127 101 L 135 101 L 133 95 L 129 95 Z" fill="#00897B" />
        </g>
        <circle cx="95" cy="95" r="78" fill="none" stroke="#0A1D42" strokeOpacity="0.1" strokeWidth="4.5" />
        <circle cx="95" cy="95" r="78" fill="none" stroke="#0A1D42" strokeWidth="4.5" strokeLinecap="round" strokeDasharray="140 350">
          <animateTransform attributeName="transform" type="rotate" from="0 95 95" to="360 95 95" dur="1.1s" repeatCount="indefinite" />
        </circle>
      </svg>
      {label && <span className="wf-pageloader__label">{label}</span>}
    </div>
  )
}

const ROW_H = 58

/**
 * Skeleton rows for a table. Drop it into ONE cell that spans the table
 * (`<td colSpan={n} style={{ padding: 0 }}><TableLoader columns={n} /></td>`), so the real header,
 * column widths and the surrounding card stay exactly as they are.
 * Bars are positioned in percentages, so the skeleton scales with the table without distortion.
 */
export function TableLoader({ rows = 5, columns = 5, avatar = true }) {
  const uid = useId().replace(/:/g, '')
  const gradient = `wf-shimmer-${uid}`
  const cols = Math.max(2, columns)
  const colW = 100 / cols
  // A few different bar widths so the rows look natural.
  const widths = [0.55, 0.7, 0.45, 0.62, 0.5]
  return (
    <svg
      width="100%"
      height={rows * ROW_H}
      className="wf-tableloader"
      xmlns="http://www.w3.org/2000/svg"
      role="status"
      aria-label="Loading table"
    >
      <defs>
        <linearGradient id={gradient} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#e2e8f0" />
          <animate attributeName="x1" from="-100%" to="100%" dur="1.4s" repeatCount="indefinite" />
          <animate attributeName="x2" from="0%" to="200%" dur="1.4s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      {Array.from({ length: rows }).map((_, r) => {
        const y = r * ROW_H
        return (
          <g key={r}>
            {Array.from({ length: cols }).map((__, c) => {
              const x = c * colW + 1.5
              const w = colW * widths[(r + c) % widths.length]
              const first = c === 0 && avatar
              const pill = c === Math.min(2, cols - 1) && cols > 3
              return (
                <g key={c}>
                  {first && <circle cx={`${x}%`} cy={y + 29} r="14" fill={`url(#${gradient})`} style={{ transform: 'translateX(14px)' }} />}
                  <rect
                    x={`${x}%`}
                    y={y + (pill ? 19 : 23)}
                    width={`${pill ? Math.min(w, colW * 0.5) : w}%`}
                    height={pill ? 20 : 12}
                    rx={pill ? 10 : 6}
                    fill={`url(#${gradient})`}
                    style={first ? { transform: 'translateX(40px)' } : undefined}
                  />
                </g>
              )
            })}
            {r < rows - 1 && <line x1="0" x2="100%" y1={y + ROW_H - 0.5} y2={y + ROW_H - 0.5} stroke="#f1f5f9" strokeWidth="1" />}
          </g>
        )
      })}
    </svg>
  )
}

/** Small spinning ring for buttons. Takes the button's text colour. */
export function Spinner({ size = 18, className = '', style }) {
  return (
    <svg
      className={clsx('wf-spinner', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={style}
    >
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="22 40">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
