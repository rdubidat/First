import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { gradeName, programmeName } from '../data/selectors'
import { PageHeader } from '../components/Layout'
import { Card, Avatar, StatusBadge, Button, Modal, Field, inputCls, EmptyState } from '../components/ui'
import { fullName, ageFromDob } from '../lib/utils'

const STATUS_FILTERS = ['all', 'active', 'trial', 'frozen', 'cancelled']

export default function Members() {
  const { db, actions } = useStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [adding, setAdding] = useState(false)

  const students = db.students
    .filter((s) => status === 'all' || s.status === status)
    .filter((s) => {
      if (!q) return true
      const family = db.families.find((f) => f.id === s.familyId)
      const hay = `${fullName(s)} ${family?.payerName || ''}`.toLowerCase()
      return hay.includes(q.toLowerCase())
    })
    .sort((a, b) => a.lastName.localeCompare(b.lastName))

  return (
    <div>
      <PageHeader
        title="Members"
        sub={`${db.students.filter((s) => s.status === 'active').length} active students across ${db.families.length} family accounts`}
        action={<Button onClick={() => setAdding(true)}>+ Add student</Button>}
      />

      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          className={inputCls + ' max-w-xs'}
          placeholder="Search students or payers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-1">
          {STATUS_FILTERS.map((f) => (
            <Button key={f} size="sm" variant={status === f ? 'primary' : 'secondary'} onClick={() => setStatus(f)}>
              {f}
            </Button>
          ))}
        </div>
      </div>

      <Card pad={false}>
        {students.length === 0 ? (
          <EmptyState>No students match.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-4 py-2.5 font-medium">Student</th>
                <th className="px-4 py-2.5 font-medium">Programme / grade</th>
                <th className="px-4 py-2.5 font-medium">Family (payer)</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((s) => {
                const family = db.families.find((f) => f.id === s.familyId)
                const enrs = db.enrolments.filter((e) => e.studentId === s.id)
                const age = ageFromDob(s.dob)
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5">
                      <Link to={`/members/student/${s.id}`} className="flex items-center gap-2.5 group">
                        <Avatar name={fullName(s)} size="sm" />
                        <div>
                          <div className="font-medium text-slate-800 group-hover:underline">{fullName(s)}</div>
                          <div className="text-xs text-slate-400">{age != null ? `${age} yrs` : '—'}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {enrs.map((e) => (
                        <div key={e.id} className="text-xs">
                          <span className="font-medium">{programmeName(db, e.programmeId)}</span>
                          <span className="text-slate-400"> · {gradeName(db, e.gradeId)}</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-2.5">
                      {family && (
                        <Link to={`/members/family/${family.id}`} className="text-slate-600 hover:underline text-xs">
                          {family.payerName}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={s.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <AddStudentModal open={adding} onClose={() => setAdding(false)} db={db} actions={actions} />
    </div>
  )
}

function AddStudentModal({ open, onClose, db, actions }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', programmeId: db.programmes[0]?.id, familyId: '', payerName: '', email: '', phone: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const newFamily = form.familyId === ''

  function submit(e) {
    e.preventDefault()
    let familyId = form.familyId
    if (newFamily) {
      familyId = actions.addFamily({ payerName: form.payerName || `${form.firstName} ${form.lastName}`, email: form.email, phone: form.phone })
    }
    actions.addStudent({ familyId, firstName: form.firstName, lastName: form.lastName, dob: form.dob, programmeId: form.programmeId })
    onClose()
    setForm({ firstName: '', lastName: '', dob: '', programmeId: db.programmes[0]?.id, familyId: '', payerName: '', email: '', phone: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Add student">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name"><input required className={inputCls} value={form.firstName} onChange={set('firstName')} /></Field>
          <Field label="Last name"><input required className={inputCls} value={form.lastName} onChange={set('lastName')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date of birth"><input type="date" className={inputCls} value={form.dob} onChange={set('dob')} /></Field>
          <Field label="Programme">
            <select className={inputCls} value={form.programmeId} onChange={set('programmeId')}>
              {db.programmes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Family account">
          <select className={inputCls} value={form.familyId} onChange={set('familyId')}>
            <option value="">＋ New family account</option>
            {db.families.map((f) => <option key={f.id} value={f.id}>{f.payerName}</option>)}
          </select>
        </Field>
        {newFamily && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
            <Field label="Payer name"><input className={inputCls} value={form.payerName} onChange={set('payerName')} /></Field>
            <Field label="Email"><input type="email" className={inputCls} value={form.email} onChange={set('email')} /></Field>
            <Field label="Mobile"><input className={inputCls} value={form.phone} onChange={set('phone')} /></Field>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add student</Button>
        </div>
      </form>
    </Modal>
  )
}
