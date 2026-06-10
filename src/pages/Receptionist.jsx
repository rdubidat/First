// Phase 2 AI receptionist: out-of-hours FAQ + trial booking with escalation
// to a human task. The demo brain is rule-based behind the same respond()
// contract the Anthropic-powered version uses in production.

import { useRef, useState, useEffect } from 'react'
import { useStore } from '../data/store'
import { PageHeader } from '../components/Layout'
import { Card, Button, Badge, inputCls } from '../components/ui'
import { receptionistRespond } from '../engine/content'
import { cn } from '../lib/utils'

const SUGGESTIONS = ['How much is membership?', 'What ages do you teach?', 'Can I book a trial?', 'When are classes?']

export default function Receptionist() {
  const { db, actions } = useStore()
  const [thread, setThread] = useState([
    { from: 'bot', text: `Hi! 👋 I'm the ${db.school.name} assistant. I can help with class times, prices, age groups — or get you booked in for a free trial.` },
  ])
  const [input, setInput] = useState('')
  const [state, setState] = useState({})
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [thread])

  function send(text) {
    if (!text.trim()) return
    const result = receptionistRespond(db, text, state)
    setThread((t) => [...t, { from: 'user', text }, { from: 'bot', text: result.reply }])
    setState(result.state)
    setInput('')
    if (result.createLead) {
      actions.addLead({ ...result.createLead, programmeId: null })
    }
    if (result.escalate) {
      actions.addTask({ title: `Receptionist escalation — answer enquiry: “${result.escalate}”` })
    }
  }

  return (
    <div>
      <PageHeader
        title="AI receptionist"
        sub="Embedded on the school website for out-of-hours enquiries. Trial bookings create a lead (speed-to-lead fires); anything it can't answer becomes a task for the team."
      />

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <Card className="lg:col-span-2" title="Live preview — try it" pad={false}>
          <div className="h-[26rem] overflow-y-auto p-4 space-y-2 bg-slate-50/60">
            {thread.map((m, i) => (
              <div key={i} className={cn('flex', m.from === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap',
                  m.from === 'user' ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                )}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-slate-100">
            <div className="flex gap-1.5 mb-2 flex-wrap">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="text-xs rounded-full border border-slate-300 px-2.5 py-1 text-slate-600 hover:bg-slate-100">
                  {s}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => { e.preventDefault(); send(input) }}
            >
              <input className={inputCls} placeholder="Type a question…" value={input} onChange={(e) => setInput(e.target.value)} />
              <Button type="submit">Send</Button>
            </form>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="What it handles">
            <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Prices & memberships (live from your plans)</li>
              <li>Age groups & programmes</li>
              <li>Timetable questions</li>
              <li>Grading FAQs</li>
              <li><strong>Free trial booking</strong> → creates a lead, speed-to-lead SMS fires</li>
              <li>Unknown questions → escalates to a team task after two attempts</li>
            </ul>
          </Card>
          <Card title="Production notes">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Demo brain</span><Badge color="slate">rule-based</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Production brain</span><Badge color="purple">Anthropic API</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Same respond() contract either way — the booking flow, lead creation and escalation path don't change when the model is swapped in.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
