// Grading engine: curriculum structure, eligibility rules, progression.

import { daysBetween } from '../lib/utils'

export function gradesForProgramme(db, programmeId) {
  return db.grades
    .filter((g) => g.programmeId === programmeId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function nextGrade(db, enrolment) {
  const grades = gradesForProgramme(db, enrolment.programmeId)
  const idx = grades.findIndex((g) => g.id === enrolment.gradeId)
  return idx >= 0 && idx < grades.length - 1 ? grades[idx + 1] : null
}

export function classesSinceGrade(db, enrolment) {
  const classIds = new Set(db.classes.filter((c) => c.programmeId === enrolment.programmeId).map((c) => c.id))
  return db.attendance.filter(
    (a) =>
      a.studentId === enrolment.studentId &&
      classIds.has(a.classId) &&
      (!enrolment.gradeAwardedAt || a.date >= enrolment.gradeAwardedAt.slice(0, 10))
  ).length
}

// Eligibility = minimum classes attended at current grade AND minimum time at
// grade, both defined on the *next* grade in the curriculum.
export function checkEligibility(db, enrolment) {
  const target = nextGrade(db, enrolment)
  if (!target) return { eligible: false, reason: 'At top grade', target: null }

  const attended = classesSinceGrade(db, enrolment)
  const daysAtGrade = enrolment.gradeAwardedAt ? daysBetween(enrolment.gradeAwardedAt, new Date()) : 9999
  const classesOk = attended >= target.minClasses
  const timeOk = daysAtGrade >= target.minDays

  return {
    eligible: classesOk && timeOk,
    target,
    attended,
    classesRequired: target.minClasses,
    daysAtGrade,
    daysRequired: target.minDays,
    reason: classesOk && timeOk ? 'Ready to grade' : !classesOk ? `Needs ${target.minClasses - attended} more classes` : `${target.minDays - daysAtGrade} more days at grade`,
  }
}

// All active students eligible for their next grade in a programme.
export function eligibleStudents(db, programmeId) {
  return db.enrolments
    .filter((e) => e.programmeId === programmeId)
    .map((e) => ({ enrolment: e, student: db.students.find((s) => s.id === e.studentId), check: checkEligibility(db, e) }))
    .filter((x) => x.student && x.student.status === 'active' && x.check.eligible)
}
