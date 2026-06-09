// In-browser data layer. Mirrors the production multi-tenant Postgres schema
// (see db/schema.sql); persists to localStorage so the demo survives reloads.
// Every mutation goes through `mutate`, which emits domain events and runs
// the automation rules — the same event-driven shape the real backend uses.

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { buildSeedDb } from './seed'
import { applyAutomations, runDecayScan } from '../engine/automations'
import { resolveIntent, isOptOutMessage } from '../engine/comms'
import { uid, isoDate } from '../lib/utils'

const STORAGE_KEY = 'dojoos.db.v1'
const StoreContext = createContext(null)

function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const db = JSON.parse(raw)
      if (db.version === 1) return db
    }
  } catch {
    // corrupted store — fall through to reseed
  }
  return buildSeedDb()
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(loadDb)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      // storage full/unavailable — demo keeps working in memory
    }
  }, [db])

  const actions = useMemo(() => {
    // Run `fn` against a draft copy of the db. `emit` records a domain event
    // and immediately applies automation rules (queue worker in production).
    function mutate(fn) {
      setDb((prev) => {
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

      updateSettings(patch) {
        mutate((db) => Object.assign(db.school.settings, patch))
      },
      resetDemo() {
        localStorage.removeItem(STORAGE_KEY)
        setDb(buildSeedDb())
      },
    }
  }, [])

  const value = useMemo(() => ({ db, actions }), [db, actions])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook lives with its provider
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
