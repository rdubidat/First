// Unified two-way inbox: all channels, grouped into conversations per
// family/lead. Inbound Twilio replies and Gmail sync land here.

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { conversationKey } from '../data/selectors'
import { PageHeader } from '../components/Layout'
import { Card, Avatar, Badge, EmptyState } from '../components/ui'
import Composer from '../components/Composer'
import { MessageRow } from './FamilyDetail'
import { cn, timeAgo } from '../lib/utils'

export default function Inbox() {
  const { db } = useStore()
  const [selected, setSelected] = useState(null)

  const conversations = useMemo(() => {
    const map = new Map()
    for (const m of db.messages) {
      const key = conversationKey(m)
      const existing = map.get(key)
      if (!existing || m.createdAt > existing.last.createdAt) {
        map.set(key, { key, last: m, familyId: m.familyId, leadId: m.leadId })
      }
    }
    return [...map.values()].sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt))
  }, [db.messages])

  const active = selected || conversations[0]?.key
  const activeConv = conversations.find((c) => c.key === active)
  const thread = activeConv
    ? db.messages.filter((m) => conversationKey(m) === active).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : []

  function contactFor(conv) {
    if (!conv) return null
    return conv.familyId ? db.families.find((f) => f.id === conv.familyId) : db.leads.find((l) => l.id === conv.leadId)
  }
  const activeContact = contactFor(activeConv)

  const totalSmsCost = db.messages.reduce((s, m) => s + (m.costPence || 0), 0)

  return (
    <div>
      <PageHeader
        title="Inbox"
        sub={`All channels in one thread per contact. SMS usage this dataset: ${(totalSmsCost / 100).toFixed(2)} GBP at cost (billed + ${db.school.settings.platformMarginPct}% platform margin).`}
      />

      <div className="grid grid-cols-3 gap-4 items-start">
        <Card pad={false} className="max-h-[75vh] overflow-y-auto">
          {conversations.length === 0 && <EmptyState>No conversations.</EmptyState>}
          {conversations.map((conv) => {
            const contact = contactFor(conv)
            const name = contact?.payerName || contact?.name || 'Erased contact'
            return (
              <button
                key={conv.key}
                onClick={() => setSelected(conv.key)}
                className={cn(
                  'w-full text-left px-3.5 py-3 flex gap-2.5 border-b border-slate-50 hover:bg-slate-50',
                  active === conv.key && 'bg-blue-50/60'
                )}
              >
                <Avatar name={name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800 truncate">{name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(conv.last.createdAt)}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {conv.last.direction === 'in' ? '← ' : '→ '}{conv.last.body}
                  </div>
                  <div className="mt-0.5 flex gap-1">
                    <Badge color={conv.leadId ? 'blue' : 'slate'}>{conv.leadId ? 'lead' : 'member'}</Badge>
                    <Badge color="slate">{conv.last.channel.replace('tap_', '')}</Badge>
                  </div>
                </div>
              </button>
            )
          })}
        </Card>

        <div className="col-span-2">
          <Card
            title={
              activeContact ? (
                <span>
                  {activeContact.payerName || activeContact.name}
                  {activeConv?.familyId && (
                    <Link to={`/members/family/${activeConv.familyId}`} className="ml-2 text-xs text-blue-600 hover:underline font-normal">
                      open record →
                    </Link>
                  )}
                  {activeContact.optOutSms && <Badge color="red" className="ml-2">SMS opt-out</Badge>}
                </span>
              ) : 'Conversation'
            }
          >
            <div className="space-y-2 max-h-[45vh] overflow-y-auto mb-4 pr-1">
              {thread.map((m) => <MessageRow key={m.id} m={m} />)}
              {thread.length === 0 && <EmptyState>Select a conversation.</EmptyState>}
            </div>
            {activeConv && <Composer familyId={activeConv.familyId} leadId={activeConv.leadId} />}
          </Card>
        </div>
      </div>
    </div>
  )
}
