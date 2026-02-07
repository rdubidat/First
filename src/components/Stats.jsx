export default function Stats({ stats }) {
  const { todayFocusMinutes, todaySessionCount, currentStreak, totalMinutes, weekData } = stats;

  const maxMinutes = Math.max(...weekData.map((d) => d.minutes), 1);

  return (
    <div className="space-y-4">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-red-500">{todayFocusMinutes}</div>
          <div className="text-xs text-gray-400">Minutes focused today</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-orange-500">{todaySessionCount}</div>
          <div className="text-xs text-gray-400">Sessions today</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-emerald-500">{currentStreak}</div>
          <div className="text-xs text-gray-400">Day streak</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-500">{Math.round(totalMinutes / 60)}</div>
          <div className="text-xs text-gray-400">Total hours focused</div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">This Week</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {weekData.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">
                {day.minutes > 0 ? `${day.minutes}m` : ''}
              </span>
              <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                <div
                  className="w-full bg-gradient-to-t from-red-500 to-orange-400 rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max((day.minutes / maxMinutes) * 100, day.minutes > 0 ? 8 : 0)}%`,
                    minHeight: day.minutes > 0 ? '4px' : '0',
                  }}
                />
              </div>
              <span className="text-xs text-gray-400">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Entrepreneur Insight */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-5 text-white">
        <h3 className="font-semibold mb-1">Founder Focus</h3>
        <p className="text-sm text-red-100">
          {todaySessionCount === 0
            ? "Top entrepreneurs protect their deep work time. Start your first session to build momentum."
            : todaySessionCount < 4
            ? `${todaySessionCount} session${todaySessionCount > 1 ? 's' : ''} down. Research shows 4 focused hours is the sweet spot for peak creative output.`
            : todaySessionCount < 8
            ? `${todayFocusMinutes} minutes of deep work today. You're in the top tier of productive founders.`
            : "Outstanding focus today. Remember to recharge - your best ideas come during rest."}
        </p>
      </div>
    </div>
  );
}
