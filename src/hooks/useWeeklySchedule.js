import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'coach-weekly-schedule';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Get the Monday of the current week
const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekKey = (date = new Date()) => {
  return getWeekStart(date).toISOString().split('T')[0];
};

const getWeekDates = (weekStart) => {
  return DAY_NAMES.map((name, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return {
      name,
      shortName: name.slice(0, 3),
      date: date.toISOString().split('T')[0],
      isToday: date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0],
    };
  });
};

const createEmptyWeek = (weekStart, habits) => {
  const dates = getWeekDates(weekStart);
  const schedule = {};
  dates.forEach(day => {
    schedule[day.date] = {
      dayName: day.name,
      tasks: habits.map(habit => ({
        ...habit,
        planned: true,
        note: '',
      })),
    };
  });
  return schedule;
};

export const useWeeklySchedule = (habits) => {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, etc.
  const [schedules, setSchedules] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSchedules(JSON.parse(saved));
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    }
  }, [schedules, isLoading]);

  // Calculate the current viewed week
  const viewedWeekStart = getWeekStart();
  viewedWeekStart.setDate(viewedWeekStart.getDate() + weekOffset * 7);
  const weekKey = getWeekKey(viewedWeekStart);
  const weekDates = getWeekDates(viewedWeekStart);

  // Get or create the schedule for the viewed week
  const currentSchedule = schedules[weekKey] || createEmptyWeek(viewedWeekStart, habits);

  const navigateWeek = useCallback((direction) => {
    setWeekOffset(prev => prev + direction);
  }, []);

  const toggleTaskForDay = useCallback((dateKey, taskId) => {
    setSchedules(prev => {
      const weekSchedule = prev[weekKey] || createEmptyWeek(viewedWeekStart, habits);
      const daySchedule = weekSchedule[dateKey];
      if (!daySchedule) return prev;

      return {
        ...prev,
        [weekKey]: {
          ...weekSchedule,
          [dateKey]: {
            ...daySchedule,
            tasks: daySchedule.tasks.map(task =>
              task.id === taskId ? { ...task, planned: !task.planned } : task
            ),
          },
        },
      };
    });
  }, [weekKey, viewedWeekStart, habits]);

  const updateTaskNote = useCallback((dateKey, taskId, note) => {
    setSchedules(prev => {
      const weekSchedule = prev[weekKey] || createEmptyWeek(viewedWeekStart, habits);
      const daySchedule = weekSchedule[dateKey];
      if (!daySchedule) return prev;

      return {
        ...prev,
        [weekKey]: {
          ...weekSchedule,
          [dateKey]: {
            ...daySchedule,
            tasks: daySchedule.tasks.map(task =>
              task.id === taskId ? { ...task, note } : task
            ),
          },
        },
      };
    });
  }, [weekKey, viewedWeekStart, habits]);

  const addCustomTask = useCallback((dateKey, name) => {
    setSchedules(prev => {
      const weekSchedule = prev[weekKey] || createEmptyWeek(viewedWeekStart, habits);
      const daySchedule = weekSchedule[dateKey];
      if (!daySchedule) return prev;

      return {
        ...prev,
        [weekKey]: {
          ...weekSchedule,
          [dateKey]: {
            ...daySchedule,
            tasks: [
              ...daySchedule.tasks,
              { id: Date.now(), name, icon: '📌', category: 'custom', planned: true, note: '' },
            ],
          },
        },
      };
    });
  }, [weekKey, viewedWeekStart, habits]);

  const removeCustomTask = useCallback((dateKey, taskId) => {
    setSchedules(prev => {
      const weekSchedule = prev[weekKey] || createEmptyWeek(viewedWeekStart, habits);
      const daySchedule = weekSchedule[dateKey];
      if (!daySchedule) return prev;

      return {
        ...prev,
        [weekKey]: {
          ...weekSchedule,
          [dateKey]: {
            ...daySchedule,
            tasks: daySchedule.tasks.filter(task => task.id !== taskId),
          },
        },
      };
    });
  }, [weekKey, viewedWeekStart, habits]);

  const copyDayToAll = useCallback((sourceDateKey) => {
    setSchedules(prev => {
      const weekSchedule = prev[weekKey] || createEmptyWeek(viewedWeekStart, habits);
      const sourceDay = weekSchedule[sourceDateKey];
      if (!sourceDay) return prev;

      const updated = { ...weekSchedule };
      weekDates.forEach(day => {
        if (day.date !== sourceDateKey) {
          updated[day.date] = {
            ...updated[day.date],
            dayName: day.name,
            tasks: sourceDay.tasks.map(t => ({ ...t })),
          };
        }
      });

      return { ...prev, [weekKey]: updated };
    });
  }, [weekKey, viewedWeekStart, habits, weekDates]);

  // Stats for the week
  const weekStats = weekDates.map(day => {
    const daySchedule = currentSchedule[day.date];
    const plannedCount = daySchedule?.tasks?.filter(t => t.planned).length || 0;
    return { ...day, plannedCount };
  });

  const totalPlanned = weekStats.reduce((sum, day) => sum + day.plannedCount, 0);

  const weekLabel = (() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startDate = new Date(start.date);
    const endDate = new Date(end.date);
    const opts = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', opts)} - ${endDate.toLocaleDateString('en-US', opts)}`;
  })();

  return {
    weekDates,
    weekLabel,
    weekOffset,
    currentSchedule,
    weekStats,
    totalPlanned,
    isLoading,
    navigateWeek,
    toggleTaskForDay,
    updateTaskNote,
    addCustomTask,
    removeCustomTask,
    copyDayToAll,
  };
};
