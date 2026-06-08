import { useCallback, useEffect, useRef, useState } from 'react'
import { load, save } from '../state/storage'

const DEFAULTS = {
  focus: 25,
  short: 5,
  long: 15,
  longEvery: 4, // long break after every N focus sessions
  autoStart: true,
}

const LABEL = {
  focus: 'Fetch Focus',
  short: 'Quick Sniff',
  long: 'Nap Time',
}

// A Pomodoro timer with a dog-friendly vocabulary. Focus sessions are
// "Fetch", short breaks are a "Quick Sniff", long breaks are "Nap Time".
export function usePomodoro(onSessionEnd) {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULTS,
    ...load('pomodoro', {}),
  }))
  const [mode, setMode] = useState('focus')
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(DEFAULTS.focus * 60)
  const [focusDone, setFocusDone] = useState(() => load('focusDone', 0))

  const deadlineRef = useRef(null)
  const endCb = useRef(onSessionEnd)
  endCb.current = onSessionEnd

  useEffect(() => save('pomodoro', settings), [settings])
  useEffect(() => save('focusDone', focusDone), [focusDone])

  const durationFor = useCallback(
    (m) => (settings[m] ?? DEFAULTS[m]) * 60,
    [settings]
  )

  // Keep the clock in sync when settings change while paused.
  useEffect(() => {
    if (!running) setSecondsLeft(durationFor(mode))
  }, [mode, running, durationFor])

  const goToMode = useCallback(
    (next, autoStart) => {
      setMode(next)
      setSecondsLeft(durationFor(next))
      if (autoStart) {
        deadlineRef.current = Date.now() + durationFor(next) * 1000
        setRunning(true)
      } else {
        setRunning(false)
        deadlineRef.current = null
      }
    },
    [durationFor]
  )

  const advance = useCallback(() => {
    const finished = mode
    let next
    let nextFocusDone = focusDone
    if (finished === 'focus') {
      nextFocusDone = focusDone + 1
      setFocusDone(nextFocusDone)
      next = nextFocusDone % (settings.longEvery || 4) === 0 ? 'long' : 'short'
    } else {
      next = 'focus'
    }
    endCb.current?.({ finished, next, focusDone: nextFocusDone })
    goToMode(next, settings.autoStart)
  }, [mode, focusDone, settings.longEvery, settings.autoStart, goToMode])

  // Timer loop — recompute from a wall-clock deadline to avoid drift.
  useEffect(() => {
    if (!running) return
    if (deadlineRef.current == null) {
      deadlineRef.current = Date.now() + secondsLeft * 1000
    }
    const id = setInterval(() => {
      const remaining = Math.round((deadlineRef.current - Date.now()) / 1000)
      if (remaining <= 0) {
        clearInterval(id)
        setSecondsLeft(0)
        advance()
      } else {
        setSecondsLeft(remaining)
      }
    }, 250)
    return () => clearInterval(id)
  }, [running, advance]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    if (running) return
    deadlineRef.current = Date.now() + secondsLeft * 1000
    setRunning(true)
  }, [running, secondsLeft])

  const pause = useCallback(() => {
    setRunning(false)
    deadlineRef.current = null
  }, [])

  const toggle = useCallback(() => {
    running ? pause() : start()
  }, [running, pause, start])

  const reset = useCallback(() => {
    setRunning(false)
    deadlineRef.current = null
    setSecondsLeft(durationFor(mode))
  }, [mode, durationFor])

  const skip = useCallback(() => {
    setRunning(false)
    deadlineRef.current = null
    advance()
  }, [advance])

  const selectMode = useCallback(
    (m) => {
      setRunning(false)
      deadlineRef.current = null
      goToMode(m, false)
    },
    [goToMode]
  )

  const updateSettings = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const total = durationFor(mode)
  const progress = total > 0 ? 1 - secondsLeft / total : 0

  return {
    mode,
    label: LABEL[mode],
    running,
    secondsLeft,
    progress,
    focusDone,
    settings,
    start,
    pause,
    toggle,
    reset,
    skip,
    selectMode,
    updateSettings,
  }
}
