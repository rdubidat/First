import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { studentName } from '../data/selectors'
import { PageHeader } from '../components/Layout'
import { Card, Stat, Badge, StatusBadge, Button, EmptyState, Sparkbar } from '../components/ui'
import { monthlyRecurringRevenue, failedPayments, revenueByMonth } from '../engine/billing'
import { riskBoard } from '../engine/retention'
import { gbp, fmtDate, fmtDateTime, timeAgo, DAY_NAMES } from '../lib/utils'

export default function Dashboard() {
  const { db, actions } = useStore()
  const activeStudents = db.students.filter((s) => s.status === 'active')
  const mrr = monthlyRecurringRevenue(db)
  const failed = failedPayments(db)
  const risk = riskBoard(db).filter((r) => r.band !== 'healthy')
  const openTasks = db.tasks.filter((t) => t.status === 'open').sort((a, b) => (a.due || 'z').localeCompare(b.due || 'z'))
  const openLeads = db.leads.filter((l) => !['signed', 'lost'].includes(l.stage))
  const revenue = revenueByMonth(db, 6)

  const todayDow = (new Date().getDay() + 6) % 7
  const todaysClasses = db.classes.filter((c) => c.dayOfWeek === todayDow).sort((a, b) => a.time.localeCompare(b.time))
  const todayIso = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        sub={`${db.school.name} · ${fmtDate(new Date(), { weekday: 'long' })}`}
        action={<Link to="/kiosk"><Button variant="success">Launch kiosk</Button></Link>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Active students" value={activeStudents.length} sub={`${db.families.length} families`} />
        <Stat label="Monthly recurring revenue" value={gbp(mrr)} sub="after family discounts & freezes" />
        <Stat
          label="At risk"
          value={risk.length}
          sub="students flagged by retention engine"
          accent={risk.length > 0 ? 'text-red-600' : 'text-emerald-600'}
        />
        <Stat
          label="Failed payments"
          value={failed.length}
          sub={failed.length ? gbp(failed.reduce((s, p) => s + p.amountPence, 0)) + ' outstanding' : 'all clear'}
          accent={failed.length > 0 ? 'text-amber-600' : 'text-emerald-600'}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title={`Today's classes (${DAY_NAMES[todayDow]})`}>
            {todaysClasses.length === 0 ? (
              <EmptyState>No classes scheduled today.</EmptyState>
            ) : (
              <div className="divide-y divide-slate-100">
                {todaysClasses.map((c) => {
                  const checkedIn = db.attendance.filter((a) => a.classId === c.id && a.date === todayIso).length
                  return (
                    <div key={c.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.time} · {c.durationMins} min · {c.location}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge color={checkedIn > 0 ? 'green' : 'slate'}>{checkedIn} checked in</Badge>
                        <Link to="/classes" className="text-xs text-blue-600 hover:underline">Register →</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Revenue (collected, last 6 months)">
            <div className="flex items-end gap-3">
              {revenue.map((m) => (
                <div key={m.ym} className="flex-1 text-center">
                  <div className="text-xs font-semibold text-slate-700 mb-1">{gbp(m.totalPence)}</div>
                  <Sparkbar values={[m.totalPence / 100]} max={Math.max(1, ...revenue.map((r) => r.totalPence / 100))} height={64} barClass="bg-emerald-500" />
                  <div className="text-xs text-slate-500 mt-1">{m.month}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="At-risk students"
            action={<Link to="/retention" className="text-xs text-blue-600 hover:underline">Full board →</Link>}
          >
            {risk.length === 0 ? (
              <EmptyState>Nobody flagged. Run a retention scan from the Retention page.</EmptyState>
            ) : (
              <div className="divide-y divide-slate-100">
                {risk.slice(0, 5).map((r) => (
                  <div key={r.student.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <Link to={`/members/student/${r.student.id}`} className="text-sm font-medium text-slate-800 hover:underline">
                        {r.student.firstName} {r.student.lastName}
                      </Link>
                      <div className="text-xs text-slate-500">{r.reasons[0]}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{r.score}</span>
                      <StatusBadge status={r.band} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={`Tasks (${openTasks.length} open)`}>
            {openTasks.length === 0 ? (
              <EmptyState>Inbox zero. 🎉</EmptyState>
            ) : (
              <div className="space-y-2.5">
                {openTasks.slice(0, 7).map((t) => (
                  <div key={t.id} className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded"
                      onChange={() => actions.completeTask(t.id)}
                      aria-label={`Complete: ${t.title}`}
                    />
                    <div>
                      <div className="text-sm text-slate-700 leading-snug">{t.title}</div>
                      <div className="text-xs text-slate-400">
                        {t.createdBy === 'automation' && <Badge color="purple" className="mr-1.5">auto</Badge>}
                        {t.due ? `Due ${fmtDateTime(t.due)}` : timeAgo(t.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Pipeline (${openLeads.length} open leads)`} action={<Link to="/pipeline" className="text-xs text-blue-600 hover:underline">Board →</Link>}>
            <div className="space-y-2">
              {openLeads.slice(0, 5).map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{l.name}</div>
                    <div className="text-xs text-slate-500">{timeAgo(l.createdAt)} · {l.source.replace(/_/g, ' ')}</div>
                  </div>
                  <StatusBadge status={l.stage === 'trial_booked' ? 'scheduled' : l.stage === 'lead' ? 'lead' : 'active'} />
                </div>
              ))}
              {openLeads.length === 0 && <EmptyState>No open leads.</EmptyState>}
            </div>
          </Card>

          <Card title="Recent activity">
            <div className="space-y-2">
              {[...db.events].reverse().slice(0, 6).map((e) => (
                <div key={e.id} className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{e.type.replace(/\./g, ' → ').replace(/_/g, ' ')}</span>
                  {e.payload?.studentId && <span> · {studentName(db, e.payload.studentId)}</span>}
                  <span className="text-slate-400"> · {timeAgo(e.at)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
