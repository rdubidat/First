import { useState, useRef, useCallback, useEffect } from 'react';

const TIMER_MODES = {
  focus: 'focus',
  shortBreak: 'shortBreak',
  longBreak: 'longBreak',
};

const DEFAULT_DURATIONS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const POMODOROS_BEFORE_LONG_BREAK = 4;

export function useTimer({ onSessionComplete, durations = DEFAULT_DURATIONS }) {
  const [mode, setMode] = useState(TIMER_MODES.focus);
  const [timeLeft, setTimeLeft] = useState(durations.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const totalTime = durations[mode];
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const switchMode = useCallback((newMode) => {
    clearTimer();
    setMode(newMode);
    setTimeLeft(durations[newMode]);
    setIsRunning(false);
    startTimeRef.current = null;
  }, [clearTimer, durations]);

  const handleSessionEnd = useCallback(() => {
    clearTimer();
    setIsRunning(false);

    if (mode === TIMER_MODES.focus) {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);

      if (onSessionComplete) {
        onSessionComplete(durations.focus);
      }

      // Play notification sound
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        oscillator.stop(audioCtx.currentTime + 0.5);
      } catch {
        // Audio not available
      }

      // Auto-switch to break
      const nextMode = newCount % POMODOROS_BEFORE_LONG_BREAK === 0
        ? TIMER_MODES.longBreak
        : TIMER_MODES.shortBreak;
      setMode(nextMode);
      setTimeLeft(durations[nextMode]);
    } else {
      // Break ended, go back to focus
      setMode(TIMER_MODES.focus);
      setTimeLeft(durations.focus);
    }
    startTimeRef.current = null;
  }, [clearTimer, mode, pomodoroCount, onSessionComplete, durations]);

  const start = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    startTimeRef.current = Date.now() - ((totalTime - timeLeft) * 1000);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSessionEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isRunning, totalTime, timeLeft, handleSessionEnd]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeLeft(durations[mode]);
    setIsRunning(false);
    startTimeRef.current = null;
  }, [clearTimer, durations, mode]);

  const skip = useCallback(() => {
    handleSessionEnd();
  }, [handleSessionEnd]);

  // Expose a way to update durations from outside
  const updateDurations = useCallback(() => {
    if (!isRunning) {
      setTimeLeft(durations[mode]);
    }
  }, [isRunning, durations, mode]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  // Update document title
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const modeLabel = mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Break' : 'Long Break';
    document.title = isRunning
      ? `${timeStr} - ${modeLabel} | FocusForge`
      : 'FocusForge - Pomodoro Timer';
  }, [timeLeft, mode, isRunning]);

  return {
    mode,
    timeLeft,
    isRunning,
    progress,
    pomodoroCount,
    totalTime,
    start,
    pause,
    reset,
    skip,
    switchMode,
    updateDurations,
    TIMER_MODES,
  };
}

export { TIMER_MODES, DEFAULT_DURATIONS };
