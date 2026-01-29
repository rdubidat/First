import { getWeeklyData } from '../utils/helpers';

const WeeklyChart = ({ completionHistory }) => {
  const weekData = getWeeklyData(completionHistory);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-4">This Week</h3>

      <div className="flex items-end justify-between gap-2 h-32">
        {weekData.map((day, index) => (
          <div key={day.date} className="flex-1 flex flex-col items-center">
            <div className="flex-1 w-full flex items-end">
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  day.percentage === 100
                    ? 'bg-green-500'
                    : day.percentage > 0
                    ? 'bg-indigo-400'
                    : 'bg-gray-200'
                }`}
                style={{ height: `${Math.max(day.percentage, 8)}%` }}
              />
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-medium text-gray-500">{day.day}</div>
              {day.total > 0 && (
                <div className="text-xs text-gray-400">
                  {day.completed}/{day.total}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-indigo-400 rounded" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 rounded" />
          <span>No Data</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyChart;
