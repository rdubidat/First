// Phase 2 email campaigns: segmentation by programme and attendance band.
// Marketing consent is a hard filter; sends ride the school's Gmail OAuth
// until volume demands Resend.

import { useState } from 'react'
import { useStore } from '../data/store'
import { programmeName } from '../data/selectors'
import { campaignAudience, GMAIL_DAILY_LIMIT_FREE } from '../engine/campaigns'
import { PageHeader } from '../components/Layout'
import { Card, Button, Badge, Field, inputCls, EmptyState } from '../components/ui'
import { fmtDate } from '../lib/utils'

export default function Campaigns() {
  const { db, actions } = useStore()
  const [form, setForm] = useState({
    name: '', subject: '', body: 'Hi {name},\n\n',
    programmeId: '', riskBand: '',
  })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const segment = { programmeId: form.programmeId || null, riskBand: form.riskBand || null }
  const audience = campaignAudience(db, segment)
  const consented = db.families.filter((f) => f.consent?.marketing && f.email).length
  const sent = [...db.campaigns].sort((a, b) => (b.sentAt || '').localeCompare(a.sentAt || ''))

  function send(e) {
    e.preventDefault()
    actions.sendCampaign({ name: form.name, subject: form.subject, body: form.body, segment })
    setForm({ name: '', subject: '', body: 'Hi {name},\n\n', programmeId: '', riskBand: '' })
  }

  return (
    <div>
      <PageHeader
        title="Email campaigns"
        sub={`${consented} of ${db.families.length} families have marketing consent — newsletters only ever go to them. Service messages (billing, reminders) are separate.`}
      />

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Card title="New campaign">
          <form onSubmit={send} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Internal name">
                <input required className={inputCls} value={form.name} onChange={set('name')} placeholder="June newsletter" />
              </Field>
              <Field label="Subject line">
                <input required className={inputCls} value={form.subject} onChange={set('subject')} placeholder="Summer grading dates inside 🥋" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Segment: programme">
                <select className={inputCls} value={form.programmeId} onChange={set('programmeId')}>
                  <option value="">All programmes</option>
                  {db.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Segment: attendance band">
                <select className={inputCls} value={form.riskBand} onChange={set('riskBand')}>
                  <option value="">Any</option>
                  <option value="healthy">Healthy attenders</option>
                  <option value="watch">Watch list</option>
                  <option value="at-risk">At risk</option>
                </select>
              </Field>
            </div>
            <Field label="Body — {name} and {school} are personalised per family">
              <textarea required className={inputCls + ' min-h-[140px] font-mono text-xs'} value={form.body} onChange={set('body')} />
            </Field>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Badge color={audience.length > 0 ? 'blue' : 'slate'}>{audience.length} recipients</Badge>
                {audience.length > GMAIL_DAILY_LIMIT_FREE && (
                  <span className="ml-2 text-xs text-amber-600">over Gmail's ~{GMAIL_DAILY_LIMIT_FREE}/day — would route via Resend</span>
                )}
              </div>
              <Button type="submit" disabled={audience.length === 0}>Send to {audience.length} famil{audience.length === 1 ? 'y' : 'ies'}</Button>
            </div>
          </form>
        </Card>

        <Card title="Sent campaigns">
          {sent.length === 0 ? (
            <EmptyState>No campaigns yet.</EmptyState>
          ) : (
            <div className="divide-y divide-slate-50">
              {sent.map((c) => (
                <div key={c.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">{c.name}</span>
                    <span className="text-xs text-slate-400">{fmtDate(c.sentAt)}</span>
                  </div>
                  <div className="text-xs text-slate-500">“{c.subject}”</div>
                  <div className="mt-1 flex gap-1.5">
                    <Badge color="green">{c.recipients} recipients</Badge>
                    {c.segment?.programmeId && <Badge color="blue">{programmeName(db, c.segment.programmeId)}</Badge>}
                    {c.segment?.riskBand && <Badge color="amber">{c.segment.riskBand}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
