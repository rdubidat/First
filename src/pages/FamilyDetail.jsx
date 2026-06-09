import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useStore } from '../data/store'
import { gradeName, programmeName } from '../data/selectors'
import { PageHeader } from '../components/Layout'
import { Card, Avatar, StatusBadge, Button, Badge, EmptyState, Modal } from '../components/ui'
import Composer from '../components/Composer'
import { familyMonthlyBreakdown } from '../engine/billing'
import { gbp, fmtDate, fmtDateTime, fullName } from '../lib/utils'

export default function FamilyDetail() {
  const { familyId } = useParams()
  const { db, actions } = useStore()
  const navigate = useNavigate()
  const [confirmErase, setConfirmErase] = useState(false)

  const family = db.families.find((f) => f.id === familyId)
  if (!family) return <EmptyState>Family not found (may have been erased).</EmptyState>

  const students = db.students.filter((s) => s.familyId === familyId)
  const breakdown = familyMonthlyBreakdown(db, familyId)
  const payments = db.payments.filter((p) => p.familyId === familyId).sort((a, b) => b.date.localeCompare(a.date))
  const messages = db.messages.filter((m) => m.familyId === familyId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  function exportData() {
    // GDPR subject access export: the full family graph as JSON.
    const studentIds = students.map((s) => s.id)
    const data = {
      exportedAt: new Date().toISOString(),
      family,
      students,
      enrolments: db.enrolments.filter((e) => studentIds.includes(e.studentId)),
      attendance: db.attendance.filter((a) => studentIds.includes(a.studentId)),
      subscriptions: db.subscriptions.filter((s) => s.familyId === familyId),
      payments,
      messages,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gdpr-export-${family.payerName.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <PageHeader
        title={`${family.payerName} (family account)`}
        sub={`${family.email} · ${family.phone}`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportData}>GDPR export</Button>
            <Button variant="danger" onClick={() => setConfirmErase(true)}>Erase (RTBF)</Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title={`Students (${students.length})`}>
            {students.map((s) => {
              const enrs = db.enrolments.filter((e) => e.studentId === s.id)
              return (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <Link to={`/members/student/${s.id}`} className="flex items-center gap-2.5 group">
                    <Avatar name={fullName(s)} size="sm" />
                    <div>
                      <div className="text-sm font-medium text-slate-800 group-hover:underline">{fullName(s)}</div>
                      <div className="text-xs text-slate-500">
                        {enrs.map((e) => `${programmeName(db, e.programmeId)} · ${gradeName(db, e.gradeId)}`).join(' / ')}
                      </div>
                    </div>
                  </Link>
                  <StatusBadge status={s.status} />
                </div>
              )
            })}
          </Card>

          <Card title="Conversation timeline">
            <div className="mb-4">
              <Composer familyId={familyId} />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.length === 0 && <EmptyState>No messages yet.</EmptyState>}
              {messages.map((m) => <MessageRow key={m.id} m={m} />)}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Button size="sm" variant="ghost" onClick={() => actions.simulateInbound({ familyId, body: 'Thanks! See you Tuesday 👍' })}>
                ⚡ Simulate inbound reply
              </Button>
              <Button size="sm" variant="ghost" onClick={() => actions.simulateInbound({ familyId, body: 'STOP' })}>
                ⚡ Simulate STOP reply
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Monthly billing">
            <div className="space-y-2">
              {breakdown.lines.map((line) => (
                <div key={line.sub.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-slate-700">{line.student ? fullName(line.student) : '—'}</div>
                    <div className="text-xs text-slate-400">{line.plan?.name}{line.note ? ` · ${line.note}` : ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-slate-800">{gbp(line.chargePence)}</div>
                    {line.chargePence !== line.basePence && line.sub.status !== 'frozen' && (
                      <div className="text-xs text-slate-400 line-through">{gbp(line.basePence)}</div>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-slate-100 font-semibold text-slate-900">
                <span>Total / month</span><span>{gbp(breakdown.totalPence)}</span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              {breakdown.lines.map((line) => (
                <div key={line.sub.id} className="flex gap-1.5">
                  {line.sub.status === 'active' ? (
                    <Button size="sm" variant="secondary" onClick={() => actions.setSubscriptionStatus(line.sub.id, 'frozen')}>
                      Freeze {line.student?.firstName}
                    </Button>
                  ) : line.sub.status === 'frozen' ? (
                    <Button size="sm" variant="success" onClick={() => actions.setSubscriptionStatus(line.sub.id, 'active')}>
                      Unfreeze {line.student?.firstName}
                    </Button>
                  ) : null}
                  {line.sub.status !== 'cancelled' && (
                    <Button size="sm" variant="ghost" onClick={() => actions.setSubscriptionStatus(line.sub.id, 'cancelled')}>
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Payment history">
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-700">{gbp(p.amountPence)}</span>
                    <span className="text-xs text-slate-400"> · {p.type} · {fmtDate(p.date)}</span>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
              {payments.length === 0 && <EmptyState>No payments.</EmptyState>}
            </div>
          </Card>

          <Card title="Consent & compliance">
            <div className="space-y-2 text-sm">
              <label className="flex items-center justify-between">
                <span className="text-slate-600">SMS opt-out</span>
                <input
                  type="checkbox"
                  checked={family.optOutSms}
                  onChange={(e) => actions.updateFamily(familyId, { optOutSms: e.target.checked })}
                />
              </label>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Marketing consent</span>
                <Badge color={family.consent?.marketing ? 'green' : 'slate'}>
                  {family.consent?.marketing ? `granted ${fmtDate(family.consent.recordedAt)}` : 'not granted'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Member since</span>
                <span className="text-slate-500 text-xs">{fmtDate(family.createdAt)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={confirmErase} onClose={() => setConfirmErase(false)} title="Right to be forgotten">
        <p className="text-sm text-slate-600 mb-4">
          This permanently hard-deletes <strong>{family.payerName}</strong>, {students.length} student record(s), and all
          attendance, payment and message history. In production this runs as an audited GDPR erasure job. This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmErase(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { actions.eraseFamily(familyId); navigate('/members') }}>
            Permanently erase
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export function MessageRow({ m }) {
  const isIn = m.direction === 'in'
  return (
    <div className={`flex ${isIn ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isIn ? 'bg-slate-100 text-slate-800' : 'bg-blue-600 text-white'}`}>
        {m.subject && <div className="font-semibold text-xs mb-0.5">{m.subject}</div>}
        <div className="whitespace-pre-wrap">{m.body}</div>
        <div className={`mt-1 text-[10px] flex items-center gap-1.5 ${isIn ? 'text-slate-400' : 'text-blue-200'}`}>
          <span className="uppercase">{m.channel}</span>
          {m.automation && <span>· auto: {m.automation}</span>}
          <span>· {fmtDateTime(m.createdAt)}</span>
          {['blocked_optout', 'held_quiet_hours', 'scheduled', 'failed', 'sent_from_device'].includes(m.status) && (
            <span className="ml-1"><StatusBadge status={m.status} /></span>
          )}
        </div>
      </div>
    </div>
  )
}
