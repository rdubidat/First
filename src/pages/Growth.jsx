// Phase 2 growth tools: review engine (post-grading Google review requests,
// monitoring) and referral tracking with rewards.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { PageHeader } from '../components/Layout'
import { Card, Button, Badge, StatusBadge, Stat, Modal, Field, inputCls, EmptyState } from '../components/ui'
import { gbp, fmtDate, timeAgo } from '../lib/utils'

export default function Growth() {
  const { db, actions } = useStore()
  const [referring, setReferring] = useState(false)

  const reviews = [...db.reviews].sort((a, b) => b.date.localeCompare(a.date))
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '—'
  const requestsSent = db.messages.filter((m) => m.automation === 'review-request').length

  const referrals = [...db.referrals].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const converted = referrals.filter((r) => r.status !== 'pending').length

  return (
    <div>
      <PageHeader
        title="Growth"
        sub="Reviews are requested automatically after every grading pass (while the pride is fresh). Referrals are tracked from lead to reward."
        action={<Button onClick={() => setReferring(true)}>+ Log referral</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Google rating" value={`⭐ ${avg}`} sub={`${reviews.length} reviews tracked`} />
        <Stat label="Review requests sent" value={requestsSent} sub="auto, post-grading" />
        <Stat label="Referrals" value={referrals.length} sub={`${converted} converted`} />
        <Stat
          label="Referral rewards"
          value={gbp(referrals.filter((r) => r.status === 'rewarded').reduce((s, r) => s + r.rewardPence, 0))}
          sub={`${gbp(db.school.settings.referralRewardPence)} credit per sign-up`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Card title="Review monitoring">
          <div className="divide-y divide-slate-50">
            {reviews.map((r) => (
              <div key={r.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-800">
                    {r.author} <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <span className="text-xs text-slate-400">{fmtDate(r.date)} · {r.source}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{r.text}</p>
                <div className="mt-1.5">
                  {r.responded ? (
                    <Badge color="green">replied</Badge>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => actions.markReviewResponded(r.id)}>
                      Mark replied
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {reviews.length === 0 && <EmptyState>No reviews yet.</EmptyState>}
          </div>
        </Card>

        <Card title="Referral pipeline">
          <div className="divide-y divide-slate-50">
            {referrals.map((ref) => {
              const referrer = db.families.find((f) => f.id === ref.referrerFamilyId)
              const lead = db.leads.find((l) => l.id === ref.leadId)
              return (
                <div key={ref.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <div className="text-slate-800">
                      <Link to={`/members/family/${referrer?.id}`} className="font-medium hover:underline">{referrer?.payerName || 'Unknown'}</Link>
                      <span className="text-slate-400"> referred </span>
                      <span className="font-medium">{lead?.name || 'lead'}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {timeAgo(ref.createdAt)} · lead stage: {lead?.stage?.replace(/_/g, ' ') || '—'} · reward {gbp(ref.rewardPence)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={ref.status === 'pending' ? 'open' : ref.status === 'converted' ? 'active' : 'paid'} />
                    {ref.status === 'converted' && (
                      <Button size="sm" variant="success" onClick={() => actions.rewardReferral(ref.id)}>
                        Apply {gbp(ref.rewardPence)} credit
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
            {referrals.length === 0 && <EmptyState>No referrals logged.</EmptyState>}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            When a referred lead is signed in the Pipeline, the referral flips to <em>converted</em> automatically and a reward task is created.
          </p>
        </Card>
      </div>

      <ReferralModal open={referring} onClose={() => setReferring(false)} db={db} actions={actions} />
    </div>
  )
}

function ReferralModal({ open, onClose, db, actions }) {
  const [form, setForm] = useState({ referrerFamilyId: db.families[0]?.id || '', name: '', phone: '', email: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <Modal open={open} onClose={onClose} title="Log referral">
      <p className="text-xs text-slate-500 mb-3">Creates a lead (speed-to-lead fires as usual) linked to the referring family for reward tracking.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          actions.addReferral(form)
          onClose()
        }}
        className="space-y-3"
      >
        <Field label="Referred by (family)">
          <select className={inputCls} value={form.referrerFamilyId} onChange={set('referrerFamilyId')}>
            {db.families.map((f) => <option key={f.id} value={f.id}>{f.payerName}</option>)}
          </select>
        </Field>
        <Field label="New contact name"><input required className={inputCls} value={form.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone"><input required className={inputCls} value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={set('email')} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Log referral</Button>
        </div>
      </form>
    </Modal>
  )
}
