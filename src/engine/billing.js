// Billing logic: family discounts, freezes, pro-rata, MRR.
// Payment *processing* is rented (Stripe now, GoCardless in Phase 2);
// this module owns the pricing rules — the bit no rentable tool does.

export function planFor(db, subscription) {
  return db.plans.find((p) => p.id === subscription.planId)
}

// Family discount: full price for the most expensive subscription, then a
// percentage off each additional student (configurable per school).
export function familyMonthlyBreakdown(db, familyId) {
  const subs = db.subscriptions.filter((s) => s.familyId === familyId && s.status !== 'cancelled')
  const { familyDiscountPct, freezeFeePence } = db.school.settings

  const lines = subs
    .map((sub) => {
      const plan = planFor(db, sub)
      const student = db.students.find((st) => st.id === sub.studentId)
      return { sub, plan, student, basePence: plan ? plan.amountPence : 0 }
    })
    .sort((a, b) => b.basePence - a.basePence)

  let total = 0
  lines.forEach((line, i) => {
    if (line.sub.status === 'frozen') {
      line.chargePence = freezeFeePence
      line.note = 'Frozen (holding fee)'
    } else if (i === 0) {
      line.chargePence = line.basePence
      line.note = null
    } else {
      line.chargePence = Math.round(line.basePence * (1 - familyDiscountPct / 100))
      line.note = `${familyDiscountPct}% family discount`
    }
    total += line.chargePence
  })

  return { lines, totalPence: total }
}

export function proRataFirstMonth(amountPence, startDate = new Date()) {
  const d = new Date(startDate)
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const remaining = daysInMonth - d.getDate() + 1
  return Math.round((amountPence * remaining) / daysInMonth)
}

export function monthlyRecurringRevenue(db) {
  const familyIds = [...new Set(db.subscriptions.filter((s) => s.status !== 'cancelled').map((s) => s.familyId))]
  return familyIds.reduce((sum, fid) => sum + familyMonthlyBreakdown(db, fid).totalPence, 0)
}

export function failedPayments(db) {
  return db.payments
    .filter((p) => p.status === 'failed' || p.status === 'retrying')
    .sort((a, b) => b.date.localeCompare(a.date))
}

// Standard dunning schedule: retry day 3, day 5, day 7, then escalate to a task.
export const RETRY_SCHEDULE_DAYS = [3, 5, 7]

export function paymentsInMonth(db, yearMonth) {
  return db.payments.filter((p) => p.date.startsWith(yearMonth) && p.status === 'paid')
}

export function revenueByMonth(db, monthsBack = 6) {
  const out = []
  const now = new Date()
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const paid = paymentsInMonth(db, ym)
    out.push({
      month: d.toLocaleDateString('en-GB', { month: 'short' }),
      ym,
      totalPence: paid.reduce((s, p) => s + p.amountPence, 0),
      count: paid.length,
    })
  }
  return out
}
