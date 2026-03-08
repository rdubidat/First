import { useState } from 'react';

const WeeklySchedule = ({
  weekDates,
  weekLabel,
  weekOffset,
  currentSchedule,
  weekStats,
  totalPlanned,
  navigateWeek,
  toggleTaskForDay,
  updateTaskNote,
  addCustomTask,
  removeCustomTask,
  copyDayToAll,
}) => {
  const [selectedDay, setSelectedDay] = useState(
    weekDates.find(d => d.isToday)?.date || weekDates[0].date
  );
  const [newTaskName, setNewTaskName] = useState('');
  const [editingNote, setEditingNote] = useState(null);

  const daySchedule = currentSchedule[selectedDay];
  const selectedDayInfo = weekDates.find(d => d.date === selectedDay);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskName.trim()) {
      addCustomTask(selectedDay, newTaskName.trim());
      setNewTaskName('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <h3 className="font-semibold text-gray-800">{weekLabel}</h3>
            <p className="text-xs text-gray-500">
              {weekOffset === 0 ? 'This Week' : weekOffset === 1 ? 'Next Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} weeks ${weekOffset > 0 ? 'ahead' : 'ago'}`}
            </p>
          </div>
          <button
            onClick={() => navigateWeek(1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="text-center text-sm text-indigo-600 font-medium">
          {totalPlanned} tasks planned this week
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {weekStats.map(day => (
          <button
            key={day.date}
            onClick={() => setSelectedDay(day.date)}
            className={`flex-1 min-w-0 py-2 px-1 rounded-xl text-center transition-all ${
              selectedDay === day.date
                ? 'bg-indigo-600 text-white shadow-md'
                : day.isToday
                ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-300'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <div className="text-xs font-medium">{day.shortName}</div>
            <div className={`text-lg font-bold ${selectedDay === day.date ? 'text-white' : 'text-gray-800'}`}>
              {new Date(day.date).getDate()}
            </div>
            <div className={`text-xs ${selectedDay === day.date ? 'text-indigo-200' : 'text-gray-400'}`}>
              {day.plannedCount} tasks
            </div>
          </button>
        ))}
      </div>

      {/* Day Detail */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">{selectedDayInfo?.name}</h3>
            <p className="text-xs text-gray-500">
              {new Date(selectedDay).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => copyDayToAll(selectedDay)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            title="Copy this day's plan to all other days"
          >
            Copy to all days
          </button>
        </div>

        {/* Task List */}
        <div className="divide-y divide-gray-50">
          {daySchedule?.tasks?.map(task => (
            <div key={task.id} className="p-3 px-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleTaskForDay(selectedDay, task.id)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors flex-shrink-0 ${
                    task.planned
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-transparent hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <span className="text-lg flex-shrink-0">{task.icon}</span>
                <span className={`flex-1 text-sm ${task.planned ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                  {task.name}
                </span>
                {task.category === 'custom' && (
                  <button
                    onClick={() => removeCustomTask(selectedDay, task.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Note */}
              {task.planned && (
                <div className="ml-14 mt-1">
                  {editingNote === `${selectedDay}-${task.id}` ? (
                    <input
                      type="text"
                      value={task.note || ''}
                      onChange={(e) => updateTaskNote(selectedDay, task.id, e.target.value)}
                      onBlur={() => setEditingNote(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingNote(null)}
                      placeholder="Add a note..."
                      className="w-full text-xs px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => setEditingNote(`${selectedDay}-${task.id}`)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {task.note || '+ Add note'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Custom Task */}
        <form onSubmit={handleAddTask} className="p-3 px-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Add a one-off task for this day..."
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={!newTaskName.trim()}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </form>
      </div>

      {/* Week Overview Summary */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-5 text-white">
        <h3 className="font-semibold mb-3">Week at a Glance</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {weekStats.map(day => {
            const intensity = day.plannedCount === 0 ? 'bg-white/10' :
                             day.plannedCount <= 2 ? 'bg-white/25' :
                             day.plannedCount <= 4 ? 'bg-white/40' : 'bg-white/60';
            return (
              <div key={day.date} className="text-center">
                <div className={`${intensity} rounded-lg p-2 mb-1`}>
                  <div className="text-sm font-bold">{day.plannedCount}</div>
                </div>
                <div className="text-xs text-indigo-200">{day.shortName}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
