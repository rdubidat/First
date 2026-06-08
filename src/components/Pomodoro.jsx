import { useState } from 'react'
import { Play, Pause, Reset, Skip, Gear, Bone } from './icons'
import Leon from './Leon'

const MODES = [
  { key: 'focus', label: 'Fetch' },
  { key: 'short', label: 'Sniff' },
  { key: 'long', label: 'Nap' },
]

function fmt(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function NumberField({ label, value, min, max, onChange }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm font-semibold text-bark-600 dark:text-bark-200">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = Math.max(min, Math.min(max, Number(e.target.value) || min))
          onChange(v)
        }}
        className="no-drag w-16 rounded-lg border border-leon-200 bg-white px-2 py-1 text-center text-bark-800 outline-none focus:border-leon-400 dark:border-bark-600 dark:bg-bark-800 dark:text-leon-50"
      />
    </label>
  )
}

export default function Pomodoro({ pomo }) {
  const {
    mode,
    label,
    running,
    secondsLeft,
    progress,
    focusDone,
    settings,
    toggle,
    reset,
    skip,
    selectMode,
    updateSettings,
  } = pomo
  const [showSettings, setShowSettings] = useState(false)

  const R = 78
  const C = 2 * Math.PI * R
  const mood = mode === 'focus' ? (running ? 'focus' : 'happy') : 'sleep'

  return (
    <div className="flex flex-1 flex-col items-center gap-4 px-4 py-4">
      {/* mode switch */}
      <div className="no-drag flex gap-1 rounded-full bg-leon-100/70 p-1 dark:bg-bark-800/70">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => selectMode(m.key)}
            className={[
              'rounded-full px-3 py-1 text-xs font-bold transition',
              mode === m.key
                ? 'bg-leon-500 text-white shadow'
                : 'text-bark-500 hover:text-leon-600 dark:text-bark-300 dark:hover:text-leon-300',
            ].join(' ')}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ring + timer */}
      <div className="relative grid place-items-center">
        <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="12"
            className="stroke-leon-100 dark:stroke-bark-800"
          />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            className="stroke-leon-500 transition-[stroke-dashoffset] duration-500 ease-linear"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <Leon mood={mood} size={56} className={running && mode !== 'focus' ? 'animate-float-bob' : ''} />
          <span className="mt-1 font-display text-4xl font-extrabold tabular-nums text-bark-800 dark:text-leon-50">
            {fmt(secondsLeft)}
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-leon-600 dark:text-leon-300">
            {label}
          </span>
        </div>
      </div>

      {/* controls */}
      <div className="no-drag flex items-center gap-3">
        <button
          onClick={reset}
          aria-label="Reset"
          className="grid h-10 w-10 place-items-center rounded-full text-bark-500 transition hover:bg-leon-500/15 hover:text-leon-600 active:scale-90 dark:text-bark-300"
        >
          <Reset size={18} />
        </button>
        <button
          onClick={toggle}
          aria-label={running ? 'Pause' : 'Start'}
          className="grid h-14 w-14 place-items-center rounded-full bg-leon-500 text-white shadow-lg transition hover:bg-leon-600 hover:shadow-glow-leon active:scale-90"
        >
          {running ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={skip}
          aria-label="Skip"
          className="grid h-10 w-10 place-items-center rounded-full text-bark-500 transition hover:bg-leon-500/15 hover:text-leon-600 active:scale-90 dark:text-bark-300"
        >
          <Skip size={18} />
        </button>
      </div>

      {/* streak of completed focus sessions */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: settings.longEvery || 4 }).map((_, i) => (
          <Bone
            key={i}
            size={16}
            className={
              i < focusDone % (settings.longEvery || 4)
                ? 'text-leon-500'
                : 'text-leon-200 dark:text-bark-700'
            }
          />
        ))}
        <span className="ml-1 text-xs font-bold text-bark-400">
          {focusDone} fetched
        </span>
      </div>

      {/* settings */}
      <div className="w-full">
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="no-drag mx-auto flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-bark-400 transition hover:text-leon-600 dark:hover:text-leon-300"
        >
          <Gear size={14} />
          {showSettings ? 'Hide settings' : 'Timer settings'}
        </button>
        {showSettings && (
          <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-leon-100 bg-white/70 p-3 dark:border-bark-700 dark:bg-bark-800/60">
            <NumberField
              label="Fetch (min)"
              value={settings.focus}
              min={1}
              max={120}
              onChange={(v) => updateSettings({ focus: v })}
            />
            <NumberField
              label="Sniff (min)"
              value={settings.short}
              min={1}
              max={60}
              onChange={(v) => updateSettings({ short: v })}
            />
            <NumberField
              label="Nap (min)"
              value={settings.long}
              min={1}
              max={60}
              onChange={(v) => updateSettings({ long: v })}
            />
            <NumberField
              label="Nap after N fetches"
              value={settings.longEvery}
              min={2}
              max={8}
              onChange={(v) => updateSettings({ longEvery: v })}
            />
            <label className="flex items-center justify-between gap-2 text-sm font-semibold text-bark-600 dark:text-bark-200">
              Auto-start next
              <button
                role="switch"
                aria-checked={settings.autoStart}
                onClick={() => updateSettings({ autoStart: !settings.autoStart })}
                className={[
                  'no-drag relative h-6 w-11 rounded-full transition',
                  settings.autoStart ? 'bg-leon-500' : 'bg-bark-300 dark:bg-bark-600',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                    settings.autoStart ? 'left-[22px]' : 'left-0.5',
                  ].join(' ')}
                />
              </button>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
