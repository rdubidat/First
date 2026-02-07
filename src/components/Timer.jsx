const MODE_COLORS = {
  focus: { ring: '#ef4444', bg: 'from-red-500 to-orange-500', text: 'text-red-500', label: 'Focus Time' },
  shortBreak: { ring: '#22c55e', bg: 'from-green-500 to-emerald-500', text: 'text-green-500', label: 'Short Break' },
  longBreak: { ring: '#3b82f6', bg: 'from-blue-500 to-indigo-500', text: 'text-blue-500', label: 'Long Break' },
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Timer({
  mode,
  timeLeft,
  isRunning,
  progress,
  pomodoroCount,
  onStart,
  onPause,
  onReset,
  onSkip,
  onSwitchMode,
  TIMER_MODES,
}) {
  const colors = MODE_COLORS[mode];
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center">
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-8">
        {Object.entries(TIMER_MODES).map(([key, value]) => (
          <button
            key={key}
            onClick={() => onSwitchMode(value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              mode === value
                ? `bg-gradient-to-r ${MODE_COLORS[value].bg} text-white shadow-lg`
                : 'bg-white text-gray-500 hover:text-gray-700 shadow-sm'
            }`}
          >
            {MODE_COLORS[value].label}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div className="relative w-72 h-72 mb-8">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
          {/* Background circle */}
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke={colors.ring}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-6xl font-mono font-bold ${colors.text}`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm text-gray-400 mt-2 uppercase tracking-wider">
            {colors.label}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onReset}
          className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow-md transition-all"
          title="Reset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={isRunning ? onPause : onStart}
          className={`w-20 h-20 rounded-full bg-gradient-to-r ${colors.bg} text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all transform hover:scale-105 active:scale-95`}
        >
          {isRunning ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={onSkip}
          className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow-md transition-all"
          title="Skip"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Pomodoro Counter */}
      <div className="flex items-center gap-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all ${
              i < (pomodoroCount % 4)
                ? `bg-gradient-to-r ${colors.bg}`
                : 'bg-gray-200'
            }`}
          />
        ))}
        <span className="text-sm text-gray-400 ml-2">
          {pomodoroCount} session{pomodoroCount !== 1 ? 's' : ''} completed
        </span>
      </div>
    </div>
  );
}
