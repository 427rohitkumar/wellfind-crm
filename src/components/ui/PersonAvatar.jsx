import { useState } from 'react'
import { API_BASE_URL } from '@/services/apiClient'

const BGS = ['#DCEBFF', '#D7F6F1', '#FFE9D6', '#EADFFF', '#FFE0E6', '#E3F3C9']
const SKINS = ['#F6D2B5', '#E9B58F', '#D49A72', '#B97B54']
const HAIRS = ['#1F2937', '#3B2A20', '#5A3A22', '#111827']

const hash = (s = '') => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** Normalises free-form gender text to 'male' | 'female' | null. */
function normalizeGender(g) {
  const v = String(g || '').trim().toLowerCase()
  if (['male', 'm', 'boy', 'man'].includes(v)) return 'male'
  if (['female', 'f', 'girl', 'woman'].includes(v)) return 'female'
  return null
}

function Character({ gender, role, skin, hair, shirt }) {
  const female = gender === 'female'
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true" focusable="false">
      {/* shoulders */}
      <path d="M8 64c1-12 10-18 24-18s23 6 24 18z" fill={shirt} />
      {role === 'teacher' && <path d="M26 46l6 8 6-8z" fill="#fff" opacity=".9" />}
      {/* neck */}
      <rect x="28" y="38" width="8" height="10" rx="3" fill={skin} />
      {/* hair behind (female long hair) */}
      {female && <path d="M15 34c-1-14 6-22 17-22s18 8 17 22c0 6-2 12-4 14H19c-2-2-4-8-4-14z" fill={hair} />}
      {/* face */}
      <ellipse cx="32" cy="29" rx="10.5" ry="12" fill={skin} />
      {/* hair top */}
      {female ? (
        <path d="M21 27c0-9 5-14 11-14s11 5 11 14c-3-3-6-6-11-7-5 1-8 4-11 7z" fill={hair} />
      ) : (
        <path d="M21 27c-1-10 4-16 11-16s12 6 11 16c-2-4-4-6-6-7-4 1-9 1-12 0-2 1-3 3-4 7z" fill={hair} />
      )}
      {/* eyes + smile */}
      <circle cx="27.8" cy="30" r="1.3" fill="#1F2937" />
      <circle cx="36.2" cy="30" r="1.3" fill="#1F2937" />
      <path d="M28 35.5c2.5 2.2 5.5 2.2 8 0" fill="none" stroke="#1F2937" strokeWidth="1.3" strokeLinecap="round" />
      {role === 'teacher' && !female && (
        <g fill="none" stroke="#1F2937" strokeWidth="1">
          <circle cx="27.8" cy="30" r="3.2" /><circle cx="36.2" cy="30" r="3.2" /><path d="M31 30h2" />
        </g>
      )}
    </svg>
  )
}

/**
 * Round avatar. Shows the uploaded photo when there is one; otherwise an illustrated
 * character that matches the gender (male / female), or a neutral initial circle when unknown.
 */
export function PersonAvatar({ src: rawSrc, name = '', gender, role = 'student', size = 40, className = '' }) {
  const [broken, setBroken] = useState(false)
  // Photos kept on the API's own disk come back as relative paths; Cloudinary ones are absolute.
  const src = typeof rawSrc === 'string' && rawSrc.startsWith('/') ? `${API_BASE_URL}${rawSrc}` : rawSrc
  const g = normalizeGender(gender)
  const h = hash(name)
  const style = { width: size, height: size, borderRadius: '50%', overflow: 'hidden', flex: 'none', display: 'inline-grid', placeItems: 'center', background: BGS[h % BGS.length], boxShadow: 'inset 0 0 0 1px rgba(15,23,42,.08)' }

  if (src && !broken) {
    return <span className={className} style={style}><img src={src} alt={name} onError={() => setBroken(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></span>
  }
  if (!g) {
    const initial = (name.trim()[0] || '?').toUpperCase()
    return <span className={className} style={{ ...style, fontWeight: 700, color: '#334155', fontSize: size * 0.42 }} aria-label={name}>{initial}</span>
  }
  const shirt = role === 'teacher' ? ['#2563EB', '#0F766E', '#7C3AED'][h % 3] : ['#F59E0B', '#EC4899', '#10B981', '#3B82F6'][h % 4]
  return (
    <span className={className} style={style} role="img" aria-label={name}>
      <Character gender={g} role={role} skin={SKINS[(h >> 3) % SKINS.length]} hair={HAIRS[(h >> 5) % HAIRS.length]} shirt={shirt} />
    </span>
  )
}
