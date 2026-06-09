// Retention engine — the killer feature.
// Scores every active student on attendance decay, grading stall and payment
// failures. The decay scan also feeds the automation layer (parent nudge +
// instructor task when a student misses 2+ consecutive weeks).

import { startOfWeek, addDays, isoDate, daysBetween } from '../lib/utils'
import { checkEligibility } from './grading'

// Attendance counts per ISO week for the last `weeks` weeks (oldest first).
export function weeklyAttendance(db, studentId, weeks = 8) {
  const thisWeek = startOfWeek(new Date())
  const buckets = []
  for (let i = weeks - 1; i >= 0; i--) {
    const start = isoDate(addDays(thisWeek, -7 * i))
    const end = isoDate(addDays(thisWeek, -7 * i + 7))
    buckets.push({
      weekStart: start,
      count: db.attendance.filter((a) => a.studentId === studentId && a.date >= start && a.date < end).length,
    })
  }
  return buckets
}

export function consecutiveMissedWeeks(db, studentId) {
  // Exclude the current (incomplete) week so mid-week gaps don't false-flag.
  const buckets = weeklyAttendance(db, studentId, 9).slice(0, 8)
  let missed = 0
  for (let i = buckets.length - 1; i >= 0; i--) {
    if (buckets[i].count === 0) missed++
    else break
  }
  return missed
}

export function riskScore(db, student) {
  const weeks = weeklyAttendance(db, student.id, 9).slice(0, 8)
  const recent = weeks.slice(4).reduce((s, w) => s + w.count, 0)
  const prior = weeks.slice(0, 4).reduce((s, w) => s + w.count, 0)
  const missed = consecutiveMissedWeeks(db, student.id)

  let score = 0
  const reasons = []

  // Consecutive absence is the strongest signal.
  if (missed >= 4) {
    score += 55
    reasons.push(`Missed ${missed} consecutive weeks`)
  } else if (missed >= 2) {
    score += 40
    reasons.push(`Missed ${missed} consecutive weeks`)
  } else if (missed === 1) {
    score += 15
    reasons.push('Missed last week')
  }

  // Downward trend: last 4 weeks vs previous 4.
  if (prior >= 4 && recent <= prior * 0.5) {
    score += 25
    reasons.push(`Attendance halved (${prior} → ${recent} classes)`)
  } else if (prior >= 4 && recent < prior * 0.75) {
    score += 12
    reasons.push(`Attendance trending down (${prior} → ${recent})`)
  }

  // Grading stall: long past time requirement with no progress.
  const enr = db.enrolments.find((e) => e.studentId === student.id)
  if (enr) {
    const check = checkEligibility(db, enr)
    if (check.target && enr.gradeAwardedAt) {
      const daysAt = daysBetween(enr.gradeAwardedAt, new Date())
      if (daysAt > check.daysRequired * 2.5) {
        score += 15
        reasons.push(`No grading in ${Math.round(daysAt / 30)} months`)
      }
    }
  }

  // Payment friction correlates with quiet quitting.
  const failures = db.payments.filter(
    (p) => p.familyId === student.familyId && (p.status === 'failed' || p.status === 'retrying')
  )
  if (failures.length > 0) {
    score += 15
    reasons.push(`${failures.length} unresolved failed payment${failures.length > 1 ? 's' : ''}`)
  }

  score = Math.min(100, score)
  return {
    student,
    score,
    reasons,
    missedWeeks: missed,
    weeks,
    band: score >= 60 ? 'at-risk' : score >= 30 ? 'watch' : 'healthy',
  }
}

export function riskBoard(db) {
  return db.students
    .filter((s) => s.status === 'active')
    .map((s) => riskScore(db, s))
    .sort((a, b) => b.score - a.score)
}
