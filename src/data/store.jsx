// Data layer with two modes sharing one action set:
//  - demo: zero-setup, seeded dataset persisted to localStorage
//  - live: Supabase auth + Postgres; the school loads into the same in-memory
//    shape and every mutation is diff-synced through (see remote.js)
// Every mutation goes through `mutate`, which emits domain events and runs
// the automation rules — the same event-driven shape the Phase 3 backend
// moves into a queue worker.

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { buildSeedDb } from './seed'
import { applyAutomations, runDecayScan } from '../engine/automations'
import { resolveIntent, isOptOutMessage, renderTemplate } from '../engine/comms'
import { generateDrafts } from '../engine/content'
import { campaignAudience } from '../engine/campaigns'
import { supabase, isLiveMode } from '../lib/supabase'
import { fetchStaffProfile, loadSchoolDb, diffOps, pushOps } from './remote'
import { uid, isoDate } from '../lib/utils'

const STORAGE_KEY = 'dojoos.db.v1'
const StoreContext = createContext(null)

function loadLocalDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const db = JSON.parse(raw)
      if (db.version === 2) return db
      if (db.version === 1) return migrateV1toV2(db)
    }
  } catch {
    // corrupted store — fall through to reseed
  }
  return buildSeedDb()
}

// v2 adds the Phase 2 marketing collections + settings; existing data keeps.
function migrateV1toV2(db) {
  const fresh = buildSeedDb()
  return {
    ...db,
    version: 2,
    school: { ...db.school, settings: { ...fresh.school.settings, ...db.school.settings } },
    posts: fresh.posts,
    campaigns: fresh.campaigns,
    reviews: fresh.reviews,
    referrals: fresh.referrals,
  }
}

