// Automation rules. Event-driven core: every action emits a domain event;
// rules here subscribe to events and produce message intents + tasks.
// In production this runs in a queue worker (Inngest / pg-cron); here the
// same pure functions run synchronously against the in-browser store.

import { uid, fullName, addDays } from '../lib/utils'
import { resolveIntent, renderTemplate } from './comms'
import { consecutiveMissedWeeks } from './retention'

function task(db, { title, due = null, relatedType = null, relatedId = null }) {
  return {
    id: uid('task'),
    schoolId: db.school.id,
    title,
    due,
    relatedType,
    relatedId,
    status: 'open',
    createdBy: 'automation',
    createdAt: new Date().toISOString(),
  }
}

function send(db, intent) {
  db.messages.push(resolveIntent(db, intent))
}

const T = {
  speedToLeadSms:
    'Hi {name}! Thanks for your enquiry about {programme} at {school}. When works best for a free trial class this week? Reply here or call us on {phone}. Reply STOP to opt out.',
  speedToLeadEmail:
    "Hi {name},\n\nThanks for your interest in {programme} at {school}! We'd love to get {studentName} booked in for a free trial class.\n\nJust reply to this email with a day that suits, or call us on {phone}.\n\nSee you on the mats,\n{school}",
  trialReminder24h: 'Hi {name}, a reminder that {studentName} has a trial class at {school} tomorrow at {time}. Wear something comfy — see you there!',
  trialReminder2h: 'Hi {name}, see you in a couple of hours for {studentName}\'s trial at {school}! Any problems finding us, call {phone}.',
  decayNudge:
    "Hi {name}, we've missed {studentName} at {programme} the last couple of weeks! Everything OK? Their next grading is coming up and we'd hate for them to lose momentum. See you this week?",
  paymentFailed:
    'Hi {name}, your payment of {amount} to {school} didn\'t go through. No drama — we\'ll retry automatically in a few days, or you can update your card here: {link}',
  beltCongrats:
    'Huge congratulations to {studentName} on earning their {grade} at {school} today! 🥋 Their certificate is ready to collect at the front desk.',
  firstClassFollowUp:
    'Hi {name}, great to have {studentName} in class today for the first time! Any questions at all, just reply here. Welcome to the {school} family!',
}

function ctxFor(db, { family, lead, student, extra = {} }) {
  return {
    school: db.school.name,
    phone: db.school.senderNumber,
    name: (family?.payerName || lead?.name || '').split(' ')[0],
    studentName: student ? student.firstName : lead?.studentName || '',
    ...extra,
  }
}

