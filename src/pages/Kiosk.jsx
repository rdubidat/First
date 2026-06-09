// Full-screen tablet check-in kiosk: pick today's class, tap your name.

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { cn, isoDate, fullName, DAY_NAMES, initials } from '../lib/utils'

export default function Kiosk() {
  const { db, actions } = useStore()
  const todayDow = (new Date().getDay() + 6) % 7
  const today = isoDate(new Date())
  const todaysClasses = db.classes.filter((c) => c.dayOfWeek === todayDow).sort((a, b) => a.time.localeCompare(b.time))
  // Fall back to all classes so the kiosk is usable on no-class days (demo-friendly).
  const options = todaysClasses.length ? todaysClasses : db.classes
  const [classId, setClassId] = useState(options[0]?.id)
  const [flash, setFlash] = useState(null)

  const cls = db.classes.find((c) => c.id === classId)
  const roster = useMemo(() => {
    if (!cls) return []
    return db.enrolments
      .filter((e) => e.programmeId === cls.programmeId)
      .map((e) => db.students.find((s) => s.id === e.studentId))
      .filter((s) => s && ['active', 'trial'].includes(s.status))
      .sort((a, b) => a.firstName.localeCompare(b.firstName))
  }, [db, cls])

  function tap(student) {
    const already = db.attendance.some((a) => a.studentId === student.id && a.classId === classId && a.date === today)
    if (already) {
      actions.undoCheckIn(student.id, classId, today)
    } else {
      actions.checkIn(student.id, classId, today)
      setFlash(student.id)
      setTimeout(() => setFlash(null), 900)
    }
  }

  const checkedInIds = new Set(db.attendance.filter((a) => a.classId === classId && a.date === today).map((a) => a.studentId))

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">🥋 {db.school.name} — Check-in</h1>
          <p className="text-slate-400 text-sm">{DAY_NAMES[todayDow]} · tap your name when you arrive</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-lg"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            aria-label="Class"
          >
            {options.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.time}</option>
            ))}
          </select>
          <Link to="/" className="text-sm text-slate-400 hover:text-white">Exit kiosk</Link>
        </div>
      </div>

      <div className="text-slate-400 text-sm mb-4">
        {checkedInIds.size} of {roster.length} checked in
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {roster.map((s) => {
          const isIn = checkedInIds.has(s.id)
          return (
            <button
              key={s.id}
              onClick={() => tap(s)}
              className={cn(
                'rounded-2xl p-5 text-center transition-all duration-150 border-2',
                isIn
                  ? 'bg-emerald-600 border-emerald-400 scale-[0.98]'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-500 active:scale-95',
                flash === s.id && 'ring-4 ring-emerald-300'
              )}
            >
              <div className={cn('mx-auto h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold mb-2', isIn ? 'bg-emerald-500' : 'bg-slate-700')}>
                {isIn ? '✓' : initials(fullName(s))}
              </div>
              <div className="font-semibold leading-tight">{s.firstName}</div>
              <div className="text-sm opacity-70">{s.lastName}</div>
            </button>
          )
        })}
        {roster.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-16">No students enrolled in this programme.</div>
        )}
      </div>
    </div>
  )
}
