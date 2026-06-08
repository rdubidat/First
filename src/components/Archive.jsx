import { Undo, Trash, Bone } from './icons'
import Leon from './Leon'

function ago(ts) {
  if (!ts) return ''
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'yesterday' : `${d}d ago`
}

export default function Archive({ archive, onRetrieve, onRemove, onClear }) {
  if (archive.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <Leon mood="sleep" size={84} className="animate-float-bob" />
        <p className="font-display text-base font-bold text-bark-700 dark:text-leon-100">
          The doghouse is empty
        </p>
        <p className="max-w-[220px] text-sm font-medium text-bark-400 dark:text-bark-300">
          Tasks you tick off get buried here like Leon's bones — ready to dig
          back up if you ever need them.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-3 py-1">
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-bark-400">
          <Bone size={13} />
          {archive.length} buried
        </span>
        <button
          type="button"
          onClick={onClear}
          className="no-drag rounded-lg px-2 py-1 text-xs font-bold text-bark-400 transition hover:bg-red-500/10 hover:text-red-500"
        >
          Clear all
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {archive.map((task) => (
          <li
            key={task.id}
            className="group flex animate-pop-in items-center gap-3 rounded-2xl border border-leon-100/70 bg-white/60 px-3 py-2.5 dark:border-bark-700/60 dark:bg-bark-800/50"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-leon-100 text-leon-500 dark:bg-bark-700 dark:text-leon-300">
              <Bone size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold text-bark-500 line-through dark:text-bark-300">
                {task.text}
              </p>
              <p className="text-[11px] font-medium text-bark-400">
                {ago(task.completedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRetrieve(task.id)}
              aria-label={`Retrieve "${task.text}"`}
              title="Dig back up"
              className="no-drag grid h-7 w-7 shrink-0 place-items-center rounded-lg text-bark-400 transition hover:bg-leon-500/15 hover:text-leon-600 dark:hover:text-leon-300"
            >
              <Undo size={15} />
            </button>
            <button
              type="button"
              onClick={() => onRemove(task.id)}
              aria-label={`Delete "${task.text}" forever`}
              title="Delete forever"
              className="no-drag grid h-7 w-7 shrink-0 place-items-center rounded-lg text-bark-300 opacity-0 transition hover:bg-red-500/15 hover:text-red-500 group-hover:opacity-100"
            >
              <Trash size={15} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
