// Billing: MRR dashboard, plans, subscription states, failed-payment dunning.

import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { studentName } from '../data/selectors'
import { PageHeader } from '../components/Layout'
import { Card, Stat, Button, StatusBadge, EmptyState, Sparkbar, Badge } from '../components/ui'
import { monthlyRecurringRevenue, failedPayments, revenueByMonth, familyMonthlyBreakdown, RETRY_SCHEDULE_DAYS } from '../engine/billing'
import { gbp, fmtDate } from '../lib/utils'

export default function Billing() {
  const { db, actions } = useStore()
  const mrr = monthlyRecurringRevenue(db)
  const failed = failedPayments(db)
  const revenue = revenueByMonth(db, 6)
  const activeSubs = db.subscriptions.filter((s) => s.status === 'active')
  const frozenSubs = db.subscriptions.filter((s) => s.status === 'frozen')
  const gradingRevenue = db.payments.filter((p) => p.type === 'grading' && p.status === 'paid').reduce((s, p) => s + p.amountPence, 0)

  // Families sorted by monthly value.
  const familyRows = db.families
    .map((f) => ({ family: f, breakdown: familyMonthlyBreakdown(db, f.id) }))
    .filter((r) => r.breakdown.lines.length > 0)
    .sort((a, b) => b.breakdown.totalPence - a.breakdown.totalPence)

  return (
    <div>
      <PageHeader
        title="Billing"
        sub="Stripe recurring (GoCardless Direct Debit upgrade lands in Phase 2 — ~1% capped 20p vs 1.5%+20p)."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="MRR" value={gbp(mrr)} sub={`${activeSubs.length} active subscriptions`} />
        <Stat label="Frozen" value={frozenSubs.length} sub={`holding fee ${gbp(db.school.settings.freezeFeePence)}/mo each`} accent="text-amber-600" />
        <Stat
          label="Failed payments"
          value={gbp(failed.reduce((s, p) => s + p.amountPence, 0))}
          sub={`${failed.length} in dunning`}
          accent={failed.length ? 'text-red-600' : 'text-emerald-600'}
        />
        <Stat label="Grading revenue (one-off)" value={gbp(gradingRevenue)} sub="trials & pro shop also land here" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title="Failed payment recovery (dunning)">
            <p className="text-xs text-slate-500 mb-3">
              Auto-retry on days {RETRY_SCHEDULE_DAYS.join(', ')} after failure. Each failure also fires an SMS + email sequence and creates a task — see the family timeline.
            </p>
            {failed.length === 0 ? (
              <EmptyState>No failed payments. 🎉</EmptyState>
            ) : (
              <div className="divide-y divide-slate-50">
                {failed.map((p) => {
                  const family = db.families.find((f) => f.id === p.familyId)
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <Link to={`/members/family/${family?.id}`} className="text-sm font-medium text-slate-800 hover:underline">
                          {family?.payerName}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {gbp(p.amountPence)} · {fmtDate(p.date)} · {p.failReason}
                          {p.nextRetryAt && ` · next retry ${fmtDate(p.nextRetryAt)}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        <Button size="sm" onClick={() => actions.retryPayment(p.id)}>Retry now</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Recurring revenue by family" pad={false} className="max-h-[28rem] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 sticky top-0 bg-white">
                  <th className="px-4 py-2.5 font-medium">Family</th>
                  <th className="px-4 py-2.5 font-medium">Subscriptions</th>
                  <th className="px-4 py-2.5 font-medium text-right">Monthly</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {familyRows.map(({ family, breakdown }) => (
                  <tr key={family.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <Link to={`/members/family/${family.id}`} className="font-medium text-slate-800 hover:underline">
                        {family.payerName}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-500">
                      {breakdown.lines.map((l) => (
                        <span key={l.sub.id} className="mr-2">
                          {l.student ? studentName(db, l.student.id).split(' ')[0] : '—'}
                          {l.sub.status === 'frozen' && <Badge color="amber" className="ml-1">frozen</Badge>}
                          {l.note?.includes('discount') && <Badge color="green" className="ml-1">-{db.school.settings.familyDiscountPct}%</Badge>}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-slate-700">{gbp(breakdown.totalPence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Collected, last 6 months">
            <div className="flex items-end gap-2">
              {revenue.map((m) => (
                <div key={m.ym} className="flex-1 text-center">
                  <Sparkbar values={[m.totalPence / 100]} max={Math.max(1, ...revenue.map((r) => r.totalPence / 100))} height={56} barClass="bg-emerald-500" />
                  <div className="text-[10px] text-slate-500 mt-1">{m.month}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Plans">
            <div className="space-y-2.5">
              {db.plans.map((p) => {
                const count = db.subscriptions.filter((s) => s.planId === p.id && s.status !== 'cancelled').length
                return (
                  <div key={p.id} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium text-slate-700">{p.name}</div>
                      <div className="text-xs text-slate-400">{count} subscription{count !== 1 ? 's' : ''} · {p.provider}</div>
                    </div>
                    <span className="font-semibold text-slate-800">{gbp(p.amountPence)}<span className="text-xs text-slate-400 font-normal">/mo</span></span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
              Family discount: {db.school.settings.familyDiscountPct}% off each additional student. Freeze holding fee {gbp(db.school.settings.freezeFeePence)}/mo. Pro-rata applied on mid-month starts.
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
