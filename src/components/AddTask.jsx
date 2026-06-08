import { useState } from 'react'
import { Plus } from './icons'

export default function AddTask({ onAdd }) {
  const [text, setText] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }

  return (
    <form onSubmit={submit} className="px-3">
      <div className="group flex items-center gap-2 rounded-2xl border border-leon-200/70 bg-white/70 px-3 py-2 shadow-sm transition focus-within:border-leon-400 focus-within:shadow-glow-leon dark:border-bark-700 dark:bg-bark-800/70">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs fetching?"
          maxLength={160}
          className="no-drag min-w-0 flex-1 bg-transparent text-sm font-semibold text-bark-800 outline-none placeholder:font-medium placeholder:text-bark-400 dark:text-leon-50 dark:placeholder:text-bark-400"
        />
        <button
          type="submit"
          aria-label="Add task"
          disabled={!text.trim()}
          className="no-drag grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-leon-500 text-white shadow transition hover:bg-leon-600 hover:shadow-glow-leon active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-leon-500"
        >
          <Plus size={18} />
        </button>
      </div>
    </form>
  )
}
