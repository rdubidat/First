import { useParams, Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { programmeName, gradeName } from '../data/selectors'
import { PageHeader } from '../components/Layout'
import { Card, Avatar, StatusBadge, Badge, EmptyState, Sparkbar } from '../components/ui'
import { checkEligibility, gradesForProgramme } from '../engine/grading'
import { riskScore, weeklyAttendance } from '../engine/retention'
import { fullName, fmtDate, ageFromDob } from '../lib/utils'

export default function StudentDetail() {
  const { studentId } = useParams()
  const { db, actions } = useStore()

  const student = db.students.find((s) => s.id === studentId)
  if (!student) return <EmptyState>Student not found.</EmptyState>

  const family = db.families.find((f) => f.id === student.familyId)
  const enrolments = db.enrolments.filter((e) => e.studentId === studentId)
  const attendance = db.attendance.filter((a) => a.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date))
  const risk = student.status === 'active' ? riskScore(db, student) : null
  const weeks = weeklyAttendance(db, studentId, 12)
  const age = ageFromDob(student.dob)

  return (
    <div>
      <PageHeader
        title={fullName(student)}
        sub={
          <span>
            {age != null ? `${age} yrs · ` : ''}
            <Link to={`/members/family/${family?.id}`} className="text-blue-600 hover:underline">
              {family?.payerName}
            </Link>{' '}
            · joined {fmtDate(student.joinedAt)}
          </span>
        }
        action={<StatusBadge status={student.status} />}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {enrolments.map((enr) => {
            const check = checkEligibility(db, enr)
            const grades = gradesForProgramme(db, enr.programmeId)
            const currentIdx = grades.findIndex((g) => g.id === enr.gradeId)
            return (
              <Card key={enr.id} title={`${programmeName(db, enr.programmeId)} — grading progress`}>
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {grades.map((g, i) => (
                    <span
                      key={g.id}
                      className={`text-xs px-2 py-1 rounded-md font-medium ${
                        i < currentIdx ? 'bg-slate-200 text-slate-500' : i === currentIdx ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 border border-dashed border-slate-200'
                      }`}
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-500">Current grade</div>
                    <div className="font-semibold text-slate-800">{gradeName(db, enr.gradeId)}</div>
                    <div className="text-xs text-slate-400">since {fmtDate(enr.gradeAwardedAt)}</div>
                  </div>
                  {check.target ? (
                    <>
                      <div>
                        <div className="text-xs text-slate-500">Classes toward {check.target.name}</div>
                        <div className="font-semibold text-slate-800">{check.attended} / {check.classesRequired}</div>
                        <div className="h-1.5 bg-slate-100 rounded-full mt-1.5">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full"
                            style={{ width: `${Math.min(100, (check.attended / Math.max(1, check.classesRequired)) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Eligibility</div>
                        <Badge color={check.eligible ? 'green' : 'amber'}>{check.reason}</Badge>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 text-slate-500">At the top of the curriculum 🏆</div>
                  )}
                </div>
              </Card>
            )
          })}

          <Card title="Attendance — last 12 weeks">
            <Sparkbar values={weeks.map((w) => w.count)} height={56} barClass="bg-blue-500" />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>12 weeks ago</span><span>this week</span>
            </div>
            <div className="mt-4 max-h-56 overflow-y-auto divide-y divide-slate-50">
              {attendance.slice(0, 20).map((a) => {
                const cls = db.classes.find((c) => c.id === a.classId)
                return (
                  <div key={a.id} className="flex justify-between py-1.5 text-sm">
                    <span className="text-slate-700">{cls?.name}</span>
                    <span className="text-xs text-slate-400">{fmtDate(a.date)} · {a.method}</span>
                  </div>
                )
              })}
              {attendance.length === 0 && <EmptyState>No attendance recorded.</EmptyState>}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {risk && (
            <Card title="Retention risk">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-slate-900">{risk.score}</span>
                <StatusBadge status={risk.band} />
              </div>
              {risk.reasons.length > 0 ? (
                <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                  {risk.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No risk signals — attending consistently.</p>
              )}
            </Card>
          )}

          <Card title="Record">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Date of birth</dt>
                <dd className="text-slate-700">{student.dob ? fmtDate(student.dob) : '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Photo consent</dt>
                <dd>
                  <input
                    type="checkbox"
                    checked={student.photoConsent}
                    onChange={(e) => actions.updateStudent(studentId, { photoConsent: e.target.checked })}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 mb-1">Medical notes</dt>
                <dd>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-amber-50/50"
                    defaultValue={student.medicalNotes}
                    placeholder="None recorded"
                    onBlur={(e) => actions.updateStudent(studentId, { medicalNotes: e.target.value })}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Emergency contact</dt>
                <dd className="text-slate-700">{student.emergencyContact || family?.payerName}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Family">
            {family && (
              <Link to={`/members/family/${family.id}`} className="flex items-center gap-2.5 group">
                <Avatar name={family.payerName} size="sm" />
                <div>
                  <div className="text-sm font-medium text-slate-800 group-hover:underline">{family.payerName}</div>
                  <div className="text-xs text-slate-500">{family.phone}</div>
                </div>
              </Link>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
