// Weekly timetable + instructor register view, with class SMS broadcast.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { PageHeader } from '../components/Layout'
import { Card, Button, Badge, Modal, Field, inputCls, EmptyState } from '../components/ui'
import { cn, isoDate, addDays, startOfWeek, fullName, DAY_NAMES } from '../lib/utils'

export default function Classes() {
  const { db, actions } = useStore()
  const [registerClass, setRegisterClass] = useState(null)
  const [broadcastClass, setBroadcastClass] = useState(null)
  const todayDow = (new Date().getDay() + 6) % 7

  return (
    <div>
      <PageHeader title="Classes" sub="Weekly timetable. Open a register to mark attendance, or broadcast to a class list." />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DAY_NAMES.map((day, dow) => {
          const dayClasses = db.classes.filter((c) => c.dayOfWeek === dow).sort((a, b) => a.time.localeCompare(b.time))
          if (dayClasses.length === 0) return null
          return (
            <Card key={day} title={<span className={cn(dow === todayDow && 'text-emerald-600')}>{day}{dow === todayDow ? ' · today' : ''}</span>}>
              <div className="space-y-3">
                {dayClasses.map((c) => {
                  const enrolled = db.enrolments.filter((e) => e.programmeId === c.programmeId).length
                  return (
                    <div key={c.id} className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{c.name}</div>
                        <div className="text-xs text-slate-500">{c.time} · {c.durationMins} min · {c.location} · {enrolled} enrolled</div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => setRegisterClass(c)}>Register</Button>
                        <Button size="sm" variant="ghost" onClick={() => setBroadcastClass(c)}>📣</Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {registerClass && <RegisterModal cls={registerClass} onClose={() => setRegisterClass(null)} db={db} actions={actions} />}
      {broadcastClass && <BroadcastModal cls={broadcastClass} onClose={() => setBroadcastClass(null)} actions={actions} />}
    </div>
  )
}

function RegisterModal({ cls, onClose, db, actions }) {
  // Default register date = most recent occurrence of this class's weekday.
  const monday = startOfWeek(new Date())
  let target = addDays(monday, cls.dayOfWeek)
  if (target > new Date()) target = addDays(target, -7)
  const [date, setDate] = useState(isoDate(target))

  const roster = db.enrolments
    .filter((e) => e.programmeId === cls.programmeId)
    .map((e) => db.students.find((s) => s.id === e.studentId))
    .filter((s) => s && ['active', 'trial'].includes(s.status))
    .sort((a, b) => a.firstName.localeCompare(b.firstName))

  const present = new Set(db.attendance.filter((a) => a.classId === cls.id && a.date === date).map((a) => a.studentId))

  return (
    <Modal open onClose={onClose} title={`Register — ${cls.name}`} wide>
      <div className="flex items-center justify-between mb-4">
        <Field label="Class date">
          <input type="date" className={inputCls} value={date} max={isoDate(new Date())} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Badge color="blue">{present.size} / {roster.length} present</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {roster.map((s) => {
          const isIn = present.has(s.id)
          return (
            <button
              key={s.id}
              onClick={() => (isIn ? actions.undoCheckIn(s.id, cls.id, date) : actions.checkIn(s.id, cls.id, date))}
              className={cn(
                'flex items-center justify-between rounded-lg border px-3 py-2 text-sm text-left',
                isIn ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              )}
            >
              <span><Link to={`/members/student/${s.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{fullName(s)}</Link></span>
              <span>{isIn ? '✓ present' : 'mark'}</span>
            </button>
          )
        })}
        {roster.length === 0 && <EmptyState>No students enrolled.</EmptyState>}
      </div>
    </Modal>
  )
}

function BroadcastModal({ cls, onClose, actions }) {
  const [body, setBody] = useState('')
  return (
    <Modal open onClose={onClose} title={`SMS broadcast — ${cls.name} families`}>
      <p className="text-xs text-slate-500 mb-3">
        Sends via Twilio to every active family in {cls.name.split(' (')[0]}. Opt-outs are skipped automatically; quiet-hours sends are held until morning.
      </p>
      <textarea
        className={inputCls + ' min-h-[90px]'}
        placeholder="e.g. Tonight's class is cancelled due to flooding — sorry for short notice!"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex justify-end gap-2 mt-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          disabled={!body.trim()}
          onClick={() => { actions.broadcast({ classId: cls.id, body }); onClose() }}
        >
          Send broadcast
        </Button>
      </div>
    </Modal>
  )
}
