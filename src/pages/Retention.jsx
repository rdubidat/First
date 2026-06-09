// At-risk dashboard: the retention engine's scoring surfaced for action.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { PageHeader } from '../components/Layout'
import { Card, Button, StatusBadge, Sparkbar, EmptyState, Stat } from '../components/ui'
import { riskBoard } from '../engine/retention'
import { decayCandidates } from '../engine/automations'
import { fullName } from '../lib/utils'

export default function Retention() {
  const { db, actions } = useStore()
  const [scanResult, setScanResult] = useState(null)
  const board = riskBoard(db)
  const atRisk = board.filter((r) => r.band === 'at-risk')
  const watch = board.filter((r) => r.band === 'watch')

  function runScan() {
    // Count from current state — the store updates asynchronously.
    const flagged = decayCandidates(db).length
    actions.runRetentionScan()
    setScanResult(flagged)
  }

  return (
    <div>
      <PageHeader
        title="Retention engine"
        sub="Attendance-decay scoring across all active students. The scan messages parents and creates instructor tasks for anyone missing 2+ consecutive weeks."
        action={
          <div className="flex items-center gap-3">
            {scanResult != null && (
              <span className="text-sm text-slate-500">
                {scanResult === 0 ? 'Scan complete — nobody new to nudge.' : `Scan complete — ${scanResult} decay automation${scanResult > 1 ? 's' : ''} fired.`}
              </span>
            )}
            <Button onClick={runScan}>▶ Run retention scan</Button>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <Stat label="At risk (60+)" value={atRisk.length} accent="text-red-600" sub="needs intervention now" />
        <Stat label="Watch list (30–59)" value={watch.length} accent="text-amber-600" sub="trending the wrong way" />
        <Stat label="Healthy" value={board.length - atRisk.length - watch.length} accent="text-emerald-600" sub="attending consistently" />
      </div>

      <Card pad={false}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="px-4 py-2.5 font-medium">Student</th>
              <th className="px-4 py-2.5 font-medium">8-week attendance</th>
              <th className="px-4 py-2.5 font-medium">Risk signals</th>
              <th className="px-4 py-2.5 font-medium">Score</th>
              <th className="px-4 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {board.filter((r) => r.band !== 'healthy').map((r) => {
              const family = db.families.find((f) => f.id === r.student.familyId)
              return (
                <tr key={r.student.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/members/student/${r.student.id}`} className="font-medium text-slate-800 hover:underline">
                      {fullName(r.student)}
                    </Link>
                    <div className="text-xs text-slate-400">{family?.payerName}</div>
                  </td>
                  <td className="px-4 py-3 w-44">
                    <Sparkbar values={r.weeks.slice(0, 8).map((w) => w.count)} height={26} barClass="bg-blue-500" />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {r.reasons.map((reason, i) => <div key={i}>• {reason}</div>)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{r.score}</span>
                      <StatusBadge status={r.band} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/members/family/${family?.id}`}>
                      <Button size="sm" variant="secondary">Message family</Button>
                    </Link>
                  </td>
                </tr>
              )
            })}
            {board.filter((r) => r.band !== 'healthy').length === 0 && (
              <tr><td colSpan={5}><EmptyState>Nobody flagged — the floor is healthy. 🎉</EmptyState></td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="How scoring works" className="mt-4">
        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
          <li><strong>Consecutive missed weeks</strong> — 2 weeks +40, 4 weeks +55. Triggers the parent nudge + instructor task automation.</li>
          <li><strong>Attendance trend</strong> — last 4 weeks vs previous 4: halved +25, down 25% +12.</li>
          <li><strong>Grading stall</strong> — sitting at a grade 2.5× longer than the time requirement +15.</li>
          <li><strong>Payment friction</strong> — unresolved failed payments on the family account +15.</li>
          <li>Bands: <strong>60+ at-risk</strong>, <strong>30–59 watch</strong>, below 30 healthy. Scans never re-nudge a family within 14 days.</li>
        </ul>
      </Card>
    </div>
  )
}