// All store actions, parameterised over setDb so both modes share them.
function makeActions(setDb, { resetDemo }) {
  // Run `fn` against a draft copy of the db. `emit` records a domain event
  // and immediately applies automation rules (queue worker in production).
  function mutate(fn) {
    setDb((prev) => {
      if (!prev) return prev
      const draft = structuredClone(prev)
      const emit = (type, payload) => {
        draft.events.push({ id: uid('evt'), schoolId: draft.school.id, type, payload, at: new Date().toISOString() })
        applyAutomations(draft, { type, payload })
      }
      fn(draft, emit)
      return draft
    })
  }

  return {
    // --- Attendance ---
    checkIn(studentId, classId, date = isoDate(new Date())) {
      mutate((db, emit) => {
        if (db.attendance.some((a) => a.studentId === studentId && a.classId === classId && a.date === date)) return
        const isFirst = !db.attendance.some((a) => a.studentId === studentId)
        db.attendance.push({
          id: uid('att'), classId, studentId, date,
          checkedInAt: new Date().toISOString(), method: 'kiosk',
        })
        emit('student.checked_in', { studentId, classId, date })
        if (isFirst) emit('student.first_class', { studentId })
      })
    },
    undoCheckIn(studentId, classId, date) {
      mutate((db) => {
        db.attendance = db.attendance.filter((a) => !(a.studentId === studentId && a.classId === classId && a.date === date))
      })
    },

    // --- Members ---
    addFamily({ payerName, email, phone }) {
      const id = uid('fam')
      mutate((db) => {
        db.families.push({
          id, schoolId: db.school.id, payerName, email, phone, optOutSms: false,
          consent: { marketing: false, recordedAt: isoDate(new Date()) },
          createdAt: new Date().toISOString(), status: 'active',
        })
      })
      return id
    },
    addStudent({ familyId, firstName, lastName, dob, programmeId, status = 'trial' }) {
      mutate((db, emit) => {
        const student = {
          id: uid('stu'), schoolId: db.school.id, familyId, firstName, lastName, dob,
          status, medicalNotes: '', photoConsent: false, emergencyContact: '',
          joinedAt: new Date().toISOString(),
        }
        db.students.push(student)
        if (programmeId) {
          const firstGrade = db.grades.filter((g) => g.programmeId === programmeId).sort((a, b) => a.sortOrder - b.sortOrder)[0]
          db.enrolments.push({
            id: uid('enr'), studentId: student.id, programmeId,
            gradeId: firstGrade?.id, gradeAwardedAt: new Date().toISOString(),
          })
        }
        emit('student.created', { studentId: student.id })
      })
    },
    updateStudent(studentId, patch) {
      mutate((db) => Object.assign(db.students.find((s) => s.id === studentId) || {}, patch))
    },
    updateFamily(familyId, patch) {
      mutate((db) => Object.assign(db.families.find((f) => f.id === familyId) || {}, patch))
    },
    eraseFamily(familyId) {
      // GDPR right-to-erasure: hard delete of the family graph.
      mutate((db) => {
        const studentIds = db.students.filter((s) => s.familyId === familyId).map((s) => s.id)
        db.students = db.students.filter((s) => s.familyId !== familyId)
        db.enrolments = db.enrolments.filter((e) => !studentIds.includes(e.studentId))
        db.attendance = db.attendance.filter((a) => !studentIds.includes(a.studentId))
        db.subscriptions = db.subscriptions.filter((s) => s.familyId !== familyId)
        db.payments = db.payments.filter((p) => p.familyId !== familyId)
        db.messages = db.messages.filter((m) => m.familyId !== familyId)
        db.tasks = db.tasks.filter((t) => !(t.relatedType === 'family' && t.relatedId === familyId) && !(t.relatedType === 'student' && studentIds.includes(t.relatedId)))
        db.gradingEvents.forEach((g) => { g.bookings = g.bookings.filter((b) => !studentIds.includes(b.studentId)) })
        db.referrals = db.referrals.filter((r) => r.referrerFamilyId !== familyId)
        db.families = db.families.filter((f) => f.id !== familyId)
      })
    },

    // --- Pipeline ---
    addLead({ name, studentName, age, phone, email, programmeId, source = 'manual' }) {
      mutate((db, emit) => {
        const lead = {
          id: uid('lead'), schoolId: db.school.id, name, studentName: studentName || name, age,
          phone, email, programmeId, source, stage: 'lead', optOutSms: false, notes: '',
          createdAt: new Date().toISOString(), trialAt: null,
        }
        db.leads.push(lead)
        emit('lead.created', { leadId: lead.id })
      })
    },
    moveLeadStage(leadId, stage) {
      mutate((db, emit) => {
        const lead = db.leads.find((l) => l.id === leadId)
        if (!lead || lead.stage === stage) return
        lead.stage = stage
        emit('lead.stage_changed', { leadId, stage })
      })
    },
    bookTrial(leadId, trialAt) {
      mutate((db, emit) => {
        const lead = db.leads.find((l) => l.id === leadId)
        if (!lead) return
        lead.trialAt = trialAt
        lead.stage = 'trial_booked'
        emit('lead.trial_booked', { leadId })
      })
    },
    signLead(leadId) {
      // Convert a won lead into a family + trial student.
      mutate((db, emit) => {
        const lead = db.leads.find((l) => l.id === leadId)
        if (!lead) return
        lead.stage = 'signed'
        const family = {
          id: uid('fam'), schoolId: db.school.id, payerName: lead.name, email: lead.email,
          phone: lead.phone, optOutSms: lead.optOutSms,
          consent: { marketing: false, recordedAt: isoDate(new Date()) },
          createdAt: new Date().toISOString(), status: 'active',
        }
        db.families.push(family)
        const [firstName, ...rest] = (lead.studentName || lead.name).split(' ')
        const student = {
          id: uid('stu'), schoolId: db.school.id, familyId: family.id, firstName,
          lastName: rest.join(' ') || lead.name.split(' ').slice(-1)[0], dob: null,
          status: 'active', medicalNotes: '', photoConsent: false,
          emergencyContact: `${lead.name} ${lead.phone}`, joinedAt: new Date().toISOString(),
        }
        db.students.push(student)
        if (lead.programmeId) {
          const firstGrade = db.grades.filter((g) => g.programmeId === lead.programmeId).sort((a, b) => a.sortOrder - b.sortOrder)[0]
          db.enrolments.push({ id: uid('enr'), studentId: student.id, programmeId: lead.programmeId, gradeId: firstGrade?.id, gradeAwardedAt: new Date().toISOString() })
          db.subscriptions.push({
            id: uid('sub'), schoolId: db.school.id, familyId: family.id, studentId: student.id,
            planId: lead.programmeId === 'prog_ninjas' ? 'plan_ninjas' : 'plan_single',
            status: 'active', provider: 'stripe', startedAt: new Date().toISOString(),
          })
        }
        emit('lead.signed', { leadId, familyId: family.id, studentId: student.id })
      })
    },

    // --- Grading ---
    createGradingEvent({ programmeId, name, date, feePence }) {
      mutate((db) => {
        db.gradingEvents.push({
          id: uid('gev'), schoolId: db.school.id, programmeId, name, date, feePence,
          status: 'scheduled', bookings: [],
        })
      })
    },
    bookGrading(eventId, studentId) {
      mutate((db) => {
        const ev = db.gradingEvents.find((g) => g.id === eventId)
        if (!ev || ev.bookings.some((b) => b.studentId === studentId)) return
        ev.bookings.push({ studentId, paid: true, result: 'pending' })
        const student = db.students.find((s) => s.id === studentId)
        db.payments.push({
          id: uid('pay'), schoolId: db.school.id, familyId: student.familyId, subscriptionId: null,
          amountPence: ev.feePence, type: 'grading', status: 'paid', provider: 'stripe', date: isoDate(new Date()),
        })
      })
    },
    recordGradingResult(eventId, studentId, result) {
      mutate((db, emit) => {
        const ev = db.gradingEvents.find((g) => g.id === eventId)
        const booking = ev?.bookings.find((b) => b.studentId === studentId)
        if (!booking) return
        booking.result = result
        if (result === 'pass') {
          const enr = db.enrolments.find((e) => e.studentId === studentId && e.programmeId === ev.programmeId)
          const grades = db.grades.filter((g) => g.programmeId === ev.programmeId).sort((a, b) => a.sortOrder - b.sortOrder)
          const idx = grades.findIndex((g) => g.id === enr?.gradeId)
          const next = idx >= 0 ? grades[idx + 1] : null
          if (enr && next) {
            enr.gradeId = next.id
            enr.gradeAwardedAt = new Date().toISOString()
            booking.newGradeId = next.id
            emit('grading.passed', { studentId, gradeId: next.id, eventId })
          }
        }
        if (ev.bookings.every((b) => b.result !== 'pending')) ev.status = 'completed'
      })
    },

    // --- Billing ---
    retryPayment(paymentId) {
      mutate((db, emit) => {
        const p = db.payments.find((x) => x.id === paymentId)
        if (!p) return
        // Demo coin-flip standing in for the Stripe retry webhook.
        if (Math.random() < 0.6) {
          p.status = 'paid'
          delete p.nextRetryAt
          emit('payment.recovered', { paymentId })
        } else {
          p.status = 'retrying'
          p.retryCount = (p.retryCount || 0) + 1
          p.nextRetryAt = isoDate(new Date(Date.now() + 2 * 86400000))
          emit('payment.failed', { paymentId })
        }
      })
    },
    setSubscriptionStatus(subId, status) {
      mutate((db, emit) => {
        const sub = db.subscriptions.find((s) => s.id === subId)
        if (!sub) return
        sub.status = status
        const student = db.students.find((s) => s.id === sub.studentId)
        if (student) student.status = status === 'frozen' ? 'frozen' : status === 'cancelled' ? 'cancelled' : 'active'
        emit(`subscription.${status}`, { subscriptionId: subId })
      })
    },

    // --- Comms ---
    sendMessage({ familyId = null, leadId = null, channel, body, subject = null }) {
      mutate((db) => {
        db.messages.push(resolveIntent(db, { familyId, leadId, channel, body, subject }))
      })
    },
    logTapToSend({ familyId = null, leadId = null, channel, body }) {
      mutate((db) => {
        db.messages.push({
          id: uid('msg'), schoolId: db.school.id, familyId, leadId, channel, direction: 'out',
          subject: null, body, automation: null, costPence: 0,
          createdAt: new Date().toISOString(), status: 'sent_from_device',
        })
      })
    },
    simulateInbound({ familyId = null, leadId = null, body }) {
      mutate((db) => {
        db.messages.push({
          id: uid('msg'), schoolId: db.school.id, familyId, leadId, channel: 'sms', direction: 'in',
          subject: null, body, automation: null, costPence: 0,
          createdAt: new Date().toISOString(), status: 'received',
        })
        // Native STOP handling at the inbound edge.
        if (isOptOutMessage(body)) {
          const rec = familyId ? db.families.find((f) => f.id === familyId) : db.leads.find((l) => l.id === leadId)
          if (rec) rec.optOutSms = true
        }
      })
    },
    broadcast({ classId, body }) {
      mutate((db) => {
        const cls = db.classes.find((c) => c.id === classId)
        if (!cls) return
        const enrolledFamilies = new Set(
          db.enrolments
            .filter((e) => e.programmeId === cls.programmeId)
            .map((e) => db.students.find((s) => s.id === e.studentId))
            .filter((s) => s && s.status === 'active')
            .map((s) => s.familyId)
        )
        for (const familyId of enrolledFamilies) {
          db.messages.push(resolveIntent(db, { familyId, channel: 'sms', body, automation: 'broadcast' }))
        }
      })
    },

    // --- Tasks & automation ---
    completeTask(taskId) {
      mutate((db) => {
        const t = db.tasks.find((x) => x.id === taskId)
        if (t) t.status = 'done'
      })
    },
    runRetentionScan() {
      mutate((db, emit) => {
        runDecayScan(db, emit)
      })
    },

    // --- Phase 2: content engine / campaigns / reviews / referrals ---
    savePost(post) {
      mutate((db) => {
        db.posts.push({
          id: uid('post'), schoolId: db.school.id, channels: ['facebook', 'instagram'],
          status: 'draft', scheduledFor: null, source: 'manual',
          eventType: null, eventAt: null, createdAt: new Date().toISOString(),
          ...post,
        })
      })
    },
    updatePost(postId, patch) {
      mutate((db) => Object.assign(db.posts.find((p) => p.id === postId) || {}, patch))
    },
    deletePost(postId) {
      mutate((db) => { db.posts = db.posts.filter((p) => p.id !== postId) })
    },
    generateContentDrafts() {
      mutate((db) => { db.posts.push(...generateDrafts(db)) })
    },
    sendCampaign({ name, subject, body, segment }) {
      mutate((db) => {
        const audience = campaignAudience(db, segment)
        for (const family of audience) {
          db.messages.push(resolveIntent(db, {
            familyId: family.id, channel: 'email', subject,
            body: renderTemplate(body, { name: family.payerName.split(' ')[0], school: db.school.name }),
            automation: 'campaign',
          }))
        }
        db.campaigns.push({
          id: uid('cmp'), schoolId: db.school.id, name, subject, body, segment,
          status: 'sent', sentAt: new Date().toISOString(), recipients: audience.length,
        })
      })
    },
    markReviewResponded(reviewId) {
      mutate((db) => Object.assign(db.reviews.find((r) => r.id === reviewId) || {}, { responded: true }))
    },
    addReferral({ referrerFamilyId, name, phone, email }) {
      mutate((db, emit) => {
        const lead = {
          id: uid('lead'), schoolId: db.school.id, name, studentName: name, age: null,
          phone, email, programmeId: null, source: 'referral', stage: 'lead',
          optOutSms: false, notes: '', createdAt: new Date().toISOString(), trialAt: null,
          referrerFamilyId,
        }
        db.leads.push(lead)
        db.referrals.push({
          id: uid('ref'), schoolId: db.school.id, referrerFamilyId, leadId: lead.id,
          status: 'pending', rewardPence: db.school.settings.referralRewardPence,
          createdAt: lead.createdAt,
        })
        emit('lead.created', { leadId: lead.id })
      })
    },
    rewardReferral(referralId) {
      mutate((db) => {
        const ref = db.referrals.find((r) => r.id === referralId)
        if (!ref) return
        ref.status = 'rewarded'
        ref.rewardedAt = new Date().toISOString()
      })
    },
    addTask({ title, relatedType = null, relatedId = null }) {
      mutate((db) => {
        db.tasks.push({
          id: uid('task'), schoolId: db.school.id, title, due: null, relatedType, relatedId,
          status: 'open', createdBy: 'automation', createdAt: new Date().toISOString(),
        })
      })
    },

    updateSettings(patch) {
      mutate((db) => Object.assign(db.school.settings, patch))
    },
    resetDemo,
  }
}

