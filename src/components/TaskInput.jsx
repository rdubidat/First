import { useState } from 'react';

const QUICK_TASKS = [
  'Deep Work',
  'Email & Comms',
  'Strategy Planning',
  'Client Work',
  'Content Creation',
  'Sales & Outreach',
  'Admin & Ops',
  'Learning',
];

export default function TaskInput({ currentTask, onTaskChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">
          What are you working on?
        </label>
        <input
          type="text"
          value={currentTask}
          onChange={(e) => onTaskChange(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="e.g., Q1 revenue strategy..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all"
        />
        {isExpanded && (
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_TASKS.map((task) => (
              <button
                key={task}
                onClick={() => {
                  onTaskChange(task);
                  setIsExpanded(false);
                }}
                className={`px-3 py-1 text-xs rounded-full transition-all ${
                  currentTask === task
                    ? 'bg-red-100 text-red-600 font-medium'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {task}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
