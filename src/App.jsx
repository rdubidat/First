import { useState } from 'react';
import { useHabits } from './hooks/useHabits';
import Header from './components/Header';
import HabitList from './components/HabitList';
import AddHabitForm from './components/AddHabitForm';
import WeeklyChart from './components/WeeklyChart';

function App() {
  const {
    todayTasks,
    completionHistory,
    isLoading,
    toggleTask,
    addHabit,
    removeHabit,
    resetToDefaults,
    stats
  } = useHabits();

  const [activeTab, setActiveTab] = useState('today');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <Header stats={stats} />

      <div className="max-w-2xl mx-auto px-4 -mt-4">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-1 flex mb-6">
          <button
            onClick={() => setActiveTab('today')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'today'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Today's Tasks
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'progress'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Progress
          </button>
        </div>

        {activeTab === 'today' ? (
          <div className="space-y-6">
            <HabitList
              tasks={todayTasks}
              onToggle={toggleTask}
              onRemove={removeHabit}
            />
            <AddHabitForm onAdd={addHabit} onReset={resetToDefaults} />
          </div>
        ) : (
          <div className="space-y-6">
            <WeeklyChart completionHistory={completionHistory} />

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="text-3xl font-bold text-indigo-600">{stats.currentStreak}</div>
                <div className="text-sm text-gray-500">Current Streak</div>
                <div className="text-xs text-gray-400 mt-1">days in a row</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <div className="text-3xl font-bold text-purple-600">{stats.longestStreak}</div>
                <div className="text-sm text-gray-500">Best Streak</div>
                <div className="text-xs text-gray-400 mt-1">personal record</div>
              </div>
            </div>

            {/* Motivation Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-2">Keep Going!</h3>
              <p className="text-sm text-indigo-100">
                {stats.currentStreak === 0
                  ? "Start your streak today! Complete all your marketing tasks to begin building momentum."
                  : stats.currentStreak < 7
                  ? `You're ${7 - stats.currentStreak} days away from your first week streak!`
                  : stats.currentStreak < 30
                  ? `Amazing! You're ${30 - stats.currentStreak} days away from a month-long streak!`
                  : "Incredible dedication! You've built a strong marketing habit. Keep it up!"}
              </p>
            </div>

            {/* Tips Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-3">Marketing Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500">•</span>
                  <span>Batch your content creation to save time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500">•</span>
                  <span>Engage authentically - quality over quantity</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500">•</span>
                  <span>Schedule your marketing time like a client meeting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500">•</span>
                  <span>Repurpose content across different platforms</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-4 mt-8 text-center text-sm text-gray-400">
        Marketing Habit Tracker for Business Coaches
      </div>
    </div>
  );
}

export default App;
