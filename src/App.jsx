import { useState, useCallback } from 'react';
import { useTimer } from './hooks/useTimer';
import { useTaskLog, useSettings } from './hooks/useTaskLog';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import Timer from './components/Timer';
import TaskInput from './components/TaskInput';
import SessionLog from './components/SessionLog';
import Stats from './components/Stats';
import Settings from './components/Settings';

function App() {
  const [currentTask, setCurrentTask] = useState('');
  const [activeTab, setActiveTab] = useState('timer');
  const [showSettings, setShowSettings] = useState(false);

  const { settings, updateSettings } = useSettings();
  const { todaySessions, isLoading, addSession, removeSession, stats } = useTaskLog();
  const { canInstall, install } = useInstallPrompt();

  const durations = {
    focus: settings.focus * 60,
    shortBreak: settings.shortBreak * 60,
    longBreak: settings.longBreak * 60,
  };

  const handleSessionComplete = useCallback((durationSeconds) => {
    addSession(currentTask || 'Focus Session', durationSeconds);
  }, [addSession, currentTask]);

  const {
    mode,
    timeLeft,
    isRunning,
    progress,
    pomodoroCount,
    start,
    pause,
    reset,
    skip,
    switchMode,
    updateDurations,
    TIMER_MODES,
  } = useTimer({ onSessionComplete: handleSessionComplete, durations });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const goalProgress = stats.todaySessionCount / settings.dailyGoal;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
              F
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">FocusForge</h1>
              <p className="text-xs text-gray-400">Pomodoro for Entrepreneurs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Daily Goal Progress */}
            <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1.5">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(goalProgress * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {stats.todaySessionCount}/{settings.dailyGoal}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all"
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-1 flex mb-6">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'timer'
                ? 'bg-red-50 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Timer
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'sessions'
                ? 'bg-red-50 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sessions
            {stats.todaySessionCount > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                {stats.todaySessionCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'stats'
                ? 'bg-red-50 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Stats
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'timer' && (
          <div className="space-y-6 flex flex-col items-center">
            <Timer
              mode={mode}
              timeLeft={timeLeft}
              isRunning={isRunning}
              progress={progress}
              pomodoroCount={pomodoroCount}
              onStart={start}
              onPause={pause}
              onReset={reset}
              onSkip={skip}
              onSwitchMode={switchMode}
              TIMER_MODES={TIMER_MODES}
            />
            <TaskInput
              currentTask={currentTask}
              onTaskChange={setCurrentTask}
            />
          </div>
        )}

        {activeTab === 'sessions' && (
          <SessionLog
            sessions={todaySessions}
            onRemove={removeSession}
          />
        )}

        {activeTab === 'stats' && (
          <Stats stats={stats} />
        )}
      </div>

      {/* Install Banner */}
      {canInstall && (
        <div className="max-w-2xl mx-auto px-4 mt-6">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 flex items-center justify-between text-white shadow-lg">
            <div>
              <div className="font-semibold text-sm">Install FocusForge</div>
              <div className="text-xs text-red-100">Add to your home screen for quick access</div>
            </div>
            <button
              onClick={install}
              className="px-4 py-2 bg-white text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-2xl mx-auto px-4 mt-8 text-center text-xs text-gray-300">
        FocusForge - Built for entrepreneurs who ship.
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          settings={settings}
          onSave={(newSettings) => { updateSettings(newSettings); updateDurations(); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
