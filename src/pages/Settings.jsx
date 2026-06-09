// School settings: comms compliance, billing rules, templates, demo reset.

import { useState } from 'react'
import { useStore } from '../data/store'
import { PageHeader } from '../components/Layout'
import { Card, Button, Badge, Field, inputCls } from '../components/ui'
import { gbp } from '../lib/utils'

export default function Settings() {
  const { db, actions } = useStore()
  const s = db.school.settings
  const [confirmReset, setConfirmReset] = useState(false)

  const smsOut = db.messages.filter((m) => m.channel === 'sms' && m.direction === 'out' && m.costPence > 0)
  const usageCost = smsOut.reduce((sum, m) => sum + m.costPence, 0)
  const billed = Math.round(usageCost * (1 + s.platformMarginPct / 100))

  return (
    <div>
      <PageHeader title="Settings" sub={`${db.school.name} · multi-tenant: every record carries school_id (see db/schema.sql)`} />

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card title="Comms & compliance (UK)">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Dedicated Twilio number</span>
                <Badge color="green">{db.school.senderNumber}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Quiet hours start (no SMS after)">
                  <input type="time" className={inputCls} value={s.quietStart} onChange={(e) => actions.updateSettings({ quietStart: e.target.value })} />
                </Field>
                <Field label="Quiet hours end (resume at)">
                  <input type="time" className={inputCls} value={s.quietEnd} onChange={(e) => actions.updateSettings({ quietEnd: e.target.value })} />
                </Field>
              </div>
              <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                <li>STOP replies set the family's SMS opt-out automatically (native, in the message-intent layer).</li>
                <li>Automated sends inside quiet hours are held and released at {s.quietEnd}.</li>
                <li>UK A2P sender registration handled per school at onboarding.</li>
              </ul>
            </div>
          </Card>

          <Card title="Billing rules">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Family discount (% off 2nd+ student)">
                <input
                  type="number" className={inputCls} value={s.familyDiscountPct}
                  onChange={(e) => actions.updateSettings({ familyDiscountPct: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Freeze holding fee (pence/mo)">
                <input
                  type="number" className={inputCls} value={s.freezeFeePence}
                  onChange={(e) => actions.updateSettings({ freezeFeePence: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>
            <p className="text-xs text-slate-500 mt-2">Provider: Stripe (MVP). GoCardless Direct Debit upgrade in Phase 2.</p>
          </Card>

          <Card title="Usage billing (cost transparency)">
            <div className="text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-600">Outbound SMS in dataset</span><span>{smsOut.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-600">Twilio cost (at ~4p/segment)</span><span>{gbp(usageCost)}</span></div>
              <div className="flex justify-between font-medium text-slate-800">
                <span>Billed to school (+{s.platformMarginPct}% platform margin)</span><span>{gbp(billed)}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">No GHL-style 2–5× rebilling. Cost visibility per school is the migration pitch.</p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Message templates">
            <div className="space-y-3">
              {db.templates.map((t) => (
                <div key={t.id}>
                  <div className="text-sm font-medium text-slate-700">{t.name}</div>
                  <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2 mt-1 whitespace-pre-wrap">{t.body}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">Placeholders: {'{name} {studentName} {school} {phone} {link}'}</p>
          </Card>

          <Card title="Integrations (adapter status)">
            <div className="space-y-2 text-sm">
              {[
                ['Twilio SMS', 'connected', 'green'],
                ['Gmail OAuth (send-as + inbound sync)', 'connected · testing mode', 'green'],
                ['Stripe', 'connected', 'green'],
                ['Meta lead forms webhook', 'connected', 'green'],
                ['GoCardless Direct Debit', 'Phase 2', 'slate'],
                ['WhatsApp Cloud API', 'Phase 2 — start Meta verification early', 'amber'],
                ['Resend (broadcast email)', 'when Gmail limits hit', 'slate'],
              ].map(([name, status, color]) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-slate-600">{name}</span>
                  <Badge color={color}>{status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Demo data">
            <p className="text-xs text-slate-500 mb-3">
              This demo runs entirely in your browser (localStorage) with the production data model. Reset regenerates the seeded MACE dataset.
            </p>
            {confirmReset ? (
              <div className="flex gap-2">
                <Button variant="danger" onClick={() => { actions.resetDemo(); setConfirmReset(false) }}>Yes, reset everything</Button>
                <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmReset(true)}>Reset demo data</Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
