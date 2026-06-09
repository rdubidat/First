// Sales pipeline kanban: lead → contacted → trial booked → trial attended →
// offer → signed. New leads fire the speed-to-lead automation.

import { useState } from 'react'
import { useStore } from '../data/store'
import { programmeName } from '../data/selectors'
import { PageHeader } from '../components/Layout'
import { Card, Button, Badge, Modal, Field, inputCls } from '../components/ui'
import Composer from '../components/Composer'
import { timeAgo, fmtDateTime, isoDate, addDays } from '../lib/utils'

const STAGES = [
  { key: 'lead', label: 'New lead' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'trial_booked', label: 'Trial booked' },
  { key: 'trial_attended', label: 'Trial attended' },
  { key: 'offer', label: 'Offer made' },
  { key: 'signed', label: 'Signed 🎉' },
]

export default function Pipeline() {
  const { db, actions } = useStore()
  const [adding, setAdding] = useState(false)
  const [openLead, setOpenLead] = useState(null)

  const lead = openLead ? db.leads.find((l) => l.id === openLead) : null

  return (
    <div>
      <PageHeader
        title="Sales pipeline"
        sub="New leads get an instant SMS + email and a call task (speed-to-lead). Trials get 24h and 2h reminders automatically."
        action={<Button onClick={() => setAdding(true)}>+ Add lead</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-start">
        {STAGES.map((stage) => {
          const leads = db.leads.filter((l) => l.stage === stage.key).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          return (
            <div key={stage.key} className="bg-slate-200/60 rounded-xl p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-slate-600 flex justify-between">
                <span>{stage.label}</span>
                <span className="text-slate-400">{leads.length}</span>
              </div>
              <div className="space-y-2">
                {leads.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setOpenLead(l.id)}
                    className="w-full text-left bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm hover:border-slate-400"
                  >
                    <div className="text-sm font-medium text-slate-800">{l.name}</div>
                    <div className="text-xs text-slate-500">
                      {l.studentName !== l.name ? `for ${l.studentName} (${l.age}) · ` : ''}
                      {programmeName(db, l.programmeId)}
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <Badge color="slate">{l.source.replace(/_/g, ' ')}</Badge>
                      <span className="text-[10px] text-slate-400">{timeAgo(l.createdAt)}</span>
                    </div>
                    {l.trialAt && stage.key === 'trial_booked' && (
                      <div className="mt-1 text-[11px] font-medium text-purple-600">Trial: {fmtDateTime(l.trialAt)}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <AddLeadModal open={adding} onClose={() => setAdding(false)} db={db} actions={actions} />
      {lead && <LeadModal lead={lead} db={db} actions={actions} onClose={() => setOpenLead(null)} />}
    </div>
  )
}

function LeadModal({ lead, db, actions, onClose }) {
  const [trialAt, setTrialAt] = useState(isoDate(addDays(new Date(), 2)) + 'T17:00')
  const messages = db.messages.filter((m) => m.leadId === lead.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const idx = STAGES.findIndex((s) => s.key === lead.stage)
  const next = STAGES[idx + 1]

  return (
    <Modal open onClose={onClose} title={lead.name} wide>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="text-sm text-slate-600">
            <div><strong>Student:</strong> {lead.studentName} ({lead.age})</div>
            <div><strong>Programme:</strong> {programmeName(db, lead.programmeId)}</div>
            <div><strong>Phone:</strong> {lead.phone}</div>
            <div><strong>Email:</strong> {lead.email}</div>
            <div><strong>Source:</strong> {lead.source.replace(/_/g, ' ')} · {timeAgo(lead.createdAt)}</div>
            {lead.trialAt && <div><strong>Trial:</strong> {fmtDateTime(lead.trialAt)}</div>}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {lead.stage !== 'trial_booked' && !['signed', 'lost'].includes(lead.stage) && (
              <div className="flex gap-2 items-end">
                <Field label="Book trial (sends 24h + 2h SMS reminders)">
                  <input type="datetime-local" className={inputCls} value={trialAt} onChange={(e) => setTrialAt(e.target.value)} />
                </Field>
                <Button size="sm" onClick={() => actions.bookTrial(lead.id, new Date(trialAt).toISOString())}>Book</Button>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {next && next.key !== 'signed' && (
                <Button size="sm" variant="secondary" onClick={() => actions.moveLeadStage(lead.id, next.key)}>
                  Move to “{next.label}”
                </Button>
              )}
              {!['signed', 'lost'].includes(lead.stage) && (
                <>
                  <Button size="sm" variant="success" onClick={() => { actions.signLead(lead.id); onClose() }}>
                    ✍ Sign up (creates family + subscription)
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { actions.moveLeadStage(lead.id, 'lost'); onClose() }}>
                    Mark lost
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-500 mb-2">Conversation</div>
          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {messages.map((m) => (
              <div key={m.id} className={`text-xs rounded-lg px-2.5 py-1.5 ${m.direction === 'in' ? 'bg-slate-100' : 'bg-blue-50'}`}>
                <span className="text-slate-400">{m.direction === 'in' ? '← ' : '→ '}{m.channel}{m.automation ? ` · ${m.automation}` : ''}{m.status !== 'sent' ? ` · ${m.status.replace(/_/g, ' ')}` : ''}</span>
                <div className="text-slate-700 whitespace-pre-wrap">{m.body}</div>
              </div>
            ))}
            {messages.length === 0 && <div className="text-xs text-slate-400">No messages yet.</div>}
          </div>
          <Composer leadId={lead.id} />
        </div>
      </div>
    </Modal>
  )
}

function AddLeadModal({ open, onClose, db, actions }) {
  const blank = { name: '', studentName: '', age: '', phone: '', email: '', programmeId: db.programmes[0]?.id, source: 'website_form' }
  const [form, setForm] = useState(blank)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <Modal open={open} onClose={onClose} title="Add lead">
      <p className="text-xs text-slate-500 mb-3">
        Saving fires the speed-to-lead automation: instant SMS + email and a call task. (Webhook endpoints for Meta lead forms and the website form deliver leads here automatically in production.)
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          actions.addLead({ ...form, age: form.age ? Number(form.age) : null })
          setForm(blank)
          onClose()
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contact name"><input required className={inputCls} value={form.name} onChange={set('name')} /></Field>
          <Field label="Student name (if different)"><input className={inputCls} value={form.studentName} onChange={set('studentName')} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Age"><input type="number" className={inputCls} value={form.age} onChange={set('age')} /></Field>
          <Field label="Phone"><input required className={inputCls} value={form.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={set('email')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Programme">
            <select className={inputCls} value={form.programmeId} onChange={set('programmeId')}>
              {db.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Source">
            <select className={inputCls} value={form.source} onChange={set('source')}>
              <option value="website_form">Website form</option>
              <option value="meta_lead_form">Meta lead form</option>
              <option value="walk_in">Walk-in</option>
              <option value="referral">Referral</option>
              <option value="google">Google</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add lead (fires automations)</Button>
        </div>
      </form>
    </Modal>
  )
}