export function StoreProvider({ children }) {
  return isLiveMode() ? <LiveProvider>{children}</LiveProvider> : <DemoProvider>{children}</DemoProvider>
}

function DemoProvider({ children }) {
  const [db, setDb] = useState(loadLocalDb)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      // storage full/unavailable — demo keeps working in memory
    }
  }, [db])

  const actions = useMemo(
    () =>
      makeActions(setDb, {
        resetDemo() {
          localStorage.removeItem(STORAGE_KEY)
          setDb(buildSeedDb())
        },
      }),
    []
  )

  const value = useMemo(() => ({ db, actions, mode: 'demo', live: null }), [db, actions])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function LiveProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = checking
  const [staff, setStaff] = useState(undefined)
  const [db, setDb] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | saved | error
  const [syncError, setSyncError] = useState(null)
  const lastSynced = useRef(null)
  const queue = useRef(Promise.resolve())
  const userIdRef = useRef()

  // 1. Track the auth session. Only reset downstream state when the *user*
  //    changes — hourly token refreshes must not re-trigger a school reload.
  useEffect(() => {
    const apply = (s) => {
      setSession(s ?? null)
      const userId = s?.user?.id ?? null
      if (userIdRef.current === userId) return
      userIdRef.current = userId
      setStaff(s ? undefined : null)
      if (!s) {
        setDb(null)
        lastSynced.current = null
      }
    }
    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => apply(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // 2. Resolve the staff profile (school membership) for the signed-in user.
  const authUserId = session?.user?.id ?? null
  useEffect(() => {
    if (!authUserId) return
    let cancelled = false
    fetchStaffProfile(authUserId)
      .then((profile) => { if (!cancelled) setStaff(profile) })
      .catch((e) => { if (!cancelled) setLoadError(e.message) })
    return () => { cancelled = true }
  }, [authUserId])

  // 3. Load the school into the in-memory db shape.
  const schoolId = staff?.school_id ?? null
  useEffect(() => {
    if (!schoolId) return
    let cancelled = false
    loadSchoolDb(schoolId)
      .then((loaded) => {
        if (cancelled) return
        lastSynced.current = loaded
        setDb(loaded)
      })
      .catch((e) => { if (!cancelled) setLoadError(e.message) })
    return () => { cancelled = true }
  }, [schoolId])

  // 4. Write-through sync: diff every db transition against the last-synced
  //    snapshot and push, serialised through a promise queue.
  useEffect(() => {
    if (!db || !lastSynced.current || db === lastSynced.current) return
    const prev = lastSynced.current
    lastSynced.current = db
    const ops = diffOps(prev, db)
    if (!ops.length) return
    queue.current = queue.current
      .then(() => {
        setSyncStatus('syncing')
        return pushOps(ops)
      })
      .then(
        () => { setSyncStatus('saved'); setSyncError(null) },
        (e) => { setSyncStatus('error'); setSyncError(e.message) }
      )
  }, [db])

  const actions = useMemo(() => makeActions(setDb, { resetDemo: null }), [])

  const live = useMemo(
    () => ({
      stage: session === undefined ? 'checking'
        : session === null ? 'signed_out'
        : staff === undefined ? 'checking'
        : staff === null ? 'no_school'
        : !db && !loadError ? 'loading'
        : loadError ? 'error'
        : 'ready',
      session,
      staff,
      loadError,
      syncStatus,
      syncError,
      signOut: () => supabase.auth.signOut(),
      refreshProfile: () => fetchStaffProfile(session.user.id).then(setStaff),
    }),
    [session, staff, db, loadError, syncStatus, syncError]
  )

  const value = useMemo(() => ({ db, actions, mode: 'live', live }), [db, actions, live])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook lives with its provider
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
