// Seeded demo dataset at MACE scale (scaled down for the demo): one school,
// four programmes, ~24 families, 12 weeks of attendance history with
// deliberately decaying students so the retention engine has something to find.
// Deterministic RNG keeps the dataset stable between resets.

import { makeRng, pick, isoDate, addDays, startOfWeek, uid } from '../lib/utils'

const FIRST = ['Oliver', 'Amelia', 'George', 'Isla', 'Noah', 'Ava', 'Arthur', 'Ivy', 'Leo', 'Freya', 'Oscar', 'Lily', 'Archie', 'Elsie', 'Henry', 'Willow', 'Theo', 'Grace', 'Finley', 'Daisy', 'Jack', 'Florence', 'Charlie', 'Poppy', 'Jacob', 'Evie', 'Alfie', 'Sienna', 'Max', 'Ruby', 'Kai', 'Layla', 'Ethan', 'Maya', 'Lucas', 'Aisha']
const LAST = ['Smith', 'Jones', 'Williams', 'Taylor', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts', 'Johnson', 'Lewis', 'Walker', 'Robinson', 'Wood', 'Thompson', 'White', 'Watson', 'Jackson', 'Wright', 'Patel', 'Khan', 'Begum', 'Ali', 'Hussain', 'Clarke', 'Hall', 'Green']
const PARENT_FIRST = ['Sarah', 'Emma', 'James', 'Claire', 'David', 'Lisa', 'Mark', 'Rachel', 'Paul', 'Karen', 'Tom', 'Nicola', 'Andy', 'Helen', 'Chris', 'Jo', 'Dan', 'Kate', 'Sam', 'Laura', 'Mo', 'Priya', 'Imran', 'Sofia']

function gradeSet(programmeId, names, minClasses, minDays, feePence) {
  return names.map((name, i) => ({
    id: uid('grd'),
    programmeId,
    name,
    sortOrder: i,
    // First grade has no requirements (it's the starting grade).
    minClasses: i === 0 ? 0 : minClasses,
    minDays: i === 0 ? 0 : minDays,
    gradingFeePence: feePence,
  }))
}

export function buildSeedDb() {
  const rng = makeRng(20260609)
  const now = new Date()
  const school = {
    id: 'sch_mace',
    name: 'MACE Martial Arts',
    slug: 'mace',
    timezone: 'Europe/London',
    senderNumber: '+44 7700 900123',
    settings: {
      quietStart: '20:30',
      quietEnd: '08:00',
      familyDiscountPct: 15,
      freezeFeePence: 500,
      smsCostPence: 4,
      platformMarginPct: 20,
      googleReviewUrl: 'https://g.page/r/mace-martial-arts/review',
      referralRewardPence: 2500,
    },
  }

  const programmes = [
    { id: 'prog_ninjas', schoolId: school.id, name: 'Little Ninjas', ageBand: '4–6', color: '#f59e0b' },
    { id: 'prog_junior', schoolId: school.id, name: 'Junior Kickboxing', ageBand: '7–12', color: '#3b82f6' },
    { id: 'prog_adult', schoolId: school.id, name: 'Adult Kickboxing', ageBand: '13+', color: '#ef4444' },
    { id: 'prog_bjj', schoolId: school.id, name: 'Brazilian Jiu-Jitsu', ageBand: '16+', color: '#8b5cf6' },
  ]

  const beltNames = ['White Belt', 'Yellow Belt', 'Orange Belt', 'Green Belt', 'Blue Belt', 'Purple Belt', 'Red Belt', 'Brown Belt', 'Black Belt']
  const grades = [
    ...gradeSet('prog_ninjas', ['White Band', 'Yellow Band', 'Orange Band', 'Green Band', 'Blue Band', 'Black Band'], 16, 84, 1500),
    ...gradeSet('prog_junior', beltNames, 24, 112, 2500),
    ...gradeSet('prog_adult', beltNames, 24, 112, 2500),
    ...gradeSet('prog_bjj', ['White Belt', 'Blue Belt', 'Purple Belt', 'Brown Belt', 'Black Belt'], 80, 540, 3500),
  ]

  const classes = [
    { id: uid('cls'), schoolId: school.id, programmeId: 'prog_ninjas', name: 'Little Ninjas (Mon)', dayOfWeek: 0, time: '16:30', durationMins: 30, location: 'Mat 1' },
    { id: uid('cls'), schoolId: school.id, programmeId: 'prog_ninjas', name: 'Little Ninjas (Sat)', dayOfWeek: 5, time: '09:00', durationMins: 30, location: 'Mat 1' },
    { id: uid('cls'), schoolId: school.id, programmeId: 'prog_junior', name: 'Junior Kickboxing (Tue)', dayOfWeek: 1, time: '17:00', durationMins: 45, location: 'Mat 1' },
    { id: uid('cls'), schoolId: school.id, programmeId: 'prog_junior', name: 'Junior Kickboxing (Thu)', dayOfWeek: 3, time: '17:00', durationMins: 45, location: 'Mat 1' },
    { id: uid('cls'), schoolId: school.id, programmeId: 'prog_junior', name: 'Junior Kickboxing (Sat)', dayOfWeek: 5, time: '10:00', durationMins: 45, location: 'Mat 1' },
    { id: uid('cls'), schoolId: school.id, programmeId: 'prog_adult', name: 'Adult Kickboxing (Tue)', dayOfWeek: 1, time: '19:00', durationMins: 60, location: 'Mat 2' },
    { id: uid('cls'), schoolId: school.id, programmeId: 'prog_adult', name: 'Adult Kickboxing (Thu)', dayOfWeek: 3, time: '19:00', durationMins: 60, location: 'Mat 2' },
    { id: uid('cls'), schoolId: school.id, programmeId: 'prog_bjj', name: 'BJJ Fundamentals (Mon)', dayOfWeek: 0, time: '19:30', durationMins: 90, location: 'Mat 2' },
    { id: uid('cls'), schoolId: school.id, programmeId: 'prog_bjj', name: 'BJJ All Levels (Wed)', dayOfWeek: 2, time: '19:30', durationMins: 90, location: 'Mat 2' },
    { id: uid('cls'), schoolId: school.id, programmeId: 'prog_bjj', name: 'BJJ Open Mat (Sat)', dayOfWeek: 5, time: '11:00', durationMins: 90, location: 'Mat 2' },
  ]

  const plans = [
    { id: 'plan_ninjas', schoolId: school.id, name: 'Little Ninjas Unlimited', programmeIds: ['prog_ninjas'], amountPence: 3999, interval: 'month', provider: 'stripe' },
    { id: 'plan_single', schoolId: school.id, name: 'Single Programme Unlimited', programmeIds: ['prog_junior', 'prog_adult', 'prog_bjj'], amountPence: 4999, interval: 'month', provider: 'stripe' },
    { id: 'plan_all', schoolId: school.id, name: 'All Access (2+ programmes)', programmeIds: ['prog_junior', 'prog_adult', 'prog_bjj'], amountPence: 6999, interval: 'month', provider: 'stripe' },
  ]

  const families = []
  const students = []
  const enrolments = []
  const subscriptions = []

  // Attendance behaviour profiles — the retention engine needs decayers.
  const profiles = [
    ...Array(14).fill('regular'),
    ...Array(4).fill('casual'),
    ...Array(3).fill('fading'),
    ...Array(3).fill('lapsed'),
  ]

  const usedNames = new Set()
  for (let i = 0; i < 24; i++) {
    const lastName = LAST[i % LAST.length]
    const payerFirst = PARENT_FIRST[i % PARENT_FIRST.length]
    const family = {
      id: uid('fam'),
      schoolId: school.id,
      payerName: `${payerFirst} ${lastName}`,
      email: `${payerFirst.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+44 7700 9001${String(10 + i)}`,
      optOutSms: i === 21, // one opted-out family to exercise compliance paths
      consent: { marketing: i % 5 !== 0, recordedAt: isoDate(addDays(now, -200)) },
      createdAt: addDays(now, -Math.floor(rng() * 500) - 60).toISOString(),
      status: 'active',
    }
    families.push(family)

    const kidCount = rng() < 0.3 ? 2 : 1
    for (let k = 0; k < kidCount; k++) {
      let firstName = pick(rng, FIRST)
      while (usedNames.has(firstName + lastName)) firstName = pick(rng, FIRST)
      usedNames.add(firstName + lastName)

      const progIdx = i % 4 === 3 && k === 0 ? 3 : i % 3 === 0 && k === 0 ? 0 : rng() < 0.6 ? 1 : 2
      const programme = programmes[progIdx]
      const age = progIdx === 0 ? 4 + Math.floor(rng() * 3) : progIdx === 1 ? 7 + Math.floor(rng() * 6) : 16 + Math.floor(rng() * 25)
      const dob = isoDate(addDays(now, -Math.round(age * 365.25 + rng() * 300)))
      const profile = profiles[(i * 2 + k) % profiles.length]

      const student = {
        id: uid('stu'),
        schoolId: school.id,
        familyId: family.id,
        firstName,
        lastName,
        dob,
        status: 'active',
        profile, // seed-only: drives attendance generation
        medicalNotes: rng() < 0.15 ? 'Asthma — inhaler in bag' : '',
        photoConsent: rng() < 0.85,
        emergencyContact: `${family.payerName} ${family.phone}`,
        joinedAt: addDays(now, -Math.floor(rng() * 600) - 90).toISOString(),
      }
      students.push(student)

      const progGrades = grades.filter((g) => g.programmeId === programme.id)
      const gradeIdx = Math.min(progGrades.length - 2, Math.floor(rng() * 4))
      enrolments.push({
        id: uid('enr'),
        studentId: student.id,
        programmeId: programme.id,
        gradeId: progGrades[gradeIdx].id,
        gradeAwardedAt: addDays(now, -Math.floor(rng() * 200) - 40).toISOString(),
      })

      subscriptions.push({
        id: uid('sub'),
        schoolId: school.id,
        familyId: family.id,
        studentId: student.id,
        planId: progIdx === 0 ? 'plan_ninjas' : 'plan_single',
        status: 'active',
        provider: 'stripe',
        startedAt: student.joinedAt,
      })
    }
  }

  // One frozen subscription (injury) and one cancelled student for realism.
  subscriptions[5].status = 'frozen'
  students.find((s) => s.id === subscriptions[5].studentId).status = 'frozen'

  // --- Attendance: 12 full weeks of history + current week ---
  const attendance = []
  const monday = startOfWeek(now)
  for (const student of students) {
    if (student.status !== 'active') continue
    const enr = enrolments.find((e) => e.studentId === student.id)
    const studentClasses = classes.filter((c) => c.programmeId === enr.programmeId)
    for (let w = 12; w >= 0; w--) {
      const weekStart = addDays(monday, -7 * w)
      // Profile → attendance probability per scheduled class, by week age.
      let prob
      if (student.profile === 'regular') prob = 0.75
      else if (student.profile === 'casual') prob = 0.4
      else if (student.profile === 'fading') prob = w > 6 ? 0.75 : w > 2 ? 0.35 : 0.15
      else prob = w > 4 ? 0.7 : 0 // lapsed: stopped ~4 weeks ago
      for (const cls of studentClasses) {
        const date = addDays(weekStart, cls.dayOfWeek)
        if (date > now) continue
        if (rng() < prob) {
          attendance.push({
            id: uid('att'),
            classId: cls.id,
            studentId: student.id,
            date: isoDate(date),
            checkedInAt: `${isoDate(date)}T${cls.time}:00`,
            method: rng() < 0.8 ? 'kiosk' : 'register',
          })
        }
      }
    }
  }

  // --- Payments: last 3 months of family billing, a couple of failures ---
  const payments = []
  for (const family of families) {
    const subs = subscriptions.filter((s) => s.familyId === family.id && s.status !== 'cancelled')
    if (!subs.length) continue
    const base = subs.map((s) => plans.find((p) => p.id === s.planId).amountPence).sort((a, b) => b - a)
    const total = base.reduce((sum, amt, idx) => sum + (idx === 0 ? amt : Math.round(amt * 0.85)), 0)
    for (let m = 2; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
      if (d > now) continue
      payments.push({
        id: uid('pay'),
        schoolId: school.id,
        familyId: family.id,
        subscriptionId: subs[0].id,
        amountPence: total,
        type: 'subscription',
        status: 'paid',
        provider: 'stripe',
        date: isoDate(d),
      })
    }
  }
  // Two recent failures (these families also score on the risk board).
  const failIdx = [3, 17]
  for (const i of failIdx) {
    const last = payments.filter((p) => p.familyId === families[i].id).pop()
    if (last) {
      last.status = i === 3 ? 'retrying' : 'failed'
      last.failReason = i === 3 ? 'Card declined (insufficient funds)' : 'Card expired'
      last.retryCount = i === 3 ? 1 : 0
      last.nextRetryAt = isoDate(addDays(now, 2))
    }
  }

  // --- Sales pipeline ---
  const leadNames = [
    ['Hannah Foster', 'Bobby Foster', 6, 'prog_ninjas', 'meta_lead_form', 'lead'],
    ['Steve Mills', 'Steve Mills', 28, 'prog_bjj', 'website_form', 'lead'],
    ['Gemma Doyle', 'Ella Doyle', 9, 'prog_junior', 'meta_lead_form', 'contacted'],
    ['Raj Sharma', 'Arjun Sharma', 8, 'prog_junior', 'referral', 'trial_booked'],
    ['Katie Burns', 'Liam Burns', 5, 'prog_ninjas', 'walk_in', 'trial_booked'],
    ['Dean Cooper', 'Dean Cooper', 34, 'prog_adult', 'website_form', 'trial_attended'],
    ['Amy Nichols', 'Sophie Nichols', 11, 'prog_junior', 'meta_lead_form', 'offer'],
    ['Wes Palmer', 'Wes Palmer', 22, 'prog_bjj', 'google', 'lost'],
  ]
  const leads = leadNames.map(([name, studentName, age, programmeId, source, stage], i) => ({
    id: uid('lead'),
    schoolId: school.id,
    name,
    studentName,
    age,
    programmeId,
    source,
    stage,
    phone: `+44 7700 9002${String(10 + i)}`,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    optOutSms: false,
    notes: '',
    createdAt: addDays(now, -(i * 2 + 1)).toISOString(),
    trialAt: stage === 'trial_booked' ? addDays(now, i % 2 === 0 ? 1 : 2).toISOString().slice(0, 11) + '17:00:00' : null,
  }))

  // --- Grading events ---
  const gradingEvents = [
    {
      id: uid('gev'),
      schoolId: school.id,
      programmeId: 'prog_junior',
      name: 'Junior Kickboxing Summer Grading',
      date: isoDate(addDays(now, 12)),
      feePence: 2500,
      status: 'scheduled',
      bookings: [],
    },
    {
      id: uid('gev'),
      schoolId: school.id,
      programmeId: 'prog_ninjas',
      name: 'Little Ninjas Spring Grading',
      date: isoDate(addDays(now, -45)),
      feePence: 1500,
      status: 'completed',
      bookings: students
        .filter((s) => enrolments.find((e) => e.studentId === s.id)?.programmeId === 'prog_ninjas')
        .slice(0, 4)
        .map((s) => ({ studentId: s.id, paid: true, result: 'pass' })),
    },
  ]

  // --- A few seeded conversations & tasks so the inbox isn't empty ---
  const messages = [
    {
      id: uid('msg'), schoolId: school.id, familyId: families[2].id, leadId: null, channel: 'sms', direction: 'in',
      body: 'Hi, is there class on bank holiday Monday?', status: 'received', costPence: 0,
      createdAt: addDays(now, -1).toISOString(), automation: null, subject: null,
    },
    {
      id: uid('msg'), schoolId: school.id, familyId: families[2].id, leadId: null, channel: 'sms', direction: 'out',
      body: 'Hi! Yes — normal timetable on bank holiday Monday. See you there!', status: 'sent', costPence: 4,
      createdAt: addDays(now, -1).toISOString(), automation: null, subject: null,
    },
    {
      id: uid('msg'), schoolId: school.id, familyId: families[17].id, leadId: null, channel: 'sms', direction: 'out',
      body: `Hi Kate, your payment of £49.99 to MACE Martial Arts didn't go through. No drama — we'll retry automatically in a few days, or you can update your card here: https://billing.dojoos.app/update-card`,
      status: 'sent', costPence: 4, createdAt: addDays(now, -2).toISOString(), automation: 'payment-dunning', subject: null,
    },
  ]

  const tasks = [
    {
      id: uid('task'), schoolId: school.id, title: `Call new lead ${leads[0].name} (speed-to-lead — within 5 min)`,
      due: null, relatedType: 'lead', relatedId: leads[0].id, status: 'open', createdBy: 'automation',
      createdAt: addDays(now, -1).toISOString(),
    },
    {
      id: uid('task'), schoolId: school.id, title: `Failed payment £49.99 — ${families[17].payerName} (retry scheduled)`,
      due: addDays(now, 2).toISOString(), relatedType: 'family', relatedId: families[17].id, status: 'open',
      createdBy: 'automation', createdAt: addDays(now, -2).toISOString(),
    },
  ]

  const events = [
    { id: uid('evt'), schoolId: school.id, type: 'payment.failed', payload: {}, at: addDays(now, -2).toISOString() },
    { id: uid('evt'), schoolId: school.id, type: 'lead.created', payload: { leadId: leads[0].id }, at: leads[0].createdAt },
    // Pass results from the completed grading — gives the content engine
    // recent moments to draft from on first load.
    ...gradingEvents[1].bookings.map((b) => ({
      id: uid('evt'),
      schoolId: school.id,
      type: 'grading.passed',
      payload: { studentId: b.studentId, gradeId: enrolments.find((e) => e.studentId === b.studentId)?.gradeId },
      at: addDays(now, -20).toISOString(),
    })),
  ]

  // --- Phase 2: marketing layer seeds ---
  const posts = [
    {
      id: uid('post'), schoolId: school.id, channels: ['facebook', 'instagram'],
      body: `🥋 Grading day is coming! ${isoDate(addDays(now, 12))} — Junior Kickboxing Summer Grading. Eligible students have been invited. Parents: doors open 30 minutes early for good seats!\n\n#MACEMartialArts #GradingDay`,
      status: 'scheduled', scheduledFor: addDays(now, 5).toISOString(), source: 'manual',
      eventType: null, eventAt: null, createdAt: addDays(now, -2).toISOString(),
    },
    {
      id: uid('post'), schoolId: school.id, channels: ['facebook', 'gbp'],
      body: `Did you know we run Little Ninjas classes for 4–6 year olds every Monday and Saturday? Confidence, focus and fun — book a free trial via the link in bio. 🐉`,
      status: 'published', scheduledFor: addDays(now, -7).toISOString(), source: 'manual',
      eventType: null, eventAt: null, createdAt: addDays(now, -9).toISOString(),
    },
  ]

  const campaigns = [
    {
      id: uid('cmp'), schoolId: school.id, name: 'May newsletter',
      subject: 'New timetable, grading dates & member of the month 🥋',
      body: 'Hi {name},\n\nHere is everything happening at MACE this month...',
      segment: { programmeId: null, riskBand: null },
      status: 'sent', sentAt: addDays(now, -20).toISOString(), recipients: 19,
    },
  ]

  const reviews = [
    { id: uid('rev'), schoolId: school.id, author: 'Claire D.', rating: 5, text: 'My son has come on leaps and bounds since joining. The instructors genuinely care and the grading days are brilliantly run.', date: isoDate(addDays(now, -12)), source: 'google', responded: true },
    { id: uid('rev'), schoolId: school.id, author: 'Imran K.', rating: 5, text: 'Fantastic club. Great with the little ones and the family discount makes it affordable for both my kids.', date: isoDate(addDays(now, -28)), source: 'google', responded: false },
    { id: uid('rev'), schoolId: school.id, author: 'Becky H.', rating: 4, text: 'Really good classes, parking can be tight on Saturdays but worth it.', date: isoDate(addDays(now, -45)), source: 'google', responded: false },
  ]

  const referrals = [
    {
      id: uid('ref'), schoolId: school.id, referrerFamilyId: families[1].id,
      leadId: leads[3].id, // Raj Sharma came via referral
      status: 'pending', rewardPence: 2500, createdAt: leads[3].createdAt,
    },
  ]

  const templates = [
    { id: uid('tpl'), name: 'Trial follow-up', body: 'Hi {name}, great to see {studentName} at their trial today! Ready to get them started? Our beginner offer is 2 weeks + uniform for £19.' },
    { id: uid('tpl'), name: 'Bank holiday hours', body: 'Hi {name}, just a heads up — normal timetable runs on the bank holiday. See you on the mats!' },
    { id: uid('tpl'), name: 'Grading invite', body: 'Hi {name}, {studentName} is eligible for their next grading! Book their spot here: {link}' },
    { id: uid('tpl'), name: 'Welcome back', body: 'Hi {name}, lovely to see {studentName} back in class this week — keep the momentum going!' },
    { id: uid('tpl'), name: 'Class cancelled', body: 'Hi {name}, unfortunately tonight\'s class is cancelled. We\'re sorry for the short notice — see you at the next session!' },
  ]

  return {
    version: 2,
    seededAt: now.toISOString(),
    school,
    programmes,
    grades,
    classes,
    plans,
    families,
    students,
    enrolments,
    subscriptions,
    attendance,
    payments,
    leads,
    gradingEvents,
    messages,
    tasks,
    events,
    templates,
    posts,
    campaigns,
    reviews,
    referrals,
  }
}
