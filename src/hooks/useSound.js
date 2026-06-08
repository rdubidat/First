import { useCallback, useRef } from 'react'

// Synthesizes short, pleasant UI sounds with the Web Audio API so the app
// ships with zero audio assets. Every cue is designed to feel rewarding —
// that little hit of dopamine when you tick a task off.
export function useSound(enabledRef) {
  const ctxRef = useRef(null)

  const ctx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      ctxRef.current = new AC()
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }, [])

  const tone = useCallback(
    (freq, start, dur, { type = 'sine', gain = 0.18, glideTo } = {}) => {
      const ac = ctx()
      if (!ac) return
      const t0 = ac.currentTime + start
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, t0)
      if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
      osc.connect(g).connect(ac.destination)
      osc.start(t0)
      osc.stop(t0 + dur + 0.02)
    },
    [ctx]
  )

  const guard = useCallback(() => enabledRef?.current !== false, [enabledRef])

  // Bright rising arpeggio + sparkle — the "task done!" reward.
  const complete = useCallback(() => {
    if (!guard()) return
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
    notes.forEach((f, i) =>
      tone(f, i * 0.06, 0.22, { type: 'triangle', gain: 0.16 })
    )
    tone(1568, 0.26, 0.18, { type: 'sine', gain: 0.08 }) // sparkle G6
  }, [guard, tone])

  // Soft pluck for adding a task.
  const add = useCallback(() => {
    if (!guard()) return
    tone(392, 0, 0.14, { type: 'sine', gain: 0.12, glideTo: 588 })
  }, [guard, tone])

  // Subtle click for taps/toggles.
  const click = useCallback(() => {
    if (!guard()) return
    tone(660, 0, 0.06, { type: 'square', gain: 0.05 })
  }, [guard, tone])

  // Warm two-note chime when a Pomodoro session ends.
  const chime = useCallback(() => {
    if (!guard()) return
    tone(659.25, 0, 0.5, { type: 'sine', gain: 0.18 })
    tone(987.77, 0.18, 0.6, { type: 'sine', gain: 0.16 })
  }, [guard, tone])

  // Gentle "undo / retrieve" blip.
  const retrieve = useCallback(() => {
    if (!guard()) return
    tone(523.25, 0, 0.16, { type: 'sine', gain: 0.12, glideTo: 392 })
  }, [guard, tone])

  return { complete, add, click, chime, retrieve }
}
