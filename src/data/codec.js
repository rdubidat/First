// Row codec: the client store uses camelCase documents; Postgres columns are
// their snake_case mirror (see supabase/migrations/001_init.sql). Nested
// objects/arrays (settings, consent, bookings, channels, segment, payload)
// ride as jsonb values unchanged.

export function camelToSnake(key) {
  return key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
}

export function snakeToCamel(key) {
  return key.replace(/_([a-z0-9])/g, (m, c) => c.toUpperCase())
}

export function rowFromDoc(doc) {
  const row = {}
  for (const [k, v] of Object.entries(doc)) {
    row[camelToSnake(k)] = v === undefined ? null : v
  }
  return row
}

export function docFromRow(row) {
  const doc = {}
  for (const [k, v] of Object.entries(row)) {
    if (v === null) continue // absent fields stay absent, matching seed shape
    doc[snakeToCamel(k)] = v
  }
  return doc
}

// Collections that sync 1:1 with a table of the same name.
// Order matters only for readability; the live schema has no FK constraints
// so batched upserts/deletes are order-independent.
export const COLLECTIONS = [
  { key: 'programmes', table: 'programmes' },
  { key: 'grades', table: 'grades' },
  { key: 'classes', table: 'classes' },
  { key: 'plans', table: 'plans' },
  { key: 'families', table: 'families' },
  { key: 'students', table: 'students' },
  { key: 'enrolments', table: 'enrolments' },
  { key: 'subscriptions', table: 'subscriptions' },
  { key: 'attendance', table: 'attendance' },
  { key: 'payments', table: 'payments' },
  { key: 'leads', table: 'leads' },
  { key: 'gradingEvents', table: 'grading_events' },
  { key: 'messages', table: 'messages' },
  { key: 'tasks', table: 'tasks' },
  { key: 'events', table: 'events' },
  { key: 'templates', table: 'templates' },
  { key: 'posts', table: 'posts' },
  { key: 'campaigns', table: 'campaigns' },
  { key: 'reviews', table: 'reviews' },
  { key: 'referrals', table: 'referrals' },
]
