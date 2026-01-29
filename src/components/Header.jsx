import { formatDate, getTodayKey } from '../utils/helpers';

const Header = ({ stats }) => {
  const today = formatDate(getTodayKey());

  return (
    <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-6 rounded-b-3xl shadow-lg">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">Marketing Habit Tracker</h1>
        <p className="text-indigo-200 text-sm mb-6">{today}</p>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{stats.currentStreak}</div>
            <div className="text-xs text-indigo-200 uppercase tracking-wide">Day Streak</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{stats.todayProgress}%</div>
            <div className="text-xs text-indigo-200 uppercase tracking-wide">Today</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold">{stats.longestStreak}</div>
            <div className="text-xs text-indigo-200 uppercase tracking-wide">Best Streak</div>
          </div>
        </div>

        {stats.isDayComplete && (
          <div className="mt-4 bg-green-500/30 backdrop-blur-sm rounded-xl p-3 text-center">
            <span className="text-lg">All tasks complete! Great job today!</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
