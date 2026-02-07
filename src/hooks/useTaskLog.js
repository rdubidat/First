import { useState, useCallback } from 'react';

const STORAGE_KEY = 'focusforge_sessions';
const SETTINGS_KEY = 'focusforge_settings';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function loadSessions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useTaskLog() {
  const [sessions, setSessions] = useState(() => loadSessions());
  const isLoading = false;

  const addSession = useCallback((taskLabel, durationSeconds) => {
    const session = {
      id: Date.now().toString(),
      task: taskLabel || 'Untitled Session',
      duration: durationSeconds,
      completedAt: new Date().toISOString(),
      date: getToday(),
    };
    setSessions((prev) => {
      const updated = [session, ...prev];
      saveSessions(updated);
      return updated;
    });
  }, []);

  const removeSession = useCallback((id) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      saveSessions(updated);
      return updated;
    });
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    saveSessions([]);
  }, []);

  // Computed stats
  const todaySessions = sessions.filter((s) => s.date === getToday());
  const todayFocusMinutes = todaySessions.reduce((sum, s) => sum + s.duration / 60, 0);
  const todaySessionCount = todaySessions.length;

  // Last 7 days chart data
  const weekData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
    const daySessions = sessions.filter((s) => s.date === dateStr);
    const minutes = daySessions.reduce((sum, s) => sum + s.duration / 60, 0);
    weekData.push({ date: dateStr, day: dayLabel, minutes: Math.round(minutes), sessions: daySessions.length });
  }

  // Streak calculation
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasSessions = sessions.some((s) => s.date === dateStr);
    if (hasSessions) {
      currentStreak++;
    } else if (i === 0) {
      // Today hasn't had a session yet, don't break the streak
      continue;
    } else {
      break;
    }
  }

  // Total stats
  const totalSessions = sessions.length;
  const totalMinutes = Math.round(sessions.reduce((sum, s) => sum + s.duration / 60, 0));

  return {
    sessions,
    todaySessions,
    isLoading,
    addSession,
    removeSession,
    clearAllSessions,
    stats: {
      todayFocusMinutes: Math.round(todayFocusMinutes),
      todaySessionCount,
      currentStreak,
      totalSessions,
      totalMinutes,
      weekData,
    },
  };
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : { focus: 25, shortBreak: 5, longBreak: 15, dailyGoal: 8 };
    } catch {
      return { focus: 25, shortBreak: 5, longBreak: 15, dailyGoal: 8 };
    }
  });

  const updateSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  }, []);

  return { settings, updateSettings };
}
