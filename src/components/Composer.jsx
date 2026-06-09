// Message composer used on family records, lead cards and the inbox.
// Channel choice maps to the comms adapter layer: Twilio SMS, Gmail, or
// tap-to-send deep links (logged to the timeline, sent from staff's phone).

import { useState } from 'react'
import { useStore } from '../data/store'
import { Button, Field, inputCls } from './ui'
import { tapToSendLink, renderTemplate } from '../engine/comms'

export default function Composer({ familyId = null, leadId = null, onSent }) {
  const { db, actions } = useStore()
  const [channel, setChannel] = useState('sms')
  const [body, setBody] = useState('')
  const [subject, setSubject] = useState('')

  const recipient = familyId ? db.families.find((f) => f.id === familyId) : db.leads.find((l) => l.id === leadId)
  if (!recipient) return null

  const firstStudent = familyId ? db.students.find((s) => s.familyId === familyId) : null
  const ctx = {
    name: (recipient.payerName || recipient.name || '').split(' ')[0],
    studentName: firstStudent?.firstName || recipient.studentName || '',
    school: db.school.name,
    phone: db.school.senderNumber,
    link: 'https://mace.dojoos.app/book',
  }

  function send(e) {
    e.preventDefault()
    if (!body.trim()) return
    if (channel.startsWith('tap_')) {
      window.open(tapToSendLink(channel, recipient.phone, body), '_blank')
      actions.logTapToSend({ familyId, leadId, channel, body })
    } else {
      actions.sendMessage({ familyId, leadId, channel, body, subject: channel === 'email' ? subject : null })
    }
    setBody('')
    setSubject('')
    onSent?.()
  }

  return (
    <form onSubmit={send} className="space-y-2">
      <div className="flex gap-2 items-center flex-wrap">
        <select className={inputCls + ' !w-auto'} value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Channel">
          <option value="sms">SMS (Twilio)</option>
          <option value="email">Email (Gmail)</option>
          <option value="tap_sms">Tap-to-send SMS (own phone)</option>
          <option value="tap_whatsapp">Tap-to-send WhatsApp</option>
        </select>
        <select
          className={inputCls + ' !w-auto'}
          value=""
          onChange={(e) => {
            const tpl = db.templates.find((t) => t.id === e.target.value)
            if (tpl) setBody(renderTemplate(tpl.body, ctx))
          }}
          aria-label="Insert template"
        >
          <option value="">Insert template…</option>
          {db.templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {channel === 'sms' && recipient.optOutSms && (
          <span className="text-xs text-red-600 font-medium">⚠ Opted out of SMS — send will be blocked</span>
        )}
      </div>
      {channel === 'email' && (
        <Field label="Subject"><input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
      )}
      <textarea
        className={inputCls + ' min-h-[72px]'}
        placeholder={`Message to ${recipient.payerName || recipient.name}…`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">
          {channel === 'sms' ? `${Math.ceil((body.length || 1) / 160)} segment(s) · ~4p each` : channel === 'email' ? 'via school Gmail' : 'opens on your device, logged to timeline'}
        </span>
        <Button type="submit" size="sm">{channel.startsWith('tap_') ? 'Open & log' : 'Send'}</Button>
      </div>
    </form>
  )
}
