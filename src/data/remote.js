// Live-mode persistence. The whole school loads into the in-memory db shape
// on login (MACE scale: a few hundred rows), and every store mutation is
// diffed against the last-synced snapshot and written through as batched
// upserts/deletes. Last write wins; the Phase 3 backend moves this to a
// proper API + queue worker.

import { supabase } from '../lib/supabase'
import { COLLECTIONS, rowFromDoc, docFromRow } from './codec'
import { uid } from '../lib/utils'

export async function fetchStaffProfile(authId) {
  const { data, error } = await supabase
    .from('staff_users')
    .select('*')
    .eq('auth_id', authId)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function loadSchoolDb(schoolId) {
  const { data: school, error } = await supabase.from('schools').select('*').eq('id', schoolId).single()
  if (error) throw error

  const db = {
    version: 2,
    seededAt: null,
    school: docFromRow(school),
  }
  // One round-trip per collection, in parallel.
  const results = await Promise.all(
    COLLECTIONS.map(async ({ key, table }) => {
      const { data, error: err } = await supabase.from(table).select('*').eq('school_id', schoolId)
      if (err) throw new Error(`${table}: ${err.message}`)
      return [key, data.map(docFromRow)]
    })
  )
  for (const [key, docs] of results) db[key] = docs
  return db
}

// Compute upsert/delete operations between two db snapshots.
export function diffOps(prev, next) {
  const ops = []
  if (JSON.stringify(prev.school) !== JSON.stringify(next.school)) {
    ops.push({ table: 'schools', upserts: [rowFromDoc(next.school)], deletes: [] })
  }
  for (const { key, table } of COLLECTIONS) {
    const before = new Map((prev[key] || []).map((d) => [d.id, d]))
    const upserts = []
    const seen = new Set()
    for (const doc of next[key] || []) {
      seen.add(doc.id)
      const old = before.get(doc.id)
      if (!old || JSON.stringify(old) !== JSON.stringify(doc)) {
        upserts.push({ school_id: next.school.id, ...rowFromDoc(doc) })
      }
    }
    const deletes = [...before.keys()].filter((id) => !seen.has(id))
    if (upserts.length || deletes.length) ops.push({ table, upserts, deletes })
  }
  return ops
}

export async function pushOps(ops) {
  for (const { table, upserts, deletes } of ops) {
    if (upserts.length) {
      const { error } = await supabase.from(table).upsert(upserts, { returning: 'minimal' })
      if (error) throw new Error(`${table} upsert: ${error.message}`)
    }
    if (deletes.length) {
      const { error } = await supabase.from(table).delete().in('id', deletes)
      if (error) throw new Error(`${table} delete: ${error.message}`)
    }
  }
}

// Onboarding: create the school row, register the current user as owner,
// then optionally push a full seed (or a minimal empty school).
export async function createSchool({ name, user, seedDb = null }) {
  const school = seedDb
    ? { ...seedDb.school, id: uid('sch'), name }
    : {
        id: uid('sch'),
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        timezone: 'Europe/London',
        senderNumber: '',
        settings: {
          quietStart: '20:30', quietEnd: '08:00', familyDiscountPct: 15,
          freezeFeePence: 500, smsCostPence: 4, platformMarginPct: 20,
          googleReviewUrl: '', referralRewardPence: 2500,
        },
      }

  const { error: schoolErr } = await supabase.from('schools').insert(rowFromDoc(school))
  if (schoolErr) throw new Error(`school: ${schoolErr.message}`)

  const { error: staffErr } = await supabase.from('staff_users').insert({
    id: uid('staff'),
    school_id: school.id,
    auth_id: user.id,
    role: 'owner',
    name: user.user_metadata?.name || user.email,
    email: user.email,
  })
  if (staffErr) throw new Error(`staff: ${staffErr.message}`)

  if (seedDb) {
    const empty = { school, ...Object.fromEntries(COLLECTIONS.map((c) => [c.key, []])) }
    const full = { ...seedDb, school }
    await pushOps(diffOps(empty, full))
  }
  return school.id
}
