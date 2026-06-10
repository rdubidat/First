// Campaign segmentation (Phase 2): programme, grade band, attendance band.
// Marketing consent is a hard filter — newsletters only go to families who
// opted in (GDPR), unlike service messages which ride legitimate interest.

import { riskScore } from './retention'

export function campaignAudience(db, segment = {}) {
  const { programmeId = null, riskBand = null } = segment
  return db.families.filter((family) => {
    if (!family.consent?.marketing || !family.email) return false
    const students = db.students.filter((s) => s.familyId === family.id && s.status === 'active')
    if (students.length === 0) return false
    if (programmeId) {
      const inProgramme = students.some((s) =>
        db.enrolments.some((e) => e.studentId === s.id && e.programmeId === programmeId)
      )
      if (!inProgramme) return false
    }
    if (riskBand) {
      const inBand = students.some((s) => riskScore(db, s).band === riskBand)
      if (!inBand) return false
    }
    return true
  })
}

// Gmail OAuth sending caps (PRD §2): stay under these or move to Resend.
export const GMAIL_DAILY_LIMIT_FREE = 500
export const GMAIL_DAILY_LIMIT_WORKSPACE = 2000
