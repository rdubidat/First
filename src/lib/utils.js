// Shared helpers: dates, money, ids, deterministic RNG for seed data.

export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

// --- IDs ---
let counter = 0
export function uid(prefix = 'id') {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`
}

// Deterministic RNG (mulberry32) so the seeded demo data is stable.
export function makeRng(seed) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

// --- Dates ---
export function isoDate(d) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toISOString().slice(0, 10)
}

export function addDays(d, n) {
  const dt = new Date(typeof d === 'string' ? d : d.getTime())
  dt.setDate(dt.getDate() + n)
  return dt
}

export function daysBetween(a, b) {
  const ms = new Date(isoDate(b)).getTime() - new Date(isoDate(a)).getTime()
  return Math.round(ms / 86400000)
}

export function startOfWeek(d) {
  const dt = new Date(typeof d === 'string' ? d : d.getTime())
  const day = (dt.getDay() + 6) % 7 // Monday = 0
  dt.setDate(dt.getDate() - day)
  dt.setHours(0, 0, 0, 0)
  return dt
}

export function fmtDate(d, opts = {}) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  })
}

export function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(d) {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}

export function ageFromDob(dob) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (365.25 * 86400000))
}

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// --- Money (stored as integer pence) ---
export function gbp(pence) {
  if (pence == null) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

export function initials(name) {
  return (name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function fullName(s) {
  return `${s.firstName} ${s.lastName}`
}
