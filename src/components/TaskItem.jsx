import { useState } from 'react'
import { Trash, Check, Paw } from './icons'
import Confetti from './Confetti'

export default function TaskItem({ task, onComplete, onRemove, onCelebrate }) {
  const [completing, setCompleting] = useState(false)

  const tick = () => {
    if (completing) return
    setCompleting(true)
    onCelebrate?.() // sound + global cheer, fired by parent
    // let the row animate out, then commit to the archive
    setTimeout(() => onComplete(task.id), 520)
  }

  return (
    <li
      className={[
        'group relative flex items-center gap-3 rounded-2xl border px-3 py-2.5',
        'border-leon-100 bg-white/80 shadow-sm',
        'dark:border-bark-700/80 dark:bg-bark-800/70',
        completing
          ? 'animate-task-complete overflow-hidden'
          : 'animate-pop-in transition hover:border-leon-200 hover:shadow-md dark:hover:border-bark-600',
      ].join(' ')}
    >
      {/* paw checkbox */}
      <button
        type="button"
        onClick={tick}
        aria-label={`Complete "${task.text}"`}
        className={[
          'no-drag relative grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition',
          completing
            ? 'animate-check-bounce border-leon-500 bg-leon-500 text-white'
            : 'border-leon-300 text-transparent hover:border-leon-500 hover:bg-leon-50 dark:border-bark-600 dark:hover:bg-bark-700',
        ].join(' ')}
      >
        {completing ? (
          <Check size={16} />
        ) : (
          <Paw
            size={14}
            className="text-leon-300 opacity-0 transition group-hover:opacity-60 dark:text-bark-500"
          />
        )}
        {/* expanding ring pulse on tick */}
        {completing && (
          <span className="absolute inset-0 rounded-full border-2 border-leon-400 animate-ring-pulse" />
        )}
      </button>

      {completing && <Confetti origin="center" />}

      <span
        className={[
          'min-w-0 flex-1 break-words text-sm font-semibold leading-snug',
          completing
            ? 'text-bark-400 line-through'
            : 'text-bark-800 dark:text-leon-50',
        ].join(' ')}
      >
        {task.text}
      </span>

      {!completing && (
        <button
          type="button"
          onClick={() => onRemove(task.id)}
          aria-label={`Remove "${task.text}"`}
          className="no-drag grid h-7 w-7 shrink-0 place-items-center rounded-lg text-bark-300 opacity-0 transition hover:bg-red-500/15 hover:text-red-500 group-hover:opacity-100"
        >
          <Trash size={15} />
        </button>
      )}
    </li>
  )
}
