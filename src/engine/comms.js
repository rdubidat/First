// Comms adapter layer.
// Every automation and manual send produces a "message intent"; this module
// resolves the intent to a delivery adapter (Twilio SMS, Gmail, tap-to-send)
// and enforces UK compliance rules (opt-outs, quiet hours) before anything
// leaves the building. WhatsApp Cloud API slots in here in Phase 2.

import { uid } from '../lib/utils'

export const CHANNELS = {
  sms: { label: 'SMS', adapter: 'twilio', costPence: 4 },
  email: { label: 'Email', adapter: 'gmail', costPence: 0 },
  tap_sms: { label: 'Tap-to-send SMS', adapter: 'device', costPence: 0 },
  tap_whatsapp: { label: 'Tap-to-send WhatsApp', adapter: 'device', costPence: 0 },
}

export function inQuietHours(settings, at = new Date()) {
  const [qsH, qsM] = settings.quietStart.split(':').map(Number)
  const [qeH, qeM] = settings.quietEnd.split(':').map(Number)
  const mins = at.getHours() * 60 + at.getMinutes()
  const start = qsH * 60 + qsM
  const end = qeH * 60 + qeM
  // Quiet window spans midnight (e.g. 20:30 → 08:00).
  return start > end ? mins >= start || mins < end : mins >= start && mins < end
}

export function nextSendWindow(settings, from = new Date()) {
  const [qeH, qeM] = settings.quietEnd.split(':').map(Number)
  const next = new Date(from.getTime())
  if (from.getHours() * 60 + from.getMinutes() >= qeH * 60 + qeM) {
    next.setDate(next.getDate() + 1)
  }
  next.setHours(qeH, qeM, 0, 0)
  return next
}

// Resolve a message intent into a message record. Pure: returns the record,
// caller appends it to db.messages.
export function resolveIntent(db, intent) {
  const { familyId = null, leadId = null, channel, body, subject = null, automation = null, scheduledFor = null } = intent
  const family = familyId ? db.families.find((f) => f.id === familyId) : null
  const lead = leadId ? db.leads.find((l) => l.id === leadId) : null
  const to = family || lead

  const msg = {
    id: uid('msg'),
    schoolId: db.school.id,
    familyId,
    leadId,
    channel,
    direction: 'out',
    subject,
    body,
    automation,
    costPence: CHANNELS[channel]?.costPence ?? 0,
    createdAt: new Date().toISOString(),
    scheduledFor,
    status: 'sent',
  }

  if (!to) {
    msg.status = 'failed'
    msg.failReason = 'No recipient on record'
    return msg
  }
  if (channel === 'sms' && to.optOutSms) {
    msg.status = 'blocked_optout'
    msg.costPence = 0
    return msg
  }
  if (channel === 'email' && !to.email) {
    msg.status = 'failed'
    msg.failReason = 'No email address on record'
    return msg
  }
  if (scheduledFor && new Date(scheduledFor) > new Date()) {
    msg.status = 'scheduled'
    return msg
  }
  if (channel === 'sms' && inQuietHours(db.school.settings)) {
    msg.status = 'held_quiet_hours'
    msg.scheduledFor = nextSendWindow(db.school.settings).toISOString()
    return msg
  }
  return msg
}

// STOP-word handling for inbound SMS — must be native, not an afterthought.
export function isOptOutMessage(body) {
  return /^\s*(stop|unsubscribe|opt\s*out)\b/i.test(body || '')
}

// Tap-to-send deep links (personal-touch mode): the CRM pre-writes the
// message, staff send it from their own phone, and we log it to the timeline.
export function tapToSendLink(channel, phone, body) {
  const clean = (phone || '').replace(/[^+\d]/g, '')
  if (channel === 'tap_whatsapp') {
    return `https://wa.me/${clean.replace(/^\+/, '')}?text=${encodeURIComponent(body)}`
  }
  return `sms:${clean}?body=${encodeURIComponent(body)}`
}

// Fill {placeholders} in templates from a context object.
export function renderTemplate(template, ctx) {
  return template.replace(/\{(\w+)\}/g, (m, key) => (ctx[key] != null ? ctx[key] : m))
}
