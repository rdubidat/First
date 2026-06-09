// Grading engine UI: curriculum, eligibility board, grading events with
// bookings/payments/results, and certificate generation on pass.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { programmeName, gradeName, studentName } from '../data/selectors'
import { PageHeader } from '../components/Layout'
import { Card, Button, Badge, StatusBadge, Modal, Field, inputCls, EmptyState } from '../components/ui'
import { checkEligibility, gradesForProgramme, nextGrade } from '../engine/grading'
import { gbp, fmtDate, isoDate, addDays, fullName } from '../lib/utils'

export default function Grading() {
  const { db, actions } = useStore()
  const [programmeId, setProgrammeId] = useState(db.programmes[1]?.id || db.programmes[0]?.id)
  const [creating, setCreating] = useState(false)
  const [certificate, setCertificate] = useState(null)

  const rows = db.enrolments
    .filter((e) => e.programmeId === programmeId)
    .map((e) => ({ enr: e, student: db.students.find((s) => s.id === e.studentId), check: checkEligibility(db, e) }))
    .filter((r) => r.student && r.student.status === 'active')
    .sort((a, b) => Number(b.check.eligible) - Number(a.check.eligible) || (b.check.attended || 0) - (a.check.attended || 0))

  const events = [...db.gradingEvents].sort((a, b) => b.date.localeCompare(a.date))
  const grades = gradesForProgramme(db, programmeId)

  return (
    <div>
      <PageHeader
        title="Grading"
        sub="Eligibility = minimum classes at grade + minimum time at grade, per curriculum."
        action={<Button onClick={() => setCreating(true)}>+ Grading event</Button>}
      />

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {db.programmes.map((p) => (
          <Button key={p.id} size="sm" variant={programmeId === p.id ? 'primary' : 'secondary'} onClick={() => setProgrammeId(p.id)}>
            {p.name}
          </Button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card title={`Eligibility board — ${programmeName(db, programmeId)} (${rows.filter((r) => r.check.eligible).length} ready)`} pad={false}>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-2.5 font-medium">Student</th>
                  <th className="px-4 py-2.5 font-medium">Current → next</th>
                  <th className="px-4 py-2.5 font-medium">Classes</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(({ enr, student, check }) => (
                  <tr key={enr.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link to={`/members/student/${student.id}`} className="font-medium text-slate-800 hover:underline">
                        {fullName(student)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      {gradeName(db, enr.gradeId)} {check.target && <>→ <span className="font-medium">{check.target.name}</span></>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      {check.target ? `${check.attended} / ${check.classesRequired}` : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge color={check.eligible ? 'green' : 'slate'}>{check.reason}</Badge>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4}><EmptyState>No active students in this programme.</EmptyState></td></tr>
                )}
              </tbody>
            </table>
          </Card>

          {events.map((ev) => (
            <GradingEventCard key={ev.id} ev={ev} db={db} actions={actions} onCertificate={setCertificate} />
          ))}
        </div>

        <div>
          <Card title={`Curriculum — ${programmeName(db, programmeId)}`}>
            <div className="space-y-1.5">
              {grades.map((g, i) => (
                <div key={g.id} className="flex items-center justify-between text-sm py-1">
                  <span className="font-medium text-slate-700">{g.name}</span>
                  <span className="text-xs text-slate-400">
                    {i === 0 ? 'starting grade' : `${g.minClasses} classes · ${Math.round(g.minDays / 7)} wks · ${gbp(g.gradingFeePence)}`}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <CreateEventModal open={creating} onClose={() => setCreating(false)} db={db} actions={actions} defaultProgramme={programmeId} />
      <CertificateModal cert={certificate} onClose={() => setCertificate(null)} db={db} />
    </div>
  )
}

function GradingEventCard({ ev, db, actions, onCertificate }) {
  const [bookingFor, setBookingFor] = useState('')
  const eligible = db.enrolments
    .filter((e) => e.programmeId === ev.programmeId)
    .map((e) => ({ e, s: db.students.find((s) => s.id === e.studentId), c: checkEligibility(db, e) }))
    .filter((r) => r.s && r.s.status === 'active' && r.c.eligible && !ev.bookings.some((b) => b.studentId === r.s.id))

  const revenue = ev.bookings.filter((b) => b.paid).length * ev.feePence

  return (
    <Card
      title={
        <span>
          {ev.name} <span className="text-slate-400 font-normal">· {fmtDate(ev.date)} · {gbp(ev.feePence)}</span>
        </span>
      }
      action={<StatusBadge status={ev.status} />}
    >
      {ev.status === 'scheduled' && (
        <div className="flex gap-2 mb-3">
          <select className={inputCls + ' !w-auto'} value={bookingFor} onChange={(e) => setBookingFor(e.target.value)} aria-label="Book student">
            <option value="">Book an eligible student…</option>
            {eligible.map(({ s }) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
          </select>
          <Button size="sm" disabled={!bookingFor} onClick={() => { actions.bookGrading(ev.id, bookingFor); setBookingFor('') }}>
            Book + collect {gbp(ev.feePence)}
          </Button>
        </div>
      )}
      <div className="divide-y divide-slate-50">
        {ev.bookings.map((b) => {
          const enr = db.enrolments.find((e) => e.studentId === b.studentId && e.programmeId === ev.programmeId)
          const target = b.newGradeId ? db.grades.find((g) => g.id === b.newGradeId) : enr ? nextGrade(db, enr) : null
          return (
            <div key={b.studentId} className="flex items-center justify-between py-2">
              <div className="text-sm">
                <span className="font-medium text-slate-800">{studentName(db, b.studentId)}</span>
                <span className="text-xs text-slate-400"> · attempting {target?.name || '—'} · {b.paid ? 'paid' : 'unpaid'}</span>
              </div>
              {b.result === 'pending' ? (
                <div className="flex gap-1.5">
                  <Button size="sm" variant="success" onClick={() => actions.recordGradingResult(ev.id, b.studentId, 'pass')}>Pass</Button>
                  <Button size="sm" variant="secondary" onClick={() => actions.recordGradingResult(ev.id, b.studentId, 'fail')}>Not yet</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.result} />
                  {b.result === 'pass' && (
                    <Button size="sm" variant="ghost" onClick={() => onCertificate({ studentId: b.studentId, gradeId: b.newGradeId, date: ev.date })}>
                      📜 Certificate
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {ev.bookings.length === 0 && <EmptyState>No bookings yet.</EmptyState>}
      </div>
      {ev.bookings.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          Grading revenue: <span className="font-semibold text-slate-700">{gbp(revenue)}</span>
        </div>
      )}
    </Card>
  )
}

function CreateEventModal({ open, onClose, db, actions, defaultProgramme }) {
  const [form, setForm] = useState({ programmeId: defaultProgramme, name: '', date: isoDate(addDays(new Date(), 14)), fee: '25' })
  return (
    <Modal open={open} onClose={onClose} title="New grading event">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          actions.createGradingEvent({
            programmeId: form.programmeId,
            name: form.name || `${programmeName(db, form.programmeId)} Grading`,
            date: form.date,
            feePence: Math.round(parseFloat(form.fee || '0') * 100),
          })
          onClose()
        }}
        className="space-y-3"
      >
        <Field label="Programme">
          <select className={inputCls} value={form.programmeId} onChange={(e) => setForm({ ...form, programmeId: e.target.value })}>
            {db.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Event name">
          <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={`${programmeName(db, form.programmeId)} Grading`} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input type="date" required className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Fee (£)"><input type="number" step="0.01" required className={inputCls} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create event</Button>
        </div>
      </form>
    </Modal>
  )
}

function CertificateModal({ cert, onClose, db }) {
  if (!cert) return null
  return (
    <Modal open onClose={onClose} title="Certificate preview" wide>
      <div className="border-8 border-double border-amber-600 rounded p-10 text-center bg-amber-50/40">
        <div className="text-4xl mb-3">🥋</div>
        <div className="text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">{db.school.name}</div>
        <div className="text-sm text-slate-500">This certifies that</div>
        <div className="text-3xl font-bold text-slate-900 my-2" style={{ fontFamily: 'Georgia, serif' }}>
          {studentName(db, cert.studentId)}
        </div>
        <div className="text-sm text-slate-500">has been awarded the rank of</div>
        <div className="text-xl font-semibold text-amber-700 my-2">{gradeName(db, cert.gradeId)}</div>
        <div className="text-sm text-slate-500 mt-4">{fmtDate(cert.date)}</div>
        <div className="mt-8 flex justify-around text-xs text-slate-400">
          <div className="border-t border-slate-300 pt-1 px-8">Chief Instructor</div>
          <div className="border-t border-slate-300 pt-1 px-8">Programme Director</div>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3">In production this renders to PDF and is emailed to the family automatically on pass.</p>
      <div className="flex justify-end mt-2">
        <Button variant="secondary" onClick={() => window.print()}>Print</Button>
      </div>
    </Modal>
  )
}
