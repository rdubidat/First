import Leon from './Leon'
import { Collapse } from './icons'

function fmt(s) {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

// The collapsed state: a small, draggable paw bubble that stays out of the way
// but still shows your task count and a running timer at a glance.
export default function CompactBubble({ activeCount, running, secondsLeft, mood, onExpand }) {
  return (
    <div className="drag grid h-full w-full place-items-center p-2">
      <button
        type="button"
        onClick={onExpand}
        title="Expand Growth Network Tasks"
        className="no-drag group relative grid h-full w-full place-items-center rounded-[28px] bg-gradient-to-br from-leon-300 to-leon-600 shadow-float transition active:scale-95"
      >
        <Leon mood={running ? mood : 'happy'} size={88} className="drop-shadow" />

        {activeCount > 0 && (
          <span className="absolute right-3 top-3 grid h-7 min-w-7 place-items-center rounded-full bg-white px-1.5 text-sm font-extrabold text-leon-600 shadow">
            {activeCount}
          </span>
        )}

        {running && (
          <span className="absolute bottom-3 rounded-full bg-bark-900/80 px-2.5 py-0.5 text-sm font-extrabold tabular-nums text-leon-50">
            {fmt(secondsLeft)}
          </span>
        )}

        <span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/40 text-bark-800 opacity-0 transition group-hover:opacity-100">
          <Collapse size={13} />
        </span>
      </button>
    </div>
  )
}
