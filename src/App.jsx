import { useEffect, useRef, useState } from 'react'
import { useTheme } from './hooks/useTheme'
import { useTasks } from './hooks/useTasks'
import { usePomodoro } from './hooks/usePomodoro'
import { useSound } from './hooks/useSound'
import { isElectron, load, save } from './state/storage'
import TitleBar from './components/TitleBar'
import AddTask from './components/AddTask'
import TaskList from './components/TaskList'
import Archive from './components/Archive'
import Pomodoro from './components/Pomodoro'
import CompactBubble from './components/CompactBubble'
import Confetti from './components/Confetti'
import { Paw, Bone, Check } from './components/icons'

const TABS = [
  { key: 'tasks', label: 'Tasks', Icon: Paw },
  { key: 'pomodoro', label: 'Pomodoro', Icon: Check },
  { key: 'doghouse', label: 'Doghouse', Icon: Bone },
]

export default function App() {
  const { isDark, toggle: toggleTheme } = useTheme()
  const {
    tasks,
    archive,
    add,
    remove,
    complete,
    retrieve,
    removeArchived,
    clearArchive,
    stats,
  } = useTasks()

  const [tab, setTab] = useState('tasks')
  const [pinned, setPinned] = useState(true)
  const [compact, setCompact] = useState(false)
  const [cheer, setCheer] = useState(0)

  // sound on/off, persisted; passed to useSound via a ref so callbacks stay stable
  const [soundOn, setSoundOn] = useState(() => load('sound', true))
  const soundRef = useRef(soundOn)
  useEffect(() => {
    soundRef.current = soundOn
    save('sound', soundOn)
  }, [soundOn])
  const sfx = useSound(soundRef)

  const pomo = usePomodoro(({ finished }) => {
    sfx.chime()
    if (finished === 'focus') setCheer((c) => c + 1)
  })

  // sync pinned state from the Electron main process on launch
  useEffect(() => {
    if (isElectron && window.gnt.getAlwaysOnTop) {
      window.gnt.getAlwaysOnTop().then((v) => setPinned(!!v))
    }
  }, [])

  const handleAdd = (text) => {
    add(text)
    sfx.add()
  }

  const celebrate = () => {
    sfx.complete()
    setCheer((c) => c + 1)
  }

  const togglePin = async () => {
    if (!isElectron) return
    const v = await window.gnt.toggleAlwaysOnTop()
    setPinned(!!v)
  }

  const toggleCompact = async () => {
    if (!isElectron) return
    const v = await window.gnt.toggleCompact()
    setCompact(!!v)
  }

  const switchTab = (key) => {
    setTab(key)
    sfx.click()
  }

  // ---- compact floating bubble -------------------------------------------
  if (compact) {
    const mood = pomo.mode === 'focus' ? 'focus' : 'sleep'
    return (
      <CompactBubble
        activeCount={stats.active}
        running={pomo.running}
        secondsLeft={pomo.secondsLeft}
        mood={mood}
        onExpand={toggleCompact}
      />
    )
  }

  // ---- full window --------------------------------------------------------
  return (
    <div
      className={
        isElectron
          ? 'h-full w-full p-2.5'
          : 'web-backdrop flex h-full w-full items-center justify-center p-4'
      }
    >
      <div
        className={[
          'relative flex flex-col overflow-hidden rounded-[26px] border shadow-float',
          'border-white/60 bg-gradient-to-b from-leon-50 to-leon-100',
          'dark:border-bark-700/60 dark:from-bark-900 dark:to-bark-950',
          isElectron ? 'h-full w-full' : 'h-[600px] w-[380px]',
        ].join(' ')}
      >
        <TitleBar
          streak={stats.completedToday}
          pinned={pinned}
          onTogglePin={togglePin}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          soundOn={soundOn}
          onToggleSound={() => setSoundOn((s) => !s)}
          onCompact={toggleCompact}
        />

        {/* tabs */}
        <nav className="no-drag flex gap-1 px-3 pb-2">
          {TABS.map(({ key, label, Icon }) => {
            const count =
              key === 'tasks'
                ? stats.active
                : key === 'doghouse'
                  ? stats.archived
                  : 0
            const active = tab === key
            return (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={[
                  'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold transition',
                  active
                    ? 'bg-leon-500 text-white shadow'
                    : 'text-bark-500 hover:bg-leon-500/10 hover:text-leon-600 dark:text-bark-300 dark:hover:text-leon-300',
                ].join(' ')}
              >
                {Icon ? <Icon size={14} /> : null}
                {label}
                {count > 0 && (
                  <span
                    className={[
                      'grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px]',
                      active ? 'bg-white/30 text-white' : 'bg-leon-500/20 text-leon-600 dark:text-leon-300',
                    ].join(' ')}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* content */}
        <main className="flex flex-1 flex-col overflow-y-auto pb-3">
          {tab === 'tasks' && (
            <div className="flex flex-1 flex-col gap-2">
              <AddTask onAdd={handleAdd} />
              <TaskList
                tasks={tasks}
                onComplete={complete}
                onRemove={remove}
                onCelebrate={celebrate}
              />
            </div>
          )}
          {tab === 'pomodoro' && <Pomodoro pomo={pomo} />}
          {tab === 'doghouse' && (
            <Archive
              archive={archive}
              onRetrieve={(id) => {
                retrieve(id)
                sfx.retrieve()
              }}
              onRemove={removeArchived}
              onClear={clearArchive}
            />
          )}
        </main>

        {/* celebration confetti overlay */}
        {cheer > 0 && (
          <div
            key={cheer}
            className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2"
          >
            <Confetti count={22} />
          </div>
        )}
      </div>
    </div>
  )
}
