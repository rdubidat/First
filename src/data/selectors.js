// Common read-side selectors over the db shape.

import { fullName } from '../lib/utils'

export function studentName(db, studentId) {
  const s = db.students.find((x) => x.id === studentId)
  return s ? fullName(s) : 'Unknown student'
}

export function enrolmentsFor(db, studentId) {
  return db.enrolments.filter((e) => e.studentId === studentId)
}

export function gradeName(db, gradeId) {
  return db.grades.find((g) => g.id === gradeId)?.name || '—'
}

export function programmeName(db, programmeId) {
  return db.programmes.find((p) => p.id === programmeId)?.name || '—'
}

export function conversationKey(m) {
  return m.familyId ? `fam:${m.familyId}` : `lead:${m.leadId}`
}
