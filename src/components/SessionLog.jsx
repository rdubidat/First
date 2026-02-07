function formatDuration(seconds) {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function SessionLog({ sessions, onRemove }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="font-medium text-gray-700 mb-1">No sessions yet today</h3>
        <p className="text-sm text-gray-400">
          Start your first Pomodoro to begin tracking your deep work.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Today's Sessions</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group"
          >
            <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 truncate">
                {session.task}
              </div>
              <div className="text-xs text-gray-400">
                {formatTime(session.completedAt)} &middot; {formatDuration(session.duration)}
              </div>
            </div>
            <button
              onClick={() => onRemove(session.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
              title="Remove"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