// --- Rule handlers, keyed by event type ---
const rules = {
  'lead.created'(db, event) {
    const lead = db.leads.find((l) => l.id === event.payload.leadId)
    if (!lead) return
    const programme = db.programmes.find((p) => p.id === lead.programmeId)
    const ctx = ctxFor(db, { lead, extra: { programme: programme?.name || 'classes' } })
    send(db, { leadId: lead.id, channel: 'sms', body: renderTemplate(T.speedToLeadSms, ctx), automation: 'speed-to-lead' })
    if (lead.email) {
      send(db, {
        leadId: lead.id,
        channel: 'email',
        subject: `Your free trial at ${db.school.name}`,
        body: renderTemplate(T.speedToLeadEmail, ctx),
        automation: 'speed-to-lead',
      })
    }
    db.tasks.push(task(db, { title: `Call new lead ${lead.name} (speed-to-lead — within 5 min)`, relatedType: 'lead', relatedId: lead.id }))
  },

  'lead.trial_booked'(db, event) {
    const lead = db.leads.find((l) => l.id === event.payload.leadId)
    if (!lead || !lead.trialAt) return
    const time = new Date(lead.trialAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const ctx = ctxFor(db, { lead, extra: { time } })
    const trial = new Date(lead.trialAt)
    send(db, {
      leadId: lead.id, channel: 'sms', automation: 'trial-reminder-24h',
      body: renderTemplate(T.trialReminder24h, ctx),
      scheduledFor: new Date(trial.getTime() - 24 * 3600000).toISOString(),
    })
    send(db, {
      leadId: lead.id, channel: 'sms', automation: 'trial-reminder-2h',
      body: renderTemplate(T.trialReminder2h, ctx),
      scheduledFor: new Date(trial.getTime() - 2 * 3600000).toISOString(),
    })
  },

  'attendance.decay'(db, event) {
    const student = db.students.find((s) => s.id === event.payload.studentId)
    const family = db.families.find((f) => f.id === student?.familyId)
    if (!student || !family) return
    const enr = db.enrolments.find((e) => e.studentId === student.id)
    const programme = db.programmes.find((p) => p.id === enr?.programmeId)
    const ctx = ctxFor(db, { family, student, extra: { programme: programme?.name || 'class' } })
    send(db, { familyId: family.id, channel: 'sms', body: renderTemplate(T.decayNudge, ctx), automation: 'attendance-decay' })
    db.tasks.push(
      task(db, {
        title: `Check in on ${fullName(student)} — missed ${event.payload.missedWeeks} consecutive weeks`,
        relatedType: 'student',
        relatedId: student.id,
      })
    )
  },

  'payment.failed'(db, event) {
    const payment = db.payments.find((p) => p.id === event.payload.paymentId)
    const family = db.families.find((f) => f.id === payment?.familyId)
    if (!payment || !family) return
    const ctx = ctxFor(db, {
      family,
      extra: { amount: `£${(payment.amountPence / 100).toFixed(2)}`, link: 'https://billing.dojoos.app/update-card' },
    })
    send(db, { familyId: family.id, channel: 'sms', body: renderTemplate(T.paymentFailed, ctx), automation: 'payment-dunning' })
    db.tasks.push(
      task(db, {
        title: `Failed payment £${(payment.amountPence / 100).toFixed(2)} — ${family.payerName} (retry scheduled)`,
        due: addDays(new Date(), 3).toISOString(),
        relatedType: 'family',
        relatedId: family.id,
      })
    )
  },

  'grading.passed'(db, event) {
    const student = db.students.find((s) => s.id === event.payload.studentId)
    const family = db.families.find((f) => f.id === student?.familyId)
    const grade = db.grades.find((g) => g.id === event.payload.gradeId)
    if (!student || !family || !grade) return
    const ctx = ctxFor(db, { family, student, extra: { grade: grade.name } })
    send(db, { familyId: family.id, channel: 'sms', body: renderTemplate(T.beltCongrats, ctx), automation: 'belt-congrats' })
  },

  'student.first_class'(db, event) {
    const student = db.students.find((s) => s.id === event.payload.studentId)
    const family = db.families.find((f) => f.id === student?.familyId)
    if (!student || !family) return
    const ctx = ctxFor(db, { family, student })
    send(db, { familyId: family.id, channel: 'sms', body: renderTemplate(T.firstClassFollowUp, ctx), automation: 'first-class-follow-up' })
  },
}

// Apply automation rules for an event. Mutates the draft db (caller owns the
// copy) and returns it.
export function applyAutomations(db, event) {
  const handler = rules[event.type]
  if (handler) handler(db, event)
  return db
}

// Retention scan: active students who've missed >= 2 consecutive full weeks
// and haven't been nudged in the last 14 days.
export function decayCandidates(db) {
  const cutoff = addDays(new Date(), -14).toISOString()
  const out = []
  for (const student of db.students.filter((s) => s.status === 'active')) {
    const missed = consecutiveMissedWeeks(db, student.id)
    if (missed < 2) continue
    const recentNudge = db.messages.some(
      (m) => m.familyId === student.familyId && m.automation === 'attendance-decay' && m.createdAt > cutoff
    )
    if (recentNudge) continue
    out.push({ student, missed })
  }
  return out
}

export function runDecayScan(db, emit) {
  const candidates = decayCandidates(db)
  for (const { student, missed } of candidates) {
    emit('attendance.decay', { studentId: student.id, missedWeeks: missed })
  }
  return candidates.length
}
