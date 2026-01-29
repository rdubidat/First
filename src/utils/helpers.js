// Get today's date as a string key (YYYY-MM-DD)
export const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

// Get formatted date for display
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Calculate streak from completion history
export const calculateStreak = (completionHistory) => {
  if (!completionHistory || Object.keys(completionHistory).length === 0) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  // Check if today is complete, if not, start from yesterday
  const todayKey = getTodayKey();
  if (!completionHistory[todayKey]?.completed) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Count consecutive days
  while (true) {
    const dateKey = currentDate.toISOString().split('T')[0];
    if (completionHistory[dateKey]?.completed) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Calculate longest streak ever
export const calculateLongestStreak = (completionHistory) => {
  if (!completionHistory || Object.keys(completionHistory).length === 0) {
    return 0;
  }

  const dates = Object.keys(completionHistory).sort();
  let longestStreak = 0;
  let currentStreak = 0;

  for (let i = 0; i < dates.length; i++) {
    if (completionHistory[dates[i]]?.completed) {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }

    // Check for gap between dates
    if (i < dates.length - 1) {
      const current = new Date(dates[i]);
      const next = new Date(dates[i + 1]);
      const diffDays = (next - current) / (1000 * 60 * 60 * 24);
      if (diffDays > 1) {
        currentStreak = 0;
      }
    }
  }

  return longestStreak;
};

// Calculate completion rate for last N days
export const calculateCompletionRate = (completionHistory, days = 30) => {
  const today = new Date();
  let completedDays = 0;
  let totalDays = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    if (completionHistory[dateKey]) {
      totalDays++;
      if (completionHistory[dateKey].completed) {
        completedDays++;
      }
    }
  }

  return totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
};

// Get weekly data for chart
export const getWeeklyData = (completionHistory) => {
  const today = new Date();
  const weekData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

    const dayData = completionHistory[dateKey];
    const completedTasks = dayData?.tasks?.filter(t => t.completed).length || 0;
    const totalTasks = dayData?.tasks?.length || 0;

    weekData.push({
      day: dayName,
      date: dateKey,
      completed: completedTasks,
      total: totalTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    });
  }

  return weekData;
};
