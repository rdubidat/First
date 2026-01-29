import { useState, useEffect, useCallback } from 'react';
import { getTodayKey, calculateStreak, calculateLongestStreak } from '../utils/helpers';

const DEFAULT_HABITS = [
  { id: 1, name: 'Post on LinkedIn', icon: '📝', category: 'content' },
  { id: 2, name: 'Engage with 5 posts', icon: '💬', category: 'engagement' },
  { id: 3, name: 'Send 1 outreach message', icon: '📧', category: 'outreach' },
  { id: 4, name: 'Share a story/insight', icon: '💡', category: 'content' },
  { id: 5, name: 'Comment on industry news', icon: '📰', category: 'engagement' },
  { id: 6, name: 'Follow up with a lead', icon: '🎯', category: 'outreach' },
];

const STORAGE_KEYS = {
  HABITS: 'coach-habits',
  HISTORY: 'coach-history',
};

export const useHabits = () => {
  const [habits, setHabits] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [completionHistory, setCompletionHistory] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);

    const loadedHabits = savedHabits ? JSON.parse(savedHabits) : DEFAULT_HABITS;
    const loadedHistory = savedHistory ? JSON.parse(savedHistory) : {};

    setHabits(loadedHabits);
    setCompletionHistory(loadedHistory);

    // Initialize today's tasks
    const todayKey = getTodayKey();
    if (loadedHistory[todayKey]?.tasks) {
      setTodayTasks(loadedHistory[todayKey].tasks);
    } else {
      // Create fresh tasks for today based on habits
      const freshTasks = loadedHabits.map(habit => ({
        ...habit,
        completed: false,
        completedAt: null
      }));
      setTodayTasks(freshTasks);
    }

    setIsLoading(false);
  }, []);

  // Save habits to localStorage when they change
  useEffect(() => {
    if (!isLoading && habits.length > 0) {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
    }
  }, [habits, isLoading]);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(completionHistory));
    }
  }, [completionHistory, isLoading]);

  // Toggle a task's completion status
  const toggleTask = useCallback((taskId) => {
    setTodayTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date().toISOString() : null
            }
          : task
      );

      // Update history
      const todayKey = getTodayKey();
      const allCompleted = updatedTasks.every(task => task.completed);

      setCompletionHistory(prev => ({
        ...prev,
        [todayKey]: {
          tasks: updatedTasks,
          completed: allCompleted,
          completedAt: allCompleted ? new Date().toISOString() : null
        }
      }));

      return updatedTasks;
    });
  }, []);

  // Add a new habit
  const addHabit = useCallback((name, icon = '✅', category = 'custom') => {
    const newHabit = {
      id: Date.now(),
      name,
      icon,
      category
    };

    setHabits(prev => [...prev, newHabit]);

    // Add to today's tasks
    setTodayTasks(prev => [...prev, { ...newHabit, completed: false, completedAt: null }]);

    // Update today's history
    const todayKey = getTodayKey();
    setCompletionHistory(prev => ({
      ...prev,
      [todayKey]: {
        ...prev[todayKey],
        tasks: [...(prev[todayKey]?.tasks || []), { ...newHabit, completed: false, completedAt: null }],
        completed: false
      }
    }));
  }, []);

  // Remove a habit
  const removeHabit = useCallback((habitId) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setTodayTasks(prev => prev.filter(t => t.id !== habitId));

    // Update today's history
    const todayKey = getTodayKey();
    setCompletionHistory(prev => {
      const todayData = prev[todayKey];
      if (!todayData) return prev;

      const updatedTasks = todayData.tasks.filter(t => t.id !== habitId);
      const allCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);

      return {
        ...prev,
        [todayKey]: {
          ...todayData,
          tasks: updatedTasks,
          completed: allCompleted
        }
      };
    });
  }, []);

  // Reset habits to defaults
  const resetToDefaults = useCallback(() => {
    setHabits(DEFAULT_HABITS);
    const freshTasks = DEFAULT_HABITS.map(habit => ({
      ...habit,
      completed: false,
      completedAt: null
    }));
    setTodayTasks(freshTasks);

    const todayKey = getTodayKey();
    setCompletionHistory(prev => ({
      ...prev,
      [todayKey]: {
        tasks: freshTasks,
        completed: false,
        completedAt: null
      }
    }));
  }, []);

  // Calculate stats
  const completedCount = todayTasks.filter(t => t.completed).length;
  const totalCount = todayTasks.length;
  const todayProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const currentStreak = calculateStreak(completionHistory);
  const longestStreak = calculateLongestStreak(completionHistory);
  const isDayComplete = completedCount === totalCount && totalCount > 0;

  return {
    habits,
    todayTasks,
    completionHistory,
    isLoading,
    toggleTask,
    addHabit,
    removeHabit,
    resetToDefaults,
    stats: {
      completedCount,
      totalCount,
      todayProgress,
      currentStreak,
      longestStreak,
      isDayComplete
    }
  };
};
