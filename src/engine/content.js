// Phase 2 content engine: CRM events auto-draft social posts in the school's
// voice. In production this calls the Anthropic API with the school's voice
// profile; the demo uses curated templates so the full loop is testable
// offline. The calendar/scheduling layer is identical either way.

import { uid, fullName } from '../lib/utils'
import { gradeName, programmeName, studentName } from '../data/selectors'

const POST_TEMPLATES = {
  'grading.passed': [
    (ctx) => `🥋 HUGE congratulations to ${ctx.student} on earning their ${ctx.grade} this week! Months of consistency on the mats paying off. We're so proud. 👏\n\n#${ctx.tag} #MartialArts #${ctx.programmeTag}`,
    (ctx) => `New ${ctx.grade} in the building! 🎉 ${ctx.student} smashed their grading — every class, every rep counted. Who's next?\n\n#${ctx.tag} #GradingDay`,
  ],
  'lead.signed': [
    (ctx) => `Big welcome to ${ctx.student}, the newest member of the ${ctx.school} family! 🥊 First class done — the journey starts here.\n\n#${ctx.tag} #NewMember`,
  ],
  'student.first_class': [
    (ctx) => `First class ✅ for ${ctx.student} today! The hardest belt to earn is the white one — showing up is the win. Welcome aboard! 💪\n\n#${ctx.tag}`,
  ],
}

function tagify(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '')
}

// Draft a post for a domain event; returns null for non-content events.
export function draftPostForEvent(db, event, variant = 0) {
  const templates = POST_TEMPLATES[event.type]
  if (!templates) return null
  const student = event.payload.studentId ? db.students.find((s) => s.id === event.payload.studentId) : null
  const ctx = {
    school: db.school.name,
    tag: tagify(db.school.name),
    student: student ? fullName(student) : studentName(db, event.payload.studentId),
    grade: event.payload.gradeId ? gradeName(db, event.payload.gradeId) : '',
    programmeTag: tagify(programmeName(db, db.enrolments.find((e) => e.studentId === event.payload.studentId)?.programmeId) || ''),
  }
  // Respect photo/social consent: no named posts for students without it.
  if (student && !student.photoConsent) return null
  const make = templates[variant % templates.length]
  return {
    id: uid('post'),
    schoolId: db.school.id,
    channels: ['facebook', 'instagram'],
    body: make(ctx),
    status: 'draft',
    scheduledFor: null,
    source: 'content-engine',
    eventType: event.type,
    eventAt: event.at || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
}

// Scan recent events and draft posts for anything not yet drafted.
export function generateDrafts(db, daysBack = 30) {
  const cutoff = new Date(Date.now() - daysBack * 86400000).toISOString()
  const covered = new Set(db.posts.map((p) => `${p.eventType}:${p.eventAt}`))
  const drafts = []
  let variant = db.posts.length
  for (const event of db.events) {
    if (event.at < cutoff || !POST_TEMPLATES[event.type]) continue
    if (covered.has(`${event.type}:${event.at}`)) continue
    const draft = draftPostForEvent(db, { ...event }, variant++)
    if (draft) {
      draft.eventAt = event.at
      drafts.push(draft)
    }
  }
  return drafts
}

// ---------------------------------------------------------------------------
// AI receptionist (Phase 2): out-of-hours FAQ + trial booking with escalation.
// Demo brain is rule-based; production swaps in the Anthropic API behind the
// same respond() contract — the booking flow and escalation stay identical.
// ---------------------------------------------------------------------------

export function receptionistRespond(db, text, state = {}) {
  const t = text.toLowerCase()
  const say = (reply, next = {}) => ({ reply, state: { ...state, ...next } })

  // Mid-flow: collecting trial booking details.
  if (state.flow === 'trial_name') {
    return say(`Lovely to meet you! And the best mobile number to confirm the trial on?`, { flow: 'trial_phone', name: text.trim() })
  }
  if (state.flow === 'trial_phone') {
    return {
      reply: `Perfect — you're booked in for a free trial, ${state.name.split(' ')[0]}! You'll get a text shortly to confirm a day. Anything else I can help with?`,
      state: { flow: null },
      createLead: { name: state.name, phone: text.trim(), source: 'ai_receptionist' },
    }
  }

  if (/\b(trial|try|start|join|sign\s*up|book)\b/.test(t)) {
    return say(`We'd love to have you in for a **free trial class**! Can I grab your name?`, { flow: 'trial_name', misses: 0 })
  }
  if (/\b(price|cost|how much|fees?|membership)\b/.test(t)) {
    const cheapest = Math.min(...db.plans.map((p) => p.amountPence))
    return say(
      `Memberships start from £${(cheapest / 100).toFixed(2)}/month for unlimited classes in one programme, with family discounts for siblings. The best first step is a free trial — want me to book one?`
    )
  }
  if (/\b(age|old|young|kids?|child|toddler)\b/.test(t)) {
    const bands = db.programmes.map((p) => `${p.name} (${p.ageBand})`).join(', ')
    return say(`We run classes for all ages: ${bands}. Which one sounds right?`)
  }
  if (/\b(time|when|schedule|timetable|class(es)? on|open)\b/.test(t)) {
    const days = [...new Set(db.classes.map((c) => c.dayOfWeek))].length
    return say(`We run ${db.classes.length} classes a week across ${days} days — evenings on weekdays plus Saturday mornings. Tell me the student's age and I'll point you at the right sessions.`)
  }
  if (/\b(where|address|location|find you|parking)\b/.test(t)) {
    return say(`You'll find us at the ${db.school.name} academy — free parking on site. Want me to text you directions?`)
  }
  if (/\b(grading|belt|certificate)\b/.test(t)) {
    return say(`Gradings run roughly every quarter per programme. Students are invited automatically once they've hit the class and time requirements for their next belt.`)
  }

  // Escalate after two misses rather than guessing.
  const misses = (state.misses || 0) + 1
  if (misses >= 2) {
    return {
      reply: `That one's beyond me — I've passed your question to the team and someone will get back to you first thing. Is there anything else I can help with?`,
      state: { ...state, misses: 0 },
      escalate: text,
    }
  }
  return say(`Sorry, I didn't quite catch that! I can help with class times, prices, age groups, gradings, or booking a free trial.`, { misses })
}
